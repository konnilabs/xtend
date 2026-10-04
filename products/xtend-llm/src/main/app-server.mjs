import {randomBytes, timingSafeEqual} from 'node:crypto';
import staticFiles from '../../../../security/static-files.cjs';
import {ProxyBudget} from './proxy-budget.mjs';
import {APP_CAPABILITY_HEADER} from './app-server-session.mjs';
const {resolvePublicFile, streamPublicFile} = staticFiles;
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
  streamPublicFile(res, filePath, withSecurityHeaders({'content-type': filePath ? contentType(filePath) : 'text/plain', 'cache-control': 'no-store'}));
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
  return resolvePublicFile(root, requestPath);
}

function sendTransformersVendorFile(res, requestPath) {
  const filePath = safeStaticPath(transformersDistRoot, requestPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    sendFile(res, filePath);
    return;
  }
  const fallbackName = path.basename(requestPath);
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
    <script type="module" src="/build/xtend.maraca.mjs"></script>
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
  const rest = decodeURIComponent(url.pathname.slice('/hf/'.length));
  if (!rest || Buffer.byteLength(rest) > 1024 || rest.split('/').length > 32 || rest.includes('..') || path.isAbsolute(rest) || rest.includes('\\')) { sendJson(res, 400, {ok: false, error: 'Invalid model asset path.'}); return; }
  const cachePath = safeCachePath(cacheRoot, rest);
  const budget = options.budget;
  try {
    budget.reserve(0);
    if (!fs.existsSync(cachePath)) {
      await budget.download(cachePath, async () => {
        budget.entries(); // Refuse symlinked cache ancestors before mutation.
        fs.mkdirSync(path.dirname(cachePath), {recursive: true});
        const temporary = `${cachePath}.tmp-${randomBytes(16).toString('hex')}`;
        budget.temporaryFiles.add(temporary);
        const limiter = budget.limiter();
        try {
          const response = await (options.fetch || fetch)(`https://huggingface.co/${rest}${url.search}`, {signal: AbortSignal.any([options.signal, AbortSignal.timeout(budget.timeoutMs)])});
          if (!response.ok || !response.body) throw new Error('Model upstream failed.');
          const declared = Number(response.headers.get('content-length'));
          if (declared > budget.maxObjectBytes) { await response.body.cancel(); throw new Error('Model object byte limit exceeded.'); }
          const eventBase = {asset: rest};
          await pipeline(Readable.fromWeb(response.body), limiter.transform, createProgressTransform(options, eventBase, declared || 0), fs.createWriteStream(temporary, {flags: 'wx', mode: 0o600}));
          fs.renameSync(temporary, cachePath);
          notifyModelAssetProgress(options, {...eventBase, phase: 'download-complete', loaded: fs.statSync(cachePath).size, total: fs.statSync(cachePath).size, progress: 1});
        } finally {
          limiter.release();
          if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
          budget.temporaryFiles.delete(temporary);
        }
        budget.reserve(0);
      });
    }
    if (fs.existsSync(cachePath)) fs.utimesSync(cachePath, new Date(), new Date());
    sendFile(res, resolvePublicFile(cacheRoot, rest));
  } catch (_) { if (!res.destroyed) sendJson(res, 502, {ok: false, error: 'Model proxy request rejected or upstream failed.'}); }
}

async function proxyHuggingFaceApi(res, url, options) {
  const rest = decodeURIComponent(url.pathname.slice('/hf-api/'.length));
  if (!rest || rest.includes('..')) { sendJson(res, 400, {ok: false, error: 'Invalid API path.'}); return; }
  try {
    await options.budget.api(async () => {
      const response = await (options.fetch || fetch)(`https://huggingface.co/api/${rest}${url.search}`, {signal: AbortSignal.any([options.signal, AbortSignal.timeout(options.budget.timeoutMs)]), headers: {accept: 'application/json'}});
      const reader = response.body.getReader(); const chunks = []; let bytes = 0;
      try {
        for (;;) { const {done, value} = await reader.read(); if (done) break; bytes += value.length; if (bytes > options.budget.maxApiBytes) throw new Error('API response byte limit exceeded.'); chunks.push(Buffer.from(value)); }
      } finally { await reader.cancel(); }
      send(res, response.status, Buffer.concat(chunks), {'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store'});
    });
  } catch (_) { sendJson(res, 502, {ok: false, error: 'API proxy request rejected or upstream failed.'}); }
}

export function createXtendLlmAppServer(options = {}) {
  const cacheRoot = options.cacheRoot || path.join(options.userData || productRoot, 'model-cache');
  const dev = options.dev === true;
  const capability = randomBytes(32).toString('hex');
  const budget = new ProxyBudget(cacheRoot, options.proxyLimits);
  const proxyAbort = new AbortController();
  let expectedAuthority = null;
  const proxyOptions = {...options, budget, signal: proxyAbort.signal};
  const server = http.createServer(async (req, res) => {
    try {
      const provided = req.headers[APP_CAPABILITY_HEADER];
      const tokenValid = typeof provided === 'string' && Buffer.byteLength(provided) === Buffer.byteLength(capability) && timingSafeEqual(Buffer.from(provided), Buffer.from(capability));
      if (req.headers.host !== expectedAuthority || req.headers.origin !== undefined && req.headers.origin !== `http://${expectedAuthority}` || !tokenValid) { sendJson(res, 403, {ok: false, error: 'Request capability or origin rejected.'}); return; }
      const url = new URL(req.url || '/', `http://${expectedAuthority}`);
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
        await proxyHuggingFaceModel(req, res, cacheRoot, url, proxyOptions);
        return;
      }
      if (url.pathname.startsWith('/hf-api/')) {
        await proxyHuggingFaceApi(res, url, proxyOptions);
        return;
      }
      if (dev && (options.publicRepoFiles || []).includes(url.pathname.slice('/repo/'.length)) && url.pathname.startsWith('/repo/')) {
        sendFile(res, safeStaticPath(repoRoot, url.pathname.slice('/repo/'.length)));
        return;
      }
      send(res, 404, 'Not found', { 'content-type': 'text/plain; charset=utf-8' });
    } catch (error) {
      if (!res.headersSent && !res.destroyed) sendJson(res, 500, {ok: false, error: 'App server request failed.'});
    }
  });

  return {
    server,
    capability,
    async listen(port = 0, host = '127.0.0.1') {
      await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, host, resolve);
      });
      const address = server.address();
      const resolvedPort = address && typeof address === 'object' ? address.port : port;
      expectedAuthority = `${host}:${resolvedPort}`;
      return `http://${expectedAuthority}/`;
    },
    async close() {
      proxyAbort.abort();
      if (!server.listening) return;
      await new Promise((resolve) => server.close(resolve));
    }
  };
}
