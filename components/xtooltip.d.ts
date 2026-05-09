import type { XtendCustomEventMap, XtendOverlayInteractionUxProfile, XtendPublicEventContract } from './xtend-public-types';

export type XTooltipAttributeName = 'for' | 'placement' | 'open' | 'delay' | 'label';
export type XTooltipEventName = 'tooltip-opened' | 'tooltip-closed';
export type XTooltipPlacement = 'top' | 'right' | 'bottom' | 'left';

export interface XTooltipEventDetail {
  id: string;
  open: boolean;
  source: string;
  placement: XTooltipPlacement | string;
}

export interface XTooltipEventDetailMap {
  'tooltip-opened': XTooltipEventDetail;
  'tooltip-closed': XTooltipEventDetail;
}

export type XTooltipEventMap = XtendCustomEventMap<XTooltipEventDetailMap>;
export type XTooltipPublicEventContract = XtendPublicEventContract<XTooltipEventName, XTooltipEventDetail>;
export type XTooltipOverlayInteractionUxProfile = XtendOverlayInteractionUxProfile<'x-tooltip'>;

export interface XTooltipOverlayInteractionSnapshot {
  schema: 'xtend.component.overlay-interaction-snapshot.v1';
  componentRef: 'x-tooltip';
  id: string | null;
  open: boolean;
  placement: XTooltipPlacement | string;
  stateKey: string;
  schedule: 'diagnostics.snapshot';
  fabric: {
    lane: 'diagnostics';
  };
}

export interface XTooltipElement extends HTMLElement {
  open: boolean;
  readonly label: string;
  readonly delay: number;
  show(options?: { source?: string; immediate?: boolean }): void;
  hide(options?: { source?: string; immediate?: boolean }): void;
  toggle(): void;
  snapshot(): XTooltipOverlayInteractionSnapshot;
  addEventListener<K extends keyof XTooltipEventMap>(type: K, listener: (event: XTooltipEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-tooltip': XTooltipElement;
  }
}

export {};
