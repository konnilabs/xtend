const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-gate-matrix');

const SURFACE_MANAGER_MATERIALIZATION_SCHEMA = 'xtend.surface.native-materialization.v1';
const SURFACE_MANAGER_MATERIALIZATION_REPORT_SCHEMA = 'xtend.surface.native-materialization-report.v1';
const SURFACE_MATERIALIZATION_SCHEMA = 'xtend.surface.materialization.v1';
const SURFACE_ADAPTER_SCHEMA = 'xtend.surface.adapter.v1';
const SURFACE_ADAPTER_ID = 'xtend.surface';
const SURFACE_MANAGER_SCHEMA = 'xtend.surface.manager.v1';
const SURFACE_RECORD_SCHEMA = 'xtend.surface.record.v1';
const SURFACE_CONTROLLER_SCHEMA = 'xtend.surface.controller.v2';
const SURFACE_MANAGER_MATERIALIZATION_WORKPACKAGE = 'WP-SM-11';
const SURFACE_MANAGER_MATERIALIZATION_STATUS = 'implemented-native-surface-materialization';
const SURFACE_MANAGER_MATERIALIZATION_TARGET = 'native-surfaces-template-materialization-ready';
const SURFACE_MANAGER_MATERIALIZATION_MODULE = 'catalog/surface-manager-materialization.js';
const SURFACE_MANAGER_MATERIALIZATION_SUITE = 'tests/rmt/surface_manager_materialization_suite.js';
const SURFACE_MANAGER_MATERIALIZATION_FIXTURE = 'tests/fixtures/rmt-surface-materialization-shell.rmt';
const SURFACE_MANAGER_MATERIALIZATION_BACKLOG = 'development/BACKLOG-XTend-SurfaceManager-App-Shell-und-RMT-Surface-Runtime.md';
const SURFACE_MANAGER_MATERIALIZATION_WORKPACKAGE_DOC = 'development/WP-SM-11-Native-surfaces-in-XTend-UI-Komponenten-materialisieren.md';
const SURFACE_MANAGER_MATERIALIZATION_LOCAL_GATE = 'node scripts/run_xtend_tests.js surface-native-materialization --json';
const SURFACE_MANAGER_MATERIALIZATION_PACKAGE_SCRIPT = 'npm run test:surface-native-materialization';

const SURFACE_MATERIALIZATION_OPERATIONS = Object.freeze([
  'mapSurfaces',
  'materializeSurfaces',
  'registerSurface',
  'snapshotSurfaces'
]);

const SURFACE_MATERIALIZATION_DIAGNOSTICS = Object.freeze([
  'rmt.surface.missing_id',
  'rmt.surface.missing_manager',
  'rmt.surface.missing_component',
  'rmt.surface.materialization.target.missing',
  'rmt.surface.target.unsupported'
]);

const MATERIALIZED_COMPONENT_TAGS = Object.freeze([
  'x-surface-manager',
  'x-surface-window',
  'x-surface-region',
  'x-side-panel',
  'x-modal',
  'x-dialog',
  'x-drawer',
  'x-popover',
  'x-tooltip',
  'x-toast',
  'x-lightbox',
  'x-menu'
]);

const RUNTIME_ARTIFACTS = Object.freeze([
  'xtendrmt/rmt-core.esm.js',
  'xtendrmt/rmt-runtime.esm.js',
  'xtendrmt/rmt-runtime.browser.js',
  'xtendrmt/rmt-core.d.ts'
]);

const REQUIRED_ARTIFACTS = Object.freeze([
  SURFACE_MANAGER_MATERIALIZATION_MODULE,
  SURFACE_MANAGER_MATERIALIZATION_SUITE,
  SURFACE_MANAGER_MATERIALIZATION_FIXTURE,
  SURFACE_MANAGER_MATERIALIZATION_BACKLOG,
  SURFACE_MANAGER_MATERIALIZATION_WORKPACKAGE_DOC,
  ...RUNTIME_ARTIFACTS
]);

function includesAll(values, required) {
  return required.every((entry) => Array.isArray(values) && values.includes(entry));
}

