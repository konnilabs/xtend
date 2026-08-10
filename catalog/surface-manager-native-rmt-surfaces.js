const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-gate-matrix');

const SURFACE_MANAGER_NATIVE_RMT_SCHEMA = 'xtend.rmt.surfaces-domain.v1';
const SURFACE_MANAGER_NATIVE_RMT_REPORT_SCHEMA = 'xtend.rmt.surfaces-domain-report.v1';
const SURFACE_ADAPTER_SCHEMA = 'xtend.surface.adapter.v1';
const SURFACE_MANAGER_SCHEMA = 'xtend.surface.manager.v1';
const SURFACE_RECORD_SCHEMA = 'xtend.surface.record.v1';
const SURFACE_CONTROLLER_SCHEMA = 'xtend.surface.controller.v2';
const SURFACE_SNAPSHOT_SCHEMA = 'xtend.surface.snapshot.v1';
const SURFACE_QUALITY_GATES_SCHEMA = 'xtend.surface.quality-gates.v1';
const SURFACE_MANAGER_NATIVE_RMT_WORKPACKAGE = 'WP-SM-08';
const SURFACE_MANAGER_NATIVE_RMT_STATUS = 'accepted-native-surfaces-domain-contract';
const SURFACE_MANAGER_NATIVE_RMT_TARGET = 'native-rmt-surfaces-domain-handoff-ready';
const SURFACE_MANAGER_NATIVE_RMT_MODULE = 'catalog/surface-manager-native-rmt-surfaces.js';
const SURFACE_MANAGER_NATIVE_RMT_SUITE = 'tests/rmt/surface_manager_native_rmt_surfaces_suite.js';
const SURFACE_MANAGER_NATIVE_RMT_PLAN = 'development/XTend-SurfaceManager-und-Multi-Window-Plan.md';
const SURFACE_MANAGER_NATIVE_RMT_CONTRACT = 'development/XTend-SurfaceManager-Native-RMT-Surfaces-Domain-Contract.md';
const SURFACE_MANAGER_NATIVE_RMT_WORKPACKAGE_DOC = 'development/WP-SM-08-Native-RMT-surfaces-Domain-und-xtend-surface-Adapter-entwerfen.md';
const SURFACE_MANAGER_NATIVE_RMT_DOCS = 'docs/surface-manager-native-rmt-surfaces.md';
const SURFACE_MANAGER_NATIVE_RMT_FIXTURE = 'tests/fixtures/rmt-surface-native-domain.rmt';
const SURFACE_MANAGER_NATIVE_RMT_LOCAL_GATE = 'node scripts/run_xtend_tests.js surface-native-rmt --json';
const SURFACE_MANAGER_NATIVE_RMT_PACKAGE_SCRIPT = 'npm run test:surface-native-rmt';
const SURFACE_DOMAIN = 'surfaces';
const SURFACE_ADAPTER_ID = 'xtend.surface';
const SURFACE_ADAPTER_KIND = 'surface_adapter';
const NEXT_WORKPACKAGE = 'WP-SM-09';
const NEXT_DECISION = 'surface-docs-component-lab-migration-guide';

const REQUIRED_DOMAINS = Object.freeze([
  'manifest',
  'adapters',
  'components',
  'routes',
  'schedules',
  'surfaces',
  'templates'
]);

const REQUIRED_ADAPTERS = Object.freeze([
  'xtend.component',
  'xtend.xrouter',
  'rmt.state-scheduler-diagnostics',
  SURFACE_ADAPTER_ID
]);

const SURFACE_TYPES = Object.freeze([
  'window',
  'side-panel',
  'modal',
  'dialog',
  'drawer'
]);

const SURFACE_FIELDS = Object.freeze([
  'id',
  'schema',
  'type',
  'adapter',
  'manager',
  'component',
  'route',
  'schedule',
  'stateKey',
  'defaultOpen',
  'active',
  'bounds',
  'placement',
  'mode',
  'layer',
  'capabilities',
  'a11y',
  'persistence',
  'metadata'
]);

const SURFACE_REFERENCE_CHECKS = Object.freeze([
  'surfaces[*].adapter -> adapters[*].id',
  'surfaces[*].manager -> components[*].id',
  'surfaces[*].component -> components[*].id',
  'surfaces[*].route -> routes[*].id',
  'surfaces[*].schedule -> schedules[*].id|endpointName'
]);

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

