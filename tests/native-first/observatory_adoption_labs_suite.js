'use strict';

const crypto = require('crypto');
const path = require('path');
const { createSuiteContext, printSuiteReport } = require('../utils/assertions');
const { readJson, readText, resolveRootDir } = require('../utils/files');
const {
  LAB_SCHEMA,
  compareSchedulerStrategies,
  createYieldContinuation,
  runExplicitResourceManagementLab,
  runScopedRegistryModel,
  selectNavigationHost,
  selectOverlayStrategy
} = require('./observatory_adoption_labs');

const SUITE_ID = 'observatory-adoption-labs';
const SUITE_LABEL = 'Observatory Adoption Labs';
const REPORT_SCHEMA = 'xtend.native-first.observatory-lab-report.v1';

function includesAll(values, expected) {
  return expected.every((entry) => values.includes(entry));
}

function runObservatoryAdoptionLabsSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({ id: SUITE_ID, label: SUITE_LABEL });
  const fixture = readJson('tests/fixtures/native-first/observatory-adoption-lab-fixtures.json', rootDir);
  const browserLab = readText('tests/browser/fixtures/observatory-adoption-lab.html', rootDir);
  const chromiumEvidence = readJson('tests/fixtures/native-first/observatory-browser-evidence-chromium-151.json', rootDir);
  const viewA = readText('tests/browser/fixtures/observatory-view-transition-a.html', rootDir);
  const viewB = readText('tests/browser/fixtures/observatory-view-transition-b.html', rootDir);
  const ermBrowserLab = readText('tests/browser/fixtures/observatory-explicit-resource-management-lab.html', rootDir);
  const ermNativeModule = readText('tests/browser/fixtures/observatory-explicit-resource-management-native.mjs', rootDir);
  const ermBrowserEvidence = readJson('tests/fixtures/native-first/observatory-erm-browser-evidence-chromium-151.json', rootDir);
  const terminalEvidence = readJson('tests/fixtures/native-first/observatory-browser-evidence-2026-09-03.json', rootDir);
  const labReport = readText('development/XTend-Observatory-Prototype-Lab-Report-2026-08-17.md', rootDir);
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);

  const nonModal = selectOverlayStrategy({ kind: 'popover', modal: false, capabilities: { popover: true, anchorPositioning: true } });
  const modal = selectOverlayStrategy({ kind: 'popover', modal: true, capabilities: { popover: true, anchorPositioning: true } });
  const dialog = selectOverlayStrategy({ kind: 'dialog', capabilities: { dialog: true } });
  context.assert(nonModal.schema === LAB_SCHEMA && nonModal.strategy === 'owned-xtend-overlay' && nonModal.positioning === 'owned-js-measurement', 'Rejected Popover and Anchor candidates keep the owned overlay path');
  context.assert(nonModal.publicEventsUnchanged && nonModal.ownedSurfaceRecords, 'Owned non-modal path preserves public events and Surface records');
  context.assert(modal.strategy === 'owned-xtend-overlay' && modal.browserOwns.length === 0, 'Modal popover stays fully owned and avoids duplicate browser modality');
  context.assert(includesAll(modal.xtendOwns, ['focus-trap', 'inert', 'escape', 'scroll-lock']), 'Modal owned path retains focus, inert, Escape and scroll-lock ownership');
  context.assert(dialog.strategy === 'owned-xtend-overlay' && dialog.browserOwns.length === 0 && dialog.xtendOwns.includes('escape'), 'Rejected native Dialog keeps Escape under one XTend owner');

  const scheduler = compareSchedulerStrategies({ unitCount: 500, sliceBudgetMs: 4, unitCostMs: 0.25 });
  context.assert(scheduler.plan.unitCount === 500 && scheduler.plan.sliceBudgetMs === 4, 'Scheduler lab models 500 hydration units in 4 ms slices');
  context.assert(scheduler.acceptance.sliceBudgetMet && scheduler.acceptance.noLongTaskOver50Ms, 'Scheduler model meets slice and long-task limits');
  context.assert(scheduler.acceptance.standardHydrationBudgetMet && scheduler.acceptance.throughputRegressionWithinFivePercent, 'Scheduler model meets standard hydration and five-percent throughput limits');
  context.assert(scheduler.acceptance.orderUnchanged && scheduler.plan.cancellationOwner === 'rmt-lanes' && scheduler.plan.backpressureOwner === 'rmt-lanes', 'Scheduler model preserves order, cancellation and backpressure ownership');
  context.assert(createYieldContinuation({ scheduler: { yield() { return Promise.resolve(); } }, requestIdleCallback() {} }).strategy === 'requestIdleCallback', 'Rejected scheduler.yield does not replace the accepted idle fallback');
  context.assert(createYieldContinuation({ requestIdleCallback() {} }).strategy === 'requestIdleCallback', 'yieldContinuation preserves requestIdleCallback fallback');
  context.assert(createYieldContinuation({ setTimeout() {} }).strategy === 'timer', 'yieldContinuation preserves timer fallback');

  const registry = runScopedRegistryModel();
  context.assert(registry.identicalTagIsolated && registry.constructorA !== registry.constructorB, 'Scoped registry model isolates identical tags with different constructors');
  context.assert(registry.missingScopeFallsBackExplicitly === registry.globalFallback, 'Scoped registry model keeps an explicit global fallback');
  context.assert(registry.hydrationOwner === 'rmt-component-adapter' && registry.surfaceOwner === 'surface-manager', 'Scoped registry lab preserves hydration and Surface ownership');

  const navigationDefault = selectNavigationHost({ optIn: false, navigationApi: true });
  const navigationLab = selectNavigationHost({ optIn: true, navigationApi: true });
  context.assert(navigationDefault.strategy === 'history-hash-owned', 'Navigation API never activates without opt-in');
  context.assert(navigationLab.strategy === 'history-hash-owned' && navigationLab.fallbackOwner === 'history-hash-owned', 'Rejected Navigation API retains History/Hash ownership');
  context.assert(!navigationLab.changesPublicContract && includesAll(navigationLab.mapsToExistingEvents, ['xrouter-before-navigate', 'xrouter-after-navigate']), 'Navigation lab maps to existing public events');

  class FixtureDisposableStack {
    constructor() { this.callbacks = []; this.disposed = false; }
    defer(callback) { this.callbacks.push(callback); }
    dispose() {
      if (this.disposed) return;
      this.disposed = true;
      let error = null;
      while (this.callbacks.length > 0) {
        try {
          this.callbacks.pop()();
        } catch (nextError) {
          if (!error) error = nextError;
          else {
            const suppressed = new Error('fixture suppressed error');
            suppressed.name = 'SuppressedError';
            suppressed.error = nextError;
            suppressed.suppressed = error;
            error = suppressed;
          }
        }
      }
      if (error) throw error;
    }
  }
  const erm = runExplicitResourceManagementLab({ DisposableStack: FixtureDisposableStack });
  context.assert(erm.fallback.strategy === 'manual-dispose-fallback' && erm.native.strategy === 'DisposableStack', 'ERM lab compares manual and native stack strategies');
  context.assert(erm.fallback.lifo && erm.native.lifo && erm.abortFallback.lifo, 'ERM lab preserves LIFO cleanup for normal and abort paths');
  context.assert(erm.fallback.exactlyOnce && erm.native.exactlyOnce && erm.abortFallback.exactlyOnce, 'ERM lab disposes scheduler, worker and Surface resources exactly once');
  context.assert(erm.fallback.secondDispose === false && erm.native.secondDispose === false, 'ERM lab makes duplicate disposal a no-op');
  context.assert(erm.abortFallback.events[0] === 'abort' && erm.throwFallback.throwPreserved && erm.throwFallback.exactlyOnce, 'ERM lab preserves Abort and Throw cleanup invariants');
  context.assert(erm.suppressed.threw && erm.suppressed.name === 'SuppressedError', 'ERM lab exercises suppressed cleanup errors');
  context.assert(erm.existingDisposeContractsRemainOwner && !erm.publicExportsAdded && !erm.runtimeDependenciesAdded, 'ERM lab cannot replace owned disposal or add product surface');

  context.assert(fixture.schema === 'xtend.native-first.observatory-browser-evidence.v1', 'Browser evidence fixture declares schema');
  context.assert(fixture.engines.length === 3 && fixture.engines.some((engine) => engine.engine === 'Chromium' && engine.version === '151.0.7922.108' && engine.status === 'lab-evidence'), 'Chromium has version-bound lab evidence');
  context.assert(fixture.engines.filter((engine) => engine.status === 'unsupported-with-valid-fallback').length === 2, 'Firefox and WebKit carry terminal fallback evidence');
  context.assert(fixture.wave1.scheduler.unitCount === 500 && fixture.wave1.scheduler.sliceBudgetMs === 4, 'Fixture carries scheduler acceptance budgets');
  context.assert(includesAll(fixture.wave1.overlayAnchor.requirements, ['keyboard', 'focus-return', 'escape', 'light-dismiss', 'nested-overlays', 'rtl', 'zoom', 'scroll-resize', 'reduced-motion', 'js-fallback']), 'Overlay fixture records interaction and fallback acceptance');
  context.assert(includesAll(fixture.wave2.navigation.requirements, ['back-forward', 'superseded', 'abort', 'query-hash', 'external-links', 'target', 'download', 'unregistered-routes', 'scroll-restore', 'focus', 'title-announcement', 'ssr-adoption', 'route-reuse']), 'Navigation fixture records lifecycle acceptance');
  context.assert(fixture.wave2.crossDocumentViewTransitions.docsPilotAllowed === false, 'Cross-document fixture does not authorize a Docs pilot');
  context.assert(chromiumEvidence.engine === 'Chromium' && chromiumEvidence.version === '151.0.7922.108' && chromiumEvidence.completed === true, 'Chromium evidence is engine- and version-bound');
  context.assert(/^[a-f0-9]{64}$/u.test(chromiumEvidence.harnessSha256), 'Historical Chromium evidence keeps its immutable harness digest');
  context.assert(terminalEvidence.harnessSha256 === crypto.createHash('sha256').update(browserLab).digest('hex'), 'September evidence matches the current parse-safe browser harness');
  context.assert(chromiumEvidence.registry.isolated === true && chromiumEvidence.hydration.units === 500 && chromiumEvidence.hydration.slices === 10, 'Chromium evidence records registry isolation and segmented hydration');
  context.assert(chromiumEvidence.hydration.strategy === 'scheduler.yield' && chromiumEvidence.hydration.yieldCount === 9 && chromiumEvidence.hydration.maxSliceMs <= 4, 'Historical Chromium comparison evidence remains preserved without authorizing scheduler.yield');
  context.assert(chromiumEvidence.claimBoundary === 'single-local-lab-not-shipping-support', 'Single-engine evidence cannot become a shipping claim');

  ['popover="auto"', 'closedby="closerequest"', 'anchor-name:', 'position-anchor:', 'scheduler.yield', 'new CustomElementRegistry()', 'next < 500', 'sliceUnits < 50', 'performance.now() - started < 4'].forEach((token) => {
    context.assertIncludes(browserLab, token, `Browser lab includes ${token}`);
  });
  context.assertIncludes(viewA, '@view-transition { navigation: auto; }', 'Document A enables cross-document View Transition lab');
  context.assertIncludes(viewB, '@view-transition { navigation: auto; }', 'Document B enables cross-document View Transition lab');
  context.assertIncludes(viewA, 'observatory-view-transition-b.html', 'Document A links to B');
  context.assertIncludes(viewB, 'observatory-view-transition-a.html', 'Document B links to A');
  context.assertIncludes(ermBrowserLab, "await import('./observatory-explicit-resource-management-native.mjs')", 'ERM browser harness isolates native syntax behind dynamic import');
  context.assertIncludes(ermBrowserLab, "typeof DisposableStack === 'function'", 'ERM browser harness capability-gates the native module');
  context.assertIncludes(ermBrowserLab, 'capability-fallback', 'ERM browser harness keeps a parse-safe fallback');
  context.assertIncludes(ermNativeModule, 'using resource', 'ERM native module exercises using syntax');
  context.assertIncludes(ermNativeModule, 'await using resource', 'ERM native module exercises await using syntax');
  context.assert(ermBrowserEvidence.schema === 'xtend.native-first.observatory-erm-browser-evidence-matrix.v1', 'ERM evidence declares an engine-specific matrix schema');
  context.assert(ermBrowserEvidence.harness.sha256 === crypto.createHash('sha256').update(ermBrowserLab).digest('hex'), 'ERM evidence binds the exact parse-safe browser harness');
  context.assert(ermBrowserEvidence.harness.nativeModuleSha256 === crypto.createHash('sha256').update(ermNativeModule).digest('hex'), 'ERM evidence binds the exact native-syntax module');
  const ermChromium = ermBrowserEvidence.engines.find((engine) => engine.engine === 'Chromium');
  context.assert(ermChromium && ermChromium.version === '151.0.7922.108' && ermChromium.dynamicModuleStatus === 'native-syntax-exercised', 'Chromium 151 executed using and await using through the dynamic module');
  context.assert(includesAll(ermChromium.events, ['using-body', 'using-dispose', 'await-using-body', 'await-using-dispose']), 'Chromium evidence records synchronous and asynchronous native disposal');
  context.assert(ermBrowserEvidence.engines.filter((engine) => engine.status === 'insufficient-evidence').length === 2, 'Historical ERM evidence remains immutable');
  context.assert(terminalEvidence.summary.insufficientEvidence === 0 && terminalEvidence.summary.resolved === 24, 'September Hypervisor evidence supersedes historical adoption blockers');

  ['components/xtooltip.js', 'components/xpopover.js', 'components/xdialog.js', 'components/xsurfacewindow.js', 'options.customElements', 'JSPI', 'shadowrootslotassignment'].forEach((token) => {
    context.assertIncludes(labReport, token, `Lab report documents ${token}`);
  });
  context.assert(runner.hasSuite("observatory-adoption-labs"), 'Runner registers Observatory adoption labs');
  context.assert(packageManifest.scripts && packageManifest.scripts['test:observatory-adoption-labs'] === 'node scripts/run_xtend_tests.js observatory-adoption-labs', 'Package exposes Observatory adoption lab gate');

  return context.result({
    report: {
      schema: REPORT_SCHEMA,
      wave1Labs: 4,
      wave2Labs: 2,
      hydrationUnits: scheduler.plan.unitCount,
      maxModeledSliceMs: scheduler.plan.maxSliceMs,
      engineEvidence: fixture.engines,
      productDefaultsChanged: false,
      publicExportsAdded: false,
      runtimeDependenciesAdded: false
    }
  });
}

function printObservatoryAdoptionLabsReport(result) {
  printSuiteReport(result, {
    successTitle: 'Observatory Adoption Labs erfolgreich.',
    failureTitle: 'Observatory Adoption Labs fehlgeschlagen:'
  });
}

module.exports = {
  printObservatoryAdoptionLabsReport,
  runObservatoryAdoptionLabsSuite
};
