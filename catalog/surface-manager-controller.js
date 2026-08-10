const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-gate-matrix');

const SURFACE_CONTROLLER_SCHEMA = 'xtend.surface.controller.v2';
const SURFACE_CONTROLLER_REPORT_SCHEMA = 'xtend.surface.controller-report.v1';
const SURFACE_RECORD_SCHEMA = 'xtend.surface.record.v1';
const SURFACE_SNAPSHOT_SCHEMA = 'xtend.surface.snapshot.v1';
const SURFACE_DIAGNOSTIC_SCHEMA = 'xtend.surface.diagnostic.v1';
const SURFACE_OPERATION_RESULT_SCHEMA = 'xtend.surface.operation-result.v1';
const SURFACE_CONTROLLER_WORKPACKAGE = 'WP-SM-02';
const SURFACE_CONTROLLER_STATUS = 'accepted-controller-contract';
const SURFACE_CONTROLLER_TARGET = 'surface-controller-state-snapshot-ready';
const SURFACE_CONTROLLER_MODULE = 'catalog/surface-manager-controller.js';
const SURFACE_CONTROLLER_RUNTIME = 'components/xsurfacemanager-controller.js';
const SURFACE_CONTROLLER_TYPES = 'components/xsurfacemanager-controller.d.ts';
const SURFACE_CONTROLLER_SUITE = 'tests/components/surface_controller_suite.js';
const SURFACE_CONTROLLER_PLAN = 'development/XTend-SurfaceManager-und-Multi-Window-Plan.md';
const SURFACE_CONTROLLER_CONTRACT = 'development/XTend-SurfaceManager-Controller-und-State-Snapshot-Contract.md';
const SURFACE_CONTROLLER_WORKPACKAGE_DOC = 'development/WP-SM-02-Surface-Controller-und-State-Snapshot-bauen.md';
const SURFACE_CONTROLLER_DOCS = 'docs/en/surface-manager-controller.md';
const SURFACE_CONTROLLER_LOCAL_GATE = 'node scripts/run_xtend_tests.js surface-controller --json';
const SURFACE_CONTROLLER_PACKAGE_SCRIPT = 'npm run test:surface-controller';
const NEXT_WORKPACKAGE = 'WP-SM-03';
const NEXT_DECISION = 'x-surface-manager-window-runtime';

const SOURCE_ARTIFACTS = Object.freeze([
  'src/components/x-surface-manager/surface-record.ts',
  'src/components/x-surface-manager/surface-layout.ts',
  'src/components/x-surface-manager/surface-controller.ts'
]);

const REQUIRED_ARTIFACTS = Object.freeze([
  SURFACE_CONTROLLER_MODULE,
  SURFACE_CONTROLLER_RUNTIME,
  SURFACE_CONTROLLER_TYPES,
  SURFACE_CONTROLLER_SUITE,
  SURFACE_CONTROLLER_CONTRACT,
  SURFACE_CONTROLLER_WORKPACKAGE_DOC,
  SURFACE_CONTROLLER_DOCS,
  ...SOURCE_ARTIFACTS
]);

const REQUIRED_DOCS = Object.freeze([
  SURFACE_CONTROLLER_PLAN,
  SURFACE_CONTROLLER_CONTRACT,
  SURFACE_CONTROLLER_WORKPACKAGE_DOC,
  SURFACE_CONTROLLER_DOCS,
  'development/XTend-SurfaceManager-Contract-und-RMT-Authoring-Model.md',
  'development/docs-evidence/root/surface-manager-rmt-authoring.md',
  'docs/xtend-fabric.md'
]);

const REQUIRED_METHODS = Object.freeze([
  'registerSurface',
  'openSurface',
  'closeSurface',
  'focusSurface',
  'updateSurface',
  'moveSurface',
  'resizeSurface',
  'minimizeSurface',
  'maximizeSurface',
  'restoreSurface',
  'materializeSurface',
  'toggleSurface',
  'apply',
  'destroySurface',
  'snapshot',
  'dispose'
]);

