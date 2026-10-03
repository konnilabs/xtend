/** Route-scoped content requests; callers own the supplied route signal. */
export function createContentService({ fetchImpl, buildUrl, verifyPayload = async (value) => value }) {
  if (typeof fetchImpl !== 'function' || typeof buildUrl !== 'function') throw new TypeError('fetchImpl and buildUrl are required');
  let disposed = false;
  const requests = new Set();
  return Object.freeze({
    async load({ slug, locale, signal }) {
      if (disposed || signal?.aborted) throw new DOMException('Route disposed', 'AbortError');
      const controller = new AbortController();
      const abort = () => controller.abort(signal?.reason);
      signal?.addEventListener('abort', abort, { once: true });
      requests.add(controller);
      try {
        const response = await fetchImpl(buildUrl(slug, locale), { signal: controller.signal, headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error(`Docs content request failed (${response.status})`);
        return await verifyPayload(await response.json());
      } finally {
        signal?.removeEventListener('abort', abort);
        requests.delete(controller);
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      requests.forEach((request) => request.abort('content-service-disposed'));
      requests.clear();
    }
  });
}
