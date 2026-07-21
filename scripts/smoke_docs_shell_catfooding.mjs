#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceRootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rootDir = path.resolve(process.env.XTEND_DOCS_SMOKE_ROOT || sourceRootDir);
const captureBaseline = process.argv.includes('--capture-baseline');
const evidenceDir = path.join(sourceRootDir, '.xtend-test-results', captureBaseline ? 'docs-shell-baseline-capture' : 'docs-shell-catfooding');
const baselinePath = path.join(sourceRootDir, 'tests', 'docs', 'fixtures', 'docs-shell-catfooding-performance-baseline.json');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash('sha256').update(String(value || ''), 'utf8').digest('hex');
}

async function assertRawDocsRouteStatuses(baseUrl) {
  const routes = ['de', 'en'].flatMap((locale) => [
    `/docs/${locale}/readme`,
    `/docs/${locale}/manifest`,
    `/docs/${locale}/rmt-reference-actions-events`,
    `/docs/${locale}/xtend-maraca`
  ]);
  const results = await Promise.all(routes.map(async (route) => {
    const response = await fetch(`${baseUrl}${route}`, { redirect: 'manual' });
    await response.arrayBuffer();
    return { route, status: response.status };
  }));
  results.forEach(({ route, status }) => {
    assert(status === 200, `Raw Docs route ${route} returned HTTP ${status} instead of 200.`);
  });
  return results;
}

function assertSingleCurrentArticle(snapshot, scenarioId) {
  const markedLinks = (snapshot.articleNavigation || []).filter((link) => link.marked);
  assert(markedLinks.length === 1, `${scenarioId}: expected exactly one current article link (${JSON.stringify(snapshot.articleNavigation)}).`);
  const currentLink = markedLinks[0];
  assert(currentLink.path === snapshot.currentPath, `${scenarioId}: current article marker does not match the route (${JSON.stringify({ currentPath: snapshot.currentPath, currentLink })}).`);
  assert(currentLink.section, `${scenarioId}: current article marker is not owned by a navigation section (${JSON.stringify(currentLink)}).`);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function commandExists(command) {
  return spawnSync(command, ['--version'], { stdio: 'ignore' }).status === 0;
}

function findCommand(candidates) {
  return candidates.find(commandExists) || null;
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
  });
}

function stopProcess(child) {
  if (!child || !child.pid) return;
  try { child.kill('SIGTERM'); } catch (_) {}
}

async function request(baseUrl, endpoint, method = 'GET', body) {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const raw = await response.text();
  let payload = null;
  try { payload = raw ? JSON.parse(raw) : null; } catch (_) {}
  const value = payload && Object.prototype.hasOwnProperty.call(payload, 'value') ? payload.value : payload;
  if (!response.ok || value && value.error) throw new Error(value && (value.message || value.error) || raw || String(response.status));
  return value;
}

async function waitUntil(callback, message, timeoutMs = 30000) {
  const startedAt = Date.now();
  let value = null;
  while (Date.now() - startedAt < timeoutMs) {
    value = await callback();
    if (value) return value;
    await delay(100);
  }
  throw new Error(`${message}: ${JSON.stringify(value)}`);
}

async function waitForServer(url, child) {
  await waitUntil(async () => {
    if (child.exitCode !== null) throw new Error(`PHP server exited with ${child.exitCode}.`);
    try { return (await fetch(url, { redirect: 'manual' })).status < 500; } catch (_) { return false; }
  }, 'PHP docs server did not become ready');
}

async function waitForDriver(baseUrl, child) {
  await waitUntil(async () => {
    if (child.exitCode !== null) throw new Error(`ChromeDriver exited with ${child.exitCode}.`);
    try { await request(baseUrl, '/status'); return true; } catch (_) { return false; }
  }, 'ChromeDriver did not become ready');
}

async function createSession(baseUrl, scenario) {
  const value = await request(baseUrl, '/session', 'POST', {
    capabilities: {
      alwaysMatch: {
        browserName: 'chrome',
        pageLoadStrategy: 'normal',
        'goog:loggingPrefs': { browser: 'ALL', performance: 'ALL' },
        'goog:chromeOptions': {
          args: [
            '--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
            '--disable-background-networking', '--disable-component-update', '--disable-default-apps',
            '--disable-sync', '--metrics-recording-only', '--no-first-run', '--force-device-scale-factor=1',
            '--disk-cache-size=0', '--media-cache-size=0',
            `--window-size=${scenario.width},${scenario.height}`
          ]
        }
      }
    }
  });
  const sessionId = value && (value.sessionId || value.id);
  assert(sessionId, 'ChromeDriver did not return a session id.');
  await request(baseUrl, `/session/${sessionId}/window/rect`, 'POST', {
    x: 0, y: 0, width: scenario.width, height: scenario.height
  });
  return sessionId;
}

function execute(baseUrl, sessionId, script, args = []) {
  return request(baseUrl, `/session/${sessionId}/execute/sync`, 'POST', { script, args });
}

const deepQuerySource = `
  const deepQuery = (selector, searchRoot = document) => {
    const direct = searchRoot.querySelector(selector);
    if (direct) return direct;
    for (const node of searchRoot.querySelectorAll('*')) {
      if (!node.shadowRoot) continue;
      const match = deepQuery(selector, node.shadowRoot);
      if (match) return match;
    }
    return null;
  };
`;

const layoutShiftProbeSource = `
  (() => {
    if (!window.__xtendDocsRecommendationLongTasks) {
      window.__xtendDocsRecommendationLongTasks = [];
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => window.__xtendDocsRecommendationLongTasks.push({
            startTime: Number(entry.startTime || 0), duration: Number(entry.duration || 0)
          }));
        });
        longTaskObserver.observe({ type: 'longtask', buffered: true });
      } catch (_) {}
    }
    if (window.__xtendDocsLayoutShiftProbe) return window.__xtendDocsLayoutShiftProbe.supported;
    const state = {
      schema: 'xtend.docs.layout-shift-probe.v1',
      supported: false,
      entries: [],
      geometry: [],
      bootSkeleton: {
        found: false,
        visibleBeforeDefinition: false,
        hiddenAfterDefinition: false,
        samples: []
      },
      prerenderedRoute: {
        foundBeforeDefinition: false,
        sameNodeAfterDefinition: false,
        adopted: false
      },
      routeAdoption: null,
      totalValue: 0,
      maxSessionValue: 0,
      observer: null
    };
    window.addEventListener('xrouter-route-adopted', (event) => {
      state.routeAdoption = event && event.detail ? event.detail : null;
    });
    const sampleBootSkeleton = (reason) => {
      const fallback = document.querySelector('[data-docs-route-boot-skeleton][data-xtend-skeleton-fallback]');
      if (!fallback) return;
      const defined = Boolean(customElements.get('x-router'));
      const style = getComputedStyle(fallback);
      const rect = fallback.getBoundingClientRect();
      const visible = style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      state.bootSkeleton.found = true;
      if (!defined && visible) state.bootSkeleton.visibleBeforeDefinition = true;
      if (defined && !visible) state.bootSkeleton.hiddenAfterDefinition = true;
      state.bootSkeleton.samples.push({ reason, at: performance.now(), defined, visible, display: style.display, hidden: fallback.hasAttribute('hidden'), inlineStyle: fallback.getAttribute('style') || '', width: rect.width, height: rect.height });
    };
    const samplePrerenderedRoute = (reason) => {
      const candidate = state.prerenderedRouteNode || document.querySelector('[data-xrouter-prerendered-route]');
      if (!candidate) return;
      if (!state.prerenderedRouteNode) state.prerenderedRouteNode = candidate;
      if (!customElements.get('x-router')) state.prerenderedRoute.foundBeforeDefinition = true;
      const root = candidate.getRootNode();
      state.prerenderedRoute.sameNodeAfterDefinition = Boolean(root && root.host && root.host.localName === 'x-router');
      state.prerenderedRoute.adopted = candidate.getAttribute('data-xrouter-route-adopted') === 'true';
      state.prerenderedRoute.reason = reason;
    };
    const bootSkeletonObserver = new MutationObserver(() => {
      sampleBootSkeleton('mutation');
      samplePrerenderedRoute('mutation');
    });
    bootSkeletonObserver.observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'data-xtend-skeleton-active'] });
    customElements.whenDefined('x-router').then(() => requestAnimationFrame(() => {
      sampleBootSkeleton('x-router:defined');
      samplePrerenderedRoute('x-router:defined');
      customElements.whenDefined('xtend-doc-page').then(() => requestAnimationFrame(() => {
        samplePrerenderedRoute('xtend-doc-page:defined');
        bootSkeletonObserver.disconnect();
      }));
    }));
    const describeNode = (node) => {
      const element = node instanceof Element ? node : node?.parentElement;
      if (!(element instanceof Element)) return null;
      const root = element.getRootNode();
      const host = root && root.host instanceof Element ? root.host : null;
      const anchor = element.closest('[data-xtend-cls-anchor]') || host?.closest('[data-xtend-cls-anchor]') || null;
      return {
        tag: element.localName || '',
        id: element.id || '',
        className: typeof element.className === 'string' ? element.className : '',
        rootHost: host?.localName || '',
        rootHostId: host?.id || '',
        anchor: anchor?.getAttribute('data-xtend-cls-anchor') || '',
        textNode: node?.nodeType === Node.TEXT_NODE
      };
    };
    const rectRecord = (rect) => rect ? {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height
    } : null;
    const captureGeometry = (reason) => {
      const header = document.querySelector('x-header');
      const hero = document.querySelector('x-hero.docs-hero');
      const main = document.querySelector('main');
      const router = document.querySelector('main > x-router');
      const record = {
        at: performance.now(),
        reason,
        body: rectRecord(document.body?.getBoundingClientRect()),
        header: rectRecord(header?.getBoundingClientRect()),
        headerRoot: rectRecord(header?.shadowRoot?.querySelector('header')?.getBoundingClientRect()),
        hero: rectRecord(hero?.getBoundingClientRect()),
        heroRoot: rectRecord(hero?.shadowRoot?.querySelector('.hero')?.getBoundingClientRect()),
        main: rectRecord(main?.getBoundingClientRect()),
        router: rectRecord(router?.getBoundingClientRect()),
        defined: {
          header: Boolean(customElements.get('x-header')),
          hero: Boolean(customElements.get('x-hero')),
          router: Boolean(customElements.get('x-router'))
        }
      };
      const signature = JSON.stringify({
        body: record.body,
        header: record.header,
        headerRoot: record.headerRoot,
        hero: record.hero,
        heroRoot: record.heroRoot,
        main: record.main,
        router: record.router,
        defined: record.defined
      });
      if (state.lastGeometrySignature !== signature) {
        state.geometry.push(record);
        state.lastGeometrySignature = signature;
      }
    };
    const beginGeometrySampling = () => {
      const startedAt = performance.now();
      const sample = () => {
        captureGeometry('frame');
        if (performance.now() - startedAt < 2500) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', beginGeometrySampling, { once: true });
    else beginGeometrySampling();
    ['x-header', 'x-hero', 'x-router'].forEach((tag) => {
      customElements.whenDefined(tag).then(() => requestAnimationFrame(() => captureGeometry(tag + ':defined')));
    });
    const recalculate = () => {
      const entries = state.entries.slice().sort((left, right) => left.startTime - right.startTime);
      let windowStartedAt = -Infinity;
      let previousAt = -Infinity;
      let windowValue = 0;
      state.totalValue = 0;
      state.maxSessionValue = 0;
      entries.forEach((entry) => {
        state.totalValue += entry.value;
        if (entry.startTime - previousAt > 1000 || entry.startTime - windowStartedAt > 5000) {
          windowStartedAt = entry.startTime;
          windowValue = 0;
        }
        windowValue += entry.value;
        previousAt = entry.startTime;
        state.maxSessionValue = Math.max(state.maxSessionValue, windowValue);
      });
    };
    try {
      if (typeof PerformanceObserver !== 'function' || !PerformanceObserver.supportedEntryTypes?.includes('layout-shift')) {
        window.__xtendDocsLayoutShiftProbe = state;
        return false;
      }
      state.observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.hadRecentInput) return;
          state.entries.push({
            value: Number(entry.value) || 0,
            startTime: Number(entry.startTime) || 0,
            sources: Array.from(entry.sources || []).map((source) => ({
              node: describeNode(source.node),
              previousRect: rectRecord(source.previousRect),
              currentRect: rectRecord(source.currentRect)
            }))
          });
        });
        recalculate();
      });
      state.observer.observe({ type: 'layout-shift', buffered: true });
      state.supported = true;
    } catch (_) {}
    window.__xtendDocsLayoutShiftProbe = state;
    return state.supported;
  })();
`;

async function installLayoutShiftProbe(baseUrl, sessionId) {
  await request(baseUrl, `/session/${sessionId}/goog/cdp/execute`, 'POST', {
    cmd: 'Page.addScriptToEvaluateOnNewDocument',
    params: { source: layoutShiftProbeSource }
  });
}

function ssrProofTamperSource(kind) {
  return `
    (() => {
      const kind = ${JSON.stringify(kind)};
      const state = {
        probe: 'ssr-proof-tamper',
        kind,
        applied: false,
        before: null,
        after: null
      };
      window.__xtendDocsSsrProofTamper = state;
      let observer = null;
      const tamper = () => {
        if (state.applied) return true;
        const candidate = document.querySelector('[data-xrouter-prerendered-route]');
        if (!candidate) return false;
        const attributes = [
          'data-xrouter-route-path',
          'data-xrouter-dom-sha256',
          'data-xrouter-sanitized'
        ];
        const snapshot = () => Object.fromEntries(attributes.map((name) => [name, candidate.getAttribute(name)]));
        state.before = snapshot();
        if (kind === 'path') {
          candidate.setAttribute('data-xrouter-route-path', '/docs/de/__tampered_ssr_route__');
        } else if (kind === 'hash') {
          candidate.setAttribute('data-xrouter-dom-sha256', '0'.repeat(64));
        } else if (kind === 'trust') {
          candidate.setAttribute('data-xrouter-sanitized', 'false');
        }
        state.after = snapshot();
        state.applied = true;
        if (observer) observer.disconnect();
        return true;
      };
      observer = new MutationObserver(tamper);
      observer.observe(document, { childList: true, subtree: true });
      document.addEventListener('DOMContentLoaded', tamper, { once: true });

      const registry = window.customElements;
      if (registry && typeof registry.define === 'function') {
        const originalDefine = registry.define.bind(registry);
        Object.defineProperty(registry, 'define', {
          configurable: true,
          writable: true,
          value(name, constructor, options) {
            if (name === 'x-router') tamper();
            if (name === 'x-router') delete registry.define;
            return originalDefine(name, constructor, options);
          }
        });
      }
    })();
  `;
}

async function installSsrProofTamper(baseUrl, sessionId, kind) {
  await request(baseUrl, `/session/${sessionId}/goog/cdp/execute`, 'POST', {
    cmd: 'Page.addScriptToEvaluateOnNewDocument',
    params: { source: ssrProofTamperSource(kind) }
  });
}

async function verifyLayoutShiftProbe(baseUrl, sessionId) {
  const installed = await execute(baseUrl, sessionId, `
    return Boolean(window.__xtendDocsLayoutShiftProbe?.supported);
  `);
  assert(installed, 'Chromium does not expose buffered layout-shift observations.');
  await delay(100);
}

