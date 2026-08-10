import {
  createRmtAppRuntime,
  createRmtSearchRuntime
} from '../../xtendrmt/rmt-app-runtime.compat.js';
import { createRmtDomDescriptorRenderer } from '../../xtendrmt/rmt-dom-descriptor-renderer.js';
import { createRmtBrowserScheduler } from '../../xtendrmt/rmt-browser-scheduler.js';
import '../../components/xutils.js';

if (window.xtendDocsRmtBootPromise) {
  await window.xtendDocsRmtBootPromise;
}

const DOCS_SHELL_RUNTIME_SCHEMA = 'xtend.docs.shell-runtime.v1';
const SEARCH_SOURCE_PREFIX = 'searchSource:docs.search.';
const SEARCH_WEIGHTS = Object.freeze({
  title: 1,
  aliases: 0.94,
  keywords: 0.88,
  headings: 0.76,
  summary: 0.64,
  body: 0.38
});
const disposers = [];
const renderer = createRmtDomDescriptorRenderer({ documentTarget: document });
const browserScheduler = createRmtBrowserScheduler({ windowTarget: window });
const XUtils = window.XUtils;
const bootStartedAt = performance.now();
const fabric = window.XTendFabric && typeof window.XTendFabric.createXtendFabric === 'function'
  ? window.XTendFabric.createXtendFabric({
      idPrefix: 'xtend.docs',
      window,
      performance,
      xstate: window.xstate,
      api: window.XTend
    })
  : null;
let searchScheduleDisposer = null;
let currentQuery = '';
let renderedSearchSignature = '';
let pendingSearchActivationSource = '';
let registeredRouteLocale = '';
let themeConfigured = false;
let themeReadyListenersBound = false;

function text(value) {
  return { type: 'text', text: String(value == null ? '' : value) };
}

function element(tag, attributes = {}, children = [], type = 'element') {
  return { type, tag, attributes, children };
}

function component(tag, attributes = {}, children = []) {
  return element(tag, attributes, children, 'component');
}

function locale() {
  return window.xtendDocsCurrentLocale === 'en' ? 'en' : 'de';
}

function localized(record, activeLocale = locale()) {
  const labels = record && record.labels || {};
  return labels[activeLocale] || labels.de || labels.en || record && (record.label || record.id) || '';
}

function currentSlug() {
  const parts = location.pathname.split('/').filter(Boolean);
  const docsIndex = parts.lastIndexOf('docs');
  const routeParts = docsIndex >= 0 ? parts.slice(docsIndex + 1) : parts;
  const offset = routeParts[0] === 'de' || routeParts[0] === 'en' ? 1 : 0;
  const requested = routeParts.slice(offset).join('/') || window.xtendInitialDocsSlug || 'readme';
  return window.xtendDocsSlugAliases && window.xtendDocsSlugAliases[requested] || requested;
}

function pathFor(slug, activeLocale = locale()) {
  const base = String(window.xtendDocsI18n && window.xtendDocsI18n.basePath || '/docs').replace(/\/$/, '');
  return `${base}/${activeLocale}/${slug}`;
}

function menuConfig() {
  return Array.isArray(window.xtendMenuConfig) ? window.xtendMenuConfig : [];
}

function navigationConfig() {
  const value = window.xtendDocsNavigation;
  return value && value.schema === 'xtend.docs.navigation.v1' ? value : { trunks: [] };
}

function sortEntries(entries) {
  return entries.slice().sort((left, right) => {
    const rootDelta = Number(!right.parent) - Number(!left.parent);
    if (rootDelta) return rootDelta;
    return Number(right.rank || 0) - Number(left.rank || 0) || localized(left).localeCompare(localized(right), locale());
  });
}

function iconFor(entry) {
  if (entry && entry.icon) return entry.icon;
  const slug = String(entry && entry.slug || '');
  if (slug.includes('security') || slug.includes('trusted-dom') || slug.includes('supply-chain')) return 'shield-check';
  if (slug.includes('performance') || slug.includes('hydration')) return 'gauge';
  if (slug.includes('animation')) return 'sparkles';
  if (slug.startsWith('components-')) return 'component';
  if (slug.includes('rmt') || slug.includes('router')) return 'route';
  return 'file-text';
}

function menuLinkDescriptor(entry, activeSlug) {
  const active = entry.slug === activeSlug;
  return element('a', {
    'is-x-link': 'true',
    'data-xtend-component': 'x-link',
    navigation: 'auto',
    class: 'docs-menu-link',
    href: pathFor(entry.slug),
    role: 'menuitem',
    'data-docs-menu-link': '',
    'data-doc-id': entry.id,
    'data-doc-rank': String(entry.rank || 0),
    'data-doc-tier': entry.tier || 'basic',
    'data-rmt-action': 'docs.route.navigate',
    'aria-current': active ? 'page' : null,
    active: active ? '' : null
  }, [
    component('x-icon', {
      class: 'docs-menu-link-icon',
      name: iconFor(entry),
      pack: 'lucide',
      decorative: '',
      size: '0.95rem'
    }),
    element('span', { class: 'docs-menu-link-label' }, [text(localized(entry))])
  ]);
}

