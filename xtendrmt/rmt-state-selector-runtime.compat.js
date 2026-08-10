// Public 0.6 composition facade. The canonical Model source intentionally has
// no View dependency; only this compatibility boundary composes the deprecated
// State Binding aliases with the State Binding View Projector.
import stateRuntimeApi, {
  RMT_STATE_SELECTOR_DIAGNOSTIC_SCHEMA,
  RMT_STATE_SELECTOR_RUNTIME_SCHEMA,
  createRmtStateSelectorRuntime as createRmtStateSelectorModel
} from './rmt-state-selector-runtime.js';
import {
  createRmtXStateHostAdapter
} from './rmt-xstate-host-adapter.js';
import {
  createRmtStateBindingViewProjector
} from './rmt-state-binding-view-projector.js';

const DEFAULT_DIAGNOSTIC_CHANNEL = 'rmt.app_platform.state_binding_view';
const legacyBindingRuntimes = new WeakSet();

export function createRmtXStateBridge(options = {}) {
  return createRmtXStateHostAdapter({
    ...options,
    target: options.target || options.xstate || null
  });
}

export function createRmtStateSelectorRuntime(options = {}) {
  const stateProjectionTarget = Object.prototype.hasOwnProperty.call(options, 'stateProjectionTarget')
    ? options.stateProjectionTarget
    : options.xstate;
  const createStateProjectionPort = typeof options.createStateProjectionPort === 'function'
    ? options.createStateProjectionPort
    : createRmtXStateBridge;
  const runtime = createRmtStateSelectorModel({
    ...options,
    stateProjectionTarget,
    createStateProjectionPort,
    adoptStateProjection: options.adoptStateProjection === true || options.adoptXState === true
  });
  return Object.freeze({
    ...runtime,
    connectXState(target) {
      return createRmtXStateBridge({ target });
    },
    xstateBridge: runtime.stateProjectionPort
  });
}

function toArray(value) {
  return Array.isArray(value) ? value : (value == null ? [] : [value]);
}

function cloneAndFreeze(value) {
  const clone = value == null || typeof value !== 'object'
    ? value
    : JSON.parse(JSON.stringify(value));
  const freeze = (entry) => {
    if (!entry || typeof entry !== 'object' || Object.isFrozen(entry)) return entry;
    Object.values(entry).forEach(freeze);
    return Object.freeze(entry);
  };
  return freeze(clone);
}

function publishLegacyBindingDiagnostic(runtime, options) {
  if (runtime && typeof runtime === 'object' && legacyBindingRuntimes.has(runtime)) return null;
  if (runtime && typeof runtime === 'object') legacyBindingRuntimes.add(runtime);
  const diagnostic = Object.freeze({
    schema: RMT_STATE_SELECTOR_DIAGNOSTIC_SCHEMA,
    code: 'rmt.state-binding.legacy-adapter',
    severity: 'info',
    message: 'Legacy State Binding API delegates to the State Binding View Projector. Use createRmtStateBindingViewProjector().',
    details: Object.freeze({ removal: '0.7.0' })
  });
  if (typeof options.publishDiagnostic === 'function') options.publishDiagnostic(diagnostic);
  if (options.diagnosticsHub && typeof options.diagnosticsHub.publish === 'function') {
    options.diagnosticsHub.publish(
      String(options.diagnosticChannel || DEFAULT_DIAGNOSTIC_CHANNEL),
      diagnostic,
      { schema: RMT_STATE_SELECTOR_DIAGNOSTIC_SCHEMA }
    );
  }
  return diagnostic;
}

function resolveLegacyBindingSnapshot(runtime) {
  if (!runtime || typeof runtime !== 'object') {
    throw new TypeError('Legacy State Binding API requires an RMT model reader or state runtime.');
  }
  const modelReader = runtime.modelReader || runtime.model;
  const snapshot = modelReader && typeof modelReader.snapshot === 'function'
    ? modelReader.snapshot()
    : (typeof runtime.snapshot === 'function' ? runtime.snapshot() : null);
  if (!snapshot || typeof snapshot !== 'object') {
    throw new TypeError('Legacy State Binding API could not read a model snapshot.');
  }
  return cloneAndFreeze(snapshot);
}

function createLegacyBindingProjector(options) {
  const factory = options.createStateBindingViewProjector || createRmtStateBindingViewProjector;
  return factory({
    strategy: options.strategy,
    domRenderer: options.domRenderer,
    renderer: options.renderer,
    strict: options.strict,
    strictMaraca: options.strictMaraca,
    documentTarget: options.documentTarget,
    createDomRenderer: options.createDomRenderer,
    componentRegistry: options.componentRegistry,
    registry: options.registry,
    context: options.context,
    ownership: options.ownership,
    diagnosticsHub: options.diagnosticsHub,
    diagnosticChannel: options.diagnosticChannel,
    domDiagnosticChannel: options.domDiagnosticChannel,
    publishDiagnostic: options.publishDiagnostic
  });
}

function withLegacyBindingDiagnostic(result, diagnostic) {
  if (!diagnostic || !result || typeof result !== 'object') return result;
  return Object.freeze({
    ...result,
    diagnostics: Object.freeze([diagnostic, ...toArray(result.diagnostics)])
  });
}

export function applyRmtStateBindings(root, bindings, runtime, options = {}) {
  const legacyDiagnostic = publishLegacyBindingDiagnostic(runtime, options);
  const suppliedProjector = options.stateBindingViewProjector || options.projector || null;
  const projector = suppliedProjector || createLegacyBindingProjector(options);
  if (!projector || typeof projector.project !== 'function') {
    throw new TypeError('Legacy State Binding API requires a valid State Binding View Projector.');
  }
  try {
    return withLegacyBindingDiagnostic(
      projector.project(root, bindings, resolveLegacyBindingSnapshot(runtime), {
        compatibilityApi: 'applyRmtStateBindings'
      }),
      legacyDiagnostic
    );
  } finally {
    if (!suppliedProjector && typeof projector.dispose === 'function') projector.dispose();
  }
}

export function createRmtStateBindingAdapter(options = {}) {
  let projector = options.stateBindingViewProjector || options.projector || null;
  let ownsProjector = false;
  let disposed = false;
  return Object.freeze({
    schema: RMT_STATE_SELECTOR_RUNTIME_SCHEMA,
    apply(root, bindings, runtime) {
      if (disposed) throw new Error('RMT State Binding Adapter wurde bereits disposed.');
      const legacyDiagnostic = publishLegacyBindingDiagnostic(runtime, options);
      if (!projector) {
        projector = createLegacyBindingProjector(options);
        ownsProjector = true;
      }
      return withLegacyBindingDiagnostic(
        projector.project(root, bindings, resolveLegacyBindingSnapshot(runtime), {
          compatibilityApi: 'createRmtStateBindingAdapter'
        }),
        legacyDiagnostic
      );
    },
    dispose() {
      const alreadyDisposed = disposed;
      disposed = true;
      if (ownsProjector && projector && typeof projector.dispose === 'function') projector.dispose();
      projector = null;
      return {
        schema: RMT_STATE_SELECTOR_RUNTIME_SCHEMA,
        disposed: true,
        alreadyDisposed
      };
    }
  });
}

const compatibilityApi = Object.freeze({
  ...stateRuntimeApi,
  applyRmtStateBindings,
  createRmtStateBindingAdapter,
  createRmtStateSelectorRuntime,
  createRmtXStateBridge
});

if (typeof globalThis !== 'undefined') {
  globalThis.XTendRmtStateSelectorRuntime = compatibilityApi;
}

export * from './rmt-state-selector-runtime.js';
export default compatibilityApi;
