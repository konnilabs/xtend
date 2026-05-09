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
  createRmtSourceModel
} = require('../../tools/rmt-language/source-model');
const {
  RMT_LANGUAGE_SERVER_MODULE_PATH,
  RMT_LANGUAGE_SERVER_PACKAGE_SCRIPT,
  RMT_LANGUAGE_SERVER_REPORT_SCHEMA,
  RMT_LANGUAGE_SERVER_SCHEMA,
  RMT_LANGUAGE_SERVER_SUITE_PATH,
  RMT_LANGUAGE_SERVER_WORKPACKAGE,
  SERVER_NAME,
  createRmtLanguageServer
} = require('../../tools/rmt-language-server/server');
const {
  RMT_LANGUAGE_SERVER_PROTOCOL_MODULE_PATH,
  RMT_LANGUAGE_SERVER_PROTOCOL_SCHEMA,
  encodeProtocolMessage,
  parseProtocolMessages
} = require('../../tools/rmt-language-server/protocol');

const EPIC_14_PATH = 'development/EPIC-14-XTendRMT-DSL-Linter-und-Language-Server.md';
const TOOLING_ARCHITECTURE_PATH = 'development/XTendRMT-DSL-Tooling-Architektur.md';
const RMT_LANGUAGE_SERVER_WP_PATH = 'development/WP-E14-09-LSP-Server-MVP-ueber-stdio-bereitstellen.md';
const VALID_FIXTURE_PATH = 'xtendrmt/rmt-first-demo-app.rmt';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function createFixture(rootDir) {
  const filePath = resolveRepoPath(VALID_FIXTURE_PATH, rootDir);
  const text = readText(VALID_FIXTURE_PATH, rootDir);

  return {
    filePath,
    text,
    uri: pathToFileURL(filePath).href
  };
}

function positionForPointer(fixture, pointer) {
  const sourceModel = createRmtSourceModel({
    text: fixture.text,
    filePath: fixture.filePath,
    version: 9
  });
  const pointerRange = sourceModel.findJsonPointerRange(pointer);

  if (!pointerRange) {
    return {
      line: 0,
      character: 0
    };
  }

  return {
    line: pointerRange.range.start.line,
    character: pointerRange.range.start.character + 1
  };
}

function sendRequest(server, id, method, params = {}) {
  return server.handleMessage({
    jsonrpc: '2.0',
    id,
    method,
    params
  })[0];
}

function sendNotification(server, method, params = {}) {
  return server.handleMessage({
    jsonrpc: '2.0',
    method,
    params
  });
}

function findDocumentSymbol(symbols, name) {
  for (const symbol of symbols) {
    if (symbol.name === name) {
      return symbol;
    }

    const child = findDocumentSymbol(symbol.children || [], name);
    if (child) {
      return child;
    }
  }

  return null;
}

function runInitializeAndDocumentSyncChecks(context, rootDir) {
  const fixture = createFixture(rootDir);
  const server = createRmtLanguageServer({ rootDir });
  const initialize = sendRequest(server, 1, 'initialize', {
    rootPath: rootDir
  });
  const openNotifications = sendNotification(server, 'textDocument/didOpen', {
    textDocument: {
      uri: fixture.uri,
      languageId: 'rmt',
      version: 1,
      text: fixture.text
    }
  });
  const diagnostics = openNotifications[0];

  context.assert(server.schema === RMT_LANGUAGE_SERVER_SCHEMA, 'Language Server instance exposes schema');
  context.assert(initialize.result.serverInfo.name === SERVER_NAME, 'Initialize response exposes serverInfo');
  context.assert(initialize.result.capabilities.textDocumentSync.openClose === true, 'Initialize enables open/close sync');
  context.assert(initialize.result.capabilities.textDocumentSync.change === 1, 'Initialize uses full document sync');
  context.assert(initialize.result.capabilities.completionProvider.triggerCharacters.includes('"'), 'Initialize exposes completion trigger characters');
  context.assert(initialize.result.capabilities.hoverProvider === true, 'Initialize enables hoverProvider');
  context.assert(initialize.result.capabilities.documentSymbolProvider === true, 'Initialize enables documentSymbolProvider');
  context.assert(initialize.result.capabilities.definitionProvider === true, 'Initialize enables definitionProvider');
  context.assert(initialize.result.capabilities.codeActionProvider.codeActionKinds.includes('quickfix'), 'Initialize enables quickfix code actions after WP-E14-10');
  context.assert(diagnostics.method === 'textDocument/publishDiagnostics', 'didOpen publishes diagnostics notification');
  context.assert(diagnostics.params.uri === fixture.uri, 'Diagnostics notification targets document URI');
  context.assert(diagnostics.params.diagnostics.every((diagnostic) => diagnostic.severity !== 1), 'Valid fixture publishes no error diagnostics');

  const broken = '{\n  "kind": "rmt_document"\n  "version": "1.0"\n}';
  const changeNotifications = sendNotification(server, 'textDocument/didChange', {
    textDocument: {
      uri: fixture.uri,
      version: 2
    },
    contentChanges: [{
      text: broken
    }]
  });
  const changedDiagnostics = changeNotifications[0].params.diagnostics;

  context.assert(changedDiagnostics.some((diagnostic) => diagnostic.code === 'rmt.syntax.invalid-json'), 'didChange publishes syntax diagnostics for broken source');
  context.assert(changedDiagnostics.some((diagnostic) => diagnostic.severity === 1), 'Broken source diagnostic is mapped to LSP error severity');

  const closeNotifications = sendNotification(server, 'textDocument/didClose', {
    textDocument: {
      uri: fixture.uri
    }
  });

  context.assert(closeNotifications[0].method === 'textDocument/publishDiagnostics', 'didClose publishes cleanup diagnostics notification');
  context.assert(closeNotifications[0].params.diagnostics.length === 0, 'didClose clears diagnostics');
}

