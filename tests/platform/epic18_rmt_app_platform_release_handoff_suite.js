const fs = require('fs');
const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
  resolveRepoPath,
  resolveRootDir
} = require('../utils/files');
const {
  syntaxCheckFile
} = require('../utils/process');
const {
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
} = require('../../catalog/epic18-rmt-app-platform-release-handoff');

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, actual, expected, label) {
  const values = Array.isArray(actual) ? actual : [];
  expected.forEach((entry) => {
    context.assert(values.includes(entry), `${label} includes ${entry}`);
  });
}

function assertTextIncludesAll(context, text, expected, label) {
  expected.forEach((entry) => {
    context.assertIncludes(text, entry, `${label} includes ${entry}`);
  });
}

function runEpic18RmtAppPlatformReleaseHandoffSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'epic18-rmt-app-platform',
    label: 'Epic 18 RMT App Platform release handoff'
  });
  const plan = createEpic18RmtAppPlatformReleaseHandoffPlan({ rootDir });
  const validation = validateEpic18RmtAppPlatformReleaseHandoffPlan(plan);
  const report = createEpic18RmtAppPlatformReleaseHandoffReport({ rootDir, plan });
  const packageManifest = readJson('package.json', rootDir);
  const packageMetadata = packageManifest.xtend && packageManifest.xtend.epic18RmtAppPlatformReleaseHandoff;
  const ciGateMatrix = packageManifest.xtend && packageManifest.xtend.ciGateMatrix;
  const prFastGate = ciGateMatrix && ciGateMatrix.prFastGate || {};
  const fullReleaseGate = ciGateMatrix && ciGateMatrix.fullReleaseGate || {};
  const releaseGates = packageManifest.xtend && packageManifest.xtend.releaseGates || [];
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const workflow = readText(GITHUB_ACTIONS.workflow, rootDir);
  const docsMenu = readText('docs/menu.json', rootDir);
  const docsReadme = readText('docs/README.md', rootDir);
  const epic = readText(EPIC18_DOCUMENT, rootDir);
  const backlog = readText(EPIC18_BACKLOG, rootDir);
  const releaseDocs = readText(EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_DOCS, rootDir);
  const migrationGuide = readText(EPIC18_RMT_APP_PLATFORM_MIGRATION_GUIDE, rootDir);
  const vendorBugfixDocs = readText(EPIC18_VENDOR_BUGFIX_DOCS, rootDir);
  const workpackage = readText(EPIC18_RMT_APP_PLATFORM_WORKPACKAGE_DOC, rootDir);
  const moduleSyntax = syntaxCheckFile(EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_MODULE, { rootDir });
  const suiteSyntax = syntaxCheckFile(EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_SUITE, { rootDir });

  [
    EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_MODULE,
    EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_SUITE,
    EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_DOCS,
    EPIC18_RMT_APP_PLATFORM_MIGRATION_GUIDE,
    EPIC18_VENDOR_BUGFIX_DOCS,
    EPIC18_RMT_APP_PLATFORM_WORKPACKAGE_DOC,
    EPIC18_BACKLOG,
    EPIC18_DOCUMENT,
    GITHUB_ACTIONS.workflow
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });
  REQUIRED_DOCS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as Epic 18 handoff doc`);
  });

  context.assert(moduleSyntax.ok, `Epic 18 release handoff module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Epic 18 release handoff suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(plan.schema === EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_SCHEMA, 'Epic 18 handoff plan exposes schema');
  context.assert(plan.reportSchema === EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_REPORT_SCHEMA, 'Epic 18 handoff plan exposes report schema');
  context.assert(plan.gateMatrixSchema === EPIC18_RMT_APP_PLATFORM_GATE_MATRIX_SCHEMA, 'Epic 18 handoff plan exposes gate matrix schema');
  context.assert(plan.workpackage === EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_WORKPACKAGE, 'Epic 18 handoff belongs to WP-E18-13');
  context.assert(plan.status === EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_STATUS, 'Epic 18 handoff status is accepted');
  context.assert(plan.targetReadiness === EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_TARGET, 'Epic 18 target is release-ready');
  context.assert(plan.localGate === EPIC18_LOCAL_GATE, 'Epic 18 local gate is stable');
  context.assert(plan.packageScript === EPIC18_PACKAGE_SCRIPT, 'Epic 18 package script is stable');
  context.assert(validation.ok, 'Epic 18 release handoff plan validates');
  context.assert(report.ok && report.docsCount === REQUIRED_DOCS.length, 'Epic 18 release handoff report summarizes docs');
  assertIncludesAll(context, plan.requiredDocs, REQUIRED_DOCS, 'Epic 18 required docs');
  assertIncludesAll(context, plan.releaseGates, REQUIRED_RELEASE_GATES, 'Epic 18 release gates');
  assertIncludesAll(context, plan.requiredCommands, REQUIRED_COMMANDS, 'Epic 18 required commands');
  context.assert(plan.completion.completedWorkpackages.length === 13, 'Epic 18 handoff lists all 13 workpackages');
  context.assert(plan.completion.nextWorkpackage === null, 'Epic 18 has no internal next workpackage');
  context.assert(plan.completion.publishAllowed === false, 'Epic 18 handoff does not open publish');

  assertTextIncludesAll(context, releaseDocs, [
    EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_SCHEMA,
    EPIC18_LOCAL_GATE,
    'npm run test:pr:report',
    'npm run test:release:full:report',
    'npm run pack:dry-run',
    GITHUB_ACTIONS.workflow
  ], 'Epic 18 release docs');
  assertTextIncludesAll(context, migrationGuide, [
    'innerHTML',
    'DOM Descriptor',
    'payloadContract',
    'resource',
    'rmt-app-platform-fixture'
  ], 'Epic 18 migration guide');
  assertTextIncludesAll(context, vendorBugfixDocs, [
    'x-tooltip',
    'x-player',
    'x-surface-window',
    'x-side-panel',
    'x-surface-manager-controller',
    'epic18-vendor-bugfix-smokes'
  ], 'Epic 18 vendor bugfix docs');
  assertTextIncludesAll(context, workpackage, [
    EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_WORKPACKAGE,
    'Status: `completed`',
    EPIC18_LOCAL_GATE,
    'npm run test:pr:report',
    'npm run pack:dry-run'
  ], 'Epic 18 WP13 doc');
  assertTextIncludesAll(context, epic, [
    '| `WP-E18-13` | P2 | completed |',
    EPIC18_LOCAL_GATE,
    EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_SCHEMA,
    'npm run test:pr:report',
    'npm run test:release:full:report'
  ], 'Epic 18 document');
  assertTextIncludesAll(context, backlog, [
    '| `WP-E18-13` | P2 | completed |',
    EPIC18_LOCAL_GATE,
    'Kein internes Epic-18-Workpackage'
  ], 'Epic 18 backlog');

  ['epic18-vendor-bugfixes', 'rmt-app-platform-migration-guide', 'epic18-rmt-app-platform-release-handoff'].forEach((slug) => {
    context.assertIncludes(docsMenu, slug, `Docs menu exposes ${slug}`);
  });
  assertTextIncludesAll(context, docsReadme, [
    './epic18-rmt-app-platform-release-handoff.md',
    './rmt-app-platform-migration-guide.md',
    './epic18-vendor-bugfixes.md'
  ], 'Docs README');

  context.assertIncludes(runner, "require('../tests/platform/epic18_rmt_app_platform_release_handoff_suite')", 'Runner imports Epic 18 handoff suite');
  context.assertIncludes(runner, "id: 'epic18-rmt-app-platform'", 'Runner registers Epic 18 handoff suite');
  context.assert(packageManifest.scripts['test:epic18-rmt-app-platform'] === 'node scripts/run_xtend_tests.js epic18-rmt-app-platform', 'Package exposes Epic 18 handoff script');
  context.assert(packageMetadata && packageMetadata.schema === EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_SCHEMA, 'Package metadata exposes Epic 18 schema');
  context.assert(packageMetadata && packageMetadata.status === EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_STATUS, 'Package metadata exposes accepted Epic 18 status');
  context.assert(packageMetadata && packageMetadata.localGate === EPIC18_LOCAL_GATE, 'Package metadata exposes Epic 18 local gate');
  context.assert(packageMetadata && packageMetadata.githubActions.workflow === GITHUB_ACTIONS.workflow, 'Package metadata exposes GitHub workflow path');
  context.assert(packageMetadata && packageMetadata.releaseEvidence.packDryRunCommand === 'npm run pack:dry-run', 'Package metadata exposes pack dry run evidence');
  assertIncludesAll(context, packageMetadata.releaseGates, REQUIRED_RELEASE_GATES, 'Package Epic 18 metadata release gates');
  context.assert(releaseGates.includes(EPIC18_PACKAGE_SCRIPT), 'Global release gates include Epic 18 handoff script');

  context.assert(prFastGate.command === GITHUB_ACTIONS.prFastCommand, 'CI metadata keeps PR fast command');
  context.assert(prFastGate.reportPath === GITHUB_ACTIONS.prFastReport, 'CI metadata keeps PR fast report path');
  context.assert(prFastGate.artifactName === GITHUB_ACTIONS.prFastArtifact, 'CI metadata keeps PR fast artifact');
  context.assert(Array.isArray(prFastGate.suites) && prFastGate.suites.includes('epic18-rmt-app-platform'), 'PR fast gate includes Epic 18 handoff suite');
  context.assert(packageManifest.scripts['test:pr'].includes('epic18-rmt-app-platform'), 'Package PR fast script includes Epic 18');
  context.assert(packageManifest.scripts['test:pr:report'].includes('epic18-rmt-app-platform'), 'Package PR fast report script includes Epic 18');
  context.assert(fullReleaseGate.command === GITHUB_ACTIONS.fullReleaseCommand, 'CI metadata keeps full release command');
  context.assert(Array.isArray(fullReleaseGate.suites) && fullReleaseGate.suites.includes('all'), 'Full release gate still runs all suites');
  assertTextIncludesAll(context, workflow, [
    'name: XTend CI Gates',
    'pull_request:',
    'pr-fast-gates:',
    GITHUB_ACTIONS.prFastCommand,
    GITHUB_ACTIONS.prFastReport,
    GITHUB_ACTIONS.prFastArtifact,
    'full-release-gates:',
    GITHUB_ACTIONS.fullReleaseCommand,
    GITHUB_ACTIONS.fullReleaseReport,
    GITHUB_ACTIONS.fullReleaseArtifact,
    'conditional-network-evidence:',
    GITHUB_ACTIONS.conditionalNetworkCommand,
    'XTEND_CONDITIONAL_NETWORK_EXECUTE: "1"'
  ], 'GitHub Actions workflow');

  return context.result({
    report: createEpic18RmtAppPlatformReleaseHandoffReport({ rootDir, plan })
  });
}

function printEpic18RmtAppPlatformReleaseHandoffReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 18 RMT App Platform Release Handoff erfolgreich.',
    failureTitle: 'Epic 18 RMT App Platform Release Handoff fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runEpic18RmtAppPlatformReleaseHandoffSuite();
  printEpic18RmtAppPlatformReleaseHandoffReport(result);
  process.exit(result.ok ? 0 : 1);
}

module.exports = {
  printEpic18RmtAppPlatformReleaseHandoffReport,
  runEpic18RmtAppPlatformReleaseHandoffSuite
};
