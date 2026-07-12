import type { XtendCustomEventMap, XtendLayoutDisplayMediaUxProfile, XtendPublicEventContract } from './xtend-public-types';

export type XHeaderAttributeName = 'src' | 'logo-size' | 'title' | 'sticky' | 'shadow' | 'brand-collapse' | 'menu-mode' | 'menu-placement' | 'menu-modal' | 'menu-open' | 'menu-breakpoint' | 'menu-width' | 'menu-max-height' | 'menu-align';
export type XHeaderEventName = 'header-ready' | 'header-layout-changed' | 'header-brand-visibility-changed' | 'menu-before-open' | 'menu-before-close' | 'menu-opened' | 'menu-closed' | 'menu-mode-changed' | 'menu-placement-changed' | 'logo-loaded';
export type XHeaderLayoutDisplayMediaUxProfile = XtendLayoutDisplayMediaUxProfile<'x-header'>;
export type XHeaderSlotAlignment = 'fixed-responsive-slot-grid';
export type XHeaderMenuMode = 'drawer' | 'side-panel' | 'popover' | 'fullscreen' | 'inline-main';
export type XHeaderMenuPlacement = 'start' | 'end' | 'top' | 'bottom';
export type XHeaderMenuAlign = 'start' | 'center' | 'end' | 'stretch';
export type XHeaderBrandCollapsePolicy = 'auto' | 'never' | 'always';
export type XHeaderBrandPresentation = 'logo-title' | 'logo-only';

export interface XHeaderSnapshot {
  schema: 'xtend.component.layout-display-media-snapshot.v1';
  componentRef: 'x-header';
  stateKey: string;
  schedule: 'component.visible.mount';
  menuOpen: boolean;
  src: string | null;
  logoSize: string | null;
  compact: boolean;
  brandCollapse: XHeaderBrandCollapsePolicy;
  brandPresentation: XHeaderBrandPresentation;
  brandTitleFits: boolean;
  brandAvailableWidth: number | null;
  brandRequiredWidth: number | null;
  slotModel: 'title-search-actions-nav';
  slotAlignment: XHeaderSlotAlignment;
  menuMode: XHeaderMenuMode;
  menuPlacement: XHeaderMenuPlacement;
  menuModal: boolean;
  menuBreakpoint: string;
  menuWidth: string | null;
  menuMaxHeight: string | null;
  menuAlign: XHeaderMenuAlign;
  /** @deprecated Use menuMode. Kept as a compatibility alias for the original full-width drawer snapshot. */
  drawerMode: 'fixed-full-width-overlay';
}

export interface XHeaderEventDetailMap {
  'header-ready': XHeaderSnapshot;
  'header-layout-changed': XHeaderSnapshot;
  'header-brand-visibility-changed': XHeaderSnapshot & { source?: string; previousPresentation: XHeaderBrandPresentation };
  'menu-before-open': XHeaderSnapshot & { source?: string };
  'menu-before-close': XHeaderSnapshot & { source?: string };
  'menu-opened': XHeaderSnapshot & { source?: string };
  'menu-closed': XHeaderSnapshot & { source?: string };
  'menu-mode-changed': XHeaderSnapshot & { oldValue: string | null; newValue: string | null };
  'menu-placement-changed': XHeaderSnapshot & { oldValue: string | null; newValue: string | null };
  'logo-loaded': Record<string, never>;
}

export type XHeaderEventMap = XtendCustomEventMap<XHeaderEventDetailMap>;
export type XHeaderPublicEventContract = XtendPublicEventContract<XHeaderEventName, XHeaderSnapshot | (XHeaderSnapshot & { source?: string }) | Record<string, never>>;

export interface XHeaderToggleMenuOptions {
  source?: string;
  sync?: boolean;
  focus?: boolean;
}

export interface XHeaderElement extends HTMLElement {
  toggleMenu(open: boolean): void;
  toggleMenu(open: boolean, options?: XHeaderToggleMenuOptions): void;
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
