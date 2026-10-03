/** Latest-source coordination; all timing belongs to the existing RMT scheduler. */
export function createPlaygroundRequestCoordinator({ scheduler, route, getSource, execute, onError, onInvalidate = () => {}, compileDelay = 300, diagnosticsDelay = 160 }) {
  let source = getSource(), generation = 0, disposed = false, active = null;
  const pending = { compile: null, diagnostics: null };
  const jobs = { compile: null, diagnostics: null };
  const cancelPending = () => {
    for (const kind of ['compile', 'diagnostics']) {
      if (jobs[kind]) jobs[kind].cancel('docs-playground-superseded');
      jobs[kind] = null;
      pending[kind] = null;
    }
  };
  const invalidate = () => {
    generation++;
    source = getSource();
    cancelPending();
    onInvalidate(generation);
  };
  const observeSource = () => { if (getSource() !== source) invalidate(); };
  const pump = () => {
    if (disposed || active) return;
    observeSource();
    const kind = pending.compile?.ready ? 'compile' : pending.diagnostics?.ready ? 'diagnostics' : null;
    if (!kind) return;
    const entry = pending[kind];
    pending[kind] = null;
    const controller = new AbortController();
    const isCurrent = () => !disposed && generation === entry.generation && getSource() === entry.source;
    active = { controller, entry };
    Promise.resolve().then(() => execute(kind, { source: entry.source, generation: entry.generation, signal: controller.signal, isCurrent }))
      .catch(error => { if (isCurrent() && error?.name !== 'AbortError') onError(kind, error); })
      .finally(() => { active = null; pump(); });
  };
  const schedule = (kind, immediate = false) => {
    if (disposed) return;
    observeSource();
    if (jobs[kind]) jobs[kind].cancel('docs-playground-superseded');
    const entry = { source, generation, ready: false };
    pending[kind] = entry;
    jobs[kind] = scheduler.scheduleEndpoint(`docs.playground.${kind}`, route, () => {
      jobs[kind] = null;
      if (disposed || pending[kind] !== entry) return;
      entry.ready = true;
      pump();
    }, { kind: 'delay', delayMs: immediate ? 0 : kind === 'compile' ? compileDelay : diagnosticsDelay });
  };
  return {
    schedule, invalidate, cancelPending,
    dispose() {
      if (disposed) return;
      disposed = true;
      invalidate();
      if (active) active.controller.abort();
    },
    snapshot: () => ({ generation, disposed, active: active ? 1 : 0, pending: Object.values(pending).filter(Boolean).length })
  };
}
