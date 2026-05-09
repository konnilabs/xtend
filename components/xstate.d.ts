import type { XtendCustomEventMap, XtendPublicEventContract } from './xtend-public-types';

export type XStateKey = string;
export type XStateStorageType = 'local' | 'session';
export type XStateLifecycleEventName =
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

export interface XStateBoundaryContract {
  schema: 'xtend.state.boundary-probe.v1';
  moduleRef: 'xstate';
  componentRef: 'xstate';
  boundaryKind: 'adapter-boundary-probe';
  customElement: false;
  profiles: Array<'stateful' | 'infrastructure'>;
  publicSurface: string[];
  kernelBoundary: 'no-rmt-kernel-import-of-xtend-types';
}

export interface XStateRmtMetadata {
  schema: 'xtend.rmt.state-scheduler-compatibility.v1';
  moduleRef: 'xstate';
  adapterRole: 'optional-host-state-bridge';
  schedulerCompatibility: string[];
  canonicalKeys: string[];
  kernelBoundary: 'no-rmt-kernel-import-of-xtend-types';
}

export interface XStateLifecycleEventDetail {
  schema: 'xtend.state.lifecycle-event.v1';
  source: 'xstate';
  type: XStateLifecycleEventName;
  detail: Record<string, unknown>;
  listenerCount: number;
  legacyListenerCount: number;
  timestamp: string;
}

export interface XStateSnapshot {
  schema: 'xtend.state.snapshot.v1';
  source: 'xstate';
  keys: string[];
  data: Record<string, unknown>;
  listenerCount: number;
  legacyListenerCount: number;
  lifecycleListenerCount: number;
  debug: boolean;
}

export interface XStateDiagnosticsSnapshot {
  schema: 'xtend.fabric.state-diagnostics.v1';
  source: 'xstate';
  boundary: XStateBoundaryContract;
  rmt: XStateRmtMetadata;
  operationCounts: Record<string, number>;
  listenerCount: number;
  legacyListenerCount: number;
  lifecycleListenerCount: number;
  lifecycleEvents: XStateLifecycleEventDetail[];
  stateKeys: string[];
}

export interface XStateRmtStateAdapter {
  schema: 'xtend.rmt.state-scheduler-compatibility.v1';
  source: 'xstate';
  schedulerId: string;
  kernelBoundary: 'no-rmt-kernel-import-of-xtend-types';
  get<T = unknown>(key: XStateKey): T | undefined;
  set<T = unknown>(key: XStateKey, value: T): void;
  remove(key: XStateKey): void;
  clear(): void;
  subscribe<T = unknown>(
    fn: (key: string | null, value: T | null | undefined, allData: Record<string, unknown>) => void,
    keyFilter?: string | string[]
  ): () => void;
  snapshot(): XStateSnapshot;
  diagnostics(): XStateDiagnosticsSnapshot;
}

export interface XStateEventDetailMap {
  'xstate:lifecycle': XStateLifecycleEventDetail;
}

export type XStateEventMap = XtendCustomEventMap<XStateEventDetailMap>;
export type XStatePublicEventContract = XtendPublicEventContract<'xstate:lifecycle', XStateLifecycleEventDetail>;

export interface XStateApi {
  xtendStateBoundaryContract: XStateBoundaryContract;
  xtendRmtMetadata: XStateRmtMetadata;
  get<T = unknown>(key: XStateKey): T | undefined;
  set<T = unknown>(key: XStateKey, value: T): void;
  subscribe<T = unknown>(
    fn: (key: string | null, value: T | null | undefined, allData: Record<string, unknown>) => void,
    keyFilter?: string | string[]
  ): () => void;
  on<T = unknown>(key: XStateKey, fn: (value: T | undefined, allData: Record<string, unknown>, changedKey: string) => void): () => void;
  off<T = unknown>(key: XStateKey, fn: (value: T | undefined, allData: Record<string, unknown>, changedKey: string) => void): void;
  remove(key: XStateKey): void;
  clear(): void;
  getPath<T = unknown>(path: string): T | undefined;
  setPath<T = unknown>(path: string, value: T): void;
  batchUpdate(updates: Record<string, unknown>): void;
  saveToStorage(storageType?: XStateStorageType, key?: string): void;
  loadFromStorage(storageType?: XStateStorageType, key?: string): boolean;
  enableDebug(enabled?: boolean): void;
  subscribeLifecycle(fn: (event: XStateLifecycleEventDetail, diagnostics: XStateDiagnosticsSnapshot) => void): () => void;
  snapshot(): XStateSnapshot;
  snapshotDiagnostics(): XStateDiagnosticsSnapshot;
  createRmtStateAdapter(options?: { schedulerId?: string }): XStateRmtStateAdapter;
}

export declare const XSTATE_BOUNDARY_SCHEMA: 'xtend.state.boundary-probe.v1';
export declare const XSTATE_DIAGNOSTICS_SCHEMA: 'xtend.fabric.state-diagnostics.v1';
export declare const XSTATE_LIFECYCLE_EVENT_SCHEMA: 'xtend.state.lifecycle-event.v1';
export declare const XSTATE_RMT_COMPATIBILITY_SCHEMA: 'xtend.rmt.state-scheduler-compatibility.v1';
export declare const XSTATE_SNAPSHOT_SCHEMA: 'xtend.state.snapshot.v1';
export declare const xstate: XStateApi;

declare global {
  interface Window {
    xstate: XStateApi;
    addEventListener<K extends keyof XStateEventMap>(type: K, listener: (event: XStateEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
  }
}

export {};
