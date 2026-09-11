/** A presentation lifetime. Tokens stay on the owning thread, never in worker payloads. */
export function createMaracaAbortBoundary({ id = '', parent = null } = {}) {
  const identity = Object.freeze({});
  let epoch = 0, disposed = false, active = true, controller = new AbortController();
  const listeners = new Set();
  let detachParent = null;
  const boundary = Object.freeze({
    id,
    get signal() { return controller.signal; },
    get disposed() { return disposed; },
    get active() { return !disposed && active && (!parent || parent.active); },
    setActive(value, reason = 'visibility-changed') {
      if (disposed || active === Boolean(value)) return false;
      active = Boolean(value);
      boundary.invalidate(reason);
      return true;
    },
    capture() { return Object.freeze({ owner: identity, epoch }); },
    isCurrent(token) { return boundary.active && token?.owner === identity && token.epoch === epoch; },
    invalidate(reason = 'presentation-invalidated') {
      if (disposed) return false;
      const previous = controller;
      controller = new AbortController();
      epoch += 1;
      previous.abort(reason);
      if (!boundary.active) controller.abort(reason);
      [...listeners].forEach(fn => { try { fn(reason); } catch (_) {} });
      return true;
    },
    onInvalidate(listener) {
      if (typeof listener !== 'function') return () => {};
      if (disposed) { try { listener('disposed'); } catch (_) {} return () => {}; }
      listeners.add(listener); return () => listeners.delete(listener);
    },
    dispose() {
      if (disposed) return false;
      disposed = true; epoch += 1; controller.abort('disposed');
      detachParent?.();
      [...listeners].forEach(fn => { try { fn('disposed'); } catch (_) {} });
      listeners.clear(); return true;
    },
    commit(work, token = boundary.capture()) {
      return boundary.isCurrent(token) ? work() : Object.freeze({ ok: false, status: 'superseded' });
    },
    scheduleCommit(scheduler, work, token = boundary.capture(), request = {}) {
      return boundary.run(async ({ signal }) => {
        const handle = scheduler.schedule({ lane: 'visible', ...request }, context => boundary.commit(() => work(context), token));
        const abort = () => handle.cancel('presentation-superseded');
        signal.addEventListener('abort', abort, { once: true });
        if (signal.aborted) abort();
        try { return await handle.result; }
        finally { signal.removeEventListener('abort', abort); }
      }, token);
    },
    run(work, token = boundary.capture()) {
      if (!boundary.isCurrent(token)) return Promise.resolve({ ok: false, status: 'superseded' });
      const signal = controller.signal;
      return new Promise((resolve, reject) => {
        let done = false;
        const finish = (fn, value) => { if (done) return; done = true; signal.removeEventListener('abort', abort); fn(value); };
        const abort = () => finish(resolve, { ok: false, status: 'superseded' });
        signal.addEventListener('abort', abort, { once: true });
        try {
          Promise.resolve(work({ token, signal, isCurrent: () => boundary.isCurrent(token) })).then(
            value => boundary.isCurrent(token) ? finish(resolve, value) : abort(),
            error => boundary.isCurrent(token) ? finish(reject, error) : abort()
          );
        } catch (error) { finish(reject, error); }
      });
    }
  });
  if (parent) detachParent = parent.onInvalidate(reason => parent.disposed ? boundary.dispose() : boundary.invalidate(reason));
  return boundary;
}