function createSurfaceManagerMaterializationPlan(options = {}) {
  return {
    schema: SURFACE_MANAGER_MATERIALIZATION_SCHEMA,
    reportSchema: SURFACE_MANAGER_MATERIALIZATION_REPORT_SCHEMA,
    materializationSchema: SURFACE_MATERIALIZATION_SCHEMA,
    adapterSchema: SURFACE_ADAPTER_SCHEMA,
    adapterId: SURFACE_ADAPTER_ID,
    surfaceManagerSchema: SURFACE_MANAGER_SCHEMA,
    surfaceRecordSchema: SURFACE_RECORD_SCHEMA,
    surfaceControllerSchema: SURFACE_CONTROLLER_SCHEMA,
    workpackage: SURFACE_MANAGER_MATERIALIZATION_WORKPACKAGE,
    status: SURFACE_MANAGER_MATERIALIZATION_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    targetReadiness: SURFACE_MANAGER_MATERIALIZATION_TARGET,
    module: SURFACE_MANAGER_MATERIALIZATION_MODULE,
    suite: SURFACE_MANAGER_MATERIALIZATION_SUITE,
    fixture: SURFACE_MANAGER_MATERIALIZATION_FIXTURE,
    backlog: SURFACE_MANAGER_MATERIALIZATION_BACKLOG,
    workpackageDocument: SURFACE_MANAGER_MATERIALIZATION_WORKPACKAGE_DOC,
    localGate: SURFACE_MANAGER_MATERIALIZATION_LOCAL_GATE,
    packageScript: SURFACE_MANAGER_MATERIALIZATION_PACKAGE_SCRIPT,
    runtimeFactory: 'createRmtSurfaceAdapter',
    operations: SURFACE_MATERIALIZATION_OPERATIONS.slice(),
    diagnostics: SURFACE_MATERIALIZATION_DIAGNOSTICS.slice(),
    materializedComponentTags: MATERIALIZED_COMPONENT_TAGS.slice(),
    runtimeArtifacts: RUNTIME_ARTIFACTS.slice(),
    requiredArtifacts: REQUIRED_ARTIFACTS.slice(),
    consumes: [
      'surfaces[*].manager',
      'surfaces[*].component',
      'surfaces[*].route',
      'surfaces[*].schedule',
      'surfaces[*].bounds',
      'surfaces[*].placement',
      'surfaces[*].mode',
      'components[*] as content and manager bindings'
    ],
    runtimeBoundary: {
      materializesDom: true,
      generatesSurfaceComponentsFromNativeRecords: true,
      keepsComponentRecordsAsContentBindings: true,
      createsSecondRegistry: false,
      replacesFabric: false,
      replacesRmtKernel: false,
      monkeypatchesDocsApp: false,
      kernelVisible: false,
      rmtKernelImportsXtendTypes: false
    },
    nextWorkpackage: 'WP-SM-12',
    nextDecision: 'shell-layout-and-surface-zone-policy',
    kernelBoundary: KERNEL_BOUNDARY
  };
}

