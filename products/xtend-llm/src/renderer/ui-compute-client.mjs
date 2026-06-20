const DEFAULT_PREWARM_TARGETS = Object.freeze([
  'settings-dialog',
  'delete-conversation-dialog',
  'code-bridge',
  'retry-generation',
  'generation-spinner',
  'runtime-error',
  'runtime-diagnostics'
]);

function cloneJson(value, fallback = null) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return fallback;
  }
}

function fallbackPrewarmManifest(targets = DEFAULT_PREWARM_TARGETS, context = {}) {
  const entries = Array.from(new Set(targets)).map((target) => ({
    target,
    cacheKey: `ui-compute:${target}`,
    fiberKind: 'component.worker_prerender_hydrate',
    lane: 'background',
    estimatedCost: 1,
    invalidation: ['surface.destroy', 'settings.change', 'backpressure.critical']
  }));
  return {
    schema: 'xtend-llm.ui-compute-prewarm.v1',
    ok: true,
    targetCount: entries.length,
    totalEstimatedCost: entries.reduce((sum, entry) => sum + Number(entry.estimatedCost || 0), 0),
    entries,
    backpressureLevel: context.backpressureLevel || 'normal',
    fallback: true
  };
}

function createFallbackResult(job = {}) {
  if (job.kind === 'prewarm.surface') return fallbackPrewarmManifest(job.targets, job.context);
  if (job.kind === 'compute.layoutSummary') {
    const widgets = Array.isArray(job.payload?.widgets) ? job.payload.widgets : [];
    return {
      schema: 'xtend-llm.ui-compute-layout-summary.v1',
      widgetCount: widgets.length,
      visibleCount: widgets.filter((widget) => widget && widget.hidden !== true).length,
      lanes: Array.from(new Set(widgets.map((widget) => widget && widget.lane || 'visible'))).sort(),
      fallback: true
    };
  }
  return {
    schema: 'xtend-llm.ui-compute-result.v1',
    ok: true,
    fallback: true
  };
}

export class UiComputeWorkerClient {
  constructor(options = {}) {
    this.fake = options.fake === true || typeof Worker !== 'function';
    this.disposed = false;
    this.lastError = null;
    this.submittedJobs = 0;
    this.completedJobs = 0;
    this.lastResult = null;
    this.pending = new Map();
    this.worker = null;

    if (!this.fake) {
      this.worker = new Worker(new URL('./ui-compute-worker.mjs', import.meta.url), {
        type: 'module',
        name: options.name || 'XTendLLMUICompute'
      });
      this.worker.addEventListener('message', (event) => this.handleMessage(event.data || {}));
      this.worker.addEventListener('error', (event) => {
        this.lastError = {
          message: event.message || 'UI compute worker failed.',
          filename: event.filename || '',
          lineno: event.lineno || 0
        };
      });
    }
  }

  handleMessage(message = {}) {
    const pending = this.pending.get(message.id);
    if (!pending) return;
    this.pending.delete(message.id);
    if (message.ok === false) {
      const error = new Error(message.error?.message || 'UI compute worker job failed.');
      this.lastError = { message: error.message };
      pending.reject(error);
      return;
    }
    this.completedJobs += 1;
    this.lastResult = cloneJson(message.result, null);
    pending.resolve(message.result);
  }

  run(job = {}) {
    if (this.disposed) return Promise.reject(new Error('UI compute worker is disposed.'));
    this.submittedJobs += 1;
    if (this.fake || !this.worker) {
      const result = createFallbackResult(job);
      this.completedJobs += 1;
      this.lastResult = cloneJson(result, null);
      return Promise.resolve(result);
    }
    const id = `ui-compute-${this.submittedJobs}-${Date.now()}`;
    const promise = new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
    this.worker.postMessage({ id, action: 'run', job });
    return promise;
  }

  prewarmSurfaces(targets = DEFAULT_PREWARM_TARGETS, context = {}) {
    return this.run({
      kind: 'prewarm.surface',
      targets,
      context
    });
  }

  compute(kind, payload = {}) {
    return this.run({
      kind,
      payload
    });
  }

  snapshot() {
    return {
      schema: 'xtend-llm.ui-compute-worker-snapshot.v1',
      fake: this.fake,
      disposed: this.disposed,
      pendingJobs: this.pending.size,
      submittedJobs: this.submittedJobs,
      completedJobs: this.completedJobs,
      lastError: cloneJson(this.lastError, null),
      lastResult: cloneJson(this.lastResult, null),
      responsibilities: ['ui_compute', 'layout_precompute', 'analytics_precompute', 'template_prerender_compute'],
      excludedResponsibilities: ['dom_mutation', 'event_binding', 'state_ownership']
    };
  }

  dispose(reason = 'runtime-dispose') {
    if (this.disposed) return this.snapshot();
    this.disposed = true;
    for (const pending of this.pending.values()) {
      pending.reject(new Error(`UI compute worker disposed: ${reason}`));
    }
    this.pending.clear();
    if (this.worker && typeof this.worker.terminate === 'function') this.worker.terminate();
    this.worker = null;
    return this.snapshot();
  }
}

export { DEFAULT_PREWARM_TARGETS };