async function readSnapshot(baseUrl, sessionId) {
  return execute(baseUrl, sessionId, `${deepQuerySource}
    const api = window.__XTEND_DEV_API__;
    const content = deepQuery('#md-content');
    const articleHeading = content ? deepQuery('h1', content) : null;
    const articleTextRoot = content ? (deepQuery('[data-rmt-playground-article]', content) || content) : null;
    const docsPage = deepQuery('xtend-doc-page');
    const docsPages = [];
    const collectDocsPages = (root) => {
      root.querySelectorAll('*').forEach((node) => {
        if (node.localName === 'xtend-doc-page') docsPages.push(node);
        if (node.shadowRoot) collectDocsPages(node.shadowRoot);
      });
    };
    collectDocsPages(document);
    const router = deepQuery('x-router');
    const routerSnapshot = router && typeof router.snapshot === 'function' ? router.snapshot() : null;
    const routeRecord = router
      ? Array.from(router.children).find((entry) => entry.localName === 'x-route' && entry.getAttribute('path') === location.pathname)
      : null;
    const header = document.querySelector('x-header');
    const headerSnapshot = header && typeof header.snapshot === 'function' ? header.snapshot() : null;
    const headerTitleText = header?.shadowRoot?.querySelector('.title-text') || null;
    const hero = document.querySelector('x-hero.docs-hero');
    const main = document.querySelector('main');
    const article = deepQuery('.docs-article-surface');
    const sidebar = deepQuery('.docs-page-sidebar');
    const headerRoot = header?.shadowRoot?.querySelector('header') || null;
    const searchHost = deepQuery('#search-input');
    const searchControl = searchHost?.shadowRoot?.querySelector('input') || searchHost;
    const headerRect = headerRoot?.getBoundingClientRect() || null;
    const heroRect = hero?.getBoundingClientRect() || null;
    const mainRect = main?.getBoundingClientRect() || null;
    const articleRect = article?.getBoundingClientRect() || null;
    const sidebarRect = sidebar?.getBoundingClientRect() || null;
    const searchRect = searchControl?.getBoundingClientRect() || null;
    const resources = performance.getEntriesByType('resource').map((entry) => entry.name);
    const resourceEntries = performance.getEntriesByType('resource');
    const navigation = performance.getEntriesByType('navigation')[0] || null;
    const fcp = performance.getEntriesByName('first-contentful-paint')[0] || null;
    const sameOriginResources = resourceEntries.filter((entry) => entry.name.startsWith(location.origin));
    const layoutShiftProbe = window.__xtendDocsLayoutShiftProbe || null;
    const recommendationSnapshot = window.xtendDocsLastRecommendations || null;
    const recommendationLongTasks = (window.__xtendDocsRecommendationLongTasks || []).filter((entry) => (
      recommendationSnapshot
      && entry.startTime < recommendationSnapshot.rankingCompletedAt
      && entry.startTime + entry.duration > recommendationSnapshot.rankingStartedAt
    ));
    const relatedHost = deepQuery('#docs-related-links');
    const relatedList = relatedHost?.querySelector('[data-rmt-slot="related-links"], .docs-related-list') || null;
    const relatedHeading = relatedHost?.querySelector('.docs-sidebar-heading') || null;
    const relatedLinkElements = relatedList ? Array.from(relatedList.querySelectorAll('.docs-related-link')) : [];
    const relatedLinkRects = relatedLinkElements.map((link) => link.getBoundingClientRect());
    const relatedAdjacentGaps = relatedLinkRects.slice(1).map((rect, index) => rect.top - relatedLinkRects[index].bottom);
    const relatedLinks = relatedLinkElements.map((link) => ({
      slug: (link.getAttribute('data-rmt-route-ref') || '').replace(/^docs\\./, '').replace(/\\./g, '-'),
      href: link.getAttribute('href') || '',
      label: (link.textContent || '').trim(),
      source: link.getAttribute('data-related-source') || '',
      score: Number(link.getAttribute('data-related-score') || 0)
    }));
    const relatedLayout = relatedList ? {
      display: getComputedStyle(relatedList).display,
      rowGap: Math.round((parseFloat(getComputedStyle(relatedList).rowGap) || 0) * 10) / 10,
      minAdjacentGap: relatedAdjacentGaps.length
        ? Math.round(Math.min(...relatedAdjacentGaps) * 10) / 10
        : null,
      headingVisible: Boolean(
        relatedHeading
        && getComputedStyle(relatedHeading).display !== 'none'
        && relatedHeading.getBoundingClientRect().height > 0
      )
    } : null;
    const summaryIndicators = Array.from(document.querySelectorAll('x-summary.docs-menu-section')).map((summary) => {
      const details = summary.shadowRoot?.querySelector('details') || null;
      const indicator = summary.shadowRoot?.querySelector('.icon') || null;
      const transform = indicator ? getComputedStyle(indicator).transform : 'none';
      const matrix = transform && transform !== 'none' ? new DOMMatrixReadOnly(transform) : null;
      const rotationDegrees = matrix
        ? Math.round((Math.atan2(matrix.b, matrix.a) * 180 / Math.PI + 360) % 360)
        : 0;
      return {
        open: Boolean(details?.open),
        ariaExpanded: summary.shadowRoot?.querySelector('summary')?.getAttribute('aria-expanded') || '',
        rotationDegrees
      };
    });
    const articleNavigation = Array.from(document.querySelectorAll('[data-docs-menu-link]')).map((link) => {
      const summary = link.closest('x-summary.docs-menu-section');
      const href = link.getAttribute('href') || '';
      return {
        id: link.getAttribute('data-doc-id') || '',
        path: href ? new URL(href, location.href).pathname : '',
        marked: link.hasAttribute('active') || link.classList.contains('active') || link.getAttribute('aria-current') === 'page',
        ariaCurrent: link.getAttribute('aria-current') || '',
        activeAttribute: link.hasAttribute('active'),
        activeClass: link.classList.contains('active'),
        section: summary?.getAttribute('data-docs-menu-section') || '',
        sectionHostOpen: Boolean(summary?.hasAttribute('open')),
        sectionDetailsOpen: Boolean(summary?.shadowRoot?.querySelector('details')?.open)
      };
    });
    return {
      readyState: document.readyState,
      currentPath: location.pathname,
      documentTitle: document.title,
      htmlLang: document.documentElement.lang,
      currentLocale: window.xtendDocsCurrentLocale || '',
      theme: document.documentElement.getAttribute('data-theme') || 'light',
      shellSchema: window.xtendDocsShellRuntime && window.xtendDocsShellRuntime.schema || '',
      prehydrationSchema: window.xtendDocsSsrPrehydration && window.xtendDocsSsrPrehydration.schema || '',
      shellSnapshot: window.xtendDocsShellRuntime && window.xtendDocsShellRuntime.snapshot(),
      devApiDetected: Boolean(api),
      devApiMethods: api ? ['getPerformanceSnapshot', 'getFabricTelemetrySnapshot', 'getKernelSnapshot', 'getHydrationSnapshot', 'subscribe'].filter((key) => typeof api[key] === 'function') : [],
      performanceSnapshot: api && api.getPerformanceSnapshot(),
      fabricSnapshot: api && api.getFabricTelemetrySnapshot(),
      kernelSnapshot: api && api.getKernelSnapshot(),
      hydrationSnapshot: api && api.getHydrationSnapshot(),
      docsPageReady: Boolean(docsPage && docsPage.getAttribute('data-docs-route-state') === 'ready'),
      docsPageCount: docsPages.length,
      docsPageLocale: docsPage && docsPage.getAttribute('data-docs-route-locale') || '',
      articleTitle: articleHeading && articleHeading.textContent.trim() || '',
      articleText: articleTextRoot && articleTextRoot.textContent.trim().slice(0, 320) || '',
      routeId: routeRecord?.getAttribute('data-rmt-route-id') || '',
      routeDocumentTitle: routeRecord?.getAttribute('document-title') || '',
      routerCurrentRouteId: routerSnapshot && routerSnapshot.current && routerSnapshot.current.routeId || '',
      searchPlaceholder: deepQuery('#search-input')?.getAttribute('placeholder') || '',
      homeHref: document.querySelector('[data-docs-home-logo]')?.getAttribute('href') || '',
      searchGeometry: headerRect && searchRect ? {
        width: Math.round(searchRect.width * 10) / 10,
        headerWidth: Math.round(headerRect.width * 10) / 10,
        centerDelta: Math.round(Math.abs((searchRect.left + searchRect.width / 2) - (headerRect.left + headerRect.width / 2)) * 10) / 10
      } : null,
      headerBrand: headerSnapshot ? {
        collapse: headerSnapshot.brandCollapse,
        presentation: headerSnapshot.brandPresentation,
        titleFits: headerSnapshot.brandTitleFits,
        availableWidth: headerSnapshot.brandAvailableWidth,
        requiredWidth: headerSnapshot.brandRequiredWidth,
        logoOnlyAttribute: header.hasAttribute('logo-only'),
        titleAriaHidden: headerTitleText?.getAttribute('aria-hidden') || null,
        titlePosition: headerTitleText ? getComputedStyle(headerTitleText).position : ''
      } : null,
      regionGeometry: heroRect && mainRect ? {
        heroMainGap: Math.round((mainRect.top - heroRect.bottom) * 10) / 10,
        articleSidebarGap: articleRect && sidebarRect
          ? Math.round((sidebarRect.left - articleRect.right) * 10) / 10
          : null,
        articleSidebarTopDelta: articleRect && sidebarRect
          ? Math.round(Math.abs(articleRect.top - sidebarRect.top) * 10) / 10
          : null
      } : null,
      sanitized: content && content.getAttribute('data-rmt-sanitized') || '',
      trustedDomProof: content && content.getAttribute('data-rmt-trusted-dom-proof') || '',
      activeTrunk: document.querySelector('[data-docs-menu-shell]')?.getAttribute('data-docs-active-trunk') || '',
      activeTrunkContent: document.querySelector('[data-docs-active-trunk-content]')?.getAttribute('data-docs-active-trunk-content') || '',
      summaryIndicators,
      articleNavigation,
      trunkCount: document.querySelectorAll('[data-docs-trunk-link]').length,
      canonicalEntryCount: Array.isArray(window.xtendMenuConfig) ? window.xtendMenuConfig.length : 0,
      skeletonProfiles: window.XTendSkeletonLoader && typeof window.XTendSkeletonLoader.listProfiles === 'function'
        ? window.XTendSkeletonLoader.listProfiles().map((entry) => entry.id)
        : [],
      compactLoaded: resources.some((url) => url.includes('/docs/generated/search/') && url.includes('.compact.json')),
      fulltextLoaded: resources.some((url) => url.includes('/docs/generated/search/') && url.includes('.fulltext.json')),
      relatedLinks,
      relatedLayout,
      recommendationSnapshot,
      recommendationLongTasks,
      remoteResourceCount: resources.filter((url) => !url.startsWith(location.origin)).length,
      performance: {
        fcpMs: fcp ? fcp.startTime : null,
        responseEndMs: navigation ? navigation.responseEnd : null,
        domContentLoadedMs: navigation ? navigation.domContentLoadedEventEnd : null,
        loadEventMs: navigation ? navigation.loadEventEnd : null,
        initialEncodedBodyBytes: (navigation ? navigation.encodedBodySize : 0) + sameOriginResources.reduce((sum, entry) => sum + Number(entry.encodedBodySize || 0), 0),
        initialTransferBytes: (navigation ? navigation.transferSize : 0) + sameOriginResources.reduce((sum, entry) => sum + Number(entry.transferSize || 0), 0),
        sameOriginResourceCount: sameOriginResources.length
      },
      layoutShift: Number(layoutShiftProbe?.maxSessionValue || 0),
      layoutShiftTotal: Number(layoutShiftProbe?.totalValue || 0),
      layoutShiftEntries: Array.isArray(layoutShiftProbe?.entries) ? layoutShiftProbe.entries : [],
      layoutShiftGeometry: Array.isArray(layoutShiftProbe?.geometry) ? layoutShiftProbe.geometry : [],
      bootSkeleton: layoutShiftProbe?.bootSkeleton || null,
      prerenderedRoute: layoutShiftProbe?.prerenderedRoute || null,
      routeAdoption: layoutShiftProbe?.routeAdoption || (window.xstate && typeof window.xstate.get === 'function' ? window.xstate.get('xtend.router.routeAdoption') : null),
      initialPagePayloadRequests: resourceEntries.filter((entry) => entry.name.includes('xtend-docs-page=')).map((entry) => entry.name),
      overflowX: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
    };
  `);
}

async function runSearch(baseUrl, sessionId, query) {
  await execute(baseUrl, sessionId, `
    window.__docsSearchPerformanceProbe?.observer?.disconnect();
    const probe = { longTasks: [] };
    window.__docsSearchPerformanceProbe = probe;
    try {
      probe.observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => probe.longTasks.push({
          startTime: entry.startTime,
          duration: entry.duration
        }));
      });
      probe.observer.observe({ type: 'longtask' });
    } catch (_) {}
    return true;
  `);
  await execute(baseUrl, sessionId, `${deepQuerySource}
    const input = deepQuery('#search-input');
    if (!input) return false;
    input.value = arguments[0];
    input.dispatchEvent(new CustomEvent('input-changed', { bubbles: true, composed: true, detail: { value: arguments[0] } }));
    return true;
  `, [query]);
  const searchResult = await waitUntil(async () => execute(baseUrl, sessionId, `${deepQuerySource}
    const history = window.xtendDocsShellRuntime?.searchRuntime?.listHistory() || [];
    const last = history[history.length - 1];
    if (!last || last.query !== arguments[0] || last.superseded) return null;
    const results = deepQuery('#search-results');
    const links = results ? Array.from(results.querySelectorAll('[data-docs-search-result]')) : [];
    if (!links.length) return null;
    return {
      count: links.length,
      slugs: links.map((entry) => entry.getAttribute('data-docs-search-result')),
      labels: links.map((entry) => entry.textContent.trim()),
      usedFulltext: last.usedFulltext,
      fulltextLoaded: performance.getEntriesByType('resource').some((entry) => entry.name.includes('.fulltext.json')),
      worker: window.xtendDocsShellRuntime?.searchRuntime?.snapshot()?.worker || null
    };
  `, [query]), `Search did not return results for ${query}`);
  await delay(50);
  const presentation = await execute(baseUrl, sessionId, `${deepQuerySource}
    const parseColor = (value) => {
      const parts = String(value || '').match(/[\\d.]+/g) || [];
      return parts.slice(0, 3).map(Number);
    };
    const luminance = (value) => {
      const channels = parseColor(value).map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
      });
      return channels.length === 3 ? 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2] : 0;
    };
    const contrast = (foreground, background) => {
      const left = luminance(foreground);
      const right = luminance(background);
      return (Math.max(left, right) + 0.05) / (Math.min(left, right) + 0.05);
    };
    const results = deepQuery('#search-results');
    const popover = deepQuery('#docs-search-popover');
    const panel = popover?.shadowRoot?.querySelector('.panel');
    const first = results?.querySelector('[data-docs-search-result]');
    const score = first?.querySelector('.docs-search-result-score');
    const internalLink = first?.shadowRoot?.querySelector('a');
    const firstStyle = first && getComputedStyle(first);
    const internalStyle = internalLink && getComputedStyle(internalLink);
    const panelStyle = panel && getComputedStyle(panel);
    const scoreStyle = score && getComputedStyle(score);
    const background = firstStyle?.backgroundColor === 'rgba(0, 0, 0, 0)'
      ? panelStyle?.backgroundColor
      : firstStyle?.backgroundColor;
    const probe = window.__docsSearchPerformanceProbe || { longTasks: [] };
    const status = deepQuery('#docs-search-status');
    return {
      textContrast: contrast(firstStyle?.color, background),
      scoreContrast: contrast(scoreStyle?.color, background),
      horizontalOverflow: results ? Math.max(0, results.scrollWidth - results.clientWidth) : 0,
      statusHidden: Boolean(status?.hasAttribute('hidden') && getComputedStyle(status).display === 'none'),
      maxLongTaskMs: Math.max(0, ...probe.longTasks.map((entry) => Number(entry.duration || 0))),
      longTasks: probe.longTasks,
      panelBackground: panelStyle?.backgroundColor || '',
      resultBackground: background || '',
      resultColor: firstStyle?.color || '',
      scoreColor: scoreStyle?.color || '',
      internalBoxShadow: internalStyle?.boxShadow || '',
      internalTextDecoration: internalStyle?.textDecorationLine || ''
    };
  `);
  return { ...searchResult, presentation };
}

async function focusFirstSearchResult(baseUrl, sessionId) {
  const dispatched = await execute(baseUrl, sessionId, `${deepQuerySource}
    const input = deepQuery('#search-input');
    if (!input) return false;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }));
    return true;
  `);
  assert(dispatched, 'Search input is missing for keyboard navigation.');
  return waitUntil(async () => execute(baseUrl, sessionId, `
    let active = document.activeElement;
    while (active && active.shadowRoot && active.shadowRoot.activeElement) active = active.shadowRoot.activeElement;
    const root = active && active.getRootNode && active.getRootNode();
    const host = root && root.host || active;
    return host && host.getAttribute && host.getAttribute('data-docs-search-result') || null;
  `), 'Search keyboard navigation did not focus the first result');
}

