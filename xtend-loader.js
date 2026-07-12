const DEFAULT_MANIFEST_URL = 'components/manifest.json';
const LOADER_CONTRACT = 'xtend.loader.contract.v1';
const LOADER_POLICY_CONTRACT = 'xtend.security.loader-policy.v1';
const MANIFEST_POLICY_CONTRACT = 'xtend.security.manifest-policy.v1';
const IMPORT_POLICY_CONTRACT = 'xtend.security.import-policy.v1';
const PERFORMANCE_MEASUREMENT_CONTRACT = 'xtend.performance.measurement.v1';
const SKELETON_LOADER_CONTRACT = 'xtend.loader.skeleton-loader.v1';
const SKELETON_PROFILE_CONTRACT = 'xtend.loader.skeleton-profile.v1';
const STYLE_REGISTRY_CONTRACT = 'xtend.loader.style-registry.v1';
const RUNTIME_STYLES_CONTRACT = 'xtend.loader.runtime-styles.v1';
const RUNTIME_STYLE_KEY = 'xtend.runtime-critical';
const RUNTIME_STYLE_ID = 'xtend-runtime-critical-styles';
const STANDARD_THEME_STYLESHEET = 'xtend.css';
const LOADER_PERFORMANCE_PHASES = Object.freeze({
  'xtend.loader.manifest': 'load',
  'xtend.loader.module': 'load',
  'xtend.component.define': 'define'
});
const CUSTOM_ELEMENT_DEFINE_TIMEOUT_MS = 500;
const LOCAL_IMPORT_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
const ALLOWED_IMPORT_PROTOCOLS = ['http:', 'https:', 'file:'];
const REFUSED_IMPORT_PROTOCOLS = ['javascript:', 'data:', 'vbscript:', 'blob:'];
const ALLOWED_MANIFEST_EXTENSIONS = ['.json'];
const ALLOWED_MODULE_EXTENSIONS = ['.js', '.mjs'];
const RESERVED_MANIFEST_KEYS = ['xstate', 'xtend-i18n'];
const BOOTSTRAP_MODULE_KEYS = ['xstate', 'xtend-i18n'];
const CUSTOM_ELEMENT_NAME_PATTERN = /^[a-z][a-z0-9]*-[a-z0-9-]*[a-z0-9]$/;
const MODULE_CACHE_BUST_PARAM = 'xtend-cache';
const LOADER_VERBOSE_CONTRACT = 'xtend.loader.verbose.v1';
const LOADER_VERBOSE_STORAGE_KEY = 'xtend.loader.verbose';
const XTEND_RUNTIME_CUSTOM_ELEMENT_TAGS = Object.freeze([
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
  'x-router',
  'x-section',
  'x-select',
  'x-side-panel',
  'x-spinner',
  'x-status',
  'x-summary',
  'x-surface-manager',
  'x-surface-window',
  'x-tabs',
  'x-textarea',
  'x-toast',
  'x-toggle',
  'x-tooltip',
  'x-type',
  'x-writer',
  'xtend-doc-page'
]);

// Loader-local PROD verbosity switch. Supported values: 'true', 'false', 'auto'.
const verbose_mode = 'auto';

const loadedTags = new Set();
const loaderMeasurements = [];
const styleRegistryRecords = new Map();
const adoptedStyleSheetsByKey = new Map();
let loaderMeasurementCounter = 0;
let loaderVerboseRuntimeEnabled = readLoaderVerbosePreference();
let activeManifest = {};
let runtimeStylesInitialized = false;
const loaderStyleNonce = readCurrentScriptNonce();

function normalizeLoaderVerboseMode(mode) {
  const normalized = String(mode || '').trim().toLowerCase();
  return ['true', 'false', 'auto'].includes(normalized) ? normalized : 'auto';
}

function getLoaderVerboseMode() {
  return normalizeLoaderVerboseMode(verbose_mode);
}

function readLoaderVerbosePreference() {
  if (getLoaderVerboseMode() !== 'auto') {
    return false;
  }
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return false;
  }
  try {
    return window.sessionStorage.getItem(LOADER_VERBOSE_STORAGE_KEY) === 'true';
  } catch (_) {
    return false;
  }
}

