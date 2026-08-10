const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-gate-matrix');
const {
  RMT_APP_PLATFORM_AUTHORING_SCHEMA,
  RMT_APP_PLATFORM_AUTHORING_WORKPACKAGE
} = require('./epic18-rmt-app-platform-authoring');

const RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA = 'xtend.epic18.rmt-dom-descriptor-renderer.v1';
const RMT_DOM_DESCRIPTOR_RENDERER_REPORT_SCHEMA = 'xtend.epic18.rmt-dom-descriptor-renderer-report.v1';
const RMT_DOM_DESCRIPTOR_RENDERER_FIXTURE_SCHEMA = 'xtend.epic18.rmt-dom-descriptor-renderer-fixture.v1';
const RMT_DOM_RENDERER_DIAGNOSTIC_SCHEMA = 'xtend.epic18.rmt-dom-renderer-diagnostic.v2';
const NO_MANUAL_HTML_GATE_SCHEMA = 'xtend.epic18.no-manual-html-gate.v1';
const RMT_DOM_DESCRIPTOR_RENDERER_WORKPACKAGE = 'WP-E18-05';
const RMT_DOM_DESCRIPTOR_RENDERER_STATUS = 'accepted-dom-descriptor-renderer';
const RMT_DOM_DESCRIPTOR_RENDERER_TARGET = 'rmt-dom-descriptor-renderer-ready';
const RMT_DOM_DESCRIPTOR_RENDERER_MODULE = 'catalog/epic18-rmt-dom-descriptor-renderer.js';
const RMT_DOM_DESCRIPTOR_RENDERER_RUNTIME = 'xtendrmt/rmt-dom-descriptor-renderer.js';
const RMT_DOM_DESCRIPTOR_RENDERER_TYPES = 'xtendrmt/rmt-dom-descriptor-renderer.d.ts';
const RMT_DOM_DESCRIPTOR_RENDERER_SUITE = 'tests/rmt/rmt_dom_descriptor_renderer_suite.js';
const RMT_DOM_DESCRIPTOR_RENDERER_FIXTURE = 'tests/fixtures/rmt-dom-descriptor-renderer.rmt';
const RMT_DOM_DESCRIPTOR_RENDERER_DOCS = 'docs/en/rmt-dom-descriptor-renderer.md';
const RMT_DOM_DESCRIPTOR_RENDERER_WORKPACKAGE_DOC = 'development/WP-E18-05-Sicheren-DOM-Descriptor-Renderer-und-No-Manual-HTML-Gate-bauen.md';
const RMT_DOM_DESCRIPTOR_RENDERER_BACKLOG = 'development/BACKLOG-EPIC-18-XTendRMT-App-Platform-und-Media-Manager-Vendor-Upstream.md';
const RMT_DOM_DESCRIPTOR_RENDERER_EPIC = 'development/docs-evidence/root/epic18-media-manager-vendor-upstream.md';
const RMT_DOM_DESCRIPTOR_RENDERER_LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-dom-descriptor-renderer --json';
const RMT_DOM_DESCRIPTOR_RENDERER_PACKAGE_SCRIPT = 'npm run test:rmt-dom-descriptor-renderer';
const TRUSTED_DOM_BOUNDARY = 'xtend.rmt.trusted-dom-boundary.explicit';
const NEXT_WORKPACKAGE = 'WP-E18-06';
const NEXT_DECISION = 'component-native-template-primitives';

const REQUIRED_RENDER_OPERATIONS = Object.freeze([
  'document.createElement',
  'document.createTextNode',
  'document.createDocumentFragment',
  'root.replaceChildren',
  'element.replaceChildren',
  'keyed-child-reuse',
  'safe-setAttribute',
  'safe-removeAttribute',
  'safe-property-setter',
  'validated-application-binding-records',
  'trusted-dom-boundary-delegation',
  'diagnostic-source-map'
]);