const TOOLING_ARTIFACTS = Object.freeze([
  'xtendrmt/rmt.schema.json',
  'xtendrmt/rmt-core.d.ts',
  'xtendrmt/rmt-core.esm.js',
  'xtendrmt/rmt-runtime.esm.js',
  'xtendrmt/rmt-runtime.browser.js',
  'tools/rmt-language/semantic-graph.js',
  'tools/rmt-language/completions.js',
  'tools/rmt-language/diagnostics.js'
]);

const REQUIRED_ARTIFACTS = Object.freeze([
  SURFACE_MANAGER_NATIVE_RMT_MODULE,
  SURFACE_MANAGER_NATIVE_RMT_SUITE,
  SURFACE_MANAGER_NATIVE_RMT_FIXTURE,
  SURFACE_MANAGER_NATIVE_RMT_CONTRACT,
  SURFACE_MANAGER_NATIVE_RMT_WORKPACKAGE_DOC,
  SURFACE_MANAGER_NATIVE_RMT_DOCS,
  ...TOOLING_ARTIFACTS
]);

const REQUIRED_DOCS = Object.freeze([
  SURFACE_MANAGER_NATIVE_RMT_PLAN,
  SURFACE_MANAGER_NATIVE_RMT_CONTRACT,
  SURFACE_MANAGER_NATIVE_RMT_WORKPACKAGE_DOC,
  SURFACE_MANAGER_NATIVE_RMT_DOCS,
  'development/XTend-SurfaceManager-Quality-Gates-Contract.md',
  'docs/en/surface-manager-quality-gates.md',
  'development/docs-evidence/root/surface-manager-rmt-authoring.md',
  'docs/xtendrmt-native-authoring.md'
]);

function includesAll(values, required) {
  return required.every((entry) => Array.isArray(values) && values.includes(entry));
}

