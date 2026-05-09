import type { XtendCustomEventMap, XtendFormControlUxProfile, XtendPublicEventContract } from './xtend-public-types';

export type XWriterAttributeName = 'storage-key' | 'api' | 'method' | 'autosave';
export type XWriterEventName = 'writer:change' | 'writer:save' | 'writer:error' | 'writer:autosave' | 'writer:export';

export interface XWriterChangeEventDetail {
  html: string;
  markdown: string;
  plain: string;
  source?: 'x-writer';
}

export interface XWriterSaveEventDetail {
  status: number | 'local';
  response: unknown;
}

export interface XWriterErrorEventDetail {
  error: unknown;
}

export interface XWriterAutosaveEventDetail {
  source?: 'timer' | 'api' | string;
}

export interface XWriterExportEventDetail {
  filename?: string;
  success?: boolean;
  error?: string;
}

export interface XWriterEventDetailMap {
  'writer:change': XWriterChangeEventDetail;
  'writer:save': XWriterSaveEventDetail;
  'writer:error': XWriterErrorEventDetail;
  'writer:autosave': XWriterAutosaveEventDetail;
  'writer:export': XWriterExportEventDetail;
}

export type XWriterEventMap = XtendCustomEventMap<XWriterEventDetailMap>;
export type XWriterFormControlUxProfile = XtendFormControlUxProfile<'x-writer'>;
export type XWriterPublicEventContract = XtendPublicEventContract<XWriterEventName, XWriterChangeEventDetail | XWriterSaveEventDetail | XWriterErrorEventDetail | XWriterAutosaveEventDetail | XWriterExportEventDetail>;

export interface XWriterElement extends HTMLElement {
  value: string;
  storageKey: string;
  api: string;
  method: string;
  autosaveInterval: number;
  getHTML(): string;
  getText(): string;
  getMarkdown(): string;
  reset(): void;
  focus(): void;
  exportMarkdown(): void;
  exportHTML(): void;
  save(isAutosave?: boolean): Promise<void>;
  addEventListener<K extends keyof XWriterEventMap>(type: K, listener: (event: XWriterEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-writer': XWriterElement;
  }
}

export {};
