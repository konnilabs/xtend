const DOCS_RMT_RENDER_SCHEMA = 'xtend.docs.parsedown-rmt-render.v1';
const DOCS_RMT_PRODUCTION_HARDENING_SCHEMA = 'xtend.epic13.docs-rmt-production-hardening.v1';
const DOCS_RMT_TRUST_BOUNDARY = 'xtend.security.sanitizing-boundary.v1';
const DOCS_RMT_TRUSTED_DOM_PROOF_SCHEMA = 'xtend.epic13.trusted-dom-boundary.v1';
const DOCS_RMT_TRUSTED_DOM_SANITIZER = 'xtend.security.trusted-dom-sanitizer.v1';
const DOCS_RMT_PARSEDOWN_ENDPOINT = 'xtendrmt.docs.parsedown.parse';
const DOCS_RMT_DEFAULT_SHELL_TEMPLATE = 'docs.app.shell';
const DOCS_RMT_DEFAULT_SEARCH_TEMPLATE = 'docs.header.search';
const DOCS_RMT_DEFAULT_DIAGNOSTICS_SCHEDULE = 'docs.diagnostics.snapshot';
const DOCS_SHELL_SHADOW_STYLE_ID = 'xtend-docs-shell-shadow-styles';
const DOCS_RMT_EXTENSION_SLOTS = Object.freeze([
  'docs.slot.content',
  'docs.slot.sidebar',
  'docs.slot.related',
  'docs.slot.component-demo',
  'docs.slot.rich-content',
  'docs.slot.media',
  'docs.slot.diagnostics'
]);
const DOCS_TRUSTED_DOM_FORBIDDEN_TAGS = Object.freeze([
  'script',
  'iframe',
  'object',
  'embed',
  'link',
  'meta',
  'base',
  'form'
]);
const DOCS_TRUSTED_DOM_URL_ATTRIBUTES = Object.freeze(['href', 'src', 'action', 'poster']);
const DOCS_COMPONENT_DEMOS = Object.freeze(createDocsComponentDemos());
const DOCS_ROUTE_CONTENT_CACHE_LIMIT = 32;
const DOCS_ROUTE_IDLE_TIMEOUT_MS = 520;
const DOCS_ROUTE_CONTENT_CACHE = new Map();
const DOCS_ROUTE_PAYLOAD_PROMISES = new Map();
const DOCS_I18N_SCHEMA = 'xtend.docs.i18n.v1';
const DOCS_I18N_STORAGE_KEY = 'xtend.docs.locale';
const DOCS_SHELL_SCOPED_CSS = `
  #outlet {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
  }
  xtend-doc-page {
    display: block;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
    opacity: 1;
    transform: translateY(0);
    transition: opacity 0.16s ease, transform 0.16s ease;
  }
  xtend-doc-page[data-docs-route-state="loading"] {
    opacity: 0.72;
    transform: translateY(4px);
  }
  xtend-doc-page [data-rmt-shell] {
    transition: border-color 0.16s ease, box-shadow 0.16s ease;
  }
  xtend-doc-page[data-docs-route-state="ready"] [data-rmt-shell] {
    box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
  }
  .docs-shell-toolbar {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.8rem;
  }
  .docs-app-shell {
    display: block;
    width: 100%;
    max-width: none;
    min-width: 0;
    box-sizing: border-box;
    --section-bg: var(--docs-shell-bg);
    --section-padding: 0;
    --main-content-padding: 0;
    --section-gap: 0;
    --border-radius: 0;
  }
  x-section.docs-app-shell::part(container),
  x-section.docs-app-shell::part(content) {
    display: block;
    width: 100%;
    max-width: none;
    min-width: 0;
    flex: 1 1 auto;
    box-sizing: border-box;
    padding: 0;
    overflow: visible;
  }
  .docs-shell-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) var(--docs-sidebar-width, clamp(20rem, 24vw, 27rem));
    gap: var(--docs-layout-gap, clamp(1rem, 2.2vw, 2.5rem));
    align-items: start;
    width: calc(100% - var(--docs-viewport-gutter, 0.5rem) - var(--docs-viewport-gutter, 0.5rem));
    max-width: calc(100% - var(--docs-viewport-gutter, 0.5rem) - var(--docs-viewport-gutter, 0.5rem));
    margin-inline: var(--docs-viewport-gutter, 0.5rem);
    min-width: 0;
    box-sizing: border-box;
  }
  .docs-article-surface,
  .docs-page-sidebar {
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
  }
  .docs-article-surface {
    background: var(--section-bg);
    color: var(--text-color);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: clamp(1rem, 2vw, 2rem);
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
  }
  .docs-page-sidebar {
    position: static;
    display: grid;
    gap: 0.85rem;
    align-self: start;
  }
  .docs-sidebar-section {
    background: var(--docs-sidebar-bg);
    color: var(--text-color);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 0.9rem;
    box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
    box-sizing: border-box;
  }
  .docs-sidebar-heading {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    margin: 0 0 0.65rem;
    font-size: 0.86rem;
    line-height: 1.2;
    color: var(--text-color);
  }
  .docs-sidebar-heading x-icon,
  .docs-related-link x-icon {
    color: var(--primary-color);
    flex: none;
  }
  .docs-sidebar-copy {
    margin: -0.2rem 0 0.75rem;
    color: var(--muted-text-color);
    font-size: 0.88rem;
    line-height: 1.45;
  }
  .docs-related-list {
    display: grid;
    gap: 0.5rem;
  }
  .docs-related-link {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.55rem;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
    min-height: 42px;
    padding: 0.55rem 0.62rem;
    border: 1px solid var(--border-color);
    border-radius: 7px;
    background: var(--docs-sidebar-link-bg);
    color: var(--text-color);
    text-decoration: none;
    transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease, transform 0.16s ease;
  }
  x-link.docs-related-link::part(link) {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.55rem;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
    color: inherit;
    text-decoration: none;
  }
  .docs-related-link:hover,
  .docs-related-link:focus-visible {
    background: var(--docs-sidebar-link-hover-bg);
    border-color: color-mix(in srgb, var(--primary-color) 56%, var(--border-color));
    color: var(--primary-color);
    transform: translateX(2px);
    outline: none;
  }
  .docs-related-link span {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .docs-component-demo[hidden],
  .docs-sidebar-section[hidden] {
    display: none;
  }
  .docs-demo-preview {
    display: grid;
    gap: 0.7rem;
    min-height: 4rem;
    padding: 0.85rem;
    border: 1px solid var(--border-color);
    border-radius: 7px;
    background: var(--surface-muted);
    overflow: visible;
  }
  .docs-demo-preview x-button,
  .docs-demo-preview x-input,
  .docs-demo-preview x-select,
  .docs-demo-preview x-textarea,
  .docs-demo-preview x-status,
  .docs-demo-preview x-progress,
  .docs-demo-preview x-alert,
  .docs-demo-preview x-toast,
  .docs-demo-preview x-tabs,
  .docs-demo-preview x-code,
  .docs-demo-preview x-summary {
    max-width: 100%;
  }
  .docs-demo-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
    align-items: center;
  }
  .docs-demo-code-grid {
    display: grid;
    gap: 0.7rem;
    margin-top: 0.75rem;
  }
  .docs-demo-code-block h3 {
    margin: 0 0 0.35rem;
    color: var(--muted-text-color);
    font-size: 0.78rem;
    text-transform: uppercase;
  }
  .docs-demo-code-block x-code {
    display: block;
    width: 100%;
    min-width: 0;
    margin: 0;
    max-height: 18rem;
    max-width: 100%;
    box-sizing: border-box;
    background: var(--docs-code-bg);
    color: var(--x-code-text, #f8fafc);
    border-radius: 8px;
  }
  .docs-demo-surface-zone {
    position: relative;
    min-height: 15rem;
    overflow: hidden;
    border-radius: 7px;
    background: color-mix(in srgb, var(--surface-muted) 80%, transparent);
  }
  .docs-demo-surface-zone x-surface-window,
  .docs-demo-surface-zone x-side-panel {
    position: absolute;
  }
  .download-link {
    float: none;
    font-size: 0.9em;
  }
  .docs-icon-button {
    --xtend-button-min-touch-target: 44px;
    color: var(--text-color);
    flex: none;
  }
  .docs-icon-button::part(button) {
    width: 44px;
    height: 44px;
    min-width: 44px;
    min-height: 44px;
    padding: 0;
    border: 1px solid var(--border-color);
    border-radius: 999px;
    background: var(--surface-muted);
    color: var(--text-color);
    box-shadow: none;
    backdrop-filter: none;
    transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease, transform 0.16s ease;
  }
  .docs-icon-button:hover::part(button) {
    transform: translateY(-1px);
    border-color: color-mix(in srgb, var(--primary-color) 60%, var(--border-color));
    background: var(--primary-color);
    color: var(--section-bg);
  }
  .docs-icon-button:focus-visible::part(button) {
    outline: 2px solid var(--focus-color);
    outline-offset: 2px;
  }
  .docs-icon-button x-icon {
    pointer-events: none;
  }
  .docs-visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  #md-content {
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
    line-height: 1.65;
  }
  #md-content[data-xtend-skeleton-active="true"] {
    min-height: var(--docs-content-skeleton-min-height, 24rem);
  }
  #md-content[data-xtend-skeleton-active="true"] > :not([data-xtend-skeleton-loader]) {
    visibility: hidden;
  }
  [data-xtend-skeleton-loader] {
    display: grid;
    gap: 0.68rem;
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    min-height: var(--docs-content-skeleton-min-height, 24rem);
    padding: 0;
    border-radius: 8px;
    background: transparent;
    contain: layout paint;
  }
  [data-xtend-skeleton-line] {
    display: block;
    height: 0.82rem;
    border-radius: 999px;
    background: var(--xtend-skeleton-line-bg, rgba(148, 163, 184, 0.24));
  }
  [data-xtend-skeleton-line]:first-child {
    height: 1.35rem;
  }
  #md-content > :first-child {
    margin-top: 0;
  }
  #md-content > :last-child {
    margin-bottom: 0;
  }
  #md-content h1,
  #md-content h2,
  #md-content h3 {
    line-height: 1.18;
    color: var(--text-color);
  }
  #md-content p,
  #md-content li {
    color: var(--text-color);
  }
  #md-content a,
  #md-content x-link {
    color: var(--primary-color);
  }
  #md-content pre {
    max-width: 100%;
    overflow: auto;
    padding: 1rem;
    border-radius: 8px;
    background: var(--docs-code-bg);
    color: #f8fafc;
  }
  #md-content code {
    overflow-wrap: anywhere;
  }
  #md-content blockquote {
    margin: 1rem 0;
    padding: 0.7rem 1rem;
    border-left: 3px solid var(--primary-color);
    background: var(--surface-muted);
    border-radius: 0 7px 7px 0;
  }
  #md-content hr {
    height: 1px;
    margin: 1.75rem 0;
    border: 0;
    background: var(--border-color);
  }
  #md-content table {
    width: 100%;
    border-collapse: collapse;
    display: block;
    overflow-x: auto;
  }
  #md-content th,
  #md-content td {
    border: 1px solid var(--border-color);
    padding: 0.55rem;
  }
  @media (max-width: 700px) {
    .docs-shell-layout {
      grid-template-columns: 1fr;
    }
    .docs-page-sidebar {
      position: static;
    }
    .docs-related-link:hover,
    .docs-related-link:focus-visible,
    xtend-doc-page[data-docs-route-state="loading"] {
      transform: none;
    }
  }
`;

function getDocsAssetUrl(key, fallback) {
  const assets = window.xtendDocsAssetUrls || {};
  return typeof assets[key] === 'string' && assets[key] ? assets[key] : fallback;
}

function escapeDocsHtmlAttribute(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function docsPerfNow() {
  return window.performance && typeof window.performance.now === 'function'
    ? window.performance.now()
    : Date.now();
}

function docsRoundDuration(value) {
  return Math.round(Number(value || 0) * 10) / 10;
}

function getDocsI18nConfig() {
  const config = window.xtendDocsI18n && typeof window.xtendDocsI18n === 'object'
    ? window.xtendDocsI18n
    : {};
  const locales = window.xtendDocsLocales && typeof window.xtendDocsLocales === 'object'
    ? window.xtendDocsLocales
    : { de: { label: 'Deutsch', nativeLabel: 'Deutsch' } };
  const available = Array.isArray(config.available) && config.available.length
    ? config.available.slice()
    : Object.keys(locales);
  const fallbackLocale = config.fallbackLocale || config.defaultLocale || available[0] || 'de';
  return {
    schema: config.schema || DOCS_I18N_SCHEMA,
    defaultLocale: config.defaultLocale || fallbackLocale,
    fallbackLocale,
    storageKey: config.storageKey || DOCS_I18N_STORAGE_KEY,
    stateKeys: {
      locale: 'xtend.docs.locale',
      target: 'xtend.docs.locale.target',
      source: 'xtend.docs.locale.source',
      status: 'xtend.docs.locale.status',
      busy: 'xtend.docs.locale.busy',
      transition: 'xtend.docs.locale.transition',
      error: 'xtend.docs.locale.error',
      available: 'xtend.docs.locale.available',
      fallback: 'xtend.docs.locale.fallback',
      ...(config.stateKeys || {})
    },
    locales,
    available
  };
}

function normalizeDocsLocale(value) {
  const config = getDocsI18nConfig();
  const raw = String(value || '').trim().toLowerCase();
  if (config.available.includes(raw)) return raw;
  const short = raw.slice(0, 2);
  if (config.available.includes(short)) return short;
  return config.fallbackLocale;
}

function readStoredDocsLocale() {
  const config = getDocsI18nConfig();
  try {
    return window.localStorage ? window.localStorage.getItem(config.storageKey) : '';
  } catch (error) {
    return '';
  }
}

function writeStoredDocsLocale(locale) {
  const config = getDocsI18nConfig();
  try {
    if (window.localStorage) window.localStorage.setItem(config.storageKey, locale);
  } catch (error) {
    // Storage can be unavailable in hardened or test environments.
  }
}

function detectBrowserDocsLocale() {
  const languages = Array.isArray(navigator.languages) && navigator.languages.length
    ? navigator.languages
    : [navigator.language || ''];
  for (const language of languages) {
    const locale = normalizeDocsLocale(language);
    if (locale) return locale;
  }
  return getDocsI18nConfig().fallbackLocale;
}

function writeDocsLocaleState(values = {}) {
  if (!window.xstate || typeof window.xstate.set !== 'function') return;
  const keys = getDocsI18nConfig().stateKeys;
  Object.entries(values).forEach(([name, value]) => {
    const stateKey = keys[name];
    if (stateKey) window.xstate.set(stateKey, value);
  });
}

function createDocsLocaleTransitionSnapshot(status, detail = {}) {
  const targetLocale = normalizeDocsLocale(detail.targetLocale || detail.locale || getCurrentDocsLocale());
  const activeLocale = window.xtendDocsCurrentLocale ? normalizeDocsLocale(window.xtendDocsCurrentLocale) : '';
  return {
    schema: 'xtend.docs.locale-transition.v1',
    status,
    busy: status === 'loading',
    activeLocale,
    targetLocale,
    slug: detail.slug || getCurrentDocsSlug(),
    source: detail.source || 'route',
    startedAt: detail.startedAt || (window.__xtendDocsLocaleTransition && window.__xtendDocsLocaleTransition.startedAt) || new Date().toISOString(),
    startedAtMs: detail.startedAtMs || (window.__xtendDocsLocaleTransition && window.__xtendDocsLocaleTransition.startedAtMs) || docsPerfNow(),
    completedAt: status === 'loading' ? null : new Date().toISOString(),
    durationMs: detail.startedAtMs ? docsRoundDuration(docsPerfNow() - detail.startedAtMs) : detail.durationMs || 0,
    token: detail.token || (window.__xtendDocsLocaleTransition && window.__xtendDocsLocaleTransition.token) || 0,
    error: detail.error || null
  };
}

function setDocsLocaleTransitionState(status, detail = {}) {
  const snapshot = createDocsLocaleTransitionSnapshot(status, detail);
  if (status === 'loading') {
    window.__xtendDocsLocaleTransition = snapshot;
  } else if (!window.__xtendDocsLocaleTransition ||
    window.__xtendDocsLocaleTransition.token === snapshot.token ||
    window.__xtendDocsLocaleTransition.targetLocale === snapshot.targetLocale) {
    window.__xtendDocsLocaleTransition = null;
  }
  window.__xtendDocsLocaleLastTransition = snapshot;
  writeDocsLocaleState({
    target: snapshot.targetLocale,
    status,
    busy: snapshot.busy,
    transition: snapshot,
    error: snapshot.error
  });
  document.documentElement.toggleAttribute('data-docs-locale-busy', snapshot.busy);
  document.documentElement.setAttribute('data-docs-locale-status', status);
  updateDocsLocaleBusyUi(snapshot);
  window.dispatchEvent(new CustomEvent('xtend-docs-locale-transition', { detail: snapshot }));
  return snapshot;
}

function beginDocsLocaleTransition(targetLocale, detail = {}) {
  const token = Number(window.__xtendDocsLocaleTransitionToken || 0) + 1;
  window.__xtendDocsLocaleTransitionToken = token;
  return setDocsLocaleTransitionState('loading', {
    ...detail,
    targetLocale,
    token,
    startedAt: new Date().toISOString(),
    startedAtMs: docsPerfNow()
  });
}

function completeDocsLocaleTransition(locale, slug, detail = {}) {
  const normalized = normalizeDocsLocale(locale);
  const pending = window.__xtendDocsLocaleTransition;
  if (pending && (pending.targetLocale !== normalized || pending.slug !== slug)) {
    return false;
  }
  setDocsLocaleTransitionState(detail.status || 'ready', {
    ...detail,
    targetLocale: normalized,
    slug,
    token: pending ? pending.token : detail.token,
    startedAt: pending ? pending.startedAt : detail.startedAt,
    startedAtMs: pending ? pending.startedAtMs : detail.startedAtMs,
    source: pending ? pending.source : detail.source
  });
  updateDocsLocaleUi(normalized, { publish: false, busy: false, slug });
  return true;
}

function parseDocsRoutePath(rawValue) {
  const config = getDocsI18nConfig();
  const raw = String(rawValue || location.hash || '')
    .split('?')[0]
    .replace(/^#\/?/, '')
    .replace(/^\/+/, '');
  if (!raw || raw === '/') {
    return { locale: getCurrentDocsLocale(), slug: 'readme', localized: true };
  }
  const parts = raw.split('/');
  const first = parts[0] || '';
  if (config.available.includes(first)) {
    return {
      locale: normalizeDocsLocale(first),
      slug: parts.slice(1).join('/') || 'readme',
      localized: true
    };
  }
  return {
    locale: getCurrentDocsLocale(),
    slug: raw || 'readme',
    localized: false
  };
}

function publishDocsLocale(locale, source = 'default') {
  const config = getDocsI18nConfig();
  const normalized = normalizeDocsLocale(locale);
  const previous = window.xtendDocsCurrentLocale ? normalizeDocsLocale(window.xtendDocsCurrentLocale) : '';
  const changed = previous !== normalized;
  window.xtendDocsCurrentLocale = normalized;
  document.documentElement.setAttribute('lang', (config.locales[normalized] && config.locales[normalized].htmlLang) || normalized);
  document.documentElement.setAttribute('data-docs-locale', normalized);
  writeDocsLocaleState({
    locale: normalized,
    source,
    target: window.__xtendDocsLocaleTransition ? window.__xtendDocsLocaleTransition.targetLocale : normalized,
    available: config.available.slice(),
    fallback: config.fallbackLocale
  });
  if (!window.__xtendDocsLocaleTransition) {
    writeDocsLocaleState({
      status: 'ready',
      busy: false,
      error: null
    });
  }
  if (changed || source === 'user' || source === 'browser' || source === 'default' || source === 'xstate') {
    window.dispatchEvent(new CustomEvent('xtend-docs-locale-changed', {
      detail: {
        schema: DOCS_I18N_SCHEMA,
        locale: normalized,
        previousLocale: previous || null,
        changed,
        source,
        available: config.available.slice(),
        fallbackLocale: config.fallbackLocale
      }
    }));
  }
  return normalized;
}

function getCurrentDocsLocale() {
  if (window.xtendDocsCurrentLocale) return normalizeDocsLocale(window.xtendDocsCurrentLocale);
  const stored = readStoredDocsLocale();
  if (stored) return publishDocsLocale(stored, 'user');
  return publishDocsLocale(detectBrowserDocsLocale(), 'browser');
}

function getLocalizedDocsPath(slug, locale = getCurrentDocsLocale()) {
  return '/' + normalizeDocsLocale(locale) + '/' + (slug || 'readme');
}

function normalizeDocsRouteHref(slugOrHref, locale = getCurrentDocsLocale()) {
  const parsed = parseDocsRoutePath(slugOrHref || 'readme');
  return getLocalizedDocsPath(parsed.slug || 'readme', locale);
}

function getLocalizedDocsMap(recordName, locale = getCurrentDocsLocale()) {
  const root = window[recordName];
  if (!root || typeof root !== 'object') return {};
  return root[normalizeDocsLocale(locale)] || root[getDocsI18nConfig().fallbackLocale] || {};
}

function createDocsActiveRecordPatch(record, slug) {
  if (!slug || !record || typeof record !== 'object' || !Object.prototype.hasOwnProperty.call(record, slug)) {
    return record || {};
  }
  return { [slug]: record[slug] };
}

function syncLegacyDocsGlobals(locale = getCurrentDocsLocale(), options = {}) {
  const normalized = normalizeDocsLocale(locale);
  const pages = getLocalizedDocsMap('xtendDocsLocalizedPages', normalized);
  const meta = getLocalizedDocsMap('xtendDocsLocalizedPagesMeta', normalized);
  const titles = getLocalizedDocsMap('xtendDocsLocalizedTitles', normalized);
  const slug = options && options.slug ? String(options.slug) : '';
  const pagePatch = createDocsActiveRecordPatch(pages, slug);
  const metaPatch = createDocsActiveRecordPatch(meta, slug);
  const titlePatch = createDocsActiveRecordPatch(titles, slug);
  window.xtendDocsPages = {
    ...(window.xtendDocsPages || {}),
    ...pagePatch
  };
  window.xtendDocsPagesMeta = {
    ...(window.xtendDocsPagesMeta || {}),
    ...metaPatch
  };
  window.xtendDocsTitles = {
    ...(window.xtendDocsTitles || {}),
    ...titlePatch
  };
  return { pages, meta, titles };
}

function rememberDocsCacheEntry(key, value) {
  DOCS_ROUTE_CONTENT_CACHE.set(key, value);
  while (DOCS_ROUTE_CONTENT_CACHE.size > DOCS_ROUTE_CONTENT_CACHE_LIMIT) {
    const firstKey = DOCS_ROUTE_CONTENT_CACHE.keys().next().value;
    DOCS_ROUTE_CONTENT_CACHE.delete(firstKey);
  }
  return value;
}

function createDocsRouteContentCacheKey(slug, html, options = {}) {
  return [
    options.locale || getCurrentDocsLocale(),
    slug || 'readme',
    options.source || 'docs.parsedown',
    options.markupClass || 'parsedownHtml',
    options.trustBoundary || DOCS_RMT_TRUST_BOUNDARY,
    String(html || '')
  ].join('\u0000');
}

function cloneDocsSanitizeResult(result, cacheHit = false) {
  return {
    ...result,
    removed: Array.isArray(result.removed) ? result.removed.slice() : [],
    removedCount: Number(result.removedCount || 0),
    cacheHit
  };
}

function dispatchDocsLaneComplete(detail = {}) {
  window.dispatchEvent(new CustomEvent('xtend-docs-lane-complete', {
    detail: {
      schema: 'xtend.docs.route-lane.v1',
      completedAt: new Date().toISOString(),
      ...detail
    }
  }));
}

function runDocsMeasuredLane(detail, callback) {
  const startedAt = docsPerfNow();
  const result = callback();
  dispatchDocsLaneComplete({
    ...detail,
    durationMs: docsRoundDuration(docsPerfNow() - startedAt)
  });
  return result;
}

function scheduleDocsAfterPaint(callback) {
  let cancelled = false;
  let firstFrame = 0;
  let secondFrame = 0;
  const run = () => {
    if (!cancelled) callback();
  };
  if (typeof window.requestAnimationFrame === 'function') {
    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(run);
    });
    return () => {
      cancelled = true;
      if (firstFrame) window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
    };
  }
  const timer = window.setTimeout(run, 0);
  return () => {
    cancelled = true;
    window.clearTimeout(timer);
  };
}

