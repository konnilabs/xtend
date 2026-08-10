const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-gate-matrix');

const SURFACE_MANAGER_PERSISTENCE_SCHEMA = 'xtend.surface.manager-persistence.v1';
const SURFACE_MANAGER_PERSISTENCE_REPORT_SCHEMA = 'xtend.surface.manager-persistence-report.v1';
const SURFACE_PERSISTED_SNAPSHOT_SCHEMA = 'xtend.surface.persisted-snapshot.v1';
const SURFACE_SNAPSHOT_SCHEMA = 'xtend.surface.snapshot.v1';
const SURFACE_MANAGER_SCHEMA = 'xtend.surface.manager.v1';
const SURFACE_RECORD_SCHEMA = 'xtend.surface.record.v1';
const SURFACE_CONTROLLER_SCHEMA = 'xtend.surface.controller.v2';
const SURFACE_MANAGER_PERSISTENCE_WORKPACKAGE = 'WP-SM-12';
const SURFACE_MANAGER_PERSISTENCE_STATUS = 'implemented-surface-snapshot-persistence';
const SURFACE_MANAGER_PERSISTENCE_TARGET = 'restore-key-snapshot-hydration-ready';
const SURFACE_MANAGER_PERSISTENCE_MODULE = 'catalog/surface-manager-persistence.js';
const SURFACE_MANAGER_PERSISTENCE_SUITE = 'tests/components/surface_manager_persistence_suite.js';
const SURFACE_MANAGER_PERSISTENCE_FIXTURE = 'tests/components/fixtures/xsurfacemanager-persistence.component.html';
const SURFACE_MANAGER_PERSISTENCE_BACKLOG = 'development/BACKLOG-XTend-SurfaceManager-App-Shell-und-RMT-Surface-Runtime.md';
const SURFACE_MANAGER_PERSISTENCE_WORKPACKAGE_DOC = 'development/WP-SM-12-Persistenz-restore-key-und-Snapshot-Hydration-implementieren.md';
const SURFACE_MANAGER_PERSISTENCE_DOCS = 'docs/surface-manager-persistence.md';
const SURFACE_MANAGER_PERSISTENCE_LOCAL_GATE = 'node scripts/run_xtend_tests.js surface-persistence --json';
const SURFACE_MANAGER_PERSISTENCE_PACKAGE_SCRIPT = 'npm run test:surface-persistence';

const PERSISTENCE_MODES = Object.freeze(['none', 'memory', 'session', 'local']);
const RESTORE_POLICIES = Object.freeze(['auto', 'manual', 'reset']);
const MANAGER_METHODS = Object.freeze([
  'snapshotPersistence',
  'persistSnapshot',
  'restorePersistedSnapshot',
  'clearPersistedSnapshot',
  'resetSurfaceLayout'
]);

const PERSISTENCE_EVENTS = Object.freeze([
  'surface-snapshot-persisted',
  'surface-snapshot-restored',
  'surface-snapshot-cleared',
  'surface-snapshot-reset',
  'surface-restore-skipped',
  'surface-persistence-error'
]);

const REQUIRED_ARTIFACTS = Object.freeze([
  SURFACE_MANAGER_PERSISTENCE_MODULE,
  SURFACE_MANAGER_PERSISTENCE_SUITE,
  SURFACE_MANAGER_PERSISTENCE_FIXTURE,
  SURFACE_MANAGER_PERSISTENCE_BACKLOG,
  SURFACE_MANAGER_PERSISTENCE_WORKPACKAGE_DOC,
  SURFACE_MANAGER_PERSISTENCE_DOCS,
  'components/xsurfacemanager.js',
  'components/xsurfacemanager.d.ts',
  'components/xsurfacemanager-controller.js'
]);

function includesAll(values, required) {
  return required.every((entry) => Array.isArray(values) && values.includes(entry));
}

function createSurfaceManagerPersistencePlan(options = {}) {
  return {
    schema: SURFACE_MANAGER_PERSISTENCE_SCHEMA,
    reportSchema: SURFACE_MANAGER_PERSISTENCE_REPORT_SCHEMA,
    persistedSnapshotSchema: SURFACE_PERSISTED_SNAPSHOT_SCHEMA,
    snapshotSchema: SURFACE_SNAPSHOT_SCHEMA,
    surfaceManagerSchema: SURFACE_MANAGER_SCHEMA,
    surfaceRecordSchema: SURFACE_RECORD_SCHEMA,
    surfaceControllerSchema: SURFACE_CONTROLLER_SCHEMA,
    workpackage: SURFACE_MANAGER_PERSISTENCE_WORKPACKAGE,
    status: SURFACE_MANAGER_PERSISTENCE_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    targetReadiness: SURFACE_MANAGER_PERSISTENCE_TARGET,
    module: SURFACE_MANAGER_PERSISTENCE_MODULE,
    suite: SURFACE_MANAGER_PERSISTENCE_SUITE,
    fixture: SURFACE_MANAGER_PERSISTENCE_FIXTURE,
    backlog: SURFACE_MANAGER_PERSISTENCE_BACKLOG,
    workpackageDocument: SURFACE_MANAGER_PERSISTENCE_WORKPACKAGE_DOC,
    docs: SURFACE_MANAGER_PERSISTENCE_DOCS,
    localGate: SURFACE_MANAGER_PERSISTENCE_LOCAL_GATE,
    packageScript: SURFACE_MANAGER_PERSISTENCE_PACKAGE_SCRIPT,
    requiredArtifacts: REQUIRED_ARTIFACTS.slice(),
    persistenceModes: PERSISTENCE_MODES.slice(),
    restorePolicies: RESTORE_POLICIES.slice(),
    managerMethods: MANAGER_METHODS.slice(),
    events: PERSISTENCE_EVENTS.slice(),
    runtimeBoundary: {
      persistenceAdapterOutsideControllerCore: true,
      controllerRemainsRegistryTruth: true,
      createsSecondRegistry: false,
      storesContentPayload: false,
      persistenceRequiresRestoreKeyOrPolicy: true,
      invalidSnapshotFallsBackControlled: true,
      rmtKernelImportsXtendTypes: false,
      networkRequired: false
    },
    nextWorkpackage: 'WP-SM-14',
    nextDecision: 'xrouter-bound-surface-lifecycles',
    kernelBoundary: KERNEL_BOUNDARY
  };
}

