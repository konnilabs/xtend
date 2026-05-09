import type { XtendCustomEventMap, XtendLayoutDisplayMediaUxProfile, XtendPublicEventContract } from './xtend-public-types';

export type XSectionAttributeName = 'padding' | 'background' | 'bordered' | 'layout' | 'label';
export type XSectionEventName = 'section-rendered';
export type XSectionLayoutDisplayMediaUxProfile = XtendLayoutDisplayMediaUxProfile<'x-section'>;

export interface XSectionSnapshot {
  schema: 'xtend.component.layout-display-media-snapshot.v1';
  componentRef: 'x-section';
  stateKey: string;
  schedule: 'layout.measure';
  layout: string;
  label: string;
}

export interface XSectionEventDetailMap {
  'section-rendered': XSectionSnapshot;
}

export type XSectionEventMap = XtendCustomEventMap<XSectionEventDetailMap>;
export type XSectionPublicEventContract = XtendPublicEventContract<XSectionEventName, XSectionSnapshot>;

export interface XSectionElement extends HTMLElement {
  snapshot(): XSectionSnapshot;
  addEventListener<K extends keyof XSectionEventMap>(type: K, listener: (event: XSectionEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-section': XSectionElement;
  }
}

export {};
