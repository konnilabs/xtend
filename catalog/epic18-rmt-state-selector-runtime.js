const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-gate-matrix');
const {
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_SCHEMA,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_WORKPACKAGE
} = require('./epic18-rmt-component-template-primitives');

const RMT_STATE_SELECTOR_RUNTIME_SCHEMA = 'xtend.epic18.rmt-state-selector-runtime.v2';
const RMT_STATE_SELECTOR_RUNTIME_REPORT_SCHEMA = 'xtend.epic18.rmt-state-selector-runtime-report.v1';
const RMT_STATE_SELECTOR_RUNTIME_FIXTURE_SCHEMA = 'xtend.epic18.rmt-state-selector-runtime-fixture.v1';
const RMT_STATE_SELECTOR_RUNTIME_WORKPACKAGE = 'WP-E18-07';
const RMT_STATE_SELECTOR_RUNTIME_STATUS = 'accepted-typed-state-selector-xstate-bridge';
const RMT_STATE_SELECTOR_RUNTIME_TARGET = 'typed-state-selector-runtime-ready';
const RMT_STATE_SELECTOR_RUNTIME_MODULE = 'catalog/epic18-rmt-state-selector-runtime.js';
const RMT_STATE_SELECTOR_RUNTIME_RUNTIME = 'xtendrmt/rmt-state-selector-runtime.js';
const RMT_STATE_SELECTOR_RUNTIME_TYPES = 'xtendrmt/rmt-state-selector-runtime.d.ts';
const RMT_STATE_SELECTOR_RUNTIME_SUITE = 'tests/rmt/rmt_state_selector_runtime_suite.js';
const RMT_STATE_SELECTOR_RUNTIME_FIXTURE = 'tests/fixtures/rmt-state-selector-runtime.rmt';
const RMT_STATE_SELECTOR_RUNTIME_DOCS = 'docs/rmt-state-selector-runtime.md';
const RMT_STATE_SELECTOR_RUNTIME_WORKPACKAGE_DOC = 'development/WP-E18-07-Typed-State-Selectors-und-XState-Bridge-fuer-Apps-bauen.md';
const RMT_STATE_SELECTOR_RUNTIME_BACKLOG = 'development/BACKLOG-EPIC-18-XTendRMT-App-Platform-und-Media-Manager-Vendor-Upstream.md';
const RMT_STATE_SELECTOR_RUNTIME_EPIC = 'development/docs-evidence/root/epic18-media-manager-vendor-upstream.md';
const RMT_STATE_SELECTOR_RUNTIME_LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-state-selector-runtime --json';
const RMT_STATE_SELECTOR_RUNTIME_PACKAGE_SCRIPT = 'npm run test:rmt-state-selector-runtime';
const NEXT_WORKPACKAGE = 'WP-E18-08';
const NEXT_DECISION = 'actions-effects-datasources-resource-runtime';

const REQUIRED_STATE_CAPABILITIES = Object.freeze([
  'typed-state-definitions',
  'state-graph-snapshot',
  'selector-evaluation',
  'derived-values',
  'reducer-command-dispatch',
  'xstate-bridge',
  'render-context-model',
  'preserve-patch-planning',
  'attribute-sync-bindings',
  'non-structural-selection-updates'
]);

const REQUIRED_STATE_TYPES = Object.freeze([
  'collection',
  'object',
  'boolean',
  'string',
  'number',
  'nullable'
]);

const REQUIRED_BOUNDARIES = Object.freeze([
  'no-rmt-kernel-import-of-xtend-types',
  'xstate-is-injected-host-adapter',
  'component-native-primitives-remain-generic',
  'selection-updates-preserve-dom',
  'filter-updates-may-request-structural-rerender',
  'no-media-manager-product-state-taxonomy'
]);

const REQUIRED_ARTIFACTS = Object.freeze([
  RMT_STATE_SELECTOR_RUNTIME_MODULE,
  RMT_STATE_SELECTOR_RUNTIME_SUITE,
  RMT_STATE_SELECTOR_RUNTIME_FIXTURE,
  RMT_STATE_SELECTOR_RUNTIME_DOCS,
  RMT_STATE_SELECTOR_RUNTIME_WORKPACKAGE_DOC,
  RMT_STATE_SELECTOR_RUNTIME_RUNTIME,
  RMT_STATE_SELECTOR_RUNTIME_TYPES
]);

const REQUIRED_DOCS = Object.freeze([
  RMT_STATE_SELECTOR_RUNTIME_DOCS,
  RMT_STATE_SELECTOR_RUNTIME_WORKPACKAGE_DOC,
  RMT_STATE_SELECTOR_RUNTIME_BACKLOG,
  RMT_STATE_SELECTOR_RUNTIME_EPIC
]);

