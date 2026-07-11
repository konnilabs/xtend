const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-gate-matrix');
const {
  RMT_APP_PLATFORM_TOOLING_SCHEMA,
  RMT_APP_PLATFORM_TOOLING_WORKPACKAGE
} = require('./epic18-rmt-app-platform-tooling');

const RMT_APP_PLATFORM_FIXTURE_SCHEMA = 'xtend.epic18.rmt-app-platform-fixture.v1';
const RMT_APP_PLATFORM_FIXTURE_REPORT_SCHEMA = 'xtend.epic18.rmt-app-platform-fixture-report.v1';
const RMT_APP_PLATFORM_FIXTURE_SOURCE_SCHEMA = 'xtend.epic18.rmt-app-platform-fixture-source.v1';
const RMT_APP_PLATFORM_FIXTURE_WORKPACKAGE = 'WP-E18-12';
const RMT_APP_PLATFORM_FIXTURE_STATUS = 'accepted-generic-rmt-app-platform-fixture';
const RMT_APP_PLATFORM_FIXTURE_TARGET = 'generic-rmt-app-platform-fixture-ready';
const RMT_APP_PLATFORM_FIXTURE_MODULE = 'catalog/epic18-rmt-app-platform-fixture.js';
const RMT_APP_PLATFORM_FIXTURE_SUITE = 'tests/rmt/rmt_app_platform_fixture_suite.js';
const RMT_APP_PLATFORM_FIXTURE = 'tests/fixtures/rmt-app-platform-fixture.rmt';
const RMT_APP_PLATFORM_FIXTURE_DOCS = 'docs/en/rmt-app-platform-fixture.md';
const RMT_APP_PLATFORM_FIXTURE_WORKPACKAGE_DOC = 'development/WP-E18-12-Generische-RMT-App-Platform-Fixture-bauen.md';
const RMT_APP_PLATFORM_FIXTURE_BACKLOG = 'development/BACKLOG-EPIC-18-XTendRMT-App-Platform-und-Media-Manager-Vendor-Upstream.md';
const RMT_APP_PLATFORM_FIXTURE_EPIC = 'development/docs-evidence/root/epic18-media-manager-vendor-upstream.md';
const RMT_APP_PLATFORM_FIXTURE_LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-app-platform-fixture --json';
const RMT_APP_PLATFORM_FIXTURE_PACKAGE_SCRIPT = 'npm run test:rmt-app-platform-fixture';
const NEXT_WORKPACKAGE = 'WP-E18-13';
const NEXT_DECISION = 'docs-migration-vendor-rebuild-release-handoff';

const REQUIRED_FIXTURE_CAPABILITIES = Object.freeze([
  'configurable-record-contracts',
  'list-detail-template-composition',
  'action-feedback-flow',
  'dynamic-surface-materialization',
  'overlay-portal-flow',
  'resource-cleanup',
  'swappable-datasources',
  'scaffold-build-evidence',
  'product-agnostic-domain-variants',
  'no-manual-html-renderer'
]);

const REQUIRED_DOMAIN_VARIANTS = Object.freeze([
  'generic-catalog',
  'admin-queue',
  'content-board'
]);

const REQUIRED_DATASOURCE_KINDS = Object.freeze([
  'fixture',
  'rest',
  'ssr',
  'host'
]);

const REQUIRED_APP_PLATFORM_BOUNDARIES = Object.freeze([
  'no-product-bound-surface-list',
  'no-manual-shell-html-sinks',
  'normal-ui-no-html-string-renderer',
  'same-primitives-multiple-apps',
  'host-adapter-swappable',
  'scaffold-output-owned-by-write-plan',
  'no-rmt-kernel-import-of-xtend-types'
]);

const REQUIRED_ARTIFACTS = Object.freeze([
  RMT_APP_PLATFORM_FIXTURE_MODULE,
  RMT_APP_PLATFORM_FIXTURE_SUITE,
  RMT_APP_PLATFORM_FIXTURE,
  RMT_APP_PLATFORM_FIXTURE_DOCS,
  RMT_APP_PLATFORM_FIXTURE_WORKPACKAGE_DOC
]);

const REQUIRED_DOCS = Object.freeze([
  RMT_APP_PLATFORM_FIXTURE_DOCS,
  RMT_APP_PLATFORM_FIXTURE_WORKPACKAGE_DOC,
  RMT_APP_PLATFORM_FIXTURE_BACKLOG,
  RMT_APP_PLATFORM_FIXTURE_EPIC
]);

