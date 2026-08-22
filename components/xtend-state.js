/**
 * XTend State Management
 * Globale, reaktive State-Lösung für das XTend-Framework.
 * Komponenten können auf State-Änderungen reagieren und Werte zentral speichern.
 */

const XTEND_STATE_BOUNDARY_SCHEMA = 'xtend.state.boundary-probe.v1';
const XTEND_STATE_SNAPSHOT_SCHEMA = 'xtend.state.snapshot.v1';
const XTEND_STATE_LIFECYCLE_EVENT_SCHEMA = 'xtend.state.lifecycle-event.v1';
const XTEND_STATE_DIAGNOSTICS_SCHEMA = 'xtend.fabric.state-diagnostics.v1';
const XTEND_STATE_RMT_COMPATIBILITY_SCHEMA = 'xtend.rmt.state-scheduler-compatibility.v2';
const XTEND_STATE_KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-xtend-types';
const XTEND_STATE_STORAGE_KEY = 'xtend-state-data';
// Kept only for the one-time 0.7 persisted-data migration.
const LEGACY_STATE_STORAGE_KEY = 'xstate-data';

function cloneData(data) {
  return { ...data };
}

function countLegacyListeners(legacyListeners) {
  return Array.from(legacyListeners.values()).reduce((count, listeners) => count + listeners.size, 0);
}

function normalizeFilter(filter) {
  if (Array.isArray(filter)) return filter.slice();
  return filter || null;
}