function createRmtStateSelectorRuntimePlan(options = {}) {
  return {
    schema: RMT_STATE_SELECTOR_RUNTIME_SCHEMA,
    reportSchema: RMT_STATE_SELECTOR_RUNTIME_REPORT_SCHEMA,
    fixtureSchema: RMT_STATE_SELECTOR_RUNTIME_FIXTURE_SCHEMA,
    componentPrimitiveSchema: RMT_COMPONENT_TEMPLATE_PRIMITIVES_SCHEMA,
    componentPrimitiveWorkpackage: RMT_COMPONENT_TEMPLATE_PRIMITIVES_WORKPACKAGE,
    workpackage: RMT_STATE_SELECTOR_RUNTIME_WORKPACKAGE,
    status: RMT_STATE_SELECTOR_RUNTIME_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    targetReadiness: RMT_STATE_SELECTOR_RUNTIME_TARGET,
    module: RMT_STATE_SELECTOR_RUNTIME_MODULE,
    runtime: RMT_STATE_SELECTOR_RUNTIME_RUNTIME,
    types: RMT_STATE_SELECTOR_RUNTIME_TYPES,
    suite: RMT_STATE_SELECTOR_RUNTIME_SUITE,
    fixture: RMT_STATE_SELECTOR_RUNTIME_FIXTURE,
    docs: RMT_STATE_SELECTOR_RUNTIME_DOCS,
    workpackageDocument: RMT_STATE_SELECTOR_RUNTIME_WORKPACKAGE_DOC,
    localGate: RMT_STATE_SELECTOR_RUNTIME_LOCAL_GATE,
    packageScript: RMT_STATE_SELECTOR_RUNTIME_PACKAGE_SCRIPT,
    stateCapabilities: REQUIRED_STATE_CAPABILITIES.slice(),
    stateTypes: REQUIRED_STATE_TYPES.slice(),
    boundaries: REQUIRED_BOUNDARIES.slice(),
    artifactPaths: REQUIRED_ARTIFACTS.slice(),
    requiredDocs: REQUIRED_DOCS.slice(),
    model: {
      typedStateDefinitions: true,
      reducerCommandsRequired: true,
      selectorsFeedRenderContext: true,
      xstateImportedByRuntime: false,
      xstateInjectedAsHostAdapter: true,
      selectionUpdatesPreserveDom: true,
      filterUpdatesMayRerenderStructure: true,
      productStateTaxonomyAllowed: false
    },
    kernelBoundary: KERNEL_BOUNDARY,
    nextWorkpackage: NEXT_WORKPACKAGE,
    nextDecision: NEXT_DECISION
  };
}

function validateRmtStateSelectorRuntimePlan(plan = createRmtStateSelectorRuntimePlan()) {
  const errors = [];
  const model = plan && plan.model ? plan.model : {};

  if (!plan || plan.schema !== RMT_STATE_SELECTOR_RUNTIME_SCHEMA) errors.push(`schema must be ${RMT_STATE_SELECTOR_RUNTIME_SCHEMA}`);
  if (!plan || plan.reportSchema !== RMT_STATE_SELECTOR_RUNTIME_REPORT_SCHEMA) errors.push(`reportSchema must be ${RMT_STATE_SELECTOR_RUNTIME_REPORT_SCHEMA}`);
  if (!plan || plan.fixtureSchema !== RMT_STATE_SELECTOR_RUNTIME_FIXTURE_SCHEMA) errors.push(`fixtureSchema must be ${RMT_STATE_SELECTOR_RUNTIME_FIXTURE_SCHEMA}`);
  if (!plan || plan.componentPrimitiveSchema !== RMT_COMPONENT_TEMPLATE_PRIMITIVES_SCHEMA) errors.push('WP-E18-07 must build on WP-E18-06 component primitives');
  if (!plan || plan.componentPrimitiveWorkpackage !== RMT_COMPONENT_TEMPLATE_PRIMITIVES_WORKPACKAGE) errors.push('component primitive workpackage must be WP-E18-06');
  if (!plan || plan.workpackage !== RMT_STATE_SELECTOR_RUNTIME_WORKPACKAGE) errors.push(`workpackage must be ${RMT_STATE_SELECTOR_RUNTIME_WORKPACKAGE}`);
  if (!plan || plan.status !== RMT_STATE_SELECTOR_RUNTIME_STATUS) errors.push(`status must be ${RMT_STATE_SELECTOR_RUNTIME_STATUS}`);
  if (!plan || plan.targetReadiness !== RMT_STATE_SELECTOR_RUNTIME_TARGET) errors.push(`targetReadiness must be ${RMT_STATE_SELECTOR_RUNTIME_TARGET}`);
  REQUIRED_STATE_CAPABILITIES.forEach((capability) => {
    if (!plan || !plan.stateCapabilities.includes(capability)) errors.push(`state capability missing: ${capability}`);
  });
  REQUIRED_STATE_TYPES.forEach((type) => {
    if (!plan || !plan.stateTypes.includes(type)) errors.push(`state type missing: ${type}`);
  });
  REQUIRED_BOUNDARIES.forEach((boundary) => {
    if (!plan || !plan.boundaries.includes(boundary)) errors.push(`boundary missing: ${boundary}`);
  });
  REQUIRED_ARTIFACTS.forEach((artifact) => {
    if (!plan || !plan.artifactPaths.includes(artifact)) errors.push(`artifact missing: ${artifact}`);
  });
  REQUIRED_DOCS.forEach((doc) => {
    if (!plan || !plan.requiredDocs.includes(doc)) errors.push(`doc missing: ${doc}`);
  });
  if (model.typedStateDefinitions !== true) errors.push('typed state definitions must be enabled');
  if (model.reducerCommandsRequired !== true) errors.push('reducer commands must be required');
  if (model.selectorsFeedRenderContext !== true) errors.push('selectors must feed render context');
  if (model.xstateImportedByRuntime !== false) errors.push('xstate must not be imported by runtime');
  if (model.xstateInjectedAsHostAdapter !== true) errors.push('xstate must be injected as host adapter');
  if (model.selectionUpdatesPreserveDom !== true) errors.push('selection updates must preserve DOM');
  if (model.filterUpdatesMayRerenderStructure !== true) errors.push('filter updates may request structural rerender');
  if (model.productStateTaxonomyAllowed !== false) errors.push('product state taxonomy must stay disallowed');
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  if (!plan || plan.nextWorkpackage !== NEXT_WORKPACKAGE) errors.push(`nextWorkpackage must be ${NEXT_WORKPACKAGE}`);
  if (!plan || plan.nextDecision !== NEXT_DECISION) errors.push(`nextDecision must be ${NEXT_DECISION}`);

  return {
    schema: RMT_STATE_SELECTOR_RUNTIME_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors,
    workpackage: RMT_STATE_SELECTOR_RUNTIME_WORKPACKAGE,
    checkedAt: 'static-local'
  };
}

