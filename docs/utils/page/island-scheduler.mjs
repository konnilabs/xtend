/** Schedules an island after visibility or explicit user intent. */
export function createVisibleOrIntentIsland({ root, activate, scheduleIdle, IntersectionObserverImpl, signal }) {
  let disposed = false;
  let activated = false;
  let observer = null;
  let cancelIdle = null;
  let islandDispose = null;
  const listeners = [];
  const cleanup = () => { observer?.disconnect(); observer = null; cancelIdle?.(); cancelIdle = null; listeners.splice(0).forEach((fn) => fn()); };
  const run = async (reason) => {
    if (disposed || activated || signal?.aborted) return;
    activated = true; cleanup();
    const result = await activate({ reason, signal });
    if (disposed) result?.(); else if (typeof result === 'function') islandDispose = result;
  };
  const listen = (type, fn, options) => { root.addEventListener(type, fn, options); listeners.push(() => root.removeEventListener(type, fn, options)); };
  listen('pointerdown', () => run('user-intent'), { capture: true, passive: true });
  listen('focusin', () => run('user-intent'), { capture: true });
  if (IntersectionObserverImpl) {
    observer = new IntersectionObserverImpl((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) cancelIdle ||= scheduleIdle(() => run('visible-idle'));
    }, { rootMargin: '160px' });
    observer.observe(root);
  } else cancelIdle = scheduleIdle(() => run('visible-idle'));
  const dispose = () => { if (disposed) return; disposed = true; cleanup(); islandDispose?.(); islandDispose = null; };
  signal?.addEventListener('abort', dispose, { once: true });
  return Object.freeze({ dispose });
}
