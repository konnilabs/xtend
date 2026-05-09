import type { XtendCustomEventMap, XtendNavigationRoutingUxProfile, XtendPublicEventContract, XtendRouteMode } from './xtend-public-types';

export type XRouterAttributeName = 'mode' | 'routesrc' | 'title-template' | 'document-title-template' | 'title-prefix' | 'title-suffix' | 'default-title';
export type XRouteAttributeName = 'path' | 'component' | 'import' | 'title' | 'document-title' | 'title-template' | 'meta-description' | 'meta-keywords';
export type XRouterEventName = 'xrouter-before-navigate' | 'route-changed' | 'routechange' | 'xrouter-after-navigate' | 'route-announced' | 'xrouter-routes-registered' | 'xrouter-scroll-boundary-normalized' | 'xrouter-navigation-overlays-closed' | 'xrouter-title-updated';
export type XRouterNavigationRoutingUxProfile = XtendNavigationRoutingUxProfile<'x-router'>;

export interface RouteConfig {
  path: string;
  component?: string;
  import?: string;
  alias?: string;
  redirect?: string;
  title?: string;
  documentTitle?: string;
  titleTemplate?: string;
  'meta-description'?: string;
  'meta-keywords'?: string;
  'before-enter'?: string;
  'scroll-to'?: string;
  template?: string;
  schedule?: string;
  children?: RouteConfig[];
  [key: string]: unknown;
}

export interface XRouterRmtRouteRecord {
  id?: string;
  path: string;
  componentRef?: string;
  component?: string;
  templateRef?: string;
  template?: string;
  scheduleRef?: string;
  schedule?: string;
  metadata?: Record<string, unknown>;
  title?: string;
  documentTitle?: string;
  titleTemplate?: string;
  metaDescription?: string;
  metaKeywords?: string | string[];
  children?: XRouterRmtRouteRecord[];
  [key: string]: unknown;
}

export interface XRouterRouteChangeDetail {
  path: string;
  routeId?: string | null;
  mode?: XtendRouteMode;
  component: string | null;
  template: string | null;
  scheduleRef: string | null;
  params: Record<string, string>;
  query: Record<string, string>;
  metadata: Record<string, unknown> | null;
  title?: string;
  documentTitle?: string;
  meta?: XRouterDocumentMetaDetail | null;
  announcement?: string;
  source: 'x-router';
  stateKey: 'xtend.router.current' | 'xtend.router.announcement';
}

export interface XRouterRoutesRegisteredDetail {
  adapterId: string;
  source: string;
  routeCount: number;
}

export interface XRouterBeforeNavigateDetail {
  path: string;
  mode: XtendRouteMode;
  state?: unknown;
  source: 'x-router';
  stateKey: 'xtend.router.current';
  scheduleRef: 'ui.user-blocking.navigation';
}

export interface XRouterRouteAnnouncedDetail extends XRouterRouteChangeDetail {
  announcement: string;
  stateKey: 'xtend.router.announcement';
  scheduleRef: 'a11y.announce';
}

export interface XRouterScrollBoundaryDetail {
  schema: 'xtend.router.scroll-boundary.v1';
  source: 'x-router';
  stateKey: 'xtend.router.scrollBoundary';
  scheduleRef: 'route.scroll.boundary';
  path: string;
  phase: 'microtask' | 'frame' | 'settled-frame' | 'timer' | string;
  strategy: 'top' | 'element' | 'missing-target' | string;
  targetId: string | null;
  viewportHeight: number;
  scrollHeight: number;
  maxScrollTop: number;
  previousTop: number;
  normalizedTop: number;
  normalized: boolean;
  deadzoneDetected: boolean;
}

export interface XRouterNavigationOverlaysClosedDetail {
  schema: 'xtend.router.closed-navigation-overlays.v1';
  source: 'x-router';
  stateKey: 'xtend.router.closedNavigationOverlays';
  scheduleRef: 'route.navigation.overlay.close';
  path: string;
  overlays: Array<{ tag: 'x-header'; id: string | null }>;
  count: number;
}