function createRmtAppPlatformFixturePlan(options = {}) {
  return {
    schema: RMT_APP_PLATFORM_FIXTURE_SCHEMA,
    reportSchema: RMT_APP_PLATFORM_FIXTURE_REPORT_SCHEMA,
    fixtureSchema: RMT_APP_PLATFORM_FIXTURE_SOURCE_SCHEMA,
    toolingSchema: RMT_APP_PLATFORM_TOOLING_SCHEMA,
    toolingWorkpackage: RMT_APP_PLATFORM_TOOLING_WORKPACKAGE,
    workpackage: RMT_APP_PLATFORM_FIXTURE_WORKPACKAGE,
    status: RMT_APP_PLATFORM_FIXTURE_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    targetReadiness: RMT_APP_PLATFORM_FIXTURE_TARGET,
    module: RMT_APP_PLATFORM_FIXTURE_MODULE,
    suite: RMT_APP_PLATFORM_FIXTURE_SUITE,
    fixture: RMT_APP_PLATFORM_FIXTURE,
    docs: RMT_APP_PLATFORM_FIXTURE_DOCS,
    workpackageDocument: RMT_APP_PLATFORM_FIXTURE_WORKPACKAGE_DOC,
    localGate: RMT_APP_PLATFORM_FIXTURE_LOCAL_GATE,
    packageScript: RMT_APP_PLATFORM_FIXTURE_PACKAGE_SCRIPT,
    capabilities: REQUIRED_FIXTURE_CAPABILITIES.slice(),
    domainVariants: REQUIRED_DOMAIN_VARIANTS.slice(),
    dataSourceKinds: REQUIRED_DATASOURCE_KINDS.slice(),
    boundaries: REQUIRED_APP_PLATFORM_BOUNDARIES.slice(),
    artifactPaths: REQUIRED_ARTIFACTS.slice(),
    requiredDocs: REQUIRED_DOCS.slice(),
    model: {
      configurableRecords: true,
      listDetailActionsFeedback: true,
      dynamicSurfaces: true,
      overlaysAndPortals: true,
      resourceCleanup: true,
      swappableDataSources: true,
      scaffoldBuildEvidence: true,
      productSurfaceTaxonomyAllowed: false,
      fixedRecordContractRequired: false,
      manualHtmlRendererAllowed: false
    },
    kernelBoundary: KERNEL_BOUNDARY,
    nextWorkpackage: NEXT_WORKPACKAGE,
    nextDecision: NEXT_DECISION
  };
}

function validateRmtAppPlatformFixturePlan(plan = createRmtAppPlatformFixturePlan()) {
  const errors = [];
  const model = plan && plan.model ? plan.model : {};

  if (!plan || plan.schema !== RMT_APP_PLATFORM_FIXTURE_SCHEMA) errors.push(`schema must be ${RMT_APP_PLATFORM_FIXTURE_SCHEMA}`);
  if (!plan || plan.reportSchema !== RMT_APP_PLATFORM_FIXTURE_REPORT_SCHEMA) errors.push(`reportSchema must be ${RMT_APP_PLATFORM_FIXTURE_REPORT_SCHEMA}`);
  if (!plan || plan.fixtureSchema !== RMT_APP_PLATFORM_FIXTURE_SOURCE_SCHEMA) errors.push(`fixtureSchema must be ${RMT_APP_PLATFORM_FIXTURE_SOURCE_SCHEMA}`);
  if (!plan || plan.toolingSchema !== RMT_APP_PLATFORM_TOOLING_SCHEMA) errors.push('WP-E18-12 must build on WP-E18-11 tooling');
  if (!plan || plan.toolingWorkpackage !== RMT_APP_PLATFORM_TOOLING_WORKPACKAGE) errors.push('tooling workpackage must be WP-E18-11');
  if (!plan || plan.workpackage !== RMT_APP_PLATFORM_FIXTURE_WORKPACKAGE) errors.push(`workpackage must be ${RMT_APP_PLATFORM_FIXTURE_WORKPACKAGE}`);
  if (!plan || plan.status !== RMT_APP_PLATFORM_FIXTURE_STATUS) errors.push(`status must be ${RMT_APP_PLATFORM_FIXTURE_STATUS}`);
  if (!plan || plan.targetReadiness !== RMT_APP_PLATFORM_FIXTURE_TARGET) errors.push(`targetReadiness must be ${RMT_APP_PLATFORM_FIXTURE_TARGET}`);
  REQUIRED_FIXTURE_CAPABILITIES.forEach((capability) => {
    if (!plan || !plan.capabilities.includes(capability)) errors.push(`capability missing: ${capability}`);
  });
  REQUIRED_DOMAIN_VARIANTS.forEach((variant) => {
    if (!plan || !plan.domainVariants.includes(variant)) errors.push(`domain variant missing: ${variant}`);
  });
  REQUIRED_DATASOURCE_KINDS.forEach((kind) => {
    if (!plan || !plan.dataSourceKinds.includes(kind)) errors.push(`datasource kind missing: ${kind}`);
  });
  REQUIRED_APP_PLATFORM_BOUNDARIES.forEach((boundary) => {
    if (!plan || !plan.boundaries.includes(boundary)) errors.push(`boundary missing: ${boundary}`);
  });
  REQUIRED_ARTIFACTS.forEach((artifact) => {
    if (!plan || !plan.artifactPaths.includes(artifact)) errors.push(`artifact missing: ${artifact}`);
  });
  REQUIRED_DOCS.forEach((doc) => {
    if (!plan || !plan.requiredDocs.includes(doc)) errors.push(`doc missing: ${doc}`);
  });
  if (model.configurableRecords !== true) errors.push('fixture must prove configurable records');
  if (model.listDetailActionsFeedback !== true) errors.push('fixture must prove list/detail/action/feedback flow');
  if (model.dynamicSurfaces !== true) errors.push('fixture must prove dynamic surfaces');
  if (model.overlaysAndPortals !== true) errors.push('fixture must prove overlays and portals');
  if (model.resourceCleanup !== true) errors.push('fixture must prove resource cleanup');
  if (model.swappableDataSources !== true) errors.push('fixture must prove swappable data sources');
  if (model.scaffoldBuildEvidence !== true) errors.push('fixture must prove scaffold build evidence');
  if (model.productSurfaceTaxonomyAllowed !== false) errors.push('product-bound surface taxonomy must stay disallowed');
  if (model.fixedRecordContractRequired !== false) errors.push('fixed record-specific contracts must stay disallowed');
  if (model.manualHtmlRendererAllowed !== false) errors.push('manual HTML renderer must stay disallowed');
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  if (!plan || plan.nextWorkpackage !== NEXT_WORKPACKAGE) errors.push(`nextWorkpackage must be ${NEXT_WORKPACKAGE}`);
  if (!plan || plan.nextDecision !== NEXT_DECISION) errors.push(`nextDecision must be ${NEXT_DECISION}`);

  return {
    schema: RMT_APP_PLATFORM_FIXTURE_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors,
    workpackage: RMT_APP_PLATFORM_FIXTURE_WORKPACKAGE,
    checkedAt: 'static-local'
  };
}

