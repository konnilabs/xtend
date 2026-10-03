/*
 * XTendRMT 0.8 host-neutral kernel scheduler.
 * This module intentionally has no DOM, template, Product Surface or worker-preparation dependency.
 */
function createRmtKernelSchedulerModule(globalTarget = typeof globalThis !== 'undefined' ? globalThis : {}) {
  const RMT_KERNEL_SCHEDULER_SCHEMA = 'xtend.rmt.kernel-scheduler.v1';
  const RMT_KERNEL_WORK_REQUEST_SCHEMA = 'xtend.rmt.kernel-work.v1';
  const RMT_KERNEL_JOB_SCHEMA = 'xtend.rmt.kernel-job.v1';
  const RMT_KERNEL_JOB_EVENT_SCHEMA = 'xtend.rmt.kernel-job-event.v1';

  const RMT_SCHEDULER_LANES = Object.freeze([
    'user-blocking',
    'visible',
    'transition',
    'idle',
    'background',
    'diagnostics'
  ]);

  const RMT_SCHEDULER_JOB_STATUSES = Object.freeze([
    'queued',
    'running',
    'waiting',
    'yielded',
    'completed',
    'failed',
    'cancelled',
    'aborted',
    'panic_blocked'
  ]);

  const FINAL_STATUSES = new Set(['completed', 'failed', 'cancelled', 'aborted', 'panic_blocked']);
  const LEGACY_LANES = Object.freeze({
    critical_input: 'user-blocking',
    visible_commit: 'visible',
    hydration_followup: 'visible',
    background_prepare: 'background',
    idle_maintenance: 'idle'
  });
  const LANE_PRIORITY = Object.freeze({
    'user-blocking': 100,
    visible: 80,
    transition: 65,
    idle: 35,
    background: 25,
    diagnostics: 20
  });
  const LANE_CHUNK_MS = Object.freeze({
    'user-blocking': 8,
    visible: 12,
    transition: 16,
    idle: 24,
    background: 32,
    diagnostics: 16
  });

  function finite(value, fallback = 0) {
    return Number.isFinite(Number(value)) ? Number(value) : fallback;
  }

  function nonNegative(value, fallback = 0) {
    return Math.max(0, finite(value, fallback));
  }

  function text(value, fallback = '') {
    const normalized = String(value == null ? '' : value).trim();
    return normalized || fallback;
  }

  function cloneSerializable(value, fallback = null) {
    if (value === undefined) return fallback;
    if (value === null || typeof value !== 'object') return value;
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (_) {
      return fallback;
    }
  }

  function normalizeLane(value, allowLegacy = false) {
    const lane = text(value, 'visible');
    if (RMT_SCHEDULER_LANES.includes(lane)) return lane;
    if (allowLegacy && LEGACY_LANES[lane]) return LEGACY_LANES[lane];
    return 'visible';
  }

  function createAbortError(reason, code = 'rmt.scheduler.aborted') {
    const error = new Error(text(reason, 'RMT scheduler job was aborted.'));
    error.name = 'AbortError';
    error.code = code;
    return error;
  }

  function sanitizeMetadata(value) {
    if (Array.isArray(value)) return value.map(sanitizeMetadata);
    if (!value || typeof value !== 'object') return value;
    const result = {};
    Object.entries(value).forEach(([key, entry]) => {
      const normalized = key.toLowerCase();
      if (
        normalized.includes('payload')
        || normalized.includes('secret')
        || normalized.includes('token')
        || normalized.includes('password')
        || normalized.includes('html')
        || normalized === 'stack'
      ) {
        result[key] = '[redacted]';
      } else {
        result[key] = sanitizeMetadata(entry);
      }
    });
    return result;
  }

  function createDefaultHost(target = globalTarget) {
    const performanceTarget = target && target.performance;
    const schedulerTarget = target && target.scheduler;
    return {
      schema: 'xtend.rmt.scheduler-host-port.v1',
      now: () => performanceTarget && typeof performanceTarget.now === 'function'
        ? performanceTarget.now()
        : Date.now(),
      queueMicrotask: (callback) => {
        if (target && typeof target.queueMicrotask === 'function') return target.queueMicrotask(callback);
        return Promise.resolve().then(callback);
      },
      setTimeout: (callback, delay) => target.setTimeout(callback, delay),
      clearTimeout: (handle) => target.clearTimeout(handle),
      requestAnimationFrame: target && typeof target.requestAnimationFrame === 'function'
        ? target.requestAnimationFrame.bind(target)
        : null,
      cancelAnimationFrame: target && typeof target.cancelAnimationFrame === 'function'
        ? target.cancelAnimationFrame.bind(target)
        : null,
      requestIdleCallback: target && typeof target.requestIdleCallback === 'function'
        ? target.requestIdleCallback.bind(target)
        : null,
      cancelIdleCallback: target && typeof target.cancelIdleCallback === 'function'
        ? target.cancelIdleCallback.bind(target)
        : null,
      postTask: schedulerTarget && typeof schedulerTarget.postTask === 'function'
        ? schedulerTarget.postTask.bind(schedulerTarget)
        : null,
      createAbortController: () => typeof target.AbortController === 'function'
        ? new target.AbortController()
        : (typeof AbortController === 'function' ? new AbortController() : null)
    };
  }

  function normalizeHost(hostInput, target) {
    const fallback = createDefaultHost(target);
    const host = hostInput && typeof hostInput === 'object' ? hostInput : {};
    return {
      schema: text(host.schema, fallback.schema),
      now: typeof host.now === 'function' ? host.now.bind(host) : fallback.now,
      queueMicrotask: typeof host.queueMicrotask === 'function'
        ? host.queueMicrotask.bind(host)
        : fallback.queueMicrotask,
      setTimeout: typeof host.setTimeout === 'function'
        ? host.setTimeout.bind(host)
        : (typeof host.scheduleTimeout === 'function' ? host.scheduleTimeout.bind(host) : fallback.setTimeout),
      clearTimeout: typeof host.clearTimeout === 'function'
        ? host.clearTimeout.bind(host)
        : fallback.clearTimeout,
      requestAnimationFrame: typeof host.requestAnimationFrame === 'function'
        ? host.requestAnimationFrame.bind(host)
        : (typeof host.scheduleAnimationFrame === 'function' ? host.scheduleAnimationFrame.bind(host) : fallback.requestAnimationFrame),
      cancelAnimationFrame: typeof host.cancelAnimationFrame === 'function'
        ? host.cancelAnimationFrame.bind(host)
        : fallback.cancelAnimationFrame,
      requestIdleCallback: typeof host.requestIdleCallback === 'function'
        ? host.requestIdleCallback.bind(host)
        : (typeof host.scheduleIdleCallback === 'function' ? host.scheduleIdleCallback.bind(host) : fallback.requestIdleCallback),
      cancelIdleCallback: typeof host.cancelIdleCallback === 'function'
        ? host.cancelIdleCallback.bind(host)
        : fallback.cancelIdleCallback,
      postTask: typeof host.postTask === 'function' ? host.postTask.bind(host) : fallback.postTask,
      createAbortController: typeof host.createAbortController === 'function'
        ? host.createAbortController.bind(host)
        : fallback.createAbortController
    };
  }

  function createRmtKernelScheduler(options = {}) {
    const host = normalizeHost(options.hostPort || options.host || {}, options.globalTarget || globalTarget);
    const observer = options.observer || options.observerPort || null;
    const strict = options.strict === true;
    const jobs = new Map();
    const pending = [];
    const coalesceIndex = new Map();
    const diagnostics = [];
    const telemetry = {
      scheduled: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
      aborted: 0,
      panicBlocked: 0,
      yielded: 0,
      coalesced: 0
    };
    let pressureLevel = 'normal';
    let disposed = false;
    let sequence = 0;
    let eventSequence = 0;
    let activeJob = null;
    let pumpQueued = false;
    let wakeHandle = null;
    let lastRootKey = '';

    function now() {
      return finite(host.now(), 0);
    }

    function isPanicBlocked(request) {
      if (typeof options.isPanicBlocked === 'function') return options.isPanicBlocked(request) === true;
      const monitor = options.panicMonitor;
      if (!monitor || typeof monitor.getSnapshot !== 'function') return false;
      const snapshot = monitor.getSnapshot();
      return Boolean(snapshot && ['active', 'panic', 'quarantined'].includes(snapshot.state));
    }

    function coalesceToken(request) {
      return request.coalesceKey ? `${request.scope}:${request.coalesceKey}` : '';
    }

    function emit(job, phase, detail = {}) {
      const event = Object.freeze({
        schema: RMT_KERNEL_JOB_EVENT_SCHEMA,
        sequence: ++eventSequence,
        jobId: job.id,
        phase,
        status: job.status,
        endpointName: job.request.endpointName,
        scope: job.request.scope,
        rootId: job.request.rootId,
        lane: job.request.lane,
        priority: job.request.priority,
        reason: text(detail.reason, job.reason),
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        finishedAt: job.finishedAt,
        yieldCount: job.yieldCount,
        metadata: sanitizeMetadata(job.request.metadata)
      });
      try {
        if (typeof observer === 'function') observer(event);
        else if (observer && typeof observer.onJobEvent === 'function') observer.onJobEvent(event);
      } catch (error) {
        diagnostics.push(Object.freeze({
          code: 'rmt.scheduler.observer_failed',
          severity: 'warning',
          jobId: job.id,
          message: text(error && error.message, 'Scheduler observer failed.')
        }));
      }
      return event;
    }

    function normalizeRequest(input = {}) {
      const lane = normalizeLane(input.lane, options.allowLegacyLanes === true);
      const createdAt = now();
      const delayMs = nonNegative(input.delayMs != null ? input.delayMs : input.delay, 0);
      return Object.freeze({
        schema: RMT_KERNEL_WORK_REQUEST_SCHEMA,
        id: text(input.id, ''),
        endpointName: text(input.endpointName || input.endpoint, 'rmt.scheduler.work'),
        scope: text(input.scope, 'rmt.scheduler'),
        rootId: text(input.rootId, ''),
        lane,
        priority: Math.max(0, Math.min(100, finite(input.priority, LANE_PRIORITY[lane]))),
        deadlineMs: nonNegative(input.deadlineMs, 0),
        timeoutMs: nonNegative(input.timeoutMs, 0),
        delayMs,
        readyAt: createdAt + delayMs,
        budgetClass: text(input.budgetClass || (input.budget && input.budget.class), lane),
        maxChunkMs: nonNegative(input.maxChunkMs || (input.chunking && input.chunking.maxChunkMs), LANE_CHUNK_MS[lane]),
        coalesceKey: text(input.coalesceKey, ''),
        strategy: text(input.strategy || input.kind, 'microtask'),
        metadata: cloneSerializable(input.metadata, {})
      });
    }

    function score(job, at) {
      const waitMs = Math.max(0, at - job.createdAt);
      const agingStep = pressureLevel === 'critical' ? 16 : (pressureLevel === 'constrained' ? 24 : 48);
      const aging = Math.min(200, Math.floor(waitMs / agingStep) * 4);
      const deadlineBoost = job.request.deadlineMs > 0 && waitMs >= job.request.deadlineMs
        ? 500
        : 0;
      const rootPenalty = lastRootKey && lastRootKey === job.rootKey ? 8 : 0;
      return LANE_PRIORITY[job.request.lane] * 1000
        + job.request.priority * 10
        + aging
        + deadlineBoost
        - rootPenalty;
    }

    function removePending(job) {
      const index = pending.indexOf(job);
      if (index >= 0) pending.splice(index, 1);
    }

    function clearTimer(job) {
      if (job.timeoutHandle != null) {
        host.clearTimeout(job.timeoutHandle);
        job.timeoutHandle = null;
      }
    }

    function settle(job, status, reason, value, error) {
      if (!job || FINAL_STATUSES.has(job.status)) return false;
      removePending(job);
      if (activeJob === job) activeJob = null;
      clearTimer(job);
      job.status = status;
      job.reason = text(reason, status);
      job.finishedAt = now();
      const token = coalesceToken(job.request);
      if (token && coalesceIndex.get(token) === job) coalesceIndex.delete(token);
      if (status === 'completed') telemetry.completed += 1;
      else if (status === 'failed') telemetry.failed += 1;
      else if (status === 'cancelled') telemetry.cancelled += 1;
      else if (status === 'aborted') telemetry.aborted += 1;
      else if (status === 'panic_blocked') telemetry.panicBlocked += 1;
      emit(job, status, { reason: job.reason });
      if (job.yieldReject) {
        job.yieldReject(error || createAbortError(job.reason));
        job.yieldResolve = null;
        job.yieldReject = null;
      }
      if (status === 'completed') job.resolve(value);
      else job.reject(error || createAbortError(job.reason, `rmt.scheduler.${status}`));
      queuePump();
      return true;
    }

    function abortJob(job, reason, requestedStatus) {
      if (!job || FINAL_STATUSES.has(job.status)) return false;
      const wasStarted = job.hasStarted === true;
      const status = requestedStatus || (wasStarted ? 'aborted' : 'cancelled');
      if (job.abortController && typeof job.abortController.abort === 'function' && !job.abortController.signal.aborted) {
        try {
          job.abortController.abort(reason);
        } catch (_) {
          job.abortController.abort();
        }
      }
      return settle(job, status, reason, undefined, createAbortError(reason, `rmt.scheduler.${status}`));
    }

    function createContext(job) {
      return Object.freeze({
        schema: 'xtend.rmt.kernel-job-context.v1',
        jobId: job.id,
        endpointName: job.request.endpointName,
        scope: job.request.scope,
        rootId: job.request.rootId,
        lane: job.request.lane,
        priority: job.request.priority,
        deadlineMs: job.request.deadlineMs,
        budgetClass: job.request.budgetClass,
        maxChunkMs: job.request.maxChunkMs,
        signal: job.abortController ? job.abortController.signal : null,
        metadata: cloneSerializable(job.request.metadata, {}),
        now,
        shouldYield() {
          if (FINAL_STATUSES.has(job.status)) return false;
          const elapsed = Math.max(0, now() - job.lastResumedAt);
          const higherPriorityPending = pending.some((candidate) => (
            !FINAL_STATUSES.has(candidate.status)
            && score(candidate, now()) > score(job, now())
          ));
          return elapsed >= job.request.maxChunkMs || higherPriorityPending;
        },
        yield(reason = 'cooperative_yield') {
          if (FINAL_STATUSES.has(job.status)) {
            return Promise.reject(createAbortError(job.reason || 'Job is no longer active.'));
          }
          if (job.yieldResolve) return job.yieldPromise;
          job.status = 'yielded';
          job.reason = text(reason, 'cooperative_yield');
          job.yieldCount += 1;
          telemetry.yielded += 1;
          job.yieldPromise = new Promise((resolve, reject) => {
            job.yieldResolve = resolve;
            job.yieldReject = reject;
          });
          job.yieldPromise.catch(() => undefined);
          if (activeJob === job) activeJob = null;
          if (!pending.includes(job)) pending.push(job);
          emit(job, 'yielded', { reason: job.reason });
          queuePump();
          return job.yieldPromise;
        }
      });
    }

    function handleWorkPromise(job, value) {
      if (value && typeof value.then === 'function') {
        job.workPromise = Promise.resolve(value);
        if (job.status !== 'yielded') job.status = 'waiting';
        if (activeJob === job) activeJob = null;
        emit(job, job.status);
        job.workPromise.then(
          (result) => settle(job, 'completed', 'resolved', result),
          (error) => {
            if (FINAL_STATUSES.has(job.status)) return;
            settle(job, 'failed', 'async_rejection', undefined, error instanceof Error ? error : new Error(String(error)));
          }
        );
        queuePump();
        return;
      }
      settle(job, 'completed', 'returned', value);
    }

    function runJob(job) {
      if (!job || FINAL_STATUSES.has(job.status)) return;
      if (job.status === 'yielded' && job.yieldResolve) {
        activeJob = job;
        job.status = 'running';
        job.lastResumedAt = now();
        const resume = job.yieldResolve;
        job.yieldResolve = null;
        job.yieldReject = null;
        job.yieldPromise = null;
        emit(job, 'running', { reason: 'yield_resume' });
        resume();
        host.queueMicrotask(() => {
          if (activeJob === job && job.status === 'running') {
            job.status = 'waiting';
            activeJob = null;
            emit(job, 'waiting');
            queuePump();
          }
        });
        return;
      }
      activeJob = job;
      job.status = 'running';
      job.hasStarted = true;
      job.startedAt = job.startedAt || now();
      job.lastResumedAt = job.startedAt;
      lastRootKey = job.rootKey;
      emit(job, 'running');
      try {
        handleWorkPromise(job, job.work(job.context));
      } catch (error) {
        settle(job, 'failed', 'callback_error', undefined, error instanceof Error ? error : new Error(String(error)));
      }
    }

    function dispatchJob(job) {
      const strategy = job.request.strategy;
      if (strategy === 'after_paint' && host.requestAnimationFrame) {
        activeJob = job;
        host.requestAnimationFrame(() => host.requestAnimationFrame(() => {
          if (activeJob === job) activeJob = null;
          runJob(job);
        }));
        return;
      }
      if (strategy === 'idle' && host.requestIdleCallback) {
        activeJob = job;
        host.requestIdleCallback(() => {
          if (activeJob === job) activeJob = null;
          runJob(job);
        }, { timeout: job.request.deadlineMs || 1000 });
        return;
      }
      if (host.postTask && options.preferPostTask !== false) {
        const priority = job.request.lane === 'user-blocking'
          ? 'user-blocking'
          : (['background', 'idle', 'diagnostics'].includes(job.request.lane) ? 'background' : 'user-visible');
        activeJob = job;
        Promise.resolve(host.postTask(() => {
          if (activeJob === job) activeJob = null;
          runJob(job);
        }, { priority })).catch((error) => {
          if (!FINAL_STATUSES.has(job.status)) settle(job, 'failed', 'host_dispatch_failed', undefined, error);
        });
        return;
      }
      runJob(job);
    }

    function selectNext() {
      const at = now();
      const ready = pending.filter((job) => !FINAL_STATUSES.has(job.status) && job.request.readyAt <= at);
      if (ready.length === 0) return null;
      ready.sort((left, right) => {
        const scoreDelta = score(right, at) - score(left, at);
        if (scoreDelta !== 0) return scoreDelta;
        return left.sequence - right.sequence;
      });
      const selected = ready[0];
      removePending(selected);
      return selected;
    }

    function scheduleWakeForDelayedJob() {
      if (wakeHandle != null || pending.length === 0) return;
      const at = now();
      const nextReadyAt = Math.min(...pending.map((job) => job.request.readyAt));
      const delay = Math.max(0, nextReadyAt - at);
      wakeHandle = host.setTimeout(() => {
        wakeHandle = null;
        queuePump();
      }, delay);
    }

    function pump() {
      pumpQueued = false;
      if (disposed || activeJob) return;
      const next = selectNext();
      if (!next) {
        scheduleWakeForDelayedJob();
        return;
      }
      dispatchJob(next);
    }

    function queuePump() {
      if (disposed || pumpQueued || activeJob) return;
      pumpQueued = true;
      host.queueMicrotask(pump);
    }

    function createHandle(job) {
      const handle = {
        schema: RMT_KERNEL_JOB_SCHEMA,
        id: job.id,
        result: job.result,
        signal: job.abortController ? job.abortController.signal : null,
        get status() {
          return job.status;
        },
        get reason() {
          return job.reason;
        },
        cancel(reason = 'cancelled_by_caller') {
          return abortJob(job, reason);
        },
        snapshot() {
          return Object.freeze({
            schema: RMT_KERNEL_JOB_SCHEMA,
            id: job.id,
            status: job.status,
            reason: job.reason,
            request: job.request,
            createdAt: job.createdAt,
            startedAt: job.startedAt,
            finishedAt: job.finishedAt,
            yieldCount: job.yieldCount
          });
        },
        then(onFulfilled, onRejected) {
          return job.result.then(onFulfilled, onRejected);
        },
        catch(onRejected) {
          return job.result.catch(onRejected);
        },
        finally(onFinally) {
          return job.result.finally(onFinally);
        }
      };
      return Object.freeze(handle);
    }

    function schedule(requestInput, work) {
      if (disposed) throw new Error('RMT kernel scheduler is disposed.');
      if (typeof work !== 'function') throw new TypeError('scheduler.schedule() requires a work callback.');
      const request = normalizeRequest(requestInput);
      let resolve;
      let reject;
      const result = new Promise((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
      });
      result.catch(() => undefined);
      sequence += 1;
      const id = request.id || `rmt-job-${sequence}`;
      const abortController = host.createAbortController ? host.createAbortController() : null;
      const job = {
        id,
        sequence,
        request,
        rootKey: request.rootId ? `root:${request.rootId}` : `scope:${request.scope}`,
        work,
        context: null,
        abortController,
        result,
        resolve,
        reject,
        status: 'queued',
        reason: 'scheduled',
        createdAt: now(),
        startedAt: 0,
        hasStarted: false,
        lastResumedAt: 0,
        finishedAt: 0,
        timeoutHandle: null,
        yieldCount: 0,
        yieldPromise: null,
        yieldResolve: null,
        yieldReject: null,
        workPromise: null
      };
      job.context = createContext(job);
      jobs.set(id, job);
      const handle = createHandle(job);
      job.handle = handle;
      telemetry.scheduled += 1;

      if (isPanicBlocked(request)) {
        settle(job, 'panic_blocked', 'kernel_panic_active', undefined, createAbortError('Kernel panic blocks scheduled work.', 'rmt.scheduler.panic_blocked'));
        return handle;
      }

      const token = coalesceToken(request);
      const replaced = token ? coalesceIndex.get(token) : null;
      if (replaced && !FINAL_STATUSES.has(replaced.status)) {
        telemetry.coalesced += 1;
        abortJob(replaced, 'coalesced_replaced');
      }
      if (token) coalesceIndex.set(token, job);
      pending.push(job);
      emit(job, 'queued');

      if (request.timeoutMs > 0) {
        job.timeoutHandle = host.setTimeout(() => {
          abortJob(job, 'timeout_exceeded', 'aborted');
        }, request.timeoutMs);
      }
      queuePump();
      return handle;
    }

    function scheduleEndpoint(endpointName, scope, work, requestInput = {}) {
      return schedule({
        ...requestInput,
        endpointName,
        scope
      }, work);
    }

    function updatePressure(input) {
      const requested = text(input && input.level ? input.level : input, 'normal');
      pressureLevel = ['idle', 'normal', 'elevated', 'constrained', 'critical'].includes(requested)
        ? requested
        : 'normal';
      return pressureLevel;
    }

    function getJob(jobId) {
      const job = jobs.get(String(jobId));
      return job ? job.handle : null;
    }

    function snapshot() {
      const counts = {};
      RMT_SCHEDULER_JOB_STATUSES.forEach((status) => {
        counts[status] = 0;
      });
      jobs.forEach((job) => {
        counts[job.status] = (counts[job.status] || 0) + 1;
      });
      return Object.freeze({
        schema: RMT_KERNEL_SCHEDULER_SCHEMA,
        disposed,
        pressureLevel,
        activeJobId: activeJob ? activeJob.id : null,
        pendingJobIds: pending.filter((job) => !FINAL_STATUSES.has(job.status)).map((job) => job.id),
        counts: Object.freeze(counts),
        telemetry: Object.freeze({ ...telemetry }),
        diagnosticCount: diagnostics.length
      });
    }

    function dispose(reason = 'scheduler_disposed') {
      if (disposed) return false;
      disposed = true;
      if (wakeHandle != null) {
        host.clearTimeout(wakeHandle);
        wakeHandle = null;
      }
      jobs.forEach((job) => {
        if (!FINAL_STATUSES.has(job.status)) {
          abortJob(job, reason, job.hasStarted ? 'aborted' : 'cancelled');
        }
      });
      return true;
    }

    return Object.freeze({
      schema: RMT_KERNEL_SCHEDULER_SCHEMA,
      lanes: RMT_SCHEDULER_LANES,
      schedule,
      scheduleEndpoint,
      updatePressure,
      getJob,
      listDiagnostics: () => diagnostics.map((entry) => ({ ...entry })),
      snapshot,
      dispose
    });
  }

  return Object.freeze({
    RMT_KERNEL_SCHEDULER_SCHEMA,
    RMT_KERNEL_WORK_REQUEST_SCHEMA,
    RMT_KERNEL_JOB_SCHEMA,
    RMT_KERNEL_JOB_EVENT_SCHEMA,
    RMT_SCHEDULER_LANES,
    RMT_SCHEDULER_JOB_STATUSES,
    createRmtKernelScheduler
  });
}

