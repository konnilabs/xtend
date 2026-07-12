#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceDir = path.join(rootDir, '.xtend-test-results', 'rmt-animation-engine-docs');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function commandExists(command) {
  const result = spawnSync(command, ['--version'], { stdio: 'ignore' });
  return result.status === 0;
}

function findCommand(candidates) {
  return candidates.find((candidate) => commandExists(candidate)) || null;
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, child) {
  let lastError = null;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`PHP docs server exited with ${child.exitCode}.`);
    try {
      const response = await fetch(url, { redirect: 'manual' });
      if (response.status >= 200 && response.status < 500) return;
    } catch (error) {
      lastError = error;
    }
    await delay(50);
  }
  throw new Error(`PHP docs server did not become ready: ${lastError ? lastError.message : 'timeout'}`);
}

function stopProcess(child) {
  if (!child || !child.pid) return;
  try {
    child.kill('SIGTERM');
  } catch (_) {
    // Process already exited.
  }
}

async function webDriverRequest(baseUrl, endpoint, method = 'GET', body) {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const raw = await response.text();
  let payload = null;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch (_) {
    payload = null;
  }
  const value = payload && Object.prototype.hasOwnProperty.call(payload, 'value') ? payload.value : payload;
  if (!response.ok || value && value.error) {
    const detail = value && (value.message || value.error) || raw || `${response.status}`;
    throw new Error(`WebDriver ${method} ${endpoint} failed: ${detail}`);
  }
  return value;
}

async function waitForWebDriver(baseUrl, child) {
  let lastError = null;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`ChromeDriver exited with ${child.exitCode}.`);
    try {
      await webDriverRequest(baseUrl, '/status');
      return;
    } catch (error) {
      lastError = error;
    }
    await delay(50);
  }
  throw new Error(`ChromeDriver did not become ready: ${lastError ? lastError.message : 'timeout'}`);
}

async function createWebDriverSession(baseUrl, scenario) {
  const value = await webDriverRequest(baseUrl, '/session', 'POST', {
    capabilities: {
      alwaysMatch: {
        browserName: 'chrome',
        pageLoadStrategy: 'normal',
        'goog:loggingPrefs': { browser: 'ALL' },
        'goog:chromeOptions': {
          args: [
            '--headless=new',
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-background-networking',
            '--disable-component-update',
            '--disable-default-apps',
            '--disable-sync',
            '--metrics-recording-only',
            '--no-first-run',
            '--force-device-scale-factor=1',
            `--window-size=${scenario.width},${scenario.height}`
          ]
        }
      }
    }
  });
  const sessionId = value && (value.sessionId || value.id);
  if (!sessionId) throw new Error(`ChromeDriver did not return a session id: ${JSON.stringify(value)}`);
  await webDriverRequest(baseUrl, `/session/${sessionId}/window/rect`, 'POST', {
    x: 0,
    y: 0,
    width: scenario.width,
    height: scenario.height
  });
  return sessionId;
}

function executeScript(baseUrl, sessionId, script, args = []) {
  return webDriverRequest(baseUrl, `/session/${sessionId}/execute/sync`, 'POST', { script, args });
}

