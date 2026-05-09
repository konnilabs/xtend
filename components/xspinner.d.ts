import type { XtendCustomEventMap, XtendFeedbackStatusUxProfile, XtendPublicEventContract } from './xtend-public-types';

export type XSpinnerType = 'circle' | 'dots' | string;
export type XSpinnerAttributeName = 'paused' | 'size' | 'color' | 'speed' | 'type' | 'overlay' | 'aria-label' | 'aria-busy' | 'aria-valuetext';
export type XSpinnerEventName = 'spinner-started' | 'spinner-stopped' | 'paused' | 'resumed';

export interface XSpinnerEventDetail {
  id?: string;
  paused?: boolean;
  source?: 'x-spinner';
  stateKey?: string;
}

export interface XSpinnerEventDetailMap {
  'spinner-started': XSpinnerEventDetail;
  'spinner-stopped': XSpinnerEventDetail;
  paused: XSpinnerEventDetail;
  resumed: XSpinnerEventDetail;
}

export type XSpinnerEventMap = XtendCustomEventMap<XSpinnerEventDetailMap>;
export type XSpinnerPublicEventContract = XtendPublicEventContract<XSpinnerEventName, XSpinnerEventDetail>;
export type XSpinnerFeedbackStatusUxProfile = XtendFeedbackStatusUxProfile<'x-spinner'>;

export interface XSpinnerElement extends HTMLElement {
  pause(): void;
  resume(): void;
  snapshot(): { id?: string; paused: boolean; type: string; source: 'x-spinner' };
  addEventListener<K extends keyof XSpinnerEventMap>(type: K, listener: (event: XSpinnerEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-spinner': XSpinnerElement;
  }
}

export {};