function syncNavigationLinkState(link, active) {
  link.toggleAttribute('active', active);
  link.classList.toggle('active', active);
  if (active) link.setAttribute('aria-current', 'page');
  else link.removeAttribute('aria-current');
}

function syncNavigationState(root, entries, activeEntry, activeTrunk, activeSection) {
  const expectedEntries = sortEntries(entries.filter((entry) => entry.trunk === activeTrunk));
  const existingLinks = XUtils.findAll('[data-docs-menu-link]', root);
  const expectedIds = new Set(expectedEntries.map((entry) => entry.id));
  const existingIds = new Set(existingLinks.map((link) => link.getAttribute('data-doc-id')));
  const canAdopt = root.getAttribute('data-docs-active-trunk-content') === activeTrunk
    && existingLinks.length === expectedEntries.length
    && existingIds.size === expectedIds.size
    && expectedEntries.every((entry) => existingIds.has(entry.id));
  if (!canAdopt) return false;

  existingLinks.forEach((link) => {
    syncNavigationLinkState(link, link.getAttribute('data-doc-id') === activeEntry.id);
  });
  XUtils.findAll('[data-docs-menu-section]', root).forEach((section) => {
    section.toggleAttribute('open', section.getAttribute('data-docs-menu-section') === activeSection);
  });
  XUtils.findAll('[data-docs-trunk-link]').forEach((link) => {
    syncNavigationLinkState(link, link.getAttribute('data-docs-trunk-link') === activeTrunk);
  });
  root.setAttribute('data-docs-navigation-activation', 'adopted');
  return true;
}

function renderNavigation(activeSlug = currentSlug(), options = {}) {
  const entries = menuConfig();
  const activeEntry = entries.find((entry) => entry.slug === activeSlug) || entries.find((entry) => entry.slug === 'readme');
  if (!activeEntry) return false;
  const activeTrunk = activeEntry.trunk || 'start';
  const activeSection = activeEntry.section || 'orientation';
  const root = XUtils.find('[data-docs-active-trunk-content]');
  if (!root) return false;
  const trunk = navigationConfig().trunks.find((entry) => entry.id === activeTrunk);
  if (!trunk) return false;
  if (!options.force && syncNavigationState(root, entries, activeEntry, activeTrunk, activeSection)) return true;

  const sections = (trunk.sections || []).map((section) => {
    const sectionEntries = sortEntries(entries.filter((entry) => entry.trunk === activeTrunk && entry.section === section.id));
    if (sectionEntries.length === 0) return null;
    const sectionLabel = localized(section);
    return component('x-summary', {
      class: 'docs-menu-section',
      'data-docs-menu-section': section.id,
      open: section.id === activeSection ? '' : null
    }, [
      element('span', { slot: 'title', class: 'docs-menu-section-title' }, [text(sectionLabel)]),
      component('x-menu', {
        class: 'docs-menu-section-links',
        orientation: 'vertical',
        'aria-label': sectionLabel
      }, sectionEntries.map((entry) => menuLinkDescriptor(entry, activeSlug)))
    ]);
  }).filter(Boolean);

  const splitIndex = Math.ceil(sections.length / 2);
  const sectionColumns = [sections.slice(0, splitIndex), sections.slice(splitIndex)];
  sections.forEach((section, index) => {
    section.attributes['data-docs-menu-order'] = String(index);
  });
  const columns = sectionColumns
    .filter((column) => column.length > 0)
    .map((column, index) => element('div', {
      class: 'docs-active-trunk-column',
      'data-docs-menu-column': String(index)
    }, column));

  renderer.render(root, { type: 'fragment', children: columns }, {
    source: { kind: 'docs-navigation', id: activeTrunk }
  });
  root.setAttribute('data-docs-active-trunk-content', activeTrunk);
  root.setAttribute('data-docs-navigation-activation', 'rendered');
  const shell = XUtils.find('[data-docs-menu-shell]');
  if (shell) shell.setAttribute('data-docs-active-trunk', activeTrunk);
  XUtils.findAll('[data-docs-trunk-link]').forEach((link) => {
    const active = link.getAttribute('data-docs-trunk-link') === activeTrunk;
    syncNavigationLinkState(link, active);
  });
  return true;
}

