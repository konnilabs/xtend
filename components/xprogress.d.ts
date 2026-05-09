import type { XtendCustomEventMap, XtendFeedbackStatusUxProfile, XtendPublicEventContract } from './xtend-public-types';

export type XProgressAttributeName = 'value' | 'max' | 'label' | 'status' | 'indeterminate' | 'busy';
export type XProgressEventName = 'progress-changed' | 'progress-complete';

export interface XProgressEventDetail {
  value: number;
  max: number;
  percent: number;
  source: 'x-progress';
}

export interface XProgressEventDetailMap {
  'progress-changed': XProgressEventDetail;
  'progress-complete': XProgressEventDetail;
}

export type XProgressEventMap = XtendCustomEventMap<XProgressEventDetailMap>;
export type XProgressPublicEventContract = XtendPublicEventContract<XProgressEventName, XProgressEventDetail>;
export type XProgressFeedbackStatusUxProfile = XtendFeedbackStatusUxProfile<'x-progress'>;

export interface XProgressElement extends HTMLElement {
  value: number;
  readonly max: number;
  readonly percent: number;
  readonly indeterminate: boolean;
  readonly busy: boolean;
  setProgress(value: number): void;
  complete(): void;
  reset(): void;
  addEventListener<K extends keyof XProgressEventMap>(type: K, listener: (event: XProgressEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-progress': XProgressElement;
  }
}

export {};