function writeLoaderVerbosePreference(enabled) {
  if (getLoaderVerboseMode() !== 'auto') return;
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    window.sessionStorage.setItem(LOADER_VERBOSE_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch (_) {
    // Storage access can be disabled by the host page; runtime state still works.
  }
}

function normalizeLoaderVerboseRequest(enabled) {
  if (typeof enabled === 'string') {
    const normalized = enabled.trim().toLowerCase();
    return !['false', '0', 'off', 'no'].includes(normalized);
  }
  return enabled !== false;
}

function isLoaderVerboseEnabled() {
  const mode = getLoaderVerboseMode();
  return mode === 'true' || (mode === 'auto' && loaderVerboseRuntimeEnabled);
}

function getLoaderVerboseState() {
  const mode = getLoaderVerboseMode();
  return {
    schema: LOADER_VERBOSE_CONTRACT,
    mode,
    enabled: isLoaderVerboseEnabled(),
    locked: mode !== 'auto'
  };
}

function setLoaderVerbose(enabled = true) {
  const mode = getLoaderVerboseMode();
  const requested = normalizeLoaderVerboseRequest(enabled);

  if (mode === 'false') {
    return {
      ...getLoaderVerboseState(),
      requested,
      changed: false,
      message: 'XTend Loader VerboseMode ist per verbose_mode = false gesperrt.'
    };
  }

  if (mode === 'true') {
    return {
      ...getLoaderVerboseState(),
      requested,
      changed: false,
      message: 'XTend Loader VerboseMode ist per verbose_mode = true dauerhaft aktiv.'
    };
  }

  const previous = loaderVerboseRuntimeEnabled;
  loaderVerboseRuntimeEnabled = requested;
  writeLoaderVerbosePreference(loaderVerboseRuntimeEnabled);
  const state = {
    ...getLoaderVerboseState(),
    requested,
    changed: previous !== loaderVerboseRuntimeEnabled,
    message: loaderVerboseRuntimeEnabled
      ? 'XTend Loader VerboseMode aktiviert.'
      : 'XTend Loader VerboseMode deaktiviert.'
  };

  if (loaderVerboseRuntimeEnabled && typeof console !== 'undefined' && typeof console.info === 'function') {
    console.info(state.message);
  }

  return state;
}

function configureLoaderVerbose(enabled) {
  if (arguments.length === 0) {
    return getLoaderVerboseState();
  }
  return setLoaderVerbose(enabled);
}

function loaderVerboseLog(...args) {
  if (isLoaderVerboseEnabled() && typeof console !== 'undefined' && typeof console.log === 'function') {
    console.log(...args);
  }
}

function loaderVerboseWarn(...args) {
  if (isLoaderVerboseEnabled() && typeof console !== 'undefined' && typeof console.warn === 'function') {
    console.warn(...args);
  }
}

function readCurrentScriptNonce() {
  if (typeof document === 'undefined' || !document.currentScript) return '';
  const script = document.currentScript;
  return script.nonce || (typeof script.getAttribute === 'function' ? script.getAttribute('nonce') : '') || '';
}

function sanitizeStyleKey(key) {
  return String(key || '').trim().replace(/[^a-z0-9_.:-]/gi, '-').replace(/-+/g, '-') || 'style';
}

function normalizeStyleCss(cssText) {
  return String(cssText || '').trim();
}

function createRuntimeCustomElementHideCss() {
  return XTEND_RUNTIME_CUSTOM_ELEMENT_TAGS
    .map((tag) => `${tag}:not(:defined):not([data-xtend-skeleton])`)
    .join(',\n');
}

function createRuntimeCriticalCss() {
  const hiddenSelectors = createRuntimeCustomElementHideCss();
  return `
:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --info-color: #17a2b8;
  --success-color: #28a745;
  --warning-color: #ffc107;
  --error-color: #dc3545;
  --background-color: #ffffff;
  --text-color: #000000;
  --spacing-small: 0.5em;
  --spacing-medium: 1em;
  --spacing-large: 2em;
  --font-size-small: 0.875rem;
  --font-size-medium: 1rem;
  --font-size-large: 1.25rem;
  --shadow-light: 0 2px 4px rgba(0, 0, 0, 0.1);
  --shadow-dark: 0 2px 4px rgba(0, 0, 0, 0.5);
  --border-radius: 4px;
  --padding: 0.5em 1em;
  --focus-outline: 2px solid #0056b3;
  --form-background: #ffffff;
  --xtend-skeleton-bg: rgba(148, 163, 184, 0.16);
  --xtend-skeleton-highlight: rgba(255, 255, 255, 0.72);
  --xtend-skeleton-surface: rgba(148, 163, 184, 0.12);
  --xtend-skeleton-line-bg: rgba(148, 163, 184, 0.24);
}

[data-theme="dark"] {
  --primary-color: #0d6efd;
  --secondary-color: #adb5bd;
  --info-color: #17a2b8;
  --success-color: #28a745;
  --warning-color: #ffc107;
  --error-color: #dc3545;
  --background-color: #121212;
  --text-color: #f0f0f0;
  --form-background: #1e1e1e;
  --shadow-light: var(--shadow-dark);
  --card-bg: #1e1e1e;
  --card-text: #ffffff;
  --section-bg: #1e1e1e;
  --primary-color-hover: #0a58ca;
  --xtend-skeleton-bg: rgba(148, 163, 184, 0.12);
  --xtend-skeleton-highlight: rgba(226, 232, 240, 0.10);
  --xtend-skeleton-surface: rgba(226, 232, 240, 0.045);
  --xtend-skeleton-line-bg: rgba(148, 163, 184, 0.18);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --xtend-skeleton-bg: rgba(148, 163, 184, 0.12);
    --xtend-skeleton-highlight: rgba(226, 232, 240, 0.10);
    --xtend-skeleton-surface: rgba(226, 232, 240, 0.045);
    --xtend-skeleton-line-bg: rgba(148, 163, 184, 0.18);
  }
}

html {
  box-sizing: border-box;
  max-width: 100%;
  overflow-x: hidden;
  overflow-x: clip;
}

*,
*::before,
*::after {
  box-sizing: inherit;
}

body {
  min-width: 0;
  max-width: 100%;
  overflow-x: hidden;
  overflow-x: clip;
}

img,
video,
canvas,
iframe,
object,
embed {
  max-width: 100%;
}

img,
video {
  height: auto;
}

pre {
  max-width: 100%;
  overflow-x: auto;
}

main {
  box-sizing: border-box;
  min-width: 0;
  width: 100%;
  padding: var(--xtend-main-padding, 0);
}

section {
  box-sizing: border-box;
  min-width: 0;
  margin-block-end: var(--xtend-section-margin-block-end, 0);
}

body[xt-ui-effects~="fade-in"],
body[data-xt-ui-effects~="fade-in"] {
  visibility: hidden;
  opacity: 0;
  transition: opacity var(--xt-ui-effects-fade-duration, 0.5s) ease;
}

body[xt-ui-effects~="fade-in"][data-xt-ui-effects-ready="true"],
body[data-xt-ui-effects~="fade-in"][data-xt-ui-effects-ready="true"],
body[data-xt-ui-effects-state="ready"] {
  visibility: visible;
  opacity: 1;
}

@keyframes xtend-skeleton-shimmer {
  0% {
    background-position: 160% 0;
  }
  100% {
    background-position: -160% 0;
  }
}

[data-xtend-skeleton]:not(:defined) {
  display: block;
  position: relative;
  min-width: 0;
  min-height: var(--xtend-skeleton-min-height, 4rem);
  overflow: hidden;
  contain: layout paint;
  pointer-events: none;
  color: transparent !important;
  border-radius: var(--xtend-skeleton-radius, 8px);
  background:
    linear-gradient(
      90deg,
      var(--xtend-skeleton-bg, rgba(148, 163, 184, 0.16)) 0%,
      var(--xtend-skeleton-highlight, rgba(255, 255, 255, 0.72)) 48%,
      var(--xtend-skeleton-bg, rgba(148, 163, 184, 0.16)) 100%
    );
  background-size: 220% 100%;
  animation: xtend-skeleton-shimmer var(--xtend-skeleton-speed, 1.1s) ease-in-out infinite;
}

[data-xtend-skeleton]:not(:defined) > * {
  display: none !important;
}

[data-xtend-skeleton="inline"]:not(:defined) {
  display: inline-block;
  min-width: var(--xtend-skeleton-width, 7rem);
  min-height: var(--xtend-skeleton-min-height, 2.25rem);
  vertical-align: middle;
}

${hiddenSelectors} {
  visibility: hidden;
}

[data-xtend-skeleton-active="true"] > :not([data-xtend-skeleton-loader]) {
  visibility: hidden;
}

[data-xtend-skeleton-active="true"][data-xtend-skeleton-mode="overlay"] {
  position: relative;
}

[data-xtend-skeleton-cache="overlay"] {
  position: relative;
}

[data-xtend-skeleton-active="true"][data-xtend-skeleton-mode="overlay"] > [data-xtend-skeleton-loader] {
  position: absolute;
  inset: 0 0 auto 0;
  z-index: var(--xtend-skeleton-z-index, 1);
}

[data-xtend-skeleton-cache="overlay"] > [data-xtend-skeleton-loader][data-xtend-skeleton-hidden="true"] {
  position: absolute;
  inset: 0 0 auto 0;
  z-index: var(--xtend-skeleton-z-index, 1);
  opacity: 0;
  pointer-events: none;
}

[data-xtend-skeleton-loader] {
  display: grid;
  align-content: start;
  gap: var(--xtend-skeleton-gap, 0.68rem);
  width: var(--xtend-skeleton-width, 100%);
  max-width: var(--xtend-skeleton-max-width, 100%);
  margin-inline: var(--xtend-skeleton-margin-inline, 0);
  min-width: 0;
  box-sizing: border-box;
  padding: var(--xtend-skeleton-padding, 1rem);
  border-radius: var(--xtend-skeleton-radius, 8px);
  background: var(--xtend-skeleton-surface, rgba(148, 163, 184, 0.12));
  overflow: hidden;
  contain: layout paint;
}

[data-xtend-skeleton-line] {
  display: block;
  height: 0.82rem;
  max-width: 100%;
  border-radius: 999px;
  background: var(--xtend-skeleton-line-bg, rgba(148, 163, 184, 0.24));
}

[data-xtend-skeleton-item] {
  display: block;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  border-radius: var(--xtend-skeleton-item-radius, 999px);
  background: var(--xtend-skeleton-line-bg, rgba(148, 163, 184, 0.24));
}

@media (prefers-reduced-motion: reduce) {
  body[xt-ui-effects~="fade-in"],
  body[data-xt-ui-effects~="fade-in"],
  [data-xtend-skeleton]:not(:defined) {
    transition-duration: 0.01ms;
    animation-duration: 0.01ms;
    animation-iteration-count: 1;
  }
}
`.trim();
}

function canUseConstructableStylesheets(root = document) {
  return Boolean(
    root &&
    'adoptedStyleSheets' in root &&
    typeof CSSStyleSheet !== 'undefined' &&
    CSSStyleSheet.prototype &&
    typeof CSSStyleSheet.prototype.replaceSync === 'function'
  );
}

function resolveStyleHost() {
  if (typeof document === 'undefined') return null;
  return document.head || document.getElementsByTagName('head')[0] || document.documentElement;
}

function isStandardThemeStylesheetHref(href) {
  const raw = String(href || '').trim();
  if (!raw) return false;
  try {
    const url = new URL(raw, document.baseURI);
    return url.pathname.split('/').pop() === STANDARD_THEME_STYLESHEET;
  } catch (_) {
    return raw.split('?')[0].split('#')[0].endsWith(STANDARD_THEME_STYLESHEET);
  }
}

function findStandardThemeStylesheet() {
  if (typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') return null;
  return Array.from(document.querySelectorAll('link[rel~="stylesheet"]'))
    .find((link) => isStandardThemeStylesheetHref(link.getAttribute('href') || link.href)) || null;
}

function getThemeStylesheetState() {
  const link = findStandardThemeStylesheet();
  return {
    schema: STYLE_REGISTRY_CONTRACT,
    standardFileName: STANDARD_THEME_STYLESHEET,
    present: Boolean(link),
    href: link ? (link.getAttribute('href') || link.href || '') : '',
    role: link ? 'optional-host-theme' : 'runtime-critical-only'
  };
}

function markRuntimeStylesReady(record) {
  if (typeof document !== 'undefined' && document.documentElement) {
    const themeState = getThemeStylesheetState();
    document.documentElement.setAttribute('data-xtend-runtime-styles', 'ready');
    document.documentElement.setAttribute('data-xtend-theme-stylesheet', themeState.present ? 'external' : 'runtime');
    if (record && record.mode) {
      document.documentElement.setAttribute('data-xtend-runtime-styles-mode', record.mode);
    }
  }
}

function ensureDocumentStyle(key, cssText, options = {}) {
  if (typeof document === 'undefined') return null;
  const css = normalizeStyleCss(cssText);
  if (!css) return null;

  const normalizedKey = sanitizeStyleKey(key);
  const id = options.id || `xtend-style-${normalizedKey}`;
  const preferStyleElement = options.strategy === 'style';

  if (!preferStyleElement && canUseConstructableStylesheets(document)) {
    try {
      let sheet = adoptedStyleSheetsByKey.get(id);
      const createdSheet = !sheet;
      if (!sheet) {
        sheet = new CSSStyleSheet();
        adoptedStyleSheetsByKey.set(id, sheet);
      }
      if (createdSheet || !styleRegistryRecords.has(normalizedKey) || styleRegistryRecords.get(normalizedKey).cssText !== css) {
        sheet.replaceSync(css);
      }
      if (!document.adoptedStyleSheets.includes(sheet)) {
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
      }
      const record = {
        schema: STYLE_REGISTRY_CONTRACT,
        key: normalizedKey,
        id,
        mode: 'adoptedStyleSheet',
        cssText: css,
        sheet,
        source: options.source || 'xtend-loader'
      };
      styleRegistryRecords.set(normalizedKey, record);
      return record;
    } catch (error) {
      loaderVerboseWarn('XTend StyleRegistry: Constructable Stylesheet fallback aktiviert.', error);
    }
  }

  const host = resolveStyleHost();
  if (!host || typeof document.createElement !== 'function') return null;

  let style = document.getElementById(id);
  if (!style) {
    style = document.createElement('style');
    style.id = id;
    style.setAttribute('data-xtend-style-registry', STYLE_REGISTRY_CONTRACT);
    style.setAttribute('data-xtend-style-key', normalizedKey);
    if (loaderStyleNonce) style.setAttribute('nonce', loaderStyleNonce);
    host.appendChild(style);
  }
  if (style.textContent !== css) {
    style.textContent = css;
  }

  const record = {
    schema: STYLE_REGISTRY_CONTRACT,
    key: normalizedKey,
    id,
    mode: 'styleElement',
    cssText: css,
    element: style,
    source: options.source || 'xtend-loader'
  };
  styleRegistryRecords.set(normalizedKey, record);
  return record;
}

function ensureRuntimeStyles(options = {}) {
  if (runtimeStylesInitialized && !options.force) {
    return styleRegistryRecords.get(RUNTIME_STYLE_KEY) || null;
  }

  try {
    const record = ensureDocumentStyle(RUNTIME_STYLE_KEY, createRuntimeCriticalCss(), {
      id: RUNTIME_STYLE_ID,
      source: options.source || 'xtend-loader.runtime',
      strategy: options.strategy
    });
    runtimeStylesInitialized = Boolean(record);
    if (record) markRuntimeStylesReady(record);
    return record;
  } catch (error) {
    loaderVerboseWarn('XTend StyleRegistry: Runtime-Styles konnten nicht initialisiert werden.', error);
    return null;
  }
}

function defineComponentStyle(tag, cssText, options = {}) {
  const normalizedTag = normalizeComponentTag(tag);
  const key = sanitizeStyleKey(options.key || `component:${normalizedTag || 'anonymous'}`);
  const record = {
    schema: STYLE_REGISTRY_CONTRACT,
    key,
    tag: normalizedTag,
    cssText: normalizeStyleCss(cssText),
    source: options.source || normalizedTag || 'component'
  };
  styleRegistryRecords.set(key, record);
  return record;
}

function resolveRegisteredStyle(styleOrKey) {
  if (styleOrKey && typeof styleOrKey === 'object' && typeof styleOrKey.cssText === 'string') {
    return styleOrKey;
  }
  if (typeof styleOrKey === 'string' && styleRegistryRecords.has(styleOrKey)) {
    return styleRegistryRecords.get(styleOrKey);
  }
  return {
    schema: STYLE_REGISTRY_CONTRACT,
    key: sanitizeStyleKey('inline-style'),
    cssText: normalizeStyleCss(styleOrKey),
    source: 'inline'
  };
}

function normalizeStyleRoot(root) {
  if (root && typeof root === 'object' && (root.nodeType === 9 || root.nodeType === 11 || 'adoptedStyleSheets' in root)) return root;
  if (root && root.shadowRoot) return root.shadowRoot;
  if (root && root.ownerDocument) return root.ownerDocument;
  return typeof document !== 'undefined' ? document : null;
}

function adoptStyle(root, styleOrKey, options = {}) {
  const target = normalizeStyleRoot(root);
  const sourceRecord = resolveRegisteredStyle(styleOrKey);
  const css = normalizeStyleCss(sourceRecord.cssText);
  if (!target || !css) return null;

  const key = sanitizeStyleKey(options.key || sourceRecord.key || 'adopted-style');
  const id = options.id || `xtend-adopted-${key}`;

  if (canUseConstructableStylesheets(target) && options.strategy !== 'style') {
    let sheet = adoptedStyleSheetsByKey.get(id);
    if (!sheet) {
      sheet = new CSSStyleSheet();
      adoptedStyleSheetsByKey.set(id, sheet);
    }
    sheet.replaceSync(css);
    if (!target.adoptedStyleSheets.includes(sheet)) {
      target.adoptedStyleSheets = [...target.adoptedStyleSheets, sheet];
    }
    return {
      schema: STYLE_REGISTRY_CONTRACT,
      key,
      id,
      mode: 'adoptedStyleSheet',
      sheet,
      target,
      source: options.source || sourceRecord.source || 'xtend-style-registry'
    };
  }

  const appendTarget = target.nodeType === 9 ? resolveStyleHost() : target;
  const ownerDocument = target.ownerDocument || (target.nodeType === 9 ? target : document);
  if (!ownerDocument || typeof ownerDocument.createElement !== 'function') return null;
  if (!appendTarget || typeof appendTarget.appendChild !== 'function') return null;
  let style = typeof appendTarget.querySelector === 'function'
    ? appendTarget.querySelector(`[data-xtend-adopted-style="${id}"]`)
    : null;
  if (!style) {
    style = ownerDocument.createElement('style');
    style.setAttribute('data-xtend-style-registry', STYLE_REGISTRY_CONTRACT);
    style.setAttribute('data-xtend-adopted-style', id);
    if (loaderStyleNonce) style.setAttribute('nonce', loaderStyleNonce);
    appendTarget.appendChild(style);
  }
  if (style.textContent !== css) style.textContent = css;
  return {
    schema: STYLE_REGISTRY_CONTRACT,
    key,
    id,
    mode: 'styleElement',
    element: style,
    target: appendTarget,
    source: options.source || sourceRecord.source || 'xtend-style-registry'
  };
}

function getRegisteredStyle(key) {
  return styleRegistryRecords.get(sanitizeStyleKey(key)) || null;
}

function listRegisteredStyles() {
  return Array.from(styleRegistryRecords.values()).map((record) => ({
    schema: record.schema,
    key: record.key,
    id: record.id || '',
    mode: record.mode || 'registered',
    tag: record.tag || '',
    source: record.source || ''
  }));
}

async function initiateXTend(options = {}) {
  ensureRuntimeStyles({ source: 'loader.boot' });
  const loaderScript = resolveLoaderScript();
  const uiEffectsInput = resolveLoaderUiEffectsInput(options, loaderScript);
  let uiEffectsController = null;
  let manifestUrl = null;
  let manifest = {};

  try {
    manifestUrl = resolveManifestUrl(options.manifestUrl, loaderScript);
    const moduleCacheBust = resolveModuleCacheBust(options.moduleCacheBust, loaderScript, manifestUrl);

    manifest = await fetchManifest(manifestUrl, { moduleCacheBust });
    activeManifest = manifest;
    uiEffectsController = await prepareConfiguredUiEffects(manifest, uiEffectsInput);

    await loadCoreModules(manifest);
    await preloadManifestComponents(manifest);
    await loadDomComponents(manifest);

    loaderVerboseLog('XTend Loader: Komponenten geladen.');
  } catch (error) {
    emitLoaderDiagnostic('xtend.loader.error', 'error', 'XTend Loader Fehler', {
      message: error && error.message ? error.message : String(error)
    });
    console.error('XTend Loader Fehler:', error);
  } finally {
    releaseConfiguredUiEffects(uiEffectsController, uiEffectsInput);
    await initializeApi(manifest);
  }

  return {
    schema: LOADER_CONTRACT,
    manifest,
    loadedTags: Array.from(loadedTags),
    performanceMeasurements: loaderMeasurements.slice(),
    uiEffects: uiEffectsController && uiEffectsController.state ? uiEffectsController.state : null,
    verbose: getLoaderVerboseState()
  };
}

function resolveLoaderScript() {
  const scripts = Array.from(document.scripts || []);
  const moduleUrl = new URL(import.meta.url, document.baseURI).href;

  return document.currentScript ||
    scripts.find((script) => script.src && new URL(script.src, document.baseURI).href === moduleUrl) ||
    scripts.find((script) => script.src && script.src.includes('xtend-loader.js')) ||
    null;
}

function resolveManifestUrl(explicitManifestUrl, loaderScript) {
  const configuredManifestUrl =
    explicitManifestUrl ||
    (loaderScript && loaderScript.getAttribute('data-manifest')) ||
    DEFAULT_MANIFEST_URL;

  const policy = classifyLoaderUrl(configuredManifestUrl, {
    kind: 'manifest',
    baseUrl: document.baseURI,
    source: 'data-manifest'
  });

  if (!policy.ok) {
    emitSecurityDiagnostic('xtend.security.loader.refused', 'Manifest URL wurde durch die Loader Policy verweigert', {
      policy: LOADER_POLICY_CONTRACT,
      manifestPolicy: MANIFEST_POLICY_CONTRACT,
      input: configuredManifestUrl,
      diagnostics: policy.diagnostics
    });
    throw new Error(`XTend Loader Policy verweigert Manifest URL: ${configuredManifestUrl}`);
  }

  return policy.url;
}

function resolveLoaderUiEffectsInput(options = {}, loaderScript = null) {
  return {
    target: document.body || null,
    body: document.body || null,
    script: loaderScript,
    effects: options.uiEffects || options.uiEffect || options.effects || '',
    durationMs: options.uiEffectDuration || options.uiEffectsDuration || '',
    rmtDocument: options.rmtDocument ||
      options.rmt ||
      (typeof window !== 'undefined' && (
        window.xtendRmtDocument ||
        window.XTendRmtDocument ||
        window.xtendDocsRmtDocument
      )) ||
      null
  };
}

function normalizeUiEffectsHint(value) {
  return String(value || '').trim().toLowerCase();
}

function isDisabledUiEffectsHint(value) {
  const normalized = normalizeUiEffectsHint(value);
  return normalized === '' ||
    normalized === 'none' ||
    normalized === 'off' ||
    normalized === 'false' ||
    normalized === '0' ||
    normalized === 'disabled';
}

function readUiEffectsHintFromElement(element) {
  if (!element || typeof element.getAttribute !== 'function') return '';
  return element.getAttribute('xt-ui-effects') ||
    element.getAttribute('data-xt-ui-effects') ||
    element.getAttribute('data-ui-effects') ||
    '';
}

function rmtDocumentHasUiEffectsHint(documentLike) {
  if (!documentLike || typeof documentLike !== 'object') return false;
  try {
    return JSON.stringify(documentLike).includes('ui-effects') ||
      JSON.stringify(documentLike).includes('uiEffects');
  } catch (_) {
    return false;
  }
}

function hasConfiguredUiEffects(input = {}) {
  const explicit = normalizeUiEffectsHint(input.effects);
  const bodyHint = readUiEffectsHintFromElement(input.body);
  const scriptHint = readUiEffectsHintFromElement(input.script);
  const hasExplicitEffect = explicit && !isDisabledUiEffectsHint(explicit);
  const hasBodyEffect = bodyHint && !isDisabledUiEffectsHint(bodyHint);
  const hasScriptEffect = scriptHint && !isDisabledUiEffectsHint(scriptHint);
  return Boolean(hasExplicitEffect || hasBodyEffect || hasScriptEffect || rmtDocumentHasUiEffectsHint(input.rmtDocument));
}

async function loadUiEffectsRuntime(manifest = {}) {
  const url = manifest['x-utils'];
  if (!url) return null;
  const importPolicy = classifyLoaderUrl(url, {
    kind: 'module',
    baseUrl: document.baseURI,
    source: 'x-utils'
  });
  if (!importPolicy.ok) {
    emitSecurityDiagnostic('xtend.security.import.refused', 'Import fuer x-utils wurde durch die Loader Policy verweigert', {
      policy: IMPORT_POLICY_CONTRACT,
      tag: 'x-utils',
      url,
      diagnostics: importPolicy.diagnostics
    });
    return null;
  }

  try {
    const module = await import(importPolicy.url);
    if (module && module.XUtils && typeof module.XUtils.prepareUiEffects === 'function') {
      loadedTags.add('x-utils');
      return module.XUtils;
    }
  } catch (error) {
    emitLoaderDiagnostic('xtend.loader.ui_effects.load_failed', 'warn', 'x-utils UI Effects konnten nicht geladen werden', {
      tag: 'x-utils',
      url: importPolicy.url,
      message: error && error.message ? error.message : String(error)
    });
  }
  return null;
}

async function prepareConfiguredUiEffects(manifest, input) {
  if (!hasConfiguredUiEffects(input)) return null;
  const runtime = await loadUiEffectsRuntime(manifest);
  if (runtime && typeof runtime.prepareUiEffects === 'function') {
    return {
      runtime,
      state: runtime.prepareUiEffects(input)
    };
  }

  return {
    runtime: null,
    state: prepareUiEffectsFallback(input)
  };
}

function inputRequestsFadeIn(input = {}) {
  const hints = [
    input.effects,
    readUiEffectsHintFromElement(input.body),
    readUiEffectsHintFromElement(input.script)
  ].map(normalizeUiEffectsHint);

  if (hints.some((hint) => isDisabledUiEffectsHint(hint))) return false;
  return hints.some((hint) => hint.includes('fade-in') || hint.includes('fadein')) ||
    rmtDocumentHasUiEffectsHint(input.rmtDocument);
}

function prepareUiEffectsFallback(input = {}) {
  const target = input.target || input.body || document.body;
  const active = Boolean(target && inputRequestsFadeIn(input));
  const state = {
    schema: 'xtend.utility.ui-effects.v1',
    componentRef: 'x-utils',
    target,
    targetRef: target === document.body ? 'document.body' : 'custom-target',
    effects: active ? ['fade-in'] : [],
    active,
    source: 'loader-fallback',
    bodyAttribute: 'xt-ui-effects',
    rmtTag: 'ui-effects',
    supportedEffects: ['fade-in'],
    durationMs: 500,
    kernelBoundary: 'no-rmt-kernel-import-of-xtend-types',
    prepared: active,
    released: false
  };

  if (active) {
    target.setAttribute('data-xt-ui-effects', 'fade-in');
    target.setAttribute('data-xt-ui-effects-state', 'preparing');
    target.removeAttribute('data-xt-ui-effects-ready');
    target.style.visibility = 'hidden';
    target.style.opacity = '0';
  }

  return state;
}

function releaseUiEffectsFallback(stateOrInput = {}) {
  const target = stateOrInput.target || stateOrInput.body || document.body;
  if (!target) return stateOrInput;
  target.setAttribute('data-xt-ui-effects-ready', 'true');
  target.setAttribute('data-xt-ui-effects-state', 'ready');
  target.style.visibility = 'visible';
  target.style.opacity = '1';
  return {
    ...stateOrInput,
    target,
    released: true
  };
}

function releaseConfiguredUiEffects(controller, input) {
  if (controller && controller.runtime && typeof controller.runtime.releaseUiEffects === 'function') {
    controller.state = controller.runtime.releaseUiEffects(controller.state);
    return controller.state;
  }

  if (controller && controller.state && controller.state.active) {
    controller.state = releaseUiEffectsFallback(controller.state);
    return controller.state;
  }

  if (inputRequestsFadeIn(input)) {
    return releaseUiEffectsFallback(input);
  }

  return null;
}

async function fetchManifest(manifestUrl, options = {}) {
  return measureLoaderPhase('xtend.loader.manifest', async () => {
    const manifestPolicy = classifyLoaderUrl(manifestUrl, {
      kind: 'manifest',
      baseUrl: document.baseURI,
      source: 'fetchManifest'
    });
    if (!manifestPolicy.ok) {
      emitSecurityDiagnostic('xtend.security.loader.refused', 'Manifest Fetch wurde durch die Loader Policy verweigert', {
        policy: LOADER_POLICY_CONTRACT,
        manifestUrl,
        diagnostics: manifestPolicy.diagnostics
      });
      throw new Error(`XTend Loader Policy verweigert Manifest Fetch: ${manifestUrl}`);
    }

    const response = await fetch(manifestUrl);
    if (!response.ok) {
      throw new Error(`Manifest konnte nicht geladen werden: HTTP ${response.status}`);
    }

    try {
      const rawManifest = await response.json();
      return resolveManifestUrls(rawManifest, response.url, options);
    } catch (error) {
      emitLoaderDiagnostic('xtend.loader.manifest.parse_failed', 'error', 'Manifest konnte nicht geparst werden', {
        manifestUrl,
        message: error && error.message ? error.message : String(error)
      });
      throw error;
    }
  }, { manifestUrl });
}

function resolveManifestUrls(rawManifest, baseUrl, options = {}) {
  const resolvedManifest = {};
  if (!rawManifest || typeof rawManifest !== 'object' || Array.isArray(rawManifest)) {
    emitSecurityDiagnostic('xtend.security.manifest.invalid', 'Manifest wurde wegen ungueltiger Struktur verweigert', {
      policy: MANIFEST_POLICY_CONTRACT,
      baseUrl,
      reason: 'invalid-shape'
    });
    return resolvedManifest;
  }

  for (const [tag, url] of Object.entries(rawManifest || {})) {
    const record = classifyManifestRecord(tag, url, baseUrl);
    if (!record.ok) {
      emitSecurityDiagnostic('xtend.security.manifest.invalid', 'Manifest Record wurde durch die Manifest Policy verweigert', {
        policy: MANIFEST_POLICY_CONTRACT,
        tag,
        diagnostics: record.diagnostics
      });
      continue;
    }
    resolvedManifest[record.tag] = appendModuleCacheBust(record.tag, record.url, options.moduleCacheBust);
  }
  return resolvedManifest;
}

function resolveModuleCacheBust(explicitCacheBust, loaderScript, manifestUrl) {
  const configuredCacheBust =
    explicitCacheBust ||
    (loaderScript && (
      loaderScript.getAttribute('data-module-cache-bust') ||
      loaderScript.getAttribute('data-cache-bust')
    )) ||
    readCacheBustFromUrl(loaderScript && loaderScript.src) ||
    readCacheBustFromUrl(manifestUrl);

  if (!configuredCacheBust) return '';
  return String(configuredCacheBust).trim().slice(0, 80);
}

function readCacheBustFromUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(value, document.baseURI);
    return url.searchParams.get('v') ||
      url.searchParams.get('version') ||
      url.searchParams.get('cache') ||
      '';
  } catch (_) {
    return '';
  }
}