function createRmtStateSelectorRuntimeReport(options = {}) {
  const plan = options.plan || createRmtStateSelectorRuntimePlan(options);
  const validation = validateRmtStateSelectorRuntimePlan(plan);

  return {
    schema: RMT_STATE_SELECTOR_RUNTIME_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors.slice(),
    workpackage: plan.workpackage,
    status: plan.status,
    targetReadiness: plan.targetReadiness,
    stateCapabilityCount: plan.stateCapabilities.length,
    stateTypeCount: plan.stateTypes.length,
    boundaryCount: plan.boundaries.length,
    xstateImportedByRuntime: plan.model.xstateImportedByRuntime,
    selectionUpdatesPreserveDom: plan.model.selectionUpdatesPreserveDom,
    nextWorkpackage: plan.nextWorkpackage,
    nextDecision: plan.nextDecision,
    kernelBoundary: plan.kernelBoundary
  };
}

module.exports = {
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  REQUIRED_ARTIFACTS,
  REQUIRED_BOUNDARIES,
  REQUIRED_DOCS,
  REQUIRED_STATE_CAPABILITIES,
  REQUIRED_STATE_TYPES,
  RMT_STATE_SELECTOR_RUNTIME_BACKLOG,
  RMT_STATE_SELECTOR_RUNTIME_DOCS,
  RMT_STATE_SELECTOR_RUNTIME_EPIC,
  RMT_STATE_SELECTOR_RUNTIME_FIXTURE,
  RMT_STATE_SELECTOR_RUNTIME_FIXTURE_SCHEMA,
  RMT_STATE_SELECTOR_RUNTIME_LOCAL_GATE,
  RMT_STATE_SELECTOR_RUNTIME_MODULE,
  RMT_STATE_SELECTOR_RUNTIME_PACKAGE_SCRIPT,
  RMT_STATE_SELECTOR_RUNTIME_REPORT_SCHEMA,
  RMT_STATE_SELECTOR_RUNTIME_RUNTIME,
  RMT_STATE_SELECTOR_RUNTIME_SCHEMA,
  RMT_STATE_SELECTOR_RUNTIME_STATUS,
  RMT_STATE_SELECTOR_RUNTIME_SUITE,
  RMT_STATE_SELECTOR_RUNTIME_TARGET,
  RMT_STATE_SELECTOR_RUNTIME_TYPES,
  RMT_STATE_SELECTOR_RUNTIME_WORKPACKAGE,
  RMT_STATE_SELECTOR_RUNTIME_WORKPACKAGE_DOC,
  createRmtStateSelectorRuntimePlan,
  createRmtStateSelectorRuntimeReport,
  validateRmtStateSelectorRuntimePlan
};
