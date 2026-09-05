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
  REMOTE_COMPATIBLE_WARNINGS,
  REMOTE_MIGRATION_NATIVE_SURFACE_ROUNDTRIP_CODE,
  REMOTE_MIGRATION_PREVIEW_UNSAFE_CODE,
  REMOTE_MIGRATION_REMOTE_FACT_MISSING_CODE,
  REMOTE_MIGRATION_REMOTE_PREVIEW_AVAILABLE_CODE,
  REMOTE_MIGRATION_REPORT_ONLY_CODE,
  REMOTE_MIGRATION_RUNTIME_FACT_CODE,
  REMOTE_MIGRATION_SURFACE_MANAGER_BOUNDARY_CODE,
  REMOTE_REQUIRED_FACTS,
  RMT_VNEXT_REMOTE_COMPATIBILITY_CONTRACT_PATH,
  RMT_VNEXT_REMOTE_COMPATIBILITY_MODULE_PATH,
  RMT_VNEXT_REMOTE_COMPATIBILITY_PACKAGE_SCRIPT,
  RMT_VNEXT_REMOTE_COMPATIBILITY_REPORT_SCHEMA,
  RMT_VNEXT_REMOTE_COMPATIBILITY_SCHEMA,
  RMT_VNEXT_REMOTE_COMPATIBILITY_SUITE_PATH,
  RMT_VNEXT_REMOTE_COMPATIBILITY_WORKPACKAGE,
  RMT_VNEXT_REMOTE_COMPATIBILITY_WP_PATH,
  RMT_VNEXT_REMOTE_MIGRATION_REPORT_SCHEMA,
  RMT_VNEXT_REMOTE_PREVIEW_SCHEMA,
  RMT_VNEXT_REMOTE_ROUNDTRIP_REPORT_SCHEMA,
  createLegacyRemoteSurfaceRoundtripReport,
  createRemoteCompatibilityMatrix,
  createRemoteSurfaceMigrationReport,
  createRmtVNextRemoteCompatibilityAdapter,
  serializeRemoteMigrationReport
} = require('../../tools/rmt-language/vnext-remote-compatibility');

const EPIC_16_PATH = 'development/EPIC_E16_RMT_Remote_Surfaces_and_Surface_Registry.md';
const LEGACY_SURFACE_FIXTURE = 'tests/rmt-language/fixtures/vnext-remote-compatibility-legacy-surface.rmt';
const PREVIEW_SURFACE_FIXTURE = 'tests/rmt-language/fixtures/vnext-remote-compatibility-preview.rmt';
const NATIVE_SURFACE_FIXTURE = 'tests/fixtures/rmt-surface-native-domain.rmt';
const REMOTE_VNEXT_FIXTURE = 'tests/rmt-language/fixtures/vnext-remote-compiler-valid.rmt';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function fixtureInput(relativePath, rootDir) {
  return {
    text: readText(relativePath, rootDir),
    filePath: resolveRepoPath(relativePath, rootDir),
    version: 16
  };
}

function diagnosticCodes(report) {
  return (report.diagnostics || []).map((diagnostic) => diagnostic.code);
}

function assertIncludesAll(context, actual, expected, message) {
  const list = Array.isArray(actual) ? actual : [];
  const missing = expected.filter((item) => !list.includes(item));
  context.assert(missing.length === 0, `${message}${missing.length > 0 ? ` missing ${missing.join(', ')}` : ''}`);
}