async function activateHighlightedSearchResult(baseUrl, sessionId) {
  const activation = await execute(baseUrl, sessionId, `${deepQuerySource}
    const input = deepQuery('#search-input');
    const results = deepQuery('#search-results');
    const entries = results ? Array.from(results.querySelectorAll('[data-docs-search-result]')) : [];
    const highlighted = entries.find((entry) => entry.matches(':focus-within'))
      || entries.find((entry) => entry.getAttribute('aria-current') === 'page' || entry.classList.contains('active'))
      || entries.find((entry) => entry.tabIndex === 0)
      || entries[0];
    if (!(input && highlighted)) return null;
    const result = {
      slug: highlighted.getAttribute('data-docs-search-result'),
      path: highlighted.getAttribute('href')
    };
    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true, cancelable: true }));
    return result;
  `);
  assert(activation && activation.slug, 'Search has no highlighted result for Enter activation.');
  return waitUntil(async () => execute(baseUrl, sessionId, `
    const commands = window.xtendDocsShellRuntime?.appRuntime?.listCommands?.() || [];
    const activation = [...commands].reverse().find((entry) => entry?.command?.command === 'docs.route.navigate');
    const payload = activation?.command?.payload || {};
    const pathMatches = window.location.pathname === arguments[0] || window.location.pathname.endsWith('/' + arguments[1]);
    const selected = document.querySelector('[data-docs-search-result="' + arguments[1] + '"]');
    const internal = selected?.shadowRoot?.querySelector('a');
    const internalStyle = internal && getComputedStyle(internal);
    const selectedActive = Boolean(selected && (selected.hasAttribute('active') || selected.getAttribute('aria-current') === 'page'));
    return pathMatches && payload.slug === arguments[1] && payload.inputSource && selectedActive
      ? {
          path: window.location.pathname,
          slug: payload.slug,
          inputSource: payload.inputSource,
          selectedActive,
          internalBoxShadow: internalStyle?.boxShadow || '',
          internalTextDecoration: internalStyle?.textDecorationLine || ''
        }
      : null;
  `, [activation.path, activation.slug]), 'Enter did not activate the highlighted search result');
}

async function applyTheme(baseUrl, sessionId, expectedTheme) {
  const applied = await execute(baseUrl, sessionId, `
    const theme = window.XTend && window.XTend.theme;
    return theme && typeof theme.setTheme === 'function' ? theme.setTheme(arguments[0]) !== false : false;
  `, [expectedTheme]);
  assert(applied, `XTend theme API is unavailable for ${expectedTheme}.`);
  return waitUntil(async () => execute(baseUrl, sessionId, `
    const value = document.documentElement.getAttribute('data-theme') || 'light';
    const button = document.querySelector('#theme-toggle');
    const pressed = button && button.getAttribute('aria-pressed');
    const expectedPressed = arguments[0] === 'dark' ? 'true' : 'false';
    return value === arguments[0] && pressed === expectedPressed ? { theme: value, buttonPressed: pressed } : null;
  `, [expectedTheme]), `Theme did not switch to ${expectedTheme}`, 5000);
}

async function exerciseNavigationSurface(baseUrl, sessionId, scenarioId) {
  const opened = await execute(baseUrl, sessionId, `
    const header = document.querySelector('x-header');
    const trigger = header && header.shadowRoot && header.shadowRoot.querySelector('.burger-menu');
    if (!trigger) return null;
    trigger.click();
    return true;
  `);
  assert(opened, 'Mobile header drawer trigger is missing.');
  await delay(420);
  const result = await waitUntil(async () => execute(baseUrl, sessionId, `
    const header = document.querySelector('x-header');
    const drawer = header && header.shadowRoot && header.shadowRoot.querySelector('#drawer-menu');
    const nav = document.querySelector('[data-docs-menu-shell]');
    if (!(header && header.hasAttribute('menu-open') && drawer && drawer.getAttribute('aria-hidden') === 'false' && nav)) return null;
    const channels = (value) => {
      const raw = String(value || '').trim();
      if (raw.startsWith('#')) {
        const hex = raw.slice(1);
        const expanded = hex.length === 3 ? hex.split('').map((part) => part + part).join('') : hex;
        if (expanded.length === 6) return [0, 2, 4].map((offset) => parseInt(expanded.slice(offset, offset + 2), 16));
      }
      const values = raw.match(/[\\d.]+/g) || [];
      return values.slice(0, 3).map(Number);
    };
    const luminance = (value) => {
      const values = channels(value).map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
      });
      return values.length === 3 ? 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2] : 0;
    };
    const contrast = (foreground, background) => {
      const left = luminance(foreground);
      const right = luminance(background);
      return (Math.max(left, right) + 0.05) / (Math.min(left, right) + 0.05);
    };
    const appearance = (node) => {
      if (!node) return null;
      const style = getComputedStyle(node);
      const internalLink = node.shadowRoot && node.shadowRoot.querySelector('a');
      const internalStyle = internalLink ? getComputedStyle(internalLink) : null;
      return {
        background: style.backgroundColor,
        color: style.color,
        borderColor: style.borderColor,
        boxShadow: style.boxShadow,
        internalBoxShadow: internalStyle ? internalStyle.boxShadow : '',
        internalTextDecoration: internalStyle ? internalStyle.textDecorationLine : '',
        contrast: contrast(style.color, style.backgroundColor)
      };
    };
    const activeTrunk = nav.querySelector('[data-docs-trunk-link][active]');
    const inactiveTrunk = nav.querySelector('[data-docs-trunk-link]:not([active])');
    const markedPages = Array.from(nav.querySelectorAll('[data-docs-menu-link]')).filter((link) => (
      link.hasAttribute('active') || link.classList.contains('active') || link.getAttribute('aria-current') === 'page'
    ));
    const activePage = markedPages[0] || null;
    const inactivePage = nav.querySelector('[data-docs-menu-link]:not([active])');
    const activePageSection = activePage?.closest('x-summary.docs-menu-section') || null;
    const navigationColumns = Array.from(nav.querySelectorAll('[data-docs-menu-column]'));
    const columnGeometry = navigationColumns.map((column) => {
      const rect = column.getBoundingClientRect();
      const sections = Array.from(column.children).filter((node) => node.matches('x-summary.docs-menu-section'));
      const sectionRects = sections.map((section) => section.getBoundingClientRect());
      const internalGaps = sectionRects.slice(1).map((sectionRect, index) => (
        Math.round((sectionRect.top - sectionRects[index].bottom) * 10) / 10
      ));
      return {
        column: column.getAttribute('data-docs-menu-column') || '',
        left: Math.round(rect.left * 10) / 10,
        right: Math.round(rect.right * 10) / 10,
        top: Math.round(rect.top * 10) / 10,
        bottom: Math.round(rect.bottom * 10) / 10,
        sectionCount: sections.length,
        sectionOrders: sections.map((section) => Number(section.getAttribute('data-docs-menu-order'))),
        internalGaps
      };
    });
    const allColumnGaps = columnGeometry.flatMap((column) => column.internalGaps);
    const flattenedSectionOrder = columnGeometry.flatMap((column) => column.sectionOrders);
    const primary = channels(getComputedStyle(document.documentElement).getPropertyValue('--primary-color'));
    const inactiveBackground = channels(getComputedStyle(inactivePage).backgroundColor);
    return {
      menuMode: drawer.getAttribute('data-menu-mode'),
      trunkCount: nav.querySelectorAll('[data-docs-trunk-link]').length,
      currentPageCount: markedPages.length,
      currentPageSection: activePageSection?.getAttribute('data-docs-menu-section') || '',
      currentPageSectionOpen: Boolean(activePageSection?.shadowRoot?.querySelector('details')?.open),
      columnGeometry,
      columnCount: columnGeometry.length,
      maxInternalColumnGap: allColumnGaps.length ? Math.max(...allColumnGaps) : 0,
      minInternalColumnGap: allColumnGaps.length ? Math.min(...allColumnGaps) : 0,
      sectionOrderPreserved: flattenedSectionOrder.every((order, index) => order === index),
      columnsSideBySide: columnGeometry.length === 2 && Math.abs(columnGeometry[0].top - columnGeometry[1].top) <= 1 && columnGeometry[1].left >= columnGeometry[0].right,
      columnsStacked: columnGeometry.length === 2 && columnGeometry[1].top >= columnGeometry[0].bottom,
      horizontalOverflow: Math.max(0, nav.scrollWidth - nav.clientWidth),
      activeTrunk: appearance(activeTrunk),
      inactiveTrunk: appearance(inactiveTrunk),
      activePage: appearance(activePage),
      inactivePage: appearance(inactivePage),
      inactiveUsesPrimarySurface: primary.length === 3 && inactiveBackground.length === 3 && primary.every((value, index) => value === inactiveBackground[index])
    };
  `), 'Mobile header drawer did not expose task navigation');
  await delay(80);
  const screenshot = await request(baseUrl, `/session/${sessionId}/screenshot`);
  await writeFile(path.join(evidenceDir, `${scenarioId}-navigation.png`), Buffer.from(String(screenshot || ''), 'base64'));
  await execute(baseUrl, sessionId, `
    const header = document.querySelector('x-header');
    const trigger = header && header.shadowRoot && header.shadowRoot.querySelector('.burger-menu');
    if (trigger) trigger.click();
    return true;
  `);
  return result;
}

async function navigateTrunk(baseUrl, sessionId, trunk) {
  const clicked = await execute(baseUrl, sessionId, `
    const link = document.querySelector('[data-docs-trunk-link="' + arguments[0] + '"]');
    if (!link) return false;
    const target = link.shadowRoot && link.shadowRoot.querySelector('a') || link;
    target.click();
    return true;
  `, [trunk]);
  assert(clicked, `Trunk link ${trunk} is missing.`);
  let latest = null;
  try {
    return await waitUntil(async () => {
      latest = await execute(baseUrl, sessionId, `${deepQuerySource}
    const shell = document.querySelector('[data-docs-menu-shell]');
    const router = deepQuery('x-router');
    const route = router ? Array.from(router.children).find((entry) => entry.localName === 'x-route' && entry.getAttribute('path') === location.pathname) : null;
    const pages = [];
    const collect = (root) => {
      root.querySelectorAll('*').forEach((node) => {
        if (node.localName === 'xtend-doc-page') pages.push(node);
        if (node.shadowRoot) collect(node.shadowRoot);
      });
    };
    collect(document);
    const activeTrunkContents = document.querySelectorAll('[data-docs-active-trunk-content]');
    const page = pages.length === 1 ? pages[0] : null;
    const content = deepQuery('#md-content');
    const ready = shell && shell.getAttribute('data-docs-active-trunk') === arguments[0] &&
      activeTrunkContents.length === 1 && page && page.getAttribute('data-docs-route-state') === 'ready' &&
      content && content.querySelector('h1') && route;
    return {
          ready: Boolean(ready),
          trunk: shell.getAttribute('data-docs-active-trunk'),
          path: location.pathname,
          articleTitle: content && content.querySelector('h1') ? content.querySelector('h1').textContent.trim() : '',
          documentTitle: document.title,
          routeId: route && route.getAttribute('data-rmt-route-id') || '',
          pageCount: pages.length,
          pageState: page && page.getAttribute('data-docs-route-state') || '',
          activeTrunkContentCount: activeTrunkContents.length,
          outletChildren: router && router.shadowRoot
            ? Array.from(router.shadowRoot.querySelector('#outlet')?.children || []).map((entry) => ({
                tag: entry.localName,
                skeletonHidden: entry.getAttribute('data-xtend-skeleton-hidden') || ''
              }))
            : []
        };
  `, [trunk]);
      return latest && latest.ready ? latest : null;
    }, `Trunk ${trunk} did not become active`);
  } catch (error) {
    throw new Error(`${error.message}; latest=${JSON.stringify(latest)}`);
  }
}

async function navigateArticle(baseUrl, sessionId, slug) {
  const clicked = await execute(baseUrl, sessionId, `
    const link = Array.from(document.querySelectorAll('[data-docs-menu-link]')).find((entry) => {
      const href = entry.getAttribute('href') || '';
      return href.endsWith('/' + arguments[0]);
    });
    if (!link) return false;
    const target = link.shadowRoot && link.shadowRoot.querySelector('a') || link;
    target.click();
    return true;
  `, [slug]);
  assert(clicked, `Article link ${slug} is missing.`);
  return waitUntil(async () => {
    const snapshot = await readSnapshot(baseUrl, sessionId);
    return snapshot.docsPageReady && snapshot.currentPath.endsWith('/' + slug) && snapshot.relatedLinks.length >= 3
      ? snapshot
      : null;
  }, `Article ${slug} did not become ready`);
}

async function exerciseSkeletonHardening(baseUrl, sessionId) {
  return execute(baseUrl, sessionId, `
    const loader = window.XTendSkeletonLoader;
    if (!loader || typeof loader.show !== 'function' || typeof loader.hide !== 'function') return null;
    const target = document.createElement('div');
    target.style.width = '320px';
    target.style.position = 'fixed';
    target.style.left = '-10000px';
    target.style.top = '0';
    const content = document.createElement('p');
    content.textContent = 'Existing content';
    const empty = document.createElement('div');
    empty.setAttribute('data-xtend-skeleton-loader', '');
    empty.setAttribute('data-xtend-skeleton-profile', 'missing-edge-profile');
    empty.setAttribute('data-xtend-skeleton-variant', 'article');
    target.append(content);
    document.body.appendChild(target);
    const heightBefore = target.getBoundingClientRect().height;
    target.appendChild(empty);
    const skeleton = loader.show(target, {
      profile: 'missing-edge-profile',
      variant: 'article',
      lines: 'not-a-number',
      minHeight: '8rem',
      source: 'docs-shell-browser-smoke'
    });
    const heightDuring = target.getBoundingClientRect().height;
    const records = skeleton ? Array.from(skeleton.querySelectorAll('[data-xtend-skeleton-item], [data-xtend-skeleton-line]')) : [];
    const result = {
      visualRecordCount: records.length,
      visibleRecordCount: records.filter((record) => {
        const rect = record.getBoundingClientRect();
        const style = getComputedStyle(record);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      }).length,
      staleSkeletonReplaced: Boolean(skeleton && skeleton !== empty && !empty.isConnected),
      existingContentHidden: (() => {
        const style = getComputedStyle(content);
        return style.display === 'none' || style.visibility === 'hidden';
      })(),
      active: target.getAttribute('data-xtend-skeleton-active') === 'true',
      layoutMode: target.getAttribute('data-xtend-skeleton-mode') || '',
      heightBefore,
      heightDuring,
      heightDelta: Math.abs(heightDuring - heightBefore)
    };
    loader.hide(target);
    result.layoutModeCleared = !target.hasAttribute('data-xtend-skeleton-mode');
    result.retainedOverlayHidden = Boolean(
      skeleton && skeleton.isConnected &&
      skeleton.getAttribute('data-xtend-skeleton-hidden') === 'true' &&
      skeleton.getAttribute('aria-hidden') === 'true' &&
      skeleton.hasAttribute('inert')
    );
    target.remove();
    return result;
  `);
}

