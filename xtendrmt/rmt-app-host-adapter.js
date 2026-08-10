export const RMT_APP_HOST_PORT_SCHEMA = 'xtend.rmt.app-host-port.v1';
export const RMT_SEARCH_WORKER_SCHEMA = 'xtend.rmt.prewarm-search-worker.v1';

function objectRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function unavailableSearchWorker() {
  return Object.freeze({
    schema: RMT_SEARCH_WORKER_SCHEMA,
    available: false,
    dispatchSearchEnvelope() {
      return Promise.reject(new Error('Prewarm search worker is unavailable.'));
    },
    terminate() {},
    snapshot() {
      return Object.freeze({
        schema: RMT_SEARCH_WORKER_SCHEMA,
        available: false,
        instantiated: false,
        pendingJobs: 0,
        submittedJobs: 0,
        resourceCache: true,
        cachedResourceCount: 0,
        ownership: Object.freeze({ dom: false, events: false, state: false, trustedDomCommit: false }),
        allowedActions: Object.freeze(['search_index'])
      });
    }
  });
}

export function createRmtAppHostAdapter(options = {}) {
  const configured = objectRecord(options);
  const hostTarget = configured.hostTarget
    || configured.windowTarget
    || (typeof globalThis !== 'undefined' ? globalThis : null);
  const performanceTarget = configured.performanceTarget || hostTarget && hostTarget.performance || null;
  const cryptoTarget = configured.cryptoTarget || hostTarget && hostTarget.crypto || null;
  const WorkerCtor = configured.Worker || hostTarget && hostTarget.Worker || null;
  const BlobCtor = configured.Blob || hostTarget && hostTarget.Blob || null;
  const urlApi = configured.URL || hostTarget && hostTarget.URL || null;
  const timer = typeof configured.setTimeout === 'function'
    ? configured.setTimeout
    : hostTarget && typeof hostTarget.setTimeout === 'function'
      ? hostTarget.setTimeout.bind(hostTarget)
      : null;
  const customSchedule = typeof configured.schedule === 'function' ? configured.schedule : null;
  const wallClock = typeof configured.clock === 'function' ? configured.clock : null;
  const monotonicClock = typeof configured.now === 'function'
    ? configured.now
    : performanceTarget && typeof performanceTarget.now === 'function'
      ? performanceTarget.now.bind(performanceTarget)
      : null;
  let fallbackSequence = 0;

  function now() {
    if (monotonicClock) {
      const value = Number(monotonicClock());
      if (Number.isFinite(value)) return value;
    }
    if (wallClock) {
      const value = wallClock();
      if (Number.isFinite(value)) return Number(value);
      const parsed = Date.parse(String(value || ''));
      if (Number.isFinite(parsed)) return parsed;
    }
    return Date.now();
  }

  function nowIso(clockOverride = null) {
    const clock = typeof clockOverride === 'function' ? clockOverride : wallClock;
    if (clock) {
      const value = clock();
      if (typeof value === 'string') return value;
      if (Number.isFinite(value)) return new Date(Number(value)).toISOString();
      if (value instanceof Date) return value.toISOString();
    }
    return new Date().toISOString();
  }

  function createId(prefix = 'rmt') {
    const normalizedPrefix = String(prefix || 'rmt');
    if (cryptoTarget && typeof cryptoTarget.randomUUID === 'function') {
      return `${normalizedPrefix}:${cryptoTarget.randomUUID()}`;
    }
    fallbackSequence += 1;
    const random = typeof configured.random === 'function' ? configured.random() : Math.random();
    return `${normalizedPrefix}:${Date.now()}:${fallbackSequence}:${Number(random).toString(36).slice(2, 10)}`;
  }

  function schedule(task, metadata = {}) {
    if (typeof task !== 'function') throw new TypeError('RMT App Host schedule requires a task callback.');
    const details = objectRecord(metadata);
    if (customSchedule) return customSchedule(task, details);
    if (timer) return timer(task, Math.max(0, Number(details.delayMs) || 0));
    task();
    return null;
  }

  function createSearchWorker(input = {}) {
    const request = objectRecord(input);
    const source = String(request.source || '');
    if (!source || typeof WorkerCtor !== 'function' || typeof BlobCtor !== 'function'
      || !urlApi || typeof urlApi.createObjectURL !== 'function') return unavailableSearchWorker();
    let worker = null;
    let workerUrl = '';
    let sequence = 0;
    const pending = new Map();
    const cachedResourceIds = new Set();

    function getWorker() {
      if (worker) return worker;
      workerUrl = urlApi.createObjectURL(new BlobCtor([source], { type: 'application/javascript' }));
      worker = new WorkerCtor(workerUrl, {
        name: request.workerName || 'XTendRMTPrewarmSearchWorker',
        type: request.workerType || 'classic'
      });
      worker.onmessage = (event) => {
        const message = event && event.data || {};
        const resolver = pending.get(message.id);
        if (!resolver) return;
        pending.delete(message.id);
        if (message.ok === false) resolver.reject(new Error(message.error && message.error.message || 'Prewarm search failed.'));
        else resolver.resolve(message.result);
      };
      return worker;
    }

    function dispatchSearchEnvelope(envelope = {}) {
      const activeWorker = getWorker();
      const id = ++sequence;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        try {
          activeWorker.postMessage({ id, action: 'search_index', envelope });
          if (envelope.resourceId && Array.isArray(envelope.entries)) cachedResourceIds.add(envelope.resourceId);
        } catch (error) {
          pending.delete(id);
          reject(error);
        }
      });
    }

    function terminate(reason = 'disposed') {
      const error = new Error(`Prewarm search worker terminated: ${reason}`);
      pending.forEach((resolver) => resolver.reject(error));
      pending.clear();
      if (worker && typeof worker.terminate === 'function') worker.terminate();
      if (workerUrl && typeof urlApi.revokeObjectURL === 'function') urlApi.revokeObjectURL(workerUrl);
      worker = null;
      workerUrl = '';
      cachedResourceIds.clear();
    }

    return Object.freeze({
      schema: RMT_SEARCH_WORKER_SCHEMA,
      available: true,
      dispatchSearchEnvelope,
      terminate,
      snapshot() {
        return Object.freeze({
          schema: RMT_SEARCH_WORKER_SCHEMA,
          available: true,
          instantiated: Boolean(worker),
          pendingJobs: pending.size,
          submittedJobs: sequence,
          resourceCache: true,
          cachedResourceCount: cachedResourceIds.size,
          ownership: Object.freeze({ dom: false, events: false, state: false, trustedDomCommit: false }),
          allowedActions: Object.freeze(['search_index'])
        });
      }
    });
  }

  return Object.freeze({
    schema: RMT_APP_HOST_PORT_SCHEMA,
    now,
    nowIso,
    createId,
    schedule,
    createSearchWorker
  });
}

const api = Object.freeze({
  RMT_APP_HOST_PORT_SCHEMA,
  RMT_SEARCH_WORKER_SCHEMA,
  createRmtAppHostAdapter
});

export default api;
