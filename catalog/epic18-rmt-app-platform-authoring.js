const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-gate-matrix');

const RMT_APP_PLATFORM_AUTHORING_SCHEMA = 'xtend.epic18.rmt-app-platform-authoring.v1';
const RMT_APP_PLATFORM_AUTHORING_REPORT_SCHEMA = 'xtend.epic18.rmt-app-platform-authoring-report.v1';
const RMT_APP_PLATFORM_FIXTURE_SCHEMA = 'xtend.epic18.rmt-app-platform-authoring-fixture.v1';
const RMT_APP_PLATFORM_AUTHORING_WORKPACKAGE = 'WP-E18-04';
const RMT_APP_PLATFORM_AUTHORING_STATUS = 'accepted-authoring-model';
const RMT_APP_PLATFORM_AUTHORING_TARGET = 'rmt-app-platform-authoring-ready';
const RMT_APP_PLATFORM_AUTHORING_MODULE = 'catalog/epic18-rmt-app-platform-authoring.js';
const RMT_APP_PLATFORM_AUTHORING_SUITE = 'tests/rmt/rmt_app_platform_authoring_suite.js';
const RMT_APP_PLATFORM_AUTHORING_FIXTURE = 'tests/fixtures/rmt-app-platform-authoring.rmt';
const RMT_APP_PLATFORM_AUTHORING_DOCS = 'docs/rmt-app-platform-authoring.md';
const RMT_APP_PLATFORM_AUTHORING_WORKPACKAGE_DOC = 'development/WP-E18-04-RMT-App-Platform-Authoring-Model-erweitern.md';
const RMT_APP_PLATFORM_AUTHORING_BACKLOG = 'development/BACKLOG-EPIC-18-XTendRMT-App-Platform-und-Media-Manager-Vendor-Upstream.md';
const RMT_APP_PLATFORM_AUTHORING_EPIC = 'docs/epic18-media-manager-vendor-upstream.md';
const RMT_APP_PLATFORM_AUTHORING_LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-app-platform-authoring --json';
const RMT_APP_PLATFORM_AUTHORING_PACKAGE_SCRIPT = 'npm run test:rmt-app-platform-authoring';
const NEXT_WORKPACKAGE = 'WP-E18-05';
const NEXT_DECISION = 'dom-descriptor-renderer-and-no-manual-html-gate';

const REQUIRED_PRIMITIVES = Object.freeze([
  'app',
  'route',
  'surface',
  'slot',
  'template',
  'component',
  'state',
  'selector',
  'derive',
  'repeat',
  'when',
  'bind',
  'action',
  'effect',
  'datasource',
  'resource',
  'event'
]);

const REQUIRED_TEMPLATE_PRIMITIVES = Object.freeze([
  'component',
  'text',
  'slot',
  'repeat',
  'when',
  'bind',
  'event',
  'empty',
  'fallback'
]);

const REQUIRED_ADAPTERS = Object.freeze([
  'xtend.component',
  'xtend.router',
  'rmt.state',
  'rmt.datasource',
  'rmt.resource',
  'rmt.action',
  'rmt.event'
]);

const REQUIRED_COMPONENT_ADAPTER_CAPABILITIES = Object.freeze([
  'component.tag',
  'component.attributes',
  'component.properties',
  'component.slots',
  'component.parts',
  'component.events',
  'component.methods',
  'component.state-bindings',
  'component.a11y',
  'component.theme-tokens'
]);

const REQUIRED_SCHEDULES = Object.freeze([
  'app.shell.render',
  'route.visible.render',
  'surface.visible.mount',
  'component.visible.mount',
  'component.idle.hydrate',
  'state.derive.evaluate',
  'action.user-blocking.run',
  'effect.background.run',
  'datasource.background.load',
  'resource.idle.prepare',
  'event.user-blocking.dispatch',
  'diagnostics.snapshot'
]);

const REQUIRED_LANES = Object.freeze([
  'user-blocking',
  'visible',
  'transition',
  'idle',
  'background',
  'diagnostics'
]);

const REQUIRED_BOUNDARIES = Object.freeze([
  'no-media-manager-product-surface-clone',
  'no-product-record-contract-required',
  'structured-ui-before-trusted-html',
  'trusted-html-explicit-boundary-only',
  'no-rmt-kernel-import-of-xtend-types',
  'no-external-innerhtml-helper-required'
]);

