const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-gate-matrix');

const SURFACE_MANAGER_BROWSER_LAB_SCHEMA = 'xtend.surface.browser-lab.v1';
const SURFACE_MANAGER_BROWSER_LAB_REPORT_SCHEMA = 'xtend.surface.browser-lab-report.v1';
const SURFACE_MANAGER_BROWSER_LAB_VISUAL_BASELINE_SCHEMA = 'xtend.surface.browser-lab.visual-baseline.v1';
const SURFACE_MANAGER_BROWSER_LAB_PERFORMANCE_REPORT_SCHEMA = 'xtend.surface.browser-lab.performance-report.v1';
const SURFACE_MANAGER_BROWSER_LAB_CLS_REPORT_SCHEMA = 'xtend.surface.browser-lab.cls-report.v1';
const SURFACE_MANAGER_BROWSER_LAB_WORKPACKAGE = 'WP-SM-18';
const SURFACE_MANAGER_BROWSER_LAB_STATUS = 'implemented-browser-lab-visual-stability-gates';
const SURFACE_MANAGER_BROWSER_LAB_TARGET = 'surface-browser-lab-visual-stability-ready';
const SURFACE_MANAGER_BROWSER_LAB_MODULE = 'catalog/surface-manager-browser-lab.js';
const SURFACE_MANAGER_BROWSER_LAB_SUITE = 'tests/browser/surface_manager_browser_lab_suite.js';
const SURFACE_MANAGER_BROWSER_LAB_FIXTURE = 'tests/browser/fixtures/surface-manager-browser-lab.html';
const SURFACE_MANAGER_BROWSER_LAB_VISUAL_BASELINE = 'tests/browser/visual-baselines/surface-manager-browser-lab.dom-baseline.json';
const SURFACE_MANAGER_BROWSER_LAB_BACKLOG = 'development/BACKLOG-XTend-SurfaceManager-App-Shell-und-RMT-Surface-Runtime.md';
const SURFACE_MANAGER_BROWSER_LAB_WORKPACKAGE_DOC = 'development/WP-SM-18-Browser-Lab-Pixel-Baselines-und-App-Shell-Projektproben-ausbauen.md';
const SURFACE_MANAGER_BROWSER_LAB_DOCS = 'development/docs-evidence/root/surface-manager-browser-lab.md';
const SURFACE_MANAGER_BROWSER_LAB_LOCAL_GATE = 'node scripts/run_xtend_tests.js surface-browser-lab --json';
const SURFACE_MANAGER_BROWSER_LAB_PACKAGE_SCRIPT = 'npm run test:surface-browser-lab';
const DOCS_APP_REFERENCE = 'docs/index.php';
const DOCS_RMT_REFERENCE = 'docs/xtendrmt-parsedown-docs.rmt';
const WORKBENCH_REFERENCE = 'tests/browser/fixtures/rmt-surface-workbench-smoke.html';

const VISUAL_STATES = Object.freeze([
  'cold-start',
  'skeleton',
  'hydrated',
  'route-change',
  'modal-stack'
]);

const VISUAL_SNAPSHOT_IDS = Object.freeze([
  'surface-lab-cold-start',
  'surface-lab-skeleton',
  'surface-lab-hydrated',
  'surface-lab-route-change',
  'surface-lab-modal-stack'
]);

const PERFORMANCE_BUDGETS = Object.freeze({
  coldStartShellMs: 1000,
  openMs: 16,
  focusMs: 16,
  routeMs: 32,
  hydrateMs: 120,
  maxCumulativeLayoutShift: 0.01,
  maxLayoutShiftPx: 1,
  unstyledContentPopInCount: 0
});

const APP_SHELL_PROBES = Object.freeze([
  'docs-app-parsedown-shell',
  'rmt-surface-workbench'
]);

const REQUIRED_ARTIFACTS = Object.freeze([
  SURFACE_MANAGER_BROWSER_LAB_MODULE,
  SURFACE_MANAGER_BROWSER_LAB_SUITE,
  SURFACE_MANAGER_BROWSER_LAB_FIXTURE,
  SURFACE_MANAGER_BROWSER_LAB_VISUAL_BASELINE,
  SURFACE_MANAGER_BROWSER_LAB_BACKLOG,
  SURFACE_MANAGER_BROWSER_LAB_WORKPACKAGE_DOC,
  SURFACE_MANAGER_BROWSER_LAB_DOCS,
  'tests/browser/browser_smoke_suite.js',
  DOCS_APP_REFERENCE,
  DOCS_RMT_REFERENCE,
  WORKBENCH_REFERENCE,
  'components/xsurfacemanager.js',
  'components/xsurfacewindow.js',
  'components/xsidepanel.js',
  'components/xmodal.js',
  'xtend-loader.js'
]);

