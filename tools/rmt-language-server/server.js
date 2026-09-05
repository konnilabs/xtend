#!/usr/bin/env node

const path = require('path');
const { fileURLToPath } = require('url');
const { createProjectIndex } = require('../project-index');
const {
  createRmtSourceModel
} = require('../rmt-language/source-model');
const {
  getRmtCompletions
} = require('../rmt-language/completions');
const {
  getRmtHover
} = require('../rmt-language/hover');
const {
  getRmtCodeActions
} = require('../rmt-language/code-actions');
const {
  createRmtVNextPrimitiveCommandHandoff,
  findRmtVNextPointerAtPosition,
  getRmtVNextToolingCodeActions,
  getRmtVNextToolingCompletions,
  getRmtVNextToolingHover,
  RMT_VNEXT_PRIMITIVE_KERNEL_BOUNDARY_COMMAND
} = require('../rmt-language/vnext-tooling');
const {
  createJsonRpcError,
  createJsonRpcNotification,
  createJsonRpcResponse,
  encodeProtocolMessage,
  parseProtocolMessages,
  toLspCompletionItem,
  toLspCodeAction,
  toLspDiagnostic,
  toLspHover
} = require('./protocol');

const RMT_LANGUAGE_SERVER_SCHEMA = 'xtend.rmt.language-server.v1';
const RMT_LANGUAGE_SERVER_REPORT_SCHEMA = 'xtend.rmt.language-server-report.v1';
const RMT_LANGUAGE_SERVER_MODULE_PATH = 'tools/rmt-language-server/server.js';
const RMT_LANGUAGE_SERVER_SUITE_PATH = 'tests/rmt-language/rmt_language_server_suite.js';
const RMT_LANGUAGE_SERVER_PACKAGE_SCRIPT = 'npm run test:rmt-language-server';
const RMT_LANGUAGE_SERVER_WORKPACKAGE = 'WP-E14-09';
const SERVER_NAME = 'xtend-rmt-language-server';
const SERVER_VERSION = '0.1.0-rc.1';

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function escapeJsonPointerSegment(segment) {
  return String(segment).replace(/~/g, '~0').replace(/\//g, '~1');
}

function joinPointer(base, segment) {
  const escaped = escapeJsonPointerSegment(segment);

  return base ? `${base}/${escaped}` : `/${escaped}`;
}

function enumerateJsonPointers(value, basePointer = '') {
  const pointers = [];

  if (value && typeof value === 'object') {
    Object.keys(value).forEach((key) => {
      const pointer = joinPointer(basePointer, key);
      pointers.push(pointer);
      pointers.push(...enumerateJsonPointers(value[key], pointer));
    });
  }

  return pointers;
}

function comparePositions(a = {}, b = {}) {
  if (a.line !== b.line) {
    return a.line - b.line;
  }

  return a.character - b.character;
}

function containsPosition(range, position) {
  if (!range || !range.start || !range.end) {
    return false;
  }

  return comparePositions(position, range.start) >= 0 && comparePositions(position, range.end) <= 0;
}

function rangeSpan(range) {
  if (!range) {
    return Number.MAX_SAFE_INTEGER;
  }

  if (Number.isInteger(range.startOffset) && Number.isInteger(range.endOffset)) {
    return Math.max(0, range.endOffset - range.startOffset);
  }

  return ((range.end.line - range.start.line) * 10000) + (range.end.character - range.start.character);
}

function createDocumentInput(document) {
  return {
    text: document.text,
    uri: document.uri,
    filePath: document.filePath || null,
    version: document.version || 0,
    languageId: document.languageId || 'rmt'
  };
}

function uriToFilePath(uri) {
  if (!uri || !uri.startsWith('file://')) {
    return null;
  }

  try {
    return fileURLToPath(uri);
  } catch (error) {
    return null;
  }
}

function applyTextChange(document, change) {
  if (!change || typeof change.text !== 'string') {
    return document.text;
  }

  if (!change.range) {
    return change.text;
  }

  const sourceModel = createRmtSourceModel(createDocumentInput(document));
  const start = sourceModel.offsetAt(change.range.start);
  const end = sourceModel.offsetAt(change.range.end);

  return `${document.text.slice(0, start)}${change.text}${document.text.slice(end)}`;
}

function createCapabilities() {
  return {
    textDocumentSync: {
      openClose: true,
      change: 1
    },
    completionProvider: {
      resolveProvider: false,
      triggerCharacters: ['"', '/', '.', '-', ':']
    },
    hoverProvider: true,
    documentSymbolProvider: true,
    definitionProvider: true,
    referencesProvider: true,
    workspaceSymbolProvider: true,
    workspace: { workspaceFolders: { supported: true, changeNotifications: true } },
    codeActionProvider: {
      codeActionKinds: ['quickfix', 'source.fixAll', 'source.fixAll.rmt.vnext.primitives']
    },
    executeCommandProvider: {
      commands: [RMT_VNEXT_PRIMITIVE_KERNEL_BOUNDARY_COMMAND]
    }
  };
}

class RmtLanguageServer {
  constructor(options = {}) {
    this.schema = RMT_LANGUAGE_SERVER_SCHEMA;
    this.reportSchema = RMT_LANGUAGE_SERVER_REPORT_SCHEMA;
    this.workpackage = RMT_LANGUAGE_SERVER_WORKPACKAGE;
    this.rootDir = options.rootDir || process.cwd();
    this.projectIndex = createProjectIndex({ rootDir: this.rootDir, workspaceRoots: options.workspaceRoots, profile: 'rmt' });
    this.documents = this.projectIndex.overlays;
    this.protocolBuffer = Buffer.alloc(0);
    this.shutdownRequested = false;
    this.exitRequested = false;
  }

  initialize(params = {}) {
    if (params.rootUri && params.rootUri.startsWith('file://')) {
      this.rootDir = uriToFilePath(params.rootUri) || this.rootDir;
    } else if (params.rootPath) {
      this.rootDir = path.resolve(params.rootPath);
    }

    const roots = toArray(params.workspaceFolders).map(folder => uriToFilePath(folder.uri)).filter(Boolean);
    this.projectIndex.dispose();
    this.projectIndex = createProjectIndex({ rootDir: this.rootDir, workspaceRoots: params.workspaceFolders ? roots : undefined, profile: 'rmt' });
    this.documents = this.projectIndex.overlays;

    return {
      capabilities: createCapabilities(),
      serverInfo: {
        name: SERVER_NAME,
        version: SERVER_VERSION
      },
      xtend: {
        schema: RMT_LANGUAGE_SERVER_SCHEMA,
        workpackage: RMT_LANGUAGE_SERVER_WORKPACKAGE,
        boundary: 'no-rmt-kernel-import-of-xtend-types',
        transport: 'stdio-json-rpc',
        languageId: 'rmt'
      }
    };
  }

  openDocument(params = {}) {
    const textDocument = params.textDocument || {};
    const uri = normalizeString(textDocument.uri);

    if (!uri) {
      return [];
    }

    const accepted = this.projectIndex.updateDocument({
      uri,
      filePath: uriToFilePath(uri),
      languageId: textDocument.languageId || 'rmt',
      version: Number.isInteger(textDocument.version) ? textDocument.version : 0,
      text: String(textDocument.text || '')
    });
    if (!accepted) return [];

    return [this.createDiagnosticsNotification(uri)];
  }

  changeDocument(params = {}) {
    const uri = normalizeString(params.textDocument && params.textDocument.uri);
    const document = this.documents.get(uri);

    if (!uri || !document) {
      return [];
    }

    if (Number.isInteger(params.textDocument.version) && params.textDocument.version <= document.version) return [];
    let text = document.text;
    toArray(params.contentChanges).forEach((change) => {
      text = applyTextChange({
        ...document,
        text
      }, change);
    });

    this.projectIndex.updateDocument({
      ...document,
      version: Number.isInteger(params.textDocument.version) ? params.textDocument.version : document.version + 1,
      text
    });


    return [this.createDiagnosticsNotification(uri)];
  }

  closeDocument(params = {}) {
    const uri = normalizeString(params.textDocument && params.textDocument.uri);

    if (!uri) {
      return [];
    }

    this.projectIndex.closeDocument(uri);

    return [createJsonRpcNotification('textDocument/publishDiagnostics', {
      uri,
      diagnostics: []
    })];
  }

  getDocument(uri) {
    return this.documents.get(uri) || null;
  }

  analyzeDocument(uri) {
    return this.projectIndex.getAnalysis(uri);
  }

  createDiagnosticsNotification(uri) {
    const analysis = this.analyzeDocument(uri);
    const diagnostics = analysis
      ? toArray(analysis.linterReport.diagnostics).map(toLspDiagnostic)
      : [];

    return createJsonRpcNotification('textDocument/publishDiagnostics', {
      uri,
      version: analysis && analysis.document ? analysis.document.version : undefined,
      diagnostics
    });
  }

  getPointerAtPosition(uri, position = {}) {
    const analysis = this.analyzeDocument(uri);

    if (!analysis || !analysis.graph || !analysis.graph.sourceModel || analysis.graph.status === 'source_unavailable') {
      return null;
    }

    if (analysis.languageMode === 'vnext') {
      return findRmtVNextPointerAtPosition(analysis.graph, position);
    }

    const { graph } = analysis;
    const sourceModel = graph.sourceModel;
    const pointers = enumerateJsonPointers(graph.sourceDocument || {});
    const candidates = [];

    pointers.forEach((pointer) => {
      ['value', 'key', 'property'].forEach((target) => {
        const pointerRange = sourceModel.findJsonPointerRange(pointer, { target });

        if (pointerRange && containsPosition(pointerRange.range, position)) {
          candidates.push({
            pointer,
            target,
            span: rangeSpan(pointerRange.range)
          });
        }
      });
    });

    candidates.sort((a, b) => {
      const spanDiff = a.span - b.span;

      if (spanDiff !== 0) {
        return spanDiff;
      }

      const targetOrder = { value: 0, key: 1, property: 2 };
      return (targetOrder[a.target] || 9) - (targetOrder[b.target] || 9);
    });

    return candidates[0] ? candidates[0].pointer : null;
  }

  completion(params = {}) {
    const uri = normalizeString(params.textDocument && params.textDocument.uri);
    const analysis = this.analyzeDocument(uri);
    const xtend = params.xtend || {};

    if (!analysis) {
      return {
        isIncomplete: false,
        items: []
      };
    }

    const pointer = xtend.pointer
      ? xtend.pointer
      : this.getPointerAtPosition(uri, params.position || {});
    const report = analysis.languageMode === 'vnext'
      ? getRmtVNextToolingCompletions(analysis.input, {
        rootDir: this.rootDir,
        analysis: analysis.graph,
        pointer: xtend.pointer || null,
        prefix: xtend.prefix || '',
        context: xtend.context || null,
        position: params.position || null
      })
      : getRmtCompletions(analysis.input, {
        rootDir: this.rootDir,
        graph: analysis.graph,
        pointer,
        prefix: xtend.prefix || ''
      });

    return {
      isIncomplete: false,
      items: toArray(report.items).map(toLspCompletionItem)
    };
  }

  hover(params = {}) {
    const uri = normalizeString(params.textDocument && params.textDocument.uri);
    const analysis = this.analyzeDocument(uri);

    if (!analysis) {
      return null;
    }

    const pointer = params.xtend && params.xtend.pointer
      ? params.xtend.pointer
      : this.getPointerAtPosition(uri, params.position || {});
    const report = analysis.languageMode === 'vnext'
      ? getRmtVNextToolingHover(analysis.input, {
        rootDir: this.rootDir,
        analysis: analysis.graph,
        pointer
      })
      : getRmtHover(analysis.input, {
        rootDir: this.rootDir,
        graph: analysis.graph,
        pointer
      });

    return toLspHover(report);
  }

  documentSymbols(params = {}) {
    const uri = normalizeString(params.textDocument && params.textDocument.uri);
    const groups = new Map();
    for (const symbol of this.projectIndex.searchSymbols('', { uri })) {
      if (!groups.has(symbol.domain)) groups.set(symbol.domain, []);
      groups.get(symbol.domain).push({ name: symbol.name, kind: 13,
        range: symbol.definition.range, selectionRange: symbol.nameLocation.range });
    }
    return [...groups].map(([name, children]) => ({ name, kind: 3,
      range: { start: children.reduce((p, item) => item.range.start.line < p.line ? item.range.start : p, children[0].range.start),
        end: children.reduce((p, item) => item.range.end.line > p.line ? item.range.end : p, children[0].range.end) },
      selectionRange: children[0].selectionRange, children }));
  }

  definition(params = {}) {
    const locations = this.projectIndex.definitions({ uri: params.textDocument && params.textDocument.uri,
      position: params.position, pointer: params.xtend && params.xtend.pointer });
    return locations.length === 1 ? locations[0] : locations.length ? locations : null;
  }

  references(params = {}) {
    return this.projectIndex.references({ uri: params.textDocument && params.textDocument.uri,
      position: params.position, includeDeclaration: params.context && params.context.includeDeclaration });
  }

  workspaceSymbols(params = {}) {
    return this.projectIndex.searchSymbols(params.query || '').map(symbol => ({ name: symbol.name,
      kind: 13, location: symbol.nameLocation, containerName: `${symbol.projectId} / ${symbol.scope.join(' / ')}` }));
  }

  watchedFiles(params = {}) {
    for (const change of params.changes || []) {
      if (change.type === 3 && !this.documents.has(change.uri)) this.projectIndex.removeDocument(change.uri);
      else this.projectIndex.refreshDocument(change.uri);
    }
    // Discovery also refreshes package/config boundaries and imported globs.
    this.projectIndex.build();
    return [];
  }

  workspaceFolders(params = {}) {
    const removed = new Set((params.event && params.event.removed || []).map(folder => uriToFilePath(folder.uri)));
    const roots = this.projectIndex.roots.filter(root => !removed.has(root)).concat((params.event && params.event.added || []).map(folder => uriToFilePath(folder.uri)).filter(Boolean));
    const overlays = [...this.documents.values()];
    this.projectIndex.dispose();
    this.projectIndex = createProjectIndex({ rootDir: this.rootDir, workspaceRoots: roots, profile: 'rmt' });
    this.documents = this.projectIndex.overlays;
    overlays.forEach(document => this.projectIndex.updateDocument(document));
    return [];
  }

  codeAction(params = {}) {
    const uri = normalizeString(params.textDocument && params.textDocument.uri);
    const analysis = this.analyzeDocument(uri);

    if (!analysis) {
      return [];
    }

    const report = analysis.languageMode === 'vnext'
      ? getRmtVNextToolingCodeActions(analysis.input, {
        rootDir: this.rootDir,
        analysis: analysis.graph,
        lintReport: analysis.linterReport,
        contextDiagnostics: params.context && params.context.diagnostics ? params.context.diagnostics : []
      })
      : getRmtCodeActions(analysis.input, {
        rootDir: this.rootDir,
        graph: analysis.graph,
        lintReport: analysis.linterReport,
        contextDiagnostics: params.context && params.context.diagnostics ? params.context.diagnostics : []
      });

    return toArray(report.actions).map(toLspCodeAction);
  }

  executeCommand(params = {}) {
    const command = normalizeString(params.command);
    const args = toArray(params.arguments);

    if (command === RMT_VNEXT_PRIMITIVE_KERNEL_BOUNDARY_COMMAND) {
      return createRmtVNextPrimitiveCommandHandoff({
        command,
        arguments: args
      }, {
        rootDir: this.rootDir
      });
    }

    return {
      schema: 'xtend.rmt.language-server-command-result.v1',
      workpackage: RMT_LANGUAGE_SERVER_WORKPACKAGE,
      status: 'unsupported_command',
      ok: false,
      command,
      supportedCommands: [RMT_VNEXT_PRIMITIVE_KERNEL_BOUNDARY_COMMAND]
    };
  }

  handleRequest(message = {}) {
    try {
      switch (message.method) {
        case 'initialize':
          return createJsonRpcResponse(message.id, this.initialize(message.params || {}));
        case 'shutdown':
          this.shutdownRequested = true;
          return createJsonRpcResponse(message.id, null);
        case 'textDocument/completion':
          return createJsonRpcResponse(message.id, this.completion(message.params || {}));
        case 'textDocument/hover':
          return createJsonRpcResponse(message.id, this.hover(message.params || {}));
        case 'textDocument/documentSymbol':
          return createJsonRpcResponse(message.id, this.documentSymbols(message.params || {}));
        case 'workspace/symbol':
          return createJsonRpcResponse(message.id, this.workspaceSymbols(message.params || {}));
        case 'textDocument/references':
          return createJsonRpcResponse(message.id, this.references(message.params || {}));
        case 'textDocument/definition':
          return createJsonRpcResponse(message.id, this.definition(message.params || {}));
        case 'textDocument/codeAction':
          return createJsonRpcResponse(message.id, this.codeAction(message.params || {}));
        case 'workspace/executeCommand':
          return createJsonRpcResponse(message.id, this.executeCommand(message.params || {}));
        default:
          return createJsonRpcError(message.id, -32601, `RMT Language Server method not found: ${message.method}`);
      }
    } catch (error) {
      return createJsonRpcError(message.id, -32603, error && error.message ? error.message : String(error));
    }
  }

  handleNotification(message = {}) {
    switch (message.method) {
      case 'initialized':
        return [];
      case 'exit':
        this.exitRequested = true;
        return [];
      case 'textDocument/didOpen':
        return this.openDocument(message.params || {});
      case 'textDocument/didChange':
        return this.changeDocument(message.params || {});
      case 'workspace/didChangeWatchedFiles':
        return this.watchedFiles(message.params || {});
      case 'workspace/didChangeWorkspaceFolders':
        return this.workspaceFolders(message.params || {});
      case 'textDocument/didClose':
        return this.closeDocument(message.params || {});
      default:
        return [];
    }
  }

  handleMessage(message = {}) {
    if (Object.prototype.hasOwnProperty.call(message, 'id')) {
      return [this.handleRequest(message)];
    }

    return this.handleNotification(message);
  }

  acceptProtocolData(chunk) {
    const incoming = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk || ''), 'utf8');
    const parsed = parseProtocolMessages(Buffer.concat([this.protocolBuffer, incoming]));
    const outputs = [];

    this.protocolBuffer = parsed.rest;
    parsed.messages.forEach((message) => {
      outputs.push(...this.handleMessage(message));
    });

    return {
      schema: RMT_LANGUAGE_SERVER_REPORT_SCHEMA,
      workpackage: RMT_LANGUAGE_SERVER_WORKPACKAGE,
      messageCount: parsed.messages.length,
      outputCount: outputs.length,
      messages: parsed.messages,
      outputs,
      encodedOutputs: outputs.map(encodeProtocolMessage),
      restLength: this.protocolBuffer.length
    };
  }
}