const REQUIRED_DOCS = Object.freeze([
  RMT_APP_PLATFORM_AUTHORING_DOCS,
  RMT_APP_PLATFORM_AUTHORING_WORKPACKAGE_DOC,
  RMT_APP_PLATFORM_AUTHORING_BACKLOG,
  RMT_APP_PLATFORM_AUTHORING_EPIC
]);

const REQUIRED_ARTIFACTS = Object.freeze([
  RMT_APP_PLATFORM_AUTHORING_MODULE,
  RMT_APP_PLATFORM_AUTHORING_SUITE,
  RMT_APP_PLATFORM_AUTHORING_FIXTURE,
  RMT_APP_PLATFORM_AUTHORING_DOCS,
  RMT_APP_PLATFORM_AUTHORING_WORKPACKAGE_DOC
]);

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function createRmtAppPlatformAuthoringPlan(options = {}) {
  return {
    schema: RMT_APP_PLATFORM_AUTHORING_SCHEMA,
    reportSchema: RMT_APP_PLATFORM_AUTHORING_REPORT_SCHEMA,
    fixtureSchema: RMT_APP_PLATFORM_FIXTURE_SCHEMA,
    workpackage: RMT_APP_PLATFORM_AUTHORING_WORKPACKAGE,
    status: RMT_APP_PLATFORM_AUTHORING_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    targetReadiness: RMT_APP_PLATFORM_AUTHORING_TARGET,
    module: RMT_APP_PLATFORM_AUTHORING_MODULE,
    suite: RMT_APP_PLATFORM_AUTHORING_SUITE,
    fixture: RMT_APP_PLATFORM_AUTHORING_FIXTURE,
    docs: RMT_APP_PLATFORM_AUTHORING_DOCS,
    workpackageDocument: RMT_APP_PLATFORM_AUTHORING_WORKPACKAGE_DOC,
    localGate: RMT_APP_PLATFORM_AUTHORING_LOCAL_GATE,
    packageScript: RMT_APP_PLATFORM_AUTHORING_PACKAGE_SCRIPT,
    requiredPrimitives: REQUIRED_PRIMITIVES.slice(),
    templatePrimitives: REQUIRED_TEMPLATE_PRIMITIVES.slice(),
    requiredAdapters: REQUIRED_ADAPTERS.slice(),
    componentAdapterCapabilities: REQUIRED_COMPONENT_ADAPTER_CAPABILITIES.slice(),
    requiredSchedules: REQUIRED_SCHEDULES.slice(),
    scheduleLanes: REQUIRED_LANES.slice(),
    boundaries: REQUIRED_BOUNDARIES.slice(),
    requiredDocs: REQUIRED_DOCS.slice(),
    artifactPaths: REQUIRED_ARTIFACTS.slice(),
    model: {
      authoringScope: 'generic-app-platform',
      appDomainPolicy: 'developer-defined-domain-contracts',
      surfacePolicy: 'generic-keyed-surface-graph',
      componentPolicy: 'custom-element-capability-catalog',
      templatePolicy: 'structured-dom-descriptor-first',
      trustedHtmlPolicy: 'explicit-boundary-resource-only',
      statePolicy: 'typed-state-selectors-derived-values',
      actionPolicy: 'declarative-actions-effects-datasources-resources',
      eventPolicy: 'scoped-event-routing-no-implicit-global-bus',
      rendererImplemented: false,
      runtimeImplemented: false,
      productSurfaceTaxonomyAllowed: false,
      mediaManagerRecordRequired: false,
      innerHtmlHelperRequired: false
    },
    nextWorkpackage: NEXT_WORKPACKAGE,
    nextDecision: NEXT_DECISION,
    kernelBoundary: KERNEL_BOUNDARY
  };
}

