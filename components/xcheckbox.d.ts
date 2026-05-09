import type { XtendCustomEventMap, XtendFormControlUxProfile, XtendPublicEventContract } from './xtend-public-types';

export type XCheckboxAttributeName = 'name' | 'value' | 'checked' | 'disabled' | 'required' | 'indeterminate' | 'label';
export type XCheckboxEventName = 'checkbox-changed' | 'checkbox-invalid';

export interface XCheckboxChangedEventDetail {
  checked: boolean;
  value: string;
  source: 'x-checkbox';
}

export interface XCheckboxInvalidEventDetail {
  checked: boolean;
  value: string;
  message: string;
  source?: 'x-checkbox';
}

export interface XCheckboxEventDetailMap {
  'checkbox-changed': XCheckboxChangedEventDetail;
  'checkbox-invalid': XCheckboxInvalidEventDetail;
}

export type XCheckboxEventDetail = XCheckboxChangedEventDetail | XCheckboxInvalidEventDetail;
export type XCheckboxEventMap = XtendCustomEventMap<XCheckboxEventDetailMap>;
export type XCheckboxFormControlUxProfile = XtendFormControlUxProfile<'x-checkbox'>;
export type XCheckboxPublicEventContract = XtendPublicEventContract<XCheckboxEventName, XCheckboxEventDetail>;

export interface XCheckboxElement extends HTMLElement {
  checked: boolean;
  value: string;
  indeterminate: boolean;
  checkValidity(): boolean;
  reportValidity(): boolean;
  validate(): boolean;
  toggle(): void;
  reset(): void;
  focus(): void;
  addEventListener<K extends keyof XCheckboxEventMap>(type: K, listener: (event: XCheckboxEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-checkbox': XCheckboxElement;
  }
}

export {};
