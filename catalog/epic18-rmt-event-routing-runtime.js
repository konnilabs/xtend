const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-gate-matrix');
const {
  RMT_ACTION_EFFECT_RUNTIME_SCHEMA,
  RMT_ACTION_EFFECT_RUNTIME_WORKPACKAGE
} = require('./epic18-rmt-action-effect-runtime');

const RMT_EVENT_ROUTING_RUNTIME_SCHEMA = 'xtend.epic18.rmt-event-routing-runtime.v1';
const RMT_EVENT_ROUTING_RUNTIME_REPORT_SCHEMA = 'xtend.epic18.rmt-event-routing-runtime-report.v1';
const RMT_EVENT_ROUTING_RUNTIME_FIXTURE_SCHEMA = 'xtend.epic18.rmt-event-routing-runtime-fixture.v1';
const RMT_EVENT_ROUTING_RUNTIME_WORKPACKAGE = 'WP-E18-09';
const RMT_EVENT_ROUTING_RUNTIME_STATUS = 'accepted-declarative-event-routing-component-interactions';
const RMT_EVENT_ROUTING_RUNTIME_TARGET = 'event-routing-component-interactions-ready';
const RMT_EVENT_ROUTING_RUNTIME_MODULE = 'catalog/epic18-rmt-event-routing-runtime.js';
const RMT_EVENT_ROUTING_RUNTIME_RUNTIME = 'xtendrmt/rmt-event-routing-runtime.js';
const RMT_EVENT_ROUTING_RUNTIME_TYPES = 'xtendrmt/rmt-event-routing-runtime.d.ts';
const RMT_EVENT_ROUTING_RUNTIME_SUITE = 'tests/rmt/rmt_event_routing_runtime_suite.js';
const RMT_EVENT_ROUTING_RUNTIME_FIXTURE = 'tests/fixtures/rmt-event-routing-runtime.rmt';
const RMT_EVENT_ROUTING_RUNTIME_DOCS = 'docs/rmt-event-routing-runtime.md';
const RMT_EVENT_ROUTING_RUNTIME_WORKPACKAGE_DOC = 'development/WP-E18-09-Deklaratives-Event-Routing-und-Component-Interaction-Contracts-bauen.md';
const RMT_EVENT_ROUTING_RUNTIME_BACKLOG = 'development/BACKLOG-EPIC-18-XTendRMT-App-Platform-und-Media-Manager-Vendor-Upstream.md';
const RMT_EVENT_ROUTING_RUNTIME_EPIC = 'docs/epic18-media-manager-vendor-upstream.md';
const RMT_EVENT_ROUTING_RUNTIME_LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-event-routing-runtime --json';
const RMT_EVENT_ROUTING_RUNTIME_PACKAGE_SCRIPT = 'npm run test:rmt-event-routing-runtime';
const NEXT_WORKPACKAGE = 'WP-E18-10';
const NEXT_DECISION = 'surface-overlay-portal-resource-graph-hardening';

const REQUIRED_EVENT_CAPABILITIES = Object.freeze([
  'dom-event-bindings',
  'custom-event-bindings',
  'keyboard-event-bindings',
  'form-event-bindings',
  'event-to-action-mapping',
  'payload-contract-validation',
  'event-governance-prevent-default-stop-propagation',
  'retargeting-policy',
  'owner-scoped-listener-lifecycle',
  'component-interaction-contracts',
  'cancel-action-routing',
  'diagnostics'
]);

const REQUIRED_EVENT_KINDS = Object.freeze([
  'dom',
  'custom',
  'keyboard',
  'form',
  'surface',
  'drop'
]);

const REQUIRED_GOVERNANCE_POLICIES = Object.freeze([
  'preventDefault',
  'stopPropagation',
  'stopImmediatePropagation',
  'capture',
  'passive',
  'once',
  'retarget'
]);

const REQUIRED_BOUNDARIES = Object.freeze([
  'no-rmt-kernel-import-of-xtend-types',
  'event-routing-uses-injected-action-runtime',
  'no-product-local-event-delegation-framework',
  'payload-contracts-required-for-action-events',
  'normal-ui-no-html-string-renderer',
  'no-media-manager-product-event-taxonomy'
]);

const REQUIRED_ARTIFACTS = Object.freeze([
  RMT_EVENT_ROUTING_RUNTIME_MODULE,
  RMT_EVENT_ROUTING_RUNTIME_SUITE,
  RMT_EVENT_ROUTING_RUNTIME_FIXTURE,
  RMT_EVENT_ROUTING_RUNTIME_DOCS,
  RMT_EVENT_ROUTING_RUNTIME_WORKPACKAGE_DOC,
  RMT_EVENT_ROUTING_RUNTIME_RUNTIME,
  RMT_EVENT_ROUTING_RUNTIME_TYPES
]);

