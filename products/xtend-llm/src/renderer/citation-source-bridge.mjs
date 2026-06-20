export function createCitationSourceMap(sources = []) {
  const map = new Map();
  if (!Array.isArray(sources)) return map;
  sources.forEach((source, position) => {
    if (!source || typeof source !== 'object') return;
    const index = Number.isFinite(source.index)
      ? Math.max(1, Math.min(5, Math.floor(source.index)))
      : position + 1;
    const url = safeExternalUrl(source.url);
    if (!url || map.has(index)) return;
    map.set(index, {
      ...source,
      index,
      url
    });
  });
  return map;
}

export function safeExternalUrl(value) {
  try {
    const url = new URL(String(value || ''));
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    return url.href;
  } catch (_error) {
    return '';
  }
}

export function sourceHostname(value) {
  try {
    return new URL(String(value || '')).hostname.replace(/^www\./u, '');
  } catch (_error) {
    return '';
  }
}

export function splitCitationReferences(text, sourceMap) {
  const value = String(text || '');
  if (!sourceMap || typeof sourceMap.has !== 'function' || !value.includes('[')) {
    return [{ type: 'text', text: value }];
  }
  const tokens = [];
  const pattern = /\[(\d{1,2})\]/gu;
  let cursor = 0;
  let match;
  while ((match = pattern.exec(value))) {
    const index = Number(match[1]);
    if (!sourceMap.has(index)) continue;
    if (match.index > cursor) {
      tokens.push({ type: 'text', text: value.slice(cursor, match.index) });
    }
    tokens.push({
      type: 'citation',
      text: match[0],
      index,
      source: sourceMap.get(index)
    });
    cursor = match.index + match[0].length;
  }
  if (cursor < value.length) tokens.push({ type: 'text', text: value.slice(cursor) });
  return tokens.length ? tokens : [{ type: 'text', text: value }];
}
