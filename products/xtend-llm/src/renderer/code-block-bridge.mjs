const CODE_FENCE_PATTERN = /^([`']{3})(.*)$/u;

const LANGUAGE_ALIASES = Object.freeze({
  csharp: 'csharp',
  cs: 'csharp',
  html: 'markup',
  js: 'javascript',
  jsx: 'jsx',
  md: 'markdown',
  plaintext: 'text',
  py: 'python',
  rb: 'ruby',
  rmt: 'rmt',
  'rmt-vnext': 'rmt',
  sh: 'bash',
  shell: 'bash',
  ts: 'typescript',
  tsx: 'tsx',
  txt: 'text',
  xtendrmt: 'rmt',
  xml: 'markup',
  yaml: 'yaml',
  yml: 'yaml'
});

export function normalizeFenceLanguage(value = '') {
  const token = String(value || '')
    .trim()
    .split(/\s+/u)[0]
    .replace(/^[{[]|[}\]]$/gu, '')
    .toLowerCase();
  if (!token) return 'text';
  return LANGUAGE_ALIASES[token] || token;
}

function parseFenceLine(line) {
  const match = String(line || '').match(CODE_FENCE_PATTERN);
  if (!match) return null;
  const marker = match[1];
  const rest = match[2] || '';
  if (rest.trim() && !/^\s*[\w+.#-]+(?:\s.*)?$/u.test(rest)) return null;
  return {
    marker,
    language: normalizeFenceLanguage(rest)
  };
}

function pushText(segments, lines) {
  if (!lines.length) return;
  const text = lines.join('\n');
  if (!text) return;
  segments.push({ type: 'text', text });
  lines.length = 0;
}

function pushCode(segments, lines, language, closed) {
  segments.push({
    type: 'code',
    language: language || 'text',
    code: lines.join('\n'),
    closed
  });
  lines.length = 0;
}

export function parseCodeFenceSegments(input = '') {
  const text = String(input || '');
  if (!text) return [];

  const segments = [];
  const textLines = [];
  const codeLines = [];
  let activeFence = null;
  let activeLanguage = 'text';

  for (const line of text.split(/\r?\n/u)) {
    const fence = parseFenceLine(line);
    if (fence && !activeFence) {
      pushText(segments, textLines);
      activeFence = fence.marker;
      activeLanguage = fence.language;
      continue;
    }
    if (fence && activeFence && fence.marker === activeFence) {
      pushCode(segments, codeLines, activeLanguage, true);
      activeFence = null;
      activeLanguage = 'text';
      continue;
    }
    if (activeFence) codeLines.push(line);
    else textLines.push(line);
  }

  if (activeFence) pushCode(segments, codeLines, activeLanguage, false);
  pushText(segments, textLines);
  return segments;
}
