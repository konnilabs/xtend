import { xstate } from './xstate.js';

const XROUTER_IMPORT_POLICY_CONTRACT = 'xtend.security.xrouter-import-policy.v1';
const XROUTER_ALLOWED_IMPORT_PROTOCOLS = ['http:', 'https:', 'file:'];
const XROUTER_REFUSED_IMPORT_PROTOCOLS = ['javascript:', 'data:', 'vbscript:', 'blob:'];
const XROUTER_ALLOWED_MODULE_EXTENSIONS = ['.js', '.mjs'];
const XROUTER_LOCAL_IMPORT_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];

function classifyXRouterImportUrl(value, options = {}) {
  const baseUrl = options.baseUrl || (typeof document !== 'undefined' ? document.baseURI : undefined);
  const currentHref = typeof window !== 'undefined' && window.location ? window.location.href : baseUrl;
  const currentUrl = safeXRouterUrl(currentHref, baseUrl);
  const targetUrl = safeXRouterUrl(value, baseUrl);
  const diagnostics = [];

  if (!targetUrl || !currentUrl) {
    diagnostics.push('xtend.security.xrouter.import.refused.invalid_url');
  } else if (hasXRouterTraversalLikeInput(value)) {
    diagnostics.push('xtend.security.xrouter.import.refused.path_traversal');
  } else if (XROUTER_REFUSED_IMPORT_PROTOCOLS.includes(targetUrl.protocol)) {
    diagnostics.push('xtend.security.xrouter.import.refused.protocol');
  } else if (!XROUTER_ALLOWED_IMPORT_PROTOCOLS.includes(targetUrl.protocol)) {
    diagnostics.push('xtend.security.xrouter.import.refused.protocol');
  } else if (hasXRouterPathTraversal(targetUrl)) {
    diagnostics.push('xtend.security.xrouter.import.refused.path_traversal');
  } else if (!hasAllowedXRouterModuleExtension(targetUrl)) {
    diagnostics.push('xtend.security.xrouter.import.refused.extension');
  } else if (!isAllowedXRouterLocalUrl(targetUrl, currentUrl)) {
    diagnostics.push('xtend.security.xrouter.import.refused.external_module');
  }

  return {
    schema: XROUTER_IMPORT_POLICY_CONTRACT,
    ok: diagnostics.length === 0,
    source: options.source || 'x-router',
    url: targetUrl ? targetUrl.href : null,
    diagnostics
  };
}

function safeXRouterUrl(value, baseUrl) {
  try {
    return new URL(String(value), baseUrl);
  } catch (_) {
    return null;
  }
}

function isAllowedXRouterLocalUrl(targetUrl, currentUrl) {
  if (targetUrl.origin === currentUrl.origin) return true;
  if (targetUrl.protocol === 'file:' && currentUrl.protocol === 'file:') return true;
  return isXRouterLocalHost(targetUrl.hostname) && (
    isXRouterLocalHost(currentUrl.hostname) ||
    currentUrl.protocol === 'file:'
  );
}

function isXRouterLocalHost(hostname = '') {
  return XROUTER_LOCAL_IMPORT_HOSTS.includes(String(hostname).replace(/^\[|\]$/g, '').toLowerCase());
}

function hasXRouterPathTraversal(url) {
  try {
    return decodeURIComponent(url.pathname).split('/').includes('..');
  } catch (_) {
    return true;
  }
}

