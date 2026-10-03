export function createTrustedContent({ documentTarget, sanitize, normalizeLinks = () => {} }) {
  if (!documentTarget || typeof sanitize !== 'function') throw new TypeError('documentTarget and sanitize are required');
  let disposed = false;
  return Object.freeze({
    apply(target, html, context = {}) {
      if (disposed) return null;
      const result = sanitize(String(html || ''), context);
      target.replaceChildren(documentTarget.createRange().createContextualFragment(result.html));
      normalizeLinks(target, context);
      return result;
    },
    dispose() { disposed = true; }
  });
}
