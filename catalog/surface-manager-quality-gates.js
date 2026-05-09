const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-gate-matrix');

const SURFACE_MANAGER_QUALITY_GATES_SCHEMA = 'xtend.surface.quality-gates.v1';
const SURFACE_MANAGER_QUALITY_GATES_REPORT_SCHEMA = 'xtend.surface.quality-gates-report.v1';
const SURFACE_MANAGER_QUALITY_BROWSER_SMOKE_SCHEMA = 'xtend.surface.quality-gates.browser-smoke.v1';
const SURFACE_MANAGER_QUALITY_VISUAL_BASELINE_SCHEMA = 'xtend.surface.quality-gates.visual-baseline.v1';
const SURFACE_MANAGER_SCHEMA = 'xtend.surface.manager.v1';
const SURFACE_RECORD_SCHEMA = 'xtend.surface.record.v1';
const SURFACE_CONTROLLER_SCHEMA = 'xtend.surface.controller.v1';
const SURFACE_SNAPSHOT_SCHEMA = 'xtend.surface.snapshot.v1';
const SURFACE_OVERLAY_BRIDGE_SCHEMA = 'xtend.surface.overlay-stack-bridge.v1';
const SURFACE_MANAGER_QUALITY_GATES_WORKPACKAGE = 'WP-SM-07';
const SURFACE_MANAGER_QUALITY_GATES_STATUS = 'accepted-quality-gates';
const SURFACE_MANAGER_QUALITY_GATES_TARGET = 'surface-manager-quality-gates-ready';
const SURFACE_MANAGER_QUALITY_GATES_MODULE = 'catalog/surface-manager-quality-gates.js';
const SURFACE_MANAGER_QUALITY_GATES_SUITE = 'tests/components/surface_manager_quality_gates_suite.js';
const SURFACE_MANAGER_QUALITY_GATES_PLAN = 'development/XTend-SurfaceManager-und-Multi-Window-Plan.md';
const SURFACE_MANAGER_QUALITY_GATES_CONTRACT = 'development/XTend-SurfaceManager-Quality-Gates-Contract.md';
const SURFACE_MANAGER_QUALITY_GATES_WORKPACKAGE_DOC = 'development/WP-SM-07-Browser-A11y-Performance-und-Visual-Gates-ergaenzen.md';
const SURFACE_MANAGER_QUALITY_GATES_DOCS = 'docs/surface-manager-quality-gates.md';
const SURFACE_MANAGER_QUALITY_BROWSER_FIXTURE = 'tests/browser/fixtures/surface-manager-quality-smoke.html';
const SURFACE_MANAGER_QUALITY_VISUAL_BASELINE = 'tests/browser/visual-baselines/surface-manager-quality.dom-baseline.json';
const SURFACE_MANAGER_QUALITY_LOCAL_GATE = 'node scripts/run_xtend_tests.js surface-manager-quality --json';
const SURFACE_MANAGER_QUALITY_PACKAGE_SCRIPT = 'npm run test:surface-manager-quality';
const NEXT_WORKPACKAGE = 'WP-SM-08';
const NEXT_DECISION = 'native-rmt-surfaces-domain-and-xtend-surface-adapter';

const QUALITY_DOMAINS = Object.freeze([
  'browser',
  'a11y',
  'performance',
  'visual'
]);

const DOMAIN_GATES = Object.freeze([
  Object.freeze({
    id: 'surface-manager-browser',
    domain: 'browser',
    localGate: 'node scripts/run_xtend_tests.js surface-manager-browser --json',
    packageScript: 'npm run test:surface-manager-browser'
  }),
  Object.freeze({
    id: 'surface-manager-a11y',
    domain: 'a11y',
    localGate: 'node scripts/run_xtend_tests.js surface-manager-a11y --json',
    packageScript: 'npm run test:surface-manager-a11y'
  }),
  Object.freeze({
    id: 'surface-manager-performance',
    domain: 'performance',
    localGate: 'node scripts/run_xtend_tests.js surface-manager-performance --json',
    packageScript: 'npm run test:surface-manager-performance'
  }),
  Object.freeze({
    id: 'surface-manager-visual',
    domain: 'visual',
    localGate: 'node scripts/run_xtend_tests.js surface-manager-visual --json',
    packageScript: 'npm run test:surface-manager-visual'
  })
]);

