#!/usr/bin/env node

const path = require('path');
const {
  buildSemanticGraph
} = require('../rmt-language/semantic-graph');
const {
  createRmtSourceModel
} = require('../rmt-language/source-model');
const {
  lintRmtSource
} = require('../rmt-language/diagnostics');
const {
  getRmtCompletions
} = require('../rmt-language/completions');
const {
  getRmtDefinition
} = require('../rmt-language/definitions');
const {
  getRmtHover
} = require('../rmt-language/hover');
const {
  getRmtDocumentSymbols
} = require('../rmt-language/symbols');
const {
  getRmtCodeActions
} = require('../rmt-language/code-actions');
const {
  createJsonRpcError,
  createJsonRpcNotification,
  createJsonRpcResponse,
  encodeProtocolMessage,
  parseProtocolMessages,
  toLspCompletionItem,
  toLspCodeAction,
  toLspDiagnostic,
  toLspDocumentSymbol,
  toLspHover,
  toLspLocation
} = require('./protocol');

const RMT_LANGUAGE_SERVER_SCHEMA = 'xtend.rmt.language-server.v1';
const RMT_LANGUAGE_SERVER_REPORT_SCHEMA = 'xtend.rmt.language-server-report.v1';
const RMT_LANGUAGE_SERVER_MODULE_PATH = 'tools/rmt-language-server/server.js';
const RMT_LANGUAGE_SERVER_SUITE_PATH = 'tests/rmt-language/rmt_language_server_suite.js';
const RMT_LANGUAGE_SERVER_PACKAGE_SCRIPT = 'npm run test:rmt-language-server';
const RMT_LANGUAGE_SERVER_WORKPACKAGE = 'WP-E14-09';
const SERVER_NAME = 'xtend-rmt-language-server';
const SERVER_VERSION = '0.0.0-enterprise-readiness';

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
    return decodeURIComponent(new URL(uri).pathname);
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
    codeActionProvider: {
      codeActionKinds: ['quickfix']
    }
  };
}

class RmtLanguageServer {
  constructor(options = {}) {
    this.schema = RMT_LANGUAGE_SERVER_SCHEMA;
    this.reportSchema = RMT_LANGUAGE_SERVER_REPORT_SCHEMA;
    this.workpackage = RMT_LANGUAGE_SERVER_WORKPACKAGE;
    this.rootDir = options.rootDir || process.cwd();
    this.documents = new Map();
    this.analysisCache = new Map();
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

    this.documents.set(uri, {
      uri,
      filePath: uriToFilePath(uri),
      languageId: textDocument.languageId || 'rmt',
      version: Number.isInteger(textDocument.version) ? textDocument.version : 0,
      text: String(textDocument.text || '')
    });
    this.analysisCache.delete(uri);

    return [this.createDiagnosticsNotification(uri)];
  }

  changeDocument(params = {}) {
    const uri = normalizeString(params.textDocument && params.textDocument.uri);
    const document = this.documents.get(uri);

    if (!uri || !document) {
      return [];
    }

    let text = document.text;
    toArray(params.contentChanges).forEach((change) => {
      text = applyTextChange({
        ...document,
        text
      }, change);
    });

    this.documents.set(uri, {
      ...document,
      version: Number.isInteger(params.textDocument.version) ? params.textDocument.version : document.version + 1,
      text
    });
    this.analysisCache.delete(uri);

    return [this.createDiagnosticsNotification(uri)];
  }

  closeDocument(params = {}) {
    const uri = normalizeString(params.textDocument && params.textDocument.uri);

    if (!uri) {
      return [];
    }

    this.documents.delete(uri);
    this.analysisCache.delete(uri);

    return [createJsonRpcNotification('textDocument/publishDiagnostics', {
      uri,
      diagnostics: []
    })];
  }

  getDocument(uri) {
    return this.documents.get(uri) || null;
  }

  analyzeDocument(uri) {
    if (this.analysisCache.has(uri)) {
      return this.analysisCache.get(uri);
    }

    const document = this.getDocument(uri);

    if (!document) {
      return null;
    }

    const input = createDocumentInput(document);
    const graph = buildSemanticGraph(input, {
      rootDir: this.rootDir
    });
    const linterReport = lintRmtSource(input, {
      rootDir: this.rootDir,
      graph
    });
    const analysis = {
      document,
      input,
      graph,
      linterReport
    };

    this.analysisCache.set(uri, analysis);
    return analysis;
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

    if (!analysis) {
      return {
        isIncomplete: false,
        items: []
      };
    }

    const pointer = params.xtend && params.xtend.pointer
      ? params.xtend.pointer
      : this.getPointerAtPosition(uri, params.position || {});
    const report = getRmtCompletions(analysis.input, {
      rootDir: this.rootDir,
      graph: analysis.graph,
      pointer,
      prefix: params.xtend && params.xtend.prefix ? params.xtend.prefix : ''
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
    const report = getRmtHover(analysis.input, {
      rootDir: this.rootDir,
      graph: analysis.graph,
      pointer
    });

    return toLspHover(report);
  }

  documentSymbols(params = {}) {
    const uri = normalizeString(params.textDocument && params.textDocument.uri);
    const analysis = this.analyzeDocument(uri);

    if (!analysis) {
      return [];
    }

    const report = getRmtDocumentSymbols(analysis.input, {
      rootDir: this.rootDir,
      graph: analysis.graph
    });

    return toArray(report.symbols).map(toLspDocumentSymbol);
  }

  definition(params = {}) {
    const uri = normalizeString(params.textDocument && params.textDocument.uri);
    const analysis = this.analyzeDocument(uri);

    if (!analysis) {
      return null;
    }

    const pointer = params.xtend && params.xtend.pointer
      ? params.xtend.pointer
      : this.getPointerAtPosition(uri, params.position || {});
    const report = getRmtDefinition(analysis.input, {
      rootDir: this.rootDir,
      graph: analysis.graph,
      pointer
    });

    return toLspLocation(uri, report.target);
  }

  codeAction(params = {}) {
    const uri = normalizeString(params.textDocument && params.textDocument.uri);
    const analysis = this.analyzeDocument(uri);

    if (!analysis) {
      return [];
    }

    const report = getRmtCodeActions(analysis.input, {
      rootDir: this.rootDir,
      graph: analysis.graph,
      lintReport: analysis.linterReport,
      contextDiagnostics: params.context && params.context.diagnostics ? params.context.diagnostics : []
    });

    return toArray(report.actions).map(toLspCodeAction);
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
        case 'textDocument/definition':
          return createJsonRpcResponse(message.id, this.definition(message.params || {}));
        case 'textDocument/codeAction':
          return createJsonRpcResponse(message.id, this.codeAction(message.params || {}));
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

function runStdioServer(options = {}) {
  const server = createRmtLanguageServer(options);

  process.stdin.on('data', (chunk) => {
    const result = server.acceptProtocolData(chunk);
    result.encodedOutputs.forEach((encoded) => {
      process.stdout.write(encoded);
    });

    if (server.exitRequested) {
      process.exit(server.shutdownRequested ? 0 : 1);
    }
  });

  process.stdin.resume();
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
  runStdioServer
};