function routeRecord(entry, activeLocale) {
  const title = localized(entry, activeLocale);
  return {
    id: entry.id || `docs.${String(entry.slug || '').replace(/-/g, '.')}`,
    path: pathFor(entry.slug, activeLocale),
    component: 'xtend-doc-page',
    import: '/docs/utils/pageloader.js',
    title,
    documentTitle: activeLocale === 'en' ? `${title} | XTend Documentation` : `${title} | XTend Dokumentation`,
    skeleton: 'article',
    skeletonProfile: 'docs-article',
    skeletonLines: 10,
    skeletonMinHeight: '26rem',
    hydration: { schedule: 'docs.page.hydrate' },
    router: 'xtend.xrouter',
    template: 'docs.page.shell',
    schedule: 'docs.route.render',
    metadata: { slug: entry.slug, trunk: entry.trunk, section: entry.section }
  };
}

function registerRouterRoutes(activeLocale = locale()) {
  const router = XUtils.find('x-router');
  if (!router || typeof router.registerRoutes !== 'function') return false;
  const documentationTitle = activeLocale === 'en' ? 'XTend Documentation' : 'XTend Dokumentation';
  router.setAttribute('document-title-template', `{{title}} | ${documentationTitle}`);
  router.setAttribute('default-title', documentationTitle);
  router.setAttribute('skeleton-label', activeLocale === 'en' ? 'Documentation is loading' : 'Dokumentation wird geladen');
  const records = menuConfig().map((entry) => routeRecord(entry, activeLocale));
  records.push({
    id: 'docs.notFound',
    path: '*',
    component: 'xtend-doc-page',
    import: '/docs/utils/pageloader.js',
    title: activeLocale === 'en' ? 'Page not found' : 'Seite nicht gefunden',
    documentTitle: activeLocale === 'en' ? 'Page not found | XTend Documentation' : 'Seite nicht gefunden | XTend Dokumentation',
    skeleton: 'article',
    skeletonProfile: 'docs-article',
    hydration: { schedule: 'docs.page.hydrate' }
  });
  router.registerRoutes(records, {
    replace: true,
    render: false,
    adapterId: 'xtend.docs.app-runtime.routes',
    source: 'docs-navigation-contract'
  });
  registeredRouteLocale = activeLocale;
  return true;
}

function ensureRouterRoutes() {
  return ensureRouterRoutesFor(locale());
}

function ensureRouterRoutesFor(activeLocale) {
  const normalized = activeLocale === 'en' ? 'en' : 'de';
  return registeredRouteLocale === normalized || registerRouterRoutes(normalized);
}

async function resolveSearchResource(resourceId) {
  const match = String(resourceId || '').match(/docs\.search\.(compact|fulltext)\.(de|en)$/);
  if (!match) return [];
  const response = await fetch(`/docs/generated/search/${match[2]}.${match[1]}.json`, {
    credentials: 'same-origin',
    cache: 'force-cache'
  });
  if (!response.ok) throw new Error(`Search index request failed with ${response.status}.`);
  const payload = await response.json();
  const expectedSchema = match[1] === 'compact' ? 'xtend.docs.search-index.v1' : 'xtend.docs.search-fulltext-index.v1';
  if (!payload || payload.schema !== expectedSchema || payload.locale !== match[2] || !Array.isArray(payload.entries)) {
    throw new Error('Search index contract mismatch.');
  }
  return payload.entries;
}

const searchRuntime = createRmtSearchRuntime({
  windowTarget: window,
  searchSources: ['de', 'en'].map((activeLocale) => ({
    id: `${SEARCH_SOURCE_PREFIX}${activeLocale}`,
    resource: `docs.search.compact.${activeLocale}`,
    fallbackResource: `docs.search.fulltext.${activeLocale}`,
    resultLimit: 8,
    minQueryLength: 2,
    fallbackThreshold: 0.6,
    fieldWeights: SEARCH_WEIGHTS,
    localePolicy: `${activeLocale}-with-technical-aliases`
  })),
  resourceResolver: resolveSearchResource
});

const appRuntime = createRmtAppRuntime({
  initialState: {
    shell: { status: 'hydrating', locale: locale(), slug: currentSlug() },
    search: { query: '', status: 'idle', resultCount: 0 }
  },
  fabric,
  actionRuntime: {
    async runAction(command, payload) {
      return { schema: 'xtend.docs.shell-action-result.v1', command, payload, status: 'handled' };
    }
  }
});

function createFabricSnapshot(reason = 'dev-api-read', metadata = {}) {
  if (!fabric || typeof fabric.createTelemetrySnapshot !== 'function') {
    return {
      schema: 'xtend.fabric.telemetry-snapshot.v1',
      id: 'xtend.docs.fabric.degraded',
      status: 'degraded',
      lanes: {},
      totals: { fiberCount: 0, completedCount: 0, failedCount: 0, budgetMissCount: 0 },
      diagnosticCount: appRuntime.listDiagnostics().length,
      metadata: { reason, ...metadata }
    };
  }
  const snapshot = fabric.createTelemetrySnapshot({
    source: 'xtend.docs.app-runtime',
    correlationId: currentSlug(),
    appRuntime,
    metadata: {
      reason,
      locale: locale(),
      slug: currentSlug(),
      ...metadata
    }
  });
  window.xtendDocsFabricLastSnapshot = snapshot;
  return snapshot;
}

