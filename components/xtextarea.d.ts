import type { XtendCustomEventMap, XtendFormControlUxProfile, XtendPublicEventContract } from './xtend-public-types';

export type XTextareaAttributeName = 'name' | 'value' | 'placeholder' | 'required' | 'disabled' | 'readonly' | 'maxlength' | 'minlength' | 'rows' | 'label';
export type XTextareaEventName = 'textarea-changed' | 'textarea-invalid';

export interface XTextareaChangedEventDetail {
  value: string;
  length: number;
  maxLength: number;
  source: 'x-textarea';
}

export interface XTextareaInvalidEventDetail {
  value: string;
  message: string;
  source: 'x-textarea';
}

export interface XTextareaEventDetailMap {
  'textarea-changed': XTextareaChangedEventDetail;
  'textarea-invalid': XTextareaInvalidEventDetail;
}

export type XTextareaEventDetail = XTextareaChangedEventDetail | XTextareaInvalidEventDetail;
export type XTextareaEventMap = XtendCustomEventMap<XTextareaEventDetailMap>;
export type XTextareaFormControlUxProfile = XtendFormControlUxProfile<'x-textarea'>;
export type XTextareaPublicEventContract = XtendPublicEventContract<XTextareaEventName, XTextareaEventDetail>;

export interface XTextareaElement extends HTMLElement {
  value: string;
  readonly maxLength: number;
  checkValidity(): boolean;
  reportValidity(): boolean;
  validate(): boolean;
  reset(): void;
  focus(): void;
  addEventListener<K extends keyof XTextareaEventMap>(type: K, listener: (event: XTextareaEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-textarea': XTextareaElement;
  }
}

export {};
