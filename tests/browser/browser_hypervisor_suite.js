'use strict';

const path = require('path');
const { createSuiteContext, printSuiteReport } = require('../utils/assertions');
const { readText, resolveRootDir } = require('../utils/files');
const {
  BROWSER_HYPERVISOR_EVIDENCE_SCHEMA,
  BROWSER_HYPERVISOR_MATRIX_SCHEMA,
  BROWSER_HYPERVISOR_SCHEMA,
  TARGET_ENGINES,
  createCapabilities,
  createEvidence,
  defaultDriverForEngine,
  mergeEvidence,
  normalizeEngine,
  parseEndpoint,
  sha256,
  validateEvidence
} = require('../../tools/browser-hypervisor');

async function runBrowserHypervisorSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({ id: 'browser-hypervisor', label: 'XTend Browser Hypervisor' });
  const hypervisorSource = readText('tools/browser-hypervisor/index.js', rootDir);
  context.assert(BROWSER_HYPERVISOR_SCHEMA === 'xtend.browser-hypervisor.v1', 'Hypervisor declares its contract schema');
  context.assert(BROWSER_HYPERVISOR_EVIDENCE_SCHEMA === 'xtend.browser-hypervisor-evidence.v1', 'Hypervisor declares engine evidence schema');
  context.assert(BROWSER_HYPERVISOR_MATRIX_SCHEMA === 'xtend.browser-hypervisor-evidence-matrix.v1', 'Hypervisor declares matrix evidence schema');
  context.assert(TARGET_ENGINES.join('|') === 'chromium|firefox|webkit', 'Target matrix contains Chromium, Firefox and WebKit');
  context.assert(normalizeEngine('chrome') === 'chromium' && normalizeEngine('geckodriver') === 'firefox' && normalizeEngine('safari') === 'webkit', 'Engine aliases normalize independently of the host OS');
  context.assert(defaultDriverForEngine('chromium') === 'chromedriver' && defaultDriverForEngine('firefox') === 'geckodriver' && defaultDriverForEngine('webkit') === 'safaridriver', 'Engine adapters own driver selection');
  const endpoint = parseEndpoint('https://webdriver.example.test/wd/hub');
  context.assert(endpoint.protocol === 'https:' && endpoint.port === 443 && endpoint.prefix === '/wd/hub', 'Remote W3C WebDriver endpoints preserve protocol, port and prefix');
  const chromiumCapabilities = createCapabilities({ engine: 'chromium', browserBinary: '/opt/chromium' }).capabilities.alwaysMatch;
  const firefoxCapabilities = createCapabilities({ engine: 'firefox', browserBinary: '/opt/firefox' }).capabilities.alwaysMatch;
  const safariCapabilities = createCapabilities({ engine: 'webkit' }).capabilities.alwaysMatch;
  context.assert(chromiumCapabilities.browserName === 'chrome' && chromiumCapabilities['goog:chromeOptions'].args.includes('--headless=new') && chromiumCapabilities['goog:chromeOptions'].binary === '/opt/chromium', 'Chromium adapter supplies deterministic headless capabilities and accepts an injected binary');
  context.assert(firefoxCapabilities.browserName === 'firefox' && firefoxCapabilities['moz:firefoxOptions'].binary === '/opt/firefox', 'Firefox adapter accepts injected binaries without consumer OS checks');
  context.assert(safariCapabilities.browserName === 'safari' && !safariCapabilities['goog:chromeOptions'], 'WebKit adapter does not inherit Chromium capabilities');

  const harness = '<!doctype html><script>window.result={status:"passed"}</script>';
  const items = TARGET_ENGINES.map((engine) => createEvidence({
    runId: 'NFM-OBS-2026-09-03',
    capturedAt: '2026-09-03T00:00:00Z',
    engine,
    browserVersion: 'test',
    driverVersion: 'test',
    harness: 'tests/browser/fixtures/observatory-adoption-lab.html',
    harnessText: harness,
    status: engine === 'webkit' ? 'unsupported-with-valid-fallback' : 'passed',
    result: { status: 'passed' }
  }));
  context.assert(items.every((entry) => validateEvidence(entry, { runId: 'NFM-OBS-2026-09-03', harnessSha256: sha256(harness) }).length === 0), 'Terminal per-engine evidence validates');
  const matrix = mergeEvidence(items, { runId: 'NFM-OBS-2026-09-03' });
  context.assert(matrix.status === 'passed' && matrix.engineCount === 3 && matrix.noInfrastructureResiduals, 'Complete engine matrix merges without infrastructure residuals');
  context.assert(mergeEvidence(items.slice(0, 2), { runId: 'NFM-OBS-2026-09-03' }).status === 'failed', 'Matrix rejects a missing target engine');
  const stale = items.map((entry) => ({ ...entry }));
  stale[1].harnessSha256 = '0'.repeat(64);
  context.assert(mergeEvidence(stale, { runId: 'NFM-OBS-2026-09-03' }).status === 'failed', 'Matrix rejects mismatched harness hashes');
  context.assert(validateEvidence({ ...items[0], status: 'residual' }).includes('evidence status is not terminal'), 'Hypervisor rejects infrastructure residual as evidence');
  context.assert(path.basename(require.resolve('../../tools/browser-hypervisor')) === 'index.js', 'Consumers resolve one shared Hypervisor module');
  ['/session/${sessionId}/actions', '/session/${sessionId}/screenshot', '/session/${sessionId}/window/rect', 'Browser fixture did not publish', 'stopDriver(child,'].forEach((token) => {
    context.assertIncludes(hypervisorSource, token, `Hypervisor owns ${token}`);
  });
  [
    'tests/browser/browser_smoke_suite.js',
    'tests/browser/material_browser_evidence_suite.js',
    'tests/rmt/super_prewarm_worker_experiment_suite.js',
    'tools/rmt-language/vnext-source-to-sea.js'
  ].forEach((consumerPath) => {
    const source = readText(consumerPath, rootDir);
    context.assertIncludes(source, 'browser-hypervisor', `${consumerPath} delegates to the shared Hypervisor`);
    context.assert(!source.includes("require('child_process')") && !source.includes('/System/Cryptexes/App/usr/bin/safaridriver') && !source.includes('/usr/bin/chromedriver') && !source.includes('process.platform'), `${consumerPath} has no browser lifecycle, OS or executable-path special case`);
  });
  [
    'tests/products/xtend_material_catfooding_suite.js',
    'tests/products/xtend_material_cli_generated_app_suite.js',
    'tests/maraca/maraca_app_services_build_suite.js',
    'tests/maraca/maraca_suite.js'
  ].forEach((consumerPath) => {
    const source = readText(consumerPath, rootDir);
    context.assertIncludes(source, 'browser-hypervisor', `${consumerPath} delegates browser execution to the shared Hypervisor`);
    ['/usr/bin/chromium', '/Applications/', '--dump-dom', '--headless', 'DevTools', 'WebSocket'].forEach((token) => {
      context.assert(!source.includes(token), `${consumerPath} has no consumer-owned ${token} browser path`);
    });
  });
  const rmtCaptureSource = readText('scripts/capture_rmt_vnext_source_to_sea_evidence.js', rootDir);
  context.assertIncludes(rmtCaptureSource, '../tools/rmt-language/vnext-source-to-sea', 'RMT capture wrapper delegates to the Hypervisor-backed Source-to-Sea tool');
  ['/usr/bin/chromium', '/Applications/', '--dump-dom', '--headless', 'DevTools', 'WebSocket'].forEach((token) => {
    context.assert(!rmtCaptureSource.includes(token), `RMT capture wrapper has no consumer-owned ${token} browser path`);
  });

  await require('./browser_hypervisor_transport_checks').runTransportChecks(context);
  return context.result({ report: {
    schema: BROWSER_HYPERVISOR_MATRIX_SCHEMA,
    status: 'passed',
    engines: TARGET_ENGINES,
    adapterCount: 5,
    noRuntimeDependencies: true,
    noInfrastructureResiduals: true
  } });
}

function printBrowserHypervisorReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Browser Hypervisor erfolgreich.',
    failureTitle: 'XTend Browser Hypervisor fehlgeschlagen:'
  });
}

module.exports = { printBrowserHypervisorReport, runBrowserHypervisorSuite };
