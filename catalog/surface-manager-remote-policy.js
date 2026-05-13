const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-gate-matrix');

const SURFACE_MANAGER_REMOTE_POLICY_SCHEMA = 'xtend.surface.remote-policy-bridge.v1';
const SURFACE_MANAGER_REMOTE_POLICY_REPORT_SCHEMA = 'xtend.surface.remote-policy-report.v1';
const SURFACE_MANAGER_REMOTE_POLICY_DIAGNOSTIC_SCHEMA = 'xtend.surface.remote-policy-diagnostic.v1';
const SURFACE_MANAGER_REMOTE_POLICY_WORKPACKAGE = 'WP-SM-17';
const SURFACE_MANAGER_REMOTE_POLICY_STATUS = 'implemented-remote-surface-trust-policy';
const SURFACE_MANAGER_REMOTE_POLICY_TARGET = 'remote-surface-policy-bridge-ready';
const SURFACE_MANAGER_REMOTE_POLICY_MODULE = 'catalog/surface-manager-remote-policy.js';
const SURFACE_MANAGER_REMOTE_POLICY_SUITE = 'tests/components/surface_manager_remote_policy_suite.js';
const SURFACE_MANAGER_REMOTE_POLICY_FIXTURE = 'tests/components/fixtures/xsurfacemanager-remote-policy.component.html';
const SURFACE_MANAGER_REMOTE_POLICY_BACKLOG = 'development/BACKLOG-XTend-SurfaceManager-App-Shell-und-RMT-Surface-Runtime.md';
const SURFACE_MANAGER_REMOTE_POLICY_WORKPACKAGE_DOC = 'development/WP-SM-17-Remote-Surface-Trust-Ownership-und-Capability-Policies-anbinden.md';
const SURFACE_MANAGER_REMOTE_POLICY_DOCS = 'docs/surface-manager-remote-policy.md';
const SURFACE_MANAGER_REMOTE_POLICY_LOCAL_GATE = 'node scripts/run_xtend_tests.js surface-remote-policy --json';
const SURFACE_MANAGER_REMOTE_POLICY_PACKAGE_SCRIPT = 'npm run test:surface-remote-policy';
const SURFACE_REMOTE_TRUST_BOUNDARY = 'xtend.security.remote-surface.v1';

const REMOTE_POLICY_METHODS = Object.freeze([
  'evaluateRemoteSurfacePolicy',
  'applyRemoteSurfacePolicy',
  'registerRemoteSurface',
  'snapshotRemoteSurfacePolicy',
  'governRemoteSurfaceEvent'
]);

const REMOTE_POLICY_EVENTS = Object.freeze([
  'remote-surface-mounted',
  'remote-surface-degraded',
  'remote-surface-refused',
  'remote-surface-event-governed',
  'remote-surface-event-refused'
]);

const REMOTE_POLICY_DECISIONS = Object.freeze([
  'mounted',
  'degraded',
  'refused'
]);

const REMOTE_POLICY_DIAGNOSTICS = Object.freeze([
  'xtend.surface.remote-policy.owner-missing',
  'xtend.surface.remote-policy.version-missing',
  'xtend.surface.remote-policy.origin-not-allowed',
  'xtend.surface.remote-policy.integrity-missing',
  'xtend.surface.remote-policy.trust-boundary-refused',
  'xtend.surface.remote-policy.capability-refused',
  'xtend.surface.remote-policy.event-payload-missing',
  'xtend.surface.remote-policy.event-scope-refused',
  'xtend.surface.remote-policy.degradation-blocked',
  'xtend.surface.remote-policy.fallback-missing'
]);

const REQUIRED_ARTIFACTS = Object.freeze([
  SURFACE_MANAGER_REMOTE_POLICY_MODULE,
  SURFACE_MANAGER_REMOTE_POLICY_SUITE,
  SURFACE_MANAGER_REMOTE_POLICY_FIXTURE,
  SURFACE_MANAGER_REMOTE_POLICY_BACKLOG,
  SURFACE_MANAGER_REMOTE_POLICY_WORKPACKAGE_DOC,
  SURFACE_MANAGER_REMOTE_POLICY_DOCS,
  'components/xsurfacemanager.js',
  'components/xsurfacemanager.d.ts',
  'xtendrmt/rmt-core.esm.js',
  'xtendrmt/rmt-runtime.esm.js',
  'xtendrmt/rmt-runtime.browser.js',
  'xtendrmt/rmt-core.d.ts'
]);