function createSurfaceManagerNativeRmtSurfacesPlan(options = {}) {
  return {
    schema: SURFACE_MANAGER_NATIVE_RMT_SCHEMA,
    reportSchema: SURFACE_MANAGER_NATIVE_RMT_REPORT_SCHEMA,
    adapterSchema: SURFACE_ADAPTER_SCHEMA,
    surfaceManagerSchema: SURFACE_MANAGER_SCHEMA,
    surfaceRecordSchema: SURFACE_RECORD_SCHEMA,
    surfaceControllerSchema: SURFACE_CONTROLLER_SCHEMA,
    snapshotSchema: SURFACE_SNAPSHOT_SCHEMA,
    qualityGatesSchema: SURFACE_QUALITY_GATES_SCHEMA,
    workpackage: SURFACE_MANAGER_NATIVE_RMT_WORKPACKAGE,
    status: SURFACE_MANAGER_NATIVE_RMT_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    targetReadiness: SURFACE_MANAGER_NATIVE_RMT_TARGET,
    module: SURFACE_MANAGER_NATIVE_RMT_MODULE,
    suite: SURFACE_MANAGER_NATIVE_RMT_SUITE,
    planningDocument: SURFACE_MANAGER_NATIVE_RMT_PLAN,
    contract: SURFACE_MANAGER_NATIVE_RMT_CONTRACT,
    workpackageDocument: SURFACE_MANAGER_NATIVE_RMT_WORKPACKAGE_DOC,
    docs: SURFACE_MANAGER_NATIVE_RMT_DOCS,
    fixture: SURFACE_MANAGER_NATIVE_RMT_FIXTURE,
    localGate: SURFACE_MANAGER_NATIVE_RMT_LOCAL_GATE,
    packageScript: SURFACE_MANAGER_NATIVE_RMT_PACKAGE_SCRIPT,
    domain: SURFACE_DOMAIN,
    adapterId: SURFACE_ADAPTER_ID,
    adapterKind: SURFACE_ADAPTER_KIND,
    requiredDomains: REQUIRED_DOMAINS.slice(),
    requiredAdapters: REQUIRED_ADAPTERS.slice(),
    surfaceTypes: SURFACE_TYPES.slice(),
    surfaceFields: SURFACE_FIELDS.slice(),
    referenceChecks: SURFACE_REFERENCE_CHECKS.slice(),
    adapterOperations: SURFACE_ADAPTER_OPERATIONS.slice(),
    artifactPaths: REQUIRED_ARTIFACTS.slice(),
    requiredDocs: REQUIRED_DOCS.slice(),
    toolingArtifacts: TOOLING_ARTIFACTS.slice(),
    migrationModel: {
      from: 'components[*].metadata.surface',
      to: 'surfaces[*]',
      compatibilityMode: 'dual-records-during-handoff',
      stableIdentity: 'surfaces[*].id',
      componentBinding: 'surfaces[*].component',
      managerBinding: 'surfaces[*].manager',
      scheduleBinding: 'surfaces[*].schedule',
      statePolicy: 'digital-twin-ssot-xstate',
      qualityRegressionBase: 'WP-SM-07'
    },
    adapterContract: {
      id: SURFACE_ADAPTER_ID,
      kind: SURFACE_ADAPTER_KIND,
      schema: SURFACE_ADAPTER_SCHEMA,
      consumes: [
        'surfaces[*]',
        'components[*]',
        'routes[*]',
        'schedules[*]',
        'xtend.surface.controller.v2',
        'xtend.surface.snapshot.v1'
      ],
      operations: SURFACE_ADAPTER_OPERATIONS.slice(),
      runtimeImplemented: false,
      kernelVisible: false
    },
    featureFlags: {
      nativeSurfacesDomainDesigned: true,
      rmtSchemaSynchronized: true,
      rmtTypesSynchronized: true,
      rmtNormalizerReadsSurfaces: true,
      semanticGraphIndexesSurfaces: true,
      completionProviderKnowsSurfaces: true,
      surfaceAdapterRuntimeImplemented: false,
      componentRecordCompatibilityKept: true,
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

function validateSurfaceManagerNativeRmtSurfacesPlan(plan = createSurfaceManagerNativeRmtSurfacesPlan()) {
  const errors = [];

  if (!plan || plan.schema !== SURFACE_MANAGER_NATIVE_RMT_SCHEMA) errors.push(`schema must be ${SURFACE_MANAGER_NATIVE_RMT_SCHEMA}`);
  if (!plan || plan.reportSchema !== SURFACE_MANAGER_NATIVE_RMT_REPORT_SCHEMA) errors.push(`reportSchema must be ${SURFACE_MANAGER_NATIVE_RMT_REPORT_SCHEMA}`);
  if (!plan || plan.adapterSchema !== SURFACE_ADAPTER_SCHEMA) errors.push(`adapterSchema must be ${SURFACE_ADAPTER_SCHEMA}`);
  if (!plan || plan.workpackage !== SURFACE_MANAGER_NATIVE_RMT_WORKPACKAGE) errors.push(`workpackage must be ${SURFACE_MANAGER_NATIVE_RMT_WORKPACKAGE}`);
  if (!plan || plan.status !== SURFACE_MANAGER_NATIVE_RMT_STATUS) errors.push(`status must be ${SURFACE_MANAGER_NATIVE_RMT_STATUS}`);
  if (!plan || plan.targetReadiness !== SURFACE_MANAGER_NATIVE_RMT_TARGET) errors.push(`targetReadiness must be ${SURFACE_MANAGER_NATIVE_RMT_TARGET}`);
  if (!plan || plan.domain !== SURFACE_DOMAIN) errors.push(`domain must be ${SURFACE_DOMAIN}`);
  if (!plan || plan.adapterId !== SURFACE_ADAPTER_ID) errors.push(`adapterId must be ${SURFACE_ADAPTER_ID}`);
  if (!plan || plan.adapterKind !== SURFACE_ADAPTER_KIND) errors.push(`adapterKind must be ${SURFACE_ADAPTER_KIND}`);
  if (!includesAll(plan && plan.requiredDomains, REQUIRED_DOMAINS)) errors.push('required domains missing');
  if (!includesAll(plan && plan.requiredAdapters, REQUIRED_ADAPTERS)) errors.push('required adapters missing');
  if (!includesAll(plan && plan.surfaceTypes, SURFACE_TYPES)) errors.push('surface types missing');
  if (!includesAll(plan && plan.surfaceFields, SURFACE_FIELDS)) errors.push('surface fields missing');
  if (!includesAll(plan && plan.referenceChecks, SURFACE_REFERENCE_CHECKS)) errors.push('surface reference checks missing');
  if (!includesAll(plan && plan.adapterOperations, SURFACE_ADAPTER_OPERATIONS)) errors.push('surface adapter operations missing');
  if (!plan || !plan.adapterContract || plan.adapterContract.runtimeImplemented !== false) errors.push('surface adapter runtime must stay deferred');
  if (!plan || plan.featureFlags.nativeSurfacesDomainDesigned !== true) errors.push('native surfaces domain must be designed');
  if (!plan || plan.featureFlags.rmtSchemaSynchronized !== true) errors.push('RMT schema must be synchronized');
  if (!plan || plan.featureFlags.rmtTypesSynchronized !== true) errors.push('RMT types must be synchronized');
  if (!plan || plan.featureFlags.rmtNormalizerReadsSurfaces !== true) errors.push('RMT normalizer must preserve surfaces records');
  if (!plan || plan.featureFlags.semanticGraphIndexesSurfaces !== true) errors.push('semantic graph must index surfaces');
  if (!plan || plan.featureFlags.completionProviderKnowsSurfaces !== true) errors.push('completion provider must know surfaces');
  if (!plan || plan.featureFlags.surfaceAdapterRuntimeImplemented !== false) errors.push('WP-SM-08 must not claim a productive surface adapter runtime');
  if (!plan || plan.featureFlags.componentRecordCompatibilityKept !== true) errors.push('component record compatibility must be kept');
  if (!plan || plan.featureFlags.createsSecondRegistry !== false) errors.push('WP-SM-08 must not create a second registry');
  if (!plan || plan.featureFlags.rmtKernelImportsXtendTypes !== false) errors.push('RMT kernel boundary must stay clean');
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  if (!plan || plan.nextWorkpackage !== NEXT_WORKPACKAGE) errors.push(`nextWorkpackage must be ${NEXT_WORKPACKAGE}`);
  if (!plan || plan.nextDecision !== NEXT_DECISION) errors.push(`nextDecision must be ${NEXT_DECISION}`);

  return {
    schema: SURFACE_MANAGER_NATIVE_RMT_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors,
    checkedAt: 'static-local',
    workpackage: SURFACE_MANAGER_NATIVE_RMT_WORKPACKAGE,
    targetReadiness: SURFACE_MANAGER_NATIVE_RMT_TARGET
  };
}

function createSurfaceManagerNativeRmtSurfacesReport(options = {}) {
  const plan = options.plan || createSurfaceManagerNativeRmtSurfacesPlan(options);
  const validation = validateSurfaceManagerNativeRmtSurfacesPlan(plan);

  return {
    schema: SURFACE_MANAGER_NATIVE_RMT_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    workpackage: plan.workpackage,
    status: plan.status,
    targetReadiness: plan.targetReadiness,
    domain: plan.domain,
    adapterId: plan.adapterId,
    adapterKind: plan.adapterKind,
    surfaceTypeCount: plan.surfaceTypes.length,
    referenceCheckCount: plan.referenceChecks.length,
    adapterOperationCount: plan.adapterOperations.length,
    fixture: plan.fixture,
    localGate: plan.localGate,
    packageScript: plan.packageScript,
    kernelBoundary: plan.kernelBoundary,
    nextWorkpackage: plan.nextWorkpackage,
    nextDecision: plan.nextDecision
  };
}

module.exports = {
  KERNEL_BOUNDARY,
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  REQUIRED_ADAPTERS,
  REQUIRED_ARTIFACTS,
  REQUIRED_DOCS,
  REQUIRED_DOMAINS,
  SURFACE_ADAPTER_ID,
  SURFACE_ADAPTER_KIND,
  SURFACE_ADAPTER_OPERATIONS,
  SURFACE_ADAPTER_SCHEMA,
  SURFACE_CONTROLLER_SCHEMA,
  SURFACE_DOMAIN,
  SURFACE_FIELDS,
  SURFACE_MANAGER_NATIVE_RMT_CONTRACT,
  SURFACE_MANAGER_NATIVE_RMT_DOCS,
  SURFACE_MANAGER_NATIVE_RMT_FIXTURE,
  SURFACE_MANAGER_NATIVE_RMT_LOCAL_GATE,
  SURFACE_MANAGER_NATIVE_RMT_MODULE,
  SURFACE_MANAGER_NATIVE_RMT_PACKAGE_SCRIPT,
  SURFACE_MANAGER_NATIVE_RMT_PLAN,
  SURFACE_MANAGER_NATIVE_RMT_REPORT_SCHEMA,
  SURFACE_MANAGER_NATIVE_RMT_SCHEMA,
  SURFACE_MANAGER_NATIVE_RMT_STATUS,
  SURFACE_MANAGER_NATIVE_RMT_SUITE,
  SURFACE_MANAGER_NATIVE_RMT_TARGET,
  SURFACE_MANAGER_NATIVE_RMT_WORKPACKAGE,
  SURFACE_MANAGER_NATIVE_RMT_WORKPACKAGE_DOC,
  SURFACE_MANAGER_SCHEMA,
  SURFACE_QUALITY_GATES_SCHEMA,
  SURFACE_RECORD_SCHEMA,
  SURFACE_REFERENCE_CHECKS,
  SURFACE_SNAPSHOT_SCHEMA,
  SURFACE_TYPES,
  TOOLING_ARTIFACTS,
  createSurfaceManagerNativeRmtSurfacesPlan,
  createSurfaceManagerNativeRmtSurfacesReport,
  validateSurfaceManagerNativeRmtSurfacesPlan
};