const REQUIRED_DOCS = Object.freeze([
  RMT_EVENT_ROUTING_RUNTIME_DOCS,
  RMT_EVENT_ROUTING_RUNTIME_WORKPACKAGE_DOC,
  RMT_EVENT_ROUTING_RUNTIME_BACKLOG,
  RMT_EVENT_ROUTING_RUNTIME_EPIC
]);

function createRmtEventRoutingRuntimePlan(options = {}) {
  return {
    schema: RMT_EVENT_ROUTING_RUNTIME_SCHEMA,
    reportSchema: RMT_EVENT_ROUTING_RUNTIME_REPORT_SCHEMA,
    fixtureSchema: RMT_EVENT_ROUTING_RUNTIME_FIXTURE_SCHEMA,
    actionEffectRuntimeSchema: RMT_ACTION_EFFECT_RUNTIME_SCHEMA,
    actionEffectRuntimeWorkpackage: RMT_ACTION_EFFECT_RUNTIME_WORKPACKAGE,
    workpackage: RMT_EVENT_ROUTING_RUNTIME_WORKPACKAGE,
    status: RMT_EVENT_ROUTING_RUNTIME_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    targetReadiness: RMT_EVENT_ROUTING_RUNTIME_TARGET,
    module: RMT_EVENT_ROUTING_RUNTIME_MODULE,
    runtime: RMT_EVENT_ROUTING_RUNTIME_RUNTIME,
    types: RMT_EVENT_ROUTING_RUNTIME_TYPES,
    suite: RMT_EVENT_ROUTING_RUNTIME_SUITE,
    fixture: RMT_EVENT_ROUTING_RUNTIME_FIXTURE,
    docs: RMT_EVENT_ROUTING_RUNTIME_DOCS,
    workpackageDocument: RMT_EVENT_ROUTING_RUNTIME_WORKPACKAGE_DOC,
    localGate: RMT_EVENT_ROUTING_RUNTIME_LOCAL_GATE,
    packageScript: RMT_EVENT_ROUTING_RUNTIME_PACKAGE_SCRIPT,
    eventCapabilities: REQUIRED_EVENT_CAPABILITIES.slice(),
    eventKinds: REQUIRED_EVENT_KINDS.slice(),
    governancePolicies: REQUIRED_GOVERNANCE_POLICIES.slice(),
    boundaries: REQUIRED_BOUNDARIES.slice(),
    artifactPaths: REQUIRED_ARTIFACTS.slice(),
    requiredDocs: REQUIRED_DOCS.slice(),
    model: {
      eventToActionUsesInjectedRuntime: true,
      payloadContractsRequired: true,
      ownerScopedListenerCleanup: true,
      retargetingDeclarative: true,
      closestDelegationRequired: false,
      productEventFrameworkAllowed: false,
      productEventTaxonomyAllowed: false,
      diagnosticsExposeSourceComponentPayloadAction: true
    },
    kernelBoundary: KERNEL_BOUNDARY,
    nextWorkpackage: NEXT_WORKPACKAGE,
    nextDecision: NEXT_DECISION
  };
}