function runProviderMappingChecks(context, rootDir) {
  const fixture = createFixture(rootDir);
  const server = createRmtLanguageServer({ rootDir });

  sendRequest(server, 1, 'initialize', { rootPath: rootDir });
  sendNotification(server, 'textDocument/didOpen', {
    textDocument: {
      uri: fixture.uri,
      languageId: 'rmt',
      version: 1,
      text: fixture.text
    }
  });

  const routeComponentPosition = positionForPointer(fixture, '/routes/1/component');
  const componentTagPosition = positionForPointer(fixture, '/components/0/tag');
  const lanePosition = positionForPointer(fixture, '/schedules/0/lane');
  const pointer = server.getPointerAtPosition(fixture.uri, routeComponentPosition);
  const completion = sendRequest(server, 2, 'textDocument/completion', {
    textDocument: { uri: fixture.uri },
    position: routeComponentPosition
  }).result;
  const hover = sendRequest(server, 3, 'textDocument/hover', {
    textDocument: { uri: fixture.uri },
    position: componentTagPosition
  }).result;
  const laneHover = sendRequest(server, 4, 'textDocument/hover', {
    textDocument: { uri: fixture.uri },
    position: lanePosition
  }).result;
  const symbols = sendRequest(server, 5, 'textDocument/documentSymbol', {
    textDocument: { uri: fixture.uri }
  }).result;
  const definition = sendRequest(server, 6, 'textDocument/definition', {
    textDocument: { uri: fixture.uri },
    position: routeComponentPosition
  }).result;
  const unknown = sendRequest(server, 7, 'textDocument/unknown', {}).error;

  context.assert(pointer === '/routes/1/component', 'Language Server maps position to JSON Pointer');
  context.assert(completion.isIncomplete === false, 'Completion response is complete');
  context.assert(completion.items.some((item) => item.label === 'page.settings'), 'Completion maps provider items to LSP CompletionItems');
  context.assert(hover.contents.value.includes('Manifest module: ./xsection.js'), 'Hover maps provider hover to LSP markdown hover');
  context.assert(laneHover.contents.value.includes('Visible rendering work'), 'Hover supports lane values via position mapping');
  context.assert(Array.isArray(symbols) && symbols.some((symbol) => symbol.name === 'components'), 'Document Symbols maps domain symbols to LSP symbols');
  context.assert(findDocumentSymbol(symbols, 'page.settings'), 'Document Symbols includes nested component ID');
  context.assert(definition.uri === fixture.uri, 'Definition maps to same-document LSP Location');
  context.assert(definition.range.start.line >= 0, 'Definition Location contains range');
  context.assert(unknown.code === -32601, 'Unknown request returns JSON-RPC method-not-found error');
}

function runProtocolChecks(context, rootDir) {
  const server = createRmtLanguageServer({ rootDir });
  const initializeMessage = {
    jsonrpc: '2.0',
    id: 100,
    method: 'initialize',
    params: {
      rootPath: rootDir
    }
  };
  const frame = encodeProtocolMessage(initializeMessage);
  const parsed = parseProtocolMessages(frame);
  const firstHalf = frame.slice(0, 16);
  const secondHalf = frame.slice(16);
  const firstResult = server.acceptProtocolData(firstHalf);
  const secondResult = server.acceptProtocolData(secondHalf);

  context.assert(frame.startsWith('Content-Length:'), 'Protocol encoder emits Content-Length frame');
  context.assert(parsed.messages.length === 1, 'Protocol parser decodes one complete message');
  context.assert(parsed.messages[0].method === 'initialize', 'Protocol parser preserves JSON-RPC method');
  context.assert(firstResult.messageCount === 0 && firstResult.restLength > 0, 'Protocol handler buffers partial frames');
  context.assert(secondResult.messageCount === 1, 'Protocol handler consumes buffered frame once complete');
  context.assert(secondResult.outputs[0].id === 100, 'Protocol handler returns initialized response');
  context.assert(secondResult.encodedOutputs[0].startsWith('Content-Length:'), 'Protocol handler re-encodes responses for stdio');
}

