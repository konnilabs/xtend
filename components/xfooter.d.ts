import type { XtendCustomEventMap, XtendLayoutDisplayMediaUxProfile, XtendPublicEventContract } from './xtend-public-types';

export type XFooterAttributeName = 'src' | 'logo-size' | 'sticky';
export type XFooterEventName = 'footer-ready' | 'theme-applied' | 'logo-loaded';
export type XFooterLayoutDisplayMediaUxProfile = XtendLayoutDisplayMediaUxProfile<'x-footer'>;

export interface XFooterSnapshot {
  schema: 'xtend.component.layout-display-media-snapshot.v1';
  componentRef: 'x-footer';
  stateKey: string;
  schedule: 'component.visible.mount';
  src: string | null;
  logoSize: string | null;
  sticky: boolean;
}

export interface XFooterThemeEventDetail {
  theme: string | null;
}

export interface XFooterEventDetailMap {
  'footer-ready': XFooterSnapshot;
  'theme-applied': XFooterThemeEventDetail;
  'logo-loaded': Record<string, never>;
}

export type XFooterEventMap = XtendCustomEventMap<XFooterEventDetailMap>;
export type XFooterPublicEventContract = XtendPublicEventContract<XFooterEventName, XFooterSnapshot | XFooterThemeEventDetail | Record<string, never>>;

export interface XFooterElement extends HTMLElement {
  snapshot(): XFooterSnapshot;
  addEventListener<K extends keyof XFooterEventMap>(type: K, listener: (event: XFooterEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-footer': XFooterElement;
  }
}

export {};