function createRmtAppPlatformFixtureReport(options = {}) {
  const plan = options.plan || createRmtAppPlatformFixturePlan(options);
  const validation = validateRmtAppPlatformFixturePlan(plan);

  return {
    schema: RMT_APP_PLATFORM_FIXTURE_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors.slice(),
    workpackage: plan.workpackage,
    status: plan.status,
    targetReadiness: plan.targetReadiness,
    capabilityCount: plan.capabilities.length,
    domainVariantCount: plan.domainVariants.length,
    dataSourceKindCount: plan.dataSourceKinds.length,
    boundaryCount: plan.boundaries.length,
    nextWorkpackage: plan.nextWorkpackage,
    nextDecision: plan.nextDecision,
    kernelBoundary: plan.kernelBoundary
  };
}

module.exports = {
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  REQUIRED_APP_PLATFORM_BOUNDARIES,
  REQUIRED_ARTIFACTS,
  REQUIRED_DATASOURCE_KINDS,
  REQUIRED_DOCS,
  REQUIRED_DOMAIN_VARIANTS,
  REQUIRED_FIXTURE_CAPABILITIES,
  RMT_APP_PLATFORM_FIXTURE,
  RMT_APP_PLATFORM_FIXTURE_BACKLOG,
  RMT_APP_PLATFORM_FIXTURE_DOCS,
  RMT_APP_PLATFORM_FIXTURE_EPIC,
  RMT_APP_PLATFORM_FIXTURE_LOCAL_GATE,
  RMT_APP_PLATFORM_FIXTURE_MODULE,
  RMT_APP_PLATFORM_FIXTURE_PACKAGE_SCRIPT,
  RMT_APP_PLATFORM_FIXTURE_REPORT_SCHEMA,
  RMT_APP_PLATFORM_FIXTURE_SCHEMA,
  RMT_APP_PLATFORM_FIXTURE_SOURCE_SCHEMA,
  RMT_APP_PLATFORM_FIXTURE_STATUS,
  RMT_APP_PLATFORM_FIXTURE_SUITE,
  RMT_APP_PLATFORM_FIXTURE_TARGET,
  RMT_APP_PLATFORM_FIXTURE_WORKPACKAGE,
  RMT_APP_PLATFORM_FIXTURE_WORKPACKAGE_DOC,
  createRmtAppPlatformFixturePlan,
  createRmtAppPlatformFixtureReport,
  validateRmtAppPlatformFixturePlan
};
