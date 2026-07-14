const DEV_API_SCHEMA = 'xtend.devsurface.dev-api.v1';
const PERFORMANCE_SNAPSHOT_SCHEMA = 'xtend.devsurface.performance-snapshot.v1';
const HYDRATION_SNAPSHOT_SCHEMA = 'xtend.devsurface.hydration-snapshot.v1';
const SUBSCRIPTION_EVENT_SCHEMA = 'xtend.devsurface.subscription-event.v1';

function cloneJson(value, fallback) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_) {
    return fallback;
  }
}

function readArray(getter) {
  if (typeof getter !== 'function') return [];
  try {
    const value = getter();
    return Array.isArray(value) ? cloneJson(value, []) : [];
  } catch (_) {
    return [];
  }
}

function readRecord(getter) {
  if (typeof getter !== 'function') return {};
  try {
    const value = getter();
    return value && typeof value === 'object' ? cloneJson(value, {}) : {};
  } catch (_) {
    return {};
  }
}

function browserMeasurement(id, name, phase, durationMs, metadata = {}) {
  return {
    schema: 'xtend.performance.measurement.v1',
    id,
    name,
    phase,
    durationMs: Number(Math.max(0, Number(durationMs || 0)).toFixed(2)),
    sampleKind: 'browser',
    status: 'completed',
    metadata
  };
}

function readPerformanceEntries(globalTarget) {
  const performanceTarget = globalTarget && globalTarget.performance;
  if (!performanceTarget || typeof performanceTarget.getEntriesByType !== 'function') return [];

  const measurements = [];
  let navigationEntries = [];
  let paints = [];
  try {
    navigationEntries = performanceTarget.getEntriesByType('navigation') || [];
    paints = performanceTarget.getEntriesByType('paint') || [];
  } catch (_) {
    return measurements;
  }
  const navigation = navigationEntries[0];
  if (navigation) {
    measurements.push(browserMeasurement(
      'xtend.classic.navigation.response',
      'Navigation response',
      'navigation',
      navigation.responseEnd,
      { entryType: 'navigation' }
    ));
  }

  paints.forEach((entry) => {
    measurements.push(browserMeasurement(
      `xtend.classic.paint.${entry.name}`,
      entry.name,
      'paint',
      entry.startTime,
      { entryType: 'paint' }
    ));
  });
  return measurements;
}

function createNoopController(api) {
  return Object.freeze({
    schema: 'xtend.loader.dev-api-controller.v1',
    api,
    installed: false,
    preserved: true,
    publish() {},
    complete() {}
  });
}

export function installClassicDevApi(options = {}) {
  const globalTarget = options.globalTarget || (typeof window !== 'undefined' ? window : globalThis);
  const existingApi = globalTarget && globalTarget.__XTEND_DEV_API__;
  if (existingApi && typeof existingApi === 'object') return createNoopController(existingApi);

  const subscribers = new Set();
  const state = {
    status: 'degraded',
    sequence: 0,
    lastEvent: null,
    boot: readRecord(options.getBootState)
  };

  function getPerformanceSnapshot() {
    const loaderMeasurements = readArray(options.getMeasurements);
    return {
      schema: PERFORMANCE_SNAPSHOT_SCHEMA,
      supported: true,
      status: state.status,
      measurements: loaderMeasurements.concat(readPerformanceEntries(globalTarget)),
      metadata: {
        hostMode: 'classic-loader',
        boot: readRecord(options.getBootState),
        diagnosticCount: readArray(options.getDiagnostics).length
      }
    };
  }

  function getFabricTelemetrySnapshot() {
    return {
      schema: 'xtend.fabric.telemetry-snapshot.v1',
      supported: false,
      status: 'degraded',
      lanes: {},
      totals: {
        fiberCount: 0,
        completedCount: 0,
        failedCount: 0,
        budgetMissCount: 0
      },
      backpressure: { level: 'unknown', action: 'not-active' },
      diagnostics: [{
        code: 'xtend.classic.fabric.not_active',
        severity: 'info',
        message: 'Fabric is not active in this XTend Classic host.'
      }]
    };
  }

  function getKernelSnapshot() {
    return {
      schema: 'xtend.rmt.kernel-panic-state.v1',
      supported: false,
      status: 'degraded',
      state: 'unknown',
      severity: 'info',
      affectedScopes: [],
      affectedJobs: [],
      metadata: {
        hostMode: 'classic-loader',
        reason: 'rmt-kernel-not-active'
      }
    };
  }

  function getHydrationSnapshot() {
    return {
      schema: HYDRATION_SNAPSHOT_SCHEMA,
      supported: false,
      strategy: 'classic_loader_no_ssr',
      status: 'degraded',
      timing: {},
      surfaces: [],
      xscaler: {},
      diagnostics: [{
        code: 'xtend.classic.hydration.not_active',
        severity: 'info',
        message: 'SSR hydration is not active in this XTend Classic host.'
      }]
    };
  }

  function subscribe(listener) {
    if (typeof listener !== 'function') return function noop() {};
    subscribers.add(listener);
    return function unsubscribe() {
      subscribers.delete(listener);
    };
  }

  function publish(kind, detail = null) {
    state.sequence += 1;
    state.lastEvent = {
      schema: SUBSCRIPTION_EVENT_SCHEMA,
      sequence: state.sequence,
      kind: String(kind || 'update'),
      status: state.status,
      detail: cloneJson(detail, null)
    };
    subscribers.forEach((listener) => {
      try {
        listener(cloneJson(state.lastEvent, null));
      } catch (_) {
        // A diagnostic subscriber cannot affect the product runtime.
      }
    });
  }

  function complete(bootResult = null, status = 'ready') {
    state.status = status === 'degraded' ? 'degraded' : 'ready';
    state.boot = cloneJson(bootResult, {});
    publish('loader-ready', {
      schema: bootResult && bootResult.schema || null,
      loadedTags: bootResult && bootResult.loadedTags || []
    });
  }

  const api = Object.freeze({
    schema: DEV_API_SCHEMA,
    version: '1.0.0',
    getPerformanceSnapshot,
    getFabricTelemetrySnapshot,
    getKernelSnapshot,
    getHydrationSnapshot,
    subscribe
  });
  globalTarget.__XTEND_DEV_API__ = api;

  return Object.freeze({
    schema: 'xtend.loader.dev-api-controller.v1',
    api,
    installed: true,
    preserved: false,
    publish,
    complete
  });
}

export { DEV_API_SCHEMA };
