const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-gate-matrix');

const SURFACE_MANAGER_ADAPTER_RUNTIME_SCHEMA = 'xtend.surface.adapter-runtime.v1';
const SURFACE_MANAGER_ADAPTER_RUNTIME_REPORT_SCHEMA = 'xtend.surface.adapter-runtime-report.v1';
const SURFACE_ADAPTER_SCHEMA = 'xtend.surface.adapter.v1';
const SURFACE_ADAPTER_ID = 'xtend.surface';
const SURFACE_ADAPTER_KIND = 'surface_adapter';
const SURFACE_MANAGER_SCHEMA = 'xtend.surface.manager.v1';
const SURFACE_CONTROLLER_SCHEMA = 'xtend.surface.controller.v1';
const SURFACE_RECORD_SCHEMA = 'xtend.surface.record.v1';
const SURFACE_SNAPSHOT_SCHEMA = 'xtend.surface.snapshot.v1';
const SURFACE_MANAGER_ADAPTER_RUNTIME_WORKPACKAGE = 'WP-SM-10';
const SURFACE_MANAGER_ADAPTER_RUNTIME_STATUS = 'implemented-surface-adapter-runtime';
const SURFACE_MANAGER_ADAPTER_RUNTIME_TARGET = 'productive-xtend-surface-host-adapter-ready';
const SURFACE_MANAGER_ADAPTER_RUNTIME_MODULE = 'catalog/surface-manager-adapter-runtime.js';
const SURFACE_MANAGER_ADAPTER_RUNTIME_SUITE = 'tests/rmt/surface_manager_adapter_runtime_suite.js';
const SURFACE_MANAGER_ADAPTER_RUNTIME_BACKLOG = 'development/BACKLOG-XTend-SurfaceManager-App-Shell-und-RMT-Surface-Runtime.md';
const SURFACE_MANAGER_ADAPTER_RUNTIME_WORKPACKAGE_DOC = 'development/WP-SM-10-Produktive-xtend-surface-Adapter-Runtime-bauen.md';
const SURFACE_MANAGER_ADAPTER_RUNTIME_FIXTURE = 'tests/fixtures/rmt-surface-native-domain.rmt';
const SURFACE_MANAGER_ADAPTER_RUNTIME_LOCAL_GATE = 'node scripts/run_xtend_tests.js surface-adapter-runtime --json';
const SURFACE_MANAGER_ADAPTER_RUNTIME_PACKAGE_SCRIPT = 'npm run test:surface-adapter-runtime';

const SURFACE_ADAPTER_OPERATIONS = Object.freeze([
  'registerSurface',
  'openSurface',
  'closeSurface',
  'focusSurface',
  'moveSurface',
  'resizeSurface',
  'dockSurface',
  'undockSurface',
  'snapshotSurfaces',
  'emitDiagnostic'
]);

const SURFACE_ADAPTER_DIAGNOSTICS = Object.freeze([
  'rmt.surface.missing_id',
  'rmt.surface.missing_manager',
  'rmt.surface.missing_component',
  'rmt.surface.target.missing',
  'rmt.surface.target.unsupported',
  'rmt.surface.dom_compat_ownership_unsupported',
  'rmt.surface.operation.skipped',
  'rmt.surface.diagnostic'
]);

const RUNTIME_ARTIFACTS = Object.freeze([
  'xtendrmt/rmt-core.esm.js',
  'xtendrmt/rmt-runtime.esm.js',
  'xtendrmt/rmt-runtime.browser.js',
  'xtendrmt/rmt-core.d.ts',
  'xtendrmt/rmt-manifest.json'
]);

const REQUIRED_ARTIFACTS = Object.freeze([
  SURFACE_MANAGER_ADAPTER_RUNTIME_MODULE,
  SURFACE_MANAGER_ADAPTER_RUNTIME_SUITE,
  SURFACE_MANAGER_ADAPTER_RUNTIME_BACKLOG,
  SURFACE_MANAGER_ADAPTER_RUNTIME_WORKPACKAGE_DOC,
  SURFACE_MANAGER_ADAPTER_RUNTIME_FIXTURE,
  ...RUNTIME_ARTIFACTS
]);

function includesAll(values, required) {
  return required.every((entry) => Array.isArray(values) && values.includes(entry));
}

