import type { XtendCustomEventMap, XtendLayoutDisplayMediaUxProfile, XtendPublicEventContract } from './xtend-public-types';

export type XCodeAttributeName = 'lang';
export type XCodeEventName = 'code-copied';
export type XCodeLayoutDisplayMediaUxProfile = XtendLayoutDisplayMediaUxProfile<'x-code'>;

export interface XCodeSnapshot {
  schema: 'xtend.component.layout-display-media-snapshot.v1';
  componentRef: 'x-code';
  stateKey: string;
  schedule: 'component.idle.hydrate';
  lang: string;
  codeLength: number;
}

export interface XCodeEventDetailMap {
  'code-copied': XCodeSnapshot;
}

export type XCodeEventMap = XtendCustomEventMap<XCodeEventDetailMap>;
export type XCodePublicEventContract = XtendPublicEventContract<XCodeEventName, XCodeSnapshot>;

export interface XCodeElement extends HTMLElement {
  hydrate(): XCodeSnapshot;
  snapshot(): XCodeSnapshot;
  addEventListener<K extends keyof XCodeEventMap>(type: K, listener: (event: XCodeEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-code': XCodeElement;
  }
}

export {};
