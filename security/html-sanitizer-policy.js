'use strict';

// Shared by the generated browser, kernel and Node adapters. No regex HTML parsing.
function createHtmlSanitizer(windowTarget, createDOMPurify) {
  const boundary = 'xtend.security.sanitizing-boundary.v1';
  let purifier;
  try { purifier = createDOMPurify(windowTarget); } catch (_) {}
  const policy = {
    ALLOWED_TAGS: ['a', 'abbr', 'b', 'blockquote', 'br', 'caption', 'code', 'dd', 'del', 'details', 'div', 'dl', 'dt', 'em', 'figcaption', 'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 'li', 'ol', 'p', 'pre', 's', 'section', 'small', 'span', 'strong', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'th', 'thead', 'tr', 'u', 'ul'],
    ALLOWED_ATTR: ['alt', 'class', 'colspan', 'height', 'href', 'id', 'rel', 'role', 'rowspan', 'scope', 'src', 'title', 'width'],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: true,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    FORBID_TAGS: ['svg', 'math', 'style', 'template', 'script', 'form', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['style', 'srcdoc', 'srcset'],
    RETURN_TRUSTED_TYPE: true
  };
  if (purifier && purifier.isSupported) {
    purifier.addHook('uponSanitizeAttribute', (_node, data) => {
      if (!['href', 'src'].includes(data.attrName)) return;
      // Attribute values have already been decoded by the HTML parser.
      const value = data.attrValue.trim().replace(/[\u0000-\u0020\u007f]/g, '');
      const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(value);
      if (scheme && !['http', 'https', 'mailto', 'tel'].includes(scheme[1].toLowerCase())) data.keepAttr = false;
    });
  }
  return function sanitizeHtml(html) {
    const result = {schema: 'xtend.security.trusted-dom-sanitizer.v1', boundary, markupClass: 'htmlFragment', ok: false, sanitized: false, html: '', removed: [], removedCount: 0};
    if (!purifier || !purifier.isSupported) return result;
    try {
      result.html = purifier.sanitize(String(html || ''), policy);
      result.removed = purifier.removed.map((entry) => ({type: entry.attribute ? 'attribute' : 'element', name: entry.attribute?.name || entry.element?.localName || 'unknown'}));
      result.removedCount = result.removed.length;
      result.ok = result.sanitized = true;
    } catch (_) { result.html = ''; }
    return result;
  };
}

module.exports = {createHtmlSanitizer};
