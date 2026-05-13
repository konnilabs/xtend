const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-gate-matrix');

const SURFACE_MANAGER_STACK_POLICY_SCHEMA = 'xtend.surface.stack-policy.v1';
const SURFACE_MANAGER_STACK_POLICY_REPORT_SCHEMA = 'xtend.surface.stack-policy-report.v1';
const SURFACE_MANAGER_STACK_POLICY_DIAGNOSTIC_SCHEMA = 'xtend.surface.stack-policy-diagnostic.v1';
const SURFACE_MANAGER_STACK_POLICY_WORKPACKAGE = 'WP-SM-15';
const SURFACE_MANAGER_STACK_POLICY_STATUS = 'implemented-modal-focus-inert-mixed-stack-policy';
const SURFACE_MANAGER_STACK_POLICY_TARGET = 'mixed-stack-modal-focus-inert-ready';
const SURFACE_MANAGER_STACK_POLICY_MODULE = 'catalog/surface-manager-stack-policy.js';
const SURFACE_MANAGER_STACK_POLICY_SUITE = 'tests/components/surface_manager_stack_policy_suite.js';
const SURFACE_MANAGER_STACK_POLICY_FIXTURE = 'tests/components/fixtures/xsurfacemanager-stack-policy.component.html';
const SURFACE_MANAGER_STACK_POLICY_BACKLOG = 'development/BACKLOG-XTend-SurfaceManager-App-Shell-und-RMT-Surface-Runtime.md';
const SURFACE_MANAGER_STACK_POLICY_WORKPACKAGE_DOC = 'development/WP-SM-15-Modal-Focus-Inert-und-Mixed-Stack-Policy-haerten.md';
const SURFACE_MANAGER_STACK_POLICY_DOCS = 'docs/surface-manager-stack-policy.md';
const SURFACE_MANAGER_STACK_POLICY_LOCAL_GATE = 'node scripts/run_xtend_tests.js surface-stack-policy --json';
const SURFACE_MANAGER_STACK_POLICY_PACKAGE_SCRIPT = 'npm run test:surface-stack-policy';

const MODAL_POLICIES = Object.freeze(['topmost', 'none', 'all-modal', 'surface-modal']);
const MANAGER_METHODS = Object.freeze([
  'snapshotStackPolicy',
  'applyStackPolicy'
]);
const STACK_POLICY_EVENTS = Object.freeze([
  'surface-stack-policy-applied',
  'surface-stack-policy-escape',
  'surface-stack-policy-focus',
  'surface-stack-policy-focus-restored',
  'surface-stack-policy-error'
]);
const REQUIRED_ARTIFACTS = Object.freeze([
  SURFACE_MANAGER_STACK_POLICY_MODULE,
  SURFACE_MANAGER_STACK_POLICY_SUITE,
  SURFACE_MANAGER_STACK_POLICY_FIXTURE,
  SURFACE_MANAGER_STACK_POLICY_BACKLOG,
  SURFACE_MANAGER_STACK_POLICY_WORKPACKAGE_DOC,
  SURFACE_MANAGER_STACK_POLICY_DOCS,
  'components/xsurfacemanager.js',
  'components/xsurfacemanager.d.ts',
  'components/xsurfacewindow.js',
  'components/xsidepanel.js',
  'components/xsurfaceoverlay-bridge.js',
  'components/xmodal.js',
  'components/xdialog.js',
  'components/xdrawer.js'
]);

function includesAll(values, required) {
  return required.every((entry) => Array.isArray(values) && values.includes(entry));
}

function createSurfaceManagerStackPolicyPlan(options = {}) {
  return {
    schema: SURFACE_MANAGER_STACK_POLICY_SCHEMA,
    reportSchema: SURFACE_MANAGER_STACK_POLICY_REPORT_SCHEMA,
    diagnosticSchema: SURFACE_MANAGER_STACK_POLICY_DIAGNOSTIC_SCHEMA,
    workpackage: SURFACE_MANAGER_STACK_POLICY_WORKPACKAGE,
    status: SURFACE_MANAGER_STACK_POLICY_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    targetReadiness: SURFACE_MANAGER_STACK_POLICY_TARGET,
    module: SURFACE_MANAGER_STACK_POLICY_MODULE,
    suite: SURFACE_MANAGER_STACK_POLICY_SUITE,
    fixture: SURFACE_MANAGER_STACK_POLICY_FIXTURE,
    backlog: SURFACE_MANAGER_STACK_POLICY_BACKLOG,
    workpackageDocument: SURFACE_MANAGER_STACK_POLICY_WORKPACKAGE_DOC,
    docs: SURFACE_MANAGER_STACK_POLICY_DOCS,
    localGate: SURFACE_MANAGER_STACK_POLICY_LOCAL_GATE,
    packageScript: SURFACE_MANAGER_STACK_POLICY_PACKAGE_SCRIPT,
    requiredArtifacts: REQUIRED_ARTIFACTS.slice(),
    modalPolicies: MODAL_POLICIES.slice(),
    managerMethods: MANAGER_METHODS.slice(),
    events: STACK_POLICY_EVENTS.slice(),
    runtimeBoundary: {
      modalPolicyManagerOwned: true,
      focusTrapAcrossSurfaces: true,
      focusRestoreAcrossSurfaces: true,
      inertBackgroundSurfaces: true,
      ariaHiddenBackgroundSurfaces: true,
      topmostEscapePriority: true,
      scrollLockForActiveModal: true,
      layerTokensForMixedStack: true,
      a11yDiagnostics: true,
      overlayCompatibilityPreserved: true,
      surfaceManagerSupportsXtendUi: true,
      replacesFabricOrRmtKernel: false,
      createsSecondRegistry: false,
      rmtKernelImportsXtendTypes: false,
      networkRequired: false
    },
    nextWorkpackage: 'WP-SM-16',
    nextDecision: 'surface-layout-engines',
    kernelBoundary: KERNEL_BOUNDARY
  };
}

