const THINK_OPEN = '<think';
const THINK_CLOSE = '</think';

function stripDanglingThinkPrefix(text) {
  const lower = text.toLowerCase();
  for (const marker of [THINK_CLOSE, THINK_OPEN]) {
    for (let length = marker.length - 1; length > 0; length -= 1) {
      if (lower.endsWith(marker.slice(0, length))) {
        return text.slice(0, -length);
      }
    }
  }
  return text;
}

export function stripThinkMarkup(value, options = {}) {
  let text = String(value || '');
  text = text.replace(/<think\b[^>]*>[\s\S]*?<\/think\s*>/giu, '');
  text = text.replace(/<think\b[^>]*>[\s\S]*$/iu, '');
  text = text.replace(/<\/think\s*>/giu, '');
  if (options.streaming) text = stripDanglingThinkPrefix(text);
  return text
    .replace(/[ \t]+\n/gu, '\n')
    .replace(/\n{3,}/gu, '\n\n')
    .replace(/^\s+/u, '');
}

export function createThinkMarkupDeltaFilter() {
  let rawText = '';
  let visibleText = '';
  return {
    push(chunk) {
      rawText += String(chunk || '');
      const nextVisibleText = stripThinkMarkup(rawText, { streaming: true });
      const delta = nextVisibleText.startsWith(visibleText)
        ? nextVisibleText.slice(visibleText.length)
        : '';
      visibleText = nextVisibleText;
      return delta;
    },
    complete(fallback = '') {
      const source = rawText || String(fallback || '');
      visibleText = stripThinkMarkup(source);
      return visibleText;
    }
  };
}