const __XTEND_RMT_KERNEL_SCHEDULER_API__ = createRmtKernelSchedulerModule();

export const RMT_KERNEL_SCHEDULER_SCHEMA = __XTEND_RMT_KERNEL_SCHEDULER_API__.RMT_KERNEL_SCHEDULER_SCHEMA;
export const RMT_KERNEL_WORK_REQUEST_SCHEMA = __XTEND_RMT_KERNEL_SCHEDULER_API__.RMT_KERNEL_WORK_REQUEST_SCHEMA;
export const RMT_KERNEL_JOB_SCHEMA = __XTEND_RMT_KERNEL_SCHEDULER_API__.RMT_KERNEL_JOB_SCHEMA;
export const RMT_KERNEL_JOB_EVENT_SCHEMA = __XTEND_RMT_KERNEL_SCHEDULER_API__.RMT_KERNEL_JOB_EVENT_SCHEMA;
export const RMT_SCHEDULER_LANES = __XTEND_RMT_KERNEL_SCHEDULER_API__.RMT_SCHEDULER_LANES;
export const RMT_SCHEDULER_JOB_STATUSES = __XTEND_RMT_KERNEL_SCHEDULER_API__.RMT_SCHEDULER_JOB_STATUSES;
export const createRmtKernelScheduler = __XTEND_RMT_KERNEL_SCHEDULER_API__.createRmtKernelScheduler;

export default __XTEND_RMT_KERNEL_SCHEDULER_API__;