window.xtendDocsFabric = Object.freeze({
  schema: 'xtend.docs.app-runtime-fabric.v1',
  fabric,
  snapshot: createFabricSnapshot,
  status() {
    return { schema: 'xtend.docs.app-runtime-fabric-status.v1', status: fabric ? 'ready' : 'degraded' };
  }
});
document.documentElement.setAttribute('data-xtend-docs-fabric', fabric ? 'app-runtime' : 'degraded');

function setSearchStatus(message, busy = false) {
  const status = XUtils.find('#docs-search-status');
  if (!status) return;
  status.setAttribute('message', message || '');
  status.toggleAttribute('busy', busy);
  status.toggleAttribute('hidden', !message);
}

function showSearchResults(results, query) {
  const root = XUtils.find('#search-results');
  const popover = XUtils.find('#docs-search-popover');
  if (!root || !popover) return;
  const activeLocale = locale();
  const signature = results.length > 0
    ? results.map((result) => `${result.slug}:${Math.round(result.score * 100)}`).join('|')
    : `empty:${query}`;
  const children = results.length > 0
    ? [component('x-menu', {
        class: 'docs-search-result-menu',
        orientation: 'vertical',
        'aria-label': activeLocale === 'en' ? 'Search results' : 'Suchergebnisse'
      }, results.map((result, index) => element('a', {
        class: 'docs-search-result',
        href: pathFor(result.slug, activeLocale),
        'is-x-link': 'true',
        'data-xtend-component': 'x-link',
        navigation: 'auto',
        role: 'option',
        'data-docs-search-result': result.slug,
        'data-docs-search-rank': String(index + 1),
        'data-docs-search-score': String(result.score),
        'data-rmt-action': 'docs.route.navigate'
      }, [
        element('span', { class: 'docs-search-result-title' }, [text(result.title)]),
        element('span', { class: 'docs-search-result-score' }, [text(`${Math.round(result.score * 100)}%`)])
      ])))]
    : [component('x-status', {
        class: 'docs-search-empty',
        type: 'info',
        message: activeLocale === 'en' ? `No results for "${query}".` : `Keine Treffer für „${query}“.`
      })];
  if (signature !== renderedSearchSignature) {
    renderer.render(root, { type: 'fragment', children }, {
      source: { kind: 'docs-search', id: query }
    });
    renderedSearchSignature = signature;
  }
  if (typeof popover.show === 'function') popover.show({ source: 'docs-search-runtime' });
  else popover.setAttribute('open', '');
}

function hideSearchResults() {
  const popover = XUtils.find('#docs-search-popover');
  if (!popover) return;
  if (typeof popover.hide === 'function') popover.hide({ source: 'docs-search-runtime' });
  else popover.removeAttribute('open');
}

async function runSearch(queryValue) {
  const query = String(queryValue || '').trim();
  currentQuery = query;
  if (query.length < 2) {
    hideSearchResults();
    setSearchStatus('');
    return;
  }
  const startedAt = performance.now();
  setSearchStatus(locale() === 'en' ? 'Searching' : 'Suche läuft', true);
  await appRuntime.command('docs.search.submit', { query, locale: locale() }, {
    lane: 'user-blocking',
    sourceId: 'docs.search.input',
    event: 'input-changed'
  });
  try {
    const response = await searchRuntime.query(`${SEARCH_SOURCE_PREFIX}${locale()}`, query);
    if (query !== currentQuery || response.superseded) return;
    const durationMs = performance.now() - startedAt;
    showSearchResults(response.results, query);
    setSearchStatus('');
    window.xtendDocsDevApi && window.xtendDocsDevApi.update({
      search: {
        query,
        durationMs,
        resultCount: response.results.length,
        usedFulltext: response.usedFulltext,
        sourceId: response.sourceId
      }
    });
  } catch (error) {
    setSearchStatus(locale() === 'en' ? 'Search is unavailable.' : 'Die Suche ist nicht verfügbar.');
    window.xtendDocsDevApi && window.xtendDocsDevApi.update({
      diagnostics: [{
        code: 'xtend.docs.search.failed',
        severity: 'warning',
        message: error && error.message ? error.message : String(error)
      }]
    });
  }
}

function scheduleSearch(query) {
  currentQuery = String(query || '').trim();
  if (searchScheduleDisposer) searchScheduleDisposer();
  searchScheduleDisposer = browserScheduler.scheduleEndpoint('docs.search.query', window.location.pathname, () => {
    searchScheduleDisposer = null;
    runSearch(query);
  }, { kind: 'delay', delayMs: 80 });
}

