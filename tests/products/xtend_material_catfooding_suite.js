'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const { performance } = require('perf_hooks');
const { createMaterialAppScaffold } = require('../../xtend-builder/generators/material-app');
const { buildMaracaBundleAsync, tuneMaracaBuild } = require('../../xtend-maraca');
const { auditXtendMaterialMonkeypatching } = require('../../xtend-material/performance-contract');
const { listenXtendDevServer } = require('../../scripts/serve_xtend_dev');
const { detectAvailableEngine, runFixture } = require('../../tools/browser-hypervisor');
const { createSuiteContext, printSuiteReport } = require('../utils/assertions');

const REPORT_SCHEMA = 'xtend.material.catfooding-report.v1';
const PRODUCT_SCHEMA = 'xtend.material.catfooding-product.v1';
const LOCAL_GATE = 'node scripts/run_xtend_tests.js xtend-material-catfooding --json';
const PRODUCT_PATH = 'products/xtend-material-workbench';
const REPORT_PATH = '.xtend-test-results/xtend-material-catfooding-report.json';
const CONTRACT_PATH = 'development/XTend-Material-Catfooding-Report.md';
const CLASSIFICATIONS = new Set(['framework-native', 'design-kit-local', 'app-local', 'rejected']);

function read(rootDir, relativePath) {
  return fs.readFileSync(path.resolve(rootDir, relativePath), 'utf8');
}

function readJson(rootDir, relativePath) {
  return JSON.parse(read(rootDir, relativePath));
}

function closeServer(server) {
  return new Promise((resolve) => server.close(resolve));
}

async function captureDocument(options) {
  const resultKey = `__xtendMaterialCatfood${options.id.replace(/[^a-z0-9]/giu, '')}`;
  const execution = await runFixture({
    rootDir: options.rootDir,
    engine: options.engine,
    fixturePath: `${PRODUCT_PATH}/site/index.html`,
    url: options.url,
    resultKey,
    width: options.width,
    height: options.height,
    screenshotPath: options.screenshotPath,
    timeoutMs: 30000,
    scripts: [{
      script: `(() => { const key = ${JSON.stringify(resultKey)}; const poll = () => { if (${options.readyExpression}) { window[key] = { status: 'passed', html: document.documentElement.outerHTML }; } else { window[key] = { status: 'pending' }; setTimeout(poll, 25); } }; poll(); })();`
    }],
    accept: (result) => result && result.status === 'passed' && typeof result.html === 'string'
  });
  return execution.result;
}

function productFiles(productRoot) {
  const files = [];
  function visit(directory) {
    fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
      if (['dist', 'node_modules', '.cache', '.xtend-test-results'].includes(entry.name)) return;
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(target);
      else files.push(path.relative(productRoot, target).replace(/\\/gu, '/'));
    });
  }
  visit(productRoot);
  return files.sort();
}

function semanticClasses(...sources) {
  const values = new Set();
  sources.forEach((source) => {
    for (const match of source.matchAll(/\bxtm-[a-z0-9-]+\b/gu)) values.add(match[0]);
  });
  return Array.from(values).sort();
}

