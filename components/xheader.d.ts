import type { XtendCustomEventMap, XtendLayoutDisplayMediaUxProfile, XtendPublicEventContract } from './xtend-public-types';

export type XHeaderAttributeName = 'src' | 'logo-size' | 'title' | 'sticky' | 'shadow';
export type XHeaderEventName = 'header-ready' | 'header-layout-changed' | 'menu-opened' | 'menu-closed' | 'logo-loaded';
export type XHeaderLayoutDisplayMediaUxProfile = XtendLayoutDisplayMediaUxProfile<'x-header'>;
export type XHeaderSlotAlignment = 'fixed-responsive-slot-grid';

export interface XHeaderSnapshot {
  schema: 'xtend.component.layout-display-media-snapshot.v1';
  componentRef: 'x-header';
  stateKey: string;
  schedule: 'component.visible.mount';
  menuOpen: boolean;
  src: string | null;
  logoSize: string | null;
  compact: boolean;
  slotModel: 'title-search-actions-nav';
  slotAlignment: XHeaderSlotAlignment;
  drawerMode: 'fixed-full-width-overlay';
}

export interface XHeaderEventDetailMap {
  'header-ready': XHeaderSnapshot;
  'header-layout-changed': XHeaderSnapshot;
  'menu-opened': XHeaderSnapshot & { source?: string };
  'menu-closed': XHeaderSnapshot & { source?: string };
  'logo-loaded': Record<string, never>;
}

export type XHeaderEventMap = XtendCustomEventMap<XHeaderEventDetailMap>;
export type XHeaderPublicEventContract = XtendPublicEventContract<XHeaderEventName, XHeaderSnapshot | (XHeaderSnapshot & { source?: string }) | Record<string, never>>;

export interface XHeaderElement extends HTMLElement {
  toggleMenu(open: boolean): void;
  toggleMenu(open: boolean, options?: { source?: string; sync?: boolean }): void;
  isMenuOpen(): boolean;
  snapshot(): XHeaderSnapshot;
  addEventListener<K extends keyof XHeaderEventMap>(type: K, listener: (event: XHeaderEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-header': XHeaderElement;
  }
}

export {};