const COMPONENT_TAGS = Object.freeze([
  'x-surface-manager',
  'x-surface-window',
  'x-side-panel',
  'x-modal',
  'x-dialog',
  'x-drawer'
]);

const SURFACE_TYPES = Object.freeze([
  'window',
  'side-panel',
  'modal',
  'dialog',
  'drawer'
]);

const A11Y_ASSERTIONS = Object.freeze([
  'role-application',
  'role-dialog',
  'role-complementary',
  'aria-live-status',
  'focus-return',
  'escape-topmost',
  'tab-focus-trap',
  'forced-colors-focus-visible',
  'reduced-motion-safe'
]);

const PERFORMANCE_BUDGETS = Object.freeze({
  openCloseBudgetMs: 16,
  focusBudgetMs: 16,
  layoutTransitionBudgetMs: 16,
  snapshotBudgetMs: 8,
  registrationBudgetMs: 16,
  hydrationPolicy: 'visible',
  browserFixtureMeasure: 'surface-quality-open-close'
});

const VISUAL_SNAPSHOT_IDS = Object.freeze([
  'surface-quality-desktop-mixed-stack',
  'surface-quality-mobile-responsive-panel',
  'surface-quality-topmost-overlay',
  'surface-quality-forced-colors-a11y'
]);

const RUNTIME_ARTIFACTS = Object.freeze([
  'components/xsurfacemanager.js',
  'components/xsurfacemanager-controller.js',
  'components/xsurfacewindow.js',
  'components/xsidepanel.js',
  'components/xsurfaceoverlay-bridge.js',
  'components/xmodal.js',
  'components/xdialog.js',
  'components/xdrawer.js'
]);

const REQUIRED_ARTIFACTS = Object.freeze([
  SURFACE_MANAGER_QUALITY_GATES_MODULE,
  SURFACE_MANAGER_QUALITY_GATES_SUITE,
  SURFACE_MANAGER_QUALITY_GATES_CONTRACT,
  SURFACE_MANAGER_QUALITY_GATES_WORKPACKAGE_DOC,
  SURFACE_MANAGER_QUALITY_GATES_DOCS,
  SURFACE_MANAGER_QUALITY_BROWSER_FIXTURE,
  SURFACE_MANAGER_QUALITY_VISUAL_BASELINE,
  'tests/browser/browser_smoke_suite.js',
  ...RUNTIME_ARTIFACTS
]);

const REQUIRED_DOCS = Object.freeze([
  SURFACE_MANAGER_QUALITY_GATES_PLAN,
  SURFACE_MANAGER_QUALITY_GATES_CONTRACT,
  SURFACE_MANAGER_QUALITY_GATES_WORKPACKAGE_DOC,
  SURFACE_MANAGER_QUALITY_GATES_DOCS,
  'docs/surface-manager-overlay-bridge.md',
  'docs/surface-manager-workbench-fixture.md',
  'docs/surface-manager-side-panel-runtime.md',
  'docs/surface-manager-window-runtime.md'
]);

function includesAll(values, required) {
  return required.every((entry) => Array.isArray(values) && values.includes(entry));
}