export interface XRouterDocumentMetaDetail {
  schema: 'xtend.router.document-meta.v1';
  source: 'x-router';
  stateKey: 'xtend.router.documentMeta';
  scheduleRef: 'route.document.title.rewrite';
  path: string;
  routeId: string | null;
  title: string;
  documentTitle: string;
  description: string;
  keywords: string;
  titleTemplate: string | null;
  metadata: Record<string, unknown>;
}

export interface XRouterSnapshot {
  schema: 'xtend.component.navigation-routing-snapshot.v1';
  source: 'x-router';
  stateKey: 'xtend.router.current';
  mode: XtendRouteMode;
  current: XRouterRouteChangeDetail | null;
  routeCount: number;
  scheduleRef: 'diagnostics.snapshot';
}

export interface RenderRouteResult {
  html: string;
  route: RouteConfig | null;
  params: Record<string, string>;
  meta: {
    title?: string;
    description?: string;
    keywords?: string;
    [key: string]: unknown;
  };
}

export interface XRouterEventDetailMap {
  'xrouter-before-navigate': XRouterBeforeNavigateDetail;
  'route-changed': XRouterRouteChangeDetail;
  routechange: XRouterRouteChangeDetail;
  'xrouter-after-navigate': XRouterRouteChangeDetail;
  'route-announced': XRouterRouteAnnouncedDetail;
  'xrouter-routes-registered': XRouterRoutesRegisteredDetail;
  'xrouter-scroll-boundary-normalized': XRouterScrollBoundaryDetail;
  'xrouter-navigation-overlays-closed': XRouterNavigationOverlaysClosedDetail;
  'xrouter-title-updated': XRouterDocumentMetaDetail;
}

export type XRouterEventMap = XtendCustomEventMap<XRouterEventDetailMap>;
export type XRouterPublicEventContract = XtendPublicEventContract<XRouterEventName, XRouterRouteChangeDetail | XRouterBeforeNavigateDetail | XRouterRouteAnnouncedDetail | XRouterRoutesRegisteredDetail | XRouterScrollBoundaryDetail | XRouterNavigationOverlaysClosedDetail | XRouterDocumentMetaDetail>;

export interface XRouteElement extends HTMLElement {
  readonly path: string;
  readonly component: string;
  readonly importUrl: string | null;
  readonly title: string | null;
  readonly documentTitle: string | null;
}

export interface XRouterElement extends HTMLElement {
  registerRoutes(routes?: XRouterRmtRouteRecord[] | { routes: XRouterRmtRouteRecord[] }, options?: { replace?: boolean; adapterId?: string; source?: string; render?: boolean }): XRouterRoutesRegisteredDetail;
  navigate(to: string | { path?: string; routeId?: string; state?: unknown }, options?: Record<string, unknown>): boolean;
  focusRoute(detail?: XRouterRouteChangeDetail | null): boolean;
  announceRoute(detail?: XRouterRouteChangeDetail | null): XRouterRouteAnnouncedDetail;
  snapshot(): XRouterSnapshot;
  addEventListener<K extends keyof XRouterEventMap>(type: K, listener: (event: XRouterEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
}

export interface XRouterConstructor {
  exportRoutesToJSON(rootElement: HTMLElement | RouteConfig[]): RouteConfig[];
  renderRouteToString(path: string, routes: HTMLElement | RouteConfig[]): RenderRouteResult;
  getMetaForPath(path: string, routes: HTMLElement | RouteConfig[]): Record<string, unknown>;
  normalizeRmtRouteRecord(routeRecord?: XRouterRmtRouteRecord): RouteConfig;
  createRouteElementFromRecord(routeRecord?: XRouterRmtRouteRecord, documentTarget?: Document): XRouteElement;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-router': XRouterElement;
    'x-route': XRouteElement;
  }
  interface Window {
    XRouter?: XRouterConstructor;
  }
}

export {};
