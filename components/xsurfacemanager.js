import { xstate } from './xstate.js';
import './xsurfacemanager-controller.js';
import {
  OVERLAY_LIFECYCLE_EVENTS,
  SURFACE_OVERLAY_SELECTOR,
  applyOverlaySurfaceSnapshot,
  findSurfaceOverlayElement,
  isSurfaceOverlayElement,
  overlaySurfaceId,
  toOverlaySurfaceRecord
} from './xsurfaceoverlay-bridge.js';

const SURFACE_MANAGED_ELEMENT_SELECTOR = `x-surface-window, x-side-panel, x-surface-region, ${SURFACE_OVERLAY_SELECTOR}`;
const SURFACE_MANAGER_PERSISTENCE_SCHEMA = 'xtend.surface.manager-persistence.v1';
const SURFACE_PERSISTED_SNAPSHOT_SCHEMA = 'xtend.surface.persisted-snapshot.v1';
const SURFACE_PERSISTENCE_DIAGNOSTIC_SCHEMA = 'xtend.surface.persistence-diagnostic.v1';
const SURFACE_PERSISTENCE_VERSION = 1;
const SURFACE_LOADING_POLICY_SCHEMA = 'xtend.surface.loading-policy.v1';
const SURFACE_LOADING_REPORT_SCHEMA = 'xtend.surface.loading-report.v1';
const SURFACE_LOADING_DIAGNOSTIC_SCHEMA = 'xtend.surface.loading-diagnostic.v1';
const SURFACE_LOADING_POLICIES = Object.freeze(['eager', 'visible', 'open', 'idle', 'route']);
const SURFACE_ROUTE_LIFECYCLE_SCHEMA = 'xtend.surface.route-lifecycle.v1';
const SURFACE_ROUTE_LIFECYCLE_REPORT_SCHEMA = 'xtend.surface.route-lifecycle-report.v1';
const SURFACE_ROUTE_LIFECYCLE_DIAGNOSTIC_SCHEMA = 'xtend.surface.route-lifecycle-diagnostic.v1';
const SURFACE_ROUTE_LIFECYCLE_POLICIES = Object.freeze(['global', 'open-close', 'open-collapse', 'open-minimize', 'open-keep', 'hydrate-only', 'manual']);
const SURFACE_STACK_POLICY_SCHEMA = 'xtend.surface.stack-policy.v1';
const SURFACE_STACK_POLICY_REPORT_SCHEMA = 'xtend.surface.stack-policy-report.v1';
const SURFACE_STACK_POLICY_DIAGNOSTIC_SCHEMA = 'xtend.surface.stack-policy-diagnostic.v1';
const SURFACE_MODAL_POLICIES = Object.freeze(['topmost', 'none', 'all-modal', 'surface-modal']);
const SURFACE_LAYOUT_ENGINE_SCHEMA = 'xtend.surface.layout-engine.v1';
const SURFACE_LAYOUT_ENGINE_REPORT_SCHEMA = 'xtend.surface.layout-engine-report.v1';
const SURFACE_LAYOUT_ENGINE_DIAGNOSTIC_SCHEMA = 'xtend.surface.layout-engine-diagnostic.v1';
const SURFACE_LAYOUT_ENGINES = Object.freeze(['freeform', 'docked', 'split', 'tile', 'stacked']);
const SURFACE_LAYOUT_SURFACE_TYPES = Object.freeze(['window', 'side-panel', 'region']);
const SURFACE_LAYOUT_PLACEMENTS = Object.freeze(['left', 'right', 'top', 'bottom', 'inline', 'center']);
const SURFACE_REMOTE_POLICY_SCHEMA = 'xtend.surface.remote-policy-bridge.v1';
const SURFACE_REMOTE_POLICY_REPORT_SCHEMA = 'xtend.surface.remote-policy-report.v1';
const SURFACE_REMOTE_POLICY_DIAGNOSTIC_SCHEMA = 'xtend.surface.remote-policy-diagnostic.v1';
const SURFACE_REMOTE_TRUST_BOUNDARY = 'xtend.security.remote-surface.v1';
const SURFACE_REMOTE_POLICY_MODES = Object.freeze(['strict', 'audit', 'off']);
const SURFACE_REMOTE_INTEGRITY_ALGORITHMS = Object.freeze(['sha256', 'sha384', 'sha512']);
const SURFACE_REMOTE_ALLOWED_CAPABILITIES = Object.freeze(['surface.mount', 'surface.focus', 'surface.close', 'surface.snapshot', 'event.emit', 'event.consume']);
const SURFACE_REMOTE_DECISIONS = Object.freeze(['mounted', 'degraded', 'refused']);
const SURFACE_STACK_FOCUS_SELECTOR = [
  '[autofocus]',
  '[tabindex]:not([tabindex="-1"])',
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[part~="surface"]',
  '[role="dialog"]'
].join(', ');
const SURFACE_ROUTE_EVENT_NAMES = Object.freeze([
  'popstate',
  'hashchange',
  'route-changed',
  'routechange',
  'xrouter-after-navigate',
  'xtend-route-changed',
  'xtend-router:navigate',
  'xtend-router:after-navigate',
  'xrouter:navigate',
  'xrouter:route-change'
]);
const SURFACE_PERSISTENCE_MEMORY = globalThis.__XTendSurfaceManagerPersistenceMemory instanceof Map
  ? globalThis.__XTendSurfaceManagerPersistenceMemory
  : new Map();

globalThis.__XTendSurfaceManagerPersistenceMemory = SURFACE_PERSISTENCE_MEMORY;

function surfaceControllerApi() {
  return globalThis.XTendSurfaceController || null;
}

function fabricBridge() {
  const candidates = [
    globalThis.xtendFabric,
    globalThis.XTendFabricRuntime,
    globalThis.XTendFabric && globalThis.XTendFabric.runtime
  ];
  return candidates.find((candidate) => candidate && typeof candidate.emitDiagnostic === 'function') || null;
}

function composedSurfaceElements(slot) {
  return slot.assignedElements({ flatten: true })
    .flatMap((element) => {
      if (element.matches && element.matches(SURFACE_MANAGED_ELEMENT_SELECTOR)) return [element];
      return Array.from(element.querySelectorAll ? element.querySelectorAll(SURFACE_MANAGED_ELEMENT_SELECTOR) : []);
    });
}

function cssAttributeValue(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function surfaceElementSelector(surfaceId) {
  const id = cssAttributeValue(surfaceId);
  const overlayBySurfaceId = SURFACE_OVERLAY_SELECTOR
    .split(',')
    .map((selector) => `${selector.trim()}[surface-id="${id}"]`)
    .join(', ');
  const overlayById = SURFACE_OVERLAY_SELECTOR
    .split(',')
    .map((selector) => `${selector.trim()}[id="${id}"]`)
    .join(', ');
  return `x-surface-window[surface-id="${id}"], x-side-panel[surface-id="${id}"], x-surface-region[surface-id="${id}"], x-surface-region[id="${id}"], [data-rmt-surface="${id}"], ${overlayBySurfaceId}, ${overlayById}`;
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch (_error) {
    return null;
  }
}

function createMemoryStorageAdapter() {
  return {
    kind: 'memory',
    getItem(key) {
      return SURFACE_PERSISTENCE_MEMORY.has(key) ? SURFACE_PERSISTENCE_MEMORY.get(key) : null;
    },
    setItem(key, value) {
      SURFACE_PERSISTENCE_MEMORY.set(key, String(value));
    },
    removeItem(key) {
      SURFACE_PERSISTENCE_MEMORY.delete(key);
    }
  };
}

function createWebStorageAdapter(kind) {
  const storageName = kind === 'local' ? 'localStorage' : 'sessionStorage';
  const storage = globalThis && globalThis[storageName];
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') return null;
  return {
    kind,
    getItem(key) {
      return storage.getItem(key);
    },
    setItem(key, value) {
      storage.setItem(key, value);
    },
    removeItem(key) {
      storage.removeItem(key);
    }
  };
}

function normalizePersistenceMode(value, restoreKey) {
  const mode = String(value || '').trim();
  if (['none', 'memory', 'session', 'local'].includes(mode)) return mode;
  return restoreKey ? 'session' : 'none';
}

function normalizeSurfaceLoadingPolicy(value, fallback = 'open') {
  const policy = String(value || '').trim().toLowerCase();
  if (SURFACE_LOADING_POLICIES.includes(policy)) return policy;
  return SURFACE_LOADING_POLICIES.includes(fallback) ? fallback : 'open';
}

function normalizeSurfaceRouteLifecyclePolicy(value, fallback = 'open-close') {
  const policy = String(value || '').trim().toLowerCase();
  if (SURFACE_ROUTE_LIFECYCLE_POLICIES.includes(policy)) return policy;
  return SURFACE_ROUTE_LIFECYCLE_POLICIES.includes(fallback) ? fallback : 'open-close';
}

function normalizeSurfaceModalPolicy(value, fallback = 'topmost') {
  const policy = String(value || '').trim().toLowerCase();
  if (SURFACE_MODAL_POLICIES.includes(policy)) return policy;
  return SURFACE_MODAL_POLICIES.includes(fallback) ? fallback : 'topmost';
}

function normalizeSurfaceLayoutEngine(value, fallback = 'freeform') {
  const engine = String(value || '').trim().toLowerCase();
  if (SURFACE_LAYOUT_ENGINES.includes(engine)) return engine;
  return SURFACE_LAYOUT_ENGINES.includes(fallback) ? fallback : 'freeform';
}

function normalizeSurfaceLayoutPlacement(value, fallback = 'center') {
  const placement = String(value || '').trim().toLowerCase();
  if (SURFACE_LAYOUT_PLACEMENTS.includes(placement)) return placement;
  return SURFACE_LAYOUT_PLACEMENTS.includes(fallback) ? fallback : 'center';
}

function normalizeSurfaceLoadingTimeout(value) {
  const timeout = Number(value);
  if (Number.isFinite(timeout) && timeout >= 0) return timeout;
  return 4000;
}

function normalizeSurfaceLayoutNumber(value, fallback, minimum = 0) {
  const number = Number(value);
  if (Number.isFinite(number)) return Math.max(minimum, number);
  return fallback;
}

function isSurfaceRecordOpen(record = {}) {
  return record.status !== 'closed' && record.status !== 'minimized' && record.collapsed !== true;
}

function isSurfaceRecordHidden(record = {}) {
  return record.status === 'closed' || record.status === 'minimized' || record.minimized === true;
}

function isSurfaceRecordTrayEligible(record = {}) {
  if (!record || !record.id) return false;
  if (record.type === 'tooltip' || record.type === 'toast' || record.type === 'popover' || record.type === 'menu') return false;
  return Array.isArray(record.capabilities) && (
    record.capabilities.includes('open')
    || record.capabilities.includes('focus')
    || record.capabilities.includes('restore')
  );
}

function surfaceLoaderApi() {
  const loader = globalThis.XTendLoader || {};
  const skeleton = loader.skeletonLoader || globalThis.XTendSkeletonLoader || {};
  return {
    available: Boolean(globalThis.XTendLoader || globalThis.XTendSkeletonLoader),
    ensureRuntimeStyles: typeof loader.ensureRuntimeStyles === 'function' ? loader.ensureRuntimeStyles.bind(loader) : null,
    ensureComponent: typeof loader.ensureComponent === 'function' ? loader.ensureComponent.bind(loader) : null,
    hydrateTree: typeof loader.hydrateTree === 'function' ? loader.hydrateTree.bind(loader) : null,
    showSkeleton: typeof loader.showSkeleton === 'function'
      ? loader.showSkeleton.bind(loader)
      : (typeof skeleton.show === 'function' ? skeleton.show.bind(skeleton) : null),
    hideSkeleton: typeof loader.hideSkeleton === 'function'
      ? loader.hideSkeleton.bind(loader)
      : (typeof skeleton.hide === 'function' ? skeleton.hide.bind(skeleton) : null)
  };
}

function surfaceLoadingNow() {
  const performanceTarget = globalThis.performance;
  if (performanceTarget && typeof performanceTarget.now === 'function') return performanceTarget.now();
  return Date.now();
}

function collectSurfaceHydrationTags(root) {
  if (!root || typeof root.querySelectorAll !== 'function') return [];
  const tags = new Set();
  Array.from(root.querySelectorAll('*')).forEach((element) => {
    if (!element || element.hasAttribute('data-xtend-skeleton-loader')) return;
    const tag = String(element.localName || '').trim().toLowerCase();
    if (tag.includes('-')) tags.add(tag);
  });
  return Array.from(tags);
}

function scheduleSurfaceIdle(callback) {
  if (typeof globalThis.requestIdleCallback === 'function') {
    return globalThis.requestIdleCallback(callback, { timeout: 1000 });
  }
  return globalThis.setTimeout(callback, 120);
}

function clearSurfaceIdle(handle) {
  if (typeof globalThis.cancelIdleCallback === 'function') {
    globalThis.cancelIdleCallback(handle);
    return;
  }
  globalThis.clearTimeout(handle);
}

function normalizeSurfaceRouteToken(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const withoutHash = raw.replace(/^#\/?/, '/');
  const withoutQuery = withoutHash.split('?')[0].split('#')[0];
  return withoutQuery.replace(/^\/+/, '').replace(/\/+$/, '').trim().toLowerCase();
}

function surfaceRouteTokens(value) {
  const token = normalizeSurfaceRouteToken(value);
  if (!token) return [];
  return [token, `/${token}`];
}

function surfaceBooleanAttribute(element, names = []) {
  if (!element) return false;
  return names.some((name) => {
    if (!element.hasAttribute(name)) return false;
    const value = String(element.getAttribute(name) || '').trim().toLowerCase();
    return !['false', '0', 'no', 'off'].includes(value);
  });
}

function surfaceElementContainsTarget(element, target) {
  if (!element || !target) return false;
  if (element === target) return true;
  if (typeof element.contains === 'function' && element.contains(target)) return true;
  const root = typeof target.getRootNode === 'function' ? target.getRootNode() : null;
  if (root && root.host) {
    return root.host === element || (typeof element.contains === 'function' && element.contains(root.host));
  }
  return Boolean(element.shadowRoot && typeof element.shadowRoot.contains === 'function' && element.shadowRoot.contains(target));
}

function surfaceFocusableTarget(element) {
  if (!element) return null;
  const roots = [element.shadowRoot, element].filter(Boolean);
  for (const root of roots) {
    if (typeof root.querySelector !== 'function') continue;
    const target = root.querySelector(SURFACE_STACK_FOCUS_SELECTOR);
    if (target && typeof target.focus === 'function') return target;
  }
  return typeof element.focus === 'function' ? element : null;
}

function snapSurfaceLayoutValue(value, snap = 1) {
  const step = Math.max(1, Number(snap) || 1);
  return Math.round(Number(value || 0) / step) * step;
}

function surfaceLayoutBoundsEqual(left = {}, right = {}) {
  return ['x', 'y', 'width', 'height'].every((key) => Math.round(Number(left[key]) || 0) === Math.round(Number(right[key]) || 0));
}

function normalizeSurfaceRemotePolicyMode(value, fallback = 'strict') {
  const mode = String(value || '').trim().toLowerCase();
  if (SURFACE_REMOTE_POLICY_MODES.includes(mode)) return mode;
  return SURFACE_REMOTE_POLICY_MODES.includes(fallback) ? fallback : 'strict';
}

function normalizeSurfaceRemoteList(value) {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => normalizeSurfaceRemoteList(entry));
  }
  if (value && typeof value === 'object') {
    return normalizeSurfaceRemoteList(value.id || value.name || value.capability || value.event || value.ref || '');
  }
  return String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeSurfaceRemoteOwner(owner) {
  if (typeof owner === 'string') {
    return {
      kind: 'team',
      id: owner.trim(),
      known: Boolean(owner.trim())
    };
  }
  const source = owner && typeof owner === 'object' ? owner : {};
  const id = String(source.id || source.team || source.name || '').trim();
  return {
    kind: String(source.kind || source.type || 'team').trim() || 'team',
    id,
    known: Boolean(id || source.known === true)
  };
}

function normalizeSurfaceRemoteCapabilityIds(capabilities) {
  return normalizeSurfaceRemoteList(capabilities)
    .map((capability) => String(capability || '').trim())
    .filter(Boolean);
}

function normalizeSurfaceRemoteOrigin(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    const url = new URL(raw, globalThis.location && globalThis.location.href || 'https://xtend.local/');
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    return url.origin;
  } catch (_error) {
    return '';
  }
}

function surfaceRemoteRecordSource(input = {}) {
  if (!input || typeof input !== 'object') return {};
  const metadata = input.metadata && typeof input.metadata === 'object' ? input.metadata : {};
  const candidates = [
    input.remoteSurface,
    metadata.remoteSurface,
    input.remotePolicy && input.remotePolicy.remoteSurface,
    input.sourceSurface && input.sourceSurface.remoteSurface,
    input.sourceSurface && input.sourceSurface.metadata && input.sourceSurface.metadata.remoteSurface,
    input
  ];
  return candidates.find((candidate) => candidate && typeof candidate === 'object' && (
    candidate.schema === 'xtend.rmt.vnext-remote-surface.v1'
    || candidate.remote
    || candidate.security
    || candidate.adapterBoundary
    || candidate.manifestId
  )) || {};
}

function isSurfaceRemoteInput(input = {}) {
  const source = surfaceRemoteRecordSource(input);
  return Boolean(source && (
    source.schema === 'xtend.rmt.vnext-remote-surface.v1'
    || source.remote
    || source.security
    || source.adapterBoundary
    || source.kind === 'remote'
    || source.type === 'remote'
  ));
}

function normalizeSurfaceRemoteBinding(entry = {}) {
  if (typeof entry === 'string') {
    return { lane: '', target: entry.trim(), mode: 'mount' };
  }
  const source = entry && typeof entry === 'object' ? entry : {};
  const target = source.target && typeof source.target === 'object'
    ? source.target.ref
    : (source.target || source.shellTarget || source.slot || source.ref || '');
  return {
    lane: String(source.lane || '').trim(),
    target: String(target || '').trim(),
    mode: String(source.mode || 'mount').trim() || 'mount'
  };
}

function normalizeSurfaceRemoteEvent(entry = {}, direction = '') {
  const source = entry && typeof entry === 'object' ? entry : {};
  return {
    event: String(source.event || source.name || '').trim(),
    direction: String(source.direction || direction || '').trim(),
    owner: normalizeSurfaceRemoteOwner(source.owner || ''),
    version: String(source.version || '').trim(),
    payload: source.payload && typeof source.payload === 'object' ? { ...source.payload } : null,
    scopes: normalizeSurfaceRemoteList(source.scopes),
    lane: String(source.lane || '').trim()
  };
}

function normalizeSurfaceRemoteRecord(input = {}, options = {}) {
  const source = surfaceRemoteRecordSource(input);
  const remote = source.remote && typeof source.remote === 'object' ? source.remote : {};
  const security = source.security && typeof source.security === 'object' ? source.security : {};
  const runtime = source.runtime && typeof source.runtime === 'object' ? source.runtime : {};
  const adapterBoundary = source.adapterBoundary && typeof source.adapterBoundary === 'object' ? source.adapterBoundary : {};
  const fallback = source.fallback && typeof source.fallback === 'object'
    ? source.fallback
    : (input.fallback && typeof input.fallback === 'object' ? input.fallback : null);
  const id = String(source.surfaceId || source.id || input.surfaceId || input.id || source.name || '').trim();
  const bindings = (Array.isArray(source.shellBindings) ? source.shellBindings : (Array.isArray(source.exposes) ? source.exposes : []))
    .map(normalizeSurfaceRemoteBinding)
    .filter((binding) => binding.target);
  const emits = Array.isArray(source.events && source.events.emits)
    ? source.events.emits.map((event) => normalizeSurfaceRemoteEvent(event, 'outbound'))
    : [];
  const consumes = Array.isArray(source.events && source.events.consumes)
    ? source.events.consumes.map((event) => normalizeSurfaceRemoteEvent(event, 'inbound'))
    : [];
  return {
    schema: source.schema || 'xtend.rmt.vnext-remote-surface.v1',
    surfaceId: id,
    manifestId: String(source.manifestId || remote.manifestId || '').trim(),
    name: String(source.name || id || remote.id || '').trim(),
    type: String(source.surfaceType || source.type || input.type || 'window').trim() || 'window',
    manager: String(source.manager || input.manager || options.managerId || '').trim(),
    owner: normalizeSurfaceRemoteOwner(source.owner || input.owner || ''),
    remote: {
      id: String(remote.id || remote.remoteId || source.remoteId || '').trim(),
      origin: normalizeSurfaceRemoteOrigin(remote.origin || source.origin || ''),
      versionRange: String(remote.versionRange || remote.version || source.versionRange || source.version || '').trim(),
      integrity: remote.integrity && typeof remote.integrity === 'object' ? { ...remote.integrity } : null
    },
    security: {
      trustBoundary: String(security.trustBoundary || source.trustBoundary || '').trim(),
      capabilityMode: String(security.capabilityMode || 'deny-by-default').trim() || 'deny-by-default',
      sandboxRequired: security.sandboxRequired !== false,
      cspRequired: security.cspRequired !== false
    },
    adapterBoundary: {
      adapterId: String(adapterBoundary.adapterId || '').trim(),
      capabilities: normalizeSurfaceRemoteCapabilityIds(adapterBoundary.capabilities),
      hostOwned: adapterBoundary.hostOwned === true,
      runtimeLoader: adapterBoundary.runtimeLoader === true
    },
    capabilities: normalizeSurfaceRemoteCapabilityIds(source.capabilities || input.remoteCapabilities || []),
    shellBindings: bindings,
    fallback,
    runtime: {
      kernelRemoteExecution: runtime.kernelRemoteExecution === true,
      hostAdapterRequired: runtime.hostAdapterRequired !== false,
      networkRequiredByKernel: runtime.networkRequiredByKernel === true
    },
    events: {
      emits,
      consumes
    },
    status: String(source.status || input.status || 'ready').trim() || 'ready',
    sourceRecord: { ...source }
  };
}

