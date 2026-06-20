const CHANNELS = Object.freeze({
  workerModelProgress: 'xtend-llm:worker-model-progress',
  workerGenerationDelta: 'xtend-llm:worker-generation-delta',
  workerGenerationComplete: 'xtend-llm:worker-generation-complete',
  workerGenerationError: 'xtend-llm:worker-generation-error'
});

function dispatch(channel, detail) {
  window.dispatchEvent(new CustomEvent(channel, { detail }));
}

export class LlmWorkerClient {
  constructor(options = {}) {
    this.fake = options.fake === true;
    this.worker = new Worker('/src/llm/transformers-worker.mjs', { type: 'module' });
    this.pending = new Map();
    this.oncePending = new Map();
    this.lastError = null;
    this.disposed = false;
    this.worker.addEventListener('message', (event) => this.handleMessage(event.data || {}));
  }

  handleMessage(message) {
    if (this.disposed) return;
    if (message.type === 'model-progress') {
      dispatch(CHANNELS.workerModelProgress, message.payload || {});
      return;
    }
    if (message.type === 'generation-delta') {
      dispatch(CHANNELS.workerGenerationDelta, message.payload || {});
      return;
    }
    if (message.type === 'generation-complete') {
      dispatch(CHANNELS.workerGenerationComplete, message.payload || {});
      this.pending.delete(message.payload && message.payload.jobId);
      return;
    }
    if (message.type === 'generation-error') {
      this.lastError = message.payload || {};
      dispatch(CHANNELS.workerGenerationError, message.payload || {});
      this.pending.delete(message.payload && message.payload.jobId);
      return;
    }
    if (message.type === 'generation-once-complete') {
      const payload = message.payload || {};
      const pending = this.oncePending.get(payload.requestId);
      if (!pending) return;
      clearTimeout(pending.timer);
      this.oncePending.delete(payload.requestId);
      pending.resolve(payload);
      return;
    }
    if (message.type === 'generation-once-error') {
      const payload = message.payload || {};
      this.lastError = payload;
      const pending = this.oncePending.get(payload.requestId);
      if (!pending) return;
      clearTimeout(pending.timer);
      this.oncePending.delete(payload.requestId);
      pending.reject(new Error(payload.message || 'Generation failed.'));
    }
  }

  async loadModel(options = {}) {
    if (this.disposed) return;
    this.worker.postMessage({
      type: 'load',
      payload: {
        origin: window.location.origin,
        fake: this.fake,
        ...options
      }
    });
  }

  generate(job) {
    if (this.disposed) return;
    this.pending.set(job.jobId, job);
    this.worker.postMessage({
      type: 'generate',
      payload: {
        ...job,
        fake: this.fake
      }
    });
  }

  generateOnce(job, options = {}) {
    if (this.disposed) return Promise.reject(new Error('Worker client is disposed.'));
    const requestId = options.requestId || `generation-once-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : 45000;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.oncePending.delete(requestId);
        reject(new Error('Timed out waiting for the local model tool decision.'));
      }, timeoutMs);
      this.oncePending.set(requestId, { resolve, reject, timer, jobId: job.jobId });
      this.worker.postMessage({
        type: 'generate-once',
        payload: {
          ...job,
          requestId,
          fake: this.fake
        }
      });
    });
  }

  cancel(jobId) {
    if (this.disposed) return;
    for (const [requestId, pending] of this.oncePending.entries()) {
      if (pending.jobId !== jobId) continue;
      clearTimeout(pending.timer);
      this.oncePending.delete(requestId);
      pending.reject(new Error('Generation canceled.'));
    }
    this.worker.postMessage({
      type: 'cancel',
      payload: { jobId }
    });
  }

  snapshot() {
    return {
      schema: 'xtend-llm.worker-client-snapshot.v1',
      fake: this.fake,
      disposed: this.disposed,
      pendingJobs: Array.from(this.pending.keys()),
      oncePendingJobs: Array.from(this.oncePending.values()).map((entry) => entry.jobId).filter(Boolean),
      pendingJobCount: this.pending.size,
      oncePendingJobCount: this.oncePending.size,
      lastError: this.lastError
    };
  }

  dispose(reason = 'runtime-dispose') {
    if (this.disposed) return this.snapshot();
    this.disposed = true;
    for (const [requestId, pending] of this.oncePending.entries()) {
      clearTimeout(pending.timer);
      pending.reject(new Error(`Worker client disposed: ${reason}`));
      this.oncePending.delete(requestId);
    }
    this.pending.clear();
    if (this.worker && typeof this.worker.terminate === 'function') this.worker.terminate();
    return this.snapshot();
  }
}
