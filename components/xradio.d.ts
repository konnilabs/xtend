import type { XtendCustomEventMap, XtendFormControlUxProfile, XtendPublicEventContract } from './xtend-public-types';

export type XRadioAttributeName = 'name' | 'value' | 'checked' | 'disabled' | 'required' | 'label';
export type XRadioEventName = 'radio-changed' | 'radio-invalid';

export interface XRadioChangedEventDetail {
  checked: boolean;
  value: string;
  name: string;
  source: 'x-radio';
}

export interface XRadioInvalidEventDetail {
  checked: boolean;
  value: string;
  name: string;
  message: string;
  source?: 'x-radio';
}

export interface XRadioEventDetailMap {
  'radio-changed': XRadioChangedEventDetail;
  'radio-invalid': XRadioInvalidEventDetail;
}

export type XRadioEventDetail = XRadioChangedEventDetail | XRadioInvalidEventDetail;
export type XRadioEventMap = XtendCustomEventMap<XRadioEventDetailMap>;
export type XRadioFormControlUxProfile = XtendFormControlUxProfile<'x-radio'>;
export type XRadioPublicEventContract = XtendPublicEventContract<XRadioEventName, XRadioEventDetail>;

export interface XRadioElement extends HTMLElement {
  checked: boolean;
  value: string;
  readonly name: string;
  checkValidity(): boolean;
  reportValidity(): boolean;
  validate(): boolean;
  check(): void;
  reset(): void;
  focus(): void;
  addEventListener<K extends keyof XRadioEventMap>(type: K, listener: (event: XRadioEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-radio': XRadioElement;
  }
}

export {};
