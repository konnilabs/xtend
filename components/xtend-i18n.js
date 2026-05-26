import { xstate as defaultXState } from './xstate.js';

const XTEND_I18N_BOUNDARY_SCHEMA = 'xtend.i18n.boundary-probe.v1';
const XTEND_I18N_LABELS_SCHEMA = 'xtend.i18n.labels.v1';
const XTEND_I18N_LABEL_RECORD_SCHEMA = 'xtend.i18n.label-record.v1';
const XTEND_I18N_SNAPSHOT_SCHEMA = 'xtend.i18n.snapshot.v1';
const XTEND_I18N_DIAGNOSTICS_SCHEMA = 'xtend.i18n.diagnostics.v1';
const XTEND_I18N_EVENT_SCHEMA = 'xtend.i18n.locale-event.v1';
const XTEND_I18N_COMPONENT_LABEL_CONTRACT_SCHEMA = 'xtend.i18n.component-label-contract.v1';
const XTEND_I18N_ROUTER_ADAPTER_SCHEMA = 'xtend.i18n.xrouter-adapter.v1';
const XTEND_I18N_XSTATE_ADAPTER_SCHEMA = 'xtend.i18n.xstate-adapter.v1';
const XTEND_I18N_KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-xtend-types';
const XTEND_I18N_MANAGED_ATTR = 'data-xtend-i18n-managed';

const DEFAULT_STATE_KEYS = Object.freeze({
  locale: 'xtend.i18n.locale',
  request: 'xtend.i18n.locale.request',
  target: 'xtend.i18n.target',
  source: 'xtend.i18n.source',
  status: 'xtend.i18n.status',
  busy: 'xtend.i18n.busy',
  available: 'xtend.i18n.available',
  fallback: 'xtend.i18n.fallback',
  event: 'xtend.i18n.event',
  error: 'xtend.i18n.error'
});

const DEFAULT_COMPONENT_TAGS = Object.freeze([
  'x-alert',
  'x-button',
  'x-calendar',
  'x-cards',
  'x-checkbox',
  'x-code',
  'x-dialog',
  'x-drawer',
  'x-footer',
  'x-form',
  'x-header',
  'x-hero',
  'x-icon',
  'x-input',
  'x-lightbox',
  'x-link',
  'x-masonry',
  'x-menu',
  'x-modal',
  'x-player',
  'x-popover',
  'x-progress',
  'x-radio',
  'x-rmt-lifecycle-demo-build',
  'x-router',
  'x-section',
  'x-select',
  'x-side-panel',
  'x-spinner',
  'x-status',
  'x-summary',
  'x-surface-manager',
  'x-surface-portal',
  'x-surface-region',
  'x-surface-window',
  'x-tabs',
  'x-textarea',
  'x-theme',
  'x-toast',
  'x-tooltip',
  'x-type',
  'x-utils',
  'x-writer'
]);

const DEFAULT_LABEL_FIELDS = Object.freeze([
  ['label', 'attribute', 'label'],
  ['ariaLabel', 'attribute', 'aria-label'],
  ['placeholder', 'attribute', 'placeholder'],
  ['title', 'attribute', 'title'],
  ['alt', 'attribute', 'alt'],
  ['fallbackLabel', 'shadow-fallback', 'label'],
  ['closeLabel', 'shadow-attribute', 'aria-label'],
  ['loadingLabel', 'shadow-attribute', 'aria-label'],
  ['emptyLabel', 'text', 'textContent'],
  ['routeLoading', 'attribute', 'skeleton-label']
]);

