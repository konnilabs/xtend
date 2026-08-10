(function attachRmtXStateHostAdapter(globalTarget) {
  const RMT_XSTATE_HOST_ADAPTER_SCHEMA = 'xtend.rmt.xstate-host-adapter.v1';
  const RMT_STATE_PROJECTION_PORT_SCHEMA = 'xtend.rmt.state-projection-port.v1';
  const RMT_STATE_SELECTOR_RUNTIME_SCHEMA = 'xtend.epic18.rmt-state-selector-runtime.v2';

  function clampString(value, fallback = '') {
    const normalized = String(value == null ? '' : value).trim();
    return normalized || fallback;
  }

  function objectRecord(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function cloneValue(value, fallback = null) {
    if (typeof value === 'undefined') return fallback;
    if (value === null || typeof value !== 'object') return value;
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (_) {
      return value;
    }
  }

  function createBatchRequiredError() {
    const error = new Error('Strict RMT Model projection requires XState batchUpdate().');
    error.code = 'rmt.state.xstate-batch-required';
    return error;
  }

  function createRmtXStateHostAdapter(options = {}) {
    const target = options.target || options.xstate || null;
    const strict = options.strict === true || options.strictMaraca === true;
    const writes = [];
    const reads = [];

    if (strict && target && typeof target.batchUpdate !== 'function') {
      throw createBatchRequiredError();
    }

    function set(key, value, metadata = {}) {
      const safeKey = clampString(key);
      if (!safeKey) return false;
      let mirrored = false;
      if (target && typeof target.set === 'function') {
        target.set(safeKey, cloneValue(value, value));
        mirrored = true;
      } else if (target && typeof target.setState === 'function') {
        target.setState(safeKey, cloneValue(value, value));
        mirrored = true;
      }
      writes.push({
        key: safeKey,
        value: cloneValue(value, value),
        mirrored,
        metadata: cloneValue(metadata, {})
      });
      return mirrored;
    }

    function batchUpdate(updates, metadata = {}) {
      const safeUpdates = Object.create(null);
      Object.entries(objectRecord(updates)).forEach(([key, value]) => {
        const safeKey = clampString(key);
        if (!safeKey) return;
        safeUpdates[safeKey] = cloneValue(value, value);
      });
      const entries = Object.entries(safeUpdates);
      let mirrored = false;
      if (target && typeof target.batchUpdate === 'function') {
        target.batchUpdate(safeUpdates);
        mirrored = true;
      } else if (!strict) {
        entries.forEach(([key, value]) => {
          if (target && typeof target.set === 'function') {
            target.set(key, cloneValue(value, value));
            mirrored = true;
          } else if (target && typeof target.setState === 'function') {
            target.setState(key, cloneValue(value, value));
            mirrored = true;
          }
        });
      }
      entries.forEach(([key, value]) => {
        writes.push({
          key,
          value: cloneValue(value, value),
          mirrored,
          batched: true,
          metadata: cloneValue(metadata, {})
        });
      });
      return mirrored;
    }

    function get(key, fallbackValue) {
      const safeKey = clampString(key);
      let value;
      if (target && typeof target.get === 'function') {
        value = target.get(safeKey);
      } else if (target && typeof target.getState === 'function') {
        value = target.getState(safeKey);
      }
      reads.push({ key: safeKey, hit: typeof value !== 'undefined' });
      return typeof value === 'undefined' ? fallbackValue : value;
    }

    function mirrorSnapshot(snapshot, metadata = {}) {
      return batchUpdate({
        ...objectRecord(snapshot && snapshot.states),
        ...objectRecord(snapshot && snapshot.selectors),
        ...objectRecord(snapshot && snapshot.derived)
      }, metadata);
    }

    function subscribe(listener) {
      if (target && typeof target.subscribe === 'function') {
        const subscription = target.subscribe(listener);
        if (typeof subscription === 'function') return subscription;
        if (subscription && typeof subscription.unsubscribe === 'function') {
          return () => subscription.unsubscribe();
        }
      }
      return () => undefined;
    }

    return Object.freeze({
      // Kept stable for the public 0.6 RmtXStateBridge compatibility shape.
      schema: RMT_STATE_SELECTOR_RUNTIME_SCHEMA,
      adapterSchema: RMT_XSTATE_HOST_ADAPTER_SCHEMA,
      portSchema: RMT_STATE_PROJECTION_PORT_SCHEMA,
      external: !!target,
      strict,
      set,
      batchUpdate,
      get,
      mirrorSnapshot,
      subscribe,
      listWrites() {
        return writes.map((entry) => cloneValue(entry, entry));
      },
      listReads() {
        return reads.map((entry) => cloneValue(entry, entry));
      }
    });
  }

  function createRmtXStateBridge(options = {}) {
    return createRmtXStateHostAdapter(options);
  }

  const api = {
    RMT_STATE_PROJECTION_PORT_SCHEMA,
    RMT_XSTATE_HOST_ADAPTER_SCHEMA,
    createRmtXStateBridge,
    createRmtXStateHostAdapter
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (globalTarget) {
    globalTarget.XTendRmtXStateHostAdapter = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));

const __XTEND_RMT_XSTATE_HOST_ADAPTER_API__ = globalThis.XTendRmtXStateHostAdapter;

export const RMT_STATE_PROJECTION_PORT_SCHEMA = __XTEND_RMT_XSTATE_HOST_ADAPTER_API__.RMT_STATE_PROJECTION_PORT_SCHEMA;
export const RMT_XSTATE_HOST_ADAPTER_SCHEMA = __XTEND_RMT_XSTATE_HOST_ADAPTER_API__.RMT_XSTATE_HOST_ADAPTER_SCHEMA;
export const createRmtXStateBridge = __XTEND_RMT_XSTATE_HOST_ADAPTER_API__.createRmtXStateBridge;
export const createRmtXStateHostAdapter = __XTEND_RMT_XSTATE_HOST_ADAPTER_API__.createRmtXStateHostAdapter;

export default __XTEND_RMT_XSTATE_HOST_ADAPTER_API__;
