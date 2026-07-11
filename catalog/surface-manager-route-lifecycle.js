const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-gate-matrix');

const SURFACE_MANAGER_ROUTE_LIFECYCLE_SCHEMA = 'xtend.surface.route-lifecycle.v1';
const SURFACE_MANAGER_ROUTE_LIFECYCLE_REPORT_SCHEMA = 'xtend.surface.route-lifecycle-report.v1';
const XROUTER_ROUTE_CONTRACT = 'xtend.rmt.xrouter-adapter.v1';
const SURFACE_MANAGER_ROUTE_LIFECYCLE_WORKPACKAGE = 'WP-SM-14';
const SURFACE_MANAGER_ROUTE_LIFECYCLE_STATUS = 'implemented-xrouter-bound-surface-lifecycles';
const SURFACE_MANAGER_ROUTE_LIFECYCLE_TARGET = 'xrouter-bound-surface-lifecycle-ready';
const SURFACE_MANAGER_ROUTE_LIFECYCLE_MODULE = 'catalog/surface-manager-route-lifecycle.js';
const SURFACE_MANAGER_ROUTE_LIFECYCLE_SUITE = 'tests/components/surface_manager_route_lifecycle_suite.js';
const SURFACE_MANAGER_ROUTE_LIFECYCLE_FIXTURE = 'tests/components/fixtures/xsurfacemanager-route-lifecycle.component.html';
const SURFACE_MANAGER_ROUTE_LIFECYCLE_BACKLOG = 'development/BACKLOG-XTend-SurfaceManager-App-Shell-und-RMT-Surface-Runtime.md';
const SURFACE_MANAGER_ROUTE_LIFECYCLE_WORKPACKAGE_DOC = 'development/WP-SM-14-XRouter-gebundene-Surface-Lifecycles-definieren-und-umsetzen.md';
const SURFACE_MANAGER_ROUTE_LIFECYCLE_DOCS = 'development/docs-evidence/root/surface-manager-route-lifecycle.md';
const SURFACE_MANAGER_ROUTE_LIFECYCLE_LOCAL_GATE = 'node scripts/run_xtend_tests.js surface-route-lifecycle --json';
const SURFACE_MANAGER_ROUTE_LIFECYCLE_PACKAGE_SCRIPT = 'npm run test:surface-route-lifecycle';

const ROUTE_LIFECYCLE_POLICIES = Object.freeze(['global', 'open-close', 'open-collapse', 'open-minimize', 'open-keep', 'hydrate-only', 'manual']);
const MANAGER_METHODS = Object.freeze([
  'snapshotRouteLifecycle',
  'applyRouteLifecycle'
]);
const ROUTE_LIFECYCLE_EVENTS = Object.freeze([
  'surface-route-lifecycle-applied',
  'surface-route-lifecycle-skipped'
]);
const REQUIRED_ARTIFACTS = Object.freeze([
  SURFACE_MANAGER_ROUTE_LIFECYCLE_MODULE,
  SURFACE_MANAGER_ROUTE_LIFECYCLE_SUITE,
  SURFACE_MANAGER_ROUTE_LIFECYCLE_FIXTURE,
  SURFACE_MANAGER_ROUTE_LIFECYCLE_BACKLOG,
  SURFACE_MANAGER_ROUTE_LIFECYCLE_WORKPACKAGE_DOC,
  SURFACE_MANAGER_ROUTE_LIFECYCLE_DOCS,
  'components/xsurfacemanager.js',
  'components/xsurfacemanager.d.ts',
  'components/xsidepanel.js',
  'components/xrouter.js',
  'xtendrmt/rmt-core.esm.js',
  'xtendrmt/rmt-runtime.esm.js',
  'xtendrmt/rmt-runtime.browser.js'
]);

function includesAll(values, required) {
  return required.every((entry) => Array.isArray(values) && values.includes(entry));
}