async function navigateHomeViaLogo(baseUrl, sessionId, scenario) {
  const clicked = await execute(baseUrl, sessionId, `
    const link = document.querySelector('[data-docs-home-logo]');
    const anchor = link && link.shadowRoot && link.shadowRoot.querySelector('a');
    if (!link || !anchor) return null;
    const href = link.getAttribute('href');
    anchor.click();
    return href;
  `);
  assert(clicked && clicked.includes(`/docs/${scenario.locale}/readme`), `${scenario.id}: header logo has no localized home target.`);
  return waitUntil(async () => execute(baseUrl, sessionId, `${deepQuerySource}
    const content = deepQuery('#md-content');
    const page = deepQuery('xtend-doc-page');
    const shell = document.querySelector('[data-docs-menu-shell]');
    const router = deepQuery('x-router');
    const route = router ? Array.from(router.children).find((entry) => entry.localName === 'x-route' && entry.getAttribute('path') === location.pathname) : null;
    return location.pathname.endsWith('/docs/' + arguments[0] + '/readme') &&
      shell && shell.getAttribute('data-docs-active-trunk') === 'start' &&
      page && page.getAttribute('data-docs-route-state') === 'ready' && page.getAttribute('data-docs-route-slug') === 'readme' &&
      content && content.getAttribute('data-docs-content-state') === 'ready' &&
      content && content.querySelector('h1')
      ? {
          path: location.pathname,
          trunk: shell.getAttribute('data-docs-active-trunk'),
          articleTitle: content.querySelector('h1').textContent.trim(),
          documentTitle: document.title,
          routeId: route && route.getAttribute('data-rmt-route-id') || ''
        }
      : null;
  `, [scenario.locale]), `${scenario.id}: header logo did not navigate home`);
}

async function switchDocsLocale(baseUrl, sessionId, targetLocale) {
  const dispatched = await execute(baseUrl, sessionId, `
    const select = document.getElementById('docs-language-select');
    if (!select) return false;
    select.dispatchEvent(new CustomEvent('select-changed', {
      bubbles: true,
      composed: true,
      detail: { value: arguments[0] }
    }));
    return true;
  `, [targetLocale]);
  assert(dispatched, `Language selector is missing for ${targetLocale}.`);
  let latest = null;
  try {
    return await waitUntil(async () => {
      latest = await execute(baseUrl, sessionId, `${deepQuerySource}
    const content = deepQuery('#md-content');
    const page = deepQuery('xtend-doc-page');
    const router = deepQuery('x-router');
    const route = router ? Array.from(router.children).find((entry) => entry.localName === 'x-route' && entry.getAttribute('path') === location.pathname) : null;
    const english = arguments[0] === 'en';
    const expectedTitle = 'XTend Developer Center | ' + (english ? 'XTend Documentation' : 'XTend Dokumentation');
    const expectedLead = english ? 'Welcome to the XTend Developer Center' : 'Willkommen im XTend Developer Center';
    const expectedPlaceholder = english ? 'Search documentation' : 'Dokumentation durchsuchen';
    const home = document.querySelector('[data-docs-home-logo]');
    const ready = location.pathname.endsWith('/docs/' + arguments[0] + '/readme') &&
      page && page.getAttribute('data-docs-route-state') === 'ready' &&
      page.getAttribute('data-docs-route-locale') === arguments[0] &&
      content && content.textContent.includes(expectedLead) &&
      document.title === expectedTitle &&
      route && route.getAttribute('data-rmt-route-id') !== 'docs.notFound' &&
      deepQuery('#search-input')?.getAttribute('placeholder') === expectedPlaceholder &&
      home?.getAttribute('href')?.endsWith('/docs/' + arguments[0] + '/readme');
    return {
      ready,
      locale: window.xtendDocsCurrentLocale,
      path: location.pathname,
      documentTitle: document.title,
      articleTitle: content.querySelector('h1')?.textContent.trim() || '',
      articleLead: content?.textContent.trim().slice(0, 240) || '',
      articleLeadMatches: Boolean(content && content.textContent.includes(expectedLead)),
      pageState: page?.getAttribute('data-docs-route-state') || '',
      pageLocale: page?.getAttribute('data-docs-route-locale') || '',
      routeId: route?.getAttribute('data-rmt-route-id') || '',
      searchPlaceholder: deepQuery('#search-input')?.getAttribute('placeholder') || '',
      homeHref: home?.getAttribute('href') || ''
    };
  `, [targetLocale]);
      return latest && latest.ready ? latest : null;
    }, `Locale switch to ${targetLocale} did not preserve route and title ownership`);
  } catch (error) {
    throw new Error(`${error.message}; latest=${JSON.stringify(latest)}`);
  }
}

async function waitForDocsRouteSnapshot(baseUrl, sessionId, locale, slug, expectedTitle, message) {
  return waitUntil(async () => {
    const snapshot = await readSnapshot(baseUrl, sessionId);
    const expectedPath = `/docs/${locale}/${slug}`;
    return snapshot.currentPath === expectedPath && snapshot.docsPageReady && snapshot.docsPageCount === 1 &&
      snapshot.docsPageLocale === locale && snapshot.currentLocale === locale && snapshot.htmlLang === locale &&
      snapshot.articleTitle === expectedTitle && snapshot.routeId && snapshot.routeId !== 'docs.notFound'
      ? snapshot
      : null;
  }, message);
}

async function restoreInstrumentedFetch(baseUrl, sessionId, stateKey, originalKey) {
  await execute(baseUrl, sessionId, `
    if (window[arguments[0]]) window.fetch = window[arguments[0]];
    delete window[arguments[0]];
    const state = window[arguments[1]] || null;
    return state;
  `, [originalKey, stateKey]);
}

async function exerciseRapidNavigationRace(baseUrl, sessionId, scenario) {
  const firstSlug = 'native-first-rmt-recipes';
  const finalSlug = 'native-first-release-review';
  const expectedTitle = 'Native-First Release Review';
  const stateKey = '__xtendDocsRapidNavigationRace';
  const originalKey = '__xtendDocsRapidNavigationOriginalFetch';
  const installed = await execute(baseUrl, sessionId, `
    const firstSlug = arguments[0];
    const finalSlug = arguments[1];
    const links = Array.from(document.querySelectorAll('[data-docs-menu-link]'));
    const linkFor = (slug) => links.find((entry) => (entry.getAttribute('href') || '').endsWith('/' + slug));
    const first = linkFor(firstSlug);
    const final = linkFor(finalSlug);
    if (!(first && final)) return false;
    const targetFor = (link) => link.shadowRoot?.querySelector('a') || link;
    const originalFetch = window.fetch;
    const state = {
      kind: 'rapid-navigation-race',
      firstSlug,
      finalSlug,
      firstDispatched: false,
      finalDispatched: false,
      delayedRequestStarted: false,
      delayedRequestReleased: false,
      delayedRequestSettled: false,
      requests: []
    };
    window[arguments[2]] = originalFetch;
    window[arguments[3]] = state;
    window.fetch = function(input, init) {
      const rawUrl = typeof input === 'string' ? input : input?.url || '';
      const url = new URL(rawUrl, location.href);
      const pageSlug = url.searchParams.get('xtend-docs-page') || '';
      const pageLocale = url.searchParams.get('locale') || '';
      if (pageSlug) state.requests.push({ slug: pageSlug, locale: pageLocale, at: performance.now() });
      if (pageSlug === firstSlug && !state.delayedRequestStarted) {
        state.delayedRequestStarted = true;
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            state.delayedRequestReleased = true;
            Promise.resolve(originalFetch.call(window, input, init)).then(
              (response) => {
                state.delayedRequestSettled = true;
                resolve(response);
              },
              (error) => {
                state.delayedRequestSettled = true;
                reject(error);
              }
            );
          }, 450);
        });
      }
      return originalFetch.call(window, input, init);
    };
    state.firstDispatched = true;
    targetFor(first).click();
    const startedAt = performance.now();
    const dispatchFinal = () => {
      if (state.delayedRequestStarted || performance.now() - startedAt >= 500) {
        state.finalDispatched = true;
        targetFor(final).click();
        return;
      }
      setTimeout(dispatchFinal, 5);
    };
    dispatchFinal();
    return true;
  `, [firstSlug, finalSlug, originalKey, stateKey]);
  assert(installed, `${scenario.id}: rapid navigation fixtures are missing.`);
  try {
    const settled = await waitUntil(async () => {
      const snapshot = await readSnapshot(baseUrl, sessionId);
      const state = await execute(baseUrl, sessionId, `return window[arguments[0]] || null;`, [stateKey]);
      return state?.delayedRequestStarted && state?.finalDispatched && state?.delayedRequestSettled &&
        snapshot.currentPath === `/docs/${scenario.locale}/${finalSlug}` && snapshot.docsPageReady &&
        snapshot.docsPageCount === 1 && snapshot.articleTitle === expectedTitle
        ? { snapshot, state }
        : null;
    }, `${scenario.id}: rapid overlapping navigation did not settle on the latest route`);
    await delay(150);
    const stable = await waitForDocsRouteSnapshot(
      baseUrl,
      sessionId,
      scenario.locale,
      finalSlug,
      expectedTitle,
      `${scenario.id}: stale rapid-navigation payload replaced the latest route`
    );
    assert(settled.state.requests.some((entry) => entry.slug === firstSlug), `${scenario.id}: first rapid-navigation payload was not delayed.`);
    assert(settled.state.requests.some((entry) => entry.slug === finalSlug), `${scenario.id}: latest rapid-navigation payload was not requested.`);
    assertSingleCurrentArticle(stable, `${scenario.id}: rapid navigation`);
    return { ...settled, stable };
  } finally {
    await restoreInstrumentedFetch(baseUrl, sessionId, stateKey, originalKey);
  }
}

async function exerciseHistoryNavigation(baseUrl, sessionId, scenario) {
  const firstSlug = 'enterprise-adoption';
  const finalSlug = 'changelog';
  await navigateArticle(baseUrl, sessionId, firstSlug);
  await navigateArticle(baseUrl, sessionId, finalSlug);
  const backDispatched = await execute(baseUrl, sessionId, `history.back(); return true;`);
  assert(backDispatched, `${scenario.id}: history.back() could not be dispatched.`);
  const back = await waitForDocsRouteSnapshot(
    baseUrl,
    sessionId,
    scenario.locale,
    firstSlug,
    'Enterprise Adoption',
    `${scenario.id}: Back did not restore the preceding Docs route`
  );
  assertSingleCurrentArticle(back, `${scenario.id}: history back`);
  const forwardDispatched = await execute(baseUrl, sessionId, `history.forward(); return true;`);
  assert(forwardDispatched, `${scenario.id}: history.forward() could not be dispatched.`);
  const forward = await waitForDocsRouteSnapshot(
    baseUrl,
    sessionId,
    scenario.locale,
    finalSlug,
    'Changelog',
    `${scenario.id}: Forward did not restore the later Docs route`
  );
  assertSingleCurrentArticle(forward, `${scenario.id}: history forward`);
  return { firstSlug, finalSlug, back, forward };
}

async function exerciseLocaleNavigationRace(baseUrl, sessionId, scenario) {
  const slug = 'best-practices';
  const targetLocale = scenario.locale === 'en' ? 'de' : 'en';
  const stateKey = '__xtendDocsLocaleNavigationRace';
  const originalKey = '__xtendDocsLocaleNavigationOriginalFetch';
  const installed = await execute(baseUrl, sessionId, `
    const slug = arguments[0];
    const sourceLocale = arguments[1];
    const targetLocale = arguments[2];
    const link = Array.from(document.querySelectorAll('[data-docs-menu-link]'))
      .find((entry) => (entry.getAttribute('href') || '').endsWith('/' + slug));
    const select = document.getElementById('docs-language-select');
    if (!(link && select)) return false;
    const target = link.shadowRoot?.querySelector('a') || link;
    const originalFetch = window.fetch;
    const state = {
      kind: 'locale-navigation-race',
      slug,
      sourceLocale,
      targetLocale,
      navigationDispatched: false,
      localeDispatched: false,
      delayedRequestStarted: false,
      delayedRequestSettled: false,
      requests: []
    };
    window[arguments[3]] = originalFetch;
    window[arguments[4]] = state;
    window.fetch = function(input, init) {
      const rawUrl = typeof input === 'string' ? input : input?.url || '';
      const url = new URL(rawUrl, location.href);
      const pageSlug = url.searchParams.get('xtend-docs-page') || '';
      const pageLocale = url.searchParams.get('locale') || '';
      if (pageSlug) state.requests.push({ slug: pageSlug, locale: pageLocale, at: performance.now() });
      if (pageSlug === slug && pageLocale === sourceLocale && !state.delayedRequestStarted) {
        state.delayedRequestStarted = true;
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            Promise.resolve(originalFetch.call(window, input, init)).then(
              (response) => {
                state.delayedRequestSettled = true;
                resolve(response);
              },
              (error) => {
                state.delayedRequestSettled = true;
                reject(error);
              }
            );
          }, 450);
        });
      }
      return originalFetch.call(window, input, init);
    };
    state.navigationDispatched = true;
    target.click();
    const startedAt = performance.now();
    const dispatchLocale = () => {
      if (state.delayedRequestStarted || performance.now() - startedAt >= 500) {
        state.localeDispatched = true;
        select.dispatchEvent(new CustomEvent('select-changed', {
          bubbles: true,
          composed: true,
          detail: { value: targetLocale }
        }));
        return;
      }
      setTimeout(dispatchLocale, 5);
    };
    dispatchLocale();
    return true;
  `, [slug, scenario.locale, targetLocale, originalKey, stateKey]);
  assert(installed, `${scenario.id}: locale/navigation race fixtures are missing.`);
  try {
    const settled = await waitUntil(async () => {
      const snapshot = await readSnapshot(baseUrl, sessionId);
      const state = await execute(baseUrl, sessionId, `return window[arguments[0]] || null;`, [stateKey]);
      return state?.delayedRequestStarted && state?.localeDispatched && state?.delayedRequestSettled &&
        snapshot.currentPath === `/docs/${targetLocale}/${slug}` && snapshot.docsPageReady &&
        snapshot.docsPageCount === 1 && snapshot.docsPageLocale === targetLocale &&
        snapshot.currentLocale === targetLocale && snapshot.articleTitle === 'Best Practices'
        ? { snapshot, state }
        : null;
    }, `${scenario.id}: concurrent locale/navigation transition did not settle on the localized route`);
    await delay(150);
    const stable = await waitForDocsRouteSnapshot(
      baseUrl,
      sessionId,
      targetLocale,
      slug,
      'Best Practices',
      `${scenario.id}: stale source-locale payload replaced the localized route`
    );
    assert(settled.state.requests.some((entry) => entry.slug === slug && entry.locale === scenario.locale), `${scenario.id}: source-locale request was not delayed.`);
    assert(settled.state.requests.some((entry) => entry.slug === slug && entry.locale === targetLocale), `${scenario.id}: target-locale request was not issued.`);
    assertSingleCurrentArticle(stable, `${scenario.id}: locale/navigation race`);
    return { targetLocale, ...settled, stable };
  } finally {
    await restoreInstrumentedFetch(baseUrl, sessionId, stateKey, originalKey);
  }
}

async function capturePerformanceSample(baseUrl, driverUrl, scenario) {
  const sessionId = await createSession(driverUrl, scenario);
  try {
    await installLayoutShiftProbe(driverUrl, sessionId);
    await request(driverUrl, `/session/${sessionId}/url`, 'POST', {
      url: `${baseUrl}/docs/${scenario.locale}/readme`
    });
    await verifyLayoutShiftProbe(driverUrl, sessionId);
    const snapshot = await waitUntil(async () => {
      const value = await readSnapshot(driverUrl, sessionId);
      return value.readyState === 'complete' && value.articleTitle && Number.isFinite(value.performance && value.performance.fcpMs)
        ? value
        : null;
    }, `${scenario.id}: baseline page did not reach FCP`);
    await delay(250);
    return (await readSnapshot(driverUrl, sessionId)).performance || snapshot.performance;
  } finally {
    await request(driverUrl, `/session/${sessionId}`, 'DELETE').catch(() => {});
  }
}

function maxMetric(samples, key) {
  return Math.max(...samples.map((sample) => Number(sample && sample[key] || 0)));
}

function medianMetric(samples, key) {
  const values = (Array.isArray(samples) ? samples : [])
    .map((sample) => sample && sample[key])
    .filter((value) => value !== null && value !== undefined && Number.isFinite(Number(value)))
    .map(Number)
    .sort((left, right) => left - right);
  if (values.length === 0) return null;
  const midpoint = Math.floor(values.length / 2);
  return values.length % 2 === 0
    ? (values[midpoint - 1] + values[midpoint]) / 2
    : values[midpoint];
}

