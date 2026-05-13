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
  ENTERPRISE_BROWSER_CHECKS,
  RMT_VNEXT_ENTERPRISE_BROWSER_SMOKE_SCHEMA,
  RMT_VNEXT_ENTERPRISE_FIXTURE_BROWSER_PATH,
  RMT_VNEXT_ENTERPRISE_FIXTURE_CORE_PATH,
  RMT_VNEXT_ENTERPRISE_FIXTURE_DEMO_PATH,
  RMT_VNEXT_ENTERPRISE_FIXTURE_MATRIX_PATH,
  RMT_VNEXT_ENTERPRISE_FIXTURE_MATRIX_SCHEMA,
  RMT_VNEXT_ENTERPRISE_FIXTURE_REPORT_SCHEMA,
  RMT_VNEXT_ENTERPRISE_FIXTURE_SCHEMA
} = require('../../tools/rmt-language/vnext-enterprise-fixtures');
const {
  RMT_VNEXT_CORE_SCHEMA,
  RMT_VNEXT_CROSS_SURFACE_EVENTS_DOC_PATH,
  RMT_VNEXT_ENTERPRISE_ACCEPTED_CONTRACTS,
  RMT_VNEXT_ENTERPRISE_MFE_HANDOFF_DOC_PATH,
  RMT_VNEXT_ENTERPRISE_REGISTRY_DOC_PATH,
  RMT_VNEXT_ENTERPRISE_RELEASE_ASSETS,
  RMT_VNEXT_ENTERPRISE_RELEASE_CONTRACT_PATH,
  RMT_VNEXT_ENTERPRISE_RELEASE_DOCS,
  RMT_VNEXT_ENTERPRISE_RELEASE_GATE_MATRIX_SCHEMA,
  RMT_VNEXT_ENTERPRISE_RELEASE_GATES,
  RMT_VNEXT_ENTERPRISE_RELEASE_HANDOFF_REPORT_SCHEMA,
  RMT_VNEXT_ENTERPRISE_RELEASE_HANDOFF_SCHEMA,
  RMT_VNEXT_ENTERPRISE_RELEASE_LOCAL_GATE,
  RMT_VNEXT_ENTERPRISE_RELEASE_MODULE_PATH,
  RMT_VNEXT_ENTERPRISE_RELEASE_PACKAGE_SCRIPT,
  RMT_VNEXT_ENTERPRISE_RELEASE_SUITE_PATH,
  RMT_VNEXT_ENTERPRISE_RELEASE_WORKPACKAGE,
  RMT_VNEXT_ENTERPRISE_RELEASE_WORKPACKAGE_PATH,
  RMT_VNEXT_ENTERPRISE_TARGET_READINESS,
  RMT_VNEXT_REMOTE_SURFACES_DOC_PATH,
  createRmtVNextEnterpriseReleaseHandoffAdapter,
  createRmtVNextEnterpriseReleaseHandoffPlan,
  validateRmtVNextEnterpriseReleaseHandoffPlan
} = require('../../tools/rmt-language/vnext-enterprise-release');

const EPIC_16_PATH = 'development/EPIC_E16_RMT_Remote_Surfaces_and_Surface_Registry.md';
const REFERENCE_REGISTRY_PATH = 'development/XTend-Dokumentations-und-Demo-Referenzpfade.md';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, source, entries, label) {
  entries.forEach((entry) => {
    context.assertIncludes(source, entry, `${label} includes ${entry}`);
  });
}

function createAdapter(rootDir) {
  return createRmtVNextEnterpriseReleaseHandoffAdapter({
    readFile: (relativePath) => readText(relativePath, rootDir)
  });
}