function createRmtLanguageServer(options = {}) {
  return new RmtLanguageServer(options);
}

function isWritableTransportOpen(stream) {
  return !!(
    stream &&
    typeof stream.write === 'function' &&
    stream.destroyed !== true &&
    stream.writableEnded !== true &&
    stream.writableFinished !== true &&
    stream.closed !== true &&
    stream.writable !== false
  );
}

function writeProtocolOutput(stream, encoded) {
  if (!isWritableTransportOpen(stream)) {
    return {
      schema: RMT_LANGUAGE_SERVER_REPORT_SCHEMA,
      workpackage: RMT_LANGUAGE_SERVER_WORKPACKAGE,
      ok: false,
      status: 'transport-closed',
      reason: 'stdio output stream is no longer writable'
    };
  }

  try {
    const accepted = stream.write(encoded);
    return {
      schema: RMT_LANGUAGE_SERVER_REPORT_SCHEMA,
      workpackage: RMT_LANGUAGE_SERVER_WORKPACKAGE,
      ok: true,
      status: accepted === false ? 'backpressure' : 'written',
      backpressure: accepted === false
    };
  } catch (error) {
    return {
      schema: RMT_LANGUAGE_SERVER_REPORT_SCHEMA,
      workpackage: RMT_LANGUAGE_SERVER_WORKPACKAGE,
      ok: false,
      status: 'write-failed',
      code: error && error.code ? error.code : null,
      reason: error && error.message ? error.message : String(error)
    };
  }
}

