import type { XtendCustomEventMap, XtendOverlayInteractionUxProfile, XtendPublicEventContract } from './xtend-public-types';

export type XPopoverAttributeName = 'open' | 'placement' | 'modal' | 'anchor' | 'label';
export type XPopoverEventName = 'popover-opened' | 'popover-closed';
export type XPopoverPlacement = 'top' | 'right' | 'bottom' | 'left';

export interface XPopoverEventDetail {
  id: string;
  open: boolean;
  source: string;
  placement: XPopoverPlacement | string;
  modal: boolean;
}

export interface XPopoverEventDetailMap {
  'popover-opened': XPopoverEventDetail;
  'popover-closed': XPopoverEventDetail;
}

export type XPopoverEventMap = XtendCustomEventMap<XPopoverEventDetailMap>;
export type XPopoverPublicEventContract = XtendPublicEventContract<XPopoverEventName, XPopoverEventDetail>;
export type XPopoverOverlayInteractionUxProfile = XtendOverlayInteractionUxProfile<'x-popover'>;

export interface XPopoverOverlayInteractionSnapshot {
  schema: 'xtend.component.overlay-interaction-snapshot.v1';
  componentRef: 'x-popover';
  id: string | null;
  open: boolean;
  modal: boolean;
  placement: XPopoverPlacement | string;
  stateKey: string;
  schedule: 'diagnostics.snapshot';
  fabric: {
    lane: 'diagnostics';
  };
}

export interface XPopoverElement extends HTMLElement {
  open: boolean;
  readonly modal: boolean;
  show(options?: { source?: string; silent?: boolean }): void;
  hide(options?: { source?: string; silent?: boolean }): void;
  toggle(): void;
  snapshot(): XPopoverOverlayInteractionSnapshot;
  addEventListener<K extends keyof XPopoverEventMap>(type: K, listener: (event: XPopoverEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-popover': XPopoverElement;
  }
}

export {};
