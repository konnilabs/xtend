import type { XtendCustomEventMap, XtendNavigationRoutingUxProfile, XtendPublicEventContract, XtendRouteMode } from './xtend-public-types';

export type XRouterNavigationPolicy = 'progressive' | 'spa' | 'document';
export type XRouterAttributeName = 'mode' | 'routesrc' | 'reuse-component' | 'adopt-prerendered-route' | 'navigation-policy' | 'skeleton' | 'skeleton-profile' | 'skeleton-lines' | 'skeleton-min-height' | 'title-template' | 'document-title-template' | 'title-prefix' | 'title-suffix' | 'default-title';
export type XRouteAttributeName = 'path' | 'component' | 'import' | 'title' | 'document-title' | 'title-template' | 'meta-description' | 'meta-keywords' | 'skeleton' | 'skeleton-profile' | 'skeleton-lines' | 'skeleton-min-height' | 'hydrate-schedule';
export type XRouterEventName = 'xrouter-before-navigate' | 'route-changed' | 'routechange' | 'xrouter-after-navigate' | 'route-announced' | 'xrouter-routes-registered' | 'xrouter-route-reused' | 'xrouter-route-adopted' | 'xrouter-skeleton-shown' | 'xrouter-skeleton-hidden' | 'xrouter-route-hydrated' | 'xrouter-scroll-boundary-normalized' | 'xrouter-navigation-overlays-closed' | 'xrouter-title-updated';
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
  skeleton?: string;
  skeletonProfile?: string;
  skeletonLines?: string | number;
  skeletonMinHeight?: string;
  hydration?: { schedule?: string; scheduleRef?: string; [key: string]: unknown };
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
  skeleton?: string;
  skeletonProfile?: string;
  skeletonLines?: string | number;
  skeletonMinHeight?: string;
  hydration?: { schedule?: string; scheduleRef?: string; [key: string]: unknown };
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
  locale?: string;
  i18n?: {
    schema: 'xtend.i18n.xrouter-adapter.v1' | string;
    locale: string;
    source: 'xtend-i18n' | string;
  };
  source: 'x-router';
  stateKey: 'xtend.router.current' | 'xtend.router.announcement';
  reused?: boolean;
}

export interface XRouterRouteReusedDetail extends XRouterRouteChangeDetail {
  reused: true;
  stateKey: 'xtend.router.current';
}

export interface XRouterRouteAdoptedDetail {
  schema: 'xtend.router.route-adoption.v1';
  source: 'x-router';
  stateKey: 'xtend.router.routeAdoption';
  scheduleRef: 'route.visible.adopt';
  path: string;
  routeId: string | null;
  component: string | null;
  adopted: boolean;
  reason: 'adopted' | 'candidate-count-mismatch' | 'route-proof-missing' | 'component-mismatch' | 'path-mismatch' | 'route-id-mismatch' | 'locale-mismatch' | 'content-proof-missing' | 'content-proof-mismatch' | 'content-proof-unavailable' | 'trust-proof-missing' | 'trust-proof-mismatch' | 'navigation-superseded' | 'component-unavailable' | 'adoption-handler-missing' | 'adoption-refused' | 'adoption-error' | string;
  diagnostic?: string | null;
}

export interface XRouterAdoptionContext {
  path: string;
  route: XRouteElement;
  match: unknown;
  params: Record<string, string>;
  query: string;
  queryObj: Record<string, string>;
  documentMeta: XRouterDocumentMetaDetail | null;
  router: XRouterElement;
  adopted: true;
  reused: true;
}

export interface XRouterAdoptableRouteElement extends HTMLElement {
  adoptRoute?(context: XRouterAdoptionContext): boolean | void | Promise<boolean | void>;
  updateRoute?(context: XRouterAdoptionContext): boolean | void | Promise<boolean | void>;
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

export interface XRouterSkeletonDetail {
  schema: 'xtend.router.skeleton-loader.v1';
  source: 'x-router';
  stateKey: 'xtend.router.skeleton';
  scheduleRef: string;
  routeId: string | null;
  path: string;
  profile?: string;
  status?: 'shown' | 'loader-unavailable' | string;
  active: boolean;
}

export interface XRouterRouteHydratedDetail {
  schema: string;
  source: string;
  reason?: string;
  schedule?: string;
  scheduleRef: string;
  routeId: string | null;
  tags?: string[];
  elementCount?: number;
  hydrated?: number;
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

export interface XRouterNavigationCapability {
  schema: 'xtend.router.navigation-capability.v1';
  capable: boolean;
  navigationKind: 'client' | 'document';
  reason: string;
  href: string;
  path: string;
  policy: XRouterNavigationPolicy;
  routeId: string | null;
}

export interface XRouterNavigationContext {
  source?: string;
  element?: Element | null;
  event?: MouseEvent | PointerEvent | null;
  navigation?: 'auto' | 'client' | 'document';
  target?: string | null;
  download?: boolean;
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
  'xrouter-route-reused': XRouterRouteReusedDetail;
  'xrouter-route-adopted': XRouterRouteAdoptedDetail;
  'xrouter-skeleton-shown': XRouterSkeletonDetail;
  'xrouter-skeleton-hidden': XRouterSkeletonDetail;
  'xrouter-route-hydrated': XRouterRouteHydratedDetail;
  'xrouter-scroll-boundary-normalized': XRouterScrollBoundaryDetail;
  'xrouter-navigation-overlays-closed': XRouterNavigationOverlaysClosedDetail;
  'xrouter-title-updated': XRouterDocumentMetaDetail;
}

export type XRouterEventMap = XtendCustomEventMap<XRouterEventDetailMap>;
export type XRouterPublicEventContract = XtendPublicEventContract<XRouterEventName, XRouterRouteChangeDetail | XRouterBeforeNavigateDetail | XRouterRouteAnnouncedDetail | XRouterRoutesRegisteredDetail | XRouterRouteReusedDetail | XRouterRouteAdoptedDetail | XRouterSkeletonDetail | XRouterRouteHydratedDetail | XRouterScrollBoundaryDetail | XRouterNavigationOverlaysClosedDetail | XRouterDocumentMetaDetail>;

export interface XRouteElement extends HTMLElement {
  readonly path: string;
  readonly component: string;
  readonly importUrl: string | null;
  readonly title: string | null;
  readonly documentTitle: string | null;
  readonly skeleton: string | null;
  readonly skeletonProfile: string | null;
  readonly skeletonLines: string | null;
  readonly skeletonMinHeight: string | null;
  readonly hydrateSchedule: string | null;
}

export interface XRouterElement extends HTMLElement {
  registerRoutes(routes?: XRouterRmtRouteRecord[] | { routes: XRouterRmtRouteRecord[] }, options?: { replace?: boolean; adapterId?: string; source?: string; render?: boolean }): XRouterRoutesRegisteredDetail;
  navigate(to: string | { path?: string; routeId?: string; state?: unknown }, options?: Record<string, unknown>): boolean;
  canNavigate(href: string, context?: XRouterNavigationContext): XRouterNavigationCapability;
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
