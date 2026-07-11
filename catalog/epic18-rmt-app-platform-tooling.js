const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-gate-matrix');
const {
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_SCHEMA,
  RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_WORKPACKAGE
} = require('./epic18-rmt-surface-resource-graph-runtime');

const RMT_APP_PLATFORM_TOOLING_SCHEMA = 'xtend.epic18.rmt-app-platform-tooling.v1';
const RMT_APP_PLATFORM_TOOLING_REPORT_SCHEMA = 'xtend.epic18.rmt-app-platform-tooling-report.v1';
const RMT_APP_PLATFORM_TOOLING_FIXTURE_SCHEMA = 'xtend.epic18.rmt-app-platform-tooling-fixture.v1';
const RMT_APP_PLATFORM_SCAFFOLD_SCHEMA = 'xtend.epic18.rmt-app-platform-scaffold.v1';
const RMT_APP_PLATFORM_SOURCE_MAP_SCHEMA = 'xtend.epic18.rmt-app-platform-source-map.v1';
const RMT_APP_PLATFORM_TOOLING_WORKPACKAGE = 'WP-E18-11';
const RMT_APP_PLATFORM_TOOLING_STATUS = 'accepted-rmt-app-platform-scaffold-linter-lsp-diagnostics';
const RMT_APP_PLATFORM_TOOLING_TARGET = 'rmt-app-platform-authoring-tooling-ready';
const RMT_APP_PLATFORM_TOOLING_MODULE = 'catalog/epic18-rmt-app-platform-tooling.js';
const RMT_APP_PLATFORM_TOOLING_RUNTIME = 'tools/rmt-language/app-platform-tooling.js';
const RMT_APP_PLATFORM_TOOLING_TYPES = 'tools/rmt-language/app-platform-tooling.d.ts';
const RMT_APP_PLATFORM_TOOLING_GENERATOR = 'xtend-builder/generators/rmt-app-platform.js';
const RMT_APP_PLATFORM_TOOLING_SUITE = 'tests/rmt-language/rmt_app_platform_tooling_suite.js';
const RMT_APP_PLATFORM_TOOLING_FIXTURE = 'tests/fixtures/rmt-app-platform-tooling.rmt';
const RMT_APP_PLATFORM_TOOLING_DOCS = 'docs/en/rmt-app-platform-tooling.md';
const RMT_APP_PLATFORM_TOOLING_WORKPACKAGE_DOC = 'development/WP-E18-11-Scaffold-Linter-LSP-und-Diagnostics-fuer-RMT-Apps-erweitern.md';
const RMT_APP_PLATFORM_TOOLING_BACKLOG = 'development/BACKLOG-EPIC-18-XTendRMT-App-Platform-und-Media-Manager-Vendor-Upstream.md';
const RMT_APP_PLATFORM_TOOLING_EPIC = 'development/docs-evidence/root/epic18-media-manager-vendor-upstream.md';
const RMT_APP_PLATFORM_TOOLING_LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-app-platform-tooling --json';
const RMT_APP_PLATFORM_TOOLING_PACKAGE_SCRIPT = 'npm run test:rmt-app-platform-tooling';
const NEXT_WORKPACKAGE = 'WP-E18-12';
const NEXT_DECISION = 'generic-rmt-app-platform-fixture';

const REQUIRED_TOOLING_CAPABILITIES = Object.freeze([
  'scaffold-pipeline-for-rmt-app-sources',
  'no-manual-shell-html-sink-diagnostics',
  'unsafe-html-boundary-diagnostics',
  'unkeyed-repeat-diagnostics',
  'untyped-event-diagnostics',
  'resource-ownership-diagnostics',
  'portal-resource-reference-diagnostics',
  'app-platform-completions',
  'app-platform-hover',
  'source-map-build-report'
]);

