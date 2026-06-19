const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-gate-matrix');

const SURFACE_MANAGER_LAZY_LOADING_SCHEMA = 'xtend.surface.lazy-loading.v1';
const SURFACE_MANAGER_LAZY_LOADING_REPORT_SCHEMA = 'xtend.surface.lazy-loading-report.v1';
const SURFACE_LOADING_POLICY_SCHEMA = 'xtend.surface.loading-policy.v1';
const SURFACE_LOADING_REPORT_SCHEMA = 'xtend.surface.loading-report.v1';
const SKELETON_LOADER_CONTRACT = 'xtend.loader.skeleton-loader.v1';
const STYLE_REGISTRY_CONTRACT = 'xtend.loader.style-registry.v1';
const SURFACE_MANAGER_LAZY_LOADING_WORKPACKAGE = 'WP-SM-13';
const SURFACE_MANAGER_LAZY_LOADING_STATUS = 'implemented-shell-first-lazy-surface-loading';
const SURFACE_MANAGER_LAZY_LOADING_TARGET = 'shell-first-surface-skeleton-hydration-ready';
const SURFACE_MANAGER_LAZY_LOADING_MODULE = 'catalog/surface-manager-lazy-loading.js';
const SURFACE_MANAGER_LAZY_LOADING_SUITE = 'tests/components/surface_manager_lazy_hydration_suite.js';
const SURFACE_MANAGER_LAZY_LOADING_FIXTURE = 'tests/components/fixtures/xsurfacemanager-lazy-hydration.component.html';
const SURFACE_MANAGER_LAZY_LOADING_BACKLOG = 'development/BACKLOG-XTend-SurfaceManager-App-Shell-und-RMT-Surface-Runtime.md';
const SURFACE_MANAGER_LAZY_LOADING_WORKPACKAGE_DOC = 'development/WP-SM-13-Shell-first-Lazy-Surface-Loading-mit-Skeleton-Hydration-bauen.md';
const SURFACE_MANAGER_LAZY_LOADING_DOCS = 'docs/surface-manager-lazy-hydration.md';
const SURFACE_MANAGER_LAZY_LOADING_LOCAL_GATE = 'node scripts/run_xtend_tests.js surface-lazy-hydration --json';
const SURFACE_MANAGER_LAZY_LOADING_PACKAGE_SCRIPT = 'npm run test:surface-lazy-hydration';

const SURFACE_LOADING_POLICIES = Object.freeze(['eager', 'visible', 'open', 'idle', 'route', 'warm', 'prewarm']);
const MANAGER_METHODS = Object.freeze([
  'snapshotSurfaceLoading',
  'hydrateSurfaceContent',
  'registerSurfacePrewarmHandle',
  'registerSurfaceChunkHandle'
]);
const SURFACE_LOADING_EVENTS = Object.freeze([
  'surface-content-loading',
  'surface-content-hydrated',
  'surface-content-hydration-skipped',
  'surface-content-hydration-error'
]);
const REQUIRED_ARTIFACTS = Object.freeze([
  SURFACE_MANAGER_LAZY_LOADING_MODULE,
  SURFACE_MANAGER_LAZY_LOADING_SUITE,
  SURFACE_MANAGER_LAZY_LOADING_FIXTURE,
  SURFACE_MANAGER_LAZY_LOADING_BACKLOG,
  SURFACE_MANAGER_LAZY_LOADING_WORKPACKAGE_DOC,
  SURFACE_MANAGER_LAZY_LOADING_DOCS,
  'components/xsurfacemanager.js',
  'components/xsurfacemanager.d.ts',
  'xtend-loader.js',
  'xtendrmt/rmt-core.esm.js',
  'xtendrmt/rmt-runtime.esm.js',
  'xtendrmt/rmt-runtime.browser.js'
]);

function includesAll(values, required) {
  return required.every((entry) => Array.isArray(values) && values.includes(entry));
}

function createSurfaceManagerLazyLoadingPlan(options = {}) {
  return {
    schema: SURFACE_MANAGER_LAZY_LOADING_SCHEMA,
    reportSchema: SURFACE_MANAGER_LAZY_LOADING_REPORT_SCHEMA,
    loadingPolicySchema: SURFACE_LOADING_POLICY_SCHEMA,
    loadingReportSchema: SURFACE_LOADING_REPORT_SCHEMA,
    skeletonLoaderContract: SKELETON_LOADER_CONTRACT,
    styleRegistryContract: STYLE_REGISTRY_CONTRACT,
    workpackage: SURFACE_MANAGER_LAZY_LOADING_WORKPACKAGE,
    status: SURFACE_MANAGER_LAZY_LOADING_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    targetReadiness: SURFACE_MANAGER_LAZY_LOADING_TARGET,
    module: SURFACE_MANAGER_LAZY_LOADING_MODULE,
    suite: SURFACE_MANAGER_LAZY_LOADING_SUITE,
    fixture: SURFACE_MANAGER_LAZY_LOADING_FIXTURE,
    backlog: SURFACE_MANAGER_LAZY_LOADING_BACKLOG,
    workpackageDocument: SURFACE_MANAGER_LAZY_LOADING_WORKPACKAGE_DOC,
    docs: SURFACE_MANAGER_LAZY_LOADING_DOCS,
    localGate: SURFACE_MANAGER_LAZY_LOADING_LOCAL_GATE,
    packageScript: SURFACE_MANAGER_LAZY_LOADING_PACKAGE_SCRIPT,
    requiredArtifacts: REQUIRED_ARTIFACTS.slice(),
    policies: SURFACE_LOADING_POLICIES.slice(),
    managerMethods: MANAGER_METHODS.slice(),
    events: SURFACE_LOADING_EVENTS.slice(),
    runtimeBoundary: {
      shellFirst: true,
      usesXTendLoader: true,
      usesSkeletonLoader: true,
      usesStyleRegistry: true,
      protectsUnstyledContent: true,
      keepsSkeletonOnHydrationFailure: true,
      supportsParsedownContainerSkeleton: true,
      supportsRemoteCapableContentSlots: true,
      createsSecondRegistry: false,
      rmtKernelImportsXtendTypes: false,
      docsAppMonkeypatch: false,
      networkRequired: false
    },
    nextWorkpackage: 'WP-SM-14',
    nextDecision: 'xrouter-bound-surface-lifecycles',
    kernelBoundary: KERNEL_BOUNDARY
  };
}