function scheduleDocsIdle(callback, timeout = DOCS_ROUTE_IDLE_TIMEOUT_MS) {
  let cancelled = false;
  const run = (deadline) => {
    if (!cancelled) callback(deadline || null);
  };
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(run, { timeout });
    return () => {
      cancelled = true;
      window.cancelIdleCallback(id);
    };
  }
  const timer = window.setTimeout(run, Math.min(80, timeout));
  return () => {
    cancelled = true;
    window.clearTimeout(timer);
  };
}

function getXtendSkeletonLoader() {
  if (window.XTendSkeletonLoader && typeof window.XTendSkeletonLoader.show === 'function') {
    return window.XTendSkeletonLoader;
  }
  if (window.XTendLoader && window.XTendLoader.skeletonLoader && typeof window.XTendLoader.skeletonLoader.show === 'function') {
    return window.XTendLoader.skeletonLoader;
  }
  if (window.XTendLoader && typeof window.XTendLoader.showSkeleton === 'function') {
    return {
      schema: window.XTendLoader.skeletonLoaderContract || 'xtend.loader.skeleton-loader.v1',
      show: window.XTendLoader.showSkeleton,
      hide: window.XTendLoader.hideSkeleton
    };
  }
  return null;
}

function showDocsSkeleton(target, options = {}) {
  if (!target) return null;
  const loader = getXtendSkeletonLoader();
  const skeletonOptions = {
    variant: options.variant || 'article',
    lines: options.lines || 10,
    minHeight: options.minHeight || '24rem',
    label: options.label || 'Dokumentation wird geladen',
    source: options.source || 'docs.parsedown',
    schedule: options.schedule || 'docs.markdown.parse'
  };
  if (loader && typeof loader.show === 'function') {
    return loader.show(target, skeletonOptions);
  }
  target.setAttribute('data-xtend-skeleton-active', 'true');
  target.setAttribute('aria-busy', 'true');
  const skeleton = document.createElement('div');
  skeleton.setAttribute('data-xtend-skeleton-loader', '');
  skeleton.setAttribute('role', 'status');
  skeleton.setAttribute('aria-label', skeletonOptions.label);
  const widths = ['72%', '94%', '84%', '58%', '88%', '66%'];
  for (let index = 0; index < skeletonOptions.lines; index += 1) {
    const line = document.createElement('span');
    line.setAttribute('data-xtend-skeleton-line', '');
    line.style.width = widths[index % widths.length];
    skeleton.appendChild(line);
  }
  target.appendChild(skeleton);
  return skeleton;
}

function hideDocsSkeleton(target, options = {}) {
  if (!target) return 0;
  const loader = getXtendSkeletonLoader();
  if (loader && typeof loader.hide === 'function') {
    return loader.hide(target, options);
  }
  const skeletons = Array.from(target.querySelectorAll ? target.querySelectorAll('[data-xtend-skeleton-loader]') : []);
  skeletons.forEach((skeleton) => skeleton.remove());
  target.removeAttribute('data-xtend-skeleton-active');
  if (!options.preserveBusy) target.removeAttribute('aria-busy');
  return skeletons.length;
}

function createRmtSnippet(tag, attributes = {}, children = []) {
  const component = String(tag || 'x-component');
  const id = component.replace(/^x-/, '').replace(/[^A-Za-z0-9_-]+/g, '-');
  const attributeLines = Object.entries(attributes || {})
    .map(([key, value]) => `      ${key} ${JSON.stringify(value)}`);
  const childCount = Array.isArray(children) ? children.length : 0;
  return [
    `template docs.demo.${id} {`,
    '  portal surface.root root "#docs-demo-root" layer surface',
    '',
    `  state docs.demo.${id}.props type object preserve {`,
    '    initial {',
    ...attributeLines,
    `      childCount ${childCount}`,
    '    }',
    '  }',
    '',
    `  surface docs.demo.${id} kind component component ${component} {`,
    `    source state docs.demo.${id}.props`,
    '    portal surface.root',
    '    lane visible weight 50 {',
    `      hydrate ${id}-preview`,
    '    }',
    '  }',
    '}'
  ].join('\n');
}

