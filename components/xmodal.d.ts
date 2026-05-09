import type { XtendCustomEventMap, XtendOverlayInteractionUxProfile, XtendPublicEventContract } from './xtend-public-types';

export type XModalAttributeName = 'open' | 'overlay' | 'title' | 'content' | 'actions';
export type XModalEventName = 'modal-opened' | 'modal-closed' | 'modal-action';
export type XModalCloseSource = 'api' | 'button' | 'overlay' | 'escape' | 'action' | string;

export interface XModalActionDefinition {
  label?: string;
  action?: string;
  primary?: boolean;
  close?: boolean;
  callback?: (modal: XModalElement, action: XModalActionDefinition) => void;
  [key: string]: unknown;
}

export interface XModalLifecycleEventDetail {
  id: string;
  open: boolean;
  source?: XModalCloseSource;
}

export interface XModalActionEventDetail {
  id: string;
  action: string;
  definition: XModalActionDefinition;
}

export interface XModalEventDetailMap {
  'modal-opened': XModalLifecycleEventDetail;
  'modal-closed': XModalLifecycleEventDetail;
  'modal-action': XModalActionEventDetail;
}

export type XModalEventMap = XtendCustomEventMap<XModalEventDetailMap>;
export type XModalPublicEventContract = XtendPublicEventContract<XModalEventName, XModalLifecycleEventDetail | XModalActionEventDetail>;
export type XModalOverlayInteractionUxProfile = XtendOverlayInteractionUxProfile<'x-modal'>;

export interface XModalOverlayInteractionSnapshot {
  schema: 'xtend.component.overlay-interaction-snapshot.v1';
  componentRef: 'x-modal';
  id: string | null;
  open: boolean;
  overlay: boolean;
  stateKey: string;
  schedule: 'diagnostics.snapshot';
  fabric: {
    lane: 'diagnostics';
  };
}

export interface XModalElement extends HTMLElement {
  open(): void;
  close(options?: { source?: XModalCloseSource }): void;
  snapshot(): XModalOverlayInteractionSnapshot;
  addEventListener<K extends keyof XModalEventMap>(type: K, listener: (event: XModalEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-modal': XModalElement;
  }
}

export {};
