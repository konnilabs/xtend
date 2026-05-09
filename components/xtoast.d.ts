import type { XtendCustomEventMap, XtendFeedbackStatusUxProfile, XtendPublicEventContract } from './xtend-public-types';

export type XToastType = 'info' | 'success' | 'warning' | 'error';
export type XToastDismissReason = 'api' | 'button' | 'timeout' | string;
export type XToastAttributeName = 'type' | 'duration';
export type XToastEventName = 'toast-shown' | 'toast-dismissed';

export interface XToastEventDetail {
  id: string;
  message: string;
  type: XToastType;
  duration: number;
  dismissed: boolean;
  reason?: XToastDismissReason;
  source: 'x-toast';
  stateKey: string;
}

export interface XToastEventDetailMap {
  'toast-shown': XToastEventDetail;
  'toast-dismissed': XToastEventDetail;
}

export type XToastEventMap = XtendCustomEventMap<XToastEventDetailMap>;
export type XToastPublicEventContract = XtendPublicEventContract<XToastEventName, XToastEventDetail>;
export type XToastFeedbackStatusUxProfile = XtendFeedbackStatusUxProfile<'x-toast'>;

export interface XToastElement extends HTMLElement {
  dismiss(reason?: XToastDismissReason): void;
  addEventListener<K extends keyof XToastEventMap>(type: K, listener: (event: XToastEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-toast': XToastElement;
  }
}

export {};
