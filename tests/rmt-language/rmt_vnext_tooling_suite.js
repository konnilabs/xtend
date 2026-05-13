const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
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
  lintRmtSource
} = require('../../tools/rmt-language/diagnostics');
const {
  createRmtSnippetCatalog,
  createVsCodeSnippetDocument
} = require('../../tools/rmt-language/snippets');
const {
  createRmtLanguageServer
} = require('../../tools/rmt-language-server/server');
const {
  runRmtLinterCli
} = require('../../tools/rmt-linter/cli');
const {
  createRmtAgentRepairReportForFiles
} = require('../../tools/rmt-linter/reporter');
const {
  RMT_VNEXT_TOOLING_FORMATTER_SCHEMA,
  RMT_VNEXT_TOOLING_MODULE_PATH,
  RMT_VNEXT_TOOLING_PACKAGE_SCRIPT,
  RMT_VNEXT_TOOLING_REPORT_SCHEMA,
  RMT_VNEXT_TOOLING_SCHEMA,
  RMT_VNEXT_TOOLING_SUITE_PATH,
  RMT_VNEXT_TOOLING_WORKPACKAGE,
  VNEXT_SNIPPETS,
  analyzeRmtVNextToolingSource,
  createRmtVNextToolingAdapter,
  formatRmtVNextSource,
  getRmtVNextToolingCompletions,
  getRmtVNextToolingDefinition,
  getRmtVNextToolingDocumentSymbols,
  getRmtVNextToolingHover,
  isLikelyRmtVNextSource,
  lintRmtVNextToolingSource
} = require('../../tools/rmt-language/vnext-tooling');

const EPIC_15_PATH = 'development/EPIC_E15_RMT_vNext_Syntax.md';
const TOOLING_CONTRACT_PATH = 'development/XTendRMT-vNext-Tooling-Adapter-Contract.md';
const WP_E15_15_PATH = 'development/WP-E15-15-Tooling-Update-fuer-Linter-LSP-Formatter-und-Snippets-bauen.md';
const VALID_VNEXT_FIXTURE = 'tests/rmt-language/fixtures/vnext-streaming-progressive.rmt';
const INVALID_VNEXT_FIXTURE = 'tests/rmt-language/fixtures/vnext-invalid-condition-call.rmt';
const LEGACY_FIXTURE = 'tests/rmt-language/fixtures/regression-valid.rmt';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function createMemoryStream() {
  const chunks = [];
  return {
    write(chunk) {
      chunks.push(String(chunk));
    },
    toString() {
      return chunks.join('');
    }
  };
}

function fixtureInput(relativePath, rootDir) {
  return {
    text: readText(relativePath, rootDir),
    filePath: resolveRepoPath(relativePath, rootDir),
    version: 15
  };
}

function openVNextInServer(rootDir) {
  const input = fixtureInput(VALID_VNEXT_FIXTURE, rootDir);
  const uri = pathToFileURL(input.filePath).href;
  const server = createRmtLanguageServer({ rootDir });

  server.handleMessage({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: { rootPath: rootDir }
  });
  const notifications = server.handleMessage({
    jsonrpc: '2.0',
    method: 'textDocument/didOpen',
    params: {
      textDocument: {
        uri,
        languageId: 'rmt',
        version: 1,
        text: input.text
      }
    }
  });

  return {
    server,
    uri,
    input,
    notifications,
    analysis: server.analyzeDocument(uri)
  };
}