function readInputValue(event, input) {
  if (event && event.detail && typeof event.detail.value !== 'undefined') return event.detail.value;
  return input && typeof input.value !== 'undefined' ? input.value : '';
}

function highlightedSearchResult(results) {
  const entries = XUtils.findAll('[data-docs-search-result]', results);
  return entries.find((entry) => entry.matches(':focus-within'))
    || entries.find((entry) => entry.getAttribute('aria-current') === 'page' || entry.classList.contains('active'))
    || entries.find((entry) => entry.tabIndex === 0)
    || entries[0]
    || null;
}

function activateHighlightedSearchResult(results) {
  const link = highlightedSearchResult(results);
  if (!link || typeof link.click !== 'function') return false;
  ensureRouterRoutes();
  pendingSearchActivationSource = 'keyboard';
  try {
    link.click();
  } finally {
    pendingSearchActivationSource = '';
  }
  return true;
}

function bindSearch() {
  const input = XUtils.find('#search-input');
  const results = XUtils.find('#search-results');
  if (!input || !results) return;
  disposers.push(XUtils.on(input, 'input-changed', (event) => scheduleSearch(readInputValue(event, input))));
  disposers.push(XUtils.on(input, 'focusin', () => {
    searchRuntime.query(`${SEARCH_SOURCE_PREFIX}${locale()}`, '', { minQueryLength: 2 }).catch(() => {});
  }));
  disposers.push(XUtils.on(input, 'keydown', (event) => {
    if (event.key === 'Escape') {
      hideSearchResults();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const firstResult = XUtils.find('[data-docs-search-result]', results);
      if (firstResult && typeof firstResult.focus === 'function') firstResult.focus();
      return;
    }
    if (event.key === 'Enter' && activateHighlightedSearchResult(results)) {
      event.preventDefault();
    }
  }));
  disposers.push(XUtils.on(results, 'menu-item-clicked', (event) => {
    ensureRouterRoutes();
    const detail = event.detail || {};
    const links = XUtils.findAll('[data-docs-search-result]', results);
    const link = Number.isInteger(detail.index) ? links[detail.index] : null;
    appRuntime.command('docs.route.navigate', {
      slug: link && link.getAttribute('data-docs-search-result'),
      path: detail.href || link && link.getAttribute('href'),
      inputSource: pendingSearchActivationSource || detail.source || 'menu'
    }, { lane: 'transition', sourceId: 'docs.search.results', event: 'menu-item-clicked' });
    hideSearchResults();
  }));
}

function registerSkeletonProfiles() {
  const loader = window.XTendSkeletonLoader;
  if (!loader || typeof loader.registerProfile !== 'function') return false;
  loader.registerProfile('docs-article', {
    variant: 'article',
    minHeight: '24rem',
    gap: '0.72rem',
    items: [
      { kind: 'line', width: '46%', height: '1.55rem' },
      { kind: 'line', width: '96%', repeat: 3 },
      { kind: 'line', width: '74%' },
      { kind: 'block', width: '100%', height: '8rem', radius: '8px' },
      { kind: 'line', width: '91%', repeat: 3 }
    ],
    responsive: {
      breakpoint: '700px',
      compact: { minHeight: '30rem', gap: '0.65rem' },
      wide: { minHeight: '24rem', gap: '0.72rem' }
    }
  });
  loader.registerProfile('docs-navigation', {
    variant: 'list',
    minHeight: '18rem',
    items: [{ kind: 'line', width: '88%', height: '2.25rem', radius: '6px', repeat: 6 }],
    responsive: {
      breakpoint: '700px',
      compact: { minHeight: '14rem' },
      wide: { minHeight: '18rem' }
    }
  });
  loader.registerProfile('docs-search', {
    variant: 'list',
    minHeight: '10rem',
    items: [{ kind: 'line', width: '94%', height: '2.4rem', radius: '6px', repeat: 4 }],
    responsive: {
      breakpoint: '700px',
      compact: { minHeight: '12rem' },
      wide: { minHeight: '10rem' }
    }
  });
  return true;
}

function bindDeferredThemeConfiguration() {
  if (themeReadyListenersBound || themeConfigured) return;
  themeReadyListenersBound = true;
  const retry = () => configureTheme();
  disposers.push(XUtils.on(window, 'xtend-api-ready', retry));
  disposers.push(XUtils.on(document, 'theme-api-ready', retry));
}