function clonePersistedSurfaceRecord(record) {
  return {
    schema: record.schema,
    id: record.id,
    manager: record.manager,
    type: record.type,
    kind: record.kind || record.type,
    label: record.label,
    status: record.status,
    active: Boolean(record.active),
    minimized: Boolean(record.minimized),
    maximized: Boolean(record.maximized),
    pinned: Boolean(record.pinned),
    collapsed: Boolean(record.collapsed),
    modal: Boolean(record.modal),
    placement: record.placement || null,
    mode: record.mode || 'floating',
    zIndex: Number(record.zIndex) || 0,
    bounds: { ...(record.bounds || {}) },
    previousBounds: record.previousBounds ? { ...record.previousBounds } : null,
    capabilities: Array.isArray(record.capabilities) ? record.capabilities.slice() : [],
    persistence: { ...(record.persistence || {}) },
    contentRef: record.contentRef || null,
    stateKey: record.stateKey || '',
    metadataKeys: Array.isArray(record.metadataKeys) ? record.metadataKeys.slice() : [],
    lifecycle: { ...(record.lifecycle || {}) }
  };
}

function createPersistableSurfaceSnapshot(snapshot) {
  return {
    schema: 'xtend.surface.snapshot.v1',
    managerId: snapshot.managerId,
    stateKey: snapshot.stateKey,
    activeSurfaceId: snapshot.activeSurfaceId || null,
    version: Number(snapshot.version) || 0,
    surfaceCount: Number(snapshot.surfaceCount) || 0,
    openSurfaceCount: Number(snapshot.openSurfaceCount) || 0,
    surfaces: Array.isArray(snapshot.surfaces) ? snapshot.surfaces.map(clonePersistedSurfaceRecord) : [],
    stack: Array.isArray(snapshot.stack) ? snapshot.stack.slice() : [],
    diagnostics: [],
    updatedAt: snapshot.updatedAt || new Date().toISOString()
  };
}

function migratePersistedSnapshotEnvelope(value) {
  if (!value || typeof value !== 'object') return null;
  if (value.schema === 'xtend.surface.snapshot.v1') {
    return {
      schema: SURFACE_PERSISTED_SNAPSHOT_SCHEMA,
      version: 0,
      migratedFrom: 'xtend.surface.snapshot.v1',
      managerId: value.managerId,
      restoreKey: '',
      stateKey: value.stateKey,
      persistedAt: value.updatedAt || new Date().toISOString(),
      snapshot: value
    };
  }
  if (value.schema !== SURFACE_PERSISTED_SNAPSHOT_SCHEMA || !value.snapshot) return null;
  if (!Number.isFinite(Number(value.version))) {
    return { ...value, version: 1, migratedFrom: value.schema };
  }
  return value;
}

class XSurfaceManager extends HTMLElement {
  static get observedAttributes() {
    return [
      'layout',
      'restore-key',
      'route-aware',
      'modal-policy',
      'manager-id',
      'state-key',
      'persistence-mode',
      'restore-policy',
      'surface-loading-policy',
      'surface-skeleton',
      'surface-hydration-timeout',
      'route-lifecycle-policy',
      'layout-engine',
      'surface-layout-gap',
      'surface-layout-snap',
      'remote-surface-policy',
      'remote-origin-allowlist',
      'remote-capabilities'
    ];
  }

  static get xtendComponentContract() {
    return {
      schema: 'xtend.component.contract.v2',
      tag: 'x-surface-manager',
      maturity: 'experimental',
      source: {
        strategy: 'xtend.typescript.component-source-strategy.v1',
        state: 'ts-source',
        sourcePath: 'src/components/x-surface-manager/x-surface-manager.ts'
      },
      runtime: {
        format: 'esm',
        artifact: 'components/xsurfacemanager.js',
        declaration: 'components/xsurfacemanager.d.ts',
        localOnly: true,
        cdnAllowed: false
      },
      rmt: {
        adapter: 'xtend.component',
        surfaceContract: 'xtend.surface.manager.v1',
        overlayCompatibility: 'xtend.surface.overlay-stack-bridge.v1',
        kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
      },
      fabric: {
        api: '@xtend-fabric',
        defaultLane: 'visible',
        diagnosticsLane: 'diagnostics'
      }
    };
  }

  static get xtendRmtMetadata() {
    return {
      schema: 'xtend.rmt.component-contract.v1',
      adapter: 'xtend.component',
      tag: 'x-surface-manager',
      componentRecordKind: 'custom_element',
      templateMode: 'dom_descriptor',
      eventBindingMode: 'dom-event-to-rmt-command',
      schedules: [
        'surface.visible.render',
        'surface.user-blocking.open',
        'surface.user-blocking.close',
        'surface.transition.layout',
        'surface.diagnostics.snapshot',
        'surface.eager.hydrate',
        'surface.visible.hydrate',
        'surface.open.hydrate',
        'surface.idle.hydrate',
        'surface.route.hydrate',
        'surface.route.lifecycle',
        'surface.route.restore',
        'surface.route.cleanup',
        'surface.stack.policy',
        'surface.layout.engine',
        'surface.remote.policy',
        'surface.remote.degrade',
        'surface.remote.event-governance'
      ],
      hydration: { policy: 'visible', lane: 'visible' },
      surface: {
        schema: 'xtend.surface.manager.v1',
        controller: 'xtend.surface.controller.v1',
        overlayBridge: 'xtend.surface.overlay-stack-bridge.v1',
        snapshot: 'xtend.surface.snapshot.v1',
        persistence: SURFACE_MANAGER_PERSISTENCE_SCHEMA,
        loading: SURFACE_LOADING_POLICY_SCHEMA,
        routeLifecycle: SURFACE_ROUTE_LIFECYCLE_SCHEMA,
        stackPolicy: SURFACE_STACK_POLICY_SCHEMA,
        layoutEngine: SURFACE_LAYOUT_ENGINE_SCHEMA,
        remotePolicy: SURFACE_REMOTE_POLICY_SCHEMA,
        stateKey: 'xtend.surface.registry'
      },
      kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
    };
  }

  static get xtendComponentLifecycleTelemetry() {
    return {
      schema: 'xtend.component.lifecycle-telemetry.v1',
      componentRef: 'x-surface-manager',
      operations: ['mount', 'hydrate', 'render', 'update', 'event', 'unmount'],
      snapshotPath: 'snapshot.surfaceManager'
    };
  }

