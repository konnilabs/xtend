import type { XtendCustomEventMap, XtendFeedbackStatusUxProfile, XtendPublicEventContract } from './xtend-public-types';

export type XAlertType = 'info' | 'success' | 'warning' | 'error';
export type XAlertDismissReason = 'api' | 'button' | 'timeout' | string;
export type XAlertAttributeName = 'type' | 'closable' | 'duration' | 'overlay' | 'aria-label';
export type XAlertEventName = 'alert-shown' | 'alert-dismissed';

export interface XAlertEventDetail {
  id: string;
  message: string;
  type: XAlertType;
  closable: boolean;
  duration: number;
  overlay: boolean;
  ariaLabel: string | null;
  dismissed: boolean;
  reason?: XAlertDismissReason;
  source: 'x-alert';
  stateKey: string;
}

export interface XAlertEventDetailMap {
  'alert-shown': XAlertEventDetail;
  'alert-dismissed': XAlertEventDetail;
}

export type XAlertEventMap = XtendCustomEventMap<XAlertEventDetailMap>;
export type XAlertPublicEventContract = XtendPublicEventContract<XAlertEventName, XAlertEventDetail>;
export type XAlertFeedbackStatusUxProfile = XtendFeedbackStatusUxProfile<'x-alert'>;

export interface XAlertElement extends HTMLElement {
  dismiss(reason?: XAlertDismissReason): void;
  addEventListener<K extends keyof XAlertEventMap>(type: K, listener: (event: XAlertEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-alert': XAlertElement;
  }
}

export {};