function runPlanChecks(context, rootDir) {
  const adapter = createAdapter(rootDir);
  const plan = createRmtVNextEnterpriseReleaseHandoffPlan();
  const validation = validateRmtVNextEnterpriseReleaseHandoffPlan(plan);
  const report = adapter.createReport({ plan });

  context.assert(plan.schema === RMT_VNEXT_ENTERPRISE_RELEASE_HANDOFF_SCHEMA, 'enterprise release handoff plan uses schema');
  context.assert(plan.reportSchema === RMT_VNEXT_ENTERPRISE_RELEASE_HANDOFF_REPORT_SCHEMA, 'enterprise release handoff plan declares report schema');
  context.assert(plan.gateMatrixSchema === RMT_VNEXT_ENTERPRISE_RELEASE_GATE_MATRIX_SCHEMA, 'enterprise release handoff plan declares gate matrix schema');
  context.assert(plan.workpackage === RMT_VNEXT_ENTERPRISE_RELEASE_WORKPACKAGE, 'enterprise release handoff plan belongs to WP-E16-12');
  context.assert(plan.status === 'accepted-vnext-enterprise-mfe-release-handoff', 'enterprise release handoff plan is accepted');
  context.assert(plan.targetReadiness === RMT_VNEXT_ENTERPRISE_TARGET_READINESS, 'enterprise release handoff plan marks Enterprise MFE readiness');
  context.assert(plan.localGate === RMT_VNEXT_ENTERPRISE_RELEASE_LOCAL_GATE, 'enterprise release handoff plan exposes local gate');
  context.assert(plan.packageScript === RMT_VNEXT_ENTERPRISE_RELEASE_PACKAGE_SCRIPT, 'enterprise release handoff plan exposes package script');
  RMT_VNEXT_ENTERPRISE_RELEASE_DOCS.forEach((docPath) => {
    context.assert(plan.docs.includes(docPath), `enterprise release handoff plan includes ${docPath}`);
  });
  RMT_VNEXT_ENTERPRISE_RELEASE_ASSETS.forEach((assetPath) => {
    context.assert(plan.releaseAssets.includes(assetPath), `enterprise release handoff plan includes ${assetPath}`);
  });
  RMT_VNEXT_ENTERPRISE_RELEASE_GATES.forEach((command) => {
    context.assert(plan.gateMatrix.gates.some((gate) => gate.command === command), `enterprise release gate matrix includes ${command}`);
  });
  context.assert(RMT_VNEXT_ENTERPRISE_ACCEPTED_CONTRACTS.every((contract) => plan.acceptedContracts.includes(contract)), 'enterprise release handoff accepts all E16 contracts');
  context.assert(plan.operationalBoundaries.includes('no-remote-runtime-execution-in-rmt-kernel'), 'enterprise release handoff keeps remote runtime boundary');
  context.assert(plan.operationalBoundaries.includes('no-implicit-global-event-bus'), 'enterprise release handoff keeps event bus boundary');
  context.assert(plan.networkRequired === false, 'enterprise release handoff remains network-free');
  context.assert(plan.kernelBoundary === 'no-remote-runtime-execution-in-rmt-kernel', 'enterprise release handoff keeps kernel boundary');
  context.assert(validation.ok === true, 'enterprise release handoff plan validates');
  context.assert(report.ok === true, 'enterprise release handoff report passes');
  context.assert(report.demo.checks.coreOutputMatches === true, 'enterprise release report verifies core output');
  context.assert(report.demo.checks.browserSmokeOffline === true, 'enterprise release report verifies offline browser smoke');
}

