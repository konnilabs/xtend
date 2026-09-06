/** Only component-owned stylesheet templates call this helper. Never nonce
 * arbitrary user HTML: a nonce authorizes the entire stylesheet element. */
export function componentStyleNonce(documentTarget = globalThis.document) {
  const nonce = documentTarget?.currentScript?.nonce
    || documentTarget?.getElementById('xtend-page-data')?.nonce
    || documentTarget?.querySelector('script[nonce]')?.nonce || '';
  return /^[A-Za-z0-9+/_=-]+$/.test(nonce) ? ` nonce="${nonce}"` : '';
}
