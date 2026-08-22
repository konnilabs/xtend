const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-gate-matrix');
const {
  RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA,
  RMT_DOM_DESCRIPTOR_RENDERER_WORKPACKAGE
} = require('./epic18-rmt-dom-descriptor-renderer');

const RMT_COMPONENT_TEMPLATE_PRIMITIVES_SCHEMA = 'xtend.epic18.rmt-component-template-primitives.v1';
const RMT_COMPONENT_TEMPLATE_PRIMITIVES_REPORT_SCHEMA = 'xtend.epic18.rmt-component-template-primitives-report.v1';
const RMT_COMPONENT_TEMPLATE_PRIMITIVES_FIXTURE_SCHEMA = 'xtend.epic18.rmt-component-template-primitives-fixture.v1';
const RMT_COMPONENT_TEMPLATE_PRIMITIVES_WORKPACKAGE = 'WP-E18-06';
const RMT_COMPONENT_TEMPLATE_PRIMITIVES_STATUS = 'accepted-component-template-primitives';
const RMT_COMPONENT_TEMPLATE_PRIMITIVES_TARGET = 'rmt-component-template-primitives-ready';
const RMT_COMPONENT_TEMPLATE_PRIMITIVES_MODULE = 'catalog/epic18-rmt-component-template-primitives.js';
const RMT_COMPONENT_TEMPLATE_PRIMITIVES_RUNTIME = 'xtendrmt/rmt-dom-descriptor-renderer.js';
const RMT_COMPONENT_TEMPLATE_PRIMITIVES_TYPES = 'xtendrmt/rmt-dom-descriptor-renderer.d.ts';
const RMT_COMPONENT_TEMPLATE_PRIMITIVES_SUITE = 'tests/rmt/rmt_component_template_primitives_suite.js';
const RMT_COMPONENT_TEMPLATE_PRIMITIVES_FIXTURE = 'tests/fixtures/rmt-component-template-primitives.rmt';
const RMT_COMPONENT_TEMPLATE_PRIMITIVES_DOCS = 'docs/en/rmt-component-template-primitives.md';
const RMT_COMPONENT_TEMPLATE_PRIMITIVES_WORKPACKAGE_DOC = 'development/WP-E18-06-Component-native-Template-Primitives-fuer-RMT-implementieren.md';
const RMT_COMPONENT_TEMPLATE_PRIMITIVES_BACKLOG = 'development/BACKLOG-EPIC-18-XTendRMT-App-Platform-und-Media-Manager-Vendor-Upstream.md';
const RMT_COMPONENT_TEMPLATE_PRIMITIVES_EPIC = 'development/docs-evidence/root/epic18-media-manager-vendor-upstream.md';
const RMT_COMPONENT_TEMPLATE_PRIMITIVES_LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-component-template-primitives --json';
const RMT_COMPONENT_TEMPLATE_PRIMITIVES_PACKAGE_SCRIPT = 'npm run test:rmt-component-template-primitives';
const NEXT_WORKPACKAGE = 'WP-E18-07';
const NEXT_DECISION = 'typed-state-selectors-state-projection';

const REQUIRED_TEMPLATE_PRIMITIVES = Object.freeze([
  'component',
  'props',
  'attributes',
  'parts',
  'slots',
  'text',
  'when',
  'repeat',
  'empty',
  'fallback',
  'key',
  'ref',
  'class',
  'style-token'
]);

const REQUIRED_COMPONENT_FAMILIES = Object.freeze([
  'icons',
  'tooltips',
  'form-controls',
  'navigation',
  'list',
  'selection',
  'empty-state',
  'error-state',
  'custom-elements'
]);

const REQUIRED_RENDERER_CAPABILITIES = Object.freeze([
  'component-tag-resolution',
  'property-binding',
  'attribute-binding',
  'slot-content-object',
  'css-part-mapping',
  'class-token-mapping',
  'style-token-mapping',
  'ref-capture',
  'conditional-rendering',
  'repeat-keyed-rendering',
  'empty-fallback-rendering',
  'event-listener-binding',
  'no-manual-html'
]);

const REQUIRED_BOUNDARIES = Object.freeze([
  'component-native-over-html-strings',
  'developer-defined-component-families',
  'generic-custom-elements-supported',
  'no-media-manager-product-taxonomy',
  'no-external-innerhtml-helper-required',
  'no-rmt-kernel-import-of-xtend-types'
]);

