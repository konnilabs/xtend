const INLINE_MARKERS = Object.freeze([
  { marker: '`', type: 'code' },
  { marker: '**', type: 'strong' },
  { marker: '__', type: 'strong' },
  { marker: '~~', type: 'delete' },
  { marker: '*', type: 'emphasis' },
  { marker: '_', type: 'emphasis' }
]);

function pushText(tokens, text) {
  if (!text) return;
  const previous = tokens.at(-1);
  if (previous && previous.type === 'text') previous.text += text;
  else tokens.push({ type: 'text', text });
}

function safeLinkHref(rawHref = '') {
  const href = String(rawHref || '').trim();
  if (!href) return '';
  try {
    const parsed = new URL(href);
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol) ? parsed.href : '';
  } catch (_error) {
    return '';
  }
}

function findInlineMarker(text, offset) {
  for (const candidate of INLINE_MARKERS) {
    if (text.startsWith(candidate.marker, offset)) return candidate;
  }
  return null;
}

function parseLink(text, offset) {
  if (!text.startsWith('[', offset)) return null;
  const labelEnd = text.indexOf(']', offset + 1);
  if (labelEnd < 0 || text[labelEnd + 1] !== '(') return null;
  const hrefEnd = text.indexOf(')', labelEnd + 2);
  if (hrefEnd < 0) return null;
  const href = safeLinkHref(text.slice(labelEnd + 2, hrefEnd));
  if (!href) return null;
  const label = text.slice(offset + 1, labelEnd);
  if (!label.trim()) return null;
  return {
    token: {
      type: 'link',
      href,
      children: parseInlineMarkdown(label)
    },
    end: hrefEnd + 1
  };
}

export function parseInlineMarkdown(input = '') {
  const text = String(input || '');
  const tokens = [];
  let index = 0;
  let plainStart = 0;

  while (index < text.length) {
    const link = parseLink(text, index);
    if (link) {
      pushText(tokens, text.slice(plainStart, index));
      tokens.push(link.token);
      index = link.end;
      plainStart = index;
      continue;
    }

    const marker = findInlineMarker(text, index);
    if (!marker) {
      index += 1;
      continue;
    }

    const contentStart = index + marker.marker.length;
    const contentEnd = text.indexOf(marker.marker, contentStart);
    if (contentEnd <= contentStart) {
      index += marker.marker.length;
      continue;
    }

    pushText(tokens, text.slice(plainStart, index));
    const content = text.slice(contentStart, contentEnd);
    tokens.push(marker.type === 'code'
      ? { type: 'code', text: content }
      : { type: marker.type, children: parseInlineMarkdown(content) });
    index = contentEnd + marker.marker.length;
    plainStart = index;
  }

  pushText(tokens, text.slice(plainStart));
  return tokens;
}

function parseListItem(line) {
  const unordered = line.match(/^\s*[-+*]\s+(.+)$/u);
  if (unordered) return { ordered: false, text: unordered[1] };
  const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/u);
  if (ordered) return { ordered: true, text: ordered[1] };
  return null;
}

function flushParagraph(blocks, lines) {
  if (!lines.length) return;
  const text = lines.join('\n').trim();
  if (text) blocks.push({ type: 'paragraph', text });
  lines.length = 0;
}

function flushList(blocks, list) {
  if (!list || !list.items.length) return null;
  blocks.push({
    type: 'list',
    ordered: list.ordered,
    items: list.items
  });
  return null;
}

export function parseMarkdownBlocks(input = '') {
  const text = String(input || '');
  if (!text.trim()) return [];

  const blocks = [];
  const paragraphLines = [];
  let activeList = null;

  for (const rawLine of text.split(/\r?\n/u)) {
    const line = rawLine.replace(/\s+$/u, '');
    if (!line.trim()) {
      flushParagraph(blocks, paragraphLines);
      activeList = flushList(blocks, activeList);
      continue;
    }

    const heading = line.match(/^\s{0,3}(#{1,4})\s+(.+)$/u);
    if (heading) {
      flushParagraph(blocks, paragraphLines);
      activeList = flushList(blocks, activeList);
      blocks.push({
        type: 'heading',
        depth: heading[1].length,
        text: heading[2].trim()
      });
      continue;
    }

    const quote = line.match(/^\s{0,3}>\s?(.+)$/u);
    if (quote) {
      flushParagraph(blocks, paragraphLines);
      activeList = flushList(blocks, activeList);
      blocks.push({
        type: 'quote',
        text: quote[1].trim()
      });
      continue;
    }

    const listItem = parseListItem(line);
    if (listItem) {
      flushParagraph(blocks, paragraphLines);
      if (!activeList || activeList.ordered !== listItem.ordered) {
        activeList = flushList(blocks, activeList) || {
          ordered: listItem.ordered,
          items: []
        };
      }
      activeList.items.push(listItem.text.trim());
      continue;
    }

    activeList = flushList(blocks, activeList);
    paragraphLines.push(line);
  }

  flushParagraph(blocks, paragraphLines);
  flushList(blocks, activeList);
  return blocks;
}
