import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { Readable } from 'node:stream';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { createRmtNodeSsrAdapter } from '../../../../xtendrmt/rmt-node-ssr-adapter.js';
import { PRODUCT_TITLE } from './constants.mjs';
import { safeCachePath } from './model-cache.mjs';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const repoRoot = path.resolve(productRoot, '..', '..');
const buildRoot = path.join(productRoot, 'site', 'build');
const transformersDistRoot = path.join(productRoot, 'node_modules', '@huggingface', 'transformers', 'dist');
const onnxRuntimeWebDistRoot = path.join(productRoot, 'node_modules', 'onnxruntime-web', 'dist');
const SSR_SHELL_SURFACES = Object.freeze([
  'conversation-panel',
  'conversation-search',
  'conversation-list',
  'model-status',
  'active-conversation',
  'chat-transcript',
  'prompt-input',
  'tool-menu'
]);
const WORKER_PREWARM_TARGETS = Object.freeze([
  'settings-dialog',
  'delete-conversation-dialog',
  'code-bridge',
  'retry-generation',
  'generation-spinner',
  'runtime-error',
  'runtime-diagnostics'
]);

const CONTENT_TYPES = Object.freeze({
  '.html': 'text/html; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.onnx': 'application/octet-stream',
  '.data': 'application/octet-stream'
});

const SECURITY_HEADERS = Object.freeze({
  'cross-origin-opener-policy': 'same-origin',
  'cross-origin-embedder-policy': 'require-corp',
  'cross-origin-resource-policy': 'same-origin'
});

function contentType(filePath) {
  return CONTENT_TYPES[path.extname(filePath)] || 'application/octet-stream';
}

function withSecurityHeaders(headers = {}) {
  return {
    ...SECURITY_HEADERS,
    ...headers
  };
}

function send(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, withSecurityHeaders(headers));
  res.end(body);
}

function sendJson(res, statusCode, body) {
  send(res, statusCode, `${JSON.stringify(body)}\n`, {
    'content-type': 'application/json; charset=utf-8'
  });
}

