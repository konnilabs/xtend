#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceDir = path.join(rootDir, '.xtend-test-results', 'landing-page');
const RUNS_PER_SCENARIO = 3;
const LCP_BUDGET_MS = 2500;
const CLS_BUDGET = 0.05;
const PRELOAD_COMPONENTS = ['xstate', 'x-theme', 'x-icon', 'x-header', 'x-hero', 'x-type'];
const ABOVE_FOLD_CUSTOM_ELEMENTS = ['x-header', 'x-hero', 'x-type'];
const LAZY_COMPONENTS = ['x-section', 'x-cards', 'x-code', 'x-footer'];
const scenarios = [
  { id: 'desktop', width: 1440, height: 900, fcpBudgetMs: 1500, reducedMotion: false },
  { id: 'mobile-reduced-motion', width: 390, height: 844, fcpBudgetMs: 2000, reducedMotion: true }
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function commandExists(command) {
  return spawnSync(command, ['--version'], { stdio: 'ignore' }).status === 0;
}

function findCommand(candidates) {
  return candidates.find(commandExists) || null;
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

function stopProcess(child) {
  if (!child || !child.pid) return;
  try { child.kill('SIGTERM'); } catch (_) {}
}

async function request(baseUrl, endpoint, method = 'GET', body) {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const raw = await response.text();
  let payload = null;
  try { payload = raw ? JSON.parse(raw) : null; } catch (_) {}
  const value = payload && Object.prototype.hasOwnProperty.call(payload, 'value') ? payload.value : payload;
  if (!response.ok || value && value.error) {
    throw new Error(value && (value.message || value.error) || raw || String(response.status));
  }
  return value;
}

async function waitUntil(callback, message, timeoutMs = 15000) {
  const startedAt = Date.now();
  let lastValue = null;
  while (Date.now() - startedAt < timeoutMs) {
    lastValue = await callback();
    if (lastValue) return lastValue;
    await delay(100);
  }
  throw new Error(`${message}: ${JSON.stringify(lastValue)}`);
}

async function waitForServer(origin, child) {
  await waitUntil(async () => {
    if (child.exitCode !== null) throw new Error(`Landing server exited with ${child.exitCode}`);
    try { return (await fetch(`${origin}/index.html`)).ok; } catch (_) { return false; }
  }, 'Landing server did not become ready');
}

async function waitForDriver(origin, child) {
  await waitUntil(async () => {
    if (child.exitCode !== null) throw new Error(`ChromeDriver exited with ${child.exitCode}`);
    try { await request(origin, '/status'); return true; } catch (_) { return false; }
  }, 'ChromeDriver did not become ready');
}

async function createSession(driverOrigin, scenario) {
  const args = [
    '--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
    '--disable-background-networking', '--disable-component-update', '--disable-default-apps',
    '--disable-sync', '--metrics-recording-only', '--no-first-run', '--force-device-scale-factor=1',
    '--disk-cache-size=0', '--media-cache-size=0', `--window-size=${scenario.width},${scenario.height}`
  ];
  if (scenario.reducedMotion) args.push('--force-prefers-reduced-motion=reduce');
  const value = await request(driverOrigin, '/session', 'POST', {
    capabilities: {
      alwaysMatch: {
        browserName: 'chrome',
        pageLoadStrategy: 'normal',
        'goog:loggingPrefs': { browser: 'ALL' },
        'goog:chromeOptions': { args }
      }
    }
  });
  const sessionId = value && (value.sessionId || value.id);
  assert(sessionId, 'ChromeDriver did not return a session id');
  await request(driverOrigin, `/session/${sessionId}/window/rect`, 'POST', {
    x: 0, y: 0, width: scenario.width, height: scenario.height
  });
  return sessionId;
}

function execute(driverOrigin, sessionId, script, args = []) {
  return request(driverOrigin, `/session/${sessionId}/execute/sync`, 'POST', { script, args });
}

async function installPerformanceProbe(driverOrigin, sessionId) {
  await request(driverOrigin, `/session/${sessionId}/goog/cdp/execute`, 'POST', {
    cmd: 'Page.addScriptToEvaluateOnNewDocument',
    params: {
      source: `
        window.__xtendLandingPerformance = { cls: 0, lcpMs: 0, shifts: [], loaderMeasurements: [] };
        window.addEventListener('xtend-loader-performance', (event) => {
          if (event && event.detail) window.__xtendLandingPerformance.loaderMeasurements.push(event.detail);
        });
        if (typeof PerformanceObserver === 'function') {
          try {
            new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                  window.__xtendLandingPerformance.cls += entry.value;
                  window.__xtendLandingPerformance.shifts.push({
                    value: entry.value,
                    startTime: entry.startTime,
                    sources: Array.from(entry.sources || []).map((source) => ({
                      node: source.node
                        ? (source.node.localName || '')
                          + (source.node.id ? '#' + source.node.id : '')
                          + (source.node.classList && source.node.classList.length ? '.' + Array.from(source.node.classList).join('.') : '')
                        : null,
                      previousRect: source.previousRect,
                      currentRect: source.currentRect
                    }))
                  });
                }
              }
            }).observe({ type: 'layout-shift', buffered: true });
          } catch (_) {}
          try {
            new PerformanceObserver((list) => {
              const entries = list.getEntries();
              const last = entries[entries.length - 1];
              if (last) window.__xtendLandingPerformance.lcpMs = last.startTime;
            }).observe({ type: 'largest-contentful-paint', buffered: true });
          } catch (_) {}
        }
      `
    }
  });
}

async function readSnapshot(driverOrigin, sessionId) {
  return execute(driverOrigin, sessionId, `
    const paint = performance.getEntriesByType('paint');
    const fcp = paint.find((entry) => entry.name === 'first-contentful-paint');
    const header = document.querySelector('x-header');
    const hero = document.querySelector('x-hero');
    const animated = document.querySelector('.hero-animated-text');
    const fallback = document.querySelector('.hero-static-text');
    const codeSection = document.querySelector('.landing-code-section');
    const codeSectionContainer = codeSection && codeSection.shadowRoot && codeSection.shadowRoot.querySelector('.container');
    const codeSectionContent = codeSection && codeSection.shadowRoot && codeSection.shadowRoot.querySelector('main');
    const codeBlock = document.querySelector('.landing-code');
    const codePre = codeBlock && codeBlock.shadowRoot && codeBlock.shadowRoot.querySelector('pre');
    const codeElement = codeBlock && codeBlock.shadowRoot && codeBlock.shadowRoot.querySelector('code');
    const codeRect = codeBlock && codeBlock.getBoundingClientRect();
    const codeContentRect = codeSectionContent && codeSectionContent.getBoundingClientRect();
    const footer = document.querySelector('.landing-footer');
    const footerRect = footer && footer.getBoundingClientRect();
    const githubIcons = Array.from(document.querySelectorAll('a[href="https://github.com/konnilabs/xtend"] x-icon.github-icon'));
    const measurements = window.__xtendLandingPerformance && window.__xtendLandingPerformance.loaderMeasurements || [];
    const visibleUndefined = Array.from(document.querySelectorAll('x-header,x-hero,x-type,x-section,x-cards,x-code,x-footer'))
      .filter((element) => !customElements.get(element.localName))
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.top < innerHeight && rect.bottom > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      })
      .map((element) => element.localName);
    return {
      ready: Boolean(window.__XTendLoaderBootPromise && customElements.get('x-header') && customElements.get('x-hero') && customElements.get('x-type')),
      fcpMs: fcp ? fcp.startTime : null,
      lcpMs: window.__xtendLandingPerformance && window.__xtendLandingPerformance.lcpMs || 0,
      cls: window.__xtendLandingPerformance && window.__xtendLandingPerformance.cls || 0,
      shifts: window.__xtendLandingPerformance && window.__xtendLandingPerformance.shifts || [],
      overflowX: Math.max(0, document.documentElement.scrollWidth - innerWidth),
      headerHeight: header ? header.getBoundingClientRect().height : 0,
      heroHeight: hero ? hero.getBoundingClientRect().height : 0,
      heroInternalHeight: hero && hero.shadowRoot && hero.shadowRoot.querySelector('.hero') ? hero.shadowRoot.querySelector('.hero').getBoundingClientRect().height : 0,
      heroContentHeight: hero && hero.shadowRoot && hero.shadowRoot.querySelector('.content') ? hero.shadowRoot.querySelector('.content').getBoundingClientRect().height : 0,
      heroHeadingHeight: document.querySelector('.landing-hero h1') ? document.querySelector('.landing-hero h1').getBoundingClientRect().height : 0,
      firstViewportDelta: header && hero ? Math.abs(header.getBoundingClientRect().height + hero.getBoundingClientRect().height - innerHeight) : null,
      visibleUndefined,
      defined: Object.fromEntries(${JSON.stringify([...PRELOAD_COMPONENTS, ...LAZY_COMPONENTS])}.map((tag) => [tag, Boolean(customElements.get(tag))])),
      animatedDisplay: animated ? getComputedStyle(animated).display : null,
      fallbackDisplay: fallback ? getComputedStyle(fallback).display : null,
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      classicCodeText: codeElement ? codeElement.textContent : null,
      classicCodePaddingTop: codeBlock ? parseFloat(getComputedStyle(codeBlock).paddingTop) : null,
      classicCodePaddingInlineStart: codeBlock ? parseFloat(getComputedStyle(codeBlock).paddingInlineStart) : null,
      classicCodeSectionOverflowX: codeSectionContainer ? Math.max(0, codeSectionContainer.scrollWidth - codeSectionContainer.clientWidth) : null,
      classicCodeOverflowX: codePre ? Math.max(0, codePre.scrollWidth - codePre.clientWidth) : null,
      classicCodeContained: Boolean(codeRect && codeContentRect && codeRect.left >= codeContentRect.left - 1 && codeRect.right <= codeContentRect.right + 1),
      footerFullBleed: Boolean(footerRect && footerRect.left <= 1 && footerRect.right >= document.documentElement.clientWidth - 1),
      githubIconCount: githubIcons.length,
      githubIconsReady: githubIcons.length > 0 && githubIcons.every((icon) => {
        const image = icon.shadowRoot && icon.shadowRoot.querySelector('img');
        return Boolean(customElements.get('x-icon') && image && image.complete && image.naturalWidth > 0);
      }),
      loaderMeasurements: measurements.map((entry) => ({ phase: entry.phase || entry.name, tag: entry.tag || entry.metadata && entry.metadata.tag }))
    };
  `);
}

async function runSingle(driverOrigin, pageOrigin, scenario, runNumber) {
  const sessionId = await createSession(driverOrigin, scenario);
  try {
    await installPerformanceProbe(driverOrigin, sessionId);
    await request(driverOrigin, `/session/${sessionId}/url`, 'POST', { url: `${pageOrigin}/index.html?run=${runNumber}` });
    const initial = await waitUntil(async () => {
      const snapshot = await readSnapshot(driverOrigin, sessionId);
      return snapshot.ready && Number.isFinite(snapshot.fcpMs) && snapshot.lcpMs > 0 ? snapshot : null;
    }, `${scenario.id} run ${runNumber} did not reach a measured loader-ready state`);
    await delay(350);
    const settled = await readSnapshot(driverOrigin, sessionId);
    assert(settled.visibleUndefined.length === 0, `${scenario.id}: undefined first-viewport elements became visible (${settled.visibleUndefined.join(', ')})`);
    assert(settled.overflowX <= 1, `${scenario.id}: horizontal overflow is ${settled.overflowX}px`);
    assert(settled.firstViewportDelta <= 2, `${scenario.id}: header and hero miss the first viewport (${JSON.stringify({ delta: settled.firstViewportDelta, headerHeight: settled.headerHeight, heroHeight: settled.heroHeight, heroInternalHeight: settled.heroInternalHeight, heroContentHeight: settled.heroContentHeight, heroHeadingHeight: settled.heroHeadingHeight })})`);
    assert(ABOVE_FOLD_CUSTOM_ELEMENTS.every((tag) => settled.defined[tag]), `${scenario.id}: above-fold custom elements are not all defined`);
    const measuredTags = new Set(settled.loaderMeasurements.map((entry) => entry.tag).filter(Boolean));
    assert(PRELOAD_COMPONENTS.every((tag) => measuredTags.has(tag)), `${scenario.id}: loader measurements miss a preload component (${JSON.stringify(settled.loaderMeasurements)})`);
    if (scenario.reducedMotion) {
      assert(settled.reducedMotion && settled.animatedDisplay === 'none' && settled.fallbackDisplay !== 'none', `${scenario.id}: reduced-motion fallback is not active`);
    } else {
      assert(!settled.reducedMotion && settled.animatedDisplay !== 'none' && settled.fallbackDisplay === 'none', `${scenario.id}: animated XType presentation is not active`);
    }
    const initialScreenshot = await request(driverOrigin, `/session/${sessionId}/screenshot`);
    await writeFile(path.join(evidenceDir, `${scenario.id}-run-${runNumber}-initial.png`), Buffer.from(String(initialScreenshot || ''), 'base64'));
    await execute(driverOrigin, sessionId, `document.querySelector('.skip-link').focus(); return document.activeElement === document.querySelector('.skip-link');`)
      .then((focused) => assert(focused, `${scenario.id}: skip link cannot receive focus`));
    for (const tag of LAZY_COMPONENTS) {
      await execute(driverOrigin, sessionId, `const target = document.querySelector(${JSON.stringify(tag)}); if (target) target.scrollIntoView({ block: 'center' }); return Boolean(target);`);
      await waitUntil(async () => {
        const snapshot = await readSnapshot(driverOrigin, sessionId);
        return snapshot.defined[tag] ? snapshot : null;
      }, `${scenario.id}: ${tag} did not hydrate near the viewport`);
    }
    const afterScroll = await readSnapshot(driverOrigin, sessionId);
    assert(afterScroll.classicCodeText && afterScroll.classicCodeText.includes('<meta name="xtend-preload"'), `${scenario.id}: classic code example is not decoded as source text`);
    assert(!afterScroll.classicCodeText.includes('&lt;'), `${scenario.id}: classic code example contains double-escaped markup`);
    assert(afterScroll.classicCodePaddingTop >= 10 && afterScroll.classicCodePaddingInlineStart >= 8, `${scenario.id}: classic code example lacks Docs-aligned content padding (${JSON.stringify({ top: afterScroll.classicCodePaddingTop, inlineStart: afterScroll.classicCodePaddingInlineStart })})`);
    assert(afterScroll.classicCodeSectionOverflowX <= 1 && afterScroll.classicCodeOverflowX <= 1, `${scenario.id}: classic code example overflows (${JSON.stringify({ section: afterScroll.classicCodeSectionOverflowX, code: afterScroll.classicCodeOverflowX })})`);
    assert(afterScroll.classicCodeContained, `${scenario.id}: classic code example is not contained by its section`);
    assert(afterScroll.footerFullBleed, `${scenario.id}: footer does not cover the full viewport width`);
    assert(afterScroll.githubIconCount === 3 && afterScroll.githubIconsReady, `${scenario.id}: GitHub Invertocat icons are incomplete (${JSON.stringify({ count: afterScroll.githubIconCount, ready: afterScroll.githubIconsReady })})`);
    const logs = await request(driverOrigin, `/session/${sessionId}/log`, 'POST', { type: 'browser' }).catch(() => []);
    const severeLogs = (Array.isArray(logs) ? logs : []).filter((entry) => String(entry.level || '').toUpperCase() === 'SEVERE');
    const knownLoaderDiagnostics = severeLogs.filter((entry) => {
      const message = String(entry.message || '');
      return message.includes('XTend API Initialisierung fehlgeschlagen:')
        && message.includes('x-dialog wurde geladen, hat aber keinen gueltigen Runtime-Contract');
    });
    const unexpectedSevereLogs = severeLogs.filter((entry) => !knownLoaderDiagnostics.includes(entry));
    assert(unexpectedSevereLogs.length === 0, `${scenario.id}: severe browser logs ${JSON.stringify(unexpectedSevereLogs)}`);
    const screenshot = await request(driverOrigin, `/session/${sessionId}/screenshot`);
    await writeFile(path.join(evidenceDir, `${scenario.id}-run-${runNumber}.png`), Buffer.from(String(screenshot || ''), 'base64'));
    return { initial, settled, afterScroll, severeLogs, knownLoaderDiagnostics, unexpectedSevereLogs };
  } finally {
    await request(driverOrigin, `/session/${sessionId}`, 'DELETE').catch(() => {});
  }
}

function median(values) {
  const sorted = values.slice().sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
}

const chromeDriver = findCommand(['chromedriver', '/usr/bin/chromedriver']);
if (!chromeDriver) {
  process.stdout.write('XTend landing page browser smoke skipped: chromedriver not found\n');
  process.exit(0);
}

await mkdir(evidenceDir, { recursive: true });
const pagePort = await freePort();
const driverPort = await freePort();
const pageServer = spawn(process.execPath, ['scripts/serve_xtend_dev.js', '--port', String(pagePort)], {
  cwd: rootDir,
  stdio: ['ignore', 'pipe', 'pipe']
});
const driver = spawn(chromeDriver, [`--port=${driverPort}`], {
  cwd: rootDir,
  stdio: ['ignore', 'pipe', 'pipe']
});
pageServer.stdout.resume();
pageServer.stderr.resume();
driver.stdout.resume();
driver.stderr.resume();

try {
  const pageOrigin = `http://127.0.0.1:${pagePort}`;
  const driverOrigin = `http://127.0.0.1:${driverPort}`;
  await waitForServer(pageOrigin, pageServer);
  await waitForDriver(driverOrigin, driver);
  const report = { schema: 'xtend.landing-page.browser-report.v1', runsPerScenario: RUNS_PER_SCENARIO, scenarios: {} };
  for (const scenario of scenarios) {
    const runs = [];
    for (let runNumber = 1; runNumber <= RUNS_PER_SCENARIO; runNumber += 1) {
      runs.push(await runSingle(driverOrigin, pageOrigin, scenario, runNumber));
    }
    const fcpMedianMs = median(runs.map((run) => run.settled.fcpMs));
    const lcpMedianMs = median(runs.map((run) => run.settled.lcpMs));
    const clsMedian = median(runs.map((run) => run.settled.cls));
    assert(fcpMedianMs <= scenario.fcpBudgetMs, `${scenario.id}: median FCP ${fcpMedianMs}ms exceeds ${scenario.fcpBudgetMs}ms`);
    assert(lcpMedianMs <= LCP_BUDGET_MS, `${scenario.id}: median LCP ${lcpMedianMs}ms exceeds ${LCP_BUDGET_MS}ms`);
    assert(clsMedian <= CLS_BUDGET, `${scenario.id}: median CLS ${clsMedian} exceeds ${CLS_BUDGET} (${JSON.stringify(runs.map((run) => run.settled.shifts))})`);
    report.scenarios[scenario.id] = { scenario, fcpMedianMs, lcpMedianMs, clsMedian, runs };
  }
  await writeFile(path.join(evidenceDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ status: 'passed', report: path.relative(rootDir, path.join(evidenceDir, 'report.json')), scenarios: Object.fromEntries(Object.entries(report.scenarios).map(([id, value]) => [id, { fcpMedianMs: value.fcpMedianMs, lcpMedianMs: value.lcpMedianMs, clsMedian: value.clsMedian }])) }, null, 2)}\n`);
} finally {
  stopProcess(driver);
  stopProcess(pageServer);
}