function runMetadataChecks(context, rootDir) {
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtVNextRemoteCompatibility;
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const epic = readText(EPIC_16_PATH, rootDir);
  const contract = readText(RMT_VNEXT_REMOTE_COMPATIBILITY_CONTRACT_PATH, rootDir);
  const workpackage = readText(RMT_VNEXT_REMOTE_COMPATIBILITY_WP_PATH, rootDir);

  context.assert(metadata && metadata.schema === RMT_VNEXT_REMOTE_COMPATIBILITY_SCHEMA, 'package metadata declares remote compatibility schema');
  context.assert(metadata && metadata.migrationReportSchema === RMT_VNEXT_REMOTE_MIGRATION_REPORT_SCHEMA, 'package metadata declares remote migration report schema');
  context.assert(metadata && metadata.roundtripReportSchema === RMT_VNEXT_REMOTE_ROUNDTRIP_REPORT_SCHEMA, 'package metadata declares remote roundtrip report schema');
  context.assert(metadata && metadata.previewSchema === RMT_VNEXT_REMOTE_PREVIEW_SCHEMA, 'package metadata declares remote authoring preview schema');
  context.assert(metadata && metadata.reportSchema === RMT_VNEXT_REMOTE_COMPATIBILITY_REPORT_SCHEMA, 'package metadata declares remote compatibility report schema');
  context.assert(metadata && metadata.coreSchema === RMT_VNEXT_CORE_SCHEMA, 'package metadata declares vNext core schema');
  context.assert(metadata && metadata.remoteCompilerSchema === RMT_VNEXT_REMOTE_COMPILER_SCHEMA, 'package metadata declares remote compiler schema');
  context.assert(metadata && metadata.workpackage === RMT_VNEXT_REMOTE_COMPATIBILITY_WORKPACKAGE, 'package metadata points to WP-E16-10');
  context.assert(metadata && metadata.module === RMT_VNEXT_REMOTE_COMPATIBILITY_MODULE_PATH, 'package metadata points to remote compatibility module');
  context.assert(metadata && metadata.suite === RMT_VNEXT_REMOTE_COMPATIBILITY_SUITE_PATH, 'package metadata points to remote compatibility suite');
  context.assert(metadata && metadata.contract === RMT_VNEXT_REMOTE_COMPATIBILITY_CONTRACT_PATH, 'package metadata points to remote compatibility contract');
  context.assert(metadata && metadata.workpackageDocument === RMT_VNEXT_REMOTE_COMPATIBILITY_WP_PATH, 'package metadata points to WP-E16-10 document');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js rmt-vnext-remote-compatibility --json', 'package metadata declares remote compatibility local gate');
  context.assert(metadata && metadata.packageScript === RMT_VNEXT_REMOTE_COMPATIBILITY_PACKAGE_SCRIPT, 'package metadata declares remote compatibility package script');
  context.assert(metadata && REMOTE_REQUIRED_FACTS.every((fact) => metadata.requiredPreviewFacts.includes(fact)), 'package metadata documents required preview facts');
  context.assert(metadata && REMOTE_COMPATIBLE_WARNINGS.every((code) => metadata.compatibleWarnings.includes(code)), 'package metadata documents compatible warning codes');
  context.assert((typeof packageManifest.exports['./rmt-language/vnext-remote-compatibility'] === 'string' ? packageManifest.exports['./rmt-language/vnext-remote-compatibility'] : packageManifest.exports['./rmt-language/vnext-remote-compatibility'] && packageManifest.exports['./rmt-language/vnext-remote-compatibility'].default) === './tools/rmt-language/vnext-remote-compatibility.js', 'package exports vNext remote compatibility adapter');
  context.assert(packageManifest.scripts['test:rmt-vnext-remote-compatibility'] === 'node scripts/run_xtend_tests.js rmt-vnext-remote-compatibility', 'package exposes vNext remote compatibility script');
  context.assert(runner.hasSuite("rmt-vnext-remote-compatibility"), 'test runner exposes rmt-vnext-remote-compatibility suite');
  context.assert(runner.hasSuite("rmt-vnext-remote-compatibility"), 'runner help references remote compatibility gate');
  context.assert(epic.includes('- Status: `completed / Epic 16 Enterprise MFE Release Handoff accepted`'), 'Epic records current E16 accepted status');
  context.assert(epic.includes('| `WP-E16-10` | P2 | completed | WS5 |'), 'Epic marks WP-E16-10 completed');
  context.assert(epic.includes('| `WP-E16-11` | P2 | completed | WS5 |'), 'Epic marks WP-E16-11 completed');
  context.assert(epic.includes('| `WP-E16-12` | P2 | completed | WS5 |'), 'Epic marks WP-E16-12 completed');
  context.assert(contract.includes(RMT_VNEXT_REMOTE_COMPATIBILITY_SCHEMA), 'contract declares remote compatibility schema');
  context.assert(contract.includes(RMT_VNEXT_REMOTE_MIGRATION_REPORT_SCHEMA), 'contract declares remote migration report schema');
  context.assert(workpackage.includes('Status: `completed`'), 'WP-E16-10 document is completed');
}