function hasXRouterTraversalLikeInput(value) {
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

function hasAllowedXRouterModuleExtension(url) {
  const pathname = url.pathname.toLowerCase();
  return XROUTER_ALLOWED_MODULE_EXTENSIONS.some((extension) => pathname.endsWith(extension));
}


/**
 * @class XRoute
 * Definiert eine einzelne Route innerhalb des Routers.
 * @property {string} path - Das URL-Muster (z.B. /home, /users/:id).
 * @property {string} component - Der Tag-Name der Komponente, die gerendert werden soll.
 */
class XRoute extends HTMLElement {
  static get observedAttributes() {
    return ['path', 'component', 'import', 'title', 'document-title', 'title-template', 'meta-description', 'meta-keywords', 'skeleton', 'skeleton-lines', 'skeleton-min-height', 'hydrate-schedule'];
  }
  get path() { return this.getAttribute('path'); }
  get component() { return this.getAttribute('component'); }
  get importUrl() { return this.getAttribute('import'); }
  get title() { return this.getAttribute('title'); }
  get documentTitle() { return this.getAttribute('document-title'); }
  get skeleton() { return this.getAttribute('skeleton'); }
  get skeletonLines() { return this.getAttribute('skeleton-lines'); }
  get skeletonMinHeight() { return this.getAttribute('skeleton-min-height'); }
  get hydrateSchedule() { return this.getAttribute('hydrate-schedule') || this.getAttribute('data-rmt-hydrate-schedule'); }
}
customElements.define('x-route', XRoute);

/**
 * @class XRouter
 * Haupt-Router-Komponente, die die Navigation verwaltet.
 */
class XRouter extends HTMLElement {
  static get observedAttributes() { return ['mode', 'routesrc', 'reuse-component', 'skeleton', 'skeleton-lines', 'skeleton-min-height']; }

  static get xtendComponentContract() {
    return {
      schema: 'xtend.component.contract.v2',
      tag: 'x-router',
      maturity: 'stable',
      source: {
        strategy: 'xtend.legacy-esm.component-source',
        state: 'js-runtime',
        sourcePath: 'components/xrouter.js'
      },
      runtime: {
        format: 'esm',
        artifact: 'components/xrouter.js',
        declaration: 'components/xrouter.d.ts',
        localOnly: true,
        cdnAllowed: false
      },
      rmt: {
        adapter: 'xtend.xrouter',
        kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
      },
      fabric: {
        api: '@xtend-fabric',
        defaultLane: 'transition'
      }
    };
  }

  static get xtendRmtMetadata() {
    return {
      schema: 'xtend.rmt.component-contract.v1',
      adapter: 'xtend.xrouter',
      tag: 'x-router',
      schedules: ['component.visible.mount', 'route.visible.render', 'route.transition.render', 'route.focus.restore', 'component.dynamic.hydrate', 'a11y.announce', 'diagnostics.snapshot'],
      hydration: { policy: 'visible', lane: 'transition' },
      routeContext: 'xtend.router.current',
      kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
    };
  }

  static get xtendComponentLifecycleTelemetry() {
    return {
      schema: 'xtend.component.lifecycle-telemetry.v1',
      componentRef: 'x-router',
      operations: ['mount', 'hydrate', 'navigate', 'render', 'announce', 'focus', 'unmount'],
      snapshotPath: 'snapshot.componentTelemetry'
    };
  }

  static get xtendScaffoldA11yProfile() {
    return {
      schema: 'xtend.a11y.profile.v1',
      componentRef: 'x-router',
      role: 'main',
      accessibleName: 'optional',
      liveRegion: 'polite',
      screenreader: {
        signalContract: XRouter.xtendScreenreaderSignals
      },
      motionContrast: {
        policy: XRouter.xtendMotionContrastPolicy
      }
    };
  }

  static get xtendScaffoldPerformanceProfile() {
    return {
      schema: 'xtend.performance.component-profile.v1',
      componentRef: 'x-router',
      budgetClass: 'routing',
      lane: 'transition',
      hydrationPolicy: 'visible',
      criticalMeasurements: ['navigate', 'render', 'announce', 'focus'],
      cleanup: ['window-listeners', 'document-listeners', 'xstate-subscription']
    };
  }

  static get xtendLayoutStabilityProfile() {
    return {
      schema: 'xtend.layout-stability.v1',
      componentRef: 'x-router',
      minBlockSize: 'var(--xtend-router-reserved-block-size, var(--xtend-layout-reserved-block-size, 12rem))',
      intrinsicSize: 'auto var(--xtend-router-reserved-block-size, 12rem)',
      slotReserve: ['outlet'],
      hydrationShiftPolicy: 'no-geometry-shift',
      skeletonParity: true,
      shellFirstCompatible: true,
      lazyLoadingCompatible: true
    };
  }

  static get xtendNavigationRoutingUxProfile() {
    return {
      schema: 'xtend.component.navigation-routing-ux-profile.v1',
      componentRef: 'x-router',
      family: 'router-outlet',
      role: 'main',
      navigationMode: 'hash-or-history',
      activeState: 'route-context-with-aria-current-links',
      focusRestore: 'outlet-focus-after-render',
      routeAnnouncement: 'polite-live-region',
      keyboardNavigation: 'delegated-to-x-link',
      events: ['xrouter-before-navigate', 'route-changed', 'routechange', 'xrouter-after-navigate', 'route-announced', 'xrouter-routes-registered', 'xrouter-route-reused', 'xrouter-skeleton-shown', 'xrouter-skeleton-hidden', 'xrouter-route-hydrated', 'xrouter-scroll-boundary-normalized', 'xrouter-navigation-overlays-closed', 'xrouter-title-updated'],
      commands: ['navigate', 'register-routes', 'focus-route', 'announce-route', 'rewrite-document-title', 'show-route-skeleton', 'hydrate-route-component', 'reuse-route-component', 'normalize-scroll-boundary', 'close-navigation-overlays', 'snapshot'],
      stateKey: 'xtend.router.current',
      schedule: 'route.visible.render',
      fabric: {
        lane: 'transition',
        a11yLane: 'a11y',
        diagnosticsLane: 'diagnostics'
      },
      rmt: XRouter.xtendRmtMetadata,
      statusSemantics: {
        feedbackStatusCompatible: true,
        announcementStateKey: 'xtend.router.announcement',
        documentMetaStateKey: 'xtend.router.documentMeta'
      },
      stateSemantics: {
        states: ['active', 'current', 'selected', 'hover', 'focus', 'disabled'],
        current: 'aria-current=page-delegated-to-links-and-menus',
        selected: 'aria-selected=true-supported-for-route-tabs',
        disabled: 'delegated-to-navigation-controls'
      },
      signatureDesign: {
        note: 'Enterprise router outlet with calm route focus, readable announcements and tokenized skeleton/navigation bridge states.',
        tokenStrategy: 'shared --xtend-nav-* tokens align router announcements, route focus and navigation components.',
        themeExpectation: 'third-party themes can replace route focus, skeleton, active route and announcement surfaces from CSS.'
      },
      themeTokens: [
        '--xtend-nav-surface',
        '--xtend-nav-text',
        '--xtend-nav-border-color',
        '--xtend-nav-radius',
        '--xtend-nav-gap',
        '--xtend-nav-font-family',
        '--xtend-nav-font-size',
        '--xtend-nav-active-surface',
        '--xtend-nav-active-text',
        '--xtend-nav-current-indicator',
        '--xtend-nav-hover-surface',
        '--xtend-nav-focus-ring',
        '--xtend-nav-disabled-opacity'
      ],
      overflowPolicy: 'route-outlet-allows-long-label-navigation-contexts-to-wrap'
    };
  }

  static get xtendScreenreaderSignals() {
    return {
      schema: 'xtend.a11y.screenreader-signals.v1',
      componentRef: 'x-router',
      liveRegion: 'polite',
      signals: ['route-announcement', 'focus-restore'],
      statusRegions: ['role=status', 'aria-live=polite', 'aria-atomic=true'],
      errorRegions: ['role=alert'],
      fabric: {
        lane: 'a11y',
        fiberKind: 'a11y.announce',
        scheduleRef: 'a11y.user-blocking.announce'
      }
    };
  }

  static get xtendMotionContrastPolicy() {
    return {
      schema: 'xtend.a11y.motion-contrast-policy.v1',
      componentRef: 'x-router',
      motion: {
        schema: 'xtend.a11y.motion-policy.v1',
        mediaQuery: '(prefers-reduced-motion: reduce)',
        reducedMotion: 'required',
        animationPolicy: 'route-announcement-without-motion-dependency',
        noMotionOnlyState: true
      },
      contrast: {
        schema: 'xtend.a11y.contrast-policy.v1',
        mediaQuery: '(forced-colors: active)',
        highContrast: 'required',
        forcedColorAdjust: 'auto',
        focusVisible: 'required',
        nonColorStatus: 'required'
      },
      fabric: {
        lane: 'a11y',
        fiberKind: 'a11y.preference',
        scheduleRef: 'a11y.user-blocking.preference'
      }
    };
  }

  /**
   * SSR/Prerendering: Exportiert alle Routen als JSON (rekursiv)
   * @param {HTMLElement} rootElement - <x-router> Element oder Array von Routenobjekten
   * @returns {Array} Array von Routenobjekten
   */
  static exportRoutesToJSON(rootElement) {
    // rootElement: <x-router> oder Array von Routenobjekten
    const extract = (el) => {
      if (Array.isArray(el)) return el.map(extract);
      if (el.tagName === 'X-ROUTE' || el.tagName === 'x-route') {
        const obj = {};
        for (const attr of el.getAttributeNames()) {
          obj[attr] = el.getAttribute(attr);
        }
        // Kinder rekursiv
        const children = Array.from(el.children).filter(c => c.tagName === 'X-ROUTE');
        if (children.length) obj.children = children.map(extract);
        return obj;
      }
      // Falls schon ein Objekt
      if (typeof el === 'object' && el.path) {
        const obj = { ...el };
        if (Array.isArray(obj.children)) obj.children = obj.children.map(extract);
        return obj;
      }
      return null;
    };
    if (!rootElement) return [];
    if (rootElement.tagName === 'X-ROUTER' || rootElement.tagName === 'x-router') {
      return Array.from(rootElement.querySelectorAll(':scope > x-route')).map(extract);
    }
    if (Array.isArray(rootElement)) return rootElement.map(extract);
    return [];
  }

  /**
   * SSR/Prerendering: Liefert für einen Pfad die Zielroute und ein HTML-Stub (Platzhalter)
   * @param {string} path - Zielpfad
   * @param {Array|HTMLElement} routes - Array von Routenobjekten oder <x-router>
   * @returns {Object} { html, route, params, meta }
   */
  static renderRouteToString(path, routes) {
    // Nutzt die gleiche Logik wie _matchRoute, aber serverseitig
    const matchRoute = (path, routes) => {
      const pathSegments = path.split('/').filter(Boolean);
      for (const route of routes) {
        const routePath = route.path;
        const aliases = route.alias ? route.alias.split(',').map(a => a.trim()).filter(Boolean) : [];
        const allPaths = [routePath, ...aliases];
        for (const testPath of allPaths) {
          if (testPath === '*') continue;
          const routeSegments = testPath.split('/').filter(Boolean);
          if (pathSegments.length < routeSegments.length) continue;
          const params = {};
          let isMatch = true;
          for (let i = 0; i < routeSegments.length; i++) {
            const segment = routeSegments[i];
            if (segment.startsWith(':')) {
              params[segment.substring(1)] = pathSegments[i];
            } else if (segment !== pathSegments[i]) {
              isMatch = false;
              break;
            }
          }
          if (isMatch) {
            // Nested
            if (route.children && pathSegments.length > routeSegments.length) {
              const restPath = '/' + pathSegments.slice(routeSegments.length).join('/');
              const childMatch = matchRoute(restPath, route.children);
              if (childMatch) {
                return { route, params, child: childMatch };
              }
            }
            return { route, params };
          }
        }
      }
      const notFoundRoute = routes.find(r => r.path === '*');
      return notFoundRoute ? { route: notFoundRoute, params: {} } : null;
    };
    // Routenstruktur extrahieren
    let routeArr = routes;
    if (routes && routes.tagName === 'X-ROUTER') {
      routeArr = XRouter.exportRoutesToJSON(routes);
    }
    routeArr = Array.isArray(routeArr) ? routeArr : [];
    const match = matchRoute(path, routeArr);
    if (!match) {
      return { html: '<div>404 - Not Found</div>', route: null, params: {}, meta: {} };
    }
    // SSR: HTML-Stub für die Komponente (echtes Rendern ist clientseitig)
    const buildHtml = (match) => {
      const { route, params, child } = match;
      let html = `<${route.component || 'div'}${Object.keys(params).length ? ' data-params="' + encodeURIComponent(JSON.stringify(params)) + '"' : ''}></${route.component || 'div'}>`;
      if (child) {
        html = html.replace(`</${route.component || 'div'}>`, `${buildHtml(child)}</${route.component || 'div'}>`);
      }
      return html;
    };
    // Meta-Infos
    const meta = XRouter.getMetaForPath(path, routeArr);
    return { html: buildHtml(match), route: match.route, params: match.params, meta };
  }

  /**
   * SSR/Prerendering: Liefert Meta-Infos (title, description, keywords) für einen Pfad
   * @param {string} path
   * @param {Array|HTMLElement} routes
   * @returns {Object} { title, description, keywords }
   */
  static getMetaForPath(path, routes) {
    // Nutzt die gleiche Logik wie renderRouteToString
    let routeArr = routes;
    if (routes && routes.tagName === 'X-ROUTER') {
      routeArr = XRouter.exportRoutesToJSON(routes);
    }
    const readMetaValue = (route, keys) => {
      const metadata = route && route.metadata && typeof route.metadata === 'object' ? route.metadata : {};
      const seo = metadata.seo && typeof metadata.seo === 'object' ? metadata.seo : {};
      for (const key of keys) {
        const routeValue = route ? route[key] : '';
        if (routeValue !== undefined && routeValue !== null && String(routeValue).trim()) return routeValue;
        const attrValue = route ? route[key.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)] : '';
        if (attrValue !== undefined && attrValue !== null && String(attrValue).trim()) return attrValue;
        const metadataValue = metadata[key];
        if (metadataValue !== undefined && metadataValue !== null && String(metadataValue).trim()) return metadataValue;
        const seoValue = seo[key];
        if (seoValue !== undefined && seoValue !== null && String(seoValue).trim()) return seoValue;
      }
      return '';
    };
    const normalizeMetaValue = (value) => Array.isArray(value)
      ? value.map(item => String(item).trim()).filter(Boolean).join(', ')
      : (value === undefined || value === null ? '' : String(value).trim());
    const findMeta = (path, routes) => {
      const pathSegments = path.split('/').filter(Boolean);
      for (const route of routes) {
        const routePath = route.path;
        const aliases = route.alias ? route.alias.split(',').map(a => a.trim()).filter(Boolean) : [];
        const allPaths = [routePath, ...aliases];
        for (const testPath of allPaths) {
          if (testPath === '*') continue;
          const routeSegments = testPath.split('/').filter(Boolean);
          if (pathSegments.length < routeSegments.length) continue;
          let isMatch = true;
          for (let i = 0; i < routeSegments.length; i++) {
            const segment = routeSegments[i];
            if (segment.startsWith(':')) continue;
            if (segment !== pathSegments[i]) {
              isMatch = false;
              break;
            }
          }
          if (isMatch) {
            // Nested
            if (route.children && pathSegments.length > routeSegments.length) {
              const restPath = '/' + pathSegments.slice(routeSegments.length).join('/');
              return findMeta(restPath, route.children);
            }
            const title = normalizeMetaValue(readMetaValue(route, ['title']));
            const documentTitle = normalizeMetaValue(readMetaValue(route, ['documentTitle', 'document_title'])) || title;
            return {
              title,
              documentTitle,
              description: normalizeMetaValue(readMetaValue(route, ['metaDescription', 'description'])),
              keywords: normalizeMetaValue(readMetaValue(route, ['metaKeywords', 'keywords']))
            };
          }
        }
      }
      return {};
    };
    return findMeta(path, routeArr);
  }

  static normalizeRmtRouteRecord(routeRecord = {}) {
    const source = routeRecord && typeof routeRecord === 'object'
      ? (routeRecord.record && typeof routeRecord.record === 'object' ? routeRecord.record : routeRecord)
      : {};
    const metadata = source.metadata && typeof source.metadata === 'object' ? source.metadata : {};
    const seo = metadata.seo && typeof metadata.seo === 'object' ? metadata.seo : {};
    const routeId = routeRecord.id || source.id || '';
    return {
      id: routeId,
      path: routeRecord.path || source.path || '',
      component: routeRecord.component || routeRecord.componentId || source.component || source.tag || '',
      title: routeRecord.title || source.title || metadata.title || seo.title || '',
      documentTitle: routeRecord.documentTitle || routeRecord.document_title || source.documentTitle || source.document_title || metadata.documentTitle || metadata.document_title || seo.documentTitle || seo.document_title || '',
      titleTemplate: routeRecord.titleTemplate || routeRecord.documentTitleTemplate || source.titleTemplate || source.documentTitleTemplate || metadata.titleTemplate || metadata.documentTitleTemplate || seo.titleTemplate || seo.documentTitleTemplate || '',
      metaDescription: routeRecord.metaDescription || routeRecord.description || source.metaDescription || source.description || metadata.metaDescription || metadata.description || seo.metaDescription || seo.description || '',
      metaKeywords: routeRecord.metaKeywords || routeRecord.keywords || source.metaKeywords || source.keywords || metadata.metaKeywords || metadata.keywords || seo.metaKeywords || seo.keywords || '',
      redirect: routeRecord.redirect || source.redirect || '',
      template: routeRecord.template || routeRecord.templateRef || source.template || '',
      schedule: routeRecord.schedule || routeRecord.scheduleRef || source.schedule || '',
      router: routeRecord.router || routeRecord.routerId || source.router || 'xtend.xrouter',
      import: routeRecord.import || source.import || source.importUrl || source.moduleRef || metadata.import || metadata.importUrl || '',
      skeleton: routeRecord.skeleton || source.skeleton || metadata.skeleton || '',
      skeletonLines: routeRecord.skeletonLines || routeRecord.skeleton_lines || source.skeletonLines || source.skeleton_lines || metadata.skeletonLines || metadata.skeleton_lines || '',
      skeletonMinHeight: routeRecord.skeletonMinHeight || routeRecord.skeleton_min_height || source.skeletonMinHeight || source.skeleton_min_height || metadata.skeletonMinHeight || metadata.skeleton_min_height || '',
      hydration: routeRecord.hydration || source.hydration || metadata.hydration || {},
      params: routeRecord.params || source.params || {},
      query: routeRecord.query || source.query || {},
      metadata,
      lifecycle: routeRecord.lifecycle || source.lifecycle || {},
      children: Array.isArray(routeRecord.children)
        ? routeRecord.children
        : (Array.isArray(source.children) ? source.children : [])
    };
  }

  static createRouteElementFromRecord(routeRecord = {}, documentTarget = document) {
    const route = XRouter.normalizeRmtRouteRecord(routeRecord);
    const element = documentTarget.createElement('x-route');
    const setAttribute = (name, value) => {
      if (value !== undefined && value !== null && String(value).trim()) {
        element.setAttribute(name, String(value));
      }
    };
    setAttribute('path', route.path);
    setAttribute('component', route.component);
    setAttribute('title', route.title);
    setAttribute('document-title', route.documentTitle);
    setAttribute('title-template', route.titleTemplate);
    setAttribute('meta-description', route.metaDescription);
    setAttribute('meta-keywords', route.metaKeywords);
    setAttribute('redirect', route.redirect);
    setAttribute('import', route.import);
    setAttribute('skeleton', route.skeleton);
    setAttribute('skeleton-lines', route.skeletonLines);
    setAttribute('skeleton-min-height', route.skeletonMinHeight);
    setAttribute('data-rmt-route-id', route.id);
    setAttribute('data-rmt-router', route.router);
    setAttribute('data-rmt-template', route.template);
    setAttribute('data-rmt-schedule', typeof route.schedule === 'string' ? route.schedule : (route.schedule && route.schedule.id) || '');
    setAttribute('data-rmt-hydrate-schedule', route.hydration && (route.hydration.schedule || route.hydration.scheduleRef) || '');
    if (route.params && Object.keys(route.params).length) {
      element.setAttribute('data-rmt-params', JSON.stringify(route.params));
    }
    if (route.query && Object.keys(route.query).length) {
      element.setAttribute('data-rmt-query', JSON.stringify(route.query));
    }
    if (route.metadata && Object.keys(route.metadata).length) {
      element.setAttribute('data-rmt-metadata', JSON.stringify(route.metadata));
    }
    if (route.lifecycle && route.lifecycle.beforeEnter && typeof route.lifecycle.beforeEnter === 'object') {
      setAttribute('before-enter', route.lifecycle.beforeEnter.commandName || route.lifecycle.beforeEnter.handler || '');
    }
    route.children.forEach((childRoute) => {
      element.appendChild(XRouter.createRouteElementFromRecord(childRoute, documentTarget));
    });
    return element;
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          min-block-size: var(--xtend-router-reserved-block-size, var(--xtend-layout-reserved-block-size, 1px));
          contain-intrinsic-size: auto var(--xtend-router-reserved-block-size, var(--xtend-layout-reserved-block-size, 12rem));
          --xtend-nav-surface: transparent;
          --xtend-nav-text: var(--xtend-text-primary, var(--xtend-text, CanvasText));
          --xtend-nav-border-color: transparent;
          --xtend-nav-radius: var(--xtend-radius-panel, var(--xtend-radius, 0.75rem));
          --xtend-nav-gap: var(--xtend-space-2, 0.5rem);
          --xtend-nav-font-family: var(--xtend-font-family-body, var(--xtend-font-family, system-ui, sans-serif));
          --xtend-nav-font-size: var(--xtend-font-size-body, 1rem);
          --xtend-nav-active-surface: var(--xtend-color-action-subtle, transparent);
          --xtend-nav-active-text: var(--xtend-color-action, LinkText);
          --xtend-nav-current-indicator: var(--xtend-color-action, Highlight);
          --xtend-nav-hover-surface: var(--xtend-color-action-subtle, transparent);
          --xtend-nav-focus-ring: var(--xtend-focus-ring, 2px solid Highlight);
          --xtend-nav-disabled-opacity: var(--xtend-disabled-opacity, 0.48);
          --xtend-router-focus: var(--xtend-nav-focus-ring);
          --xtend-router-surface: var(--xtend-nav-surface);
          --xtend-router-text: var(--xtend-nav-text);
        }
        #outlet {
          min-height: var(--xtend-router-reserved-block-size, var(--xtend-layout-reserved-block-size, 1px));
          outline: none;
          color: var(--xtend-router-text);
          background: var(--xtend-router-surface);
          overflow-wrap: anywhere;
          box-sizing: border-box;
        }
        #outlet[data-xtend-skeleton-active="true"] {
          display: block;
        }
        [data-xtend-skeleton-loader] {
          display: grid;
          gap: 0.68rem;
          width: var(--xtend-skeleton-width, 100%);
          max-width: var(--xtend-skeleton-max-width, 100%);
          margin-inline: var(--xtend-skeleton-margin-inline, 0);
          min-width: 0;
          box-sizing: border-box;
          min-height: var(--xtend-router-reserved-block-size, var(--xtend-layout-reserved-block-size, var(--xtend-router-skeleton-min-height, 12rem)));
          padding: var(--xtend-skeleton-padding, 1rem);
          border-radius: var(--xtend-skeleton-radius, 8px);
          background: var(--xtend-skeleton-surface, rgba(148, 163, 184, 0.12));
          overflow: hidden;
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
        #outlet:focus-visible {
          outline: var(--xtend-router-focus);
          outline-offset: 4px;
        }
        .route-announcer {
          position: absolute;
          width: 1px;
          height: 1px;
          margin: -1px;
          padding: 0;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        @media (prefers-reduced-motion: reduce) {
          #outlet {
            scroll-behavior: auto;
          }
        }
        @media (forced-colors: active) {
          #outlet:focus-visible {
            outline: 2px solid CanvasText;
          }
        }
      </style>
      <div id="outlet" part="root outlet" role="main" tabindex="-1" aria-busy="false"></div>
      <div id="route-announcer" class="route-announcer" part="announcer" role="status" aria-live="polite" aria-atomic="true"></div>
      <slot style="display: none;"></slot>
    `;
    this._outlet = this.shadowRoot.querySelector('#outlet');
    this._announcer = this.shadowRoot.querySelector('#route-announcer');
    this._onNavigate = this._handleNavigation.bind(this);
    this._onLinkClick = this._handleLinkClick.bind(this);
    this._unsubscribeXStateNav = null;
    this._mode = this.getAttribute('mode') || 'hash';
    this._lastRouteDetail = null;
    this._previousScrollRestoration = null;
    this._scrollBoundaryToken = null;
    this._scrollBoundaryFrame = null;
    this._scrollBoundarySecondFrame = null;
    this._scrollBoundaryTimer = null;
    this._scrollBoundarySettleTimer = null;
    this._routeSkeleton = null;
    this._initialDocumentTitle = typeof document !== 'undefined' ? document.title : '';
    this._initialDocumentMeta = this._snapshotDocumentMeta();
    if (this._mode === 'history' && !window.history.pushState) {
      this._mode = 'hash'; // Fallback
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'mode') {
      this._mode = newValue || 'hash';
    }
    if (name === 'reuse-component') {
      xstate.set('xtend.router.reuseComponent', this._shouldReuseRouteComponents());
    }
    if (name === 'routesrc' && newValue && newValue !== oldValue) {
      this._loadRoutesFromSrc(newValue).then(() => this._handleNavigation());
    }
  }

  connectedCallback() {
    this._enableManualScrollRestoration();
    if (this._mode === 'history') {
      window.addEventListener('popstate', this._onNavigate);
    } else {
      window.addEventListener('hashchange', this._onNavigate);
    }
    document.body.addEventListener('x-navigate', this._onNavigate);
    document.body.addEventListener('click', this._onLinkClick, true);
    // xstate -> Router: Navigation per xstate.set('router-navigate', '/ziel')
    if (typeof xstate.subscribe === 'function') {
      this._unsubscribeXStateNav = xstate.subscribe((key, value) => {
        if (key === 'router-navigate' && typeof value === 'string') {
          this._navigateTo(value);
        }
      }, 'router-navigate');
    }
    // Wenn routesrc gesetzt ist, lade die Routen
    const src = this.getAttribute('routesrc');
    const initialRouteLoad = src
      ? this._loadRoutesFromSrc(src)
      : Promise.resolve();
    // HMR Support (nur im Dev-Modus, wenn vorhanden)
    if (window.__xtendHMR && typeof window.__xtendHMR.on === 'function') {
      // Routen-HMR
      window.__xtendHMR.on('route-change', () => {
        const src = this.getAttribute('routesrc');
        const reloadPromise = src ? this._loadRoutesFromSrc(src) : Promise.resolve();
        reloadPromise.then(() => this._handleNavigation());
      });
      // Komponenten-HMR
      window.__xtendHMR.on('component-change', tag => {
        if (typeof tag === 'string' && customElements.get(tag)) {
          // Entferne alle Instanzen aus dem DOM
          document.querySelectorAll(tag).forEach(el => el.remove());
          // Lösche das Custom Element (geht nur im Dev-Modus, nicht in allen Browsern)
          // @ts-ignore
          if (customElements.get(tag) && customElements._definitions) {
            delete customElements._definitions[tag];
          }
          // Versuche, das Modul neu zu importieren (nur wenn importUrl bekannt)
          const route = Array.from(this.querySelectorAll('x-route')).find(r => r.component === tag);
          const importUrl = route ? this._getRouteImportUrl(route) : null;
          if (importUrl) {
            import(importUrl + '?t=' + Date.now()).then(() => {
              this._handleNavigation();
            });
          } else {
            this._handleNavigation();
          }
        }
      });
    }
    initialRouteLoad.then(() => this._handleNavigation({ focus: false, source: 'initial-load' }));
  }

  disconnectedCallback() {
    if (this._mode === 'history') {
      window.removeEventListener('popstate', this._onNavigate);
    } else {
      window.removeEventListener('hashchange', this._onNavigate);
    }
    document.body.removeEventListener('x-navigate', this._onNavigate);
    document.body.removeEventListener('click', this._onLinkClick, true);
    if (typeof this._unsubscribeXStateNav === 'function') {
      this._unsubscribeXStateNav();
      this._unsubscribeXStateNav = null;
    }
    this._clearScrollBoundaryChecks();
    this._restoreScrollRestoration();
  }

  _getCurrentPath() {
    if (this._mode === 'history') {
      return window.location.pathname + window.location.search;
    } else {
      const hash = window.location.hash.replace(/^#\/?/, '/');
      const search = window.location.search;
      // Falls Hash-Mode, aber Query-String vorhanden (z.B. index.html#/foo?bar=baz)
      if (hash.includes('?')) return hash;
      if (search && hash) return hash + search;
      return hash;
    }
  }

  _parsePathAndQuery(path) {
    // Gibt { path, query, queryObj } zurück
    const [purePath, query = ''] = path.split('?');
    const queryObj = {};
    if (query) {
      for (const part of query.split('&')) {
        const [k, v] = part.split('=');
        if (k) queryObj[decodeURIComponent(k)] = v ? decodeURIComponent(v) : '';
      }
    }
    return { path: purePath, query, queryObj };
  }

  _navigateTo(path, state = undefined) {
    const normalizedPath = path.startsWith('/') ? path : '/' + path;
    const currentPath = this._getCurrentPath();

    if (!this._emitBeforeNavigate(normalizedPath, state)) {
      return;
    }

    if (normalizedPath === currentPath) {
      this._handleNavigation();
      return;
    }

    // path kann Query enthalten
    if (this._mode === 'history') {
      window.history.pushState(state || {}, '', normalizedPath);
      this._handleNavigation();
    } else {
      window.location.hash = normalizedPath;
    }

    xstate.set('router-navigated', normalizedPath);
    xstate.set('xtend.router.lastNavigated', normalizedPath);
  }

  _emitBeforeNavigate(path, state = undefined) {
    const detail = {
      path,
      mode: this._mode,
      state,
      source: 'x-router',
      stateKey: 'xtend.router.current',
      scheduleRef: 'ui.user-blocking.navigation'
    };
    return this.dispatchEvent(new CustomEvent('xrouter-before-navigate', {
      detail,
      cancelable: true,
      bubbles: true,
      composed: true
    }));
  }

  _handleLinkClick(e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }

    const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
    const linkCandidate = path.find((node) => {
      if (!node || !node.tagName) return false;
      return (
        node.tagName === 'X-LINK' ||
        (node.tagName === 'A' && typeof node.hasAttribute === 'function' && node.hasAttribute('is-x-link'))
      );
    });

    if (!linkCandidate) return;

    const href = linkCandidate.getAttribute('href');
    const target = linkCandidate.getAttribute('target');
    if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }
    if (target && target !== '_self') {
      return;
    }

    e.preventDefault();
    this._navigateTo(href.replace(/^#\/?/, '/'));
  }

  _collectParams(match, target = {}) {
    if (!match) return target;
    Object.assign(target, match.params || {});
    if (match.child) {
      return this._collectParams(match.child, target);
    }
    return target;
  }

  _getLeafMatch(match) {
    let current = match;
    while (current && current.child) {
      current = current.child;
    }
    return current;
  }

  _shouldReuseRouteComponents(route = null) {
    return this.hasAttribute('reuse-component') ||
      this.hasAttribute('data-reuse-component') ||
      Boolean(route && route.hasAttribute && (route.hasAttribute('reuse-component') || route.hasAttribute('data-reuse-component')));
  }

  async _tryReuseRouteComponent(match, context = {}) {
    if (!match || !this._outlet || !this._shouldReuseRouteComponents(match.route)) return false;
    const current = this._outlet.firstElementChild;
    if (!current || match.child) return false;

    const leaf = this._getLeafMatch(match);
    const route = leaf && leaf.route ? leaf.route : match.route;
    const componentTag = this._getRouteComponent(route);
    if (!componentTag || current.localName !== String(componentTag).toLowerCase()) return false;

    const update = typeof current.updateRoute === 'function'
      ? current.updateRoute.bind(current)
      : (typeof current.routeChangedCallback === 'function' ? current.routeChangedCallback.bind(current) : null);
    if (!update) return false;

    current.params = match.params || {};
    current.query = context.queryObj || {};
    current.queryString = context.query || '';
    if (this._mode === 'history' && window.history.state) {
      current.state = window.history.state;
    }

    const detail = {
      path: context.path,
      route,
      match,
      params: this._collectParams(match),
      query: context.query || '',
      queryObj: context.queryObj || {},
      documentMeta: context.documentMeta || null,
      router: this,
      reused: true
    };

    try {
      const result = await update(detail);
      if (result === false) return false;
      const reuseDetail = {
        ...detail,
        mode: this._mode,
        component: componentTag,
        routeId: this._getRouteValue(route, 'id', 'data-rmt-route-id') || null,
        template: this._getRouteValue(route, 'template', 'data-rmt-template') || null,
        scheduleRef: this._getRouteValue(route, 'schedule', 'data-rmt-schedule') || null,
        query: context.queryObj || {},
        metadata: this._readRouteJsonAttribute(route, 'data-rmt-metadata'),
        title: context.documentMeta ? context.documentMeta.title : '',
        documentTitle: context.documentMeta ? context.documentMeta.documentTitle : '',
        meta: context.documentMeta || null,
        source: 'x-router',
        stateKey: 'xtend.router.current'
      };
      xstate.set('xtend.router.routeReused', reuseDetail);
      this.dispatchEvent(new CustomEvent('xrouter-route-reused', {
        detail: reuseDetail,
        bubbles: true,
        composed: true
      }));
      return true;
    } catch (error) {
      console.error(`Router: Fehler beim Wiederverwenden von <${componentTag}>:`, error);
      this._outlet.innerHTML = this._renderError(500, `Fehler beim Aktualisieren von <strong>${componentTag}</strong>\n${error.message}`);
      return true;
    }
  }

  _buildRouteDetail(path, match, queryObj = {}, documentMeta = null) {
    if (!match) {
      return {
        path,
        component: null,
        params: {},
        query: queryObj,
        title: documentMeta ? documentMeta.title : '',
        documentTitle: documentMeta ? documentMeta.documentTitle : '',
        meta: documentMeta || null
      };
    }

    const leaf = this._getLeafMatch(match);
    const route = leaf && leaf.route ? leaf.route : null;
    const routeMeta = documentMeta || this._resolveDocumentMeta(route, {
      path,
      params: this._collectParams(match),
      query: queryObj
    });
    return {
      path,
      routeId: this._getRouteValue(route, 'id', 'data-rmt-route-id') || null,
      mode: this._mode,
      component: route ? this._getRouteComponent(route) || null : null,
      template: this._getRouteValue(route, 'template', 'data-rmt-template') || null,
      scheduleRef: this._getRouteValue(route, 'schedule', 'data-rmt-schedule') || null,
      params: this._collectParams(match),
      query: queryObj,
      metadata: this._readRouteJsonAttribute(route, 'data-rmt-metadata'),
      title: routeMeta.title || '',
      documentTitle: routeMeta.documentTitle || '',
      meta: routeMeta,
      source: 'x-router',
      stateKey: 'xtend.router.current'
    };
  }

  _emitRouteChange(detail, options = {}) {
    const enrichedDetail = {
      ...detail,
      announcement: this._getRouteAnnouncement(detail),
      source: detail.source || 'x-router',
      stateKey: detail.stateKey || 'xtend.router.current'
    };
    this._lastRouteDetail = enrichedDetail;

    xstate.set('router-current', enrichedDetail);
    xstate.set('xtend.router.current', enrichedDetail);
    xstate.set('router-rendered', enrichedDetail);
    xstate.set('xtend.router.lastRendered', enrichedDetail);
    xstate.set('xtend.router.announcement', enrichedDetail.announcement);

    const routeChangedEvent = new CustomEvent('route-changed', {
      detail: enrichedDetail,
      bubbles: true,
      composed: true
    });
    const legacyRouteChangeEvent = new CustomEvent('routechange', {
      detail: enrichedDetail,
      bubbles: true,
      composed: true
    });

    this.dispatchEvent(routeChangedEvent);
    this.dispatchEvent(legacyRouteChangeEvent);
    window.dispatchEvent(new CustomEvent('xrouter-after-navigate', { detail: enrichedDetail }));
    this.announceRoute(enrichedDetail);
    if (options.focus === false) {
      if (this._outlet) this._outlet.setAttribute('aria-busy', 'false');
      return;
    }
    this.focusRoute(enrichedDetail);
  }

  _enableManualScrollRestoration() {
    if (typeof window === 'undefined' || !window.history || !('scrollRestoration' in window.history)) {
      return;
    }
    if (this._previousScrollRestoration === null) {
      this._previousScrollRestoration = window.history.scrollRestoration;
    }
    window.history.scrollRestoration = 'manual';
  }

  _restoreScrollRestoration() {
    if (
      typeof window === 'undefined' ||
      !window.history ||
      !('scrollRestoration' in window.history) ||
      this._previousScrollRestoration === null
    ) {
      return;
    }
    window.history.scrollRestoration = this._previousScrollRestoration;
    this._previousScrollRestoration = null;
  }

  _clearScrollBoundaryChecks() {
    this._scrollBoundaryToken = null;
    if (this._scrollBoundaryFrame !== null && typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function') {
      window.cancelAnimationFrame(this._scrollBoundaryFrame);
    }
    if (this._scrollBoundarySecondFrame !== null && typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function') {
      window.cancelAnimationFrame(this._scrollBoundarySecondFrame);
    }
    if (this._scrollBoundaryTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(this._scrollBoundaryTimer);
    }
    if (this._scrollBoundarySettleTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(this._scrollBoundarySettleTimer);
    }
    this._scrollBoundaryFrame = null;
    this._scrollBoundarySecondFrame = null;
    this._scrollBoundaryTimer = null;
    this._scrollBoundarySettleTimer = null;
  }

  _getRouteAnnouncement(detail) {
    if (!detail) return 'Route geladen';
    const metadata = detail.metadata || {};
    return metadata.announcement || metadata.title || detail.routeId || detail.path || 'Route geladen';
  }

  focusRoute(detail = this._lastRouteDetail) {
    if (!this._outlet || !this.isConnected) return false;
    this._outlet.setAttribute('aria-busy', 'false');
    this._outlet.focus({ preventScroll: true });
    xstate.set('xtend.router.focusRestored', {
      ...(detail || {}),
      source: 'x-router',
      stateKey: 'xtend.router.current',
      scheduleRef: 'route.focus.restore'
    });
    return true;
  }

  announceRoute(detail = this._lastRouteDetail) {
    const announcement = this._getRouteAnnouncement(detail);
    if (this._announcer) {
      this._announcer.textContent = '';
      queueMicrotask(() => {
        this._announcer.textContent = announcement;
      });
    }
    const eventDetail = {
      ...(detail || {}),
      announcement,
      source: 'x-router',
      stateKey: 'xtend.router.announcement',
      scheduleRef: 'a11y.announce'
    };
    this.dispatchEvent(new CustomEvent('route-announced', {
      detail: eventDetail,
      bubbles: true,
      composed: true
    }));
    return eventDetail;
  }

  snapshot() {
    return {
      schema: 'xtend.component.navigation-routing-snapshot.v1',
      source: 'x-router',
      stateKey: 'xtend.router.current',
      mode: this._mode,
      current: this._lastRouteDetail,
      routeCount: this._getRoutes().length,
      scheduleRef: 'diagnostics.snapshot'
    };
  }

  _getTopLevelChildRoutes(node) {
    return Array.from(node.children).filter((child) => child.tagName === 'X-ROUTE');
  }

  _getRouteImportUrl(route) {
    const importUrl = typeof route.importUrl === 'string'
      ? route.importUrl
      : route.getAttribute && route.getAttribute('import');
    return this._resolveRouteImportUrl(importUrl, { route });
  }

  _resolveRouteImportUrl(importUrl, options = {}) {
    if (!importUrl) return '';
    const policy = classifyXRouterImportUrl(importUrl, {
      source: options.source || 'x-router.route-import'
    });
    if (!policy.ok) {
      this._emitRouteImportRefused(importUrl, policy, options.route || null);
      return '';
    }
    return policy.url;
  }

  _emitRouteImportRefused(importUrl, policy, route = null) {
    const detail = {
      schema: XROUTER_IMPORT_POLICY_CONTRACT,
      input: importUrl,
      policy,
      routeId: this._getRouteValue(route, 'id', 'data-rmt-route-id') || null,
      component: route ? this._getRouteComponent(route) : null
    };
    console.error('XRouter: Route import durch Import Policy verweigert:', detail);
    this.dispatchEvent(new CustomEvent('xrouter-route-import-refused', {
      detail,
      bubbles: true,
      composed: true
    }));
  }

  _getRouteComponent(route) {
    return typeof route.component === 'string'
      ? route.component
      : route.getAttribute && route.getAttribute('component');
  }

  _getRoutePath(route) {
    return typeof route.path === 'string'
      ? route.path
      : route.getAttribute && route.getAttribute('path');
  }

  _getRouteValue(route, propertyName, attributeName = propertyName) {
    if (!route) return '';
    if (typeof route[propertyName] === 'string') return route[propertyName];
    return route.getAttribute && route.getAttribute(attributeName) || '';
  }

  _readRouteJsonAttribute(route, attributeName) {
    const value = this._getRouteValue(route, attributeName, attributeName);
    if (!value) return {};
    try {
      return JSON.parse(value);
    } catch (_error) {
      return {};
    }
  }

  _readRouteNumber(route, attributeName, fallback) {
    const raw = route && route.getAttribute && route.getAttribute(attributeName);
    const value = Number(raw || fallback);
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }

  _routeSkeletonEnabled(route) {
    if (!route) return this.hasAttribute('skeleton') || this.hasAttribute('data-xtend-skeleton');
    const value = this._getRouteValue(route, 'skeleton', 'skeleton') ||
      this._getRouteValue(route, 'data-xtend-skeleton', 'data-xtend-skeleton') ||
      this.getAttribute('skeleton') ||
      this.getAttribute('data-xtend-skeleton') ||
      '';
    if (value === '') return this.hasAttribute('skeleton') || this.hasAttribute('data-xtend-skeleton');
    return !['false', '0', 'off', 'none'].includes(String(value).trim().toLowerCase());
  }

  _getRouteHydrateSchedule(route) {
    return this._getRouteValue(route, 'hydrateSchedule', 'hydrate-schedule') ||
      this._getRouteValue(route, 'data-rmt-hydrate-schedule', 'data-rmt-hydrate-schedule') ||
      this.getAttribute('hydrate-schedule') ||
      this.getAttribute('data-rmt-hydrate-schedule') ||
      'component.dynamic.hydrate';
  }

  _getRouteSkeletonOptions(route, context = {}) {
    const routeLines = this._readRouteNumber(route, 'skeleton-lines', 0);
    const routerLines = Number(this.getAttribute('skeleton-lines') || 0);
    const lines = routeLines || (Number.isFinite(routerLines) && routerLines > 0 ? routerLines : 6);
    return {
      variant: this._getRouteValue(route, 'skeleton', 'skeleton') || this.getAttribute('skeleton') || 'route',
      lines,
      minHeight: this._getRouteValue(route, 'skeletonMinHeight', 'skeleton-min-height') ||
        this.getAttribute('skeleton-min-height') ||
        this.style.getPropertyValue('--xtend-router-skeleton-min-height') ||
        '12rem',
      label: this.getAttribute('skeleton-label') || 'Route wird geladen',
      source: 'x-router',
      schedule: this._getRouteValue(route, 'schedule', 'data-rmt-schedule') || 'route.visible.render',
      routeId: this._getRouteValue(route, 'id', 'data-rmt-route-id') || null,
      path: context.path || this._getCurrentPath()
    };
  }

  _showRouteSkeleton(route, context = {}) {
    if (!this._outlet || !this._routeSkeletonEnabled(route)) return null;
    const options = this._getRouteSkeletonOptions(route, context);
    if (options.minHeight) {
      this.style.setProperty('--xtend-router-skeleton-min-height', options.minHeight);
      if (!this.style.getPropertyValue('--xtend-router-reserved-block-size')) {
        this.style.setProperty('--xtend-router-reserved-block-size', options.minHeight);
      }
      this._outlet.style.setProperty('--xtend-router-skeleton-min-height', options.minHeight);
      this._outlet.style.setProperty('--xtend-router-reserved-block-size', this.style.getPropertyValue('--xtend-router-reserved-block-size') || options.minHeight);
    }
    const loader = typeof window !== 'undefined' && window.XTendLoader;
    const skeleton = loader && typeof loader.showSkeleton === 'function'
      ? loader.showSkeleton(this._outlet, options)
      : this._createFallbackRouteSkeleton(options);
    this._routeSkeleton = skeleton;
    const detail = {
      schema: 'xtend.router.skeleton-loader.v1',
      source: 'x-router',
      stateKey: 'xtend.router.skeleton',
      scheduleRef: options.schedule,
      routeId: options.routeId,
      path: options.path,
      active: true
    };
    xstate.set('xtend.router.skeleton', detail);
    this.dispatchEvent(new CustomEvent('xrouter-skeleton-shown', {
      detail,
      bubbles: true,
      composed: true
    }));
    return skeleton;
  }

  _createFallbackRouteSkeleton(options = {}) {
    const skeleton = document.createElement('div');
    skeleton.setAttribute('data-xtend-skeleton-loader', '');
    skeleton.setAttribute('data-xtend-skeleton-source', 'x-router');
    skeleton.setAttribute('role', 'status');
    skeleton.setAttribute('aria-label', options.label || 'Route wird geladen');
    if (options.minHeight) skeleton.style.minHeight = options.minHeight;
    const lines = Math.max(1, Math.min(24, Number(options.lines || 6)));
    const widths = ['72%', '94%', '84%', '58%', '88%', '66%'];
    for (let index = 0; index < lines; index += 1) {
      const line = document.createElement('span');
      line.setAttribute('data-xtend-skeleton-line', '');
      line.style.width = widths[index % widths.length];
      skeleton.appendChild(line);
    }
    this._outlet.setAttribute('data-xtend-skeleton-active', 'true');
    this._outlet.appendChild(skeleton);
    return skeleton;
  }

  _clearRouteSkeleton(route, context = {}) {
    if (!this._outlet) return;
    const loader = typeof window !== 'undefined' && window.XTendLoader;
    if (loader && typeof loader.hideSkeleton === 'function') {
      loader.hideSkeleton(this._outlet, { preserveBusy: true });
    } else {
      Array.from(this._outlet.children || [])
        .filter((child) => child && child.hasAttribute && child.hasAttribute('data-xtend-skeleton-loader'))
        .forEach((skeleton) => skeleton.remove());
      this._outlet.removeAttribute('data-xtend-skeleton-active');
    }
    this._routeSkeleton = null;
    const detail = {
      schema: 'xtend.router.skeleton-loader.v1',
      source: 'x-router',
      stateKey: 'xtend.router.skeleton',
      scheduleRef: this._getRouteValue(route, 'schedule', 'data-rmt-schedule') || 'route.visible.render',
      routeId: this._getRouteValue(route, 'id', 'data-rmt-route-id') || null,
      path: context.path || this._getCurrentPath(),
      active: false
    };
    xstate.set('xtend.router.skeleton', detail);
    this.dispatchEvent(new CustomEvent('xrouter-skeleton-hidden', {
      detail,
      bubbles: true,
      composed: true
    }));
  }

  async _ensureRouteComponent(componentTag, importUrl, route = null) {
    if (!componentTag) return false;
    if (customElements.get(componentTag)) return true;
    if (importUrl) {
      await import(importUrl);
    } else if (window.XTendLoader && typeof window.XTendLoader.ensureComponent === 'function') {
      await window.XTendLoader.ensureComponent(componentTag, {
        source: 'x-router',
        reason: 'route-component',
        schedule: this._getRouteValue(route, 'schedule', 'data-rmt-schedule') || 'route.visible.render'
      });
    }
    return Boolean(customElements.get(componentTag));
  }

  async _hydrateRouteTree(component, route) {
    if (!component || !component.isConnected) return null;
    const schedule = this._getRouteHydrateSchedule(route);
    let detail = null;
    if (window.XTendLoader && typeof window.XTendLoader.hydrateTree === 'function') {
      detail = await window.XTendLoader.hydrateTree(component, {
        tags: [component.localName],
        source: 'x-router',
        reason: 'route-render',
        schedule
      });
    } else if (typeof component.hydrate === 'function') {
      component.hydrate();
      detail = {
        schema: 'xtend.router.route-hydration.v1',
        source: 'x-router',
        schedule,
        hydrated: 1
      };
    }
    if (detail) {
      this.dispatchEvent(new CustomEvent('xrouter-route-hydrated', {
        detail: {
          ...detail,
          routeId: this._getRouteValue(route, 'id', 'data-rmt-route-id') || null,
          scheduleRef: schedule
        },
        bubbles: true,
        composed: true
      }));
    }
    return detail;
  }

  _snapshotDocumentMeta() {
    if (typeof document === 'undefined') return {};
    const read = (name) => {
      const meta = document.querySelector(`meta[name="${name}"]`);
      return meta ? meta.getAttribute('content') || '' : '';
    };
    return {
      description: read('description'),
      keywords: read('keywords')
    };
  }

  _readObjectPath(source, path) {
    if (!source || !path) return undefined;
    return String(path).split('.').reduce((value, segment) => {
      if (value === undefined || value === null) return undefined;
      return Object.prototype.hasOwnProperty.call(Object(value), segment)
        ? value[segment]
        : undefined;
    }, source);
  }

  _interpolateTitleTemplate(template, context = {}) {
    if (!template) return '';
    return String(template).replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_match, key) => {
      const value = this._readObjectPath(context, key);
      return value === undefined || value === null ? '' : String(value);
    }).trim();
  }

  _readRouteMetadata(route) {
    return this._readRouteJsonAttribute(route, 'data-rmt-metadata');
  }

  _readMetadataValue(metadata = {}, keys = []) {
    const seo = metadata.seo && typeof metadata.seo === 'object' ? metadata.seo : {};
    for (const key of keys) {
      const value = this._readObjectPath(metadata, key);
      if (value !== undefined && value !== null && String(value).trim()) return value;
      const seoValue = this._readObjectPath(seo, key);
      if (seoValue !== undefined && seoValue !== null && String(seoValue).trim()) return seoValue;
    }
    return '';
  }

  _normalizeMetaContent(value) {
    if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean).join(', ');
    return value === undefined || value === null ? '' : String(value).trim();
  }

  _getMetaTag(name) {
    if (typeof document === 'undefined') return null;
    let meta = document.querySelector(`meta[name="${name}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = name;
      document.head.appendChild(meta);
    }
    return meta;
  }

  _setMetaTag(name, value) {
    if (typeof document === 'undefined') return;
    const normalized = this._normalizeMetaContent(value);
    const fallback = this._initialDocumentMeta && this._initialDocumentMeta[name]
      ? this._initialDocumentMeta[name]
      : '';
    const content = normalized || fallback;
    const existing = document.querySelector(`meta[name="${name}"]`);
    if (!content) {
      if (existing) existing.remove();
      return;
    }
    const meta = existing || this._getMetaTag(name);
    if (meta) meta.content = content;
  }

  _resolveDocumentMeta(route, context = {}) {
    const metadata = this._readRouteMetadata(route);
    const params = context.params || {};
    const query = context.query || {};
    const routeTitle = this._normalizeMetaContent(
      this._getRouteValue(route, 'title', 'title') ||
      this._readMetadataValue(metadata, ['title'])
    );
    const explicitDocumentTitle = this._normalizeMetaContent(
      this._getRouteValue(route, 'documentTitle', 'document-title') ||
      this._getRouteValue(route, 'document-title', 'document-title') ||
      this._readMetadataValue(metadata, ['documentTitle', 'document_title'])
    );
    const rawTitle = explicitDocumentTitle || routeTitle || this._normalizeMetaContent(context.fallbackTitle);
    const titleTemplate =
      this._getRouteValue(route, 'documentTitleTemplate', 'document-title-template') ||
      this._getRouteValue(route, 'titleTemplate', 'title-template') ||
      this._getRouteValue(route, 'data-rmt-title-template', 'data-rmt-title-template') ||
      this._readMetadataValue(metadata, ['documentTitleTemplate', 'titleTemplate', 'document_title_template', 'title_template']) ||
      this.getAttribute('document-title-template') ||
      this.getAttribute('title-template') ||
      '';
    const templateContext = {
      title: rawTitle,
      routeTitle,
      documentTitle: explicitDocumentTitle || rawTitle,
      path: context.path || this._getCurrentPath(),
      routeId: this._getRouteValue(route, 'id', 'data-rmt-route-id') || '',
      component: route ? this._getRouteComponent(route) || '' : '',
      params,
      query,
      metadata
    };
    const templatedTitle = titleTemplate
      ? this._interpolateTitleTemplate(titleTemplate, templateContext)
      : '';
    const prefix = this.getAttribute('title-prefix') || '';
    const suffix = this.getAttribute('title-suffix') || '';
    const defaultTitle = this.getAttribute('default-title') || this._initialDocumentTitle || '';
    const documentTitle = templatedTitle || (rawTitle ? `${prefix}${rawTitle}${suffix}` : defaultTitle);
    const description = this._normalizeMetaContent(
      this._getRouteValue(route, 'metaDescription', 'meta-description') ||
      this._readMetadataValue(metadata, ['metaDescription', 'description'])
    );
    const keywords = this._normalizeMetaContent(
      this._getRouteValue(route, 'metaKeywords', 'meta-keywords') ||
      this._readMetadataValue(metadata, ['metaKeywords', 'keywords'])
    );

    return {
      schema: 'xtend.router.document-meta.v1',
      source: 'x-router',
      stateKey: 'xtend.router.documentMeta',
      scheduleRef: 'route.document.title.rewrite',
      path: templateContext.path,
      routeId: templateContext.routeId || null,
      title: routeTitle || rawTitle,
      documentTitle,
      description,
      keywords,
      titleTemplate: titleTemplate || null,
      metadata
    };
  }

  registerRoutes(routes = [], options = {}) {
    const routeRecords = Array.isArray(routes)
      ? routes
      : (routes && Array.isArray(routes.routes) ? routes.routes : []);
    if (options.replace !== false) {
      this._getTopLevelChildRoutes(this).forEach(route => route.remove());
    }
    routeRecords.forEach((routeRecord) => {
      this.appendChild(XRouter.createRouteElementFromRecord(routeRecord, this.ownerDocument || document));
    });
    this._routesFromJson = null;
    const detail = {
      adapterId: options.adapterId || 'xtend.xrouter',
      source: options.source || 'runtime',
      routeCount: routeRecords.length
    };
    this.dispatchEvent(new CustomEvent('xrouter-routes-registered', {
      detail,
      bubbles: true,
      composed: true
    }));
    if (options.render !== false) {
      this._handleNavigation();
    }
    return detail;
  }

  navigate(to, options = {}) {
    const rawTarget = to && typeof to === 'object' ? to : { path: to };
    const routeId = rawTarget.routeId || rawTarget.id || rawTarget.route || '';
    let targetPath = rawTarget.path || rawTarget.to || rawTarget.href || '';
    if (!targetPath && routeId) {
      const route = this._getRoutes().find(candidate => this._getRouteValue(candidate, 'id', 'data-rmt-route-id') === routeId);
      targetPath = route ? this._getRoutePath(route) : '';
    }
    if (!targetPath) return false;
    this._navigateTo(targetPath, {
      routeId,
      params: rawTarget.params || {},
      query: rawTarget.query || {},
      metadata: rawTarget.metadata || {},
      source: options.source || 'rmt'
    });
    return true;
  }

  /**
   * Rekursive Suche nach passender Route inkl. Nested Routes, Aliases und Redirects
   */
  _matchRoute(path, routes = null) {
    routes = routes || this._getRoutes();
    const pathSegments = path.split('/').filter(Boolean);
    for (const route of routes) {
      // Aliases: route kann ein alias-Attribut (Komma-separiert) haben
      const routePath = this._getRoutePath(route);
      const aliases = (route.getAttribute && route.getAttribute('alias'))
        ? route.getAttribute('alias').split(',').map(a => a.trim()).filter(Boolean)
        : [];
      const allPaths = [routePath, ...aliases];
      for (const testPath of allPaths) {
        if (testPath === '*') continue;
        const routeSegments = testPath.split('/').filter(Boolean);
        if (pathSegments.length < routeSegments.length) continue;
        const params = {};
        let isMatch = true;
        for (let i = 0; i < routeSegments.length; i++) {
          const segment = routeSegments[i];
          if (segment.startsWith(':')) {
            params[segment.substring(1)] = pathSegments[i];
          } else if (segment !== pathSegments[i]) {
            isMatch = false;
            break;
          }
        }
        if (isMatch) {
          // Redirect: route kann ein redirect-Attribut haben
          const redirect = route.getAttribute && route.getAttribute('redirect');
          if (redirect) {
            // Sofortige Weiterleitung
            this._navigateTo(redirect);
            return null;
          }
          // Prüfe auf Nested Routes
          const childRoutes = this._getTopLevelChildRoutes(route);
          if (childRoutes.length && pathSegments.length > routeSegments.length) {
            const restPath = '/' + pathSegments.slice(routeSegments.length).join('/');
            const childMatch = this._matchRoute(restPath, childRoutes);
            if (childMatch) {
              return { route, params, child: childMatch };
            }
          }
          return { route, params };
        }
      }
    }

    const notFoundRoute = (routes || []).find(r => r.path === '*');
    return notFoundRoute ? { route: notFoundRoute, params: {} } : null;
  }

  _escapeHtml(value = '') {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  _renderError(status = 500, details = '') {
    const messages = {
      404: { title: '404 - Seite nicht gefunden', desc: 'Die angeforderte Seite existiert nicht oder wurde verschoben.' },
      500: { title: '500 - Interner Fehler', desc: 'Ein unerwarteter Fehler ist aufgetreten.' },
      401: { title: '401 - Nicht autorisiert', desc: 'Sie sind für diese Seite nicht angemeldet.' },
      403: { title: '403 - Zugriff verweigert', desc: 'Sie haben keine Berechtigung, diese Seite zu sehen.' },
      503: { title: '503 - Dienst nicht verfügbar', desc: 'Der Dienst ist vorübergehend nicht erreichbar.' },
    };
    const msg = messages[status] || messages[500];
    const safeDetails = details ? this._escapeHtml(details) : '';
    return `<div style="padding:2em;text-align:center"><h2>${msg.title}</h2><p>${msg.desc}</p>${safeDetails ? `<pre style='color:#b00'>${safeDetails}</pre>` : ''}</div>`;
  }

  async _handleNavigation(options = {}) {
    const raw = this._getCurrentPath();
    const { path, query, queryObj } = this._parsePathAndQuery(raw);
    const match = this._matchRoute(path);
    this._outlet.setAttribute('aria-busy', 'true');
    // Animations-Hook: beforeRouteLeave (für aktuelle Komponente)
    if (this._outlet.firstElementChild && typeof this._outlet.firstElementChild.beforeRouteLeave === 'function') {
      const leaveResult = await this._outlet.firstElementChild.beforeRouteLeave();
      if (leaveResult === false) {
        this._outlet.setAttribute('aria-busy', 'false');
        return; // Abbruch möglich
      }
    }
    this._closeRouteNavigationOverlays({ path: raw, source: 'x-router-route-change' });
    // Animations-Hook: beforeRouteEnter (für Zielroute)
    if (match) {
      // Route Guard: beforeEnter
      const allow = await this._runBeforeEnter(match);
      if (!allow) {
        this._outlet.innerHTML = this._renderError(403, 'Navigation durch Guard abgebrochen.');
        this._outlet.setAttribute('aria-busy', 'false');
        return;
      }
      // Animations-Hook: beforeRouteEnter (als static Methode am Ziel-ComponentTag)
      const leaf = this._getLeafMatch(match);
      const route = leaf && leaf.route ? leaf.route : match.route;
      const componentTag = this._getRouteComponent(route);
      if (componentTag && customElements.get(componentTag)) {
        const ctor = customElements.get(componentTag);
        if (typeof ctor.beforeRouteEnter === 'function') {
          const enterResult = await ctor.beforeRouteEnter();
          if (enterResult === false) {
            this._outlet.setAttribute('aria-busy', 'false');
            return;
          }
        }
      }
      // Query-Objekt an Komponente übergeben
      match.query = query;
      match.queryObj = queryObj;
      // Seitentitel und Meta-Tags setzen
      const documentMeta = this._setDocumentMeta(route, {
        path: raw,
        params: this._collectParams(match),
        query: queryObj
      });
      const reused = await this._tryReuseRouteComponent(match, {
        path: raw,
        query,
        queryObj,
        documentMeta
      });
      if (!reused) {
        this._outlet.innerHTML = '';
        this._showRouteSkeleton(route, { path: raw });
        try {
          await this._renderRoute(match, this._outlet);
        } finally {
          this._clearRouteSkeleton(route, { path: raw });
        }
      }
      const routeDetail = this._buildRouteDetail(raw, match, queryObj, documentMeta);
      if (reused) routeDetail.reused = true;
      this._emitRouteChange(routeDetail, options);
      // Scroll-Verhalten nach erfolgreichem Rendern
      const scrollIntent = this._handleScrollAfterNavigation(route);
      this._scheduleScrollBoundaryCheck(scrollIntent, routeDetail);
    } else {
      this._outlet.innerHTML = this._renderError(404);
      const documentMeta = this._setDocumentMeta(null, {
        path: raw,
        params: {},
        query: queryObj,
        fallbackTitle: '404'
      });
      const routeDetail = this._buildRouteDetail(raw, null, queryObj, documentMeta);
      this._emitRouteChange(routeDetail, options);
      const scrollIntent = this._handleScrollAfterNavigation(null);
      this._scheduleScrollBoundaryCheck(scrollIntent, routeDetail);
    }
  }

  /**
   * Setzt Seitentitel und Meta-Tags anhand der Route-Attribute
   */
  _setDocumentMeta(route, context = {}) {
    const meta = this._resolveDocumentMeta(route, context);
    if (meta.documentTitle && typeof document !== 'undefined') {
      document.title = meta.documentTitle;
    }
    this._setMetaTag('description', meta.description);
    this._setMetaTag('keywords', meta.keywords);

    xstate.set('router-document-meta', meta);
    xstate.set('xtend.router.documentMeta', meta);
    this.dispatchEvent(new CustomEvent('xrouter-title-updated', {
      detail: meta,
      bubbles: true,
      composed: true
    }));
    return meta;
  }

  /**
   * Scrollt nach Navigation zum Seitenanfang oder zu einem Anker (ID)
   */
  _handleScrollAfterNavigation(route) {
    const scrollTo = route && route.getAttribute && route.getAttribute('scroll-to');
    if (scrollTo) {
      const el = document.getElementById(scrollTo);
      if (el) {
        el.scrollIntoView({ behavior: 'auto', block: 'start' });
        return {
          schema: 'xtend.router.scroll-intent.v1',
          strategy: 'element',
          targetId: scrollTo,
          scheduleRef: 'route.scroll.boundary'
        };
      }
    }
    // Standard: Seitenanfang
    window.scrollTo(0, 0);
    return {
      schema: 'xtend.router.scroll-intent.v1',
      strategy: scrollTo ? 'missing-target' : 'top',
      targetId: scrollTo || null,
      scheduleRef: 'route.scroll.boundary'
    };
  }

  _closeRouteNavigationOverlays(detail = {}) {
    if (typeof document === 'undefined') return [];
    const closedOverlays = [];
    document.querySelectorAll('x-header').forEach((header) => {
      const isOpen = typeof header.isMenuOpen === 'function' ? header.isMenuOpen() : false;
      if (!isOpen || typeof header.toggleMenu !== 'function') return;
      header.toggleMenu(false, { source: detail.source || 'x-router-route-change' });
      closedOverlays.push({
        tag: 'x-header',
        id: header.id || null
      });
    });
    if (!closedOverlays.length) return closedOverlays;
    const snapshot = {
      schema: 'xtend.router.closed-navigation-overlays.v1',
      source: 'x-router',
      stateKey: 'xtend.router.closedNavigationOverlays',
      scheduleRef: 'route.navigation.overlay.close',
      path: detail.path || this._getCurrentPath(),
      overlays: closedOverlays,
      count: closedOverlays.length
    };
    xstate.set('router-closed-navigation-overlays', snapshot);
    xstate.set('xtend.router.closedNavigationOverlays', snapshot);
    this.dispatchEvent(new CustomEvent('xrouter-navigation-overlays-closed', {
      detail: snapshot,
      bubbles: true,
      composed: true
    }));
    return closedOverlays;
  }

  _scheduleScrollBoundaryCheck(scrollIntent = {}, detail = {}) {
    if (typeof window === 'undefined') return;
    this._clearScrollBoundaryChecks();
    const token = Symbol('xrouter-scroll-boundary');
    this._scrollBoundaryToken = token;
    const run = (phase) => {
      if (this._scrollBoundaryToken !== token) return;
      this._normalizeScrollBoundary(scrollIntent, detail, phase);
    };

    if (typeof queueMicrotask === 'function') {
      queueMicrotask(() => run('microtask'));
    }

    if (typeof window.requestAnimationFrame === 'function') {
      this._scrollBoundaryFrame = window.requestAnimationFrame(() => {
        this._scrollBoundaryFrame = null;
        run('frame');
        this._scrollBoundarySecondFrame = window.requestAnimationFrame(() => {
          this._scrollBoundarySecondFrame = null;
          run('settled-frame');
        });
      });
    } else {
      this._scrollBoundaryTimer = window.setTimeout(() => {
        this._scrollBoundaryTimer = null;
        run('timer');
      }, 0);
    }

    this._scrollBoundarySettleTimer = window.setTimeout(() => {
      this._scrollBoundarySettleTimer = null;
      run('settled-timeout');
    }, 220);
  }

  _normalizeScrollBoundary(scrollIntent = {}, detail = {}, phase = 'settled-frame') {
    if (typeof window === 'undefined' || !this.isConnected) return null;
    const doc = this.ownerDocument || document;
    const root = doc.documentElement;
    const body = doc.body;
    const scrollingElement = doc.scrollingElement || root;
    if (!scrollingElement || !root) return null;

    const viewportHeight = window.innerHeight || root.clientHeight || scrollingElement.clientHeight || 0;
    const scrollHeight = Math.max(
      scrollingElement.scrollHeight || 0,
      root.scrollHeight || 0,
      body ? body.scrollHeight || 0 : 0
    );
    const maxScrollTop = Math.max(0, scrollHeight - viewportHeight);
    const currentTop = typeof window.scrollY === 'number'
      ? window.scrollY
      : (scrollingElement.scrollTop || 0);
    const currentLeft = typeof window.scrollX === 'number'
      ? window.scrollX
      : (scrollingElement.scrollLeft || 0);
    const expectsTop = !scrollIntent || scrollIntent.strategy === 'top' || scrollIntent.strategy === 'missing-target';
    const deadzoneDetected = currentTop > maxScrollTop + 1;
    const staleTopDetected = expectsTop && currentTop > 1;
    const shouldNormalize = deadzoneDetected || staleTopDetected;
    const normalizedTop = shouldNormalize
      ? (expectsTop ? 0 : maxScrollTop)
      : currentTop;

    if (shouldNormalize) {
      window.scrollTo({ top: normalizedTop, left: currentLeft, behavior: 'auto' });
    }

    const snapshot = {
      schema: 'xtend.router.scroll-boundary.v1',
      source: 'x-router',
      stateKey: 'xtend.router.scrollBoundary',
      scheduleRef: 'route.scroll.boundary',
      path: detail && detail.path ? detail.path : this._getCurrentPath(),
      phase,
      strategy: scrollIntent.strategy || 'top',
      targetId: scrollIntent.targetId || null,
      viewportHeight,
      scrollHeight,
      maxScrollTop,
      previousTop: currentTop,
      normalizedTop,
      normalized: shouldNormalize,
      deadzoneDetected
    };

    xstate.set('router-scroll-boundary', snapshot);
    xstate.set('xtend.router.scrollBoundary', snapshot);

    if (shouldNormalize) {
      this.dispatchEvent(new CustomEvent('xrouter-scroll-boundary-normalized', {
        detail: snapshot,
        bubbles: true,
        composed: true
      }));
    }

    return snapshot;
  }

  /**
   * Route Guard: beforeEnter (rekursiv für Nested Routes)
   */
  async _runBeforeEnter(match) {
    if (!match) return true;
    const { route, params, child } = match;
    let guard = route.beforeEnter;
    if (!guard && route.getAttribute && route.getAttribute('before-enter')) {
      const fn = window[route.getAttribute('before-enter')];
      if (typeof fn === 'function') guard = fn;
    }
    if (guard) {
      const result = await guard(params, route);
      if (result === false) return false;
    }
    if (child) {
      return await this._runBeforeEnter(child);
    }
    return true;
  }

  /**
   * Rendert eine Route (und ggf. Kind-Route) rekursiv in den gegebenen Container
   */
  async _renderRoute(match, container) {
    const { route, params, child, query, queryObj } = match;
    const componentTag = this._getRouteComponent(route);
    const importUrl = this._getRouteImportUrl(route);
    if (!componentTag) {
      container.innerHTML = this._renderError(500, 'Route definiert keine Komponente.');
      return;
    }
    try {
      await this._ensureRouteComponent(componentTag, importUrl, route);
    } catch (e) {
      console.error(`Router: Fehler beim dynamischen Import von ${importUrl || componentTag}:`, e);
      container.innerHTML = this._renderError(500, `Fehler beim Laden von <strong>${importUrl || componentTag}</strong>\n${e.message}`);
      return;
    }
    if (customElements.get(componentTag)) {
      let component;
      try {
        component = document.createElement(componentTag);
        component.params = params;
        if (queryObj) component.query = queryObj;
        if (query) component.queryString = query;
        // Übergabe von State-Objekt (History-API)
        if (this._mode === 'history' && window.history.state) {
          component.state = window.history.state;
        }
      } catch (e) {
        container.innerHTML = this._renderError(500, `Fehler beim Erzeugen von <strong>${componentTag}</strong>\n${e.message}`);
        return;
      }
      // Animations-Hook: afterRouteEnter (Instanz-Methode)
      if (typeof component.afterRouteEnter === 'function') {
        setTimeout(() => component.afterRouteEnter(), 0);
      }
      // Wenn es eine Kind-Route gibt, rendere sie in ein Outlet
      if (child) {
        let outlet = component.querySelector('[slot="child"]');
        if (!outlet) {
          outlet = document.createElement('div');
          outlet.setAttribute('slot', 'child');
          component.appendChild(outlet);
        }
        await this._renderRoute(child, outlet);
      }
      container.appendChild(component);
      await this._hydrateRouteTree(component, route);
    } else {
      container.innerHTML = this._renderError(500, `Komponente <strong>${componentTag}</strong> ist nicht definiert oder konnte nicht geladen werden.`);
      console.warn(`Router: Komponente "${componentTag}" für den Pfad "${route.path}" ist nicht definiert oder noch nicht geladen.`);
    }
  }

  async _loadRoutesFromSrc(src) {
    try {
      const resp = await fetch(src, { cache: 'no-store' });
      if (!resp.ok) throw new Error('Routen-JSON konnte nicht geladen werden');
      const data = await resp.json();
      this._routesFromJson = Array.isArray(data) ? data : (data.routes || []);
      this._rebuildRoutesFromJson();
    } catch (e) {
      console.error('Fehler beim Laden der Routen aus JSON:', e);
    }
  }

  _rebuildRoutesFromJson() {
    // Entferne alle bisherigen x-route
    Array.from(this.querySelectorAll('x-route')).forEach(r => r.remove());
    // Baue neue x-route Elemente aus JSON
    const build = (routes, parent) => {
      for (const r of routes) {
        const el = XRouter.createRouteElementFromRecord(r, this.ownerDocument || document);
        parent.appendChild(el);
      }
    };
    build(this._routesFromJson, this);
  }

  _getRoutes() {
    // Wenn Routen aus JSON geladen wurden, nutze die DOM-Struktur
    return this._getTopLevelChildRoutes(this);
  }
}
customElements.define('x-router', XRouter);
