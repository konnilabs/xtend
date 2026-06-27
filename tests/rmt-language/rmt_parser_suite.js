const fs = require('fs');
const path = require('path');
const os = require('os');
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
  RMT_FILE_FALLBACK_CODE,
  RMT_PARSER_MODULE_PATH,
  RMT_PARSER_PACKAGE_SCRIPT,
  RMT_PARSER_REPORT_SCHEMA,
  RMT_PARSER_SCHEMA,
  RMT_PARSER_SUITE_PATH,
  RMT_PARSER_WORKPACKAGE,
  createRmtParser,
  parseRmtSource
} = require('../../tools/rmt-language/parser');
const {
  RMT_FORMAT_ADAPTER_MODULE_PATH,
  RMT_FORMAT_ADAPTER_SCHEMA,
  RMT_FORMAT_ADAPTER_UNAVAILABLE_CODE,
  RMT_FORMAT_NORMALIZATION_ERROR_CODE,
  createRmtFormatAdapter,
  loadRmtCoreFormatFactory,
  parseAndNormalizeRmtSource,
  resolveCoreArtifactPath
} = require('../../tools/rmt-language/format-adapter');
const {
  RMT_SYNTAX_ERROR_CODE
} = require('../../tools/rmt-language/source-model');

const RMT_PARSER_WP_PATH = 'development/WP-E14-03-Parser-und-Format-Adapter-an-createRmtFormat-anbinden.md';
const EPIC_14_PATH = 'development/EPIC-14-XTendRMT-DSL-Linter-und-Language-Server.md';
const TOOLING_ARCHITECTURE_PATH = 'development/XTendRMT-DSL-Tooling-Architektur.md';
const VALID_FIXTURES = [
  'tests/rmt-language/fixtures/regression-valid.rmt',
  'tests/rmt-language/fixtures/regression-large.rmt',
  'tests/rmt-language/fixtures/regression-duplicates.rmt'
];

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertDiagnosticRange(context, diagnostic, message) {
  context.assert(
    diagnostic
      && diagnostic.range
      && diagnostic.range.start
      && diagnostic.range.end
      && Number.isInteger(diagnostic.range.start.line)
      && Number.isInteger(diagnostic.range.start.character)
      && Number.isInteger(diagnostic.range.end.line)
      && Number.isInteger(diagnostic.range.end.character),
    message
  );
}

function runValidFixtureChecks(context, rootDir, fixturePath) {
  const text = readText(fixturePath, rootDir);
  const fixture = readJson(fixturePath, rootDir);
  const result = parseAndNormalizeRmtSource({
    text,
    filePath: resolveRepoPath(fixturePath, rootDir),
    version: 3
  }, {
    rootDir
  });

  context.assert(result.schema === RMT_FORMAT_ADAPTER_SCHEMA, `${fixturePath} emits format adapter schema`);
  context.assert(result.ok === true, `${fixturePath} normalizes successfully`);
  context.assert(result.phase === 'normalize', `${fixturePath} reaches normalize phase`);
  context.assert(result.status === 'normalized', `${fixturePath} reports normalized status`);
  context.assert(result.normalizedBy === 'createRmtFormat().parseDocument', `${fixturePath} is normalized via createRmtFormat().parseDocument`);
  context.assert(result.parserResult.schema === RMT_PARSER_SCHEMA, `${fixturePath} preserves parser result`);
  context.assert(result.rawDocument.kind === 'rmt_document', `${fixturePath} parser returns raw document`);
  context.assert(result.normalizedDocument.kind === 'rmt_document', `${fixturePath} normalized document has RMT kind`);
  context.assert(result.normalizedDocument.manifest.documentId === fixture.manifest.documentId, `${fixturePath} preserves manifest documentId`);
  context.assert(result.normalizedDocument.manifest.sourceUrl === result.sourceModel.uri, `${fixturePath} passes sourceUrl to RMT format`);
  context.assert(result.formatDiagnostics.length === 0, `${fixturePath} has no format diagnostics`);
  context.assert(result.diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length === 0, `${fixturePath} has no error diagnostics`);
}

function runRmtParserSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-parser',
    label: 'Epic 14 RMT Parser and Format Adapter'
  });
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtParserFormatAdapter;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const epic = readText(EPIC_14_PATH, rootDir);
  const architecture = readText(TOOLING_ARCHITECTURE_PATH, rootDir);
  const parserSyntax = syntaxCheckFile(RMT_PARSER_MODULE_PATH, { rootDir, extension: '.js' });
  const adapterSyntax = syntaxCheckFile(RMT_FORMAT_ADAPTER_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_PARSER_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, RMT_PARSER_MODULE_PATH, rootDir, 'RMT parser module exists');
  assertFileExists(context, RMT_FORMAT_ADAPTER_MODULE_PATH, rootDir, 'RMT format adapter module exists');
  assertFileExists(context, RMT_PARSER_SUITE_PATH, rootDir, 'RMT parser suite exists');
  assertFileExists(context, RMT_PARSER_WP_PATH, rootDir, 'WP-E14-03 workpackage document exists');
  context.assert(parserSyntax.ok, `RMT parser module syntax passes${parserSyntax.ok ? '' : ` (${parserSyntax.message})`}`);
  context.assert(adapterSyntax.ok, `RMT format adapter module syntax passes${adapterSyntax.ok ? '' : ` (${adapterSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `RMT parser suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(metadata && metadata.schema === RMT_PARSER_SCHEMA, 'package metadata declares RMT parser schema');
  context.assert(metadata && metadata.formatAdapterSchema === RMT_FORMAT_ADAPTER_SCHEMA, 'package metadata declares format adapter schema');
  context.assert(metadata && metadata.reportSchema === RMT_PARSER_REPORT_SCHEMA, 'package metadata declares parser report schema');
  context.assert(metadata && metadata.workpackage === RMT_PARSER_WORKPACKAGE, 'package metadata points to WP-E14-03');
  context.assert(metadata && metadata.parserModule === RMT_PARSER_MODULE_PATH, 'package metadata points to parser module');
  context.assert(metadata && metadata.formatAdapterModule === RMT_FORMAT_ADAPTER_MODULE_PATH, 'package metadata points to format adapter module');
  context.assert(metadata && metadata.suite === RMT_PARSER_SUITE_PATH, 'package metadata points to parser suite');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js rmt-parser --json', 'package metadata declares local gate');
  context.assert(metadata && metadata.packageScript === RMT_PARSER_PACKAGE_SCRIPT, 'package metadata declares package script');
  context.assert(Array.isArray(packageManifest.files) && packageManifest.files.includes('tools'), 'package files include RMT language tooling');
  context.assert((typeof packageManifest.exports['./rmt-language/source-model'] === 'string' ? packageManifest.exports['./rmt-language/source-model'] : packageManifest.exports['./rmt-language/source-model'] && packageManifest.exports['./rmt-language/source-model'].default) === './tools/rmt-language/source-model.js', 'package exports RMT Source Model');
  context.assert((typeof packageManifest.exports['./rmt-language/parser'] === 'string' ? packageManifest.exports['./rmt-language/parser'] : packageManifest.exports['./rmt-language/parser'] && packageManifest.exports['./rmt-language/parser'].default) === './tools/rmt-language/parser.js', 'package exports RMT Parser');
  context.assert((typeof packageManifest.exports['./rmt-language/format-adapter'] === 'string' ? packageManifest.exports['./rmt-language/format-adapter'] : packageManifest.exports['./rmt-language/format-adapter'] && packageManifest.exports['./rmt-language/format-adapter'].default) === './tools/rmt-language/format-adapter.js', 'package exports RMT Format Adapter');
  context.assert(runner.includes("id: 'rmt-parser'"), 'test runner exposes rmt-parser suite');
  context.assert(epic.includes('| `WP-E14-03` | P0 | completed | WS1 |'), 'Epic marks WP-E14-03 completed');
  context.assert(epic.includes('WP-E14-04` ist `ready`'), 'Epic hands off WP-E14-04 as ready');
  context.assert(architecture.includes('Parser- und Format-Adapter'), 'Architecture keeps parser and format adapter layer visible');
  context.assert(architecture.includes('createRmtFormat().parseDocument'), 'Architecture keeps createRmtFormat parseDocument as source of truth');

  VALID_FIXTURES.forEach((fixturePath) => {
    runValidFixtureChecks(context, rootDir, fixturePath);
  });

  const parser = createRmtParser();
  const fallbackText = readText('tests/rmt-language/fixtures/regression-valid.rmt', rootDir);
  const fallbackResult = parser.parseSource({
    text: fallbackText,
    filePath: resolveRepoPath('tests/fixtures/legacy-example.rmt.json', rootDir)
  });
  const fallbackDiagnostic = fallbackResult.diagnostics.find((diagnostic) => diagnostic.code === RMT_FILE_FALLBACK_CODE);

  context.assert(fallbackResult.ok === true, '.rmt.json fallback remains parseable');
  context.assert(fallbackDiagnostic && fallbackDiagnostic.severity === 'warning', '.rmt.json fallback emits warning diagnostic');
  assertDiagnosticRange(context, fallbackDiagnostic, '.rmt.json fallback diagnostic has range');

  const jsonFallbackResult = parseRmtSource({
    text: fallbackText,
    filePath: resolveRepoPath('tests/fixtures/legacy-example.json', rootDir)
  });
  context.assert(
    jsonFallbackResult.diagnostics.some((diagnostic) => diagnostic.code === RMT_FILE_FALLBACK_CODE),
    '.json fallback emits fallback diagnostic'
  );

  let parseDocumentCalls = 0;
  const spyAdapter = createRmtFormatAdapter({
    createRmtFormat: () => ({
      parseDocument(sourceText, formatOptions = {}) {
        parseDocumentCalls += 1;
        return {
          kind: 'rmt_document',
          manifest: {
            documentId: 'spy.document',
            sourceUrl: formatOptions.sourceUrl
          },
          templates: []
        };
      }
    })
  });
  const spyResult = spyAdapter.parseAndNormalizeSource({
    text: '{"kind":"rmt_document","manifest":{"documentId":"spy.document"},"templates":[]}',
    uri: 'file:///virtual/spy.rmt'
  });

  context.assert(spyResult.ok === true, 'injected format adapter can normalize valid source');
  context.assert(parseDocumentCalls === 1, 'format adapter calls createRmtFormat().parseDocument exactly once');
  context.assert(spyResult.normalizedDocument.manifest.sourceUrl === 'file:///virtual/spy.rmt', 'format adapter forwards sourceUrl to parseDocument');

  let shouldNotCallFormat = false;
  const invalidSyntaxResult = createRmtFormatAdapter({
    createRmtFormat: () => ({
      parseDocument() {
        shouldNotCallFormat = true;
        return {};
      }
    })
  }).parseAndNormalizeSource({
    text: '{\n  "kind": "rmt_document"\n  "version": "1.0"\n}',
    uri: 'file:///virtual/broken.rmt'
  });
  const syntaxDiagnostic = invalidSyntaxResult.diagnostics.find((diagnostic) => diagnostic.code === RMT_SYNTAX_ERROR_CODE);

  context.assert(invalidSyntaxResult.ok === false, 'invalid JSON returns failed parser result');
  context.assert(invalidSyntaxResult.phase === 'syntax', 'invalid JSON remains in syntax phase');
  context.assert(shouldNotCallFormat === false, 'syntax failures do not call RMT format adapter');
  context.assert(syntaxDiagnostic && syntaxDiagnostic.severity === 'error', 'syntax failure emits syntax diagnostic');
  assertDiagnosticRange(context, syntaxDiagnostic, 'syntax diagnostic keeps usable range');

  const normalizationFailure = createRmtFormatAdapter({
    createRmtFormat: () => ({
      parseDocument() {
        throw new Error('normalization exploded');
      }
    })
  }).parseAndNormalizeSource({
    text: '{"kind":"rmt_document","manifest":{"documentId":"failing.document"},"templates":[]}',
    uri: 'file:///virtual/failing.rmt'
  });
  const normalizationDiagnostic = normalizationFailure.diagnostics.find((diagnostic) => diagnostic.code === RMT_FORMAT_NORMALIZATION_ERROR_CODE);

  context.assert(normalizationFailure.ok === false, 'format normalization failure returns failed result');
  context.assert(normalizationFailure.phase === 'format', 'format normalization failure is separated from syntax phase');
  context.assert(normalizationFailure.status === 'normalization_error', 'format normalization failure reports normalization_error');
  context.assert(normalizationDiagnostic && normalizationDiagnostic.message.includes('normalization exploded'), 'normalization diagnostic keeps error message');
  assertDiagnosticRange(context, normalizationDiagnostic, 'normalization diagnostic has fallback range');

  const unavailableResult = createRmtFormatAdapter({
    createRmtFormat: () => {
      throw new Error('format factory unavailable');
    }
  }).parseAndNormalizeSource({
    text: '{"kind":"rmt_document","manifest":{"documentId":"unavailable.document"},"templates":[]}',
    uri: 'file:///virtual/unavailable.rmt'
  });
  const unavailableDiagnostic = unavailableResult.diagnostics.find((diagnostic) => diagnostic.code === RMT_FORMAT_ADAPTER_UNAVAILABLE_CODE);

  context.assert(unavailableResult.ok === false, 'unavailable format adapter returns failed result');
  context.assert(unavailableResult.status === 'format_adapter_unavailable', 'unavailable format adapter status is explicit');
  context.assert(unavailableDiagnostic && unavailableDiagnostic.message.includes('format factory unavailable'), 'unavailable diagnostic keeps error message');
  assertDiagnosticRange(context, unavailableDiagnostic, 'unavailable format diagnostic has fallback range');

  const maliciousRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-rmt-malicious-root-'));
  const markerPath = path.join(maliciousRoot, 'rmt-core-executed');
  fs.mkdirSync(path.join(maliciousRoot, 'xtendrmt'), { recursive: true });
  fs.writeFileSync(
    path.join(maliciousRoot, 'xtendrmt', 'rmt-core.esm.js'),
    `console.log.constructor('return process')().getBuiltinModule('fs').writeFileSync(${JSON.stringify(markerPath)}, 'executed');
    globalThis.AppModules = { createRmtFormat: () => ({ parseDocument: (document) => document }) };
    export default {};`,
    'utf8'
  );
  const maliciousRootResult = parseAndNormalizeRmtSource({
    text: readText('tests/rmt-language/fixtures/regression-valid.rmt', rootDir),
    filePath: resolveRepoPath('tests/rmt-language/fixtures/regression-valid.rmt', rootDir),
    version: 4
  }, {
    rootDir: maliciousRoot
  });

  context.assert(maliciousRootResult.ok === true, 'workspace root still normalizes through trusted package RMT core');
  context.assert(fs.existsSync(markerPath) === false, 'workspace RMT core artifact is not executed by tooling');
  context.assert(resolveCoreArtifactPath({ rootDir: maliciousRoot }) === path.join(rootDir, 'xtendrmt/rmt-core.esm.js'), 'core artifact resolves from trusted package root');

  const coreFactory = loadRmtCoreFormatFactory({ rootDir });
  const coreFormat = coreFactory();
  context.assert(typeof coreFormat.parseDocument === 'function', 'RMT core factory exposes parseDocument');
  context.assert(typeof coreFormat.normalizeDocument === 'function', 'RMT core factory exposes normalizeDocument');

  return context.result({
    schema: RMT_PARSER_REPORT_SCHEMA,
    parserSchema: RMT_PARSER_SCHEMA,
    formatAdapterSchema: RMT_FORMAT_ADAPTER_SCHEMA,
    workpackage: RMT_PARSER_WORKPACKAGE,
    fixtureCount: VALID_FIXTURES.length,
    parserModule: RMT_PARSER_MODULE_PATH,
    formatAdapterModule: RMT_FORMAT_ADAPTER_MODULE_PATH,
    suite: RMT_PARSER_SUITE_PATH
  });
}

function printRmtParserReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 14 RMT Parser and Format Adapter erfolgreich.',
    failureTitle: 'Epic 14 RMT Parser and Format Adapter fehlgeschlagen:'
  });
}

module.exports = {
  printRmtParserReport,
  runRmtParserSuite
};
