const path = require('path');
const { pathToFileURL } = require('url');

const RMT_SOURCE_MODEL_SCHEMA = 'xtend.rmt.source-model.v1';
const RMT_SOURCE_MODEL_REPORT_SCHEMA = 'xtend.rmt.source-model-report.v1';
const RMT_SOURCE_MODEL_WORKPACKAGE = 'WP-E14-02';
const RMT_SOURCE_MODEL_MODULE_PATH = 'tools/rmt-language/source-model.js';
const RMT_SOURCE_MODEL_SUITE_PATH = 'tests/rmt-language/rmt_source_model_suite.js';
const RMT_SOURCE_MODEL_PACKAGE_SCRIPT = 'npm run test:rmt-source-model';
const RMT_SYNTAX_DIAGNOSTIC_SCHEMA = 'xtend.rmt.linter.diagnostic.v1';
const RMT_SYNTAX_ERROR_CODE = 'rmt.syntax.invalid-json';

function clamp(value, min, max) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function normalizeInteger(value, fallback = 0) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.trunc(numeric);
}

function computeLineStarts(text) {
  const lineStarts = [0];

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (character === '\r') {
      if (text[index + 1] === '\n') {
        index += 1;
      }
      lineStarts.push(index + 1);
      continue;
    }

    if (character === '\n') {
      lineStarts.push(index + 1);
    }
  }

  return lineStarts;
}

function getLineBreakLengthBefore(text, offset) {
  if (offset <= 0) {
    return 0;
  }

  const previous = text[offset - 1];
  const beforePrevious = text[offset - 2];

  if (previous === '\n' && beforePrevious === '\r') {
    return 2;
  }

  if (previous === '\n' || previous === '\r') {
    return 1;
  }

  return 0;
}

function hashText(text) {
  let hash = 2166136261;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16);
}

function normalizeUri(input) {
  if (input.uri) {
    return input.uri;
  }

  if (input.filePath) {
    return pathToFileURL(path.resolve(input.filePath)).href;
  }

  return 'untitled:rmt-document';
}

function classifyRmtFile(uriOrPath = '') {
  const value = String(uriOrPath).toLowerCase();

  if (value.endsWith('.rmt')) {
    return {
      extension: '.rmt',
      canonical: true,
      fallback: false,
      diagnosticCode: null
    };
  }

  if (value.endsWith('.rmt.json')) {
    return {
      extension: '.rmt.json',
      canonical: false,
      fallback: true,
      diagnosticCode: 'rmt.document.extension.fallback-used'
    };
  }

  if (value.endsWith('.json')) {
    return {
      extension: '.json',
      canonical: false,
      fallback: true,
      diagnosticCode: 'rmt.document.extension.fallback-used'
    };
  }

  return {
    extension: path.extname(value) || '',
    canonical: false,
    fallback: false,
    diagnosticCode: null
  };
}

function createParseError(message, position) {
  const error = new SyntaxError(message);
  error.position = clamp(normalizeInteger(position, 0), 0, Number.MAX_SAFE_INTEGER);
  return error;
}

function skipWhitespace(state) {
  while (state.index < state.text.length && /\s/.test(state.text[state.index])) {
    state.index += 1;
  }
}

function readStringToken(state) {
  const { text } = state;
  const start = state.index;

  if (text[state.index] !== '"') {
    throw createParseError('Expected JSON string', state.index);
  }

  state.index += 1;

  while (state.index < text.length) {
    const character = text[state.index];

    if (character === '"') {
      state.index += 1;
      const raw = text.slice(start, state.index);

      try {
        return {
          type: 'string',
          value: JSON.parse(raw),
          start,
          valueStart: start,
          valueEnd: state.index,
          end: state.index
        };
      } catch (error) {
        throw createParseError(error.message, start);
      }
    }

    if (character === '\\') {
      state.index += 2;
      continue;
    }

    state.index += 1;
  }

  throw createParseError('Unterminated JSON string', start);
}

function readNumberToken(state) {
  const start = state.index;
  const match = state.text.slice(start).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);

  if (!match) {
    throw createParseError('Expected JSON number', start);
  }

  state.index += match[0].length;

  return {
    type: 'number',
    start,
    valueStart: start,
    valueEnd: state.index,
    end: state.index
  };
}