function includesAll(values, required) {
  return required.every((entry) => Array.isArray(values) && values.includes(entry));
}

function createSurfaceManagerBrowserLabPlan(options = {}) {
  return {
    schema: SURFACE_MANAGER_BROWSER_LAB_SCHEMA,
    reportSchema: SURFACE_MANAGER_BROWSER_LAB_REPORT_SCHEMA,
    visualBaselineSchema: SURFACE_MANAGER_BROWSER_LAB_VISUAL_BASELINE_SCHEMA,
    performanceReportSchema: SURFACE_MANAGER_BROWSER_LAB_PERFORMANCE_REPORT_SCHEMA,
    clsReportSchema: SURFACE_MANAGER_BROWSER_LAB_CLS_REPORT_SCHEMA,
    workpackage: SURFACE_MANAGER_BROWSER_LAB_WORKPACKAGE,
    status: SURFACE_MANAGER_BROWSER_LAB_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    targetReadiness: SURFACE_MANAGER_BROWSER_LAB_TARGET,
    module: SURFACE_MANAGER_BROWSER_LAB_MODULE,
    suite: SURFACE_MANAGER_BROWSER_LAB_SUITE,
    fixture: SURFACE_MANAGER_BROWSER_LAB_FIXTURE,
    visualBaseline: SURFACE_MANAGER_BROWSER_LAB_VISUAL_BASELINE,
    backlog: SURFACE_MANAGER_BROWSER_LAB_BACKLOG,
    workpackageDocument: SURFACE_MANAGER_BROWSER_LAB_WORKPACKAGE_DOC,
    docs: SURFACE_MANAGER_BROWSER_LAB_DOCS,
    localGate: SURFACE_MANAGER_BROWSER_LAB_LOCAL_GATE,
    packageScript: SURFACE_MANAGER_BROWSER_LAB_PACKAGE_SCRIPT,
    docsAppReference: DOCS_APP_REFERENCE,
    docsRmtReference: DOCS_RMT_REFERENCE,
    workbenchReference: WORKBENCH_REFERENCE,
    requiredArtifacts: REQUIRED_ARTIFACTS.slice(),
    visualStates: VISUAL_STATES.slice(),
    visualSnapshotIds: VISUAL_SNAPSHOT_IDS.slice(),
    performanceBudgets: { ...PERFORMANCE_BUDGETS },
    appShellProbes: APP_SHELL_PROBES.slice(),
    runtimeBoundary: {
      shellFirst: true,
      coldStartVisualGate: true,
      skeletonHydrationReproducible: true,
      routeChangeVisualGate: true,
      modalStackVisualGate: true,
      layoutShiftRegressionFails: true,
      unstyledContentPopInRegressionFails: true,
      usesSkeletonLoader: true,
      usesXTendStyleRegistry: true,
      docsAppMonkeypatch: false,
      browserRequiredInLocalGate: false,
      externalNetworkAllowedInLocalGate: false,
      createsSecondRegistry: false,
      rmtKernelImportsXtendTypes: false
    },
    nextWorkpackage: 'WP-SM-19',
    nextDecision: 'surface-runtime-release-handoff',
    kernelBoundary: KERNEL_BOUNDARY
  };
}