function runMetadataChecks(context, rootDir) {
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtVNextTooling;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const epic = readText(EPIC_15_PATH, rootDir);
  const contract = readText(TOOLING_CONTRACT_PATH, rootDir);
  const workpackage = readText(WP_E15_15_PATH, rootDir);

  context.assert(metadata && metadata.schema === RMT_VNEXT_TOOLING_SCHEMA, 'package metadata declares vNext tooling schema');
  context.assert(metadata && metadata.reportSchema === RMT_VNEXT_TOOLING_REPORT_SCHEMA, 'package metadata declares vNext tooling report schema');
  context.assert(metadata && metadata.formatterSchema === RMT_VNEXT_TOOLING_FORMATTER_SCHEMA, 'package metadata declares vNext formatter schema');
  context.assert(metadata && metadata.workpackage === RMT_VNEXT_TOOLING_WORKPACKAGE, 'package metadata points to WP-E15-15');
  context.assert(metadata && metadata.module === RMT_VNEXT_TOOLING_MODULE_PATH, 'package metadata points to vNext tooling module');
  context.assert(metadata && metadata.suite === RMT_VNEXT_TOOLING_SUITE_PATH, 'package metadata points to vNext tooling suite');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js rmt-vnext-tooling --json', 'package metadata declares vNext tooling local gate');
  context.assert(metadata && metadata.packageScript === RMT_VNEXT_TOOLING_PACKAGE_SCRIPT, 'package metadata declares vNext tooling package script');
  context.assert((typeof packageManifest.exports['./rmt-language/vnext-tooling'] === 'string' ? packageManifest.exports['./rmt-language/vnext-tooling'] : packageManifest.exports['./rmt-language/vnext-tooling'] && packageManifest.exports['./rmt-language/vnext-tooling'].default) === './tools/rmt-language/vnext-tooling.js', 'package exports vNext tooling adapter');
  context.assert(packageManifest.scripts['test:rmt-vnext-tooling'] === 'node scripts/run_xtend_tests.js rmt-vnext-tooling', 'package exposes vNext tooling script');
  context.assert(runner.includes("id: 'rmt-vnext-tooling'"), 'test runner exposes rmt-vnext-tooling suite');
  context.assert(epic.includes('| `WP-E15-15` | P1 | completed | WS5 |'), 'Epic marks WP-E15-15 completed');
  context.assert(epic.includes('| `WP-E15-16` | P2 | completed | WS5 |'), 'Epic keeps WP-E15-16 completed after tooling');
  context.assert(contract.includes('schema: "xtend.rmt.vnext-tooling-adapter.v1"'), 'Tooling contract document declares schema');
  context.assert(workpackage.includes('vNext-faehige RMT-Language-Schicht'), 'Workpackage documents vNext language layer');
}

function runLinterAndCliChecks(context, rootDir) {
  const valid = fixtureInput(VALID_VNEXT_FIXTURE, rootDir);
  const invalid = fixtureInput(INVALID_VNEXT_FIXTURE, rootDir);
  const legacy = fixtureInput(LEGACY_FIXTURE, rootDir);
  const analysis = analyzeRmtVNextToolingSource(valid, { rootDir });
  const directReport = lintRmtVNextToolingSource(valid, { rootDir, analysis });
  const routedReport = lintRmtSource(valid, { rootDir });
  const invalidReport = lintRmtSource(invalid, { rootDir });
  const legacyReport = lintRmtSource(legacy, { rootDir });
  const stdout = createMemoryStream();
  const stderr = createMemoryStream();
  const exitCode = runRmtLinterCli(['lint', VALID_VNEXT_FIXTURE, '--json'], {
    stdout,
    stderr,
    rootDir
  });
  const cliReport = JSON.parse(stdout.toString());

  context.assert(isLikelyRmtVNextSource(valid) === true, 'vNext detector recognizes native fixture');
  context.assert(isLikelyRmtVNextSource(legacy) === false, 'vNext detector leaves legacy JSON fixture alone');
  context.assert(analysis.schema === RMT_VNEXT_TOOLING_SCHEMA, 'vNext analysis emits tooling schema');
  context.assert(analysis.ok === true && analysis.graphStatus === 'indexed', 'vNext analysis indexes valid fixture');
  context.assert(analysis.sourceMapSummary.totalCount > 20, 'vNext analysis exposes source map summary');
  context.assert(directReport.status === 'passed' && directReport.languageMode === 'vnext', 'direct vNext linter passes valid fixture');
  context.assert(routedReport.status === 'passed' && routedReport.languageMode === 'vnext', 'generic linter routes vNext fixture');
  context.assert(invalidReport.status === 'failed' && invalidReport.languageMode === 'vnext', 'generic linter routes invalid vNext fixture');
  context.assert(invalidReport.diagnostics.some((diagnostic) => diagnostic.code === 'rmt.vnext.syntax.error'), 'invalid vNext fixture emits vNext syntax diagnostic');
  context.assert(legacyReport.status === 'passed' && legacyReport.graphStatus === 'indexed', 'legacy fixture remains on indexed legacy graph path');
  context.assert(exitCode === 0, 'CLI accepts valid vNext fixture');
  context.assert(stderr.toString() === '', 'CLI vNext JSON mode keeps stderr empty');
  context.assert(cliReport.files === 1 && cliReport.status === 'passed', 'CLI emits one-file vNext pass report');
}

