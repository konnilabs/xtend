import type { XtendCustomEventMap, XtendFormControlUxProfile, XtendPublicEventContract } from './xtend-public-types';

export type XSelectAttributeName = 'name' | 'value' | 'disabled' | 'required' | 'multiple' | 'placeholder' | 'label';
export type XSelectEventName = 'select-changed' | 'select-invalid';

export interface XSelectChangedEventDetail {
  value: string;
  values: string[];
  source: 'x-select';
}

export interface XSelectInvalidEventDetail {
  value: string;
  message: string;
  source?: 'x-select';
}

export interface XSelectEventDetailMap {
  'select-changed': XSelectChangedEventDetail;
  'select-invalid': XSelectInvalidEventDetail;
}

export type XSelectEventDetail = XSelectChangedEventDetail | XSelectInvalidEventDetail;
export type XSelectEventMap = XtendCustomEventMap<XSelectEventDetailMap>;
export type XSelectFormControlUxProfile = XtendFormControlUxProfile<'x-select'>;
export type XSelectPublicEventContract = XtendPublicEventContract<XSelectEventName, XSelectEventDetail>;

export interface XSelectElement extends HTMLElement {
  value: string;
  readonly values: string[];
  multiple: boolean;
  checkValidity(): boolean;
  reportValidity(): boolean;
  validate(): boolean;
  reset(): void;
  focus(): void;
  addEventListener<K extends keyof XSelectEventMap>(type: K, listener: (event: XSelectEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-select': XSelectElement;
  }
}

export {};