function createSurfaceManagerQualityGatesPlan(options = {}) {
  return {
    schema: SURFACE_MANAGER_QUALITY_GATES_SCHEMA,
    reportSchema: SURFACE_MANAGER_QUALITY_GATES_REPORT_SCHEMA,
    browserSmokeSchema: SURFACE_MANAGER_QUALITY_BROWSER_SMOKE_SCHEMA,
    visualBaselineSchema: SURFACE_MANAGER_QUALITY_VISUAL_BASELINE_SCHEMA,
    surfaceManagerSchema: SURFACE_MANAGER_SCHEMA,
    surfaceRecordSchema: SURFACE_RECORD_SCHEMA,
    surfaceControllerSchema: SURFACE_CONTROLLER_SCHEMA,
    snapshotSchema: SURFACE_SNAPSHOT_SCHEMA,
    overlayBridgeSchema: SURFACE_OVERLAY_BRIDGE_SCHEMA,
    workpackage: SURFACE_MANAGER_QUALITY_GATES_WORKPACKAGE,
    status: SURFACE_MANAGER_QUALITY_GATES_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    targetReadiness: SURFACE_MANAGER_QUALITY_GATES_TARGET,
    module: SURFACE_MANAGER_QUALITY_GATES_MODULE,
    suite: SURFACE_MANAGER_QUALITY_GATES_SUITE,
    planningDocument: SURFACE_MANAGER_QUALITY_GATES_PLAN,
    contract: SURFACE_MANAGER_QUALITY_GATES_CONTRACT,
    workpackageDocument: SURFACE_MANAGER_QUALITY_GATES_WORKPACKAGE_DOC,
    docs: SURFACE_MANAGER_QUALITY_GATES_DOCS,
    browserFixture: SURFACE_MANAGER_QUALITY_BROWSER_FIXTURE,
    visualBaseline: SURFACE_MANAGER_QUALITY_VISUAL_BASELINE,
    localGate: SURFACE_MANAGER_QUALITY_LOCAL_GATE,
    packageScript: SURFACE_MANAGER_QUALITY_PACKAGE_SCRIPT,
    domainGates: DOMAIN_GATES.map((gate) => ({ ...gate })),
    domains: QUALITY_DOMAINS.slice(),
    runtimeArtifacts: RUNTIME_ARTIFACTS.slice(),
    artifactPaths: REQUIRED_ARTIFACTS.slice(),
    requiredDocs: REQUIRED_DOCS.slice(),
    componentTags: COMPONENT_TAGS.slice(),
    surfaceTypes: SURFACE_TYPES.slice(),
    a11yAssertions: A11Y_ASSERTIONS.slice(),
    performanceBudgets: { ...PERFORMANCE_BUDGETS },
    visualSnapshotIds: VISUAL_SNAPSHOT_IDS.slice(),
    runtimeModel: {
      browser: 'mixed-stack-local-fixture-registered-in-browser-harness',
      a11y: 'static-and-browser-smoke-focus-keyboard-screenreader-policy',
      performance: 'budget-contract-plus-browser-performance-marks',
      visual: 'deterministic-dom-baseline-for-surface-stack-states',
      stack: 'single-controller-stack-for-windows-panels-and-overlays'
    },
    featureFlags: {
      mixedStackBrowserFixtureImplemented: true,
      browserHarnessActivated: true,
      a11yGateImplemented: true,
      performanceGateImplemented: true,
      visualDomBaselineImplemented: true,
      usesWorkbenchFixtureFromWpSm05: true,
      usesOverlayBridgeFromWpSm06: true,
      controllerReusedFromWpSm02: true,
      createsSecondRegistry: false,
      externalNetworkAllowedInLocalGate: false,
      browserRequiredInLocalGate: false,
      nativeSurfacesDomainImplemented: false,
      rmtKernelImportsXtendTypes: false
    },
    kernelBoundary: KERNEL_BOUNDARY,
    nextWorkpackage: NEXT_WORKPACKAGE,
    nextDecision: NEXT_DECISION
  };
}

