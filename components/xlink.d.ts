import type { XtendCustomEventMap, XtendNavigationRoutingUxProfile, XtendPublicEventContract, XtendRouteMode } from './xtend-public-types';

export type XLinkNavigation = 'auto' | 'client' | 'document';
export type XLinkNavigationKind = 'client' | 'document';
export type XLinkAttributeName = 'href' | 'target' | 'rel' | 'state' | 'active' | 'navigation' | 'download';
export type XLinkEventName = 'before-navigate' | 'after-navigate';
export type XLinkNavigationRoutingUxProfile = XtendNavigationRoutingUxProfile<'x-link'>;

export interface XLinkNavigationEventDetail {
  href: string;
  mode: XtendRouteMode;
  state?: unknown;
  navigationKind: XLinkNavigationKind;
  fallbackReason: string | null;
  source: 'x-link';
  stateKey: string;
  scheduleRef: 'ui.user-blocking.navigation';
}

export interface XLinkRouterNavigateDetail {
  path: string;
  state?: unknown;
  mode: XtendRouteMode;
  source: 'x-link';
  stateKey: string;
  scheduleRef: 'ui.user-blocking.navigation';
}

export interface XLinkActiveStateDetail {
  href: string;
  active: boolean;
  source: 'x-link';
  stateKey: string;
  scheduleRef: 'route.visible.render';
}

export interface XLinkSnapshot {
  schema: 'xtend.component.navigation-routing-snapshot.v1';
  source: 'x-link';
  stateKey: string;
  href: string;
  navigation: XLinkNavigation;
  active: boolean;
  external: boolean;
  scheduleRef: 'diagnostics.snapshot';
}

export interface XLinkEventDetailMap {
  'before-navigate': XLinkNavigationEventDetail;
  'after-navigate': XLinkNavigationEventDetail;
}

export type XLinkEventMap = XtendCustomEventMap<XLinkEventDetailMap>;
export type XLinkPublicEventContract = XtendPublicEventContract<XLinkEventName, XLinkNavigationEventDetail>;

export interface XLinkElement extends HTMLElement {
  updateActive(): boolean;
  snapshot(): XLinkSnapshot;
  addEventListener<K extends keyof XLinkEventMap>(type: K, listener: (event: XLinkEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-link': XLinkElement;
  }
}

export {};