const REQUIRED_DIAGNOSTIC_CODES = Object.freeze([
  'rmt.app.no-manual-shell.html-sink',
  'rmt.app.unsafe-html.boundary-missing',
  'rmt.app.repeat.key.missing',
  'rmt.app.event.payload-contract.missing',
  'rmt.app.resource.ownership.missing',
  'rmt.app.resource.unresolved',
  'rmt.app.portal.unresolved',
  'rmt.app.surface.source.unresolved'
]);

const REQUIRED_COMPLETION_CONTEXTS = Object.freeze([
  'portal-ids',
  'portal-policies',
  'overlay-kinds',
  'resource-kinds',
  'resource-ids',
  'event-kinds',
  'surface-states'
]);

const REQUIRED_BOUNDARIES = Object.freeze([
  'no-rmt-kernel-import-of-xtend-types',
  'diagnostics-before-runtime',
  'scaffold-output-owned-by-write-plan',
  'no-product-bound-surface-list',
  'normal-ui-no-html-string-renderer',
  'lsp-surface-is-tooling-only'
]);

const REQUIRED_ARTIFACTS = Object.freeze([
  RMT_APP_PLATFORM_TOOLING_MODULE,
  RMT_APP_PLATFORM_TOOLING_RUNTIME,
  RMT_APP_PLATFORM_TOOLING_TYPES,
  RMT_APP_PLATFORM_TOOLING_GENERATOR,
  RMT_APP_PLATFORM_TOOLING_SUITE,
  RMT_APP_PLATFORM_TOOLING_FIXTURE,
  RMT_APP_PLATFORM_TOOLING_DOCS,
  RMT_APP_PLATFORM_TOOLING_WORKPACKAGE_DOC
]);

const REQUIRED_DOCS = Object.freeze([
  RMT_APP_PLATFORM_TOOLING_DOCS,
  RMT_APP_PLATFORM_TOOLING_WORKPACKAGE_DOC,
  RMT_APP_PLATFORM_TOOLING_BACKLOG,
  RMT_APP_PLATFORM_TOOLING_EPIC
]);

function createRmtAppPlatformToolingPlan(options = {}) {
  return {
    schema: RMT_APP_PLATFORM_TOOLING_SCHEMA,
    reportSchema: RMT_APP_PLATFORM_TOOLING_REPORT_SCHEMA,
    fixtureSchema: RMT_APP_PLATFORM_TOOLING_FIXTURE_SCHEMA,
    scaffoldSchema: RMT_APP_PLATFORM_SCAFFOLD_SCHEMA,
    sourceMapSchema: RMT_APP_PLATFORM_SOURCE_MAP_SCHEMA,
    surfaceResourceGraphRuntimeSchema: RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_SCHEMA,
    surfaceResourceGraphRuntimeWorkpackage: RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_WORKPACKAGE,
    workpackage: RMT_APP_PLATFORM_TOOLING_WORKPACKAGE,
    status: RMT_APP_PLATFORM_TOOLING_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    targetReadiness: RMT_APP_PLATFORM_TOOLING_TARGET,
    module: RMT_APP_PLATFORM_TOOLING_MODULE,
    runtime: RMT_APP_PLATFORM_TOOLING_RUNTIME,
    types: RMT_APP_PLATFORM_TOOLING_TYPES,
    generator: RMT_APP_PLATFORM_TOOLING_GENERATOR,
    suite: RMT_APP_PLATFORM_TOOLING_SUITE,
    fixture: RMT_APP_PLATFORM_TOOLING_FIXTURE,
    docs: RMT_APP_PLATFORM_TOOLING_DOCS,
    workpackageDocument: RMT_APP_PLATFORM_TOOLING_WORKPACKAGE_DOC,
    localGate: RMT_APP_PLATFORM_TOOLING_LOCAL_GATE,
    packageScript: RMT_APP_PLATFORM_TOOLING_PACKAGE_SCRIPT,
    capabilities: REQUIRED_TOOLING_CAPABILITIES.slice(),
    diagnosticCodes: REQUIRED_DIAGNOSTIC_CODES.slice(),
    completionContexts: REQUIRED_COMPLETION_CONTEXTS.slice(),
    boundaries: REQUIRED_BOUNDARIES.slice(),
    artifactPaths: REQUIRED_ARTIFACTS.slice(),
    requiredDocs: REQUIRED_DOCS.slice(),
    model: {
      scaffoldBuildsDiagnosticsAndSourceMaps: true,
      linterBlocksUnsafeAppShells: true,
      lspExposesAppPlatformPrimitives: true,
      sourceMapLinksSurfaceOverlayResourceEvents: true,
      productSurfaceTaxonomyAllowed: false,
      productRegistryRepaintRequired: false,
      htmlStringRendererRequired: false
    },
    kernelBoundary: KERNEL_BOUNDARY,
    nextWorkpackage: NEXT_WORKPACKAGE,
    nextDecision: NEXT_DECISION
  };
}

