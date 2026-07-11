const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-gate-matrix');
const {
  RMT_ACTION_EFFECT_RUNTIME_SCHEMA,
  RMT_ACTION_EFFECT_RUNTIME_WORKPACKAGE
} = require('./epic18-rmt-action-effect-runtime');
const {
  RMT_EVENT_ROUTING_RUNTIME_SCHEMA,
  RMT_EVENT_ROUTING_RUNTIME_WORKPACKAGE
} = require('./epic18-rmt-event-routing-runtime');

const RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_SCHEMA = 'xtend.epic18.rmt-surface-resource-graph-runtime.v1';
const RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_REPORT_SCHEMA = 'xtend.epic18.rmt-surface-resource-graph-runtime-report.v1';
const RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_FIXTURE_SCHEMA = 'xtend.epic18.rmt-surface-resource-graph-runtime-fixture.v1';
const RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_WORKPACKAGE = 'WP-E18-10';
const RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_STATUS = 'accepted-surface-overlay-portal-resource-graph-runtime';
const RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_TARGET = 'surface-overlay-portal-resource-graph-ready';
const RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_MODULE = 'catalog/epic18-rmt-surface-resource-graph-runtime.js';
const RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_RUNTIME = 'xtendrmt/rmt-surface-resource-graph-runtime.js';
const RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_TYPES = 'xtendrmt/rmt-surface-resource-graph-runtime.d.ts';
const RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_SUITE = 'tests/rmt/rmt_surface_resource_graph_runtime_suite.js';
const RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_FIXTURE = 'tests/fixtures/rmt-surface-resource-graph-runtime.rmt';
const RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_DOCS = 'docs/rmt-surface-resource-graph-runtime.md';
const RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_WORKPACKAGE_DOC = 'development/WP-E18-10-Surface-Overlay-Portal-und-Resource-Graph-generisch-haerten.md';
const RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_BACKLOG = 'development/BACKLOG-EPIC-18-XTendRMT-App-Platform-und-Media-Manager-Vendor-Upstream.md';
const RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_EPIC = 'development/docs-evidence/root/epic18-media-manager-vendor-upstream.md';
const RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-surface-resource-graph-runtime --json';
const RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_PACKAGE_SCRIPT = 'npm run test:rmt-surface-resource-graph-runtime';
const NEXT_WORKPACKAGE = 'WP-E18-11';
const NEXT_DECISION = 'scaffold-linter-lsp-diagnostics-for-rmt-apps';

const REQUIRED_SURFACE_CAPABILITIES = Object.freeze([
  'keyed-surface-repeater',
  'bounds-focus-close-destroy-minimize-restore',
  'surface-persistence',
  'portal-layer-stack',
  'overlay-policy-tooltip-toast-popover-lightbox-menu-dialog',
  'resource-cleanup-per-instance',
  'event-owner-detach-on-destroy',
  'minimize-preserves-dom-state',
  'destroy-releases-owned-resources',
  'diagnostics'
]);

const REQUIRED_SURFACE_KINDS = Object.freeze([
  'workspace',
  'panel',
  'overlay-host'
]);

const REQUIRED_OVERLAY_KINDS = Object.freeze([
  'tooltip',
  'toast',
  'popover',
  'lightbox',
  'menu',
  'dialog'
]);

const REQUIRED_PORTAL_POLICIES = Object.freeze([
  'stacked',
  'modal',
  'nonmodal',
  'toast-region',
  'clipping-escape'
]);

const REQUIRED_BOUNDARIES = Object.freeze([
  'no-rmt-kernel-import-of-xtend-types',
  'no-product-bound-surface-list',
  'no-product-local-registry-repaint',
  'portal-layer-policy-is-generic',
  'resources-owned-per-surface-instance',
  'normal-ui-no-html-string-renderer'
]);

const REQUIRED_ARTIFACTS = Object.freeze([
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_MODULE,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_SUITE,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_FIXTURE,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_DOCS,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_WORKPACKAGE_DOC,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_RUNTIME,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_TYPES
]);

const REQUIRED_DOCS = Object.freeze([
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_DOCS,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_WORKPACKAGE_DOC,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_BACKLOG,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_EPIC
]);

