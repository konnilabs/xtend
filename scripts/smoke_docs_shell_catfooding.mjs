#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process';
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
        'goog:loggingPrefs': { browser: 'ALL' },
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

async function readSnapshot(baseUrl, sessionId) {
  return execute(baseUrl, sessionId, `${deepQuerySource}
    const api = window.__XTEND_DEV_API__;
    const content = deepQuery('#md-content');
    const docsPage = deepQuery('xtend-doc-page');
    const router = deepQuery('x-router');
    const routerSnapshot = router && typeof router.snapshot === 'function' ? router.snapshot() : null;
    const routeRecord = router
      ? Array.from(router.children).find((entry) => entry.localName === 'x-route' && entry.getAttribute('path') === location.pathname)
      : null;
    const header = document.querySelector('x-header');
    const headerRoot = header?.shadowRoot?.querySelector('header') || null;
    const searchHost = deepQuery('#search-input');
    const searchControl = searchHost?.shadowRoot?.querySelector('input') || searchHost;
    const headerRect = headerRoot?.getBoundingClientRect() || null;
    const searchRect = searchControl?.getBoundingClientRect() || null;
    const resources = performance.getEntriesByType('resource').map((entry) => entry.name);
    const resourceEntries = performance.getEntriesByType('resource');
    const navigation = performance.getEntriesByType('navigation')[0] || null;
    const fcp = performance.getEntriesByName('first-contentful-paint')[0] || null;
    const sameOriginResources = resourceEntries.filter((entry) => entry.name.startsWith(location.origin));
    const layoutShift = performance.getEntriesByType('layout-shift')
      .filter((entry) => !entry.hadRecentInput)
      .reduce((sum, entry) => sum + entry.value, 0);
    return {
      readyState: document.readyState,
      documentTitle: document.title,
      htmlLang: document.documentElement.lang,
      currentLocale: window.xtendDocsCurrentLocale || '',
      theme: document.documentElement.getAttribute('data-theme') || 'light',
      shellSchema: window.xtendDocsShellRuntime && window.xtendDocsShellRuntime.schema || '',
      shellSnapshot: window.xtendDocsShellRuntime && window.xtendDocsShellRuntime.snapshot(),
      devApiDetected: Boolean(api),
      devApiMethods: api ? ['getPerformanceSnapshot', 'getFabricTelemetrySnapshot', 'getKernelSnapshot', 'getHydrationSnapshot', 'subscribe'].filter((key) => typeof api[key] === 'function') : [],
      performanceSnapshot: api && api.getPerformanceSnapshot(),
      fabricSnapshot: api && api.getFabricTelemetrySnapshot(),
      kernelSnapshot: api && api.getKernelSnapshot(),
      hydrationSnapshot: api && api.getHydrationSnapshot(),
      docsPageReady: Boolean(docsPage && docsPage.getAttribute('data-docs-route-state') === 'ready'),
      docsPageLocale: docsPage && docsPage.getAttribute('data-docs-route-locale') || '',
      articleTitle: content && content.querySelector('h1') && content.querySelector('h1').textContent.trim() || '',
      articleText: content && content.textContent.trim().slice(0, 320) || '',
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
      sanitized: content && content.getAttribute('data-rmt-sanitized') || '',
      trustedDomProof: content && content.getAttribute('data-rmt-trusted-dom-proof') || '',
      activeTrunk: document.querySelector('[data-docs-menu-shell]')?.getAttribute('data-docs-active-trunk') || '',
      activeTrunkContent: document.querySelector('[data-docs-active-trunk-content]')?.getAttribute('data-docs-active-trunk-content') || '',
      trunkCount: document.querySelectorAll('[data-docs-trunk-link]').length,
      canonicalEntryCount: Array.isArray(window.xtendMenuConfig) ? window.xtendMenuConfig.length : 0,
      skeletonProfiles: window.XTendSkeletonLoader && typeof window.XTendSkeletonLoader.listProfiles === 'function'
        ? window.XTendSkeletonLoader.listProfiles().map((entry) => entry.id)
        : [],
      compactLoaded: resources.some((url) => url.includes('/docs/generated/search/') && url.includes('.compact.json')),
      fulltextLoaded: resources.some((url) => url.includes('/docs/generated/search/') && url.includes('.fulltext.json')),
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
      layoutShift,
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
    const firstStyle = first && getComputedStyle(first);
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
      scoreColor: scoreStyle?.color || ''
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
      return {
        background: style.backgroundColor,
        color: style.color,
        borderColor: style.borderColor,
        boxShadow: style.boxShadow,
        contrast: contrast(style.color, style.backgroundColor)
      };
    };
    const activeTrunk = nav.querySelector('[data-docs-trunk-link][active]');
    const inactiveTrunk = nav.querySelector('[data-docs-trunk-link]:not([active])');
    const activePage = nav.querySelector('[data-docs-menu-link][active]');
    const inactivePage = nav.querySelector('[data-docs-menu-link]:not([active])');
    const primary = channels(getComputedStyle(document.documentElement).getPropertyValue('--primary-color'));
    const inactiveBackground = channels(getComputedStyle(inactivePage).backgroundColor);
    return {
      menuMode: drawer.getAttribute('data-menu-mode'),
      trunkCount: nav.querySelectorAll('[data-docs-trunk-link]').length,
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
  return waitUntil(async () => execute(baseUrl, sessionId, `${deepQuerySource}
    const shell = document.querySelector('[data-docs-menu-shell]');
    const content = deepQuery('#md-content');
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
    return shell && shell.getAttribute('data-docs-active-trunk') === arguments[0] && content && content.querySelector('h1')
      ? {
          trunk: shell.getAttribute('data-docs-active-trunk'),
          path: location.pathname,
          articleTitle: content.querySelector('h1').textContent.trim(),
          documentTitle: document.title,
          routeId: route && route.getAttribute('data-rmt-route-id') || '',
          pageCount: pages.length,
          activeTrunkContentCount: document.querySelectorAll('[data-docs-active-trunk-content]').length
        }
      : null;
  `, [trunk]), `Trunk ${trunk} did not become active`);
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
    target.append(content, empty);
    document.body.appendChild(target);
    const skeleton = loader.show(target, {
      profile: 'missing-edge-profile',
      variant: 'article',
      lines: 'not-a-number',
      minHeight: '8rem',
      source: 'docs-shell-browser-smoke'
    });
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
      active: target.getAttribute('data-xtend-skeleton-active') === 'true'
    };
    loader.hide(target);
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
    const shell = document.querySelector('[data-docs-menu-shell]');
    const router = deepQuery('x-router');
    const route = router ? Array.from(router.children).find((entry) => entry.localName === 'x-route' && entry.getAttribute('path') === location.pathname) : null;
    return location.pathname.endsWith('/docs/' + arguments[0] + '/readme') &&
      shell && shell.getAttribute('data-docs-active-trunk') === 'start' &&
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

async function capturePerformanceSample(baseUrl, driverUrl, scenario) {
  const sessionId = await createSession(driverUrl, scenario);
  try {
    await request(driverUrl, `/session/${sessionId}/url`, 'POST', {
      url: `${baseUrl}/docs/${scenario.locale}/readme`
    });
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

async function runMaracaRouteRegression(baseUrl, driverUrl) {
  const scenario = { id: 'de-maraca-regression', locale: 'de', theme: 'light', width: 1440, height: 900 };
  const sessionId = await createSession(driverUrl, scenario);
  try {
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
      if (!hidden) return null;
      const menuSnapshots = Array.from(document.querySelectorAll('x-menu'))
        .map((menu) => typeof menu.snapshotPerformance === 'function' ? menu.snapshotPerformance() : null)
        .filter(Boolean);
      return {
        schema: 'xtend.docs.maraca-route-regression.v1',
        maxLongTaskMs: Math.max(0, ...state.longTasks.map((entry) => Number(entry.duration || 0))),
        longTasks: state.longTasks,
        skeletonEvents: state.skeletonEvents,
        activeSkeletonCount: skeletons.filter((entry) => entry.isConnected && getComputedStyle(entry).display !== 'none').length,
        menuCount: menuSnapshots.length,
        menuSnapshots,
        stateWrites: window.xstate?.snapshotDiagnostics?.().operationCounts?.set || 0
      };
    `), 'Maraca regression route did not clear its router skeleton');
    assert(result.menuCount >= 2, 'Maraca regression route did not materialize its task navigation menus.');
    assert(result.activeSkeletonCount === 0, `Maraca regression route left ${result.activeSkeletonCount} active skeleton layers.`);
    assert(result.maxLongTaskMs <= 1000, `Maraca regression route produced a ${result.maxLongTaskMs}ms long task.`);
    const logs = await request(driverUrl, `/session/${sessionId}/log`, 'POST', { type: 'browser' }).catch(() => []);
    const severe = (Array.isArray(logs) ? logs : []).filter((entry) => String(entry.level || '').toUpperCase() === 'SEVERE');
    assert(severe.length === 0, `Maraca regression route emitted severe console errors: ${JSON.stringify(severe)}`);
    await writeFile(path.join(evidenceDir, 'de-maraca-regression.json'), `${JSON.stringify({ scenario, result, logs }, null, 2)}\n`);
    return result;
  } finally {
    await request(driverUrl, `/session/${sessionId}`, 'DELETE').catch(() => {});
  }
}

