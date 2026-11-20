/** Trusted native component bridge. Importing this module has no browser side effects. */
export const NATIVE_COMPONENT_CONTEXT = Symbol.for('xtend.native-component.managed.v2');
export const NATIVE_COMPONENT_CLASS = Symbol.for('xtend.native-component.class.v2');
const INSTALLED = Symbol('xtend.native-component.installed');
const local = new WeakMap();
const inherited = new WeakMap();
const detachedState = Object.freeze({
  get: () => undefined, set: () => undefined, remove: () => undefined,
  subscribe: () => () => {}, snapshot: () => Object.freeze({})
});
function releaseInherited(element) {
  const record = inherited.get(element);
  if (!record) return;
  for (const [cleanup, unregister] of [...record.cleanups]) { unregister(); cleanup(); }
  record.cleanups.clear();
}
export function getManagedContext(element) {
  const context = element && element[NATIVE_COMPONENT_CONTEXT];
  if (context && context.apiVersion === '2.0.0') {
    if (inherited.has(element)) { releaseInherited(element); inherited.delete(element); }
    return context;
  }
  const host = element?.getRootNode?.()?.host;
  if (!host) return inherited.get(element)?.context || null;
  const owner = getManagedContext(host);
  if (!owner) return inherited.get(element)?.context || null;
  if (inherited.get(element)?.ownerContext !== owner) {
    releaseInherited(element);
    const cleanups = new Map();
    const child = Object.freeze({ ...owner, tag: element.localName,
      isActive: () => owner.isActive() && element.isConnected && element.getRootNode()?.host === host,
      connect() {}, disconnect() {}, acceptsEvent: () => false, emit: () => false, registerCommand: () => () => {},
      onCleanup(cleanup) {
        const unregister = owner.onCleanup(cleanup); cleanups.set(cleanup, unregister);
        return () => { cleanups.delete(cleanup); unregister(); };
      }
    });
    inherited.set(element, { ownerContext: owner, context: child, cleanups });
  }
  return inherited.get(element).context;
}

export const managedContext = getManagedContext;
export const isManagedComponent = (element) => getManagedContext(element) !== null;
/** Managed components never read or write the Classic singleton. RMT owns business state. */
export function componentState(element, legacyState) {
  return isManagedComponent(element) ? detachedState : legacyState;
}
export function managedLocal(element) {
  if (!local.has(element)) local.set(element, { cleanups: [], connected: false, updating: 0 });
  return local.get(element);
}
export function emitManagedEvent(element, type, detail = {}) {
  const context = getManagedContext(element);
  if (!context || !(context.isActive ? context.isActive() : context.isCurrent()) || context.signal.aborted || context.isApplyingUpdate?.() || context.acceptsEvent && !context.acceptsEvent(type)) return false;
  return context.emit(type, { detail });
}
export function requestManaged(element, capability, args = {}) {
  const context = getManagedContext(element);
  if (!context || !(context.isActive ? context.isActive() : context.isCurrent()) || context.signal.aborted) {
    throw new Error(`Native component ${element.localName} has no active owner`);
  }
  return context.request(capability, args);
}
export function onManagedCleanup(element, cleanup) {
  let active = true, removeLifetime = null;
  const list = managedLocal(element).cleanups;
  const once = () => {
    if (!active) return;
    active = false;
    const index = list.indexOf(once); if (index >= 0) list.splice(index, 1);
    removeLifetime?.();
    cleanup();
  };
  list.push(once);
  removeLifetime = getManagedContext(element)?.onCleanup(once);
  return once;
}

