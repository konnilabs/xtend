import './fastpass-contract.js';
const { validateFastPassAction } = globalThis.XTendMaracaFastPassContract;
export { validateFastPassAction };

export function createMaracaFastPass({ actions, scheduler, applyIntent, diagnostic = () => {}, rootId = 'maraca' }) {
  const registry = new Map();
  const pending = new Map();
  let disposed = false;
  for (const action of actions) {
    const errors = validateFastPassAction(action);
    if (registry.has(action?.id)) errors.push('Duplicate FastPass action.');
    if (errors.length) {
      const error = new TypeError(`Invalid FastPass action ${action?.id || ''}: ${errors.join(' ')}`);
      error.code = 'xtend.maraca.fastpass.invalid-action';
      throw error;
    }
    registry.set(action.id, action);
  }
  function dispatch(actionId, payload = {}, options = {}) {
    if (disposed) throw new Error('Maraca FastPass is disposed.');
    const action = registry.get(actionId);
    if (!action) throw new TypeError(`Unknown FastPass action: ${actionId}`);
    const authority = scheduler();
    if (!authority || typeof authority.schedule !== 'function') throw new Error('FastPass requires the shared RMT scheduler authority.');
    // Capture payload values before scheduling; caller mutation must not change the intent.
    const intents = action.effects.map((effect) => {
      let value = effect.kind === 'navigation' ? effect.path : effect.target || effect.componentCommand?.target?.id || effect.source?.target;
      if (value && typeof value === 'object') value = String(value.path || value.value || '').replace(/^input\./, '').split('.').reduce((entry, key) => entry?.[key], payload);
      if (typeof value !== 'string' || !value.trim()) throw new TypeError('FastPass shell targets must be nonempty strings.');
      return Object.freeze({ kind: effect.kind, value, scope: String(effect.scope || action.scope || rootId) });
    });
    const keys = intents.map((intent) => `${intent.kind}:${intent.kind === 'close' ? intent.value : intent.scope}`);
    const replaced = new Set(keys.map((key) => pending.get(key)).filter(Boolean));
    replaced.forEach((handle) => handle.cancel('fastpass_superseded'));
    let handle;
    handle = authority.schedule({
      lane: 'user-blocking', rootId, scope: 'maraca.fastpass',
      endpointName: 'maraca.fastpass', maxChunkMs: options.maxChunkMs || 8,
      timeoutMs: options.timeoutMs, metadata: { action: actionId, execution: 'fastpass' }
    }, (context) => {
      const start = context.now();
      const applied = [];
      try {
        for (const intent of intents) {
          if (context.signal?.aborted) return Object.freeze({ status: 'superseded' });
          // Ports apply the intent synchronously. Loading and animation are separate work.
          applyIntent(intent, { signal: context.signal, action: actionId, payload, isCurrent: () => !context.signal?.aborted });
          applied.push(intent);
        }
        return Object.freeze({ status: 'success', execution: 'fastpass', action: actionId, intents: Object.freeze(applied) });
      } finally {
        const durationMs = context.now() - start;
        if (durationMs > context.maxChunkMs) diagnostic('xtend.maraca.fastpass.budget-exceeded', 'warning', 'A FastPass shell action exceeded its cooperative budget.', { action: actionId, durationMs, budgetMs: context.maxChunkMs });
      }
    });
    keys.forEach((key) => pending.set(key, handle));
    const abort = () => handle.cancel(options.signal?.reason || 'fastpass_aborted');
    if (options.signal?.aborted) abort();
    else options.signal?.addEventListener('abort', abort, { once: true });
    const cleanup = () => {
      keys.forEach((key) => { if (pending.get(key) === handle) pending.delete(key); });
      options.signal?.removeEventListener('abort', abort);
    };
    handle.result.then(cleanup, cleanup);
    return handle;
  }
  return Object.freeze({
    has: (id) => registry.has(id), dispatch,
    dispose() { disposed = true; new Set(pending.values()).forEach((handle) => handle.cancel('disposed')); pending.clear(); }
  });
}
