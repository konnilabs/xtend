const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-gate-matrix');

const SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_SCHEMA = 'xtend.surface.runtime-release-handoff.v1';
const SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_REPORT_SCHEMA = 'xtend.surface.runtime-release-handoff-report.v1';
const SURFACE_MANAGER_RUNTIME_MIGRATION_NOTES_SCHEMA = 'xtend.surface.runtime-migration-notes.v1';
const SURFACE_MANAGER_RUNTIME_RELEASE_GATE_MATRIX_SCHEMA = 'xtend.surface.runtime-release-gate-matrix.v1';
const SURFACE_MANAGER_RUNTIME_COMPATIBILITY_NOTES_SCHEMA = 'xtend.surface.runtime-compatibility-notes.v1';
const SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_WORKPACKAGE = 'WP-SM-19';
const SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_STATUS = 'accepted-productive-surface-runtime-handoff';
const SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_TARGET = 'productive-surface-runtime-release-ready';
const SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_MODULE = 'catalog/surface-manager-runtime-release-handoff.js';
const SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_SUITE = 'tests/rmt/surface_manager_runtime_release_handoff_suite.js';
const SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_BACKLOG = 'development/BACKLOG-XTend-SurfaceManager-App-Shell-und-RMT-Surface-Runtime.md';
const SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_CONTRACT = 'development/XTend-SurfaceManager-Runtime-Release-Handoff-Contract.md';
const SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_WORKPACKAGE_DOC = 'development/WP-SM-19-Migration-Doku-und-Release-Handoff-fuer-Surface-Runtime-finalisieren.md';
const SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_DOCS = 'development/docs-evidence/root/surface-manager-runtime-release-handoff.md';
const SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_LOCAL_GATE = 'node scripts/run_xtend_tests.js surface-runtime-release-handoff --json';
const SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_PACKAGE_SCRIPT = 'npm run test:surface-runtime-release-handoff';

const PRODUCTIVE_RUNTIME_CLAIMS = Object.freeze([
  'productive-xtend-surface-adapter-runtime',
  'native-surfaces-materialize-xtend-ui-components',
  'restore-key-snapshot-hydration',
  'shell-first-skeleton-hydration',
  'xrouter-bound-surface-lifecycle',
  'modal-focus-inert-stack-policy',
  'layout-engines-docking-split-tile-stacked',
  'remote-surface-trust-policy',
  'browser-lab-visual-stability'
]);

const RELEASE_GATES = Object.freeze([
  'rmt-surface-authoring',
  'surface-controller',
  'surface-manager',
  'surface-side-panel',
  'surface-workbench-fixture',
  'surface-overlay-bridge',
  'surface-manager-quality',
  'surface-native-rmt',
  'surface-release-handoff',
  'surface-adapter-runtime',
  'surface-native-materialization',
  'surface-persistence',
  'surface-lazy-hydration',
  'surface-route-lifecycle',
  'surface-stack-policy',
  'surface-layout-engines',
  'surface-remote-policy',
  'surface-browser-lab',
  'surface-runtime-release-handoff'
]);

const UPDATED_GUIDES = Object.freeze([
  'docs/en/surface-manager-authoring-guide.md',
  'docs/en/surface-manager-migration-guide.md',
  'development/docs-evidence/root/surface-manager-release-handoff.md',
  SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_DOCS
]);

const COMPATIBILITY_FIXTURES = Object.freeze([
  'tests/fixtures/rmt-surface-manager-component-lab.rmt',
  'tests/fixtures/rmt-surface-native-domain.rmt',
  'tests/fixtures/rmt-surface-materialization-shell.rmt',
  'demos/xtendrmt/fixtures/surface-workbench/browser-smoke.html',
  'tests/browser/fixtures/surface-manager-browser-lab.html',
  'tests/components/fixtures/xsurfacemanager-persistence.component.html',
  'tests/components/fixtures/xsurfacemanager-lazy-hydration.component.html',
  'tests/components/fixtures/xsurfacemanager-route-lifecycle.component.html',
  'tests/components/fixtures/xsurfacemanager-stack-policy.component.html',
  'tests/components/fixtures/xsurfacemanager-layout-engines.component.html',
  'tests/components/fixtures/xsurfacemanager-remote-policy.component.html'
]);

const OPEN_SCOPES = Object.freeze([
  'project-specific-pixel-artifact-storage',
  'release-owner-signoff-before-public-npm-publish',
  'optional-command-palette-and-workspace-surface-types',
  'remote-runtime-loading-remains-out-of-scope',
  'docs-app-php-parsedown-host-boundary-remains'
]);