function validateSurfaceManagerBrowserLabPlan(plan = createSurfaceManagerBrowserLabPlan()) {
  const errors = [];

  if (!plan || plan.schema !== SURFACE_MANAGER_BROWSER_LAB_SCHEMA) errors.push(`schema must be ${SURFACE_MANAGER_BROWSER_LAB_SCHEMA}`);
  if (!plan || plan.reportSchema !== SURFACE_MANAGER_BROWSER_LAB_REPORT_SCHEMA) errors.push(`reportSchema must be ${SURFACE_MANAGER_BROWSER_LAB_REPORT_SCHEMA}`);
  if (!plan || plan.visualBaselineSchema !== SURFACE_MANAGER_BROWSER_LAB_VISUAL_BASELINE_SCHEMA) errors.push(`visualBaselineSchema must be ${SURFACE_MANAGER_BROWSER_LAB_VISUAL_BASELINE_SCHEMA}`);
  if (!plan || plan.performanceReportSchema !== SURFACE_MANAGER_BROWSER_LAB_PERFORMANCE_REPORT_SCHEMA) errors.push(`performanceReportSchema must be ${SURFACE_MANAGER_BROWSER_LAB_PERFORMANCE_REPORT_SCHEMA}`);
  if (!plan || plan.clsReportSchema !== SURFACE_MANAGER_BROWSER_LAB_CLS_REPORT_SCHEMA) errors.push(`clsReportSchema must be ${SURFACE_MANAGER_BROWSER_LAB_CLS_REPORT_SCHEMA}`);
  if (!plan || plan.workpackage !== SURFACE_MANAGER_BROWSER_LAB_WORKPACKAGE) errors.push(`workpackage must be ${SURFACE_MANAGER_BROWSER_LAB_WORKPACKAGE}`);
  if (!plan || plan.status !== SURFACE_MANAGER_BROWSER_LAB_STATUS) errors.push(`status must be ${SURFACE_MANAGER_BROWSER_LAB_STATUS}`);
  if (!plan || plan.targetReadiness !== SURFACE_MANAGER_BROWSER_LAB_TARGET) errors.push(`targetReadiness must be ${SURFACE_MANAGER_BROWSER_LAB_TARGET}`);
  if (!includesAll(plan && plan.visualStates, VISUAL_STATES)) errors.push('visual states missing');
  if (!includesAll(plan && plan.visualSnapshotIds, VISUAL_SNAPSHOT_IDS)) errors.push('visual snapshot ids missing');
  if (!includesAll(plan && plan.appShellProbes, APP_SHELL_PROBES)) errors.push('app shell probes missing');
  if (!plan || !plan.performanceBudgets || plan.performanceBudgets.openMs !== PERFORMANCE_BUDGETS.openMs) errors.push('open budget missing');
  if (!plan || !plan.performanceBudgets || plan.performanceBudgets.maxCumulativeLayoutShift !== PERFORMANCE_BUDGETS.maxCumulativeLayoutShift) errors.push('CLS budget missing');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.shellFirst !== true) errors.push('shell-first boundary must be true');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.coldStartVisualGate !== true) errors.push('cold-start visual gate must be true');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.skeletonHydrationReproducible !== true) errors.push('skeleton hydration must be reproducible');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.layoutShiftRegressionFails !== true) errors.push('layout-shift regressions must fail');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.unstyledContentPopInRegressionFails !== true) errors.push('unstyled pop-in regressions must fail');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.usesSkeletonLoader !== true) errors.push('SkeletonLoader must be used');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.usesXTendStyleRegistry !== true) errors.push('XTendStyleRegistry must be used');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.docsAppMonkeypatch !== false) errors.push('docs app monkeypatch must stay false');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.externalNetworkAllowedInLocalGate !== false) errors.push('browser lab must stay offline');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.createsSecondRegistry !== false) errors.push('browser lab must not create a second registry');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.rmtKernelImportsXtendTypes !== false) errors.push('RMT kernel boundary must stay clean');
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);

  return {
    schema: SURFACE_MANAGER_BROWSER_LAB_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors,
    checkedAt: 'static-local',
    workpackage: SURFACE_MANAGER_BROWSER_LAB_WORKPACKAGE,
    targetReadiness: SURFACE_MANAGER_BROWSER_LAB_TARGET
  };
}

function createSurfaceManagerBrowserLabReport(options = {}) {
  const plan = options.plan || createSurfaceManagerBrowserLabPlan(options);
  const validation = validateSurfaceManagerBrowserLabPlan(plan);

  return {
    schema: SURFACE_MANAGER_BROWSER_LAB_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    workpackage: plan.workpackage,
    status: plan.status,
    targetReadiness: plan.targetReadiness,
    visualStates: plan.visualStates.length,
    visualSnapshots: plan.visualSnapshotIds.length,
    appShellProbes: plan.appShellProbes.slice(),
    performanceBudgets: { ...plan.performanceBudgets },
    fixture: plan.fixture,
    visualBaseline: plan.visualBaseline,
    localGate: plan.localGate,
    packageScript: plan.packageScript,
    kernelBoundary: plan.kernelBoundary,
    nextWorkpackage: plan.nextWorkpackage,
    nextDecision: plan.nextDecision
  };
}

module.exports = {
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
};
