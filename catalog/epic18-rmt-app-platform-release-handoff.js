const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-gate-matrix');
const {
  RMT_APP_PLATFORM_FIXTURE_SCHEMA,
  RMT_APP_PLATFORM_FIXTURE_WORKPACKAGE
} = require('./epic18-rmt-app-platform-fixture');

const EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_SCHEMA = 'xtend.epic18.rmt-app-platform-release-handoff.v1';
const EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_REPORT_SCHEMA = 'xtend.epic18.rmt-app-platform-release-handoff-report.v1';
const EPIC18_RMT_APP_PLATFORM_GATE_MATRIX_SCHEMA = 'xtend.epic18.rmt-app-platform-gate-matrix.v1';
const EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_WORKPACKAGE = 'WP-E18-13';
const EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_STATUS = 'accepted-docs-migration-vendor-rebuild-release-handoff';
const EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_TARGET = 'epic18-rmt-app-platform-release-ready';
const EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_MODULE = 'catalog/epic18-rmt-app-platform-release-handoff.js';
const EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_SUITE = 'tests/platform/epic18_rmt_app_platform_release_handoff_suite.js';
const EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_DOCS = 'docs/en/rmt-app-platform-migration-guide.md';
const EPIC18_RMT_APP_PLATFORM_MIGRATION_GUIDE = 'docs/en/rmt-app-platform-migration-guide.md';
const EPIC18_VENDOR_BUGFIX_DOCS = 'docs/en/rmt-app-platform-migration-guide.md';
const EPIC18_RMT_APP_PLATFORM_WORKPACKAGE_DOC = 'development/WP-E18-13-Docs-Migration-Guide-Vendor-Rebuild-und-Release-Handoff.md';
const EPIC18_BACKLOG = 'development/BACKLOG-EPIC-18-XTendRMT-App-Platform-und-Media-Manager-Vendor-Upstream.md';
const EPIC18_DOCUMENT = 'development/docs-evidence/root/epic18-media-manager-vendor-upstream.md';
const EPIC18_LOCAL_GATE = 'node scripts/run_xtend_tests.js epic18-rmt-app-platform --json';
const EPIC18_PACKAGE_SCRIPT = 'npm run test:epic18-rmt-app-platform';

const REQUIRED_DOCS = Object.freeze([
  EPIC18_DOCUMENT,
  EPIC18_VENDOR_BUGFIX_DOCS,
  'development/docs-evidence/root/rmt-app-platform-authoring.md',
  'docs/en/rmt-dom-descriptor-renderer.md',
  'docs/en/rmt-component-template-primitives.md',
  'docs/rmt-state-selector-runtime.md',
  'docs/rmt-action-effect-runtime.md',
  'docs/rmt-event-routing-runtime.md',
  'docs/rmt-surface-resource-graph-runtime.md',
  'docs/en/rmt-app-platform-tooling.md',
  'docs/en/rmt-app-platform-fixture.md',
  EPIC18_RMT_APP_PLATFORM_MIGRATION_GUIDE,
  EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_DOCS,
  EPIC18_RMT_APP_PLATFORM_WORKPACKAGE_DOC
]);

const REQUIRED_RELEASE_GATES = Object.freeze([
  'epic18-vendor-bugfix-smokes',
  'rmt-app-platform-authoring',
  'rmt-dom-descriptor-renderer',
  'rmt-component-template-primitives',
  'rmt-state-selector-runtime',
  'rmt-action-effect-runtime',
  'rmt-event-routing-runtime',
  'rmt-surface-resource-graph-runtime',
  'rmt-app-platform-tooling',
  'rmt-app-platform-fixture',
  'type-exports-rmt',
  'type-exports',
  'epic13-package-export-lock',
  'epic18-rmt-app-platform'
]);

const REQUIRED_COMMANDS = Object.freeze([
  'node scripts/run_xtend_tests.js components surface-controller surface-manager-browser overlay-interaction-ux layout-display-media-ux epic18-vendor-bugfix-smokes browser references --json',
  'node scripts/run_xtend_tests.js rmt-app-platform-authoring rmt-dom-descriptor-renderer rmt-component-template-primitives rmt-state-selector-runtime rmt-action-effect-runtime rmt-event-routing-runtime rmt-surface-resource-graph-runtime rmt-app-platform-tooling rmt-app-platform-fixture rmt-vnext-compiler rmt-vnext-events rmt-vnext-surfaces rmt-vnext-security rmt-first-demo-app scaffold-rmt-build --json',
  'node scripts/run_xtend_tests.js type-exports-rmt type-exports epic13-package-export-lock --json',
  EPIC18_LOCAL_GATE,
  'npm run test:pr:report',
  'npm run test:release:full:report',
  'npm run pack:dry-run'
]);