function sendFile(res, filePath) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    send(res, 404, 'Not found', { 'content-type': 'text/plain; charset=utf-8' });
    return;
  }
  res.writeHead(200, {
    ...SECURITY_HEADERS,
    'content-type': contentType(filePath),
    'cache-control': filePath.includes(`${path.sep}build${path.sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache'
  });
  fs.createReadStream(filePath).pipe(res);
}

function escapeScriptJson(value) {
  return JSON.stringify(value).replace(/[<>&]/gu, (character) => {
    switch (character) {
      case '<': return '\\u003c';
      case '>': return '\\u003e';
      case '&': return '\\u0026';
      default: return character;
    }
  });
}

function shellTile(id, label, role = 'region') {
  return {
    type: 'element',
    tag: 'section',
    attributes: {
      id: `ssr-${id}`,
      class: `xtend-llm-ssr-tile xtend-llm-ssr-${id}`,
      role,
      'aria-label': label,
      'data-rmt-ssr-surface': id,
      'data-rmt-hydration-mode': 'server_prerender_hydrate'
    },
    children: [
      {
        type: 'element',
        tag: 'span',
        attributes: {
          class: 'xtend-llm-ssr-label'
        },
        children: [{ type: 'text', text: label }]
      }
    ]
  };
}

function createSsrShellDescriptor() {
  return {
    type: 'element',
    tag: 'main',
    key: 'xtend-llm-host',
    attributes: {
      id: 'xtend-llm-host',
      'data-xtend-llm-host': 'true',
      'data-rmt-node-ssr': 'true',
      'data-rmt-hydration-mode': 'server_prerender_hydrate'
    },
    children: [
      {
        type: 'element',
        tag: 'div',
        key: 'xtend-maraca-root',
        attributes: {
          id: 'xtend-maraca-root',
          'data-maraca-root': 'true',
          'data-rmt-ssr-root': 'xtend-llm-shell',
          'data-rmt-hydration-mode': 'server_prerender_hydrate',
          'data-rmt-worker-prewarm-targets': WORKER_PREWARM_TARGETS.join(',')
        },
        children: [
          {
            type: 'element',
            tag: 'section',
            attributes: {
              class: 'xtend-llm-ssr-shell',
              'data-maraca-ssr-shell': 'xtend-llm',
              'data-rmt-hydration-mode': 'server_prerender_hydrate',
              'data-rmt-prerender-transport': 'node-ssr',
              'data-rmt-worker-prewarm-targets': WORKER_PREWARM_TARGETS.join(',')
            },
            children: [
              shellTile('conversation-panel', 'Conversations', 'navigation'),
              shellTile('model-status', 'Model ready'),
              shellTile('active-conversation', 'Current conversation'),
              shellTile('chat-transcript', 'Transcript'),
              shellTile('prompt-input', 'Prompt'),
              shellTile('tool-menu', 'Tools')
            ]
          }
        ]
      }
    ]
  };
}

function safeStaticPath(root, requestPath) {
  const clean = decodeURIComponent(requestPath).replace(/^\/+/u, '');
  const resolved = path.resolve(root, clean);
  const normalizedRoot = path.resolve(root);
  if (!resolved.startsWith(normalizedRoot)) throw new Error('Static path escaped root.');
  return resolved;
}

function sendTransformersVendorFile(res, requestPath) {
  const filePath = safeStaticPath(transformersDistRoot, requestPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    sendFile(res, filePath);
    return;
  }
  const fallbackName = path.basename(filePath);
  if (!/^ort[-.].+\.(mjs|wasm)$/u.test(fallbackName)) {
    send(res, 404, 'Not found', { 'content-type': 'text/plain; charset=utf-8' });
    return;
  }
  sendFile(res, safeStaticPath(onnxRuntimeWebDistRoot, fallbackName));
}

function notifyModelAssetProgress(options, event) {
  if (typeof options.onModelAssetProgress === 'function') {
    options.onModelAssetProgress({
      schema: 'xtend-llm.model-asset-progress.v1',
      at: new Date().toISOString(),
      ...event
    });
  }
}

function createProgressTransform(options, eventBase, total) {
  let loaded = 0;
  let lastAt = 0;
  let lastPercent = -1;
  return new Transform({
    transform(chunk, _encoding, callback) {
      loaded += chunk.length;
      const now = Date.now();
      const percent = total > 0 ? Math.floor(loaded / total * 100) : 0;
      if (now - lastAt > 1500 || percent >= lastPercent + 5 || loaded === total) {
        lastAt = now;
        lastPercent = percent;
        notifyModelAssetProgress(options, {
          ...eventBase,
          phase: 'download-progress',
          loaded,
          total,
          progress: total > 0 ? loaded / total : 0
        });
      }
      callback(null, chunk);
    }
  });
}

async function renderShellHtml(options = {}) {
  const adapter = createRmtNodeSsrAdapter({ disableAutoCompiler: true });
  const result = await adapter.render({
    descriptor: createSsrShellDescriptor()
  }, {
    requestId: 'xtend-llm-shell',
    rootId: 'xtend-maraca-root',
    templateId: 'xtend-llm-shell',
    namespace: 'xtend.llm',
    model: {
      shellSurfaces: SSR_SHELL_SURFACES,
      workerPrewarmTargets: WORKER_PREWARM_TARGETS
    }
  });
  const shell = result.ok ? result.html : '<main id="xtend-llm-host" data-xtend-llm-host data-rmt-hydration-mode="server_prerender_hydrate"><div id="xtend-maraca-root" data-maraca-root data-rmt-ssr-root="xtend-llm-shell" data-rmt-hydration-mode="server_prerender_hydrate"></div></main>';
  const hydrationPayload = {
    schema: 'xtend-llm.ssr-shell.v1',
    ok: result.ok,
    status: result.status,
    adapterSchema: result.adapterSchema,
    executionMode: 'server_prerender_hydrate',
    transport: 'node-ssr',
    shellSurfaces: SSR_SHELL_SURFACES,
    workerPrewarmTargets: WORKER_PREWARM_TARGETS,
    hydration: result.hydration || null,
    response: result.response ? {
      kind: result.response.kind,
      executionMode: result.response.executionMode,
      adapterKind: result.response.adapterKind,
      supportStatus: result.response.supportStatus,
      rootId: result.response.rootId
    } : null,
    diagnosticCount: Array.isArray(result.diagnostics) ? result.diagnostics.length : 0
  };
  const devFlag = options.dev ? '<meta name="xtend-llm-dev" content="true">' : '';
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://huggingface.co https://cdn-lfs.huggingface.co https://cdn-lfs-us-1.hf.co; worker-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self';">
    ${devFlag}
    <title>${PRODUCT_TITLE}</title>
    <link rel="stylesheet" href="/src/styles/xtend-llm.css">
    <link rel="stylesheet" href="/build/xtend.maraca.css">
  </head>
  <body>
    ${shell}
    <template id="xtend-llm-ssr-hydration" data-rmt-ssr-hydration>${escapeScriptJson(hydrationPayload)}</template>
    <script type="module" src="/src/renderer/app-controller.mjs"></script>
  </body>
</html>`;
}

function renderLlmHarnessHtml() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self' https://huggingface.co https://cdn-lfs.huggingface.co https://cdn-lfs-us-1.hf.co; worker-src 'self'; object-src 'none'; base-uri 'self';">
    <title>XTend LLM Terminal Harness</title>
  </head>
  <body>
    <main id="xtend-llm-terminal-harness"></main>
    <script type="module" src="/tests/llm-terminal-harness.mjs"></script>
  </body>
</html>`;
}

async function proxyHuggingFaceModel(req, res, cacheRoot, url, options = {}) {
  const rest = decodeURIComponent(url.pathname.replace(/^\/hf\//u, ''));
  if (!rest || rest.includes('..')) {
    sendJson(res, 400, { ok: false, error: 'Invalid Hugging Face asset path.' });
    return;
  }
  const cachePath = safeCachePath(cacheRoot, rest);
  if (fs.existsSync(cachePath)) {
    notifyModelAssetProgress(options, {
      phase: 'cache-hit',
      asset: rest,
      loaded: fs.statSync(cachePath).size,
      total: fs.statSync(cachePath).size,
      progress: 1
    });
    sendFile(res, cachePath);
    return;
  }
  const targetUrl = `https://huggingface.co/${rest}${url.search || ''}`;
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  const tmpPath = `${cachePath}.tmp-${process.pid}`;
  const eventBase = {
    asset: rest,
    targetUrl
  };
  try {
    notifyModelAssetProgress(options, {
      ...eventBase,
      phase: 'download-start',
      loaded: 0,
      total: 0,
      progress: 0
    });
    const response = await fetch(targetUrl);
    if (!response.ok || !response.body) {
      notifyModelAssetProgress(options, {
        ...eventBase,
        phase: 'download-error',
        status: `${response.status} ${response.statusText}`
      });
      sendJson(res, response.status || 502, {
        ok: false,
        error: `Unable to fetch model asset: ${response.status} ${response.statusText}`,
        targetUrl
      });
      return;
    }
    const total = Number.parseInt(response.headers.get('content-length') || '0', 10) || 0;
    await pipeline(
      Readable.fromWeb(response.body),
      createProgressTransform(options, eventBase, total),
      fs.createWriteStream(tmpPath)
    );
    fs.renameSync(tmpPath, cachePath);
    notifyModelAssetProgress(options, {
      ...eventBase,
      phase: 'download-complete',
      loaded: fs.statSync(cachePath).size,
      total,
      progress: 1
    });
    sendFile(res, cachePath);
  } catch (error) {
    if (fs.existsSync(tmpPath)) fs.rmSync(tmpPath, { force: true });
    notifyModelAssetProgress(options, {
      ...eventBase,
      phase: 'download-error',
      status: error && error.message ? error.message : String(error)
    });
    sendJson(res, 502, {
      ok: false,
      error: error && error.message ? error.message : String(error),
      targetUrl
    });
  }
}

async function proxyHuggingFaceApi(res, url) {
  const rest = decodeURIComponent(url.pathname.replace(/^\/hf-api\//u, ''));
  if (!rest || rest.includes('..')) {
    sendJson(res, 400, { ok: false, error: 'Invalid Hugging Face API path.' });
    return;
  }
  const targetUrl = `https://huggingface.co/api/${rest}${url.search || ''}`;
  try {
    const response = await fetch(targetUrl, {
      headers: {
        accept: 'application/json'
      }
    });
    const body = await response.text();
    send(res, response.status || 502, body, {
      'content-type': response.headers.get('content-type') || 'application/json; charset=utf-8',
      'cache-control': 'no-cache'
    });
  } catch (error) {
    sendJson(res, 502, {
      ok: false,
      error: error && error.message ? error.message : String(error),
      targetUrl
    });
  }
}

export function createXtendLlmAppServer(options = {}) {
  const cacheRoot = options.cacheRoot || path.join(options.userData || productRoot, 'model-cache');
  const dev = options.dev === true;
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', 'http://127.0.0.1');
      if (url.pathname === '/') {
        const html = await renderShellHtml({ dev });
        send(res, 200, html, { 'content-type': 'text/html; charset=utf-8' });
        return;
      }
      if (url.pathname === '/llm-harness') {
        send(res, 200, renderLlmHarnessHtml(), { 'content-type': 'text/html; charset=utf-8' });
        return;
      }
      if (url.pathname.startsWith('/build/')) {
        sendFile(res, safeStaticPath(buildRoot, url.pathname.slice('/build/'.length)));
        return;
      }
      if (url.pathname.startsWith('/src/')) {
        sendFile(res, safeStaticPath(path.join(productRoot, 'src'), url.pathname.slice('/src/'.length)));
        return;
      }
      if (url.pathname === '/tests/llm-terminal-harness.mjs') {
        sendFile(res, safeStaticPath(path.join(productRoot, 'tests'), 'llm-terminal-harness.mjs'));
        return;
      }
      if (url.pathname.startsWith('/vendor/transformers/')) {
        sendTransformersVendorFile(res, url.pathname.slice('/vendor/transformers/'.length));
        return;
      }
      if (url.pathname.startsWith('/hf/')) {
        await proxyHuggingFaceModel(req, res, cacheRoot, url, options);
        return;
      }
      if (url.pathname.startsWith('/hf-api/')) {
        await proxyHuggingFaceApi(res, url);
        return;
      }
      if (url.pathname.startsWith('/repo/')) {
        sendFile(res, safeStaticPath(repoRoot, url.pathname.slice('/repo/'.length)));
        return;
      }
      send(res, 404, 'Not found', { 'content-type': 'text/plain; charset=utf-8' });
    } catch (error) {
      sendJson(res, 500, {
        ok: false,
        error: error && error.message ? error.message : String(error)
      });
    }
  });

  return {
    server,
    async listen(port = 0, host = '127.0.0.1') {
      await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, host, resolve);
      });
      const address = server.address();
      const resolvedPort = address && typeof address === 'object' ? address.port : port;
      return `http://${host}:${resolvedPort}/`;
    },
    async close() {
      if (!server.listening) return;
      await new Promise((resolve) => server.close(resolve));
    }
  };
}