function runPackageChecks(context, rootDir) {
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtVNextEnterpriseReleaseHandoff;

  context.assert((typeof packageManifest.exports['./rmt-language/vnext-enterprise-release'] === 'string' ? packageManifest.exports['./rmt-language/vnext-enterprise-release'] : packageManifest.exports['./rmt-language/vnext-enterprise-release'] && packageManifest.exports['./rmt-language/vnext-enterprise-release'].default) === './tools/rmt-language/vnext-enterprise-release.js', 'package exports vNext enterprise release adapter');
  context.assert(packageManifest.scripts['test:rmt-vnext-enterprise-release'] === 'node scripts/run_xtend_tests.js rmt-vnext-enterprise-release', 'package exposes vNext enterprise release script');
  context.assert(Array.isArray(packageManifest.xtend.releaseGates) && packageManifest.xtend.releaseGates.includes(RMT_VNEXT_ENTERPRISE_RELEASE_PACKAGE_SCRIPT), 'package release gates include vNext enterprise release script');
  context.assert(metadata && metadata.schema === RMT_VNEXT_ENTERPRISE_RELEASE_HANDOFF_SCHEMA, 'package metadata declares enterprise release schema');
  context.assert(metadata && metadata.reportSchema === RMT_VNEXT_ENTERPRISE_RELEASE_HANDOFF_REPORT_SCHEMA, 'package metadata declares enterprise release report schema');
  context.assert(metadata && metadata.gateMatrixSchema === RMT_VNEXT_ENTERPRISE_RELEASE_GATE_MATRIX_SCHEMA, 'package metadata declares enterprise release gate matrix schema');
  context.assert(metadata && metadata.workpackage === RMT_VNEXT_ENTERPRISE_RELEASE_WORKPACKAGE, 'package metadata points to WP-E16-12');
  context.assert(metadata && metadata.status === 'accepted-vnext-enterprise-mfe-release-handoff', 'package metadata exposes accepted enterprise release status');
  context.assert(metadata && metadata.targetReadiness === RMT_VNEXT_ENTERPRISE_TARGET_READINESS, 'package metadata exposes Enterprise MFE readiness');
  context.assert(metadata && metadata.module === RMT_VNEXT_ENTERPRISE_RELEASE_MODULE_PATH, 'package metadata points to enterprise release module');
  context.assert(metadata && metadata.suite === RMT_VNEXT_ENTERPRISE_RELEASE_SUITE_PATH, 'package metadata points to enterprise release suite');
  context.assert(metadata && metadata.contract === RMT_VNEXT_ENTERPRISE_RELEASE_CONTRACT_PATH, 'package metadata points to enterprise release contract');
  context.assert(metadata && metadata.workpackageDocument === RMT_VNEXT_ENTERPRISE_RELEASE_WORKPACKAGE_PATH, 'package metadata points to WP-E16-12 document');
  context.assert(metadata && metadata.demo === RMT_VNEXT_ENTERPRISE_FIXTURE_DEMO_PATH, 'package metadata points to enterprise demo');
  context.assert(metadata && metadata.coreOutput === RMT_VNEXT_ENTERPRISE_FIXTURE_CORE_PATH, 'package metadata points to enterprise core output');
  context.assert(metadata && metadata.browserSmoke === RMT_VNEXT_ENTERPRISE_FIXTURE_BROWSER_PATH, 'package metadata points to enterprise browser smoke');
  context.assert(metadata && metadata.fixtureMatrix === RMT_VNEXT_ENTERPRISE_FIXTURE_MATRIX_PATH, 'package metadata points to enterprise fixture matrix');
  context.assert(metadata && metadata.localGate === RMT_VNEXT_ENTERPRISE_RELEASE_LOCAL_GATE, 'package metadata exposes local gate');
  context.assert(metadata && metadata.packageScript === RMT_VNEXT_ENTERPRISE_RELEASE_PACKAGE_SCRIPT, 'package metadata exposes package script');
  RMT_VNEXT_ENTERPRISE_RELEASE_DOCS.forEach((docPath) => {
    context.assert(metadata.docs.includes(docPath), `package metadata includes ${docPath}`);
  });
  RMT_VNEXT_ENTERPRISE_RELEASE_GATES.forEach((command) => {
    context.assert(metadata.releaseGateMatrix.includes(command), `package metadata release matrix includes ${command}`);
  });
  RMT_VNEXT_ENTERPRISE_ACCEPTED_CONTRACTS.forEach((contract) => {
    context.assert(metadata.acceptedContracts.includes(contract), `package metadata accepts ${contract}`);
  });
}