const REQUIRED_ARTIFACTS = Object.freeze([
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_MODULE,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_SUITE,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_FIXTURE,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_DOCS,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_WORKPACKAGE_DOC,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_RUNTIME,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_TYPES
]);

const REQUIRED_DOCS = Object.freeze([
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_DOCS,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_WORKPACKAGE_DOC,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_BACKLOG,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_EPIC
]);

function createRmtComponentTemplatePrimitivesPlan(options = {}) {
  return {
    schema: RMT_COMPONENT_TEMPLATE_PRIMITIVES_SCHEMA,
    reportSchema: RMT_COMPONENT_TEMPLATE_PRIMITIVES_REPORT_SCHEMA,
    fixtureSchema: RMT_COMPONENT_TEMPLATE_PRIMITIVES_FIXTURE_SCHEMA,
    rendererSchema: RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA,
    rendererWorkpackage: RMT_DOM_DESCRIPTOR_RENDERER_WORKPACKAGE,
    workpackage: RMT_COMPONENT_TEMPLATE_PRIMITIVES_WORKPACKAGE,
    status: RMT_COMPONENT_TEMPLATE_PRIMITIVES_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    targetReadiness: RMT_COMPONENT_TEMPLATE_PRIMITIVES_TARGET,
    module: RMT_COMPONENT_TEMPLATE_PRIMITIVES_MODULE,
    runtime: RMT_COMPONENT_TEMPLATE_PRIMITIVES_RUNTIME,
    types: RMT_COMPONENT_TEMPLATE_PRIMITIVES_TYPES,
    suite: RMT_COMPONENT_TEMPLATE_PRIMITIVES_SUITE,
    fixture: RMT_COMPONENT_TEMPLATE_PRIMITIVES_FIXTURE,
    docs: RMT_COMPONENT_TEMPLATE_PRIMITIVES_DOCS,
    workpackageDocument: RMT_COMPONENT_TEMPLATE_PRIMITIVES_WORKPACKAGE_DOC,
    localGate: RMT_COMPONENT_TEMPLATE_PRIMITIVES_LOCAL_GATE,
    packageScript: RMT_COMPONENT_TEMPLATE_PRIMITIVES_PACKAGE_SCRIPT,
    templatePrimitives: REQUIRED_TEMPLATE_PRIMITIVES.slice(),
    componentFamilies: REQUIRED_COMPONENT_FAMILIES.slice(),
    rendererCapabilities: REQUIRED_RENDERER_CAPABILITIES.slice(),
    boundaries: REQUIRED_BOUNDARIES.slice(),
    artifactPaths: REQUIRED_ARTIFACTS.slice(),
    requiredDocs: REQUIRED_DOCS.slice(),
    model: {
      componentNativeTemplates: true,
      htmlStringRendererRequired: false,
      customElementTagsAllowed: true,
      genericComponentFamiliesRequired: true,
      listSelectionEmptyErrorStatesRequired: true,
      productSurfaceTaxonomyAllowed: false,
      rendererReusedFromWp05: true
    },
    kernelBoundary: KERNEL_BOUNDARY,
    nextWorkpackage: NEXT_WORKPACKAGE,
    nextDecision: NEXT_DECISION
  };
}