async function readScenarioSnapshot(baseUrl, sessionId, scenario) {
  let snapshot = null;
  const startedAt = Date.now();
  while (Date.now() - startedAt < 30000) {
    snapshot = await executeScript(baseUrl, sessionId, `
      const deepQuery = (selector, searchRoot = document) => {
        const direct = searchRoot.querySelector(selector);
        if (direct) return direct;
        for (const node of searchRoot.querySelectorAll('*')) {
          if (!node.shadowRoot) continue;
          const match = deepQuery(selector, node.shadowRoot);
          if (match) return match;
        }
        return null;
      };
      const root = deepQuery('[data-docs-animation-engine-demo]');
      const article = deepQuery('#md-content');
      const docsPage = deepQuery('xtend-doc-page');
      const last = window.xtendDocsAnimationEngineDemoLastSnapshot || null;
      const statusSlot = root?.querySelector('[data-slot="status"]') || null;
      const status = statusSlot?.querySelector('x-status') || null;
      const articleStyle = article ? getComputedStyle(article) : null;
      return {
        locationHref: window.location.href,
        documentReadyState: document.readyState,
        documentTitle: document.title,
        bodyTextStart: document.body?.innerText.slice(0, 240) || '',
        docsPageCount: docsPage ? 1 : 0,
        demoRootCount: root ? 1 : 0,
        routeSlug: docsPage?.getAttribute('data-docs-route-slug') || '',
        rootExists: Boolean(root),
        ready: root?.getAttribute('data-animation-engine-ready') || '',
        hydrationState: root?.getAttribute('data-rmt-hydration-state') || '',
        smoke: root?.getAttribute('data-browser-smoke') || '',
        smokeError: root?.getAttribute('data-browser-smoke-error') || '',
        replayComplete: root?.getAttribute('data-replay-complete') === 'true',
        replayStatus: root?.getAttribute('data-replay-status') || '',
        replayDurationMs: Number(root?.getAttribute('data-replay-duration-ms')),
        replayElapsedMs: Number(root?.getAttribute('data-replay-elapsed-ms')),
        reducedMotionPreview: root?.getAttribute('data-reduced-motion-preview') || '',
        networkDuringReplay: root?.getAttribute('data-network-during-replay') === 'true',
        animationObserved: root?.getAttribute('data-animation-observed') === 'true',
        geometryStable: root?.getAttribute('data-demo-geometry-stable') === 'true',
        fixedSlotLayout: root?.querySelector('.docs-animation-engine-demo-controls')?.getAttribute('data-slot-layout') || '',
        controlSlotNames: Array.from(root?.querySelectorAll('.docs-animation-engine-demo-control-slot') || [])
          .map((slot) => slot.getAttribute('data-slot') || ''),
        replayLayoutStable: root?.getAttribute('data-replay-layout-stable') === 'true',
        replayLayoutDelta: Number(root?.getAttribute('data-replay-layout-delta')),
        replayLayoutStage: root?.getAttribute('data-replay-layout-stage') || '',
        statusSlotHeight: statusSlot ? statusSlot.getBoundingClientRect().height : 0,
        statusHeight: status ? status.getBoundingClientRect().height : 0,
        contentOverlap: root?.getAttribute('data-demo-content-overlap') === 'true',
        consoleErrors: Number(root?.getAttribute('data-console-errors')),
        theme: root?.getAttribute('data-browser-theme') || '',
        demoTitle: root?.querySelector('h2')?.textContent.trim() || '',
        articleTitle: article?.querySelector('h1')?.textContent.trim() || '',
        articleOpacity: articleStyle?.opacity || '',
        articleTransform: articleStyle?.transform || '',
        articleVisibility: articleStyle?.visibility || '',
        articleAnimationCount: typeof article?.getAnimations === 'function' ? article.getAnimations().length : -1,
        contentCommittedAt: Number(root?.getAttribute('data-content-committed-at')),
        requestedAt: Number(root?.getAttribute('data-demo-requested-at')),
        cumulativeLayoutShift: Number(root?.getAttribute('data-demo-cls')),
        replayLayoutShift: Number(root?.getAttribute('data-demo-replay-cls')),
        layoutShiftDiagnostics: Array.isArray(root?.__xtendDocsAnimationEngineLayoutShifts)
          ? root.__xtendDocsAnimationEngineLayoutShifts
          : [],
        skeletonHeight: Number(root?.getAttribute('data-demo-skeleton-height')),
        hydratedHeight: Number(root?.getAttribute('data-demo-hydrated-height')),
        engineHistoryCount: Array.isArray(last?.engine?.history) ? last.engine.history.length : 0,
        engineDiagnosticCount: Array.isArray(last?.engine?.diagnostics) ? last.engine.diagnostics.length : 0,
        engineDiagnostics: Array.isArray(last?.engine?.diagnostics)
          ? last.engine.diagnostics.map((entry) => ({ code: entry.code || '', message: entry.message || '' }))
          : [],
        exitStatus: last?.exit?.status || '',
        enterStatus: last?.enter?.status || '',
        exitDiagnostic: last?.exit?.result?.diagnostic?.message || last?.exit?.diagnostic?.message || '',
        enterDiagnostic: last?.enter?.result?.diagnostic?.message || last?.enter?.diagnostic?.message || ''
      };
    `);
    if (snapshot && (snapshot.smoke === 'complete' || snapshot.smoke === 'failed')) return snapshot;
    await delay(100);
  }
  throw new Error(`${scenario.id}: browser fixture timed out (${JSON.stringify(snapshot)}).`);
}