function configureTheme() {
  if (themeConfigured) return true;
  const theme = window.XTend && window.XTend.theme;
  const button = XUtils.find('#theme-toggle');
  const label = XUtils.find('#theme-toggle-label');
  const icon = XUtils.find('#theme-toggle-icon');
  if (!theme || !button) {
    bindDeferredThemeConfiguration();
    return false;
  }
  themeConfigured = true;
  const light = {
    '--body-bg': '#f9f9f9', '--background-color': '#f9f9f9', '--primary-color': '#0e4e81',
    '--text-color': '#222', '--muted-text-color': '#5f6f82', '--surface-muted': '#edf2f7',
    '--border-color': 'rgba(15, 23, 42, 0.14)', '--xtend-surface': '#ffffff',
    '--xtend-surface-muted': '#f7fafc', '--xtend-surface-control': '#f7fafc', '--xtend-text': '#1f2937',
    '--xtend-text-primary': '#1f2937', '--xtend-text-muted': '#5f6f82',
    '--xtend-border-color': 'rgba(15, 23, 42, 0.14)', '--xtend-border-subtle': 'rgba(15, 23, 42, 0.14)',
    '--xtend-overlay-bg': 'rgba(15, 23, 42, 0.52)', '--docs-control-surface': '#f7fafc',
    '--docs-control-text': '#1f2937', '--docs-control-placeholder': '#5f6f82',
    '--docs-control-border': 'rgba(15, 23, 42, 0.14)', '--docs-header-bg': '#ffffff',
    '--docs-header-menu-bg': '#ffffff', '--docs-header-fg': '#1f2937', '--docs-sidebar-bg': '#ffffff',
    '--docs-sidebar-link-bg': '#f7fafc', '--docs-sidebar-link-hover-bg': '#e7f0f7',
    '--docs-code-bg': '#10131a', '--x-code-bg': '#10131a', '--x-code-text': '#f8fafc',
    '--x-code-border': 'rgba(15, 23, 42, 0.18)', '--footer-bg': '#f9f9f9', '--section-bg': '#fff',
    '--active-tab-color': '#0e4e81', '--tab-bg': '#f5f5f5', '--tab-text': '#222', '--input-bg': '#fff',
    '--input-bg-dark': '#17171b', '--input-color-dark': '#f4f4f5', '--input-placeholder-color-dark': '#b8c4d4',
    '--form-background': 'transparent', '--docs-hero-bg-light': 'linear-gradient(135deg, #f8fbff 0%, #e7f0f7 100%)',
    '--docs-hero-text-light': '#162033'
  };
  Object.entries(light).forEach(([name, value]) => theme.set(name, value));
  theme.registerTheme('dark', {
    '--body-bg': '#050506', '--background-color': '#050506', '--primary-color': '#8fd3ff',
    '--text-color': '#f4f4f5', '--muted-text-color': '#a1a1aa', '--surface-muted': '#111113',
    '--border-color': 'rgba(255, 255, 255, 0.13)', '--xtend-surface': '#0b0b0d',
    '--xtend-surface-muted': '#111113', '--xtend-surface-control': '#17171b', '--xtend-text': '#f4f4f5',
    '--xtend-text-primary': '#f4f4f5', '--xtend-text-muted': '#a1a1aa',
    '--xtend-border-color': 'rgba(255, 255, 255, 0.13)', '--xtend-border-subtle': 'rgba(255, 255, 255, 0.13)',
    '--xtend-overlay-bg': 'rgba(0, 0, 0, 0.72)', '--docs-control-surface': '#17171b',
    '--docs-control-text': '#f4f4f5', '--docs-control-placeholder': '#a1a1aa',
    '--docs-control-border': 'rgba(255, 255, 255, 0.13)', '--docs-header-bg': '#050506',
    '--docs-header-menu-bg': '#09090b', '--docs-header-fg': '#f4f4f5', '--docs-sidebar-bg': '#0d0d10',
    '--docs-sidebar-link-bg': '#111114', '--docs-sidebar-link-hover-bg': '#17171b', '--docs-code-bg': '#050506',
    '--x-code-bg': '#050506', '--x-code-text': '#f4f4f5', '--x-code-border': 'rgba(255, 255, 255, 0.16)',
    '--footer-bg': '#050506', '--section-bg': '#0b0b0d', '--active-tab-color': '#8fd3ff', '--tab-bg': '#111114',
    '--tab-text': '#f4f4f5', '--input-bg': '#17171b', '--input-bg-dark': '#0f0f12',
    '--input-color-dark': '#f4f4f5', '--input-placeholder-color-dark': '#a1a1aa', '--form-background': 'transparent',
    '--docs-hero-bg-dark': '#050506', '--docs-hero-text-dark': '#f8fafc'
  });

  const sync = () => {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    const message = locale() === 'en'
      ? (dark ? 'Enable light mode' : 'Enable dark mode')
      : (dark ? 'Hellmodus aktivieren' : 'Dunkelmodus aktivieren');
    if (label) label.textContent = message;
    if (button) {
      button.setAttribute('aria-label', message);
      button.setAttribute('title', message);
      button.setAttribute('aria-pressed', dark ? 'true' : 'false');
    }
    if (icon) icon.setAttribute('name', dark ? 'sun' : 'moon');
  };
  if (button) disposers.push(XUtils.on(button, 'button-interaction', () => theme.toggleDarkMode()));
  disposers.push(XUtils.on(document, 'theme-changed', sync));
  disposers.push(XUtils.on(document, 'theme-initialized', sync));
  disposers.push(XUtils.on(window, 'xtend-docs-locale-changed', sync));
  if (typeof theme.subscribe === 'function') {
    const unsubscribe = theme.subscribe(sync);
    if (typeof unsubscribe === 'function') disposers.push(unsubscribe);
  }
  sync();
  return true;
}

