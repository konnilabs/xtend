const fs = require('fs');
const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
  resolveRepoPath,
  resolveRootDir
} = require('../utils/files');
const {
  syntaxCheckFile
} = require('../utils/process');
const {
  APP_SHELL_PROBES,
  DOCS_APP_REFERENCE,
  DOCS_RMT_REFERENCE,
  KERNEL_BOUNDARY,
  PERFORMANCE_BUDGETS,
  REQUIRED_ARTIFACTS,
  SURFACE_MANAGER_BROWSER_LAB_BACKLOG,
  SURFACE_MANAGER_BROWSER_LAB_CLS_REPORT_SCHEMA,
  SURFACE_MANAGER_BROWSER_LAB_DOCS,
  SURFACE_MANAGER_BROWSER_LAB_FIXTURE,
  SURFACE_MANAGER_BROWSER_LAB_LOCAL_GATE,
  SURFACE_MANAGER_BROWSER_LAB_MODULE,
  SURFACE_MANAGER_BROWSER_LAB_PACKAGE_SCRIPT,
  SURFACE_MANAGER_BROWSER_LAB_PERFORMANCE_REPORT_SCHEMA,
  SURFACE_MANAGER_BROWSER_LAB_REPORT_SCHEMA,
  SURFACE_MANAGER_BROWSER_LAB_SCHEMA,
  SURFACE_MANAGER_BROWSER_LAB_STATUS,
  SURFACE_MANAGER_BROWSER_LAB_SUITE,
  SURFACE_MANAGER_BROWSER_LAB_TARGET,
  SURFACE_MANAGER_BROWSER_LAB_VISUAL_BASELINE,
  SURFACE_MANAGER_BROWSER_LAB_VISUAL_BASELINE_SCHEMA,
  SURFACE_MANAGER_BROWSER_LAB_WORKPACKAGE,
  SURFACE_MANAGER_BROWSER_LAB_WORKPACKAGE_DOC,
  VISUAL_SNAPSHOT_IDS,
  VISUAL_STATES,
  WORKBENCH_REFERENCE,
  createSurfaceManagerBrowserLabPlan,
  createSurfaceManagerBrowserLabReport,
  validateSurfaceManagerBrowserLabPlan
} = require('../../catalog/surface-manager-browser-lab');

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, values, expected, label) {
  expected.forEach((entry) => {
    context.assert(Array.isArray(values) && values.includes(entry), `${label} includes ${entry}`);
  });
}

function assertTextIncludesAll(context, text, expected, label) {
  expected.forEach((entry) => {
    context.assertIncludes(text, entry, `${label} includes ${entry}`);
  });
}

function runSurfaceManagerBrowserLabSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'surface-browser-lab',
    label: 'SurfaceManager Browser Lab visual stability gates'
  });
  const plan = createSurfaceManagerBrowserLabPlan({ rootDir });
  const validation = validateSurfaceManagerBrowserLabPlan(plan);
  const report = createSurfaceManagerBrowserLabReport({ rootDir, plan });
  const visualBaseline = readJson(SURFACE_MANAGER_BROWSER_LAB_VISUAL_BASELINE, rootDir);
  const fixture = readText(SURFACE_MANAGER_BROWSER_LAB_FIXTURE, rootDir);
  const loaderRuntime = readText('xtend-loader.js', rootDir);
  const managerRuntime = readText('components/xsurfacemanager.js', rootDir);
  const docsApp = readText(DOCS_APP_REFERENCE, rootDir);
  const docsPageLoader = readText('docs/utils/pageloader.js', rootDir);
  const docsRmt = readText(DOCS_RMT_REFERENCE, rootDir);
  const workbenchFixture = readText(WORKBENCH_REFERENCE, rootDir);
  const docs = readText(SURFACE_MANAGER_BROWSER_LAB_DOCS, rootDir);
  const backlog = readText(SURFACE_MANAGER_BROWSER_LAB_BACKLOG, rootDir);
  const workpackageDoc = readText(SURFACE_MANAGER_BROWSER_LAB_WORKPACKAGE_DOC, rootDir);
  const browserSuite = readText('tests/browser/browser_smoke_suite.js', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.surfaceManagerBrowserLab;

  REQUIRED_ARTIFACTS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as browser lab artifact`);
  });

  [
    SURFACE_MANAGER_BROWSER_LAB_MODULE,
    SURFACE_MANAGER_BROWSER_LAB_SUITE,
    'tests/browser/browser_smoke_suite.js'
  ].forEach((filePath) => {
    const syntax = syntaxCheckFile(filePath, { rootDir, extension: '.js' });
    context.assert(syntax.ok, `${filePath} syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  });

  context.assert(plan.schema === SURFACE_MANAGER_BROWSER_LAB_SCHEMA, 'Browser Lab schema is stable');
  context.assert(plan.reportSchema === SURFACE_MANAGER_BROWSER_LAB_REPORT_SCHEMA, 'Browser Lab report schema is stable');
  context.assert(plan.visualBaselineSchema === SURFACE_MANAGER_BROWSER_LAB_VISUAL_BASELINE_SCHEMA, 'Browser Lab visual baseline schema is stable');
  context.assert(plan.performanceReportSchema === SURFACE_MANAGER_BROWSER_LAB_PERFORMANCE_REPORT_SCHEMA, 'Browser Lab performance report schema is stable');
  context.assert(plan.clsReportSchema === SURFACE_MANAGER_BROWSER_LAB_CLS_REPORT_SCHEMA, 'Browser Lab CLS report schema is stable');
  context.assert(plan.workpackage === SURFACE_MANAGER_BROWSER_LAB_WORKPACKAGE, 'Browser Lab belongs to WP-SM-18');
  context.assert(plan.status === SURFACE_MANAGER_BROWSER_LAB_STATUS, 'Browser Lab status is implemented');
  context.assert(plan.targetReadiness === SURFACE_MANAGER_BROWSER_LAB_TARGET, 'Browser Lab target readiness is stable');
  context.assert(plan.kernelBoundary === KERNEL_BOUNDARY, 'Browser Lab keeps kernel boundary');
  context.assert(plan.nextWorkpackage === 'WP-SM-19', 'Browser Lab hands off to WP-SM-19');
  context.assert(plan.nextDecision === 'surface-runtime-release-handoff', 'Browser Lab exposes release handoff decision');
  context.assert(validation.ok === true, 'Browser Lab plan validates');
  context.assert(report.ok === true, 'Browser Lab report validates');
  assertIncludesAll(context, plan.visualStates, VISUAL_STATES, 'Browser Lab visual states');
  assertIncludesAll(context, plan.visualSnapshotIds, VISUAL_SNAPSHOT_IDS, 'Browser Lab visual snapshots');
  assertIncludesAll(context, plan.appShellProbes, APP_SHELL_PROBES, 'Browser Lab app-shell probes');
  context.assert(plan.performanceBudgets.openMs === PERFORMANCE_BUDGETS.openMs, 'Browser Lab open budget is fixed');
  context.assert(plan.performanceBudgets.focusMs === PERFORMANCE_BUDGETS.focusMs, 'Browser Lab focus budget is fixed');
  context.assert(plan.performanceBudgets.routeMs === PERFORMANCE_BUDGETS.routeMs, 'Browser Lab route budget is fixed');
  context.assert(plan.performanceBudgets.hydrateMs === PERFORMANCE_BUDGETS.hydrateMs, 'Browser Lab hydrate budget is fixed');
  context.assert(plan.performanceBudgets.maxCumulativeLayoutShift === PERFORMANCE_BUDGETS.maxCumulativeLayoutShift, 'Browser Lab CLS budget is fixed');
  context.assert(plan.performanceBudgets.unstyledContentPopInCount === 0, 'Browser Lab forbids unstyled content pop-in');
  context.assert(plan.runtimeBoundary.shellFirst === true, 'Browser Lab is shell-first');
  context.assert(plan.runtimeBoundary.coldStartVisualGate === true, 'Cold start is visually gateable');
  context.assert(plan.runtimeBoundary.skeletonHydrationReproducible === true, 'Skeleton and hydration states are reproducible');
  context.assert(plan.runtimeBoundary.routeChangeVisualGate === true, 'Route change is visually gateable');
  context.assert(plan.runtimeBoundary.modalStackVisualGate === true, 'Modal stack is visually gateable');
  context.assert(plan.runtimeBoundary.layoutShiftRegressionFails === true, 'Layout shift regressions fail');
  context.assert(plan.runtimeBoundary.unstyledContentPopInRegressionFails === true, 'Unstyled content pop-in regressions fail');
  context.assert(plan.runtimeBoundary.docsAppMonkeypatch === false, 'Docs app monkeypatch stays disallowed');
  context.assert(plan.runtimeBoundary.createsSecondRegistry === false, 'Browser Lab creates no second registry');
  context.assert(plan.runtimeBoundary.rmtKernelImportsXtendTypes === false, 'Browser Lab keeps RMT kernel type boundary clean');

  context.assert(visualBaseline.schema === SURFACE_MANAGER_BROWSER_LAB_VISUAL_BASELINE_SCHEMA, 'Visual baseline declares Browser Lab schema');
  context.assert(visualBaseline.workpackage === SURFACE_MANAGER_BROWSER_LAB_WORKPACKAGE, 'Visual baseline belongs to WP-SM-18');
  context.assert(visualBaseline.fixture === SURFACE_MANAGER_BROWSER_LAB_FIXTURE, 'Visual baseline points to Browser Lab fixture');
  context.assert(visualBaseline.binaryBaselines === false, 'Visual baseline is JSON-only');
  context.assert(visualBaseline.pixelReady === true, 'Visual baseline is pixel-ready for later browser artifacts');
  context.assert(visualBaseline.snapshotCount === VISUAL_SNAPSHOT_IDS.length, 'Visual baseline counts all snapshots');
  assertIncludesAll(context, visualBaseline.states, VISUAL_STATES, 'Visual baseline states');
  assertIncludesAll(context, (visualBaseline.records || []).map((record) => record.id), VISUAL_SNAPSHOT_IDS, 'Visual baseline records');
  context.assert(visualBaseline.budgets.maxCumulativeLayoutShift === PERFORMANCE_BUDGETS.maxCumulativeLayoutShift, 'Visual baseline stores CLS budget');
  context.assert(visualBaseline.budgets.unstyledContentPopInCount === 0, 'Visual baseline stores pop-in budget');
  context.assert(visualBaseline.budgets.textFlashAllowed === false, 'Visual baseline forbids text flash');
  (visualBaseline.records || []).forEach((record) => {
    context.assert(record.root && record.children && record.children.length >= 2, `${record.id}: baseline has DOM signature`);
    context.assert(record.assertions && record.assertions.length >= 3, `${record.id}: baseline has stability assertions`);
  });

  assertTextIncludesAll(context, fixture, [
    SURFACE_MANAGER_BROWSER_LAB_SCHEMA,
    SURFACE_MANAGER_BROWSER_LAB_REPORT_SCHEMA,
    SURFACE_MANAGER_BROWSER_LAB_VISUAL_BASELINE_SCHEMA,
    SURFACE_MANAGER_BROWSER_LAB_PERFORMANCE_REPORT_SCHEMA,
    SURFACE_MANAGER_BROWSER_LAB_CLS_REPORT_SCHEMA,
    '__xtendSurfaceBrowserLabResult',
    '/xtend-loader.js',
    '/components/xsurfacemanager.js',
    '/components/xsurfacewindow.js',
    '/components/xsidepanel.js',
    '/components/xmodal.js',
    'data-surface-browser-lab="wp-sm-18"',
    'data-quality-gate="surface-manager-browser-lab"',
    'data-pixel-baseline-id="surface-lab-cold-start"',
    'data-pixel-baseline-id="surface-lab-skeleton"',
    'data-pixel-baseline-id="surface-lab-hydrated"',
    'data-pixel-baseline-id="surface-lab-route-change"',
    'data-pixel-baseline-id="surface-lab-modal-stack"',
    'data-xtend-skeleton-loader',
    'data-xtend-parsedown-container="true"',
    'data-unstyled-content-policy="blocked"',
    'data-xtend-surface-content-ready="false"',
    'surface-loading-policy="route"',
    'remote-surface-policy="strict"',
    'layout-engine="docked"',
    'performance.mark',
    'surface-browser-lab-cold-start-shell',
    'surface-browser-lab-hydrate',
    'surface-browser-lab-route',
    'surface-browser-lab-open',
    'surface-browser-lab-focus'
  ], 'Browser Lab fixture contract');
  VISUAL_SNAPSHOT_IDS.forEach((snapshotId) => {
    context.assertIncludes(fixture, snapshotId, `Browser Lab fixture contains ${snapshotId}`);
  });
  [
    'surface browser lab cold start gateable',
    'surface browser lab skeleton reproducible',
    'surface browser lab hydrated reproducible',
    'surface browser lab route change stable',
    'surface browser lab modal stack stable',
    'surface browser lab layout shift within budget',
    'surface browser lab unstyled content blocked',
    'surface browser lab performance budgets within limit',
    'surface browser lab docs app reference smoke',
    'surface browser lab workbench reference smoke',
    'surface browser lab no external network dependency'
  ].forEach((check) => {
    context.assertIncludes(fixture, `recordCheck('${check}'`, `Browser Lab fixture records ${check}`);
  });
  context.assert(!fixture.includes('fetch('), 'Browser Lab fixture does not fetch content during local smoke');
  context.assert(!fixture.includes('import('), 'Browser Lab fixture does not lazy import runtime modules in the smoke');
  context.assert(!fixture.includes('https://cdn.ccs-networks.de'), 'Browser Lab fixture has no XTend CDN dependency');

  assertTextIncludesAll(context, loaderRuntime, [
    "const STYLE_REGISTRY_CONTRACT = 'xtend.loader.style-registry.v1'",
    'window.XTendStyleRegistry = XTendStyleRegistry',
    'window.XTendSkeletonLoader = SkeletonLoader',
    'showSkeleton',
    'hydrateTree'
  ], 'XTend Loader Browser Lab shell-first APIs');
  assertTextIncludesAll(context, managerRuntime, [
    'surface-loading-policy',
    'surface-skeleton',
    'snapshotSurfaceLoading()',
    'hydrateSurfaceContent(surfaceRef, options = {})',
    'remote-surface-policy',
    'layout-engine',
    'surface-overlay-command',
    'data-xtend-surface-content-ready'
  ], 'x-surface-manager Browser Lab runtime APIs');

  assertTextIncludesAll(context, docsApp, [
    'lazyParsedownRoutes: true',
    'xtendrmt-parsedown-docs.rmt'
  ], 'Docs app Browser Lab reference');
  assertTextIncludesAll(context, docsPageLoader, [
    'showDocsSkeleton',
    'loadDocsParsedownContent',
    'window.XTendSkeletonLoader',
    'data-rmt-content-kind'
  ], 'Docs page loader Browser Lab reference');
  assertTextIncludesAll(context, docsRmt, [
    'xtend.docs.parsedown-rmt-pilot.v1',
    'docs.app.shell',
    'docs.parsedown',
    'parsedownHtml'
  ], 'Docs RMT Browser Lab reference');
  assertTextIncludesAll(context, workbenchFixture, [
    '__xtendSurfaceWorkbenchSmokeResult',
    'xtend.surface.workbench-fixture.browser-smoke.v1',
    'data-rmt-host="surface-workbench"',
    '/xtendrmt/surface-workbench.rmt'
  ], 'RMT workbench Browser Lab reference');

  context.assert(metadata && metadata.schema === SURFACE_MANAGER_BROWSER_LAB_SCHEMA, 'Package metadata exposes Browser Lab schema');
  context.assert(metadata && metadata.visualBaselineSchema === SURFACE_MANAGER_BROWSER_LAB_VISUAL_BASELINE_SCHEMA, 'Package metadata exposes Browser Lab baseline schema');
  context.assert(metadata && metadata.localGate === SURFACE_MANAGER_BROWSER_LAB_LOCAL_GATE, 'Package metadata exposes Browser Lab gate');
  context.assert(metadata && metadata.packageScript === SURFACE_MANAGER_BROWSER_LAB_PACKAGE_SCRIPT, 'Package metadata exposes Browser Lab package script');
  context.assert(metadata && metadata.fixture === SURFACE_MANAGER_BROWSER_LAB_FIXTURE, 'Package metadata exposes Browser Lab fixture');
  context.assert(metadata && metadata.visualBaseline === SURFACE_MANAGER_BROWSER_LAB_VISUAL_BASELINE, 'Package metadata exposes Browser Lab visual baseline');
  context.assert(metadata && metadata.layoutShiftRegressionFails === true, 'Package metadata marks layout shift regressions as failing');
  context.assert(metadata && metadata.unstyledContentPopInRegressionFails === true, 'Package metadata marks pop-in regressions as failing');
  context.assert(metadata && metadata.createsSecondRegistry === false, 'Package metadata keeps no-second-registry boundary');
  context.assert(packageManifest.scripts && packageManifest.scripts['test:surface-browser-lab'] === 'node scripts/run_xtend_tests.js surface-browser-lab', 'Package script test:surface-browser-lab exists');
  context.assertIncludes(runner, "require('../tests/browser/surface_manager_browser_lab_suite')", 'Runner imports Browser Lab suite');
  context.assertIncludes(runner, "id: 'surface-browser-lab'", 'Runner registers Browser Lab suite');
  assertTextIncludesAll(context, browserSuite, [
    'SURFACE_MANAGER_BROWSER_LAB_FIXTURE_PATH',
    'SurfaceManager Browser Lab fixture',
    '__xtendSurfaceBrowserLabResult',
    'assertSurfaceManagerBrowserLabFixtureContract(context, rootDir)',
    SURFACE_MANAGER_BROWSER_LAB_FIXTURE
  ], 'Browser smoke harness Browser Lab activation');

  assertTextIncludesAll(context, docs, [
    '# SurfaceManager Browser Lab',
    SURFACE_MANAGER_BROWSER_LAB_SCHEMA,
    SURFACE_MANAGER_BROWSER_LAB_VISUAL_BASELINE_SCHEMA,
    SURFACE_MANAGER_BROWSER_LAB_LOCAL_GATE,
    'SkeletonLoader',
    'CLS',
    'Pop-In',
    DOCS_APP_REFERENCE,
    WORKBENCH_REFERENCE
  ], 'Browser Lab docs');
  assertTextIncludesAll(context, backlog, [
    '`WP-SM-18` | P2 | completed',
    'Browser-Lab, Pixel-Baselines und echte App-Shell-Projektproben ausbauen',
    '`WP-SM-19`'
  ], 'Browser Lab backlog status');
  assertTextIncludesAll(context, workpackageDoc, [
    'Status: `completed`',
    SURFACE_MANAGER_BROWSER_LAB_SCHEMA,
    SURFACE_MANAGER_BROWSER_LAB_LOCAL_GATE,
    'surface-lab-cold-start',
    'Regressionen gegen Pop-In und Layout Shift schlagen lokal fehl'
  ], 'Browser Lab workpackage doc');

  return context.result({
    report: {
      schema: SURFACE_MANAGER_BROWSER_LAB_REPORT_SCHEMA,
      workpackage: SURFACE_MANAGER_BROWSER_LAB_WORKPACKAGE,
      targetReadiness: SURFACE_MANAGER_BROWSER_LAB_TARGET,
      visualSnapshots: VISUAL_SNAPSHOT_IDS.length,
      appShellProbes: APP_SHELL_PROBES.length
    }
  });
}

function printSurfaceManagerBrowserLabReport(result) {
  printSuiteReport(result, {
    successTitle: 'SurfaceManager Browser Lab erfolgreich.',
    failureTitle: 'SurfaceManager Browser Lab fehlgeschlagen:'
  });
}

module.exports = {
  printSurfaceManagerBrowserLabReport,
  runSurfaceManagerBrowserLabSuite
};

if (require.main === module) {
  const result = runSurfaceManagerBrowserLabSuite();
  printSurfaceManagerBrowserLabReport(result);
  process.exit(result.ok ? 0 : 1);
}