async function captureScenarioEvidence(baseUrl, sessionId, scenario, snapshot) {
  await executeScript(baseUrl, sessionId, `
    const deepQuery = (selector, searchRoot = document) => {
      const direct = searchRoot.querySelector(selector);
      if (direct) return direct;
      for (const node of searchRoot.querySelectorAll('*')) {
        if (!node.shadowRoot) continue;
        const match = deepQuery(selector, node.shadowRoot);
        if (match) return match;
      }
      return null;
    };
    const root = deepQuery('[data-docs-animation-engine-demo]');
    if (root) root.scrollIntoView({ block: 'start', inline: 'nearest' });
    return Boolean(root);
  `);
  await delay(150);
  const [source, activeMarkup, screenshot, browserLogs] = await Promise.all([
    webDriverRequest(baseUrl, `/session/${sessionId}/source`),
    executeScript(baseUrl, sessionId, `
      const deepQuery = (selector, searchRoot = document) => {
        const direct = searchRoot.querySelector(selector);
        if (direct) return direct;
        for (const node of searchRoot.querySelectorAll('*')) {
          if (!node.shadowRoot) continue;
          const match = deepQuery(selector, node.shadowRoot);
          if (match) return match;
        }
        return null;
      };
      return deepQuery('xtend-doc-page')?.outerHTML || '';
    `),
    webDriverRequest(baseUrl, `/session/${sessionId}/screenshot`),
    webDriverRequest(baseUrl, `/session/${sessionId}/log`, 'POST', { type: 'browser' }).catch(() => [])
  ]);
  await Promise.all([
    writeFile(path.join(evidenceDir, `${scenario.id}.html`), `${String(source || '')}\n<!-- active shadow route -->\n${String(activeMarkup || '')}\n`, 'utf8'),
    writeFile(path.join(evidenceDir, `${scenario.id}.png`), Buffer.from(String(screenshot || ''), 'base64')),
    writeFile(path.join(evidenceDir, `${scenario.id}.json`), `${JSON.stringify({ scenario, snapshot, browserLogs }, null, 2)}\n`, 'utf8')
  ]);
  return Array.isArray(browserLogs) ? browserLogs : [];
}