async function capturePerformanceBaseline(baseUrl, driverUrl, scenarios) {
  const records = {};
  for (const scenario of scenarios) {
    const samples = [];
    for (let index = 0; index < 3; index += 1) {
      samples.push(await capturePerformanceSample(baseUrl, driverUrl, scenario));
    }
    records[scenario.id] = {
      schema: 'xtend.docs.shell-performance-baseline-scenario.v1',
      viewport: { width: scenario.width, height: scenario.height },
      locale: scenario.locale,
      sampleCount: samples.length,
      fcpMs: maxMetric(samples, 'fcpMs'),
      initialEncodedBodyBytes: maxMetric(samples, 'initialEncodedBodyBytes'),
      samples
    };
  }
  const revision = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: sourceRootDir, encoding: 'utf8' }).stdout.trim();
  return {
    schema: 'xtend.docs.shell-performance-baseline.v1',
    source: 'git-archive-head-before-xdc',
    revision,
    capturedAt: new Date().toISOString(),
    regressionLimit: 0.05,
    scenarios: records
  };
}

async function runPostImportProofMutationRegression(baseUrl, driverUrl) {
  const scenario = {
    id: 'de-ssr-proof-post-import-mutation',
    locale: 'de',
    width: 1280,
    height: 800
  };
  const proofText = 'Import boundary proof';
  const proof = {
    contentHash: sha256(`<p>${proofText}</p>`),
    contentBytes: String(Buffer.byteLength(`<p>${proofText}</p>`, 'utf8')),
    domHash: sha256(proofText),
    structureHash: sha256('[]')
  };
  const sessionId = await createSession(driverUrl, scenario);
  try {
    await request(driverUrl, `/session/${sessionId}/url`, 'POST', {
      url: `${baseUrl}/docs/${scenario.locale}/readme`
    });
    await waitForDocsRouteSnapshot(
      driverUrl,
      sessionId,
      scenario.locale,
      'readme',
      'XTend Developer Center',
      `${scenario.id}: Docs host did not become ready`
    );
    const installed = await execute(driverUrl, sessionId, `
      const path = location.pathname;
      const routeId = 'docs.test.post-import-proof';
      const componentTag = 'x-post-import-proof';
      const loader = window.XTendLoader;
      if (!loader || typeof loader.ensureComponent !== 'function') return { installed: false, reason: 'loader-unavailable' };
      const router = document.createElement('x-router');
      router.id = 'post-import-proof-router';
      router.setAttribute('mode', 'history');
      router.setAttribute('adopt-prerendered-route', 'true');
      router.style.cssText = 'position:fixed;left:-10000px;top:0;width:320px;min-height:120px;';
      const route = document.createElement('x-route');
      route.setAttribute('path', path);
      route.setAttribute('component', componentTag);
      route.setAttribute('data-rmt-route-id', routeId);
      const candidate = document.createElement(componentTag);
      candidate.id = 'post-import-proof-candidate';
      const candidateAttributes = {
        'data-xrouter-prerendered-route': 'true',
        'data-xrouter-route-path': path,
        'data-xrouter-route-id': routeId,
        'data-xrouter-route-component': componentTag,
        'data-xrouter-route-locale': document.documentElement.lang,
        'data-xrouter-content-sha256': arguments[0].contentHash,
        'data-xrouter-content-bytes': arguments[0].contentBytes,
        'data-xrouter-dom-sha256': arguments[0].domHash,
        'data-xrouter-dom-hash-basis': 'normalized-text-content.v1',
        'data-xrouter-dom-structure-sha256': arguments[0].structureHash,
        'data-xrouter-dom-structure-hash-basis': 'sensitive-element-sequence-attributes.v1',
        'data-xrouter-trust-boundary': 'xtend.security.sanitizing-boundary.v1',
        'data-xrouter-sanitizer': 'xtend.security.trusted-dom-sanitizer.v1',
        'data-xrouter-sanitized': 'true'
      };
      Object.entries(candidateAttributes).forEach(([name, value]) => candidate.setAttribute(name, value));
      const content = document.createElement('div');
      const contentAttributes = {
        'data-rmt-content-sha256': arguments[0].contentHash,
        'data-rmt-content-bytes': arguments[0].contentBytes,
        'data-rmt-dom-sha256': arguments[0].domHash,
        'data-rmt-dom-hash-basis': 'normalized-text-content.v1',
        'data-rmt-dom-structure-sha256': arguments[0].structureHash,
        'data-rmt-dom-structure-hash-basis': 'sensitive-element-sequence-attributes.v1',
        'data-rmt-trust-boundary': 'xtend.security.sanitizing-boundary.v1',
        'data-rmt-sanitizer': 'xtend.security.trusted-dom-sanitizer.v1',
        'data-rmt-sanitized': 'true'
      };
      Object.entries(contentAttributes).forEach(([name, value]) => content.setAttribute(name, value));
      const paragraph = document.createElement('p');
      paragraph.textContent = arguments[1];
      content.appendChild(paragraph);
      candidate.appendChild(content);
      const state = {
        kind: 'post-import-proof-mutation',
        importRequested: false,
        importPaused: false,
        importFulfilled: false,
        proofMutatedDuringImport: false,
        event: null
      };
      window.__xtendDocsPostImportProofMutation = state;
      window.__xtendDocsPostImportProofCandidate = candidate;
      const originalEnsureComponent = loader.ensureComponent;
      let releaseDefinition = null;
      const definitionGate = new Promise((resolve) => {
        releaseDefinition = resolve;
      });
      window.__xtendDocsPostImportOriginalLoader = loader;
      window.__xtendDocsReleasePostImportDefinition = () => {
        if (state.importFulfilled) return false;
        if (!customElements.get(componentTag)) {
          customElements.define(componentTag, class extends HTMLElement {});
        }
        state.importFulfilled = true;
        releaseDefinition(true);
        return true;
      };
      window.XTendLoader = Object.freeze({
        ...loader,
        ensureComponent(tag, options) {
          if (tag !== componentTag) return originalEnsureComponent.call(loader, tag, options);
          state.importRequested = true;
          state.importPaused = true;
          return definitionGate;
        }
      });
      router.addEventListener('xrouter-route-adopted', (event) => {
        state.event = event.detail || null;
      });
      router.append(route, candidate);
      document.body.appendChild(router);
      return { installed: true };
    `, [proof, proofText]);
    assert(installed?.installed === true, `${scenario.id}: post-import fixture was not installed (${JSON.stringify(installed)}).`);
    let earlyDiagnostic = null;
    const gateState = await waitUntil(
      async () => {
        const diagnostic = await execute(driverUrl, sessionId, `
          const state = window.__xtendDocsPostImportProofMutation || null;
          const candidate = window.__xtendDocsPostImportProofCandidate || null;
          const router = document.getElementById('post-import-proof-router');
          const route = router?.querySelector('x-route') || null;
          return {
            state,
            candidateConnected: Boolean(candidate?.isConnected),
            routerConnected: Boolean(router?.isConnected),
            componentDefined: Boolean(customElements.get('x-post-import-proof')),
            outletHtml: router?.shadowRoot?.querySelector('#outlet')?.innerHTML || ''
          };
        `);
        if (diagnostic?.state?.importRequested && diagnostic?.state?.importPaused) return 'component-definition-paused';
        if (diagnostic?.state?.event) {
          earlyDiagnostic = diagnostic;
          return 'router-rejected';
        }
        return null;
      },
      `${scenario.id}: synthetic component definition did not pause at the loader boundary`
    );
    assert(gateState === 'component-definition-paused', `${scenario.id}: synthetic candidate was rejected before the component-definition boundary (${JSON.stringify(earlyDiagnostic)}).`);
    const mutation = await execute(driverUrl, sessionId, `
      const state = window.__xtendDocsPostImportProofMutation;
      const candidate = window.__xtendDocsPostImportProofCandidate;
      if (!(state && candidate?.isConnected)) return false;
      state.proofMutatedDuringImport = true;
      candidate.setAttribute('data-xrouter-content-sha256', 'f'.repeat(64));
      return true;
    `);
    assert(mutation, `${scenario.id}: staged proof could not be mutated while import was paused.`);
    const definitionReleased = await execute(driverUrl, sessionId, `
      return window.__xtendDocsReleasePostImportDefinition?.() === true;
    `);
    assert(definitionReleased, `${scenario.id}: paused component definition could not be released.`);
    const result = await waitUntil(async () => execute(driverUrl, sessionId, `
      const state = window.__xtendDocsPostImportProofMutation || null;
      const candidate = window.__xtendDocsPostImportProofCandidate || null;
      const router = document.getElementById('post-import-proof-router');
      const outlet = router?.shadowRoot?.querySelector('#outlet');
      const fallback = outlet?.querySelector('x-post-import-proof') || null;
      return state?.event && state.event.adopted === false && fallback
        ? {
            state,
            candidateConnected: Boolean(candidate?.isConnected),
            fallbackConnected: Boolean(fallback?.isConnected),
            fallbackIsCandidate: fallback === candidate,
            outletChildCount: outlet?.children.length || 0
          }
        : null;
    `), `${scenario.id}: post-import mutation was not rejected into the normal render path`);
    assert(result.state.importPaused && result.state.importFulfilled && result.state.proofMutatedDuringImport, `${scenario.id}: mutation did not occur inside the paused component import.`);
    assert(result.state.event.reason === 'content-proof-mismatch', `${scenario.id}: unexpected rejection reason ${JSON.stringify(result.state.event)}.`);
    assert(result.state.event.diagnostic === 'post-import-proof-attribute-mismatch', `${scenario.id}: post-import diagnostic was not emitted (${JSON.stringify(result.state.event)}).`);
    assert(!result.candidateConnected && result.fallbackConnected && !result.fallbackIsCandidate && result.outletChildCount === 1, `${scenario.id}: rejected candidate did not yield one distinct CSR route component (${JSON.stringify(result)}).`);
    const logs = await request(driverUrl, `/session/${sessionId}/log`, 'POST', { type: 'browser' }).catch(() => []);
    const severe = (Array.isArray(logs) ? logs : []).filter((entry) => String(entry.level || '').toUpperCase() === 'SEVERE');
    assert(severe.length === 0, `${scenario.id}: severe console errors: ${JSON.stringify(severe)}`);
    await writeFile(path.join(evidenceDir, `${scenario.id}.json`), `${JSON.stringify({
      scenario,
      proof,
      result,
      logs
    }, null, 2)}\n`);
    await execute(driverUrl, sessionId, `
      if (window.__xtendDocsPostImportOriginalLoader) {
        window.XTendLoader = window.__xtendDocsPostImportOriginalLoader;
      }
      delete window.__xtendDocsPostImportOriginalLoader;
      delete window.__xtendDocsReleasePostImportDefinition;
      document.getElementById('post-import-proof-router')?.remove();
      return true;
    `);
  } finally {
    await request(driverUrl, `/session/${sessionId}`, 'DELETE').catch(() => {});
  }
}

async function runAliasRouteRegression(baseUrl, driverUrl) {
  const scenario = {
    id: 'de-alias-xtend-loader',
    locale: 'de',
    alias: 'xtend-loader',
    canonicalSlug: 'xtend-classic',
    width: 1280,
    height: 800
  };
  const redirect = await fetch(`${baseUrl}/docs/${scenario.locale}/${scenario.alias}`, { redirect: 'manual' });
  const redirectLocation = redirect.headers.get('location') || '';
  assert(redirect.status === 302, `${scenario.id}: alias endpoint returned HTTP ${redirect.status} instead of 302.`);
  assert(redirectLocation.endsWith(`/docs/${scenario.locale}/${scenario.canonicalSlug}`), `${scenario.id}: alias redirect target is not canonical (${redirectLocation}).`);
  const sessionId = await createSession(driverUrl, scenario);
  try {
    await installLayoutShiftProbe(driverUrl, sessionId);
    await request(driverUrl, `/session/${sessionId}/url`, 'POST', {
      url: `${baseUrl}/docs/${scenario.locale}/${scenario.alias}`
    });
    await verifyLayoutShiftProbe(driverUrl, sessionId);
    await waitForDocsRouteSnapshot(
      driverUrl,
      sessionId,
      scenario.locale,
      scenario.canonicalSlug,
      'XTend Classic',
      `${scenario.id}: alias route did not resolve to its canonical document`
    );
    const snapshot = await waitUntil(async () => {
      const value = await readSnapshot(driverUrl, sessionId);
      return value.routeAdoption ? value : null;
    }, `${scenario.id}: canonical alias target did not settle its SSR-adoption decision`);
    assert(snapshot.routeAdoption?.adopted === true, `${scenario.id}: canonical alias target was not SSR-adopted (${JSON.stringify(snapshot.routeAdoption)}).`);
    assert(snapshot.prerenderedRoute?.sameNodeAfterDefinition === true, `${scenario.id}: canonical alias target lost SSR node identity.`);
    assert(snapshot.initialPagePayloadRequests.length === 0, `${scenario.id}: canonical alias target triggered an initial CSR payload (${JSON.stringify(snapshot.initialPagePayloadRequests)}).`);
    assertSingleCurrentArticle(snapshot, scenario.id);
    const logs = await request(driverUrl, `/session/${sessionId}/log`, 'POST', { type: 'browser' }).catch(() => []);
    const severe = (Array.isArray(logs) ? logs : []).filter((entry) => String(entry.level || '').toUpperCase() === 'SEVERE');
    assert(severe.length === 0, `${scenario.id}: severe console errors: ${JSON.stringify(severe)}`);
    await writeFile(path.join(evidenceDir, `${scenario.id}.json`), `${JSON.stringify({
      scenario,
      redirect: { status: redirect.status, location: redirectLocation },
      snapshot,
      logs
    }, null, 2)}\n`);
  } finally {
    await request(driverUrl, `/session/${sessionId}`, 'DELETE').catch(() => {});
  }
}

