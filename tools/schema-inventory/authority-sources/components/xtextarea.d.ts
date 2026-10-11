import type { XtendCustomEventMap, XtendFormControlUxProfile, XtendPublicEventContract } from './xtend-public-types';
import type { XtendRmtCommandDetail } from './rmt-command';

export type XTextareaAttributeName = 'name' | 'value' | 'placeholder' | 'required' | 'disabled' | 'readonly' | 'maxlength' | 'minlength' | 'rows' | 'label' | 'busy' | 'invalid' | 'density' | 'fill' | 'submit-on-enter' | 'submit-command' | 'syntax-highlight' | 'highlight' | 'line-numbering' | 'lang' | 'language';
export type XTextareaEventName = 'textarea-changed' | 'textarea-invalid' | 'textarea-submit' | 'xtend-command';
export type XTextareaHighlightEngine = 'prism' | 'plain-text' | string;
export type XTextareaLanguageAlias = 'lang' | 'language' | 'default';

export interface XTextareaHighlightInput {
  code: string;
  language: string;
  rawLanguage?: string;
  languageAlias?: XTextareaLanguageAlias;
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

export interface XTextareaPayloadDetail {
  value: string;
  length: number;
  trimmedLength: number;
  empty: boolean;
  maxLength: number;
  source: 'x-textarea';
}

export interface XTextareaChangedEventDetail extends XTextareaPayloadDetail {
  highlighted: boolean;
  highlightEngine: XTextareaHighlightEngine;
  highlightLanguage: string;
}

export interface XTextareaInvalidEventDetail {
  value: string;
  message: string;
  source: 'x-textarea';
}

export interface XTextareaSubmitEventDetail extends XTextareaPayloadDetail {}

export type XTextareaCommandPayload = XTextareaChangedEventDetail | XTextareaSubmitEventDetail | Record<string, unknown>;
export type XTextareaCommandEventDetail = XtendRmtCommandDetail<XTextareaCommandPayload>;

export interface XTextareaEventDetailMap {
  'textarea-changed': XTextareaChangedEventDetail;
  'textarea-invalid': XTextareaInvalidEventDetail;
  'textarea-submit': XTextareaSubmitEventDetail;
  'xtend-command': XTextareaCommandEventDetail;
}

export type XTextareaEventDetail = XTextareaChangedEventDetail | XTextareaInvalidEventDetail | XTextareaSubmitEventDetail | XTextareaCommandEventDetail;
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
  languageAlias: XTextareaLanguageAlias;
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
  readonly formAssociated: true;
  readonly observedAttributes: readonly XTextareaAttributeName[];
  readonly xtendComponentContract: Record<string, unknown>;
  readonly xtendRmtMetadata: Record<string, unknown>;
  readonly xtendComponentLifecycleTelemetry: Record<string, unknown>;
  readonly xtendScaffoldA11yProfile: Record<string, unknown>;
  readonly xtendScaffoldPerformanceProfile: Record<string, unknown>;
  readonly xtendFormControlUxProfile: XTextareaFormControlUxProfile;
  readonly xtendScreenreaderSignals: Record<string, unknown>;
  readonly xtendMotionContrastPolicy: Record<string, unknown>;
  registerHighlighter(provider: XTextareaHighlighter | null): XTextareaHighlighter | null;
  getHighlighter(): XTextareaHighlighter | null;
}

export declare const XTextarea: XTextareaConstructor;

declare global {
  interface HTMLElementTagNameMap {
    'x-textarea': XTextareaElement;
  }

  interface Window {
    XTendXTextareaHighlighter?: XTextareaHighlighter;
  }
}

export {};
