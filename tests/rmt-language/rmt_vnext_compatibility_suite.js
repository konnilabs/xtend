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
  RMT_VNEXT_CORE_SCHEMA,
  compileRmtVNextSource
} = require('../../tools/rmt-language/vnext-compiler');
const {
  LEGACY_DOMAINS,
  MIGRATION_LEGACY_PARSE_FAILED_CODE,
  MIGRATION_LOSSY_DOMAIN_CODE,
  MIGRATION_OPT_IN_REQUIRED_CODE,
  RMT_VNEXT_COMPATIBILITY_MODULE_PATH,
  RMT_VNEXT_COMPATIBILITY_PACKAGE_SCRIPT,
  RMT_VNEXT_COMPATIBILITY_REPORT_SCHEMA,
  RMT_VNEXT_COMPATIBILITY_SCHEMA,
  RMT_VNEXT_COMPATIBILITY_SUITE_PATH,
  RMT_VNEXT_COMPATIBILITY_WORKPACKAGE,
  RMT_VNEXT_LEGACY_PROJECTION_SCHEMA,
  RMT_VNEXT_MIGRATION_REPORT_SCHEMA,
  RMT_VNEXT_ROUNDTRIP_REPORT_SCHEMA,
  ROUNDTRIP_COMPATIBLE_WARNINGS,
  createCompatibilityMatrix,
  createLegacyRoundtripReport,
  createMigrationReport,
  createRmtVNextCompatibilityAdapter,
  serializeMigrationReport
} = require('../../tools/rmt-language/vnext-compatibility');

const EPIC_15_PATH = 'development/EPIC_E15_RMT_vNext_Syntax.md';
const COMPATIBILITY_CONTRACT_PATH = 'development/XTendRMT-vNext-Compatibility-Migration-Contract.md';
const WP_E15_16_PATH = 'development/WP-E15-16-Compatibility-Migration-und-Legacy-JSON-Roundtrip-absichern.md';
const VALID_LEGACY_FIXTURE = 'tests/rmt-language/fixtures/regression-valid.rmt';
const LEGACY_FALLBACK_FIXTURE = 'tests/rmt-language/fixtures/regression-legacy.rmt.json';
const BROKEN_LEGACY_FIXTURE = 'tests/rmt-language/fixtures/regression-broken-syntax.rmt';
const FIRST_DEMO_FIXTURE = 'xtendrmt/rmt-first-demo-app.rmt';
const VALID_VNEXT_FIXTURE = 'tests/rmt-language/fixtures/vnext-streaming-progressive.rmt';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function fixtureInput(relativePath, rootDir) {
  return {
    text: readText(relativePath, rootDir),
    filePath: resolveRepoPath(relativePath, rootDir),
    version: 15
  };
}

function diagnosticCodes(report) {
  return (report.diagnostics || []).map((diagnostic) => diagnostic.code);
}