function createSurfaceManagerAdapterRuntimePlan(options = {}) {
  return {
    schema: SURFACE_MANAGER_ADAPTER_RUNTIME_SCHEMA,
    reportSchema: SURFACE_MANAGER_ADAPTER_RUNTIME_REPORT_SCHEMA,
    adapterSchema: SURFACE_ADAPTER_SCHEMA,
    adapterId: SURFACE_ADAPTER_ID,
    adapterKind: SURFACE_ADAPTER_KIND,
    surfaceManagerSchema: SURFACE_MANAGER_SCHEMA,
    surfaceControllerSchema: SURFACE_CONTROLLER_SCHEMA,
    surfaceRecordSchema: SURFACE_RECORD_SCHEMA,
    snapshotSchema: SURFACE_SNAPSHOT_SCHEMA,
    workpackage: SURFACE_MANAGER_ADAPTER_RUNTIME_WORKPACKAGE,
    status: SURFACE_MANAGER_ADAPTER_RUNTIME_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    targetReadiness: SURFACE_MANAGER_ADAPTER_RUNTIME_TARGET,
    module: SURFACE_MANAGER_ADAPTER_RUNTIME_MODULE,
    suite: SURFACE_MANAGER_ADAPTER_RUNTIME_SUITE,
    backlog: SURFACE_MANAGER_ADAPTER_RUNTIME_BACKLOG,
    workpackageDocument: SURFACE_MANAGER_ADAPTER_RUNTIME_WORKPACKAGE_DOC,
    fixture: SURFACE_MANAGER_ADAPTER_RUNTIME_FIXTURE,
    localGate: SURFACE_MANAGER_ADAPTER_RUNTIME_LOCAL_GATE,
    packageScript: SURFACE_MANAGER_ADAPTER_RUNTIME_PACKAGE_SCRIPT,
    runtimeFactory: 'createRmtSurfaceAdapter',
    legacyRuntimeFactory: 'createRenderManSurfaceAdapter',
    runtimeArtifacts: RUNTIME_ARTIFACTS.slice(),
    requiredArtifacts: REQUIRED_ARTIFACTS.slice(),
    operations: SURFACE_ADAPTER_OPERATIONS.slice(),
    diagnostics: SURFACE_ADAPTER_DIAGNOSTICS.slice(),
    consumes: [
      'surfaces[*]',
      'components[*]',
      'routes[*]',
      'schedules[*]',
      'xtend.surface.manager.v1',
      'xtend.surface.controller.v1'
    ],
    runtimeBoundary: {
      materializesDom: false,
      claimsProductiveAdapterRuntime: true,
      createsSecondRegistry: false,
      kernelVisible: false,
      rmtKernelImportsXtendTypes: false,
      remoteRuntimeExecution: false,
      managerTargetRequiredForOperations: true
    },
    nextWorkpackage: 'WP-SM-11',
    nextDecision: 'native-surfaces-template-materialization',
    kernelBoundary: KERNEL_BOUNDARY
  };
}

function validateSurfaceManagerAdapterRuntimePlan(plan = createSurfaceManagerAdapterRuntimePlan()) {
  const errors = [];

  if (!plan || plan.schema !== SURFACE_MANAGER_ADAPTER_RUNTIME_SCHEMA) errors.push(`schema must be ${SURFACE_MANAGER_ADAPTER_RUNTIME_SCHEMA}`);
  if (!plan || plan.reportSchema !== SURFACE_MANAGER_ADAPTER_RUNTIME_REPORT_SCHEMA) errors.push(`reportSchema must be ${SURFACE_MANAGER_ADAPTER_RUNTIME_REPORT_SCHEMA}`);
  if (!plan || plan.adapterSchema !== SURFACE_ADAPTER_SCHEMA) errors.push(`adapterSchema must be ${SURFACE_ADAPTER_SCHEMA}`);
  if (!plan || plan.adapterId !== SURFACE_ADAPTER_ID) errors.push(`adapterId must be ${SURFACE_ADAPTER_ID}`);
  if (!plan || plan.adapterKind !== SURFACE_ADAPTER_KIND) errors.push(`adapterKind must be ${SURFACE_ADAPTER_KIND}`);
  if (!plan || plan.workpackage !== SURFACE_MANAGER_ADAPTER_RUNTIME_WORKPACKAGE) errors.push(`workpackage must be ${SURFACE_MANAGER_ADAPTER_RUNTIME_WORKPACKAGE}`);
  if (!plan || plan.status !== SURFACE_MANAGER_ADAPTER_RUNTIME_STATUS) errors.push(`status must be ${SURFACE_MANAGER_ADAPTER_RUNTIME_STATUS}`);
  if (!plan || plan.targetReadiness !== SURFACE_MANAGER_ADAPTER_RUNTIME_TARGET) errors.push(`targetReadiness must be ${SURFACE_MANAGER_ADAPTER_RUNTIME_TARGET}`);
  if (!includesAll(plan && plan.operations, SURFACE_ADAPTER_OPERATIONS)) errors.push('surface adapter operations missing');
  if (!includesAll(plan && plan.diagnostics, SURFACE_ADAPTER_DIAGNOSTICS)) errors.push('surface adapter diagnostics missing');
  if (!includesAll(plan && plan.runtimeArtifacts, RUNTIME_ARTIFACTS)) errors.push('runtime artifacts missing');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.claimsProductiveAdapterRuntime !== true) errors.push('productive adapter runtime must be claimed by WP-SM-10');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.createsSecondRegistry !== false) errors.push('surface adapter must not create a second registry');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.rmtKernelImportsXtendTypes !== false) errors.push('RMT kernel boundary must stay clean');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.materializesDom !== false) errors.push('WP-SM-10 must not absorb WP-SM-11 materialization');
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);

  return {
    schema: SURFACE_MANAGER_ADAPTER_RUNTIME_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors,
    checkedAt: 'static-local',
    workpackage: SURFACE_MANAGER_ADAPTER_RUNTIME_WORKPACKAGE,
    targetReadiness: SURFACE_MANAGER_ADAPTER_RUNTIME_TARGET
  };
}