function createSurfaceManagerRouteLifecyclePlan(options = {}) {
  return {
    schema: SURFACE_MANAGER_ROUTE_LIFECYCLE_SCHEMA,
    reportSchema: SURFACE_MANAGER_ROUTE_LIFECYCLE_REPORT_SCHEMA,
    xrouterRouteContract: XROUTER_ROUTE_CONTRACT,
    workpackage: SURFACE_MANAGER_ROUTE_LIFECYCLE_WORKPACKAGE,
    status: SURFACE_MANAGER_ROUTE_LIFECYCLE_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    targetReadiness: SURFACE_MANAGER_ROUTE_LIFECYCLE_TARGET,
    module: SURFACE_MANAGER_ROUTE_LIFECYCLE_MODULE,
    suite: SURFACE_MANAGER_ROUTE_LIFECYCLE_SUITE,
    fixture: SURFACE_MANAGER_ROUTE_LIFECYCLE_FIXTURE,
    backlog: SURFACE_MANAGER_ROUTE_LIFECYCLE_BACKLOG,
    workpackageDocument: SURFACE_MANAGER_ROUTE_LIFECYCLE_WORKPACKAGE_DOC,
    docs: SURFACE_MANAGER_ROUTE_LIFECYCLE_DOCS,
    localGate: SURFACE_MANAGER_ROUTE_LIFECYCLE_LOCAL_GATE,
    packageScript: SURFACE_MANAGER_ROUTE_LIFECYCLE_PACKAGE_SCRIPT,
    requiredArtifacts: REQUIRED_ARTIFACTS.slice(),
    policies: ROUTE_LIFECYCLE_POLICIES.slice(),
    managerMethods: MANAGER_METHODS.slice(),
    events: ROUTE_LIFECYCLE_EVENTS.slice(),
    runtimeBoundary: {
      routeAwareManagerOwnedLifecycle: true,
      xrouterOwnsRouteState: true,
      surfaceManagerOwnsSurfaceLifecycle: true,
      supportsOpenClose: true,
      supportsOpenCollapse: true,
      supportsOpenMinimize: true,
      supportsOpenKeep: true,
      supportsHydrateOnly: true,
      globalSurfacesStayStable: true,
      lazyRoutePayloadsUseSkeletonHydration: true,
      sidePanelStandaloneFallbackRemains: true,
      createsSecondRegistry: false,
      rmtKernelImportsXtendTypes: false,
      networkRequired: false
    },
    nextWorkpackage: 'WP-SM-15',
    nextDecision: 'modal-focus-inert-mixed-stack-policy',
    kernelBoundary: KERNEL_BOUNDARY
  };
}