function assertScenario(snapshot, browserLogs, scenario) {
  assert(snapshot.rootExists, `${scenario.id}: demo root is missing.`);
  assert(snapshot.ready === 'true', `${scenario.id}: AnimationEngine did not hydrate.`);
  assert(snapshot.smoke === 'complete', `${scenario.id}: replay smoke failed (${snapshot.smokeError || snapshot.smoke}).`);
  assert(snapshot.replayComplete, `${scenario.id}: replay result is incomplete.`);
  assert(!snapshot.networkDuringReplay, `${scenario.id}: replay triggered a network request.`);
  assert(snapshot.geometryStable, `${scenario.id}: skeleton ${snapshot.skeletonHeight}px and controls ${snapshot.hydratedHeight}px changed height.`);
  assert(snapshot.fixedSlotLayout === 'fixed-responsive-grid', `${scenario.id}: fixed control slot layout is missing.`);
  assert(snapshot.controlSlotNames.join(',') === 'effect,duration,easing,motion,replay,status', `${scenario.id}: control slots are incomplete (${snapshot.controlSlotNames.join(',')}).`);
  assert(snapshot.replayLayoutStable, `${scenario.id}: status update changed control geometry by ${snapshot.replayLayoutDelta}px.`);
  assert(Number.isFinite(snapshot.replayLayoutDelta) && snapshot.replayLayoutDelta <= 0.5, `${scenario.id}: replay layout delta ${snapshot.replayLayoutDelta}px exceeds 0.5px.`);
  assert(['complete', 'fallback'].includes(snapshot.replayLayoutStage), `${scenario.id}: final replay layout stage was not recorded.`);
  assert(Math.abs(snapshot.statusSlotHeight - snapshot.statusHeight) <= 0.5, `${scenario.id}: status does not fill its reserved slot.`);
  assert(!snapshot.contentOverlap, `${scenario.id}: controls overlap article content.`);
  assert(snapshot.consoleErrors === 0, `${scenario.id}: browser errors were observed.`);
  assert(snapshot.theme === scenario.theme, `${scenario.id}: requested theme was not applied.`);
  assert(snapshot.demoTitle === scenario.title, `${scenario.id}: localized demo title is missing.`);
  assert(snapshot.articleTitle === 'RMT AnimationEngine', `${scenario.id}: Parsedown article content is missing.`);
  assert(Number.isFinite(snapshot.contentCommittedAt) && Number.isFinite(snapshot.requestedAt) && snapshot.requestedAt >= snapshot.contentCommittedAt, `${scenario.id}: demo assets started before article commit.`);
  assert(Number.isFinite(snapshot.cumulativeLayoutShift), `${scenario.id}: global CLS was not recorded.`);
  assert(Number.isFinite(snapshot.replayLayoutShift) && snapshot.replayLayoutShift <= 0.01, `${scenario.id}: replay CLS ${snapshot.replayLayoutShift} exceeds 0.01.`);
  assert(snapshot.engineHistoryCount >= 4, `${scenario.id}: AnimationEngine lifecycle events were not recorded.`);
  const severeLogs = browserLogs.filter((entry) => String(entry && entry.level || '').toUpperCase() === 'SEVERE');
  assert(severeLogs.length === 0, `${scenario.id}: Chromium emitted severe console entries (${JSON.stringify(severeLogs)}).`);
  if (scenario.reducedMotion) {
    assert(snapshot.reducedMotionPreview === scenario.reducedMotion, `${scenario.id}: reduced-motion preview was not exercised.`);
  }
  if (scenario.reducedMotion === 'instant') {
    assert(snapshot.replayStatus === 'fallback', `${scenario.id}: instant reduced-motion fallback was not used.`);
  } else {
    assert(snapshot.replayStatus === 'complete', `${scenario.id}: real AnimationEngine replay did not complete (${snapshot.replayStatus}).`);
    assert(snapshot.animationObserved, `${scenario.id}: no animation was observed.`);
  }
}

