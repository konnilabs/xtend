const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { createSuiteContext, printSuiteReport } = require('../utils/assertions');

function createDeterministicHost() {
  let current = 0;
  let sequence = 0;
  const microtasks = [];
  const timers = [];

  function queueMicrotask(callback) {
    microtasks.push(callback);
  }

  function setTimeout(callback, delayMs = 0) {
    const handle = {
      id: ++sequence,
      at: current + Math.max(0, Number(delayMs) || 0),
      callback,
      cancelled: false
    };
    timers.push(handle);
    return handle;
  }

  function clearTimeout(handle) {
    if (handle) handle.cancelled = true;
  }

  async function flushMicrotasks(limit = 100) {
    let turns = 0;
    while (microtasks.length > 0 && turns < limit) {
      const callback = microtasks.shift();
      callback();
      await Promise.resolve();
      turns += 1;
    }
    await Promise.resolve();
    return turns;
  }

  async function advance(ms) {
    current += Math.max(0, Number(ms) || 0);
    let ran = true;
    while (ran) {
      ran = false;
      timers
        .filter((timer) => !timer.cancelled && timer.at <= current)
        .sort((left, right) => left.at - right.at || left.id - right.id)
        .forEach((timer) => {
          if (timer.cancelled) return;
          timer.cancelled = true;
          timer.callback();
          ran = true;
        });
      await flushMicrotasks();
    }
  }

  return {
    schema: 'xtend.test.scheduler-host.v1',
    now: () => current,
    queueMicrotask,
    setTimeout,
    clearTimeout,
    createAbortController: () => new AbortController(),
    flushMicrotasks,
    advance
  };
}

async function importScheduler(rootDir) {
  const modulePath = path.join(rootDir, 'xtendrmt/rmt-kernel-scheduler.js');
  return import(`${pathToFileURL(modulePath).href}?test=${Date.now()}`);
}

async function importBrowserScheduler(rootDir) {
  const modulePath = path.join(rootDir, 'xtendrmt/rmt-browser-scheduler.js');
  return import(`${pathToFileURL(modulePath).href}?test=${Date.now()}`);
}

