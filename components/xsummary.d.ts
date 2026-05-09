import type { XtendCustomEventMap, XtendLayoutDisplayMediaUxProfile, XtendPublicEventContract } from './xtend-public-types';

export type XSummaryType = 'info' | 'success' | 'warning' | 'danger' | string;
export type XSummaryAttributeName = 'open' | 'type';
export type XSummaryEventName = 'open' | 'close';
export type XSummaryLayoutDisplayMediaUxProfile = XtendLayoutDisplayMediaUxProfile<'x-summary'>;

export interface XSummaryToggleEventDetail {
  open: boolean;
}

export interface XSummarySnapshot {
  schema: 'xtend.component.layout-display-media-snapshot.v1';
  componentRef: 'x-summary';
  stateKey: string;
  schedule: 'component.visible.mount';
  open: boolean;
  type: string;
}

export interface XSummaryEventDetailMap {
  open: XSummaryToggleEventDetail;
  close: XSummaryToggleEventDetail;
}

export type XSummaryEventMap = XtendCustomEventMap<XSummaryEventDetailMap>;
export type XSummaryPublicEventContract = XtendPublicEventContract<XSummaryEventName, XSummaryToggleEventDetail>;

export interface XSummaryElement extends HTMLElement {
  open(): void;
  close(): void;
  toggle(): void;
  snapshot(): XSummarySnapshot;
  addEventListener<K extends keyof XSummaryEventMap>(type: K, listener: (event: XSummaryEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-summary': XSummaryElement;
  }
}

export {};
