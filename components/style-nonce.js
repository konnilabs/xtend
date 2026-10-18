/** Read only a nonce issued by the host document; never authorize user HTML. */
function styleNonce(documentTarget) {
  const nonce = documentTarget?.currentScript?.nonce
    || documentTarget?.getElementById('xtend-page-data')?.nonce
    || documentTarget?.querySelector('script[nonce]')?.nonce || '';
  return /^[A-Za-z0-9+/_=-]+$/.test(nonce) ? nonce : '';
}

/** Legacy helper for component-owned stylesheet templates. */
export function componentStyleNonce(documentTarget = globalThis.document) {
  const nonce = styleNonce(documentTarget);
  return nonce ? ` nonce="${nonce}"` : '';
}

/** Component-owned CSS stays text, never parsed HTML. */
export function createComponentStyle(cssText, documentTarget = globalThis.document) {
  const style = documentTarget.createElement('style');
  const nonce = styleNonce(documentTarget);
  if (nonce) style.nonce = nonce;
  style.textContent = cssText;
  return style;
}
