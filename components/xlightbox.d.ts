import type { XtendCustomEventMap, XtendLayoutDisplayMediaUxProfile, XtendPublicEventContract } from './xtend-public-types';

export type XLightboxAttributeName = 'src' | 'open' | 'alt';
export type XLightboxEventName = 'lightbox-opened' | 'lightbox-closed';
export type XLightboxLayoutDisplayMediaUxProfile = XtendLayoutDisplayMediaUxProfile<'x-lightbox'>;

export interface XLightboxOpenedEventDetail {
  src: string;
}

export interface XLightboxClosedEventDetail {
  src?: string;
}

export interface XLightboxSnapshot {
  schema: 'xtend.component.layout-display-media-snapshot.v1';
  componentRef: 'x-lightbox';
  stateKey: string;
  schedule: 'media.lazy.load';
  src: string;
  open: boolean;
}

export interface XLightboxEventDetailMap {
  'lightbox-opened': XLightboxOpenedEventDetail;
  'lightbox-closed': XLightboxClosedEventDetail;
}

export type XLightboxEventMap = XtendCustomEventMap<XLightboxEventDetailMap>;
export type XLightboxPublicEventContract = XtendPublicEventContract<XLightboxEventName, XLightboxOpenedEventDetail | XLightboxClosedEventDetail>;

export interface XLightboxElement extends HTMLElement {
  open(src?: string): boolean;
  close(options?: { source?: string; immediate?: boolean; silent?: boolean }): boolean;
  snapshot(): XLightboxSnapshot;
  addEventListener<K extends keyof XLightboxEventMap>(type: K, listener: (event: XLightboxEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-lightbox': XLightboxElement;
  }
  interface Window {
    showLightbox?: (src: string) => void;
  }
}

export {};
