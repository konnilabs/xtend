import type { XtendCustomEventMap, XtendFormControlUxProfile, XtendPublicEventContract } from './xtend-public-types';

export type XCalendarEventName = 'date-select';

export interface XCalendarState {
  selected: string;
  viewDate: string;
}

export interface XCalendarDateSelectEventDetail {
  value: string;
  date: Date;
  source?: 'x-calendar';
}

export interface XCalendarEventDetailMap {
  'date-select': XCalendarDateSelectEventDetail;
}

export type XCalendarEventMap = XtendCustomEventMap<XCalendarEventDetailMap>;
export type XCalendarFormControlUxProfile = XtendFormControlUxProfile<'x-calendar'>;
export type XCalendarPublicEventContract = XtendPublicEventContract<XCalendarEventName, XCalendarDateSelectEventDetail>;

export interface XCalendarElement extends HTMLElement {
  value: string;
  checkValidity(): boolean;
  reportValidity(): boolean;
  reset(): void;
  focus(): void;
  addEventListener<K extends keyof XCalendarEventMap>(type: K, listener: (event: XCalendarEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-calendar': XCalendarElement;
  }
}

export {};