function createDocsComponentDemos() {
  const demos = {};
  const add = (slug, tag, title, description, html, options = {}) => {
    demos[slug] = {
      tag,
      title,
      description,
      html,
      previewHtml: options.previewHtml || html,
      rmt: options.rmt || createRmtSnippet(tag, options.attributes || {}, options.children || []),
      actions: options.actions || []
    };
  };

  add('components-xbutton', 'x-button', 'x-button', 'Varianten, Iconographie und Button-Events direkt testen.', '<x-button variant="primary"><x-icon name="rocket" pack="lucide" decorative size="1rem"></x-icon>Deploy preview</x-button>', {
    attributes: { variant: 'primary' },
    children: [
      { tag: 'x-icon', attributes: { name: 'rocket', pack: 'lucide', decorative: true, size: '1rem' } },
      'Deploy preview'
    ]
  });
  add('components-xicon', 'x-icon', 'x-icon', 'Lokale Icon-Packs fuer Shell-Actions und Link-Signale.', '<div class="docs-demo-actions"><x-icon name="sparkles" pack="lucide" label="Innovation" size="1.4rem"></x-icon><x-icon name="shield-check" pack="lucide" label="Safety" size="1.4rem"></x-icon><x-icon name="route" pack="lucide" label="Routing" size="1.4rem"></x-icon></div>', {
    attributes: { name: 'sparkles', pack: 'lucide', label: 'Innovation', size: '1.4rem' }
  });
  add('components-xlink', 'x-link', 'x-link', 'Hash-Routing mit visuell klarer Link-Affordance.', '<x-link class="docs-related-link" href="/quick-start-guide"><x-icon name="arrow-up-right" pack="lucide" decorative size="1rem"></x-icon><span>Quick Start Guide</span><x-icon name="chevron-right" pack="lucide" decorative size="1rem"></x-icon></x-link>', {
    attributes: { href: '/quick-start-guide' },
    children: ['Quick Start Guide']
  });
  add('components-xinput', 'x-input', 'x-input', 'Darkmode-faehige Eingabe als Shell-Suchfeld oder Form-Control.', '<x-input name="project" placeholder="Microfrontend suchen..." value="Surface Workbench"></x-input>', {
    attributes: { name: 'project', placeholder: 'Microfrontend suchen...', value: 'Surface Workbench' }
  });
  add('components-xform', 'x-form', 'x-form', 'Komponierte Formular-Shell mit XTend Controls.', '<x-form><x-input name="name" placeholder="App Shell Name"></x-input><x-button variant="primary">Validieren</x-button></x-form>', {
    attributes: {},
    children: [
      { tag: 'x-input', attributes: { name: 'name', placeholder: 'App Shell Name' } },
      { tag: 'x-button', attributes: { variant: 'primary' }, children: ['Validieren'] }
    ]
  });
  add('components-xselect', 'x-select', 'x-select', 'Auswahl-Control mit nativer Select-Semantik.', '<x-select label="Surface Type" placeholder="Bitte waehlen" value="window"><option value="window">Window</option><option value="side-panel">Side Panel</option><option value="modal">Modal</option></x-select>', {
    attributes: { label: 'Surface Type', placeholder: 'Bitte waehlen', value: 'window' },
    children: [
      { tag: 'option', attributes: { value: 'window' }, children: ['Window'] },
      { tag: 'option', attributes: { value: 'side-panel' }, children: ['Side Panel'] },
      { tag: 'option', attributes: { value: 'modal' }, children: ['Modal'] }
    ]
  });
  add('components-xcheckbox', 'x-checkbox', 'x-checkbox', 'Boolean-Settings fuer Shell Preferences.', '<x-checkbox name="remember" checked>Layout wiederherstellen</x-checkbox>', {
    attributes: { name: 'remember', checked: true },
    children: ['Layout wiederherstellen']
  });
  add('components-xradio', 'x-radio', 'x-radio', 'Einzeloptionen fuer kompakte Einstellbereiche.', '<div class="docs-demo-actions"><x-radio name="density" value="compact" checked>Compact</x-radio><x-radio name="density" value="comfortable">Comfortable</x-radio></div>', {
    attributes: { name: 'density', value: 'compact', checked: true },
    children: ['Compact']
  });
  add('components-xtextarea', 'x-textarea', 'x-textarea', 'Mehrzeilige Eingabe fuer Prompts, Notes oder Config-Fragmente.', '<x-textarea name="notes" rows="4" placeholder="Lifecycle notes">Hydrate shell, then schedule content.</x-textarea>', {
    attributes: { name: 'notes', rows: '4', placeholder: 'Lifecycle notes' },
    children: ['Hydrate shell, then schedule content.']
  });
  add('components-xcalendar', 'x-calendar', 'x-calendar', 'Datumsauswahl mit Grid-Interaktion.', '<x-calendar></x-calendar>');
  add('components-xstatus', 'x-status', 'x-status', 'Statuszeilen fuer Shell- und Lifecycle-Zustaende.', '<x-status type="success" state="ready" message="Surface stack synchronized">Surface stack synchronized</x-status>', {
    attributes: { type: 'success', state: 'ready', message: 'Surface stack synchronized' },
    children: ['Surface stack synchronized']
  });
  add('components-xprogress', 'x-progress', 'x-progress', 'Fortschritt fuer Hydration, Import und Scheduler-Arbeit.', '<x-progress value="68" max="100" label="Hydration" status="68 Prozent">68 Prozent</x-progress>', {
    attributes: { value: '68', max: '100', label: 'Hydration', status: '68 Prozent' },
    children: ['68 Prozent']
  });
  add('components-xalert', 'x-alert', 'x-alert', 'Inline Feedback mit A11y-Live-Region.', '<x-alert type="info" closable>RMT shell rendered, Parsedown content scheduled.</x-alert>', {
    attributes: { type: 'info', closable: true },
    children: ['RMT shell rendered, Parsedown content scheduled.']
  });
  add('components-xtoast', 'x-toast', 'x-toast', 'Toast Feedback per API oder direktes Element.', '<div class="docs-demo-actions"><x-button data-demo-action="toast" variant="primary">Toast anzeigen</x-button></div>', {
    attributes: { type: 'success', duration: '3000' },
    children: ['Gespeichert'],
    actions: ['toast']
  });
  add('components-xmodal', 'x-modal', 'x-modal', 'Modales Overlay mit Focus Trap, Escape und xstate-Sync.', '<div class="docs-demo-actions"><x-button data-demo-action="open-modal" variant="primary">Modal testen</x-button></div><x-modal id="docs-demo-modal" title="Release Check" content="XTend Modal laeuft in der Docs Shell." overlay></x-modal>', {
    attributes: { id: 'docs-demo-modal', title: 'Release Check', content: 'XTend Modal laeuft in der Docs Shell.', overlay: true },
    actions: ['open-modal']
  });
  add('components-xdialog', 'x-dialog', 'x-dialog', 'Dialog-Surface fuer bestaetigende UI-Flows.', '<div class="docs-demo-actions"><x-button data-demo-action="open-dialog" variant="secondary">Dialog testen</x-button></div><x-dialog id="docs-demo-dialog" title="Dialog Surface" width="420px" height="220px" overlay>RMT kann Dialoge als Shell-Surfaces beschreiben.</x-dialog>', {
    attributes: { id: 'docs-demo-dialog', title: 'Dialog Surface', width: '420px', height: '220px', overlay: true },
    children: ['RMT kann Dialoge als Shell-Surfaces beschreiben.'],
    actions: ['open-dialog']
  });
  add('components-xdrawer', 'x-drawer', 'x-drawer', 'Drawer mit Trigger-Slot fuer Tooling- und Navigationsflaechen.', '<x-drawer id="docs-demo-drawer" label="Inspector" placement="right"><x-button slot="trigger" variant="secondary">Drawer oeffnen</x-button><p>Inspector-Panel fuer Shell-Metadaten.</p></x-drawer>', {
    attributes: { id: 'docs-demo-drawer', label: 'Inspector', placement: 'right' },
    children: [
      { tag: 'x-button', attributes: { slot: 'trigger', variant: 'secondary' }, children: ['Drawer oeffnen'] },
      { tag: 'p', children: ['Inspector-Panel fuer Shell-Metadaten.'] }
    ]
  });
  add('components-xpopover', 'x-popover', 'x-popover', 'Kontextpanel mit Trigger, Placement und optionaler Modalitaet.', '<x-popover id="docs-demo-popover" placement="bottom"><x-button slot="trigger" variant="secondary">Popover</x-button><p>Microcopy, Actions oder kurze Settings.</p></x-popover>', {
    attributes: { id: 'docs-demo-popover', placement: 'bottom' },
    children: [
      { tag: 'x-button', attributes: { slot: 'trigger', variant: 'secondary' }, children: ['Popover'] },
      { tag: 'p', children: ['Microcopy, Actions oder kurze Settings.'] }
    ]
  });
  add('components-xtooltip', 'x-tooltip', 'x-tooltip', 'Nicht-modale Hilfe am Control.', '<span id="docs-demo-tooltip-anchor">Hover oder Fokus</span><x-tooltip for="docs-demo-tooltip-anchor" placement="top" label="Tooltip">Kontext ohne Layoutsprung.</x-tooltip>', {
    attributes: { for: 'docs-demo-tooltip-anchor', placement: 'top', label: 'Tooltip' },
    children: ['Kontext ohne Layoutsprung.']
  });
  add('components-xtabs', 'x-tabs', 'x-tabs', 'Tab-Shell fuer dichte Tool- oder Contentbereiche.', '<x-tabs selected="0"><x-tab name="Preview">Preview</x-tab><x-tab name="RMT">RMT Descriptor</x-tab><x-tab name="Events">Events</x-tab></x-tabs>', {
    attributes: { selected: '0' },
    children: [
      { tag: 'x-tab', attributes: { name: 'Preview' }, children: ['Preview'] },
      { tag: 'x-tab', attributes: { name: 'RMT' }, children: ['RMT Descriptor'] },
      { tag: 'x-tab', attributes: { name: 'Events' }, children: ['Events'] }
    ]
  });
  add('components-xsummary', 'x-summary', 'x-summary', 'Disclosure-Control fuer progressive Detailtiefe.', '<x-summary type="info" open><span slot="summary">Contract Details</span><p>Shell-first, component-managed, RMT-schedulbar.</p></x-summary>', {
    attributes: { type: 'info', open: true },
    children: [
      { tag: 'span', attributes: { slot: 'summary' }, children: ['Contract Details'] },
      { tag: 'p', children: ['Shell-first, component-managed, RMT-schedulbar.'] }
    ]
  });
  add('components-xcode', 'x-code', 'x-code', 'Copy-faehiger Codebereich fuer Beispiele und Snippets.', '<x-code lang="html"><template><x-button variant="primary">Ship it</x-button></template></x-code>', {
    attributes: { lang: 'html' },
    children: [
      { tag: 'template', children: ['<x-button variant="primary">Ship it</x-button>'] }
    ]
  });
  add('components-xsection', 'x-section', 'x-section', 'Layout-Sektion als RMT-Shell-Baustein.', '<x-section label="Demo Section" bordered><strong>Shell Slot</strong><p>Content, Aside und Footer bleiben komponierbar.</p></x-section>', {
    attributes: { label: 'Demo Section', bordered: true },
    children: [
      { tag: 'strong', children: ['Shell Slot'] },
      { tag: 'p', children: ['Content, Aside und Footer bleiben komponierbar.'] }
    ]
  });
  add('components-xcards', 'x-cards', 'x-cards', 'Kompakte Kartenlisten fuer wiederholte Inhalte.', '<x-cards columns="2" gap="0.75rem"><article><strong>Surface</strong><p>Window</p></article><article><strong>Lane</strong><p>visible</p></article></x-cards>', {
    attributes: { columns: '2', gap: '0.75rem' },
    children: [
      { tag: 'article', children: [{ tag: 'strong', children: ['Surface'] }, { tag: 'p', children: ['Window'] }] },
      { tag: 'article', children: [{ tag: 'strong', children: ['Lane'] }, { tag: 'p', children: ['visible'] }] }
    ]
  });
  add('components-xhero', 'x-hero', 'x-hero', 'First-viewport Signal fuer App-Shells.', '<x-hero background-light="#f8fbff" background-dark="#050506" font-color-light="#162033" font-color-dark="#f8fafc" align="block"><h2>XTend Shell</h2><p>RMT orchestrated.</p></x-hero>', {
    attributes: { 'background-light': '#f8fbff', 'background-dark': '#050506', 'font-color-light': '#162033', 'font-color-dark': '#f8fafc', align: 'block' },
    children: [{ tag: 'h2', children: ['XTend Shell'] }, { tag: 'p', children: ['RMT orchestrated.'] }]
  });
  add('components-xtype', 'x-type', 'x-type', 'Typographische Microanimation fuer Status- oder Hero-Zeilen.', '<x-type texts="[&quot;App Shell&quot;,&quot;RMT&quot;,&quot;Lifecycle&quot;]" speed="40" pause="900" cursor></x-type>', {
    attributes: { texts: '["App Shell","RMT","Lifecycle"]', speed: '40', pause: '900', cursor: true }
  });
  add('components-xmasonry', 'x-masonry', 'x-masonry', 'Dichte Content-Galerien ohne externes Layout-Framework.', '<x-masonry columns="2" gap="0.6rem"><div>Window</div><div>Panel</div><div>Overlay</div></x-masonry>', {
    attributes: { columns: '2', gap: '0.6rem' },
    children: [{ tag: 'div', children: ['Window'] }, { tag: 'div', children: ['Panel'] }, { tag: 'div', children: ['Overlay'] }]
  });
  const lightboxLogoUrl = getDocsAssetUrl('lightboxLogo', 'index.php?xtend-docs-asset=xtend-logo.png');
  add('components-xlightbox', 'x-lightbox', 'x-lightbox', 'Medien-Fokus ohne Shell-Kontext zu verlieren.', `<x-lightbox id="docs-demo-lightbox" src="${escapeDocsHtmlAttribute(lightboxLogoUrl)}" alt="XTend Logo"><x-button slot="trigger" variant="secondary">Logo ansehen</x-button></x-lightbox>`, {
    attributes: { id: 'docs-demo-lightbox', src: lightboxLogoUrl, alt: 'XTend Logo' },
    children: [{ tag: 'x-button', attributes: { slot: 'trigger', variant: 'secondary' }, children: ['Logo ansehen'] }]
  });
  add('components-xsidepanel', 'x-side-panel', 'x-side-panel', 'SidePanel-Surface fuer near-native App-Shells.', '<div class="docs-demo-surface-zone"><x-side-panel surface-id="docs.demo.panel" label="Docs Inspector" open active mode="docked" placement="right" initial-width="18rem"><p>Related Links und Demo-Code leben hier.</p></x-side-panel></div>', {
    attributes: { 'surface-id': 'docs.demo.panel', label: 'Docs Inspector', open: true, active: true, mode: 'docked', placement: 'right', 'initial-width': '18rem' },
    children: [{ tag: 'p', children: ['Related Links und Demo-Code leben hier.'] }]
  });
  add('components-xsurfacewindow', 'x-surface-window', 'x-surface-window', 'Window-Surface fuer Multi-Window SPAs.', '<div class="docs-demo-surface-zone"><x-surface-window surface-id="docs.demo.window" label="Preview Window" open active initial-x="16" initial-y="16" initial-width="18rem" initial-height="10rem" resizable draggable><p>Window Content</p></x-surface-window></div>', {
    attributes: { 'surface-id': 'docs.demo.window', label: 'Preview Window', open: true, active: true, 'initial-x': '16', 'initial-y': '16', 'initial-width': '18rem', 'initial-height': '10rem', resizable: true, draggable: true },
    children: [{ tag: 'p', children: ['Window Content'] }]
  });
  add('components-xsurfacemanager', 'x-surface-manager', 'x-surface-manager', 'Surface-Wurzel fuer Windows, Panels und Overlays.', '<div class="docs-demo-surface-zone"><x-surface-manager manager-id="docs.demo.manager" layout="workbench"><x-surface-window slot="windows" surface-id="docs.manager.window" label="Window" open initial-width="16rem" initial-height="9rem"><p>Managed Window</p></x-surface-window><x-side-panel slot="panels" surface-id="docs.manager.panel" label="Panel" open mode="docked" placement="right"><p>Managed Panel</p></x-side-panel></x-surface-manager></div>', {
    attributes: { 'manager-id': 'docs.demo.manager', layout: 'workbench' },
    children: [
      { tag: 'x-surface-window', attributes: { slot: 'windows', 'surface-id': 'docs.manager.window', label: 'Window', open: true, 'initial-width': '16rem', 'initial-height': '9rem' }, children: [{ tag: 'p', children: ['Managed Window'] }] },
      { tag: 'x-side-panel', attributes: { slot: 'panels', 'surface-id': 'docs.manager.panel', label: 'Panel', open: true, mode: 'docked', placement: 'right' }, children: [{ tag: 'p', children: ['Managed Panel'] }] }
    ]
  });

  return demos;
}

function resolveDocsToastApi() {
  const xtendToast = window.XTend && window.XTend.toast;
  if (xtendToast && typeof xtendToast.show === 'function') return xtendToast;
  if (window.XToast && typeof window.XToast.show === 'function') return window.XToast;
  return null;
}

function waitForDocsToastApi(callback, attempt = 0) {
  const toastApi = resolveDocsToastApi();
  if (toastApi) return callback(toastApi);
  if (attempt >= 20) {
    window.dispatchEvent(new CustomEvent('xtend-docs-toast-dropped', {
      detail: {
        schema: 'xtend.docs.toast-bridge.v1',
        reason: 'xtend-toast-api-unavailable'
      }
    }));
    return null;
  }
  window.setTimeout(() => waitForDocsToastApi(callback, attempt + 1), attempt < 4 ? 50 : 100);
  return null;
}

window.xtendShowToast = function(message, type = 'info', duration = 3000) {
  return waitForDocsToastApi((toastApi) => toastApi.show(message, type, duration));
};

function getDocsRmtDocument() {
  return window.xtendDocsRmtDocument && typeof window.xtendDocsRmtDocument === 'object'
    ? window.xtendDocsRmtDocument
    : {};
}

function indexRmtRecords(records) {
  return new Map((Array.isArray(records) ? records : [])
    .filter((record) => record && typeof record === 'object')
    .map((record) => [record.id || record.qualifiedId || record.templateId, record]));
}

function findRmtRecord(records, id) {
  if (!id) return null;
  const byId = indexRmtRecords(records);
  if (byId.has(id)) return byId.get(id);
  return (Array.isArray(records) ? records : []).find((record) => (
    record
    && typeof record === 'object'
    && (record.id === id || record.qualifiedId === id || record.templateId === id)
  )) || null;
}

function getRmtTemplate(templateId) {
  const documentRecord = getDocsRmtDocument();
  return findRmtRecord(documentRecord.templates, templateId);
}

function getRmtSchedule(scheduleId) {
  const documentRecord = getDocsRmtDocument();
  return findRmtRecord(documentRecord.schedules, scheduleId);
}

function getDocsRmtProductionHardening() {
  if (window.xtendDocsRmtProductionHardening && typeof window.xtendDocsRmtProductionHardening === 'object') {
    return window.xtendDocsRmtProductionHardening;
  }
  const documentRecord = getDocsRmtDocument();
  const metadata = documentRecord.manifest && documentRecord.manifest.metadata;
  return metadata && metadata.productionHardening && typeof metadata.productionHardening === 'object'
    ? metadata.productionHardening
    : {};
}

function getTemplateDescriptorNodes(template) {
  if (!template || typeof template !== 'object') return [];
  if (Array.isArray(template.nodes)) return template.nodes;
  const descriptor = template.metadata && template.metadata.descriptor;
  if (descriptor && Array.isArray(descriptor.nodes)) return descriptor.nodes;
  return [];
}

function resolveRmtValue(value, model = {}) {
  if (typeof value !== 'string') return value;
  return value
    .replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (match, key) => {
      return Object.prototype.hasOwnProperty.call(model, key) ? String(model[key]) : match;
    })
    .replace(/\$\{\s*([a-zA-Z0-9_.-]+)\s*\}/g, (match, key) => {
      return Object.prototype.hasOwnProperty.call(model, key) ? String(model[key]) : match;
    });
}

function applyRmtAttributes(element, attributes = {}, model = {}) {
  Object.entries(attributes || {}).forEach(([name, rawValue]) => {
    if (rawValue === false || rawValue === null || rawValue === undefined) return;
    if (name === 'style' && rawValue && typeof rawValue === 'object') {
      Object.entries(rawValue).forEach(([prop, value]) => {
        element.style[prop] = String(resolveRmtValue(value, model));
      });
      return;
    }
    const value = rawValue === true ? '' : String(resolveRmtValue(rawValue, model));
    element.setAttribute(name, value);
  });
}

function renderRmtDescriptorNode(node, model = {}) {
  if (typeof node === 'string') {
    return document.createTextNode(resolveRmtValue(node, model));
  }
  if (!node || typeof node !== 'object') {
    return document.createTextNode('');
  }
  if (!node.tag && node.text !== undefined) {
    return document.createTextNode(resolveRmtValue(String(node.text), model));
  }

  const element = document.createElement(String(node.tag || 'div'));
  applyRmtAttributes(element, node.attributes || {}, model);

  if (node.text !== undefined) {
    element.appendChild(document.createTextNode(resolveRmtValue(String(node.text), model)));
  }

  (Array.isArray(node.children) ? node.children : []).forEach((child) => {
    element.appendChild(renderRmtDescriptorNode(child, model));
  });

  return element;
}

function renderRmtDomTemplate(templateId, model = {}) {
  const template = getRmtTemplate(templateId);
  const fragment = document.createDocumentFragment();
  const nodes = getTemplateDescriptorNodes(template);
  nodes.forEach((node) => {
    fragment.appendChild(renderRmtDescriptorNode(node, model));
  });
  return {
    template,
    fragment,
    rendered: nodes.length > 0
  };
}

function getDocsPageMeta(slug, locale = getCurrentDocsLocale()) {
  const localized = getLocalizedDocsMap('xtendDocsLocalizedPagesMeta', locale);
  if (localized && localized[slug]) return localized[slug];
  return window.xtendDocsPagesMeta && window.xtendDocsPagesMeta[slug]
    ? window.xtendDocsPagesMeta[slug]
    : null;
}

function createDocsSidebarHeading(iconName, label, options = {}) {
  const heading = document.createElement('h2');
  heading.className = 'docs-sidebar-heading';
  const icon = document.createElement('x-icon');
  icon.setAttribute('name', iconName || 'link');
  icon.setAttribute('pack', 'lucide');
  icon.setAttribute('decorative', '');
  icon.setAttribute('size', '1rem');
  const text = document.createElement('span');
  if (options.demoTitle) text.setAttribute('data-demo-title', '');
  text.textContent = label;
  heading.appendChild(icon);
  heading.appendChild(text);
  return heading;
}

