import type { XtendCustomEventMap, XtendFeedbackStatusUxProfile, XtendPublicEventContract } from './xtend-public-types';

export type XStatusAttributeName = 'type' | 'state' | 'message' | 'dismissible' | 'busy' | 'polite' | 'label';
export type XStatusEventName = 'status-changed' | 'status-dismissed';

export interface XStatusState {
  type: string;
  status: string;
  message: string;
  busy: boolean;
  source: 'x-status';
}

export interface XStatusEventDetailMap {
  'status-changed': XStatusState;
  'status-dismissed': XStatusState;
}

export type XStatusEventDetail = XStatusState;
export type XStatusEventMap = XtendCustomEventMap<XStatusEventDetailMap>;
export type XStatusPublicEventContract = XtendPublicEventContract<XStatusEventName, XStatusEventDetail>;
export type XStatusFeedbackStatusUxProfile = XtendFeedbackStatusUxProfile<'x-status'>;

export interface XStatusElement extends HTMLElement {
  readonly type: string;
  readonly busy: boolean;
  readonly dismissible: boolean;
  readonly state: XStatusState;
  setStatus(nextState?: Partial<XStatusState>): void;
  announce(message?: string): void;
  dismiss(): void;
  addEventListener<K extends keyof XStatusEventMap>(type: K, listener: (event: XStatusEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-status': XStatusElement;
  }
}

export {};
