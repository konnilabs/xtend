const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-gate-matrix');
const {
  RMT_STATE_SELECTOR_RUNTIME_SCHEMA,
  RMT_STATE_SELECTOR_RUNTIME_WORKPACKAGE
} = require('./epic18-rmt-state-selector-runtime');

const RMT_ACTION_EFFECT_RUNTIME_SCHEMA = 'xtend.epic18.rmt-action-effect-runtime.v1';
const RMT_ACTION_EFFECT_RUNTIME_REPORT_SCHEMA = 'xtend.epic18.rmt-action-effect-runtime-report.v1';
const RMT_ACTION_EFFECT_RUNTIME_FIXTURE_SCHEMA = 'xtend.epic18.rmt-action-effect-runtime-fixture.v1';
const RMT_ACTION_EFFECT_RUNTIME_WORKPACKAGE = 'WP-E18-08';
const RMT_ACTION_EFFECT_RUNTIME_STATUS = 'accepted-actions-effects-datasources-resource-runtime';
const RMT_ACTION_EFFECT_RUNTIME_TARGET = 'action-effect-resource-runtime-ready';
const RMT_ACTION_EFFECT_RUNTIME_MODULE = 'catalog/epic18-rmt-action-effect-runtime.js';
const RMT_ACTION_EFFECT_RUNTIME_RUNTIME = 'xtendrmt/rmt-action-effect-runtime.js';
const RMT_ACTION_EFFECT_RUNTIME_TYPES = 'xtendrmt/rmt-action-effect-runtime.d.ts';
const RMT_ACTION_EFFECT_RUNTIME_SUITE = 'tests/rmt/rmt_action_effect_runtime_suite.js';
const RMT_ACTION_EFFECT_RUNTIME_FIXTURE = 'tests/fixtures/rmt-action-effect-runtime.rmt';
const RMT_ACTION_EFFECT_RUNTIME_DOCS = 'docs/rmt-action-effect-runtime.md';
const RMT_ACTION_EFFECT_RUNTIME_WORKPACKAGE_DOC = 'development/WP-E18-08-Actions-Effects-DataSources-und-Resource-Runtime-anbinden.md';
const RMT_ACTION_EFFECT_RUNTIME_BACKLOG = 'development/BACKLOG-EPIC-18-XTendRMT-App-Platform-und-Media-Manager-Vendor-Upstream.md';
const RMT_ACTION_EFFECT_RUNTIME_EPIC = 'docs/epic18-media-manager-vendor-upstream.md';
const RMT_ACTION_EFFECT_RUNTIME_LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-action-effect-runtime --json';
const RMT_ACTION_EFFECT_RUNTIME_PACKAGE_SCRIPT = 'npm run test:rmt-action-effect-runtime';
const NEXT_WORKPACKAGE = 'WP-E18-09';
const NEXT_DECISION = 'declarative-event-routing-component-interaction-contracts';

const REQUIRED_ACTION_CAPABILITIES = Object.freeze([
  'action-loading-success-error-cancel',
  'fixture-datasource',
  'rest-datasource-host-adapter',
  'ssr-datasource',
  'host-datasource-adapter',
  'toast-feedback-effect',
  'navigation-effect',
  'focus-effect',
  'lazy-import-effect',
  'side-effect-adapter',
  'resource-owner-cleanup',
  'diagnostics'
]);

const REQUIRED_DATASOURCE_KINDS = Object.freeze([
  'fixture',
  'rest',
  'ssr',
  'host'
]);

const REQUIRED_EFFECT_KINDS = Object.freeze([
  'toast',
  'feedback',
  'navigation',
  'focus',
  'lazy-import',
  'side-effect'
]);

const REQUIRED_RESOURCE_KINDS = Object.freeze([
  'object-url',
  'stream',
  'observer',
  'timer',
  'lazy-import'
]);

const REQUIRED_RUNTIME_FACTORIES = Object.freeze([
  'createRmtActionEffectRuntime',
  'createRmtResourceManager'
]);

