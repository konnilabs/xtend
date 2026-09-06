// Follow rendered slots and open shadow roots so remote and composed controls
// participate in the same keyboard boundary as the owning overlay.
export function trapOverlayFocus(event, panel) {
  if (event.defaultPrevented || event.key !== 'Tab' || !panel) return;
  const document = panel.ownerDocument;
  const focusable = [];
  const visited = new Set();
  function visit(element) {
    if (!element || element.nodeType !== 1 || visited.has(element)) return;
    visited.add(element);
    if (element.hidden || element.inert || element.getAttribute('aria-hidden') === 'true') return;
    const style = document.defaultView.getComputedStyle(element);
    if (style.display === 'none') return;
    if (element.tabIndex >= 0 && !element.matches(':disabled') &&
        style.visibility !== 'hidden' && style.visibility !== 'collapse' && element.getClientRects().length) {
      focusable.push(element);
    }
    const children = element.shadowRoot ? element.shadowRoot.children
      : element.localName === 'slot' ? element.assignedElements({flatten: true}) : element.children;
    const rendered = element.localName === 'slot' && !children.length ? element.children : children;
    for (const child of rendered) visit(child);
  }
  for (const child of panel.children) visit(child);
  focusable.sort((a, b) => (a.tabIndex > 0 ? a.tabIndex : Number.MAX_SAFE_INTEGER) - (b.tabIndex > 0 ? b.tabIndex : Number.MAX_SAFE_INTEGER));
  let active = document.activeElement;
  while (active && active.shadowRoot && active.shadowRoot.activeElement) active = active.shadowRoot.activeElement;
  const first = focusable[0], last = focusable[focusable.length - 1];
  if (!first) {
    event.preventDefault();
    panel.focus();
  } else if (active === panel || !focusable.includes(active)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  } else if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}