function validateRmtAppPlatformAuthoringPlan(plan = createRmtAppPlatformAuthoringPlan()) {
  const errors = [];

  if (!plan || plan.schema !== RMT_APP_PLATFORM_AUTHORING_SCHEMA) errors.push(`schema must be ${RMT_APP_PLATFORM_AUTHORING_SCHEMA}`);
  if (!plan || plan.reportSchema !== RMT_APP_PLATFORM_AUTHORING_REPORT_SCHEMA) errors.push(`reportSchema must be ${RMT_APP_PLATFORM_AUTHORING_REPORT_SCHEMA}`);
  if (!plan || plan.fixtureSchema !== RMT_APP_PLATFORM_FIXTURE_SCHEMA) errors.push(`fixtureSchema must be ${RMT_APP_PLATFORM_FIXTURE_SCHEMA}`);
  if (!plan || plan.workpackage !== RMT_APP_PLATFORM_AUTHORING_WORKPACKAGE) errors.push(`workpackage must be ${RMT_APP_PLATFORM_AUTHORING_WORKPACKAGE}`);
  if (!plan || plan.status !== RMT_APP_PLATFORM_AUTHORING_STATUS) errors.push(`status must be ${RMT_APP_PLATFORM_AUTHORING_STATUS}`);
  if (!plan || plan.targetReadiness !== RMT_APP_PLATFORM_AUTHORING_TARGET) errors.push(`targetReadiness must be ${RMT_APP_PLATFORM_AUTHORING_TARGET}`);
  REQUIRED_PRIMITIVES.forEach((primitive) => {
    if (!plan || !plan.requiredPrimitives.includes(primitive)) errors.push(`primitive missing: ${primitive}`);
  });
  REQUIRED_TEMPLATE_PRIMITIVES.forEach((primitive) => {
    if (!plan || !plan.templatePrimitives.includes(primitive)) errors.push(`template primitive missing: ${primitive}`);
  });
  REQUIRED_ADAPTERS.forEach((adapter) => {
    if (!plan || !plan.requiredAdapters.includes(adapter)) errors.push(`adapter missing: ${adapter}`);
  });
  REQUIRED_COMPONENT_ADAPTER_CAPABILITIES.forEach((capability) => {
    if (!plan || !plan.componentAdapterCapabilities.includes(capability)) errors.push(`component adapter capability missing: ${capability}`);
  });
  REQUIRED_SCHEDULES.forEach((schedule) => {
    if (!plan || !plan.requiredSchedules.includes(schedule)) errors.push(`schedule missing: ${schedule}`);
  });
  REQUIRED_LANES.forEach((lane) => {
    if (!plan || !plan.scheduleLanes.includes(lane)) errors.push(`lane missing: ${lane}`);
  });
  REQUIRED_BOUNDARIES.forEach((boundary) => {
    if (!plan || !plan.boundaries.includes(boundary)) errors.push(`boundary missing: ${boundary}`);
  });
  REQUIRED_DOCS.forEach((docPath) => {
    if (!plan || !plan.requiredDocs.includes(docPath)) errors.push(`doc missing: ${docPath}`);
  });
  REQUIRED_ARTIFACTS.forEach((artifactPath) => {
    if (!plan || !plan.artifactPaths.includes(artifactPath)) errors.push(`artifact missing: ${artifactPath}`);
  });
  if (!plan || plan.model.authoringScope !== 'generic-app-platform') errors.push('authoring scope must be generic app platform');
  if (!plan || plan.model.templatePolicy !== 'structured-dom-descriptor-first') errors.push('template policy must prefer structured DOM descriptors');
  if (!plan || plan.model.trustedHtmlPolicy !== 'explicit-boundary-resource-only') errors.push('trusted HTML must stay an explicit resource boundary');
  if (!plan || plan.model.rendererImplemented !== false) errors.push('WP-E18-04 must not claim renderer implementation');
  if (!plan || plan.model.runtimeImplemented !== false) errors.push('WP-E18-04 must not claim runtime implementation');
  if (!plan || plan.model.productSurfaceTaxonomyAllowed !== false) errors.push('product surface taxonomy must stay disallowed');
  if (!plan || plan.model.mediaManagerRecordRequired !== false) errors.push('Media Manager record contracts must not be required');
  if (!plan || plan.model.innerHtmlHelperRequired !== false) errors.push('external innerHTML helpers must not be required');
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  if (!plan || plan.nextWorkpackage !== NEXT_WORKPACKAGE) errors.push(`nextWorkpackage must be ${NEXT_WORKPACKAGE}`);
  if (!plan || plan.nextDecision !== NEXT_DECISION) errors.push(`nextDecision must be ${NEXT_DECISION}`);

  return {
    schema: RMT_APP_PLATFORM_AUTHORING_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors,
    workpackage: RMT_APP_PLATFORM_AUTHORING_WORKPACKAGE,
    checkedAt: 'static-local'
  };
}