const REQUIRED_STATE_KEYS = Object.freeze([
  'xtend.surface.registry',
  'xtend.surface.active',
  'xtend.surface.<surfaceId>.state',
  'xtend.surface.<surfaceId>.bounds',
  'xtend.surface.<surfaceId>.lifecycle',
  'xtend.surface.diagnostics',
  'xtend.surface.snapshot'
]);

const REQUIRED_SURFACE_TYPES = Object.freeze([
  'window',
  'side-panel',
  'modal',
  'dialog',
  'drawer',
  'popover',
  'tooltip',
  'region',
  'toast',
  'lightbox',
  'menu'
]);

const REQUIRED_DIAGNOSTIC_CODES = Object.freeze([
  'xtend.surface.controller.created',
  'xtend.surface.registered',
  'xtend.surface.opened',
  'xtend.surface.closed',
  'xtend.surface.focused',
  'xtend.surface.updated',
  'xtend.surface.moved',
  'xtend.surface.resized',
  'xtend.surface.minimized',
  'xtend.surface.maximized',
  'xtend.surface.restored',
  'xtend.surface.destroyed',
  'xtend.surface.already-destroyed',
  'xtend.surface.snapshot',
  'xtend.surface.disposed',
  'xtend.surface.invalid-record',
  'xtend.surface.not-found',
  'xtend.surface.capability-refused',
  'xtend.surface.state-mirror.failed',
  'xtend.surface.fabric-diagnostic.failed'
]);

const REQUIRED_LANES = Object.freeze([
  'user-blocking',
  'visible',
  'transition',
  'background',
  'diagnostics'
]);

function includesAll(values, required) {
  return required.every((entry) => Array.isArray(values) && values.includes(entry));
}

function createSurfaceControllerPlan(options = {}) {
  return {
    schema: SURFACE_CONTROLLER_SCHEMA,
    reportSchema: SURFACE_CONTROLLER_REPORT_SCHEMA,
    recordSchema: SURFACE_RECORD_SCHEMA,
    snapshotSchema: SURFACE_SNAPSHOT_SCHEMA,
    diagnosticSchema: SURFACE_DIAGNOSTIC_SCHEMA,
    operationResultSchema: SURFACE_OPERATION_RESULT_SCHEMA,
    workpackage: SURFACE_CONTROLLER_WORKPACKAGE,
    status: SURFACE_CONTROLLER_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    targetReadiness: SURFACE_CONTROLLER_TARGET,
    module: SURFACE_CONTROLLER_MODULE,
    runtime: SURFACE_CONTROLLER_RUNTIME,
    types: SURFACE_CONTROLLER_TYPES,
    suite: SURFACE_CONTROLLER_SUITE,
    planningDocument: SURFACE_CONTROLLER_PLAN,
    contract: SURFACE_CONTROLLER_CONTRACT,
    workpackageDocument: SURFACE_CONTROLLER_WORKPACKAGE_DOC,
    docs: SURFACE_CONTROLLER_DOCS,
    localGate: SURFACE_CONTROLLER_LOCAL_GATE,
    packageScript: SURFACE_CONTROLLER_PACKAGE_SCRIPT,
    sourceArtifacts: SOURCE_ARTIFACTS.slice(),
    artifactPaths: REQUIRED_ARTIFACTS.slice(),
    requiredDocs: REQUIRED_DOCS.slice(),
    requiredMethods: REQUIRED_METHODS.slice(),
    stateKeys: REQUIRED_STATE_KEYS.slice(),
    surfaceTypes: REQUIRED_SURFACE_TYPES.slice(),
    diagnosticCodes: REQUIRED_DIAGNOSTIC_CODES.slice(),
    lanes: REQUIRED_LANES.slice(),
    controllerModel: {
      boundary: 'component-owned-controller',
      runtimeArtifact: 'controller-only-no-custom-element',
      rmtInputModel: 'metadata.surface-records-from-WP-SM-01',
      statePolicy: 'digital-twin-ssot-with-xstate-mirror',
      fabricPolicy: 'emit-diagnostics-consume-fabric-do-not-replace-fabric',
      persistencePolicy: 'layout-state-only-no-content-payload',
      loaderPolicy: 'deferred-to-WP-SM-03-custom-element-runtime'
    },
    featureFlags: {
      customElementsImplemented: false,
      visibleSurfaceChromeImplemented: false,
      sidePanelRuntimeImplemented: false,
      nativeSurfacesDomainImplemented: false,
      browserRequiredInLocalGate: false,
      externalNetworkAllowedInLocalGate: false,
      runtimeHasDomDependency: false,
      runtimeHasRmtKernelImport: false,
      runtimeHasFabricHardDependency: false
    },
    snapshotShape: {
      schema: SURFACE_SNAPSHOT_SCHEMA,
      fields: [
        'managerId',
        'stateKey',
        'activeSurfaceId',
        'version',
        'surfaceCount',
        'openSurfaceCount',
        'destroyedSurfaceCount',
        'surfaces',
        'stack',
        'diagnostics',
        'updatedAt'
      ]
    },
    kernelBoundary: KERNEL_BOUNDARY,
    nextWorkpackage: NEXT_WORKPACKAGE,
    nextDecision: NEXT_DECISION
  };
}