  static get xtendScaffoldA11yProfile() {
    return {
      schema: 'xtend.a11y.profile.v1',
      componentRef: 'x-surface-manager',
      role: 'application',
      accessibleName: 'required',
      keyboard: ['surface-focus', 'delegated-window-keys'],
      screenreader: {
        signalContract: XSurfaceManager.xtendScreenreaderSignals
      },
      motionContrast: {
        policy: XSurfaceManager.xtendMotionContrastPolicy
      }
    };
  }

  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: 'xtend.performance.component-profile.v1',
      componentRef: 'x-surface-manager',
      budgetClass: 'interactive-shell',
      lane: 'visible',
      hydrationPolicy: 'visible',
      criticalMeasurements: ['mount', 'register-surface', 'snapshot', 'surface-content-hydrate', 'surface-route-lifecycle', 'surface-stack-policy', 'surface-layout-engine', 'surface-remote-policy'],
      cleanup: ['slotchange', 'surface-window-command', 'surface-panel-command', 'surface-region-command', 'surface-overlay-command', 'route-lifecycle-listeners', 'stack-policy-listeners']
    };
  }

  static get xtendScreenreaderSignals() {
    return {
      schema: 'xtend.a11y.screenreader-signals.v1',
      componentRef: 'x-surface-manager',
      liveRegion: 'polite',
      signals: ['surface-opened', 'surface-closed', 'surface-focused', 'surface-layout-changed', 'surface-stack-policy-applied', 'surface-layout-engine-applied', 'remote-surface-degraded', 'remote-surface-refused'],
      statusRegions: ['role=status', 'aria-live=polite'],
      errorRegions: [],
      fabric: {
        lane: 'a11y',
        fiberKind: 'a11y.surface',
        scheduleRef: 'a11y.user-blocking.announce'
      }
    };
  }

  static get xtendMotionContrastPolicy() {
    return {
      schema: 'xtend.a11y.motion-contrast-policy.v1',
      componentRef: 'x-surface-manager',
      motion: {
        schema: 'xtend.a11y.motion-policy.v1',
        mediaQuery: '(prefers-reduced-motion: reduce)',
        reducedMotion: 'required',
        animationPolicy: 'delegated-surface-motion',
        noMotionOnlyState: true
      },
      contrast: {
        schema: 'xtend.a11y.contrast-policy.v1',
        mediaQuery: '(forced-colors: active)',
        highContrast: 'required',
        forcedColorAdjust: 'auto',
        focusVisible: 'required',
        nonColorStatus: 'required'
      }
    };
  }

  constructor() {
    super();
    this._controller = null;
    this._registeredElements = new Map();
    this._syncingOverlayElements = new WeakSet();
    this._restoringSnapshot = false;
    this._snapshotPersistenceSuspended = false;
    this._surfaceLoadingStates = new Map();
    this._surfaceLoadingPromises = new Map();
    this._surfaceRouteHydrationPending = new Set();
    this._surfaceIdleHandles = new Map();
    this._surfaceRouteLifecycleStates = new Map();
    this._currentSurfaceRoute = null;
    this._lastSurfaceRouteSignalKey = '';
    this._surfaceRouteListenersAttached = false;
    this._surfaceStackPolicyStates = new Map();
    this._surfaceFocusRestoreTargets = new Map();
    this._surfaceStackDocumentState = null;
    this._activeStackModalSurfaceId = null;
    this._stackPolicyListenersAttached = false;
    this._surfaceLayoutStates = new Map();
    this._surfaceLayoutApplying = false;
    this._lastSurfaceLayoutReport = null;
    this._surfaceRemotePolicyStates = new Map();
    this._lastSurfaceRemotePolicyReport = null;
    this._handleSlotChange = this._registerAssignedSurfaces.bind(this);
    this._handleSurfaceCommand = this._onSurfaceCommand.bind(this);
    this._handlePanelCommand = this._onSurfaceCommand.bind(this);
    this._handleRegionCommand = this._onSurfaceCommand.bind(this);
    this._handleOverlayCommand = this._onSurfaceCommand.bind(this);
    this._handleOverlayLifecycle = this._onOverlayLifecycle.bind(this);
    this._handleSurfaceRouteSignal = this._onSurfaceRouteSignal.bind(this);
    this._handleSurfaceStackKeyDown = this._onSurfaceStackKeyDown.bind(this);
    this._handleSurfaceStackFocusIn = this._onSurfaceStackFocusIn.bind(this);
    this._handleSurfaceTrayClick = this._onSurfaceTrayClick.bind(this);
    this._handleSurfaceTrayKeyDown = this._onSurfaceTrayKeyDown.bind(this);
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          min-height: var(--surface-manager-min-height, 480px);
          color: var(--surface-manager-color, var(--xtend-text, var(--text-color, #111827)));
          background: var(--surface-manager-bg, var(--xtend-surface-muted, var(--surface-muted, #f8fafc)));
          overflow: hidden;
          isolation: isolate;
        }
        .root {
          position: relative;
          min-height: inherit;
          width: 100%;
          height: 100%;
        }
        .workspace,
        .panels,
        .overlays {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .workspace ::slotted(*),
        .panels ::slotted(*),
        .overlays ::slotted(*) {
          pointer-events: auto;
        }
        .status {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
          clip-path: inset(50%);
          white-space: nowrap;
        }
        .surface-tray {
          position: absolute;
          inset-inline-start: 50%;
          inset-block-end: var(--surface-manager-tray-offset, 0.75rem);
          z-index: var(--surface-manager-tray-z, 100000);
          display: flex;
          align-items: center;
          justify-content: center;
          transform: translateX(-50%);
          pointer-events: auto;
        }
        .surface-tray[hidden] {
          display: none;
        }
        .surface-tray::before {
          content: "";
          position: absolute;
          inset-inline-start: 50%;
          inset-block-end: 100%;
          inline-size: var(--surface-manager-tray-hover-bridge-width, min(24rem, calc(100vw - 2rem)));
          block-size: var(--surface-manager-tray-hover-bridge-height, 0.75rem);
          transform: translateX(-50%);
          pointer-events: auto;
        }
        .surface-tray-button {
          box-sizing: border-box;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          min-block-size: 2.25rem;
          max-inline-size: min(22rem, calc(100vw - 2rem));
          padding: 0.375rem 0.625rem;
          border: 1px solid var(--surface-manager-tray-border, var(--xtend-border-color, var(--border-color, #94a3b8)));
          border-radius: var(--surface-manager-tray-radius, 8px);
          background: var(--surface-manager-tray-bg, color-mix(in srgb, var(--xtend-surface, #ffffff) 92%, transparent));
          color: var(--surface-manager-tray-color, var(--surface-manager-color, var(--xtend-text, var(--text-color, #111827))));
          box-shadow: var(--surface-manager-tray-shadow, 0 16px 36px rgba(15, 23, 42, 0.22));
          font: 600 0.8125rem/1.2 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          cursor: pointer;
          backdrop-filter: blur(12px);
        }
        .surface-tray-button:hover,
        .surface-tray-button:focus-visible {
          border-color: var(--surface-manager-tray-active-border, var(--xtend-color-primary, var(--primary-color, #2563eb)));
          outline: none;
        }
        .surface-tray-icon {
          inline-size: 0.75rem;
          block-size: 0.75rem;
          border: 2px solid currentColor;
          border-block-start-width: 0.125rem;
          border-radius: 3px;
          box-shadow: 0.25rem 0.25rem 0 -0.125rem currentColor;
          opacity: 0.9;
        }
        .surface-tray-count {
          display: inline-grid;
          min-inline-size: 1.375rem;
          block-size: 1.375rem;
          place-items: center;
          border-radius: 999px;
          background: var(--surface-manager-tray-count-bg, var(--xtend-color-primary, var(--primary-color, #2563eb)));
          color: var(--surface-manager-tray-count-color, #ffffff);
          font: 700 0.75rem/1 system-ui, sans-serif;
        }
        .surface-tray-popover {
          position: absolute;
          inset-inline-start: 50%;
          inset-block-end: calc(100% + 0.5rem);
          box-sizing: border-box;
          inline-size: max-content;
          min-inline-size: 15rem;
          max-inline-size: min(24rem, calc(100vw - 2rem));
          max-block-size: min(60vh, 24rem);
          overflow: auto;
          padding: 0.5rem;
          border: 1px solid var(--surface-manager-tray-border, var(--xtend-border-color, var(--border-color, #94a3b8)));
          border-radius: var(--surface-manager-tray-radius, 8px);
          background: var(--surface-manager-tray-popover-bg, var(--xtend-surface, var(--section-bg, #ffffff)));
          color: var(--surface-manager-tray-color, var(--surface-manager-color, var(--xtend-text, var(--text-color, #111827))));
          box-shadow: var(--surface-manager-tray-shadow, 0 16px 36px rgba(15, 23, 42, 0.22));
          opacity: 0;
          pointer-events: none;
          transform: translate(-50%, 0.25rem);
          transition: opacity 120ms ease, transform 120ms ease, visibility 120ms ease;
          visibility: hidden;
        }
        .surface-tray:hover .surface-tray-popover,
        .surface-tray:focus-within .surface-tray-popover {
          opacity: 1;
          pointer-events: auto;
          transform: translate(-50%, 0);
          visibility: visible;
        }
        .surface-tray-title {
          padding: 0.25rem 0.375rem 0.5rem;
          color: var(--surface-manager-tray-muted-color, var(--xtend-text-muted, var(--muted-color, #64748b)));
          font: 600 0.75rem/1.2 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          text-transform: uppercase;
        }
        .surface-tray-list {
          display: grid;
          gap: 0.25rem;
        }
        .surface-tray-surface {
          box-sizing: border-box;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 0.5rem;
          inline-size: 100%;
          padding: 0.5rem 0.625rem;
          border: 1px solid transparent;
          border-radius: 6px;
          background: transparent;
          color: inherit;
          font: 500 0.875rem/1.25 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          text-align: start;
          cursor: pointer;
        }
        .surface-tray-surface:hover,
        .surface-tray-surface:focus-visible {
          border-color: var(--surface-manager-tray-active-border, var(--xtend-color-primary, var(--primary-color, #2563eb)));
          background: var(--surface-manager-tray-hover-bg, color-mix(in srgb, var(--xtend-color-primary, var(--primary-color, #2563eb)) 12%, transparent));
          outline: none;
        }
        .surface-tray-surface[data-state="hidden"] {
          font-weight: 700;
        }
        .surface-tray-label {
          min-inline-size: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .surface-tray-state {
          color: var(--surface-manager-tray-muted-color, var(--xtend-text-muted, var(--muted-color, #64748b)));
          font-size: 0.75rem;
          text-transform: capitalize;
        }
        @media (forced-colors: active) {
          :host {
            background: Canvas;
            color: CanvasText;
          }
          .surface-tray-button,
          .surface-tray-popover,
          .surface-tray-surface:hover,
          .surface-tray-surface:focus-visible {
            background: Canvas;
            color: CanvasText;
            border-color: CanvasText;
            box-shadow: none;
          }
          .surface-tray-count {
            background: Highlight;
            color: HighlightText;
          }
        }
        @media (max-width: 640px) {
          .surface-tray {
            inset-block-end: var(--surface-manager-tray-compact-offset, 0.5rem);
          }
          .surface-tray-popover {
            min-inline-size: min(18rem, calc(100vw - 1rem));
          }
        }
      </style>
      <section class="root" part="root" role="application" aria-label="Surface workspace">
        <div class="workspace" part="workspace"><slot name="windows"></slot></div>
        <div class="panels" part="panels"><slot name="panels"></slot></div>
        <div class="overlays" part="overlays"><slot name="overlays"></slot></div>
        <slot></slot>
        <div class="surface-tray" part="surface-tray" data-surface-tray hidden>
          <button class="surface-tray-button" type="button" part="surface-tray-button" data-surface-tray-toggle aria-haspopup="listbox" aria-label="Surface tray">
            <span class="surface-tray-icon" aria-hidden="true"></span>
            <span data-surface-tray-label>Surfaces</span>
            <span class="surface-tray-count" data-surface-tray-count>0</span>
          </button>
          <div class="surface-tray-popover" part="surface-tray-popover">
            <div class="surface-tray-title" data-surface-tray-title>Surfaces</div>
            <div class="surface-tray-list" data-surface-tray-list role="listbox"></div>
          </div>
        </div>
        <span class="status" role="status" aria-live="polite"></span>
      </section>
    `;
    this._slots = Array.from(this.shadowRoot.querySelectorAll('slot'));
    this._status = this.shadowRoot.querySelector('.status');
    this._surfaceTray = this.shadowRoot.querySelector('[data-surface-tray]');
    this._surfaceTrayButton = this.shadowRoot.querySelector('[data-surface-tray-toggle]');
    this._surfaceTrayCount = this.shadowRoot.querySelector('[data-surface-tray-count]');
    this._surfaceTrayLabel = this.shadowRoot.querySelector('[data-surface-tray-label]');
    this._surfaceTrayTitle = this.shadowRoot.querySelector('[data-surface-tray-title]');
    this._surfaceTrayList = this.shadowRoot.querySelector('[data-surface-tray-list]');
  }

  connectedCallback() {
    this._ensureController();
    this._slots.forEach((slot) => slot.addEventListener('slotchange', this._handleSlotChange));
    if (this._surfaceTray) {
      this._surfaceTray.addEventListener('click', this._handleSurfaceTrayClick);
      this._surfaceTray.addEventListener('keydown', this._handleSurfaceTrayKeyDown);
    }
    this.addEventListener('surface-window-command', this._handleSurfaceCommand);
    this.addEventListener('surface-panel-command', this._handlePanelCommand);
    this.addEventListener('surface-region-command', this._handleRegionCommand);
    this.addEventListener('surface-overlay-command', this._handleOverlayCommand);
    this._addSurfaceRouteListeners();
    this._addSurfaceStackPolicyListeners();
    OVERLAY_LIFECYCLE_EVENTS.forEach((eventName) => {
      this.addEventListener(eventName, this._handleOverlayLifecycle);
    });
    this._snapshotPersistenceSuspended = true;
    this._registerAssignedSurfaces();
    const restoreResult = this.restorePersistedSnapshot({ source: 'connected' });
    this._snapshotPersistenceSuspended = false;
    let snapshot = this._applySnapshot();
    if (this._routeAware() && typeof xstate.get === 'function') {
      const routeState = xstate.get('xtend.router.current') || xstate.get('router-current');
      if (routeState) {
        const routeResult = this.applyRouteLifecycle(routeState, { source: 'connected', force: true });
        if (routeResult && routeResult.snapshot) snapshot = routeResult.snapshot;
      }
    }
    if (!restoreResult.restored) this.persistSnapshot(snapshot, { reason: 'initial-connect' });
    this._dispatchManagerEvent('surface-manager-ready', { result: restoreResult, snapshot });
  }

  disconnectedCallback() {
    this._slots.forEach((slot) => slot.removeEventListener('slotchange', this._handleSlotChange));
    if (this._surfaceTray) {
      this._surfaceTray.removeEventListener('click', this._handleSurfaceTrayClick);
      this._surfaceTray.removeEventListener('keydown', this._handleSurfaceTrayKeyDown);
    }
    this.removeEventListener('surface-window-command', this._handleSurfaceCommand);
    this.removeEventListener('surface-panel-command', this._handlePanelCommand);
    this.removeEventListener('surface-region-command', this._handleRegionCommand);
    this.removeEventListener('surface-overlay-command', this._handleOverlayCommand);
    this._removeSurfaceRouteListeners();
    this._removeSurfaceStackPolicyListeners();
    this._releaseSurfaceStackPolicy({ reason: 'disconnected' });
    this._surfaceIdleHandles.forEach((handle) => clearSurfaceIdle(handle));
    this._surfaceIdleHandles.clear();
    OVERLAY_LIFECYCLE_EVENTS.forEach((eventName) => {
      this.removeEventListener(eventName, this._handleOverlayLifecycle);
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue || !this.isConnected) return;
    if (name === 'manager-id' || name === 'state-key') {
      this._controller = null;
      this._registeredElements.clear();
      this._ensureController();
      this._registerAssignedSurfaces();
      this.restorePersistedSnapshot({ source: 'manager-attribute-change' });
    }
    if (name === 'restore-key' || name === 'persistence-mode' || name === 'restore-policy') {
      this.restorePersistedSnapshot({ source: 'persistence-attribute-change' });
    }
    if (name === 'surface-loading-policy' || name === 'surface-skeleton' || name === 'surface-hydration-timeout' || name === 'route-lifecycle-policy' || name === 'route-aware' || name === 'modal-policy' || name === 'layout' || name === 'layout-engine' || name === 'surface-layout-gap' || name === 'surface-layout-snap' || name === 'remote-surface-policy' || name === 'remote-origin-allowlist' || name === 'remote-capabilities') {
      this._applySnapshot();
    }
  }

  get surfaces() {
    return this.snapshot().surfaces;
  }

  get activeSurfaceId() {
    return this.snapshot().activeSurfaceId;
  }

  get layoutSnapshot() {
    return this.snapshot();
  }

  get surfaceController() {
    return this._ensureController();
  }

  get persistenceSnapshot() {
    return this.snapshotPersistence();
  }

  get loadingSnapshot() {
    return this.snapshotSurfaceLoading();
  }

  get routeLifecycleSnapshot() {
    return this.snapshotRouteLifecycle();
  }

  get stackPolicySnapshot() {
    return this.snapshotStackPolicy();
  }

  get layoutEngineSnapshot() {
    return this.snapshotSurfaceLayout();
  }

  get remoteSurfacePolicySnapshot() {
    return this.snapshotRemoteSurfacePolicy();
  }

  _managerId() {
    return this.getAttribute('manager-id') || this.id || 'xtend.surface.manager';
  }

  _stateKey() {
    return this.getAttribute('state-key') || 'xtend.surface.registry';
  }

  _restoreKey() {
    return this.getAttribute('restore-key') || '';
  }

  _persistenceMode() {
    return normalizePersistenceMode(this.getAttribute('persistence-mode'), this._restoreKey());
  }

  _restorePolicy() {
    const policy = String(this.getAttribute('restore-policy') || '').trim();
    return ['auto', 'manual', 'reset'].includes(policy) ? policy : 'auto';
  }

  _surfaceLoadingPolicy() {
    return normalizeSurfaceLoadingPolicy(this.getAttribute('surface-loading-policy'), 'open');
  }

  _surfaceHydrationTimeout() {
    return normalizeSurfaceLoadingTimeout(this.getAttribute('surface-hydration-timeout'));
  }

  _routeAware() {
    if (!this.hasAttribute('route-aware')) return false;
    const value = String(this.getAttribute('route-aware') || 'true').trim().toLowerCase();
    return !['false', '0', 'no', 'off'].includes(value);
  }

  _routeLifecyclePolicy() {
    return normalizeSurfaceRouteLifecyclePolicy(this.getAttribute('route-lifecycle-policy'), 'open-close');
  }

  _modalPolicy() {
    return normalizeSurfaceModalPolicy(this.getAttribute('modal-policy'), 'topmost');
  }

  _layoutEngine() {
    return normalizeSurfaceLayoutEngine(this.getAttribute('layout-engine') || this.getAttribute('layout'), 'freeform');
  }

  _layoutGap() {
    return normalizeSurfaceLayoutNumber(this.getAttribute('surface-layout-gap'), 12, 0);
  }

  _layoutSnap() {
    return normalizeSurfaceLayoutNumber(this.getAttribute('surface-layout-snap'), 8, 1);
  }

  _remoteSurfacePolicyMode() {
    return normalizeSurfaceRemotePolicyMode(this.getAttribute('remote-surface-policy'), 'strict');
  }

  _remoteAllowedOrigins() {
    return normalizeSurfaceRemoteList(
      this.getAttribute('remote-origin-allowlist')
      || this.getAttribute('remote-allowed-origins')
      || ''
    ).map(normalizeSurfaceRemoteOrigin).filter(Boolean);
  }

  _remoteAllowedCapabilities() {
    const configured = normalizeSurfaceRemoteList(this.getAttribute('remote-capabilities'));
    return configured.length > 0 ? configured : SURFACE_REMOTE_ALLOWED_CAPABILITIES.slice();
  }

  _surfaceSkeletonEnabled(element) {
    const value = String(
      element && (
        element.getAttribute('data-surface-skeleton')
        || element.getAttribute('data-xtend-surface-skeleton')
      )
      || this.getAttribute('surface-skeleton')
      || 'true'
    ).trim().toLowerCase();
    return !['false', 'off', 'none', '0'].includes(value);
  }

  _persistenceStorageKey() {
    const restoreKey = this._restoreKey();
    if (!restoreKey) return '';
    return `${SURFACE_PERSISTED_SNAPSHOT_SCHEMA}:${this._managerId()}:${restoreKey}`;
  }

  _persistenceAdapter() {
    const mode = this._persistenceMode();
    if (mode === 'none') return null;
    if (mode === 'memory') return createMemoryStorageAdapter();
    return createWebStorageAdapter(mode);
  }

  _createPersistenceDiagnostic(code, message, severity = 'info', detail = {}) {
    return {
      schema: SURFACE_PERSISTENCE_DIAGNOSTIC_SCHEMA,
      code,
      severity,
      managerId: this._managerId(),
      restoreKey: this._restoreKey(),
      mode: this._persistenceMode(),
      message,
      timestamp: new Date().toISOString(),
      detail
    };
  }

  _dispatchPersistenceEvent(type, result) {
    this.dispatchEvent(new CustomEvent(type, {
      bubbles: true,
      composed: true,
      detail: {
        managerId: this._managerId(),
        persistence: this.snapshotPersistence({ includeStoredState: false }),
        result,
        snapshot: result && result.snapshot || this.snapshot()
      }
    }));
  }

  _addSurfaceRouteListeners() {
    if (this._surfaceRouteListenersAttached) return;
    SURFACE_ROUTE_EVENT_NAMES.forEach((eventName) => {
      if (typeof globalThis.addEventListener === 'function') {
        globalThis.addEventListener(eventName, this._handleSurfaceRouteSignal);
      }
      if (globalThis.document && typeof globalThis.document.addEventListener === 'function') {
        globalThis.document.addEventListener(eventName, this._handleSurfaceRouteSignal);
      }
    });
    this._surfaceRouteListenersAttached = true;
  }

  _removeSurfaceRouteListeners() {
    if (!this._surfaceRouteListenersAttached) return;
    SURFACE_ROUTE_EVENT_NAMES.forEach((eventName) => {
      if (typeof globalThis.removeEventListener === 'function') {
        globalThis.removeEventListener(eventName, this._handleSurfaceRouteSignal);
      }
      if (globalThis.document && typeof globalThis.document.removeEventListener === 'function') {
        globalThis.document.removeEventListener(eventName, this._handleSurfaceRouteSignal);
      }
    });
    this._surfaceRouteListenersAttached = false;
  }

  _addSurfaceStackPolicyListeners() {
    if (this._stackPolicyListenersAttached || !globalThis.document) return;
    if (typeof globalThis.document.addEventListener === 'function') {
      globalThis.document.addEventListener('keydown', this._handleSurfaceStackKeyDown, true);
      globalThis.document.addEventListener('focusin', this._handleSurfaceStackFocusIn, true);
    }
    this._stackPolicyListenersAttached = true;
  }

  _removeSurfaceStackPolicyListeners() {
    if (!this._stackPolicyListenersAttached || !globalThis.document) return;
    if (typeof globalThis.document.removeEventListener === 'function') {
      globalThis.document.removeEventListener('keydown', this._handleSurfaceStackKeyDown, true);
      globalThis.document.removeEventListener('focusin', this._handleSurfaceStackFocusIn, true);
    }
    this._stackPolicyListenersAttached = false;
  }

  _createSurfaceLoadingDiagnostic(code, message, severity = 'info', detail = {}) {
    return {
      schema: SURFACE_LOADING_DIAGNOSTIC_SCHEMA,
      code,
      severity,
      managerId: this._managerId(),
      policy: this._surfaceLoadingPolicy(),
      timeoutMs: this._surfaceHydrationTimeout(),
      message,
      timestamp: new Date().toISOString(),
      detail
    };
  }

  _createSurfaceRouteLifecycleDiagnostic(code, message, severity = 'info', detail = {}) {
    return {
      schema: SURFACE_ROUTE_LIFECYCLE_DIAGNOSTIC_SCHEMA,
      code,
      severity,
      managerId: this._managerId(),
      routeAware: this._routeAware(),
      policy: this._routeLifecyclePolicy(),
      message,
      timestamp: new Date().toISOString(),
      detail
    };
  }

  _createSurfaceStackPolicyDiagnostic(code, message, severity = 'info', detail = {}) {
    return {
      schema: SURFACE_STACK_POLICY_DIAGNOSTIC_SCHEMA,
      code,
      severity,
      managerId: this._managerId(),
      modalPolicy: this._modalPolicy(),
      message,
      timestamp: new Date().toISOString(),
      detail
    };
  }

  _createSurfaceLayoutEngineDiagnostic(code, message, severity = 'info', detail = {}) {
    return {
      schema: SURFACE_LAYOUT_ENGINE_DIAGNOSTIC_SCHEMA,
      code,
      severity,
      managerId: this._managerId(),
      engine: this._layoutEngine(),
      message,
      timestamp: new Date().toISOString(),
      detail
    };
  }

  _createSurfaceRemotePolicyDiagnostic(code, message, severity = 'info', detail = {}) {
    return {
      schema: SURFACE_REMOTE_POLICY_DIAGNOSTIC_SCHEMA,
      code,
      severity,
      managerId: this._managerId(),
      policy: this._remoteSurfacePolicyMode(),
      trustBoundary: SURFACE_REMOTE_TRUST_BOUNDARY,
      message,
      timestamp: new Date().toISOString(),
      detail
    };
  }

  _dispatchSurfaceLoadingEvent(type, result) {
    this.dispatchEvent(new CustomEvent(type, {
      bubbles: true,
      composed: true,
      detail: {
        managerId: this._managerId(),
        result,
        loading: this.snapshotSurfaceLoading(),
        snapshot: this.snapshot()
      }
    }));
  }

  _dispatchSurfaceStackPolicyEvent(type, result) {
    this.dispatchEvent(new CustomEvent(type, {
      bubbles: true,
      composed: true,
      detail: {
        managerId: this._managerId(),
        result,
        stackPolicy: this.snapshotStackPolicy(),
        snapshot: result && result.snapshot || this.snapshot()
      }
    }));
  }

  _dispatchSurfaceLayoutEngineEvent(type, result) {
    this.dispatchEvent(new CustomEvent(type, {
      bubbles: true,
      composed: true,
      detail: {
        managerId: this._managerId(),
        result,
        layout: this.snapshotSurfaceLayout(),
        snapshot: result && result.snapshot || this.snapshot()
      }
    }));
  }

  _dispatchSurfaceRemotePolicyEvent(type, result) {
    this.dispatchEvent(new CustomEvent(type, {
      bubbles: true,
      composed: true,
      detail: {
        managerId: this._managerId(),
        result,
        remotePolicy: this.snapshotRemoteSurfacePolicy(),
        snapshot: result && result.snapshot || this.snapshot()
      }
    }));
  }

  _dispatchSurfaceRouteLifecycleEvent(type, result) {
    this.dispatchEvent(new CustomEvent(type, {
      bubbles: true,
      composed: true,
      detail: {
        managerId: this._managerId(),
        result,
        routeLifecycle: this.snapshotRouteLifecycle(),
        snapshot: this.snapshot()
      }
    }));
  }

  _createPersistedEnvelope(snapshot, reason = 'snapshot') {
    return {
      schema: SURFACE_PERSISTED_SNAPSHOT_SCHEMA,
      version: SURFACE_PERSISTENCE_VERSION,
      managerId: this._managerId(),
      restoreKey: this._restoreKey(),
      stateKey: this._stateKey(),
      mode: this._persistenceMode(),
      reason,
      persistedAt: new Date().toISOString(),
      snapshot: createPersistableSurfaceSnapshot(snapshot)
    };
  }

  _validatePersistedEnvelope(envelope) {
    const migrated = migratePersistedSnapshotEnvelope(envelope);
    if (!migrated) {
      return {
        ok: false,
        diagnostic: this._createPersistenceDiagnostic('xtend.surface.persistence.invalid-snapshot', 'Persisted surface snapshot envelope is invalid.', 'warning')
      };
    }
    if (migrated.version > SURFACE_PERSISTENCE_VERSION) {
      return {
        ok: false,
        diagnostic: this._createPersistenceDiagnostic('xtend.surface.persistence.unsupported-version', 'Persisted surface snapshot version is newer than this runtime.', 'warning', {
          expectedVersion: SURFACE_PERSISTENCE_VERSION,
          actualVersion: migrated.version
        })
      };
    }
    if (migrated.managerId && migrated.managerId !== this._managerId()) {
      return {
        ok: false,
        diagnostic: this._createPersistenceDiagnostic('xtend.surface.persistence.manager-mismatch', 'Persisted surface snapshot belongs to another manager.', 'warning', {
          expectedManager: this._managerId(),
          actualManager: migrated.managerId
        })
      };
    }
    if (migrated.restoreKey && migrated.restoreKey !== this._restoreKey()) {
      return {
        ok: false,
        diagnostic: this._createPersistenceDiagnostic('xtend.surface.persistence.restore-key-mismatch', 'Persisted surface snapshot belongs to another restore-key.', 'warning', {
          expectedRestoreKey: this._restoreKey(),
          actualRestoreKey: migrated.restoreKey
        })
      };
    }
    if (!migrated.snapshot || migrated.snapshot.schema !== 'xtend.surface.snapshot.v1' || !Array.isArray(migrated.snapshot.surfaces)) {
      return {
        ok: false,
        diagnostic: this._createPersistenceDiagnostic('xtend.surface.persistence.invalid-snapshot', 'Persisted surface snapshot payload is invalid.', 'warning')
      };
    }
    return { ok: true, envelope: migrated, diagnostic: null };
  }

  _readPersistedEnvelope() {
    const mode = this._persistenceMode();
    const key = this._persistenceStorageKey();
    if (mode === 'none' || !key) {
      return {
        ok: false,
        skipped: true,
        diagnostic: this._createPersistenceDiagnostic('xtend.surface.persistence.disabled', 'Surface persistence is disabled.', 'info')
      };
    }
    const adapter = this._persistenceAdapter();
    if (!adapter) {
      return {
        ok: false,
        skipped: true,
        diagnostic: this._createPersistenceDiagnostic('xtend.surface.persistence.storage-unavailable', 'Surface persistence storage is unavailable.', 'warning', { mode })
      };
    }
    try {
      const raw = adapter.getItem(key);
      if (!raw) {
        return {
          ok: false,
          skipped: true,
          diagnostic: this._createPersistenceDiagnostic('xtend.surface.persistence.empty', 'No persisted surface snapshot exists.', 'info', { key })
        };
      }
      const parsed = safeJsonParse(raw);
      const validation = this._validatePersistedEnvelope(parsed);
      return validation.ok
        ? { ok: true, envelope: validation.envelope, diagnostic: null }
        : { ok: false, skipped: true, diagnostic: validation.diagnostic };
    } catch (error) {
      return {
        ok: false,
        skipped: true,
        diagnostic: this._createPersistenceDiagnostic('xtend.surface.persistence.read-failed', 'Persisted surface snapshot could not be read.', 'warning', {
          key,
          error: error && error.message || String(error)
        })
      };
    }
  }

  _ensureController() {
    if (this._controller) return this._controller;
    const api = surfaceControllerApi();
    if (!api || typeof api.createSurfaceController !== 'function') {
      throw new Error('x-surface-manager requires components/xsurfacemanager-controller.js');
    }
    this._controller = api.createSurfaceController({
      managerId: this._managerId(),
      stateKey: this._stateKey(),
      xstate,
      fabric: fabricBridge()
    });
    return this._controller;
  }

  _resolveSurfaceElement(surfaceRef) {
    if (surfaceRef instanceof HTMLElement) return surfaceRef;
    const surfaceId = typeof surfaceRef === 'string'
      ? surfaceRef
      : (surfaceRef && (surfaceRef.id || surfaceRef.surfaceId));
    if (!surfaceId) return null;
    return this._registeredElements.get(surfaceId) || this.querySelector(surfaceElementSelector(surfaceId));
  }

  _resolveSurfaceRecord(surfaceRef, element = null) {
    if (surfaceRef && typeof surfaceRef === 'object' && !(surfaceRef instanceof HTMLElement) && surfaceRef.id) {
      return surfaceRef;
    }
    const surfaceId = typeof surfaceRef === 'string'
      ? surfaceRef
      : (element && (element.getAttribute('surface-id') || element.id));
    if (!surfaceId) return null;
    return this.snapshot().surfaces.find((record) => record.id === surfaceId) || null;
  }

  _resolveSurfaceLoadingPolicy(element, record = {}) {
    const policy = element && (
      element.getAttribute('data-surface-hydration-policy')
      || element.getAttribute('data-xtend-surface-loading-policy')
      || element.getAttribute('hydration-policy')
    );
    if (policy) return normalizeSurfaceLoadingPolicy(policy, this._surfaceLoadingPolicy());
    const content = element && typeof element.querySelector === 'function'
      ? element.querySelector('[data-surface-hydration-policy], [data-xtend-surface-loading-policy], [hydration-policy]')
      : null;
    if (content) {
      return normalizeSurfaceLoadingPolicy(
        content.getAttribute('data-surface-hydration-policy')
          || content.getAttribute('data-xtend-surface-loading-policy')
          || content.getAttribute('hydration-policy'),
        this._surfaceLoadingPolicy()
      );
    }
    const recordPolicy = record && record.lifecycle && record.lifecycle.hydrationPolicy
      || record && record.persistence && record.persistence.hydrationPolicy
      || record && record.hydrationPolicy;
    return normalizeSurfaceLoadingPolicy(recordPolicy, this._surfaceLoadingPolicy());
  }

  _readSurfaceRouteContent(element) {
    if (!element || typeof element.querySelector !== 'function') return '';
    const content = element.querySelector('[data-surface-route], [data-rmt-route], [data-route-bound], [route-ref]');
    if (!content) return '';
    return content.getAttribute('data-surface-route')
      || content.getAttribute('data-rmt-route')
      || content.getAttribute('data-route-bound')
      || content.getAttribute('route-ref')
      || '';
  }

  _resolveSurfaceRouteConfig(element, record = {}) {
    const surfaceId = record.id || element && (element.getAttribute('surface-id') || element.id) || '';
    const routeRef = element && (
      element.getAttribute('data-surface-route')
      || element.getAttribute('data-rmt-route')
      || element.getAttribute('route-ref')
      || element.getAttribute('data-route-bound')
    )
      || this._readSurfaceRouteContent(element)
      || record.route
      || record.routeRef
      || record.lifecycle && (record.lifecycle.route || record.lifecycle.routeRef)
      || '';
    const routeScope = element && (
      element.getAttribute('data-surface-route-scope')
      || element.getAttribute('route-scope')
    )
      || record.routeScope
      || record.lifecycle && record.lifecycle.routeScope
      || '';
    const explicitGlobal = surfaceBooleanAttribute(element, [
      'data-surface-global',
      'data-surface-route-global',
      'data-surface-route-persistent'
    ]);
    const policyValue = element && (
      element.getAttribute('data-surface-route-policy')
      || element.getAttribute('route-policy')
    )
      || record.routePolicy
      || record.lifecycle && record.lifecycle.routePolicy
      || '';
    const policy = explicitGlobal || !routeRef
      ? 'global'
      : normalizeSurfaceRouteLifecyclePolicy(policyValue, this._routeLifecyclePolicy());
    const exact = surfaceBooleanAttribute(element, ['data-surface-route-exact', 'route-exact']);
    const normalizedRouteRef = normalizeSurfaceRouteToken(routeRef);
    const normalizedRouteScope = normalizeSurfaceRouteToken(routeScope);
    const existing = this._surfaceRouteLifecycleStates.get(surfaceId) || {};
    const config = {
      schema: SURFACE_ROUTE_LIFECYCLE_SCHEMA,
      surfaceId,
      routeRef: normalizedRouteRef,
      routeScope: normalizedRouteScope,
      policy,
      exact,
      global: policy === 'global',
      persistent: explicitGlobal || policy === 'global',
      matched: existing.matched === true,
      activeRoute: existing.activeRoute || null,
      lastAction: existing.lastAction || null,
      lastRoute: existing.lastRoute || null,
      diagnostic: existing.diagnostic || null
    };
    if (surfaceId) this._surfaceRouteLifecycleStates.set(surfaceId, config);
    return config;
  }

  _normalizeRouteLifecycleInput(input = null) {
    const detail = input && input.detail && typeof input.detail === 'object'
      ? input.detail
      : (input && typeof input === 'object' && !input.type ? input : {});
    const rawPath = typeof input === 'string'
      ? input
      : (detail.path || detail.route || detail.href || detail.to || detail.url || '');
    const fallbackPath = globalThis.location
      ? (globalThis.location.hash || globalThis.location.pathname || '')
      : '';
    const path = rawPath || fallbackPath;
    const routeId = detail.routeId || detail.id || detail.name || null;
    const metadata = detail.metadata && typeof detail.metadata === 'object' ? detail.metadata : {};
    const routeScope = metadata.surfaceScope || metadata.routeScope || detail.routeScope || detail.scope || null;
    const tokens = new Set([
      ...surfaceRouteTokens(path),
      ...surfaceRouteTokens(routeId),
      ...surfaceRouteTokens(detail.component),
      ...surfaceRouteTokens(routeScope),
      ...surfaceRouteTokens(metadata.id),
      ...surfaceRouteTokens(metadata.route),
      ...surfaceRouteTokens(metadata.surfaceRoute)
    ]);
    return {
      schema: SURFACE_ROUTE_LIFECYCLE_SCHEMA,
      source: input && input.type || detail.source || 'manual',
      path,
      routeId,
      component: detail.component || null,
      metadata,
      mode: detail.mode || null,
      normalizedPath: normalizeSurfaceRouteToken(path),
      routeScope: normalizeSurfaceRouteToken(routeScope),
      tokens: Array.from(tokens).filter(Boolean),
      timestamp: new Date().toISOString()
    };
  }

  _surfaceRouteMatches(config, route) {
    if (!config || config.global || !route) return false;
    const refs = [config.routeRef, config.routeScope].filter(Boolean);
    if (refs.length === 0) return false;
    const routeTokens = new Set(route.tokens || []);
    if (route.normalizedPath) routeTokens.add(route.normalizedPath);
    if (route.routeScope) routeTokens.add(route.routeScope);
    return refs.some((ref) => {
      if (ref === '*') return true;
      return Array.from(routeTokens).some((token) => (
        config.exact
          ? token === ref
          : token === ref || token.startsWith(`${ref}/`) || ref.startsWith(`${token}/`)
      ));
    });
  }

  _recordRouteLifecycleState(surfaceId, patch = {}) {
    const state = this._surfaceRouteLifecycleStates.get(surfaceId) || {
      schema: SURFACE_ROUTE_LIFECYCLE_SCHEMA,
      surfaceId,
      policy: 'global',
      routeRef: '',
      routeScope: '',
      global: true,
      matched: false
    };
    Object.assign(state, patch);
    this._surfaceRouteLifecycleStates.set(surfaceId, state);
    return state;
  }

  _ensureSurfaceLoadingState(surfaceId, element = null, record = null, policy = '') {
    const id = String(surfaceId || '').trim();
    if (!id) return null;
    const existing = this._surfaceLoadingStates.get(id) || {
      schema: SURFACE_LOADING_POLICY_SCHEMA,
      surfaceId: id,
      status: 'pending',
      policy: this._surfaceLoadingPolicy(),
      skeleton: false,
      hydrated: false,
      pendingRoute: false,
      tags: [],
      unresolvedTags: [],
      diagnostics: [],
      startedAt: null,
      hydratedAt: null,
      durationMs: 0
    };
    existing.policy = policy || existing.policy;
    existing.surfaceType = record && record.type || existing.surfaceType || null;
    existing.label = record && record.label || existing.label || id;
    existing.contentRef = record && record.contentRef || existing.contentRef || null;
    existing.elementTag = element && element.localName || existing.elementTag || null;
    this._surfaceLoadingStates.set(id, existing);
    return existing;
  }

  _showSurfaceSkeleton(element, record = {}, options = {}) {
    if (!element || !this._surfaceSkeletonEnabled(element)) return null;
    const loader = surfaceLoaderApi();
    const policy = options.policy || this._resolveSurfaceLoadingPolicy(element, record);
    const surfaceId = record.id || element.getAttribute('surface-id') || element.id;
    const state = this._ensureSurfaceLoadingState(surfaceId, element, record, policy);
    const schedule = `surface.${policy}.hydrate`;
    const minHeight = element.getAttribute('data-surface-skeleton-min-height')
      || element.getAttribute('initial-height')
      || (record.bounds && record.bounds.height ? `${record.bounds.height}px` : '')
      || (record.type === 'side-panel' ? '16rem' : '14rem');

    if (loader.ensureRuntimeStyles) loader.ensureRuntimeStyles({ source: 'x-surface-manager.surface-loading' });

    if (!loader.showSkeleton) {
      const diagnostic = this._createSurfaceLoadingDiagnostic(
        'xtend.surface.loading.skeleton-loader-missing',
        'XTend SkeletonLoader is unavailable; surface content hydration is left to the host.',
        'warning',
        { surfaceId, policy }
      );
      if (state) state.diagnostics.push(diagnostic);
      return null;
    }

    element.setAttribute('data-xtend-surface-content-ready', 'false');
    element.setAttribute('data-xtend-surface-loading-policy', policy);
    element.setAttribute('data-xtend-surface-loading-schema', SURFACE_LOADING_POLICY_SCHEMA);
    element.setAttribute('aria-busy', 'true');

    const skeleton = loader.showSkeleton(element, {
      source: 'x-surface-manager',
      schedule,
      label: `${record.label || surfaceId || 'Surface'} wird geladen`,
      minHeight,
      lines: record.type === 'side-panel' ? 5 : 6,
      variant: element.getAttribute('data-surface-skeleton-variant') || this.getAttribute('surface-skeleton') || 'block'
    });
    element.setAttribute('data-xtend-surface-skeleton', 'active');
    if (state) {
      state.status = state.status === 'hydrated' ? 'hydrated' : 'skeleton';
      state.skeleton = Boolean(skeleton);
      state.schedule = schedule;
    }
    return skeleton;
  }

  _hideSurfaceSkeleton(element, options = {}) {
    if (!element) return 0;
    const loader = surfaceLoaderApi();
    const removed = loader.hideSkeleton ? loader.hideSkeleton(element, options) : 0;
    element.removeAttribute('data-xtend-surface-skeleton');
    element.removeAttribute('data-xtend-surface-loading-error');
    element.setAttribute('data-xtend-surface-content-ready', 'true');
    element.removeAttribute('aria-busy');
    return removed;
  }

  _isSurfaceVisible(element, record = {}) {
    if (!element || !isSurfaceRecordOpen(record)) return false;
    if (typeof element.getClientRects === 'function' && element.getClientRects().length > 0) return true;
    return element.hasAttribute('open') || element.getAttribute('data-xtend-surface-content-ready') === 'false';
  }

  _prepareSurfaceLoading(element, record = {}, options = {}) {
    if (!element || !record || !record.id || !this._surfaceSkeletonEnabled(element)) return null;
    const policy = this._resolveSurfaceLoadingPolicy(element, record);
    const state = this._ensureSurfaceLoadingState(record.id, element, record, policy);
    if (!state || state.hydrated === true || this._surfaceLoadingPromises.has(record.id)) return state;
    this._showSurfaceSkeleton(element, record, { policy, reason: options.reason || 'snapshot' });
    this._scheduleSurfaceHydration(element, record, policy, options);
    return state;
  }

  _scheduleSurfaceHydration(element, record = {}, policy = 'open', options = {}) {
    if (!record.id || !element) return null;
    const state = this._ensureSurfaceLoadingState(record.id, element, record, policy);
    if (!state || state.hydrated === true || this._surfaceLoadingPromises.has(record.id)) return state;

    const hydrate = (reason = `surface.${policy}.hydrate`) => {
      this.hydrateSurfaceContent(record.id, { ...options, policy, reason });
    };

    if (policy === 'eager') {
      hydrate('surface.eager.hydrate');
      return state;
    }

    if (policy === 'idle') {
      if (!this._surfaceIdleHandles.has(record.id)) {
        state.status = 'scheduled';
        const handle = scheduleSurfaceIdle(() => {
          this._surfaceIdleHandles.delete(record.id);
          hydrate('surface.idle.hydrate');
        });
        this._surfaceIdleHandles.set(record.id, handle);
      }
      return state;
    }

    if (policy === 'route') {
      state.status = 'scheduled';
      state.pendingRoute = true;
      this._surfaceRouteHydrationPending.add(record.id);
      return state;
    }

    if (policy === 'visible') {
      if (this._isSurfaceVisible(element, record)) {
        hydrate('surface.visible.hydrate');
      } else {
        state.status = 'scheduled';
      }
      return state;
    }

    if (isSurfaceRecordOpen(record)) {
      hydrate('surface.open.hydrate');
    } else {
      state.status = 'scheduled';
    }
    return state;
  }

  _registerAssignedSurfaces() {
    const surfaceElements = this._slots.flatMap((slot) => composedSurfaceElements(slot));
    surfaceElements.forEach((element) => this.registerSurface(element));
  }

  registerSurface(surface) {
    const controller = this._ensureController();
    const element = surface instanceof HTMLElement ? surface : null;
    let record = surface;
    if (element && isSurfaceOverlayElement(element)) {
      record = toOverlaySurfaceRecord(element, this._managerId());
    } else if (element && typeof element.toSurfaceRecord === 'function') {
      record = element.toSurfaceRecord(this._managerId());
    }
    if (!element && isSurfaceRemoteInput(record)) {
      return this.registerRemoteSurface(record, { source: 'registerSurface' });
    }
    const result = controller.registerSurface(record);

    let snapshot = null;
    if (element) {
      this._registeredElements.set(record.id, element);
      element.surfaceManager = this;
      this._prepareSurfaceLoading(element, record, { reason: 'registerSurface' });
      const replaced = Boolean(result && result.diagnostic && result.diagnostic.detail && result.diagnostic.detail.replaced);
      const defaultOpen = element.hasAttribute('open') && !element.hasAttribute('minimized') && !replaced;
      if (defaultOpen) {
        this.openSurface(record.id);
      } else {
        snapshot = this._applySnapshot();
      }
    } else {
      snapshot = this._applySnapshot();
    }

    if (snapshot) this.persistSnapshot(snapshot, { reason: 'registerSurface' });
    this._dispatchManagerEvent('surface-registered', { result, snapshot: snapshot || this.snapshot() });
    return result;
  }

  openSurface(id, input) {
    return this._commit('openSurface', 'surface-opened', id, input);
  }

  closeSurface(id, reason) {
    return this._commit('closeSurface', 'surface-closed', id, reason);
  }

  focusSurface(id) {
    return this._commit('focusSurface', 'surface-focused', id);
  }

  updateSurface(id, patch) {
    return this._commit('updateSurface', 'surface-updated', id, patch);
  }

  moveSurface(id, bounds) {
    return this._commit('moveSurface', 'surface-layout-changed', id, bounds);
  }

  resizeSurface(id, bounds) {
    return this._commit('resizeSurface', 'surface-layout-changed', id, bounds);
  }

  minimizeSurface(id) {
    return this._commit('minimizeSurface', 'surface-layout-changed', id);
  }

  maximizeSurface(id) {
    return this._commit('maximizeSurface', 'surface-layout-changed', id);
  }

  restoreSurface(id) {
    return this._commit('restoreSurface', 'surface-layout-changed', id);
  }

  materializeSurface(id, input) {
    return this._commit('materializeSurface', 'surface-materialized', id, input);
  }

  toggleSurface(id, input) {
    return this._commit('toggleSurface', 'surface-layout-changed', id, input);
  }

  pinSurface(id, pinned = true) {
    return this.updateSurface(id, { pinned: Boolean(pinned), mode: pinned ? 'pinned' : 'docked' });
  }

  collapseSurface(id) {
    return this.updateSurface(id, { collapsed: true, mode: 'collapsed' });
  }

  expandSurface(id, mode = 'docked') {
    return this.updateSurface(id, { collapsed: false, mode });
  }

  dockSurface(id, placement = 'right', mode = 'docked') {
    const result = this.updateSurface(id, { placement, mode, collapsed: false, pinned: mode === 'pinned' });
    if (result && result.ok !== false) {
      this.applyLayoutEngine(this._layoutEngine() === 'freeform' ? 'docked' : this._layoutEngine(), { source: 'dockSurface', surfaceId: id });
    }
    return result;
  }

  undockSurface(id, bounds = {}) {
    const fallbackBounds = bounds && typeof bounds === 'object' ? bounds : {};
    const result = this.updateSurface(id, {
      placement: '',
      mode: 'floating',
      collapsed: false,
      pinned: false,
      bounds: fallbackBounds
    });
    if (result && result.ok !== false) {
      this.applyLayoutEngine('freeform', { source: 'undockSurface', surfaceId: id, force: true });
    }
    return result;
  }

  applyLayoutEngine(engine = this._layoutEngine(), options = {}) {
    const snapshot = this.snapshot();
    const layoutResult = this._applyLayoutEngineSnapshot(snapshot, {
      ...options,
      engine,
      source: options.source || 'manual',
      commit: true,
      force: true
    });
    const appliedSnapshot = this._applySnapshot({ skipLayoutEngine: true });
    const result = {
      ...layoutResult,
      snapshot: appliedSnapshot
    };
    this.persistSnapshot(appliedSnapshot, { reason: 'layout-engine' });
    this._dispatchSurfaceLayoutEngineEvent('surface-layout-engine-applied', result);
    return result;
  }

  _lookupEnterpriseSurface(remoteRecord = {}, options = {}) {
    const registry = options.enterpriseRegistry || this.enterpriseSurfaceRegistry || globalThis.XTendEnterpriseSurfaceRegistry || globalThis.XTendSurfaceRegistry || null;
    if (!registry) return null;
    const keys = [
      remoteRecord.enterpriseSurfaceId,
      remoteRecord.surfaceId,
      remoteRecord.name,
      remoteRecord.manifestId,
      remoteRecord.remote && remoteRecord.remote.id
    ].filter(Boolean);
    if (typeof registry.lookup === 'function') {
      for (const key of keys) {
        const entry = registry.lookup(key);
        if (entry) return entry;
      }
    }
    if (typeof registry.get === 'function') {
      for (const key of keys) {
        const entry = registry.get(key);
        if (entry) return entry;
      }
    }
    const surfaces = Array.isArray(registry.surfaces)
      ? registry.surfaces
      : (Array.isArray(registry) ? registry : []);
    return surfaces.find((entry) => {
      const remote = entry && entry.remote || {};
      return keys.includes(entry && entry.enterpriseSurfaceId)
        || keys.includes(entry && entry.surfaceId)
        || keys.includes(entry && entry.name)
        || keys.includes(remote.manifestId)
        || keys.includes(remote.remoteId)
        || keys.includes(remote.id);
    }) || null;
  }

  _lookupRemoteDegradation(remoteRecord = {}, options = {}) {
    const report = options.degradationReport || this.remoteDegradationReport || null;
    const surfaces = Array.isArray(report && report.surfaces) ? report.surfaces : [];
    const keys = [
      remoteRecord.enterpriseSurfaceId,
      remoteRecord.surfaceId,
      remoteRecord.name,
      remoteRecord.manifestId,
      remoteRecord.remote && remoteRecord.remote.id
    ].filter(Boolean);
    return surfaces.find((entry) => (
      keys.includes(entry.enterpriseSurfaceId)
      || keys.includes(entry.surfaceId)
      || keys.includes(entry.name)
      || keys.includes(entry.remoteId)
    )) || null;
  }

  _mergeEnterpriseRemoteSurface(remoteRecord, enterpriseSurface) {
    if (!enterpriseSurface || typeof enterpriseSurface !== 'object') return remoteRecord;
    const remote = enterpriseSurface.remote || {};
    const version = enterpriseSurface.version || {};
    return {
      ...remoteRecord,
      enterpriseSurfaceId: enterpriseSurface.enterpriseSurfaceId || remoteRecord.enterpriseSurfaceId || null,
      owner: remoteRecord.owner && remoteRecord.owner.known ? remoteRecord.owner : normalizeSurfaceRemoteOwner(enterpriseSurface.owner),
      remote: {
        ...remoteRecord.remote,
        id: remoteRecord.remote.id || remote.remoteId || remote.id || '',
        origin: remoteRecord.remote.origin || normalizeSurfaceRemoteOrigin(remote.origin || ''),
        versionRange: remoteRecord.remote.versionRange || version.range || version.expected || version.active || '',
        integrity: remoteRecord.remote.integrity || remote.integrity || null
      },
      security: {
        ...remoteRecord.security,
        trustBoundary: remoteRecord.security.trustBoundary || remote.trustBoundary || ''
      },
      shellBindings: remoteRecord.shellBindings.length > 0
        ? remoteRecord.shellBindings
        : (Array.isArray(enterpriseSurface.shellTargets) ? enterpriseSurface.shellTargets.map(normalizeSurfaceRemoteBinding) : []),
      capabilities: remoteRecord.capabilities.length > 0
        ? remoteRecord.capabilities
        : normalizeSurfaceRemoteCapabilityIds(enterpriseSurface.capabilities),
      fallback: remoteRecord.fallback || enterpriseSurface.fallback || null,
      status: enterpriseSurface.status || remoteRecord.status
    };
  }

  _createRemotePolicyDecision(surfaceInput = {}, options = {}) {
    const mode = normalizeSurfaceRemotePolicyMode(options.policy || this._remoteSurfacePolicyMode(), 'strict');
    let remoteRecord = normalizeSurfaceRemoteRecord(surfaceInput, {
      managerId: this._managerId()
    });
    const enterpriseSurface = this._lookupEnterpriseSurface(remoteRecord, options);
    remoteRecord = this._mergeEnterpriseRemoteSurface(remoteRecord, enterpriseSurface);
    const degradationSurface = this._lookupRemoteDegradation(remoteRecord, options);
    const allowedOrigins = normalizeSurfaceRemoteList(options.allowedOrigins || this._remoteAllowedOrigins())
      .map(normalizeSurfaceRemoteOrigin)
      .filter(Boolean);
    const allowedCapabilities = normalizeSurfaceRemoteCapabilityIds(options.allowedCapabilities || this._remoteAllowedCapabilities());
    const diagnostics = [];
    const pushDiagnostic = (code, message, severity = 'error', detail = {}) => {
      diagnostics.push(this._createSurfaceRemotePolicyDiagnostic(code, message, mode === 'audit' && severity === 'error' ? 'warning' : severity, {
        surfaceId: remoteRecord.surfaceId,
        manifestId: remoteRecord.manifestId,
        remoteId: remoteRecord.remote.id,
        ...detail
      }));
    };

    if (mode === 'off') {
      pushDiagnostic('xtend.surface.remote-policy.disabled', 'Remote surface policy bridge is disabled by host policy.', 'warning');
    }
    if (!remoteRecord.surfaceId) {
      pushDiagnostic('xtend.surface.remote-policy.surface-id-missing', 'Remote surface records require a stable surface id.', 'error');
    }
    if (!remoteRecord.owner.known) {
      pushDiagnostic('xtend.surface.remote-policy.owner-missing', 'Remote surface records require an explicit owner.', 'error');
    }
    if (!remoteRecord.remote.id) {
      pushDiagnostic('xtend.surface.remote-policy.remote-id-missing', 'Remote surface records require a remote id.', 'error');
    }
    if (!remoteRecord.remote.versionRange) {
      pushDiagnostic('xtend.surface.remote-policy.version-missing', 'Remote surface records require a version or version range.', 'error');
    }
    if (!remoteRecord.remote.origin || !allowedOrigins.includes(remoteRecord.remote.origin)) {
      pushDiagnostic('xtend.surface.remote-policy.origin-not-allowed', 'Remote surface origin is not allowed by the host policy.', 'error', {
        origin: remoteRecord.remote.origin,
        allowedOrigins
      });
    }

    const integrity = remoteRecord.remote.integrity || {};
    if (!integrity.algorithm || !integrity.digest || !SURFACE_REMOTE_INTEGRITY_ALGORITHMS.includes(integrity.algorithm)) {
      pushDiagnostic('xtend.surface.remote-policy.integrity-missing', 'Remote surface records require allowed manifest integrity.', 'error', {
        allowedAlgorithms: SURFACE_REMOTE_INTEGRITY_ALGORITHMS.slice()
      });
    }
    if (remoteRecord.security.trustBoundary !== SURFACE_REMOTE_TRUST_BOUNDARY) {
      pushDiagnostic('xtend.surface.remote-policy.trust-boundary-refused', 'Remote surface trust boundary is missing or unsupported.', 'error', {
        actualTrustBoundary: remoteRecord.security.trustBoundary,
        expectedTrustBoundary: SURFACE_REMOTE_TRUST_BOUNDARY
      });
    }
    if (remoteRecord.security.capabilityMode !== 'deny-by-default') {
      pushDiagnostic('xtend.surface.remote-policy.capability-mode-refused', 'Remote surface capabilities must use deny-by-default mode.', 'error', {
        capabilityMode: remoteRecord.security.capabilityMode
      });
    }
    if (!remoteRecord.security.sandboxRequired || !remoteRecord.security.cspRequired) {
      pushDiagnostic('xtend.surface.remote-policy.sandbox-required', 'Remote surface host policy requires sandbox and CSP controls.', 'error', {
        sandboxRequired: remoteRecord.security.sandboxRequired,
        cspRequired: remoteRecord.security.cspRequired
      });
    }
    if (!remoteRecord.adapterBoundary.hostOwned || remoteRecord.adapterBoundary.runtimeLoader) {
      pushDiagnostic('xtend.surface.remote-policy.adapter-boundary-refused', 'Remote surface adapter boundary must be host-owned and runtime-loader-free.', 'error', {
        adapterBoundary: remoteRecord.adapterBoundary
      });
    }
    if (remoteRecord.runtime.kernelRemoteExecution || remoteRecord.runtime.networkRequiredByKernel) {
      pushDiagnostic('xtend.surface.remote-policy.kernel-runtime-refused', 'Remote surface records must not require remote runtime execution in the RMT kernel.', 'error', {
        runtime: remoteRecord.runtime
      });
    }

    const requiredCapabilities = remoteRecord.capabilities.filter(Boolean);
    const adapterCapabilities = remoteRecord.adapterBoundary.capabilities;
    const refusedCapabilities = requiredCapabilities.filter((capability) => (
      !allowedCapabilities.includes(capability) || !adapterCapabilities.includes(capability)
    ));
    if (refusedCapabilities.length > 0) {
      pushDiagnostic('xtend.surface.remote-policy.capability-refused', 'Remote surface capabilities exceed the host or adapter boundary.', 'error', {
        refusedCapabilities,
        allowedCapabilities,
        adapterCapabilities
      });
    }
    if (!requiredCapabilities.includes('surface.mount')) {
      pushDiagnostic('xtend.surface.remote-policy.mount-capability-missing', 'Remote surface records must explicitly request surface.mount.', 'error', {
        capabilities: requiredCapabilities
      });
    }

    const events = remoteRecord.events.emits.concat(remoteRecord.events.consumes);
    events.forEach((eventRecord) => {
      const scopes = normalizeSurfaceRemoteList(eventRecord.scopes || eventRecord.lane);
      const hasGlobalScope = scopes.some((scope) => ['*', 'global', 'window', 'document'].includes(String(scope).trim().toLowerCase()));
      if (!eventRecord.event || !eventRecord.payload || !eventRecord.payload.schema) {
        pushDiagnostic('xtend.surface.remote-policy.event-payload-missing', 'Remote surface events require explicit payload schemas.', 'error', {
          event: eventRecord.event,
          direction: eventRecord.direction
        });
      }
      if (hasGlobalScope) {
        pushDiagnostic('xtend.surface.remote-policy.event-scope-refused', 'Remote surface events must not bind to an implicit global event bus.', 'error', {
          event: eventRecord.event,
          scopes
        });
      }
    });

    if (degradationSurface && degradationSurface.state === 'blocked') {
      pushDiagnostic('xtend.surface.remote-policy.degradation-blocked', 'Remote surface is blocked by the degradation report.', 'error', {
        degradationState: degradationSurface.state
      });
    }

    const hasErrors = diagnostics.some((diagnostic) => diagnostic.severity === 'error');
    const fallbackRef = remoteRecord.fallback && remoteRecord.fallback.ref || '';
    const decision = mode === 'off' || !hasErrors
      ? 'mounted'
      : (fallbackRef ? 'degraded' : 'refused');
    if (hasErrors && !fallbackRef) {
      pushDiagnostic('xtend.surface.remote-policy.fallback-missing', 'Remote surface policy violations require an explicit fallback surface.', 'error');
    }

    return {
      schema: SURFACE_REMOTE_POLICY_SCHEMA,
      surfaceId: remoteRecord.surfaceId || null,
      remoteSurface: remoteRecord,
      decision,
      ok: decision !== 'refused',
      mounted: decision === 'mounted',
      degraded: decision === 'degraded',
      refused: decision === 'refused',
      policyMode: mode,
      trustBoundary: SURFACE_REMOTE_TRUST_BOUNDARY,
      ownerId: remoteRecord.owner.id || null,
      origin: remoteRecord.remote.origin || null,
      fallbackRef: fallbackRef || null,
      enterpriseSurfaceId: remoteRecord.enterpriseSurfaceId || null,
      enterpriseRegistryHit: Boolean(enterpriseSurface),
      degradationState: degradationSurface && degradationSurface.state || null,
      allowedOrigins,
      allowedCapabilities,
      diagnostics,
      kernelBoundary: {
        remoteRuntimeExecution: false,
        hostAdapterRequired: true,
        networkRequiredByKernel: false
      },
      createsSecondRegistry: false
    };
  }

  _createRemoteSurfaceControllerRecord(decision) {
    const remoteRecord = decision.remoteSurface || {};
    const source = remoteRecord.sourceRecord || {};
    const binding = remoteRecord.shellBindings && remoteRecord.shellBindings[0] || null;
    const target = binding && binding.target || '';
    const inferredType = remoteRecord.type === 'remote'
      ? (target.includes('sidebar') || target.includes('panel') ? 'side-panel' : 'window')
      : remoteRecord.type;
    const supportedType = ['window', 'side-panel', 'modal', 'dialog', 'drawer', 'popover', 'tooltip'].includes(inferredType)
      ? inferredType
      : 'window';
    const fallbackRef = decision.fallbackRef || '';
    const contentRef = decision.degraded
      ? fallbackRef
      : (remoteRecord.remote && remoteRecord.remote.id || remoteRecord.name || remoteRecord.surfaceId);
    return {
      schema: 'xtend.surface.record.v1',
      id: remoteRecord.surfaceId,
      manager: this._managerId(),
      type: supportedType,
      label: source.label || remoteRecord.name || remoteRecord.surfaceId,
      stateKey: source.stateKey || `xtend.surface.${remoteRecord.surfaceId}.state`,
      defaultOpen: source.defaultOpen === true || source.open === true,
      open: source.defaultOpen === true || source.open === true,
      active: source.active === true,
      bounds: source.bounds || source.initialBounds || {},
      placement: source.placement || (supportedType === 'side-panel' ? 'right' : ''),
      mode: source.mode || (supportedType === 'side-panel' ? 'docked' : 'floating'),
      capabilities: ['open', 'focus', 'close', 'snapshot', 'resize', 'restore'],
      persistence: source.persistence || {},
      contentRef,
      route: source.route || source.routeRef || '',
      schedule: source.schedule || source.scheduleRef || '',
      metadata: {
        ...(source.metadata && typeof source.metadata === 'object' ? source.metadata : {}),
        remoteSurface: remoteRecord.sourceRecord || remoteRecord,
        remotePolicy: {
          schema: SURFACE_REMOTE_POLICY_SCHEMA,
          decision: decision.decision,
          policyMode: decision.policyMode,
          fallbackRef: decision.fallbackRef,
          trustBoundary: decision.trustBoundary,
          kernelRemoteExecution: false
        },
        remotePolicyDecision: decision.decision,
        rmtKernelRemoteExecution: false
      }
    };
  }

  _applyRemoteSurfacePolicyDom(element, decision) {
    if (!element || !decision) return;
    element.setAttribute('data-surface-remote-policy-schema', SURFACE_REMOTE_POLICY_SCHEMA);
    element.setAttribute('data-surface-remote-decision', decision.decision);
    element.setAttribute('data-surface-remote-trust-boundary', decision.trustBoundary);
    element.setAttribute('data-surface-remote-kernel-runtime', 'false');
    element.setAttribute('data-surface-remote-owner', decision.ownerId || '');
    element.setAttribute('data-surface-remote-origin', decision.origin || '');
    element.toggleAttribute('data-surface-remote-degraded', decision.degraded === true);
    element.toggleAttribute('data-surface-remote-mounted', decision.mounted === true);
  }

  evaluateRemoteSurfacePolicy(surfaceInput = {}, options = {}) {
    return this._createRemotePolicyDecision(surfaceInput, options);
  }

  registerRemoteSurface(remoteSurface = {}, options = {}) {
    return this.applyRemoteSurfacePolicy(remoteSurface, {
      ...options,
      source: options.source || 'registerRemoteSurface',
      commit: true
    });
  }

  applyRemoteSurfacePolicy(surfaceInput = {}, options = {}) {
    const decision = this._createRemotePolicyDecision(surfaceInput, options);
    const eventType = decision.refused
      ? 'remote-surface-refused'
      : (decision.degraded ? 'remote-surface-degraded' : 'remote-surface-mounted');
    let controllerResult = null;
    let snapshot = this.snapshot();

    if (decision.ok && options.commit !== false) {
      const controller = this._ensureController();
      const controllerRecord = this._createRemoteSurfaceControllerRecord(decision);
      controllerResult = controller.registerSurface(controllerRecord);
      snapshot = this._applySnapshot();
      this.persistSnapshot(snapshot, { reason: decision.degraded ? 'remote-surface-degraded' : 'remote-surface-mounted' });
      this._dispatchManagerEvent('surface-registered', { result: controllerResult, snapshot });
    }

    const result = {
      ...decision,
      schema: SURFACE_REMOTE_POLICY_REPORT_SCHEMA,
      operation: 'applyRemoteSurfacePolicy',
      source: options.source || 'manual',
      controllerResult,
      snapshot
    };
    if (decision.surfaceId) this._surfaceRemotePolicyStates.set(decision.surfaceId, result);
    this._lastSurfaceRemotePolicyReport = result;
    if (typeof xstate.set === 'function') {
      xstate.set('xtend.surface.remotePolicy', this.snapshotRemoteSurfacePolicy());
    }
    this._dispatchSurfaceRemotePolicyEvent(eventType, result);
    return result;
  }

  governRemoteSurfaceEvent(eventInput = {}, payload = {}, options = {}) {
    const eventRecord = normalizeSurfaceRemoteEvent(eventInput, options.direction || '');
    const scopes = normalizeSurfaceRemoteList(eventRecord.scopes || eventRecord.lane);
    const diagnostics = [];
    const pushDiagnostic = (code, message, severity = 'error', detail = {}) => {
      diagnostics.push(this._createSurfaceRemotePolicyDiagnostic(code, message, severity, {
        event: eventRecord.event,
        direction: eventRecord.direction,
        ...detail
      }));
    };
    if (!eventRecord.event) {
      pushDiagnostic('xtend.surface.remote-policy.event-missing', 'Remote surface event governance requires an event name.');
    }
    if (!eventRecord.payload || !eventRecord.payload.schema) {
      pushDiagnostic('xtend.surface.remote-policy.event-payload-missing', 'Remote surface event governance requires a payload schema.');
    }
    if (scopes.some((scope) => ['*', 'global', 'window', 'document'].includes(String(scope).trim().toLowerCase()))) {
      pushDiagnostic('xtend.surface.remote-policy.event-scope-refused', 'Remote surface events must not use an implicit global event bus.', 'error', { scopes });
    }
    const governanceReport = options.eventGovernanceReport || this.remoteEventGovernanceReport || null;
    if (governanceReport && governanceReport.status === 'blocked') {
      pushDiagnostic('xtend.surface.remote-policy.event-governance-blocked', 'Remote surface event governance report is blocked.', 'error', {
        governanceStatus: governanceReport.status
      });
    }
    const ok = !diagnostics.some((diagnostic) => diagnostic.severity === 'error');
    const result = {
      schema: SURFACE_REMOTE_POLICY_REPORT_SCHEMA,
      policySchema: SURFACE_REMOTE_POLICY_SCHEMA,
      ok,
      governed: ok,
      refused: !ok,
      event: eventRecord.event,
      direction: eventRecord.direction,
      payloadSchema: eventRecord.payload && eventRecord.payload.schema || null,
      scopes,
      payload: payload && typeof payload === 'object' ? { ...payload } : {},
      diagnostics,
      implicitGlobalEventBus: false,
      runtimeDelivery: false,
      source: options.source || 'manual',
      snapshot: this.snapshot()
    };
    this._dispatchSurfaceRemotePolicyEvent(ok ? 'remote-surface-event-governed' : 'remote-surface-event-refused', result);
    return result;
  }

  snapshotRemoteSurfacePolicy() {
    const surfaces = Array.from(this._surfaceRemotePolicyStates.values()).map((entry) => ({
      schema: SURFACE_REMOTE_POLICY_SCHEMA,
      surfaceId: entry.surfaceId,
      decision: entry.decision,
      mounted: entry.mounted === true,
      degraded: entry.degraded === true,
      refused: entry.refused === true,
      ownerId: entry.ownerId || null,
      origin: entry.origin || null,
      trustBoundary: entry.trustBoundary,
      fallbackRef: entry.fallbackRef || null,
      enterpriseSurfaceId: entry.enterpriseSurfaceId || null,
      enterpriseRegistryHit: entry.enterpriseRegistryHit === true,
      degradationState: entry.degradationState || null,
      diagnosticCount: Array.isArray(entry.diagnostics) ? entry.diagnostics.length : 0,
      kernelRemoteExecution: false
    }));
    const diagnostics = Array.from(this._surfaceRemotePolicyStates.values())
      .flatMap((entry) => Array.isArray(entry.diagnostics) ? entry.diagnostics : []);
    return {
      schema: SURFACE_REMOTE_POLICY_REPORT_SCHEMA,
      policySchema: SURFACE_REMOTE_POLICY_SCHEMA,
      diagnosticSchema: SURFACE_REMOTE_POLICY_DIAGNOSTIC_SCHEMA,
      managerId: this._managerId(),
      stateKey: this._stateKey(),
      policyMode: this._remoteSurfacePolicyMode(),
      trustBoundary: SURFACE_REMOTE_TRUST_BOUNDARY,
      allowedOrigins: this._remoteAllowedOrigins(),
      allowedCapabilities: this._remoteAllowedCapabilities(),
      surfaceCount: surfaces.length,
      mountedCount: surfaces.filter((surface) => surface.mounted).length,
      degradedCount: surfaces.filter((surface) => surface.degraded).length,
      refusedCount: surfaces.filter((surface) => surface.refused).length,
      decisions: SURFACE_REMOTE_DECISIONS.slice(),
      surfaces,
      diagnostics,
      hostDecisionBoundary: true,
      eventGovernance: true,
      rmtKernelRemoteExecution: false,
      createsSecondRegistry: false
    };
  }

  snapshot() {
    return this._ensureController().snapshot();
  }

  readSnapshot() {
    return this._ensureController().readSnapshot();
  }

  snapshotSurfaceLoading() {
    const snapshot = this.snapshot();
    const surfaces = snapshot.surfaces.map((record) => {
      const element = this._registeredElements.get(record.id) || this.querySelector(surfaceElementSelector(record.id));
      const policy = element ? this._resolveSurfaceLoadingPolicy(element, record) : this._surfaceLoadingPolicy();
      const state = this._ensureSurfaceLoadingState(record.id, element, record, policy);
      return {
        surfaceId: record.id,
        label: record.label,
        type: record.type,
        status: state.status,
        policy: state.policy,
        hydrated: state.hydrated === true,
        skeleton: state.skeleton === true,
        pendingRoute: state.pendingRoute === true,
        contentReady: element ? element.getAttribute('data-xtend-surface-content-ready') === 'true' : false,
        tags: Array.isArray(state.tags) ? state.tags.slice() : [],
        unresolvedTags: Array.isArray(state.unresolvedTags) ? state.unresolvedTags.slice() : [],
        durationMs: Number(state.durationMs) || 0,
        diagnosticCount: Array.isArray(state.diagnostics) ? state.diagnostics.length : 0
      };
    });
    return {
      schema: SURFACE_LOADING_REPORT_SCHEMA,
      policySchema: SURFACE_LOADING_POLICY_SCHEMA,
      managerId: this._managerId(),
      stateKey: this._stateKey(),
      defaultPolicy: this._surfaceLoadingPolicy(),
      timeoutMs: this._surfaceHydrationTimeout(),
      surfaceCount: surfaces.length,
      skeletonCount: surfaces.filter((surface) => surface.skeleton).length,
      hydratedCount: surfaces.filter((surface) => surface.hydrated).length,
      pendingCount: surfaces.filter((surface) => !surface.hydrated).length,
      routePendingCount: surfaces.filter((surface) => surface.pendingRoute).length,
      surfaces,
      shellFirst: true,
      protectsUnstyledContent: true,
      usesXTendLoader: Boolean(globalThis.XTendLoader),
      createsSecondRegistry: false
    };
  }

  snapshotRouteLifecycle() {
    const snapshot = this.snapshot();
    const surfaces = snapshot.surfaces.map((record) => {
      const element = this._registeredElements.get(record.id) || this.querySelector(surfaceElementSelector(record.id));
      const config = this._resolveSurfaceRouteConfig(element, record);
      const state = this._surfaceRouteLifecycleStates.get(record.id) || config;
      return {
        surfaceId: record.id,
        label: record.label,
        type: record.type,
        status: record.status,
        routeRef: config.routeRef,
        routeScope: config.routeScope,
        policy: config.policy,
        global: config.global === true,
        persistent: config.persistent === true,
        matched: state.matched === true,
        activeRoute: state.activeRoute || null,
        lastRoute: state.lastRoute || null,
        lastAction: state.lastAction || null,
        diagnostic: state.diagnostic || null
      };
    });
    return {
      schema: SURFACE_ROUTE_LIFECYCLE_REPORT_SCHEMA,
      policySchema: SURFACE_ROUTE_LIFECYCLE_SCHEMA,
      managerId: this._managerId(),
      stateKey: this._stateKey(),
      routeAware: this._routeAware(),
      defaultPolicy: this._routeLifecyclePolicy(),
      currentRoute: this._currentSurfaceRoute,
      surfaceCount: surfaces.length,
      routeBoundCount: surfaces.filter((surface) => !surface.global).length,
      globalCount: surfaces.filter((surface) => surface.global).length,
      matchedCount: surfaces.filter((surface) => surface.matched).length,
      surfaces,
      controllerRemainsRegistryTruth: true,
      createsSecondRegistry: false,
      xrouterOwnsRouteState: true
    };
  }

  _surfaceLayoutViewport() {
    const rect = typeof this.getBoundingClientRect === 'function' ? this.getBoundingClientRect() : null;
    const width = Math.round(
      rect && rect.width
      || this.clientWidth
      || this.offsetWidth
      || 1024
    );
    const height = Math.round(
      rect && rect.height
      || this.clientHeight
      || this.offsetHeight
      || 720
    );
    return {
      width: Math.max(320, width),
      height: Math.max(240, height),
      compact: width <= 720 || height <= 420
    };
  }

  _isLayoutManagedSurface(record = {}) {
    return SURFACE_LAYOUT_SURFACE_TYPES.includes(record.type) && this._isSurfaceOpenForStack(record);
  }

  _normalizeLayoutBounds(bounds = {}, viewport = this._surfaceLayoutViewport(), options = {}) {
    const gap = options.gap === undefined ? this._layoutGap() : options.gap;
    const snap = options.snap === undefined ? this._layoutSnap() : options.snap;
    const minWidth = Math.max(160, Number(bounds.minWidth) || 240);
    const minHeight = Math.max(120, Number(bounds.minHeight) || 160);
    const maxWidth = Math.max(minWidth, viewport.width - (gap * 2));
    const maxHeight = Math.max(minHeight, viewport.height - (gap * 2));
    const width = Math.min(maxWidth, Math.max(minWidth, Number(bounds.width) || minWidth));
    const height = Math.min(maxHeight, Math.max(minHeight, Number(bounds.height) || minHeight));
    const x = Math.min(Math.max(gap, snapSurfaceLayoutValue(bounds.x, snap)), Math.max(gap, viewport.width - width - gap));
    const y = Math.min(Math.max(gap, snapSurfaceLayoutValue(bounds.y, snap)), Math.max(gap, viewport.height - height - gap));
    return {
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(width),
      height: Math.round(height),
      minWidth,
      minHeight
    };
  }

  _surfaceLayoutDockedRecords(records = []) {
    return records.filter((record) => {
      if (!this._isLayoutManagedSurface(record)) return false;
      const mode = String(record.mode || '').toLowerCase();
      const placement = normalizeSurfaceLayoutPlacement(record.placement, record.type === 'side-panel' ? 'right' : 'center');
      return record.type === 'side-panel' || ['docked', 'pinned', 'collapsed'].includes(mode) || ['left', 'right', 'top', 'bottom'].includes(placement);
    });
  }

  _applyDockedSurfaceLayout(records, viewport, options = {}) {
    const gap = options.gap === undefined ? this._layoutGap() : options.gap;
    const compact = viewport.compact || options.compact === true;
    const area = { x: gap, y: gap, width: viewport.width - (gap * 2), height: viewport.height - (gap * 2) };
    const entries = [];
    const docked = compact ? [] : this._surfaceLayoutDockedRecords(records);
    const dockedIds = new Set(docked.map((record) => record.id));

    docked.forEach((record) => {
      const placement = normalizeSurfaceLayoutPlacement(record.placement, record.type === 'side-panel' ? 'right' : 'center');
      const collapsed = record.collapsed || record.mode === 'collapsed';
      const width = Math.min(area.width, Math.max(collapsed ? 48 : 220, Number(record.bounds && record.bounds.width) || 320));
      const height = Math.min(area.height, Math.max(collapsed ? 48 : 180, Number(record.bounds && record.bounds.height) || 320));
      let bounds = null;
      if (placement === 'left') {
        bounds = { x: area.x, y: area.y, width, height: area.height };
        area.x += width + gap;
        area.width -= width + gap;
      } else if (placement === 'right' || placement === 'inline') {
        bounds = { x: area.x + area.width - width, y: area.y, width, height: area.height };
        area.width -= width + gap;
      } else if (placement === 'top') {
        bounds = { x: area.x, y: area.y, width: area.width, height };
        area.y += height + gap;
        area.height -= height + gap;
      } else if (placement === 'bottom') {
        bounds = { x: area.x, y: area.y + area.height - height, width: area.width, height };
        area.height -= height + gap;
      }
      if (bounds) {
        entries.push(this._createSurfaceLayoutEntry(record, 'docked', placement, bounds, {
          zone: `dock-${placement}`,
          mode: collapsed ? 'collapsed' : (record.mode || 'docked')
        }));
      }
    });

    const mainRecords = records.filter((record) => this._isLayoutManagedSurface(record) && !dockedIds.has(record.id));
    const mainBounds = {
      x: area.x,
      y: area.y,
      width: Math.max(160, area.width),
      height: Math.max(120, area.height)
    };
    entries.push(...this._layoutRecordsInArea(mainRecords, mainBounds, compact ? 'stacked' : 'tile', {
      ...options,
      zone: compact ? 'compact-stack' : 'workspace'
    }));
    return entries;
  }

  _layoutRecordsInArea(records = [], area = {}, engine = 'tile', options = {}) {
    const visible = records.filter((record) => this._isLayoutManagedSurface(record));
    if (visible.length === 0) return [];
    const gap = options.gap === undefined ? this._layoutGap() : options.gap;
    const bounds = {
      x: Math.round(area.x || gap),
      y: Math.round(area.y || gap),
      width: Math.max(160, Math.round(area.width || 640)),
      height: Math.max(120, Math.round(area.height || 420))
    };

    if (engine === 'split') {
      const vertical = options.direction === 'vertical';
      return visible.map((record, index) => {
        const size = vertical
          ? Math.floor((bounds.height - gap * (visible.length - 1)) / visible.length)
          : Math.floor((bounds.width - gap * (visible.length - 1)) / visible.length);
        const entryBounds = vertical
          ? { x: bounds.x, y: bounds.y + index * (size + gap), width: bounds.width, height: size }
          : { x: bounds.x + index * (size + gap), y: bounds.y, width: size, height: bounds.height };
        return this._createSurfaceLayoutEntry(record, 'split', options.zone || 'split-pane', entryBounds, {
          zone: options.zone || 'split-pane',
          mode: record.mode === 'floating' ? 'floating' : 'docked'
        });
      });
    }

    if (engine === 'stacked') {
      const offset = Math.max(16, gap * 2);
      return visible.map((record, index) => {
        const entryBounds = {
          x: bounds.x + index * offset,
          y: bounds.y + index * offset,
          width: Math.max(240, bounds.width - visible.length * offset),
          height: Math.max(180, bounds.height - visible.length * offset)
        };
        return this._createSurfaceLayoutEntry(record, 'stacked', options.zone || 'stack', entryBounds, {
          zone: options.zone || 'stack',
          mode: record.mode || 'floating'
        });
      });
    }

    const columns = Math.max(1, Math.ceil(Math.sqrt(visible.length)));
    const rows = Math.max(1, Math.ceil(visible.length / columns));
    const cellWidth = Math.floor((bounds.width - gap * (columns - 1)) / columns);
    const cellHeight = Math.floor((bounds.height - gap * (rows - 1)) / rows);
    return visible.map((record, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const entryBounds = {
        x: bounds.x + column * (cellWidth + gap),
        y: bounds.y + row * (cellHeight + gap),
        width: cellWidth,
        height: cellHeight
      };
      return this._createSurfaceLayoutEntry(record, 'tile', options.zone || 'tile-cell', entryBounds, {
        zone: options.zone || 'tile-cell',
        mode: record.mode === 'floating' ? 'floating' : 'docked'
      });
    });
  }

  _createFreeformLayoutEntries(records, viewport, options = {}) {
    const occupied = [];
    return records
      .filter((record) => this._isLayoutManagedSurface(record))
      .map((record) => {
        let bounds = this._normalizeLayoutBounds(record.bounds || {}, viewport, options);
        let guard = 0;
        while (occupied.some((item) => Math.abs(item.x - bounds.x) < 12 && Math.abs(item.y - bounds.y) < 12) && guard < 8) {
          bounds = this._normalizeLayoutBounds({
            ...bounds,
            x: bounds.x + this._layoutSnap() * 2,
            y: bounds.y + this._layoutSnap() * 2
          }, viewport, options);
          guard += 1;
        }
        occupied.push(bounds);
        return this._createSurfaceLayoutEntry(record, 'freeform', 'floating', bounds, {
          zone: 'freeform',
          mode: record.mode || 'floating',
          collisionAdjusted: guard > 0
        });
      });
  }

  _createSurfaceLayoutEntry(record, engine, placement, bounds, options = {}) {
    const viewport = options.viewport || this._surfaceLayoutViewport();
    const normalizedBounds = this._normalizeLayoutBounds({
      ...record.bounds,
      ...bounds
    }, viewport, options);
    const nextMode = options.mode || record.mode || (engine === 'freeform' ? 'floating' : 'docked');
    const nextPlacement = placement === 'floating' ? '' : normalizeSurfaceLayoutPlacement(placement, record.placement || 'center');
    const changed = !surfaceLayoutBoundsEqual(record.bounds || {}, normalizedBounds)
      || (nextMode && record.mode !== nextMode)
      || (nextPlacement !== undefined && String(record.placement || '') !== String(nextPlacement || ''));
    return {
      schema: SURFACE_LAYOUT_ENGINE_SCHEMA,
      surfaceId: record.id,
      type: record.type,
      status: record.status,
      engine,
      zone: options.zone || placement || 'workspace',
      placement: nextPlacement,
      mode: nextMode,
      bounds: normalizedBounds,
      changed,
      snapshotCompatible: true,
      responsiveFallback: options.responsiveFallback || null,
      collisionAdjusted: options.collisionAdjusted === true,
      viewportConstrained: !surfaceLayoutBoundsEqual(record.bounds || {}, normalizedBounds)
    };
  }

  _createSurfaceLayoutModel(snapshot = this.snapshot(), options = {}) {
    const requestedEngine = normalizeSurfaceLayoutEngine(options.engine || this._layoutEngine(), 'freeform');
    const viewport = this._surfaceLayoutViewport();
    const compact = viewport.compact;
    const engine = compact && requestedEngine !== 'freeform' ? 'stacked' : requestedEngine;
    const records = this._stackOrderedRecords(snapshot);
    let surfaces = [];
    if (engine === 'docked') {
      surfaces = this._applyDockedSurfaceLayout(records, viewport, { ...options, compact });
    } else if (engine === 'split') {
      const workspace = { x: this._layoutGap(), y: this._layoutGap(), width: viewport.width - this._layoutGap() * 2, height: viewport.height - this._layoutGap() * 2 };
      surfaces = this._layoutRecordsInArea(records, workspace, 'split', { ...options, zone: 'split-pane' });
    } else if (engine === 'tile') {
      const workspace = { x: this._layoutGap(), y: this._layoutGap(), width: viewport.width - this._layoutGap() * 2, height: viewport.height - this._layoutGap() * 2 };
      surfaces = this._layoutRecordsInArea(records, workspace, 'tile', { ...options, zone: 'tile-cell' });
    } else if (engine === 'stacked') {
      const workspace = { x: this._layoutGap(), y: this._layoutGap(), width: viewport.width - this._layoutGap() * 2, height: viewport.height - this._layoutGap() * 2 };
      surfaces = this._layoutRecordsInArea(records, workspace, 'stacked', {
        ...options,
        zone: compact ? 'compact-stack' : 'stack',
        responsiveFallback: compact && requestedEngine !== 'stacked' ? requestedEngine : null
      });
    } else {
      surfaces = this._createFreeformLayoutEntries(records, viewport, options);
    }
    const diagnostics = [];
    if (compact && requestedEngine !== engine) {
      diagnostics.push(this._createSurfaceLayoutEngineDiagnostic(
        'xtend.surface.layout-engine.responsive-fallback',
        'Surface layout engine switched to stacked mode for a compact viewport.',
        'info',
        { requestedEngine, engine, viewport }
      ));
    }
    return {
      schema: SURFACE_LAYOUT_ENGINE_REPORT_SCHEMA,
      policySchema: SURFACE_LAYOUT_ENGINE_SCHEMA,
      managerId: this._managerId(),
      stateKey: this._stateKey(),
      engine,
      requestedEngine,
      viewport,
      gap: this._layoutGap(),
      snap: this._layoutSnap(),
      surfaceCount: surfaces.length,
      changedCount: surfaces.filter((surface) => surface.changed).length,
      responsiveFallback: compact && requestedEngine !== engine,
      surfaces,
      diagnostics,
      snapshotCompatible: true,
      controllerRemainsRegistryTruth: true,
      createsSecondRegistry: false
    };
  }

  _applyLayoutEntryToElement(element, entry) {
    if (!element || !entry) return;
    element.setAttribute('data-surface-layout-engine', entry.engine);
    element.setAttribute('data-surface-layout-zone', entry.zone);
    element.setAttribute('data-surface-layout-snapshot-compatible', 'true');
    element.style.setProperty('--surface-layout-x', `${entry.bounds.x}px`);
    element.style.setProperty('--surface-layout-y', `${entry.bounds.y}px`);
    element.style.setProperty('--surface-layout-width', `${entry.bounds.width}px`);
    element.style.setProperty('--surface-layout-height', `${entry.bounds.height}px`);
  }

  _applySurfaceLayoutDom(report) {
    if (!report || !Array.isArray(report.surfaces)) return;
    report.surfaces.forEach((entry) => {
      const element = this._resolveStackElement(entry.surfaceId);
      this._applyLayoutEntryToElement(element, entry);
    });
  }

  _applyLayoutEngineSnapshot(snapshot = this.snapshot(), options = {}) {
    if (this._surfaceLayoutApplying) {
      return this._lastSurfaceLayoutReport || this._createSurfaceLayoutModel(snapshot, options);
    }
    const engine = normalizeSurfaceLayoutEngine(options.engine || this._layoutEngine(), 'freeform');
    const shouldCommit = options.commit === true && (options.force === true || engine !== 'freeform' || this.hasAttribute('layout-engine'));
    const controller = this._ensureController();
    const report = this._createSurfaceLayoutModel(snapshot, { ...options, engine });
    this._surfaceLayoutApplying = true;
    try {
      if (shouldCommit) {
        report.surfaces.filter((entry) => entry.changed).forEach((entry) => {
          controller.updateSurface(entry.surfaceId, {
            bounds: entry.bounds,
            mode: entry.mode,
            placement: entry.placement,
            collapsed: entry.mode === 'collapsed',
            pinned: entry.mode === 'pinned'
          });
        });
      }
    } finally {
      this._surfaceLayoutApplying = false;
    }
    const nextSnapshot = shouldCommit && report.changedCount > 0 ? this.snapshot() : snapshot;
    const result = {
      ...report,
      ok: true,
      source: options.source || 'snapshot',
      committed: shouldCommit,
      snapshot: nextSnapshot
    };
    this._lastSurfaceLayoutReport = result;
    report.surfaces.forEach((entry) => this._surfaceLayoutStates.set(entry.surfaceId, entry));
    this._applySurfaceLayoutDom(result);
    if (typeof xstate.set === 'function') {
      xstate.set('xtend.surface.layoutEngine', this.snapshotSurfaceLayout());
    }
    return result;
  }

  snapshotSurfaceLayout() {
    const snapshot = this.snapshot();
    const report = this._createSurfaceLayoutModel(snapshot, { engine: this._layoutEngine() });
    return {
      ...report,
      lastAppliedAt: this._lastSurfaceLayoutReport && this._lastSurfaceLayoutReport.source || null
    };
  }

  _stackOrderedRecords(snapshot = this.snapshot()) {
    const surfaces = Array.isArray(snapshot && snapshot.surfaces) ? snapshot.surfaces : [];
    const byId = new Map(surfaces.map((record) => [record.id, record]));
    const orderedIds = Array.isArray(snapshot && snapshot.stack)
      ? snapshot.stack.filter((surfaceId) => byId.has(surfaceId))
      : [];
    const ordered = orderedIds.map((surfaceId) => byId.get(surfaceId));
    surfaces
      .filter((record) => !orderedIds.includes(record.id))
      .sort((left, right) => (Number(left.zIndex) || 0) - (Number(right.zIndex) || 0))
      .forEach((record) => ordered.push(record));
    return ordered;
  }

  _isSurfaceOpenForStack(record = {}) {
    return record.status !== 'closed' && record.status !== 'minimized' && record.collapsed !== true;
  }

  _recordWantsModal(record = {}, policy = this._modalPolicy()) {
    if (policy === 'none') return false;
    if (policy === 'all-modal') return this._isSurfaceOpenForStack(record);
    return Boolean(record.modal || record.type === 'modal' || record.type === 'dialog');
  }

  _resolveStackElement(surfaceId) {
    return this._registeredElements.get(surfaceId) || this.querySelector(surfaceElementSelector(surfaceId));
  }

  _createStackPolicyModel(snapshot = this.snapshot()) {
    const modalPolicy = this._modalPolicy();
    const orderedRecords = this._stackOrderedRecords(snapshot);
    const openRecords = orderedRecords.filter((record) => this._isSurfaceOpenForStack(record));
    const topmostRecord = openRecords[openRecords.length - 1] || null;
    const modalCandidates = modalPolicy === 'none'
      ? []
      : openRecords.filter((record) => this._recordWantsModal(record, modalPolicy));
    const activeModalRecord = modalPolicy === 'none'
      ? null
      : (modalPolicy === 'all-modal' ? topmostRecord : modalCandidates[modalCandidates.length - 1] || null);
    const activeModalSurfaceId = activeModalRecord && activeModalRecord.id || null;
    const closeableRecords = openRecords
      .slice()
      .reverse()
      .filter((record) => Array.isArray(record.capabilities) && record.capabilities.includes('close'));
    const escapeTargetRecord = activeModalRecord || closeableRecords[0] || topmostRecord || null;
    const maxStackZ = Math.max(0, ...orderedRecords.map((record) => Number(record.zIndex) || 0));
    const diagnostics = [];

    if (activeModalRecord && topmostRecord && activeModalRecord.id !== topmostRecord.id) {
      diagnostics.push(this._createSurfaceStackPolicyDiagnostic(
        'xtend.surface.stack-policy.modal-before-nonmodal',
        'A modal surface is active below a non-modal surface; the manager promotes modal layer semantics without changing the controller registry.',
        'info',
        {
          activeModalSurfaceId: activeModalRecord.id,
          topmostSurfaceId: topmostRecord.id
        }
      ));
    }

    const surfaces = orderedRecords.map((record, index) => {
      const open = this._isSurfaceOpenForStack(record);
      const element = this._resolveStackElement(record.id);
      const wantsModal = this._recordWantsModal(record, modalPolicy);
      const activeModal = record.id === activeModalSurfaceId;
      const inert = Boolean(activeModalSurfaceId && open && !activeModal);
      const baseZIndex = Number(record.zIndex) || index + 1;
      const effectiveZIndex = activeModal ? Math.max(baseZIndex, maxStackZ + 2) : baseZIndex;
      const focusTarget = surfaceFocusableTarget(element);
      const missingLabel = open && wantsModal && !String(record.label || '').trim();

      if (missingLabel) {
        diagnostics.push(this._createSurfaceStackPolicyDiagnostic(
          'xtend.surface.stack-policy.missing-label',
          'A modal surface is missing a stable label.',
          'warning',
          { surfaceId: record.id, type: record.type }
        ));
      }
      if (activeModal && !focusTarget) {
        diagnostics.push(this._createSurfaceStackPolicyDiagnostic(
          'xtend.surface.stack-policy.focus-target-missing',
          'The active modal surface has no focusable target.',
          'warning',
          { surfaceId: record.id, type: record.type }
        ));
      }

      return {
        schema: SURFACE_STACK_POLICY_SCHEMA,
        surfaceId: record.id,
        label: record.label,
        type: record.type,
        status: record.status,
        open,
        modal: wantsModal,
        activeModal,
        inert,
        ariaHidden: inert || record.status === 'closed',
        ariaModal: activeModal,
        focusable: Boolean(focusTarget),
        escapeTarget: escapeTargetRecord && escapeTargetRecord.id === record.id,
        topmost: topmostRecord && topmostRecord.id === record.id,
        stackIndex: index,
        zIndex: effectiveZIndex,
        layerToken: activeModal ? 'surface.modal.active' : `surface.stack.${index + 1}`
      };
    });

    return {
      modalPolicy,
      orderedRecords,
      openRecords,
      topmostRecord,
      activeModalRecord,
      escapeTargetRecord,
      surfaces,
      diagnostics
    };
  }

  snapshotStackPolicy() {
    const snapshot = this.snapshot();
    const model = this._createStackPolicyModel(snapshot);
    return {
      schema: SURFACE_STACK_POLICY_REPORT_SCHEMA,
      policySchema: SURFACE_STACK_POLICY_SCHEMA,
      managerId: this._managerId(),
      stateKey: this._stateKey(),
      modalPolicy: model.modalPolicy,
      surfaceCount: model.surfaces.length,
      openSurfaceCount: model.openRecords.length,
      modalSurfaceCount: model.surfaces.filter((surface) => surface.modal && surface.open).length,
      inertSurfaceCount: model.surfaces.filter((surface) => surface.inert).length,
      topmostSurfaceId: model.topmostRecord && model.topmostRecord.id || null,
      activeModalSurfaceId: model.activeModalRecord && model.activeModalRecord.id || null,
      escapeTargetSurfaceId: model.escapeTargetRecord && model.escapeTargetRecord.id || null,
      scrollLocked: Boolean(this._surfaceStackDocumentState),
      focusRestoreTargetCount: this._surfaceFocusRestoreTargets.size,
      diagnostics: model.diagnostics,
      surfaces: model.surfaces,
      overlayCompatibilityPreserved: true,
      controllerRemainsRegistryTruth: true,
      createsSecondRegistry: false
    };
  }

  applyStackPolicy(options = {}) {
    const snapshot = this.snapshot();
    return this._applyStackPolicy(snapshot, { ...options, source: options.source || 'manual' });
  }

  _applyStackPolicy(snapshot = this.snapshot(), options = {}) {
    const model = this._createStackPolicyModel(snapshot);
    const previousModalSurfaceId = this._activeStackModalSurfaceId;
    const activeModalSurfaceId = model.activeModalRecord && model.activeModalRecord.id || null;

    if (activeModalSurfaceId && previousModalSurfaceId !== activeModalSurfaceId) {
      this._captureStackFocusRestoreTarget(activeModalSurfaceId);
    }

    model.surfaces.forEach((entry) => {
      const element = this._resolveStackElement(entry.surfaceId);
      if (!element) return;
      this._surfaceStackPolicyStates.set(entry.surfaceId, entry);
      this._applySurfaceStackEntry(element, entry);
    });

    this._lockSurfaceScroll(Boolean(activeModalSurfaceId));
    this._activeStackModalSurfaceId = activeModalSurfaceId;

    if (activeModalSurfaceId && options.focus !== false) {
      this._ensureStackFocusWithinSurface(activeModalSurfaceId, options);
    } else if (!activeModalSurfaceId && previousModalSurfaceId) {
      this._restoreStackFocus(previousModalSurfaceId);
    }

    const report = {
      schema: SURFACE_STACK_POLICY_REPORT_SCHEMA,
      ok: true,
      source: options.source || 'snapshot',
      modalPolicy: model.modalPolicy,
      topmostSurfaceId: model.topmostRecord && model.topmostRecord.id || null,
      activeModalSurfaceId,
      escapeTargetSurfaceId: model.escapeTargetRecord && model.escapeTargetRecord.id || null,
      inertSurfaceCount: model.surfaces.filter((surface) => surface.inert).length,
      diagnostics: model.diagnostics,
      snapshot
    };
    if (typeof xstate.set === 'function') {
      xstate.set('xtend.surface.stackPolicy', this.snapshotStackPolicy());
    }
    if (options.dispatch !== false) {
      this._dispatchSurfaceStackPolicyEvent('surface-stack-policy-applied', report);
    }
    return report;
  }

  _applySurfaceStackEntry(element, entry) {
    element.style.setProperty('--surface-layer-z', String(entry.zIndex));
    element.style.setProperty('--surface-stack-z', String(entry.zIndex));
    if (element.localName === 'x-surface-window') {
      element.style.setProperty('--surface-window-z', String(entry.zIndex));
    }
    if (element.localName === 'x-side-panel') {
      element.style.setProperty('--side-panel-z', String(entry.zIndex));
    }
    if (isSurfaceOverlayElement(element)) {
      element.style.setProperty('--surface-overlay-z', String(entry.zIndex));
      element.style.setProperty('--surface-overlay-backdrop-z', String(Math.max(1, entry.zIndex - 1)));
    }

    element.setAttribute('data-surface-layer-token', entry.layerToken);
    element.setAttribute('data-surface-stack-index', String(entry.stackIndex));
    element.toggleAttribute('data-surface-stack-topmost', entry.topmost === true);
    element.toggleAttribute('data-surface-stack-escape-target', entry.escapeTarget === true);
    element.toggleAttribute('data-surface-modal-active', entry.activeModal === true);
    element.toggleAttribute('data-surface-focus-trap', entry.activeModal === true);
    this._setSurfaceAriaModal(element, entry.activeModal);
    this._setSurfaceInert(element, entry.inert);
  }

  _setSurfaceAriaModal(element, modal) {
    if (!element) return;
    if (modal) {
      element.setAttribute('aria-modal', 'true');
      element.setAttribute('data-surface-aria-modal-by-manager', 'true');
    } else if (element.getAttribute('data-surface-aria-modal-by-manager') === 'true') {
      element.removeAttribute('aria-modal');
      element.removeAttribute('data-surface-aria-modal-by-manager');
    }

    if (!element.shadowRoot || isSurfaceOverlayElement(element)) return;
    const surface = element.shadowRoot.querySelector('[part~="surface"]');
    if (!surface) return;
    surface.setAttribute('aria-modal', modal ? 'true' : 'false');
    surface.setAttribute('data-surface-aria-modal-by-manager', 'true');
  }

  _setSurfaceInert(element, inert) {
    if (!element) return;
    if (inert) {
      element.setAttribute('data-surface-inert', 'manager');
      element.setAttribute('data-surface-aria-hidden-by-manager', 'true');
      element.setAttribute('aria-hidden', 'true');
      element.setAttribute('inert', '');
      try {
        element.inert = true;
      } catch (_error) {
        // Attribute fallback is enough for browsers without an inert property.
      }
      return;
    }

    if (element.getAttribute('data-surface-inert') === 'manager') {
      element.removeAttribute('data-surface-inert');
      element.removeAttribute('inert');
      try {
        element.inert = false;
      } catch (_error) {
        // Attribute fallback already removed.
      }
    }
    if (element.getAttribute('data-surface-aria-hidden-by-manager') === 'true') {
      element.removeAttribute('aria-hidden');
      element.removeAttribute('data-surface-aria-hidden-by-manager');
    }
  }

  _captureStackFocusRestoreTarget(surfaceId) {
    if (!globalThis.document) return null;
    const activeElement = globalThis.document.activeElement;
    const surfaceElement = this._resolveStackElement(surfaceId);
    if (
      activeElement
      && activeElement !== globalThis.document.body
      && activeElement !== globalThis.document.documentElement
      && !surfaceElementContainsTarget(surfaceElement, activeElement)
      && typeof activeElement.focus === 'function'
    ) {
      this._surfaceFocusRestoreTargets.set(surfaceId, activeElement);
      return activeElement;
    }
    return null;
  }

  _ensureStackFocusWithinSurface(surfaceId, options = {}) {
    if (!globalThis.document) return false;
    const element = this._resolveStackElement(surfaceId);
    if (!element) return false;
    const activeElement = globalThis.document.activeElement;
    if (surfaceElementContainsTarget(element, activeElement)) return true;
    const focusTarget = surfaceFocusableTarget(element);
    if (!focusTarget) return false;
    queueMicrotask(() => {
      try {
        focusTarget.focus({ preventScroll: true });
        this._dispatchSurfaceStackPolicyEvent('surface-stack-policy-focus', {
          ok: true,
          surfaceId,
          source: options.source || 'stack-policy',
          snapshot: this.snapshot()
        });
      } catch (error) {
        this._dispatchSurfaceStackPolicyEvent('surface-stack-policy-error', {
          ok: false,
          surfaceId,
          diagnostic: this._createSurfaceStackPolicyDiagnostic(
            'xtend.surface.stack-policy.focus-failed',
            'The active modal surface could not receive focus.',
            'warning',
            { surfaceId, error: error && error.message || String(error) }
          ),
          snapshot: this.snapshot()
        });
      }
    });
    return true;
  }

  _restoreStackFocus(surfaceId) {
    const target = this._surfaceFocusRestoreTargets.get(surfaceId);
    this._surfaceFocusRestoreTargets.delete(surfaceId);
    if (!target || !target.isConnected || typeof target.focus !== 'function') return false;
    queueMicrotask(() => {
      try {
        target.focus({ preventScroll: true });
        this._dispatchSurfaceStackPolicyEvent('surface-stack-policy-focus-restored', {
          ok: true,
          surfaceId,
          snapshot: this.snapshot()
        });
      } catch (_error) {
        // Focus restore is best-effort; the stack report keeps the policy state authoritative.
      }
    });
    return true;
  }

  _lockSurfaceScroll(lock) {
    const doc = globalThis.document;
    if (!doc || !doc.documentElement || !doc.body) return;
    if (lock && !this._surfaceStackDocumentState) {
      this._surfaceStackDocumentState = {
        bodyOverflow: doc.body.style.overflow,
        documentOverflow: doc.documentElement.style.overflow
      };
      doc.documentElement.setAttribute('data-xtend-surface-scroll-lock', 'true');
      doc.body.setAttribute('data-xtend-surface-scroll-lock', 'true');
      doc.documentElement.style.overflow = 'hidden';
      doc.body.style.overflow = 'hidden';
      return;
    }
    if (!lock && this._surfaceStackDocumentState) {
      doc.documentElement.style.overflow = this._surfaceStackDocumentState.documentOverflow || '';
      doc.body.style.overflow = this._surfaceStackDocumentState.bodyOverflow || '';
      doc.documentElement.removeAttribute('data-xtend-surface-scroll-lock');
      doc.body.removeAttribute('data-xtend-surface-scroll-lock');
      this._surfaceStackDocumentState = null;
    }
  }

  _releaseSurfaceStackPolicy() {
    const elements = new Set([
      ...this._registeredElements.values(),
      ...Array.from(this.querySelectorAll ? this.querySelectorAll(SURFACE_MANAGED_ELEMENT_SELECTOR) : [])
    ]);
    elements.forEach((element) => {
      this._setSurfaceInert(element, false);
      element.removeAttribute('data-surface-layer-token');
      element.removeAttribute('data-surface-stack-index');
      element.removeAttribute('data-surface-stack-topmost');
      element.removeAttribute('data-surface-stack-escape-target');
      element.removeAttribute('data-surface-modal-active');
      element.removeAttribute('data-surface-focus-trap');
      if (element.getAttribute('data-surface-aria-modal-by-manager') === 'true') {
        element.removeAttribute('aria-modal');
        element.removeAttribute('data-surface-aria-modal-by-manager');
      }
    });
    this._lockSurfaceScroll(false);
    this._surfaceStackPolicyStates.clear();
    this._activeStackModalSurfaceId = null;
  }

  applyRouteLifecycle(routeInput = null, options = {}) {
    if (!this._routeAware() && options.force !== true) {
      const diagnostic = this._createSurfaceRouteLifecycleDiagnostic(
        'xtend.surface.route-lifecycle.disabled',
        'Surface route lifecycle is disabled because route-aware is not enabled.',
        'info'
      );
      const result = { ok: false, skipped: true, diagnostic, route: this._normalizeRouteLifecycleInput(routeInput), actions: [] };
      this._dispatchSurfaceRouteLifecycleEvent('surface-route-lifecycle-skipped', result);
      return result;
    }

    const route = this._normalizeRouteLifecycleInput(routeInput);
    this._currentSurfaceRoute = route;
    const before = this.snapshot();
    const actions = [];
    let matchedCount = 0;
    let globalCount = 0;

    before.surfaces.forEach((record) => {
      const element = this._registeredElements.get(record.id) || this.querySelector(surfaceElementSelector(record.id));
      const config = this._resolveSurfaceRouteConfig(element, record);
      if (config.global) {
        globalCount += 1;
        this._recordRouteLifecycleState(record.id, {
          ...config,
          matched: false,
          activeRoute: null,
          lastRoute: route.path,
          lastAction: 'global-keep'
        });
        actions.push({ surfaceId: record.id, policy: config.policy, action: 'global-keep', matched: false, ok: true });
        return;
      }

      const matched = this._surfaceRouteMatches(config, route);
      if (matched) matchedCount += 1;
      const action = matched
        ? this._applyMatchedSurfaceRouteLifecycle(record, config, route, options)
        : this._applyUnmatchedSurfaceRouteLifecycle(record, config, route, options);
      this._recordRouteLifecycleState(record.id, {
        ...config,
        matched,
        activeRoute: matched ? route.path : null,
        lastRoute: route.path,
        lastAction: action.action,
        diagnostic: action.diagnostic || null
      });
      actions.push(action);
    });

    const snapshot = this._applySnapshot();
    this.persistSnapshot(snapshot, { reason: 'route-lifecycle' });
    const result = {
      schema: SURFACE_ROUTE_LIFECYCLE_REPORT_SCHEMA,
      ok: true,
      skipped: false,
      route,
      matchedCount,
      globalCount,
      actionCount: actions.length,
      actions,
      snapshot
    };
    if (typeof xstate.set === 'function') {
      xstate.set('xtend.surface.routeLifecycle', this.snapshotRouteLifecycle());
    }
    this._dispatchSurfaceRouteLifecycleEvent('surface-route-lifecycle-applied', result);
    return result;
  }

  _applyMatchedSurfaceRouteLifecycle(record, config, route, options = {}) {
    if (config.policy === 'manual') return { surfaceId: record.id, policy: config.policy, action: 'manual-skip', matched: true, ok: true };
    if (config.policy === 'hydrate-only') {
      this.hydrateSurfaceContent(record.id, { policy: 'route', reason: 'surface.route.lifecycle', timeoutMs: options.timeoutMs });
      return { surfaceId: record.id, policy: config.policy, action: 'route-hydrate', matched: true, ok: true };
    }

    let result = null;
    let action = 'route-keep-open';
    if (record.status === 'closed') {
      result = this.openSurface(record.id, { source: 'route-lifecycle', route: route.path });
      action = 'route-open';
    } else if (record.status === 'minimized' || record.minimized || record.maximized) {
      result = this.restoreSurface(record.id);
      action = 'route-restore';
    } else if (record.collapsed) {
      result = this.expandSurface(record.id, record.pinned ? 'pinned' : (record.mode === 'collapsed' ? 'docked' : record.mode));
      action = 'route-expand';
    }

    this.hydrateSurfaceContent(record.id, { policy: 'route', reason: 'surface.route.lifecycle', timeoutMs: options.timeoutMs });
    return {
      surfaceId: record.id,
      policy: config.policy,
      action,
      matched: true,
      ok: result ? result.ok !== false : true,
      result: result || null
    };
  }

  _applyUnmatchedSurfaceRouteLifecycle(record, config, route) {
    if (config.policy === 'manual') return { surfaceId: record.id, policy: config.policy, action: 'manual-skip', matched: false, ok: true };
    if (config.policy === 'open-keep' || config.policy === 'hydrate-only') {
      return { surfaceId: record.id, policy: config.policy, action: 'route-keep', matched: false, ok: true };
    }
    if (record.status === 'closed') {
      return { surfaceId: record.id, policy: config.policy, action: 'route-already-closed', matched: false, ok: true };
    }

    let result = null;
    let action = 'route-keep';
    if (config.policy === 'open-collapse') {
      if (record.type === 'side-panel' || record.type === 'drawer') {
        result = this.collapseSurface(record.id);
        action = 'route-collapse';
      } else {
        result = this.minimizeSurface(record.id);
        action = 'route-minimize';
      }
    } else if (config.policy === 'open-minimize') {
      if (record.capabilities && record.capabilities.includes('minimize')) {
        result = this.minimizeSurface(record.id);
        action = 'route-minimize';
      } else {
        result = this.collapseSurface(record.id);
        action = 'route-collapse';
      }
    } else {
      result = this.closeSurface(record.id, 'route-lifecycle');
      action = 'route-close';
    }

    return {
      surfaceId: record.id,
      policy: config.policy,
      action,
      matched: false,
      ok: result ? result.ok !== false : true,
      result: result || null
    };
  }

  hydrateSurfaceContent(surfaceRef, options = {}) {
    const element = this._resolveSurfaceElement(surfaceRef);
    const record = this._resolveSurfaceRecord(surfaceRef, element);
    const surfaceId = record && record.id || element && (element.getAttribute('surface-id') || element.id);
    if (!element || !surfaceId) {
      const diagnostic = this._createSurfaceLoadingDiagnostic(
        'xtend.surface.loading.surface-not-found',
        'Surface content cannot be hydrated because the surface element was not found.',
        'warning',
        { surfaceRef }
      );
      const result = { ok: false, hydrated: false, skipped: true, diagnostic, surfaceId: surfaceId || null };
      this._dispatchSurfaceLoadingEvent('surface-content-hydration-skipped', result);
      return Promise.resolve(result);
    }

    const policy = normalizeSurfaceLoadingPolicy(options.policy, this._resolveSurfaceLoadingPolicy(element, record || {}));
    const state = this._ensureSurfaceLoadingState(surfaceId, element, record || {}, policy);
    if (state && state.hydrated === true && options.force !== true) {
      const result = { ok: true, hydrated: true, skipped: true, surfaceId, policy, state };
      this._dispatchSurfaceLoadingEvent('surface-content-hydration-skipped', result);
      return Promise.resolve(result);
    }
    if (this._surfaceLoadingPromises.has(surfaceId)) return this._surfaceLoadingPromises.get(surfaceId);

    this._showSurfaceSkeleton(element, record || {}, { policy, reason: options.reason || 'manual' });
    const promise = this._runSurfaceHydration(element, record || { id: surfaceId }, policy, options)
      .finally(() => {
        this._surfaceLoadingPromises.delete(surfaceId);
      });
    this._surfaceLoadingPromises.set(surfaceId, promise);
    return promise;
  }

  _runSurfaceHydration(element, record = {}, policy = 'open', options = {}) {
    const loader = surfaceLoaderApi();
    const surfaceId = record.id || element.getAttribute('surface-id') || element.id;
    const state = this._ensureSurfaceLoadingState(surfaceId, element, record, policy);
    const startedAt = surfaceLoadingNow();
    const schedule = `surface.${policy}.hydrate`;
    if (state) {
      state.status = 'hydrating';
      state.startedAt = startedAt;
      state.policy = policy;
      state.pendingRoute = false;
      state.tags = collectSurfaceHydrationTags(element);
      state.unresolvedTags = [];
    }
    this._surfaceRouteHydrationPending.delete(surfaceId);
    this._dispatchSurfaceLoadingEvent('surface-content-loading', { ok: true, surfaceId, policy, schedule, state });

    const timeoutMs = normalizeSurfaceLoadingTimeout(options.timeoutMs !== undefined ? options.timeoutMs : this._surfaceHydrationTimeout());
    let timedOut = false;
    const task = (async () => {
      if (loader.ensureRuntimeStyles) loader.ensureRuntimeStyles({ source: 'x-surface-manager.surface-hydration' });
      const tags = collectSurfaceHydrationTags(element);
      if (state) state.tags = tags;
      if (loader.ensureComponent) {
        await Promise.all(tags.map((tag) => loader.ensureComponent(tag, {
          source: 'x-surface-manager',
          reason: options.reason || 'surface-content-hydration',
          schedule,
          skipBootWait: true
        })));
      }
      const hydration = loader.hydrateTree
        ? await loader.hydrateTree(element, {
          source: 'x-surface-manager',
          reason: options.reason || 'surface-content-hydration',
          schedule,
          skipBootWait: true
        })
        : { schema: 'xtend.surface.loading.no-loader-hydration.v1', tags, hydrated: 0 };
      const unresolvedTags = tags.filter((tag) => (
        globalThis.customElements
        && typeof globalThis.customElements.get === 'function'
        && !globalThis.customElements.get(tag)
      ));
      if (unresolvedTags.length > 0 && options.allowUnresolved !== true) {
        throw new Error(`Unresolved surface content components: ${unresolvedTags.join(', ')}`);
      }
      if (timedOut) {
        throw new Error(`Surface content hydration timed out after ${timeoutMs}ms`);
      }
      this._hideSurfaceSkeleton(element);
      const finishedAt = surfaceLoadingNow();
      if (state) {
        state.status = 'hydrated';
        state.hydrated = true;
        state.skeleton = false;
        state.hydratedAt = new Date().toISOString();
        state.durationMs = Math.max(0, finishedAt - startedAt);
        state.unresolvedTags = [];
      }
      const result = {
        ok: true,
        hydrated: true,
        skipped: false,
        surfaceId,
        policy,
        schedule,
        durationMs: state && state.durationMs || 0,
        hydration,
        tags
      };
      this._dispatchSurfaceLoadingEvent('surface-content-hydrated', result);
      return result;
    })();

    const guardedTask = timeoutMs > 0
      ? Promise.race([
        task,
        new Promise((_, reject) => {
          globalThis.setTimeout(() => {
            timedOut = true;
            reject(new Error(`Surface content hydration timed out after ${timeoutMs}ms`));
          }, timeoutMs);
        })
      ])
      : task;

    return guardedTask.catch((error) => {
      const tags = collectSurfaceHydrationTags(element);
      const unresolvedTags = tags.filter((tag) => (
        globalThis.customElements
        && typeof globalThis.customElements.get === 'function'
        && !globalThis.customElements.get(tag)
      ));
      const diagnostic = this._createSurfaceLoadingDiagnostic(
        'xtend.surface.loading.hydration-failed',
        'Surface content hydration failed; the skeleton remains active to avoid unstyled pop-in.',
        'warning',
        {
          surfaceId,
          policy,
          schedule,
          error: error && error.message || String(error),
          unresolvedTags
        }
      );
      if (state) {
        state.status = 'error';
        state.hydrated = false;
        state.skeleton = true;
        state.unresolvedTags = unresolvedTags;
        state.diagnostics.push(diagnostic);
        state.durationMs = Math.max(0, surfaceLoadingNow() - startedAt);
      }
      element.setAttribute('data-xtend-surface-content-ready', 'false');
      element.setAttribute('data-xtend-surface-loading-error', diagnostic.code);
      const result = { ok: false, hydrated: false, skipped: false, surfaceId, policy, schedule, diagnostic, tags, unresolvedTags };
      this._dispatchSurfaceLoadingEvent('surface-content-hydration-error', result);
      return result;
    });
  }

  snapshotPersistence(options = {}) {
    const mode = this._persistenceMode();
    const key = this._persistenceStorageKey();
    const adapter = this._persistenceAdapter();
    let hasSnapshot = false;
    if (options.includeStoredState !== false && adapter && key) {
      try {
        hasSnapshot = Boolean(adapter.getItem(key));
      } catch (_error) {
        hasSnapshot = false;
      }
    }
    return {
      schema: SURFACE_MANAGER_PERSISTENCE_SCHEMA,
      version: SURFACE_PERSISTENCE_VERSION,
      managerId: this._managerId(),
      restoreKey: this._restoreKey(),
      stateKey: this._stateKey(),
      mode,
      policy: this._restorePolicy(),
      key,
      storageAvailable: mode === 'none' ? false : Boolean(adapter),
      hasSnapshot,
      noContentPayload: true,
      createsSecondRegistry: false
    };
  }

  persistSnapshot(snapshot = this.snapshot(), options = {}) {
    const mode = this._persistenceMode();
    const key = this._persistenceStorageKey();
    const reason = options.reason || 'snapshot';
    if (this._snapshotPersistenceSuspended && options.force !== true) {
      const diagnostic = this._createPersistenceDiagnostic('xtend.surface.persistence.suspended', 'Surface persistence is temporarily suspended.', 'info', { reason });
      return { ok: false, persisted: false, skipped: true, diagnostic, snapshot };
    }
    if (mode === 'none' || !key) {
      const diagnostic = this._createPersistenceDiagnostic('xtend.surface.persistence.disabled', 'Surface persistence is disabled.', 'info', { reason });
      return { ok: false, persisted: false, skipped: true, diagnostic, snapshot };
    }
    const adapter = this._persistenceAdapter();
    if (!adapter) {
      const diagnostic = this._createPersistenceDiagnostic('xtend.surface.persistence.storage-unavailable', 'Surface persistence storage is unavailable.', 'warning', { mode, reason });
      const result = { ok: false, persisted: false, skipped: true, diagnostic, snapshot };
      this._dispatchPersistenceEvent('surface-persistence-error', result);
      return result;
    }
    try {
      const envelope = this._createPersistedEnvelope(snapshot, reason);
      adapter.setItem(key, JSON.stringify(envelope));
      const diagnostic = this._createPersistenceDiagnostic('xtend.surface.persistence.saved', 'Surface snapshot persisted.', 'info', {
        key,
        mode,
        surfaceCount: envelope.snapshot.surfaces.length,
        reason
      });
      const result = { ok: true, persisted: true, skipped: false, key, mode, envelope, diagnostic, snapshot: envelope.snapshot };
      this._dispatchPersistenceEvent('surface-snapshot-persisted', result);
      return result;
    } catch (error) {
      const diagnostic = this._createPersistenceDiagnostic('xtend.surface.persistence.write-failed', 'Surface snapshot could not be persisted.', 'warning', {
        key,
        mode,
        reason,
        error: error && error.message || String(error)
      });
      const result = { ok: false, persisted: false, skipped: true, diagnostic, snapshot };
      this._dispatchPersistenceEvent('surface-persistence-error', result);
      return result;
    }
  }

  restorePersistedSnapshot(options = {}) {
    if (options.source === 'connected' && this._restorePolicy() !== 'auto') {
      const diagnostic = this._createPersistenceDiagnostic('xtend.surface.persistence.restore-skipped', 'Automatic surface restore is disabled by policy.', 'info', {
        policy: this._restorePolicy()
      });
      return { ok: false, restored: false, skipped: true, diagnostic, snapshot: this.snapshot() };
    }
    const readResult = options.envelope
      ? this._validatePersistedEnvelope(options.envelope)
      : this._readPersistedEnvelope();
    if (!readResult.ok) {
      const result = {
        ok: false,
        restored: false,
        skipped: true,
        diagnostic: readResult.diagnostic,
        snapshot: this.snapshot()
      };
      if (readResult.diagnostic && readResult.diagnostic.severity !== 'info') {
        this._dispatchPersistenceEvent('surface-restore-skipped', result);
      }
      return result;
    }
    const envelope = readResult.envelope;
    const restored = this._applyPersistedSurfaceSnapshot(envelope.snapshot, options);
    const result = {
      ok: restored.restoredCount > 0,
      restored: restored.restoredCount > 0,
      skipped: restored.restoredCount === 0,
      envelope,
      diagnostic: restored.diagnostic,
      restoredCount: restored.restoredCount,
      skippedCount: restored.skippedCount,
      snapshot: restored.snapshot
    };
    this._dispatchPersistenceEvent(result.restored ? 'surface-snapshot-restored' : 'surface-restore-skipped', result);
    if (result.restored) this.persistSnapshot(restored.snapshot, { reason: 'restore', force: true });
    return result;
  }

  clearPersistedSnapshot(options = {}) {
    const mode = this._persistenceMode();
    const key = this._persistenceStorageKey();
    const adapter = this._persistenceAdapter();
    if (!adapter || !key || mode === 'none') {
      const diagnostic = this._createPersistenceDiagnostic('xtend.surface.persistence.disabled', 'Surface persistence is disabled.', 'info', { reason: options.reason || 'clear' });
      return { ok: false, cleared: false, skipped: true, diagnostic };
    }
    try {
      adapter.removeItem(key);
      const diagnostic = this._createPersistenceDiagnostic('xtend.surface.persistence.cleared', 'Persisted surface snapshot cleared.', 'info', { key, mode });
      const result = { ok: true, cleared: true, skipped: false, key, mode, diagnostic, snapshot: this.snapshot() };
      this._dispatchPersistenceEvent('surface-snapshot-cleared', result);
      return result;
    } catch (error) {
      const diagnostic = this._createPersistenceDiagnostic('xtend.surface.persistence.clear-failed', 'Persisted surface snapshot could not be cleared.', 'warning', {
        key,
        mode,
        error: error && error.message || String(error)
      });
      const result = { ok: false, cleared: false, skipped: true, diagnostic, snapshot: this.snapshot() };
      this._dispatchPersistenceEvent('surface-persistence-error', result);
      return result;
    }
  }

  resetSurfaceLayout(options = {}) {
    const clearResult = this.clearPersistedSnapshot({ reason: 'reset', ...options });
    const wasSuspended = this._snapshotPersistenceSuspended;
    this._snapshotPersistenceSuspended = true;
    if (this._controller && typeof this._controller.dispose === 'function') this._controller.dispose();
    this._controller = null;
    this._registeredElements.clear();
    this._surfaceLoadingStates.clear();
    this._surfaceLoadingPromises.clear();
    this._surfaceRouteHydrationPending.clear();
    this._surfaceRouteLifecycleStates.clear();
    this._surfaceLayoutStates.clear();
    this._lastSurfaceLayoutReport = null;
    this._surfaceRemotePolicyStates.clear();
    this._lastSurfaceRemotePolicyReport = null;
    this._currentSurfaceRoute = null;
    this._lastSurfaceRouteSignalKey = '';
    this._surfaceIdleHandles.forEach((handle) => clearSurfaceIdle(handle));
    this._surfaceIdleHandles.clear();
    this._ensureController();
    this._registerAssignedSurfaces();
    this._snapshotPersistenceSuspended = wasSuspended;
    const snapshot = this._applySnapshot();
    const persistResult = this.persistSnapshot(snapshot, { reason: 'reset' });
    const result = {
      ok: true,
      reset: true,
      clearResult,
      persistResult,
      snapshot,
      diagnostic: this._createPersistenceDiagnostic('xtend.surface.persistence.reset', 'Surface layout reset to declared defaults.', 'info')
    };
    this._dispatchPersistenceEvent('surface-snapshot-reset', result);
    return result;
  }

  _surfaceTrayRecords(snapshot = this.snapshot()) {
    const surfaces = Array.isArray(snapshot && snapshot.surfaces) ? snapshot.surfaces : [];
    return surfaces
      .filter(isSurfaceRecordTrayEligible)
      .sort((left, right) => {
        const leftHidden = isSurfaceRecordHidden(left) ? 0 : 1;
        const rightHidden = isSurfaceRecordHidden(right) ? 0 : 1;
        if (leftHidden !== rightHidden) return leftHidden - rightHidden;
        return (right.zIndex || 0) - (left.zIndex || 0);
      });
  }

  _surfaceTrayStateLabel(record = {}) {
    if (record.status === 'minimized' || record.minimized) return 'minimized';
    if (record.status === 'closed') return 'closed';
    if (record.collapsed) return 'collapsed';
    if (record.active) return 'active';
    return 'visible';
  }

  _createSurfaceTrayButton(record) {
    const button = document.createElement('button');
    const label = document.createElement('span');
    const state = document.createElement('span');
    const stateLabel = this._surfaceTrayStateLabel(record);
    const hidden = isSurfaceRecordHidden(record);
    const title = record.label || record.id;

    button.type = 'button';
    button.className = 'surface-tray-surface';
    button.dataset.surfaceTraySurface = record.id;
    button.dataset.state = hidden ? 'hidden' : 'visible';
    button.setAttribute('role', 'option');
    button.setAttribute('aria-selected', record.active ? 'true' : 'false');
    button.setAttribute('aria-label', `${hidden ? 'Restore' : 'Focus'} ${title}`);

    label.className = 'surface-tray-label';
    label.textContent = title;
    state.className = 'surface-tray-state';
    state.textContent = stateLabel;

    button.append(label, state);
    return button;
  }

  _renderSurfaceTray(snapshot = this.snapshot()) {
    if (!this._surfaceTray || !this._surfaceTrayList) return;
    const records = this._surfaceTrayRecords(snapshot);
    const hiddenRecords = records.filter(isSurfaceRecordHidden);
    const shouldShow = hiddenRecords.length > 0 || records.length > 1;

    this._surfaceTray.hidden = !shouldShow;
    if (!shouldShow) {
      this._surfaceTrayList.replaceChildren();
      if (this._surfaceTrayButton) this._surfaceTrayButton.setAttribute('aria-expanded', 'false');
      return;
    }

    const count = hiddenRecords.length > 0 ? hiddenRecords.length : records.length;
    const title = hiddenRecords.length > 0 ? 'Hidden surfaces' : 'Surfaces';
    if (this._surfaceTrayCount) this._surfaceTrayCount.textContent = String(count);
    if (this._surfaceTrayLabel) this._surfaceTrayLabel.textContent = title;
    if (this._surfaceTrayTitle) this._surfaceTrayTitle.textContent = title;
    if (this._surfaceTrayButton) {
      this._surfaceTrayButton.setAttribute('aria-label', `${title}: ${count}`);
      this._surfaceTrayButton.setAttribute('aria-expanded', 'false');
    }
    this._surfaceTrayList.replaceChildren(...records.map((record) => this._createSurfaceTrayButton(record)));
  }

  _activateSurfaceFromTray(record) {
    if (!record || !record.id) return null;
    if (record.status === 'minimized' || record.minimized) {
      return this.materializeSurface(record.id);
    }
    if (record.status === 'closed') {
      return this.materializeSurface(record.id);
    }
    if (record.collapsed) {
      return this.expandSurface(record.id, record.pinned ? 'pinned' : 'docked');
    }
    return this.focusSurface(record.id);
  }

  _onSurfaceTrayClick(event) {
    const surfaceControl = event.target && event.target.closest
      ? event.target.closest('[data-surface-tray-surface]')
      : null;
    if (surfaceControl) {
      event.preventDefault();
      const surfaceId = surfaceControl.getAttribute('data-surface-tray-surface');
      const record = this.snapshot().surfaces.find((surface) => surface.id === surfaceId);
      this._activateSurfaceFromTray(record);
      return;
    }

    const toggle = event.target && event.target.closest
      ? event.target.closest('[data-surface-tray-toggle]')
      : null;
    if (!toggle) return;
    const records = this._surfaceTrayRecords(this.snapshot());
    const hiddenRecords = records.filter(isSurfaceRecordHidden);
    if (hiddenRecords.length === 1) {
      event.preventDefault();
      this._activateSurfaceFromTray(hiddenRecords[0]);
      return;
    }
    const firstSurface = this._surfaceTrayList && this._surfaceTrayList.querySelector('[data-surface-tray-surface]');
    if (firstSurface && typeof firstSurface.focus === 'function') firstSurface.focus();
  }

  _onSurfaceTrayKeyDown(event) {
    if (event.key === 'Escape' && this._surfaceTrayButton && typeof this._surfaceTrayButton.focus === 'function') {
      event.preventDefault();
      this._surfaceTrayButton.focus();
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const controls = Array.from(this._surfaceTrayList ? this._surfaceTrayList.querySelectorAll('[data-surface-tray-surface]') : []);
    if (controls.length === 0) return;
    event.preventDefault();
    const index = controls.indexOf(event.target);
    const nextIndex = event.key === 'ArrowDown'
      ? (index + 1 + controls.length) % controls.length
      : (index - 1 + controls.length) % controls.length;
    const target = controls[index === -1 ? 0 : nextIndex];
    if (target && typeof target.focus === 'function') target.focus();
  }

  _commit(method, eventName, id, payload) {
    const controller = this._ensureController();
    if (method === 'openSurface' || method === 'focusSurface' || method === 'materializeSurface') {
      this._captureStackFocusRestoreTarget(id);
    }
    const result = controller[method](id, payload);
    const snapshot = this._applySnapshot();
    this.persistSnapshot(snapshot, { reason: method });
    this._dispatchManagerEvent(eventName, { result, snapshot });
    return result;
  }

  _applyPersistedSurfaceSnapshot(snapshot, options = {}) {
    const controller = this._ensureController();
    const surfaces = Array.isArray(snapshot && snapshot.surfaces) ? snapshot.surfaces : [];
    const byId = new Map(surfaces.map((record) => [record.id, record]));
    const stack = Array.isArray(snapshot && snapshot.stack) && snapshot.stack.length > 0
      ? snapshot.stack.filter((id) => byId.has(id))
      : surfaces.slice().sort((left, right) => (left.zIndex || 0) - (right.zIndex || 0)).map((record) => record.id);
    const wasSuspended = this._snapshotPersistenceSuspended;
    const wasRestoring = this._restoringSnapshot;
    let restoredCount = 0;
    let skippedCount = 0;

    this._snapshotPersistenceSuspended = true;
    this._restoringSnapshot = true;
    try {
      surfaces.forEach((record) => {
        const patchResult = controller.updateSurface(record.id, {
          label: record.label,
          capabilities: record.capabilities,
          bounds: record.bounds,
          placement: record.placement,
          mode: record.mode,
          pinned: record.pinned,
          collapsed: record.collapsed,
          modal: record.modal
        });
        if (!patchResult || patchResult.ok === false) {
          skippedCount += 1;
          return;
        }
        if (record.status === 'closed') {
          controller.closeSurface(record.id, 'snapshot-restore');
        } else {
          controller.openSurface(record.id, { bounds: record.bounds });
          if (record.status === 'minimized' || record.minimized) controller.minimizeSurface(record.id);
          if (record.maximized) controller.maximizeSurface(record.id);
        }
        restoredCount += 1;
      });
      stack.forEach((surfaceId) => {
        const record = byId.get(surfaceId);
        if (record && record.status !== 'closed' && record.status !== 'minimized') controller.focusSurface(surfaceId);
      });
      if (snapshot.activeSurfaceId && byId.has(snapshot.activeSurfaceId)) {
        const activeRecord = byId.get(snapshot.activeSurfaceId);
        if (activeRecord.status !== 'closed' && activeRecord.status !== 'minimized') controller.focusSurface(snapshot.activeSurfaceId);
      }
    } finally {
      this._snapshotPersistenceSuspended = wasSuspended;
      this._restoringSnapshot = wasRestoring;
    }

    const appliedSnapshot = this._applySnapshot();
    const diagnostic = this._createPersistenceDiagnostic(
      restoredCount > 0 ? 'xtend.surface.persistence.restored' : 'xtend.surface.persistence.restore-skipped',
      restoredCount > 0 ? 'Surface snapshot restored.' : 'Surface snapshot restore skipped.',
      restoredCount > 0 ? 'info' : 'warning',
      {
        source: options.source || 'manual',
        restoredCount,
        skippedCount,
        stackDepth: stack.length,
        activeSurfaceId: snapshot.activeSurfaceId || null
      }
    );
    return { restoredCount, skippedCount, snapshot: appliedSnapshot, diagnostic };
  }

  _applySnapshot(options = {}) {
    let snapshot = this.snapshot();
    if (options.skipLayoutEngine !== true) {
      const layoutResult = this._applyLayoutEngineSnapshot(snapshot, {
        source: 'applySnapshot',
        commit: true,
        dispatch: false
      });
      snapshot = layoutResult && layoutResult.snapshot || snapshot;
    }
    snapshot.surfaces.forEach((record) => {
      const element = this._registeredElements.get(record.id)
        || this.querySelector(surfaceElementSelector(record.id));
      if (element && isSurfaceOverlayElement(element)) {
        this._syncingOverlayElements.add(element);
        try {
          applyOverlaySurfaceSnapshot(element, record);
        } finally {
          queueMicrotask(() => this._syncingOverlayElements.delete(element));
        }
      } else if (element && typeof element.applySurfaceSnapshot === 'function') {
        element.applySurfaceSnapshot(record);
      }
      if (element) {
        this._applyRemoteSurfacePolicyDom(element, this._surfaceRemotePolicyStates.get(record.id));
        this._prepareSurfaceLoading(element, record, { reason: 'applySnapshot' });
      }
    });
    if (this._lastSurfaceLayoutReport) this._applySurfaceLayoutDom(this._lastSurfaceLayoutReport);
    this._applyStackPolicy(snapshot, { source: 'applySnapshot' });
    this._renderSurfaceTray(snapshot);
    this._status.textContent = snapshot.activeSurfaceId ? `Active surface ${snapshot.activeSurfaceId}` : 'No active surface';
    return snapshot;
  }

  _onSurfaceCommand(event) {
    const detail = event.detail || {};
    const { payload } = detail;
    const rawCommand = detail.command;
    const surfaceId = detail.surfaceId || detail.id;
    if (!surfaceId || !rawCommand) return;
    event.stopPropagation();
    const command = {
      show: 'materialize',
      hide: 'close',
      dismiss: 'close'
    }[rawCommand] || rawCommand;
    const commands = {
      open: () => this.openSurface(surfaceId, payload),
      materialize: () => this.materializeSurface(surfaceId, payload),
      close: () => this.closeSurface(surfaceId, payload && payload.reason),
      toggle: () => this.toggleSurface(surfaceId, payload),
      focus: () => this.focusSurface(surfaceId),
      move: () => this.moveSurface(surfaceId, payload),
      resize: () => this.resizeSurface(surfaceId, payload),
      minimize: () => this.minimizeSurface(surfaceId),
      maximize: () => this.maximizeSurface(surfaceId),
      restore: () => this.restoreSurface(surfaceId),
      pin: () => this.pinSurface(surfaceId, payload && payload.pinned !== false),
      unpin: () => this.pinSurface(surfaceId, false),
      collapse: () => this.collapseSurface(surfaceId),
      expand: () => this.expandSurface(surfaceId, payload && payload.mode || 'docked'),
      dock: () => this.dockSurface(surfaceId, payload && payload.placement || 'right', payload && payload.mode || 'docked'),
      update: () => this.updateSurface(surfaceId, payload)
    };
    if (commands[command]) commands[command]();
  }

  _onOverlayLifecycle(event) {
    const element = findSurfaceOverlayElement(event);
    if (!element || !this.contains(element) || this._syncingOverlayElements.has(element)) return;
    const surfaceId = overlaySurfaceId(element);
    const wasRegistered = this._registeredElements.has(surfaceId);

    if (!wasRegistered) {
      this.registerSurface(element);
      return;
    }

    const detail = event.detail || {};
    if (event.type.endsWith('-opened') || event.type === 'toast-shown') {
      this.openSurface(surfaceId, {
        source: detail.source || event.type,
        legacyEvent: event.type
      });
      return;
    }

    if (event.type.endsWith('-closed') || event.type === 'toast-dismissed') {
      this.closeSurface(surfaceId, detail.source || event.type);
      return;
    }

    if (event.type === 'drawer-route-selected') {
      this.updateSurface(surfaceId, {
        routeRef: detail.routeRef || null,
        legacyEvent: event.type
      });
    }
  }

  _onSurfaceRouteSignal(event) {
    const route = this._normalizeRouteLifecycleInput(event);
    const routeSignalKey = `${route.normalizedPath}|${route.routeId || ''}|${route.component || ''}`;
    if (routeSignalKey && this._lastSurfaceRouteSignalKey === routeSignalKey) return null;
    this._lastSurfaceRouteSignalKey = routeSignalKey;
    const lifecycleResult = this._routeAware()
      ? this.applyRouteLifecycle(route, { source: event && event.type || 'route-signal' })
      : null;
    if (this._surfaceRouteHydrationPending.size === 0) return lifecycleResult;
    const pending = Array.from(this._surfaceRouteHydrationPending);
    pending.forEach((surfaceId) => {
      const element = this._resolveSurfaceElement(surfaceId);
      const record = this._resolveSurfaceRecord(surfaceId, element);
      const config = this._resolveSurfaceRouteConfig(element, record || { id: surfaceId });
      if (this._routeAware() && !config.global && !this._surfaceRouteMatches(config, route)) return;
      this.hydrateSurfaceContent(surfaceId, {
        policy: 'route',
        reason: event && event.type || 'surface.route.hydrate',
        force: true
      });
    });
    return lifecycleResult;
  }

  _onSurfaceStackKeyDown(event) {
    if (!event || event.key !== 'Escape' || event.defaultPrevented) return;
    const stackPolicy = this.snapshotStackPolicy();
    const surfaceId = stackPolicy.escapeTargetSurfaceId;
    if (!surfaceId) return;
    const eventPath = typeof event.composedPath === 'function' ? event.composedPath() : [];
    const eventTarget = eventPath[0] || event.target;
    const eventInsideManager = eventPath.includes(this) || surfaceElementContainsTarget(this, eventTarget);
    if (!eventInsideManager) return;
    const entry = stackPolicy.surfaces.find((surface) => surface.surfaceId === surfaceId);
    if (!entry || !entry.open) return;
    if (typeof event.preventDefault === 'function') event.preventDefault();
    if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    if (typeof event.stopPropagation === 'function') event.stopPropagation();
    const result = this.closeSurface(surfaceId, 'escape');
    this._dispatchSurfaceStackPolicyEvent('surface-stack-policy-escape', {
      ok: result && result.ok !== false,
      surfaceId,
      result,
      stackPolicy,
      snapshot: this.snapshot()
    });
  }

  _onSurfaceStackFocusIn(event) {
    if (!event || !this._activeStackModalSurfaceId) return;
    const element = this._resolveStackElement(this._activeStackModalSurfaceId);
    if (!element || surfaceElementContainsTarget(element, event.target)) return;
    if (typeof event.stopPropagation === 'function') event.stopPropagation();
    this._ensureStackFocusWithinSurface(this._activeStackModalSurfaceId, { source: 'focusin-trap' });
  }

  _dispatchManagerEvent(type, detail) {
    const snapshot = detail.snapshot || this.snapshot();
    this.dispatchEvent(new CustomEvent(type, {
      bubbles: true,
      composed: true,
      detail: {
        managerId: this._managerId(),
        result: detail.result,
        snapshot
      }
    }));
  }
}

if (!customElements.get('x-surface-manager')) {
  customElements.define('x-surface-manager', XSurfaceManager);
}

export { XSurfaceManager };
