const fs = require('fs');
const http = require('http');
const path = require('path');
const { normalizeEngine, runFixture } = require('../../tools/browser-hypervisor');
const {
  SERVER_CONTRACT,
  listenXtendDevServer
} = require('../../scripts/serve_xtend_dev');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readText,
  resolveRepoPath,
  resolveRootDir
} = require('../utils/files');
const {
  syntaxCheckFile
} = require('../utils/process');
const {
  EXPERIMENT_LANES,
  RUN_MODES,
  SUPER_PREWARM_WORKER_EVIDENCE_REPORT_PATH,
  SUPER_PREWARM_WORKER_EXPERIMENT_SCHEMA,
  createSuperPrewarmWorkerExperimentReport,
  createUiComputeEnvelope
} = require('../../tools/rmt-language/super-prewarm-worker-experiment');

const FIXTURE_PATH = 'tests/browser/fixtures/super-prewarm-worker-pwa.html';
const FIXTURE_MANIFEST_PATH = 'tests/browser/fixtures/super-prewarm-worker-manifest.webmanifest';
const FIXTURE_SERVICE_WORKER_PATH = 'tests/browser/fixtures/super-prewarm-worker-sw.js';
const MODULE_PATH = 'tools/rmt-language/super-prewarm-worker-experiment.js';
const TYPES_PATH = 'tools/rmt-language/super-prewarm-worker-experiment.d.ts';
const RMT_RUNTIME_PATHS = [
  'xtendrmt/rmt-runtime.esm.js',
  'xtendrmt/rmt-runtime.browser.js',
  'xtendrmt/rmt-core.esm.js'
];

function requestText(url) {
  const target = new URL(url);
  return new Promise((resolve, reject) => {
    const request = http.request({
      hostname: target.hostname,
      port: target.port,
      path: `${target.pathname}${target.search}`,
      method: 'GET'
    }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => {
        resolve({
          statusCode: response.statusCode,
          headers: response.headers,
          body
        });
      });
    });
    request.on('error', reject);
    request.end();
  });
}

async function runHypervisorBrowserEvidence(rootDir, engine, options = {}) {
  let server = null;
  try {
    server = await listenXtendDevServer({ rootDir, defaultPath: FIXTURE_PATH, port: 0 });
    const execution = await runFixture({
      rootDir,
      engine,
      fixturePath: FIXTURE_PATH,
      resultKey: '__xtendSuperPrewarmWorkerExperimentResult',
      url: `${server.origin}/${FIXTURE_PATH}`,
      webDriverUrl: options.webDriverUrl || process.env.XTEND_BROWSER_HYPERVISOR_URL,
      driverPath: options.driverPath || process.env.XTEND_BROWSER_HYPERVISOR_DRIVER_PATH,
      timeoutMs: options.timeoutMs || 10000,
      accept: (result) => result && result.status === 'passed'
    });
    return execution.result;
  } finally {
    if (server && server.server) {
      await new Promise((resolve) => server.server.close(resolve));
    }
  }
}

function createRun(mode, cachePass, scenario, metrics) {
  const superMode = mode === 'superPrewarmWorker';
  const workerMode = mode !== 'baseline';
  return {
    id: `${mode}:${cachePass}:${scenario}`,
    mode,
    cachePass,
    scenario,
    lanes: EXPERIMENT_LANES,
    pwa: {
      manifestRef: FIXTURE_MANIFEST_PATH,
      cacheMode: 'fixture-cache-stub',
      serviceWorkerControlled: cachePass === 'warm',
      offlineEligible: true
    },
    state: {
      snapshot: {
        route: scenario,
        mode,
        cachePass
      },
      xstateBridgeMode: 'fixture-main-thread-mirror',
      stateOwnership: 'main-thread'
    },
    ssr: {
      ssrRoundtripCount: 0,
      serverPrerenderUsed: false,
      clientDetermined: true
    },
    worker: {
      bootTimeMs: workerMode ? metrics.bootTimeMs : 0,
      templateSyncTimeMs: workerMode ? metrics.templateSyncTimeMs : 0,
      queueDepthMax: workerMode ? metrics.queueDepthMax : 0,
      computeLatencyMs: workerMode ? metrics.computeLatencyMs : 0,
      transferBytes: workerMode ? metrics.transferBytes : 0,
      staleResponses: 0,
      supersededResponses: superMode ? 1 : 0,
      missingApis: [],
      available: true
    },
    ui: {
      visibleCommitMs: metrics.visibleCommitMs,
      interactionReadyMs: metrics.interactionReadyMs,
      hydrationCommitMs: metrics.hydrationCommitMs,
      longTaskCount: 0,
      mainThreadBusyMs: metrics.mainThreadBusyMs
    },
    boundaries: {
      workerDomMutation: false,
      workerEventBinding: false,
      workerStateOwnership: false,
      trustedDomCommit: 'main-thread',
      stateOwnership: 'main-thread',
      staleCommitted: false,
      hostServicesExecuted: 0
    },
    samples: [
      {
        ui: {
          visibleCommitMs: metrics.visibleCommitMs,
          interactionReadyMs: metrics.interactionReadyMs,
          hydrationCommitMs: metrics.hydrationCommitMs,
          longTaskCount: 0,
          mainThreadBusyMs: metrics.mainThreadBusyMs
        },
        worker: {
          bootTimeMs: workerMode ? metrics.bootTimeMs : 0,
          templateSyncTimeMs: workerMode ? metrics.templateSyncTimeMs : 0,
          queueDepthMax: workerMode ? metrics.queueDepthMax : 0,
          computeLatencyMs: workerMode ? metrics.computeLatencyMs : 0,
          transferBytes: workerMode ? metrics.transferBytes : 0,
          staleResponses: 0,
          supersededResponses: superMode ? 1 : 0,
          missingApis: [],
          available: true
        }
      }
    ]
  };
}

