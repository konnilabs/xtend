import type { XtendCustomEventMap, XtendLayoutDisplayMediaUxProfile, XtendPublicEventContract } from './xtend-public-types';

export type XMasonryAttributeName = 'columns' | 'gap' | 'save-positions';
export type XMasonryEventName = 'masonry-layout';
export type XMasonryLayoutDisplayMediaUxProfile = XtendLayoutDisplayMediaUxProfile<'x-masonry'>;

export interface XMasonrySnapshot {
  schema: 'xtend.component.layout-display-media-snapshot.v1';
  componentRef: 'x-masonry';
  stateKey: string;
  schedule: 'layout.reflow.commit';
  columns: string;
  gap: string;
  order: string[];
}

export interface XMasonryEventDetailMap {
  'masonry-layout': XMasonrySnapshot;
}

export type XMasonryEventMap = XtendCustomEventMap<XMasonryEventDetailMap>;
export type XMasonryPublicEventContract = XtendPublicEventContract<XMasonryEventName, XMasonrySnapshot>;

export interface XMasonryElement extends HTMLElement {
  snapshot(): XMasonrySnapshot;
  addEventListener<K extends keyof XMasonryEventMap>(type: K, listener: (event: XMasonryEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-masonry': XMasonryElement;
  }
}

export {};
