import { xtendState } from './xtend-state.definition.js';
import { XUtils } from './xutils.definition.js';
import { createXtendI18n } from './xtend-i18n.definition.js';
import { createThemeManager } from './xtheme.definition.js';

export const NATIVE_SERVICES_SCHEMA = 'xtend.native-services.port.v1';
export const NATIVE_STATE_PORT_SCHEMA = 'xtend.native-services.state-port.v1';
const platformMethods = Object.freeze({
  'router.bind': 'bindRouter',
  'surface.manager.bind': 'bindManager',
  'surface.portal.bind': 'bindPortal',
  'surface.bind': 'bindSurface'
});

function ownerId(owner) {
  if (owner && typeof owner === 'object' && typeof owner.documentId === 'string' && typeof owner.surfaceId === 'string' && Number.isSafeInteger(owner.generation)) {
    return JSON.stringify([owner.documentId, owner.surfaceId, owner.generation, owner.controllerId || null]);
  }
  const value = typeof owner === 'string' ? owner : owner?.id;
  if (typeof value !== 'string' || !value.trim()) throw new TypeError('Native services require an owner ID');
  return value;
}

export function createManagedStatePort({ owner, runtime = xtendState, signal } = {}) {
  const prefix = `rmt.native.${encodeURIComponent(ownerId(owner))}.`;
  if (typeof runtime?.createRmtStateAdapter !== 'function') throw new TypeError('Native state requires the existing XTend State adapter');
  const adapter = runtime.createRmtStateAdapter({ schedulerId: `${prefix}scheduler` });
  const subscriptions = new Set();
  let disposed = false;
  const assertLive = () => { if (disposed || signal?.aborted) throw new Error('Native state owner is disposed'); };
  const keyFor = (key) => {
    if (typeof key !== 'string' || !key || key.includes('\0')) throw new TypeError('State key must be a nonempty string');
    return prefix + key;
  };
  const port = Object.freeze({
    schema: NATIVE_STATE_PORT_SCHEMA,
    get(key) { assertLive(); return adapter.get(keyFor(key)); },
    set(key, value) { assertLive(); return adapter.set(keyFor(key), value); },
    remove(key) { assertLive(); return adapter.remove(keyFor(key)); },
    batchUpdate(values) {
      assertLive();
      return adapter.batchUpdate(Object.fromEntries(Object.entries(values).map(([key, value]) => [keyFor(key), value])));
    },
    subscribe(callback, filter) {
      assertLive();
      if (typeof callback !== 'function') throw new TypeError('State subscription requires a callback');
      const filters = filter == null ? null : (Array.isArray(filter) ? filter : [filter]).map(keyFor);
      const unsubscribe = adapter.subscribe((key, value) => {
        if (disposed || signal?.aborted) return;
        if (key === 'batch-update') {
          for (const [changedKey, changedValue] of Object.entries(value || {})) {
            if (changedKey.startsWith(prefix) && (!filters || filters.includes(changedKey))) callback(changedKey.slice(prefix.length), changedValue);
          }
        } else if (typeof key === 'string' && key.startsWith(prefix) && (!filters || filters.includes(key))) {
          callback(key.slice(prefix.length), value);
        }
      });
      let active = true;
      const release = () => { if (!active) return; active = false; subscriptions.delete(release); unsubscribe(); };
      subscriptions.add(release);
      return release;
    },
    snapshot() {
      assertLive();
      const snapshot = adapter.snapshot();
      const values = snapshot && snapshot.data ? snapshot.data : snapshot;
      return Object.fromEntries(Object.entries(values || {}).filter(([key]) => key.startsWith(prefix)).map(([key, value]) => [key.slice(prefix.length), value]));
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const release of Array.from(subscriptions)) release();
      signal?.removeEventListener('abort', port.dispose);
      // The store and its values belong to the host. Never clear or dispose them.
    }
  });
  signal?.addEventListener('abort', port.dispose, { once: true });
  if (signal?.aborted) port.dispose();
  return port;
}