function runMetadataChecks(context, rootDir) {
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtLanguageServer;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const epic = readText(EPIC_14_PATH, rootDir);
  const architecture = readText(TOOLING_ARCHITECTURE_PATH, rootDir);

  context.assert(metadata && metadata.schema === RMT_LANGUAGE_SERVER_SCHEMA, 'package metadata declares RMT Language Server schema');
  context.assert(metadata && metadata.reportSchema === RMT_LANGUAGE_SERVER_REPORT_SCHEMA, 'package metadata declares RMT Language Server report schema');
  context.assert(metadata && metadata.protocolSchema === RMT_LANGUAGE_SERVER_PROTOCOL_SCHEMA, 'package metadata declares RMT Language Server protocol schema');
  context.assert(metadata && metadata.workpackage === RMT_LANGUAGE_SERVER_WORKPACKAGE, 'package metadata points to WP-E14-09');
  context.assert(metadata && metadata.module === RMT_LANGUAGE_SERVER_MODULE_PATH, 'package metadata points to LSP server module');
  context.assert(metadata && metadata.protocolModule === RMT_LANGUAGE_SERVER_PROTOCOL_MODULE_PATH, 'package metadata points to protocol module');
  context.assert(metadata && metadata.suite === RMT_LANGUAGE_SERVER_SUITE_PATH, 'package metadata points to LSP suite');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js rmt-language-server --json', 'package metadata declares local gate');
  context.assert(metadata && metadata.packageScript === RMT_LANGUAGE_SERVER_PACKAGE_SCRIPT, 'package metadata declares package script');
  context.assert(metadata && metadata.transport === 'stdio-json-rpc', 'package metadata declares stdio JSON-RPC transport');
  context.assert(metadata && metadata.codeActionProvider === true, 'package metadata enables code actions after WP-E14-10');
  context.assert(packageManifest.exports['./rmt-language-server'] === './tools/rmt-language-server/server.js', 'package exports RMT Language Server');
  context.assert(packageManifest.exports['./rmt-language-server/protocol'] === './tools/rmt-language-server/protocol.js', 'package exports RMT Language Server protocol');
  context.assert(packageManifest.scripts['test:rmt-language-server'] === 'node scripts/run_xtend_tests.js rmt-language-server', 'package exposes rmt-language-server script');
  context.assert(runner.includes("id: 'rmt-language-server'"), 'test runner exposes rmt-language-server suite');
  context.assert(epic.includes('| `WP-E14-09` | P1 | completed | WS5 |'), 'Epic marks WP-E14-09 completed');
  context.assert(epic.includes('WP-E14-10` ist `ready`'), 'Epic hands off WP-E14-10 as ready');
  context.assert(architecture.includes('Implementierungsstand nach `WP-E14-09`'), 'Architecture documents RMT Language Server status');
  context.assert(architecture.includes('xtend.rmt.language-server.v1'), 'Architecture documents RMT Language Server schema');
}

function runRmtLanguageServerSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-language-server',
    label: 'Epic 14 RMT Language Server MVP'
  });
  const serverSyntax = syntaxCheckFile(RMT_LANGUAGE_SERVER_MODULE_PATH, { rootDir, extension: '.js' });
  const protocolSyntax = syntaxCheckFile(RMT_LANGUAGE_SERVER_PROTOCOL_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_LANGUAGE_SERVER_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, RMT_LANGUAGE_SERVER_MODULE_PATH, rootDir, 'RMT Language Server module exists');
  assertFileExists(context, RMT_LANGUAGE_SERVER_PROTOCOL_MODULE_PATH, rootDir, 'RMT Language Server protocol module exists');
  assertFileExists(context, RMT_LANGUAGE_SERVER_SUITE_PATH, rootDir, 'RMT Language Server suite exists');
  assertFileExists(context, RMT_LANGUAGE_SERVER_WP_PATH, rootDir, 'WP-E14-09 workpackage document exists');
  context.assert(serverSyntax.ok, `RMT Language Server module syntax passes${serverSyntax.ok ? '' : ` (${serverSyntax.message})`}`);
  context.assert(protocolSyntax.ok, `RMT Language Server protocol module syntax passes${protocolSyntax.ok ? '' : ` (${protocolSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `RMT Language Server suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  runMetadataChecks(context, rootDir);
  runInitializeAndDocumentSyncChecks(context, rootDir);
  runProviderMappingChecks(context, rootDir);
  runProtocolChecks(context, rootDir);

  return context.result({
    schema: RMT_LANGUAGE_SERVER_REPORT_SCHEMA,
    serverSchema: RMT_LANGUAGE_SERVER_SCHEMA,
    protocolSchema: RMT_LANGUAGE_SERVER_PROTOCOL_SCHEMA,
    workpackage: RMT_LANGUAGE_SERVER_WORKPACKAGE,
    module: RMT_LANGUAGE_SERVER_MODULE_PATH,
    protocolModule: RMT_LANGUAGE_SERVER_PROTOCOL_MODULE_PATH,
    suite: RMT_LANGUAGE_SERVER_SUITE_PATH
  });
}

function printRmtLanguageServerReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 14 RMT Language Server MVP erfolgreich.',
    failureTitle: 'Epic 14 RMT Language Server MVP fehlgeschlagen:'
  });
}

module.exports = {
  printRmtLanguageServerReport,
  runRmtLanguageServerSuite
};