function checkViewportOverflow() {
  const root = document.documentElement;
  const body = document.body;
  const clientWidth = root.clientWidth || window.innerWidth;
  const scrollWidth = Math.max(root.scrollWidth || 0, body && body.scrollWidth || 0);
  const overflowX = Math.max(0, scrollWidth - clientWidth);
  const snapshot = {
    schema: 'xtend.docs.viewport-overflow.v1',
    viewport: window.matchMedia('(max-width: 700px)').matches ? 'mobile' : 'wide',
    clientWidth,
    scrollWidth,
    overflowX,
    viewportSafe: overflowX <= 1
  };
  window.xtendDocsViewportOverflow = snapshot;
  root.toggleAttribute('data-xtend-viewport-overflow', !snapshot.viewportSafe);
  return snapshot;
}

function schedulePrismHighlight(root = document) {
  const run = () => {
    XUtils.findAll('x-code', root).forEach((node) => {
      if (typeof node.hydrate === 'function') node.hydrate();
    });
    if (!window.Prism) return;
    if (window.XTendRmtPrism && typeof window.XTendRmtPrism.register === 'function') window.XTendRmtPrism.register(window.Prism);
    if (typeof window.Prism.highlightAllUnder === 'function') window.Prism.highlightAllUnder(root);
  };
  disposers.push(browserScheduler.scheduleEndpoint('docs.syntax.highlight', currentSlug(), run, { kind: 'idle', timeout: 700 }));
}

function bindShellEvents() {
  disposers.push(XUtils.on(window, 'xtend-docs-locale-transition', (event) => {
    const detail = event.detail || {};
    if (detail.status !== 'loading' || !detail.targetLocale) return;
    ensureRouterRoutesFor(detail.targetLocale);
  }));
  disposers.push(XUtils.on(window, 'xtend-docs-route-transition', (event) => {
    const detail = event.detail || {};
    renderNavigation(detail.slug || currentSlug());
    appRuntime.command('docs.route.transition', detail, {
      lane: 'transition', sourceId: 'docs.router', event: 'xtend-docs-route-transition'
    });
    window.xtendDocsDevApi && window.xtendDocsDevApi.update({ route: detail });
  }));
  disposers.push(XUtils.on(window, 'xtend-docs-content-ready', (event) => {
    const detail = event.detail || {};
    schedulePrismHighlight(detail.root || document);
    disposers.push(browserScheduler.afterPaint(checkViewportOverflow));
    ensureRouterRoutes();
    appRuntime.command('docs.content.ready', detail, {
      lane: 'visible', sourceId: 'docs.page', event: 'xtend-docs-content-ready'
    });
    if (detail.slug === 'learn-rmt-playground' || detail.slug === 'rmt-animation-engine') {
      appRuntime.command('docs.experience.hydrate', {
        slug: detail.slug,
        lifecycle: 'insular-idle',
        schedule: detail.slug === 'rmt-animation-engine' ? 'docs.animation-engine-demo.hydrate' : 'docs.rmt-playground.hydrate'
      }, { lane: 'idle', sourceId: detail.slug, event: 'xtend-docs-content-ready' });
    }
    window.xtendDocsDevApi && window.xtendDocsDevApi.update({
      content: {
        slug: detail.slug,
        locale: detail.locale,
        durationMs: Number(detail.contentCommitDurationMs || 0),
        schedule: detail.schedule
      }
    });
  }));
  disposers.push(XUtils.on(window, 'xtend-docs-locale-changed', () => {
    registeredRouteLocale = '';
    renderedSearchSignature = '';
    ensureRouterRoutes();
    renderNavigation(currentSlug(), { force: true });
    currentQuery = '';
    hideSearchResults();
  }));
  disposers.push(XUtils.on(window, 'resize', () => disposers.push(browserScheduler.afterPaint(checkViewportOverflow)), { passive: true }));
  disposers.push(XUtils.on(window, 'pagehide', dispose));
}

function scheduleRouteRegistration() {
  const nav = XUtils.find('[data-docs-menu-shell]');
  if (nav) {
    disposers.push(XUtils.on(nav, 'pointerdown', ensureRouterRoutes, { passive: true }));
    disposers.push(XUtils.on(nav, 'focusin', ensureRouterRoutes));
  }
  const run = () => ensureRouterRoutes();
  disposers.push(browserScheduler.scheduleEndpoint('docs.routes.register', 'docs.shell', run, { kind: 'idle', timeout: 1200 }));
}