function validateSurfaceControllerPlan(plan = createSurfaceControllerPlan()) {
  const errors = [];

  if (!plan || plan.schema !== SURFACE_CONTROLLER_SCHEMA) errors.push(`schema must be ${SURFACE_CONTROLLER_SCHEMA}`);
  if (!plan || plan.reportSchema !== SURFACE_CONTROLLER_REPORT_SCHEMA) errors.push(`reportSchema must be ${SURFACE_CONTROLLER_REPORT_SCHEMA}`);
  if (!plan || plan.recordSchema !== SURFACE_RECORD_SCHEMA) errors.push(`recordSchema must be ${SURFACE_RECORD_SCHEMA}`);
  if (!plan || plan.snapshotSchema !== SURFACE_SNAPSHOT_SCHEMA) errors.push(`snapshotSchema must be ${SURFACE_SNAPSHOT_SCHEMA}`);
  if (!plan || plan.diagnosticSchema !== SURFACE_DIAGNOSTIC_SCHEMA) errors.push(`diagnosticSchema must be ${SURFACE_DIAGNOSTIC_SCHEMA}`);
  if (!plan || plan.workpackage !== SURFACE_CONTROLLER_WORKPACKAGE) errors.push(`workpackage must be ${SURFACE_CONTROLLER_WORKPACKAGE}`);
  if (!plan || plan.status !== SURFACE_CONTROLLER_STATUS) errors.push(`status must be ${SURFACE_CONTROLLER_STATUS}`);
  if (!plan || plan.targetReadiness !== SURFACE_CONTROLLER_TARGET) errors.push(`targetReadiness must be ${SURFACE_CONTROLLER_TARGET}`);
  if (!includesAll(plan && plan.requiredMethods, REQUIRED_METHODS)) errors.push('required methods missing');
  if (!includesAll(plan && plan.stateKeys, REQUIRED_STATE_KEYS)) errors.push('required xstate mirror keys missing');
  if (!includesAll(plan && plan.surfaceTypes, REQUIRED_SURFACE_TYPES)) errors.push('required surface types missing');
  if (!includesAll(plan && plan.diagnosticCodes, REQUIRED_DIAGNOSTIC_CODES)) errors.push('required diagnostics missing');
  if (!includesAll(plan && plan.lanes, REQUIRED_LANES)) errors.push('required lanes missing');
  if (!plan || plan.featureFlags.runtimeHasDomDependency !== false) errors.push('runtime must stay DOM-free in WP-SM-02');
  if (!plan || plan.featureFlags.runtimeHasRmtKernelImport !== false) errors.push('runtime must not import RMT kernel types');
  if (!plan || plan.featureFlags.runtimeHasFabricHardDependency !== false) errors.push('runtime must not hard-depend on Fabric');
  if (!plan || plan.featureFlags.customElementsImplemented !== false) errors.push('custom elements must remain WP-SM-03 scope');
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  if (!plan || plan.nextWorkpackage !== NEXT_WORKPACKAGE) errors.push(`nextWorkpackage must be ${NEXT_WORKPACKAGE}`);
  if (!plan || plan.nextDecision !== NEXT_DECISION) errors.push(`nextDecision must be ${NEXT_DECISION}`);

  return {
    schema: SURFACE_CONTROLLER_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors,
    checkedAt: 'static-local',
    workpackage: SURFACE_CONTROLLER_WORKPACKAGE,
    targetReadiness: SURFACE_CONTROLLER_TARGET
  };
}

