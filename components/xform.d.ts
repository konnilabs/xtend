import type { XtendCustomEventMap, XtendFormControlUxProfile, XtendPublicEventContract } from './xtend-public-types';

export type XFormEventName = 'submit' | 'invalid' | 'reset';
export type XFormData = Record<string, unknown>;

export interface XFormSubmitEventDetail {
  data: XFormData;
}

export interface XFormInvalidEventDetail {
  message: string;
  invalidElements: HTMLElement[];
}

export interface XFormResetEventDetail {
  source?: 'user' | 'api' | string;
}

export interface XFormEventDetailMap {
  submit: XFormSubmitEventDetail;
  invalid: XFormInvalidEventDetail;
  reset: XFormResetEventDetail;
}

export type XFormEventMap = XtendCustomEventMap<XFormEventDetailMap>;
export type XFormControlUxProfile = XtendFormControlUxProfile<'x-form'>;
export type XFormPublicEventContract = XtendPublicEventContract<XFormEventName, XFormSubmitEventDetail | XFormInvalidEventDetail | XFormResetEventDetail>;

export interface XFormElement extends HTMLElement {
  getFormData(): XFormData;
  validate(): boolean;
  submit(): void;
  reset(): void;
  addEventListener<K extends keyof XFormEventMap>(type: K, listener: (event: XFormEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-form': XFormElement;
  }
}

export {};