async function runScenario(baseUrl, webDriverUrl, scenario) {
  const sessionId = await createWebDriverSession(webDriverUrl, scenario);
  try {
    const params = new URLSearchParams({
      'animation-engine-smoke': '1',
      'animation-engine-theme': scenario.theme
    });
    if (scenario.reducedMotion) params.set('animation-engine-reduced', scenario.reducedMotion);
    await webDriverRequest(webDriverUrl, `/session/${sessionId}/url`, 'POST', {
      url: `${baseUrl}/docs/${scenario.locale}/rmt-animation-engine?${params}`
    });
    let snapshot = null;
    try {
      snapshot = await readScenarioSnapshot(webDriverUrl, sessionId, scenario);
      const browserLogs = await captureScenarioEvidence(webDriverUrl, sessionId, scenario, snapshot);
      assertScenario(snapshot, browserLogs, scenario);
    } catch (error) {
      const failureSnapshot = snapshot || await executeScript(webDriverUrl, sessionId, `
        const deepQuery = (selector, searchRoot = document) => {
          const direct = searchRoot.querySelector(selector);
          if (direct) return direct;
          for (const node of searchRoot.querySelectorAll('*')) {
            if (!node.shadowRoot) continue;
            const match = deepQuery(selector, node.shadowRoot);
            if (match) return match;
          }
          return null;
        };
        const docsPage = deepQuery('xtend-doc-page');
        const demoRoot = deepQuery('[data-docs-animation-engine-demo]');
        return {
          locationHref: window.location.href,
          documentReadyState: document.readyState,
          documentTitle: document.title,
          bodyTextStart: document.body?.innerText.slice(0, 500) || '',
          docsPageCount: docsPage ? 1 : 0,
          demoRootCount: demoRoot ? 1 : 0
        };
      `).catch(() => ({ captureFailed: true }));
      await captureScenarioEvidence(webDriverUrl, sessionId, scenario, failureSnapshot).catch(() => {});
      throw error;
    }
  } finally {
    await webDriverRequest(webDriverUrl, `/session/${sessionId}`, 'DELETE').catch(() => {});
  }
}

const chromeDriver = findCommand(['chromedriver', '/usr/bin/chromedriver']);
const php = findCommand(['php']);
if (!chromeDriver || !php) {
  process.stdout.write(`AnimationEngine docs browser smoke skipped: ${!chromeDriver ? 'chromedriver' : 'php'} not found\n`);
  process.exit(0);
}

await mkdir(evidenceDir, { recursive: true });
const port = await freePort();
const server = spawn(php, ['-S', `127.0.0.1:${port}`, '-t', rootDir, 'docs/dev-router.php'], {
  cwd: rootDir,
  stdio: ['ignore', 'pipe', 'pipe']
});
server.stdout.resume();
server.stderr.resume();
const webDriverPort = await freePort();
const webDriverUrl = `http://127.0.0.1:${webDriverPort}`;
const webDriver = spawn(chromeDriver, [`--port=${webDriverPort}`], {
  cwd: rootDir,
  stdio: ['ignore', 'pipe', 'pipe']
});
webDriver.stdout.resume();
webDriver.stderr.resume();

try {
  const baseUrl = `http://127.0.0.1:${port}`;
  await waitForServer(`${baseUrl}/docs/de/rmt-animation-engine`, server);
  await waitForWebDriver(webDriverUrl, webDriver);
  const initial = await fetch(`${baseUrl}/docs/de/rmt-animation-engine`);
  const initialHtml = await initial.text();
  assert(initial.status === 200, `Initial SSR route returned ${initial.status}.`);
  assert(!initialHtml.includes('/docs/utils/animation-engine-demo.mjs'), 'Initial SSR HTML eagerly references the demo module.');
  assert(!initialHtml.includes('/docs/generated/rmt-animation-engine-demo.plan.json'), 'Initial SSR HTML eagerly references the demo plan.');

  const scenarios = [
    { id: 'de-desktop-light', locale: 'de', title: 'AnimationEngine ausprobieren', theme: 'light', width: 1440, height: 900 },
    { id: 'de-desktop-dark', locale: 'de', title: 'AnimationEngine ausprobieren', theme: 'dark', width: 1440, height: 900, reducedMotion: 'fade' },
    { id: 'en-mobile-light', locale: 'en', title: 'Try AnimationEngine', theme: 'light', width: 390, height: 844 },
    { id: 'en-mobile-dark', locale: 'en', title: 'Try AnimationEngine', theme: 'dark', width: 390, height: 844, reducedMotion: 'instant' }
  ];

  for (const scenario of scenarios) {
    await runScenario(baseUrl, webDriverUrl, scenario);
  }
} finally {
  stopProcess(server);
  await fetch(`${webDriverUrl}/shutdown`).catch(() => {});
  stopProcess(webDriver);
}

process.stdout.write(`RMT AnimationEngine docs browser smoke passed. Evidence: ${path.relative(rootDir, evidenceDir)}\n`);