function validateSurfaceManagerQualityGatesPlan(plan = createSurfaceManagerQualityGatesPlan()) {
  const errors = [];

  if (!plan || plan.schema !== SURFACE_MANAGER_QUALITY_GATES_SCHEMA) errors.push(`schema must be ${SURFACE_MANAGER_QUALITY_GATES_SCHEMA}`);
  if (!plan || plan.reportSchema !== SURFACE_MANAGER_QUALITY_GATES_REPORT_SCHEMA) errors.push(`reportSchema must be ${SURFACE_MANAGER_QUALITY_GATES_REPORT_SCHEMA}`);
  if (!plan || plan.browserSmokeSchema !== SURFACE_MANAGER_QUALITY_BROWSER_SMOKE_SCHEMA) errors.push(`browserSmokeSchema must be ${SURFACE_MANAGER_QUALITY_BROWSER_SMOKE_SCHEMA}`);
  if (!plan || plan.visualBaselineSchema !== SURFACE_MANAGER_QUALITY_VISUAL_BASELINE_SCHEMA) errors.push(`visualBaselineSchema must be ${SURFACE_MANAGER_QUALITY_VISUAL_BASELINE_SCHEMA}`);
  if (!plan || plan.surfaceManagerSchema !== SURFACE_MANAGER_SCHEMA) errors.push(`surfaceManagerSchema must be ${SURFACE_MANAGER_SCHEMA}`);
  if (!plan || plan.surfaceRecordSchema !== SURFACE_RECORD_SCHEMA) errors.push(`surfaceRecordSchema must be ${SURFACE_RECORD_SCHEMA}`);
  if (!plan || plan.surfaceControllerSchema !== SURFACE_CONTROLLER_SCHEMA) errors.push(`surfaceControllerSchema must be ${SURFACE_CONTROLLER_SCHEMA}`);
  if (!plan || plan.snapshotSchema !== SURFACE_SNAPSHOT_SCHEMA) errors.push(`snapshotSchema must be ${SURFACE_SNAPSHOT_SCHEMA}`);
  if (!plan || plan.overlayBridgeSchema !== SURFACE_OVERLAY_BRIDGE_SCHEMA) errors.push(`overlayBridgeSchema must be ${SURFACE_OVERLAY_BRIDGE_SCHEMA}`);
  if (!plan || plan.workpackage !== SURFACE_MANAGER_QUALITY_GATES_WORKPACKAGE) errors.push(`workpackage must be ${SURFACE_MANAGER_QUALITY_GATES_WORKPACKAGE}`);
  if (!plan || plan.status !== SURFACE_MANAGER_QUALITY_GATES_STATUS) errors.push(`status must be ${SURFACE_MANAGER_QUALITY_GATES_STATUS}`);
  if (!plan || plan.targetReadiness !== SURFACE_MANAGER_QUALITY_GATES_TARGET) errors.push(`targetReadiness must be ${SURFACE_MANAGER_QUALITY_GATES_TARGET}`);
  if (!includesAll(plan && plan.domains, QUALITY_DOMAINS)) errors.push('quality domains missing');
  if (!includesAll(plan && plan.componentTags, COMPONENT_TAGS)) errors.push('component tags missing');
  if (!includesAll(plan && plan.surfaceTypes, SURFACE_TYPES)) errors.push('surface types missing');
  if (!includesAll(plan && plan.a11yAssertions, A11Y_ASSERTIONS)) errors.push('a11y assertions missing');
  if (!includesAll(plan && plan.visualSnapshotIds, VISUAL_SNAPSHOT_IDS)) errors.push('visual snapshot ids missing');
  if (!plan || !plan.performanceBudgets || plan.performanceBudgets.openCloseBudgetMs !== PERFORMANCE_BUDGETS.openCloseBudgetMs) errors.push('performance budgets missing');
  if (!plan || plan.featureFlags.mixedStackBrowserFixtureImplemented !== true) errors.push('mixed stack browser fixture must be implemented');
  if (!plan || plan.featureFlags.browserHarnessActivated !== true) errors.push('browser harness must be activated');
  if (!plan || plan.featureFlags.a11yGateImplemented !== true) errors.push('a11y gate must be implemented');
  if (!plan || plan.featureFlags.performanceGateImplemented !== true) errors.push('performance gate must be implemented');
  if (!plan || plan.featureFlags.visualDomBaselineImplemented !== true) errors.push('visual DOM baseline must be implemented');
  if (!plan || plan.featureFlags.usesWorkbenchFixtureFromWpSm05 !== true) errors.push('WP-SM-07 must use WP-SM-05 fixture');
  if (!plan || plan.featureFlags.usesOverlayBridgeFromWpSm06 !== true) errors.push('WP-SM-07 must use WP-SM-06 bridge');
  if (!plan || plan.featureFlags.createsSecondRegistry !== false) errors.push('WP-SM-07 must not create a second registry');
  if (!plan || plan.featureFlags.rmtKernelImportsXtendTypes !== false) errors.push('RMT kernel boundary must stay clean');
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  if (!plan || plan.nextWorkpackage !== NEXT_WORKPACKAGE) errors.push(`nextWorkpackage must be ${NEXT_WORKPACKAGE}`);
  if (!plan || plan.nextDecision !== NEXT_DECISION) errors.push(`nextDecision must be ${NEXT_DECISION}`);

  return {
    schema: SURFACE_MANAGER_QUALITY_GATES_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors,
    checkedAt: 'static-local',
    workpackage: SURFACE_MANAGER_QUALITY_GATES_WORKPACKAGE,
    targetReadiness: SURFACE_MANAGER_QUALITY_GATES_TARGET
  };
}

