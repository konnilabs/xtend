const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-gate-matrix');

const SURFACE_MANAGER_RELEASE_HANDOFF_SCHEMA = 'xtend.surface.release-handoff.v1';
const SURFACE_MANAGER_RELEASE_HANDOFF_REPORT_SCHEMA = 'xtend.surface.release-handoff-report.v1';
const SURFACE_MANAGER_COMPONENT_LAB_FIXTURE_SCHEMA = 'xtend.surface.component-lab-fixture.v1';
const SURFACE_MANAGER_SCHEMA = 'xtend.surface.manager.v1';
const SURFACE_RECORD_SCHEMA = 'xtend.surface.record.v1';
const SURFACE_CONTROLLER_SCHEMA = 'xtend.surface.controller.v2';
const SURFACE_SNAPSHOT_SCHEMA = 'xtend.surface.snapshot.v1';
const SURFACE_NATIVE_RMT_SCHEMA = 'xtend.rmt.surfaces-domain.v1';
const SURFACE_ADAPTER_SCHEMA = 'xtend.surface.adapter.v1';
const SURFACE_MANAGER_RELEASE_HANDOFF_WORKPACKAGE = 'WP-SM-09';
const SURFACE_MANAGER_RELEASE_HANDOFF_STATUS = 'accepted-docs-component-lab-release-handoff';
const SURFACE_MANAGER_RELEASE_HANDOFF_TARGET = 'surface-manager-release-handoff-ready';
const SURFACE_MANAGER_RELEASE_HANDOFF_MODULE = 'catalog/surface-manager-release-handoff.js';
const SURFACE_MANAGER_RELEASE_HANDOFF_SUITE = 'tests/rmt/surface_manager_release_handoff_suite.js';
const SURFACE_MANAGER_RELEASE_HANDOFF_PLAN = 'development/XTend-SurfaceManager-und-Multi-Window-Plan.md';
const SURFACE_MANAGER_RELEASE_HANDOFF_CONTRACT = 'development/XTend-SurfaceManager-Release-Handoff-Contract.md';
const SURFACE_MANAGER_RELEASE_HANDOFF_WORKPACKAGE_DOC = 'development/WP-SM-09-Docs-Component-Lab-und-Migration-Guide-finalisieren.md';
const SURFACE_MANAGER_RELEASE_HANDOFF_DOCS = 'development/docs-evidence/root/surface-manager-release-handoff.md';
const SURFACE_MANAGER_AUTHORING_GUIDE = 'docs/en/surface-manager-authoring-guide.md';
const SURFACE_MANAGER_COMPONENT_LAB_DOCS = 'docs/surface-manager-component-lab.md';
const SURFACE_MANAGER_MIGRATION_GUIDE = 'docs/en/surface-manager-migration-guide.md';
const SURFACE_MANAGER_COMPONENT_LAB_FIXTURE = 'tests/fixtures/rmt-surface-manager-component-lab.rmt';
const SURFACE_MANAGER_RELEASE_HANDOFF_LOCAL_GATE = 'node scripts/run_xtend_tests.js surface-release-handoff --json';
const SURFACE_MANAGER_RELEASE_HANDOFF_PACKAGE_SCRIPT = 'npm run test:surface-release-handoff';
const NEXT_WORKPACKAGE = 'surface-manager-stabilization-backlog';
const NEXT_DECISION = 'ship-surface-manager-or-schedule-runtime-hardening';

const AUTHORING_MODES = Object.freeze([
  'component-metadata-mvp',
  'dual-record-handoff',
  'native-surfaces-preferred'
]);

const COMPONENT_LAB_PANELS = Object.freeze([
  'surface-preview',
  'native-rmt-inspector',
  'migration-diff',
  'quality-gates',
  'source-links'
]);

const MIGRATION_STEPS = Object.freeze([
  'inventory-component-metadata-surfaces',
  'stabilize-surface-ids-and-state-keys',
  'add-native-surfaces-records',
  'keep-dual-records-during-handoff',
  'switch-authoring-default-to-surfaces-domain',
  'defer-xtend-surface-runtime-until-adapter-implementation'
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
  'surface-release-handoff'
]);

const REQUIRED_DOCS = Object.freeze([
  SURFACE_MANAGER_RELEASE_HANDOFF_PLAN,
  SURFACE_MANAGER_RELEASE_HANDOFF_CONTRACT,
  SURFACE_MANAGER_RELEASE_HANDOFF_WORKPACKAGE_DOC,
  SURFACE_MANAGER_RELEASE_HANDOFF_DOCS,
  SURFACE_MANAGER_AUTHORING_GUIDE,
  SURFACE_MANAGER_COMPONENT_LAB_DOCS,
  SURFACE_MANAGER_MIGRATION_GUIDE,
  'docs/component-lab.md',
  'development/docs-evidence/root/surface-manager-rmt-authoring.md',
  'docs/surface-manager-native-rmt-surfaces.md',
  'docs/xtendrmt-native-authoring.md',
  'docs/xtendrmt-migration-guide.md'
]);