function runRoundtripChecks(context, rootDir) {
  const legacyRoundtrip = createLegacyRemoteSurfaceRoundtripReport(fixtureInput(LEGACY_SURFACE_FIXTURE, rootDir));
  const nativeRoundtrip = createLegacyRemoteSurfaceRoundtripReport(fixtureInput(NATIVE_SURFACE_FIXTURE, rootDir));

  context.assert(legacyRoundtrip.schema === RMT_VNEXT_REMOTE_ROUNDTRIP_REPORT_SCHEMA, 'remote legacy roundtrip report uses schema');
  context.assert(legacyRoundtrip.ok === true && legacyRoundtrip.status === 'ready', 'legacy remote surface fixture roundtrips as normalized JSON');
  context.assert(legacyRoundtrip.serialized.includes('"surfaces"'), 'legacy roundtrip serializes surface domain');
  context.assert(diagnosticCodes(legacyRoundtrip).includes(REMOTE_MIGRATION_NATIVE_SURFACE_ROUNDTRIP_CODE), 'legacy roundtrip reports native surface preservation');
  context.assert(nativeRoundtrip.ok === true && nativeRoundtrip.surfaceCount >= 6, 'existing native RMT surface fixture remains roundtrippable');
  context.assert(nativeRoundtrip.comparisonBoundary === 'semantic-normalized-json-with-normalization-metadata-excluded', 'remote roundtrip documents semantic JSON boundary');
}

