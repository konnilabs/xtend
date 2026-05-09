const RMT_LANGUAGE_SERVER_PROTOCOL_SCHEMA = 'xtend.rmt.language-server.protocol.v1';
const RMT_LANGUAGE_SERVER_PROTOCOL_MODULE_PATH = 'tools/rmt-language-server/protocol.js';
const RMT_LANGUAGE_SERVER_WORKPACKAGE = 'WP-E14-09';

const LSP_DIAGNOSTIC_SEVERITY = Object.freeze({
  error: 1,
  warning: 2,
  info: 3,
  hint: 4
});

const LSP_COMPLETION_KIND = Object.freeze({
  text: 1,
  method: 2,
  function: 3,
  constructor: 4,
  field: 5,
  variable: 6,
  class: 7,
  interface: 8,
  module: 9,
  property: 10,
  unit: 11,
  value: 12,
  enum: 13,
  keyword: 14,
  snippet: 15,
  color: 16,
  file: 17,
  reference: 18,
  folder: 19,
  enumMember: 20,
  constant: 21,
  struct: 22,
  event: 23,
  operator: 24,
  typeParameter: 25
});

const LSP_SYMBOL_KIND = Object.freeze({
  file: 1,
  module: 2,
  namespace: 3,
  package: 4,
  class: 5,
  method: 6,
  property: 7,
  field: 8,
  constructor: 9,
  enum: 10,
  interface: 11,
  function: 12,
  variable: 13,
  constant: 14,
  string: 15,
  number: 16,
  boolean: 17,
  array: 18,
  object: 19,
  key: 20,
  null: 21,
  enumMember: 22,
  struct: 23,
  event: 24,
  operator: 25,
  typeParameter: 26
});

function sanitizePosition(position = {}) {
  return {
    line: Math.max(0, Number.isInteger(position.line) ? position.line : 0),
    character: Math.max(0, Number.isInteger(position.character) ? position.character : 0)
  };
}

function sanitizeRange(range) {
  if (!range || !range.start || !range.end) {
    return null;
  }

  return {
    start: sanitizePosition(range.start),
    end: sanitizePosition(range.end)
  };
}

function encodeProtocolMessage(message) {
  const json = JSON.stringify(message);
  const length = Buffer.byteLength(json, 'utf8');

  return `Content-Length: ${length}\r\n\r\n${json}`;
}

function parseProtocolMessages(input) {
  let buffer = Buffer.isBuffer(input) ? input : Buffer.from(String(input || ''), 'utf8');
  const messages = [];

  while (buffer.length > 0) {
    const headerEnd = buffer.indexOf('\r\n\r\n');

    if (headerEnd === -1) {
      break;
    }

    const header = buffer.slice(0, headerEnd).toString('utf8');
    const lengthMatch = header.match(/Content-Length:\s*(\d+)/i);

    if (!lengthMatch) {
      throw new Error('Invalid LSP message: missing Content-Length header');
    }

    const contentLength = Number(lengthMatch[1]);
    const bodyStart = headerEnd + 4;
    const bodyEnd = bodyStart + contentLength;

    if (buffer.length < bodyEnd) {
      break;
    }

    const rawBody = buffer.slice(bodyStart, bodyEnd).toString('utf8');
    messages.push(JSON.parse(rawBody));
    buffer = buffer.slice(bodyEnd);
  }

  return {
    messages,
    rest: buffer
  };
}

function createJsonRpcResponse(id, result) {
  return {
    jsonrpc: '2.0',
    id,
    result
  };
}

function createJsonRpcError(id, code, message, data = null) {
  return {
    jsonrpc: '2.0',
    id,
    error: {
      code,
      message,
      data
    }
  };
}

function createJsonRpcNotification(method, params = {}) {
  return {
    jsonrpc: '2.0',
    method,
    params
  };
}

function mapCompletionKind(kind) {
  if (kind === 'component-tag' || kind === 'class') {
    return LSP_COMPLETION_KIND.class;
  }

  if (kind === 'reference') {
    return LSP_COMPLETION_KIND.reference;
  }

  if (kind === 'field' || kind === 'property') {
    return LSP_COMPLETION_KIND.field;
  }

  if (kind === 'keyword') {
    return LSP_COMPLETION_KIND.keyword;
  }

  return LSP_COMPLETION_KIND.value;
}

function mapSymbolKind(kind) {
  if (kind === 'namespace') {
    return LSP_SYMBOL_KIND.namespace;
  }

  if (kind === 'component') {
    return LSP_SYMBOL_KIND.class;
  }

  if (kind === 'adapter') {
    return LSP_SYMBOL_KIND.interface;
  }

  if (kind === 'route') {
    return LSP_SYMBOL_KIND.function;
  }

  if (kind === 'schedule') {
    return LSP_SYMBOL_KIND.event;
  }

  if (kind === 'template') {
    return LSP_SYMBOL_KIND.object;
  }

  return LSP_SYMBOL_KIND.property;
}