const REQUIRED_ARTIFACTS = Object.freeze([
  SURFACE_MANAGER_RELEASE_HANDOFF_MODULE,
  SURFACE_MANAGER_RELEASE_HANDOFF_SUITE,
  SURFACE_MANAGER_RELEASE_HANDOFF_CONTRACT,
  SURFACE_MANAGER_RELEASE_HANDOFF_WORKPACKAGE_DOC,
  SURFACE_MANAGER_RELEASE_HANDOFF_DOCS,
  SURFACE_MANAGER_AUTHORING_GUIDE,
  SURFACE_MANAGER_COMPONENT_LAB_DOCS,
  SURFACE_MANAGER_MIGRATION_GUIDE,
  SURFACE_MANAGER_COMPONENT_LAB_FIXTURE
]);

const REQUIRED_PREVIOUS_CONTRACTS = Object.freeze([
  'xtend.rmt.surface-authoring.v1',
  'xtend.surface.controller.v2',
  'xtend.surface.window-runtime.v1',
  'xtend.surface.side-panel-runtime.v1',
  'xtend.surface.workbench-fixture.v1',
  'xtend.surface.overlay-stack-bridge.v1',
  'xtend.surface.quality-gates.v1',
  SURFACE_NATIVE_RMT_SCHEMA,
  SURFACE_ADAPTER_SCHEMA
]);

function includesAll(values, required) {
  return required.every((entry) => Array.isArray(values) && values.includes(entry));
}

function createSurfaceManagerReleaseHandoffPlan(options = {}) {
  return {
    schema: SURFACE_MANAGER_RELEASE_HANDOFF_SCHEMA,
    reportSchema: SURFACE_MANAGER_RELEASE_HANDOFF_REPORT_SCHEMA,
    componentLabFixtureSchema: SURFACE_MANAGER_COMPONENT_LAB_FIXTURE_SCHEMA,
    surfaceManagerSchema: SURFACE_MANAGER_SCHEMA,
    surfaceRecordSchema: SURFACE_RECORD_SCHEMA,
    surfaceControllerSchema: SURFACE_CONTROLLER_SCHEMA,
    snapshotSchema: SURFACE_SNAPSHOT_SCHEMA,
    nativeRmtSchema: SURFACE_NATIVE_RMT_SCHEMA,
    surfaceAdapterSchema: SURFACE_ADAPTER_SCHEMA,
    workpackage: SURFACE_MANAGER_RELEASE_HANDOFF_WORKPACKAGE,
    status: SURFACE_MANAGER_RELEASE_HANDOFF_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    targetReadiness: SURFACE_MANAGER_RELEASE_HANDOFF_TARGET,
    module: SURFACE_MANAGER_RELEASE_HANDOFF_MODULE,
    suite: SURFACE_MANAGER_RELEASE_HANDOFF_SUITE,
    planningDocument: SURFACE_MANAGER_RELEASE_HANDOFF_PLAN,
    contract: SURFACE_MANAGER_RELEASE_HANDOFF_CONTRACT,
    workpackageDocument: SURFACE_MANAGER_RELEASE_HANDOFF_WORKPACKAGE_DOC,
    docs: SURFACE_MANAGER_RELEASE_HANDOFF_DOCS,
    authoringGuide: SURFACE_MANAGER_AUTHORING_GUIDE,
    componentLabDocs: SURFACE_MANAGER_COMPONENT_LAB_DOCS,
    migrationGuide: SURFACE_MANAGER_MIGRATION_GUIDE,
    componentLabFixture: SURFACE_MANAGER_COMPONENT_LAB_FIXTURE,
    localGate: SURFACE_MANAGER_RELEASE_HANDOFF_LOCAL_GATE,
    packageScript: SURFACE_MANAGER_RELEASE_HANDOFF_PACKAGE_SCRIPT,
    artifactPaths: REQUIRED_ARTIFACTS.slice(),
    requiredDocs: REQUIRED_DOCS.slice(),
    previousContracts: REQUIRED_PREVIOUS_CONTRACTS.slice(),
    authoringModes: AUTHORING_MODES.slice(),
    componentLabPanels: COMPONENT_LAB_PANELS.slice(),
    migrationSteps: MIGRATION_STEPS.slice(),
    releaseGates: RELEASE_GATES.slice(),
    releaseDecision: {
      readyForAppShellAuthoring: true,
      readyForNativeSurfacesAuthoring: true,
      readyForRuntimeAdapterImplementation: true,
      publishBoundary: 'no-public-runtime-claim-for-xtend.surface-adapter-yet',
      preferredAuthoringPath: 'native-surfaces-preferred-with-component-metadata-compatibility'
    },
    featureFlags: {
      docsFinalized: true,
      authoringGuideFinalized: true,
      componentLabSurfaceFixtureImplemented: true,
      migrationGuideFinalized: true,
      releaseHandoffDocumented: true,
      nativeSurfacesPreferredForComplexShells: true,
      componentRecordCompatibilityKept: true,
      surfaceAdapterRuntimeImplemented: false,
      createsSecondRegistry: false,
      externalNetworkAllowedInLocalGate: false,
      browserRequiredInLocalGate: false,
      rmtKernelImportsXtendTypes: false
    },
    kernelBoundary: KERNEL_BOUNDARY,
    nextWorkpackage: NEXT_WORKPACKAGE,
    nextDecision: NEXT_DECISION
  };
}