async function runScenario(baseUrl, driverUrl, scenario, performanceBaseline) {
  const sessionId = await createSession(driverUrl, scenario);
  try {
    await request(driverUrl, `/session/${sessionId}/url`, 'POST', {
      url: `${baseUrl}/docs/${scenario.locale}/readme`
    });
    const initial = await waitUntil(async () => {
      const snapshot = await readSnapshot(driverUrl, sessionId);
      return snapshot.shellSchema && snapshot.docsPageReady && snapshot.articleTitle && snapshot.routeId && snapshot.routeDocumentTitle &&
        Number.isFinite(snapshot.performance && snapshot.performance.fcpMs)
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
    const minimumSearchWidth = scenario.width > 1100 ? 640 : Math.min(320, scenario.width - 60);
    assert(initial.searchGeometry && initial.searchGeometry.width >= minimumSearchWidth, `${scenario.id}: search bar is too narrow (${JSON.stringify(initial.searchGeometry)}).`);
    assert(initial.searchGeometry.centerDelta <= 4, `${scenario.id}: search bar is not centered (${JSON.stringify(initial.searchGeometry)}).`);
    assert(initial.devApiDetected && initial.devApiMethods.length === 5, `${scenario.id}: DEV API contract is incomplete.`);
    assert(initial.hydrationSnapshot.status === 'ready', `${scenario.id}: hydration snapshot is not ready.`);
    assert(initial.kernelSnapshot.state === 'none', `${scenario.id}: unexpected kernel panic state ${JSON.stringify(initial.kernelSnapshot)}.`);
    assert(initial.trunkCount === 6 && initial.canonicalEntryCount === 165, `${scenario.id}: navigation inventory is incomplete.`);
    assert(initial.activeTrunk === 'start' && initial.activeTrunkContent === 'start', `${scenario.id}: start trunk is not active.`);
    assert(initial.skeletonProfiles.includes('docs-article') && initial.skeletonProfiles.includes('docs-navigation') && initial.skeletonProfiles.includes('docs-search'), `${scenario.id}: docs skeleton profiles are missing.`);
    assert(initial.compactLoaded && !initial.fulltextLoaded, `${scenario.id}: fulltext index entered the initial path.`);
    assert(initial.remoteResourceCount === 0, `${scenario.id}: remote resources were requested.`);
    assert(initial.layoutShift <= 0.01, `${scenario.id}: CLS ${initial.layoutShift} exceeds 0.01.`);
    assert(initial.overflowX <= 1, `${scenario.id}: viewport overflows by ${initial.overflowX}px.`);
    const baseline = performanceBaseline && performanceBaseline.scenarios && performanceBaseline.scenarios[scenario.id];
    assert(baseline, `${scenario.id}: performance baseline is missing.`);
    const regressionLimit = 1 + Number(performanceBaseline.regressionLimit || 0.05);
    assert(initial.performance.fcpMs <= baseline.fcpMs * regressionLimit, `${scenario.id}: FCP ${initial.performance.fcpMs}ms exceeds baseline ${baseline.fcpMs}ms by more than 5%.`);
    assert(initial.performance.initialEncodedBodyBytes <= baseline.initialEncodedBodyBytes * regressionLimit, `${scenario.id}: initial encoded bytes ${initial.performance.initialEncodedBodyBytes} exceed baseline ${baseline.initialEncodedBodyBytes} by more than 5%.`);
    const activeTheme = await applyTheme(driverUrl, sessionId, scenario.theme);
    assert(activeTheme.theme === scenario.theme, `${scenario.id}: expected ${scenario.theme} theme.`);
    assert(activeTheme.buttonPressed === (scenario.theme === 'dark' ? 'true' : 'false'), `${scenario.id}: theme toggle state is not synchronized.`);
    const navigationSurface = await exerciseNavigationSurface(driverUrl, sessionId, scenario.id);
    const navigationAppearances = [navigationSurface.activeTrunk, navigationSurface.inactiveTrunk, navigationSurface.activePage, navigationSurface.inactivePage];
    assert(navigationSurface.trunkCount === 6 && navigationAppearances.every((entry) => entry && entry.contrast >= 4.5), `${scenario.id}: task navigation contrast is insufficient (${JSON.stringify(navigationSurface)}).`);
    assert(navigationSurface.horizontalOverflow <= 1 && !navigationSurface.inactiveUsesPrimarySurface, `${scenario.id}: task navigation overflows or inherited the global primary menuitem surface (${JSON.stringify(navigationSurface)}).`);
    assert(navigationSurface.activeTrunk.background !== navigationSurface.inactiveTrunk.background && navigationSurface.activePage.background !== navigationSurface.inactivePage.background, `${scenario.id}: active navigation states are not visually distinguishable (${JSON.stringify(navigationSurface)}).`);
    const skeletonHardening = await exerciseSkeletonHardening(driverUrl, sessionId);
    assert(skeletonHardening && skeletonHardening.visualRecordCount >= 1, `${scenario.id}: invalid SkeletonLoader input produced no visual records.`);
    assert(skeletonHardening.visibleRecordCount === skeletonHardening.visualRecordCount, `${scenario.id}: SkeletonLoader records have no visible geometry.`);
    assert(skeletonHardening.staleSkeletonReplaced && skeletonHardening.existingContentHidden && skeletonHardening.active, `${scenario.id}: stale SkeletonLoader recovery is incomplete.`);

    const search = await runSearch(driverUrl, sessionId, scenario.locale === 'de' ? 'hydratoin' : 'hydration');
    assert(search.count <= 8, `${scenario.id}: search returned more than eight results.`);
    assert(search.slugs.includes('hydration-policies'), `${scenario.id}: typo/keyword search missed hydration-policies.`);
    assert(search.worker && search.worker.resourceCache === true && search.worker.cachedResourceCount >= 1, `${scenario.id}: search worker did not retain its compact index.`);
    assert(search.presentation.textContrast >= 4.5 && search.presentation.scoreContrast >= 4.5, `${scenario.id}: search result contrast is insufficient (${JSON.stringify(search.presentation)}).`);
    assert(search.presentation.horizontalOverflow <= 1 && search.presentation.statusHidden, `${scenario.id}: search surface overflows or exposes an empty status row (${JSON.stringify(search.presentation)}).`);
    assert(search.presentation.maxLongTaskMs <= 120, `${scenario.id}: compact search blocked the main thread (${JSON.stringify(search.presentation.longTasks)}).`);
    const focusedResult = await focusFirstSearchResult(driverUrl, sessionId);
    assert(search.slugs.includes(focusedResult), `${scenario.id}: ArrowDown focus left the result set.`);
    const fallbackSearch = await runSearch(driverUrl, sessionId, 'backpressure');
    assert(fallbackSearch.usedFulltext && fallbackSearch.fulltextLoaded, `${scenario.id}: sparse results did not activate fulltext fallback.`);
    assert(fallbackSearch.worker && fallbackSearch.worker.cachedResourceCount >= 2, `${scenario.id}: fulltext index was not retained by the search worker.`);
    assert(fallbackSearch.presentation.maxLongTaskMs <= 120, `${scenario.id}: fulltext search blocked the main thread (${JSON.stringify(fallbackSearch.presentation.longTasks)}).`);
    if (scenario.width <= 700) assert(navigationSurface.menuMode === 'drawer', `${scenario.id}: mobile drawer task navigation is incomplete.`);
    const navigation = await navigateTrunk(driverUrl, sessionId, 'operate');
    assert(navigation.path.includes(`/docs/${scenario.locale}/`), `${scenario.id}: trunk navigation lost locale.`);
    assert(navigation.articleTitle !== initial.articleTitle && navigation.pageCount === 1 && navigation.activeTrunkContentCount === 1, `${scenario.id}: route cleanup left duplicate page or navigation owners.`);
    assert(navigation.routeId !== 'docs.notFound' && navigation.documentTitle === `${navigation.articleTitle} | ${documentationTitle}`, `${scenario.id}: trunk navigation produced a stale or duplicated title.`);
    const homeNavigation = await navigateHomeViaLogo(driverUrl, sessionId, scenario);
    assert(homeNavigation.articleTitle === initial.articleTitle, `${scenario.id}: header logo did not restore the Docs start article.`);
    assert(homeNavigation.routeId !== 'docs.notFound' && homeNavigation.documentTitle === expectedHomeTitle, `${scenario.id}: home navigation did not restore the canonical title.`);
    const alternateLocale = scenario.locale === 'en' ? 'de' : 'en';
    const localeSwitch = await switchDocsLocale(driverUrl, sessionId, alternateLocale);
    const localeRestore = await switchDocsLocale(driverUrl, sessionId, scenario.locale);

    const finalSnapshot = await readSnapshot(driverUrl, sessionId);
    assert(finalSnapshot.theme === scenario.theme, `${scenario.id}: theme state changed during navigation.`);
    assert(finalSnapshot.documentTitle === expectedHomeTitle && finalSnapshot.routeId !== 'docs.notFound', `${scenario.id}: locale round-trip left a stale document title.`);
    assert(finalSnapshot.fabricSnapshot && finalSnapshot.fabricSnapshot.schema === 'xtend.fabric.telemetry-snapshot.v1' && finalSnapshot.fabricSnapshot.fiberCount > 0, `${scenario.id}: AppRuntime Fabric did not record command fibers.`);
    const logs = await request(driverUrl, `/session/${sessionId}/log`, 'POST', { type: 'browser' }).catch(() => []);
    const severe = (Array.isArray(logs) ? logs : []).filter((entry) => String(entry.level || '').toUpperCase() === 'SEVERE');
    assert(severe.length === 0, `${scenario.id}: severe console errors: ${JSON.stringify(severe)}`);
    const screenshot = await request(driverUrl, `/session/${sessionId}/screenshot`);
    await Promise.all([
      writeFile(path.join(evidenceDir, `${scenario.id}.json`), `${JSON.stringify({ scenario, initial, activeTheme, navigationSurface, skeletonHardening, search, focusedResult, fallbackSearch, navigation, homeNavigation, localeSwitch, localeRestore, finalSnapshot, logs }, null, 2)}\n`),
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
    await runMaracaRouteRegression(baseUrl, driverUrl);
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