function runMigrationChecks(context, rootDir) {
  const legacyReportOnly = createRemoteSurfaceMigrationReport(fixtureInput(LEGACY_SURFACE_FIXTURE, rootDir));
  const safeReportOnly = createRemoteSurfaceMigrationReport(fixtureInput(PREVIEW_SURFACE_FIXTURE, rootDir));
  const safePreview = createRemoteSurfaceMigrationReport(fixtureInput(PREVIEW_SURFACE_FIXTURE, rootDir), {
    migrationMode: 'preview'
  });
  const unsafePreview = createRemoteSurfaceMigrationReport(fixtureInput(LEGACY_SURFACE_FIXTURE, rootDir), {
    migrationMode: 'preview'
  });
  const remoteVNext = createRemoteSurfaceMigrationReport(fixtureInput(REMOTE_VNEXT_FIXTURE, rootDir));

  context.assert(legacyReportOnly.schema === RMT_VNEXT_REMOTE_MIGRATION_REPORT_SCHEMA, 'remote migration report uses schema');
  context.assert(legacyReportOnly.ok === true && legacyReportOnly.status === 'ready', 'legacy report-only migration stays compatible');
  context.assert(legacyReportOnly.migrationMode === 'report-only' && legacyReportOnly.authoringPreview === null, 'report-only mode does not emit remote authoring preview');
  context.assert(legacyReportOnly.surfaceCandidates.length === 3, 'legacy fixture inventories native, metadata and manager candidates');
  assertIncludesAll(context, diagnosticCodes(legacyReportOnly), [
    REMOTE_MIGRATION_REPORT_ONLY_CODE,
    REMOTE_MIGRATION_RUNTIME_FACT_CODE,
    REMOTE_MIGRATION_REMOTE_FACT_MISSING_CODE,
    REMOTE_MIGRATION_SURFACE_MANAGER_BOUNDARY_CODE
  ], 'legacy report-only surfaces migration boundaries');
  context.assert(legacyReportOnly.errorCount === 0, 'compatible report-only warnings are not hard errors');
  context.assert(legacyReportOnly.compatibleWarningCodes.every((code) => REMOTE_COMPATIBLE_WARNINGS.includes(code)), 'legacy report exposes compatible warning list');

  context.assert(safeReportOnly.ok === true && diagnosticCodes(safeReportOnly).includes(REMOTE_MIGRATION_REMOTE_PREVIEW_AVAILABLE_CODE), 'safe fixture advertises preview availability in report-only mode');
  context.assert(safePreview.ok === true && safePreview.authoringPreview && safePreview.authoringPreview.schema === RMT_VNEXT_REMOTE_PREVIEW_SCHEMA, 'safe preview emits remote authoring preview');
  context.assert(safePreview.authoringPreview.status === 'ready' && safePreview.authoringPreviewCompileStatus === 'compiled', 'safe preview compiles through remote compiler');
  context.assert(safePreview.authoringPreview.source.includes('remote surface checkout.cart'), 'safe preview contains remote surface authoring');
  context.assert(safePreview.authoringPreview.source.includes('exposes lane critical -> shell.slot "sidebar.cart"'), 'safe preview preserves shell target');

  context.assert(unsafePreview.ok === false && unsafePreview.status === 'blocked', 'unsafe legacy preview blocks migration');
  context.assert(diagnosticCodes(unsafePreview).includes(REMOTE_MIGRATION_PREVIEW_UNSAFE_CODE), 'unsafe preview reports precise preview diagnostic');

  context.assert(remoteVNext.ok === true && remoteVNext.languageMode === 'rmt-vnext-remote', 'remote vNext source remains compatible without migration');
  context.assert(remoteVNext.migrationRequired === false && remoteVNext.remoteSurfaceCount === 1, 'remote vNext source bypasses legacy migration');
}

function runMatrixChecks(context, rootDir) {
  const compatibleInputs = [
    LEGACY_SURFACE_FIXTURE,
    PREVIEW_SURFACE_FIXTURE,
    REMOTE_VNEXT_FIXTURE
  ].map((relativePath) => fixtureInput(relativePath, rootDir));
  const matrix = createRemoteCompatibilityMatrix(compatibleInputs, {
    rootDir
  });
  const blockedMatrix = createRemoteCompatibilityMatrix([
    fixtureInput(LEGACY_SURFACE_FIXTURE, rootDir),
    fixtureInput(PREVIEW_SURFACE_FIXTURE, rootDir)
  ], {
    rootDir,
    migrationMode: 'preview'
  });

  context.assert(matrix.schema === RMT_VNEXT_REMOTE_COMPATIBILITY_SCHEMA, 'remote compatibility matrix uses schema');
  context.assert(matrix.reportSchema === RMT_VNEXT_REMOTE_COMPATIBILITY_REPORT_SCHEMA, 'remote compatibility matrix declares report schema');
  context.assert(matrix.ok === true && matrix.status === 'ready', 'legacy report-only, safe preview source and remote vNext are compatible');
  context.assert(matrix.entryCount === 3 && matrix.compatibleCount === 3 && matrix.blockedCount === 0, 'remote matrix counts compatible entries');
  context.assert(blockedMatrix.ok === false && blockedMatrix.blockedCount === 1, 'remote matrix isolates unsafe preview entries');
}