function validateSurfaceManagerReleaseHandoffPlan(plan = createSurfaceManagerReleaseHandoffPlan()) {
  const errors = [];

  if (!plan || plan.schema !== SURFACE_MANAGER_RELEASE_HANDOFF_SCHEMA) errors.push(`schema must be ${SURFACE_MANAGER_RELEASE_HANDOFF_SCHEMA}`);
  if (!plan || plan.reportSchema !== SURFACE_MANAGER_RELEASE_HANDOFF_REPORT_SCHEMA) errors.push(`reportSchema must be ${SURFACE_MANAGER_RELEASE_HANDOFF_REPORT_SCHEMA}`);
  if (!plan || plan.componentLabFixtureSchema !== SURFACE_MANAGER_COMPONENT_LAB_FIXTURE_SCHEMA) errors.push(`componentLabFixtureSchema must be ${SURFACE_MANAGER_COMPONENT_LAB_FIXTURE_SCHEMA}`);
  if (!plan || plan.workpackage !== SURFACE_MANAGER_RELEASE_HANDOFF_WORKPACKAGE) errors.push(`workpackage must be ${SURFACE_MANAGER_RELEASE_HANDOFF_WORKPACKAGE}`);
  if (!plan || plan.status !== SURFACE_MANAGER_RELEASE_HANDOFF_STATUS) errors.push(`status must be ${SURFACE_MANAGER_RELEASE_HANDOFF_STATUS}`);
  if (!plan || plan.targetReadiness !== SURFACE_MANAGER_RELEASE_HANDOFF_TARGET) errors.push(`targetReadiness must be ${SURFACE_MANAGER_RELEASE_HANDOFF_TARGET}`);
  if (!includesAll(plan && plan.previousContracts, REQUIRED_PREVIOUS_CONTRACTS)) errors.push('previous surface contracts missing');
  if (!includesAll(plan && plan.authoringModes, AUTHORING_MODES)) errors.push('authoring modes missing');
  if (!includesAll(plan && plan.componentLabPanels, COMPONENT_LAB_PANELS)) errors.push('component lab panels missing');
  if (!includesAll(plan && plan.migrationSteps, MIGRATION_STEPS)) errors.push('migration steps missing');
  if (!includesAll(plan && plan.releaseGates, RELEASE_GATES)) errors.push('release gates missing');
  if (!plan || !plan.releaseDecision || plan.releaseDecision.readyForAppShellAuthoring !== true) errors.push('release decision must allow app shell authoring');
  if (!plan || !plan.releaseDecision || plan.releaseDecision.readyForNativeSurfacesAuthoring !== true) errors.push('release decision must allow native surfaces authoring');
  if (!plan || !plan.releaseDecision || plan.releaseDecision.publishBoundary !== 'no-public-runtime-claim-for-xtend.surface-adapter-yet') errors.push('publish boundary must keep xtend.surface runtime deferred');
  if (!plan || plan.featureFlags.docsFinalized !== true) errors.push('docs must be finalized');
  if (!plan || plan.featureFlags.authoringGuideFinalized !== true) errors.push('authoring guide must be finalized');
  if (!plan || plan.featureFlags.componentLabSurfaceFixtureImplemented !== true) errors.push('surface component lab fixture must be implemented');
  if (!plan || plan.featureFlags.migrationGuideFinalized !== true) errors.push('migration guide must be finalized');
  if (!plan || plan.featureFlags.releaseHandoffDocumented !== true) errors.push('release handoff must be documented');
  if (!plan || plan.featureFlags.nativeSurfacesPreferredForComplexShells !== true) errors.push('native surfaces must be preferred for complex shells');
  if (!plan || plan.featureFlags.componentRecordCompatibilityKept !== true) errors.push('component metadata compatibility must be kept');
  if (!plan || plan.featureFlags.surfaceAdapterRuntimeImplemented !== false) errors.push('xtend.surface runtime must stay deferred');
  if (!plan || plan.featureFlags.createsSecondRegistry !== false) errors.push('WP-SM-09 must not create a second registry');
  if (!plan || plan.featureFlags.rmtKernelImportsXtendTypes !== false) errors.push('RMT kernel boundary must stay clean');
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  if (!plan || plan.nextWorkpackage !== NEXT_WORKPACKAGE) errors.push(`nextWorkpackage must be ${NEXT_WORKPACKAGE}`);
  if (!plan || plan.nextDecision !== NEXT_DECISION) errors.push(`nextDecision must be ${NEXT_DECISION}`);

  return {
    schema: SURFACE_MANAGER_RELEASE_HANDOFF_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors,
    checkedAt: 'static-local',
    workpackage: SURFACE_MANAGER_RELEASE_HANDOFF_WORKPACKAGE,
    targetReadiness: SURFACE_MANAGER_RELEASE_HANDOFF_TARGET
  };
}