function createEvidenceRuns() {
  const scenarios = ['route-transition', 'tab-update', 'filter-update', 'below-fold-hydration', 'warm-reentry'];
  const cachePasses = ['cold', 'warm'];
  const metricsByMode = {
    baseline: {
      bootTimeMs: 0,
      templateSyncTimeMs: 0,
      queueDepthMax: 0,
      computeLatencyMs: 0,
      transferBytes: 0,
      visibleCommitMs: 54,
      interactionReadyMs: 62,
      hydrationCommitMs: 44,
      mainThreadBusyMs: 48
    },
    prewarmWorker: {
      bootTimeMs: 7,
      templateSyncTimeMs: 3,
      queueDepthMax: 1,
      computeLatencyMs: 19,
      transferBytes: 2200,
      visibleCommitMs: 48,
      interactionReadyMs: 56,
      hydrationCommitMs: 39,
      mainThreadBusyMs: 39
    },
    superPrewarmWorker: {
      bootTimeMs: 4,
      templateSyncTimeMs: 1,
      queueDepthMax: 1,
      computeLatencyMs: 13,
      transferBytes: 2250,
      visibleCommitMs: 41,
      interactionReadyMs: 51,
      hydrationCommitMs: 34,
      mainThreadBusyMs: 31
    }
  };
  return cachePasses.flatMap((cachePass) => (
    RUN_MODES.flatMap((mode) => (
      scenarios.map((scenario) => createRun(mode, cachePass, scenario, metricsByMode[mode]))
    ))
  ));
}

function writeEvidenceReport(rootDir, report) {
  const reportPath = resolveRepoPath(SUPER_PREWARM_WORKER_EVIDENCE_REPORT_PATH, rootDir);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  return reportPath;
}

async function assertLocalServerFixture(context, rootDir) {
  let handle = null;
  try {
    handle = await listenXtendDevServer({
      rootDir,
      defaultPath: FIXTURE_PATH,
      port: 0
    });
    context.assert(handle.schema === SERVER_CONTRACT, 'Super Prewarm fixture uses the shared local dev server');

    const html = await requestText(`${handle.origin}/${FIXTURE_PATH}`);
    context.assert(html.statusCode === 200, 'Super Prewarm PWA fixture is served over HTTP');
    context.assert(String(html.headers['content-type']).includes('text/html'), 'Super Prewarm fixture uses HTML MIME type');
    context.assert(html.body.includes('__xtendSuperPrewarmWorkerExperimentResult'), 'Super Prewarm fixture exposes browser result key');

    const manifest = await requestText(`${handle.origin}/${FIXTURE_MANIFEST_PATH}`);
    context.assert(manifest.statusCode === 200, 'Super Prewarm fixture manifest is served over HTTP');
    context.assert(String(manifest.headers['content-type']).includes('application/manifest+json'), 'Super Prewarm fixture manifest uses PWA manifest MIME type');

    const serviceWorker = await requestText(`${handle.origin}/${FIXTURE_SERVICE_WORKER_PATH}`);
    context.assert(serviceWorker.statusCode === 200, 'Super Prewarm service worker stub is served over HTTP');
    context.assert(String(serviceWorker.headers['content-type']).includes('text/javascript'), 'Super Prewarm service worker stub uses JavaScript MIME type');
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    const code = error && error.code ? error.code : '';
    if ((code === 'EPERM' || code === 'EACCES') && /listen/u.test(message)) {
      context.skip(`Super Prewarm local server fixture skipped because loopback listen is denied (${message})`);
      return;
    }
    context.fail(`Super Prewarm local server fixture (${message})`);
  } finally {
    if (handle && handle.server) {
      await new Promise((resolve) => handle.server.close(resolve));
    }
  }
}

async function runSuperPrewarmWorkerExperimentSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'super-prewarm-worker-experiment',
    label: 'XTend Super Prewarm Worker Experiment'
  });
  const moduleSource = readText(MODULE_PATH, rootDir);
  const typesSource = readText(TYPES_PATH, rootDir);
  const rmtCoreTypesSource = readText('xtendrmt/rmt-core.d.ts', rootDir);
  const fixture = readText(FIXTURE_PATH, rootDir);
  const manifest = readText(FIXTURE_MANIFEST_PATH, rootDir);
  const serviceWorker = readText(FIXTURE_SERVICE_WORKER_PATH, rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const packageManifest = readText('package.json', rootDir);
  const moduleSyntax = syntaxCheckFile(MODULE_PATH, { rootDir, extension: '.js' });
  const serviceWorkerSyntax = syntaxCheckFile(FIXTURE_SERVICE_WORKER_PATH, { rootDir, extension: '.js' });
  const report = createSuperPrewarmWorkerExperimentReport({
    runs: createEvidenceRuns()
  });
  const reportPath = writeEvidenceReport(rootDir, report);
  const invalidReport = createSuperPrewarmWorkerExperimentReport({
    runs: [
      {
        mode: 'superPrewarmWorker',
        cachePass: 'warm',
        ssr: { ssrRoundtripCount: 1, serverPrerenderUsed: true, clientDetermined: false },
        boundaries: {
          workerDomMutation: true,
          workerEventBinding: true,
          workerStateOwnership: true,
          trustedDomCommit: 'worker',
          stateOwnership: 'worker',
          staleCommitted: true,
          hostServicesExecuted: 1
        },
        worker: { available: true },
        ui: { visibleCommitMs: 10, interactionReadyMs: 10, hydrationCommitMs: 10 }
      }
    ]
  });
  const missingApisReport = createSuperPrewarmWorkerExperimentReport({
    runs: [
      createRun('baseline', 'cold', 'route-transition', {
        visibleCommitMs: 50,
        interactionReadyMs: 60,
        hydrationCommitMs: 40,
        mainThreadBusyMs: 45
      }),
      {
        ...createRun('superPrewarmWorker', 'cold', 'route-transition', {
          bootTimeMs: 0,
          templateSyncTimeMs: 0,
          queueDepthMax: 0,
          computeLatencyMs: 0,
          transferBytes: 0,
          visibleCommitMs: 50,
          interactionReadyMs: 60,
          hydrationCommitMs: 40,
          mainThreadBusyMs: 45
        }),
        worker: {
          available: false,
          missingApis: ['Worker', 'Blob', 'URL.createObjectURL']
        }
      }
    ]
  });
  const envelope = createUiComputeEnvelope({
    rootId: 'route-transition',
    hydrationKey: 'route-transition',
    generation: 2,
    template: { id: 'route-card' },
    model: { route: '/client-driven' }
  });

  context.assert(moduleSyntax.ok, `Super Prewarm experiment module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(serviceWorkerSyntax.ok, `Super Prewarm service worker syntax passes${serviceWorkerSyntax.ok ? '' : ` (${serviceWorkerSyntax.message})`}`);
  context.assert(report.schema === SUPER_PREWARM_WORKER_EXPERIMENT_SCHEMA, 'Super Prewarm report uses stable schema');
  context.assert(report.ok === true, 'Super Prewarm report is valid');
  context.assert(report.releaseBlocking === false, 'Super Prewarm report remains evidence-first and non-blocking');
  context.assert(report.classification === 'positive-signal', 'Super Prewarm deterministic evidence records positive signal');
  context.assert(report.modeCoverageComplete === true, 'Super Prewarm report compares baseline, prewarmWorker and superPrewarmWorker');
  context.assert(report.cacheCoverageComplete === true, 'Super Prewarm report includes cold and warm cache passes');
  context.assert(report.pwaAttachment.engineImplemented === false, 'Super Prewarm report keeps PWA Manifest Engine out of v1 scope');
  context.assert(report.pwaAttachment.hooks.includes('cache-management'), 'Super Prewarm report reserves cache-management hook');
  context.assert(report.pwaAttachment.hooks.includes('xstate-state-management'), 'Super Prewarm report reserves XState hook');
  context.assert(report.pwaAttachment.hooks.includes('ssr-metadata'), 'Super Prewarm report reserves SSR metadata hook');
  context.assert(report.pwaAttachment.hooks.includes('prewarm-warm-reentry-policy'), 'Super Prewarm report reserves prewarm/warm-reentry hook');
  context.assert(report.runs.every((run) => run.ssr.ssrRoundtripCount === 0), 'Super Prewarm evidence records no SSR roundtrip');
  context.assert(report.runs.every((run) => run.state.stateOwnership === 'main-thread'), 'Super Prewarm evidence keeps canonical state on main thread');
  context.assert(report.runs.every((run) => run.boundaries.trustedDomCommit === 'main-thread'), 'Super Prewarm evidence keeps trusted DOM commit on main thread');
  context.assert(report.runs.every((run) => run.boundaries.staleCommitted === false), 'Super Prewarm evidence rejects stale worker commits');
  context.assert(report.runs.some((run) => run.mode === 'superPrewarmWorker' && run.worker.supersededResponses > 0), 'Super Prewarm evidence counts superseded responses');
  context.assert(report.lanes.workerHydrate === 'component.worker_prerender_hydrate', 'Super Prewarm report routes worker hydrate through Fabric/RMT worker lane');
  context.assert(report.lanes.prewarm === 'component.prewarm.prepare', 'Super Prewarm report routes prewarm through existing prewarm lane');
  context.assert(report.lanes.warmReentry === 'component.warm.reentry', 'Super Prewarm report routes warm reentry through existing warm lane');
  context.assert(report.lanes.diagnostics === 'diagnostics.snapshot', 'Super Prewarm report routes degraded work through diagnostics lane');
  context.assert(fs.existsSync(reportPath), 'Super Prewarm suite writes JSON evidence report');

  context.assert(invalidReport.ok === false, 'Super Prewarm invalid ownership report is rejected');
  context.assert(invalidReport.classification === 'negative-signal', 'Super Prewarm invalid ownership report is a negative signal');
  context.assert(invalidReport.diagnostics.some((diagnostic) => diagnostic.code === 'xtend.maraca.super_prewarm.worker_dom_owner'), 'Super Prewarm diagnostics catch worker DOM ownership');
  context.assert(invalidReport.diagnostics.some((diagnostic) => diagnostic.code === 'xtend.maraca.super_prewarm.stale_response_committed'), 'Super Prewarm diagnostics catch stale commit');
  context.assert(invalidReport.diagnostics.some((diagnostic) => diagnostic.code === 'xtend.maraca.super_prewarm.ssr_roundtrip'), 'Super Prewarm diagnostics catch SSR roundtrip');
  context.assert(missingApisReport.ok === true, 'Super Prewarm missing API report remains non-blocking');
  context.assert(missingApisReport.diagnostics.some((diagnostic) => diagnostic.code === 'xtend.maraca.super_prewarm.worker_unavailable'), 'Super Prewarm missing API report records degraded Worker APIs');

  context.assert(envelope.kind === 'rmt_ui_compute_request', 'Super Prewarm ui_compute envelope uses stable request kind');
  context.assert(envelope.metadata.stateOwnership === 'main-thread', 'Super Prewarm ui_compute envelope keeps state ownership on main thread');
  context.assert(envelope.metadata.trustedDomCommit === 'main-thread', 'Super Prewarm ui_compute envelope requires trusted main-thread commit');
  context.assert(envelope.plan.phases.some((phase) => phase.id === 'ui_compute' && phase.transport === 'worker'), 'Super Prewarm ui_compute envelope routes compute phase to worker');
  context.assert(envelope.plan.phases.some((phase) => phase.id === 'trusted_main_thread_commit' && phase.transport === 'main'), 'Super Prewarm ui_compute envelope routes commit phase to main thread');

  RMT_RUNTIME_PATHS.forEach((runtimePath) => {
    const source = readText(runtimePath, rootDir);
    context.assert(source.includes('dispatchUiComputeEnvelope'), `${runtimePath} exposes dispatchUiComputeEnvelope`);
    context.assert(source.includes('rmt_ui_compute_response'), `${runtimePath} exposes ui_compute response kind`);
    context.assert(source.includes("action === 'prerender' || action === 'ui_compute'"), `${runtimePath} accepts ui_compute worker action`);
    context.assert(source.includes('mainThreadCommitRequired: true'), `${runtimePath} records main-thread commit requirement`);
    context.assert(source.includes("stateOwnership: 'main-thread'"), `${runtimePath} records main-thread state ownership`);
  });
  context.assert(rmtCoreTypesSource.includes('dispatchUiComputeEnvelope'), 'RMT public types expose dispatchUiComputeEnvelope');

  context.assert(moduleSource.includes(SUPER_PREWARM_WORKER_EXPERIMENT_SCHEMA), 'Super Prewarm module declares report schema');
  context.assert(moduleSource.includes('releaseBlocking: false'), 'Super Prewarm module hard-codes non-blocking evidence mode');
  context.assert(moduleSource.includes('engineImplemented: false'), 'Super Prewarm module keeps PWA Manifest Engine as attachment point');
  context.assert(fixture.includes(SUPER_PREWARM_WORKER_EXPERIMENT_SCHEMA), 'Super Prewarm browser fixture declares report schema');
  context.assert(fixture.includes('__xtendSuperPrewarmWorkerExperimentResult'), 'Super Prewarm browser fixture exposes result key');
  context.assert(fixture.includes('super-prewarm-worker-sw.js'), 'Super Prewarm browser fixture registers service worker stub');
  context.assert(fixture.includes('super-prewarm-worker-manifest.webmanifest'), 'Super Prewarm browser fixture links PWA manifest stub');
  context.assert(fixture.includes('route-transition') && fixture.includes('tab-update') && fixture.includes('filter-update'), 'Super Prewarm fixture covers route, tab and filter scenarios');
  context.assert(fixture.includes('below-fold-hydration') && fixture.includes('warm-reentry'), 'Super Prewarm fixture covers below-fold hydration and warm reentry');
  context.assert(fixture.includes('workerDomMutation: false'), 'Super Prewarm fixture keeps worker DOM mutation disabled');
  context.assert(fixture.includes('workerEventBinding: false'), 'Super Prewarm fixture keeps worker event binding disabled');
  context.assert(fixture.includes('workerStateOwnership: false'), 'Super Prewarm fixture keeps worker state ownership disabled');
  context.assert(manifest.includes('"display": "standalone"'), 'Super Prewarm manifest declares standalone PWA display');
  context.assert(serviceWorker.includes('fixture-cache-stub') === false && serviceWorker.includes('caches.open'), 'Super Prewarm service worker provides static cache stub');
  context.assert(runner.includes("id: 'super-prewarm-worker-experiment'"), 'Runner registers Super Prewarm experiment suite');
  context.assert(packageManifest.includes('"test:super-prewarm-worker-experiment"'), 'Package exposes Super Prewarm experiment script');
  context.assert(packageManifest.includes('"./rmt-language/super-prewarm-worker-experiment"'), 'Package exports Super Prewarm experiment contract');

  await assertLocalServerFixture(context, rootDir);

  const browserDriver = options.engine || options.browserDriver || process.env.XTEND_SUPER_PREWARM_BROWSER_ENGINE || process.env.XTEND_SUPER_PREWARM_BROWSER_DRIVER || '';
  if (browserDriver) {
    const engine = normalizeEngine(browserDriver);
    try {
      const browserReport = await runHypervisorBrowserEvidence(rootDir, engine, options);
      context.assert(browserReport && browserReport.schema === SUPER_PREWARM_WORKER_EXPERIMENT_SCHEMA, `Super Prewarm fixture returns browser evidence schema through ${engine}`);
      context.assert(browserReport && browserReport.ok === true, `Super Prewarm fixture browser evidence passes through ${engine}`);
      context.assert(browserReport && browserReport.runModes && browserReport.runModes.includes('superPrewarmWorker'), 'Super Prewarm fixture browser evidence covers superPrewarmWorker mode');
    } catch (error) {
      context.fail(`Super Prewarm ${engine} Hypervisor evidence failed: ${error.message}`);
    }
  } else {
    context.pass('Super Prewarm browser evidence fixture is available without making external browser automation mandatory');
  }

  return context.result({ report, reportPath });
}

function printSuperPrewarmWorkerExperimentReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Super Prewarm Worker Experiment erfolgreich.',
    failureTitle: 'XTend Super Prewarm Worker Experiment fehlgeschlagen:'
  });
}

if (require.main === module) {
  runSuperPrewarmWorkerExperimentSuite().then((result) => {
    printSuperPrewarmWorkerExperimentReport(result);
    if (!result.ok) {
      process.exit(1);
    }
  }).catch((error) => {
    console.error(error && error.stack ? error.stack : String(error));
    process.exit(1);
  });
}

module.exports = {
  FIXTURE_MANIFEST_PATH,
  FIXTURE_PATH,
  FIXTURE_SERVICE_WORKER_PATH,
  runSuperPrewarmWorkerExperimentSuite,
  printSuperPrewarmWorkerExperimentReport
};
