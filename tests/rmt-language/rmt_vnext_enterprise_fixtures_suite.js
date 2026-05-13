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
  RMT_VNEXT_CORE_SCHEMA
} = require('../../tools/rmt-language/vnext-compiler');
const {
  RMT_VNEXT_REMOTE_COMPILER_SCHEMA
} = require('../../tools/rmt-language/vnext-remote-compiler');
const {
  RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA
} = require('../../tools/rmt-language/vnext-enterprise-registry');
const {
  RMT_VNEXT_CROSS_SURFACE_EVENT_REPORT_SCHEMA
} = require('../../tools/rmt-language/vnext-cross-surface-events');
const {
  RMT_VNEXT_EVENT_GOVERNANCE_REPORT_SCHEMA
} = require('../../tools/rmt-language/vnext-event-governance');
const {
  RMT_VNEXT_DEGRADATION_REPORT_SCHEMA
} = require('../../tools/rmt-language/vnext-degradation');
const {
  ENTERPRISE_BROWSER_CHECKS,
  RMT_VNEXT_ENTERPRISE_BROWSER_SMOKE_SCHEMA,
  RMT_VNEXT_ENTERPRISE_FIXTURE_BROWSER_PATH,
  RMT_VNEXT_ENTERPRISE_FIXTURE_CONTRACT_PATH,
  RMT_VNEXT_ENTERPRISE_FIXTURE_CORE_PATH,
  RMT_VNEXT_ENTERPRISE_FIXTURE_DEMO_PATH,
  RMT_VNEXT_ENTERPRISE_FIXTURE_MATRIX_PATH,
  RMT_VNEXT_ENTERPRISE_FIXTURE_MATRIX_SCHEMA,
  RMT_VNEXT_ENTERPRISE_FIXTURE_MODULE_PATH,
  RMT_VNEXT_ENTERPRISE_FIXTURE_PACKAGE_SCRIPT,
  RMT_VNEXT_ENTERPRISE_FIXTURE_REPORT_SCHEMA,
  RMT_VNEXT_ENTERPRISE_FIXTURE_SCHEMA,
  RMT_VNEXT_ENTERPRISE_FIXTURE_SUITE_PATH,
  RMT_VNEXT_ENTERPRISE_FIXTURE_WORKPACKAGE,
  RMT_VNEXT_ENTERPRISE_FIXTURE_WP_PATH,
  createRmtVNextEnterpriseFixturesAdapter
} = require('../../tools/rmt-language/vnext-enterprise-fixtures');

const EPIC_16_PATH = 'development/EPIC_E16_RMT_Remote_Surfaces_and_Surface_Registry.md';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function createAdapter(rootDir) {
  return createRmtVNextEnterpriseFixturesAdapter({
    readFile: (relativePath) => readText(relativePath, rootDir)
  });
}