// Capture every DOM write so cleanup restores only values still owned by this
// lease. A concurrent host write wins; borrowed managers are never disposed.
function scopedThemeEnvironment(root, owner, ports, signal) {
  const doc = root.ownerDocument;
  if (!doc || typeof root.setAttribute !== 'function') throw new TypeError('Theme requires an owned Element root');
  const attributes = new Map();
  const properties = new Map();
  const nodes = new Set();
  const scopeValue = `native-${encodeURIComponent(owner)}`;
  const scopeSelector = `[data-xtend-theme-scope="${scopeValue.replace(/"/g, '\\"')}"]`;
  const recordAttr = (name, value) => {
    if (!attributes.has(name)) attributes.set(name, { before: root.getAttribute(name), after: null });
    root.setAttribute(name, value); attributes.get(name).after = String(value);
  };
  const style = new Proxy(root.style, { get(target, key) {
    if (key === 'setProperty' || key === 'removeProperty') return (name, value, priority) => {
      if (!properties.has(name)) properties.set(name, { before: target.getPropertyValue(name), priority: target.getPropertyPriority(name), after: '' });
      const result = key === 'setProperty' ? target.setProperty(name, value, priority) : target.removeProperty(name);
      properties.get(name).after = target.getPropertyValue(name); return result;
    };
    const value = Reflect.get(target, key, target); return typeof value === 'function' ? value.bind(target) : value;
  }, set(target, key, value) {
    if (key === 'colorScheme') { style.setProperty('color-scheme', value); return true; }
    return Reflect.set(target, key, value, target);
  } });
  const target = { style, setAttribute: recordAttr, getAttribute: root.getAttribute.bind(root), appendChild: root.appendChild.bind(root) };
  const append = { appendChild(node) { nodes.add(node); return root.appendChild(node); } };
  const facade = {
    documentElement: target, head: append, body: append,
    getElementById() { return null; }, // Never borrow another app's style or announcer.
    createElement(tag) {
      const node = doc.createElement(tag);
      if (tag === 'style') {
        const descriptor = Object.getOwnPropertyDescriptor(doc.defaultView.Node.prototype, 'textContent');
        Object.defineProperty(node, 'textContent', {
          get() { return descriptor.get.call(node); },
          set(value) {
            const scoped = String(value).replace(/:root/g, scopeSelector)
              .replace(/(^|\n)(\s*)\*, \*::before, \*::after/g, `$1$2${scopeSelector} *, ${scopeSelector} *::before, ${scopeSelector} *::after`)
              .replace(/(^|\n)(\s*):focus-visible/g, `$1$2${scopeSelector} :focus-visible`);
            descriptor.set.call(node, scoped);
          }
        });
      }
      return node;
    },
    dispatchEvent: root.dispatchEvent.bind(root)
  };
  recordAttr('data-xtend-theme-scope', scopeValue);
  return {
    document: facade,
    window: { performance: doc.defaultView.performance, matchMedia: ports.matchMedia },
    storage: ports.storage || { getItem() { return null; }, setItem() {} },
    // Remote CSS is accepted only through a host port that already scopes it.
    fetch: async (url) => {
      if (typeof ports.loadCss !== 'function') throw new Error('Native theme CSS IO capability is missing');
      const css = await ports.loadCss(url, { root, owner, signal, scopeSelector });
      if (signal?.aborted) throw new Error('Native theme owner is disposed');
      if (typeof css !== 'string') throw new TypeError('Theme CSS port must return scoped CSS text');
      return { ok: true, text: async () => css };
    },
    getComputedStyle: () => doc.defaultView.getComputedStyle(root),
    release() {
      for (const node of nodes) if (node.parentNode === root) node.remove();
      for (const [name, entry] of attributes) if (root.getAttribute(name) === entry.after) {
        if (entry.before === null) root.removeAttribute(name); else root.setAttribute(name, entry.before);
      }
      for (const [name, entry] of properties) if (root.style.getPropertyValue(name) === entry.after) {
        if (entry.before) root.style.setProperty(name, entry.before, entry.priority); else root.style.removeProperty(name);
      }
    }
  };
}