const GITHUB_ACTIONS = Object.freeze({
  workflow: '.github/workflows/xtend-default-gates.yml',
  nodeVersion: '26.x',
  prFastCommand: 'npm run test:pr:report',
  prFastReport: '.xtend-test-results/xtend-pr-gate-report.json',
  prFastArtifact: 'xtend-pr-gate-report-node-26',
  fullReleaseCommand: 'npm run test:release:full:report',
  fullReleaseReport: '.xtend-test-results/xtend-release-gate-report.json',
  fullReleaseArtifact: 'xtend-release-gate-report-node-26',
  conditionalNetworkCommand: 'npm run conditional-network:evidence',
  conditionalNetworkExecuteEnv: 'XTEND_CONDITIONAL_NETWORK_EXECUTE=1'
});

function createEpic18RmtAppPlatformReleaseHandoffPlan(options = {}) {
  return {
    schema: EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_SCHEMA,
    reportSchema: EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_REPORT_SCHEMA,
    gateMatrixSchema: EPIC18_RMT_APP_PLATFORM_GATE_MATRIX_SCHEMA,
    fixtureSchema: RMT_APP_PLATFORM_FIXTURE_SCHEMA,
    fixtureWorkpackage: RMT_APP_PLATFORM_FIXTURE_WORKPACKAGE,
    workpackage: EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_WORKPACKAGE,
    status: EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    targetReadiness: EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_TARGET,
    module: EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_MODULE,
    suite: EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_SUITE,
    docs: EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_DOCS,
    migrationGuide: EPIC18_RMT_APP_PLATFORM_MIGRATION_GUIDE,
    vendorBugfixDocs: EPIC18_VENDOR_BUGFIX_DOCS,
    workpackageDocument: EPIC18_RMT_APP_PLATFORM_WORKPACKAGE_DOC,
    epic: EPIC18_DOCUMENT,
    backlog: EPIC18_BACKLOG,
    localGate: EPIC18_LOCAL_GATE,
    packageScript: EPIC18_PACKAGE_SCRIPT,
    requiredDocs: REQUIRED_DOCS.slice(),
    releaseGates: REQUIRED_RELEASE_GATES.slice(),
    requiredCommands: REQUIRED_COMMANDS.slice(),
    githubActions: { ...GITHUB_ACTIONS },
    releaseEvidence: {
      packDryRunCommand: 'npm run pack:dry-run',
      packageExportLockGate: 'node scripts/run_xtend_tests.js epic13-package-export-lock --json',
      packageExportLockReport: '.xtend-test-results/xtend-package-export-lock-report.json',
      packageExportSurfaceLock: '.xtend-test-results/xtend-package-export-surface-lock.json',
      releaseReportCommand: 'npm run release:report'
    },
    completion: {
      epicStatus: 'completed',
      completedWorkpackages: Array.from({ length: 13 }, (_, index) => `WP-E18-${String(index + 1).padStart(2, '0')}`),
      nextWorkpackage: null,
      publishAllowed: false,
      publishBoundary: 'private-until-release-owner-acceptance'
    },
    model: {
      componentBugfixDocsComplete: true,
      rmtAppPlatformGuideComplete: true,
      migrationAwayFromManualHtmlHostsComplete: true,
      vendorRebuildReady: true,
      packageExportLockReady: true,
      githubActionsReady: true,
      prFastGateIncludesEpic18: true,
      fullReleaseRunsEpic18: true
    },
    kernelBoundary: KERNEL_BOUNDARY
  };
}