async function runSsrCodeEnhancementRegression(baseUrl, driverUrl) {
  const scenario = {
    id: 'de-ssr-code-enhancement',
    locale: 'de',
    slug: 'rmt-vnext-authoring',
    width: 1280,
    height: 800
  };
  const route = `/docs/${scenario.locale}/${scenario.slug}`;
  const rawResponse = await fetch(`${baseUrl}${route}`, { redirect: 'manual' });
  const rawHtml = await rawResponse.text();
  const raw = {
    status: rawResponse.status,
    prerenderedRoute: /\bdata-xrouter-prerendered-route(?:\s|=|>)/i.test(rawHtml),
    preCodeCount: (rawHtml.match(/<pre\b[^>]*>\s*<code\b/gi) || []).length,
    xCodeCount: (rawHtml.match(/<x-code\b/gi) || []).length
  };
  assert(raw.status === 200, `${scenario.id}: Raw HTML returned HTTP ${raw.status} instead of 200.`);
  assert(raw.prerenderedRoute, `${scenario.id}: Raw HTML does not contain the prerendered route marker.`);
  assert(raw.preCodeCount > 0, `${scenario.id}: Raw HTML must preserve at least one pre/code fallback (${JSON.stringify(raw)}).`);
  assert(raw.xCodeCount === 0, `${scenario.id}: Raw HTML must not eagerly emit x-code (${JSON.stringify(raw)}).`);

  const sessionId = await createSession(driverUrl, scenario);
  try {
    await request(driverUrl, `/session/${sessionId}/goog/cdp/execute`, 'POST', {
      cmd: 'Page.addScriptToEvaluateOnNewDocument',
      params: {
        source: `
          (() => {
            const state = {
              schema: 'xtend.docs.ssr-code-enhancement-input-probe.v1',
              pointerdown: 0,
              keydown: 0,
              hydrationEvents: []
            };
            window.__xtendDocsSsrCodeEnhancementInputProbe = state;
            window.addEventListener('pointerdown', () => { state.pointerdown += 1; }, true);
            window.addEventListener('keydown', () => { state.keydown += 1; }, true);
            window.addEventListener('xtend-docs-code-hydrated', (event) => {
              state.hydrationEvents.push(event?.detail || null);
            });
          })();
        `
      }
    });
    await request(driverUrl, `/session/${sessionId}/url`, 'POST', {
      url: `${baseUrl}${route}`
    });
    const result = await waitUntil(async () => execute(driverUrl, sessionId, `${deepQuerySource}
      const content = deepQuery('#md-content');
      if (!content) return null;
      const codeBlocks = Array.from(content.querySelectorAll('x-code'));
      const remainingFences = content.querySelectorAll('pre > code').length;
      const blocks = codeBlocks.map((block) => {
        const renderedCode = block.shadowRoot?.querySelector('pre > code') || null;
        const snapshot = typeof block.snapshot === 'function' ? block.snapshot() : null;
        return {
          shadowRoot: Boolean(block.shadowRoot),
          copyButton: Boolean(block.shadowRoot?.querySelector('.copy-btn')),
          highlightEngine: renderedCode?.getAttribute('data-x-code-highlight-engine') || '',
          highlighted: snapshot?.highlighted === true,
          language: snapshot?.highlightLanguage || '',
          tokenCount: renderedCode?.querySelectorAll('.token').length || 0
        };
      });
      const hydration = window.xtendDocsLastCodeHydration || null;
      const inputProbe = window.__xtendDocsSsrCodeEnhancementInputProbe || null;
      const routeAdoption = window.xstate?.get?.('xtend.router.routeAdoption') || null;
      const pagePayloadRequests = performance.getEntriesByType('resource')
        .filter((entry) => entry.name.includes('xtend-docs-page='))
        .map((entry) => entry.name);
      const ready = location.pathname === arguments[0]
        && content.getAttribute('data-docs-code-enhancement') === 'idle-committed'
        && content.getAttribute('data-docs-code-enhancement-trigger') === 'idle'
        && codeBlocks.length === arguments[1]
        && remainingFences === 0
        && hydration?.count === arguments[1]
        && hydration?.hydrated === arguments[1]
        && blocks.every((block) => block.shadowRoot && block.copyButton && block.highlightEngine === 'prism' && block.highlighted);
      return ready ? {
        path: location.pathname,
        enhancement: content.getAttribute('data-docs-code-enhancement') || '',
        trigger: content.getAttribute('data-docs-code-enhancement-trigger') || '',
        upgraded: Number(content.getAttribute('data-docs-code-fence-upgraded') || 0),
        codeBlockCount: codeBlocks.length,
        remainingFenceCount: remainingFences,
        blocks,
        hydration,
        inputProbe,
        routeAdoption,
        pagePayloadRequests
      } : null;
    `, [route, raw.preCodeCount]), `${scenario.id}: SSR code fences did not upgrade automatically in the idle lane`);
    assert(result.inputProbe?.pointerdown === 0 && result.inputProbe?.keydown === 0, `${scenario.id}: code enhancement required user input (${JSON.stringify(result.inputProbe)}).`);
    assert(result.upgraded === raw.preCodeCount && result.codeBlockCount === raw.preCodeCount && result.remainingFenceCount === 0, `${scenario.id}: code fence replacement is incomplete (${JSON.stringify(result)}).`);
    assert(result.blocks.every((block) => block.shadowRoot && block.copyButton && block.highlightEngine === 'prism' && block.highlighted), `${scenario.id}: x-code shadow/copy/Prism hydration is incomplete (${JSON.stringify(result.blocks)}).`);
    assert(result.hydration?.schema === 'xtend.docs.code-hydration.v1' && result.hydration.count === raw.preCodeCount && result.hydration.hydrated === raw.preCodeCount, `${scenario.id}: code hydration diagnostic is incomplete (${JSON.stringify(result.hydration)}).`);
    assert(result.routeAdoption?.adopted === true && result.pagePayloadRequests.length === 0, `${scenario.id}: initial route did not stay on the SSR-adoption path (${JSON.stringify({ routeAdoption: result.routeAdoption, pagePayloadRequests: result.pagePayloadRequests })}).`);

    await navigateHomeViaLogo(driverUrl, sessionId, scenario);
    const csrMarkerCleanup = await waitUntil(async () => execute(driverUrl, sessionId, `${deepQuerySource}
      const content = deepQuery('#md-content');
      if (!content || !location.pathname.endsWith('/docs/de/readme')) return null;
      const result = {
        enhancement: content.getAttribute('data-docs-code-enhancement') || '',
        trigger: content.getAttribute('data-docs-code-enhancement-trigger'),
        upgraded: content.getAttribute('data-docs-code-fence-upgraded'),
        xCodeCount: content.querySelectorAll('x-code').length,
        preCodeCount: content.querySelectorAll('pre > code').length
      };
      return result.enhancement === 'not-needed' && result.trigger === null && result.upgraded === '0'
        ? result
        : null;
    `), `${scenario.id}: CSR navigation retained stale SSR code-enhancement markers`);
    const finalInputProbe = await execute(driverUrl, sessionId, `
      return window.__xtendDocsSsrCodeEnhancementInputProbe || null;
    `);
    assert(finalInputProbe?.pointerdown === 0 && finalInputProbe?.keydown === 0, `${scenario.id}: browser gate dispatched pointer/keyboard input (${JSON.stringify(finalInputProbe)}).`);
    const logs = await request(driverUrl, `/session/${sessionId}/log`, 'POST', { type: 'browser' }).catch(() => []);
    const severe = (Array.isArray(logs) ? logs : []).filter((entry) => String(entry.level || '').toUpperCase() === 'SEVERE');
    assert(severe.length === 0, `${scenario.id}: severe console errors: ${JSON.stringify(severe)}`);
    await writeFile(path.join(evidenceDir, `${scenario.id}.json`), `${JSON.stringify({
      scenario,
      raw,
      result,
      csrMarkerCleanup,
      finalInputProbe,
      logs
    }, null, 2)}\n`);
  } finally {
    await request(driverUrl, `/session/${sessionId}`, 'DELETE').catch(() => {});
  }
}

async function runSsrProofFallbackRegression(baseUrl, driverUrl, proofCase) {
  const scenario = {
    id: `de-ssr-proof-${proofCase.kind}`,
    locale: 'de',
    width: 1280,
    height: 800,
    ...proofCase
  };
  const sessionId = await createSession(driverUrl, scenario);
  try {
    await installSsrProofTamper(driverUrl, sessionId, scenario.kind);
    await installLayoutShiftProbe(driverUrl, sessionId);
    await request(driverUrl, `/session/${sessionId}/url`, 'POST', {
      url: `${baseUrl}/docs/${scenario.locale}/readme`
    });
    await verifyLayoutShiftProbe(driverUrl, sessionId);
    const result = await waitUntil(async () => {
      const snapshot = await readSnapshot(driverUrl, sessionId);
      const tamper = await execute(driverUrl, sessionId, `return window.__xtendDocsSsrProofTamper || null;`);
      const candidateCount = await execute(driverUrl, sessionId, `return document.querySelectorAll('[data-xrouter-prerendered-route]').length;`);
      return tamper?.applied && snapshot.docsPageReady && snapshot.docsPageCount === 1 &&
        snapshot.currentPath === `/docs/${scenario.locale}/readme` && snapshot.articleTitle === 'XTend Developer Center' &&
        snapshot.routeAdoption?.adopted === false && snapshot.routeAdoption?.reason === scenario.expectedReason &&
        snapshot.initialPagePayloadRequests.length >= 1 && candidateCount === 0
        ? { snapshot, tamper, candidateCount }
        : null;
    }, `${scenario.id}: rejected SSR proof did not complete the controlled CSR fallback`);
    assert(result.snapshot.routeId === 'docs.readme', `${scenario.id}: fallback committed the wrong route (${result.snapshot.routeId}).`);
    assert(result.snapshot.docsPageLocale === scenario.locale && result.snapshot.currentLocale === scenario.locale, `${scenario.id}: fallback lost locale ownership.`);
    assert(result.snapshot.initialPagePayloadRequests.every((url) => url.includes('xtend-docs-page=readme')), `${scenario.id}: fallback requested an unrelated page (${JSON.stringify(result.snapshot.initialPagePayloadRequests)}).`);
    assertSingleCurrentArticle(result.snapshot, scenario.id);
    const logs = await request(driverUrl, `/session/${sessionId}/log`, 'POST', { type: 'browser' }).catch(() => []);
    const severe = (Array.isArray(logs) ? logs : []).filter((entry) => String(entry.level || '').toUpperCase() === 'SEVERE');
    assert(severe.length === 0, `${scenario.id}: severe console errors: ${JSON.stringify(severe)}`);
    await writeFile(path.join(evidenceDir, `${scenario.id}.json`), `${JSON.stringify({ scenario, ...result, logs }, null, 2)}\n`);
  } finally {
    await request(driverUrl, `/session/${sessionId}`, 'DELETE').catch(() => {});
  }
}

async function runMaracaRouteRegression(baseUrl, driverUrl) {
  const scenario = { id: 'de-maraca-regression', locale: 'de', theme: 'light', width: 1440, height: 900 };
  const sessionId = await createSession(driverUrl, scenario);
  try {
    await installLayoutShiftProbe(driverUrl, sessionId);
    await request(driverUrl, `/session/${sessionId}/goog/cdp/execute`, 'POST', {
      cmd: 'Page.addScriptToEvaluateOnNewDocument',
      params: {
        source: `
          (() => {
            const state = { longTasks: [], skeletonEvents: [] };
            window.__docsMaracaRegression = state;
            try {
              new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => state.longTasks.push({
                  startTime: entry.startTime,
                  duration: entry.duration
                }));
              }).observe({ type: 'longtask', buffered: true });
            } catch (_) {}
            ['xrouter-skeleton-shown', 'xrouter-skeleton-hidden'].forEach((type) => {
              window.addEventListener(type, () => state.skeletonEvents.push({ type, at: performance.now() }));
            });
          })();
        `
      }
    });
    await request(driverUrl, `/session/${sessionId}/url`, 'POST', {
      url: `${baseUrl}/docs/de/xtend-maraca`
    });
    await verifyLayoutShiftProbe(driverUrl, sessionId);
    await waitUntil(async () => {
      const snapshot = await readSnapshot(driverUrl, sessionId);
      return snapshot.docsPageReady && snapshot.articleTitle === 'XTend Maraca' ? snapshot : null;
    }, 'Maraca regression route did not become ready');
    const result = await waitUntil(async () => execute(driverUrl, sessionId, `
      const state = window.__docsMaracaRegression || { longTasks: [], skeletonEvents: [] };
      const skeletons = [];
      const collectSkeletons = (root) => {
        root.querySelectorAll('*').forEach((node) => {
          if (node.hasAttribute && node.hasAttribute('data-xtend-skeleton-loader')) skeletons.push(node);
          if (node.shadowRoot) collectSkeletons(node.shadowRoot);
        });
      };
      collectSkeletons(document);
      const hidden = state.skeletonEvents.find((entry) => entry.type === 'xrouter-skeleton-hidden');
      const routeAdoption = window.__xtendDocsLayoutShiftProbe?.routeAdoption || window.xstate?.get?.('xtend.router.routeAdoption') || null;
      if (!hidden && routeAdoption?.adopted !== true) return null;
      const menuSnapshots = Array.from(document.querySelectorAll('x-menu'))
        .map((menu) => typeof menu.snapshotPerformance === 'function' ? menu.snapshotPerformance() : null)
        .filter(Boolean);
      return {
        schema: 'xtend.docs.maraca-route-regression.v1',
        maxLongTaskMs: Math.max(0, ...state.longTasks.map((entry) => Number(entry.duration || 0))),
        longTasks: state.longTasks,
        skeletonEvents: state.skeletonEvents,
        routeAdoption,
        activeSkeletonCount: skeletons.filter((entry) => {
          const style = getComputedStyle(entry);
          return entry.isConnected && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0;
        }).length,
        menuCount: menuSnapshots.length,
        menuSnapshots,
        stateWrites: window.xstate?.snapshotDiagnostics?.().operationCounts?.set || 0,
        layoutShift: Number(window.__xtendDocsLayoutShiftProbe?.maxSessionValue || 0),
        layoutShiftTotal: Number(window.__xtendDocsLayoutShiftProbe?.totalValue || 0),
        layoutShiftEntries: Array.isArray(window.__xtendDocsLayoutShiftProbe?.entries)
          ? window.__xtendDocsLayoutShiftProbe.entries
          : []
      };
    `), 'Maraca regression route did not clear its router skeleton');
    assert(result.menuCount >= 2, 'Maraca regression route did not materialize its task navigation menus.');
    assert(result.activeSkeletonCount === 0, `Maraca regression route left ${result.activeSkeletonCount} active skeleton layers.`);
    assert(result.maxLongTaskMs <= 1000, `Maraca regression route produced a ${result.maxLongTaskMs}ms long task.`);
    assert(result.layoutShift <= 0.01, `Maraca regression route produced CLS ${result.layoutShift}: ${JSON.stringify(result.layoutShiftEntries)}`);
    const logs = await request(driverUrl, `/session/${sessionId}/log`, 'POST', { type: 'browser' }).catch(() => []);
    const severe = (Array.isArray(logs) ? logs : []).filter((entry) => String(entry.level || '').toUpperCase() === 'SEVERE');
    assert(severe.length === 0, `Maraca regression route emitted severe console errors: ${JSON.stringify(severe)}`);
    await writeFile(path.join(evidenceDir, 'de-maraca-regression.json'), `${JSON.stringify({ scenario, result, logs }, null, 2)}\n`);
    return result;
  } finally {
    await request(driverUrl, `/session/${sessionId}`, 'DELETE').catch(() => {});
  }
}

