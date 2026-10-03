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
  RMT_SOURCE_MODEL_MODULE_PATH,
  RMT_SOURCE_MODEL_PACKAGE_SCRIPT,
  RMT_SOURCE_MODEL_REPORT_SCHEMA,
  RMT_SOURCE_MODEL_SCHEMA,
  RMT_SOURCE_MODEL_SUITE_PATH,
  RMT_SOURCE_MODEL_WORKPACKAGE,
  RMT_SYNTAX_ERROR_CODE,
  classifyRmtFile,
  createRmtSourceModel,
  parseJsonPointer
} = require('../../tools/rmt-language/source-model');

const RMT_SOURCE_MODEL_WP_PATH = 'development/WP-E14-02-Native-rmt-Source-Model-und-Range-Mapping-bauen.md';
const EPIC_14_PATH = 'development/EPIC-14-XTendRMT-DSL-Linter-und-Language-Server.md';
const TOOLING_ARCHITECTURE_PATH = 'development/XTendRMT-DSL-Tooling-Architektur.md';
const RMT_FIXTURES = [
  'tests/rmt-language/fixtures/regression-valid.rmt',
  'tests/rmt-language/fixtures/regression-large.rmt',
  'tests/rmt-language/fixtures/regression-duplicates.rmt'
];

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertRangeShape(context, range, message) {
  context.assert(
    range
      && range.start
      && range.end
      && Number.isInteger(range.start.line)
      && Number.isInteger(range.start.character)
      && Number.isInteger(range.end.line)
      && Number.isInteger(range.end.character)
      && Number.isInteger(range.startOffset)
      && Number.isInteger(range.endOffset)
      && range.endOffset >= range.startOffset,
    message
  );
}

function assertOffsetRoundTrip(context, model, offset, label) {
  const position = model.positionAt(offset);
  const roundTripOffset = model.offsetAt(position);

  context.assert(roundTripOffset === offset, `${label} round-trips offset ${offset}`);
}

function runFixtureChecks(context, rootDir, fixturePath) {
  const absolutePath = resolveRepoPath(fixturePath, rootDir);
  const text = readText(fixturePath, rootDir);
  const json = readJson(fixturePath, rootDir);
  const model = createRmtSourceModel({
    filePath: absolutePath,
    text,
    version: 2
  });
  const parsed = model.parseJson();
  const kindRange = model.findJsonPointerRange('/kind');
  const kindKeyRange = model.findJsonPointerRange('/kind', { target: 'key' });
  const documentIdRange = model.findJsonPointerRange('/manifest/documentId');
  const documentIdPropertyRange = model.findJsonPointerRange('/manifest/documentId', { target: 'property' });
  const adapterIdRange = model.findJsonPointerRange('/adapters/0/id');
  const kindTextRange = model.findTextRange('"kind"');

  context.assert(model.schema === RMT_SOURCE_MODEL_SCHEMA, `${fixturePath} declares source-model schema`);
  context.assert(model.workpackage === RMT_SOURCE_MODEL_WORKPACKAGE, `${fixturePath} belongs to WP-E14-02`);
  context.assert(model.uri.startsWith('file://'), `${fixturePath} produces a file URI`);
  context.assert(model.filePolicy.canonical === true, `${fixturePath} is recognized as canonical .rmt`);
  context.assert(model.filePolicy.fallback === false, `${fixturePath} is not treated as fallback`);
  context.assert(model.languageId === 'rmt', `${fixturePath} uses rmt languageId`);
  context.assert(model.snapshotId.includes(model.uri), `${fixturePath} creates a URI-bound snapshot id`);
  context.assert(model.lineCount > 2, `${fixturePath} tracks multiple lines`);
  context.assert(model.getLineStarts()[0] === 0, `${fixturePath} line starts begin at zero`);
  context.assert(parsed.ok === true, `${fixturePath} parses as JSON`);
  context.assert(parsed.value.kind === 'rmt_document', `${fixturePath} preserves document kind`);
  context.assert(parsed.diagnostics.length === 0, `${fixturePath} has no syntax diagnostics`);
  context.assert(json.kind === parsed.value.kind, `${fixturePath} source model matches JSON fixture value`);
  context.assert(kindRange && kindRange.text === '"rmt_document"', `${fixturePath} maps /kind value range`);
  assertRangeShape(context, kindRange && kindRange.range, `${fixturePath} /kind value range has LSP shape`);
  context.assert(kindKeyRange && kindKeyRange.text === '"kind"', `${fixturePath} maps /kind key range`);
  assertRangeShape(context, kindKeyRange && kindKeyRange.range, `${fixturePath} /kind key range has LSP shape`);
  context.assert(
    documentIdRange && documentIdRange.text === JSON.stringify(json.manifest.documentId),
    `${fixturePath} maps /manifest/documentId value range`
  );
  assertRangeShape(
    context,
    documentIdPropertyRange && documentIdPropertyRange.range,
    `${fixturePath} maps /manifest/documentId property range`
  );
  context.assert(
    documentIdPropertyRange && documentIdPropertyRange.text.includes('"documentId"'),
    `${fixturePath} property range contains key`
  );
  context.assert(adapterIdRange && adapterIdRange.text === JSON.stringify(json.adapters[0].id), `${fixturePath} maps /adapters/0/id array range`);
  context.assert(model.findJsonPointerRange('/adapters/999/id') === null, `${fixturePath} returns null for unresolved pointer`);
  assertOffsetRoundTrip(context, model, kindTextRange.startOffset, `${fixturePath} token position`);
  assertOffsetRoundTrip(context, model, documentIdRange.startOffset, `${fixturePath} pointer position`);
  context.assert(model.lineText(kindRange.range.start.line).includes('"kind"'), `${fixturePath} exposes source line text`);
  assertRangeShape(context, model.lineRange(kindRange.range.start.line), `${fixturePath} exposes line range`);
}

function runRmtSourceModelSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-source-model',
    label: 'Epic 14 RMT Source Model and Range Mapping'
  });
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtSourceModel;
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const epic = readText(EPIC_14_PATH, rootDir);
  const architecture = readText(TOOLING_ARCHITECTURE_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(RMT_SOURCE_MODEL_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_SOURCE_MODEL_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, RMT_SOURCE_MODEL_MODULE_PATH, rootDir, 'RMT Source Model module exists');
  assertFileExists(context, RMT_SOURCE_MODEL_SUITE_PATH, rootDir, 'RMT Source Model suite exists');
  assertFileExists(context, RMT_SOURCE_MODEL_WP_PATH, rootDir, 'WP-E14-02 workpackage document exists');
  context.assert(moduleSyntax.ok, `RMT Source Model module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `RMT Source Model suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(metadata && metadata.schema === RMT_SOURCE_MODEL_SCHEMA, 'package metadata declares RMT Source Model schema');
  context.assert(metadata && metadata.reportSchema === RMT_SOURCE_MODEL_REPORT_SCHEMA, 'package metadata declares RMT Source Model report schema');
  context.assert(metadata && metadata.workpackage === RMT_SOURCE_MODEL_WORKPACKAGE, 'package metadata points to WP-E14-02');
  context.assert(metadata && metadata.module === RMT_SOURCE_MODEL_MODULE_PATH, 'package metadata points to source model module');
  context.assert(metadata && metadata.suite === RMT_SOURCE_MODEL_SUITE_PATH, 'package metadata points to source model suite');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js rmt-source-model --json', 'package metadata declares local gate');
  context.assert(metadata && metadata.packageScript === RMT_SOURCE_MODEL_PACKAGE_SCRIPT, 'package metadata declares package script');
  context.assert(runner.hasSuite("rmt-source-model"), 'test runner exposes rmt-source-model suite');
  context.assert(epic.includes('| `WP-E14-02` | P0 | completed | WS1 |'), 'Epic marks WP-E14-02 completed');
  context.assert(epic.includes('WP-E14-03` ist `ready`'), 'Epic hands off WP-E14-03 as ready');
  context.assert(architecture.includes('JSON Pointer zu Ranges mappen'), 'Architecture keeps JSON Pointer range duty visible');
  context.assert(architecture.includes('Dirty-Dokumente fuer LSP'), 'Architecture keeps dirty document duty visible');
  context.assert(parseJsonPointer('/a~1b/tilde~0key').join('/') === 'a/b/tilde~key', 'JSON Pointer decoder handles escaped slash and tilde');

  context.assert(classifyRmtFile('app.rmt').canonical === true, 'file policy accepts .rmt as canonical');
  context.assert(classifyRmtFile('app.rmt.json').fallback === true, 'file policy keeps .rmt.json as fallback');
  context.assert(classifyRmtFile('app.json').diagnosticCode === 'rmt.document.extension.fallback-used', 'file policy marks .json fallback diagnostic');

  RMT_FIXTURES.forEach((fixturePath) => {
    runFixtureChecks(context, rootDir, fixturePath);
  });

  const crlfText = '{\r\n  "kind": "rmt_document"\r\n}\r\n';
  const crlfModel = createRmtSourceModel({
    uri: 'file:///virtual/crlf.rmt',
    text: crlfText,
    version: 7
  });
  const kindOffset = crlfText.indexOf('"kind"');

  context.assert(crlfModel.offsetAt({ line: 1, character: 2 }) === kindOffset, 'CRLF offsetAt maps line/character to stable offset');
  context.assert(crlfModel.positionAt(kindOffset).line === 1, 'CRLF positionAt keeps line stable');
  context.assert(crlfModel.positionAt(kindOffset).character === 2, 'CRLF positionAt keeps character stable');
  context.assert(crlfModel.snapshotId.includes('@7:'), 'dirty document snapshot keeps version');

  const pointerText = '{\n  "a/b": {\n    "tilde~key": "ok"\n  }\n}';
  const pointerModel = createRmtSourceModel({
    uri: 'file:///virtual/pointer.rmt',
    text: pointerText
  });
  const escapedPointerRange = pointerModel.findJsonPointerRange('/a~1b/tilde~0key');

  context.assert(escapedPointerRange && escapedPointerRange.text === '"ok"', 'escaped JSON Pointer maps to nested value');
  assertRangeShape(context, escapedPointerRange && escapedPointerRange.range, 'escaped JSON Pointer returns stable range');

  const invalidModel = createRmtSourceModel({
    uri: 'file:///virtual/broken.rmt',
    text: '{\n  "kind": "rmt_document"\n  "version": "1.0"\n}'
  });
  const invalidParse = invalidModel.parseJson();
  const syntaxDiagnostic = invalidParse.diagnostics[0];

  context.assert(invalidParse.ok === false, 'invalid .rmt returns parse failure instead of throwing');
  context.assert(syntaxDiagnostic && syntaxDiagnostic.code === RMT_SYNTAX_ERROR_CODE, 'invalid .rmt emits syntax diagnostic code');
  context.assert(syntaxDiagnostic && syntaxDiagnostic.severity === 'error', 'invalid .rmt emits error severity');
  assertRangeShape(context, syntaxDiagnostic && syntaxDiagnostic.range, 'syntax diagnostic contains stable LSP range');
  context.assert(syntaxDiagnostic && syntaxDiagnostic.range.start.line >= 1, 'syntax diagnostic maps error to usable line');

  return context.result({
    schema: RMT_SOURCE_MODEL_REPORT_SCHEMA,
    workpackage: RMT_SOURCE_MODEL_WORKPACKAGE,
    fixtureCount: RMT_FIXTURES.length,
    module: RMT_SOURCE_MODEL_MODULE_PATH,
    suite: RMT_SOURCE_MODEL_SUITE_PATH
  });
}

function printRmtSourceModelReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 14 RMT Source Model and Range Mapping erfolgreich.',
    failureTitle: 'Epic 14 RMT Source Model and Range Mapping fehlgeschlagen:'
  });
}

module.exports = {
  printRmtSourceModelReport,
  runRmtSourceModelSuite
};
