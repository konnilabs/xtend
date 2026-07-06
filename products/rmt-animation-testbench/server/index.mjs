import { createServer as createHttpServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { createReadStream, existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { createRmtNodeSsrAdapter } from '../../../xtendrmt/rmt-node-ssr-adapter.js';
import {
  DURATIONS,
  EASINGS,
  EFFECTS,
  INITIAL_SURFACE_ID,
  INTERRUPTS,
  LAYOUT_MODES,
  REDUCED_MOTION,
  SURFACES,
  TESTBENCH_SCHEMA,
  createResumePayload,
  createXScalerPreflight,
  escapeHtml,
  escapeJsonForScript,
  findSurface,
  renderSurfaceHtml,
  surfaceSummaries
} from '../src/shared/testbench-data.mjs';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(productRoot, '../..');
const sourcePath = path.join(productRoot, 'src', 'rmt', 'animation-testbench.rmt');
const require = createRequire(import.meta.url);
const { compileRmtVNextSource } = require(path.join(repoRoot, 'tools', 'rmt-language', 'vnext-compiler.js'));

const resumeStore = new Map();
const telemetryStore = [];

const MIME_TYPES = {
  '.css': 'text/css; charset=UTF-8',
  '.html': 'text/html; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.mjs': 'text/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.map': 'application/json; charset=UTF-8',
  '.svg': 'image/svg+xml; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const SECURITY_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "connect-src 'self'",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'"
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer'
};

function jsonResponse(response, status, payload, headers = {}) {
  response.writeHead(status, {
    ...SECURITY_HEADERS,
    ...headers,
    'content-type': 'application/json; charset=UTF-8'
  });
  response.end(`${JSON.stringify(payload, null, 2)}\n`);
}

function textResponse(response, status, body, headers = {}) {
  response.writeHead(status, {
    ...SECURITY_HEADERS,
    ...headers
  });
  response.end(body);
}

function createToken() {
  return `tb-${Date.now().toString(36)}-${randomBytes(4).toString('hex')}`;
}

async function readSource() {
  return readFile(sourcePath, 'utf8');
}

async function compileRmtSource() {
  const source = await readSource();
  const compileResult = compileRmtVNextSource({
    text: source,
    filePath: path.relative(repoRoot, sourcePath)
  });
  return { source, compileResult };
}

async function renderSsr({ requestId, activeSurfaceId }) {
  const { source, compileResult } = await compileRmtSource();
  const adapter = createRmtNodeSsrAdapter({
    compileRmtVNextSource
  });
  const ssrResult = await adapter.render({
    source,
    filePath: path.relative(repoRoot, sourcePath)
  }, {
    requestId,
    rootId: 'xtend-maraca-root',
    namespace: 'rmt-animation-testbench',
    templateId: 'rmt-animation-testbench',
    model: {
      activeSurfaceId,
      surfaceCount: SURFACES.length
    }
  });
  return { source, compileResult, ssrResult };
}

async function readBuildReport() {
  const reportPath = path.join(productRoot, 'dist', 'maraca', 'xtend.maraca.report.json');
  if (!existsSync(reportPath)) return null;
  return JSON.parse(await readFile(reportPath, 'utf8'));
}

function optionTags(values, selected) {
  return values.map((value) => `<option value="${escapeHtml(value)}"${value === selected ? ' selected' : ''}>${escapeHtml(value)}</option>`).join('');
}

function renderFooter() {
  return `
    <footer id="rmt-motion-controls" class="tb-footer" data-rmt-ssr-surface="rmt.animation.testbench.footer">
      <div class="tb-footer-nav">
        <x-button id="control-prev" label="Back" icon-name="chevron-left" aria-label="Back"></x-button>
        <x-button id="control-next" label="Next" icon-name="chevron-right" aria-label="Next"></x-button>
      </div>
      <div class="tb-control-strip">
        <x-select id="control-effect" label="Effect" value="crossfade" density="dense">${optionTags(EFFECTS, 'crossfade')}</x-select>
        <x-select id="control-duration" label="Duration" value="280" density="dense">${optionTags(DURATIONS.map(String), '280')}</x-select>
        <x-select id="control-easing" label="Easing" value="cubic-bezier(.2,.8,.2,1)" density="dense">${optionTags(EASINGS, 'cubic-bezier(.2,.8,.2,1)')}</x-select>
        <x-select id="control-interrupt" label="Interrupt" value="replace" density="dense">${optionTags(INTERRUPTS, 'replace')}</x-select>
        <x-select id="control-reduced-motion" label="Reduced" value="fade" density="dense">${optionTags(REDUCED_MOTION, 'fade')}</x-select>
        <x-select id="control-layout" label="LayoutKey" value="auto" density="dense">${optionTags(LAYOUT_MODES, 'auto')}</x-select>
      </div>
      <output id="telemetry-panel" class="tb-telemetry" aria-live="polite">
        <span id="telemetry-effect">crossfade</span>
        <span id="telemetry-phase">idle</span>
        <span id="telemetry-fallback">fallback 0</span>
        <span id="telemetry-budget">budget pending</span>
      </output>
    </footer>
  `;
}

function renderLazyPlaceholders(activeSurfaceId) {
  return SURFACES
    .filter((surface) => surface.id !== activeSurfaceId)
    .map((surface) => `
      <template id="lazy-placeholder-${escapeHtml(surface.id)}" data-lazy-surface="${escapeHtml(surface.id)}" data-lazy-state="unloaded"></template>
    `)
    .join('');
}

function createBootPayload({ token, activeSurfaceId, compileResult, ssrResult, buildReport, reducedMotionForced }) {
  const animationEngine = compileResult && compileResult.orchestrationArtifacts && compileResult.orchestrationArtifacts.animationEngine || {
    schema: 'xtend.rmt.animation-engine.v1',
    animations: [],
    transitions: []
  };
  return {
    schema: TESTBENCH_SCHEMA,
    token,
    activeSurfaceId,
    initialSurface: findSurface(activeSurfaceId),
    surfaces: surfaceSummaries(),
    controls: {
      effects: EFFECTS,
      durations: DURATIONS,
      easings: EASINGS,
      interrupts: INTERRUPTS,
      reducedMotion: REDUCED_MOTION,
      layoutModes: LAYOUT_MODES,
      defaults: {
        effect: 'crossfade',
        durationMs: 280,
        easing: 'cubic-bezier(.2,.8,.2,1)',
        interrupt: 'replace',
        reducedMotion: 'fade',
        layoutMode: 'auto'
      }
    },
    animationPlan: animationEngine,
    reducedMotionForced,
    maraca: {
      reportOk: buildReport && buildReport.ok === true,
      bundle: '/dist/maraca/xtend.maraca.mjs',
      css: '/dist/maraca/xtend.maraca.css'
    },
    xscaler: {
      mode: 'protocol-lazy',
      networkDuringRender: false,
      preflightEndpoint: '/api/xscaler/preflight',
      lazyEndpoint: '/api/lazy-surface/:id'
    },
    ssr: {
      hydrationSchema: ssrResult && ssrResult.hydration && ssrResult.hydration.schema || null,
      responseKind: ssrResult && ssrResult.response && ssrResult.response.kind || null,
      ok: ssrResult && ssrResult.ok === true
    }
  };
}

async function renderPage(request) {
  const url = new URL(request.url || '/', 'http://127.0.0.1');
  const activeSurfaceId = SURFACES.some((surface) => surface.id === url.searchParams.get('surface'))
    ? url.searchParams.get('surface')
    : INITIAL_SURFACE_ID;
  const token = createToken();
  const requestId = url.searchParams.get('seed') || token;
  const reducedMotionForced = url.searchParams.get('reduced') === '1';
  const [{ compileResult, ssrResult }, buildReport] = await Promise.all([
    renderSsr({ requestId, activeSurfaceId }),
    readBuildReport()
  ]);
  const resumePayload = createResumePayload({ token, compileResult, ssrResult, activeSurfaceId });
  resumeStore.set(token, resumePayload);
  const boot = createBootPayload({ token, activeSurfaceId, compileResult, ssrResult, buildReport, reducedMotionForced });
  const initialSurface = findSurface(activeSurfaceId);
  const title = 'RMT AnimationEngine TestBench';
  return `<!doctype html>
<html lang="en" data-product="rmt-animation-testbench">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="/xtend.css">
  <link rel="stylesheet" href="/src/styles/testbench.css">
  <link rel="stylesheet" href="/dist/maraca/xtend.maraca.css">
</head>
<body data-active-surface="${escapeHtml(activeSurfaceId)}" data-xt-ui-effects="fade">
  <div id="rmt-testbench-app" class="tb-shell">
    <header class="tb-topbar">
      <div>
        <span>XTend RMT</span>
        <strong>AnimationEngine TestBench</strong>
      </div>
      <x-status type="info" label="SSR" message="prehydrated"></x-status>
    </header>
    <section id="xtend-maraca-root" class="tb-stage" data-rmt-root="rmt-animation-testbench" data-resume-token="${escapeHtml(token)}">
      <div id="rmt-active-surface" class="tb-stage-stack" data-layout-key="testbench-shared-shell">
        ${renderSurfaceHtml(initialSurface, { active: true })}
      </div>
      ${renderLazyPlaceholders(activeSurfaceId)}
    </section>
    ${renderFooter()}
    <div id="rmt-testbench-smoke-result"
      data-smoke-complete="false"
      data-animation-engine-ready="false"
      data-footer-visible="false"
      data-lazy-loaded-count="0"
      data-xscaler-preflight-count="0"
      data-pixel-change="false"
      data-cls-budget-ok="false"
      data-console-errors="0"
      data-html-sink-diagnostics="0"
      hidden></div>
  </div>
  <section id="rmt-node-ssr-shadow" data-rmt-node-ssr-shadow hidden>${ssrResult && ssrResult.html || ''}</section>
  <script id="rmt-testbench-boot" type="application/json" data-rmt-ssr-hydration>${escapeJsonForScript(boot)}</script>
  <script id="rmt-testbench-resume" type="application/json" data-rmt-ssr-resume>${escapeJsonForScript(resumePayload)}</script>
  <script type="module" src="/src/client/testbench-controller.mjs"></script>
</body>
</html>`;
}

function resolveStaticPath(urlPath) {
  const routes = [
    { prefix: '/src/', root: path.join(productRoot, 'src') },
    { prefix: '/dist/', root: path.join(productRoot, 'dist') },
    { prefix: '/components/', root: path.join(repoRoot, 'components') },
    { prefix: '/xtendrmt/', root: path.join(repoRoot, 'xtendrmt') },
    { prefix: '/xcommand/', root: path.join(repoRoot, 'xcommand') }
  ];
  if (urlPath === '/xtend.css') return path.join(repoRoot, 'xtend.css');
  for (const route of routes) {
    if (!urlPath.startsWith(route.prefix)) continue;
    const relative = decodeURIComponent(urlPath.slice(route.prefix.length));
    const candidate = path.resolve(route.root, relative);
    if (candidate === route.root || candidate.startsWith(`${route.root}${path.sep}`)) return candidate;
  }
  return null;
}

function sendStatic(request, response, urlPath) {
  const filePath = resolveStaticPath(urlPath);
  if (!filePath || !existsSync(filePath)) return false;
  const ext = path.extname(filePath).toLowerCase();
  response.writeHead(200, {
    ...SECURITY_HEADERS,
    'content-type': MIME_TYPES[ext] || 'application/octet-stream',
    'cache-control': 'no-store'
  });
  createReadStream(filePath).pipe(response);
  return true;
}

function readBody(request, limit = 1024 * 256) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > limit) {
        reject(new Error('Request body too large.'));
        request.destroy();
      }
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

async function handleRequest(request, response) {
  const url = new URL(request.url || '/', 'http://127.0.0.1');
  try {
    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      const html = await renderPage(request);
      textResponse(response, 200, html, { 'content-type': 'text/html; charset=UTF-8' });
      return;
    }
    if (request.method === 'GET' && (url.pathname === '/health' || url.pathname === '/healthz')) {
      const { compileResult } = await compileRmtSource();
      const animationEngine = compileResult.orchestrationArtifacts && compileResult.orchestrationArtifacts.animationEngine || {};
      jsonResponse(response, 200, {
        schema: 'xtend.product.rmt-animation-testbench.health.v1',
        ok: compileResult.ok === true,
        animationEngineSchema: animationEngine.schema || null,
        animationCount: Array.isArray(animationEngine.animations) ? animationEngine.animations.length : 0,
        transitionCount: Array.isArray(animationEngine.transitions) ? animationEngine.transitions.length : 0
      });
      return;
    }
    if (request.method === 'GET' && url.pathname === '/api/resume') {
      const token = url.searchParams.get('token');
      const payload = token ? resumeStore.get(token) : Array.from(resumeStore.values()).at(-1);
      jsonResponse(response, 200, {
        schema: 'xtend.product.rmt-animation-testbench.resume-response.v1',
        ok: Boolean(payload),
        payload: payload || null
      });
      return;
    }
    if (request.method === 'GET' && url.pathname === '/api/xscaler/preflight') {
      const surfaceId = url.searchParams.get('surface') || INITIAL_SURFACE_ID;
      const reason = url.searchParams.get('reason') || 'navigation';
      jsonResponse(response, 200, createXScalerPreflight(surfaceId, reason));
      return;
    }
    if (request.method === 'GET' && url.pathname.startsWith('/api/lazy-surface/')) {
      const surfaceId = decodeURIComponent(url.pathname.slice('/api/lazy-surface/'.length));
      const surface = SURFACES.find((entry) => entry.id === surfaceId);
      if (!surface) {
        jsonResponse(response, 404, { ok: false, error: 'surface-not-found' });
        return;
      }
      jsonResponse(response, 200, {
        schema: 'xtend.product.rmt-animation-testbench.lazy-surface-response.v1',
        ok: true,
        surface,
        htmlPreview: renderSurfaceHtml(surface, { active: false }).replace(/\s+/gu, ' ').trim().slice(0, 280),
        preflight: createXScalerPreflight(surface.id, 'lazy-surface')
      });
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/telemetry') {
      const body = await readBody(request);
      const payload = body ? JSON.parse(body) : {};
      telemetryStore.push({
        receivedAt: new Date().toISOString(),
        payload
      });
      while (telemetryStore.length > 50) telemetryStore.shift();
      jsonResponse(response, 200, {
        schema: 'xtend.product.rmt-animation-testbench.telemetry-response.v1',
        ok: true,
        count: telemetryStore.length
      });
      return;
    }
    if (request.method === 'GET' && sendStatic(request, response, url.pathname)) return;
    jsonResponse(response, 404, { ok: false, error: 'not-found', path: url.pathname });
  } catch (error) {
    jsonResponse(response, 500, {
      ok: false,
      error: error && error.message ? error.message : String(error || 'Unknown server error.')
    });
  }
}

export function startServer(options = {}) {
  const port = Number(options.port ?? process.env.PORT ?? 9196);
  const host = options.host || process.env.HOST || '127.0.0.1';
  const server = createHttpServer(handleRequest);
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      const address = server.address();
      const resolvedPort = typeof address === 'object' && address ? address.port : port;
      if (!options.silent) {
        process.stdout.write(`RMT AnimationEngine TestBench: http://${host}:${resolvedPort}/\n`);
      }
      resolve({
        server,
        host,
        port: resolvedPort,
        url: `http://${host}:${resolvedPort}/`,
        close: () => new Promise((closeResolve, closeReject) => {
          server.close((error) => error ? closeReject(error) : closeResolve());
        })
      });
    });
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  await startServer();
}
