import type { XtendCustomEventMap, XtendPublicEventContract } from './xtend-public-types';

export type XUtilsCategory =
  | 'dom'
  | 'events'
  | 'animation'
  | 'a11y'
  | 'responsive'
  | 'color'
  | 'format'
  | 'templates';

export type XUtilsEventName = 'xutils:import-policy-check';

export interface XUtilsUtilityContract {
  schema: 'xtend.utility.module-contract.v1';
  componentRef: 'x-utils';
  moduleRef: 'xutils';
  customElement: false;
  categories: XUtilsCategory[];
  exports: string[];
  globals: string[];
  fixtureProbe: 'xtend.utility.boundary-probe.v1';
  kernelBoundary: 'no-rmt-kernel-import-of-xtend-types';
  methods?: string[];
}

export interface XUtilsImportPolicy {
  schema: 'xtend.utility.import-policy.v1';
  componentRef: 'x-utils';
  localOnly: true;
  forbiddenProtocols: string[];
  forbiddenHosts: string[];
  cdnPolicy: 'forbidden';
  kernelBoundary: 'no-rmt-kernel-import-of-xtend-types';
}

export interface XUtilsImportPolicyResult {
  schema: 'xtend.utility.import-policy-result.v1';
  componentRef: 'x-utils';
  specifier: string;
  allowed: boolean;
  reason: 'local-import' | 'external-import-blocked';
  policy: 'xtend.utility.import-policy.v1';
  kernelBoundary: 'no-rmt-kernel-import-of-xtend-types';
}

export interface XUtilsBoundarySnapshot {
  schema: 'xtend.utility.boundary-probe.v1';
  componentRef: 'x-utils';
  utility: XUtilsUtilityContract;
  importPolicy: XUtilsImportPolicy;
  customElement: false;
  globalReady: boolean;
}

export interface XUtilsTemplateAction {
  label: string;
  onClick?: EventListener;
}

export interface XUtilsTemplateOptions {
  title?: string;
  content?: string;
  label?: string;
  actions?: XUtilsTemplateAction[];
  style?: string;
  onClick?: EventListener;
}

export interface XUtilsTemplateApi {
  card(opts?: XUtilsTemplateOptions): HTMLElement;
  button(opts?: XUtilsTemplateOptions): HTMLButtonElement;
  modal(opts?: XUtilsTemplateOptions): HTMLElement;
}

export interface XUtilsEventDetailMap {
  'xutils:import-policy-check': XUtilsImportPolicyResult;
}

export type XUtilsEventMap = XtendCustomEventMap<XUtilsEventDetailMap>;
export type XUtilsPublicEventContract = XtendPublicEventContract<XUtilsEventName, XUtilsImportPolicyResult>;

export interface XUtilsApi {
  xtendUtilityContract: XUtilsUtilityContract;
  xtendImportPolicy: XUtilsImportPolicy;
  getUtilityContract(): XUtilsUtilityContract;
  snapshotUtilityContract(): XUtilsBoundarySnapshot;
  assertLocalImport(specifier: string): XUtilsImportPolicyResult;
  find<E extends Element = Element>(selector: string, root?: ParentNode): E | null;
  findAll<E extends Element = Element>(selector: string, root?: ParentNode): E[];
  create<K extends keyof HTMLElementTagNameMap>(tag: K, props?: Partial<HTMLElementTagNameMap[K]>): HTMLElementTagNameMap[K];
  create(tag: string, props?: Record<string, unknown>): HTMLElement;
  on(el: EventTarget, type: string, handler: EventListenerOrEventListenerObject, opts?: boolean | AddEventListenerOptions): () => void;
  delegate(root: Element | Document, selector: string, type: string, handler: (event: Event) => void): () => void;
  fadeIn(el: HTMLElement, duration?: number): void;
  fadeOut(el: HTMLElement, duration?: number): void;
  setAria(el: Element, attrs?: Record<string, string | number | boolean>): void;
  focusTrap(container: Element): void;
  isMobile(): boolean;
  hexToRgb(hex: string): [number, number, number];
  contrastColor(hex: string): '#000' | '#fff';
  formatDate(date: Date | string | number, locale?: string): string;
  formatNumber(num: number, locale?: string): string;
  uniqueId(prefix?: string): string;
  deepClone<T>(obj: T): T;
  XTemplate: XUtilsTemplateApi;
}

export declare const XUtils: XUtilsApi;
export declare const XUTILS_BOUNDARY_PROBE_SCHEMA: 'xtend.utility.boundary-probe.v1';
export declare const XUTILS_IMPORT_POLICY_RESULT_SCHEMA: 'xtend.utility.import-policy-result.v1';
export declare const XUTILS_IMPORT_POLICY_SCHEMA: 'xtend.utility.import-policy.v1';
export declare const XUTILS_UTILITY_CONTRACT_SCHEMA: 'xtend.utility.module-contract.v1';

declare global {
  interface Window {
    XUtils: XUtilsApi;
    addEventListener<K extends keyof XUtilsEventMap>(type: K, listener: (event: XUtilsEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
  }
}

export {};