function validateRmtAppPlatformToolingPlan(plan = createRmtAppPlatformToolingPlan()) {
  const errors = [];
  const model = plan && plan.model ? plan.model : {};

  if (!plan || plan.schema !== RMT_APP_PLATFORM_TOOLING_SCHEMA) errors.push(`schema must be ${RMT_APP_PLATFORM_TOOLING_SCHEMA}`);
  if (!plan || plan.reportSchema !== RMT_APP_PLATFORM_TOOLING_REPORT_SCHEMA) errors.push(`reportSchema must be ${RMT_APP_PLATFORM_TOOLING_REPORT_SCHEMA}`);
  if (!plan || plan.fixtureSchema !== RMT_APP_PLATFORM_TOOLING_FIXTURE_SCHEMA) errors.push(`fixtureSchema must be ${RMT_APP_PLATFORM_TOOLING_FIXTURE_SCHEMA}`);
  if (!plan || plan.scaffoldSchema !== RMT_APP_PLATFORM_SCAFFOLD_SCHEMA) errors.push(`scaffoldSchema must be ${RMT_APP_PLATFORM_SCAFFOLD_SCHEMA}`);
  if (!plan || plan.sourceMapSchema !== RMT_APP_PLATFORM_SOURCE_MAP_SCHEMA) errors.push(`sourceMapSchema must be ${RMT_APP_PLATFORM_SOURCE_MAP_SCHEMA}`);
  if (!plan || plan.surfaceResourceGraphRuntimeSchema !== RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_SCHEMA) errors.push('WP-E18-11 must build on WP-E18-10');
  if (!plan || plan.surfaceResourceGraphRuntimeWorkpackage !== RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_WORKPACKAGE) errors.push('surface graph runtime workpackage must be WP-E18-10');
  if (!plan || plan.workpackage !== RMT_APP_PLATFORM_TOOLING_WORKPACKAGE) errors.push(`workpackage must be ${RMT_APP_PLATFORM_TOOLING_WORKPACKAGE}`);
  if (!plan || plan.status !== RMT_APP_PLATFORM_TOOLING_STATUS) errors.push(`status must be ${RMT_APP_PLATFORM_TOOLING_STATUS}`);
  if (!plan || plan.targetReadiness !== RMT_APP_PLATFORM_TOOLING_TARGET) errors.push(`targetReadiness must be ${RMT_APP_PLATFORM_TOOLING_TARGET}`);
  REQUIRED_TOOLING_CAPABILITIES.forEach((capability) => {
    if (!plan || !plan.capabilities.includes(capability)) errors.push(`capability missing: ${capability}`);
  });
  REQUIRED_DIAGNOSTIC_CODES.forEach((code) => {
    if (!plan || !plan.diagnosticCodes.includes(code)) errors.push(`diagnostic code missing: ${code}`);
  });
  REQUIRED_COMPLETION_CONTEXTS.forEach((context) => {
    if (!plan || !plan.completionContexts.includes(context)) errors.push(`completion context missing: ${context}`);
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
  if (model.scaffoldBuildsDiagnosticsAndSourceMaps !== true) errors.push('scaffold must build diagnostics and source maps');
  if (model.linterBlocksUnsafeAppShells !== true) errors.push('linter must block unsafe app shells');
  if (model.lspExposesAppPlatformPrimitives !== true) errors.push('LSP must expose App Platform primitives');
  if (model.sourceMapLinksSurfaceOverlayResourceEvents !== true) errors.push('source map must link surface, overlay, resource and event records');
  if (model.productSurfaceTaxonomyAllowed !== false) errors.push('product surface taxonomy must stay disallowed');
  if (model.productRegistryRepaintRequired !== false) errors.push('product registry repaint must not be required');
  if (model.htmlStringRendererRequired !== false) errors.push('html string renderer must not be required');
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  if (!plan || plan.nextWorkpackage !== NEXT_WORKPACKAGE) errors.push(`nextWorkpackage must be ${NEXT_WORKPACKAGE}`);
  if (!plan || plan.nextDecision !== NEXT_DECISION) errors.push(`nextDecision must be ${NEXT_DECISION}`);

  return {
    schema: RMT_APP_PLATFORM_TOOLING_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors,
    workpackage: RMT_APP_PLATFORM_TOOLING_WORKPACKAGE,
    checkedAt: 'static-local'
  };
}

function createRmtAppPlatformToolingReport(options = {}) {
  const plan = options.plan || createRmtAppPlatformToolingPlan(options);
  const validation = validateRmtAppPlatformToolingPlan(plan);

  return {
    schema: RMT_APP_PLATFORM_TOOLING_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors.slice(),
    workpackage: plan.workpackage,
    status: plan.status,
    targetReadiness: plan.targetReadiness,
    capabilityCount: plan.capabilities.length,
    diagnosticCodeCount: plan.diagnosticCodes.length,
    completionContextCount: plan.completionContexts.length,
    boundaryCount: plan.boundaries.length,
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
  REQUIRED_COMPLETION_CONTEXTS,
  REQUIRED_DIAGNOSTIC_CODES,
  REQUIRED_DOCS,
  REQUIRED_TOOLING_CAPABILITIES,
  RMT_APP_PLATFORM_SCAFFOLD_SCHEMA,
  RMT_APP_PLATFORM_SOURCE_MAP_SCHEMA,
  RMT_APP_PLATFORM_TOOLING_BACKLOG,
  RMT_APP_PLATFORM_TOOLING_DOCS,
  RMT_APP_PLATFORM_TOOLING_EPIC,
  RMT_APP_PLATFORM_TOOLING_FIXTURE,
  RMT_APP_PLATFORM_TOOLING_FIXTURE_SCHEMA,
  RMT_APP_PLATFORM_TOOLING_GENERATOR,
  RMT_APP_PLATFORM_TOOLING_LOCAL_GATE,
  RMT_APP_PLATFORM_TOOLING_MODULE,
  RMT_APP_PLATFORM_TOOLING_PACKAGE_SCRIPT,
  RMT_APP_PLATFORM_TOOLING_REPORT_SCHEMA,
  RMT_APP_PLATFORM_TOOLING_RUNTIME,
  RMT_APP_PLATFORM_TOOLING_SCHEMA,
  RMT_APP_PLATFORM_TOOLING_STATUS,
  RMT_APP_PLATFORM_TOOLING_SUITE,
  RMT_APP_PLATFORM_TOOLING_TARGET,
  RMT_APP_PLATFORM_TOOLING_TYPES,
  RMT_APP_PLATFORM_TOOLING_WORKPACKAGE,
  RMT_APP_PLATFORM_TOOLING_WORKPACKAGE_DOC,
  createRmtAppPlatformToolingPlan,
  createRmtAppPlatformToolingReport,
  validateRmtAppPlatformToolingPlan
};