function runDemoChecks(context, rootDir) {
  const report = createAdapter(rootDir).createDemoReport();
  const coreOutput = readJson(RMT_VNEXT_ENTERPRISE_FIXTURE_CORE_PATH, rootDir);
  const html = readText(RMT_VNEXT_ENTERPRISE_FIXTURE_BROWSER_PATH, rootDir);
  const matrix = readJson(RMT_VNEXT_ENTERPRISE_FIXTURE_MATRIX_PATH, rootDir);

  context.assert(report.ok === true && report.status === 'passed', 'enterprise release demo report passes');
  context.assert(report.fixtureSchema === RMT_VNEXT_ENTERPRISE_FIXTURE_SCHEMA, 'enterprise release demo report declares fixture schema');
  context.assert(report.fixtureReportSchema === RMT_VNEXT_ENTERPRISE_FIXTURE_REPORT_SCHEMA, 'enterprise release demo report declares fixture report schema');
  context.assert(report.fixtureMatrixSchema === RMT_VNEXT_ENTERPRISE_FIXTURE_MATRIX_SCHEMA, 'enterprise release demo report declares fixture matrix schema');
  context.assert(report.browserSmokeSchema === RMT_VNEXT_ENTERPRISE_BROWSER_SMOKE_SCHEMA, 'enterprise release demo report declares browser smoke schema');
  context.assert(coreOutput.schema === RMT_VNEXT_CORE_SCHEMA, 'enterprise release core output uses vNext core schema');
  context.assert(report.counts.localSurfaces === 3, 'enterprise release demo has three local surfaces');
  context.assert(report.counts.remoteSurfaces === 1, 'enterprise release demo has one remote surface');
  context.assert(report.counts.enterpriseSurfaces === 4, 'enterprise release demo registry has four surfaces');
  context.assert(report.counts.crossSurfaceEvents === 2, 'enterprise release demo has two cross-surface events');
  context.assert(matrix.schema === RMT_VNEXT_ENTERPRISE_FIXTURE_MATRIX_SCHEMA, 'enterprise release fixture matrix is readable');
  context.assert(html.includes('__xtendRmtVNextEnterpriseSmokeResult'), 'enterprise release browser smoke exposes result key');
  context.assert(!/fetch\s*\(/u.test(html), 'enterprise release browser smoke performs no fetch');
  context.assert(!/import\s*\(/u.test(html), 'enterprise release browser smoke performs no dynamic import');
  ENTERPRISE_BROWSER_CHECKS.forEach((check) => {
    context.assert(report.browserChecks.includes(check), `enterprise release report lists browser check ${check}`);
  });
}

function runDocumentationChecks(context, rootDir) {
  const docsReadme = readText('docs/README.md', rootDir);
  const docsMenu = readJson('docs/menu.json', rootDir);
  const remoteDocs = readText(RMT_VNEXT_REMOTE_SURFACES_DOC_PATH, rootDir);
  const registryDocs = readText(RMT_VNEXT_ENTERPRISE_REGISTRY_DOC_PATH, rootDir);
  const eventDocs = readText(RMT_VNEXT_CROSS_SURFACE_EVENTS_DOC_PATH, rootDir);
  const handoffDocs = readText(RMT_VNEXT_ENTERPRISE_MFE_HANDOFF_DOC_PATH, rootDir);
  const contract = readText(RMT_VNEXT_ENTERPRISE_RELEASE_CONTRACT_PATH, rootDir);
  const workpackage = readText(RMT_VNEXT_ENTERPRISE_RELEASE_WORKPACKAGE_PATH, rootDir);
  const registry = readText(REFERENCE_REGISTRY_PATH, rootDir);
  const epic = readText(EPIC_16_PATH, rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);

  [
    'rmt-vnext-remote-surfaces',
    'rmt-vnext-surface-registry-enterprise',
    'rmt-vnext-cross-surface-events',
    'rmt-vnext-enterprise-mfe-handoff'
  ].forEach((slug) => {
    context.assert(docsMenu.some((entry) => entry.slug === slug), `docs menu includes ${slug}`);
  });
  assertIncludesAll(context, docsReadme, [
    'RMT vNext Remote Surfaces',
    'RMT vNext Enterprise Surface Registry',
    'RMT vNext Cross Surface Events',
    'RMT vNext Enterprise MFE Handoff',
    RMT_VNEXT_ENTERPRISE_TARGET_READINESS
  ], 'Docs README');
  assertIncludesAll(context, remoteDocs, [
    'xtend.rmt.vnext-remote-surface.v1',
    'xtend.rmt.vnext-remote-surface-manifest.v1',
    'xtend.rmt.vnext-remote-security-policy.v1',
    'remote surface checkout.cart from remote',
    RMT_VNEXT_ENTERPRISE_FIXTURE_DEMO_PATH
  ], 'Remote Surfaces docs');
  assertIncludesAll(context, registryDocs, [
    'surface.registry',
    'xtend.rmt.vnext-enterprise-surface-registry.v1',
    'byOwner',
    'byShellTarget',
    RMT_VNEXT_ENTERPRISE_TARGET_READINESS
  ], 'Enterprise registry docs');
  assertIncludesAll(context, eventDocs, [
    'xtend.rmt.vnext-cross-surface-event-protocol.v1',
    'xtend.rmt.vnext-event-governance-policy.v1',
    'checkout.cart.updated.v1',
    'user.session.changed.v1'
  ], 'Cross surface events docs');
  assertIncludesAll(context, handoffDocs, [
    RMT_VNEXT_ENTERPRISE_RELEASE_HANDOFF_SCHEMA,
    RMT_VNEXT_ENTERPRISE_RELEASE_GATE_MATRIX_SCHEMA,
    RMT_VNEXT_ENTERPRISE_TARGET_READINESS,
    RMT_VNEXT_ENTERPRISE_RELEASE_LOCAL_GATE,
    RMT_VNEXT_ENTERPRISE_FIXTURE_CORE_PATH
  ], 'Enterprise MFE handoff docs');
  assertIncludesAll(context, contract, [
    RMT_VNEXT_ENTERPRISE_RELEASE_HANDOFF_SCHEMA,
    RMT_VNEXT_ENTERPRISE_RELEASE_GATE_MATRIX_SCHEMA,
    RMT_VNEXT_ENTERPRISE_TARGET_READINESS,
    'Accepted Residuals'
  ], 'Enterprise release contract');
  assertIncludesAll(context, workpackage, [
    'Status: `completed`',
    RMT_VNEXT_ENTERPRISE_RELEASE_LOCAL_GATE,
    RMT_VNEXT_ENTERPRISE_TARGET_READINESS,
    RMT_VNEXT_ENTERPRISE_RELEASE_MODULE_PATH
  ], 'WP-E16-12 document');
  assertIncludesAll(context, registry, [
    RMT_VNEXT_ENTERPRISE_RELEASE_HANDOFF_SCHEMA,
    RMT_VNEXT_ENTERPRISE_RELEASE_MODULE_PATH,
    RMT_VNEXT_ENTERPRISE_RELEASE_SUITE_PATH,
    RMT_VNEXT_REMOTE_SURFACES_DOC_PATH,
    RMT_VNEXT_ENTERPRISE_FIXTURE_DEMO_PATH,
    RMT_VNEXT_ENTERPRISE_FIXTURE_CORE_PATH
  ], 'Reference registry');
  context.assertIncludes(runner, "id: 'rmt-vnext-enterprise-release'", 'Runner registers vNext enterprise release suite');
  context.assertIncludes(runner, 'node scripts/run_xtend_tests.js rmt-vnext-enterprise-release', 'Runner help references vNext enterprise release suite');
  context.assertIncludes(epic, '- Status: `completed / Epic 16 Enterprise MFE Release Handoff accepted`', 'Epic 16 marks completion');
  context.assertIncludes(epic, '| `WP-E16-12` | P2 | completed | WS5 |', 'Epic marks WP-E16-12 completed');
  context.assertIncludes(epic, 'Epic 16 ist abgeschlossen', 'Epic documents closure');
}

function runRmtVNextEnterpriseReleaseSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-vnext-enterprise-release',
    label: 'Epic 16 RMT vNext Enterprise MFE Release Handoff'
  });
  const moduleSyntax = syntaxCheckFile(RMT_VNEXT_ENTERPRISE_RELEASE_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_VNEXT_ENTERPRISE_RELEASE_SUITE_PATH, { rootDir, extension: '.js' });

  [
    RMT_VNEXT_ENTERPRISE_RELEASE_MODULE_PATH,
    RMT_VNEXT_ENTERPRISE_RELEASE_SUITE_PATH,
    RMT_VNEXT_ENTERPRISE_RELEASE_CONTRACT_PATH,
    RMT_VNEXT_ENTERPRISE_RELEASE_WORKPACKAGE_PATH,
    ...RMT_VNEXT_ENTERPRISE_RELEASE_DOCS,
    ...RMT_VNEXT_ENTERPRISE_RELEASE_ASSETS
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });

  context.assert(moduleSyntax.ok, `vNext enterprise release module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `vNext enterprise release suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  runPlanChecks(context, rootDir);
  runPackageChecks(context, rootDir);
  runDemoChecks(context, rootDir);
  runDocumentationChecks(context, rootDir);

  return context.result({
    schema: RMT_VNEXT_ENTERPRISE_RELEASE_HANDOFF_REPORT_SCHEMA,
    handoffSchema: RMT_VNEXT_ENTERPRISE_RELEASE_HANDOFF_SCHEMA,
    gateMatrixSchema: RMT_VNEXT_ENTERPRISE_RELEASE_GATE_MATRIX_SCHEMA,
    workpackage: RMT_VNEXT_ENTERPRISE_RELEASE_WORKPACKAGE,
    module: RMT_VNEXT_ENTERPRISE_RELEASE_MODULE_PATH,
    suite: RMT_VNEXT_ENTERPRISE_RELEASE_SUITE_PATH
  });
}

function printRmtVNextEnterpriseReleaseReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 16 RMT vNext Enterprise MFE Release Handoff erfolgreich.',
    failureTitle: 'Epic 16 RMT vNext Enterprise MFE Release Handoff fehlgeschlagen:'
  });
}

module.exports = {
  printRmtVNextEnterpriseReleaseReport,
  runRmtVNextEnterpriseReleaseSuite
};
