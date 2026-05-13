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
  compileRmtVNextSource
} = require('../../tools/rmt-language/vnext-compiler');
const {
  DEFAULT_FUZZ_MUTATIONS,
  RMT_VNEXT_BROWSER_SMOKE_FIXTURE_PATH,
  RMT_VNEXT_BROWSER_SMOKE_SCHEMA,
  RMT_VNEXT_FIXTURE_MATRIX_PATH,
  RMT_VNEXT_FIXTURE_MATRIX_SCHEMA,
  RMT_VNEXT_FUZZ_REPORT_SCHEMA,
  RMT_VNEXT_GOLDEN_REPORT_SCHEMA,
  RMT_VNEXT_REGRESSION_MODULE_PATH,
  RMT_VNEXT_REGRESSION_PACKAGE_SCRIPT,
  RMT_VNEXT_REGRESSION_REPORT_SCHEMA,
  RMT_VNEXT_REGRESSION_SCHEMA,
  RMT_VNEXT_REGRESSION_SUITE_PATH,
  RMT_VNEXT_REGRESSION_WORKPACKAGE,
  createBrowserSmokeProbe,
  createRmtVNextRegressionAdapter
} = require('../../tools/rmt-language/vnext-regression');

const EPIC_15_PATH = 'development/EPIC_E15_RMT_vNext_Syntax.md';
const REGRESSION_CONTRACT_PATH = 'development/XTendRMT-vNext-Fixture-Regression-Gate-Contract.md';
const WP_E15_17_PATH = 'development/WP-E15-17-Fixtures-Compiler-Golden-Tests-Fuzzing-und-Browser-Smokes-erweitern.md';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function createAdapter(rootDir) {
  return createRmtVNextRegressionAdapter({
    readFile: (relativePath) => readText(relativePath, rootDir)
  });
}

function runMetadataChecks(context, rootDir) {
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtVNextRegression;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const epic = readText(EPIC_15_PATH, rootDir);
  const contract = readText(REGRESSION_CONTRACT_PATH, rootDir);
  const workpackage = readText(WP_E15_17_PATH, rootDir);
  const browserSuite = readText('tests/browser/browser_smoke_suite.js', rootDir);

  context.assert(metadata && metadata.schema === RMT_VNEXT_REGRESSION_SCHEMA, 'package metadata declares vNext regression schema');
  context.assert(metadata && metadata.reportSchema === RMT_VNEXT_REGRESSION_REPORT_SCHEMA, 'package metadata declares vNext regression report schema');
  context.assert(metadata && metadata.fixtureMatrixSchema === RMT_VNEXT_FIXTURE_MATRIX_SCHEMA, 'package metadata declares fixture matrix schema');
  context.assert(metadata && metadata.goldenReportSchema === RMT_VNEXT_GOLDEN_REPORT_SCHEMA, 'package metadata declares golden report schema');
  context.assert(metadata && metadata.fuzzReportSchema === RMT_VNEXT_FUZZ_REPORT_SCHEMA, 'package metadata declares fuzz report schema');
  context.assert(metadata && metadata.browserSmokeSchema === RMT_VNEXT_BROWSER_SMOKE_SCHEMA, 'package metadata declares browser smoke schema');
  context.assert(metadata && metadata.workpackage === RMT_VNEXT_REGRESSION_WORKPACKAGE, 'package metadata declares WP-E15-17 ownership');
  context.assert(metadata && metadata.module === RMT_VNEXT_REGRESSION_MODULE_PATH, 'package metadata points to vNext regression module');
  context.assert(metadata && metadata.suite === RMT_VNEXT_REGRESSION_SUITE_PATH, 'package metadata points to vNext regression suite');
  context.assert(metadata && metadata.fixtureMatrix === RMT_VNEXT_FIXTURE_MATRIX_PATH, 'package metadata points to fixture matrix');
  context.assert(metadata && metadata.browserSmoke === RMT_VNEXT_BROWSER_SMOKE_FIXTURE_PATH, 'package metadata points to browser smoke fixture');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js rmt-vnext-regression --json', 'package metadata declares vNext regression gate');
  context.assert(metadata && metadata.packageScript === RMT_VNEXT_REGRESSION_PACKAGE_SCRIPT, 'package metadata declares package script');
  context.assert((typeof packageManifest.exports['./rmt-language/vnext-regression'] === 'string' ? packageManifest.exports['./rmt-language/vnext-regression'] : packageManifest.exports['./rmt-language/vnext-regression'] && packageManifest.exports['./rmt-language/vnext-regression'].default) === './tools/rmt-language/vnext-regression.js', 'package exports vNext regression adapter');
  context.assert(packageManifest.scripts['test:rmt-vnext-regression'] === 'node scripts/run_xtend_tests.js rmt-vnext-regression', 'package exposes vNext regression script');
  context.assert(runner.includes("id: 'rmt-vnext-regression'"), 'test runner exposes rmt-vnext-regression suite');
  context.assert(epic.includes('| `WP-E15-17` | P2 | completed | WS6 |'), 'Epic marks WP-E15-17 completed');
  context.assert(epic.includes('| `WP-E15-18` | P2 | completed | WS6 |'), 'Epic keeps WP-E15-18 completed after regression gate');
  context.assert(contract.includes(RMT_VNEXT_REGRESSION_SCHEMA), 'regression contract declares gate schema');
  context.assert(contract.includes(RMT_VNEXT_FIXTURE_MATRIX_SCHEMA), 'regression contract declares fixture matrix schema');
  context.assert(workpackage.includes('Status: `completed`'), 'WP-E15-17 document is completed');
  context.assert(browserSuite.includes(RMT_VNEXT_BROWSER_SMOKE_FIXTURE_PATH), 'browser smoke harness knows vNext reference fixture');
}