async function runRmtKernelSchedulerSuite(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..', '..');
  const context = createSuiteContext('RMT Kernel 0.8 Microkernel Scheduler');
  const api = await importScheduler(rootDir);
  const browserApi = await importBrowserScheduler(rootDir);
  const sourcePath = path.join(rootDir, 'xtendrmt/rmt-kernel-scheduler.js');
  const source = fs.readFileSync(sourcePath, 'utf8');
  const gzipBytes = require('zlib').gzipSync(source, { level: 9 }).length;

  context.assert(api.RMT_KERNEL_SCHEDULER_SCHEMA === 'xtend.rmt.kernel-scheduler.v1', 'scheduler exposes v1 contract');
  context.assert(api.RMT_SCHEDULER_LANES.join(',') === 'user-blocking,visible,transition,idle,background,diagnostics', 'scheduler exposes canonical vNext lanes');
  context.assert(source.length <= 160 * 1024, 'microkernel stays below 160 KiB raw');
  context.assert(gzipBytes <= 32 * 1024, 'microkernel stays below 32 KiB gzip');
  ['document.', 'createRmtProductSurface', 'prewarm', 'templateRegistry'].forEach((forbidden) => {
    context.assert(!source.includes(forbidden), `microkernel excludes ${forbidden}`);
  });

  const orderingHost = createDeterministicHost();
  const orderingScheduler = api.createRmtKernelScheduler({ hostPort: orderingHost, preferPostTask: false });
  const order = [];
  const background = orderingScheduler.schedule({ id: 'background', lane: 'background' }, () => order.push('background'));
  const visible = orderingScheduler.schedule({ id: 'visible', lane: 'visible' }, () => order.push('visible'));
  const blocking = orderingScheduler.schedule({ id: 'blocking', lane: 'user-blocking' }, () => order.push('blocking'));
  await orderingHost.flushMicrotasks();
  await Promise.all([background, visible, blocking]);
  context.assert(order.join(',') === 'blocking,visible,background', 'queue dispatches canonical lanes by priority');
  context.assert(orderingScheduler.snapshot().telemetry.completed === 3, 'scheduler records completed jobs');

  const asyncHost = createDeterministicHost();
  const asyncScheduler = api.createRmtKernelScheduler({ hostPort: asyncHost, preferPostTask: false });
  let releaseAsync;
  const pendingResult = new Promise((resolve) => { releaseAsync = resolve; });
  const waiting = asyncScheduler.schedule({ id: 'waiting', lane: 'visible' }, () => pendingResult);
  const follower = asyncScheduler.schedule({ id: 'follower', lane: 'background' }, () => 'follower-result');
  await asyncHost.flushMicrotasks();
  context.assert(waiting.status === 'waiting', 'thenable work remains waiting until settlement');
  context.assert(follower.status === 'completed', 'waiting promise releases the active scheduler slot');
  releaseAsync('async-result');
  context.assert(await waiting === 'async-result' && await follower === 'follower-result', 'thenable handles resolve to callback values');
  context.assert(waiting.status === 'completed', 'async settlement completes job lifecycle');

  const rejection = asyncScheduler.schedule({ id: 'async-rejection' }, async () => {
    await Promise.resolve();
    throw new Error('late failure');
  });
  await asyncHost.flushMicrotasks();
  let rejectionMessage = '';
  try {
    await rejection;
  } catch (error) {
    rejectionMessage = error.message;
  }
  context.assert(rejection.status === 'failed' && rejectionMessage === 'late failure', 'async rejection is classified as failed');

  const yieldHost = createDeterministicHost();
  const yieldScheduler = api.createRmtKernelScheduler({ hostPort: yieldHost, preferPostTask: false });
  const yieldOrder = [];
  const yielding = yieldScheduler.schedule({ id: 'yielding', lane: 'visible', maxChunkMs: 1 }, async (jobContext) => {
    yieldOrder.push('visible:start');
    yieldScheduler.schedule({ id: 'interrupt', lane: 'user-blocking' }, () => yieldOrder.push('blocking'));
    await jobContext.yield('test_yield');
    yieldOrder.push('visible:resume');
    return 'yielded-result';
  });
  await yieldHost.flushMicrotasks();
  await yielding;
  context.assert(yieldOrder.join(',') === 'visible:start,blocking,visible:resume', 'yield permits higher-priority work between chunks');
  context.assert(yielding.snapshot().yieldCount === 1, 'yield count remains observable on the job handle');

  const cancelHost = createDeterministicHost();
  const cancelScheduler = api.createRmtKernelScheduler({ hostPort: cancelHost, preferPostTask: false });
  let releaseCancelled;
  const cancelledPromise = new Promise((resolve) => { releaseCancelled = resolve; });
  const cancelled = cancelScheduler.schedule({ id: 'cancelled' }, () => cancelledPromise);
  await cancelHost.flushMicrotasks();
  context.assert(cancelled.status === 'waiting', 'cancellation probe enters waiting state');
  context.assert(cancelled.cancel('user_cancelled') === true && cancelled.status === 'aborted', 'running or waiting cancellation aborts the job');
  releaseCancelled('late');
  let cancelledCode = '';
  try {
    await cancelled;
  } catch (error) {
    cancelledCode = error.code;
  }
  context.assert(cancelledCode === 'rmt.scheduler.aborted', 'cancelled async work rejects with normalized abort code');
  await Promise.resolve();
  context.assert(cancelled.status === 'aborted', 'late promise settlement cannot overwrite aborted status');

  const coalesceHost = createDeterministicHost();
  const coalesceScheduler = api.createRmtKernelScheduler({ hostPort: coalesceHost, preferPostTask: false });
  const replaced = coalesceScheduler.schedule({ id: 'old', scope: 'surface', coalesceKey: 'render' }, () => 'old');
  const replacement = coalesceScheduler.schedule({ id: 'new', scope: 'surface', coalesceKey: 'render' }, () => 'new');
  await coalesceHost.flushMicrotasks();
  await replacement;
  context.assert(replaced.status === 'cancelled' && replaced.reason === 'coalesced_replaced', 'coalescing deterministically cancels replaced work');
  context.assert(coalesceScheduler.snapshot().telemetry.coalesced === 1, 'coalescing remains observable');

  const timeoutHost = createDeterministicHost();
  const timeoutScheduler = api.createRmtKernelScheduler({ hostPort: timeoutHost, preferPostTask: false });
  const timed = timeoutScheduler.schedule({ id: 'timed', delayMs: 100, timeoutMs: 20 }, () => 'too-late');
  await timeoutHost.advance(20);
  context.assert(timed.status === 'aborted' && timed.reason === 'timeout_exceeded', 'timeout aborts delayed work');

  const observerHost = createDeterministicHost();
  const observerScheduler = api.createRmtKernelScheduler({
    hostPort: observerHost,
    preferPostTask: false,
    observer: () => { throw new Error('observer unavailable'); }
  });
  const observed = observerScheduler.schedule({ id: 'observed', metadata: { token: 'secret' } }, () => true);
  await observerHost.flushMicrotasks();
  await observed;
  context.assert(observed.status === 'completed', 'observer failure never fails scheduled work');
  context.assert(observerScheduler.listDiagnostics().some((entry) => entry.code === 'rmt.scheduler.observer_failed'), 'observer failure emits isolated diagnostic');

  const panicHost = createDeterministicHost();
  const panicScheduler = api.createRmtKernelScheduler({ hostPort: panicHost, isPanicBlocked: () => true });
  const blocked = panicScheduler.schedule({ id: 'blocked' }, () => true);
  context.assert(blocked.status === 'panic_blocked', 'panic monitor can block work before execution');

  const legacyHost = createDeterministicHost();
  const legacyScheduler = api.createRmtKernelScheduler({ hostPort: legacyHost });
  context.assert(
    (() => {
      try {
        browserApi.createRmtBrowserScheduler();
        return false;
      } catch (error) {
        return error instanceof TypeError && /requires a valid RMT kernel scheduler authority/u.test(error.message);
      }
    })(),
    'browser adapter fails closed without an injected kernel scheduler authority'
  );
  const browserScheduler = browserApi.createRmtBrowserScheduler({ scheduler: legacyScheduler });
  context.assert(browserScheduler.kernelScheduler === legacyScheduler, 'browser adapter preserves the injected scheduler identity');
  const legacy = browserScheduler.scheduleEndpoint('legacy.input', 'surface', (jobContext) => jobContext.lane, {
    lane: 'critical_input',
    kind: 'delay',
    timeout: 250
  });
  await legacyHost.flushMicrotasks();
  context.assert(await legacy === 'user-blocking', 'browser adapter maps legacy lanes to the canonical taxonomy');
  context.assert(
    browserScheduler.listDiagnostics().some((entry) => entry.code === 'rmt.browser_scheduler.legacy_options_mapped'),
    'browser adapter diagnoses legacy kind, lane and timeout options'
  );
  const delayedLegacy = browserScheduler.scheduleEndpoint('legacy.cancel', 'surface', () => true, { delayMs: 100 });
  context.assert(typeof delayedLegacy.cancel === 'function' && delayedLegacy.cancel('migration_test') === true && delayedLegacy.status === 'cancelled', 'legacy cancellation migrates to handle.cancel()');
  browserScheduler.dispose();
  const afterAdapterDispose = legacyScheduler.schedule({ id: 'kernel-still-owned' }, () => 'alive');
  await legacyHost.flushMicrotasks();
  context.assert(await afterAdapterDispose === 'alive', 'disposing an adapter never disposes the shared kernel scheduler');

  const disposeHost = createDeterministicHost();
  const disposeScheduler = api.createRmtKernelScheduler({ hostPort: disposeHost });
  const queued = disposeScheduler.schedule({ id: 'queued', delayMs: 100 }, () => true);
  context.assert(disposeScheduler.dispose() === true && queued.status === 'cancelled', 'dispose cancels queued work');

  return context.result({
    schema: 'xtend.rmt.kernel-scheduler-report.v1',
    rawBytes: source.length,
    gzipBytes,
    laneCount: api.RMT_SCHEDULER_LANES.length,
    jobStatusCount: api.RMT_SCHEDULER_JOB_STATUSES.length
  });
}

function printRmtKernelSchedulerReport(result) {
  printSuiteReport(result, {
    successTitle: 'RMT Kernel 0.8 Microkernel Scheduler erfolgreich.',
    failureTitle: 'RMT Kernel 0.8 Microkernel Scheduler fehlgeschlagen:'
  });
}

module.exports = {
  createDeterministicHost,
  printRmtKernelSchedulerReport,
  runRmtKernelSchedulerSuite
};