function runProviderChecks(context, rootDir) {
  const input = fixtureInput(VALID_VNEXT_FIXTURE, rootDir);
  const analysis = analyzeRmtVNextToolingSource(input, { rootDir });
  const operationPointer = '/operations/2';
  const sourcePointer = '/operations/2/source/ref';
  const sourceRange = analysis.sourceMap.find((entry) => entry.corePointer === operationPointer).range;
  const completions = getRmtVNextToolingCompletions(input, {
    rootDir,
    analysis,
    pointer: '/operations/2/source'
  });
  const keywordCompletions = getRmtVNextToolingCompletions(input, {
    rootDir,
    analysis,
    context: 'vnext-keywords'
  });
  const hover = getRmtVNextToolingHover(input, {
    rootDir,
    analysis,
    pointer: operationPointer
  });
  const symbols = getRmtVNextToolingDocumentSymbols(input, {
    rootDir,
    analysis
  });
  const definition = getRmtVNextToolingDefinition(input, {
    rootDir,
    analysis,
    pointer: sourcePointer
  });

  context.assert(analysis.findPointerAtPosition({ line: sourceRange.start.line, character: sourceRange.start.character + 2 }) === operationPointer, 'vNext source map maps position to operation pointer');
  context.assert(completions.items.some((item) => item.label === 'sse'), 'vNext completion exposes source kinds');
  context.assert(keywordCompletions.items.some((item) => item.label === 'stream'), 'vNext completion exposes stream keyword');
  context.assert(hover.status === 'found' && hover.hover.markdown.includes('stream hero-fragments'), 'vNext hover explains stream operation');
  context.assert(symbols.symbols.some((symbol) => symbol.name === 'operations'), 'vNext document symbols expose operations namespace');
  context.assert(symbols.symbols.some((symbol) => symbol.children.some((child) => child.name === 'hero-fragments')), 'vNext document symbols include stream target');
  context.assert(definition.status === 'resolved' && definition.target.domain === 'dataSources', 'vNext definition resolves operation source to data source');
}

function runLanguageServerChecks(context, rootDir) {
  const opened = openVNextInServer(rootDir);
  const operationRange = opened.analysis.graph.sourceMap.find((entry) => entry.corePointer === '/operations/2').range;
  const position = {
    line: operationRange.start.line,
    character: operationRange.start.character + 2
  };
  const completion = opened.server.handleMessage({
    jsonrpc: '2.0',
    id: 2,
    method: 'textDocument/completion',
    params: {
      textDocument: { uri: opened.uri },
      position,
      xtend: { pointer: '/operations/2/source' }
    }
  })[0].result;
  const hover = opened.server.handleMessage({
    jsonrpc: '2.0',
    id: 3,
    method: 'textDocument/hover',
    params: {
      textDocument: { uri: opened.uri },
      position
    }
  })[0].result;
  const symbols = opened.server.handleMessage({
    jsonrpc: '2.0',
    id: 4,
    method: 'textDocument/documentSymbol',
    params: {
      textDocument: { uri: opened.uri }
    }
  })[0].result;
  const definition = opened.server.handleMessage({
    jsonrpc: '2.0',
    id: 5,
    method: 'textDocument/definition',
    params: {
      textDocument: { uri: opened.uri },
      position,
      xtend: { pointer: '/operations/2/source/ref' }
    }
  })[0].result;

  context.assert(opened.notifications[0].params.diagnostics.length === 0, 'LSP publishes no diagnostics for valid vNext fixture');
  context.assert(opened.analysis.languageMode === 'vnext', 'LSP analysis marks vNext language mode');
  context.assert(completion.items.some((item) => item.label === 'worker'), 'LSP completion maps vNext source kind');
  context.assert(hover.contents.value.includes('Operation: hero-fragments'), 'LSP hover maps vNext operation hover');
  context.assert(symbols.some((symbol) => symbol.name === 'operations'), 'LSP document symbols map vNext operations');
  context.assert(definition && definition.range.start.line >= 0, 'LSP definition maps vNext data source location');
}