export function createManagedNativeServices({ root, owner, ports = {}, signal } = {}) {
  const id = ownerId(owner);
  if (!root || typeof root.contains !== 'function') throw new TypeError('Native services require an owned root');
  if (signal?.aborted) throw new Error('Native service owner is disposed');
  const parentSignal = signal;
  const lifetime = new AbortController();
  const parentAbort = () => lifetime.abort(parentSignal.reason);
  parentSignal?.addEventListener('abort', parentAbort, { once: true });
  if (parentSignal?.aborted) parentAbort();
  signal = lifetime.signal;
  let disposed = false;
  const assertLive = () => { if (disposed || signal?.aborted) throw new Error('Native service owner is disposed'); };
  const owned = (element) => {
    assertLive();
    if (!element || (element !== root && !root.contains(element))) throw new Error('Native service target is outside its owner root');
    return element;
  };
  const state = createManagedStatePort({ owner: id, runtime: ports.state || xtendState, signal });
  const i18n = createXtendI18n({ managed: true, root, signal });
  const i18nState = i18n.connectState(state);
  let theme;
  let ownedTheme = false;
  const utils = Object.freeze({
    hexToRgb: XUtils.hexToRgb.bind(XUtils), contrastColor: XUtils.contrastColor.bind(XUtils),
    formatDate: XUtils.formatDate.bind(XUtils), formatNumber: XUtils.formatNumber.bind(XUtils),
    deepClone: XUtils.deepClone.bind(XUtils),
    setAria(element, attrs) { return XUtils.setAria(owned(element), attrs); },
    runUiTransition(input = {}) {
      const target = owned(input.target || input.element);
      if (typeof ports.transition !== 'function') throw new Error('Native transition capability is missing');
      return ports.transition({ ...input, target, signal });
    }
  });
  const services = Object.freeze({
    schema: NATIVE_SERVICES_SCHEMA, apiVersion: '1.0.0', owner: id, state, i18n, utils,
    get theme() {
      assertLive();
      if (!theme) {
        if (ports.theme) {
          if (!ports.theme.manager || (ports.theme.root !== root && !(ports.theme.global === true && ports.theme.root === root.ownerDocument.documentElement))) throw new Error('Borrowed Theme manager requires an explicit root or document scope lease');
          theme = ports.theme.manager;
        }
        else {
          const environment = scopedThemeEnvironment(root, id, ports.themeEnvironment || {}, signal);
          theme = createThemeManager({ ...environment, state, signal }); ownedTheme = true;
        }
      }
      return theme;
    },
    dispatch(capability, args, lease) {
      assertLive();
      const method = platformMethods[capability];
      if (!method || typeof ports.platform?.[method] !== 'function') throw new Error(`Native capability is missing: ${capability}`);
      if (!lease || ownerId(lease.owner) !== id || !lease.isCurrent?.() || lease.signal?.aborted) throw new Error('Native platform lease is stale or belongs to another owner');
      // Preparation runs before append. The trusted lease is the authority for a
      // detached element; once connected it must remain in this root.
      if (!lease.element || lease.element.ownerDocument !== root.ownerDocument || (lease.element.isConnected && lease.element !== root && !root.contains(lease.element))) throw new Error('Native platform target is outside its owner root');
      return ports.platform[method](args, lease);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      parentSignal?.removeEventListener('abort', parentAbort);
      signal?.removeEventListener('abort', services.dispose);
      lifetime.abort();
      i18nState.dispose(); i18n.dispose(); state.dispose();
      if (ownedTheme) theme.dispose();
      else if (theme) ports.theme.release?.();
    }
  });
  signal?.addEventListener('abort', services.dispose, { once: true });
  if (signal?.aborted) services.dispose();
  return services;
}
