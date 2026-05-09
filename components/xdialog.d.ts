import type { XtendCustomEventMap, XtendOverlayInteractionUxProfile, XtendPublicEventContract } from './xtend-public-types';

export type XDialogAttributeName = 'open' | 'overlay' | 'title' | 'width' | 'height';
export type XDialogEventName = 'dialog-opened' | 'dialog-closed';
export type XDialogCloseSource = 'api' | 'button' | 'overlay' | 'escape' | 'action' | string;

export interface XDialogLifecycleEventDetail {
  id: string;
  open: boolean;
  source?: XDialogCloseSource;
}

export interface XDialogEventDetailMap {
  'dialog-opened': XDialogLifecycleEventDetail;
  'dialog-closed': XDialogLifecycleEventDetail;
}

export type XDialogEventMap = XtendCustomEventMap<XDialogEventDetailMap>;
export type XDialogPublicEventContract = XtendPublicEventContract<XDialogEventName, XDialogLifecycleEventDetail>;
export type XDialogOverlayInteractionUxProfile = XtendOverlayInteractionUxProfile<'x-dialog'>;

export interface XDialogOverlayInteractionSnapshot {
  schema: 'xtend.component.overlay-interaction-snapshot.v1';
  componentRef: 'x-dialog';
  id: string | null;
  open: boolean;
  overlay: boolean;
  stateKey: string;
  schedule: 'diagnostics.snapshot';
  fabric: {
    lane: 'diagnostics';
  };
}

export interface XDialogElement extends HTMLElement {
  open(): void;
  close(options?: { source?: XDialogCloseSource }): void;
  snapshot(): XDialogOverlayInteractionSnapshot;
  addEventListener<K extends keyof XDialogEventMap>(type: K, listener: (event: XDialogEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-dialog': XDialogElement;
  }
}

export {};
