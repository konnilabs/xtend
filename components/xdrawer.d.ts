import type { XtendCustomEventMap, XtendOverlayInteractionUxProfile, XtendPublicEventContract } from './xtend-public-types';

export type XDrawerAttributeName = 'open' | 'placement' | 'modal' | 'label' | 'route-aware';
export type XDrawerEventName = 'drawer-opened' | 'drawer-closed' | 'drawer-route-selected';
export type XDrawerPlacement = 'left' | 'right' | 'bottom';

export interface XDrawerLifecycleEventDetail {
  id: string;
  open: boolean;
  source: string;
  placement: XDrawerPlacement | string;
  modal: boolean;
}

export interface XDrawerRouteSelectedEventDetail {
  id: string;
  routeRef: string | null;
  source: 'x-router';
}

export interface XDrawerEventDetailMap {
  'drawer-opened': XDrawerLifecycleEventDetail;
  'drawer-closed': XDrawerLifecycleEventDetail;
  'drawer-route-selected': XDrawerRouteSelectedEventDetail;
}

export type XDrawerEventMap = XtendCustomEventMap<XDrawerEventDetailMap>;
export type XDrawerPublicEventContract = XtendPublicEventContract<XDrawerEventName, XDrawerLifecycleEventDetail | XDrawerRouteSelectedEventDetail>;
export type XDrawerOverlayInteractionUxProfile = XtendOverlayInteractionUxProfile<'x-drawer'>;

export interface XDrawerOverlayInteractionSnapshot {
  schema: 'xtend.component.overlay-interaction-snapshot.v1';
  componentRef: 'x-drawer';
  id: string | null;
  open: boolean;
  modal: boolean;
  placement: XDrawerPlacement | string;
  stateKey: string;
  schedule: 'diagnostics.snapshot';
  fabric: {
    lane: 'diagnostics';
  };
}

export interface XDrawerElement extends HTMLElement {
  open: boolean;
  readonly modal: boolean;
  openDrawer(options?: { source?: string; silent?: boolean }): void;
  closeDrawer(options?: { source?: string; silent?: boolean }): void;
  toggle(): void;
  snapshot(): XDrawerOverlayInteractionSnapshot;
  addEventListener<K extends keyof XDrawerEventMap>(type: K, listener: (event: XDrawerEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-drawer': XDrawerElement;
  }
}

export {};