async function runInitialRouteLayoutStability(baseUrl, driverUrl, scenario) {
  const sessionId = await createSession(driverUrl, scenario);
  try {
    await installLayoutShiftProbe(driverUrl, sessionId);
    await request(driverUrl, `/session/${sessionId}/url`, 'POST', {
      url: `${baseUrl}/docs/${scenario.locale}/${scenario.slug}`
    });
    await verifyLayoutShiftProbe(driverUrl, sessionId);
    await waitUntil(async () => {
      const snapshot = await readSnapshot(driverUrl, sessionId);
      return snapshot.docsPageReady && snapshot.articleTitle
        && snapshot.summaryIndicators.length > 0
        && snapshot.summaryIndicators.every((indicator) => indicator.ariaExpanded !== '')
        ? snapshot
        : null;
    }, `${scenario.id}: direct route did not become ready`);
    await delay(scenario.settleMs || 600);
    const snapshot = await readSnapshot(driverUrl, sessionId);
    if (scenario.expectedArticleTitle) {
      assert(snapshot.articleTitle === scenario.expectedArticleTitle, `${scenario.id}: expected article title ${scenario.expectedArticleTitle}, received ${snapshot.articleTitle}.`);
    }
    const visibleSkeletonDetails = await execute(driverUrl, sessionId, `
      const skeletons = [];
      const collect = (root) => {
        root.querySelectorAll('*').forEach((node) => {
          if (node.hasAttribute && node.hasAttribute('data-xtend-skeleton-loader')) skeletons.push(node);
          if (node.shadowRoot) collect(node.shadowRoot);
        });
      };
      collect(document);
      return skeletons.filter((entry) => {
        const style = getComputedStyle(entry);
        return entry.isConnected && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0;
      }).map((entry) => ({
        source: entry.getAttribute('data-xtend-skeleton-source'),
        parentTag: entry.parentElement && entry.parentElement.localName,
        surfaceId: entry.parentElement && entry.parentElement.getAttribute('surface-id'),
        loadingError: entry.parentElement && entry.parentElement.getAttribute('data-xtend-surface-loading-error')
      }));
    `);
    const visibleSkeletonCount = visibleSkeletonDetails.length;
    const playgroundSkeletonCount = scenario.inspectPlaygroundSkeleton
      ? await execute(driverUrl, sessionId, `${deepQuerySource}
        const playground = deepQuery('[data-rmt-playground-root]');
        return playground ? playground.querySelectorAll('[data-xtend-skeleton-loader]').length : -1;
      `)
      : null;
    const playgroundLoadingSnapshot = scenario.inspectPlaygroundSkeleton
      ? await execute(driverUrl, sessionId, `${deepQuerySource}
        const manager = deepQuery('[data-rmt-playground-manager]');
        return manager && manager.loadingSnapshot || null;
      `)
      : null;
    const largestShifts = snapshot.layoutShiftEntries
      .slice()
      .sort((left, right) => right.value - left.value)
      .slice(0, 8);
    assert(snapshot.layoutShift <= 0.01, `${scenario.id}: CLS ${snapshot.layoutShift} exceeds 0.01 (${JSON.stringify(largestShifts)}).`);
    if (scenario.expectedBrandPresentation) {
      assert(snapshot.headerBrand && snapshot.headerBrand.presentation === scenario.expectedBrandPresentation, `${scenario.id}: unexpected header brand presentation (${JSON.stringify(snapshot.headerBrand)}).`);
      if (scenario.expectedBrandPresentation === 'logo-only') {
        assert(snapshot.headerBrand.logoOnlyAttribute && snapshot.headerBrand.titleAriaHidden === null && snapshot.headerBrand.titlePosition === 'absolute', `${scenario.id}: compact brand did not preserve an accessible visually hidden title (${JSON.stringify(snapshot.headerBrand)}).`);
      }
    }
    const expandedIndicators = snapshot.summaryIndicators.filter((indicator) => indicator.open);
    const collapsedIndicators = snapshot.summaryIndicators.filter((indicator) => !indicator.open);
    assert(expandedIndicators.length > 0 && expandedIndicators.every((indicator) => indicator.ariaExpanded === 'true' && indicator.rotationDegrees === 180), `${scenario.id}: expanded navigation indicators do not point upward (${JSON.stringify(snapshot.summaryIndicators)}).`);
    assert(collapsedIndicators.length > 0 && collapsedIndicators.every((indicator) => indicator.ariaExpanded === 'false' && indicator.rotationDegrees === 0), `${scenario.id}: collapsed navigation indicators do not point downward (${JSON.stringify(snapshot.summaryIndicators)}).`);
    assertSingleCurrentArticle(snapshot, scenario.id);
    const minimumRegionGap = scenario.width <= 700 ? 15 : 23;
    assert(snapshot.regionGeometry && snapshot.regionGeometry.heroMainGap >= minimumRegionGap, `${scenario.id}: hero and route regions are visually collapsed (${JSON.stringify(snapshot.regionGeometry)}).`);
    if (scenario.width > 700 && !scenario.ownsRouteWorkspace) {
      assert(snapshot.regionGeometry.articleSidebarGap >= 15 && snapshot.regionGeometry.articleSidebarTopDelta <= 1, `${scenario.id}: article and sidebar geometry is not aligned (${JSON.stringify(snapshot.regionGeometry)}).`);
    }
    assert(visibleSkeletonCount === 0, `${scenario.id}: ${visibleSkeletonCount} visible skeleton layers remained after settle (${JSON.stringify({ visibleSkeletonDetails, playgroundLoadingSnapshot })}).`);
    if (scenario.inspectPlaygroundSkeleton) {
      assert(playgroundSkeletonCount === 0, `${scenario.id}: the RMT Playground retained ${playgroundSkeletonCount} route skeleton artifacts inside its managed surfaces.`);
    }
    const navigationSurface = scenario.inspectNavigation
      ? await exerciseNavigationSurface(driverUrl, sessionId, scenario.id)
      : null;
    if (navigationSurface) {
      assert(navigationSurface.currentPageCount === 1 && navigationSurface.currentPageSection && navigationSurface.currentPageSectionOpen, `${scenario.id}: current page is not uniquely marked inside its expanded section (${JSON.stringify(navigationSurface)}).`);
      if (scenario.expectedSection) {
        assert(navigationSurface.currentPageSection === scenario.expectedSection, `${scenario.id}: expected active section ${scenario.expectedSection}, received ${navigationSurface.currentPageSection}.`);
      }
      assert(navigationSurface.columnCount === 2 && navigationSurface.columnsSideBySide && navigationSurface.sectionOrderPreserved && navigationSurface.minInternalColumnGap >= 7 && navigationSurface.maxInternalColumnGap <= 9, `${scenario.id}: navigation sections do not flow independently within two stable columns (${JSON.stringify(navigationSurface.columnGeometry)}).`);
    }
    const logs = await request(driverUrl, `/session/${sessionId}/log`, 'POST', { type: 'browser' }).catch(() => []);
    const severe = (Array.isArray(logs) ? logs : []).filter((entry) => String(entry.level || '').toUpperCase() === 'SEVERE');
    assert(severe.length === 0, `${scenario.id}: severe console errors: ${JSON.stringify(severe)}`);
    const evidence = { scenario, snapshot, visibleSkeletonCount, visibleSkeletonDetails, playgroundSkeletonCount, playgroundLoadingSnapshot, navigationSurface, logs };
    const screenshot = await request(driverUrl, `/session/${sessionId}/screenshot`);
    await Promise.all([
      writeFile(path.join(evidenceDir, `${scenario.id}.json`), `${JSON.stringify(evidence, null, 2)}\n`),
      writeFile(path.join(evidenceDir, `${scenario.id}.png`), Buffer.from(String(screenshot || ''), 'base64'))
    ]);
    return evidence;
  } finally {
    await request(driverUrl, `/session/${sessionId}`, 'DELETE').catch(() => {});
  }
}

async function runScenario(baseUrl, driverUrl, scenario, performanceBaseline) {
  const sessionId = await createSession(driverUrl, scenario);
  try {
    await installLayoutShiftProbe(driverUrl, sessionId);
    await request(driverUrl, `/session/${sessionId}/url`, 'POST', {
      url: `${baseUrl}/docs/${scenario.locale}/readme`
    });
    await verifyLayoutShiftProbe(driverUrl, sessionId);
    const initial = await waitUntil(async () => {
      const snapshot = await readSnapshot(driverUrl, sessionId);
      return snapshot.shellSchema && snapshot.docsPageReady && snapshot.articleTitle && snapshot.routeId && snapshot.routeDocumentTitle &&
        snapshot.summaryIndicators.length > 0 && snapshot.summaryIndicators.every((indicator) => indicator.ariaExpanded !== '') &&
        (snapshot.prehydrationSchema !== 'xtend.docs.php-ssr-prehydration.v2' || snapshot.routeAdoption) &&
        Number.isFinite(snapshot.performance && snapshot.performance.fcpMs) &&
        Number.isFinite(snapshot.performance && snapshot.performance.responseEndMs)
        ? snapshot
        : null;
    }, `${scenario.id}: Docs shell did not hydrate`);
    const documentationTitle = scenario.locale === 'en' ? 'XTend Documentation' : 'XTend Dokumentation';
    const expectedHomeTitle = `XTend Developer Center | ${documentationTitle}`;
    const expectedLead = scenario.locale === 'en' ? 'Welcome to the XTend Developer Center' : 'Willkommen im XTend Developer Center';
    const expectedSearchPlaceholder = scenario.locale === 'en' ? 'Search documentation' : 'Dokumentation durchsuchen';
    assert(initial.shellSchema === 'xtend.docs.shell-runtime.v1', `${scenario.id}: AppRuntime shell is missing.`);
    assert(
      initial.documentTitle === expectedHomeTitle && initial.routeDocumentTitle === expectedHomeTitle,
      `${scenario.id}: document title does not match the active route (${JSON.stringify({ expectedHomeTitle, documentTitle: initial.documentTitle, routeDocumentTitle: initial.routeDocumentTitle, routeId: initial.routeId })}).`
    );
    assert(initial.htmlLang === scenario.locale && initial.currentLocale === scenario.locale && initial.docsPageLocale === scenario.locale, `${scenario.id}: locale ownership diverged between URL, document and route.`);
    assert(initial.routeId !== 'docs.notFound' && initial.articleText.includes(expectedLead), `${scenario.id}: valid start route fell through to not-found or the wrong locale.`);
    assert(initial.searchPlaceholder === expectedSearchPlaceholder && initial.homeHref.endsWith(`/docs/${scenario.locale}/readme`), `${scenario.id}: localized shell controls are stale.`);
    const expectedBrandPresentation = scenario.width <= 500 ? 'logo-only' : 'logo-title';
    assert(initial.headerBrand && initial.headerBrand.presentation === expectedBrandPresentation, `${scenario.id}: responsive header brand is stale (${JSON.stringify(initial.headerBrand)}).`);
    const minimumSearchWidth = scenario.width > 1100 ? 640 : Math.min(320, scenario.width - 60);
    assert(initial.searchGeometry && initial.searchGeometry.width >= minimumSearchWidth, `${scenario.id}: search bar is too narrow (${JSON.stringify(initial.searchGeometry)}).`);
    assert(initial.searchGeometry.centerDelta <= 4, `${scenario.id}: search bar is not centered (${JSON.stringify(initial.searchGeometry)}).`);
    assert(initial.devApiDetected && initial.devApiMethods.length === 5, `${scenario.id}: DEV API contract is incomplete.`);
    assert(initial.hydrationSnapshot.status === 'ready', `${scenario.id}: hydration snapshot is not ready.`);
    assert(initial.kernelSnapshot.state === 'none', `${scenario.id}: unexpected kernel panic state ${JSON.stringify(initial.kernelSnapshot)}.`);
    assert(initial.trunkCount === 6 && initial.canonicalEntryCount >= 166, `${scenario.id}: navigation inventory is incomplete (${JSON.stringify({ trunkCount: initial.trunkCount, canonicalEntryCount: initial.canonicalEntryCount })}).`);
    assert(initial.activeTrunk === 'start' && initial.activeTrunkContent === 'start', `${scenario.id}: start trunk is not active.`);
    assertSingleCurrentArticle(initial, scenario.id);
    assert(initial.skeletonProfiles.includes('docs-article') && initial.skeletonProfiles.includes('docs-navigation') && initial.skeletonProfiles.includes('docs-search'), `${scenario.id}: docs skeleton profiles are missing.`);
    if (initial.prehydrationSchema === 'xtend.docs.php-ssr-prehydration.v2') {
      assert(initial.bootSkeleton?.found && !initial.bootSkeleton.visibleBeforeDefinition && initial.bootSkeleton.hiddenAfterDefinition, `${scenario.id}: document SSR boot skeleton was visible (${JSON.stringify(initial.bootSkeleton)}).`);
      assert(initial.prerenderedRoute?.foundBeforeDefinition && initial.prerenderedRoute.sameNodeAfterDefinition && initial.prerenderedRoute.adopted, `${scenario.id}: prerendered route node identity was not preserved (${JSON.stringify({ prerenderedRoute: initial.prerenderedRoute, routeAdoption: initial.routeAdoption, requests: initial.initialPagePayloadRequests })}).`);
      assert(initial.routeAdoption?.adopted === true && initial.initialPagePayloadRequests.length === 0, `${scenario.id}: document SSR adoption fell back to an initial page fetch (${JSON.stringify({ adoption: initial.routeAdoption, requests: initial.initialPagePayloadRequests })}).`);
    } else {
      assert(initial.bootSkeleton?.found && initial.bootSkeleton.visibleBeforeDefinition && initial.bootSkeleton.hiddenAfterDefinition, `${scenario.id}: server boot skeleton did not bridge the XRouter definition boundary (${JSON.stringify(initial.bootSkeleton)}).`);
    }
    assert(initial.compactLoaded && !initial.fulltextLoaded, `${scenario.id}: fulltext index entered the initial path.`);
    assert(initial.relatedLinks.length >= 3 && initial.relatedLinks.length <= 7, `${scenario.id}: Read Further did not resolve to three through seven links (${JSON.stringify(initial.relatedLinks)}).`);
    assert(new Set(initial.relatedLinks.map((entry) => entry.href)).size === initial.relatedLinks.length, `${scenario.id}: Read Further contains duplicate targets.`);
    assert(
      initial.relatedLayout?.headingVisible
      && initial.relatedLayout.display === 'grid'
      && initial.relatedLayout.rowGap >= 7.9
      && initial.relatedLayout.minAdjacentGap >= 7.9,
      `${scenario.id}: Read Further spacing or heading regressed (${JSON.stringify(initial.relatedLayout)}).`
    );
    const maximumRecommendationLongTask = Math.max(0, ...initial.recommendationLongTasks.map((entry) => Number(entry.duration || 0)));
    assert(initial.recommendationSnapshot && initial.recommendationSnapshot.source === 'compact-search-index' && maximumRecommendationLongTask <= 50, `${scenario.id}: compact recommendations produced a long task over 50ms or fell back (${JSON.stringify({ recommendation: initial.recommendationSnapshot, longTasks: initial.recommendationLongTasks })}).`);
    assert(initial.remoteResourceCount === 0, `${scenario.id}: remote resources were requested.`);
    const largestInitialShifts = initial.layoutShiftEntries
      .slice()
      .sort((left, right) => right.value - left.value)
      .slice(0, 8);
    assert(initial.layoutShift <= 0.01, `${scenario.id}: CLS ${initial.layoutShift} exceeds 0.01 (${JSON.stringify({ total: initial.layoutShiftTotal, entries: largestInitialShifts, geometry: initial.layoutShiftGeometry })}).`);
    const minimumRegionGap = scenario.width <= 700 ? 15 : 23;
    assert(initial.regionGeometry && initial.regionGeometry.heroMainGap >= minimumRegionGap, `${scenario.id}: hero and route regions are visually collapsed (${JSON.stringify(initial.regionGeometry)}).`);
    if (scenario.width > 700) {
      assert(initial.regionGeometry.articleSidebarGap >= 15 && initial.regionGeometry.articleSidebarTopDelta <= 1, `${scenario.id}: article and sidebar geometry is not aligned (${JSON.stringify(initial.regionGeometry)}).`);
    }
    assert(initial.overflowX <= 1, `${scenario.id}: viewport overflows by ${initial.overflowX}px.`);
    const baseline = performanceBaseline && performanceBaseline.scenarios && performanceBaseline.scenarios[scenario.id];
    assert(baseline, `${scenario.id}: performance baseline is missing.`);
    const regressionLimit = 1 + Number(performanceBaseline.regressionLimit || 0.05);
    const baselineResponseEndMs = baseline.responseEndMs !== null && baseline.responseEndMs !== undefined && Number.isFinite(Number(baseline.responseEndMs))
      ? Number(baseline.responseEndMs)
      : medianMetric(baseline.samples, 'responseEndMs');
    assert(Number.isFinite(baselineResponseEndMs) && baselineResponseEndMs > 0, `${scenario.id}: response-end performance baseline is missing.`);
    assert(initial.performance.fcpMs <= baseline.fcpMs * regressionLimit, `${scenario.id}: FCP ${initial.performance.fcpMs}ms exceeds baseline ${baseline.fcpMs}ms by more than 5%.`);
    assert(initial.performance.responseEndMs <= baselineResponseEndMs * regressionLimit, `${scenario.id}: response end ${initial.performance.responseEndMs}ms exceeds median baseline ${baselineResponseEndMs}ms by more than 5%.`);
    assert(initial.performance.initialEncodedBodyBytes <= baseline.initialEncodedBodyBytes * regressionLimit, `${scenario.id}: initial encoded bytes ${initial.performance.initialEncodedBodyBytes} exceed baseline ${baseline.initialEncodedBodyBytes} by more than 5%.`);
    const activeTheme = await applyTheme(driverUrl, sessionId, scenario.theme);
    assert(activeTheme.theme === scenario.theme, `${scenario.id}: expected ${scenario.theme} theme.`);
    assert(activeTheme.buttonPressed === (scenario.theme === 'dark' ? 'true' : 'false'), `${scenario.id}: theme toggle state is not synchronized.`);
    const navigationSurface = await exerciseNavigationSurface(driverUrl, sessionId, scenario.id);
    const navigationAppearances = [navigationSurface.activeTrunk, navigationSurface.inactiveTrunk, navigationSurface.activePage, navigationSurface.inactivePage];
    assert(navigationSurface.trunkCount === 6 && navigationAppearances.every((entry) => entry && entry.contrast >= 4.5), `${scenario.id}: task navigation contrast is insufficient (${JSON.stringify(navigationSurface)}).`);
    assert(navigationSurface.horizontalOverflow <= 1 && !navigationSurface.inactiveUsesPrimarySurface, `${scenario.id}: task navigation overflows or inherited the global primary menuitem surface (${JSON.stringify(navigationSurface)}).`);
    assert(navigationSurface.activeTrunk.background !== navigationSurface.inactiveTrunk.background && navigationSurface.activePage.background !== navigationSurface.inactivePage.background, `${scenario.id}: active navigation states are not visually distinguishable (${JSON.stringify(navigationSurface)}).`);
    assert(navigationSurface.currentPageCount === 1 && navigationSurface.currentPageSection && navigationSurface.currentPageSectionOpen, `${scenario.id}: current page is not uniquely marked inside its expanded section (${JSON.stringify(navigationSurface)}).`);
    assert(navigationSurface.columnCount === 2 && navigationSurface.sectionOrderPreserved && navigationSurface.minInternalColumnGap >= 7 && navigationSurface.maxInternalColumnGap <= 9, `${scenario.id}: navigation sections do not keep a stable order-preserving per-column rhythm (${JSON.stringify(navigationSurface.columnGeometry)}).`);
    assert(scenario.width <= 700 ? navigationSurface.columnsStacked : navigationSurface.columnsSideBySide, `${scenario.id}: navigation columns do not match the responsive layout (${JSON.stringify(navigationSurface.columnGeometry)}).`);
    assert([navigationSurface.activeTrunk, navigationSurface.activePage].every((entry) => entry.internalBoxShadow === 'none' && entry.internalTextDecoration === 'none'), `${scenario.id}: x-link rendered a second active indicator inside the navigation label (${JSON.stringify(navigationSurface)}).`);
    const skeletonHardening = await exerciseSkeletonHardening(driverUrl, sessionId);
    assert(skeletonHardening && skeletonHardening.visualRecordCount >= 1, `${scenario.id}: invalid SkeletonLoader input produced no visual records.`);
    assert(skeletonHardening.visibleRecordCount === skeletonHardening.visualRecordCount, `${scenario.id}: SkeletonLoader records have no visible geometry.`);
    assert(skeletonHardening.staleSkeletonReplaced && skeletonHardening.existingContentHidden && skeletonHardening.active, `${scenario.id}: stale SkeletonLoader recovery is incomplete.`);
    assert(skeletonHardening.layoutMode === 'overlay' && skeletonHardening.layoutModeCleared && skeletonHardening.retainedOverlayHidden && skeletonHardening.heightDelta <= 0.5, `${scenario.id}: SkeletonLoader changed committed target geometry (${JSON.stringify(skeletonHardening)}).`);

    const search = await runSearch(driverUrl, sessionId, scenario.locale === 'de' ? 'hydratoin' : 'hydration');
    assert(search.count <= 8, `${scenario.id}: search returned more than eight results.`);
    assert(search.slugs.includes('hydration-policies'), `${scenario.id}: typo/keyword search missed hydration-policies.`);
    assert(search.worker && search.worker.resourceCache === true && search.worker.cachedResourceCount >= 1, `${scenario.id}: search worker did not retain its compact index.`);
    assert(search.presentation.textContrast >= 4.5 && search.presentation.scoreContrast >= 4.5, `${scenario.id}: search result contrast is insufficient (${JSON.stringify(search.presentation)}).`);
    assert(search.presentation.horizontalOverflow <= 1 && search.presentation.statusHidden, `${scenario.id}: search surface overflows or exposes an empty status row (${JSON.stringify(search.presentation)}).`);
    assert(search.presentation.internalBoxShadow === 'none' && search.presentation.internalTextDecoration === 'none', `${scenario.id}: x-link rendered a second indicator inside the highlighted search result (${JSON.stringify(search.presentation)}).`);
    assert(search.presentation.maxLongTaskMs <= 120, `${scenario.id}: compact search blocked the main thread (${JSON.stringify(search.presentation.longTasks)}).`);
    const focusedResult = await focusFirstSearchResult(driverUrl, sessionId);
    assert(search.slugs.includes(focusedResult), `${scenario.id}: ArrowDown focus left the result set.`);
    const enterNavigation = await activateHighlightedSearchResult(driverUrl, sessionId);
    assert(search.slugs.includes(enterNavigation.slug), `${scenario.id}: Enter navigated outside the highlighted result set (${JSON.stringify(enterNavigation)}).`);
    assert(enterNavigation.inputSource === 'keyboard', `${scenario.id}: Enter activation was not recorded as keyboard input (${JSON.stringify(enterNavigation)}).`);
    assert(enterNavigation.selectedActive && enterNavigation.internalBoxShadow === 'none' && enterNavigation.internalTextDecoration === 'none', `${scenario.id}: active search result rendered more than one selection indicator (${JSON.stringify(enterNavigation)}).`);
    const fallbackSearch = await runSearch(driverUrl, sessionId, 'backpressure');
    assert(fallbackSearch.usedFulltext && fallbackSearch.fulltextLoaded, `${scenario.id}: sparse results did not activate fulltext fallback.`);
    assert(fallbackSearch.worker && fallbackSearch.worker.cachedResourceCount >= 2, `${scenario.id}: fulltext index was not retained by the search worker.`);
    assert(fallbackSearch.presentation.maxLongTaskMs <= 120, `${scenario.id}: fulltext search blocked the main thread (${JSON.stringify(fallbackSearch.presentation.longTasks)}).`);
    if (scenario.width <= 700) assert(navigationSurface.menuMode === 'drawer', `${scenario.id}: mobile drawer task navigation is incomplete.`);
    const navigation = await navigateTrunk(driverUrl, sessionId, 'operate');
    assert(navigation.path.includes(`/docs/${scenario.locale}/`), `${scenario.id}: trunk navigation lost locale.`);
    assert(navigation.articleTitle !== initial.articleTitle && navigation.pageCount === 1 && navigation.activeTrunkContentCount === 1, `${scenario.id}: route cleanup left duplicate page or navigation owners (${JSON.stringify(navigation)}).`);
    assert(navigation.routeId !== 'docs.notFound' && navigation.documentTitle === `${navigation.articleTitle} | ${documentationTitle}`, `${scenario.id}: trunk navigation produced a stale or duplicated title.`);
    const explicitRecommendations = await navigateArticle(driverUrl, sessionId, 'conditional-network-evidence');
    assert(explicitRecommendations.relatedLinks[0] && explicitRecommendations.relatedLinks[0].source === 'parsedown', `${scenario.id}: explicit related link lost editorial priority (${JSON.stringify(explicitRecommendations.relatedLinks)}).`);
    const genericRelatedLabels = new Set(['Verwandter Artikel', 'Related article']);
    assert(explicitRecommendations.relatedLinks.every((entry) => !genericRelatedLabels.has(entry.label)), `${scenario.id}: generic editorial label leaked into Read Further (${JSON.stringify(explicitRecommendations.relatedLinks)}).`);
    await navigateTrunk(driverUrl, sessionId, 'start');
    const aboutRecommendations = await navigateArticle(driverUrl, sessionId, 'about');
    assert(aboutRecommendations.relatedLinks.length >= 3, `${scenario.id}: localized About page did not receive the minimum recommendation set (${JSON.stringify(aboutRecommendations.relatedLinks)}).`);
    if (scenario.locale === 'en') {
      assert(aboutRecommendations.relatedLinks.some((entry) => entry.slug !== 'xtend-dev-surface'), `${scenario.id}: English About prose containing "unrelated" was misclassified as a single editorial recommendation (${JSON.stringify(aboutRecommendations.relatedLinks)}).`);
    }
    const homeNavigation = await navigateHomeViaLogo(driverUrl, sessionId, scenario);
    assert(homeNavigation.articleTitle === initial.articleTitle, `${scenario.id}: header logo did not restore the Docs start article.`);
    assert(homeNavigation.routeId !== 'docs.notFound' && homeNavigation.documentTitle === expectedHomeTitle, `${scenario.id}: home navigation did not restore the canonical title.`);
    const alternateLocale = scenario.locale === 'en' ? 'de' : 'en';
    const localeSwitch = await switchDocsLocale(driverUrl, sessionId, alternateLocale);
    const localeRestore = await switchDocsLocale(driverUrl, sessionId, scenario.locale);
    const rapidNavigationRace = await exerciseRapidNavigationRace(driverUrl, sessionId, scenario);
    const rapidNavigationHome = await navigateHomeViaLogo(driverUrl, sessionId, scenario);
    const historyNavigation = await exerciseHistoryNavigation(driverUrl, sessionId, scenario);
    const historyNavigationHome = await navigateHomeViaLogo(driverUrl, sessionId, scenario);
    const localeNavigationRace = await exerciseLocaleNavigationRace(driverUrl, sessionId, scenario);
    const localeNavigationHome = await navigateHomeViaLogo(driverUrl, sessionId, {
      ...scenario,
      locale: localeNavigationRace.targetLocale
    });
    const localeNavigationRestore = await switchDocsLocale(driverUrl, sessionId, scenario.locale);

    const finalSnapshot = await readSnapshot(driverUrl, sessionId);
    assertSingleCurrentArticle(finalSnapshot, `${scenario.id}: final`);
    assert(finalSnapshot.layoutShift <= 0.01, `${scenario.id}: cumulative interaction CLS ${finalSnapshot.layoutShift} exceeds 0.01.`);
    assert(finalSnapshot.theme === scenario.theme, `${scenario.id}: theme state changed during navigation.`);
    assert(finalSnapshot.documentTitle === expectedHomeTitle && finalSnapshot.routeId !== 'docs.notFound', `${scenario.id}: locale round-trip left a stale document title.`);
    assert(finalSnapshot.fabricSnapshot && finalSnapshot.fabricSnapshot.schema === 'xtend.fabric.telemetry-snapshot.v1' && finalSnapshot.fabricSnapshot.fiberCount > 0, `${scenario.id}: AppRuntime Fabric did not record command fibers.`);
    const logs = await request(driverUrl, `/session/${sessionId}/log`, 'POST', { type: 'browser' }).catch(() => []);
    const severe = (Array.isArray(logs) ? logs : []).filter((entry) => String(entry.level || '').toUpperCase() === 'SEVERE');
    assert(severe.length === 0, `${scenario.id}: severe console errors: ${JSON.stringify(severe)}`);
    const screenshot = await request(driverUrl, `/session/${sessionId}/screenshot`);
    await Promise.all([
      writeFile(path.join(evidenceDir, `${scenario.id}.json`), `${JSON.stringify({ scenario, initial, activeTheme, navigationSurface, skeletonHardening, search, focusedResult, enterNavigation, fallbackSearch, navigation, explicitRecommendations, aboutRecommendations, homeNavigation, localeSwitch, localeRestore, rapidNavigationRace, rapidNavigationHome, historyNavigation, historyNavigationHome, localeNavigationRace, localeNavigationHome, localeNavigationRestore, finalSnapshot, logs }, null, 2)}\n`),
      writeFile(path.join(evidenceDir, `${scenario.id}.png`), Buffer.from(String(screenshot || ''), 'base64'))
    ]);
  } finally {
    await request(driverUrl, `/session/${sessionId}`, 'DELETE').catch(() => {});
  }
}