const REQUIRED_ARTIFACTS = Object.freeze([
  SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_MODULE,
  SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_SUITE,
  SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_BACKLOG,
  SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_CONTRACT,
  SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_WORKPACKAGE_DOC,
  SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_DOCS,
  ...UPDATED_GUIDES,
  ...COMPATIBILITY_FIXTURES,
  'package.json',
  'scripts/run_xtend_tests.js'
]);

function includesAll(values, required) {
  return required.every((entry) => Array.isArray(values) && values.includes(entry));
}

function createSurfaceManagerRuntimeReleaseHandoffPlan(options = {}) {
  return {
    schema: SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_SCHEMA,
    reportSchema: SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_REPORT_SCHEMA,
    migrationNotesSchema: SURFACE_MANAGER_RUNTIME_MIGRATION_NOTES_SCHEMA,
    releaseGateMatrixSchema: SURFACE_MANAGER_RUNTIME_RELEASE_GATE_MATRIX_SCHEMA,
    compatibilityNotesSchema: SURFACE_MANAGER_RUNTIME_COMPATIBILITY_NOTES_SCHEMA,
    workpackage: SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_WORKPACKAGE,
    status: SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    targetReadiness: SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_TARGET,
    module: SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_MODULE,
    suite: SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_SUITE,
    backlog: SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_BACKLOG,
    contract: SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_CONTRACT,
    workpackageDocument: SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_WORKPACKAGE_DOC,
    docs: SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_DOCS,
    localGate: SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_LOCAL_GATE,
    packageScript: SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_PACKAGE_SCRIPT,
    requiredArtifacts: REQUIRED_ARTIFACTS.slice(),
    updatedGuides: UPDATED_GUIDES.slice(),
    compatibilityFixtures: COMPATIBILITY_FIXTURES.slice(),
    productiveRuntimeClaims: PRODUCTIVE_RUNTIME_CLAIMS.slice(),
    releaseGates: RELEASE_GATES.slice(),
    openScopes: OPEN_SCOPES.slice(),
    releaseDecision: {
      productiveRuntimeClaimDocumented: true,
      nativeSurfacesAuthoringDefault: true,
      componentMetadataCompatibilityKept: true,
      adapterRuntimeImplemented: true,
      materializationImplemented: true,
      browserLabGateRequired: true,
      semverClassification: '0.x-minor-with-migration-notes',
      publicPublishBlockedUntilReleaseOwnerSignoff: true
    },
    runtimeBoundary: {
      surfaceControllerSingleRegistry: true,
      surfaceManagerSupportsXtendUi: true,
      replacesFabric: false,
      replacesRmtKernel: false,
      replacesXState: false,
      docsAppMonkeypatch: false,
      remoteRuntimeExecutionInKernel: false,
      createsSecondRegistry: false,
      externalNetworkAllowedInLocalGate: false,
      rmtKernelImportsXtendTypes: false
    },
    nextWorkpackage: 'surface-runtime-maintenance',
    nextDecision: 'release-owner-signoff-or-project-specific-hardening',
    kernelBoundary: KERNEL_BOUNDARY
  };
}

