const DEFAULT_MANIFEST_URL = 'components/manifest.json';
const LOADER_CONTRACT = 'xtend.loader.contract.v1';
const LOADER_POLICY_CONTRACT = 'xtend.security.loader-policy.v1';
const MANIFEST_POLICY_CONTRACT = 'xtend.security.manifest-policy.v1';
const IMPORT_POLICY_CONTRACT = 'xtend.security.import-policy.v1';
const PERFORMANCE_MEASUREMENT_CONTRACT = 'xtend.performance.measurement.v1';
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
const RESERVED_MANIFEST_KEYS = ['xstate'];
const CUSTOM_ELEMENT_NAME_PATTERN = /^[a-z][a-z0-9]*-[a-z0-9-]*[a-z0-9]$/;
const MODULE_CACHE_BUST_PARAM = 'xtend-cache';
const LOADER_VERBOSE_CONTRACT = 'xtend.loader.verbose.v1';
const LOADER_VERBOSE_STORAGE_KEY = 'xtend.loader.verbose';

// Loader-local PROD verbosity switch. Supported values: 'true', 'false', 'auto'.
const verbose_mode = 'auto';

const loadedTags = new Set();
const loaderMeasurements = [];
let loaderMeasurementCounter = 0;
let loaderVerboseRuntimeEnabled = readLoaderVerbosePreference();
let activeManifest = {};

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

async function initiateXTend(options = {}) {
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
  if (!cacheBust || tag === 'xstate') return moduleUrl;
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
    if (isCustomElementTag(tag)) {
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
  verbose: configureLoaderVerbose,
  setVerbose: setLoaderVerbose,
  enableVerbose: () => setLoaderVerbose(true),
  disableVerbose: () => setLoaderVerbose(false),
  getVerboseMode: getLoaderVerboseMode,
  getVerboseState: getLoaderVerboseState,
  isVerbose: isLoaderVerboseEnabled,
  ensureComponent,
  hydrateTree,
  initiateXTend
});

if (!window.__XTendLoaderBootPromise) {
  window.__XTendLoaderBootPromise = initiateXTend();
}