function runFixtureMatrixChecks(context, rootDir, matrix, report) {
  context.assert(matrix.schema === RMT_VNEXT_FIXTURE_MATRIX_SCHEMA, 'fixture matrix uses schema');
  context.assert(Array.isArray(matrix.positive) && matrix.positive.length >= 10, 'fixture matrix covers positive vNext language domains');
  context.assert(Array.isArray(matrix.negative) && matrix.negative.length >= 3, 'fixture matrix covers negative syntax fixtures');
  context.assert(report.fixtureMatrix.ok === true, 'fixture matrix report passes');
  context.assert(report.fixtureMatrix.positiveCount === matrix.positive.length, 'fixture matrix reports all positive fixtures');
  context.assert(report.fixtureMatrix.negativeCount === matrix.negative.length, 'fixture matrix reports all negative fixtures');
  context.assert(report.fixtureMatrix.golden.schema === RMT_VNEXT_GOLDEN_REPORT_SCHEMA, 'golden compiler report uses schema');
  context.assert(report.fixtureMatrix.golden.entries.every((entry) => entry.hashMatches), 'all golden compiler hashes match');
  context.assert(report.fixtureMatrix.golden.entries.every((entry) => entry.coreSchema === 'xtend.rmt.core-format.vnext.v1'), 'all golden compiler entries emit vNext core schema');
  context.assert(report.fixtureMatrix.negative.entries.every((entry) => entry.ok && entry.actualDiagnosticCodes.length > 0), 'all negative fixtures fail with diagnostics');
}

function runFuzzChecks(context, matrix, report) {
  context.assert(report.fuzz.schema === RMT_VNEXT_FUZZ_REPORT_SCHEMA, 'parser fuzz report uses schema');
  context.assert(report.fuzz.ok === true, 'parser fuzz report passes');
  context.assert(report.fuzz.seedCount === matrix.fuzzSeeds.length, 'parser fuzz covers configured seeds');
  context.assert(report.fuzz.mutationCount === DEFAULT_FUZZ_MUTATIONS.length, 'parser fuzz covers default mutation set');
  context.assert(report.fuzz.entryCount === matrix.fuzzSeeds.length * DEFAULT_FUZZ_MUTATIONS.length, 'parser fuzz produces full seed x mutation matrix');
  context.assert(report.fuzz.entries.every((entry) => entry.status === 'recovered'), 'parser fuzz mutants recover with diagnostics');
  context.assert(report.fuzz.entries.every((entry) => entry.rangesAvailable), 'parser fuzz diagnostics keep ranges');
}