function scheduleCompactIndex() {
  const run = () => searchRuntime.query(`${SEARCH_SOURCE_PREFIX}${locale()}`, '', { minQueryLength: 2 }).catch(() => {});
  disposers.push(browserScheduler.scheduleEndpoint('docs.search.prewarm', 'docs.shell', run, { kind: 'idle', timeout: 1600 }));
}

async function recommendRelated(input = {}) {
  const activeLocale = input.locale === 'en' ? 'en' : 'de';
  const slug = String(input.slug || currentSlug());
  const startedAt = performance.now();
  const response = await searchRuntime.recommend(`${SEARCH_SOURCE_PREFIX}${activeLocale}`, slug, {
    resultLimit: Math.max(3, Math.min(21, Number(input.resultLimit || 14))),
    excludeSlugs: Array.isArray(input.excludeSlugs) ? input.excludeSlugs : [],
    minScore: Number.isFinite(Number(input.minScore)) ? Number(input.minScore) : 0.3,
    fieldWeights: SEARCH_WEIGHTS,
    schedule(resolve) {
      browserScheduler.scheduleEndpoint('docs.related.rank', slug, resolve, { kind: 'idle', timeout: 120 });
    }
  });
  const completedAt = performance.now();
  const snapshot = Object.freeze({
    schema: response.schema,
    slug,
    locale: activeLocale,
    startedAt,
    completedAt,
    durationMs: completedAt - startedAt,
    rankingStartedAt: response.rankingStartedAt,
    rankingCompletedAt: response.rankingCompletedAt,
    rankingDurationMs: response.rankingDurationMs,
    resultCount: response.results.length,
    source: response.status === 'ready' ? 'compact-search-index' : 'navigation-fallback',
    fallback: response.status !== 'ready',
    generation: response.generation,
    superseded: response.superseded,
    results: Object.freeze(response.results.map((entry) => Object.freeze({
      slug: entry.slug,
      label: entry.title,
      score: entry.score,
      source: 'search-recommendation',
      signals: Object.freeze((entry.signals || []).map((signal) => Object.freeze({ ...signal }))),
      navigationSignals: Object.freeze([...(entry.navigationSignals || [])])
    })))
  });
  window.xtendDocsLastRecommendations = snapshot;
  window.xtendDocsDevApi && window.xtendDocsDevApi.update({
    recommendations: {
      slug,
      locale: activeLocale,
      durationMs: snapshot.durationMs,
      resultCount: snapshot.resultCount,
      source: snapshot.source,
      scores: snapshot.results.map((entry) => entry.score),
      fallback: snapshot.fallback
    }
  });
  return snapshot;
}

function dispose() {
  if (searchScheduleDisposer) searchScheduleDisposer();
  searchRuntime.dispose();
  disposers.splice(0).forEach((disposer) => {
    try { disposer(); } catch (_) {}
  });
  if (fabric && typeof fabric.dispose === 'function') fabric.dispose();
  browserScheduler.dispose();
}

registerSkeletonProfiles();
renderNavigation(currentSlug());
bindSearch();
configureTheme();
bindShellEvents();
scheduleRouteRegistration();
scheduleCompactIndex();
schedulePrismHighlight(document);
disposers.push(browserScheduler.afterPaint(checkViewportOverflow));

const hydrationMs = performance.now() - bootStartedAt;
window.xtendDocsDevApi && window.xtendDocsDevApi.update({
  status: 'ready',
  hydratedAt: performance.now(),
  hydrationMs
});

window.xtendDocsShellRuntime = Object.freeze({
  schema: DOCS_SHELL_RUNTIME_SCHEMA,
  appRuntime,
  fabric,
  searchRuntime,
  recommendRelated,
  createFabricSnapshot,
  renderer,
  renderNavigation,
  prepareLocaleRoutes(activeLocale) {
    return ensureRouterRoutesFor(activeLocale);
  },
  dispose,
  snapshot() {
    return {
      schema: DOCS_SHELL_RUNTIME_SCHEMA,
      status: 'ready',
      locale: locale(),
      slug: currentSlug(),
      search: searchRuntime.snapshot(),
      commandCount: appRuntime.listCommands().length,
      registeredRouteLocale,
      diagnostics: appRuntime.listDiagnostics()
    };
  }
});

window.dispatchEvent(new CustomEvent('xtend-docs-shell-runtime-ready', {
  detail: {
    schema: DOCS_SHELL_RUNTIME_SCHEMA,
    status: 'ready'
  }
}));

export { DOCS_SHELL_RUNTIME_SCHEMA, appRuntime, fabric, searchRuntime, createFabricSnapshot, renderNavigation };
