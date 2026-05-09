import type { XtendCustomEventMap, XtendLayoutDisplayMediaUxProfile, XtendPublicEventContract } from './xtend-public-types';

export type XCardsAttributeName = 'columns' | 'gap';
export type XCardsEventName = 'cards-layout';
export type XCardsLayoutDisplayMediaUxProfile = XtendLayoutDisplayMediaUxProfile<'x-cards'>;

export interface XCardsSnapshot {
  schema: 'xtend.component.layout-display-media-snapshot.v1';
  componentRef: 'x-cards';
  stateKey: string;
  schedule: 'layout.reflow.commit';
  columns: string;
  gap: string;
}

export interface XCardsEventDetailMap {
  'cards-layout': XCardsSnapshot;
}

export type XCardsEventMap = XtendCustomEventMap<XCardsEventDetailMap>;
export type XCardsPublicEventContract = XtendPublicEventContract<XCardsEventName, XCardsSnapshot>;

export interface XCardsElement extends HTMLElement {
  snapshot(): XCardsSnapshot;
  addEventListener<K extends keyof XCardsEventMap>(type: K, listener: (event: XCardsEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-cards': XCardsElement;
  }
}

export {};