function validateSurfaceManagerStackPolicyPlan(plan = createSurfaceManagerStackPolicyPlan()) {
  const errors = [];
  if (!plan || plan.schema !== SURFACE_MANAGER_STACK_POLICY_SCHEMA) errors.push(`schema must be ${SURFACE_MANAGER_STACK_POLICY_SCHEMA}`);
  if (!plan || plan.reportSchema !== SURFACE_MANAGER_STACK_POLICY_REPORT_SCHEMA) errors.push(`reportSchema must be ${SURFACE_MANAGER_STACK_POLICY_REPORT_SCHEMA}`);
  if (!plan || plan.diagnosticSchema !== SURFACE_MANAGER_STACK_POLICY_DIAGNOSTIC_SCHEMA) errors.push(`diagnosticSchema must be ${SURFACE_MANAGER_STACK_POLICY_DIAGNOSTIC_SCHEMA}`);
  if (!plan || plan.workpackage !== SURFACE_MANAGER_STACK_POLICY_WORKPACKAGE) errors.push(`workpackage must be ${SURFACE_MANAGER_STACK_POLICY_WORKPACKAGE}`);
  if (!plan || plan.status !== SURFACE_MANAGER_STACK_POLICY_STATUS) errors.push(`status must be ${SURFACE_MANAGER_STACK_POLICY_STATUS}`);
  if (!includesAll(plan && plan.modalPolicies, MODAL_POLICIES)) errors.push('modal policies missing');
  if (!includesAll(plan && plan.managerMethods, MANAGER_METHODS)) errors.push('stack policy manager methods missing');
  if (!includesAll(plan && plan.events, STACK_POLICY_EVENTS)) errors.push('stack policy events missing');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.modalPolicyManagerOwned !== true) errors.push('modal policy must be manager-owned');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.focusTrapAcrossSurfaces !== true) errors.push('focus trap across surfaces must be true');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.inertBackgroundSurfaces !== true) errors.push('background surfaces must be inert');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.topmostEscapePriority !== true) errors.push('topmost Escape priority must be true');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.overlayCompatibilityPreserved !== true) errors.push('overlay compatibility must be preserved');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.replacesFabricOrRmtKernel !== false) errors.push('stack policy must not replace Fabric or RMT Kernel');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.createsSecondRegistry !== false) errors.push('stack policy must not create a second registry');
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  return {
    schema: SURFACE_MANAGER_STACK_POLICY_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors,
    checkedAt: 'static-local',
    workpackage: SURFACE_MANAGER_STACK_POLICY_WORKPACKAGE,
    targetReadiness: SURFACE_MANAGER_STACK_POLICY_TARGET
  };
}

function createSurfaceManagerStackPolicyReport(options = {}) {
  const plan = options.plan || createSurfaceManagerStackPolicyPlan(options);
  const validation = validateSurfaceManagerStackPolicyPlan(plan);
  return {
    schema: SURFACE_MANAGER_STACK_POLICY_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    workpackage: plan.workpackage,
    status: plan.status,
    targetReadiness: plan.targetReadiness,
    modalPolicies: plan.modalPolicies.slice(),
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
  MODAL_POLICIES,
  REQUIRED_ARTIFACTS,
  STACK_POLICY_EVENTS,
  SURFACE_MANAGER_STACK_POLICY_BACKLOG,
  SURFACE_MANAGER_STACK_POLICY_DIAGNOSTIC_SCHEMA,
  SURFACE_MANAGER_STACK_POLICY_DOCS,
  SURFACE_MANAGER_STACK_POLICY_FIXTURE,
  SURFACE_MANAGER_STACK_POLICY_LOCAL_GATE,
  SURFACE_MANAGER_STACK_POLICY_MODULE,
  SURFACE_MANAGER_STACK_POLICY_PACKAGE_SCRIPT,
  SURFACE_MANAGER_STACK_POLICY_REPORT_SCHEMA,
  SURFACE_MANAGER_STACK_POLICY_SCHEMA,
  SURFACE_MANAGER_STACK_POLICY_STATUS,
  SURFACE_MANAGER_STACK_POLICY_SUITE,
  SURFACE_MANAGER_STACK_POLICY_TARGET,
  SURFACE_MANAGER_STACK_POLICY_WORKPACKAGE,
  SURFACE_MANAGER_STACK_POLICY_WORKPACKAGE_DOC,
  createSurfaceManagerStackPolicyPlan,
  createSurfaceManagerStackPolicyReport,
  validateSurfaceManagerStackPolicyPlan
};
