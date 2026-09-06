/** Host-owned cancellation and deadlines for the SSR output adapter. */
export function createRmtSsrStreamHost(options = {}) {
  const controller = new AbortController();
  const forward = () => controller.abort(options.signal.reason);
  if (options.signal?.aborted) forward();
  else options.signal?.addEventListener('abort', forward, {once:true});
  const deadline = Date.now() + (options.streamTimeoutMs || 30000);
  return {
    signal: controller.signal,
    abort(reason) { controller.abort(reason); },
    async next(iterator) {
      controller.signal.throwIfAborted();
      let timer, onAbort;
      try {
        return await Promise.race([
          iterator.next(),
          new Promise((_, reject) => {
            onAbort = () => reject(controller.signal.reason || new Error('Stream aborted.'));
            controller.signal.addEventListener('abort', onAbort, {once:true});
            timer = setTimeout(() => controller.abort(new Error('Stream deadline exceeded.')), Math.max(0, deadline - Date.now()));
          })
        ]);
      } finally { clearTimeout(timer); controller.signal.removeEventListener('abort', onAbort); }
    },
    async close(iterator) {
      controller.abort(); options.signal?.removeEventListener('abort', forward);
      if (!iterator?.return) return;
      let timer;
      try {
        await Promise.race([iterator.return(), new Promise((_, reject) => {timer = setTimeout(() => reject(new Error('SSR iterator cleanup timed out.')), options.cleanupTimeoutMs || 5000);})]);
      } catch (error) { try { options.onCleanupError?.(error); } catch { /* Reporting cannot prevent cleanup. */ } }
      finally { clearTimeout(timer); }
    }
  };
}