function appendModuleCacheBust(tag, moduleUrl, cacheBust) {
  if (!cacheBust || tag === 'xstate' || tag === 'xtend-i18n' || BOOTSTRAP_MODULE_KEYS.includes(tag)) return moduleUrl;
  try {
    const url = new URL(moduleUrl, document.baseURI);
    if (url.searchParams.has(MODULE_CACHE_BUST_PARAM)) return url.href;
    url.searchParams.set(MODULE_CACHE_BUST_PARAM, cacheBust);
    return url.href;
  } catch (_) {
    return moduleUrl;
  }
}

function loadScript(src, asModule = true) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.type = asModule ? 'module' : 'text/javascript';
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Fehler beim Laden von ${src}`));
    document.head.appendChild(script);
  });
}

async function loadCoreModules(manifest) {
  if (manifest.xstate) {
    await tryLoad('xstate', manifest.xstate);
  } else {
    emitLoaderDiagnostic('xtend.loader.core.xstate_missing', 'warn', 'Manifest enthaelt keinen xstate-Eintrag');
    loaderVerboseWarn('XTend Loader: Manifest enthaelt keinen xstate-Eintrag.');
  }

  if (manifest['xtend-i18n']) {
    await tryLoad('xtend-i18n', manifest['xtend-i18n']);
  }

  if (manifest['x-theme']) {
    await tryLoad('x-theme', manifest['x-theme']);
  }
}

async function preloadManifestComponents(manifest) {
  const preloadMeta = document.querySelector('meta[name="xtend-preload"]');
  if (!preloadMeta || !preloadMeta.content) return;

  const preloadTags = preloadMeta.content
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);

  for (const tag of preloadTags) {
    if (!manifest[tag] || loadedTags.has(tag) || customElements.get(tag)) continue;
    await tryLoad(tag, manifest[tag]);
  }
}

async function loadDomComponents(manifest) {
  const elements = Array.from(document.querySelectorAll('*'));
  const usedTags = new Set(
    elements
      .map((element) => element.tagName.toLowerCase())
      .filter((tag) => tag.startsWith('x') && Object.prototype.hasOwnProperty.call(manifest, tag))
  );

  for (const tag of usedTags) {
    if (customElements.get(tag) || loadedTags.has(tag)) continue;
    const url = manifest[tag];
    if (!url) continue;

    const element = document.querySelector(tag);
    if (element && isInViewport(element)) {
      await tryLoad(tag, url);
    } else if (element) {
      observeLazyLoad(tag, url, element);
    }
  }
}

function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top < window.innerHeight &&
    rect.bottom > 0 &&
    rect.left < window.innerWidth &&
    rect.right > 0
  );
}

function observeLazyLoad(tag, url, element) {
  const observer = new IntersectionObserver(async (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        observer.disconnect();
        await tryLoad(tag, url);
      }
    }
  }, { rootMargin: '100px' });
  observer.observe(element);
}

async function tryLoad(tag, url) {
  if (customElements.get(tag) || loadedTags.has(tag)) return;
  try {
    const importPolicy = classifyLoaderUrl(url, {
      kind: 'module',
      baseUrl: document.baseURI,
      source: tag
    });
    if (!importPolicy.ok) {
      emitSecurityDiagnostic('xtend.security.import.refused', `Import fuer ${tag} wurde durch die Loader Policy verweigert`, {
        policy: IMPORT_POLICY_CONTRACT,
        tag,
        url,
        diagnostics: importPolicy.diagnostics
      });
      return;
    }

    loaderVerboseLog(`Lade ${tag} als ES6-Modul von ${url}`);
    await measureLoaderPhase('xtend.loader.module', () => loadScript(importPolicy.url, true), { tag, url: importPolicy.url });
    if (isCustomElementTag(tag) && !isBootstrapModuleTag(tag)) {
      await measureLoaderPhase('xtend.component.define', () => waitForCustomElementDefinition(tag), { tag, url: importPolicy.url });
    }
    loaderVerboseLog(`${tag} erfolgreich geladen`);
    loadedTags.add(tag);
  } catch (error) {
    emitLoaderDiagnostic('xtend.loader.component.load_failed', 'error', `Komponente ${tag} konnte nicht geladen werden`, {
      tag,
      url,
      message: error && error.message ? error.message : String(error)
    });
    console.error(`Fehler beim Laden von ${tag}:`, error);
  }
}

function getActiveManifest() {
  return activeManifest && typeof activeManifest === 'object' ? activeManifest : {};
}

function normalizeComponentTag(tag) {
  return String(tag || '').trim().toLowerCase();
}

function collectTreeComponentTags(root = document, options = {}) {
  const tags = new Set();
  (Array.isArray(options.tags) ? options.tags : []).forEach((tag) => {
    const normalized = normalizeComponentTag(tag);
    if (isCustomElementTag(normalized)) tags.add(normalized);
  });

  const scope = root && typeof root.querySelectorAll === 'function' ? root : document;
  if (root && root.tagName) {
    const rootTag = normalizeComponentTag(root.tagName);
    if (isCustomElementTag(rootTag)) tags.add(rootTag);
  }

  Array.from(scope.querySelectorAll('*')).forEach((element) => {
    const tag = normalizeComponentTag(element.tagName);
    if (isCustomElementTag(tag)) tags.add(tag);
  });

  return Array.from(tags);
}

function collectTreeElements(root = document) {
  const scope = root && typeof root.querySelectorAll === 'function' ? root : document;
  const elements = [];
  if (root && root.nodeType === 1) elements.push(root);
  elements.push(...Array.from(scope.querySelectorAll('*')));
  return elements;
}

function normalizeSkeletonCount(value, fallback = 1, maximum = 24) {
  const fallbackNumber = Number(fallback);
  const safeFallback = Number.isFinite(fallbackNumber) && fallbackNumber > 0
    ? Math.floor(fallbackNumber)
    : 1;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return Math.min(maximum, safeFallback);
  return Math.max(1, Math.min(maximum, Math.floor(parsed)));
}

function normalizeSkeletonLayoutMode(value) {
  const mode = String(value || 'auto').trim().toLowerCase();
  return mode === 'flow' || mode === 'overlay' ? mode : 'auto';
}

function normalizeSkeletonLoaderOptions(options = {}) {
  const requestedProfile = options.profile || options.profileId || options.variant || options.kind || 'block';
  const profile = typeof requestedProfile === 'string'
    ? getSkeletonProfile(requestedProfile)
    : normalizeSkeletonProfile(requestedProfile);
  return {
    schema: SKELETON_LOADER_CONTRACT,
    profile: profile && profile.id || 'block',
    profileDescriptor: profile,
    variant: String(options.variant || options.kind || profile && profile.variant || 'block').trim() || 'block',
    lines: normalizeSkeletonCount(options.lines || options.lineCount || profile && profile.lines, 4),
    minHeight: String(options.minHeight || options.height || profile && profile.minHeight || '').trim(),
    label: String(options.label || options.ariaLabel || 'Inhalt wird geladen').trim(),
    source: String(options.source || 'xtend-loader').trim(),
    schedule: String(options.schedule || 'component.dynamic.hydrate').trim(),
    layoutMode: normalizeSkeletonLayoutMode(options.layoutMode)
  };
}

const skeletonProfiles = new Map();

function normalizeSkeletonLength(value, fallback = '') {
  const normalized = String(value == null ? '' : value).trim();
  if (!normalized) return fallback;
  if (/^(?:auto|0|(?:\d+(?:\.\d+)?)(?:px|rem|em|ch|%|vh|vw|svh|svw)|var\(--[a-z0-9_-]+(?:,\s*[^)]+)?\)|(?:min|max|clamp|calc)\([^;{}]+\))$/iu.test(normalized)) return normalized;
  return fallback;
}

function normalizeSkeletonVisualLength(value, fallback) {
  const normalized = normalizeSkeletonLength(value, fallback);
  return normalized === '0' ? fallback : normalized;
}

function normalizeSkeletonProfile(input = {}, fallbackId = 'block') {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const id = String(source.id || source.name || fallbackId).trim().replace(/[^a-z0-9._-]+/giu, '-').replace(/^-+|-+$/gu, '') || fallbackId;
  const rawItems = Array.isArray(source.items || source.rows) ? (source.items || source.rows) : [];
  const items = [];
  rawItems.forEach((item, itemIndex) => {
    const record = item && typeof item === 'object' ? item : {};
    const repeat = normalizeSkeletonCount(record.repeat, 1);
    for (let repeatIndex = 0; repeatIndex < repeat; repeatIndex += 1) {
      items.push({
        id: String(record.id || `item-${itemIndex + 1}-${repeatIndex + 1}`),
        kind: ['line', 'block', 'circle'].includes(record.kind) ? record.kind : 'line',
        width: normalizeSkeletonVisualLength(record.width, '100%'),
        height: normalizeSkeletonVisualLength(record.height, record.kind === 'block' ? '3rem' : '0.82rem'),
        gridColumn: String(record.gridColumn || record.column || '').replace(/[^a-z0-9 /._-]+/giu, '').trim(),
        radius: normalizeSkeletonLength(record.radius, record.kind === 'circle' ? '50%' : '999px')
      });
    }
  });
  const responsiveSource = source.responsive && typeof source.responsive === 'object' ? source.responsive : {};
  const normalizeViewport = (value = {}) => {
    const viewport = value && typeof value === 'object' ? value : {};
    return Object.freeze({
      minHeight: normalizeSkeletonLength(viewport.minHeight || viewport.height, ''),
      columns: String(viewport.columns || '').replace(/[;{}]/gu, '').trim(),
      gap: normalizeSkeletonLength(viewport.gap, '')
    });
  };
  return Object.freeze({
    schema: SKELETON_PROFILE_CONTRACT,
    id,
    variant: String(source.variant || id).trim() || id,
    lines: normalizeSkeletonCount(source.lines || source.lineCount || items.length, 4),
    minHeight: normalizeSkeletonLength(source.minHeight || source.height, ''),
    columns: String(source.columns || '').replace(/[;{}]/gu, '').trim(),
    gap: normalizeSkeletonLength(source.gap, '0.68rem'),
    responsive: Object.freeze({
      breakpoint: normalizeSkeletonLength(responsiveSource.breakpoint, '700px'),
      compact: normalizeViewport(responsiveSource.compact),
      wide: normalizeViewport(responsiveSource.wide)
    }),
    items
  });
}

function registerSkeletonProfile(id, descriptor = {}) {
  const profile = normalizeSkeletonProfile({ ...descriptor, id: id || descriptor.id }, id || 'block');
  skeletonProfiles.set(profile.id, profile);
  return profile;
}

function getSkeletonProfile(id) {
  const profile = skeletonProfiles.get(String(id || '').trim());
  return profile ? normalizeSkeletonProfile(profile, profile.id) : null;
}

function listSkeletonProfiles() {
  return Array.from(skeletonProfiles.values()).map((profile) => normalizeSkeletonProfile(profile, profile.id));
}

[
  { id: 'block', lines: 4 },
  { id: 'route', minHeight: '12rem', items: [
    { kind: 'line', width: '42%', height: '1.35rem' },
    { kind: 'line', width: '94%' },
    { kind: 'line', width: '84%' },
    { kind: 'line', width: '68%' },
    { kind: 'block', width: '100%', height: '5rem', radius: '8px' }
  ] },
  { id: 'article', minHeight: '24rem', items: [
    { kind: 'line', width: '48%', height: '1.5rem' },
    { kind: 'line', width: '96%', repeat: 3 },
    { kind: 'line', width: '72%' },
    { kind: 'block', width: '100%', height: '8rem', radius: '8px' },
    { kind: 'line', width: '92%', repeat: 2 }
  ] },
  { id: 'list', items: [{ kind: 'line', width: '88%', repeat: 6 }] },
  { id: 'form', columns: 'minmax(0, 1fr) minmax(0, 1fr)', items: [
    { kind: 'block', width: '100%', height: '2.75rem', radius: '6px', repeat: 4 }
  ] }
].forEach((profile) => registerSkeletonProfile(profile.id, profile));

function applySkeletonLineStyle(line, index, total) {
  const widths = ['72%', '94%', '84%', '58%', '88%', '66%'];
  line.style.display = 'block';
  line.style.width = widths[index % widths.length];
  line.style.maxWidth = '100%';
  line.style.height = index === 0 && total > 5 ? '1.35rem' : '0.82rem';
  line.style.borderRadius = '999px';
  line.style.background = 'var(--xtend-skeleton-line-bg, rgba(148, 163, 184, 0.24))';
}

function createSkeletonLoader(options = {}) {
  ensureRuntimeStyles({ source: 'skeleton-loader' });
  const normalized = normalizeSkeletonLoaderOptions(options);
  const skeleton = document.createElement('div');
  skeleton.setAttribute('data-xtend-skeleton-loader', '');
  skeleton.setAttribute('data-xtend-skeleton-variant', normalized.variant);
  skeleton.setAttribute('data-xtend-skeleton-profile', normalized.profile);
  skeleton.setAttribute('data-xtend-skeleton-source', normalized.source);
  skeleton.setAttribute('data-xtend-skeleton-schedule', normalized.schedule);
  skeleton.setAttribute('role', 'status');
  skeleton.setAttribute('aria-live', 'polite');
  skeleton.setAttribute('aria-label', normalized.label);
  skeleton.style.display = 'grid';
  skeleton.style.alignContent = 'start';
  skeleton.style.gap = '0.68rem';
  skeleton.style.width = 'var(--xtend-skeleton-width, 100%)';
  skeleton.style.maxWidth = 'var(--xtend-skeleton-max-width, 100%)';
  skeleton.style.marginInline = 'var(--xtend-skeleton-margin-inline, 0)';
  skeleton.style.minWidth = '0';
  skeleton.style.boxSizing = 'border-box';
  skeleton.style.padding = 'var(--xtend-skeleton-padding, 1rem)';
  skeleton.style.borderRadius = 'var(--xtend-skeleton-radius, 8px)';
  skeleton.style.background = 'var(--xtend-skeleton-surface, rgba(148, 163, 184, 0.12))';
  skeleton.style.overflow = 'hidden';
  skeleton.style.contain = 'layout paint';
  if (normalized.minHeight) {
    skeleton.style.minHeight = normalized.minHeight;
  }

  const profile = normalized.profileDescriptor;
  const breakpoint = profile && profile.responsive && profile.responsive.breakpoint || '700px';
  const compactViewport = typeof window.matchMedia === 'function' && window.matchMedia(`(max-width: ${breakpoint})`).matches;
  const viewportProfile = profile && profile.responsive
    ? (compactViewport ? profile.responsive.compact : profile.responsive.wide)
    : null;
  if (profile && profile.gap) skeleton.style.gap = profile.gap;
  if (profile && profile.columns) skeleton.style.gridTemplateColumns = profile.columns;
  if (viewportProfile && viewportProfile.gap) skeleton.style.gap = viewportProfile.gap;
  if (viewportProfile && viewportProfile.columns) skeleton.style.gridTemplateColumns = viewportProfile.columns;
  if (viewportProfile && viewportProfile.minHeight) skeleton.style.minHeight = viewportProfile.minHeight;
  skeleton.setAttribute('data-xtend-skeleton-viewport', compactViewport ? 'compact' : 'wide');

  if (profile && profile.items.length > 0) {
    profile.items.forEach((item) => {
      const skeletonItem = document.createElement('span');
      skeletonItem.setAttribute('data-xtend-skeleton-item', item.kind);
      skeletonItem.setAttribute('data-xtend-skeleton-item-id', item.id);
      skeletonItem.style.display = 'block';
      skeletonItem.style.width = item.width;
      skeletonItem.style.maxWidth = '100%';
      skeletonItem.style.height = item.height;
      skeletonItem.style.borderRadius = item.radius;
      skeletonItem.style.background = 'var(--xtend-skeleton-line-bg, rgba(148, 163, 184, 0.24))';
      skeletonItem.style.boxSizing = 'border-box';
      if (item.gridColumn) skeletonItem.style.gridColumn = item.gridColumn;
      skeleton.appendChild(skeletonItem);
    });
  }

  if (!skeleton.querySelector('[data-xtend-skeleton-item], [data-xtend-skeleton-line]')) {
    for (let index = 0; index < normalized.lines; index += 1) {
      const line = document.createElement('span');
      line.setAttribute('data-xtend-skeleton-line', '');
      applySkeletonLineStyle(line, index, normalized.lines);
      skeleton.appendChild(line);
    }
  }

  skeleton.setAttribute('data-xtend-skeleton-visual-count', String(skeleton.children.length));

  return skeleton;
}

function skeletonHasVisualRecords(skeleton) {
  return Boolean(skeleton && typeof skeleton.querySelector === 'function' && skeleton.querySelector(
    '[data-xtend-skeleton-item], [data-xtend-skeleton-line]'
  ));
}

function findDirectSkeleton(target) {
  if (!target || typeof target.querySelector !== 'function') return null;
  try {
    return target.querySelector(':scope > [data-xtend-skeleton-loader]');
  } catch (_) {
    return Array.from(target.children || []).find((child) => (
      child && child.getAttribute && child.hasAttribute('data-xtend-skeleton-loader')
    )) || null;
  }
}

function skeletonTargetHasContent(target) {
  if (!target) return false;
  const nodes = target.childNodes
    ? Array.from(target.childNodes)
    : Array.from(target.children || []);
  return nodes.some((node) => {
    if (!node) return false;
    if (node.nodeType === 3) return Boolean(String(node.textContent || '').trim());
    const isElement = node.nodeType === 1 || typeof node.hasAttribute === 'function';
    if (!isElement) return false;
    return !(typeof node.hasAttribute === 'function' && node.hasAttribute('data-xtend-skeleton-loader'));
  });
}

function applySkeletonLayoutMode(target, skeleton, requestedMode = 'auto') {
  const normalizedMode = normalizeSkeletonLayoutMode(requestedMode);
  const mode = normalizedMode === 'auto'
    ? (skeletonTargetHasContent(target) ? 'overlay' : 'flow')
    : normalizedMode;
  if (target && target.nodeType === 1 && typeof target.setAttribute === 'function') {
    target.setAttribute('data-xtend-skeleton-mode', mode);
  }
  if (skeleton && typeof skeleton.setAttribute === 'function') {
    skeleton.setAttribute('data-xtend-skeleton-mode', mode);
  }
  return mode;
}

function restoreSkeletonForDisplay(skeleton) {
  if (!skeleton || typeof skeleton.removeAttribute !== 'function') return;
  skeleton.removeAttribute('data-xtend-skeleton-hidden');
  skeleton.removeAttribute('aria-hidden');
  skeleton.removeAttribute('inert');
  skeleton.setAttribute('role', 'status');
  skeleton.setAttribute('aria-live', 'polite');
}

function showSkeleton(target, options = {}) {
  if (!target || typeof target.appendChild !== 'function') return null;
  const normalized = normalizeSkeletonLoaderOptions(options);
  const existing = findDirectSkeleton(target);
  const reusable = existing &&
    skeletonHasVisualRecords(existing) &&
    existing.getAttribute('data-xtend-skeleton-profile') === normalized.profile &&
    existing.getAttribute('data-xtend-skeleton-variant') === normalized.variant;
  if (reusable) {
    existing.setAttribute('data-xtend-skeleton-source', normalized.source);
    existing.setAttribute('data-xtend-skeleton-schedule', normalized.schedule);
    existing.setAttribute('aria-label', normalized.label);
    if (target.nodeType === 1 && typeof target.setAttribute === 'function') {
      target.setAttribute('data-xtend-skeleton-active', 'true');
      target.setAttribute('aria-busy', 'true');
    }
    applySkeletonLayoutMode(target, existing, normalized.layoutMode);
    restoreSkeletonForDisplay(existing);
    if (target.nodeType === 1 && typeof target.removeAttribute === 'function') {
      target.removeAttribute('data-xtend-skeleton-cache');
    }
    return existing;
  }
  if (existing) existing.remove();

  if (target.nodeType === 1 && typeof target.setAttribute === 'function') {
    target.setAttribute('data-xtend-skeleton-active', 'true');
    target.setAttribute('aria-busy', 'true');
  }

  const skeleton = createSkeletonLoader(normalized);
  applySkeletonLayoutMode(target, skeleton, normalized.layoutMode);
  target.appendChild(skeleton);
  if (target.nodeType === 1 && typeof target.removeAttribute === 'function') {
    target.removeAttribute('data-xtend-skeleton-cache');
  }
  return skeleton;
}

function hideSkeleton(target, options = {}) {
  if (!target) return 0;
  const skeletons = Array.from(target.children || []).filter((child) => (
    child && child.getAttribute && child.hasAttribute('data-xtend-skeleton-loader')
  ));
  const layoutMode = target && typeof target.getAttribute === 'function'
    ? target.getAttribute('data-xtend-skeleton-mode')
    : null;
  const retainOverlay = skeletons.length > 0 && layoutMode === 'overlay' && skeletonTargetHasContent(target);
  skeletons.forEach((skeleton) => {
    if (!retainOverlay) {
      skeleton.remove();
      return;
    }
    skeleton.setAttribute('data-xtend-skeleton-hidden', 'true');
    skeleton.setAttribute('aria-hidden', 'true');
    skeleton.setAttribute('inert', '');
    skeleton.removeAttribute('role');
    skeleton.removeAttribute('aria-live');
    if (target.lastElementChild !== skeleton) target.appendChild(skeleton);
  });
  if (target.nodeType === 1 && typeof target.removeAttribute === 'function') {
    if (retainOverlay) {
      target.setAttribute('data-xtend-skeleton-cache', 'overlay');
    } else {
      target.removeAttribute('data-xtend-skeleton-cache');
    }
    target.removeAttribute('data-xtend-skeleton-active');
    target.removeAttribute('data-xtend-skeleton-mode');
    if (!options.preserveBusy) {
      target.removeAttribute('aria-busy');
    }
  }
  return skeletons.length;
}

const SkeletonLoader = Object.freeze({
  schema: SKELETON_LOADER_CONTRACT,
  profileSchema: SKELETON_PROFILE_CONTRACT,
  registerProfile: registerSkeletonProfile,
  getProfile: getSkeletonProfile,
  listProfiles: listSkeletonProfiles,
  create: createSkeletonLoader,
  show: showSkeleton,
  hide: hideSkeleton
});

const XTendStyleRegistry = Object.freeze({
  schema: STYLE_REGISTRY_CONTRACT,
  runtimeStylesContract: RUNTIME_STYLES_CONTRACT,
  runtimeStyleKey: RUNTIME_STYLE_KEY,
  standardThemeStylesheet: STANDARD_THEME_STYLESHEET,
  ensureRuntimeStyles,
  ensureDocumentStyle,
  defineComponentStyle,
  adopt: adoptStyle,
  adoptStyle,
  get: getRegisteredStyle,
  getThemeStylesheetState,
  list: listRegisteredStyles
});

async function ensureComponent(tag, options = {}) {
  const normalized = normalizeComponentTag(tag);
  if (!isCustomElementTag(normalized) || !window.customElements) return false;
  if (customElements.get(normalized)) return true;

  if (!options.skipBootWait && window.__XTendLoaderBootPromise) {
    await Promise.resolve(window.__XTendLoaderBootPromise).catch(() => null);
    if (customElements.get(normalized)) return true;
  }

  const manifest = options.manifest || getActiveManifest();
  const url = manifest[normalized];
  if (url) {
    await tryLoad(normalized, url);
  }

  await waitForCustomElementDefinition(normalized);
  return Boolean(customElements.get(normalized));
}

async function hydrateTree(root = document, options = {}) {
  if (!options.skipBootWait && window.__XTendLoaderBootPromise) {
    await Promise.resolve(window.__XTendLoaderBootPromise).catch(() => null);
  }

  const tags = collectTreeComponentTags(root, options);
  await Promise.all(tags.map((tag) => ensureComponent(tag, { ...options, skipBootWait: true })));

  let hydrated = 0;
  const elements = collectTreeElements(root);
  elements.forEach((element) => {
    if (!element || !element.isConnected) return;
    if (typeof element.hydrate === 'function') {
      element.hydrate();
      hydrated += 1;
    }
  });

  const detail = {
    schema: 'xtend.loader.dynamic-tree-hydration.v1',
    source: options.source || 'xtend-loader',
    reason: options.reason || 'dynamic-subtree',
    schedule: options.schedule || 'component.dynamic.hydrate',
    tags,
    elementCount: elements.length,
    hydrated
  };
  window.dispatchEvent(new CustomEvent('xtend-loader-tree-hydrated', { detail }));
  return detail;
}

function isCustomElementTag(tag) {
  return typeof tag === 'string' && tag.includes('-');
}

function isBootstrapModuleTag(tag) {
  return BOOTSTRAP_MODULE_KEYS.includes(tag);
}

function waitForCustomElementDefinition(tag) {
  if (!window.customElements || !isCustomElementTag(tag)) {
    return Promise.resolve();
  }
  if (customElements.get(tag)) {
    return Promise.resolve();
  }
  return Promise.race([
    customElements.whenDefined(tag),
    new Promise((resolve) => {
      window.setTimeout(resolve, CUSTOM_ELEMENT_DEFINE_TIMEOUT_MS);
    })
  ]);
}

async function measureLoaderPhase(name, task, metadata = {}) {
  if (typeof task !== 'function') {
    throw new TypeError('XTend Loader performance measurement requires a task function.');
  }

  const target = getPerformanceTarget();
  const measurementId = `xtend.loader.measurement.${++loaderMeasurementCounter}`;
  const startMark = `${name}.start.${measurementId}`;
  const endMark = `${name}.end.${measurementId}`;
  const startedAt = performanceNow(target);
  markPerformance(target, startMark);

  try {
    const value = await task();
    finishLoaderMeasurement({
      id: measurementId,
      name,
      status: 'completed',
      startedAt,
      target,
      startMark,
      endMark,
      metadata
    });
    return value;
  } catch (error) {
    finishLoaderMeasurement({
      id: measurementId,
      name,
      status: 'failed',
      startedAt,
      target,
      startMark,
      endMark,
      metadata: {
        ...metadata,
        error: error && error.message ? error.message : String(error)
      }
    });
    throw error;
  }
}

function finishLoaderMeasurement(measurement) {
  const target = measurement.target;
  markPerformance(target, measurement.endMark);
  measurePerformance(target, measurement.name, measurement.startMark, measurement.endMark);

  const durationMs = Math.max(0, performanceNow(target) - measurement.startedAt);
  const detail = {
    schema: PERFORMANCE_MEASUREMENT_CONTRACT,
    id: measurement.id,
    name: measurement.name,
    phase: LOADER_PERFORMANCE_PHASES[measurement.name] || 'load',
    durationMs: Number(durationMs.toFixed(2)),
    sampleKind: 'local',
    status: measurement.status,
    metadata: measurement.metadata || {}
  };
  loaderMeasurements.push(detail);
  emitLoaderPerformance(detail);
}

function getPerformanceTarget() {
  return window && window.performance ? window.performance : null;
}

function performanceNow(target) {
  return target && typeof target.now === 'function' ? target.now() : Date.now();
}

function markPerformance(target, markName) {
  if (!target || typeof target.mark !== 'function') return;
  try {
    target.mark(markName);
  } catch (_) {
    // Partial Performance APIs must not break the loader path.
  }
}

function measurePerformance(target, measureName, startMark, endMark) {
  if (!target || typeof target.measure !== 'function') return;
  try {
    target.measure(measureName, startMark, endMark);
  } catch (_) {
    // Some hosts expose mark without measure; the local measurement event still carries duration.
  }
}

async function initializeApi(manifest) {
  try {
    const apiUrl = new URL('./api.js', import.meta.url).href;
    const importPolicy = classifyLoaderUrl(apiUrl, {
      kind: 'module',
      baseUrl: import.meta.url,
      source: 'api'
    });
    if (!importPolicy.ok) {
      emitSecurityDiagnostic('xtend.security.import.refused', 'XTend API Import wurde durch die Loader Policy verweigert', {
        policy: IMPORT_POLICY_CONTRACT,
        url: apiUrl,
        diagnostics: importPolicy.diagnostics
      });
      return;
    }

    const api = await import(importPolicy.url);
    if (api && typeof api.initXTendAPI === 'function') {
      await api.initXTendAPI(manifest);
    }
  } catch (error) {
    emitLoaderDiagnostic('xtend.loader.api.init_failed', 'error', 'XTend API konnte nicht initialisiert werden', {
      message: error && error.message ? error.message : String(error)
    });
    console.error('XTend API Initialisierung fehlgeschlagen:', error);
  }
}

function classifyManifestRecord(tag, recordValue, baseUrl) {
  const normalizedTag = typeof tag === 'string' ? tag.trim().toLowerCase() : '';
  const diagnostics = [];

  if (!normalizedTag || normalizedTag !== tag || !isAllowedManifestKey(normalizedTag)) {
    diagnostics.push('xtend.security.manifest.invalid.tag');
  }

  if (typeof recordValue !== 'string' || !recordValue.trim()) {
    diagnostics.push('xtend.security.manifest.invalid.url');
  }

  const importPolicy = typeof recordValue === 'string'
    ? classifyLoaderUrl(recordValue, {
      kind: 'module',
      baseUrl,
      source: normalizedTag || 'manifest-record'
    })
    : null;

  if (importPolicy && !importPolicy.ok) {
    diagnostics.push(...importPolicy.diagnostics);
  }

  return {
    schema: MANIFEST_POLICY_CONTRACT,
    ok: diagnostics.length === 0,
    tag: normalizedTag,
    url: importPolicy ? importPolicy.url : null,
    diagnostics
  };
}

function isAllowedManifestKey(tag) {
  return RESERVED_MANIFEST_KEYS.includes(tag) || CUSTOM_ELEMENT_NAME_PATTERN.test(tag);
}

function classifyLoaderUrl(value, options = {}) {
  const kind = options.kind || 'module';
  const baseUrl = options.baseUrl || document.baseURI;
  const currentUrl = safeUrl(window.location.href, document.baseURI);
  const targetUrl = safeUrl(value, baseUrl);
  const diagnostics = [];

  if (!targetUrl || !currentUrl) {
    diagnostics.push('xtend.security.import.refused.invalid_url');
  } else if (hasTraversalLikeInput(value)) {
    diagnostics.push('xtend.security.import.refused.path_traversal');
  } else if (REFUSED_IMPORT_PROTOCOLS.includes(targetUrl.protocol)) {
    diagnostics.push('xtend.security.import.refused.protocol');
  } else if (!ALLOWED_IMPORT_PROTOCOLS.includes(targetUrl.protocol)) {
    diagnostics.push('xtend.security.import.refused.protocol');
  } else if (hasPathTraversal(targetUrl)) {
    diagnostics.push('xtend.security.import.refused.path_traversal');
  } else if (!hasAllowedImportExtension(targetUrl, kind)) {
    diagnostics.push(kind === 'manifest'
      ? 'xtend.security.manifest.invalid.extension'
      : 'xtend.security.import.refused.extension');
  } else if (!isAllowedLocalUrl(targetUrl, currentUrl)) {
    diagnostics.push(kind === 'manifest'
      ? 'xtend.security.loader.refused.external_manifest'
      : 'xtend.security.import.refused.external_module');
  }

  return {
    schema: IMPORT_POLICY_CONTRACT,
    ok: diagnostics.length === 0,
    kind,
    source: options.source || kind,
    url: targetUrl ? targetUrl.href : null,
    diagnostics
  };
}

function safeUrl(value, baseUrl) {
  try {
    return new URL(String(value), baseUrl);
  } catch (_) {
    return null;
  }
}

function isAllowedLocalUrl(targetUrl, currentUrl) {
  if (targetUrl.origin === currentUrl.origin) {
    return true;
  }

  if (targetUrl.protocol === 'file:' && currentUrl.protocol === 'file:') {
    return true;
  }

  return isLocalHost(targetUrl.hostname) && (
    isLocalHost(currentUrl.hostname) ||
    currentUrl.protocol === 'file:'
  );
}

function isLocalHost(hostname = '') {
  const normalized = String(hostname).replace(/^\[|\]$/g, '').toLowerCase();
  return LOCAL_IMPORT_HOSTS.includes(normalized);
}

function hasPathTraversal(url) {
  try {
    return decodeURIComponent(url.pathname).split('/').includes('..');
  } catch (_) {
    return true;
  }
}

function hasTraversalLikeInput(value) {
  try {
    const pathPart = decodeURIComponent(String(value)).split(/[?#]/)[0];
    return pathPart === '..' ||
      pathPart.startsWith('../') ||
      pathPart.includes('/../') ||
      pathPart.endsWith('/..');
  } catch (_) {
    return true;
  }
}

function hasAllowedImportExtension(url, kind) {
  const pathname = url.pathname.toLowerCase();
  const extensions = kind === 'manifest'
    ? ALLOWED_MANIFEST_EXTENSIONS
    : ALLOWED_MODULE_EXTENSIONS;
  return extensions.some((extension) => pathname.endsWith(extension));
}

function emitSecurityDiagnostic(code, message, metadata = {}) {
  emitLoaderDiagnostic(code, 'error', message, {
    security: true,
    loaderPolicy: LOADER_POLICY_CONTRACT,
    manifestPolicy: MANIFEST_POLICY_CONTRACT,
    importPolicy: IMPORT_POLICY_CONTRACT,
    ...metadata
  });
}

function emitLoaderDiagnostic(code, level, message, metadata = {}) {
  const detail = {
    schema: 'xtend.fabric.diagnostic.v1',
    code,
    level,
    message,
    source: 'loader',
    phase: 'load',
    metadata
  };

  window.dispatchEvent(new CustomEvent('xtend-loader-diagnostic', { detail }));
}

function emitLoaderPerformance(detail) {
  window.dispatchEvent(new CustomEvent('xtend-loader-performance', { detail }));
}

window.XTendLoader = Object.freeze({
  schema: LOADER_CONTRACT,
  loaderPolicy: LOADER_POLICY_CONTRACT,
  manifestPolicy: MANIFEST_POLICY_CONTRACT,
  importPolicy: IMPORT_POLICY_CONTRACT,
  styleRegistry: XTendStyleRegistry,
  styles: XTendStyleRegistry,
  styleRegistryContract: STYLE_REGISTRY_CONTRACT,
  runtimeStylesContract: RUNTIME_STYLES_CONTRACT,
  skeletonLoader: SkeletonLoader,
  skeletonLoaderContract: SKELETON_LOADER_CONTRACT,
  skeletonProfileContract: SKELETON_PROFILE_CONTRACT,
  verbose: configureLoaderVerbose,
  setVerbose: setLoaderVerbose,
  enableVerbose: () => setLoaderVerbose(true),
  disableVerbose: () => setLoaderVerbose(false),
  getVerboseMode: getLoaderVerboseMode,
  getVerboseState: getLoaderVerboseState,
  isVerbose: isLoaderVerboseEnabled,
  ensureRuntimeStyles,
  defineComponentStyle,
  adoptStyle,
  getThemeStylesheetState,
  createSkeleton: createSkeletonLoader,
  showSkeleton,
  hideSkeleton,
  ensureComponent,
  hydrateTree,
  initiateXTend
});

window.XTendStyleRegistry = XTendStyleRegistry;
window.XTendSkeletonLoader = SkeletonLoader;
ensureRuntimeStyles({ source: 'loader.evaluate' });

if (!window.__XTendLoaderBootPromise) {
  window.__XTendLoaderBootPromise = initiateXTend();
}
