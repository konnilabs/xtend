import {
  RMT_KERNEL_SCHEDULER_SCHEMA
} from './rmt-kernel-scheduler.js';

const RMT_BROWSER_SCHEDULER_SCHEMA = 'xtend.rmt.browser-scheduler.v2';
const LEGACY_LANES = Object.freeze({
  critical_input: 'user-blocking',
  visible_commit: 'visible',
  hydration_followup: 'visible',
  background_prepare: 'background',
  idle_maintenance: 'idle'
});

function text(value, fallback = '') {
  const normalized = String(value == null ? '' : value).trim();
  return normalized || fallback;
}

function normalizeLegacyRequest(endpointName, scope, scheduleOptions, diagnostics) {
  const options = scheduleOptions && typeof scheduleOptions === 'object' ? scheduleOptions : {};
  const legacyKind = text(options.kind, '');
  const requestedLane = text(options.lane || (options.schedule && options.schedule.lane), '');
  const lane = LEGACY_LANES[requestedLane]
    || requestedLane
    || (legacyKind === 'idle' ? 'idle' : 'visible');

  if (legacyKind || Object.prototype.hasOwnProperty.call(options, 'timeout') || LEGACY_LANES[requestedLane]) {
    diagnostics.push(Object.freeze({
      schema: 'xtend.rmt.browser-scheduler-diagnostic.v1',
      code: 'rmt.browser_scheduler.legacy_options_mapped',
      severity: 'warning',
      endpointName,
      legacyKind: legacyKind || null,
      legacyLane: LEGACY_LANES[requestedLane] ? requestedLane : null
    }));
  }

  return {
    id: options.id,
    endpointName,
    scope,
    rootId: options.rootId,
    lane,
    priority: options.priority != null ? options.priority : (options.schedule && options.schedule.priority),
    deadlineMs: options.deadlineMs != null
      ? options.deadlineMs
      : (options.timeout != null ? options.timeout : options.schedule && options.schedule.deadlineMs),
    timeoutMs: options.timeoutMs,
    delayMs: options.delayMs,
    budgetClass: options.budgetClass || (options.schedule && options.schedule.budgetClass),
    maxChunkMs: options.maxChunkMs || (options.chunking && options.chunking.maxChunkMs),
    coalesceKey: options.coalesceKey || (options.schedule && options.schedule.coalesceKey),
    strategy: legacyKind === 'after_paint'
      ? 'after_paint'
      : (legacyKind === 'idle' ? 'idle' : text(options.strategy, 'microtask')),
    metadata: {
      ...(options.metadata && typeof options.metadata === 'object' ? options.metadata : {}),
      adapterSchema: RMT_BROWSER_SCHEDULER_SCHEMA
    }
  };
}

export function createRmtBrowserScheduler(options = {}) {
  const diagnostics = [];
  const kernelScheduler = options.kernelScheduler
    || options.scheduler;
  const handles = new Map();

  if (!kernelScheduler || kernelScheduler.schema !== RMT_KERNEL_SCHEDULER_SCHEMA || typeof kernelScheduler.schedule !== 'function') {
    throw new TypeError('createRmtBrowserScheduler() requires a valid RMT kernel scheduler authority.');
  }

  function track(handle) {
    handles.set(handle.id, handle);
    handle.result.then(
      () => handles.delete(handle.id),
      () => handles.delete(handle.id)
    );
    return handle;
  }

  function schedule(request, callback) {
    return track(kernelScheduler.schedule(request, callback));
  }

  function scheduleEndpoint(endpointName, scope, callback, scheduleOptions = {}) {
    if (typeof callback !== 'function') throw new TypeError('scheduleEndpoint() requires a callback.');
    const request = normalizeLegacyRequest(
      text(endpointName, 'rmt.browser.endpoint'),
      text(scope, 'rmt.browser'),
      scheduleOptions,
      diagnostics
    );
    return schedule(request, (jobContext) => callback(jobContext));
  }

  function afterPaint(callback, scheduleOptions = {}) {
    return scheduleEndpoint(
      scheduleOptions.endpointName || 'rmt.browser.after-paint',
      scheduleOptions.scope || 'rmt.browser',
      callback,
      { ...scheduleOptions, kind: 'after_paint', lane: scheduleOptions.lane || 'visible' }
    );
  }

  function dispose(reason = 'browser_scheduler_disposed') {
    let cancelled = 0;
    [...handles.values()].forEach((handle) => {
      if (handle.cancel(reason)) cancelled += 1;
    });
    return cancelled > 0;
  }

  return Object.freeze({
    schema: RMT_BROWSER_SCHEDULER_SCHEMA,
    kernelScheduler,
    schedule,
    afterPaint,
    scheduleEndpoint,
    updatePressure: kernelScheduler.updatePressure.bind(kernelScheduler),
    listDiagnostics: () => diagnostics.concat(kernelScheduler.listDiagnostics()),
    dispose,
    snapshot: () => Object.freeze({
      schema: RMT_BROWSER_SCHEDULER_SCHEMA,
      schedulerSchema: kernelScheduler.schema,
      ownedKernelScheduler: false,
      activeHandleCount: handles.size,
      diagnosticCount: diagnostics.length,
      kernel: kernelScheduler.snapshot()
    })
  });
}

export { RMT_BROWSER_SCHEDULER_SCHEMA };
export default Object.freeze({ RMT_BROWSER_SCHEDULER_SCHEMA, createRmtBrowserScheduler });