const REQUIRED_BOUNDARIES = Object.freeze([
  'no-rmt-kernel-import-of-xtend-types',
  'no-product-local-action-framework',
  'data-access-through-injected-adapters',
  'resources-owned-per-action-or-scope',
  'normal-ui-no-html-string-renderer',
  'no-media-manager-product-flow-taxonomy'
]);

const REQUIRED_ARTIFACTS = Object.freeze([
  RMT_ACTION_EFFECT_RUNTIME_MODULE,
  RMT_ACTION_EFFECT_RUNTIME_SUITE,
  RMT_ACTION_EFFECT_RUNTIME_FIXTURE,
  RMT_ACTION_EFFECT_RUNTIME_DOCS,
  RMT_ACTION_EFFECT_RUNTIME_WORKPACKAGE_DOC,
  RMT_ACTION_EFFECT_RUNTIME_RUNTIME,
  RMT_ACTION_EFFECT_RUNTIME_TYPES
]);

const REQUIRED_DOCS = Object.freeze([
  RMT_ACTION_EFFECT_RUNTIME_DOCS,
  RMT_ACTION_EFFECT_RUNTIME_WORKPACKAGE_DOC,
  RMT_ACTION_EFFECT_RUNTIME_BACKLOG,
  RMT_ACTION_EFFECT_RUNTIME_EPIC
]);

function createRmtActionEffectRuntimePlan(options = {}) {
  return {
    schema: RMT_ACTION_EFFECT_RUNTIME_SCHEMA,
    reportSchema: RMT_ACTION_EFFECT_RUNTIME_REPORT_SCHEMA,
    fixtureSchema: RMT_ACTION_EFFECT_RUNTIME_FIXTURE_SCHEMA,
    stateSelectorRuntimeSchema: RMT_STATE_SELECTOR_RUNTIME_SCHEMA,
    stateSelectorRuntimeWorkpackage: RMT_STATE_SELECTOR_RUNTIME_WORKPACKAGE,
    workpackage: RMT_ACTION_EFFECT_RUNTIME_WORKPACKAGE,
    status: RMT_ACTION_EFFECT_RUNTIME_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    targetReadiness: RMT_ACTION_EFFECT_RUNTIME_TARGET,
    module: RMT_ACTION_EFFECT_RUNTIME_MODULE,
    runtime: RMT_ACTION_EFFECT_RUNTIME_RUNTIME,
    types: RMT_ACTION_EFFECT_RUNTIME_TYPES,
    suite: RMT_ACTION_EFFECT_RUNTIME_SUITE,
    fixture: RMT_ACTION_EFFECT_RUNTIME_FIXTURE,
    docs: RMT_ACTION_EFFECT_RUNTIME_DOCS,
    workpackageDocument: RMT_ACTION_EFFECT_RUNTIME_WORKPACKAGE_DOC,
    localGate: RMT_ACTION_EFFECT_RUNTIME_LOCAL_GATE,
    packageScript: RMT_ACTION_EFFECT_RUNTIME_PACKAGE_SCRIPT,
    actionCapabilities: REQUIRED_ACTION_CAPABILITIES.slice(),
    dataSourceKinds: REQUIRED_DATASOURCE_KINDS.slice(),
    effectKinds: REQUIRED_EFFECT_KINDS.slice(),
    resourceKinds: REQUIRED_RESOURCE_KINDS.slice(),
    runtimeFactories: REQUIRED_RUNTIME_FACTORIES.slice(),
    boundaries: REQUIRED_BOUNDARIES.slice(),
    artifactPaths: REQUIRED_ARTIFACTS.slice(),
    requiredDocs: REQUIRED_DOCS.slice(),
    model: {
      actionsOwnLoadingSuccessErrorCancel: true,
      dataSourceAdaptersInjected: true,
      restAccessUsesAdapter: true,
      ssrPayloadHydratesState: true,
      hostAdaptersAreExplicit: true,
      feedbackNavigationFocusEffectsSupported: true,
      lazyImportsAreResources: true,
      resourcesReleaseByOwner: true,
      productActionFrameworkAllowed: false,
      productFlowTaxonomyAllowed: false
    },
    kernelBoundary: KERNEL_BOUNDARY,
    nextWorkpackage: NEXT_WORKPACKAGE,
    nextDecision: NEXT_DECISION
  };
}