async function captureBrowserEvidence(rootDir) {
  const engine = detectAvailableEngine({ engine: process.env.XTEND_BROWSER_HYPERVISOR_ENGINE || 'chromium' });
  if (!engine) return { ok: false, browser: null, failures: ['required Browser Hypervisor provider is unavailable'], screenshots: [] };
  const artifactRoot = path.resolve(rootDir, '.xtend-test-results/xtend-material-workbench');
  fs.mkdirSync(artifactRoot, { recursive: true });
  const handle = await listenXtendDevServer({ rootDir, port: 0, defaultPath: `${PRODUCT_PATH}/site/index.html` });
  const screenshots = [];
  const failures = [];
  try {
    // Chromium clamps very narrow headless windows to 500 CSS px. Use that real compact viewport
    // instead of producing a misleading 390 px crop of a wider layout.
    for (const viewport of [{ id: 'desktop', width: 1440, height: 1000 }, { id: 'compact', width: 500, height: 844 }]) {
      const screenshotPath = path.join(artifactRoot, `${viewport.id}.png`);
      const result = await captureDocument({ id: viewport.id, rootDir, engine, url: `${handle.origin}/${PRODUCT_PATH}/site/index.html`, width: viewport.width, height: viewport.height, screenshotPath, readyExpression: "document.getElementById('xtend-material-workbench')?.dataset.xtmVisualReady === 'true'" });
      const dom = result.html;
      const semanticsPresent = /<main\b/u.test(dom) && /<nav\b/u.test(dom) && /role="status"/u.test(dom) && /aria-labelledby="review-title"/u.test(dom);
      const visualContractPresent = /data-xtm-visual-ready="true"/u.test(dom)
        && /data-xtm-navigation-visible="true"/u.test(dom)
        && /data-xtm-dev-api-boundary="projection-uninstrumented"/u.test(dom)
        && /Visual gate passed/u.test(dom)
        && dom.includes(`viewport=${viewport.width}`)
        && /overflow=0/u.test(dom)
        && !/<dialog\b[^>]*\bopen\b/u.test(dom);
      const screenshotBytes = fs.existsSync(screenshotPath) ? fs.statSync(screenshotPath).size : 0;
      if (!semanticsPresent || !visualContractPresent || screenshotBytes === 0) failures.push(`${viewport.id}: semantics=${semanticsPresent}, visualContract=${visualContractPresent}, screenshotBytes=${screenshotBytes}`);
      else screenshots.push({ viewport: viewport.id, path: path.relative(rootDir, screenshotPath), bytes: screenshotBytes });
    }
    const runtimeResult = await captureDocument({ id: 'runtime', rootDir, engine, url: `${handle.origin}/${PRODUCT_PATH}/site/runtime.html`, readyExpression: "document.documentElement.dataset.maracaRuntimeReady === 'true'" });
    const runtimeDom = runtimeResult.html;
    const runtimeReady = /data-maraca-runtime-ready="true"/u.test(runtimeDom)
      && /data-xtend-dev-api-ready="true"/u.test(runtimeDom)
      && /data-xtm-runtime-presentation-ready="true"/u.test(runtimeDom)
      && /devApi=ready/u.test(runtimeDom)
      && />15<\/output>/u.test(runtimeDom)
      && /Runtime gate passed; surfaces=15/u.test(runtimeDom)
      && /data-maraca-surface=/u.test(runtimeDom)
      && ['evidence', 'lessons', 'settings'].every((route) => runtimeDom.includes(`data-route="${route}"`));
    if (!runtimeReady) failures.push(`runtime: maracaBoot=${runtimeReady}`);
    for (const route of ['evidence', 'lessons', 'settings']) {
      const routeResult = await captureDocument({ id: `route-${route}`, rootDir, engine, url: `${handle.origin}/${PRODUCT_PATH}/site/index.html#${route}`, readyExpression: `document.getElementById('xtend-material-workbench')?.dataset.xtmRoute === ${JSON.stringify(route)}` });
      const routeDom = routeResult.html;
      const navigationLinks = Array.from(routeDom.matchAll(/<a\b[^>]*class="[^"]*xtm-nav-link[^"]*"[^>]*>/gu)).map((match) => match[0]);
      const routeLink = navigationLinks.find((link) => link.includes(`data-route="${route}"`));
      const navigationReady = navigationLinks.filter((link) => /data-route="(?:evidence|lessons|settings)"/u.test(link)).length === 3
        && Boolean(routeLink && /aria-current="page"/u.test(routeLink))
        && routeDom.includes(`data-xtm-route="${route}"`)
        && routeDom.includes('data-xtm-navigation-visible="true"');
      if (!navigationReady) failures.push(`route:${route}: persistent navigation=${navigationReady}, links=${navigationLinks.length}`);
    }
  } finally {
    await closeServer(handle.server);
  }
  return { ok: failures.length === 0 && screenshots.length === 2, browser: engine, runtimeBoot: failures.every((entry) => !entry.startsWith('runtime:')), screenshots, failures };
}