function validateRmtEventRoutingRuntimePlan(plan = createRmtEventRoutingRuntimePlan()) {
  const errors = [];
  const model = plan && plan.model ? plan.model : {};

  if (!plan || plan.schema !== RMT_EVENT_ROUTING_RUNTIME_SCHEMA) errors.push(`schema must be ${RMT_EVENT_ROUTING_RUNTIME_SCHEMA}`);
  if (!plan || plan.reportSchema !== RMT_EVENT_ROUTING_RUNTIME_REPORT_SCHEMA) errors.push(`reportSchema must be ${RMT_EVENT_ROUTING_RUNTIME_REPORT_SCHEMA}`);
  if (!plan || plan.fixtureSchema !== RMT_EVENT_ROUTING_RUNTIME_FIXTURE_SCHEMA) errors.push(`fixtureSchema must be ${RMT_EVENT_ROUTING_RUNTIME_FIXTURE_SCHEMA}`);
  if (!plan || plan.actionEffectRuntimeSchema !== RMT_ACTION_EFFECT_RUNTIME_SCHEMA) errors.push('WP-E18-09 must build on WP-E18-08 action effect runtime');
  if (!plan || plan.actionEffectRuntimeWorkpackage !== RMT_ACTION_EFFECT_RUNTIME_WORKPACKAGE) errors.push('action effect runtime workpackage must be WP-E18-08');
  if (!plan || plan.workpackage !== RMT_EVENT_ROUTING_RUNTIME_WORKPACKAGE) errors.push(`workpackage must be ${RMT_EVENT_ROUTING_RUNTIME_WORKPACKAGE}`);
  if (!plan || plan.status !== RMT_EVENT_ROUTING_RUNTIME_STATUS) errors.push(`status must be ${RMT_EVENT_ROUTING_RUNTIME_STATUS}`);
  if (!plan || plan.targetReadiness !== RMT_EVENT_ROUTING_RUNTIME_TARGET) errors.push(`targetReadiness must be ${RMT_EVENT_ROUTING_RUNTIME_TARGET}`);
  REQUIRED_EVENT_CAPABILITIES.forEach((capability) => {
    if (!plan || !plan.eventCapabilities.includes(capability)) errors.push(`event capability missing: ${capability}`);
  });
  REQUIRED_EVENT_KINDS.forEach((kind) => {
    if (!plan || !plan.eventKinds.includes(kind)) errors.push(`event kind missing: ${kind}`);
  });
  REQUIRED_GOVERNANCE_POLICIES.forEach((policy) => {
    if (!plan || !plan.governancePolicies.includes(policy)) errors.push(`governance policy missing: ${policy}`);
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
  if (model.eventToActionUsesInjectedRuntime !== true) errors.push('event routing must use injected action runtime');
  if (model.payloadContractsRequired !== true) errors.push('payload contracts must be required');
  if (model.ownerScopedListenerCleanup !== true) errors.push('listener cleanup must be owner-scoped');
  if (model.retargetingDeclarative !== true) errors.push('retargeting must be declarative');
  if (model.closestDelegationRequired !== false) errors.push('closest delegation must not be required');
  if (model.productEventFrameworkAllowed !== false) errors.push('product event frameworks must stay disallowed');
  if (model.productEventTaxonomyAllowed !== false) errors.push('product event taxonomy must stay disallowed');
  if (model.diagnosticsExposeSourceComponentPayloadAction !== true) errors.push('diagnostics must expose event source, component, payload and action');
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  if (!plan || plan.nextWorkpackage !== NEXT_WORKPACKAGE) errors.push(`nextWorkpackage must be ${NEXT_WORKPACKAGE}`);
  if (!plan || plan.nextDecision !== NEXT_DECISION) errors.push(`nextDecision must be ${NEXT_DECISION}`);

  return {
    schema: RMT_EVENT_ROUTING_RUNTIME_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors,
    workpackage: RMT_EVENT_ROUTING_RUNTIME_WORKPACKAGE,
    checkedAt: 'static-local'
  };
}

function createRmtEventRoutingRuntimeReport(options = {}) {
  const plan = options.plan || createRmtEventRoutingRuntimePlan(options);
  const validation = validateRmtEventRoutingRuntimePlan(plan);

  return {
    schema: RMT_EVENT_ROUTING_RUNTIME_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors.slice(),
    workpackage: plan.workpackage,
    status: plan.status,
    targetReadiness: plan.targetReadiness,
    eventCapabilityCount: plan.eventCapabilities.length,
    eventKindCount: plan.eventKinds.length,
    governancePolicyCount: plan.governancePolicies.length,
    boundaryCount: plan.boundaries.length,
    closestDelegationRequired: plan.model.closestDelegationRequired,
    diagnosticsExposeSourceComponentPayloadAction: plan.model.diagnosticsExposeSourceComponentPayloadAction,
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
  REQUIRED_EVENT_CAPABILITIES,
  REQUIRED_EVENT_KINDS,
  REQUIRED_GOVERNANCE_POLICIES,
  RMT_EVENT_ROUTING_RUNTIME_BACKLOG,
  RMT_EVENT_ROUTING_RUNTIME_DOCS,
  RMT_EVENT_ROUTING_RUNTIME_EPIC,
  RMT_EVENT_ROUTING_RUNTIME_FIXTURE,
  RMT_EVENT_ROUTING_RUNTIME_FIXTURE_SCHEMA,
  RMT_EVENT_ROUTING_RUNTIME_LOCAL_GATE,
  RMT_EVENT_ROUTING_RUNTIME_MODULE,
  RMT_EVENT_ROUTING_RUNTIME_PACKAGE_SCRIPT,
  RMT_EVENT_ROUTING_RUNTIME_REPORT_SCHEMA,
  RMT_EVENT_ROUTING_RUNTIME_RUNTIME,
  RMT_EVENT_ROUTING_RUNTIME_SCHEMA,
  RMT_EVENT_ROUTING_RUNTIME_STATUS,
  RMT_EVENT_ROUTING_RUNTIME_SUITE,
  RMT_EVENT_ROUTING_RUNTIME_TARGET,
  RMT_EVENT_ROUTING_RUNTIME_TYPES,
  RMT_EVENT_ROUTING_RUNTIME_WORKPACKAGE,
  RMT_EVENT_ROUTING_RUNTIME_WORKPACKAGE_DOC,
  createRmtEventRoutingRuntimePlan,
  createRmtEventRoutingRuntimeReport,
  validateRmtEventRoutingRuntimePlan
};
