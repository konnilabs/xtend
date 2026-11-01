import type { XtendCustomEventMap, XtendPublicEventContract } from './xtend-public-types';

export type XKeymapAttributeName = 'open' | 'title' | 'entries' | 'locale' | 'platform';
export type XKeymapEventName = 'xkeymap-close' | 'click' | 'keydown';

export interface XKeymapEntry {
  id: string;
  label?: string;
  icon?: string;
  sequence?: string[];
  group?: string;
}

export interface XKeymapCloseEventDetail {
  reason: 'api' | 'escape' | 'button' | 'backdrop' | string;
}

export interface XKeymapRmtMetadata {
  schema: 'xtend.rmt.component-contract.v1';
  adapter: 'xtend.component';
  tag: 'x-keymap';
  eventBindingMode: 'dom-event-to-rmt-command';
  schedules: string[];
  kernelBoundary: 'no-rmt-kernel-import-of-xtend-types';
}

export interface XKeymapPerformanceProfile {
  schema: 'xtend.performance.component-profile.v1';
  componentRef: 'x-keymap';
  profiles: string[];
  primaryProfile: 'overlay';
  budgetClass: 'overlay-interaction';
  lane: 'user-blocking';
  hydrationPolicy: 'visible';
  criticalMeasurements: string[];
}

export interface XKeymapEventDetailMap {
  'xkeymap-close': XKeymapCloseEventDetail;
  click: MouseEvent;
  keydown: KeyboardEvent;
}

export type XKeymapEventMap = XtendCustomEventMap<XKeymapEventDetailMap>;
export type XKeymapPublicEventContract = XtendPublicEventContract<XKeymapEventName, XKeymapCloseEventDetail | MouseEvent | KeyboardEvent>;

export interface XKeymapElement extends HTMLElement {
  entries: XKeymapEntry[];
  addEventListener<K extends keyof XKeymapEventMap>(type: K, listener: (event: XKeymapEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
  isOpen(): boolean;
  open(entries?: XKeymapEntry[]): void;
  close(reason?: string): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-keymap': XKeymapElement;
  }
}