function runMetadataChecks(context, rootDir) {
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtVNextEnterpriseFixtures;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const epic = readText(EPIC_16_PATH, rootDir);
  const contract = readText(RMT_VNEXT_ENTERPRISE_FIXTURE_CONTRACT_PATH, rootDir);
  const workpackage = readText(RMT_VNEXT_ENTERPRISE_FIXTURE_WP_PATH, rootDir);
  const browserSuite = readText('tests/browser/browser_smoke_suite.js', rootDir);

  context.assert(metadata && metadata.schema === RMT_VNEXT_ENTERPRISE_FIXTURE_SCHEMA, 'package metadata declares enterprise fixture schema');
  context.assert(metadata && metadata.matrixSchema === RMT_VNEXT_ENTERPRISE_FIXTURE_MATRIX_SCHEMA, 'package metadata declares enterprise fixture matrix schema');
  context.assert(metadata && metadata.browserSmokeSchema === RMT_VNEXT_ENTERPRISE_BROWSER_SMOKE_SCHEMA, 'package metadata declares enterprise browser smoke schema');
  context.assert(metadata && metadata.reportSchema === RMT_VNEXT_ENTERPRISE_FIXTURE_REPORT_SCHEMA, 'package metadata declares enterprise fixture report schema');
  context.assert(metadata && metadata.coreSchema === RMT_VNEXT_CORE_SCHEMA, 'package metadata declares vNext core schema');
  context.assert(metadata && metadata.remoteCompilerSchema === RMT_VNEXT_REMOTE_COMPILER_SCHEMA, 'package metadata declares remote compiler schema');
  context.assert(metadata && metadata.enterpriseRegistrySchema === RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA, 'package metadata declares enterprise registry schema');
  context.assert(metadata && metadata.crossSurfaceEventReportSchema === RMT_VNEXT_CROSS_SURFACE_EVENT_REPORT_SCHEMA, 'package metadata declares cross surface event report schema');
  context.assert(metadata && metadata.eventGovernanceReportSchema === RMT_VNEXT_EVENT_GOVERNANCE_REPORT_SCHEMA, 'package metadata declares event governance report schema');
  context.assert(metadata && metadata.degradationReportSchema === RMT_VNEXT_DEGRADATION_REPORT_SCHEMA, 'package metadata declares degradation report schema');
  context.assert(metadata && metadata.workpackage === RMT_VNEXT_ENTERPRISE_FIXTURE_WORKPACKAGE, 'package metadata points to WP-E16-11');
  context.assert(metadata && metadata.module === RMT_VNEXT_ENTERPRISE_FIXTURE_MODULE_PATH, 'package metadata points to enterprise fixture module');
  context.assert(metadata && metadata.suite === RMT_VNEXT_ENTERPRISE_FIXTURE_SUITE_PATH, 'package metadata points to enterprise fixture suite');
  context.assert(metadata && metadata.contract === RMT_VNEXT_ENTERPRISE_FIXTURE_CONTRACT_PATH, 'package metadata points to enterprise fixture contract');
  context.assert(metadata && metadata.workpackageDocument === RMT_VNEXT_ENTERPRISE_FIXTURE_WP_PATH, 'package metadata points to WP-E16-11 document');
  context.assert(metadata && metadata.demo === RMT_VNEXT_ENTERPRISE_FIXTURE_DEMO_PATH, 'package metadata points to enterprise demo source');
  context.assert(metadata && metadata.coreOutput === RMT_VNEXT_ENTERPRISE_FIXTURE_CORE_PATH, 'package metadata points to enterprise core output');
  context.assert(metadata && metadata.browserSmoke === RMT_VNEXT_ENTERPRISE_FIXTURE_BROWSER_PATH, 'package metadata points to enterprise browser smoke');
  context.assert(metadata && metadata.fixtureMatrix === RMT_VNEXT_ENTERPRISE_FIXTURE_MATRIX_PATH, 'package metadata points to enterprise fixture matrix');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js rmt-vnext-enterprise-fixtures --json', 'package metadata declares enterprise fixture local gate');
  context.assert(metadata && metadata.packageScript === RMT_VNEXT_ENTERPRISE_FIXTURE_PACKAGE_SCRIPT, 'package metadata declares enterprise fixture package script');
  context.assert(metadata && ENTERPRISE_BROWSER_CHECKS.every((check) => metadata.browserChecks.includes(check)), 'package metadata lists enterprise browser checks');
  context.assert((typeof packageManifest.exports['./rmt-language/vnext-enterprise-fixtures'] === 'string' ? packageManifest.exports['./rmt-language/vnext-enterprise-fixtures'] : packageManifest.exports['./rmt-language/vnext-enterprise-fixtures'] && packageManifest.exports['./rmt-language/vnext-enterprise-fixtures'].default) === './tools/rmt-language/vnext-enterprise-fixtures.js', 'package exports vNext enterprise fixtures adapter');
  context.assert(packageManifest.scripts['test:rmt-vnext-enterprise-fixtures'] === 'node scripts/run_xtend_tests.js rmt-vnext-enterprise-fixtures', 'package exposes vNext enterprise fixtures script');
  context.assert(runner.includes("id: 'rmt-vnext-enterprise-fixtures'"), 'test runner exposes rmt-vnext-enterprise-fixtures suite');
  context.assert(runner.includes('node scripts/run_xtend_tests.js rmt-vnext-enterprise-fixtures'), 'runner help references enterprise fixture gate');
  context.assert(epic.includes('- Status: `completed / Epic 16 Enterprise MFE Release Handoff accepted`'), 'Epic marks WP-E16-12 accepted');
  context.assert(epic.includes('| `WP-E16-11` | P2 | completed | WS5 |'), 'Epic marks WP-E16-11 completed');
  context.assert(epic.includes('| `WP-E16-12` | P2 | completed | WS5 |'), 'Epic marks WP-E16-12 completed');
  context.assert(contract.includes(RMT_VNEXT_ENTERPRISE_FIXTURE_SCHEMA), 'contract declares enterprise fixture schema');
  context.assert(workpackage.includes('Status: `completed`'), 'WP-E16-11 document is completed');
  context.assert(browserSuite.includes(RMT_VNEXT_ENTERPRISE_FIXTURE_BROWSER_PATH), 'browser smoke harness knows enterprise MFE fixture');
}

