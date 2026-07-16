export const WORKBENCH_DEV_API_SCHEMA = 'xtend.material.workbench-dev-api.v1';
export const XTEND_DEV_API_SCHEMA = 'xtend.devsurface.dev-api.v1';
export const WORKBENCH_TELEMETRY_SCHEMA = 'xtend.material.workbench-telemetry.v1';

function clone(value, fallback) {
  try { return JSON.parse(JSON.stringify(value)); } catch (_) { return fallback; }
}

function currentSnapshot(target, name) {
  const controller = target && target[name];
  return controller && typeof controller.snapshot === 'function' ? clone(controller.snapshot(), {}) : {};
}

function measurement(id, name, phase, durationMs, budgetMs, metadata = {}) {
  const duration = Math.max(0, Number(durationMs || 0));
  return {
    schema: 'xtend.performance.measurement.v1', id, name, phase,
    durationMs: Number(duration.toFixed(2)), budgetMs, sampleKind: 'browser',
    status: duration <= budgetMs ? 'pass' : 'fail', metadata
  };
}

export function installWorkbenchDevApi(options = {}) {
  const target = options.globalTarget || globalThis;
  const bootResult = clone(options.bootResult, {});
  const bootDurationMs = Math.max(0, Number(options.bootDurationMs || 0));
  const subscribers = new Set();
  let sequence = 0;

  function getPerformanceSnapshot() {
    const measurements = [measurement('xtm.maraca.boot', 'Maraca runtime boot', 'boot', bootDurationMs, 1500, { surfaceCount: bootResult.surfaceCount || 0 })];
    const performanceTarget = target.performance;
    if (performanceTarget && typeof performanceTarget.getEntriesByType === 'function') {
      const navigation = (performanceTarget.getEntriesByType('navigation') || [])[0];
      if (navigation) measurements.push(measurement('xtm.navigation.response', 'Navigation response', 'navigation', navigation.responseEnd, 650));
      (performanceTarget.getEntriesByType('paint') || []).forEach((entry) => measurements.push(measurement(`xtm.paint.${entry.name}`, entry.name, 'paint', entry.startTime, 1200)));
    }
    return clone({
      schema: 'xtend.devsurface.performance-snapshot.v1', supported: true,
      status: bootResult.ok ? 'ready' : 'degraded', measurements,
      metadata: { hostMode: 'maraca-runtime', product: '@ccslabs/xtend-material-workbench' }
    }, {});
  }

  function getFabricTelemetrySnapshot() {
    const kernel = currentSnapshot(target, '__XTendMaracaKernel');
    const fibers = Array.isArray(kernel.fibers) ? kernel.fibers : [];
    const lanes = {};
    fibers.forEach((fiber) => {
      const lane = String(fiber && fiber.kind || 'unknown');
      if (!lanes[lane]) lanes[lane] = { fiberCount: 0, completedCount: 0, failedCount: 0, budgetMissCount: 0 };
      lanes[lane].fiberCount += 1;
      if (fiber.status === 'error' || fiber.status === 'failed') lanes[lane].failedCount += 1;
      else lanes[lane].completedCount += 1;
    });
    const totals = Object.values(lanes).reduce((sum, lane) => ({
      fiberCount: sum.fiberCount + lane.fiberCount,
      completedCount: sum.completedCount + lane.completedCount,
      failedCount: sum.failedCount + lane.failedCount,
      budgetMissCount: sum.budgetMissCount + lane.budgetMissCount
    }), { fiberCount: 0, completedCount: 0, failedCount: 0, budgetMissCount: 0 });
    return clone({
      schema: 'xtend.fabric.telemetry-snapshot.v1', supported: Boolean(kernel.enabled),
      status: kernel.status === 'booted' ? 'ready' : 'degraded', lanes, totals,
      backpressure: { level: totals.failedCount > 0 ? 'elevated' : 'none', action: totals.failedCount > 0 ? 'inspect' : 'observe' },
      diagnostics: Array.isArray(kernel.diagnostics) ? kernel.diagnostics : []
    }, {});
  }

  function getKernelSnapshot() {
    const kernel = currentSnapshot(target, '__XTendMaracaKernel');
    const healthy = kernel.status === 'booted';
    return clone({
      schema: 'xtend.rmt.kernel-panic-state.v1', supported: Boolean(kernel.enabled),
      status: healthy ? 'ready' : 'degraded', state: healthy ? 'none' : (kernel.status === 'error' ? 'panic' : 'unknown'),
      severity: kernel.status === 'error' ? 'error' : 'info', recoveryAction: healthy ? 'none' : 'inspect',
      mitigationStrategy: healthy ? 'observe' : 'contain', affectedScopes: [], affectedJobs: [],
      metadata: { runtime: kernel }
    }, {});
  }

  function getHydrationSnapshot() {
    const hydration = currentSnapshot(target, '__XTendMaracaHydration');
    const records = Array.isArray(hydration.records) ? hydration.records : [];
    const history = Array.isArray(hydration.history) ? hydration.history : [];
    return clone({
      schema: 'xtend.devsurface.hydration-snapshot.v1', supported: Boolean(hydration.enabled),
      strategy: hydration.mode || 'runtime_render',
      status: hydration.status === 'ready' || hydration.status === 'booted' ? 'ready' : 'degraded',
      timing: { bootMs: bootDurationMs },
      surfaces: records.map((record) => ({
        id: record.surface, component: record.component, strategy: record.policy,
        status: history.some((entry) => entry.surface === record.surface && entry.status === 'hydrated') ? 'ready' : 'pending'
      })),
      xscaler: { mode: 'local-air-gapped', networkDuringRender: false },
      diagnostics: Array.isArray(hydration.diagnostics) ? hydration.diagnostics : []
    }, {});
  }

  function subscribe(listener) {
    if (typeof listener !== 'function') return () => {};
    subscribers.add(listener);
    return () => subscribers.delete(listener);
  }

  function publish(kind, detail = null) {
    const event = clone({ schema: 'xtend.devsurface.subscription-event.v1', sequence: ++sequence, kind, status: bootResult.ok ? 'ready' : 'degraded', detail }, null);
    subscribers.forEach((listener) => { try { listener(event); } catch (_) {} });
  }

  const api = Object.freeze({
    schema: XTEND_DEV_API_SCHEMA,
    version: '1.0.0-xtend-material-workbench',
    getPerformanceSnapshot, getFabricTelemetrySnapshot, getKernelSnapshot, getHydrationSnapshot, subscribe
  });
  Object.defineProperty(target, '__XTEND_DEV_API__', { configurable: true, enumerable: false, value: api });
  publish('maraca-runtime-ready', { surfaceCount: bootResult.surfaceCount || 0 });
  return Object.freeze({ schema: WORKBENCH_DEV_API_SCHEMA, api, publish });
}