function toLspDiagnostic(diagnostic = {}) {
  return {
    range: sanitizeRange(diagnostic.range) || {
      start: { line: 0, character: 0 },
      end: { line: 0, character: 1 }
    },
    severity: LSP_DIAGNOSTIC_SEVERITY[diagnostic.severity] || LSP_DIAGNOSTIC_SEVERITY.info,
    code: diagnostic.code || 'rmt.diagnostic',
    source: diagnostic.source || 'rmt-linter',
    message: diagnostic.message || diagnostic.code || 'RMT diagnostic',
    data: {
      schema: diagnostic.schema || 'xtend.rmt.linter.diagnostic.v1',
      pointer: diagnostic.pointer || null,
      repair: diagnostic.repair || null,
      workpackage: diagnostic.workpackage || RMT_LANGUAGE_SERVER_WORKPACKAGE
    }
  };
}

function toLspCompletionItem(item = {}) {
  return {
    label: item.label,
    kind: mapCompletionKind(item.kind),
    detail: item.detail || item.source || '',
    documentation: item.documentation ? {
      kind: 'markdown',
      value: item.documentation
    } : undefined,
    insertText: item.insertText || item.label,
    data: {
      schema: item.schema,
      source: item.source || null,
      pointer: item.pointer || null,
      targetDomain: item.targetDomain || null
    }
  };
}

function toLspHover(hoverReport) {
  const hover = hoverReport && hoverReport.hover;

  if (!hover) {
    return null;
  }

  return {
    contents: {
      kind: 'markdown',
      value: hover.markdown || ''
    },
    range: sanitizeRange(hover.range) || undefined
  };
}

function toLspDocumentSymbol(symbol = {}) {
  return {
    name: symbol.name || '',
    detail: symbol.detail || '',
    kind: mapSymbolKind(symbol.kind),
    range: sanitizeRange(symbol.range) || {
      start: { line: 0, character: 0 },
      end: { line: 0, character: 1 }
    },
    selectionRange: sanitizeRange(symbol.selectionRange || symbol.range) || {
      start: { line: 0, character: 0 },
      end: { line: 0, character: 1 }
    },
    children: Array.isArray(symbol.children) ? symbol.children.map(toLspDocumentSymbol) : []
  };
}

function toLspLocation(uri, target) {
  if (!target || !target.range) {
    return null;
  }

  return {
    uri,
    range: sanitizeRange(target.range)
  };
}

function toLspWorkspaceEdit(edit) {
  if (!edit || !edit.changes) {
    return undefined;
  }

  const changes = {};

  Object.entries(edit.changes).forEach(([uri, edits]) => {
    changes[uri] = Array.isArray(edits)
      ? edits.map((entry) => ({
        range: sanitizeRange(entry.range) || {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 0 }
        },
        newText: entry.newText || ''
      }))
      : [];
  });

  return {
    changes
  };
}

function toLspCodeAction(action = {}) {
  return {
    title: action.title || 'RMT Quick Fix',
    kind: action.kind || 'quickfix',
    diagnostics: Array.isArray(action.diagnostics) ? action.diagnostics.map(toLspDiagnostic) : [],
    edit: toLspWorkspaceEdit(action.edit),
    command: action.command || undefined,
    isPreferred: !!action.isPreferred,
    data: {
      schema: action.schema,
      diagnosticCode: action.diagnosticCode || null,
      pointer: action.pointer || null,
      safe: action.safe !== false,
      confidence: action.confidence || null,
      workpackage: action.workpackage || RMT_LANGUAGE_SERVER_WORKPACKAGE
    }
  };
}

module.exports = {
  LSP_COMPLETION_KIND,
  LSP_DIAGNOSTIC_SEVERITY,
  LSP_SYMBOL_KIND,
  RMT_LANGUAGE_SERVER_PROTOCOL_MODULE_PATH,
  RMT_LANGUAGE_SERVER_PROTOCOL_SCHEMA,
  RMT_LANGUAGE_SERVER_WORKPACKAGE,
  createJsonRpcError,
  createJsonRpcNotification,
  createJsonRpcResponse,
  encodeProtocolMessage,
  parseProtocolMessages,
  sanitizePosition,
  sanitizeRange,
  toLspCompletionItem,
  toLspCodeAction,
  toLspDiagnostic,
  toLspDocumentSymbol,
  toLspHover,
  toLspLocation
};