function validateSurfaceManagerRuntimeReleaseHandoffPlan(plan = createSurfaceManagerRuntimeReleaseHandoffPlan()) {
  const errors = [];

  if (!plan || plan.schema !== SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_SCHEMA) errors.push(`schema must be ${SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_SCHEMA}`);
  if (!plan || plan.reportSchema !== SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_REPORT_SCHEMA) errors.push(`reportSchema must be ${SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_REPORT_SCHEMA}`);
  if (!plan || plan.migrationNotesSchema !== SURFACE_MANAGER_RUNTIME_MIGRATION_NOTES_SCHEMA) errors.push(`migrationNotesSchema must be ${SURFACE_MANAGER_RUNTIME_MIGRATION_NOTES_SCHEMA}`);
  if (!plan || plan.releaseGateMatrixSchema !== SURFACE_MANAGER_RUNTIME_RELEASE_GATE_MATRIX_SCHEMA) errors.push(`releaseGateMatrixSchema must be ${SURFACE_MANAGER_RUNTIME_RELEASE_GATE_MATRIX_SCHEMA}`);
  if (!plan || plan.compatibilityNotesSchema !== SURFACE_MANAGER_RUNTIME_COMPATIBILITY_NOTES_SCHEMA) errors.push(`compatibilityNotesSchema must be ${SURFACE_MANAGER_RUNTIME_COMPATIBILITY_NOTES_SCHEMA}`);
  if (!plan || plan.workpackage !== SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_WORKPACKAGE) errors.push(`workpackage must be ${SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_WORKPACKAGE}`);
  if (!plan || plan.status !== SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_STATUS) errors.push(`status must be ${SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_STATUS}`);
  if (!plan || plan.targetReadiness !== SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_TARGET) errors.push(`targetReadiness must be ${SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_TARGET}`);
  if (!includesAll(plan && plan.productiveRuntimeClaims, PRODUCTIVE_RUNTIME_CLAIMS)) errors.push('productive runtime claims missing');
  if (!includesAll(plan && plan.releaseGates, RELEASE_GATES)) errors.push('release gates missing');
  if (!includesAll(plan && plan.updatedGuides, UPDATED_GUIDES)) errors.push('updated guides missing');
  if (!includesAll(plan && plan.compatibilityFixtures, COMPATIBILITY_FIXTURES)) errors.push('compatibility fixtures missing');
  if (!includesAll(plan && plan.openScopes, OPEN_SCOPES)) errors.push('open scopes missing');
  if (!plan || !plan.releaseDecision || plan.releaseDecision.productiveRuntimeClaimDocumented !== true) errors.push('productive runtime claim must be documented');
  if (!plan || !plan.releaseDecision || plan.releaseDecision.nativeSurfacesAuthoringDefault !== true) errors.push('native surfaces must be the authoring default');
  if (!plan || !plan.releaseDecision || plan.releaseDecision.componentMetadataCompatibilityKept !== true) errors.push('component metadata compatibility must be kept');
  if (!plan || !plan.releaseDecision || plan.releaseDecision.adapterRuntimeImplemented !== true) errors.push('adapter runtime must be implemented');
  if (!plan || !plan.releaseDecision || plan.releaseDecision.materializationImplemented !== true) errors.push('materialization must be implemented');
  if (!plan || !plan.releaseDecision || plan.releaseDecision.publicPublishBlockedUntilReleaseOwnerSignoff !== true) errors.push('public publish boundary must be explicit');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.surfaceControllerSingleRegistry !== true) errors.push('SurfaceController must remain the single registry');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.replacesFabric !== false) errors.push('SurfaceManager must not replace Fabric');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.replacesRmtKernel !== false) errors.push('SurfaceManager must not replace RMT kernel');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.replacesXState !== false) errors.push('SurfaceManager must not replace xstate');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.createsSecondRegistry !== false) errors.push('runtime handoff must not create a second registry');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.rmtKernelImportsXtendTypes !== false) errors.push('RMT kernel boundary must stay clean');
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);

  return {
    schema: SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors,
    checkedAt: 'static-local',
    workpackage: SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_WORKPACKAGE,
    targetReadiness: SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_TARGET
  };
}

function createSurfaceManagerRuntimeReleaseHandoffReport(options = {}) {
  const plan = options.plan || createSurfaceManagerRuntimeReleaseHandoffPlan(options);
  const validation = validateSurfaceManagerRuntimeReleaseHandoffPlan(plan);

  return {
    schema: SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    workpackage: plan.workpackage,
    status: plan.status,
    targetReadiness: plan.targetReadiness,
    localGate: plan.localGate,
    packageScript: plan.packageScript,
    productiveRuntimeClaims: plan.productiveRuntimeClaims.length,
    releaseGates: plan.releaseGates.length,
    openScopes: plan.openScopes.slice(),
    semverClassification: plan.releaseDecision.semverClassification,
    kernelBoundary: plan.kernelBoundary,
    nextWorkpackage: plan.nextWorkpackage,
    nextDecision: plan.nextDecision
  };
}

module.exports = {
  COMPATIBILITY_FIXTURES,
  KERNEL_BOUNDARY,
  OPEN_SCOPES,
  PRODUCTIVE_RUNTIME_CLAIMS,
  RELEASE_GATES,
  REQUIRED_ARTIFACTS,
  SURFACE_MANAGER_RUNTIME_COMPATIBILITY_NOTES_SCHEMA,
  SURFACE_MANAGER_RUNTIME_MIGRATION_NOTES_SCHEMA,
  SURFACE_MANAGER_RUNTIME_RELEASE_GATE_MATRIX_SCHEMA,
  SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_BACKLOG,
  SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_CONTRACT,
  SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_DOCS,
  SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_LOCAL_GATE,
  SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_MODULE,
  SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_PACKAGE_SCRIPT,
  SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_REPORT_SCHEMA,
  SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_SCHEMA,
  SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_STATUS,
  SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_SUITE,
  SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_TARGET,
  SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_WORKPACKAGE,
  SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_WORKPACKAGE_DOC,
  UPDATED_GUIDES,
  createSurfaceManagerRuntimeReleaseHandoffPlan,
  createSurfaceManagerRuntimeReleaseHandoffReport,
  validateSurfaceManagerRuntimeReleaseHandoffPlan
};