function isStateRecord(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

// Shared Classic state runtime used by manifest-backed XTend components.
const xtendState = {
  xtendStateBoundaryContract: Object.freeze({
    schema: XTEND_STATE_BOUNDARY_SCHEMA,
    moduleRef: 'xtend-state',
    componentRef: 'xtend-state',
    boundaryKind: 'adapter-boundary-probe',
    customElement: false,
    profiles: ['stateful', 'infrastructure'],
    publicSurface: ['get', 'set', 'remove', 'clear', 'subscribe', 'on', 'off', 'snapshot', 'snapshotDiagnostics', 'createRmtStateAdapter'],
    kernelBoundary: XTEND_STATE_KERNEL_BOUNDARY
  }),
  xtendRmtMetadata: Object.freeze({
    schema: XTEND_STATE_RMT_COMPATIBILITY_SCHEMA,
    moduleRef: 'xtend-state',
    adapterRole: 'optional-host-state-bridge',
    schedulerCompatibility: ['state-read', 'state-write', 'diagnostics-mirror', 'route-result-mirror', 'component-result-mirror'],
    canonicalKeys: [
      'rmt.bridge.ready',
      'rmt.scheduler.lastEndpoint',
      'rmt.adapter.lastResult',
      'rmt.diagnostics.last',
      'rmt.route.<id>.lastResult',
      'rmt.component.<id>.lastResult'
    ],
    kernelBoundary: XTEND_STATE_KERNEL_BOUNDARY
  }),
  xtendComponentLifecycleTelemetry: Object.freeze({
    schema: 'xtend.component.lifecycle-telemetry.v1',
    componentRef: 'xtend-state',
    boundaryKind: 'state-infrastructure',
    lane: 'diagnostics',
    events: [
      'state:set',
      'state:remove',
      'state:clear',
      'state:batch-update',
      'state:subscribe',
      'state:unsubscribe',
      'rmt-state-adapter:create'
    ],
    dispatchEvent: 'xtend-state:lifecycle'
  }),
  _data: {},
  _listeners: [],
  _legacyListeners: new Map(),
  _lifecycleListeners: [],
  _lifecycleEvents: [],
  _operationCounts: {
    set: 0,
    remove: 0,
    clear: 0,
    setPath: 0,
    batchUpdate: 0,
    subscribe: 0,
    unsubscribe: 0,
    storageSave: 0,
    storageLoad: 0,
    adapterCreate: 0
  },
  _debug: false,

  _incrementOperation(operation) {
    this._operationCounts[operation] = (this._operationCounts[operation] || 0) + 1;
  },

  _recordLifecycle(type, detail = {}) {
    const event = {
      schema: XTEND_STATE_LIFECYCLE_EVENT_SCHEMA,
      source: 'xtend-state',
      type,
      detail,
      listenerCount: this._listeners.length,
      legacyListenerCount: countLegacyListeners(this._legacyListeners),
      timestamp: new Date().toISOString()
    };

    this._lifecycleEvents.push(event);
    if (this._lifecycleEvents.length > 50) {
      this._lifecycleEvents.shift();
    }

    this._lifecycleListeners.slice().forEach((listener) => {
      try {
        listener(event, this.snapshotDiagnostics());
      } catch (error) {
        if (this._debug) {
          console.error('[XTendState] Lifecycle listener failed:', error);
        }
      }
    });

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(new CustomEvent('xtend-state:lifecycle', { detail: event }));
    }

    return event;
  },

  _notifyListeners(key, value) {
    this._listeners.forEach(listener => {
      if (!listener.filter || listener.filter === key ||
          (Array.isArray(listener.filter) && listener.filter.includes(key))) {
        listener.callback(key, value, cloneData(this._data));
      }
    });
  },

  /**
   * Setzt einen Wert im State und benachrichtigt alle Listener.
   * @param {string} key
   * @param {*} value
   */
  set(key, value) {
    if (this._debug) {
      console.log(`[XTendState] Setting ${key}:`, value);
    }
    this._incrementOperation('set');
    this._data[key] = value;
    this._notifyListeners(key, value);
    this._recordLifecycle('state:set', {
      key,
      valueType: typeof value
    });
  },

  /**
   * Holt einen Wert aus dem State.
   * @param {string} key
   * @returns {*}
   */
  get(key) {
    return this._data[key];
  },

  /**
   * Abonniert Änderungen am State.
   * @param {function} fn - Callback (key, value, allData)
   * @param {string|string[]} [keyFilter] - Optional key or array of keys to filter updates
   * @returns {function} unsubscribe
   */
  subscribe(fn, keyFilter) {
    const listener = { callback: fn, filter: keyFilter };
    this._listeners.push(listener);
    this._incrementOperation('subscribe');
    this._recordLifecycle('state:subscribe', {
      filter: normalizeFilter(keyFilter)
    });
    // Initial sofortigen Wert liefern (optional)
    fn(null, null, cloneData(this._data));
    return () => {
      this._listeners = this._listeners.filter(l => l !== listener);
      this._incrementOperation('unsubscribe');
      this._recordLifecycle('state:unsubscribe', {
        filter: normalizeFilter(keyFilter)
      });
    };
  },

  /**
   * Legacy-Kompatibilität: Registriert einen Listener für genau einen Key.
   * Der kanonische Vertrag bleibt `subscribe(fn, keyFilter)`.
   * @param {string} key
   * @param {function} fn
   * @returns {function} unsubscribe
   */
  on(key, fn) {
    if (typeof key !== 'string' || typeof fn !== 'function') {
      return () => {};
    }

    const unsubscribe = this.subscribe((changedKey, value, allData) => {
      if (changedKey === key) {
        fn(value, allData, changedKey);
      }
    }, key);

    if (!this._legacyListeners.has(key)) {
      this._legacyListeners.set(key, new Map());
    }
    this._legacyListeners.get(key).set(fn, unsubscribe);

    return () => this.off(key, fn);
  },

  /**
   * Legacy-Kompatibilität: Entfernt einen per `on` registrierten Listener.
   * @param {string} key
   * @param {function} fn
   */
  off(key, fn) {
    const keyListeners = this._legacyListeners.get(key);
    if (!keyListeners || !keyListeners.has(fn)) return;

    const unsubscribe = keyListeners.get(fn);
    if (typeof unsubscribe === 'function') {
      unsubscribe();
    }
    keyListeners.delete(fn);

    if (keyListeners.size === 0) {
      this._legacyListeners.delete(key);
    }
  },

  /**
   * Entfernt einen Wert aus dem State.
   * @param {string} key
   */
  remove(key) {
    if (this._debug) {
      console.log(`[XTendState] Removing ${key}`);
    }
    this._incrementOperation('remove');
    delete this._data[key];
    this._notifyListeners(key, undefined);
    this._recordLifecycle('state:remove', {
      key
    });
  },

  /**
   * Setzt den gesamten State zurück.
   */
  clear() {
    if (this._debug) {
      console.log(`[XTendState] Clearing all state`);
    }
    this._incrementOperation('clear');
    this._data = {};
    this._notifyListeners(null, null);
    this._recordLifecycle('state:clear');
  },

  /**
   * Holt einen Wert aus dem State mit Pfadunterstützung.
   * @param {string} path - Pfad im Format 'user.profile.name'
   * @returns {*}
   */
  getPath(path) {
    const parts = path.split('.');
    let current = this._data;
    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }
    return current;
  },

  /**
   * Setzt einen Wert im State mit Pfadunterstützung.
   * @param {string} path - Pfad im Format 'user.profile.name'
   * @param {*} value
   */
  setPath(path, value) {
    if (this._debug) {
      console.log(`[XTendState] Setting path ${path}:`, value);
    }
    this._incrementOperation('setPath');
    
    const parts = path.split('.');
    const lastKey = parts.pop();
    let current = this._data;
    
    // Create intermediate objects if they don't exist
    for (const part of parts) {
      if (!current[part] || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part];
    }
    
    current[lastKey] = value;
    this._notifyListeners(path, value);
    this._recordLifecycle('state:set-path', {
      path,
      valueType: typeof value
    });
  },

  /**
   * Mehrere Updates in einem Schritt durchführen.
   * @param {Object} updates - Key-Value-Paare für Updates
   */
  batchUpdate(updates) {
    if (this._debug) {
      console.log(`[XTendState] Batch update:`, updates);
    }
    this._incrementOperation('batchUpdate');
    
    // Apply all updates
    for (const [key, value] of Object.entries(updates)) {
      this._data[key] = value;
    }
    
    // Notify listeners once
    this._listeners.forEach(listener => {
      listener.callback('batch-update', updates, cloneData(this._data));
    });
    this._recordLifecycle('state:batch-update', {
      keys: Object.keys(updates || {})
    });
  },

  /**
   * Speichert den aktuellen State im Browser-Storage.
   * @param {string} [storageType='local'] - 'local' oder 'session'
   * @param {string} [key='xtend-state-data'] - Schlüssel für Storage
   */
  saveToStorage(storageType = 'local', key = XTEND_STATE_STORAGE_KEY) {
    const storage = storageType === 'session' ? sessionStorage : localStorage;
    try {
      storage.setItem(key, JSON.stringify(this._data));
      this._incrementOperation('storageSave');
      this._recordLifecycle('state:storage-save', {
        storageType,
        key
      });
      if (this._debug) {
        console.log(`[XTendState] Saved state to ${storageType}Storage`);
      }
    } catch (e) {
      console.error(`[XTendState] Failed to save state to ${storageType}Storage:`, e);
    }
  },

  /**
   * Lädt den State aus dem Browser-Storage.
   * @param {string} [storageType='local'] - 'local' oder 'session'
   * @param {string} [key='xtend-state-data'] - Schlüssel für Storage
   * @returns {boolean} - True wenn erfolgreich geladen
   */
  loadFromStorage(storageType = 'local', key = XTEND_STATE_STORAGE_KEY) {
    const storage = storageType === 'session' ? sessionStorage : localStorage;
    try {
      let sourceKey = key;
      let data = storage.getItem(sourceKey);
      if (!data && key === XTEND_STATE_STORAGE_KEY) {
        const legacyData = storage.getItem(LEGACY_STATE_STORAGE_KEY);
        if (legacyData) {
          sourceKey = LEGACY_STATE_STORAGE_KEY;
          data = legacyData;
        }
      }
      if (data) {
        const parsed = JSON.parse(data);
        if (!isStateRecord(parsed)) {
          throw new TypeError('XTend State storage payload must be an object record.');
        }
        if (sourceKey === LEGACY_STATE_STORAGE_KEY) {
          storage.setItem(XTEND_STATE_STORAGE_KEY, JSON.stringify(parsed));
          storage.removeItem(LEGACY_STATE_STORAGE_KEY);
        }
        this._data = parsed;
        this._incrementOperation('storageLoad');
        this._notifyListeners('storage-loaded', null);
        this._recordLifecycle('state:storage-load', {
          storageType,
          key
        });
        if (this._debug) {
          console.log(`[XTendState] Loaded state from ${storageType}Storage`);
        }
        return true;
      }
    } catch (e) {
      console.error(`[XTendState] Failed to load state from ${storageType}Storage:`, e);
    }
    return false;
  },

  /**
   * Aktiviert Debug-Modus mit Logging in der Konsole.
   * @param {boolean} [enabled=true]
   */
  enableDebug(enabled = true) {
    this._debug = enabled;
    console.log(`[XTendState] Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  },

  /**
   * Abonniert Lifecycle- und Diagnostics-Events der State-Boundary.
   * @param {function} fn - Callback (event, diagnostics)
   * @returns {function} unsubscribe
   */
  subscribeLifecycle(fn) {
    if (typeof fn !== 'function') {
      return () => {};
    }
    this._lifecycleListeners.push(fn);
    this._recordLifecycle('state:lifecycle-subscribe');
    return () => {
      this._lifecycleListeners = this._lifecycleListeners.filter(listener => listener !== fn);
      this._recordLifecycle('state:lifecycle-unsubscribe');
    };
  },

  /**
   * Liefert einen stabilen Snapshot fuer Tests, Diagnostics und Fabric Reporter.
   * @returns {Object}
   */
  snapshot() {
    return {
      schema: XTEND_STATE_SNAPSHOT_SCHEMA,
      source: 'xtend-state',
      keys: Object.keys(this._data),
      data: cloneData(this._data),
      listenerCount: this._listeners.length,
      legacyListenerCount: countLegacyListeners(this._legacyListeners),
      lifecycleListenerCount: this._lifecycleListeners.length,
      debug: this._debug
    };
  },

  /**
   * Liefert Fabric-kompatible Diagnostics fuer die nicht-visuelle Boundary-Probe.
   * @returns {Object}
   */
  snapshotDiagnostics() {
    return {
      schema: XTEND_STATE_DIAGNOSTICS_SCHEMA,
      source: 'xtend-state',
      boundary: this.xtendStateBoundaryContract,
      rmt: this.xtendRmtMetadata,
      operationCounts: { ...this._operationCounts },
      listenerCount: this._listeners.length,
      legacyListenerCount: countLegacyListeners(this._legacyListeners),
      lifecycleListenerCount: this._lifecycleListeners.length,
      lifecycleEvents: this._lifecycleEvents.slice(-10),
      stateKeys: Object.keys(this._data)
    };
  },

  /**
   * Erstellt einen host-neutralen Adapter fuer RMT State/Scheduler Bridges.
   * Der RMT Kernel importiert diese Boundary nicht direkt.
   * @param {Object} [options]
   * @returns {Object}
   */
  createRmtStateAdapter(options = {}) {
    this._incrementOperation('adapterCreate');
    this._recordLifecycle('rmt-state-adapter:create', {
      schedulerId: options.schedulerId || 'rmt.state.scheduler'
    });
    return {
      schema: XTEND_STATE_RMT_COMPATIBILITY_SCHEMA,
      source: 'xtend-state',
      schedulerId: options.schedulerId || 'rmt.state.scheduler',
      kernelBoundary: XTEND_STATE_KERNEL_BOUNDARY,
      get: this.get.bind(this),
      set: this.set.bind(this),
      batchUpdate: this.batchUpdate.bind(this),
      remove: this.remove.bind(this),
      clear: this.clear.bind(this),
      subscribe: this.subscribe.bind(this),
      snapshot: this.snapshot.bind(this),
      diagnostics: this.snapshotDiagnostics.bind(this)
    };
  }
};

// Export as a module for import syntax
export {
  XTEND_STATE_BOUNDARY_SCHEMA,
  XTEND_STATE_DIAGNOSTICS_SCHEMA,
  XTEND_STATE_LIFECYCLE_EVENT_SCHEMA,
  XTEND_STATE_RMT_COMPATIBILITY_SCHEMA,
  XTEND_STATE_SNAPSHOT_SCHEMA,
  XTEND_STATE_STORAGE_KEY
};
export { xtendState };

// Classic browser namespace. The package root intentionally does not load this module.
if (typeof window !== 'undefined') {
  window.XTend = window.XTend || {};
  window.XTend.state = xtendState;
}

// UMD-style export for CommonJS/AMD
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { xtendState };
}

// Example usage:
// 1. Als ES Modul: import { xtendState } from './xtend-state.js';
// 2. As a script tag: <script src="xtend-state.js"></script>, then window.XTend.state