function nowIso() {
  return new Date().toISOString();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeLocale(value, fallback = 'en') {
  const raw = String(value || '').trim().toLowerCase().replace(/_/g, '-');
  return raw || fallback;
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function unique(values) {
  return Array.from(new Set((values || []).map((value) => normalizeLocale(value)).filter(Boolean)));
}

function getWindow() {
  return typeof window !== 'undefined' ? window : null;
}

function getDocument() {
  return typeof document !== 'undefined' ? document : null;
}

function dispatchWindowEvent(name, detail) {
  const target = getWindow();
  if (!target || typeof target.dispatchEvent !== 'function' || typeof CustomEvent === 'undefined') return;
  target.dispatchEvent(new CustomEvent(name, { detail }));
}

function getBundleLabels(bundle) {
  const payload = bundle && bundle.default ? bundle.default : bundle;
  if (!payload) return {};
  if (payload.labels && typeof payload.labels === 'object') return payload.labels;
  return typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
}

function normalizeBundleLocale(locale, bundle) {
  const payload = bundle && bundle.default ? bundle.default : bundle;
  return normalizeLocale(payload && payload.locale ? payload.locale : locale);
}

function createComponentLabelContract(tag) {
  return Object.freeze({
    schema: XTEND_I18N_COMPONENT_LABEL_CONTRACT_SCHEMA,
    componentRef: tag,
    mode: 'optional-runtime-labels',
    explicitAuthoringWins: true,
    labels: DEFAULT_LABEL_FIELDS.map(([field, target, attribute]) => Object.freeze({
      key: `${tag}.${field}`,
      field,
      target,
      attribute
    }))
  });
}

const COMPONENT_LABEL_CONTRACTS = new Map(DEFAULT_COMPONENT_TAGS.map((tag) => [
  tag,
  createComponentLabelContract(tag)
]));

const state = {
  locale: 'en',
  fallbackLocale: 'en',
  available: ['en'],
  labelsByLocale: new Map(),
  loadersByLocale: new Map(),
  loadedLocales: new Set(),
  loadingLocales: new Map(),
  bindings: new WeakMap(),
  xstate: null,
  xstateUnsubscribe: null,
  stateKeys: { ...DEFAULT_STATE_KEYS },
  routerConnections: new Set(),
  customElementsPatched: false,
  nativeDefine: null,
  diagnostics: [],
  operationCounts: {
    configure: 0,
    registerLabels: 0,
    loadLocale: 0,
    setLocale: 0,
    applyLabels: 0,
    bindComponent: 0,
    connectXState: 0,
    connectRouter: 0,
    localeEvents: 0,
    errors: 0
  },
  transitionToken: 0
};

function increment(operation) {
  state.operationCounts[operation] = (state.operationCounts[operation] || 0) + 1;
}

function recordDiagnostic(code, level, message, metadata = {}) {
  const diagnostic = {
    schema: XTEND_I18N_DIAGNOSTICS_SCHEMA,
    code,
    level,
    message,
    source: 'xtend-i18n',
    metadata,
    timestamp: nowIso()
  };
  state.diagnostics.push(diagnostic);
  if (state.diagnostics.length > 50) state.diagnostics.shift();
  if (level === 'error') increment('errors');
  dispatchWindowEvent('xtend-i18n-diagnostic', diagnostic);
  return diagnostic;
}

function getLocaleLabels(locale = state.locale) {
  return state.labelsByLocale.get(normalizeLocale(locale, state.fallbackLocale)) || {};
}

function readLabelValue(key, fallback = '') {
  const activeLabels = getLocaleLabels(state.locale);
  if (Object.prototype.hasOwnProperty.call(activeLabels, key)) return activeLabels[key];
  const fallbackLabels = getLocaleLabels(state.fallbackLocale);
  if (Object.prototype.hasOwnProperty.call(fallbackLabels, key)) return fallbackLabels[key];
  return fallback;
}

function getLabelRecord(key, fallback = '') {
  const activeLabels = getLocaleLabels(state.locale);
  const fallbackLabels = getLocaleLabels(state.fallbackLocale);
  const foundInActive = Object.prototype.hasOwnProperty.call(activeLabels, key);
  const foundInFallback = Object.prototype.hasOwnProperty.call(fallbackLabels, key);
  const value = foundInActive ? activeLabels[key] : (foundInFallback ? fallbackLabels[key] : fallback);
  return {
    schema: XTEND_I18N_LABEL_RECORD_SCHEMA,
    key,
    locale: state.locale,
    fallbackLocale: state.fallbackLocale,
    value,
    found: foundInActive || foundInFallback,
    source: foundInActive ? state.locale : (foundInFallback ? state.fallbackLocale : 'fallback')
  };
}

function makeLabelApi() {
  return {
    schema: XTEND_I18N_LABELS_SCHEMA,
    locale: state.locale,
    fallbackLocale: state.fallbackLocale,
    getLabelRecord,
    getLabel(key, fallback = '') {
      return getLabelRecord(key, fallback).value;
    }
  };
}

function publishState(values = {}) {
  const api = state.xstate;
  if (!api || typeof api.set !== 'function') return;
  Object.entries(values).forEach(([name, value]) => {
    const key = state.stateKeys[name];
    if (key) api.set(key, value);
  });
}

function normalizeLabels(locale, bundle) {
  const normalizedLocale = normalizeBundleLocale(locale, bundle);
  return {
    schema: XTEND_I18N_LABELS_SCHEMA,
    locale: normalizedLocale,
    labels: { ...getBundleLabels(bundle) }
  };
}

function registerLabels(locale, bundleOrLoader) {
  increment('registerLabels');
  const normalizedLocale = normalizeLocale(locale, state.fallbackLocale);
  if (typeof bundleOrLoader === 'function' || typeof bundleOrLoader === 'string' ||
      (bundleOrLoader && typeof bundleOrLoader.then === 'function')) {
    const loader = typeof bundleOrLoader === 'function'
      ? bundleOrLoader
      : (typeof bundleOrLoader === 'string'
        ? () => import(bundleOrLoader)
        : () => bundleOrLoader);
    state.loadersByLocale.set(normalizedLocale, loader);
  } else {
    const bundle = normalizeLabels(normalizedLocale, bundleOrLoader);
    state.labelsByLocale.set(bundle.locale, {
      ...getLocaleLabels(bundle.locale),
      ...bundle.labels
    });
    state.loadedLocales.add(bundle.locale);
  }
  state.available = unique([...state.available, normalizedLocale]);
  publishState({
    available: state.available.slice(),
    fallback: state.fallbackLocale
  });
  return snapshot();
}

async function loadLocale(locale) {
  increment('loadLocale');
  const normalizedLocale = normalizeLocale(locale, state.fallbackLocale);
  if (state.loadedLocales.has(normalizedLocale)) {
    return {
      schema: XTEND_I18N_LABELS_SCHEMA,
      locale: normalizedLocale,
      labels: getLocaleLabels(normalizedLocale),
      cacheHit: true
    };
  }
  if (state.loadingLocales.has(normalizedLocale)) {
    return state.loadingLocales.get(normalizedLocale);
  }
  const loader = state.loadersByLocale.get(normalizedLocale);
  if (!loader) {
    recordDiagnostic('xtend.i18n.labels.missing_loader', 'warn', 'No label loader registered for locale.', {
      locale: normalizedLocale
    });
    return {
      schema: XTEND_I18N_LABELS_SCHEMA,
      locale: normalizedLocale,
      labels: getLocaleLabels(normalizedLocale),
      cacheHit: false,
      missingLoader: true
    };
  }
  const promise = Promise.resolve()
    .then(() => loader(normalizedLocale))
    .then((module) => {
      const bundle = normalizeLabels(normalizedLocale, module);
      state.labelsByLocale.set(bundle.locale, {
        ...getLocaleLabels(bundle.locale),
        ...bundle.labels
      });
      state.loadedLocales.add(bundle.locale);
      state.available = unique([...state.available, bundle.locale]);
      dispatchWindowEvent('xtend-i18n-labels-loaded', {
        schema: XTEND_I18N_LABELS_SCHEMA,
        locale: bundle.locale,
        labelCount: Object.keys(bundle.labels).length
      });
      return {
        ...bundle,
        cacheHit: false
      };
    })
    .catch((error) => {
      const message = error && error.message ? error.message : String(error);
      recordDiagnostic('xtend.i18n.labels.load_failed', 'error', 'Label bundle could not be loaded.', {
        locale: normalizedLocale,
        message
      });
      publishState({
        status: 'error',
        busy: false,
        error: { locale: normalizedLocale, message }
      });
      throw error;
    })
    .finally(() => {
      state.loadingLocales.delete(normalizedLocale);
    });
  state.loadingLocales.set(normalizedLocale, promise);
  return promise;
}

function applyAttributeIfHostDidNotAuthor(element, attribute, value) {
  if (!element || !attribute || value === undefined || value === null || value === '') return false;
  const managedAttribute = `${XTEND_I18N_MANAGED_ATTR}-${attribute}`;
  const currentValue = element.getAttribute(attribute);
  const managedValue = element.getAttribute(managedAttribute);
  const hasAuthorValue = element.hasAttribute(attribute) && managedValue !== currentValue;
  if (hasAuthorValue) return false;
  element.setAttribute(attribute, String(value));
  element.setAttribute(managedAttribute, String(value));
  return true;
}

function elementHasAuthorText(element) {
  if (!element) return false;
  return Array.from(element.childNodes || []).some((node) => (
    node.nodeType === 3 && String(node.textContent || '').trim()
  )) || Array.from(element.children || []).some((child) => (
    !child.hasAttribute || !child.hasAttribute('slot') || child.getAttribute('slot') === ''
  ));
}

function slotHasAssignedContent(slot) {
  if (!slot || typeof slot.assignedNodes !== 'function') return false;
  return slot.assignedNodes({ flatten: true }).some((node) => (
    node.nodeType === 1 || String(node.textContent || '').trim()
  ));
}

function applyShadowLabel(element, selector, attribute, value) {
  const root = element && element.shadowRoot;
  if (!root || !value) return false;
  let changed = false;
  Array.from(root.querySelectorAll(selector)).forEach((node) => {
    if (!node || typeof node.setAttribute !== 'function') return;
    const managedAttribute = `${XTEND_I18N_MANAGED_ATTR}-${attribute}`;
    const currentValue = node.getAttribute(attribute);
    const managedValue = node.getAttribute(managedAttribute);
    const hasAuthorValue = node.hasAttribute(attribute) && managedValue !== currentValue;
    if (hasAuthorValue) return;
    node.setAttribute(attribute, String(value));
    node.setAttribute(managedAttribute, String(value));
    changed = true;
  });
  return changed;
}

function applyFallbackLabel(element, value) {
  if (!element || !value || elementHasAuthorText(element)) {
    return false;
  }
  const labelIsAuthored = element.hasAttribute('label') &&
    element.getAttribute(`${XTEND_I18N_MANAGED_ATTR}-label`) !== element.getAttribute('label');
  const ariaLabelIsAuthored = element.hasAttribute('aria-label') &&
    element.getAttribute(`${XTEND_I18N_MANAGED_ATTR}-aria-label`) !== element.getAttribute('aria-label');
  if (labelIsAuthored || ariaLabelIsAuthored) return false;
  const hostApplied = applyAttributeIfHostDidNotAuthor(element, 'label', value);
  const root = element.shadowRoot;
  if (!root) return hostApplied;
  const slot = root.querySelector('slot');
  if (slotHasAssignedContent(slot)) return false;
  const fallback = root.querySelector('.fallback-label, [part~="label-fallback"]');
  if (fallback) {
    fallback.textContent = String(value);
    fallback.setAttribute(XTEND_I18N_MANAGED_ATTR, 'true');
    return true;
  }
  return hostApplied;
}

function genericApplyI18nLabels(labelsApi = makeLabelApi(), context = {}) {
  const element = this;
  const tag = (context.componentRef || element.localName || '').toLowerCase();
  const contract = context.contract || element.constructor.xtendI18nLabelContract || COMPONENT_LABEL_CONTRACTS.get(tag);
  if (!contract) return { applied: 0 };
  let applied = 0;
  contract.labels.forEach((entry) => {
    const record = labelsApi.getLabelRecord(entry.key, '');
    if (!record.found || record.value === '') return;
    if (entry.field === 'fallbackLabel') {
      if (applyFallbackLabel(element, record.value)) applied += 1;
    } else if (entry.field === 'closeLabel') {
      if (applyShadowLabel(element, '[part~="close"], [part~="close-button"], button[aria-label="Close"], button[aria-label="Schliessen"]', 'aria-label', record.value)) applied += 1;
    } else if (entry.field === 'loadingLabel') {
      if (applyShadowLabel(element, '[data-xtend-skeleton-loader], [part~="spinner"], [role="status"]', 'aria-label', record.value)) applied += 1;
    } else if (entry.field === 'emptyLabel') {
      if (!elementHasAuthorText(element) && !element.textContent.trim()) {
        element.textContent = String(record.value);
        element.setAttribute(XTEND_I18N_MANAGED_ATTR, 'text');
        applied += 1;
      }
    } else if (applyAttributeIfHostDidNotAuthor(element, entry.attribute, record.value)) {
      applied += 1;
    }
  });
  return { applied };
}

function enhanceConstructor(tag, ctor) {
  if (!ctor || typeof ctor !== 'function') return ctor;
  const normalizedTag = String(tag || '').toLowerCase();
  const contract = COMPONENT_LABEL_CONTRACTS.get(normalizedTag) || (
    normalizedTag.startsWith('x-') ? createComponentLabelContract(normalizedTag) : null
  );
  if (!contract) return ctor;
  if (!Object.prototype.hasOwnProperty.call(ctor, 'xtendI18nLabelContract')) {
    try {
      Object.defineProperty(ctor, 'xtendI18nLabelContract', {
        configurable: true,
        enumerable: true,
        get() {
          return contract;
        }
      });
    } catch (_) {}
  }
  if (!ctor.prototype.applyI18nLabels) {
    try {
      Object.defineProperty(ctor.prototype, 'applyI18nLabels', {
        configurable: true,
        writable: true,
        value: genericApplyI18nLabels
      });
    } catch (_) {}
  }
  return ctor;
}

function patchCustomElementsDefine() {
  const target = getWindow();
  if (!target || !target.customElements || state.customElementsPatched) return false;
  state.nativeDefine = target.customElements.define.bind(target.customElements);
  target.customElements.define = function defineWithI18nContract(tag, ctor, options) {
    enhanceConstructor(tag, ctor);
    return state.nativeDefine(tag, ctor, options);
  };
  state.customElementsPatched = true;
  return true;
}

function collectApplyTargets(root) {
  const doc = getDocument();
  const targetRoot = root || doc;
  if (!targetRoot) return [];
  const targets = [];
  if (targetRoot.nodeType === 1) targets.push(targetRoot);
  if (typeof targetRoot.querySelectorAll === 'function') {
    targets.push(...Array.from(targetRoot.querySelectorAll('*')));
  }
  return targets;
}

function applyDataI18nBinding(element) {
  if (!element || typeof element.getAttribute !== 'function') return 0;
  const key = element.getAttribute('data-i18n-key') || element.getAttribute('i18n-key');
  if (!key) return 0;
  const record = getLabelRecord(key, '');
  if (!record.found || record.value === '') return 0;
  const attribute = element.getAttribute('data-i18n-attr') || element.getAttribute('i18n-attr') || '';
  if (attribute) {
    element.setAttribute(attribute, String(record.value));
  } else {
    element.textContent = String(record.value);
  }
  element.setAttribute(XTEND_I18N_MANAGED_ATTR, key);
  return 1;
}

function isXTendComponentElement(element) {
  return Boolean(element && element.localName && (
    COMPONENT_LABEL_CONTRACTS.has(element.localName) ||
    /^x-[a-z0-9-]+$/u.test(element.localName)
  ));
}

function bindComponent(element, contract) {
  if (!element || !isXTendComponentElement(element)) return null;
  increment('bindComponent');
  const tag = element.localName;
  const resolvedContract = contract || COMPONENT_LABEL_CONTRACTS.get(tag) || createComponentLabelContract(tag);
  if (!COMPONENT_LABEL_CONTRACTS.has(tag)) COMPONENT_LABEL_CONTRACTS.set(tag, resolvedContract);
  enhanceConstructor(tag, element.constructor);
  state.bindings.set(element, {
    schema: XTEND_I18N_COMPONENT_LABEL_CONTRACT_SCHEMA,
    tag,
    contract: resolvedContract,
    boundAt: nowIso()
  });
  if (typeof element.applyI18nLabels === 'function') {
    element.applyI18nLabels(makeLabelApi(), {
      componentRef: tag,
      contract: resolvedContract,
      source: 'xtend-i18n.bindComponent'
    });
  }
  return resolvedContract;
}

function applyLabels(root) {
  increment('applyLabels');
  patchCustomElementsDefine();
  let applied = 0;
  collectApplyTargets(root).forEach((element) => {
    applied += applyDataI18nBinding(element);
    if (isXTendComponentElement(element)) {
      bindComponent(element);
      applied += 1;
    }
  });
  const detail = {
    schema: XTEND_I18N_EVENT_SCHEMA,
    type: 'LABELS_APPLIED',
    locale: state.locale,
    applied,
    source: 'xtend-i18n',
    timestamp: nowIso()
  };
  dispatchWindowEvent('xtend-i18n-labels-applied', detail);
  return detail;
}

function createLocaleEvent(type, locale, previousLocale, options = {}) {
  return {
    schema: XTEND_I18N_EVENT_SCHEMA,
    type,
    locale,
    previousLocale: previousLocale || null,
    changed: previousLocale !== locale,
    source: options.source || 'api',
    available: state.available.slice(),
    fallbackLocale: state.fallbackLocale,
    token: options.token || state.transitionToken,
    timestamp: nowIso()
  };
}

async function setLocale(locale, options = {}) {
  increment('setLocale');
  const targetLocale = normalizeLocale(locale, state.fallbackLocale);
  const previousLocale = state.locale;
  const token = ++state.transitionToken;
  publishState({
    target: targetLocale,
    source: options.source || 'api',
    status: 'loading',
    busy: true,
    error: null
  });
  dispatchWindowEvent('xtend-i18n-locale-changing', createLocaleEvent('LOCALE_CHANGING', targetLocale, previousLocale, {
    ...options,
    token
  }));
  try {
    await loadLocale(targetLocale);
    state.locale = targetLocale;
    state.available = unique([...state.available, targetLocale]);
    const event = createLocaleEvent('LOCALE_CHANGED', targetLocale, previousLocale, {
      ...options,
      token
    });
    increment('localeEvents');
    applyLabels();
    publishState({
      locale: targetLocale,
      target: targetLocale,
      source: options.source || 'api',
      status: 'ready',
      busy: false,
      available: state.available.slice(),
      fallback: state.fallbackLocale,
      event,
      error: null
    });
    dispatchWindowEvent('xtend-i18n-locale-changed', event);
    return event;
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    const detail = {
      schema: XTEND_I18N_EVENT_SCHEMA,
      type: 'LOCALE_CHANGE_FAILED',
      locale: targetLocale,
      previousLocale,
      source: options.source || 'api',
      error: message,
      token,
      timestamp: nowIso()
    };
    publishState({
      target: targetLocale,
      status: 'error',
      busy: false,
      error: detail
    });
    dispatchWindowEvent('xtend-i18n-error', detail);
    throw error;
  }
}

function getLocale() {
  return state.locale;
}

function configure(options = {}) {
  increment('configure');
  const config = asObject(options);
  state.fallbackLocale = normalizeLocale(config.fallbackLocale || config.defaultLocale || state.fallbackLocale, state.fallbackLocale);
  state.locale = normalizeLocale(config.locale || config.defaultLocale || state.locale, state.fallbackLocale);
  state.available = unique([
    state.fallbackLocale,
    state.locale,
    ...(Array.isArray(config.available) ? config.available : [])
  ]);
  state.stateKeys = {
    ...DEFAULT_STATE_KEYS,
    ...asObject(config.stateKeys)
  };
  Object.entries(asObject(config.labels)).forEach(([locale, labels]) => registerLabels(locale, {
    schema: XTEND_I18N_LABELS_SCHEMA,
    locale,
    labels
  }));
  Object.entries(asObject(config.labelLoaders)).forEach(([locale, loader]) => registerLabels(locale, loader));
  patchCustomElementsDefine();
  publishState({
    locale: state.locale,
    target: state.locale,
    status: 'ready',
    busy: false,
    available: state.available.slice(),
    fallback: state.fallbackLocale,
    error: null
  });
  if (config.apply !== false) applyLabels(config.root);
  return snapshot();
}

function connectXState(xstateApi = defaultXState, options = {}) {
  increment('connectXState');
  if (state.xstateUnsubscribe) {
    state.xstateUnsubscribe();
    state.xstateUnsubscribe = null;
  }
  state.xstate = xstateApi || null;
  if (options.stateKeys) {
    state.stateKeys = {
      ...state.stateKeys,
      ...options.stateKeys
    };
  }
  publishState({
    locale: state.locale,
    target: state.locale,
    status: 'ready',
    busy: false,
    available: state.available.slice(),
    fallback: state.fallbackLocale,
    error: null
  });
  if (state.xstate && typeof state.xstate.subscribe === 'function') {
    state.xstateUnsubscribe = state.xstate.subscribe((key, value) => {
      if (key !== state.stateKeys.request) return;
      const requestedLocale = typeof value === 'string' ? value : (value && (value.locale || value.targetLocale));
      if (requestedLocale && normalizeLocale(requestedLocale, state.fallbackLocale) !== state.locale) {
        setLocale(requestedLocale, { source: 'xstate' }).catch(() => {});
      }
    }, state.stateKeys.request);
  }
  return {
    schema: XTEND_I18N_XSTATE_ADAPTER_SCHEMA,
    stateKeys: { ...state.stateKeys },
    locale: state.locale,
    dispose() {
      if (state.xstateUnsubscribe) state.xstateUnsubscribe();
      state.xstateUnsubscribe = null;
      state.xstate = null;
    }
  };
}

function getCurrentPathFromRouter(router) {
  if (router && typeof router._getCurrentPath === 'function') {
    try { return router._getCurrentPath(); } catch (_) {}
  }
  const target = getWindow();
  if (!target || !target.location) return '/';
  if (target.location.hash && target.location.hash.startsWith('#/')) {
    return target.location.hash.replace(/^#\/?/u, '/');
  }
  return target.location.pathname + target.location.search;
}

function parsePath(path) {
  const raw = String(path || '/');
  const [withoutHash] = raw.split('#');
  const [pathname, query = ''] = withoutHash.split('?');
  const params = new URLSearchParams(query);
  return { pathname: pathname || '/', params };
}

function localeFromPath(path, options = {}) {
  const queryParam = options.queryParam || 'lang';
  const mode = options.urlMode || 'both';
  const fallbackToCurrent = options.fallbackToCurrent !== false;
  const parsed = parsePath(path);
  const queryLocale = mode !== 'prefix' ? parsed.params.get(queryParam) : null;
  if (queryLocale) return normalizeLocale(queryLocale, state.fallbackLocale);
  if (mode === 'query') return fallbackToCurrent ? (state.locale || state.fallbackLocale) : null;
  const firstSegment = parsed.pathname.replace(/^\/+/u, '').split('/')[0];
  const normalizedFirst = normalizeLocale(firstSegment, '');
  if (state.available.includes(normalizedFirst)) return normalizedFirst;
  return fallbackToCurrent ? state.locale : null;
}

function stripLocalePrefixFromPath(path, options = {}) {
  const mode = options.urlMode || 'both';
  if (mode === 'query') return path;
  const parsed = parsePath(path);
  const segments = parsed.pathname.replace(/^\/+/u, '').split('/').filter(Boolean);
  const first = normalizeLocale(segments[0], '');
  if (!state.available.includes(first)) return path;
  const strippedPath = '/' + segments.slice(1).join('/');
  const query = parsed.params.toString();
  return (strippedPath === '/' ? '/' : strippedPath) + (query ? `?${query}` : '');
}

function buildLocalizedPath(path, locale, options = {}) {
  const queryParam = options.queryParam || 'lang';
  const mode = options.urlMode || 'both';
  const parsed = parsePath(path);
  const segments = parsed.pathname.replace(/^\/+/u, '').split('/').filter(Boolean);
  const first = normalizeLocale(segments[0], '');
  const hasLocalePrefix = state.available.includes(first);
  const hasQueryLocale = parsed.params.has(queryParam);
  if (mode === 'query' || hasQueryLocale || (!hasLocalePrefix && options.writeStrategy === 'query')) {
    parsed.params.set(queryParam, locale);
    const query = parsed.params.toString();
    return parsed.pathname + (query ? `?${query}` : '');
  }
  if (hasLocalePrefix) {
    segments[0] = locale;
    const query = parsed.params.toString();
    return '/' + segments.join('/') + (query ? `?${query}` : '');
  }
  if (mode === 'prefix' || options.writeStrategy === 'prefix') {
    const query = parsed.params.toString();
    return '/' + [locale, ...segments].join('/') + (query ? `?${query}` : '');
  }
  parsed.params.set(queryParam, locale);
  const query = parsed.params.toString();
  return parsed.pathname + (query ? `?${query}` : '');
}

function patchRouterRouteMatching(target, config) {
  if (!target || typeof target._matchRoute !== 'function' || target.__xtendI18nRoutePatch) return () => {};
  const originalMatchRoute = target._matchRoute.bind(target);
  target._matchRoute = function matchRouteWithLocalePrefix(path, ...args) {
    const directMatch = originalMatchRoute(path, ...args);
    if (directMatch) return directMatch;
    const strippedPath = stripLocalePrefixFromPath(path, config);
    return strippedPath !== path ? originalMatchRoute(strippedPath, ...args) : null;
  };
  target.__xtendI18nRoutePatch = {
    schema: XTEND_I18N_ROUTER_ADAPTER_SCHEMA,
    mode: 'locale-prefix-route-matching'
  };
  return () => {
    target._matchRoute = originalMatchRoute;
    delete target.__xtendI18nRoutePatch;
  };
}

function enrichRouteDetail(detail, locale) {
  if (!detail || typeof detail !== 'object') return detail;
  detail.locale = locale;
  detail.i18n = {
    schema: XTEND_I18N_ROUTER_ADAPTER_SCHEMA,
    locale,
    source: 'xtend-i18n'
  };
  if (state.xstate && typeof state.xstate.set === 'function' && detail.stateKey) {
    state.xstate.set(detail.stateKey, { ...detail });
  }
  return detail;
}

function connectRouter(router, options = {}) {
  increment('connectRouter');
  const target = router && typeof router.addEventListener === 'function'
    ? router
    : (getDocument() && getDocument().querySelector('x-router'));
  const config = {
    schema: XTEND_I18N_ROUTER_ADAPTER_SCHEMA,
    urlMode: 'both',
    queryParam: 'lang',
    writeStrategy: 'preserve-current-shape',
    ...options
  };
  if (!target) {
    return { ...config, connected: false, dispose() {} };
  }
  let suppress = false;
  const restoreRouteMatching = patchRouterRouteMatching(target, config);
  const readAndSync = (event) => {
    const path = event && event.detail && event.detail.path ? event.detail.path : getCurrentPathFromRouter(target);
    const locale = localeFromPath(path, config);
    if (event && event.detail) enrichRouteDetail(event.detail, locale);
    if (!suppress && locale && locale !== state.locale) {
      setLocale(locale, { source: 'router', updateRouter: false }).catch(() => {});
    }
  };
  const writeRouteLocale = (event) => {
    if (!event || !event.detail || event.detail.source === 'router') return;
    if (event.detail.locale === localeFromPath(getCurrentPathFromRouter(target), {
      ...config,
      fallbackToCurrent: false
    })) return;
    const currentPath = getCurrentPathFromRouter(target);
    const nextPath = buildLocalizedPath(currentPath, event.detail.locale, {
      ...config,
      writeStrategy: config.writeStrategy === 'preserve-current-shape' ? undefined : config.writeStrategy
    });
    if (!nextPath || nextPath === currentPath) return;
    suppress = true;
    try {
      if (typeof target.navigate === 'function') {
        target.navigate(nextPath, { source: 'locale-change', locale: event.detail.locale });
      } else if (typeof target._navigateTo === 'function') {
        target._navigateTo(nextPath, { source: 'locale-change', locale: event.detail.locale });
      }
    } finally {
      queueMicrotask(() => { suppress = false; });
    }
  };
  target.addEventListener('route-changed', readAndSync);
  target.addEventListener('routechange', readAndSync);
  const win = getWindow();
  if (win) {
    win.addEventListener('xrouter-after-navigate', readAndSync);
    win.addEventListener('xtend-i18n-locale-changed', writeRouteLocale);
  }
  if (options.syncInitial !== false) readAndSync();
  const connection = {
    ...config,
    connected: true,
    router: target,
    dispose() {
      target.removeEventListener('route-changed', readAndSync);
      target.removeEventListener('routechange', readAndSync);
      restoreRouteMatching();
      if (win) {
        win.removeEventListener('xrouter-after-navigate', readAndSync);
        win.removeEventListener('xtend-i18n-locale-changed', writeRouteLocale);
      }
      state.routerConnections.delete(connection);
    }
  };
  state.routerConnections.add(connection);
  return connection;
}

function snapshot() {
  return {
    schema: XTEND_I18N_SNAPSHOT_SCHEMA,
    source: 'xtend-i18n',
    locale: state.locale,
    fallbackLocale: state.fallbackLocale,
    available: state.available.slice(),
    loadedLocales: Array.from(state.loadedLocales),
    labelCounts: Array.from(state.labelsByLocale.entries()).reduce((acc, [locale, labels]) => {
      acc[locale] = Object.keys(labels).length;
      return acc;
    }, {}),
    stateKeys: { ...state.stateKeys },
    componentLabelContractCount: COMPONENT_LABEL_CONTRACTS.size,
    routerConnectionCount: state.routerConnections.size
  };
}

function snapshotDiagnostics() {
  return {
    schema: XTEND_I18N_DIAGNOSTICS_SCHEMA,
    source: 'xtend-i18n',
    boundary: xtendI18n.xtendI18nBoundaryContract,
    xstate: xtendI18n.xtendXStateAdapterContract,
    router: xtendI18n.xtendRouterAdapterContract,
    operationCounts: { ...state.operationCounts },
    diagnostics: state.diagnostics.slice(-10),
    componentLabelContracts: Array.from(COMPONENT_LABEL_CONTRACTS.values()).map((contract) => ({
      schema: contract.schema,
      componentRef: contract.componentRef,
      labelCount: contract.labels.length
    })),
    kernelBoundary: XTEND_I18N_KERNEL_BOUNDARY
  };
}

const xtendI18n = {
  xtendI18nBoundaryContract: Object.freeze({
    schema: XTEND_I18N_BOUNDARY_SCHEMA,
    moduleRef: 'xtend-i18n',
    componentRef: 'xtend-i18n',
    customElement: false,
    profiles: ['i18n', 'labelling', 'infrastructure'],
    publicSurface: [
      'configure',
      'registerLabels',
      'loadLocale',
      'setLocale',
      'getLocale',
      'getLabelRecord',
      'applyLabels',
      'bindComponent',
      'connectXState',
      'connectRouter',
      'snapshot',
      'snapshotDiagnostics'
    ],
    kernelBoundary: XTEND_I18N_KERNEL_BOUNDARY
  }),
  xtendXStateAdapterContract: Object.freeze({
    schema: XTEND_I18N_XSTATE_ADAPTER_SCHEMA,
    eventType: 'LOCALE_CHANGED',
    requestKey: DEFAULT_STATE_KEYS.request,
    canonicalKeys: Object.values(DEFAULT_STATE_KEYS),
    kernelBoundary: XTEND_I18N_KERNEL_BOUNDARY
  }),
  xtendRouterAdapterContract: Object.freeze({
    schema: XTEND_I18N_ROUTER_ADAPTER_SCHEMA,
    urlMode: 'both',
    queryParam: 'lang',
    writeStrategy: 'preserve-current-shape',
    routeDetailLocaleField: 'locale',
    kernelBoundary: XTEND_I18N_KERNEL_BOUNDARY
  }),
  xtendComponentLabelContracts: COMPONENT_LABEL_CONTRACTS,
  configure,
  registerLabels,
  loadLocale,
  setLocale,
  getLocale,
  getLabelRecord,
  applyLabels,
  bindComponent,
  connectXState,
  connectRouter,
  snapshot,
  snapshotDiagnostics
};

patchCustomElementsDefine();
connectXState(defaultXState);

if (typeof window !== 'undefined') {
  window.xtendI18n = xtendI18n;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { xtendI18n };
}

export {
  XTEND_I18N_BOUNDARY_SCHEMA,
  XTEND_I18N_COMPONENT_LABEL_CONTRACT_SCHEMA,
  XTEND_I18N_DIAGNOSTICS_SCHEMA,
  XTEND_I18N_EVENT_SCHEMA,
  XTEND_I18N_LABEL_RECORD_SCHEMA,
  XTEND_I18N_LABELS_SCHEMA,
  XTEND_I18N_ROUTER_ADAPTER_SCHEMA,
  XTEND_I18N_SNAPSHOT_SCHEMA,
  XTEND_I18N_XSTATE_ADAPTER_SCHEMA,
  xtendI18n
};