function readLiteralToken(state, literal, type) {
  const start = state.index;

  if (!state.text.startsWith(literal, start)) {
    throw createParseError(`Expected JSON literal ${literal}`, start);
  }

  state.index += literal.length;

  return {
    type,
    start,
    valueStart: start,
    valueEnd: state.index,
    end: state.index
  };
}

function readArrayToken(state) {
  const start = state.index;
  const elements = [];

  state.index += 1;
  skipWhitespace(state);

  if (state.text[state.index] === ']') {
    state.index += 1;
    return {
      type: 'array',
      start,
      valueStart: start,
      valueEnd: state.index,
      end: state.index,
      elements
    };
  }

  while (state.index < state.text.length) {
    const element = readValueToken(state);
    element.arrayIndex = elements.length;
    elements.push(element);
    skipWhitespace(state);

    if (state.text[state.index] === ',') {
      state.index += 1;
      skipWhitespace(state);
      continue;
    }

    if (state.text[state.index] === ']') {
      state.index += 1;
      return {
        type: 'array',
        start,
        valueStart: start,
        valueEnd: state.index,
        end: state.index,
        elements
      };
    }

    throw createParseError('Expected comma or closing array bracket', state.index);
  }

  throw createParseError('Unterminated JSON array', start);
}

function readObjectToken(state) {
  const start = state.index;
  const entries = [];
  const children = new Map();

  state.index += 1;
  skipWhitespace(state);

  if (state.text[state.index] === '}') {
    state.index += 1;
    return {
      type: 'object',
      start,
      valueStart: start,
      valueEnd: state.index,
      end: state.index,
      entries,
      children
    };
  }

  while (state.index < state.text.length) {
    skipWhitespace(state);
    const propertyStart = state.index;
    const key = readStringToken(state);
    skipWhitespace(state);

    if (state.text[state.index] !== ':') {
      throw createParseError('Expected colon after object key', state.index);
    }

    state.index += 1;
    const value = readValueToken(state);
    value.key = key.value;
    value.keyStart = key.start;
    value.keyEnd = key.end;
    value.propertyStart = propertyStart;
    value.propertyEnd = value.end;
    entries.push({
      key: key.value,
      keyStart: key.start,
      keyEnd: key.end,
      propertyStart,
      propertyEnd: value.end,
      node: value
    });
    children.set(key.value, value);
    skipWhitespace(state);

    if (state.text[state.index] === ',') {
      state.index += 1;
      skipWhitespace(state);
      continue;
    }

    if (state.text[state.index] === '}') {
      state.index += 1;
      const end = state.index;
      return {
        type: 'object',
        start,
        valueStart: start,
        valueEnd: end,
        end,
        entries,
        children
      };
    }

    throw createParseError('Expected comma or closing object brace', state.index);
  }

  throw createParseError('Unterminated JSON object', start);
}

function readValueToken(state) {
  skipWhitespace(state);

  const character = state.text[state.index];

  if (character === '{') {
    return readObjectToken(state);
  }

  if (character === '[') {
    return readArrayToken(state);
  }

  if (character === '"') {
    return readStringToken(state);
  }

  if (character === '-' || /\d/.test(character || '')) {
    return readNumberToken(state);
  }

  if (character === 't') {
    return readLiteralToken(state, 'true', 'boolean');
  }

  if (character === 'f') {
    return readLiteralToken(state, 'false', 'boolean');
  }

  if (character === 'n') {
    return readLiteralToken(state, 'null', 'null');
  }

  throw createParseError('Expected JSON value', state.index);
}

function parseJsonRangeTree(text) {
  const state = {
    text,
    index: 0
  };
  const root = readValueToken(state);

  skipWhitespace(state);

  if (state.index < text.length) {
    throw createParseError('Unexpected trailing JSON content', state.index);
  }

  return root;
}

function extractJsonErrorPosition(error) {
  if (typeof error.position === 'number') {
    return error.position;
  }

  const message = error && error.message ? error.message : '';
  const positionMatch = message.match(/position\s+(\d+)/i);

  if (positionMatch) {
    return Number(positionMatch[1]);
  }

  const lineColumnMatch = message.match(/line\s+(\d+)\s+column\s+(\d+)/i);

  if (lineColumnMatch) {
    return {
      line: Number(lineColumnMatch[1]) - 1,
      character: Number(lineColumnMatch[2]) - 1
    };
  }

  return 0;
}

