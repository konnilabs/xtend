/**
 * XTend State Management
 * Globale, reaktive State-Lösung für das XTend-Framework.
 * Komponenten können auf State-Änderungen reagieren und Werte zentral speichern.
 */

const XSTATE_BOUNDARY_SCHEMA = 'xtend.state.boundary-probe.v1';
const XSTATE_SNAPSHOT_SCHEMA = 'xtend.state.snapshot.v1';
const XSTATE_LIFECYCLE_EVENT_SCHEMA = 'xtend.state.lifecycle-event.v1';
const XSTATE_DIAGNOSTICS_SCHEMA = 'xtend.fabric.state-diagnostics.v1';
const XSTATE_RMT_COMPATIBILITY_SCHEMA = 'xtend.rmt.state-scheduler-compatibility.v2';
const XSTATE_KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-xtend-types';

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

// xstate Objekt definieren
const xstateObj = {
  xtendStateBoundaryContract: Object.freeze({
    schema: XSTATE_BOUNDARY_SCHEMA,
    moduleRef: 'xstate',
    componentRef: 'xstate',
    boundaryKind: 'adapter-boundary-probe',
    customElement: false,
    profiles: ['stateful', 'infrastructure'],
    publicSurface: ['get', 'set', 'remove', 'clear', 'subscribe', 'on', 'off', 'snapshot', 'snapshotDiagnostics', 'createRmtStateAdapter'],
    kernelBoundary: XSTATE_KERNEL_BOUNDARY
  }),
  xtendRmtMetadata: Object.freeze({
    schema: XSTATE_RMT_COMPATIBILITY_SCHEMA,
    moduleRef: 'xstate',
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
    kernelBoundary: XSTATE_KERNEL_BOUNDARY
  }),
  xtendComponentLifecycleTelemetry: Object.freeze({
    schema: 'xtend.component.lifecycle-telemetry.v1',
    componentRef: 'xstate',
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
    dispatchEvent: 'xstate:lifecycle'
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
      schema: XSTATE_LIFECYCLE_EVENT_SCHEMA,
      source: 'xstate',
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
          console.error('[XState] Lifecycle listener failed:', error);
        }
      }
    });

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(new CustomEvent('xstate:lifecycle', { detail: event }));
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
      console.log(`[XState] Setting ${key}:`, value);
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
      console.log(`[XState] Removing ${key}`);
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
      console.log(`[XState] Clearing all state`);
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
      console.log(`[XState] Setting path ${path}:`, value);
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
      console.log(`[XState] Batch update:`, updates);
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
   * @param {string} [key='xstate-data'] - Schlüssel für Storage
   */
  saveToStorage(storageType = 'local', key = 'xstate-data') {
    const storage = storageType === 'session' ? sessionStorage : localStorage;
    try {
      storage.setItem(key, JSON.stringify(this._data));
      this._incrementOperation('storageSave');
      this._recordLifecycle('state:storage-save', {
        storageType,
        key
      });
      if (this._debug) {
        console.log(`[XState] Saved state to ${storageType}Storage`);
      }
    } catch (e) {
      console.error(`[XState] Failed to save state to ${storageType}Storage:`, e);
    }
  },

  /**
   * Lädt den State aus dem Browser-Storage.
   * @param {string} [storageType='local'] - 'local' oder 'session'
   * @param {string} [key='xstate-data'] - Schlüssel für Storage
   * @returns {boolean} - True wenn erfolgreich geladen
   */
  loadFromStorage(storageType = 'local', key = 'xstate-data') {
    const storage = storageType === 'session' ? sessionStorage : localStorage;
    try {
      const data = storage.getItem(key);
      if (data) {
        this._data = JSON.parse(data);
        this._incrementOperation('storageLoad');
        this._notifyListeners('storage-loaded', null);
        this._recordLifecycle('state:storage-load', {
          storageType,
          key
        });
        if (this._debug) {
          console.log(`[XState] Loaded state from ${storageType}Storage`);
        }
        return true;
      }
    } catch (e) {
      console.error(`[XState] Failed to load state from ${storageType}Storage:`, e);
    }
    return false;
  },

  /**
   * Aktiviert Debug-Modus mit Logging in der Konsole.
   * @param {boolean} [enabled=true]
   */
  enableDebug(enabled = true) {
    this._debug = enabled;
    console.log(`[XState] Debug mode ${enabled ? 'enabled' : 'disabled'}`);
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
      schema: XSTATE_SNAPSHOT_SCHEMA,
      source: 'xstate',
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
      schema: XSTATE_DIAGNOSTICS_SCHEMA,
      source: 'xstate',
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
      schema: XSTATE_RMT_COMPATIBILITY_SCHEMA,
      source: 'xstate',
      schedulerId: options.schedulerId || 'rmt.state.scheduler',
      kernelBoundary: XSTATE_KERNEL_BOUNDARY,
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
  XSTATE_BOUNDARY_SCHEMA,
  XSTATE_DIAGNOSTICS_SCHEMA,
  XSTATE_LIFECYCLE_EVENT_SCHEMA,
  XSTATE_RMT_COMPATIBILITY_SCHEMA,
  XSTATE_SNAPSHOT_SCHEMA
};
export const xstate = xstateObj;

// Define as a global variable for non-module scripts
if (typeof window !== 'undefined') {
  window.xstate = xstateObj;
}

// UMD-style export for CommonJS/AMD
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { xstate: xstateObj };
}

// Example usage:
// 1. Als ES Modul: import { xstate } from './xstate.js';
// 2. As a script tag: <script src="xstate.js"></script>, then window.xstate
