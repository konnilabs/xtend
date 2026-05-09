(function registerLocalTurndown(global) {
  if (global.TurndownService) return;

  const blockTags = new Set([
    'ADDRESS',
    'ARTICLE',
    'ASIDE',
    'BLOCKQUOTE',
    'DIV',
    'FOOTER',
    'HEADER',
    'MAIN',
    'NAV',
    'P',
    'SECTION'
  ]);

  function escapeMarkdown(value) {
    return String(value || '')
      .replace(/\\/g, '\\\\')
      .replace(/([*_`[\]])/g, '\\$1');
  }

  function collapseBlankLines(value) {
    return String(value || '').replace(/\n{3,}/g, '\n\n');
  }

  function renderChildren(node, context = {}) {
    return Array.from(node.childNodes || [])
      .map((child) => renderNode(child, context))
      .join('');
  }

  function renderList(node, ordered) {
    return Array.from(node.children || [])
      .filter((child) => child.tagName === 'LI')
      .map((child, index) => {
        const marker = ordered ? `${index + 1}. ` : '- ';
        const content = collapseBlankLines(renderChildren(child).trim()).replace(/\n/g, '\n  ');
        return `${marker}${content}`;
      })
      .join('\n');
  }

  function renderNode(node, context = {}) {
    if (node.nodeType === Node.TEXT_NODE) {
      return escapeMarkdown(node.textContent);
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const tag = node.tagName;
    const content = renderChildren(node, context);

    if (/^H[1-6]$/.test(tag)) {
      return `\n\n${'#'.repeat(Number(tag.slice(1)))} ${content.trim()}\n\n`;
    }

    if (tag === 'BR') return '\n';
    if (tag === 'STRONG' || tag === 'B') return `**${content.trim()}**`;
    if (tag === 'EM' || tag === 'I') return `_${content.trim()}_`;
    if (tag === 'CODE' && node.parentElement && node.parentElement.tagName !== 'PRE') return `\`${content.trim()}\``;
    if (tag === 'PRE') return `\n\n\`\`\`\n${node.textContent.trim()}\n\`\`\`\n\n`;
    if (tag === 'A') {
      const href = node.getAttribute('href') || '';
      return href ? `[${content.trim() || href}](${href})` : content;
    }
    if (tag === 'IMG') {
      const alt = node.getAttribute('alt') || '';
      const src = node.getAttribute('src') || '';
      return src ? `![${escapeMarkdown(alt)}](${src})` : '';
    }
    if (tag === 'UL') return `\n\n${renderList(node, false)}\n\n`;
    if (tag === 'OL') return `\n\n${renderList(node, true)}\n\n`;
    if (tag === 'BLOCKQUOTE') {
      return `\n\n${collapseBlankLines(content.trim()).split('\n').map((line) => `> ${line}`).join('\n')}\n\n`;
    }

    if (blockTags.has(tag)) {
      return `\n\n${content.trim()}\n\n`;
    }

    return content;
  }

  class TurndownService {
    constructor(options = {}) {
      this.options = { ...options };
      this.rules = [];
    }

    addRule(name, rule) {
      this.rules.push({ name, rule });
      return this;
    }

    turndown(input) {
      const template = document.createElement('template');
      template.innerHTML = String(input || '');
      return collapseBlankLines(renderChildren(template.content)).trim();
    }
  }

  global.TurndownService = TurndownService;
})(window);