function validateSurfaceManagerMaterializationPlan(plan = createSurfaceManagerMaterializationPlan()) {
  const errors = [];

  if (!plan || plan.schema !== SURFACE_MANAGER_MATERIALIZATION_SCHEMA) errors.push(`schema must be ${SURFACE_MANAGER_MATERIALIZATION_SCHEMA}`);
  if (!plan || plan.reportSchema !== SURFACE_MANAGER_MATERIALIZATION_REPORT_SCHEMA) errors.push(`reportSchema must be ${SURFACE_MANAGER_MATERIALIZATION_REPORT_SCHEMA}`);
  if (!plan || plan.materializationSchema !== SURFACE_MATERIALIZATION_SCHEMA) errors.push(`materializationSchema must be ${SURFACE_MATERIALIZATION_SCHEMA}`);
  if (!plan || plan.adapterSchema !== SURFACE_ADAPTER_SCHEMA) errors.push(`adapterSchema must be ${SURFACE_ADAPTER_SCHEMA}`);
  if (!plan || plan.adapterId !== SURFACE_ADAPTER_ID) errors.push(`adapterId must be ${SURFACE_ADAPTER_ID}`);
  if (!plan || plan.workpackage !== SURFACE_MANAGER_MATERIALIZATION_WORKPACKAGE) errors.push(`workpackage must be ${SURFACE_MANAGER_MATERIALIZATION_WORKPACKAGE}`);
  if (!plan || plan.status !== SURFACE_MANAGER_MATERIALIZATION_STATUS) errors.push(`status must be ${SURFACE_MANAGER_MATERIALIZATION_STATUS}`);
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.materializesDom !== true) errors.push('WP-SM-11 must own native surface DOM materialization');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.generatesSurfaceComponentsFromNativeRecords !== true) errors.push('native surfaces must generate XTend UI surface components');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.keepsComponentRecordsAsContentBindings !== true) errors.push('component records must remain content bindings');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.createsSecondRegistry !== false) errors.push('materialization must not create a second surface registry');
  if (!plan || !plan.runtimeBoundary || plan.runtimeBoundary.monkeypatchesDocsApp !== false) errors.push('materialization must stay framework-native, not docs-app-specific');
  if (!includesAll(plan && plan.operations, SURFACE_MATERIALIZATION_OPERATIONS)) errors.push('materialization operations missing');
  if (!includesAll(plan && plan.materializedComponentTags, MATERIALIZED_COMPONENT_TAGS)) errors.push('materialized component tags missing');
  if (!includesAll(plan && plan.runtimeArtifacts, RUNTIME_ARTIFACTS)) errors.push('runtime artifacts missing');
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);

  return {
    schema: SURFACE_MANAGER_MATERIALIZATION_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors,
    checkedAt: 'static-local',
    workpackage: SURFACE_MANAGER_MATERIALIZATION_WORKPACKAGE,
    targetReadiness: SURFACE_MANAGER_MATERIALIZATION_TARGET
  };
}

function createSurfaceManagerMaterializationReport(options = {}) {
  const plan = options.plan || createSurfaceManagerMaterializationPlan(options);
  const validation = validateSurfaceManagerMaterializationPlan(plan);

  return {
    schema: SURFACE_MANAGER_MATERIALIZATION_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    workpackage: plan.workpackage,
    status: plan.status,
    targetReadiness: plan.targetReadiness,
    adapterId: plan.adapterId,
    operationCount: plan.operations.length,
    materializedComponentTags: plan.materializedComponentTags.slice(),
    localGate: plan.localGate,
    packageScript: plan.packageScript,
    kernelBoundary: plan.kernelBoundary,
    nextWorkpackage: plan.nextWorkpackage,
    nextDecision: plan.nextDecision
  };
}

module.exports = {
  KERNEL_BOUNDARY,
  MATERIALIZED_COMPONENT_TAGS,
  REQUIRED_ARTIFACTS,
  RUNTIME_ARTIFACTS,
  SURFACE_ADAPTER_ID,
  SURFACE_ADAPTER_SCHEMA,
  SURFACE_CONTROLLER_SCHEMA,
  SURFACE_MANAGER_MATERIALIZATION_BACKLOG,
  SURFACE_MANAGER_MATERIALIZATION_FIXTURE,
  SURFACE_MANAGER_MATERIALIZATION_LOCAL_GATE,
  SURFACE_MANAGER_MATERIALIZATION_MODULE,
  SURFACE_MANAGER_MATERIALIZATION_PACKAGE_SCRIPT,
  SURFACE_MANAGER_MATERIALIZATION_REPORT_SCHEMA,
  SURFACE_MANAGER_MATERIALIZATION_SCHEMA,
  SURFACE_MANAGER_MATERIALIZATION_STATUS,
  SURFACE_MANAGER_MATERIALIZATION_SUITE,
  SURFACE_MANAGER_MATERIALIZATION_TARGET,
  SURFACE_MANAGER_MATERIALIZATION_WORKPACKAGE,
  SURFACE_MANAGER_MATERIALIZATION_WORKPACKAGE_DOC,
  SURFACE_MANAGER_SCHEMA,
  SURFACE_MATERIALIZATION_DIAGNOSTICS,
  SURFACE_MATERIALIZATION_OPERATIONS,
  SURFACE_MATERIALIZATION_SCHEMA,
  SURFACE_RECORD_SCHEMA,
  createSurfaceManagerMaterializationPlan,
  createSurfaceManagerMaterializationReport,
  validateSurfaceManagerMaterializationPlan
};