function runBrowserProbeChecks(context, rootDir, matrix, report) {
  const html = readText(RMT_VNEXT_BROWSER_SMOKE_FIXTURE_PATH, rootDir);
  const streamingEntry = matrix.positive.find((entry) => entry.id === matrix.browserSmoke.sourceFixtureId);
  const compileResult = compileRmtVNextSource({
    text: readText(streamingEntry.path, rootDir),
    filePath: resolveRepoPath(streamingEntry.path, rootDir)
  });
  const probe = createBrowserSmokeProbe(compileResult.coreDocument, {
    resultKey: matrix.browserSmoke.resultKey
  });

  context.assert(report.browserSmoke.schema === RMT_VNEXT_BROWSER_SMOKE_SCHEMA, 'browser reference report uses schema');
  context.assert(report.browserSmoke.ok === true, 'browser reference report passes');
  context.assert(probe.ok === true, 'compiled vNext core produces passing browser smoke probe');
  context.assert(html.includes('data-rmt-vnext-smoke="wp-e15-17"'), 'browser smoke fixture exposes WP-E15-17 marker');
  context.assert(html.includes(matrix.browserSmoke.resultKey), 'browser smoke fixture exposes result key');
  context.assert(!html.includes('https://cdn.ccs-networks.de'), 'browser smoke fixture has no external CDN dependency');
  matrix.browserSmoke.expectedChecks.forEach((check) => {
    context.assert(html.includes(`recordCheck('${check}'`), `browser smoke fixture records ${check}`);
    context.assert(probe.checks.some((entry) => entry.name === check && entry.ok), `browser smoke probe verifies ${check}`);
  });
}

function runAdapterChecks(context, report) {
  context.assert(report.schema === RMT_VNEXT_REGRESSION_REPORT_SCHEMA, 'regression report uses schema');
  context.assert(report.gateSchema === RMT_VNEXT_REGRESSION_SCHEMA, 'regression report declares gate schema');
  context.assert(report.workpackage === RMT_VNEXT_REGRESSION_WORKPACKAGE, 'regression report declares WP-E15-17');
  context.assert(report.ok === true && report.status === 'passed', 'regression report passes end to end');
}

function runRmtVNextRegressionSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-vnext-regression',
    label: 'Epic 15 RMT vNext Fixture Regression Gate'
  });
  const moduleSyntax = syntaxCheckFile(RMT_VNEXT_REGRESSION_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_VNEXT_REGRESSION_SUITE_PATH, { rootDir, extension: '.js' });
  const matrix = readJson(RMT_VNEXT_FIXTURE_MATRIX_PATH, rootDir);
  const adapter = createAdapter(rootDir);
  const report = adapter.createRegressionReport(matrix);

  assertFileExists(context, RMT_VNEXT_REGRESSION_MODULE_PATH, rootDir, 'vNext regression module exists');
  assertFileExists(context, RMT_VNEXT_REGRESSION_SUITE_PATH, rootDir, 'vNext regression suite exists');
  assertFileExists(context, RMT_VNEXT_FIXTURE_MATRIX_PATH, rootDir, 'vNext fixture matrix exists');
  assertFileExists(context, RMT_VNEXT_BROWSER_SMOKE_FIXTURE_PATH, rootDir, 'vNext browser reference smoke fixture exists');
  assertFileExists(context, REGRESSION_CONTRACT_PATH, rootDir, 'vNext regression contract document exists');
  assertFileExists(context, WP_E15_17_PATH, rootDir, 'WP-E15-17 workpackage document exists');
  context.assert(moduleSyntax.ok, `vNext regression module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `vNext regression suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  runMetadataChecks(context, rootDir);
  runFixtureMatrixChecks(context, rootDir, matrix, report);
  runFuzzChecks(context, matrix, report);
  runBrowserProbeChecks(context, rootDir, matrix, report);
  runAdapterChecks(context, report);

  return context.result({
    schema: RMT_VNEXT_REGRESSION_REPORT_SCHEMA,
    gateSchema: RMT_VNEXT_REGRESSION_SCHEMA,
    fixtureMatrixSchema: RMT_VNEXT_FIXTURE_MATRIX_SCHEMA,
    fuzzReportSchema: RMT_VNEXT_FUZZ_REPORT_SCHEMA,
    browserSmokeSchema: RMT_VNEXT_BROWSER_SMOKE_SCHEMA,
    workpackage: RMT_VNEXT_REGRESSION_WORKPACKAGE,
    module: RMT_VNEXT_REGRESSION_MODULE_PATH,
    suite: RMT_VNEXT_REGRESSION_SUITE_PATH
  });
}

function printRmtVNextRegressionReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 15 RMT vNext Fixture Regression Gate erfolgreich.',
    failureTitle: 'Epic 15 RMT vNext Fixture Regression Gate fehlgeschlagen:'
  });
}

module.exports = {
  printRmtVNextRegressionReport,
  runRmtVNextRegressionSuite
};