/** Global Classic listeners become listeners on the captured component owner, never the document. */
export function componentListen(element, target, type, listener, options) {
  if (!isManagedComponent(element)) { target.addEventListener(type, listener, options); return () => target.removeEventListener(type, listener, options); }
  const context = getManagedContext(element);
  const scoped = target === element.ownerDocument || target === element.ownerDocument?.body || target === element.ownerDocument?.defaultView ? element : target;
  scoped.addEventListener(type, listener, options);
  const remove = () => scoped.removeEventListener(type, listener, options);
  const dispose = onManagedCleanup(element, remove);
  if (context.signal.aborted) dispose();
  return dispose;
}
export function cleanupManagedComponent(element) {
  const state = managedLocal(element);
  for (const cleanup of state.cleanups.splice(0).reverse()) cleanup();
  state.active = false;
  state.resources?.clear();
}
function canonicalDetail(value, seen = new Set()) {
  if (value === undefined) return null;
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof Event !== 'undefined' && value instanceof Event) return { type: value.type, key: value.key || '', button: value.button || 0, altKey: !!value.altKey, ctrlKey: !!value.ctrlKey, metaKey: !!value.metaKey, shiftKey: !!value.shiftKey };
  if (value instanceof Error) return { name: value.name, message: value.message };
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== 'object' || seen.has(value)) throw new TypeError('Native events require an acyclic JSON DTO');
  if (typeof value.nodeType === 'number') throw new TypeError('DOM nodes cannot cross the native event boundary');
  if (typeof File !== 'undefined' && value instanceof File) return { name: value.name, type: value.type, size: value.size, lastModified: value.lastModified };
  if (typeof FileList !== 'undefined' && value instanceof FileList) return Array.from(value, (file) => canonicalDetail(file, seen));
  seen.add(value);
  const result = Array.isArray(value) ? value.map((item) => canonicalDetail(item, seen)) : Object.fromEntries(Object.entries(value).map(([key, item]) => {
    if (['__proto__', 'constructor', 'prototype'].includes(key)) throw new TypeError('Reserved DTO key');
    return [key, canonicalDetail(item, seen)];
  }));
  seen.delete(value);
  return result;
}
const resourceAttributes = Object.freeze({
  'x-header': { src: 'resource.image' }, 'x-footer': { src: 'resource.image' },
  'x-lightbox': { src: 'resource.image' }, 'x-icon': { src: 'resource.icon' },
  'x-button': { icon: 'resource.icon' }
});
function admitResources(element, context) {
  const approved = managedLocal(element).resources || (managedLocal(element).resources = new Set());
  for (const [attribute, capability] of Object.entries(resourceAttributes[element.localName] || {})) {
    const value = element.getAttribute(attribute);
    if (!value || element.localName === 'x-button' && value.trim().startsWith('<svg')) continue;
    const key = `${capability}:${value}`; if (approved.has(key)) continue;
    const raw = value.replace(/^url\(\s*['"]?|['"]?\s*\)$/g, '');
    const protocol = new URL(raw, element.ownerDocument.baseURI).protocol;
    if (!['http:', 'https:', 'blob:'].includes(protocol)) throw new TypeError('Unsafe native resource URL');
    const result = context.request(capability, { url: raw, attribute });
    if (result && typeof result.then === 'function') throw new TypeError('Native resource admission must finish before browser URL assignment');
    if (result && typeof result.release === 'function') onManagedCleanup(element, () => result.release());
    approved.add(key);
  }
}
/** Install before registration, so CE reactions use the same reviewed class in both modes. */
export function markManagedComponentClass(ctor, tag, profile = {}) {
  if (Object.prototype.hasOwnProperty.call(ctor, INSTALLED)) return ctor;
  Object.defineProperty(ctor, NATIVE_COMPONENT_CLASS, { value: Object.freeze({ apiVersion: '2.0.0', tag, ...(profile.prepare ? { prepare: (element, context) => profile.prepare.call(element, context) } : {}) }) });
  Object.defineProperty(ctor, INSTALLED, { value: true });
  const prototype = ctor.prototype;
  const connected = prototype.connectedCallback;
  const disconnected = prototype.disconnectedCallback;
  const attributeChanged = prototype.attributeChangedCallback;
  const dispatch = prototype.dispatchEvent;
  prototype.dispatchEvent = function(event) {
    const context = getManagedContext(this);
    if (!context) return dispatch.call(this, event);
    if (event.type === 'xtend-command') return true;
    if (!(context.isActive ? context.isActive() : context.isCurrent()) || context.signal.aborted || managedLocal(this).updating || context.isApplyingUpdate?.()) return true;
    if (context.acceptsEvent && !context.acceptsEvent(event.type)) return true;
    // Browser input/click events stay local; only declared CustomEvent DTOs cross the boundary.
    if ('detail' in event && !(typeof event.detail === 'number')) {
      context.emit(event.type, { detail: canonicalDetail(event.detail) });
      return true;
    }
    return dispatch.call(this, event);
  };
  prototype.connectedCallback = function() {
    const context = getManagedContext(this);
    if (!context) return connected?.call(this);
    const state = managedLocal(this);
    if (!context.isCurrent() || context.signal.aborted) return;
    // A queued disconnected reaction after an in-owner DOM move retains the same lifetime.
    state.connected = true;
    if (!state.hooksInstalled) {
      state.hooksInstalled = true;
      const resume = () => {
        if (state.active || !state.connected || !context.isActive()) return;
        state.active = true;
        admitResources(this, context);
        state.updating++;
        try { for (const attribute of ctor.observedAttributes || []) { if (this.hasAttribute(attribute)) this.attributeChangedCallback(attribute, null, this.getAttribute(attribute)); } }
        finally { state.updating--; }
        for (const [name, command] of Object.entries(profile.commands || {})) {
          const release = context.registerCommand(name, (args) => command.call(this, args || {}, context));
          if (typeof release === 'function') onManagedCleanup(this, release);
        }
        const cleanup = profile.connect ? profile.connect.call(this, context) : connected?.call(this);
        if (typeof cleanup === 'function') onManagedCleanup(this, cleanup);
      };
      const suspend = () => {
        if (!state.active) return;
        try {
          if (profile.disconnect) profile.disconnect.call(this, context);
          else disconnected?.call(this);
        } finally { cleanupManagedComponent(this); }
      };
      const release = context.registerActivityHooks ? context.registerActivityHooks({ resume, suspend }) : null;
      if (release) context.onCleanup(release);
      context.onCleanup(() => { suspend(); cleanupManagedComponent(this); state.connected = false; });
      // Constructor-owned shadow controls must remain inert until owner admission.
      const guard = (event) => { if (!context.isActive()) { event.preventDefault(); event.stopImmediatePropagation(); } };
      const root = this.shadowRoot || this;
      for (const name of ['click','input','change','keydown','pointerdown','submit','reset']) root.addEventListener(name, guard, true);
      context.onCleanup(() => { for (const name of ['click','input','change','keydown','pointerdown','submit','reset']) root.removeEventListener(name, guard, true); });
      state.resume = resume; state.suspend = suspend;
    }
    context.connect();
    if (!context.registerActivityHooks) state.resume();
  };
  prototype.disconnectedCallback = function() {
    const context = getManagedContext(this);
    if (!context) return disconnected?.call(this);
    if (this.isConnected && context.isCurrent()) return;
    const state = managedLocal(this); state.connected = false;
    context.disconnect();
    state.suspend?.();
    if (!Object.hasOwn(this, NATIVE_COMPONENT_CONTEXT)) { releaseInherited(this); state.hooksInstalled = false; }
  };
  prototype.connectedMoveCallback = function() {
    const context = getManagedContext(this);
    if (context && context.isCurrent()) return;
    if (!context) { disconnected?.call(this); connected?.call(this); }
  };
  prototype.attributeChangedCallback = function(name, oldValue, newValue) {
    const context = getManagedContext(this);
    if (!context) return attributeChanged?.call(this, name, oldValue, newValue);
    if (!(context.isAlive ? context.isAlive() : context.isCurrent()) || context.signal.aborted || oldValue === newValue) return;
    if (!(context.isActive ? context.isActive() : context.isCurrent())) return;
    admitResources(this, context);
    const state = managedLocal(this);
    state.updating++;
    try { return profile.attribute ? profile.attribute.call(this, name, oldValue, newValue, context) : attributeChanged?.call(this, name, oldValue, newValue); }
    finally { state.updating--; }
  };
  for (const [name, implementation] of Object.entries(profile.methods || {})) {
    const original = prototype[name];
    prototype[name] = function(...args) {
      return isManagedComponent(this) ? implementation.call(this, ...args) : original?.apply(this, args);
    };
  }
  return ctor;
}
export function defineManagedComponent(tag, ctor, registry = globalThis.customElements) {
  if (!registry) throw new Error(`No CustomElementRegistry for ${tag}`);
  const existing = registry.get(tag);
  if (existing && existing !== ctor) throw new Error(`Incompatible existing custom element: ${tag}`);
  if (!existing) registry.define(tag, ctor);
  return ctor;
}
