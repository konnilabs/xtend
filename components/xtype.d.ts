import type { XtendCustomEventMap, XtendLayoutDisplayMediaUxProfile, XtendPublicEventContract } from './xtend-public-types';

export type XTypeAttributeName = 'texts' | 'speed' | 'pause' | 'cursor' | 'blinking-cursor' | 'loop';
export type XTypeEventName = 'typing-started' | 'typing-completed' | 'text-erased';
export type XTypeLayoutDisplayMediaUxProfile = XtendLayoutDisplayMediaUxProfile<'x-type'>;

export interface XTypeTextEventDetail {
  text: string;
}

export interface XTypeSnapshot {
  schema: 'xtend.component.layout-display-media-snapshot.v1';
  componentRef: 'x-type';
  stateKey: 'xtype-current';
  schedule: 'component.idle.hydrate';
  current: string;
  paused: boolean;
}

export interface XTypeEventDetailMap {
  'typing-started': XTypeTextEventDetail;
  'typing-completed': XTypeTextEventDetail;
  'text-erased': Record<string, never>;
}

export type XTypeEventMap = XtendCustomEventMap<XTypeEventDetailMap>;
export type XTypePublicEventContract = XtendPublicEventContract<XTypeEventName, XTypeTextEventDetail | Record<string, never>>;

export interface XTypeElement extends HTMLElement {
  pause(): void;
  resume(): void;
  snapshot(): XTypeSnapshot;
  addEventListener<K extends keyof XTypeEventMap>(type: K, listener: (event: XTypeEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-type': XTypeElement;
  }
}

export {};