function validateEpic18RmtAppPlatformReleaseHandoffPlan(plan = createEpic18RmtAppPlatformReleaseHandoffPlan()) {
  const errors = [];
  const model = plan && plan.model ? plan.model : {};
  const completion = plan && plan.completion ? plan.completion : {};

  if (!plan || plan.schema !== EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_SCHEMA) errors.push(`schema must be ${EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_SCHEMA}`);
  if (!plan || plan.reportSchema !== EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_REPORT_SCHEMA) errors.push(`reportSchema must be ${EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_REPORT_SCHEMA}`);
  if (!plan || plan.gateMatrixSchema !== EPIC18_RMT_APP_PLATFORM_GATE_MATRIX_SCHEMA) errors.push(`gateMatrixSchema must be ${EPIC18_RMT_APP_PLATFORM_GATE_MATRIX_SCHEMA}`);
  if (!plan || plan.fixtureSchema !== RMT_APP_PLATFORM_FIXTURE_SCHEMA) errors.push('WP-E18-13 must build on the WP-E18-12 fixture');
  if (!plan || plan.fixtureWorkpackage !== RMT_APP_PLATFORM_FIXTURE_WORKPACKAGE) errors.push('fixture workpackage must be WP-E18-12');
  if (!plan || plan.workpackage !== EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_WORKPACKAGE) errors.push(`workpackage must be ${EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_WORKPACKAGE}`);
  if (!plan || plan.status !== EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_STATUS) errors.push(`status must be ${EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_STATUS}`);
  if (!plan || plan.targetReadiness !== EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_TARGET) errors.push(`targetReadiness must be ${EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_TARGET}`);
  REQUIRED_DOCS.forEach((docPath) => {
    if (!plan || !plan.requiredDocs.includes(docPath)) errors.push(`required doc missing: ${docPath}`);
  });
  REQUIRED_RELEASE_GATES.forEach((gate) => {
    if (!plan || !plan.releaseGates.includes(gate)) errors.push(`release gate missing: ${gate}`);
  });
  REQUIRED_COMMANDS.forEach((command) => {
    if (!plan || !plan.requiredCommands.includes(command)) errors.push(`required command missing: ${command}`);
  });
  if (!plan || !plan.githubActions || plan.githubActions.workflow !== GITHUB_ACTIONS.workflow) errors.push('GitHub Actions workflow path must remain stable');
  if (!plan || !plan.githubActions || plan.githubActions.prFastCommand !== GITHUB_ACTIONS.prFastCommand) errors.push('GitHub PR fast command must remain stable');
  if (!plan || !plan.githubActions || plan.githubActions.fullReleaseCommand !== GITHUB_ACTIONS.fullReleaseCommand) errors.push('GitHub full release command must remain stable');
  if (completion.completedWorkpackages && completion.completedWorkpackages.length !== 13) errors.push('Epic 18 completion must list all 13 workpackages');
  if (completion.epicStatus !== 'completed') errors.push('Epic 18 completion must be completed');
  if (completion.nextWorkpackage !== null) errors.push('Epic 18 must not expose another internal next workpackage');
  if (completion.publishAllowed !== false) errors.push('Epic 18 handoff must not allow publish by itself');
  if (model.componentBugfixDocsComplete !== true) errors.push('component bugfix docs must be complete');
  if (model.rmtAppPlatformGuideComplete !== true) errors.push('RMT App Platform guide must be complete');
  if (model.migrationAwayFromManualHtmlHostsComplete !== true) errors.push('manual HTML host migration guide must be complete');
  if (model.vendorRebuildReady !== true) errors.push('vendor rebuild must be ready');
  if (model.packageExportLockReady !== true) errors.push('package export lock must be ready');
  if (model.githubActionsReady !== true) errors.push('GitHub Actions must be ready');
  if (model.prFastGateIncludesEpic18 !== true) errors.push('PR fast gate must include Epic 18');
  if (model.fullReleaseRunsEpic18 !== true) errors.push('full release gate must run Epic 18');
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);

  return {
    schema: EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors,
    workpackage: EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_WORKPACKAGE,
    checkedAt: 'static-local'
  };
}

function createEpic18RmtAppPlatformReleaseHandoffReport(options = {}) {
  const plan = options.plan || createEpic18RmtAppPlatformReleaseHandoffPlan(options);
  const validation = validateEpic18RmtAppPlatformReleaseHandoffPlan(plan);

  return {
    schema: EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors.slice(),
    workpackage: plan.workpackage,
    status: plan.status,
    targetReadiness: plan.targetReadiness,
    docsCount: plan.requiredDocs.length,
    releaseGateCount: plan.releaseGates.length,
    requiredCommandCount: plan.requiredCommands.length,
    completedWorkpackageCount: plan.completion.completedWorkpackages.length,
    githubWorkflow: plan.githubActions.workflow,
    prFastCommand: plan.githubActions.prFastCommand,
    fullReleaseCommand: plan.githubActions.fullReleaseCommand,
    packageDryRunCommand: plan.releaseEvidence.packDryRunCommand,
    kernelBoundary: plan.kernelBoundary
  };
}

module.exports = {
  EPIC18_BACKLOG,
  EPIC18_DOCUMENT,
  EPIC18_LOCAL_GATE,
  EPIC18_PACKAGE_SCRIPT,
  EPIC18_RMT_APP_PLATFORM_GATE_MATRIX_SCHEMA,
  EPIC18_RMT_APP_PLATFORM_MIGRATION_GUIDE,
  EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_DOCS,
  EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_MODULE,
  EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_REPORT_SCHEMA,
  EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_SCHEMA,
  EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_STATUS,
  EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_SUITE,
  EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_TARGET,
  EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_WORKPACKAGE,
  EPIC18_RMT_APP_PLATFORM_WORKPACKAGE_DOC,
  EPIC18_VENDOR_BUGFIX_DOCS,
  GITHUB_ACTIONS,
  REQUIRED_COMMANDS,
  REQUIRED_DOCS,
  REQUIRED_RELEASE_GATES,
  createEpic18RmtAppPlatformReleaseHandoffPlan,
  createEpic18RmtAppPlatformReleaseHandoffReport,
  validateEpic18RmtAppPlatformReleaseHandoffPlan
};
