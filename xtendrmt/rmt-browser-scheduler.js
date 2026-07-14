const RMT_BROWSER_SCHEDULER_SCHEMA = 'xtend.rmt.browser-scheduler.v1';

export function createRmtBrowserScheduler(options = {}) {
  const windowTarget = options.windowTarget || globalThis;
  const scheduled = new Set();
  function track(dispose) { scheduled.add(dispose); return () => { scheduled.delete(dispose); dispose(); }; }
  function afterPaint(callback) {
    let cancelled = false;
    let first = 0;
    let second = 0;
    const run = () => { if (!cancelled) callback(); };
    if (typeof windowTarget.requestAnimationFrame === 'function') {
      first = windowTarget.requestAnimationFrame(() => { second = windowTarget.requestAnimationFrame(run); });
      return track(() => { cancelled = true; if (first) windowTarget.cancelAnimationFrame(first); if (second) windowTarget.cancelAnimationFrame(second); });
    }
    const timer = windowTarget.setTimeout(run, 0);
    return track(() => { cancelled = true; windowTarget.clearTimeout(timer); });
  }
  function scheduleEndpoint(endpointName, _scope, callback, scheduleOptions = {}) {
    if (scheduleOptions.kind === 'after_paint') return afterPaint(callback);
    let cancelled = false;
    const run = (deadline) => { if (!cancelled) callback(deadline || null); };
    if (scheduleOptions.kind === 'delay' || Number(scheduleOptions.delayMs) > 0) {
      const timer = windowTarget.setTimeout(run, Math.max(0, Number(scheduleOptions.delayMs) || 0));
      return track(() => { cancelled = true; windowTarget.clearTimeout(timer); });
    }
    if (typeof windowTarget.requestIdleCallback === 'function') {
      const id = windowTarget.requestIdleCallback(run, { timeout: scheduleOptions.timeout || 1000 });
      return track(() => { cancelled = true; windowTarget.cancelIdleCallback(id); });
    }
    const timer = windowTarget.setTimeout(run, Math.min(80, scheduleOptions.timeout || 1000));
    return track(() => { cancelled = true; windowTarget.clearTimeout(timer); });
  }
  function dispose() { [...scheduled].forEach((cancel) => cancel()); scheduled.clear(); }
  return Object.freeze({ schema: RMT_BROWSER_SCHEDULER_SCHEMA, afterPaint, scheduleEndpoint, dispose, snapshot: () => ({ schema: RMT_BROWSER_SCHEDULER_SCHEMA, scheduled: scheduled.size }) });
}

export { RMT_BROWSER_SCHEDULER_SCHEMA };
export default Object.freeze({ RMT_BROWSER_SCHEDULER_SCHEMA, createRmtBrowserScheduler });