const php = findCommand(['php']);
const chromeDriver = findCommand(['chromedriver', '/usr/bin/chromedriver']);
if (!php || !chromeDriver) {
  process.stdout.write(`Docs shell browser smoke skipped: ${!php ? 'php' : 'chromedriver'} not found\n`);
  process.exit(0);
}

await mkdir(evidenceDir, { recursive: true });
const port = await freePort();
const driverPort = await freePort();
const server = spawn(php, ['-S', `127.0.0.1:${port}`, '-t', rootDir, 'docs/dev-router.php'], {
  cwd: rootDir,
  env: { ...process.env, XTEND_DOCS_DOCUMENT_SSR: process.env.XTEND_DOCS_DOCUMENT_SSR || 'v2' },
  stdio: ['ignore', 'pipe', 'pipe']
});
const driver = spawn(chromeDriver, [`--port=${driverPort}`], {
  cwd: rootDir,
  stdio: ['ignore', 'pipe', 'pipe']
});
server.stdout.resume();
server.stderr.resume();
driver.stdout.resume();
driver.stderr.resume();

try {
  const baseUrl = `http://127.0.0.1:${port}`;
  const driverUrl = `http://127.0.0.1:${driverPort}`;
  await waitForServer(`${baseUrl}/docs/de/readme`, server);
  await waitForDriver(driverUrl, driver);
  const scenarios = [
    { id: 'de-desktop', locale: 'de', theme: 'light', width: 1440, height: 900 },
    { id: 'en-mobile', locale: 'en', theme: 'dark', width: 390, height: 844 }
  ];
  if (captureBaseline) {
    const baseline = await capturePerformanceBaseline(baseUrl, driverUrl, scenarios);
    const outputPath = path.resolve(process.env.XTEND_DOCS_BASELINE_OUT || '/tmp/docs-shell-catfooding-performance-baseline.json');
    await writeFile(outputPath, `${JSON.stringify(baseline, null, 2)}\n`);
    process.stdout.write(`Docs shell performance baseline captured: ${outputPath}\n`);
  } else {
    const performanceBaseline = JSON.parse(await readFile(baselinePath, 'utf8'));
    await assertRawDocsRouteStatuses(baseUrl);
    await runPostImportProofMutationRegression(baseUrl, driverUrl);
    await runAliasRouteRegression(baseUrl, driverUrl);
    await runSsrCodeEnhancementRegression(baseUrl, driverUrl);
    for (const proofCase of [
      { kind: 'path', expectedReason: 'path-mismatch' },
      { kind: 'hash', expectedReason: 'content-proof-mismatch' },
      { kind: 'trust', expectedReason: 'trust-proof-missing' }
    ]) {
      await runSsrProofFallbackRegression(baseUrl, driverUrl, proofCase);
    }
    await runMaracaRouteRegression(baseUrl, driverUrl);
    const directRouteScenarios = [
      { id: 'de-animation-engine-desktop', locale: 'de', slug: 'rmt-animation-engine', width: 1440, height: 900, settleMs: 1200 },
      { id: 'de-rmt-playground-desktop', locale: 'de', slug: 'learn-rmt-playground', width: 1440, height: 900, settleMs: 1200, expectedArticleTitle: 'RMT Playground', inspectPlaygroundSkeleton: true, ownsRouteWorkspace: true },
      { id: 'de-authoring-desktop', locale: 'de', slug: 'native-first-authoring-guide', width: 1440, height: 900, settleMs: 700 },
      { id: 'de-a11y-current-page-desktop', locale: 'de', slug: 'a11y-keyboard-smokes', width: 1440, height: 900, settleMs: 700, inspectNavigation: true },
      { id: 'en-dev-surface-mobile', locale: 'en', slug: 'xtend-dev-surface', width: 390, height: 844, settleMs: 700, expectedBrandPresentation: 'logo-only' },
      { id: 'de-dev-api-desktop', locale: 'de', slug: 'xtend-dev-api', width: 1440, height: 900, settleMs: 700, inspectNavigation: true, expectedArticleTitle: 'XTend DEV API', expectedSection: 'devtools' },
      { id: 'en-dev-api-mobile', locale: 'en', slug: 'xtend-dev-api', width: 390, height: 844, settleMs: 700, expectedBrandPresentation: 'logo-only', expectedArticleTitle: 'XTend DEV API' },
      { id: 'de-hydration-policies-desktop', locale: 'de', slug: 'hydration-policies', width: 1440, height: 900, settleMs: 700, inspectNavigation: true, expectedArticleTitle: 'Hydration Policies', expectedSection: 'performance' },
      { id: 'en-hydration-policies-mobile', locale: 'en', slug: 'hydration-policies', width: 390, height: 844, settleMs: 700, expectedBrandPresentation: 'logo-only', expectedArticleTitle: 'Hydration Policies' },
      { id: 'de-maraca-brand-wide', locale: 'de', slug: 'xtend-maraca', width: 593, height: 844, settleMs: 700, expectedBrandPresentation: 'logo-title' },
      { id: 'de-maraca-brand-compact', locale: 'de', slug: 'xtend-maraca', width: 500, height: 844, settleMs: 700, expectedBrandPresentation: 'logo-only' }
    ];
    for (const scenario of directRouteScenarios) {
      await runInitialRouteLayoutStability(baseUrl, driverUrl, scenario);
    }
    for (const scenario of scenarios) {
      await runScenario(baseUrl, driverUrl, scenario, performanceBaseline);
    }
  }
} finally {
  stopProcess(server);
  await fetch(`http://127.0.0.1:${driverPort}/shutdown`).catch(() => {});
  stopProcess(driver);
}

if (!captureBaseline) process.stdout.write(`Docs shell catfooding browser smoke passed. Evidence: ${path.relative(sourceRootDir, evidenceDir)}\n`);