function decodeJsonPointerSegment(segment) {
  return segment.replace(/~1/g, '/').replace(/~0/g, '~');
}

function parseJsonPointer(pointer) {
  if (pointer === '') {
    return [];
  }

  if (typeof pointer !== 'string' || !pointer.startsWith('/')) {
    return null;
  }

  return pointer.slice(1).split('/').map(decodeJsonPointerSegment);
}

function lookupJsonPointer(root, pointer) {
  const segments = parseJsonPointer(pointer);

  if (!segments) {
    return null;
  }

  let node = root;

  for (const segment of segments) {
    if (!node) {
      return null;
    }

    if (node.type === 'object') {
      node = node.children.get(segment);
      continue;
    }

    if (node.type === 'array') {
      if (!/^(0|[1-9]\d*)$/.test(segment)) {
        return null;
      }
      node = node.elements[Number(segment)];
      continue;
    }

    return null;
  }

  return node || null;
}

function createRmtSourceModel(input = {}) {
  const text = String(input.text || '');
  const filePath = input.filePath ? path.resolve(input.filePath) : null;
  const uri = normalizeUri({ ...input, filePath });
  const version = normalizeInteger(input.version, 0);
  const languageId = input.languageId || 'rmt';
  const lineStarts = computeLineStarts(text);
  const filePolicy = classifyRmtFile(filePath || uri);
  const snapshotId = `${uri}@${version}:${text.length}:${hashText(text)}`;
  let jsonParseCache = null;
  let jsonRangeTreeCache = null;

  function lineEndOffset(line, options = {}) {
    const normalizedLine = clamp(normalizeInteger(line, 0), 0, lineStarts.length - 1);
    const nextLineStart = lineStarts[normalizedLine + 1] === undefined ? text.length : lineStarts[normalizedLine + 1];

    if (options.includeLineBreak) {
      return nextLineStart;
    }

    return nextLineStart - getLineBreakLengthBefore(text, nextLineStart);
  }

  function positionAt(offset) {
    const normalizedOffset = clamp(normalizeInteger(offset, 0), 0, text.length);
    let low = 0;
    let high = lineStarts.length - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const lineStart = lineStarts[mid];
      const nextLineStart = lineStarts[mid + 1] === undefined ? text.length + 1 : lineStarts[mid + 1];

      if (normalizedOffset < lineStart) {
        high = mid - 1;
      } else if (normalizedOffset >= nextLineStart) {
        low = mid + 1;
      } else {
        return {
          line: mid,
          character: normalizedOffset - lineStart
        };
      }
    }

    const lastLine = lineStarts.length - 1;

    return {
      line: lastLine,
      character: normalizedOffset - lineStarts[lastLine]
    };
  }

  function offsetAt(position = {}) {
    const line = clamp(normalizeInteger(position.line, 0), 0, lineStarts.length - 1);
    const character = Math.max(0, normalizeInteger(position.character, 0));
    const start = lineStarts[line];
    const end = lineEndOffset(line);

    return clamp(start + character, start, end);
  }

  function rangeForOffsets(startOffset, endOffset) {
    const start = clamp(normalizeInteger(startOffset, 0), 0, text.length);
    const end = clamp(normalizeInteger(endOffset, start), start, text.length);

    return {
      start: positionAt(start),
      end: positionAt(end),
      startOffset: start,
      endOffset: end
    };
  }

  function rangeForSpan(startOffset, length = 1) {
    const start = clamp(normalizeInteger(startOffset, 0), 0, text.length);
    const span = Math.max(0, normalizeInteger(length, 0));

    return rangeForOffsets(start, start + span);
  }

  function lineText(line) {
    const normalizedLine = clamp(normalizeInteger(line, 0), 0, lineStarts.length - 1);

    return text.slice(lineStarts[normalizedLine], lineEndOffset(normalizedLine));
  }

  function lineRange(line, options = {}) {
    const normalizedLine = clamp(normalizeInteger(line, 0), 0, lineStarts.length - 1);

    return rangeForOffsets(lineStarts[normalizedLine], lineEndOffset(normalizedLine, options));
  }

  function createSyntaxDiagnostic(error) {
    const extracted = extractJsonErrorPosition(error);
    const offset = typeof extracted === 'object' ? offsetAt(extracted) : clamp(extracted, 0, text.length);
    const range = rangeForSpan(offset, 1);

    return {
      schema: RMT_SYNTAX_DIAGNOSTIC_SCHEMA,
      source: 'rmt-language',
      code: RMT_SYNTAX_ERROR_CODE,
      severity: 'error',
      message: error && error.message ? error.message : 'Invalid RMT JSON syntax',
      uri,
      file: filePath,
      pointer: null,
      range,
      workpackage: RMT_SOURCE_MODEL_WORKPACKAGE
    };
  }

  function parseJson() {
    if (jsonParseCache) {
      return jsonParseCache;
    }

    try {
      const value = JSON.parse(text);
      jsonRangeTreeCache = parseJsonRangeTree(text);
      jsonParseCache = {
        ok: true,
        value,
        tree: jsonRangeTreeCache,
        diagnostics: []
      };
    } catch (error) {
      jsonParseCache = {
        ok: false,
        value: null,
        tree: null,
        diagnostics: [createSyntaxDiagnostic(error)]
      };
    }

    return jsonParseCache;
  }

  function getJsonRangeTree() {
    const parsed = parseJson();

    if (!parsed.ok) {
      return null;
    }

    return jsonRangeTreeCache || parsed.tree;
  }

  function findJsonPointerRange(pointer, options = {}) {
    const tree = getJsonRangeTree();
    const node = tree ? lookupJsonPointer(tree, pointer) : null;

    if (!node) {
      return null;
    }

    const target = options.target || options.prefer || 'value';
    let start = node.valueStart;
    let end = node.valueEnd;

    if (target === 'key' && typeof node.keyStart === 'number') {
      start = node.keyStart;
      end = node.keyEnd;
    } else if (target === 'property' && typeof node.propertyStart === 'number') {
      start = node.propertyStart;
      end = node.propertyEnd;
    }

    const range = rangeForOffsets(start, end);

    return {
      pointer,
      target,
      type: node.type,
      text: text.slice(start, end),
      range,
      startOffset: start,
      endOffset: end
    };
  }

  function findTextRange(needle, options = {}) {
    const fromOffset = Math.max(0, normalizeInteger(options.fromOffset, 0));
    const index = text.indexOf(String(needle), fromOffset);

    if (index === -1) {
      return null;
    }

    return {
      text: String(needle),
      range: rangeForSpan(index, String(needle).length),
      startOffset: index,
      endOffset: index + String(needle).length
    };
  }

  function createDiagnostic(inputDiagnostic = {}) {
    const pointerRange = inputDiagnostic.pointer
      ? findJsonPointerRange(inputDiagnostic.pointer, { target: inputDiagnostic.target || 'value' })
      : null;
    const range = inputDiagnostic.range
      || (pointerRange && pointerRange.range)
      || rangeForOffsets(inputDiagnostic.startOffset || 0, inputDiagnostic.endOffset || inputDiagnostic.startOffset || 1);

    return {
      schema: inputDiagnostic.schema || RMT_SYNTAX_DIAGNOSTIC_SCHEMA,
      source: inputDiagnostic.source || 'rmt-language',
      code: inputDiagnostic.code || 'rmt.diagnostic',
      severity: inputDiagnostic.severity || 'info',
      message: inputDiagnostic.message || inputDiagnostic.code || 'RMT diagnostic',
      uri,
      file: filePath,
      pointer: inputDiagnostic.pointer || null,
      range,
      workpackage: inputDiagnostic.workpackage || RMT_SOURCE_MODEL_WORKPACKAGE
    };
  }

  return {
    schema: RMT_SOURCE_MODEL_SCHEMA,
    workpackage: RMT_SOURCE_MODEL_WORKPACKAGE,
    uri,
    filePath,
    languageId,
    version,
    text,
    lineCount: lineStarts.length,
    length: text.length,
    snapshotId,
    filePolicy,
    getLineStarts: () => lineStarts.slice(),
    positionAt,
    offsetAt,
    rangeForOffsets,
    rangeForSpan,
    lineEndOffset,
    lineText,
    lineRange,
    parseJson,
    getJsonRangeTree,
    findJsonPointerRange,
    findTextRange,
    createDiagnostic
  };
}

module.exports = {
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
};