function createRmtSurfaceResourceGraphRuntimePlan(options = {}) {
  return {
    schema: RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_SCHEMA,
    reportSchema: RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_REPORT_SCHEMA,
    fixtureSchema: RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_FIXTURE_SCHEMA,
    actionEffectRuntimeSchema: RMT_ACTION_EFFECT_RUNTIME_SCHEMA,
    actionEffectRuntimeWorkpackage: RMT_ACTION_EFFECT_RUNTIME_WORKPACKAGE,
    eventRoutingRuntimeSchema: RMT_EVENT_ROUTING_RUNTIME_SCHEMA,
    eventRoutingRuntimeWorkpackage: RMT_EVENT_ROUTING_RUNTIME_WORKPACKAGE,
    workpackage: RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_WORKPACKAGE,
    status: RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    targetReadiness: RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_TARGET,
    module: RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_MODULE,
    runtime: RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_RUNTIME,
    types: RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_TYPES,
    suite: RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_SUITE,
    fixture: RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_FIXTURE,
    docs: RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_DOCS,
    workpackageDocument: RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_WORKPACKAGE_DOC,
    localGate: RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_LOCAL_GATE,
    packageScript: RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_PACKAGE_SCRIPT,
    surfaceCapabilities: REQUIRED_SURFACE_CAPABILITIES.slice(),
    surfaceKinds: REQUIRED_SURFACE_KINDS.slice(),
    overlayKinds: REQUIRED_OVERLAY_KINDS.slice(),
    portalPolicies: REQUIRED_PORTAL_POLICIES.slice(),
    boundaries: REQUIRED_BOUNDARIES.slice(),
    artifactPaths: REQUIRED_ARTIFACTS.slice(),
    requiredDocs: REQUIRED_DOCS.slice(),
    model: {
      keyedSurfaceRepeater: true,
      surfaceLifecycleGeneric: true,
      portalLayerPolicyGeneric: true,
      overlayStackSharedAcrossKinds: true,
      minimizePreservesResources: true,
      destroyReleasesResources: true,
      destroyDetachesEventOwners: true,
      persistenceAdapterInjected: true,
      productSurfaceTaxonomyAllowed: false,
      productRegistryRepaintRequired: false,
      htmlStringRendererRequired: false
    },
    kernelBoundary: KERNEL_BOUNDARY,
    nextWorkpackage: NEXT_WORKPACKAGE,
    nextDecision: NEXT_DECISION
  };
}