function createSurfaceManagerReleaseHandoffReport(options = {}) {
  const plan = options.plan || createSurfaceManagerReleaseHandoffPlan(options);
  const validation = validateSurfaceManagerReleaseHandoffPlan(plan);

  return {
    schema: SURFACE_MANAGER_RELEASE_HANDOFF_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    workpackage: plan.workpackage,
    status: plan.status,
    targetReadiness: plan.targetReadiness,
    localGate: plan.localGate,
    packageScript: plan.packageScript,
    authoringModes: plan.authoringModes.length,
    componentLabPanels: plan.componentLabPanels.length,
    migrationSteps: plan.migrationSteps.length,
    releaseGates: plan.releaseGates.length,
    componentLabFixture: plan.componentLabFixture,
    kernelBoundary: plan.kernelBoundary,
    nextWorkpackage: plan.nextWorkpackage,
    nextDecision: plan.nextDecision
  };
}

module.exports = {
  AUTHORING_MODES,
  COMPONENT_LAB_PANELS,
  KERNEL_BOUNDARY,
  MIGRATION_STEPS,
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  RELEASE_GATES,
  REQUIRED_ARTIFACTS,
  REQUIRED_DOCS,
  REQUIRED_PREVIOUS_CONTRACTS,
  SURFACE_ADAPTER_SCHEMA,
  SURFACE_CONTROLLER_SCHEMA,
  SURFACE_MANAGER_AUTHORING_GUIDE,
  SURFACE_MANAGER_COMPONENT_LAB_DOCS,
  SURFACE_MANAGER_COMPONENT_LAB_FIXTURE,
  SURFACE_MANAGER_COMPONENT_LAB_FIXTURE_SCHEMA,
  SURFACE_MANAGER_MIGRATION_GUIDE,
  SURFACE_MANAGER_RELEASE_HANDOFF_CONTRACT,
  SURFACE_MANAGER_RELEASE_HANDOFF_DOCS,
  SURFACE_MANAGER_RELEASE_HANDOFF_LOCAL_GATE,
  SURFACE_MANAGER_RELEASE_HANDOFF_MODULE,
  SURFACE_MANAGER_RELEASE_HANDOFF_PACKAGE_SCRIPT,
  SURFACE_MANAGER_RELEASE_HANDOFF_PLAN,
  SURFACE_MANAGER_RELEASE_HANDOFF_REPORT_SCHEMA,
  SURFACE_MANAGER_RELEASE_HANDOFF_SCHEMA,
  SURFACE_MANAGER_RELEASE_HANDOFF_STATUS,
  SURFACE_MANAGER_RELEASE_HANDOFF_SUITE,
  SURFACE_MANAGER_RELEASE_HANDOFF_TARGET,
  SURFACE_MANAGER_RELEASE_HANDOFF_WORKPACKAGE,
  SURFACE_MANAGER_RELEASE_HANDOFF_WORKPACKAGE_DOC,
  SURFACE_MANAGER_SCHEMA,
  SURFACE_NATIVE_RMT_SCHEMA,
  SURFACE_RECORD_SCHEMA,
  SURFACE_SNAPSHOT_SCHEMA,
  createSurfaceManagerReleaseHandoffPlan,
  createSurfaceManagerReleaseHandoffReport,
  validateSurfaceManagerReleaseHandoffPlan
};