function validateSurfaceManagerRouteLifecyclePlan(plan = createSurfaceManagerRouteLifecyclePlan()) {
  const errors = [];
  if (!plan || plan.schema !== SURFACE_MANAGER_ROUTE_LIFECYCLE_SCHEMA) errors.push(`schema must be ${SURFACE_MANAGER_ROUTE_LIFECYCLE_SCHEMA}`);
  if (!plan || plan.reportSchema !== SURFACE_MANAGER_ROUTE_LIFECYCLE_REPORT_SCHEMA) errors.push(`reportSchema must be ${SURFACE_MANAGER_ROUTE_LIFECYCLE_REPORT_SCHEMA}`);
  if (!plan || plan.xrouterRouteContract !== XROUTER_ROUTE_CONTRACT) errors.push(`xrouterRouteContract must be ${XROUTER_ROUTE_CONTRACT}`);
  if (!plan || plan.workpackage !== SURFACE_MANAGER_ROUTE_LIFECYCLE_WORKPACKAGE) errors.push(`workpackage must be ${SURFACE_MANAGER_ROUTE_LIFECYCLE_WORKPACKAGE}`);
  if (!plan || plan.status !== SURFACE_MANAGER_ROUTE_LIFECYCLE_STATUS) errors.push(`status must be ${SURFACE_MANAGER_ROUTE_LIFECYCLE_STATUS}`);
  if (!includesAll(plan && plan.policies, ROUTE_LIFECYCLE_POLICIES)) errors.push('route lifecycle policies missing');
  if (!includesAll(plan && plan.managerMethods, MANAGER_METHODS)) errors.push('route lifecycle manager methods missing');
  if (!includesAll(plan && plan.events, ROUTE_LIFECYCLE_EVENTS)) errors.push('route lifecycle events missing');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.routeAwareManagerOwnedLifecycle !== true) errors.push('route-aware manager-owned lifecycle must be true');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.xrouterOwnsRouteState !== true) errors.push('XRouter must remain route-state owner');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.surfaceManagerOwnsSurfaceLifecycle !== true) errors.push('SurfaceManager must own surface lifecycle');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.globalSurfacesStayStable !== true) errors.push('global surfaces must stay stable');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.createsSecondRegistry !== false) errors.push('route lifecycle must not create a second registry');
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  return {
    schema: SURFACE_MANAGER_ROUTE_LIFECYCLE_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors,
    checkedAt: 'static-local',
    workpackage: SURFACE_MANAGER_ROUTE_LIFECYCLE_WORKPACKAGE,
    targetReadiness: SURFACE_MANAGER_ROUTE_LIFECYCLE_TARGET
  };
}

function createSurfaceManagerRouteLifecycleReport(options = {}) {
  const plan = options.plan || createSurfaceManagerRouteLifecyclePlan(options);
  const validation = validateSurfaceManagerRouteLifecyclePlan(plan);
  return {
    schema: SURFACE_MANAGER_ROUTE_LIFECYCLE_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    workpackage: plan.workpackage,
    status: plan.status,
    targetReadiness: plan.targetReadiness,
    policies: plan.policies.slice(),
    managerMethods: plan.managerMethods.length,
    events: plan.events.length,
    localGate: plan.localGate,
    packageScript: plan.packageScript,
    kernelBoundary: plan.kernelBoundary,
    nextWorkpackage: plan.nextWorkpackage,
    nextDecision: plan.nextDecision
  };
}

module.exports = {
  KERNEL_BOUNDARY,
  MANAGER_METHODS,
  REQUIRED_ARTIFACTS,
  ROUTE_LIFECYCLE_EVENTS,
  ROUTE_LIFECYCLE_POLICIES,
  SURFACE_MANAGER_ROUTE_LIFECYCLE_BACKLOG,
  SURFACE_MANAGER_ROUTE_LIFECYCLE_DOCS,
  SURFACE_MANAGER_ROUTE_LIFECYCLE_FIXTURE,
  SURFACE_MANAGER_ROUTE_LIFECYCLE_LOCAL_GATE,
  SURFACE_MANAGER_ROUTE_LIFECYCLE_MODULE,
  SURFACE_MANAGER_ROUTE_LIFECYCLE_PACKAGE_SCRIPT,
  SURFACE_MANAGER_ROUTE_LIFECYCLE_REPORT_SCHEMA,
  SURFACE_MANAGER_ROUTE_LIFECYCLE_SCHEMA,
  SURFACE_MANAGER_ROUTE_LIFECYCLE_STATUS,
  SURFACE_MANAGER_ROUTE_LIFECYCLE_SUITE,
  SURFACE_MANAGER_ROUTE_LIFECYCLE_TARGET,
  SURFACE_MANAGER_ROUTE_LIFECYCLE_WORKPACKAGE,
  SURFACE_MANAGER_ROUTE_LIFECYCLE_WORKPACKAGE_DOC,
  XROUTER_ROUTE_CONTRACT,
  createSurfaceManagerRouteLifecyclePlan,
  createSurfaceManagerRouteLifecycleReport,
  validateSurfaceManagerRouteLifecyclePlan
};