function createRmtAppPlatformAuthoringReport(options = {}) {
  const plan = options.plan || createRmtAppPlatformAuthoringPlan(options);
  const validation = validateRmtAppPlatformAuthoringPlan(plan);

  return {
    schema: RMT_APP_PLATFORM_AUTHORING_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors.slice(),
    workpackage: plan.workpackage,
    status: plan.status,
    targetReadiness: plan.targetReadiness,
    primitiveCount: plan.requiredPrimitives.length,
    templatePrimitiveCount: plan.templatePrimitives.length,
    adapterCount: plan.requiredAdapters.length,
    componentAdapterCapabilityCount: plan.componentAdapterCapabilities.length,
    scheduleCount: plan.requiredSchedules.length,
    boundaryCount: plan.boundaries.length,
    rendererImplemented: plan.model.rendererImplemented,
    runtimeImplemented: plan.model.runtimeImplemented,
    productSurfaceTaxonomyAllowed: plan.model.productSurfaceTaxonomyAllowed,
    mediaManagerRecordRequired: plan.model.mediaManagerRecordRequired,
    innerHtmlHelperRequired: plan.model.innerHtmlHelperRequired,
    nextWorkpackage: plan.nextWorkpackage,
    nextDecision: plan.nextDecision,
    kernelBoundary: plan.kernelBoundary
  };
}

function collectFixturePrimitiveCoverage(fixture = {}) {
  const coverage = [];
  if (fixture.app) coverage.push('app');
  if (Array.isArray(fixture.routes) && fixture.routes.length) coverage.push('route');
  if (Array.isArray(fixture.surfaces) && fixture.surfaces.length) coverage.push('surface');
  if (Array.isArray(fixture.slots) && fixture.slots.length) coverage.push('slot');
  if (Array.isArray(fixture.templates) && fixture.templates.length) coverage.push('template');
  if (Array.isArray(fixture.components) && fixture.components.length) coverage.push('component');
  if (Array.isArray(fixture.state) && fixture.state.length) coverage.push('state');
  if (Array.isArray(fixture.selectors) && fixture.selectors.length) coverage.push('selector');
  if (Array.isArray(fixture.derive) && fixture.derive.length) coverage.push('derive');
  if (Array.isArray(fixture.bind) && fixture.bind.length) coverage.push('bind');
  if (Array.isArray(fixture.actions) && fixture.actions.length) coverage.push('action');
  if (Array.isArray(fixture.effects) && fixture.effects.length) coverage.push('effect');
  if (Array.isArray(fixture.datasources) && fixture.datasources.length) coverage.push('datasource');
  if (Array.isArray(fixture.resources) && fixture.resources.length) coverage.push('resource');
  if (Array.isArray(fixture.events) && fixture.events.length) coverage.push('event');

  (fixture.templates || []).forEach((template) => {
    (template.uses || []).forEach((primitive) => coverage.push(primitive));
  });

  return unique(coverage);
}

module.exports = {
  KERNEL_BOUNDARY,
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  REQUIRED_ADAPTERS,
  REQUIRED_ARTIFACTS,
  REQUIRED_BOUNDARIES,
  REQUIRED_COMPONENT_ADAPTER_CAPABILITIES,
  REQUIRED_DOCS,
  REQUIRED_LANES,
  REQUIRED_PRIMITIVES,
  REQUIRED_SCHEDULES,
  REQUIRED_TEMPLATE_PRIMITIVES,
  RMT_APP_PLATFORM_AUTHORING_BACKLOG,
  RMT_APP_PLATFORM_AUTHORING_DOCS,
  RMT_APP_PLATFORM_AUTHORING_EPIC,
  RMT_APP_PLATFORM_AUTHORING_FIXTURE,
  RMT_APP_PLATFORM_AUTHORING_LOCAL_GATE,
  RMT_APP_PLATFORM_AUTHORING_MODULE,
  RMT_APP_PLATFORM_AUTHORING_PACKAGE_SCRIPT,
  RMT_APP_PLATFORM_AUTHORING_REPORT_SCHEMA,
  RMT_APP_PLATFORM_AUTHORING_SCHEMA,
  RMT_APP_PLATFORM_AUTHORING_STATUS,
  RMT_APP_PLATFORM_AUTHORING_SUITE,
  RMT_APP_PLATFORM_AUTHORING_TARGET,
  RMT_APP_PLATFORM_AUTHORING_WORKPACKAGE,
  RMT_APP_PLATFORM_AUTHORING_WORKPACKAGE_DOC,
  RMT_APP_PLATFORM_FIXTURE_SCHEMA,
  collectFixturePrimitiveCoverage,
  createRmtAppPlatformAuthoringPlan,
  createRmtAppPlatformAuthoringReport,
  validateRmtAppPlatformAuthoringPlan
};
