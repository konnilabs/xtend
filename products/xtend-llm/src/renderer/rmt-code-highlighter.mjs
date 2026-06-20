const RMT_HIGHLIGHTER_SCHEMA = 'xtend-llm.rmt-code-highlighter.v1';
const RMT_LANGUAGES = new Set(['rmt', 'rmt-vnext', 'xtendrmt']);
const PRIMITIVES = new Set([
  'template',
  'state',
  'selector',
  'datasource',
  'action',
  'portal',
  'overlay',
  'resource',
  'surface',
  'lane',
  'slot',
  'stream',
  'validation',
  'transition'
]);
const LIFECYCLE = new Set([
  'mount',
  'hydrate',
  'update',
  'unmount',
  'suspend',
  'resume',
  'invalidate',
  'dispose',
  'prewarm',
  'recycle',
  'detach',
  'reattach',
  'destroy'
]);
const KEYWORDS = new Set([
  'import',
  'from',
  'endpoint',
  'sse',
  'worker',
  'fixture',
  'when',
  'sanitize',
  'where',
  'find',
  'sort',
  'by',
  'asc',
  'desc',
  'output',
  'method',
  'contract',
  'result',
  'fallback',
  'input',
  'reduce',
  'effect',
  'fetch',
  'status',
  'emit',
  'with',
  'success',
  'error',
  'message',
  'tone',
  'root',
  'layer',
  'kind',
  'component',
  'source',
  'key',
  'bounds',
  'width',
  'height',
  'weight',
  'type',
  'initial',
  'preserve',
  'repeat',
  'owner',
  'focus',
  'pointer',
  'scroll',
  'policy',
  'close',
  'topmost',
  'none',
  'restore',
  'passthrough',
  'target',
  'payload',
  'preventdefault',
  'detail',
  'dataset',
  'exposes',
  'consumes',
  'remote',
  'manifest',
  'version',
  'mode',
  'blocking',
  'field',
  'required',
  'email',
  'trigger',
  'surfaces',
  'to',
  'durationms'
]);
const BOOLEANS = new Set(['true', 'false', 'null']);

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;')
    .replace(/'/gu, '&#39;')
    .replace(/`/gu, '&#96;');
}

function normalizeLanguage(value) {
  const language = String(value || 'text').trim().toLowerCase();
  return RMT_LANGUAGES.has(language) ? 'rmt' : language || 'text';
}

function token(classes, value) {
  return `<span class="token ${classes}">${escapeHtml(value)}</span>`;
}

function readPattern(source, index, pattern) {
  const match = pattern.exec(source.slice(index));
  return match && match.index === 0 ? match[0] : '';
}

function readString(source, index) {
  const quote = source[index];
  let cursor = index + 1;
  while (cursor < source.length) {
    if (source[cursor] === '\\') {
      cursor += 2;
      continue;
    }
    if (source[cursor] === quote) return source.slice(index, cursor + 1);
    cursor += 1;
  }
  return source.slice(index);
}

function wordClasses(word, state) {
  const lower = word.toLowerCase();
  if (state.expectComponentName) {
    state.expectComponentName = false;
    return 'class-name rmt-component';
  }
  if (lower === 'component') {
    state.expectComponentName = true;
    return 'keyword';
  }
  if (PRIMITIVES.has(lower)) return 'keyword rmt-primitive';
  if (LIFECYCLE.has(lower)) return 'keyword rmt-lifecycle';
  if (BOOLEANS.has(lower)) return 'boolean';
  if (lower === 'trust' || lower === 'boundary') return 'keyword rmt-boundary';
  if (KEYWORDS.has(lower)) return 'keyword';
  if (/^(state|selector|datasource|action|portal|overlay|resource|surface|lane|input|result|record|detail|target|instance)\./iu.test(word)) {
    return 'variable rmt-reference';
  }
  if (word.includes('.')) return 'property rmt-identifier';
  if (/^[A-Z]/u.test(word)) return 'class-name';
  return '';
}

function highlightRmt(source = '') {
  const code = String(source || '');
  const state = { expectComponentName: false };
  let html = '';
  let index = 0;
  while (index < code.length) {
    const char = code[index];
    const rest = code.slice(index);

    const whitespace = readPattern(code, index, /^\s+/u);
    if (whitespace) {
      html += escapeHtml(whitespace);
      index += whitespace.length;
      continue;
    }

    if (rest.startsWith('//')) {
      const end = code.indexOf('\n', index);
      const comment = end === -1 ? code.slice(index) : code.slice(index, end);
      html += token('comment', comment);
      index += comment.length;
      continue;
    }

    if (rest.startsWith('/*')) {
      const end = code.indexOf('*/', index + 2);
      const comment = end === -1 ? code.slice(index) : code.slice(index, end + 2);
      html += token('comment', comment);
      index += comment.length;
      continue;
    }

    if (char === '"' || char === "'") {
      const stringToken = readString(code, index);
      html += token('string', stringToken);
      index += stringToken.length;
      continue;
    }

    const operator = readPattern(code, index, /^(?:->|==|!=|>=|<=|\|\||&&|[=<>])/u);
    if (operator) {
      html += token('operator', operator);
      index += operator.length;
      continue;
    }

    const number = readPattern(code, index, /^-?(?:0x[\da-f]+|\d+(?:\.\d+)?)/iu);
    if (number) {
      html += token('number', number);
      index += number.length;
      continue;
    }

    const word = readPattern(code, index, /^[A-Za-z_][\w-]*(?:\.[A-Za-z_][\w-]*)*/u);
    if (word) {
      const classes = wordClasses(word, state);
      html += classes ? token(classes, word) : escapeHtml(word);
      index += word.length;
      continue;
    }

    if (/^[{}()[\],.]/u.test(char)) {
      html += token('punctuation', char);
      index += 1;
      continue;
    }

    html += escapeHtml(char);
    index += 1;
  }
  return html;
}

export function createRmtCodeHighlighter() {
  return {
    schema: RMT_HIGHLIGHTER_SCHEMA,
    highlight(input = {}) {
      const language = normalizeLanguage(input.language || input.rawLanguage);
      if (language !== 'rmt') return null;
      return {
        html: highlightRmt(input.code),
        highlighted: true,
        engine: 'xtend-rmt-semantic',
        language
      };
    }
  };
}

export function installRmtCodeHighlighter(globalTarget = typeof window !== 'undefined' ? window : globalThis) {
  const highlighter = createRmtCodeHighlighter();
  if (globalTarget) globalTarget.XTendLlmRmtCodeHighlighter = highlighter;
  const registry = globalTarget?.customElements;
  const documentRef = globalTarget?.document;
  const install = () => {
    const constructor = registry && registry.get && registry.get('x-code');
    if (!constructor || typeof constructor.registerHighlighter !== 'function') return false;
    constructor.registerHighlighter(highlighter);
    if (documentRef && typeof documentRef.querySelectorAll === 'function') {
      documentRef.querySelectorAll('x-code').forEach((element) => {
        const language = normalizeLanguage(element.getAttribute('lang') || element.getAttribute('language'));
        if (language === 'rmt' && typeof element.hydrate === 'function') element.hydrate();
      });
    }
    return true;
  };
  if (registry && typeof registry.get === 'function' && registry.get('x-code')) {
    install();
  } else if (registry && typeof registry.whenDefined === 'function') {
    registry.whenDefined('x-code').then(install).catch(() => {});
  }
  return highlighter;
}