function validateRmtActionEffectRuntimePlan(plan = createRmtActionEffectRuntimePlan()) {
  const errors = [];
  const model = plan && plan.model ? plan.model : {};

  if (!plan || plan.schema !== RMT_ACTION_EFFECT_RUNTIME_SCHEMA) errors.push(`schema must be ${RMT_ACTION_EFFECT_RUNTIME_SCHEMA}`);
  if (!plan || plan.reportSchema !== RMT_ACTION_EFFECT_RUNTIME_REPORT_SCHEMA) errors.push(`reportSchema must be ${RMT_ACTION_EFFECT_RUNTIME_REPORT_SCHEMA}`);
  if (!plan || plan.fixtureSchema !== RMT_ACTION_EFFECT_RUNTIME_FIXTURE_SCHEMA) errors.push(`fixtureSchema must be ${RMT_ACTION_EFFECT_RUNTIME_FIXTURE_SCHEMA}`);
  if (!plan || plan.stateSelectorRuntimeSchema !== RMT_STATE_SELECTOR_RUNTIME_SCHEMA) errors.push('WP-E18-08 must build on WP-E18-07 state selector runtime');
  if (!plan || plan.stateSelectorRuntimeWorkpackage !== RMT_STATE_SELECTOR_RUNTIME_WORKPACKAGE) errors.push('state selector runtime workpackage must be WP-E18-07');
  if (!plan || plan.workpackage !== RMT_ACTION_EFFECT_RUNTIME_WORKPACKAGE) errors.push(`workpackage must be ${RMT_ACTION_EFFECT_RUNTIME_WORKPACKAGE}`);
  if (!plan || plan.status !== RMT_ACTION_EFFECT_RUNTIME_STATUS) errors.push(`status must be ${RMT_ACTION_EFFECT_RUNTIME_STATUS}`);
  if (!plan || plan.targetReadiness !== RMT_ACTION_EFFECT_RUNTIME_TARGET) errors.push(`targetReadiness must be ${RMT_ACTION_EFFECT_RUNTIME_TARGET}`);
  REQUIRED_ACTION_CAPABILITIES.forEach((capability) => {
    if (!plan || !plan.actionCapabilities.includes(capability)) errors.push(`action capability missing: ${capability}`);
  });
  REQUIRED_DATASOURCE_KINDS.forEach((kind) => {
    if (!plan || !plan.dataSourceKinds.includes(kind)) errors.push(`datasource kind missing: ${kind}`);
  });
  REQUIRED_EFFECT_KINDS.forEach((kind) => {
    if (!plan || !plan.effectKinds.includes(kind)) errors.push(`effect kind missing: ${kind}`);
  });
  REQUIRED_RESOURCE_KINDS.forEach((kind) => {
    if (!plan || !plan.resourceKinds.includes(kind)) errors.push(`resource kind missing: ${kind}`);
  });
  REQUIRED_RUNTIME_FACTORIES.forEach((factory) => {
    if (!plan || !plan.runtimeFactories.includes(factory)) errors.push(`runtime factory missing: ${factory}`);
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
  if (model.actionsOwnLoadingSuccessErrorCancel !== true) errors.push('actions must own loading/success/error/cancel');
  if (model.dataSourceAdaptersInjected !== true) errors.push('datasource adapters must be injected');
  if (model.restAccessUsesAdapter !== true) errors.push('REST must use an injected adapter');
  if (model.ssrPayloadHydratesState !== true) errors.push('SSR payload must hydrate runtime state');
  if (model.hostAdaptersAreExplicit !== true) errors.push('host adapters must be explicit');
  if (model.feedbackNavigationFocusEffectsSupported !== true) errors.push('feedback/navigation/focus effects must be supported');
  if (model.lazyImportsAreResources !== true) errors.push('lazy imports must be resources');
  if (model.resourcesReleaseByOwner !== true) errors.push('resources must release by owner');
  if (model.productActionFrameworkAllowed !== false) errors.push('product action frameworks must stay disallowed');
  if (model.productFlowTaxonomyAllowed !== false) errors.push('product flow taxonomy must stay disallowed');
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  if (!plan || plan.nextWorkpackage !== NEXT_WORKPACKAGE) errors.push(`nextWorkpackage must be ${NEXT_WORKPACKAGE}`);
  if (!plan || plan.nextDecision !== NEXT_DECISION) errors.push(`nextDecision must be ${NEXT_DECISION}`);

  return {
    schema: RMT_ACTION_EFFECT_RUNTIME_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors,
    workpackage: RMT_ACTION_EFFECT_RUNTIME_WORKPACKAGE,
    checkedAt: 'static-local'
  };
}

function createRmtActionEffectRuntimeReport(options = {}) {
  const plan = options.plan || createRmtActionEffectRuntimePlan(options);
  const validation = validateRmtActionEffectRuntimePlan(plan);

  return {
    schema: RMT_ACTION_EFFECT_RUNTIME_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors.slice(),
    workpackage: plan.workpackage,
    status: plan.status,
    targetReadiness: plan.targetReadiness,
    actionCapabilityCount: plan.actionCapabilities.length,
    dataSourceKindCount: plan.dataSourceKinds.length,
    effectKindCount: plan.effectKinds.length,
    resourceKindCount: plan.resourceKinds.length,
    runtimeFactoryCount: plan.runtimeFactories.length,
    boundaryCount: plan.boundaries.length,
    productActionFrameworkAllowed: plan.model.productActionFrameworkAllowed,
    resourcesReleaseByOwner: plan.model.resourcesReleaseByOwner,
    nextWorkpackage: plan.nextWorkpackage,
    nextDecision: plan.nextDecision,
    kernelBoundary: plan.kernelBoundary
  };
}

module.exports = {
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  REQUIRED_ACTION_CAPABILITIES,
  REQUIRED_ARTIFACTS,
  REQUIRED_BOUNDARIES,
  REQUIRED_DATASOURCE_KINDS,
  REQUIRED_DOCS,
  REQUIRED_EFFECT_KINDS,
  REQUIRED_RESOURCE_KINDS,
  RMT_ACTION_EFFECT_RUNTIME_BACKLOG,
  RMT_ACTION_EFFECT_RUNTIME_DOCS,
  RMT_ACTION_EFFECT_RUNTIME_EPIC,
  RMT_ACTION_EFFECT_RUNTIME_FIXTURE,
  RMT_ACTION_EFFECT_RUNTIME_FIXTURE_SCHEMA,
  RMT_ACTION_EFFECT_RUNTIME_LOCAL_GATE,
  RMT_ACTION_EFFECT_RUNTIME_MODULE,
  RMT_ACTION_EFFECT_RUNTIME_PACKAGE_SCRIPT,
  RMT_ACTION_EFFECT_RUNTIME_REPORT_SCHEMA,
  RMT_ACTION_EFFECT_RUNTIME_RUNTIME,
  RMT_ACTION_EFFECT_RUNTIME_SCHEMA,
  RMT_ACTION_EFFECT_RUNTIME_STATUS,
  RMT_ACTION_EFFECT_RUNTIME_SUITE,
  RMT_ACTION_EFFECT_RUNTIME_TARGET,
  RMT_ACTION_EFFECT_RUNTIME_TYPES,
  RMT_ACTION_EFFECT_RUNTIME_WORKPACKAGE,
  RMT_ACTION_EFFECT_RUNTIME_WORKPACKAGE_DOC,
  createRmtActionEffectRuntimePlan,
  createRmtActionEffectRuntimeReport,
  validateRmtActionEffectRuntimePlan
};