function runFixtureReportChecks(context, rootDir, report) {
  const coreOutput = readJson(RMT_VNEXT_ENTERPRISE_FIXTURE_CORE_PATH, rootDir);
  const html = readText(RMT_VNEXT_ENTERPRISE_FIXTURE_BROWSER_PATH, rootDir);
  const bundle = report.bundle;
  const remoteSurface = bundle.document.remoteSurfaces.find((surface) => surface.name === 'checkout.cart');
  const remoteRegistrySurface = bundle.enterpriseRegistry.surfaces.find((surface) => surface.name === 'checkout.cart');
  const fallbackSurface = bundle.enterpriseRegistry.surfaces.find((surface) => surface.name === 'panel.checkoutFallback');
  const updatedEvent = bundle.crossSurfaceEvents.events.find((event) => event.event === 'checkout.cart.updated.v1');
  const remoteDegradation = bundle.degradation.surfaces.find((surface) => surface.name === 'checkout.cart');

  context.assert(report.schema === RMT_VNEXT_ENTERPRISE_FIXTURE_REPORT_SCHEMA, 'enterprise fixture report uses schema');
  context.assert(report.fixtureSchema === RMT_VNEXT_ENTERPRISE_FIXTURE_SCHEMA, 'enterprise fixture report declares fixture schema');
  context.assert(report.ok === true && report.status === 'passed', 'enterprise fixture report passes');
  context.assert(report.coreOutputMatches === true, 'enterprise fixture core output matches compiler output');
  context.assert(report.hashMismatches.length === 0, 'enterprise fixture golden hashes match');
  context.assert(report.countMismatches.length === 0, 'enterprise fixture expected counts match');
  context.assert(report.missingBrowserChecks.length === 0, 'enterprise browser expected checks are present');
  context.assert(coreOutput.schema === RMT_VNEXT_CORE_SCHEMA, 'enterprise core output uses vNext core schema');
  context.assert(Array.isArray(coreOutput.remoteSurfaces) && coreOutput.remoteSurfaces.length === 1, 'enterprise core output contains one remote surface');
  context.assert(bundle.document.surfaces.some((surface) => surface.name === 'workspace.sales'), 'enterprise demo contains local workspace surface');
  context.assert(bundle.document.surfaces.some((surface) => surface.name === 'panel.checkoutFallback'), 'enterprise demo contains local fallback surface');
  context.assert(remoteSurface && remoteSurface.remote.versionRange === '^3.1.0', 'enterprise remote surface preserves version range');
  context.assert(remoteSurface && remoteSurface.fallback.ref === 'panel.checkoutFallback', 'enterprise remote surface points to local fallback');
  context.assert(bundle.enterpriseRegistry.localSurfaceCount === 3 && bundle.enterpriseRegistry.remoteSurfaceCount === 1, 'enterprise registry covers local and remote surfaces');
  context.assert(remoteRegistrySurface && remoteRegistrySurface.owner.id === 'checkout-platform', 'remote registry surface records owner');
  context.assert(remoteRegistrySurface && remoteRegistrySurface.version.active === '3.1.4', 'remote registry surface records active version');
  context.assert(fallbackSurface && fallbackSurface.kind === 'local', 'fallback surface remains local in enterprise registry');
  context.assert(bundle.crossSurfaceEvents.eventCount === 2 && bundle.crossSurfaceEvents.bindingCount === 4, 'cross surface event protocol covers two typed events and four bindings');
  context.assert(updatedEvent && updatedEvent.payload.schema === 'xtend.schemas.cartUpdated.v1', 'checkout event carries payload schema');
  context.assert(bundle.eventGovernance.status === 'ready' && bundle.eventGovernance.crossTeamEventCount === 2, 'event governance reports cross-team events');
  context.assert(bundle.degradation.status === 'full' && bundle.degradation.stateCounts.full === 4, 'enterprise degradation report is full for all surfaces');
  context.assert(remoteDegradation && remoteDegradation.fallbackResolution.resolved === true, 'remote degradation resolves fallback');
  context.assert(report.browserSmoke.ok === true && report.browserSmoke.checkCount === ENTERPRISE_BROWSER_CHECKS.length, 'enterprise browser smoke probe passes all checks');
  ENTERPRISE_BROWSER_CHECKS.forEach((check) => {
    context.assert(report.browserSmoke.checks.some((entry) => entry.name === check && entry.ok), `enterprise browser smoke verifies ${check}`);
    context.assert(html.includes(`recordCheck('${check}'`), `enterprise browser fixture records ${check}`);
  });
  context.assert(!/fetch\s*\(/u.test(html), 'enterprise browser fixture performs no fetch');
  context.assert(!/import\s*\(/u.test(html), 'enterprise browser fixture performs no dynamic import');
  context.assert(html.includes('__xtendRmtVNextEnterpriseSmokeResult'), 'enterprise browser fixture exposes result object');
}

function runAdapterChecks(context, rootDir) {
  const adapter = createAdapter(rootDir);
  const matrix = readJson(RMT_VNEXT_ENTERPRISE_FIXTURE_MATRIX_PATH, rootDir);
  const report = adapter.createReport(matrix);
  const bundle = adapter.createBundle({
    text: readText(RMT_VNEXT_ENTERPRISE_FIXTURE_DEMO_PATH, rootDir),
    filePath: resolveRepoPath(RMT_VNEXT_ENTERPRISE_FIXTURE_DEMO_PATH, rootDir)
  });
  const hashes = adapter.createGoldenHashes(bundle);

  context.assert(adapter.schema === RMT_VNEXT_ENTERPRISE_FIXTURE_SCHEMA, 'adapter exposes enterprise fixture schema');
  context.assert(adapter.reportSchema === RMT_VNEXT_ENTERPRISE_FIXTURE_REPORT_SCHEMA, 'adapter exposes enterprise fixture report schema');
  context.assert(bundle.ok === true && bundle.enterpriseRegistry.surfaceCount === 4, 'adapter creates enterprise fixture bundle');
  context.assert(hashes.enterpriseRegistrySha256 === matrix.demo.expectedHashes.enterpriseRegistrySha256, 'adapter hashes enterprise registry deterministically');
  context.assert(report.ok === true, 'adapter creates passing enterprise fixture report');
}

function runRmtVNextEnterpriseFixturesSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-vnext-enterprise-fixtures',
    label: 'Epic 16 RMT vNext Enterprise MFE Fixtures'
  });
  const moduleSyntax = syntaxCheckFile(RMT_VNEXT_ENTERPRISE_FIXTURE_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_VNEXT_ENTERPRISE_FIXTURE_SUITE_PATH, { rootDir, extension: '.js' });
  const matrix = readJson(RMT_VNEXT_ENTERPRISE_FIXTURE_MATRIX_PATH, rootDir);
  const report = createAdapter(rootDir).createReport(matrix);

  assertFileExists(context, RMT_VNEXT_ENTERPRISE_FIXTURE_MODULE_PATH, rootDir, 'vNext enterprise fixture module exists');
  assertFileExists(context, RMT_VNEXT_ENTERPRISE_FIXTURE_SUITE_PATH, rootDir, 'vNext enterprise fixture suite exists');
  assertFileExists(context, RMT_VNEXT_ENTERPRISE_FIXTURE_CONTRACT_PATH, rootDir, 'vNext enterprise fixture contract exists');
  assertFileExists(context, RMT_VNEXT_ENTERPRISE_FIXTURE_WP_PATH, rootDir, 'WP-E16-11 workpackage document exists');
  assertFileExists(context, RMT_VNEXT_ENTERPRISE_FIXTURE_DEMO_PATH, rootDir, 'enterprise MFE demo source exists');
  assertFileExists(context, RMT_VNEXT_ENTERPRISE_FIXTURE_CORE_PATH, rootDir, 'enterprise MFE core output exists');
  assertFileExists(context, RMT_VNEXT_ENTERPRISE_FIXTURE_BROWSER_PATH, rootDir, 'enterprise MFE browser smoke fixture exists');
  assertFileExists(context, RMT_VNEXT_ENTERPRISE_FIXTURE_MATRIX_PATH, rootDir, 'enterprise MFE fixture matrix exists');
  context.assert(moduleSyntax.ok, `vNext enterprise fixture module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `vNext enterprise fixture suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(matrix.schema === RMT_VNEXT_ENTERPRISE_FIXTURE_MATRIX_SCHEMA, 'enterprise fixture matrix uses schema');
  context.assert(matrix.demo.expected.remoteSurfaceCount === 1, 'enterprise fixture matrix expects one remote surface');
  context.assert(matrix.demo.expected.localSurfaceCount === 3, 'enterprise fixture matrix expects three local surfaces');

  runMetadataChecks(context, rootDir);
  runFixtureReportChecks(context, rootDir, report);
  runAdapterChecks(context, rootDir);

  return context.result({
    schema: RMT_VNEXT_ENTERPRISE_FIXTURE_REPORT_SCHEMA,
    fixtureSchema: RMT_VNEXT_ENTERPRISE_FIXTURE_SCHEMA,
    matrixSchema: RMT_VNEXT_ENTERPRISE_FIXTURE_MATRIX_SCHEMA,
    browserSmokeSchema: RMT_VNEXT_ENTERPRISE_BROWSER_SMOKE_SCHEMA,
    workpackage: RMT_VNEXT_ENTERPRISE_FIXTURE_WORKPACKAGE,
    module: RMT_VNEXT_ENTERPRISE_FIXTURE_MODULE_PATH,
    suite: RMT_VNEXT_ENTERPRISE_FIXTURE_SUITE_PATH
  });
}

function printRmtVNextEnterpriseFixturesReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 16 RMT vNext Enterprise MFE Fixtures erfolgreich.',
    failureTitle: 'Epic 16 RMT vNext Enterprise MFE Fixtures fehlgeschlagen:'
  });
}

module.exports = {
  printRmtVNextEnterpriseFixturesReport,
  runRmtVNextEnterpriseFixturesSuite
};