function runFormatterSnippetAndAgentChecks(context, rootDir) {
  const input = fixtureInput(VALID_VNEXT_FIXTURE, rootDir);
  const formatted = formatRmtVNextSource({
    ...input,
    text: `${input.text}  `
  }, {
    rootDir
  });
  const adapter = createRmtVNextToolingAdapter({ rootDir });
  const catalog = createRmtSnippetCatalog({ rootDir });
  const generatedSnippets = createVsCodeSnippetDocument({ rootDir });
  const staticSnippets = readJson('tools/rmt-language/snippets/rmt.code-snippets', rootDir);
  const packagedSnippets = readJson('tools/rmt-editor/vscode/snippets/rmt.code-snippets', rootDir);
  const agentReport = createRmtAgentRepairReportForFiles([resolveRepoPath(VALID_VNEXT_FIXTURE, rootDir)], {
    rootDir
  });

  context.assert(formatted.schema === RMT_VNEXT_TOOLING_FORMATTER_SCHEMA, 'formatter emits vNext formatter schema');
  context.assert(formatted.ok === true && formatted.changed === true, 'formatter normalizes trailing whitespace');
  context.assert(formatted.text.endsWith('\n') && !formatted.text.endsWith('  \n'), 'formatter keeps final newline without trailing blanks');
  context.assert(adapter.schema === RMT_VNEXT_TOOLING_SCHEMA, 'tooling adapter factory exposes schema');
  context.assert(adapter.lint(input).status === 'passed', 'tooling adapter factory can lint');
  context.assert(VNEXT_SNIPPETS.length >= 3, 'vNext tooling exports snippet patterns');
  context.assert(catalog.snippets.some((snippet) => snippet.id === 'rmt-vnext-template'), 'snippet catalog includes vNext template snippet');
  context.assert(generatedSnippets['RMT vNext Stream'].prefix === 'rmt-vnext-stream', 'generated VS Code snippets include vNext stream prefix');
  context.assert(staticSnippets['RMT vNext Stream'].prefix === generatedSnippets['RMT vNext Stream'].prefix, 'static source snippets include vNext stream prefix');
  context.assert(packagedSnippets['RMT vNext Stream'].prefix === generatedSnippets['RMT vNext Stream'].prefix, 'packaged VS Code snippets include vNext stream prefix');
  context.assert(agentReport.fileReports[0].languageMode === 'vnext', 'agent report marks vNext language mode');
  context.assert(agentReport.fileReports[0].sourceMapSummary.totalCount > 20, 'agent report exposes vNext source map summary');
}

function runRmtVNextToolingSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-vnext-tooling',
    label: 'Epic 15 RMT vNext Tooling Adapter'
  });
  const moduleSyntax = syntaxCheckFile(RMT_VNEXT_TOOLING_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_VNEXT_TOOLING_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, RMT_VNEXT_TOOLING_MODULE_PATH, rootDir, 'vNext tooling module exists');
  assertFileExists(context, RMT_VNEXT_TOOLING_SUITE_PATH, rootDir, 'vNext tooling suite exists');
  assertFileExists(context, WP_E15_15_PATH, rootDir, 'WP-E15-15 workpackage document exists');
  assertFileExists(context, TOOLING_CONTRACT_PATH, rootDir, 'vNext tooling contract document exists');
  assertFileExists(context, VALID_VNEXT_FIXTURE, rootDir, 'vNext tooling valid fixture exists');
  context.assert(moduleSyntax.ok, `vNext tooling module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `vNext tooling suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  runMetadataChecks(context, rootDir);
  runLinterAndCliChecks(context, rootDir);
  runProviderChecks(context, rootDir);
  runLanguageServerChecks(context, rootDir);
  runFormatterSnippetAndAgentChecks(context, rootDir);

  return context.result({
    schema: RMT_VNEXT_TOOLING_REPORT_SCHEMA,
    toolingSchema: RMT_VNEXT_TOOLING_SCHEMA,
    formatterSchema: RMT_VNEXT_TOOLING_FORMATTER_SCHEMA,
    workpackage: RMT_VNEXT_TOOLING_WORKPACKAGE,
    module: RMT_VNEXT_TOOLING_MODULE_PATH,
    suite: RMT_VNEXT_TOOLING_SUITE_PATH
  });
}

function printRmtVNextToolingReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 15 RMT vNext Tooling Adapter erfolgreich.',
    failureTitle: 'Epic 15 RMT vNext Tooling Adapter fehlgeschlagen:'
  });
}

module.exports = {
  printRmtVNextToolingReport,
  runRmtVNextToolingSuite
};