function runMetadataChecks(context, rootDir) {
  const packageManifest = readJson('package.json', rootDir);
  const epic = readText(EPIC_15_PATH, rootDir);
  const contract = readText(COMPATIBILITY_CONTRACT_PATH, rootDir);
  const workpackage = readText(WP_E15_16_PATH, rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtVNextCompatibility;

  context.assert(metadata && metadata.schema === RMT_VNEXT_COMPATIBILITY_SCHEMA, 'package metadata declares vNext compatibility schema');
  context.assert(metadata && metadata.migrationReportSchema === RMT_VNEXT_MIGRATION_REPORT_SCHEMA, 'package metadata declares migration report schema');
  context.assert(metadata && metadata.roundtripReportSchema === RMT_VNEXT_ROUNDTRIP_REPORT_SCHEMA, 'package metadata declares roundtrip report schema');
  context.assert(metadata && metadata.projectionSchema === RMT_VNEXT_LEGACY_PROJECTION_SCHEMA, 'package metadata declares legacy projection schema');
  context.assert(metadata && metadata.reportSchema === RMT_VNEXT_COMPATIBILITY_REPORT_SCHEMA, 'package metadata declares compatibility report schema');
  context.assert(metadata && metadata.workpackage === RMT_VNEXT_COMPATIBILITY_WORKPACKAGE, 'package metadata declares WP-E15-16 ownership');
  context.assert(metadata && metadata.module === RMT_VNEXT_COMPATIBILITY_MODULE_PATH, 'package metadata points to compatibility module');
  context.assert(metadata && metadata.suite === RMT_VNEXT_COMPATIBILITY_SUITE_PATH, 'package metadata points to compatibility suite');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js rmt-vnext-compatibility --json', 'package metadata declares compatibility local gate');
  context.assert(metadata && metadata.packageScript === RMT_VNEXT_COMPATIBILITY_PACKAGE_SCRIPT, 'package metadata declares compatibility package script');
  context.assert(metadata && Array.isArray(metadata.legacyDomains) && LEGACY_DOMAINS.every((domain) => metadata.legacyDomains.includes(domain)), 'package metadata lists legacy migration domains');
  context.assert(metadata && ROUNDTRIP_COMPATIBLE_WARNINGS.every((code) => metadata.compatibleWarnings.includes(code)), 'package metadata documents compatible warning codes');
  context.assert((typeof packageManifest.exports['./rmt-language/vnext-compatibility'] === 'string' ? packageManifest.exports['./rmt-language/vnext-compatibility'] : packageManifest.exports['./rmt-language/vnext-compatibility'] && packageManifest.exports['./rmt-language/vnext-compatibility'].default) === './tools/rmt-language/vnext-compatibility.js', 'package exports vNext compatibility adapter');
  context.assert(packageManifest.scripts['test:rmt-vnext-compatibility'] === 'node scripts/run_xtend_tests.js rmt-vnext-compatibility', 'package exposes vNext compatibility script');
  context.assert(runner.includes("id: 'rmt-vnext-compatibility'"), 'test runner exposes rmt-vnext-compatibility suite');
  context.assert(epic.includes('| `WP-E15-16` | P2 | completed | WS5 |'), 'Epic marks WP-E15-16 completed');
  context.assert(epic.includes('| `WP-E15-17` | P2 | completed | WS6 |'), 'Epic keeps WP-E15-17 completed after compatibility');
  context.assert(contract.includes(RMT_VNEXT_COMPATIBILITY_SCHEMA), 'compatibility contract declares matrix schema');
  context.assert(contract.includes(RMT_VNEXT_MIGRATION_REPORT_SCHEMA), 'compatibility contract declares migration report schema');
  context.assert(workpackage.includes('Status: `completed`'), 'WP-E15-16 document is completed');
}

function runRoundtripChecks(context, rootDir) {
  const validRoundtrip = createLegacyRoundtripReport(fixtureInput(VALID_LEGACY_FIXTURE, rootDir));
  const fallbackRoundtrip = createLegacyRoundtripReport(fixtureInput(LEGACY_FALLBACK_FIXTURE, rootDir));
  const demoRoundtrip = createLegacyRoundtripReport(fixtureInput(FIRST_DEMO_FIXTURE, rootDir));

  context.assert(validRoundtrip.schema === RMT_VNEXT_ROUNDTRIP_REPORT_SCHEMA, 'legacy roundtrip report uses schema');
  context.assert(validRoundtrip.ok === true && validRoundtrip.status === 'ready', 'legacy fixture roundtrips as normalized JSON');
  context.assert(validRoundtrip.comparisonBoundary === 'semantic-normalized-json-with-normalization-metadata-excluded', 'legacy roundtrip documents metadata boundary');
  context.assert(validRoundtrip.serialized.includes('"kind": "rmt_document"'), 'legacy roundtrip serializes normalized document');
  context.assert(fallbackRoundtrip.ok === true && fallbackRoundtrip.status === 'ready', 'fallback .rmt.json fixture remains roundtrippable');
  context.assert(diagnosticCodes(fallbackRoundtrip).includes('rmt.document.extension.fallback-used'), 'fallback fixture keeps extension fallback warning');
  context.assert(demoRoundtrip.ok === true && demoRoundtrip.serializedLength > 1000, 'demo app fixture remains parseable and roundtrippable');
}

function runMigrationChecks(context, rootDir) {
  const reportOnly = createMigrationReport(fixtureInput(VALID_LEGACY_FIXTURE, rootDir));
  const preview = createMigrationReport(fixtureInput(VALID_LEGACY_FIXTURE, rootDir), {
    migrationMode: 'preview'
  });
  const vnext = createMigrationReport(fixtureInput(VALID_VNEXT_FIXTURE, rootDir));
  const broken = createMigrationReport(fixtureInput(BROKEN_LEGACY_FIXTURE, rootDir), {
    migrationMode: 'preview'
  });
  const compiledDraft = compileRmtVNextSource({
    text: preview.authoringDraft,
    filePath: resolveRepoPath('tmp/wp-e15-16-authoring-preview.rmt', rootDir)
  });

  context.assert(reportOnly.schema === RMT_VNEXT_MIGRATION_REPORT_SCHEMA, 'migration report uses schema');
  context.assert(reportOnly.ok === true && reportOnly.status === 'ready', 'legacy report-only migration stays compatible');
  context.assert(reportOnly.languageMode === 'legacy-json' && reportOnly.migrationRequired === true, 'legacy input is detected as migration candidate');
  context.assert(reportOnly.migrationMode === 'report-only' && reportOnly.authoringDraft === null, 'report-only mode does not rewrite authoring source');
  context.assert(reportOnly.projection && reportOnly.projection.schema === RMT_VNEXT_CORE_SCHEMA, 'legacy migration produces vNext core projection');
  context.assert(reportOnly.projection && reportOnly.projection.projectionSchema === RMT_VNEXT_LEGACY_PROJECTION_SCHEMA, 'legacy projection declares projection schema');
  context.assert(diagnosticCodes(reportOnly).includes(MIGRATION_OPT_IN_REQUIRED_CODE), 'report-only migration emits opt-in warning');
  context.assert(diagnosticCodes(reportOnly).includes(MIGRATION_LOSSY_DOMAIN_CODE), 'migration reports lossy legacy boundaries');
  context.assert(reportOnly.errorCount === 0, 'compatible legacy warnings are not hard errors');
  context.assert(preview.ok === true && preview.migrationMode === 'preview', 'preview migration is opt-in and compatible');
  context.assert(typeof preview.authoringDraft === 'string' && preview.authoringDraft.includes('template regression.valid'), 'preview migration creates vNext authoring draft');
  context.assert(preview.authoringDraftCompileStatus === 'compiled' && compiledDraft.ok === true, 'preview authoring draft compiles to vNext core');
  context.assert(vnext.ok === true && vnext.languageMode === 'vnext', 'vNext source remains compatible without migration');
  context.assert(vnext.migrationRequired === false && vnext.roundtrip === null, 'vNext source bypasses legacy roundtrip migration');
  context.assert(broken.ok === false && broken.status === 'blocked', 'broken legacy syntax blocks migration');
  context.assert(diagnosticCodes(broken).includes(MIGRATION_LEGACY_PARSE_FAILED_CODE), 'broken legacy syntax receives precise migration diagnostic');
}

function runMatrixChecks(context, rootDir) {
  const compatibleInputs = [
    VALID_LEGACY_FIXTURE,
    LEGACY_FALLBACK_FIXTURE,
    FIRST_DEMO_FIXTURE,
    VALID_VNEXT_FIXTURE
  ].map((relativePath) => fixtureInput(relativePath, rootDir));
  const matrix = createCompatibilityMatrix(compatibleInputs, {
    rootDir
  });
  const blockedMatrix = createCompatibilityMatrix(compatibleInputs.concat(fixtureInput(BROKEN_LEGACY_FIXTURE, rootDir)), {
    rootDir,
    migrationMode: 'preview'
  });

  context.assert(matrix.schema === RMT_VNEXT_COMPATIBILITY_SCHEMA, 'compatibility matrix uses schema');
  context.assert(matrix.reportSchema === RMT_VNEXT_COMPATIBILITY_REPORT_SCHEMA, 'compatibility matrix declares report schema');
  context.assert(matrix.ok === true && matrix.status === 'ready', 'docs, demo, test and vNext fixtures are compatible');
  context.assert(matrix.entryCount === 4 && matrix.compatibleCount === 4 && matrix.blockedCount === 0, 'compatibility matrix counts compatible fixtures');
  context.assert(blockedMatrix.ok === false && blockedMatrix.blockedCount === 1, 'compatibility matrix isolates incompatible fixtures');
}

function runAdapterChecks(context, rootDir) {
  const adapter = createRmtVNextCompatibilityAdapter({
    readFile: (relativePath) => readText(relativePath, rootDir)
  });
  const matrix = adapter.createCompatibilityMatrix([
    VALID_LEGACY_FIXTURE,
    VALID_VNEXT_FIXTURE
  ]);
  const serializedA = serializeMigrationReport(matrix.entries[0].report);
  const serializedB = serializeMigrationReport(matrix.entries[0].report);

  context.assert(adapter.schema === RMT_VNEXT_COMPATIBILITY_SCHEMA, 'adapter exposes compatibility schema');
  context.assert(matrix.ok === true && matrix.entryCount === 2, 'adapter builds compatibility matrix with default file reader');
  context.assert(serializedA === serializedB && serializedA.includes(RMT_VNEXT_MIGRATION_REPORT_SCHEMA), 'migration reports serialize deterministically for agents');
}

function runRmtVNextCompatibilitySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-vnext-compatibility',
    label: 'Epic 15 RMT vNext Compatibility and Migration'
  });
  const moduleSyntax = syntaxCheckFile(RMT_VNEXT_COMPATIBILITY_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_VNEXT_COMPATIBILITY_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, RMT_VNEXT_COMPATIBILITY_MODULE_PATH, rootDir, 'vNext compatibility module exists');
  assertFileExists(context, RMT_VNEXT_COMPATIBILITY_SUITE_PATH, rootDir, 'vNext compatibility suite exists');
  assertFileExists(context, COMPATIBILITY_CONTRACT_PATH, rootDir, 'vNext compatibility contract document exists');
  assertFileExists(context, WP_E15_16_PATH, rootDir, 'WP-E15-16 workpackage document exists');
  assertFileExists(context, VALID_LEGACY_FIXTURE, rootDir, 'legacy regression fixture exists');
  assertFileExists(context, LEGACY_FALLBACK_FIXTURE, rootDir, 'legacy fallback fixture exists');
  assertFileExists(context, FIRST_DEMO_FIXTURE, rootDir, 'demo app RMT fixture exists');
  assertFileExists(context, VALID_VNEXT_FIXTURE, rootDir, 'vNext fixture exists');
  context.assert(moduleSyntax.ok, `vNext compatibility module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `vNext compatibility suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  runMetadataChecks(context, rootDir);
  runRoundtripChecks(context, rootDir);
  runMigrationChecks(context, rootDir);
  runMatrixChecks(context, rootDir);
  runAdapterChecks(context, rootDir);

  return context.result({
    schema: RMT_VNEXT_COMPATIBILITY_REPORT_SCHEMA,
    compatibilitySchema: RMT_VNEXT_COMPATIBILITY_SCHEMA,
    migrationReportSchema: RMT_VNEXT_MIGRATION_REPORT_SCHEMA,
    roundtripReportSchema: RMT_VNEXT_ROUNDTRIP_REPORT_SCHEMA,
    projectionSchema: RMT_VNEXT_LEGACY_PROJECTION_SCHEMA,
    workpackage: RMT_VNEXT_COMPATIBILITY_WORKPACKAGE,
    module: RMT_VNEXT_COMPATIBILITY_MODULE_PATH,
    suite: RMT_VNEXT_COMPATIBILITY_SUITE_PATH
  });
}

function printRmtVNextCompatibilityReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 15 RMT vNext Compatibility und Migration erfolgreich.',
    failureTitle: 'Epic 15 RMT vNext Compatibility und Migration fehlgeschlagen:'
  });
}

module.exports = {
  printRmtVNextCompatibilityReport,
  runRmtVNextCompatibilitySuite
};
