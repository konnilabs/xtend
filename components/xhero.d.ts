import type { XtendCustomEventMap, XtendLayoutDisplayMediaUxProfile, XtendPublicEventContract } from './xtend-public-types';

export type XHeroAttributeName = 'background' | 'background-light' | 'background-dark' | 'background-image' | 'align' | 'vertical-align' | 'fullheight' | 'overlay' | 'overlay-light' | 'overlay-dark' | 'animate' | 'scroll-button' | 'font-color' | 'font-color-light' | 'font-color-dark' | 'text-box';
export type XHeroEventName = 'hero-rendered' | 'hero-animated';
export type XHeroLayoutDisplayMediaUxProfile = XtendLayoutDisplayMediaUxProfile<'x-hero'>;

export interface XHeroSnapshot {
  schema: 'xtend.component.layout-display-media-snapshot.v1';
  componentRef: 'x-hero';
  stateKey: string;
  schedule: 'component.shell.render';
  background: string | null;
  backgroundLight: string | null;
  backgroundDark: string | null;
  backgroundImage: string | null;
  fullheight: boolean;
  overlay: boolean;
  overlayLight: string | null;
  overlayDark: string | null;
}

export interface XHeroEventDetailMap {
  'hero-rendered': XHeroSnapshot;
  'hero-animated': Record<string, never>;
}

export type XHeroEventMap = XtendCustomEventMap<XHeroEventDetailMap>;
export type XHeroPublicEventContract = XtendPublicEventContract<XHeroEventName, XHeroSnapshot | Record<string, never>>;

export interface XHeroElement extends HTMLElement {
  scrollPast(): void;
  snapshot(): XHeroSnapshot;
  addEventListener<K extends keyof XHeroEventMap>(type: K, listener: (event: XHeroEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-hero': XHeroElement;
  }
}

export {};