const FORBIDDEN_NORMAL_UI_SINKS = Object.freeze([
  'root.innerHTML',
  'element.innerHTML',
  'template.innerHTML',
  'outerHTML',
  'insertAdjacentHTML',
  'document.write',
  'createContextualFragment'
]);

const REQUIRED_BOUNDARIES = Object.freeze([
  'structured-dom-descriptor-default',
  'trusted-html-explicit-boundary-only',
  'no-manual-html-normal-ui',
  'no-external-innerhtml-helper-required',
  'diagnostics-map-runtime-errors-to-rmt-source',
  'no-rmt-kernel-import-of-xtend-types'
]);

const REQUIRED_ARTIFACTS = Object.freeze([
  RMT_DOM_DESCRIPTOR_RENDERER_MODULE,
  RMT_DOM_DESCRIPTOR_RENDERER_RUNTIME,
  RMT_DOM_DESCRIPTOR_RENDERER_TYPES,
  RMT_DOM_DESCRIPTOR_RENDERER_SUITE,
  RMT_DOM_DESCRIPTOR_RENDERER_FIXTURE,
  RMT_DOM_DESCRIPTOR_RENDERER_DOCS,
  RMT_DOM_DESCRIPTOR_RENDERER_WORKPACKAGE_DOC
]);

const REQUIRED_DOCS = Object.freeze([
  RMT_DOM_DESCRIPTOR_RENDERER_DOCS,
  RMT_DOM_DESCRIPTOR_RENDERER_WORKPACKAGE_DOC,
  RMT_DOM_DESCRIPTOR_RENDERER_BACKLOG,
  RMT_DOM_DESCRIPTOR_RENDERER_EPIC
]);

function createRmtDomDescriptorRendererPlan(options = {}) {
  return {
    schema: RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA,
    reportSchema: RMT_DOM_DESCRIPTOR_RENDERER_REPORT_SCHEMA,
    fixtureSchema: RMT_DOM_DESCRIPTOR_RENDERER_FIXTURE_SCHEMA,
    diagnosticSchema: RMT_DOM_RENDERER_DIAGNOSTIC_SCHEMA,
    noManualHtmlGateSchema: NO_MANUAL_HTML_GATE_SCHEMA,
    authoringSchema: RMT_APP_PLATFORM_AUTHORING_SCHEMA,
    authoringWorkpackage: RMT_APP_PLATFORM_AUTHORING_WORKPACKAGE,
    workpackage: RMT_DOM_DESCRIPTOR_RENDERER_WORKPACKAGE,
    status: RMT_DOM_DESCRIPTOR_RENDERER_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    targetReadiness: RMT_DOM_DESCRIPTOR_RENDERER_TARGET,
    module: RMT_DOM_DESCRIPTOR_RENDERER_MODULE,
    runtime: RMT_DOM_DESCRIPTOR_RENDERER_RUNTIME,
    types: RMT_DOM_DESCRIPTOR_RENDERER_TYPES,
    suite: RMT_DOM_DESCRIPTOR_RENDERER_SUITE,
    fixture: RMT_DOM_DESCRIPTOR_RENDERER_FIXTURE,
    docs: RMT_DOM_DESCRIPTOR_RENDERER_DOCS,
    workpackageDocument: RMT_DOM_DESCRIPTOR_RENDERER_WORKPACKAGE_DOC,
    localGate: RMT_DOM_DESCRIPTOR_RENDERER_LOCAL_GATE,
    packageScript: RMT_DOM_DESCRIPTOR_RENDERER_PACKAGE_SCRIPT,
    trustedDomBoundary: TRUSTED_DOM_BOUNDARY,
    requiredRenderOperations: REQUIRED_RENDER_OPERATIONS.slice(),
    forbiddenNormalUiSinks: FORBIDDEN_NORMAL_UI_SINKS.slice(),
    boundaries: REQUIRED_BOUNDARIES.slice(),
    artifactPaths: REQUIRED_ARTIFACTS.slice(),
    requiredDocs: REQUIRED_DOCS.slice(),
    model: {
      rendererImplemented: true,
      runtimeImplemented: true,
      structuredDescriptorDefault: true,
      normalUiAllowsManualHtml: false,
      trustedHtmlAllowedOnlyWithExplicitBoundary: true,
      externalInnerHtmlHelperRequired: false,
      diagnosticSourceMappingRequired: true,
      keyedDiffingRequired: true,
      productSurfaceTaxonomyAllowed: false
    },
    kernelBoundary: KERNEL_BOUNDARY,
    nextWorkpackage: NEXT_WORKPACKAGE,
    nextDecision: NEXT_DECISION
  };
}