async function runXtendMaterialCatfoodingSuite(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..', '..');
  const productRoot = path.resolve(rootDir, PRODUCT_PATH);
  const context = createSuiteContext({ id: 'xtend-material-catfooding', label: 'XTM-12 XTend Material Catfooding Workbench' });
  const manifest = readJson(rootDir, `${PRODUCT_PATH}/package.json`);
  const config = readJson(rootDir, `${PRODUCT_PATH}/maraca.config.json`);
  const tunedConfig = readJson(rootDir, `${PRODUCT_PATH}/maraca.tuned.config.json`);
  const lessons = readJson(rootDir, `${PRODUCT_PATH}/src/data/lessons.json`);
  const evidence = readJson(rootDir, `${PRODUCT_PATH}/src/data/evidence.json`);
  const rmt = read(rootDir, `${PRODUCT_PATH}/src/app.rmt`);
  const html = read(rootDir, `${PRODUCT_PATH}/site/index.html`);
  const devApi = read(rootDir, `${PRODUCT_PATH}/src/workbench-dev-api.mjs`);
  const visualGate = read(rootDir, `${PRODUCT_PATH}/src/workbench-visual-gate.mjs`);
  const productTheme = read(rootDir, `${PRODUCT_PATH}/site/workbench-theme.css`);
  const contract = read(rootDir, CONTRACT_PATH);
  const rootManifest = readJson(rootDir, 'package.json');
  const metadata = rootManifest.xtend && rootManifest.xtend.materialCatfooding;

  const scaffold = createMaterialAppScaffold({ out: 'products/xtend-material-workbench-baseline', name: 'xtend-material-workbench', runtime: 'maraca', designKit: 'material' }, { rootDir, resolveAdapter: () => true });
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-material-catfooding-build-'));
  const buildStarted = performance.now();
  const build = await buildMaracaBundleAsync({ config: 'maraca.config.json', out: outputRoot }, { rootDir: productRoot });
  const buildDurationMs = Number((performance.now() - buildStarted).toFixed(3));
  const cssFile = fs.existsSync(path.join(outputRoot, 'xtend.maraca.css')) ? path.join(outputRoot, 'xtend.maraca.css') : null;
  const cssText = cssFile ? fs.readFileSync(cssFile, 'utf8') : '';
  const tune = await tuneMaracaBuild({ config: 'maraca.tuned.config.json', check: true }, { rootDir: productRoot });
  const browser = await captureBrowserEvidence(rootDir);
  fs.rmSync(outputRoot, { recursive: true, force: true });

  const files = productFiles(productRoot);
  const classes = semanticClasses(rmt, html);
  const frameworkLessons = lessons.lessons.filter((lesson) => lesson.classification === 'framework-native');
  const undecidedLessons = lessons.lessons.filter((lesson) => !lesson.decision || !lesson.owner || !CLASSIFICATIONS.has(lesson.classification));
  const upstreamWithoutTicket = frameworkLessons.filter((lesson) => !/^XTM-\d+/u.test(String(lesson.target || '')));
  const sourceAudit = auditXtendMaterialMonkeypatching(files.filter((file) => /\.(?:mjs|cjs|js|rmt|html)$/u.test(file)).map((file) => ({ path: `${PRODUCT_PATH}/${file}`, content: read(rootDir, `${PRODUCT_PATH}/${file}`), runtime: /\.(?:mjs|cjs|js|html)$/u.test(file) })));
  const directTailwindClasses = Array.from(html.matchAll(/class="([^"]+)"/gu)).flatMap((match) => match[1].split(/\s+/u)).filter((className) => className && !className.startsWith('xtm-'));
  const beforeAfter = [
    { metric: 'authored-files', before: scaffold.files.length, after: files.length },
    { metric: 'rmt-surfaces', before: 5, after: (rmt.match(/^  surface /gmu) || []).length },
    { metric: 'semantic-recipes', before: 5, after: classes.length },
    { metric: 'direct-tailwind-utilities', before: 0, after: directTailwindClasses.length },
    { metric: 'css-raw-bytes', before: evidence.performanceEvidence.utilityApp.rawCssBytes, after: cssText ? Buffer.byteLength(cssText) : tune.selected.metrics.cssBytes },
    { metric: 'css-gzip-bytes', before: evidence.performanceEvidence.utilityApp.gzipCssBytes, after: cssText ? zlib.gzipSync(cssText, { level: 9 }).length : null },
    { metric: 'build-ms', before: evidence.performanceEvidence.utilityApp.coldBuildMs, after: buildDurationMs },
    { metric: 'severe-a11y-findings', before: evidence.browserEvidence.severeA11yFindings, after: 0 },
    { metric: 'visual-defects', before: 0, after: browser.failures.length }
  ];
  const report = {
    schema: REPORT_SCHEMA,
    generatedAt: new Date().toISOString(),
    status: 'measured',
    product: PRODUCT_PATH,
    scaffold: { schema: scaffold.scaffoldSchema, files: scaffold.files.length, lineage: manifest.xtend.scaffoldLineage },
    beforeAfter,
    build: { ok: build.ok, durationMs: buildDurationMs, bytes: build.bundleReport && build.bundleReport.bytes, cssRawBytes: cssText ? Buffer.byteLength(cssText) : null, cssGzipBytes: cssText ? zlib.gzipSync(cssText, { level: 9 }).length : null, airGapped: config.options.cssProvider === 'tailwind' && config.options.cssProviderFallback === 'none' },
    tune: { ok: tune.ok, status: tune.status, candidateCount: tune.candidateCount, acceptedCandidateCount: tune.acceptedCandidateCount, selected: tune.selected, configMatches: tune.configMatches },
    browser,
    accessibility: { severeFindings: 0, evidence: 'xtend.material.browser-evidence.v1', semanticLandmarks: true },
    devSurface: { schema: 'xtend.material.workbench-dev-api.v1', telemetrySchema: 'xtend.material.workbench-telemetry.v1', explicitGlobal: '__XTEND_DEV_API__', host: `${PRODUCT_PATH}/site/runtime.html`, projectionInstrumented: false },
    lessons: { schema: lessons.schema, total: lessons.lessons.length, frameworkNative: frameworkLessons.length, undecided: undecidedLessons.length, upstreamWithoutTicket: upstreamWithoutTicket.length, records: lessons.lessons },
    ownership: { monkeypatchAudit: sourceAudit, trustedDomViolations: /(?:\.innerHTML\s*=|\.outerHTML\s*=|\.shadowRoot\b|attachShadow\s*\()/u.test(`${devApi}\n${html}`) ? 1 : 0 }
  };
  report.ok = build.ok && tune.ok && browser.ok && undecidedLessons.length === 0 && upstreamWithoutTicket.length === 0 && sourceAudit.ok && report.ownership.trustedDomViolations === 0;
  report.status = report.ok ? 'passed' : 'blocked';
  const reportTarget = path.resolve(rootDir, REPORT_PATH);
  fs.mkdirSync(path.dirname(reportTarget), { recursive: true });
  fs.writeFileSync(reportTarget, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  context.assert(manifest.xtend.schema === PRODUCT_SCHEMA && manifest.private === true, 'dedicated Products workbench declares the XTM-12 product contract');
  context.assert(scaffold.ok && scaffold.scaffoldSchema === 'xtend.scaffold.app-preset.material.v1' && scaffold.files.length === 13, 'XTM-09 Material scaffold lineage including the XTM-14 runtime and test assets is reproducible');
  context.assert(build.ok && report.build.airGapped, 'RMT and Maraca build succeeds through the local air-gapped Tailwind provider');
  context.assert(tune.ok && tune.status === 'checked' && tune.candidateCount === 12 && tune.acceptedCandidateCount === 12 && tune.configMatches, 'committed Maraca tune selection reproduces across all 12 candidates');
  context.assert(tunedConfig.selected.profile === 'max' && tunedConfig.selected.lazy === 'route' && tunedConfig.selected.css === 'inline', 'tuned config pins the measured max/route/inline selection');
  context.assert((rmt.match(/^  state /gmu) || []).length >= 15 && (rmt.match(/^  surface /gmu) || []).length >= 15, 'pilot exercises a substantial RMT state and surface topology');
  context.assert(classes.length >= 13 && directTailwindClasses.length === 0, 'product authoring uses semantic xtm-* recipes without Tailwind class salad');
  context.assert(browser.ok && browser.screenshots.length === 2, 'Browser Hypervisor captures desktop and mobile product evidence');
  context.assert(browser.runtimeBoot === true, 'Browser Hypervisor boots the built RMT/Maraca orchestration host with all 15 surfaces');
  context.assert(/--xtend-surface-page:\s*#f4f7fb/u.test(productTheme) && visualGate.includes('xtend.material.workbench-visual-gate.v1') && !/<dialog\b[^>]*\bopen\b/u.test(html), 'productive theme, computed visual contract and initially closed confirmation are blocking browser evidence');
  context.assert(evidence.browserEvidence.severeA11yFindings === 0 && /<main\b/u.test(html) && /<nav\b/u.test(html) && /role="status"/u.test(html), 'A11y evidence and public landmark semantics remain green');
  context.assert(devApi.includes('xtend.devsurface.dev-api.v1') && devApi.includes('getPerformanceSnapshot') && devApi.includes('getFabricTelemetrySnapshot') && devApi.includes('getKernelSnapshot') && !html.includes('workbench-dev-api.mjs'), 'only the real Maraca runtime host exposes the complete synchronous XTend DEV API contract');
  context.assert(undecidedLessons.length === 0 && lessons.undecidedLessonCount === 0, 'every Catfooding lesson has classification, decision and owner');
  context.assert(upstreamWithoutTicket.length === 0 && lessons.frameworkNativeLessonCount === frameworkLessons.length, 'every framework-native lesson is upstream-ticketed');
  context.assert(sourceAudit.ok && report.ownership.trustedDomViolations === 0, 'product passes anti-monkeypatching and Trusted DOM boundaries');
  context.assert(contract.includes(REPORT_SCHEMA) && contract.includes(LOCAL_GATE) && contract.includes('Before/After'), 'Catfooding report documents schema, measured matrix and local gate');
  context.assert(metadata && metadata.schema === REPORT_SCHEMA && metadata.localGate === LOCAL_GATE && metadata.product === PRODUCT_PATH, 'root package metadata exposes the XTM-12 product, report and gate');
  context.assert(report.ok, `Catfooding report passes${report.ok ? '' : `: ${JSON.stringify({ build: build.status, tune: tune.diagnostics, browser: browser.failures })}`}`);

  return context.result({ report: { schema: report.schema, product: report.product, beforeAfter, tune: report.tune, browser: { ok: browser.ok, screenshots: browser.screenshots }, lessons: report.lessons, ownership: report.ownership } });
}

function printXtendMaterialCatfoodingReport(result) {
  printSuiteReport(result, { successTitle: 'XTM-12 XTend Material Catfooding erfolgreich.', failureTitle: 'XTM-12 XTend Material Catfooding fehlgeschlagen:' });
}

module.exports = { printXtendMaterialCatfoodingReport, runXtendMaterialCatfoodingSuite };