function runStdioServer(options = {}) {
  const server = createRmtLanguageServer(options);
  const input = options.input || process.stdin;
  const output = options.output || process.stdout;
  const exitProcess = typeof options.exitProcess === 'function'
    ? options.exitProcess
    : (options.exitProcess === false ? null : process.exit.bind(process));
  let transportClosed = false;

  const closeTransport = (reason) => {
    transportClosed = true;
    server.transportClosed = true;
    server.transportCloseReason = reason || null;
    if (input && typeof input.pause === 'function') {
      input.pause();
    }
  };

  const maybeExit = (code) => {
    if (exitProcess) {
      exitProcess(code);
    } else {
      process.exitCode = code;
    }
  };

  if (output && typeof output.on === 'function') {
    output.on('error', (error) => {
      closeTransport({
        status: 'output-error',
        code: error && error.code ? error.code : null,
        reason: error && error.message ? error.message : String(error)
      });
    });
  }

  if (input && typeof input.on === 'function') {
    input.on('end', () => {
      closeTransport({ status: 'input-ended' });
      maybeExit(server.shutdownRequested ? 0 : 0);
    });
    input.on('close', () => {
      closeTransport({ status: 'input-closed' });
    });
    input.on('error', (error) => {
      closeTransport({
        status: 'input-error',
        code: error && error.code ? error.code : null,
        reason: error && error.message ? error.message : String(error)
      });
      maybeExit(1);
    });
  }

  input.on('data', (chunk) => {
    if (transportClosed) {
      return;
    }

    let result = null;
    try {
      result = server.acceptProtocolData(chunk);
    } catch (error) {
      result = {
        encodedOutputs: [
          encodeProtocolMessage(createJsonRpcError(null, -32700, error && error.message ? error.message : String(error)))
        ]
      };
    }

    result.encodedOutputs.forEach((encoded) => {
      if (transportClosed) {
        return;
      }
      const writeResult = writeProtocolOutput(output, encoded);
      if (!writeResult.ok) {
        closeTransport(writeResult);
      }
    });

    if (server.exitRequested) {
      closeTransport({ status: 'lsp-exit-requested' });
      maybeExit(server.shutdownRequested ? 0 : 1);
    }
  });

  input.resume();
  return server;
}

if (require.main === module) {
  runStdioServer();
}

module.exports = {
  RMT_LANGUAGE_SERVER_MODULE_PATH,
  RMT_LANGUAGE_SERVER_PACKAGE_SCRIPT,
  RMT_LANGUAGE_SERVER_REPORT_SCHEMA,
  RMT_LANGUAGE_SERVER_SCHEMA,
  RMT_LANGUAGE_SERVER_SUITE_PATH,
  RMT_LANGUAGE_SERVER_WORKPACKAGE,
  SERVER_NAME,
  SERVER_VERSION,
  RmtLanguageServer,
  createCapabilities,
  createRmtLanguageServer,
  isWritableTransportOpen,
  writeProtocolOutput,
  runStdioServer
};