function validateSurfaceManagerLazyLoadingPlan(plan = createSurfaceManagerLazyLoadingPlan()) {
  const errors = [];
  if (!plan || plan.schema !== SURFACE_MANAGER_LAZY_LOADING_SCHEMA) errors.push(`schema must be ${SURFACE_MANAGER_LAZY_LOADING_SCHEMA}`);
  if (!plan || plan.reportSchema !== SURFACE_MANAGER_LAZY_LOADING_REPORT_SCHEMA) errors.push(`reportSchema must be ${SURFACE_MANAGER_LAZY_LOADING_REPORT_SCHEMA}`);
  if (!plan || plan.loadingPolicySchema !== SURFACE_LOADING_POLICY_SCHEMA) errors.push(`loadingPolicySchema must be ${SURFACE_LOADING_POLICY_SCHEMA}`);
  if (!plan || plan.skeletonLoaderContract !== SKELETON_LOADER_CONTRACT) errors.push(`skeletonLoaderContract must be ${SKELETON_LOADER_CONTRACT}`);
  if (!plan || plan.styleRegistryContract !== STYLE_REGISTRY_CONTRACT) errors.push(`styleRegistryContract must be ${STYLE_REGISTRY_CONTRACT}`);
  if (!plan || plan.workpackage !== SURFACE_MANAGER_LAZY_LOADING_WORKPACKAGE) errors.push(`workpackage must be ${SURFACE_MANAGER_LAZY_LOADING_WORKPACKAGE}`);
  if (!plan || plan.status !== SURFACE_MANAGER_LAZY_LOADING_STATUS) errors.push(`status must be ${SURFACE_MANAGER_LAZY_LOADING_STATUS}`);
  if (!includesAll(plan && plan.policies, SURFACE_LOADING_POLICIES)) errors.push('surface loading policies missing');
  if (!includesAll(plan && plan.managerMethods, MANAGER_METHODS)) errors.push('surface loading manager methods missing');
  if (!includesAll(plan && plan.events, SURFACE_LOADING_EVENTS)) errors.push('surface loading events missing');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.shellFirst !== true) errors.push('shell-first boundary must be true');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.usesXTendLoader !== true) errors.push('lazy hydration must use XTendLoader');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.usesSkeletonLoader !== true) errors.push('lazy hydration must use SkeletonLoader');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.protectsUnstyledContent !== true) errors.push('unstyled content protection must be true');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.createsSecondRegistry !== false) errors.push('lazy hydration must not create a second registry');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.docsAppMonkeypatch !== false) errors.push('docs app monkeypatch must stay false');
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  return {
    schema: SURFACE_MANAGER_LAZY_LOADING_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors,
    checkedAt: 'static-local',
    workpackage: SURFACE_MANAGER_LAZY_LOADING_WORKPACKAGE,
    targetReadiness: SURFACE_MANAGER_LAZY_LOADING_TARGET
  };
}

function createSurfaceManagerLazyLoadingReport(options = {}) {
  const plan = options.plan || createSurfaceManagerLazyLoadingPlan(options);
  const validation = validateSurfaceManagerLazyLoadingPlan(plan);
  return {
    schema: SURFACE_MANAGER_LAZY_LOADING_REPORT_SCHEMA,
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
  SKELETON_LOADER_CONTRACT,
  STYLE_REGISTRY_CONTRACT,
  SURFACE_LOADING_EVENTS,
  SURFACE_LOADING_POLICIES,
  SURFACE_LOADING_POLICY_SCHEMA,
  SURFACE_LOADING_REPORT_SCHEMA,
  SURFACE_MANAGER_LAZY_LOADING_BACKLOG,
  SURFACE_MANAGER_LAZY_LOADING_DOCS,
  SURFACE_MANAGER_LAZY_LOADING_FIXTURE,
  SURFACE_MANAGER_LAZY_LOADING_LOCAL_GATE,
  SURFACE_MANAGER_LAZY_LOADING_MODULE,
  SURFACE_MANAGER_LAZY_LOADING_PACKAGE_SCRIPT,
  SURFACE_MANAGER_LAZY_LOADING_REPORT_SCHEMA,
  SURFACE_MANAGER_LAZY_LOADING_SCHEMA,
  SURFACE_MANAGER_LAZY_LOADING_STATUS,
  SURFACE_MANAGER_LAZY_LOADING_SUITE,
  SURFACE_MANAGER_LAZY_LOADING_TARGET,
  SURFACE_MANAGER_LAZY_LOADING_WORKPACKAGE,
  SURFACE_MANAGER_LAZY_LOADING_WORKPACKAGE_DOC,
  createSurfaceManagerLazyLoadingPlan,
  createSurfaceManagerLazyLoadingReport,
  validateSurfaceManagerLazyLoadingPlan
};
