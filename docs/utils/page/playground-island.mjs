/** Route-local playground island. Its large implementation is supplied lazily. */
export function createPlaygroundIsland({ root, locale, relatedLinks, prepare, render, signal }) {
  let disposed = false;
  let childDispose = null;
  const ready = Promise.resolve(prepare()).then((available) => {
    if (!available || disposed || signal?.aborted) return null;
    const island = render(root, locale, relatedLinks);
    childDispose = typeof island?.__xtendDocsDispose === 'function' ? () => island.__xtendDocsDispose() : null;
    return island;
  });
  return Object.freeze({ ready, dispose() { if (disposed) return; disposed = true; childDispose?.(); childDispose = null; } });
}