function validateRmtDomDescriptorRendererPlan(plan = createRmtDomDescriptorRendererPlan()) {
  const errors = [];
  const model = plan && plan.model ? plan.model : {};

  if (!plan || plan.schema !== RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA) errors.push(`schema must be ${RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA}`);
  if (!plan || plan.reportSchema !== RMT_DOM_DESCRIPTOR_RENDERER_REPORT_SCHEMA) errors.push(`reportSchema must be ${RMT_DOM_DESCRIPTOR_RENDERER_REPORT_SCHEMA}`);
  if (!plan || plan.fixtureSchema !== RMT_DOM_DESCRIPTOR_RENDERER_FIXTURE_SCHEMA) errors.push(`fixtureSchema must be ${RMT_DOM_DESCRIPTOR_RENDERER_FIXTURE_SCHEMA}`);
  if (!plan || plan.diagnosticSchema !== RMT_DOM_RENDERER_DIAGNOSTIC_SCHEMA) errors.push(`diagnosticSchema must be ${RMT_DOM_RENDERER_DIAGNOSTIC_SCHEMA}`);
  if (!plan || plan.noManualHtmlGateSchema !== NO_MANUAL_HTML_GATE_SCHEMA) errors.push(`noManualHtmlGateSchema must be ${NO_MANUAL_HTML_GATE_SCHEMA}`);
  if (!plan || plan.authoringSchema !== RMT_APP_PLATFORM_AUTHORING_SCHEMA) errors.push('authoring schema must match WP-E18-04');
  if (!plan || plan.authoringWorkpackage !== RMT_APP_PLATFORM_AUTHORING_WORKPACKAGE) errors.push('authoring workpackage must match WP-E18-04');
  if (!plan || plan.workpackage !== RMT_DOM_DESCRIPTOR_RENDERER_WORKPACKAGE) errors.push(`workpackage must be ${RMT_DOM_DESCRIPTOR_RENDERER_WORKPACKAGE}`);
  if (!plan || plan.status !== RMT_DOM_DESCRIPTOR_RENDERER_STATUS) errors.push(`status must be ${RMT_DOM_DESCRIPTOR_RENDERER_STATUS}`);
  if (!plan || plan.targetReadiness !== RMT_DOM_DESCRIPTOR_RENDERER_TARGET) errors.push(`targetReadiness must be ${RMT_DOM_DESCRIPTOR_RENDERER_TARGET}`);
  if (!plan || plan.trustedDomBoundary !== TRUSTED_DOM_BOUNDARY) errors.push(`trustedDomBoundary must be ${TRUSTED_DOM_BOUNDARY}`);
  REQUIRED_RENDER_OPERATIONS.forEach((operation) => {
    if (!plan || !plan.requiredRenderOperations.includes(operation)) errors.push(`render operation missing: ${operation}`);
  });
  FORBIDDEN_NORMAL_UI_SINKS.forEach((sink) => {
    if (!plan || !plan.forbiddenNormalUiSinks.includes(sink)) errors.push(`forbidden sink missing: ${sink}`);
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
  if (model.rendererImplemented !== true || model.runtimeImplemented !== true) errors.push('WP-E18-05 must implement renderer/runtime');
  if (model.structuredDescriptorDefault !== true) errors.push('structured descriptor must be default');
  if (model.normalUiAllowsManualHtml !== false) errors.push('normal UI must not allow manual HTML');
  if (model.trustedHtmlAllowedOnlyWithExplicitBoundary !== true) errors.push('trusted HTML must require explicit boundary');
  if (model.externalInnerHtmlHelperRequired !== false) errors.push('external innerHTML helper must not be required');
  if (model.diagnosticSourceMappingRequired !== true) errors.push('diagnostic source mapping must be required');
  if (model.keyedDiffingRequired !== true) errors.push('keyed diffing must be required');
  if (model.productSurfaceTaxonomyAllowed !== false) errors.push('product surface taxonomy must stay disallowed');
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  if (!plan || plan.nextWorkpackage !== NEXT_WORKPACKAGE) errors.push(`nextWorkpackage must be ${NEXT_WORKPACKAGE}`);
  if (!plan || plan.nextDecision !== NEXT_DECISION) errors.push(`nextDecision must be ${NEXT_DECISION}`);

  return {
    schema: RMT_DOM_DESCRIPTOR_RENDERER_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors,
    workpackage: RMT_DOM_DESCRIPTOR_RENDERER_WORKPACKAGE,
    checkedAt: 'static-local'
  };
}

function createRmtDomDescriptorRendererReport(options = {}) {
  const plan = options.plan || createRmtDomDescriptorRendererPlan(options);
  const validation = validateRmtDomDescriptorRendererPlan(plan);

  return {
    schema: RMT_DOM_DESCRIPTOR_RENDERER_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors.slice(),
    workpackage: plan.workpackage,
    status: plan.status,
    targetReadiness: plan.targetReadiness,
    renderOperationCount: plan.requiredRenderOperations.length,
    forbiddenSinkCount: plan.forbiddenNormalUiSinks.length,
    boundaryCount: plan.boundaries.length,
    rendererImplemented: plan.model.rendererImplemented,
    runtimeImplemented: plan.model.runtimeImplemented,
    normalUiAllowsManualHtml: plan.model.normalUiAllowsManualHtml,
    trustedDomBoundary: plan.trustedDomBoundary,
    nextWorkpackage: plan.nextWorkpackage,
    nextDecision: plan.nextDecision,
    kernelBoundary: plan.kernelBoundary
  };
}

module.exports = {
  FORBIDDEN_NORMAL_UI_SINKS,
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  NO_MANUAL_HTML_GATE_SCHEMA,
  REQUIRED_ARTIFACTS,
  REQUIRED_BOUNDARIES,
  REQUIRED_DOCS,
  REQUIRED_RENDER_OPERATIONS,
  RMT_DOM_DESCRIPTOR_RENDERER_DOCS,
  RMT_DOM_DESCRIPTOR_RENDERER_FIXTURE,
  RMT_DOM_DESCRIPTOR_RENDERER_FIXTURE_SCHEMA,
  RMT_DOM_DESCRIPTOR_RENDERER_LOCAL_GATE,
  RMT_DOM_DESCRIPTOR_RENDERER_MODULE,
  RMT_DOM_DESCRIPTOR_RENDERER_PACKAGE_SCRIPT,
  RMT_DOM_DESCRIPTOR_RENDERER_REPORT_SCHEMA,
  RMT_DOM_DESCRIPTOR_RENDERER_RUNTIME,
  RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA,
  RMT_DOM_DESCRIPTOR_RENDERER_STATUS,
  RMT_DOM_DESCRIPTOR_RENDERER_SUITE,
  RMT_DOM_DESCRIPTOR_RENDERER_TARGET,
  RMT_DOM_DESCRIPTOR_RENDERER_TYPES,
  RMT_DOM_DESCRIPTOR_RENDERER_WORKPACKAGE,
  RMT_DOM_DESCRIPTOR_RENDERER_WORKPACKAGE_DOC,
  RMT_DOM_RENDERER_DIAGNOSTIC_SCHEMA,
  TRUSTED_DOM_BOUNDARY,
  createRmtDomDescriptorRendererPlan,
  createRmtDomDescriptorRendererReport,
  validateRmtDomDescriptorRendererPlan
};