function createSurfaceManagerQualityGatesReport(options = {}) {
  const plan = options.plan || createSurfaceManagerQualityGatesPlan(options);
  const validation = validateSurfaceManagerQualityGatesPlan(plan);

  return {
    schema: SURFACE_MANAGER_QUALITY_GATES_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    workpackage: plan.workpackage,
    status: plan.status,
    targetReadiness: plan.targetReadiness,
    requestedDomain: options.domain || 'all',
    domains: plan.domains.slice(),
    domainGateCount: plan.domainGates.length,
    componentCount: plan.componentTags.length,
    surfaceTypeCount: plan.surfaceTypes.length,
    a11yAssertionCount: plan.a11yAssertions.length,
    visualSnapshotCount: plan.visualSnapshotIds.length,
    browserFixture: plan.browserFixture,
    visualBaseline: plan.visualBaseline,
    localGate: plan.localGate,
    packageScript: plan.packageScript,
    kernelBoundary: plan.kernelBoundary,
    nextWorkpackage: plan.nextWorkpackage,
    nextDecision: plan.nextDecision
  };
}

module.exports = {
  A11Y_ASSERTIONS,
  COMPONENT_TAGS,
  DOMAIN_GATES,
  KERNEL_BOUNDARY,
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  PERFORMANCE_BUDGETS,
  QUALITY_DOMAINS,
  REQUIRED_ARTIFACTS,
  REQUIRED_DOCS,
  RUNTIME_ARTIFACTS,
  SURFACE_CONTROLLER_SCHEMA,
  SURFACE_MANAGER_QUALITY_BROWSER_FIXTURE,
  SURFACE_MANAGER_QUALITY_BROWSER_SMOKE_SCHEMA,
  SURFACE_MANAGER_QUALITY_GATES_CONTRACT,
  SURFACE_MANAGER_QUALITY_GATES_DOCS,
  SURFACE_MANAGER_QUALITY_GATES_LOCAL_GATE: SURFACE_MANAGER_QUALITY_LOCAL_GATE,
  SURFACE_MANAGER_QUALITY_GATES_MODULE,
  SURFACE_MANAGER_QUALITY_GATES_PACKAGE_SCRIPT: SURFACE_MANAGER_QUALITY_PACKAGE_SCRIPT,
  SURFACE_MANAGER_QUALITY_GATES_PLAN,
  SURFACE_MANAGER_QUALITY_GATES_REPORT_SCHEMA,
  SURFACE_MANAGER_QUALITY_GATES_SCHEMA,
  SURFACE_MANAGER_QUALITY_GATES_STATUS,
  SURFACE_MANAGER_QUALITY_GATES_SUITE,
  SURFACE_MANAGER_QUALITY_GATES_TARGET,
  SURFACE_MANAGER_QUALITY_GATES_WORKPACKAGE,
  SURFACE_MANAGER_QUALITY_GATES_WORKPACKAGE_DOC,
  SURFACE_MANAGER_QUALITY_LOCAL_GATE,
  SURFACE_MANAGER_QUALITY_PACKAGE_SCRIPT,
  SURFACE_MANAGER_QUALITY_VISUAL_BASELINE,
  SURFACE_MANAGER_QUALITY_VISUAL_BASELINE_SCHEMA,
  SURFACE_MANAGER_SCHEMA,
  SURFACE_OVERLAY_BRIDGE_SCHEMA,
  SURFACE_RECORD_SCHEMA,
  SURFACE_SNAPSHOT_SCHEMA,
  SURFACE_TYPES,
  VISUAL_SNAPSHOT_IDS,
  createSurfaceManagerQualityGatesPlan,
  createSurfaceManagerQualityGatesReport,
  validateSurfaceManagerQualityGatesPlan
};
