import type { XtendCustomEventMap, XtendPublicEventContract } from './xtend-public-types';
import type { XTendStateRuntime } from './xtend-state';
import type { XRouterElement } from './xrouter';

export type XtendI18nLocale = string;
export type XtendI18nLocaleEventName =
  | 'xtend-i18n-locale-changing'
  | 'xtend-i18n-locale-changed'
  | 'xtend-i18n-labels-loaded'
  | 'xtend-i18n-labels-applied'
  | 'xtend-i18n-diagnostic'
  | 'xtend-i18n-error';

export interface XtendI18nBoundaryContract {
  schema: 'xtend.i18n.boundary-probe.v1';
  moduleRef: 'xtend-i18n';
  componentRef: 'xtend-i18n';
  customElement: false;
  profiles: Array<'i18n' | 'labelling' | 'infrastructure' | string>;
  publicSurface: string[];
  kernelBoundary: 'no-rmt-kernel-import-of-xtend-types';
}

export interface XtendI18nLabelBundle {
  schema?: 'xtend.i18n.labels.v1' | string;
  locale: XtendI18nLocale;
  labels: Record<string, string>;
}

export type XtendI18nLabelLoader =
  | string
  | XtendI18nLabelBundle
  | Promise<XtendI18nLabelBundle | { default: XtendI18nLabelBundle }>
  | (() => Promise<XtendI18nLabelBundle | { default: XtendI18nLabelBundle }> | XtendI18nLabelBundle);

export interface XtendI18nLabelRecord {
  schema: 'xtend.i18n.label-record.v1';
  key: string;
  locale: XtendI18nLocale;
  fallbackLocale: XtendI18nLocale;
  value: string;
  found: boolean;
  source: string;
}

export interface XtendI18nComponentLabelDescriptor {
  key: string;
  field: string;
  target: 'attribute' | 'text' | 'shadow-attribute' | 'shadow-fallback' | string;
  attribute?: string;
}

export interface XtendI18nComponentLabelContract {
  schema: 'xtend.i18n.component-label-contract.v1';
  componentRef: string;
  mode: 'optional-runtime-labels' | string;
  explicitAuthoringWins: boolean;
  labels: XtendI18nComponentLabelDescriptor[];
}

export interface XtendI18nLocaleEventDetail {
  schema: 'xtend.i18n.locale-event.v1';
  type: 'LOCALE_CHANGING' | 'LOCALE_CHANGED' | 'LOCALE_CHANGE_FAILED' | 'LABELS_APPLIED' | string;
  locale: XtendI18nLocale;
  previousLocale?: XtendI18nLocale | null;
  changed?: boolean;
  source: string;
  available?: XtendI18nLocale[];
  fallbackLocale?: XtendI18nLocale;
  token?: number;
  error?: string | null;
  timestamp: string;
}

export interface XtendI18nLabelsLoadedDetail {
  schema: 'xtend.i18n.labels.v1';
  locale: XtendI18nLocale;
  labelCount: number;
}

export interface XtendI18nDiagnosticDetail {
  schema: 'xtend.i18n.diagnostics.v1';
  code: string;
  level: 'debug' | 'info' | 'warn' | 'error' | string;
  message: string;
  source: 'xtend-i18n';
  metadata: Record<string, unknown>;
  timestamp: string;
}

export interface XtendI18nSnapshot {
  schema: 'xtend.i18n.snapshot.v1';
  source: 'xtend-i18n';
  locale: XtendI18nLocale;
  fallbackLocale: XtendI18nLocale;
  available: XtendI18nLocale[];
  loadedLocales: XtendI18nLocale[];
  labelCounts: Record<string, number>;
  stateKeys: XtendI18nStateKeys;
  componentLabelContractCount: number;
  routerConnectionCount: number;
}

export interface XtendI18nDiagnosticsSnapshot {
  schema: 'xtend.i18n.diagnostics.v1';
  source: 'xtend-i18n';
  boundary: XtendI18nBoundaryContract;
  state: XtendI18nStateAdapterContract;
  router: XtendI18nRouterAdapterContract;
  operationCounts: Record<string, number>;
  diagnostics: XtendI18nDiagnosticDetail[];
  componentLabelContracts: Array<{ schema: string; componentRef: string; labelCount: number }>;
  kernelBoundary: 'no-rmt-kernel-import-of-xtend-types';
}

export interface XtendI18nStateKeys {
  locale: string;
  request: string;
  target: string;
  source: string;
  status: string;
  busy: string;
  available: string;
  fallback: string;
  event: string;
  error: string;
  [key: string]: string;
}

export interface XtendI18nConfigureOptions {
  locale?: XtendI18nLocale;
  defaultLocale?: XtendI18nLocale;
  fallbackLocale?: XtendI18nLocale;
  available?: XtendI18nLocale[];
  stateKeys?: Partial<XtendI18nStateKeys>;
  labels?: Record<string, Record<string, string>>;
  labelLoaders?: Record<string, XtendI18nLabelLoader>;
  root?: Document | ShadowRoot | Element;
  apply?: boolean;
}