function runAdapterChecks(context, rootDir) {
  const adapter = createRmtVNextRemoteCompatibilityAdapter({
    readFile: (relativePath) => readText(relativePath, rootDir)
  });
  const matrix = adapter.createCompatibilityMatrix([
    LEGACY_SURFACE_FIXTURE,
    REMOTE_VNEXT_FIXTURE
  ]);
  const serializedA = serializeRemoteMigrationReport(matrix.entries[0].report);
  const serializedB = serializeRemoteMigrationReport(matrix.entries[0].report);

  context.assert(adapter.schema === RMT_VNEXT_REMOTE_COMPATIBILITY_SCHEMA, 'adapter exposes remote compatibility schema');
  context.assert(adapter.previewSchema === RMT_VNEXT_REMOTE_PREVIEW_SCHEMA, 'adapter exposes remote preview schema');
  context.assert(matrix.ok === true && matrix.entryCount === 2, 'adapter builds remote compatibility matrix with default file reader');
  context.assert(serializedA === serializedB && serializedA.includes(RMT_VNEXT_REMOTE_MIGRATION_REPORT_SCHEMA), 'remote migration reports serialize deterministically for agents');
}

function runRmtVNextRemoteCompatibilitySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-vnext-remote-compatibility',
    label: 'Epic 16 RMT vNext Remote Compatibility and Migration'
  });
  const moduleSyntax = syntaxCheckFile(RMT_VNEXT_REMOTE_COMPATIBILITY_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_VNEXT_REMOTE_COMPATIBILITY_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, RMT_VNEXT_REMOTE_COMPATIBILITY_MODULE_PATH, rootDir, 'vNext remote compatibility module exists');
  assertFileExists(context, RMT_VNEXT_REMOTE_COMPATIBILITY_SUITE_PATH, rootDir, 'vNext remote compatibility suite exists');
  assertFileExists(context, RMT_VNEXT_REMOTE_COMPATIBILITY_CONTRACT_PATH, rootDir, 'vNext remote surface migration contract exists');
  assertFileExists(context, RMT_VNEXT_REMOTE_COMPATIBILITY_WP_PATH, rootDir, 'WP-E16-10 workpackage document exists');
  assertFileExists(context, LEGACY_SURFACE_FIXTURE, rootDir, 'legacy remote compatibility fixture exists');
  assertFileExists(context, PREVIEW_SURFACE_FIXTURE, rootDir, 'preview remote compatibility fixture exists');
  assertFileExists(context, NATIVE_SURFACE_FIXTURE, rootDir, 'existing native RMT surface fixture exists');
  assertFileExists(context, REMOTE_VNEXT_FIXTURE, rootDir, 'remote vNext fixture exists');
  context.assert(moduleSyntax.ok, `vNext remote compatibility module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `vNext remote compatibility suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  runMetadataChecks(context, rootDir);
  runRoundtripChecks(context, rootDir);
  runMigrationChecks(context, rootDir);
  runMatrixChecks(context, rootDir);
  runAdapterChecks(context, rootDir);

  return context.result({
    schema: RMT_VNEXT_REMOTE_COMPATIBILITY_REPORT_SCHEMA,
    compatibilitySchema: RMT_VNEXT_REMOTE_COMPATIBILITY_SCHEMA,
    migrationReportSchema: RMT_VNEXT_REMOTE_MIGRATION_REPORT_SCHEMA,
    roundtripReportSchema: RMT_VNEXT_REMOTE_ROUNDTRIP_REPORT_SCHEMA,
    previewSchema: RMT_VNEXT_REMOTE_PREVIEW_SCHEMA,
    workpackage: RMT_VNEXT_REMOTE_COMPATIBILITY_WORKPACKAGE,
    module: RMT_VNEXT_REMOTE_COMPATIBILITY_MODULE_PATH,
    suite: RMT_VNEXT_REMOTE_COMPATIBILITY_SUITE_PATH
  });
}

function printRmtVNextRemoteCompatibilityReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 16 RMT vNext Remote Compatibility und Migration erfolgreich.',
    failureTitle: 'Epic 16 RMT vNext Remote Compatibility und Migration fehlgeschlagen:'
  });
}

module.exports = {
  printRmtVNextRemoteCompatibilityReport,
  runRmtVNextRemoteCompatibilitySuite
};
