import type { XtendCustomEventMap, XtendPublicEventContract } from './xtend-public-types';

export type XTendStateKey = string;
export type XTendStateStorageType = 'local' | 'session';
export type XTendStateLifecycleEventName =
  | 'state:set'
  | 'state:remove'
  | 'state:clear'
  | 'state:set-path'
  | 'state:batch-update'
  | 'state:subscribe'
  | 'state:unsubscribe'
  | 'state:storage-save'
  | 'state:storage-load'
  | 'state:lifecycle-subscribe'
  | 'state:lifecycle-unsubscribe'
  | 'rmt-state-adapter:create'
  | string;

export interface XTendStateBoundaryContract {
  schema: 'xtend.state.boundary-probe.v1';
  moduleRef: 'xtend-state';
  componentRef: 'xtend-state';
  boundaryKind: 'adapter-boundary-probe';
  customElement: false;
  profiles: Array<'stateful' | 'infrastructure'>;
  publicSurface: string[];
  kernelBoundary: 'no-rmt-kernel-import-of-xtend-types';
}

export interface XTendStateRmtMetadata {
  schema: 'xtend.rmt.state-scheduler-compatibility.v2';
  moduleRef: 'xtend-state';
  adapterRole: 'optional-host-state-bridge';
  schedulerCompatibility: string[];
  canonicalKeys: string[];
  kernelBoundary: 'no-rmt-kernel-import-of-xtend-types';
}

export interface XTendStateLifecycleEventDetail {
  schema: 'xtend.state.lifecycle-event.v1';
  source: 'xtend-state';
  type: XTendStateLifecycleEventName;
  detail: Record<string, unknown>;
  listenerCount: number;
  legacyListenerCount: number;
  timestamp: string;
}

export interface XTendStateSnapshot {
  schema: 'xtend.state.snapshot.v1';
  source: 'xtend-state';
  keys: string[];
  data: Record<string, unknown>;
  listenerCount: number;
  legacyListenerCount: number;
  lifecycleListenerCount: number;
  debug: boolean;
}

export interface XTendStateDiagnosticsSnapshot {
  schema: 'xtend.fabric.state-diagnostics.v1';
  source: 'xtend-state';
  boundary: XTendStateBoundaryContract;
  rmt: XTendStateRmtMetadata;
  operationCounts: Record<string, number>;
  listenerCount: number;
  legacyListenerCount: number;
  lifecycleListenerCount: number;
  lifecycleEvents: XTendStateLifecycleEventDetail[];
  stateKeys: string[];
}

export interface XTendStateRmtStateAdapter {
  schema: 'xtend.rmt.state-scheduler-compatibility.v2';
  source: 'xtend-state';
  schedulerId: string;
  kernelBoundary: 'no-rmt-kernel-import-of-xtend-types';
  get<T = unknown>(key: XTendStateKey): T | undefined;
  set<T = unknown>(key: XTendStateKey, value: T): void;
  batchUpdate(updates: Record<string, unknown>): void;
  remove(key: XTendStateKey): void;
  clear(): void;
  subscribe<T = unknown>(
    fn: (key: string | null, value: T | null | undefined, allData: Record<string, unknown>) => void,
    keyFilter?: string | string[]
  ): () => void;
  snapshot(): XTendStateSnapshot;
  diagnostics(): XTendStateDiagnosticsSnapshot;
}

export interface XTendStateEventDetailMap {
  'xtend-state:lifecycle': XTendStateLifecycleEventDetail;
}

export type XTendStateEventMap = XtendCustomEventMap<XTendStateEventDetailMap>;
export type XTendStatePublicEventContract = XtendPublicEventContract<'xtend-state:lifecycle', XTendStateLifecycleEventDetail>;

export interface XTendStateRuntime {
  xtendStateBoundaryContract: XTendStateBoundaryContract;
  xtendRmtMetadata: XTendStateRmtMetadata;
  get<T = unknown>(key: XTendStateKey): T | undefined;
  set<T = unknown>(key: XTendStateKey, value: T): void;
  subscribe<T = unknown>(
    fn: (key: string | null, value: T | null | undefined, allData: Record<string, unknown>) => void,
    keyFilter?: string | string[]
  ): () => void;
  on<T = unknown>(key: XTendStateKey, fn: (value: T | undefined, allData: Record<string, unknown>, changedKey: string) => void): () => void;
  off<T = unknown>(key: XTendStateKey, fn: (value: T | undefined, allData: Record<string, unknown>, changedKey: string) => void): void;
  remove(key: XTendStateKey): void;
  clear(): void;
  getPath<T = unknown>(path: string): T | undefined;
  setPath<T = unknown>(path: string, value: T): void;
  batchUpdate(updates: Record<string, unknown>): void;
  saveToStorage(storageType?: XTendStateStorageType, key?: string): void;
  loadFromStorage(storageType?: XTendStateStorageType, key?: string): boolean;
  enableDebug(enabled?: boolean): void;
  subscribeLifecycle(fn: (event: XTendStateLifecycleEventDetail, diagnostics: XTendStateDiagnosticsSnapshot) => void): () => void;
  snapshot(): XTendStateSnapshot;
  snapshotDiagnostics(): XTendStateDiagnosticsSnapshot;
  createRmtStateAdapter(options?: { schedulerId?: string }): XTendStateRmtStateAdapter;
}

export declare const XTEND_STATE_BOUNDARY_SCHEMA: 'xtend.state.boundary-probe.v1';
export declare const XTEND_STATE_DIAGNOSTICS_SCHEMA: 'xtend.fabric.state-diagnostics.v1';
export declare const XTEND_STATE_LIFECYCLE_EVENT_SCHEMA: 'xtend.state.lifecycle-event.v1';
export declare const XTEND_STATE_RMT_COMPATIBILITY_SCHEMA: 'xtend.rmt.state-scheduler-compatibility.v2';
export declare const XTEND_STATE_SNAPSHOT_SCHEMA: 'xtend.state.snapshot.v1';
export declare const XTEND_STATE_STORAGE_KEY: 'xtend-state-data';
export declare const xtendState: XTendStateRuntime;

declare global {
  interface Window {
    addEventListener<K extends keyof XTendStateEventMap>(type: K, listener: (event: XTendStateEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
  }
}

export {};