export interface XtendI18nStateAdapterContract {
  schema: 'xtend.i18n.state-adapter.v1';
  eventType: 'LOCALE_CHANGED';
  requestKey: 'xtend.i18n.locale.request' | string;
  canonicalKeys: string[];
  kernelBoundary: 'no-rmt-kernel-import-of-xtend-types';
}

export interface XtendI18nStateConnection {
  schema: 'xtend.i18n.state-adapter.v1';
  stateKeys: XtendI18nStateKeys;
  locale: XtendI18nLocale;
  dispose(): void;
}

export interface XtendI18nRouterAdapterContract {
  schema: 'xtend.i18n.xrouter-adapter.v1';
  urlMode: 'both' | 'query' | 'prefix' | string;
  queryParam: string;
  writeStrategy: 'preserve-current-shape' | string;
  routeDetailLocaleField: 'locale' | string;
  kernelBoundary: 'no-rmt-kernel-import-of-xtend-types';
}

export interface XtendI18nRouterOptions {
  urlMode?: 'both' | 'query' | 'prefix' | string;
  queryParam?: string;
  writeStrategy?: 'preserve-current-shape' | 'query' | 'prefix' | string;
  syncInitial?: boolean;
}

export interface XtendI18nRouterConnection extends XtendI18nRouterAdapterContract {
  connected: boolean;
  router?: XRouterElement | Element;
  dispose(): void;
}

export interface XtendI18nEventDetailMap {
  'xtend-i18n-locale-changing': XtendI18nLocaleEventDetail;
  'xtend-i18n-locale-changed': XtendI18nLocaleEventDetail;
  'xtend-i18n-labels-loaded': XtendI18nLabelsLoadedDetail;
  'xtend-i18n-labels-applied': XtendI18nLocaleEventDetail;
  'xtend-i18n-diagnostic': XtendI18nDiagnosticDetail;
  'xtend-i18n-error': XtendI18nLocaleEventDetail;
}

export type XtendI18nEventMap = XtendCustomEventMap<XtendI18nEventDetailMap>;
export type XtendI18nPublicEventContract = XtendPublicEventContract<XtendI18nLocaleEventName, XtendI18nLocaleEventDetail | XtendI18nLabelsLoadedDetail | XtendI18nDiagnosticDetail>;

export interface XtendI18nApi {
  xtendI18nBoundaryContract: XtendI18nBoundaryContract;
  stateAdapterContract: XtendI18nStateAdapterContract;
  xtendRouterAdapterContract: XtendI18nRouterAdapterContract;
  xtendComponentLabelContracts: Map<string, XtendI18nComponentLabelContract>;
  configure(options?: XtendI18nConfigureOptions): XtendI18nSnapshot;
  registerLabels(locale: XtendI18nLocale, bundleOrLoader: XtendI18nLabelLoader): XtendI18nSnapshot;
  loadLocale(locale: XtendI18nLocale): Promise<XtendI18nLabelBundle & { cacheHit?: boolean; missingLoader?: boolean }>;
  setLocale(locale: XtendI18nLocale, options?: { source?: string; updateRouter?: boolean; [key: string]: unknown }): Promise<XtendI18nLocaleEventDetail>;
  getLocale(): XtendI18nLocale;
  getLabelRecord(key: string, fallback?: string): XtendI18nLabelRecord;
  applyLabels(root?: Document | ShadowRoot | Element): XtendI18nLocaleEventDetail;
  bindComponent(element: Element, contract?: XtendI18nComponentLabelContract): XtendI18nComponentLabelContract | null;
  connectState(stateRuntime?: XTendStateRuntime, options?: { stateKeys?: Partial<XtendI18nStateKeys> }): XtendI18nStateConnection;
  connectRouter(router?: XRouterElement | Element | null, options?: XtendI18nRouterOptions): XtendI18nRouterConnection;
  snapshot(): XtendI18nSnapshot;
  snapshotDiagnostics(): XtendI18nDiagnosticsSnapshot;
}

export declare const XTEND_I18N_BOUNDARY_SCHEMA: 'xtend.i18n.boundary-probe.v1';
export declare const XTEND_I18N_COMPONENT_LABEL_CONTRACT_SCHEMA: 'xtend.i18n.component-label-contract.v1';
export declare const XTEND_I18N_DIAGNOSTICS_SCHEMA: 'xtend.i18n.diagnostics.v1';
export declare const XTEND_I18N_EVENT_SCHEMA: 'xtend.i18n.locale-event.v1';
export declare const XTEND_I18N_LABEL_RECORD_SCHEMA: 'xtend.i18n.label-record.v1';
export declare const XTEND_I18N_LABELS_SCHEMA: 'xtend.i18n.labels.v1';
export declare const XTEND_I18N_ROUTER_ADAPTER_SCHEMA: 'xtend.i18n.xrouter-adapter.v1';
export declare const XTEND_I18N_SNAPSHOT_SCHEMA: 'xtend.i18n.snapshot.v1';
export declare const XTEND_I18N_STATE_ADAPTER_SCHEMA: 'xtend.i18n.state-adapter.v1';
export declare const xtendI18n: XtendI18nApi;

declare global {
  interface Window {
    xtendI18n: XtendI18nApi;
    addEventListener<K extends keyof XtendI18nEventMap>(type: K, listener: (event: XtendI18nEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
  }
}

export {};
