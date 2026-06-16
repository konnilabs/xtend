import type { XtendCustomEventMap, XtendFormControlUxProfile, XtendPublicEventContract } from './xtend-public-types';

export type XTextareaAttributeName = 'name' | 'value' | 'placeholder' | 'required' | 'disabled' | 'readonly' | 'maxlength' | 'minlength' | 'rows' | 'label' | 'busy' | 'invalid' | 'density' | 'fill' | 'submit-on-enter' | 'syntax-highlight' | 'highlight' | 'line-numbering' | 'lang' | 'language';
export type XTextareaEventName = 'textarea-changed' | 'textarea-invalid' | 'textarea-submit';
export type XTextareaHighlightEngine = 'prism' | 'plain-text' | string;

export interface XTextareaHighlightInput {
  code: string;
  language: string;
  rawLanguage?: string;
  languageAlias?: XTextareaAttributeName | 'default';
  element?: XTextareaElement;
}

export interface XTextareaHighlightResult {
  html: string;
  highlighted: boolean;
  engine: XTextareaHighlightEngine;
  language: string;
}

export type XTextareaHighlighter = ((input: XTextareaHighlightInput) => XTextareaHighlightResult) | {
  highlight(input: XTextareaHighlightInput): XTextareaHighlightResult;
};

export interface XTextareaChangedEventDetail {
  value: string;
  length: number;
  maxLength: number;
  source: 'x-textarea';
  highlighted: boolean;
  highlightEngine: XTextareaHighlightEngine;
  highlightLanguage: string;
}

export interface XTextareaInvalidEventDetail {
  value: string;
  message: string;
  source: 'x-textarea';
}

export interface XTextareaSubmitEventDetail {
  value: string;
  length: number;
  maxLength: number;
  source: 'x-textarea';
}

export interface XTextareaEventDetailMap {
  'textarea-changed': XTextareaChangedEventDetail;
  'textarea-invalid': XTextareaInvalidEventDetail;
  'textarea-submit': XTextareaSubmitEventDetail;
}

export type XTextareaEventDetail = XTextareaChangedEventDetail | XTextareaInvalidEventDetail | XTextareaSubmitEventDetail;
export type XTextareaEventMap = XtendCustomEventMap<XTextareaEventDetailMap>;
export type XTextareaFormControlUxProfile = XtendFormControlUxProfile<'x-textarea'>;
export type XTextareaPublicEventContract = XtendPublicEventContract<XTextareaEventName, XTextareaEventDetail>;

export interface XTextareaSnapshot {
  schema: 'xtend.component.form-control-snapshot.v1';
  componentRef: 'x-textarea';
  stateKey: string;
  valueLength: number;
  maxLength: number;
  highlighted: boolean;
  highlightEngine: XTextareaHighlightEngine;
  highlightLanguage: string;
  languageAlias: XTextareaAttributeName | 'default';
  lineNumbering: boolean;
  lineCount: number;
}

export interface XTextareaElement extends HTMLElement {
  value: string;
  lineNumbering: boolean;
  readonly maxLength: number;
  checkValidity(): boolean;
  reportValidity(): boolean;
  validate(): boolean;
  reset(): void;
  focus(): void;
  snapshot(): XTextareaSnapshot;
  addEventListener<K extends keyof XTextareaEventMap>(type: K, listener: (event: XTextareaEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
}

export interface XTextareaConstructor {
  new (): XTextareaElement;
  registerHighlighter(provider: XTextareaHighlighter | null): XTextareaHighlighter | null;
  getHighlighter(): XTextareaHighlighter | null;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-textarea': XTextareaElement;
  }

  interface Window {
    XTendXTextareaHighlighter?: XTextareaHighlighter;
  }
}

export {};
