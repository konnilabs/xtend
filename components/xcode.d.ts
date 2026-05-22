import type { XtendCustomEventMap, XtendLayoutDisplayMediaUxProfile, XtendPublicEventContract } from './xtend-public-types';

export type XCodeAttributeName = 'lang' | 'language';
export type XCodeEventName = 'code-copied';
export type XCodeLayoutDisplayMediaUxProfile = XtendLayoutDisplayMediaUxProfile<'x-code'>;
export type XCodeHighlightEngine = 'prism' | 'plain-text' | string;

export interface XCodeHighlightInput {
  code: string;
  language: string;
  rawLanguage?: string;
  languageAlias?: XCodeAttributeName | 'default';
  element?: XCodeElement;
}

export interface XCodeHighlightResult {
  html: string;
  highlighted: boolean;
  engine: XCodeHighlightEngine;
  language: string;
}

export type XCodeHighlighter = ((input: XCodeHighlightInput) => XCodeHighlightResult) | {
  highlight(input: XCodeHighlightInput): XCodeHighlightResult;
};

export interface XCodeSnapshot {
  schema: 'xtend.component.layout-display-media-snapshot.v1';
  componentRef: 'x-code';
  stateKey: string;
  schedule: 'component.idle.hydrate';
  lang: string;
  language: string;
  codeLength: number;
  highlighted: boolean;
  highlightEngine: XCodeHighlightEngine;
  highlightLanguage: string;
  languageAlias: XCodeAttributeName | 'default';
}

export interface XCodeEventDetailMap {
  'code-copied': XCodeSnapshot;
}

export type XCodeEventMap = XtendCustomEventMap<XCodeEventDetailMap>;
export type XCodePublicEventContract = XtendPublicEventContract<XCodeEventName, XCodeSnapshot>;

export interface XCodeElement extends HTMLElement {
  hydrate(): XCodeSnapshot;
  snapshot(): XCodeSnapshot;
  addEventListener<K extends keyof XCodeEventMap>(type: K, listener: (event: XCodeEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
}

export interface XCodeConstructor {
  new (): XCodeElement;
  registerHighlighter(provider: XCodeHighlighter | null): XCodeHighlighter | null;
  getHighlighter(): XCodeHighlighter | null;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-code': XCodeElement;
  }

  interface Window {
    XTendXCodeHighlighter?: XCodeHighlighter;
  }
}

export {};
