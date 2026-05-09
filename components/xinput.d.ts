import type { XtendCustomEventMap, XtendFormControlUxProfile, XtendPublicEventContract } from './xtend-public-types';

export type XInputAttributeName = 'type' | 'name' | 'value' | 'placeholder' | 'required' | 'disabled';
export type XInputEventName = 'input-changed' | 'validation-failed';

export interface XInputEventDetail {
  value: string;
  source?: 'x-input';
  message?: string;
}

export interface XInputEventDetailMap {
  'input-changed': XInputEventDetail;
  'validation-failed': XInputEventDetail;
}

export type XInputEventMap = XtendCustomEventMap<XInputEventDetailMap>;
export type XInputFormControlUxProfile = XtendFormControlUxProfile<'x-input'>;
export type XInputPublicEventContract = XtendPublicEventContract<XInputEventName, XInputEventDetail>;

export interface XInputElement extends HTMLElement {
  value: string;
  checkValidity(): boolean;
  reportValidity(): boolean;
  validate(): boolean;
  reset(): void;
  focus(): void;
  addEventListener<K extends keyof XInputEventMap>(type: K, listener: (event: XInputEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-input': XInputElement;
  }
}

export {};