function includesAll(values, required) {
  return required.every((entry) => Array.isArray(values) && values.includes(entry));
}

function createSurfaceManagerRemotePolicyPlan(options = {}) {
  return {
    schema: SURFACE_MANAGER_REMOTE_POLICY_SCHEMA,
    reportSchema: SURFACE_MANAGER_REMOTE_POLICY_REPORT_SCHEMA,
    diagnosticSchema: SURFACE_MANAGER_REMOTE_POLICY_DIAGNOSTIC_SCHEMA,
    workpackage: SURFACE_MANAGER_REMOTE_POLICY_WORKPACKAGE,
    status: SURFACE_MANAGER_REMOTE_POLICY_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    targetReadiness: SURFACE_MANAGER_REMOTE_POLICY_TARGET,
    module: SURFACE_MANAGER_REMOTE_POLICY_MODULE,
    suite: SURFACE_MANAGER_REMOTE_POLICY_SUITE,
    fixture: SURFACE_MANAGER_REMOTE_POLICY_FIXTURE,
    backlog: SURFACE_MANAGER_REMOTE_POLICY_BACKLOG,
    workpackageDocument: SURFACE_MANAGER_REMOTE_POLICY_WORKPACKAGE_DOC,
    docs: SURFACE_MANAGER_REMOTE_POLICY_DOCS,
    localGate: SURFACE_MANAGER_REMOTE_POLICY_LOCAL_GATE,
    packageScript: SURFACE_MANAGER_REMOTE_POLICY_PACKAGE_SCRIPT,
    trustBoundary: SURFACE_REMOTE_TRUST_BOUNDARY,
    requiredArtifacts: REQUIRED_ARTIFACTS.slice(),
    methods: REMOTE_POLICY_METHODS.slice(),
    events: REMOTE_POLICY_EVENTS.slice(),
    decisions: REMOTE_POLICY_DECISIONS.slice(),
    diagnostics: REMOTE_POLICY_DIAGNOSTICS.slice(),
    runtimeBoundary: {
      managerOwnsHostDecision: true,
      controllerOwnsRegistry: true,
      consumesE16RemoteRecords: true,
      enterpriseRegistryLookup: true,
      ownerVersionOriginIntegrityChecks: true,
      capabilityDenyByDefault: true,
      sandboxPolicyHostOwned: true,
      degradationFallback: true,
      eventGovernanceBridge: true,
      rmtKernelRemoteExecution: false,
      createsSecondRegistry: false
    },
    adapterBoundary: {
      adapterForwardsRemoteRecords: true,
      adapterDoesNotLoadRemoteRuntime: true,
      materializesFallbackShellOnly: true
    },
    nextWorkpackage: 'WP-SM-18',
    nextDecision: 'browser-lab-visual-stability',
    kernelBoundary: KERNEL_BOUNDARY
  };
}