function validateSurfaceManagerPersistencePlan(plan = createSurfaceManagerPersistencePlan()) {
  const errors = [];
  if (!plan || plan.schema !== SURFACE_MANAGER_PERSISTENCE_SCHEMA) errors.push(`schema must be ${SURFACE_MANAGER_PERSISTENCE_SCHEMA}`);
  if (!plan || plan.reportSchema !== SURFACE_MANAGER_PERSISTENCE_REPORT_SCHEMA) errors.push(`reportSchema must be ${SURFACE_MANAGER_PERSISTENCE_REPORT_SCHEMA}`);
  if (!plan || plan.persistedSnapshotSchema !== SURFACE_PERSISTED_SNAPSHOT_SCHEMA) errors.push(`persistedSnapshotSchema must be ${SURFACE_PERSISTED_SNAPSHOT_SCHEMA}`);
  if (!plan || plan.snapshotSchema !== SURFACE_SNAPSHOT_SCHEMA) errors.push(`snapshotSchema must be ${SURFACE_SNAPSHOT_SCHEMA}`);
  if (!plan || plan.workpackage !== SURFACE_MANAGER_PERSISTENCE_WORKPACKAGE) errors.push(`workpackage must be ${SURFACE_MANAGER_PERSISTENCE_WORKPACKAGE}`);
  if (!plan || plan.status !== SURFACE_MANAGER_PERSISTENCE_STATUS) errors.push(`status must be ${SURFACE_MANAGER_PERSISTENCE_STATUS}`);
  if (!includesAll(plan && plan.persistenceModes, PERSISTENCE_MODES)) errors.push('persistence modes missing');
  if (!includesAll(plan && plan.restorePolicies, RESTORE_POLICIES)) errors.push('restore policies missing');
  if (!includesAll(plan && plan.managerMethods, MANAGER_METHODS)) errors.push('manager persistence methods missing');
  if (!includesAll(plan && plan.events, PERSISTENCE_EVENTS)) errors.push('persistence events missing');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.persistenceAdapterOutsideControllerCore !== true) errors.push('persistence adapter must stay outside controller core');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.controllerRemainsRegistryTruth !== true) errors.push('controller must remain registry truth');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.createsSecondRegistry !== false) errors.push('persistence must not create a second registry');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.storesContentPayload !== false) errors.push('persistence must not store content payload');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.invalidSnapshotFallsBackControlled !== true) errors.push('invalid snapshots must fall back controlled');
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  return {
    schema: SURFACE_MANAGER_PERSISTENCE_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors,
    checkedAt: 'static-local',
    workpackage: SURFACE_MANAGER_PERSISTENCE_WORKPACKAGE,
    targetReadiness: SURFACE_MANAGER_PERSISTENCE_TARGET
  };
}

function createSurfaceManagerPersistenceReport(options = {}) {
  const plan = options.plan || createSurfaceManagerPersistencePlan(options);
  const validation = validateSurfaceManagerPersistencePlan(plan);
  return {
    schema: SURFACE_MANAGER_PERSISTENCE_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    workpackage: plan.workpackage,
    status: plan.status,
    targetReadiness: plan.targetReadiness,
    persistenceModes: plan.persistenceModes.slice(),
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
  PERSISTENCE_EVENTS,
  PERSISTENCE_MODES,
  REQUIRED_ARTIFACTS,
  RESTORE_POLICIES,
  SURFACE_CONTROLLER_SCHEMA,
  SURFACE_MANAGER_PERSISTENCE_BACKLOG,
  SURFACE_MANAGER_PERSISTENCE_DOCS,
  SURFACE_MANAGER_PERSISTENCE_FIXTURE,
  SURFACE_MANAGER_PERSISTENCE_LOCAL_GATE,
  SURFACE_MANAGER_PERSISTENCE_MODULE,
  SURFACE_MANAGER_PERSISTENCE_PACKAGE_SCRIPT,
  SURFACE_MANAGER_PERSISTENCE_REPORT_SCHEMA,
  SURFACE_MANAGER_PERSISTENCE_SCHEMA,
  SURFACE_MANAGER_PERSISTENCE_STATUS,
  SURFACE_MANAGER_PERSISTENCE_SUITE,
  SURFACE_MANAGER_PERSISTENCE_TARGET,
  SURFACE_MANAGER_PERSISTENCE_WORKPACKAGE,
  SURFACE_MANAGER_PERSISTENCE_WORKPACKAGE_DOC,
  SURFACE_MANAGER_SCHEMA,
  SURFACE_PERSISTED_SNAPSHOT_SCHEMA,
  SURFACE_RECORD_SCHEMA,
  SURFACE_SNAPSHOT_SCHEMA,
  createSurfaceManagerPersistencePlan,
  createSurfaceManagerPersistenceReport,
  validateSurfaceManagerPersistencePlan
};