function validateRmtComponentTemplatePrimitivesPlan(plan = createRmtComponentTemplatePrimitivesPlan()) {
  const errors = [];
  const model = plan && plan.model ? plan.model : {};

  if (!plan || plan.schema !== RMT_COMPONENT_TEMPLATE_PRIMITIVES_SCHEMA) errors.push(`schema must be ${RMT_COMPONENT_TEMPLATE_PRIMITIVES_SCHEMA}`);
  if (!plan || plan.reportSchema !== RMT_COMPONENT_TEMPLATE_PRIMITIVES_REPORT_SCHEMA) errors.push(`reportSchema must be ${RMT_COMPONENT_TEMPLATE_PRIMITIVES_REPORT_SCHEMA}`);
  if (!plan || plan.fixtureSchema !== RMT_COMPONENT_TEMPLATE_PRIMITIVES_FIXTURE_SCHEMA) errors.push(`fixtureSchema must be ${RMT_COMPONENT_TEMPLATE_PRIMITIVES_FIXTURE_SCHEMA}`);
  if (!plan || plan.rendererSchema !== RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA) errors.push('renderer schema must come from WP-E18-05');
  if (!plan || plan.rendererWorkpackage !== RMT_DOM_DESCRIPTOR_RENDERER_WORKPACKAGE) errors.push('renderer workpackage must be WP-E18-05');
  if (!plan || plan.workpackage !== RMT_COMPONENT_TEMPLATE_PRIMITIVES_WORKPACKAGE) errors.push(`workpackage must be ${RMT_COMPONENT_TEMPLATE_PRIMITIVES_WORKPACKAGE}`);
  if (!plan || plan.status !== RMT_COMPONENT_TEMPLATE_PRIMITIVES_STATUS) errors.push(`status must be ${RMT_COMPONENT_TEMPLATE_PRIMITIVES_STATUS}`);
  if (!plan || plan.targetReadiness !== RMT_COMPONENT_TEMPLATE_PRIMITIVES_TARGET) errors.push(`targetReadiness must be ${RMT_COMPONENT_TEMPLATE_PRIMITIVES_TARGET}`);
  REQUIRED_TEMPLATE_PRIMITIVES.forEach((primitive) => {
    if (!plan || !plan.templatePrimitives.includes(primitive)) errors.push(`template primitive missing: ${primitive}`);
  });
  REQUIRED_COMPONENT_FAMILIES.forEach((family) => {
    if (!plan || !plan.componentFamilies.includes(family)) errors.push(`component family missing: ${family}`);
  });
  REQUIRED_RENDERER_CAPABILITIES.forEach((capability) => {
    if (!plan || !plan.rendererCapabilities.includes(capability)) errors.push(`renderer capability missing: ${capability}`);
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
  if (model.componentNativeTemplates !== true) errors.push('component native templates must be enabled');
  if (model.htmlStringRendererRequired !== false) errors.push('HTML string renderer must not be required');
  if (model.customElementTagsAllowed !== true) errors.push('custom elements must be supported');
  if (model.genericComponentFamiliesRequired !== true) errors.push('generic component families must be required');
  if (model.listSelectionEmptyErrorStatesRequired !== true) errors.push('list, selection, empty and error states must be required');
  if (model.productSurfaceTaxonomyAllowed !== false) errors.push('product surface taxonomy must stay disallowed');
  if (model.rendererReusedFromWp05 !== true) errors.push('WP-E18-06 must build on WP-E18-05 renderer');
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  if (!plan || plan.nextWorkpackage !== NEXT_WORKPACKAGE) errors.push(`nextWorkpackage must be ${NEXT_WORKPACKAGE}`);
  if (!plan || plan.nextDecision !== NEXT_DECISION) errors.push(`nextDecision must be ${NEXT_DECISION}`);

  return {
    schema: RMT_COMPONENT_TEMPLATE_PRIMITIVES_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors,
    workpackage: RMT_COMPONENT_TEMPLATE_PRIMITIVES_WORKPACKAGE,
    checkedAt: 'static-local'
  };
}

function createRmtComponentTemplatePrimitivesReport(options = {}) {
  const plan = options.plan || createRmtComponentTemplatePrimitivesPlan(options);
  const validation = validateRmtComponentTemplatePrimitivesPlan(plan);

  return {
    schema: RMT_COMPONENT_TEMPLATE_PRIMITIVES_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors.slice(),
    workpackage: plan.workpackage,
    status: plan.status,
    targetReadiness: plan.targetReadiness,
    templatePrimitiveCount: plan.templatePrimitives.length,
    componentFamilyCount: plan.componentFamilies.length,
    rendererCapabilityCount: plan.rendererCapabilities.length,
    boundaryCount: plan.boundaries.length,
    htmlStringRendererRequired: plan.model.htmlStringRendererRequired,
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
  REQUIRED_COMPONENT_FAMILIES,
  REQUIRED_DOCS,
  REQUIRED_RENDERER_CAPABILITIES,
  REQUIRED_TEMPLATE_PRIMITIVES,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_DOCS,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_FIXTURE,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_FIXTURE_SCHEMA,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_LOCAL_GATE,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_MODULE,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_PACKAGE_SCRIPT,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_REPORT_SCHEMA,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_RUNTIME,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_SCHEMA,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_STATUS,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_SUITE,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_TARGET,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_TYPES,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_WORKPACKAGE,
  RMT_COMPONENT_TEMPLATE_PRIMITIVES_WORKPACKAGE_DOC,
  createRmtComponentTemplatePrimitivesPlan,
  createRmtComponentTemplatePrimitivesReport,
  validateRmtComponentTemplatePrimitivesPlan
};