function validateSurfaceManagerRemotePolicyPlan(plan = createSurfaceManagerRemotePolicyPlan()) {
  const errors = [];
  if (!plan || plan.schema !== SURFACE_MANAGER_REMOTE_POLICY_SCHEMA) errors.push(`schema must be ${SURFACE_MANAGER_REMOTE_POLICY_SCHEMA}`);
  if (!plan || plan.reportSchema !== SURFACE_MANAGER_REMOTE_POLICY_REPORT_SCHEMA) errors.push(`reportSchema must be ${SURFACE_MANAGER_REMOTE_POLICY_REPORT_SCHEMA}`);
  if (!plan || plan.diagnosticSchema !== SURFACE_MANAGER_REMOTE_POLICY_DIAGNOSTIC_SCHEMA) errors.push(`diagnosticSchema must be ${SURFACE_MANAGER_REMOTE_POLICY_DIAGNOSTIC_SCHEMA}`);
  if (!plan || plan.workpackage !== SURFACE_MANAGER_REMOTE_POLICY_WORKPACKAGE) errors.push(`workpackage must be ${SURFACE_MANAGER_REMOTE_POLICY_WORKPACKAGE}`);
  if (!plan || plan.status !== SURFACE_MANAGER_REMOTE_POLICY_STATUS) errors.push(`status must be ${SURFACE_MANAGER_REMOTE_POLICY_STATUS}`);
  if (!plan || plan.targetReadiness !== SURFACE_MANAGER_REMOTE_POLICY_TARGET) errors.push(`targetReadiness must be ${SURFACE_MANAGER_REMOTE_POLICY_TARGET}`);
  if (!includesAll(plan && plan.methods, REMOTE_POLICY_METHODS)) errors.push('remote policy methods missing');
  if (!includesAll(plan && plan.events, REMOTE_POLICY_EVENTS)) errors.push('remote policy events missing');
  if (!includesAll(plan && plan.decisions, REMOTE_POLICY_DECISIONS)) errors.push('remote policy decisions missing');
  if (!includesAll(plan && plan.diagnostics, REMOTE_POLICY_DIAGNOSTICS)) errors.push('remote policy diagnostics missing');
  if (!plan || plan.trustBoundary !== SURFACE_REMOTE_TRUST_BOUNDARY) errors.push(`trustBoundary must be ${SURFACE_REMOTE_TRUST_BOUNDARY}`);
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.managerOwnsHostDecision !== true) errors.push('manager must own host policy decision');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.controllerOwnsRegistry !== true) errors.push('controller must remain registry owner');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.rmtKernelRemoteExecution !== false) errors.push('RMT kernel must not execute remote runtime');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.createsSecondRegistry !== false) errors.push('remote policy must not create a second registry');
  if (!plan || !plan.adapterBoundary || plan.adapterBoundary.adapterDoesNotLoadRemoteRuntime !== true) errors.push('adapter must not load remote runtime');
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  return {
    schema: SURFACE_MANAGER_REMOTE_POLICY_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors,
    checkedAt: 'static-local',
    workpackage: SURFACE_MANAGER_REMOTE_POLICY_WORKPACKAGE,
    targetReadiness: SURFACE_MANAGER_REMOTE_POLICY_TARGET
  };
}

function createSurfaceManagerRemotePolicyReport(options = {}) {
  const plan = options.plan || createSurfaceManagerRemotePolicyPlan(options);
  const validation = validateSurfaceManagerRemotePolicyPlan(plan);
  return {
    schema: SURFACE_MANAGER_REMOTE_POLICY_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    workpackage: plan.workpackage,
    status: plan.status,
    targetReadiness: plan.targetReadiness,
    trustBoundary: plan.trustBoundary,
    methodCount: plan.methods.length,
    eventCount: plan.events.length,
    decisionCount: plan.decisions.length,
    diagnosticCount: plan.diagnostics.length,
    localGate: plan.localGate,
    packageScript: plan.packageScript,
    kernelBoundary: plan.kernelBoundary,
    nextWorkpackage: plan.nextWorkpackage,
    nextDecision: plan.nextDecision
  };
}

module.exports = {
  KERNEL_BOUNDARY,
  REMOTE_POLICY_DECISIONS,
  REMOTE_POLICY_DIAGNOSTICS,
  REMOTE_POLICY_EVENTS,
  REMOTE_POLICY_METHODS,
  REQUIRED_ARTIFACTS,
  SURFACE_MANAGER_REMOTE_POLICY_BACKLOG,
  SURFACE_MANAGER_REMOTE_POLICY_DIAGNOSTIC_SCHEMA,
  SURFACE_MANAGER_REMOTE_POLICY_DOCS,
  SURFACE_MANAGER_REMOTE_POLICY_FIXTURE,
  SURFACE_MANAGER_REMOTE_POLICY_LOCAL_GATE,
  SURFACE_MANAGER_REMOTE_POLICY_MODULE,
  SURFACE_MANAGER_REMOTE_POLICY_PACKAGE_SCRIPT,
  SURFACE_MANAGER_REMOTE_POLICY_REPORT_SCHEMA,
  SURFACE_MANAGER_REMOTE_POLICY_SCHEMA,
  SURFACE_MANAGER_REMOTE_POLICY_STATUS,
  SURFACE_MANAGER_REMOTE_POLICY_SUITE,
  SURFACE_MANAGER_REMOTE_POLICY_TARGET,
  SURFACE_MANAGER_REMOTE_POLICY_WORKPACKAGE,
  SURFACE_MANAGER_REMOTE_POLICY_WORKPACKAGE_DOC,
  SURFACE_REMOTE_TRUST_BOUNDARY,
  createSurfaceManagerRemotePolicyPlan,
  createSurfaceManagerRemotePolicyReport,
  validateSurfaceManagerRemotePolicyPlan
};