function validateRmtSurfaceResourceGraphRuntimePlan(plan = createRmtSurfaceResourceGraphRuntimePlan()) {
  const errors = [];
  const model = plan && plan.model ? plan.model : {};

  if (!plan || plan.schema !== RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_SCHEMA) errors.push(`schema must be ${RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_SCHEMA}`);
  if (!plan || plan.reportSchema !== RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_REPORT_SCHEMA) errors.push(`reportSchema must be ${RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_REPORT_SCHEMA}`);
  if (!plan || plan.fixtureSchema !== RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_FIXTURE_SCHEMA) errors.push(`fixtureSchema must be ${RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_FIXTURE_SCHEMA}`);
  if (!plan || plan.actionEffectRuntimeSchema !== RMT_ACTION_EFFECT_RUNTIME_SCHEMA) errors.push('WP-E18-10 must build on WP-E18-08 action effect runtime');
  if (!plan || plan.actionEffectRuntimeWorkpackage !== RMT_ACTION_EFFECT_RUNTIME_WORKPACKAGE) errors.push('action effect runtime workpackage must be WP-E18-08');
  if (!plan || plan.eventRoutingRuntimeSchema !== RMT_EVENT_ROUTING_RUNTIME_SCHEMA) errors.push('WP-E18-10 must build on WP-E18-09 event routing runtime');
  if (!plan || plan.eventRoutingRuntimeWorkpackage !== RMT_EVENT_ROUTING_RUNTIME_WORKPACKAGE) errors.push('event routing runtime workpackage must be WP-E18-09');
  if (!plan || plan.workpackage !== RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_WORKPACKAGE) errors.push(`workpackage must be ${RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_WORKPACKAGE}`);
  if (!plan || plan.status !== RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_STATUS) errors.push(`status must be ${RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_STATUS}`);
  if (!plan || plan.targetReadiness !== RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_TARGET) errors.push(`targetReadiness must be ${RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_TARGET}`);
  REQUIRED_SURFACE_CAPABILITIES.forEach((capability) => {
    if (!plan || !plan.surfaceCapabilities.includes(capability)) errors.push(`surface capability missing: ${capability}`);
  });
  REQUIRED_SURFACE_KINDS.forEach((kind) => {
    if (!plan || !plan.surfaceKinds.includes(kind)) errors.push(`surface kind missing: ${kind}`);
  });
  REQUIRED_OVERLAY_KINDS.forEach((kind) => {
    if (!plan || !plan.overlayKinds.includes(kind)) errors.push(`overlay kind missing: ${kind}`);
  });
  REQUIRED_PORTAL_POLICIES.forEach((policy) => {
    if (!plan || !plan.portalPolicies.includes(policy)) errors.push(`portal policy missing: ${policy}`);
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
  if (model.keyedSurfaceRepeater !== true) errors.push('keyed surface repeater must be implemented');
  if (model.surfaceLifecycleGeneric !== true) errors.push('surface lifecycle must be generic');
  if (model.portalLayerPolicyGeneric !== true) errors.push('portal layer policy must be generic');
  if (model.overlayStackSharedAcrossKinds !== true) errors.push('overlay stack must be shared across overlay kinds');
  if (model.minimizePreservesResources !== true) errors.push('minimize must preserve resources');
  if (model.destroyReleasesResources !== true) errors.push('destroy must release resources');
  if (model.destroyDetachesEventOwners !== true) errors.push('destroy must detach event owners');
  if (model.persistenceAdapterInjected !== true) errors.push('persistence adapter must be injected');
  if (model.productSurfaceTaxonomyAllowed !== false) errors.push('product surface taxonomy must stay disallowed');
  if (model.productRegistryRepaintRequired !== false) errors.push('product registry repaint must not be required');
  if (model.htmlStringRendererRequired !== false) errors.push('html string renderer must not be required');
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  if (!plan || plan.nextWorkpackage !== NEXT_WORKPACKAGE) errors.push(`nextWorkpackage must be ${NEXT_WORKPACKAGE}`);
  if (!plan || plan.nextDecision !== NEXT_DECISION) errors.push(`nextDecision must be ${NEXT_DECISION}`);

  return {
    schema: RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors,
    workpackage: RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_WORKPACKAGE,
    checkedAt: 'static-local'
  };
}

function createRmtSurfaceResourceGraphRuntimeReport(options = {}) {
  const plan = options.plan || createRmtSurfaceResourceGraphRuntimePlan(options);
  const validation = validateRmtSurfaceResourceGraphRuntimePlan(plan);

  return {
    schema: RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors.slice(),
    workpackage: plan.workpackage,
    status: plan.status,
    targetReadiness: plan.targetReadiness,
    surfaceCapabilityCount: plan.surfaceCapabilities.length,
    surfaceKindCount: plan.surfaceKinds.length,
    overlayKindCount: plan.overlayKinds.length,
    portalPolicyCount: plan.portalPolicies.length,
    boundaryCount: plan.boundaries.length,
    productSurfaceTaxonomyAllowed: plan.model.productSurfaceTaxonomyAllowed,
    productRegistryRepaintRequired: plan.model.productRegistryRepaintRequired,
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
  REQUIRED_OVERLAY_KINDS,
  REQUIRED_PORTAL_POLICIES,
  REQUIRED_SURFACE_CAPABILITIES,
  REQUIRED_SURFACE_KINDS,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_BACKLOG,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_DOCS,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_EPIC,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_FIXTURE,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_FIXTURE_SCHEMA,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_LOCAL_GATE,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_MODULE,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_PACKAGE_SCRIPT,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_REPORT_SCHEMA,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_RUNTIME,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_SCHEMA,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_STATUS,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_SUITE,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_TARGET,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_TYPES,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_WORKPACKAGE,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_WORKPACKAGE_DOC,
  createRmtSurfaceResourceGraphRuntimePlan,
  createRmtSurfaceResourceGraphRuntimeReport,
  validateRmtSurfaceResourceGraphRuntimePlan
};