function createSurfaceControllerReport(options = {}) {
  const plan = options.plan || createSurfaceControllerPlan(options);
  const validation = validateSurfaceControllerPlan(plan);

  return {
    schema: SURFACE_CONTROLLER_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    workpackage: plan.workpackage,
    status: plan.status,
    targetReadiness: plan.targetReadiness,
    methodCount: plan.requiredMethods.length,
    stateKeyCount: plan.stateKeys.length,
    surfaceTypeCount: plan.surfaceTypes.length,
    diagnosticCount: plan.diagnosticCodes.length,
    runtime: plan.runtime,
    types: plan.types,
    localGate: plan.localGate,
    packageScript: plan.packageScript,
    runtimeHasDomDependency: plan.featureFlags.runtimeHasDomDependency,
    runtimeHasRmtKernelImport: plan.featureFlags.runtimeHasRmtKernelImport,
    runtimeHasFabricHardDependency: plan.featureFlags.runtimeHasFabricHardDependency,
    kernelBoundary: plan.kernelBoundary,
    nextWorkpackage: plan.nextWorkpackage,
    nextDecision: plan.nextDecision
  };
}

module.exports = {
  KERNEL_BOUNDARY,
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  REQUIRED_ARTIFACTS,
  REQUIRED_DIAGNOSTIC_CODES,
  REQUIRED_DOCS,
  REQUIRED_LANES,
  REQUIRED_METHODS,
  REQUIRED_STATE_KEYS,
  REQUIRED_SURFACE_TYPES,
  SOURCE_ARTIFACTS,
  SURFACE_CONTROLLER_CONTRACT,
  SURFACE_CONTROLLER_DIAGNOSTIC_SCHEMA: SURFACE_DIAGNOSTIC_SCHEMA,
  SURFACE_CONTROLLER_DOCS,
  SURFACE_CONTROLLER_LOCAL_GATE,
  SURFACE_CONTROLLER_MODULE,
  SURFACE_CONTROLLER_PACKAGE_SCRIPT,
  SURFACE_CONTROLLER_PLAN,
  SURFACE_CONTROLLER_REPORT_SCHEMA,
  SURFACE_CONTROLLER_RUNTIME,
  SURFACE_CONTROLLER_SCHEMA,
  SURFACE_DIAGNOSTIC_SCHEMA,
  SURFACE_CONTROLLER_SNAPSHOT_SCHEMA: SURFACE_SNAPSHOT_SCHEMA,
  SURFACE_CONTROLLER_STATUS,
  SURFACE_CONTROLLER_SUITE,
  SURFACE_CONTROLLER_TARGET,
  SURFACE_CONTROLLER_TYPES,
  SURFACE_CONTROLLER_WORKPACKAGE,
  SURFACE_CONTROLLER_WORKPACKAGE_DOC,
  SURFACE_OPERATION_RESULT_SCHEMA,
  SURFACE_RECORD_SCHEMA,
  SURFACE_SNAPSHOT_SCHEMA,
  createSurfaceControllerPlan,
  createSurfaceControllerReport,
  validateSurfaceControllerPlan
};