function ensureDocsShellScopedStyles(root) {
  if (!root || !root.host || typeof root.getElementById !== 'function' || typeof root.appendChild !== 'function') {
    return;
  }
  if (root.getElementById(DOCS_SHELL_SHADOW_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = DOCS_SHELL_SHADOW_STYLE_ID;
  style.setAttribute('data-rmt-style-scope', 'docs.shell');
  style.textContent = DOCS_SHELL_SCOPED_CSS;
  root.appendChild(style);
}

function createFallbackDocsShell() {
  const section = document.createElement('section');
  section.className = 'docs-app-shell';
  section.setAttribute('aria-label', 'XTend Developer Center Content Shell');
  section.setAttribute('data-rmt-shell', DOCS_RMT_DEFAULT_SHELL_TEMPLATE);
  section.setAttribute('data-rmt-shell-mode', 'shell-first');

  const layout = document.createElement('div');
  layout.className = 'docs-shell-layout';
  layout.setAttribute('data-rmt-layout', 'main-sidebar');
  layout.setAttribute('data-rmt-component', 'docs.shellLayout');

  const article = document.createElement('article');
  article.className = 'docs-article-surface';
  article.setAttribute('data-rmt-slot', 'article');
  article.setAttribute('data-rmt-component', 'docs.article');

  const toolbar = document.createElement('div');
  toolbar.className = 'docs-shell-toolbar';
  toolbar.setAttribute('data-rmt-slot', 'actions');

  const download = document.createElement('x-button');
  download.className = 'download-link';
  download.id = 'download-link';
  download.setAttribute('type', 'button');
  download.setAttribute('data-rmt-action', 'docs.download.markdown');
  configureDocsIconButton(download, {
    icon: 'download',
    pack: 'core',
    label: 'Download als Markdown'
  });

  const mdContent = document.createElement('div');
  mdContent.id = 'md-content';
  mdContent.setAttribute('data-rmt-slot', 'content');
  mdContent.setAttribute('data-rmt-extension-slot', 'docs.slot.content');
  mdContent.setAttribute('data-rmt-content-kind', 'parsedownHtml');
  mdContent.setAttribute('data-rmt-trust-boundary', DOCS_RMT_TRUST_BOUNDARY);

  const sidebar = document.createElement('aside');
  sidebar.id = 'docs-page-sidebar';
  sidebar.className = 'docs-page-sidebar';
  sidebar.setAttribute('data-rmt-slot', 'sidebar');
  sidebar.setAttribute('data-rmt-extension-slot', 'docs.slot.sidebar');
  sidebar.setAttribute('data-rmt-component', 'docs.sidebar');
  sidebar.setAttribute('aria-label', 'Seitliche Dokumentationswerkzeuge');

  const relatedSlot = document.createElement('section');
  relatedSlot.id = 'docs-related-links';
  relatedSlot.className = 'docs-sidebar-section docs-related-section';
  relatedSlot.setAttribute('data-rmt-slot', 'related');
  relatedSlot.setAttribute('data-rmt-component', 'docs.relatedLinks');
  relatedSlot.setAttribute('data-rmt-schedule', 'docs.related.prepare');
  relatedSlot.appendChild(createDocsSidebarHeading('link', 'Read Further'));
  const relatedList = document.createElement('div');
  relatedList.className = 'docs-related-list';
  relatedList.setAttribute('data-rmt-slot', 'related-links');
  relatedSlot.appendChild(relatedList);

  const demoSlot = document.createElement('section');
  demoSlot.id = 'docs-component-demo';
  demoSlot.className = 'docs-sidebar-section docs-component-demo';
  demoSlot.hidden = true;
  demoSlot.setAttribute('data-rmt-slot', 'component-demo');
  demoSlot.setAttribute('data-rmt-component', 'docs.componentDemo');
  demoSlot.setAttribute('data-rmt-schedule', 'docs.demo.prepare');
  demoSlot.appendChild(createDocsSidebarHeading('play', 'Hands-on Demo', { demoTitle: true }));
  const demoCopy = document.createElement('p');
  demoCopy.className = 'docs-sidebar-copy';
  demoCopy.setAttribute('data-demo-description', '');
  demoCopy.textContent = 'Direkt testen, danach HTML und RMT uebernehmen.';
  const demoPreview = document.createElement('div');
  demoPreview.className = 'docs-demo-preview';
  demoPreview.setAttribute('data-demo-preview', '');
  const demoCode = document.createElement('div');
  demoCode.className = 'docs-demo-code-grid';
  demoCode.setAttribute('data-demo-code', '');
  demoSlot.appendChild(demoCopy);
  demoSlot.appendChild(demoPreview);
  demoSlot.appendChild(demoCode);

  const richSlot = document.createElement('aside');
  richSlot.id = 'docs-rich-content';
  richSlot.hidden = true;
  richSlot.setAttribute('data-rmt-slot', 'rich-content');
  richSlot.setAttribute('data-rmt-extension-slot', 'docs.slot.rich-content');
  richSlot.setAttribute('data-rmt-content-kinds', 'richHtml,xplayerTutorial');
  richSlot.setAttribute('data-rmt-schedule', 'docs.rich-content.prepare');
  richSlot.setAttribute('data-rmt-media-schedule', 'docs.media.lazy');
  richSlot.setAttribute('data-rmt-production-hardening', DOCS_RMT_PRODUCTION_HARDENING_SCHEMA);

  const diagnosticsSlot = document.createElement('div');
  diagnosticsSlot.id = 'docs-rmt-diagnostics';
  diagnosticsSlot.hidden = true;
  diagnosticsSlot.setAttribute('data-rmt-slot', 'diagnostics');
  diagnosticsSlot.setAttribute('data-rmt-extension-slot', 'docs.slot.diagnostics');
  diagnosticsSlot.setAttribute('data-rmt-schedule', DOCS_RMT_DEFAULT_DIAGNOSTICS_SCHEDULE);
  diagnosticsSlot.setAttribute('data-rmt-content-kind', 'diagnostics');
  diagnosticsSlot.setAttribute('data-rmt-production-hardening', DOCS_RMT_PRODUCTION_HARDENING_SCHEMA);

  toolbar.appendChild(download);
  article.appendChild(toolbar);
  article.appendChild(mdContent);
  sidebar.appendChild(relatedSlot);
  sidebar.appendChild(demoSlot);
  sidebar.appendChild(richSlot);
  sidebar.appendChild(diagnosticsSlot);
  layout.appendChild(article);
  layout.appendChild(sidebar);
  section.appendChild(layout);

  return {
    section,
    layout,
    article,
    mdContent,
    sidebar,
    relatedSlot,
    demoSlot,
    download,
    richSlot,
    diagnosticsSlot,
    shellTemplate: null
  };
}

function createRmtDocsShell(slug, rmtMeta = {}) {
  const shellTemplateId = rmtMeta.shellTemplate || (window.xtendDocsRmtPilot && window.xtendDocsRmtPilot.shellTemplate) || DOCS_RMT_DEFAULT_SHELL_TEMPLATE;
  const shellSchedule = rmtMeta.schedules && rmtMeta.schedules.shell ? rmtMeta.schedules.shell : 'docs.shell.render';
  const rendered = renderRmtDomTemplate(shellTemplateId, {
    slug,
    source: rmtMeta.source || '',
    contentKind: rmtMeta.contentKind || 'parsedownHtml',
    shellSchedule
  });

  if (!rendered.rendered) {
    const fallback = createFallbackDocsShell();
    fallback.shellTemplate = rendered.template;
    return fallback;
  }

  const section = rendered.fragment.querySelector
    ? rendered.fragment.querySelector('[data-rmt-shell], .docs-app-shell')
    : null;
  const shell = section || rendered.fragment.firstElementChild || createFallbackDocsShell().section;
  shell.classList.add('docs-app-shell');
  const layout = shell.querySelector('[data-rmt-layout="main-sidebar"], .docs-shell-layout');
  const article = shell.querySelector('[data-rmt-slot="article"], .docs-article-surface');
  const mdContent = shell.querySelector('[data-rmt-slot="content"], #md-content') || document.createElement('div');
  const download = shell.querySelector('[data-rmt-action="docs.download.markdown"], #download-link') || document.createElement('x-button');
  const sidebar = shell.querySelector('[data-rmt-slot="sidebar"], #docs-page-sidebar');
  const relatedSlot = shell.querySelector('[data-rmt-slot="related"], #docs-related-links');
  const demoSlot = shell.querySelector('[data-rmt-slot="component-demo"], #docs-component-demo');
  const richSlot = shell.querySelector('[data-rmt-slot="rich-content"], #docs-rich-content');
  const diagnosticsSlot = shell.querySelector('[data-rmt-slot="diagnostics"], #docs-rmt-diagnostics');

  if (!layout || !article || !sidebar || !relatedSlot || !demoSlot) {
    const fallback = createFallbackDocsShell();
    fallback.shellTemplate = rendered.template;
    fallback.section.setAttribute('data-rmt-shell-fallback', 'missing-sidebar-slots');
    return fallback;
  }

  if (!mdContent.id) mdContent.id = 'md-content';
  if (!download.id) download.id = 'download-link';
  configureDocsIconButton(download, {
    icon: 'download',
    pack: 'core',
    label: 'Download als Markdown'
  });
  if (!download.parentNode) shell.insertBefore(download, shell.firstChild);
  if (!mdContent.parentNode) shell.appendChild(mdContent);

  return {
    section: shell,
    layout,
    article,
    mdContent,
    sidebar,
    relatedSlot,
    demoSlot,
    download,
    richSlot,
    diagnosticsSlot,
    shellTemplate: rendered.template
  };
}

function configureDocsIconButton(button, options = {}) {
  if (!button) return;
  const label = options.label || button.getAttribute('aria-label') || 'Aktion ausfuehren';
  const iconName = options.icon || 'download';
  const pack = options.pack || 'core';
  button.classList.add('docs-icon-button');
  button.setAttribute('type', 'button');
  button.setAttribute('variant', button.getAttribute('variant') || 'secondary');
  button.setAttribute('aria-label', label);
  button.setAttribute('title', label);

  const existingIcon = button.querySelector('x-icon');
  const existingLabel = button.querySelector('.docs-visually-hidden');
  if (existingIcon) {
    existingIcon.setAttribute('name', iconName);
    existingIcon.setAttribute('pack', pack);
    existingIcon.setAttribute('decorative', '');
    if (!existingIcon.getAttribute('size')) existingIcon.setAttribute('size', '1.1rem');
  }
  if (existingLabel) {
    existingLabel.textContent = label;
  }
  if (existingIcon && existingLabel) return;

  button.textContent = '';
  const icon = document.createElement('x-icon');
  icon.setAttribute('name', iconName);
  icon.setAttribute('pack', pack);
  icon.setAttribute('decorative', '');
  icon.setAttribute('size', '1.1rem');
  const hiddenLabel = document.createElement('span');
  hiddenLabel.className = 'docs-visually-hidden';
  hiddenLabel.textContent = label;
  button.appendChild(icon);
  button.appendChild(hiddenLabel);
}

function setDocsButtonBusy(button, busy) {
  if (!button) return;
  if (busy) {
    button.setAttribute('disabled', '');
    button.setAttribute('aria-busy', 'true');
  } else {
    button.removeAttribute('disabled');
    button.removeAttribute('aria-busy');
  }
}

function bindDocsButtonAction(button, handler) {
  if (!button || typeof handler !== 'function') return;
  const activationEvent = button.tagName === 'X-BUTTON' ? 'button-interaction' : 'click';
  button.addEventListener(activationEvent, handler);
}

function applyRmtPageMetadata(section, mdContent, richSlot, diagnosticsSlot, rmtMeta = {}, sidebar = null, relatedSlot = null, demoSlot = null) {
  const schedules = rmtMeta.schedules || {};
  const endpoints = rmtMeta.endpoints || {};
  const shellSchedule = schedules.shell || 'docs.shell.render';
  const mediaSchedule = schedules.media || 'docs.media.lazy';
  const richSchedule = schedules.rich || 'docs.rich-content.prepare';
  const diagnosticsSchedule = schedules.diagnostics || DOCS_RMT_DEFAULT_DIAGNOSTICS_SCHEDULE;
  const hardening = getDocsRmtProductionHardening();

  section.style.background = 'var(--section-bg, #fff)';
  section.style.color = 'var(--text-color, #222)';
  section.setAttribute('data-rmt-component', rmtMeta.component || 'docs.page');
  section.setAttribute('data-rmt-shell', rmtMeta.shellTemplate || DOCS_RMT_DEFAULT_SHELL_TEMPLATE);
  section.setAttribute('data-rmt-shell-first', 'true');
  section.setAttribute('data-rmt-production-hardening', hardening.schema || DOCS_RMT_PRODUCTION_HARDENING_SCHEMA);
  section.setAttribute('data-rmt-shell-schedule', shellSchedule);
  section.setAttribute('data-rmt-route-schedule', schedules.route || 'docs.route.render');
  section.setAttribute('data-rmt-hydrate-schedule', schedules.hydrate || 'docs.page.hydrate');
  section.setAttribute('data-rmt-route-title', rmtMeta.title || '');
  section.setAttribute('data-rmt-document-title', rmtMeta.documentTitle || '');
  section.setAttribute('data-rmt-title-template', rmtMeta.titleTemplate || '{{title}} | XTend Dokumentation');

  if (sidebar) {
    sidebar.setAttribute('data-rmt-slot', 'sidebar');
    sidebar.setAttribute('data-rmt-extension-slot', 'docs.slot.sidebar');
    sidebar.setAttribute('data-rmt-component', 'docs.sidebar');
    sidebar.setAttribute('data-rmt-shell-schedule', shellSchedule);
  }

  if (relatedSlot) {
    relatedSlot.setAttribute('data-rmt-slot', 'related');
    relatedSlot.setAttribute('data-rmt-extension-slot', 'docs.slot.related');
    relatedSlot.setAttribute('data-rmt-component', 'docs.relatedLinks');
    relatedSlot.setAttribute('data-rmt-schedule', 'docs.related.prepare');
  }

  if (demoSlot) {
    demoSlot.setAttribute('data-rmt-slot', 'component-demo');
    demoSlot.setAttribute('data-rmt-extension-slot', 'docs.slot.component-demo');
    demoSlot.setAttribute('data-rmt-component', 'docs.componentDemo');
    demoSlot.setAttribute('data-rmt-schedule', 'docs.demo.prepare');
  }

  mdContent.setAttribute('data-rmt-slot', mdContent.getAttribute('data-rmt-slot') || 'content');
  mdContent.setAttribute('data-rmt-extension-slot', 'docs.slot.content');
  mdContent.setAttribute('data-rmt-template', rmtMeta.template || '');
  mdContent.setAttribute('data-rmt-template-adapter', rmtMeta.adapter || 'docs.parsedown');
  mdContent.setAttribute('data-rmt-parse-schedule', schedules.parse || 'docs.markdown.parse');
  mdContent.setAttribute('data-rmt-parse-endpoint', endpoints.parse || DOCS_RMT_PARSEDOWN_ENDPOINT);
  mdContent.setAttribute('data-rmt-markup-class', rmtMeta.markupClass || 'parsedownHtml');
  mdContent.setAttribute('data-rmt-content-kind', rmtMeta.contentKind || 'parsedownHtml');
  mdContent.setAttribute('data-rmt-trust-boundary', rmtMeta.trustBoundary || DOCS_RMT_TRUST_BOUNDARY);

  if (richSlot) {
    richSlot.setAttribute('data-rmt-extension-slot', 'docs.slot.rich-content');
    richSlot.setAttribute('data-rmt-schedule', richSchedule);
    richSlot.setAttribute('data-rmt-media-schedule', mediaSchedule);
    richSlot.setAttribute('data-rmt-content-kinds', 'richHtml,xplayerTutorial');
    richSlot.setAttribute('data-rmt-trust-boundary', rmtMeta.trustBoundary || DOCS_RMT_TRUST_BOUNDARY);
    richSlot.setAttribute('data-rmt-production-hardening', hardening.schema || DOCS_RMT_PRODUCTION_HARDENING_SCHEMA);
  }

  if (diagnosticsSlot) {
    diagnosticsSlot.setAttribute('data-rmt-slot', 'diagnostics');
    diagnosticsSlot.setAttribute('data-rmt-extension-slot', 'docs.slot.diagnostics');
    diagnosticsSlot.setAttribute('data-rmt-schedule', diagnosticsSchedule);
    diagnosticsSlot.setAttribute('data-rmt-content-kind', 'diagnostics');
    diagnosticsSlot.setAttribute('data-rmt-production-hardening', hardening.schema || DOCS_RMT_PRODUCTION_HARDENING_SCHEMA);
  }
}

function createDocsRmtProductionRenderSnapshot(slug, rmtMeta, shell) {
  const hardening = getDocsRmtProductionHardening();
  const schedules = rmtMeta.schedules || {};
  const extensionSlots = Array.isArray(hardening.extensionSlots)
    ? hardening.extensionSlots.slice()
    : DOCS_RMT_EXTENSION_SLOTS.slice();
  return {
    schema: hardening.renderSchema || DOCS_RMT_PRODUCTION_HARDENING_SCHEMA,
    slug,
    shellFirst: true,
    parsedownOrchestrated: true,
    parsedownEmbeddedInRmtKernel: false,
    extensionSlots,
    contentSlot: rmtMeta.contentSlot || 'content',
    sidebarSlotAvailable: Boolean(shell.sidebar),
    relatedSlotAvailable: Boolean(shell.relatedSlot),
    componentDemoSlotAvailable: Boolean(shell.demoSlot),
    richSlotAvailable: Boolean(shell.richSlot),
    diagnosticsSlotAvailable: Boolean(shell.diagnosticsSlot),
    parseSchedule: schedules.parse || 'docs.markdown.parse',
    richSchedule: schedules.rich || 'docs.rich-content.prepare',
    mediaSchedule: schedules.media || 'docs.media.lazy',
    diagnosticsSchedule: schedules.diagnostics || DOCS_RMT_DEFAULT_DIAGNOSTICS_SCHEDULE,
    trustBoundary: rmtMeta.trustBoundary || DOCS_RMT_TRUST_BOUNDARY,
    trustedDomProofSchema: DOCS_RMT_TRUSTED_DOM_PROOF_SCHEMA,
    trustedDomSanitizer: DOCS_RMT_TRUSTED_DOM_SANITIZER,
    sanitizerRequired: true,
    kernelBoundary: hardening.kernelBoundary || 'Parsedown, PHP execution and Sanitizing stay in the Docs host adapter.',
    nextWorkpackage: hardening.nextWorkpackage || 'WP-E13-13'
  };
}

function wireDownloadButton(download, slug) {
  if (!download) return;
  download.__xtendDocsDownloadSlug = slug;
  if (download.__xtendDocsDownloadBound) return;
  download.__xtendDocsDownloadBound = true;
  configureDocsIconButton(download, {
    icon: 'download',
    pack: 'core',
    label: getCurrentDocsLocale() === 'en' ? 'Download as Markdown' : 'Download als Markdown'
  });
  download.setAttribute('type', 'button');
  bindDocsButtonAction(download, async function(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (download.hasAttribute('disabled')) return;
    const activeSlug = download.__xtendDocsDownloadSlug || slug;
    const locale = getCurrentDocsLocale();
    setDocsButtonBusy(download, true);
    try {
      const resp = await fetch(`?download=${encodeURIComponent(activeSlug)}&locale=${encodeURIComponent(locale)}`);
      if (!resp.ok) throw new Error('Download fehlgeschlagen');
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${activeSlug}.md`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      setTimeout(() => {
        window.xtendShowToast(locale === 'en' ? 'Download complete.' : 'Download erfolgreich!', 'success', 3000);
      }, 200);
    } catch (err) {
      setTimeout(() => {
        window.xtendShowToast(getCurrentDocsLocale() === 'en' ? 'Download failed.' : 'Download fehlgeschlagen!', 'error', 3000);
      }, 200);
    } finally {
      setTimeout(() => {
        setDocsButtonBusy(download, false);
      }, 300);
    }
  });
}

function createFallbackSearchShell() {
  const locale = getCurrentDocsLocale();
  const form = document.createElement('x-form');
  form.id = 'xtend-search-form';
  form.setAttribute('slot', 'search');
  form.setAttribute('data-rmt-template', DOCS_RMT_DEFAULT_SEARCH_TEMPLATE);
  form.setAttribute('data-rmt-component', 'docs.search');
  form.setAttribute('data-rmt-schedule', 'docs.search.index');

  const label = document.createElement('label');
  label.setAttribute('for', 'search-input');
  label.textContent = locale === 'en' ? 'Search:' : 'Suche:';

  const input = document.createElement('x-input');
  input.id = 'search-input';
  input.setAttribute('name', 'search');
  input.setAttribute('placeholder', locale === 'en' ? 'Search...' : 'Suche...');

  const searchResults = document.createElement('div');
  searchResults.id = 'search-results';
  searchResults.setAttribute('data-rmt-slot', 'results');

  form.appendChild(label);
  form.appendChild(input);
  form.appendChild(searchResults);
  return form;
}

function styleSearchShell(form, input, searchResults) {
  form.setAttribute('slot', 'search');
  form.classList.add('docs-search-form');
  form.style.width = '100%';
  form.style.maxWidth = '30rem';
  form.style.minWidth = '0';
  form.style.boxSizing = 'border-box';
  form.style.setProperty('--form-padding', '0');
  form.style.setProperty('--form-gap', '0');
  form.style.setProperty('--form-background', 'transparent');
  form.style.setProperty('--form-border', '0');
  form.style.setProperty('--form-shadow', 'none');
  searchResults.classList.add('docs-search-results');
  input.setAttribute('aria-controls', searchResults.id || 'search-results');

  const label = form.querySelector('label');
  if (label) {
    label.style.position = 'absolute';
    label.style.width = '1px';
    label.style.height = '1px';
    label.style.padding = '0';
    label.style.margin = '-1px';
    label.style.overflow = 'hidden';
    label.style.clip = 'rect(0,0,0,0)';
    label.style.border = '0';
  }

  input.style.width = '100%';
  input.style.minWidth = '12rem';
  input.style.maxWidth = '100%';
  input.style.boxSizing = 'border-box';

  searchResults.style.position = 'fixed';
  searchResults.style.zIndex = '99999';
  searchResults.style.width = '16rem';
  searchResults.style.maxWidth = '90vw';
  searchResults.style.boxShadow = '0 12px 32px rgba(15, 23, 42, 0.18)';
  searchResults.style.borderRadius = '0.65rem';
  searchResults.style.margin = '0';
  searchResults.style.padding = '0.55rem';
  searchResults.style.display = 'none';
  searchResults.style.left = '0';
  searchResults.style.top = '0';
}

function wireSearchForm(form, input, searchResults) {
  if (!form || !input || !searchResults || form.__xtendDocsSearchBound) return;
  form.__xtendDocsSearchBound = true;

  function updateSearchResultsPosition() {
    const rect = input.getBoundingClientRect();
    searchResults.style.left = rect.left + 'px';
    searchResults.style.top = (rect.bottom + 6) + 'px';
    searchResults.style.width = rect.width + 'px';
  }

  function clearResults() {
    while (searchResults.firstChild) {
      searchResults.removeChild(searchResults.firstChild);
    }
  }

  input.addEventListener('focus', updateSearchResultsPosition);
  input.addEventListener('input', updateSearchResultsPosition);
  window.addEventListener('resize', updateSearchResultsPosition);
  window.addEventListener('scroll', updateSearchResultsPosition, true);

  input.addEventListener('input', function() {
    const q = String(input.value || '').toLowerCase();
    const results = [];
    const localizedTitles = getLocalizedDocsMap('xtendDocsLocalizedTitles', getCurrentDocsLocale());
    Object.entries(Object.keys(localizedTitles).length ? localizedTitles : (window.xtendDocsTitles || {})).forEach(([slug, title]) => {
      if (String(title).toLowerCase().includes(q)) {
        results.push({ slug, title });
      }
    });

    clearResults();
    if (q && results.length) {
      results.forEach((result, index) => {
        const link = document.createElement('x-link');
        link.setAttribute('href', getLocalizedDocsPath(result.slug));
        link.textContent = result.title;
        searchResults.appendChild(link);
      });
      searchResults.style.display = 'block';
    } else if (q) {
      const empty = document.createElement('em');
      empty.textContent = getCurrentDocsLocale() === 'en' ? 'No results' : 'Keine Treffer';
      searchResults.appendChild(empty);
      searchResults.style.display = 'block';
    } else {
      searchResults.style.display = 'none';
    }
  });

  document.addEventListener('click', function(e) {
    if (!form.contains(e.target)) {
      searchResults.style.display = 'none';
    }
  });

  searchResults.addEventListener('click', function(e) {
    const t = e.target;
    if (t.tagName === 'X-LINK') {
      const header = document.querySelector('x-header');
      if (header && header.id && window.xstate) {
        window.xstate.set(`xheader-state-${header.id}`, { menuOpen: false });
      }
      searchResults.style.display = 'none';
    }
  });

  function applySearchTheme() {
    searchResults.style.background = getComputedStyle(document.documentElement).getPropertyValue('--section-bg').trim() || '#fff';
    searchResults.style.color = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim() || '#222';
    searchResults.style.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || 'rgba(0,0,0,0.14)';
  }

  document.addEventListener('theme-changed', applySearchTheme);
  applySearchTheme();
}

function ensureRmtSearchShell() {
  const header = document.querySelector('x-header');
  if (!header) return;
  let form = document.getElementById('xtend-search-form');

  if (!form) {
    const templateId = (window.xtendDocsRmtPilot && window.xtendDocsRmtPilot.searchTemplate) || DOCS_RMT_DEFAULT_SEARCH_TEMPLATE;
    const rendered = renderRmtDomTemplate(templateId, {
      searchSchedule: 'docs.search.index'
    });
    if (rendered.rendered) {
      form = rendered.fragment.querySelector('#xtend-search-form, [data-rmt-component="docs.search"]');
      if (form) form.setAttribute('slot', 'search');
      header.appendChild(form || rendered.fragment);
      form = document.getElementById('xtend-search-form');
    }
    if (!form) {
      form = createFallbackSearchShell();
      header.appendChild(form);
    }
  }

  const input = form.querySelector('#search-input, x-input[name="search"]');
  const searchResults = form.querySelector('#search-results, [data-rmt-slot="results"]');
  if (input && searchResults) {
    styleSearchShell(form, input, searchResults);
    wireSearchForm(form, input, searchResults);
  }
}

function applyMainBackground() {
  const main = document.querySelector('main');
  if (main) {
    main.style.background = 'transparent';
  }
}

function ensureMainBackgroundBinding() {
  if (window.__xtendDocsMainBackgroundBound) return;
  window.__xtendDocsMainBackgroundBound = true;
  document.addEventListener('theme-changed', applyMainBackground);
  applyMainBackground();
}

function getDocsPageSlugs() {
  const localizedMeta = getLocalizedDocsMap('xtendDocsLocalizedPagesMeta', getCurrentDocsLocale());
  const metaSlugs = Object.keys(localizedMeta || {});
  if (metaSlugs.length) return metaSlugs;
  const localizedPages = getLocalizedDocsMap('xtendDocsLocalizedPages', getCurrentDocsLocale());
  const pageSlugs = Object.keys(localizedPages || {});
  if (pageSlugs.length) return pageSlugs;
  const legacyMetaSlugs = Object.keys(window.xtendDocsPagesMeta || {});
  if (legacyMetaSlugs.length) return legacyMetaSlugs;
  return Object.keys(window.xtendDocsPages || {});
}

function getDocsPageEndpoint() {
  const endpoint = window.xtendDocsPageEndpoint || '';
  return typeof endpoint === 'string' && endpoint ? endpoint : '';
}

function buildDocsPagePayloadUrl(slug, locale = getCurrentDocsLocale()) {
  const endpoint = getDocsPageEndpoint();
  if (!endpoint) return '';
  if (endpoint.includes('{slug}') || endpoint.includes('{locale}')) {
    return endpoint
      .replace('{slug}', encodeURIComponent(slug))
      .replace('{locale}', encodeURIComponent(normalizeDocsLocale(locale)));
  }
  const separator = endpoint.includes('?') ? '&' : '?';
  return endpoint + encodeURIComponent(slug) + separator + 'locale=' + encodeURIComponent(normalizeDocsLocale(locale));
}

function rememberDocsPagePayload(slug, payload = {}, locale = getCurrentDocsLocale()) {
  const normalizedLocale = normalizeDocsLocale(payload.resolvedLocale || payload.locale || locale);
  if (!window.xtendDocsPages || typeof window.xtendDocsPages !== 'object') {
    window.xtendDocsPages = {};
  }
  if (!window.xtendDocsLocalizedPages || typeof window.xtendDocsLocalizedPages !== 'object') {
    window.xtendDocsLocalizedPages = {};
  }
  if (!window.xtendDocsLocalizedPages[normalizedLocale]) {
    window.xtendDocsLocalizedPages[normalizedLocale] = {};
  }
  if (typeof payload.html === 'string') {
    window.xtendDocsPages[slug] = payload.html;
    window.xtendDocsLocalizedPages[normalizedLocale][slug] = payload.html;
  }
  if (payload.meta && typeof payload.meta === 'object') {
    window.xtendDocsPagesMeta = {
      ...(window.xtendDocsPagesMeta || {}),
      [slug]: {
        ...(window.xtendDocsPagesMeta && window.xtendDocsPagesMeta[slug] || {}),
        ...payload.meta
      }
    };
    window.xtendDocsLocalizedPagesMeta = {
      ...(window.xtendDocsLocalizedPagesMeta || {}),
      [normalizedLocale]: {
        ...((window.xtendDocsLocalizedPagesMeta && window.xtendDocsLocalizedPagesMeta[normalizedLocale]) || {}),
        [slug]: {
          ...(((window.xtendDocsLocalizedPagesMeta && window.xtendDocsLocalizedPagesMeta[normalizedLocale]) || {})[slug] || {}),
          ...payload.meta
        }
      }
    };
  }
  return payload;
}

function loadDocsParsedownContent(slug, rmtMeta = {}, locale = getCurrentDocsLocale()) {
  const normalizedLocale = normalizeDocsLocale(locale);
  const localizedPages = getLocalizedDocsMap('xtendDocsLocalizedPages', normalizedLocale);
  const inlineHtml = localizedPages && typeof localizedPages[slug] === 'string'
    ? localizedPages[slug]
    : normalizedLocale === getDocsI18nConfig().fallbackLocale && window.xtendDocsPages && typeof window.xtendDocsPages[slug] === 'string'
      ? window.xtendDocsPages[slug]
    : null;
  if (inlineHtml !== null) {
    return Promise.resolve({
      schema: 'xtend.docs.parsedown-rmt-page-payload.v1',
      ok: true,
      slug,
      locale: normalizedLocale,
      requestedLocale: normalizedLocale,
      resolvedLocale: normalizedLocale,
      fallbackLocale: getDocsI18nConfig().fallbackLocale,
      translationAvailable: true,
      html: inlineHtml,
      meta: rmtMeta,
      source: 'inline',
      cacheHit: true,
      skeletonLoader: 'xtend.loader.skeleton-loader.v1'
    });
  }

  const promiseKey = normalizedLocale + ':' + slug;
  if (DOCS_ROUTE_PAYLOAD_PROMISES.has(promiseKey)) {
    return DOCS_ROUTE_PAYLOAD_PROMISES.get(promiseKey);
  }

  const url = buildDocsPagePayloadUrl(slug, normalizedLocale);
  if (!url) {
    return Promise.resolve({
      schema: 'xtend.docs.parsedown-rmt-page-payload.v1',
      ok: false,
      slug,
      locale: normalizedLocale,
      requestedLocale: normalizedLocale,
      resolvedLocale: getDocsI18nConfig().fallbackLocale,
      fallbackLocale: getDocsI18nConfig().fallbackLocale,
      translationAvailable: false,
      html: '<em>Seite nicht gefunden</em>',
      meta: rmtMeta,
      source: 'missing-endpoint',
      cacheHit: false,
      skeletonLoader: 'xtend.loader.skeleton-loader.v1'
    });
  }

  const promise = fetch(url, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json'
    }
  })
    .then((response) => {
      if (!response.ok) throw new Error(`Docs page payload failed with HTTP ${response.status}`);
      return response.json();
    })
    .then((payload) => rememberDocsPagePayload(slug, {
      ...payload,
      cacheHit: false
    }, normalizedLocale))
    .catch((error) => ({
      schema: 'xtend.docs.parsedown-rmt-page-payload.v1',
      ok: false,
      slug,
      locale: normalizedLocale,
      requestedLocale: normalizedLocale,
      resolvedLocale: getDocsI18nConfig().fallbackLocale,
      fallbackLocale: getDocsI18nConfig().fallbackLocale,
      translationAvailable: false,
      html: '<em>Seite nicht gefunden</em>',
      meta: rmtMeta,
      source: 'fetch-error',
      cacheHit: false,
      error: error && error.message ? error.message : String(error),
      skeletonLoader: 'xtend.loader.skeleton-loader.v1'
    }))
    .finally(() => {
      DOCS_ROUTE_PAYLOAD_PROMISES.delete(promiseKey);
    });
  DOCS_ROUTE_PAYLOAD_PROMISES.set(promiseKey, promise);
  return promise;
}

function prefetchDocsLocalePage(slug = getCurrentDocsSlug(), locale = getCurrentDocsLocale()) {
  const normalizedSlug = slug || 'readme';
  const normalizedLocale = normalizeDocsLocale(locale);
  const localizedPages = getLocalizedDocsMap('xtendDocsLocalizedPages', normalizedLocale);
  if (localizedPages && typeof localizedPages[normalizedSlug] === 'string') {
    return Promise.resolve({
      schema: 'xtend.docs.locale-prefetch.v1',
      slug: normalizedSlug,
      locale: normalizedLocale,
      source: 'inline',
      cacheHit: true
    });
  }
  const rmtMeta = getDocsPageMeta(normalizedSlug, normalizedLocale) || {};
  return loadDocsParsedownContent(normalizedSlug, rmtMeta, normalizedLocale).then((payload) => ({
    schema: 'xtend.docs.locale-prefetch.v1',
    slug: normalizedSlug,
    locale: normalizedLocale,
    source: payload && payload.source ? payload.source : 'unknown',
    cacheHit: payload && payload.cacheHit === true,
    translationAvailable: payload ? payload.translationAvailable !== false : false
  }));
}

function prefetchAlternateDocsLocales(slug = getCurrentDocsSlug()) {
  const config = getDocsI18nConfig();
  const current = getCurrentDocsLocale();
  config.available.forEach((locale) => {
    if (normalizeDocsLocale(locale) !== current) {
      prefetchDocsLocalePage(slug, locale).catch(() => {});
    }
  });
}

function normalizeMarkdownLinks(html) {
  return String(html || '').replace(/<a href=["']([^"'#?]+)["']>(.*?)<\/a>/g, function(match, href, text) {
    if (!href.endsWith('.md')) return match;
    let norm = href.replace(/^\.\//, '').replace(/^\.\./, '').replace(/^\./, '').replace(/\\/g, '/');
    let foundSlug = null;

    for (const s of getDocsPageSlugs()) {
      let candidate = '';
      if (norm.startsWith('components/')) {
        candidate = 'components-' + norm.slice('components/'.length).replace(/\//g, '-').replace(/\.md$/, '').toLowerCase();
      } else {
        candidate = norm.replace(/\//g, '-').replace(/\.md$/, '').toLowerCase();
      }
      if (s === candidate) {
        foundSlug = s;
        break;
      }
    }

    if (!foundSlug) {
      const base = norm.split('/').pop().replace(/\.md$/, '').toLowerCase();
      for (const s of getDocsPageSlugs()) {
        if (s.endsWith('-' + base) || s === base) {
          foundSlug = s;
          break;
        }
      }
    }

    if (!foundSlug) {
      if (norm.startsWith('components/')) {
        foundSlug = 'components-' + norm.slice('components/'.length).replace(/\//g, '-').replace(/\.md$/, '').toLowerCase();
      } else {
        foundSlug = norm.replace(/\//g, '-').replace(/\.md$/, '').toLowerCase();
      }
    }
    return `<x-link href='${getLocalizedDocsPath(foundSlug)}'>${text}</x-link>`;
  });
}

function isDocsTrustedDomUrlAllowed(value) {
  const normalized = String(value || '').trim().replace(/[\u0000-\u001F\u007F\s]+/g, '').toLowerCase();
  if (!normalized) return true;
  if (normalized.startsWith('#') || normalized.startsWith('/') || normalized.startsWith('./') || normalized.startsWith('../')) return true;
  if (normalized.startsWith('data:')) return normalized.startsWith('data:image/');
  return !(
    normalized.startsWith('javascript:')
    || normalized.startsWith('vbscript:')
    || normalized.startsWith('data:text/html')
    || normalized.startsWith('data:text/javascript')
  );
}

function decodeDocsParsedownCodeEntities(value) {
  const text = String(value || '');
  if (!/&(?:amp|lt|gt|quot|#0?39|#x0?27);/i.test(text)) return text;
  const decoder = document.createElement('textarea');
  decoder.innerHTML = text;
  return decoder.value;
}

function normalizeDocsParsedownCodeEntities(root) {
  let normalizedCount = 0;
  Array.from(root.querySelectorAll('code')).forEach((node) => {
    const original = node.textContent || '';
    const decoded = decodeDocsParsedownCodeEntities(original);
    if (decoded === original) return;
    node.textContent = decoded;
    node.setAttribute('data-parsedown-code-normalized', 'true');
    normalizedCount += 1;
  });
  return normalizedCount;
}

function normalizeDocsCodeLanguage(value) {
  const raw = String(value || 'text').trim().toLowerCase();
  const aliases = {
    js: 'javascript',
    html: 'markup',
    xml: 'markup',
    svg: 'markup',
    md: 'markdown',
    txt: 'text',
    plaintext: 'text',
    'rmt-vnext': 'rmt',
    xtendrmt: 'rmt'
  };
  return aliases[raw] || raw || 'text';
}

function readDocsCodeLanguage(node) {
  const className = String(node.getAttribute('class') || '');
  const match = className.match(/(?:^|\s)(?:language|lang)-([A-Za-z0-9_+-]+)/);
  return normalizeDocsCodeLanguage(node.getAttribute('data-language') || (match && match[1]) || 'text');
}

function upgradeDocsParsedownCodeFences(root, options = {}) {
  const schedule = options.schedule || 'docs.syntax.highlight';
  const scope = root && root.querySelectorAll ? root : document;
  let count = 0;
  Array.from(scope.querySelectorAll('pre > code')).forEach((codeNode) => {
    const pre = codeNode.parentElement;
    if (!pre || pre.closest('x-code') || pre.hasAttribute('data-docs-code-fence-upgraded')) return;
    const language = readDocsCodeLanguage(codeNode);
    const codeElement = document.createElement('x-code');
    codeElement.className = 'docs-code-fence';
    codeElement.setAttribute('lang', language);
    codeElement.setAttribute('data-docs-code-fence-upgraded', 'true');
    codeElement.setAttribute('data-rmt-component', 'docs.codeFence');
    codeElement.setAttribute('data-rmt-schedule', schedule);
    codeElement.setAttribute('data-rmt-syntax-language', language);
    const template = document.createElement('template');
    template.setAttribute('data-x-code-mode', 'text');
    template.content.appendChild(document.createTextNode(codeNode.textContent || ''));
    codeElement.appendChild(template);
    pre.replaceWith(codeElement);
    count += 1;
  });
  return {
    schema: 'xtend.docs.xcode-fence-upgrade.v1',
    upgraded: count,
    schedule
  };
}

function sanitizeDocsTrustedDomHtml(html, options = {}) {
  const template = document.createElement('template');
  const removed = [];
  template.innerHTML = String(html || '');

  DOCS_TRUSTED_DOM_FORBIDDEN_TAGS.forEach((tagName) => {
    Array.from(template.content.querySelectorAll(tagName)).forEach((node) => {
      removed.push({ type: 'element', name: tagName });
      node.remove();
    });
  });

  Array.from(template.content.querySelectorAll('*')).forEach((node) => {
    Array.from(node.attributes).forEach((attribute) => {
      const name = attribute.name;
      const lowerName = name.toLowerCase();
      if (lowerName.startsWith('on') || lowerName === 'srcdoc') {
        removed.push({ type: 'attribute', name });
        node.removeAttribute(name);
        return;
      }

      if (DOCS_TRUSTED_DOM_URL_ATTRIBUTES.includes(lowerName) && !isDocsTrustedDomUrlAllowed(attribute.value)) {
        removed.push({ type: 'url', name, value: attribute.value });
        node.removeAttribute(name);
      }
    });
  });

  const normalizedCodeEntityCount = normalizeDocsParsedownCodeEntities(template.content);

  return {
    schema: DOCS_RMT_TRUSTED_DOM_PROOF_SCHEMA,
    sanitizer: DOCS_RMT_TRUSTED_DOM_SANITIZER,
    sanitized: true,
    boundary: options.trustBoundary || DOCS_RMT_TRUST_BOUNDARY,
    markupClass: options.markupClass || 'parsedownHtml',
    html: template.innerHTML,
    removed,
    removedCount: removed.length,
    normalizedCodeEntityCount,
    source: options.source || 'docs.parsedown'
  };
}

function prepareDocsTrustedDomHtml(slug, html, options = {}) {
  const cacheKey = createDocsRouteContentCacheKey(slug, html, {
    ...options,
    locale: options.locale || getCurrentDocsLocale()
  });
  const cached = DOCS_ROUTE_CONTENT_CACHE.get(cacheKey);
  if (cached) return cloneDocsSanitizeResult(cached, true);

  const normalizedHtml = normalizeMarkdownLinks(html);
  const result = sanitizeDocsTrustedDomHtml(normalizedHtml, options);
  result.cacheKey = cacheKey;
  result.cacheHit = false;
  rememberDocsCacheEntry(cacheKey, result);
  return cloneDocsSanitizeResult(result, false);
}

function applyDocsTrustedDomHtml(target, html, options = {}) {
  const result = prepareDocsTrustedDomHtml(options.slug || '', html, options);
  target.innerHTML = result.html;
  const codeFenceUpgrade = upgradeDocsParsedownCodeFences(target, {
    schedule: options.syntaxSchedule || 'docs.syntax.highlight'
  });
  result.codeFenceUpgrade = codeFenceUpgrade;
  result.upgradedCodeFenceCount = codeFenceUpgrade.upgraded;
  target.setAttribute('data-rmt-sanitized', 'true');
  target.setAttribute('data-rmt-sanitizer', DOCS_RMT_TRUSTED_DOM_SANITIZER);
  target.setAttribute('data-rmt-trusted-dom-proof', DOCS_RMT_TRUSTED_DOM_PROOF_SCHEMA);
  target.setAttribute('data-docs-code-fence-upgraded', String(codeFenceUpgrade.upgraded));
  target.setAttribute('data-rmt-content-cache-hit', result.cacheHit ? 'true' : 'false');
  window.xtendDocsTrustedDomLastSanitize = result;
  return result;
}

window.xtendDocsTrustedDomBoundary = Object.freeze({
  schema: DOCS_RMT_TRUSTED_DOM_PROOF_SCHEMA,
  sanitizer: DOCS_RMT_TRUSTED_DOM_SANITIZER,
  trustBoundary: DOCS_RMT_TRUST_BOUNDARY,
  sanitize: sanitizeDocsTrustedDomHtml,
  apply: applyDocsTrustedDomHtml,
  upgradeCodeFences: upgradeDocsParsedownCodeFences
});

function upgradeRoutedLinks(root) {
  Array.from(root.querySelectorAll('x-link')).forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    const href = node.getAttribute('href');
    const text = node.textContent;
    const real = document.createElement('x-link');
    if (href) real.setAttribute('href', href);
    real.textContent = text;
    node.replaceWith(real);
  });
}

function syncActiveHeaderLink(slug) {
  const header = document.querySelector('x-header');
  if (!header) return;
  const locale = getCurrentDocsLocale();
  const localizedHref = getLocalizedDocsPath(slug, locale);
  header.querySelectorAll('x-link').forEach((a) => a.removeAttribute('active'));
  header.querySelectorAll('details[data-docs-menu-children]').forEach((details) => {
    details.open = false;
    syncDocsMenuDisclosureState(details);
  });
  const active = header.querySelector('x-link[href="#' + localizedHref + '"], x-link[href="' + localizedHref + '"], x-link[href="#/' + slug + '"], x-link[href="/' + slug + '"]');
  if (active) {
    active.setAttribute('active', '');
    let parent = active.parentElement;
    while (parent) {
      if (parent.tagName && parent.tagName.toLowerCase() === 'details') {
        parent.open = true;
        syncDocsMenuDisclosureState(parent);
      }
      parent = parent.parentElement;
    }
  }
}

function syncDocsMenuDisclosureState(details) {
  if (!details || !details.querySelector) return;
  const summary = details.querySelector(':scope > summary');
  if (summary) {
    summary.setAttribute('aria-expanded', details.open ? 'true' : 'false');
  }
}

function closeDocsMenuDetailsTree(details) {
  if (!details || !details.querySelectorAll) return;
  details.open = false;
  syncDocsMenuDisclosureState(details);
  details.querySelectorAll('details[data-docs-menu-children]').forEach((child) => {
    child.open = false;
    syncDocsMenuDisclosureState(child);
  });
}

function closeSiblingDocsSubmenus(details) {
  const node = details && details.parentElement;
  const container = node && node.parentElement;
  if (!container) return;
  Array.from(container.children).forEach((siblingNode) => {
    if (siblingNode === node || !siblingNode.querySelector) return;
    const siblingDetails = siblingNode.querySelector(':scope > details[data-docs-menu-children]');
    if (siblingDetails) {
      closeDocsMenuDetailsTree(siblingDetails);
    }
  });
}

async function loadMenuConfig() {
  try {
    const resp = await fetch('/docs/menu.json', { cache: 'no-store' });
    if (resp.ok) {
      const json = await resp.json();
      if (Array.isArray(json)) {
        window.xtendMenuConfig = json;
      }
    }
  } catch (e) {
    // Fallback auf Default-Menue.
  }
}

function getCurrentDocsSlug() {
  const parsed = parseDocsRoutePath(location.hash);
  return parsed.slug === '' || parsed.slug === '/' ? 'readme' : parsed.slug;
}

function resolveDocsMenuGroup(entry) {
  const slug = entry && entry.slug ? String(entry.slug) : '';
  if (entry && entry.group) return String(entry.group);
  if (slug === 'readme' || slug === 'about' || slug === 'best-practices' || slug === 'enterprise-adoption') return 'start';
  if (slug.startsWith('components')) return 'components';
  if (slug.startsWith('xtendrmt') || slug.startsWith('rmt-') || slug.includes('rmt-production') || slug.includes('parsedown')) return 'rmt';
  if (slug.includes('performance') || slug.includes('hydration') || slug.includes('a11y') || slug.includes('screenreader') || slug.includes('motion-contrast')) return 'quality';
  if (slug.includes('trusted-dom') || slug.includes('supply-chain') || slug.includes('manifest-import') || slug.includes('csp') || slug.includes('network')) return 'security';
  if (slug.startsWith('rc') || slug.startsWith('epic') || slug.includes('release') || slug.includes('package-export') || slug.includes('known-residual') || slug.includes('visual-owner')) return 'release';
  if (slug.includes('component-') || slug.includes('typescript') || slug.includes('catalog') || slug.includes('design-token') || slug.includes('visual')) return 'platform';
  return 'core';
}

function getDocsMenuGroupLabel(groupId) {
  const locale = getCurrentDocsLocale();
  const labels = {
    de: {
      start: 'Start',
      core: 'Core',
      platform: 'Platform',
      components: 'Komponenten',
      rmt: 'XTendRMT',
      quality: 'Quality',
      security: 'Security',
      release: 'Release'
    },
    en: {
      start: 'Start',
      core: 'Core',
      platform: 'Platform',
      components: 'Components',
      rmt: 'XTendRMT',
      quality: 'Quality',
      security: 'Security',
      release: 'Release'
    }
  };
  return (labels[locale] && labels[locale][groupId]) || labels.de[groupId] || groupId;
}

function getDocsMenuGroupIcon(groupId) {
  const icons = {
    start: 'home',
    core: 'package',
    platform: 'layers',
    components: 'boxes',
    rmt: 'route',
    quality: 'gauge',
    security: 'shield-check',
    release: 'rocket'
  };
  return icons[groupId] || 'docs';
}

function getDocsMenuEntryIcon(entry) {
  const slug = entry && entry.slug ? String(entry.slug) : '';
  const explicitIcon = entry && (entry.icon || entry.iconName);
  if (explicitIcon) return String(explicitIcon);

  const exact = {
    readme: 'home',
    'quick-start-guide': 'book-open',
    about: 'info',
    'best-practices': 'success',
    manifest: 'file',
    api: 'terminal',
    'xtend-loader': 'download',
    'xtend-fabric': 'zap',
    components: 'component',
    'component-platform': 'layers',
    'component-catalog-coverage': 'boxes',
    'design-tokens': 'palette',
    'xtendrmt-overview': 'route',
    'rmt-linter': 'terminal',
    'rmt-language-server': 'server',
    performance: 'gauge',
    'hydration-policies': 'zap',
    'a11y-keyboard-smokes': 'accessibility',
    'trusted-dom-sanitizing': 'shield-check',
    'supply-chain-gates': 'shield-check',
    'rc0-gate-matrix': 'package',
    'rc1-readiness': 'rocket',
    'enterprise-adoption': 'layers'
  };
  if (exact[slug]) return exact[slug];
  if (slug.startsWith('components-xcode')) return 'code';
  if (slug.startsWith('components-xicon') || slug.startsWith('components-xtheme')) return 'palette';
  if (slug.startsWith('components-xstate')) return 'database';
  if (slug.startsWith('components-xrouter') || slug.startsWith('xtendrmt') || slug.startsWith('rmt-')) return 'route';
  if (slug.startsWith('components-')) return 'component';
  if (slug.includes('security') || slug.includes('trusted-dom') || slug.includes('supply-chain') || slug.includes('csp') || slug.includes('network')) return 'shield-check';
  if (slug.includes('performance') || slug.includes('hydration')) return 'gauge';
  if (slug.includes('a11y') || slug.includes('screenreader') || slug.includes('motion-contrast')) return 'accessibility';
  if (slug.includes('release') || slug.startsWith('rc') || slug.startsWith('epic')) return 'rocket';
  if (slug.includes('component') || slug.includes('surface') || slug.includes('visual')) return 'layers';
  return 'docs';
}

function getDocsMenuEntryId(entry) {
  const slug = entry && entry.slug ? String(entry.slug) : '';
  if (entry && entry.id) return String(entry.id);
  if (slug.startsWith('components-')) {
    return `docs.components.${slug.slice('components-'.length).replace(/-/g, '.')}`;
  }
  return `docs.${slug.replace(/-/g, '.')}`;
}

function computeDocsMenuRank(entry) {
  const explicit = Number(entry && (entry.rank || entry.score || entry.pageRank));
  if (Number.isFinite(explicit)) return explicit;
  const slug = entry && entry.slug ? String(entry.slug) : '';
  const group = resolveDocsMenuGroup(entry);
  if (slug === 'readme') return 100;
  if (['manifest', 'api', 'xtend-loader', 'components', 'xtendrmt-overview'].includes(slug)) return 94;
  if (['enterprise-adoption', 'best-practices', 'component-platform', 'performance', 'trusted-dom-sanitizing'].includes(slug)) return 88;
  if (slug.startsWith('components-')) return 58;
  if (entry && entry.parent) return 66;
  return { start: 82, core: 78, platform: 74, components: 72, rmt: 76, quality: 72, security: 72, release: 64 }[group] || 60;
}

function getDocsMenuTier(entry) {
  if (entry && entry.tier) return String(entry.tier);
  if (entry && entry.parent) return 'deep-dive';
  return 'basic';
}

function normalizeDocsMenuEntry(entry) {
  const locale = getCurrentDocsLocale();
  const slug = entry && entry.slug ? String(entry.slug) : '';
  const localizedLabel = entry && entry.labels && (entry.labels[locale] || entry.labels[getDocsI18nConfig().fallbackLocale]);
  const label = localizedLabel
    ? String(localizedLabel)
    : entry && entry.label
    ? String(entry.label)
    : slug.replace(/^components-/, '').replace(/-/g, ' ');
  const parent = entry && entry.parent ? String(entry.parent) : '';
  return {
    ...entry,
    slug,
    id: getDocsMenuEntryId(entry),
    label: label.charAt(0).toUpperCase() + label.slice(1),
    group: resolveDocsMenuGroup(entry),
    parent,
    rank: computeDocsMenuRank(entry),
    tier: getDocsMenuTier(entry),
    children: []
  };
}

function sortDocsMenuEntries(entries = []) {
  return entries.sort((a, b) => {
    if (b.rank !== a.rank) return b.rank - a.rank;
    return String(a.label).localeCompare(String(b.label), getCurrentDocsLocale());
  });
}

function groupDocsMenuEntries(entries = []) {
  const order = ['start', 'core', 'platform', 'components', 'rmt', 'quality', 'security', 'release'];
  const groups = new Map(order.map((id) => [id, { id, label: getDocsMenuGroupLabel(id), entries: [] }]));
  const normalizedEntries = entries
    .filter((entry) => entry && entry.slug)
    .map(normalizeDocsMenuEntry);
  const bySlug = new Map(normalizedEntries.map((entry) => [entry.slug, entry]));
  const byId = new Map(normalizedEntries.map((entry) => [entry.id, entry]));
  const roots = [];

  normalizedEntries.forEach((entry) => {
    const parent = entry.parent ? (bySlug.get(entry.parent) || byId.get(entry.parent)) : null;
    if (parent) {
      parent.children.push(entry);
    } else {
      roots.push(entry);
    }
  });

  const sortTree = (entry) => {
    entry.children = sortDocsMenuEntries(entry.children);
    entry.children.forEach(sortTree);
  };
  roots.forEach(sortTree);

  sortDocsMenuEntries(roots).forEach((entry) => {
    const groupId = entry.group;
    if (!groups.has(groupId)) {
      groups.set(groupId, { id: groupId, label: getDocsMenuGroupLabel(groupId), entries: [] });
    }
    groups.get(groupId).entries.push(entry);
  });

  return Array.from(groups.values()).filter((group) => group.entries.length > 0);
}

function renderMenu() {
  const header = document.querySelector('x-header');
  if (!header) return;
  const locale = getCurrentDocsLocale();
  Array.from(header.querySelectorAll('x-link[slot="nav"]')).forEach((el) => el.remove());
  Array.from(header.querySelectorAll('[data-docs-menu-shell]')).forEach((el) => el.remove());
  const menu = window.xtendMenuConfig && window.xtendMenuConfig.length
    ? window.xtendMenuConfig
    : Object.keys(window.xtendDocsTitles || {}).map((slug) => ({ slug, label: window.xtendDocsTitles[slug] }));

  const shell = document.createElement('div');
  shell.setAttribute('slot', 'nav');
  shell.setAttribute('data-menu-shell', '');
  shell.setAttribute('data-docs-menu-shell', '');
  shell.className = 'docs-menu-shell';
  shell.setAttribute('role', 'list');
  shell.setAttribute('aria-label', locale === 'en' ? 'Documentation sections' : 'Dokumentationsbereiche');

  const renderMenuNode = (entry, depth = 0) => {
    const node = document.createElement('div');
    node.className = 'docs-menu-node';
    node.setAttribute('data-doc-id', entry.id);
    node.setAttribute('data-doc-rank', String(entry.rank));
    node.setAttribute('data-doc-tier', entry.tier);
    node.setAttribute('data-doc-depth', String(depth));

    const link = document.createElement('x-link');
    link.className = 'docs-menu-link';
    link.setAttribute('href', getLocalizedDocsPath(entry.slug, locale));
    link.setAttribute('data-docs-menu-link', '');
    link.setAttribute('data-doc-id', entry.id);
    link.setAttribute('data-doc-rank', String(entry.rank));
    link.setAttribute('data-doc-tier', entry.tier);
    const icon = document.createElement('x-icon');
    icon.className = 'docs-menu-link-icon';
    icon.setAttribute('name', getDocsMenuEntryIcon(entry));
    icon.setAttribute('decorative', '');
    icon.setAttribute('size', depth === 0 ? '1rem' : '0.92rem');
    const label = document.createElement('span');
    label.className = 'docs-menu-link-label';
    label.textContent = entry.label;
    link.appendChild(icon);
    link.appendChild(label);
    node.appendChild(link);

    if (entry.children && entry.children.length) {
      const details = document.createElement('details');
      details.className = 'docs-menu-children';
      details.setAttribute('data-docs-menu-children', '');
      details.setAttribute('data-doc-parent', entry.id);
      details.setAttribute('data-doc-depth', String(depth + 1));

      const summary = document.createElement('summary');
      summary.className = 'docs-menu-disclosure';
      summary.setAttribute('aria-expanded', 'false');
      const summaryIcon = document.createElement('x-icon');
      summaryIcon.className = 'docs-menu-disclosure-icon';
      summaryIcon.setAttribute('name', 'chevron-right');
      summaryIcon.setAttribute('decorative', '');
      summaryIcon.setAttribute('size', '0.9rem');
      const summaryLabel = document.createElement('span');
      summaryLabel.className = 'docs-menu-disclosure-label';
      // Contract anchor: summaryLabel.textContent = depth === 0 ? 'Deep Dives' : 'Weitere Themen'
      summaryLabel.textContent = locale === 'en'
        ? (depth === 0 ? 'Deep Dives' : 'More Topics')
        : (depth === 0 ? 'Deep Dives' : 'Weitere Themen');
      const summaryCount = document.createElement('span');
      summaryCount.className = 'docs-menu-disclosure-count';
      summaryCount.textContent = String(entry.children.length);
      summary.appendChild(summaryIcon);
      summary.appendChild(summaryLabel);
      summary.appendChild(summaryCount);

      const childList = document.createElement('div');
      childList.className = 'docs-menu-child-list';
      entry.children.forEach((child) => {
        childList.appendChild(renderMenuNode(child, depth + 1));
      });

      details.appendChild(summary);
      details.appendChild(childList);
      details.addEventListener('toggle', () => {
        syncDocsMenuDisclosureState(details);
        if (details.open) {
          closeSiblingDocsSubmenus(details);
        }
      });
      node.appendChild(details);
    }

    return node;
  };

  groupDocsMenuEntries(menu).forEach((group) => {
    const section = document.createElement('section');
    section.className = 'docs-menu-section';
    section.setAttribute('role', 'listitem');
    section.setAttribute('aria-labelledby', `docs-menu-${group.id}`);

    const title = document.createElement('h3');
    title.id = `docs-menu-${group.id}`;
    title.className = 'docs-menu-section-title';
    const icon = document.createElement('x-icon');
    icon.setAttribute('name', getDocsMenuGroupIcon(group.id));
    icon.setAttribute('decorative', '');
    icon.setAttribute('size', '1rem');
    const titleText = document.createElement('span');
    titleText.textContent = group.label;
    title.appendChild(icon);
    title.appendChild(titleText);

    const links = document.createElement('div');
    links.className = 'docs-menu-section-links';

    group.entries.forEach((entry) => {
      links.appendChild(renderMenuNode(entry));
    });

    section.appendChild(title);
    section.appendChild(links);
    shell.appendChild(section);
  });

  header.appendChild(shell);
  syncActiveHeaderLink(getCurrentDocsSlug());
}

function ensureMenuBinding() {
  if (window.__xtendDocsMenuBound) {
    syncActiveHeaderLink(getCurrentDocsSlug());
    return;
  }
  window.__xtendDocsMenuBound = true;
  loadMenuConfig().then(renderMenu);
  window.addEventListener('hashchange', () => syncActiveHeaderLink(getCurrentDocsSlug()));
  window.addEventListener('xtend-docs-locale-changed', (event) => {
    const locale = event && event.detail && event.detail.locale ? event.detail.locale : getCurrentDocsLocale();
    const slug = getCurrentDocsSlug();
    syncLegacyDocsGlobals(locale, { slug });
    if (window.__xtendDocsMenuLocaleDisposer) window.__xtendDocsMenuLocaleDisposer();
    window.__xtendDocsMenuLocaleDisposer = scheduleDocsIdle(() => {
      window.__xtendDocsMenuLocaleDisposer = null;
      renderMenu();
    }, 140);
  });
}

function updateDocsLocaleBusyUi(transition = window.__xtendDocsLocaleTransition || window.__xtendDocsLocaleLastTransition || null) {
  const busy = Boolean(transition && transition.busy);
  const locale = transition && transition.targetLocale ? transition.targetLocale : getCurrentDocsLocale();
  const control = document.querySelector('[data-docs-language-control]');
  const status = document.querySelector('[data-docs-language-status]');
  const label = document.querySelector('[data-docs-language-status-label]');
  if (control) {
    control.toggleAttribute('data-docs-locale-busy', busy);
    control.setAttribute('aria-busy', busy ? 'true' : 'false');
  }
  if (status) {
    status.hidden = !busy;
  }
  if (label) {
    label.textContent = locale === 'en' ? 'Loading' : 'Lädt';
  }
}

function updateDocsLocaleUi(locale = getCurrentDocsLocale(), options = {}) {
  const targetLocale = normalizeDocsLocale(locale);
  const shouldPublish = options.publish !== false;
  const normalized = !shouldPublish
    ? targetLocale
    : window.xtendDocsCurrentLocale && normalizeDocsLocale(window.xtendDocsCurrentLocale) === targetLocale
    ? targetLocale
    : publishDocsLocale(targetLocale, window.__xtendDocsLocaleUserSelected ? 'user' : 'route');
  syncLegacyDocsGlobals(normalized, { slug: options.slug || getCurrentDocsSlug() });
  const headerTitle = document.querySelector('x-header [slot="title"]');
  if (headerTitle) {
    headerTitle.textContent = normalized === 'en' ? 'XTend Documentation' : 'XTend Dokumentation';
  }
  const control = document.querySelector('[data-docs-language-control]');
  if (control) {
    control.setAttribute('aria-label', normalized === 'en' ? 'Change language' : 'Sprache wechseln');
  }
  const select = document.getElementById('docs-language-select');
  if (select && select.getAttribute('value') !== normalized) {
    select.setAttribute('value', normalized);
    if ('value' in select) {
      try { select.value = normalized; } catch (error) {}
    }
  }
  if (select) {
    select.setAttribute('label', normalized === 'en' ? 'Language' : 'Sprache');
  }
  updateDocsLocaleBusyUi(options.busy === false ? { busy: false, targetLocale: normalized } : window.__xtendDocsLocaleTransition);
  document.querySelectorAll('[data-docs-locale-label]').forEach((node) => {
    const text = node.getAttribute('data-docs-locale-label-' + normalized);
    if (text) node.textContent = text;
  });
  return normalized;
}

function navigateDocsLocale(locale, source = 'user') {
  const normalized = normalizeDocsLocale(locale);
  const slug = getCurrentDocsSlug();
  const currentRoute = parseDocsRoutePath(location.hash);
  if (source === 'user') {
    window.__xtendDocsLocaleUserSelected = true;
    writeStoredDocsLocale(normalized);
  }
  if (normalized === getCurrentDocsLocale() && currentRoute.localized && currentRoute.locale === normalized && !window.__xtendDocsLocaleTransition) {
    completeDocsLocaleTransition(normalized, slug, { source, status: 'ready' });
    updateDocsLocaleUi(normalized, { publish: false, busy: false, slug });
    return;
  }
  beginDocsLocaleTransition(normalized, { source, slug });
  syncLegacyDocsGlobals(normalized, { slug });
  prefetchDocsLocalePage(slug, normalized).catch(() => {});
  window.__xtendDocsPendingLocaleRoute = window.__xtendDocsLocaleTransition;
  const nextHash = '#' + getLocalizedDocsPath(slug, normalized);
  if (location.hash !== nextHash) {
    location.hash = nextHash;
  } else {
    const page = document.querySelector('xtend-doc-page');
    if (page && typeof page.updateRoute === 'function') {
      page.updateRoute({ path: getLocalizedDocsPath(slug, normalized), source: 'locale-change' });
    }
  }
  updateDocsLocaleUi(normalized, { publish: false, busy: true, slug });
}

function ensureDocsLanguageSelectBinding() {
  if (window.__xtendDocsLanguageSelectBound) return;
  window.__xtendDocsLanguageSelectBound = true;
  updateDocsLocaleUi(getCurrentDocsLocale());
  const maybePrefetchLanguageTarget = (event) => {
    const control = event.target && event.target.closest
      ? event.target.closest('[data-docs-language-control], #docs-language-select')
      : null;
    if (!control) return;
    prefetchAlternateDocsLocales(getCurrentDocsSlug());
  };
  document.addEventListener('pointerdown', maybePrefetchLanguageTarget, { passive: true });
  document.addEventListener('focusin', maybePrefetchLanguageTarget);
  document.addEventListener('select-changed', (event) => {
    const select = event.target && event.target.closest
      ? event.target.closest('#docs-language-select')
      : null;
    if (!select) return;
    const value = event.detail && event.detail.value ? event.detail.value : select.getAttribute('value');
    navigateDocsLocale(value, 'user');
  });
  window.addEventListener('hashchange', () => {
    const parsed = parseDocsRoutePath(location.hash);
    updateDocsLocaleUi(parsed.locale, {
      publish: false,
      busy: Boolean(window.__xtendDocsLocaleTransition),
      slug: parsed.slug || getCurrentDocsSlug()
    });
  });
  if (window.xstate && typeof window.xstate.subscribe === 'function') {
    const config = getDocsI18nConfig();
    window.xstate.subscribe((key, value) => {
      if (key === config.stateKeys.locale && value && normalizeDocsLocale(value) !== getCurrentDocsLocale()) {
        navigateDocsLocale(value, 'xstate');
      }
    }, config.stateKeys.locale);
  }
}

function docsPageExists(slug) {
  const localized = getLocalizedDocsMap('xtendDocsLocalizedPagesMeta', getCurrentDocsLocale());
  if (localized && localized[slug]) return true;
  return Boolean(slug && (
    window.xtendDocsPages && window.xtendDocsPages[slug] ||
    window.xtendDocsPagesMeta && window.xtendDocsPagesMeta[slug]
  ));
}

function docsTitleForSlug(slug) {
  const localizedTitles = getLocalizedDocsMap('xtendDocsLocalizedTitles', getCurrentDocsLocale());
  return (localizedTitles && localizedTitles[slug]) ||
    (window.xtendDocsTitles && window.xtendDocsTitles[slug]) ||
    (slug ? slug.replace(/^components-/, '').replace(/-/g, ' ') : '');
}

function normalizeDocsSlugFromHref(href) {
  if (!href) return '';
  let value = String(href).trim();
  if (!value || value.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(value)) return '';
  value = value.split('#')[0].split('?')[0];
  value = value.replace(/^#\/?/, '').replace(/^\/+/, '').replace(/^\.\//, '');
  while (value.startsWith('../')) value = value.slice(3);
  if (value.startsWith('docs/')) value = value.slice('docs/'.length);
  if (value.startsWith('components/')) {
    value = 'components-' + value.slice('components/'.length);
  }
  value = value.replace(/\.md$/i, '').replace(/\//g, '-').toLowerCase();
  if (docsPageExists(value)) return value;
  const base = value.split('-').pop();
  const match = getDocsPageSlugs().find((slug) => slug === value || slug.endsWith('-' + base));
  return match || value;
}

function collectRelatedLinksFromNode(node) {
  const links = [];
  Array.from(node.querySelectorAll('x-link, a')).forEach((link) => {
    const href = link.getAttribute('href') || '';
    const slug = normalizeDocsSlugFromHref(href);
    const label = (link.textContent || (slug ? docsTitleForSlug(slug) : href)).trim();
    if (slug && docsPageExists(slug)) {
      links.push({
        slug,
        href: '/' + slug,
        label: label || docsTitleForSlug(slug),
        source: 'parsedown'
      });
      return;
    }
    if (href && isDocsTrustedDomUrlAllowed(href)) {
      links.push({
        href,
        label: label || href,
        source: 'parsedown'
      });
    }
  });
  return links;
}

function isRelatedText(value) {
  return /(siehe auch|weiterfuehr|weiterführ|verwandte|read further|related|see also)/i.test(String(value || ''));
}

function headingLevel(node) {
  return /^H[1-6]$/i.test(node.tagName || '') ? Number(node.tagName.slice(1)) : 0;
}

function extractDocsRelatedLinks(contentRoot) {
  if (!contentRoot) return [];
  const links = [];

  Array.from(contentRoot.querySelectorAll('blockquote')).forEach((node) => {
    if (!isRelatedText(node.textContent)) return;
    links.push(...collectRelatedLinksFromNode(node));
    node.remove();
  });

  Array.from(contentRoot.querySelectorAll('p')).forEach((node) => {
    if (!isRelatedText(node.textContent)) return;
    const nodeLinks = collectRelatedLinksFromNode(node);
    if (!nodeLinks.length) return;
    links.push(...nodeLinks);
    node.remove();
  });

  Array.from(contentRoot.querySelectorAll('h2, h3, h4')).forEach((heading) => {
    if (!heading.isConnected || !isRelatedText(heading.textContent)) return;
    const baseLevel = headingLevel(heading);
    let cursor = heading.nextElementSibling;
    const remove = [heading];
    while (cursor) {
      const level = headingLevel(cursor);
      if (level && level <= baseLevel) break;
      links.push(...collectRelatedLinksFromNode(cursor));
      remove.push(cursor);
      cursor = cursor.nextElementSibling;
    }
    remove.forEach((node) => node.remove());
  });

  const seen = new Set();
  return links.filter((link) => {
    const key = link.slug || link.href;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function fallbackRelatedLinksForSlug(slug) {
  const menu = Array.isArray(window.xtendMenuConfig) && window.xtendMenuConfig.length
    ? window.xtendMenuConfig
    : [];
  const current = menu.find((entry) => entry && entry.slug === slug);
  const candidates = [];

  if (current) {
    const parent = current.parent || '';
    menu.forEach((entry) => {
      if (!entry || entry.slug === slug) return;
      if ((parent && entry.parent === parent) || entry.parent === slug || current.parent === entry.slug || entry.group === current.group) {
        candidates.push({ slug: entry.slug, label: entry.label || docsTitleForSlug(entry.slug), source: 'menu' });
      }
    });
  }

  if (slug.startsWith('components-')) {
    ['components', 'component-catalog-coverage', 'component-lab', 'component-ux-authoring'].forEach((candidate) => {
      candidates.push({ slug: candidate, label: docsTitleForSlug(candidate), source: 'component-index' });
    });
  }

  if (!candidates.length) {
    ['quick-start-guide', 'components', 'xtendrmt-overview', 'xtend-loader'].forEach((candidate) => {
      candidates.push({ slug: candidate, label: docsTitleForSlug(candidate), source: 'default' });
    });
  }

  const seen = new Set([slug]);
  return candidates
    .filter((entry) => docsPageExists(entry.slug))
    .filter((entry) => {
      if (seen.has(entry.slug)) return false;
      seen.add(entry.slug);
      return true;
    })
    .slice(0, 7);
}

function createRelatedLink(entry) {
  const link = document.createElement('x-link');
  link.className = 'docs-related-link';
  const href = entry.href || (entry.slug ? getLocalizedDocsPath(entry.slug) : '#');
  link.setAttribute('href', href);
  link.setAttribute('data-rmt-component', 'docs.relatedLinks');
  if (entry.slug) {
    link.setAttribute('data-rmt-route-ref', 'docs.' + entry.slug.replace(/-/g, '.'));
  }

  const icon = document.createElement('x-icon');
  icon.setAttribute('name', 'arrow-up-right');
  icon.setAttribute('pack', 'lucide');
  icon.setAttribute('decorative', '');
  icon.setAttribute('size', '1rem');

  const label = document.createElement('span');
  label.textContent = entry.label || (entry.slug ? docsTitleForSlug(entry.slug) : href);

  const chevron = document.createElement('x-icon');
  chevron.setAttribute('name', 'chevron-right');
  chevron.setAttribute('pack', 'lucide');
  chevron.setAttribute('decorative', '');
  chevron.setAttribute('size', '1rem');

  link.appendChild(icon);
  link.appendChild(label);
  link.appendChild(chevron);
  return link;
}

function renderDocsRelatedSidebar(relatedSlot, slug, explicitLinks) {
  if (!relatedSlot) return;
  const list = relatedSlot.querySelector('[data-rmt-slot="related-links"], .docs-related-list') || relatedSlot;
  while (list.firstChild) list.removeChild(list.firstChild);
  const links = explicitLinks && explicitLinks.length ? explicitLinks : fallbackRelatedLinksForSlug(slug);
  links.forEach((entry) => list.appendChild(createRelatedLink(entry)));
  relatedSlot.hidden = links.length === 0;
  relatedSlot.setAttribute('data-related-count', String(links.length));
}

function createDemoCodeBlock(title, lang, code, mode = 'html') {
  const block = document.createElement('div');
  block.className = 'docs-demo-code-block';
  const heading = document.createElement('h3');
  heading.textContent = title;
  const codeElement = document.createElement('x-code');
  codeElement.setAttribute('lang', lang);
  const template = document.createElement('template');
  const snippetCode = code == null ? '' : String(code);
  template.setAttribute('data-x-code-mode', mode === 'html' ? 'html' : 'text');
  if (mode === 'html') {
    template.innerHTML = snippetCode;
  } else {
    template.content.appendChild(document.createTextNode(snippetCode));
  }
  codeElement.appendChild(template);
  block.appendChild(heading);
  block.appendChild(codeElement);
  return block;
}

function ensureDocsDemoScaffold(demoSlot) {
  let title = demoSlot.querySelector('[data-demo-title]');
  if (!title) {
    let heading = demoSlot.querySelector('.docs-sidebar-heading');
    if (!heading) {
      heading = createDocsSidebarHeading('play', 'Hands-on Demo', { demoTitle: true });
      demoSlot.insertBefore(heading, demoSlot.firstChild);
      title = heading.querySelector('[data-demo-title]');
    } else {
      title = document.createElement('span');
      title.setAttribute('data-demo-title', '');
      heading.appendChild(title);
    }
  }

  let description = demoSlot.querySelector('[data-demo-description]');
  if (!description) {
    description = document.createElement('p');
    description.className = 'docs-sidebar-copy';
    description.setAttribute('data-demo-description', '');
    demoSlot.appendChild(description);
  }

  let preview = demoSlot.querySelector('[data-demo-preview]');
  if (!preview) {
    preview = document.createElement('div');
    preview.className = 'docs-demo-preview';
    preview.setAttribute('data-demo-preview', '');
    demoSlot.appendChild(preview);
  }

  let code = demoSlot.querySelector('[data-demo-code]');
  if (!code) {
    code = document.createElement('div');
    code.className = 'docs-demo-code-grid';
    code.setAttribute('data-demo-code', '');
    demoSlot.appendChild(code);
  }

  return { title, description, preview, code };
}

function hydrateDocsCodeBlocks(root, metadata = {}) {
  const scope = root || document;
  const codeBlocks = Array.from(scope.querySelectorAll ? scope.querySelectorAll('x-code') : []);
  if (!codeBlocks.length) {
    return Promise.resolve({
      schema: 'xtend.docs.code-hydration.v1',
      hydrated: 0,
      count: 0,
      skipped: 'no-code-blocks'
    });
  }

  const publishHydration = (loaderSnapshot = {}) => {
    const hydrated = Number.isFinite(loaderSnapshot.hydrated)
      ? loaderSnapshot.hydrated
      : codeBlocks.filter((codeBlock) => typeof codeBlock.hydrate === 'function').length;

    const snapshot = {
      schema: 'xtend.docs.code-hydration.v1',
      slug: metadata.slug || '',
      reason: metadata.reason || 'route-render',
      schedule: metadata.schedule || 'docs.page.hydrate',
      count: codeBlocks.length,
      hydrated,
      componentDefined: Boolean(customElements.get('x-code')),
      loader: loaderSnapshot.schema || null
    };
    window.xtendDocsLastCodeHydration = snapshot;
    window.dispatchEvent(new CustomEvent('xtend-docs-code-hydrated', { detail: snapshot }));
    return snapshot;
  };

  if (window.XTendLoader && typeof window.XTendLoader.hydrateTree === 'function') {
    return window.XTendLoader.hydrateTree(scope, {
      tags: ['x-code'],
      source: 'docs.component-demo',
      reason: metadata.reason || 'route-render',
      schedule: metadata.schedule || 'docs.page.hydrate'
    }).then(publishHydration);
  }

  return new Promise((resolve) => {
    const commit = () => {
      codeBlocks.forEach((codeBlock) => {
        if (typeof codeBlock.hydrate === 'function') codeBlock.hydrate();
      });
      resolve(publishHydration());
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(commit);
    else window.setTimeout(commit, 0);
  });
}

function bindDocsDemoInteractions(container, demo) {
  if (!container || !demo || !Array.isArray(demo.actions)) return;
  if (demo.actions.includes('toast')) {
    container.querySelectorAll('[data-demo-action="toast"]').forEach((button) => {
      bindDocsButtonAction(button, () => window.xtendShowToast('XTend Demo Toast', 'success', 2800));
    });
  }
  if (demo.actions.includes('open-modal')) {
    container.querySelectorAll('[data-demo-action="open-modal"]').forEach((button) => {
      bindDocsButtonAction(button, () => {
        const modal = container.querySelector('#docs-demo-modal');
        if (modal && typeof modal.open === 'function') modal.open();
        else if (modal) modal.setAttribute('open', '');
      });
    });
  }
  if (demo.actions.includes('open-dialog')) {
    container.querySelectorAll('[data-demo-action="open-dialog"]').forEach((button) => {
      bindDocsButtonAction(button, () => {
        const dialog = container.querySelector('#docs-demo-dialog');
        if (dialog && typeof dialog.open === 'function') dialog.open();
        else if (dialog) dialog.setAttribute('open', '');
      });
    });
  }
}

function renderDocsComponentDemo(demoSlot, slug) {
  if (!demoSlot) return;
  const demo = DOCS_COMPONENT_DEMOS[slug];
  if (!demo) {
    demoSlot.hidden = true;
    demoSlot.removeAttribute('data-demo-component');
    return;
  }

  demoSlot.hidden = false;
  demoSlot.setAttribute('data-demo-component', demo.tag);
  const { title, description, preview, code } = ensureDocsDemoScaffold(demoSlot);
  if (title) title.textContent = `${demo.title} Hands-on`;
  if (description) description.textContent = demo.description;
  if (preview) {
    preview.innerHTML = demo.previewHtml;
    bindDocsDemoInteractions(preview, demo);
  }
  if (code) {
    while (code.firstChild) code.removeChild(code.firstChild);
    code.appendChild(createDemoCodeBlock('HTML', 'html', demo.html, 'html'));
    code.appendChild(createDemoCodeBlock('RMT', 'rmt', demo.rmt, 'text'));
  }
}

function resolveDocsSlugFromRouteContext(context = {}) {
  const explicit = context.slug || context.path || context.to || '';
  const parsed = parseDocsRoutePath(explicit ? String(explicit) : location.hash);
  publishDocsLocale(parsed.locale, parsed.localized ? 'route' : 'compat-route');
  let slug = parsed.slug || 'readme';
  if (slug === '' || slug === '/') slug = 'readme';
  if (!parsed.localized) {
    const localizedPath = getLocalizedDocsPath(slug, parsed.locale);
    if (location.hash !== '#' + localizedPath) {
      history.replaceState(null, '', '#' + localizedPath);
    }
  }
  return slug;
}

class XtendDocPage extends HTMLElement {
  constructor() {
    super();
    this.__xtendDocsShell = null;
    this.__xtendDocsRouteToken = 0;
    this.__xtendDocsScheduledDisposers = [];
  }

  connectedCallback() {
    this.renderRoute({ source: 'connected-callback' });
  }

  disconnectedCallback() {
    this.cancelScheduledRouteWork();
  }

  updateRoute(context = {}) {
    return this.renderRoute({ ...context, source: context.source || 'x-router-reuse' });
  }

  cancelScheduledRouteWork() {
    this.__xtendDocsScheduledDisposers.splice(0).forEach((dispose) => {
      if (typeof dispose === 'function') dispose();
    });
  }

  scheduleRouteWork(dispose) {
    if (typeof dispose === 'function') this.__xtendDocsScheduledDisposers.push(dispose);
  }

  isActiveRouteToken(token) {
    return this.isConnected && this.__xtendDocsRouteToken === token;
  }

  ensureRouteShell(slug, rmtMeta) {
    if (!this.__xtendDocsShell) {
      this.__xtendDocsShell = createRmtDocsShell(slug, rmtMeta);
      this.innerHTML = '';
      this.appendChild(this.__xtendDocsShell.section);
      this.setAttribute('data-docs-shell-reused', 'false');
      return this.__xtendDocsShell;
    }
    this.setAttribute('data-docs-shell-reused', 'true');
    return this.__xtendDocsShell;
  }

  renderRoute(context = {}) {
    this.cancelScheduledRouteWork();
    const token = this.__xtendDocsRouteToken + 1;
    this.__xtendDocsRouteToken = token;

    const slug = resolveDocsSlugFromRouteContext(context);
    const locale = getCurrentDocsLocale();
    syncLegacyDocsGlobals(locale, { slug });
    const pendingLocaleRoute = window.__xtendDocsPendingLocaleRoute;
    const localeRouteFastPath = context.source === 'locale-change' || Boolean(
      pendingLocaleRoute &&
      pendingLocaleRoute.slug === slug &&
      pendingLocaleRoute.targetLocale === locale &&
      docsPerfNow() - Number(pendingLocaleRoute.startedAtMs || 0) < 8000
    );
    if (localeRouteFastPath) {
      window.__xtendDocsPendingLocaleRoute = null;
    }
    const docsRouteStartedAt = new Date().toISOString();
    const routePerfStartedAt = docsPerfNow();
    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const reused = context.source === 'x-router-reuse' || context.source === 'locale-change' || context.reused === true;

    this.setAttribute('data-docs-route-state', reducedMotion ? 'ready' : 'loading');
    this.setAttribute('data-docs-route-slug', slug);
    this.setAttribute('data-docs-route-locale', locale);
    this.setAttribute('data-docs-route-reused', reused ? 'true' : 'false');
    this.setAttribute('aria-busy', 'true');
    ensureDocsShellScopedStyles(this.getRootNode());

    const rmtMeta = getDocsPageMeta(slug, locale) || {};
    const hadShell = Boolean(this.__xtendDocsShell);
    const shell = this.ensureRouteShell(slug, rmtMeta);
    applyRmtPageMetadata(shell.section, shell.mdContent, shell.richSlot, shell.diagnosticsSlot, rmtMeta, shell.sidebar, shell.relatedSlot, shell.demoSlot);
    wireDownloadButton(shell.download, slug);

    const parseSchedule = rmtMeta.schedules && rmtMeta.schedules.parse ? rmtMeta.schedules.parse : 'docs.markdown.parse';
    const routeSchedule = rmtMeta.schedules && rmtMeta.schedules.route ? rmtMeta.schedules.route : 'docs.route.render';
    const hydrateSchedule = rmtMeta.schedules && rmtMeta.schedules.hydrate ? rmtMeta.schedules.hydrate : 'docs.page.hydrate';
    const shellSchedule = rmtMeta.schedules && rmtMeta.schedules.shell ? rmtMeta.schedules.shell : 'docs.shell.render';
    const richSchedule = rmtMeta.schedules && rmtMeta.schedules.rich ? rmtMeta.schedules.rich : 'docs.rich-content.prepare';
    const mediaSchedule = rmtMeta.schedules && rmtMeta.schedules.media ? rmtMeta.schedules.media : 'docs.media.lazy';
    const diagnosticsSchedule = rmtMeta.schedules && rmtMeta.schedules.diagnostics ? rmtMeta.schedules.diagnostics : DOCS_RMT_DEFAULT_DIAGNOSTICS_SCHEDULE;
    const relatedSchedule = 'docs.related.prepare';
    const demoSchedule = 'docs.demo.prepare';
    const laneDurations = [];

    const measuredLane = (lane, schedule, operation, callback) => runDocsMeasuredLane({
      slug,
      lane,
      schedule,
      operation,
      routeRef: rmtMeta.routeId || ('docs.' + slug.replace(/-/g, '.')),
      routeToken: token,
      reused
    }, () => {
      const startedAt = docsPerfNow();
      const result = callback();
      laneDurations.push({ lane, schedule, operation, durationMs: docsRoundDuration(docsPerfNow() - startedAt) });
      return result;
    });

    window.xtendDocsRmtLastRender = {
      schema: DOCS_RMT_RENDER_SCHEMA,
      slug,
      locale,
      shellFirst: true,
      shellReused: hadShell,
      routeReuse: reused,
      insularHydration: true,
      productionHardeningSchema: DOCS_RMT_PRODUCTION_HARDENING_SCHEMA,
      shellTemplate: rmtMeta.shellTemplate || DOCS_RMT_DEFAULT_SHELL_TEMPLATE,
      shellSchedule,
      shellEndpoint: getRmtSchedule(shellSchedule) ? getRmtSchedule(shellSchedule).endpointName : 'xtendrmt.shell.render',
      searchTemplate: rmtMeta.searchTemplate || DOCS_RMT_DEFAULT_SEARCH_TEMPLATE,
      title: rmtMeta.title || '',
      documentTitle: rmtMeta.documentTitle || '',
      titleTemplate: rmtMeta.titleTemplate || '',
      metaDescription: rmtMeta.metaDescription || '',
      metaKeywords: rmtMeta.metaKeywords || [],
      template: rmtMeta.template || '',
      adapter: rmtMeta.adapter || 'docs.parsedown',
      parseSchedule,
      routeSchedule,
      hydrateSchedule,
      richSchedule,
      mediaSchedule,
      relatedSchedule,
      demoSchedule,
      diagnosticsSchedule,
      markupClass: rmtMeta.markupClass || 'parsedownHtml',
      contentKind: rmtMeta.contentKind || 'parsedownHtml',
      contentSlot: rmtMeta.contentSlot || 'content',
      extensionSlots: DOCS_RMT_EXTENSION_SLOTS.slice(),
      sidebarSlotAvailable: Boolean(shell.sidebar),
      relatedSlotAvailable: Boolean(shell.relatedSlot),
      componentDemoSlotAvailable: Boolean(shell.demoSlot),
      diagnosticsSlotAvailable: Boolean(shell.diagnosticsSlot),
      trustBoundary: rmtMeta.trustBoundary || DOCS_RMT_TRUST_BOUNDARY
    };
    window.xtendDocsRmtProductionLastRender = createDocsRmtProductionRenderSnapshot(slug, rmtMeta, shell);

    ensureRmtSearchShell();
    ensureMainBackgroundBinding();

    syncActiveHeaderLink(slug);
    ensureMenuBinding();
    while (shell.mdContent.firstChild) {
      shell.mdContent.removeChild(shell.mdContent.firstChild);
    }
    showDocsSkeleton(shell.mdContent, {
      variant: 'article',
      lines: 11,
      minHeight: '24rem',
      label: locale === 'en' ? 'Documentation content is loading' : 'Dokumentationsinhalt wird geladen',
      source: 'docs.parsedown',
      schedule: parseSchedule
    });

    const contentPayloadPromise = loadDocsParsedownContent(slug, rmtMeta, locale);
    let relatedLinks = [];
    let contentCommitted = false;

    const commitParsedownContent = async () => {
      if (!this.isActiveRouteToken(token) || contentCommitted) return false;
      const payload = await contentPayloadPromise;
      if (!this.isActiveRouteToken(token) || contentCommitted) return false;
      contentCommitted = true;
      const html = payload && typeof payload.html === 'string'
        ? payload.html
        : '<em>Seite nicht gefunden</em>';
      const payloadMeta = payload && payload.meta && typeof payload.meta === 'object'
        ? payload.meta
        : rmtMeta;
      const trustedDomResult = measuredLane('visible', parseSchedule, 'article.trusted-dom-commit', () => applyDocsTrustedDomHtml(shell.mdContent, html, {
        slug,
        locale,
        source: payloadMeta.source || rmtMeta.source || 'docs.parsedown',
        markupClass: payloadMeta.markupClass || rmtMeta.markupClass || 'parsedownHtml',
        trustBoundary: payloadMeta.trustBoundary || rmtMeta.trustBoundary || DOCS_RMT_TRUST_BOUNDARY,
        syntaxSchedule: 'docs.syntax.highlight'
      }));
      hideDocsSkeleton(shell.mdContent);
      window.xtendDocsRmtLastRender.lazyPayload = payload && payload.source !== 'inline';
      window.xtendDocsRmtLastRender.payloadSource = payload ? payload.source : 'unknown';
      window.xtendDocsRmtLastRender.requestedLocale = payload ? payload.requestedLocale : locale;
      window.xtendDocsRmtLastRender.resolvedLocale = payload ? payload.resolvedLocale : locale;
      window.xtendDocsRmtLastRender.translationAvailable = payload ? payload.translationAvailable !== false : true;
      window.xtendDocsRmtLastRender.skeletonLoader = 'xtend.loader.skeleton-loader.v1';
      window.xtendDocsRmtProductionLastRender.trustedDom = {
        schema: trustedDomResult.schema,
        sanitizer: trustedDomResult.sanitizer,
        sanitized: trustedDomResult.sanitized,
        removedCount: trustedDomResult.removedCount,
        boundary: trustedDomResult.boundary,
        markupClass: trustedDomResult.markupClass,
        cacheHit: trustedDomResult.cacheHit === true
      };

      relatedLinks = measuredLane('visible', relatedSchedule, 'article.related-extract', () => {
        upgradeRoutedLinks(shell.mdContent);
        return extractDocsRelatedLinks(shell.mdContent);
      });
      return true;
    };

    let transitionCompleted = false;
    const finishTransition = (status = 'ready', error = null) => {
      if (!this.isActiveRouteToken(token) || transitionCompleted) return;
      transitionCompleted = true;
      this.setAttribute('data-docs-route-state', 'ready');
      this.removeAttribute('aria-busy');
      completeDocsLocaleTransition(locale, slug, {
        status,
        error,
        source: context.source || 'route'
      });
      window.dispatchEvent(new CustomEvent('xtend-docs-route-transition', {
        detail: {
          schema: 'xtend.docs.route-transition.v1',
          slug,
          locale,
          reducedMotion,
          reused,
          insularHydration: true,
          startedAt: docsRouteStartedAt,
          completedAt: new Date().toISOString(),
          durationMs: docsRoundDuration(docsPerfNow() - routePerfStartedAt),
          laneDurations: laneDurations.slice(),
          routeRef: rmtMeta.routeId || ('docs.' + slug.replace(/-/g, '.')),
          routeId: rmtMeta.routeId || ('docs.' + slug.replace(/-/g, '.')),
          componentRef: 'xtend-doc-page',
          rmtComponentId: 'docs.page',
          schedule: routeSchedule,
          routeSchedule,
          hydrateSchedule,
          localeStatus: status,
          relatedSchedule,
          demoSchedule,
          diagnosticsSchedule,
          shellSchedule,
          parseSchedule,
          metadata: window.xtendDocsRmtLastRender || null
        }
      }));
    };

    const completeParsedownCommit = () => {
      if (!this.isActiveRouteToken(token)) return;
      commitParsedownContent().then((committed) => {
        if (!committed || !this.isActiveRouteToken(token)) return;
        measuredLane('idle', relatedSchedule, 'sidebar.related-render', () => renderDocsRelatedSidebar(shell.relatedSlot, slug, relatedLinks));
        window.dispatchEvent(new CustomEvent('xtend-docs-content-ready', {
          detail: {
            schema: 'xtend.docs.content-ready.v1',
            slug,
            locale,
            requestedLocale: window.xtendDocsRmtLastRender.requestedLocale,
            resolvedLocale: window.xtendDocsRmtLastRender.resolvedLocale,
            translationAvailable: window.xtendDocsRmtLastRender.translationAvailable,
            routeRef: rmtMeta.routeId || ('docs.' + slug.replace(/-/g, '.')),
            root: shell.mdContent,
            schedule: hydrateSchedule,
            syntaxSchedule: 'docs.syntax.highlight',
            reused,
            insularHydration: true,
            skeletonLoader: 'xtend.loader.skeleton-loader.v1'
          }
        }));
        hydrateDocsCodeBlocks(shell.mdContent, {
          slug,
          reason: 'parsedown-code-fence-syntax-highlight',
          schedule: 'docs.syntax.highlight'
        });
        finishTransition();
      }).catch((error) => {
        if (!this.isActiveRouteToken(token)) return;
        hideDocsSkeleton(shell.mdContent);
        shell.mdContent.innerHTML = '<em>Seite konnte nicht geladen werden.</em>';
        window.dispatchEvent(new CustomEvent('xtend-docs-content-error', {
          detail: {
            schema: 'xtend.docs.content-error.v1',
            slug,
            locale,
            schedule: parseSchedule,
            message: error && error.message ? error.message : String(error)
          }
        }));
        finishTransition('error', error && error.message ? error.message : String(error));
      });
    };
    if (localeRouteFastPath) {
      let cancelled = false;
      Promise.resolve().then(() => {
        if (!cancelled) completeParsedownCommit();
      });
      this.scheduleRouteWork(() => {
        cancelled = true;
      });
    } else {
      const afterPaintDisposer = scheduleDocsAfterPaint(completeParsedownCommit);
      this.scheduleRouteWork(afterPaintDisposer);
    }

    const idleDisposer = scheduleDocsIdle(() => {
      if (!this.isActiveRouteToken(token)) return;
      measuredLane('idle', demoSchedule, 'component-demo.render', () => renderDocsComponentDemo(shell.demoSlot, slug));
      hydrateDocsCodeBlocks(shell.demoSlot, {
        slug,
        reason: 'component-demo-idle-route-render',
        schedule: demoSchedule
      });
    });
    this.scheduleRouteWork(idleDisposer);

    return true;
  }
}

if (!customElements.get('xtend-doc-page')) {
  customElements.define('xtend-doc-page', XtendDocPage);
}

window.xtendDocsI18n = {
  ...getDocsI18nConfig(),
  normalizeLocale: normalizeDocsLocale,
  getCurrentLocale: getCurrentDocsLocale,
  getTransition: () => window.__xtendDocsLocaleTransition || window.__xtendDocsLocaleLastTransition || null,
  navigate: navigateDocsLocale,
  sync: syncLegacyDocsGlobals
};
publishDocsLocale(getCurrentDocsLocale(), 'initial');
syncLegacyDocsGlobals(getCurrentDocsLocale());
ensureDocsLanguageSelectBinding();