function createSurfaceManagerAdapterRuntimeReport(options = {}) {
  const plan = options.plan || createSurfaceManagerAdapterRuntimePlan(options);
  const validation = validateSurfaceManagerAdapterRuntimePlan(plan);

  return {
    schema: SURFACE_MANAGER_ADAPTER_RUNTIME_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    workpackage: plan.workpackage,
    status: plan.status,
    targetReadiness: plan.targetReadiness,
    adapterId: plan.adapterId,
    adapterKind: plan.adapterKind,
    runtimeFactory: plan.runtimeFactory,
    operationCount: plan.operations.length,
    diagnosticCount: plan.diagnostics.length,
    runtimeArtifacts: plan.runtimeArtifacts.slice(),
    localGate: plan.localGate,
    packageScript: plan.packageScript,
    kernelBoundary: plan.kernelBoundary,
    nextWorkpackage: plan.nextWorkpackage,
    nextDecision: plan.nextDecision
  };
}

module.exports = {
  KERNEL_BOUNDARY,
  REQUIRED_ARTIFACTS,
  RUNTIME_ARTIFACTS,
  SURFACE_ADAPTER_DIAGNOSTICS,
  SURFACE_ADAPTER_ID,
  SURFACE_ADAPTER_KIND,
  SURFACE_ADAPTER_OPERATIONS,
  SURFACE_ADAPTER_SCHEMA,
  SURFACE_CONTROLLER_SCHEMA,
  SURFACE_MANAGER_ADAPTER_RUNTIME_BACKLOG,
  SURFACE_MANAGER_ADAPTER_RUNTIME_FIXTURE,
  SURFACE_MANAGER_ADAPTER_RUNTIME_LOCAL_GATE,
  SURFACE_MANAGER_ADAPTER_RUNTIME_MODULE,
  SURFACE_MANAGER_ADAPTER_RUNTIME_PACKAGE_SCRIPT,
  SURFACE_MANAGER_ADAPTER_RUNTIME_REPORT_SCHEMA,
  SURFACE_MANAGER_ADAPTER_RUNTIME_SCHEMA,
  SURFACE_MANAGER_ADAPTER_RUNTIME_STATUS,
  SURFACE_MANAGER_ADAPTER_RUNTIME_SUITE,
  SURFACE_MANAGER_ADAPTER_RUNTIME_TARGET,
  SURFACE_MANAGER_ADAPTER_RUNTIME_WORKPACKAGE,
  SURFACE_MANAGER_ADAPTER_RUNTIME_WORKPACKAGE_DOC,
  SURFACE_MANAGER_SCHEMA,
  SURFACE_RECORD_SCHEMA,
  SURFACE_SNAPSHOT_SCHEMA,
  createSurfaceManagerAdapterRuntimePlan,
  createSurfaceManagerAdapterRuntimeReport,
  validateSurfaceManagerAdapterRuntimePlan
};
