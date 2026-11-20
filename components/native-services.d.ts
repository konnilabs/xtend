import type { XTendStateRuntime } from './xtend-state.js';
import type { XtendI18nApi } from './xtend-i18n.js';
import type { XThemeManager } from './xtheme.js';
import type { XUtilsApi } from './xutils.js';

export declare const NATIVE_SERVICES_SCHEMA: 'xtend.native-services.port.v1';
export declare const NATIVE_STATE_PORT_SCHEMA: 'xtend.native-services.state-port.v1';
export interface ManagedNativeStatePort {
  readonly schema: typeof NATIVE_STATE_PORT_SCHEMA;
  get(key: string): unknown;
  set(key: string, value: unknown): unknown;
  remove(key: string): unknown;
  batchUpdate(values: Record<string, unknown>): unknown;
  subscribe(callback: (key: string, value: unknown) => void, filter?: string | string[]): () => void;
  snapshot(): Record<string, unknown>;
  dispose(): void;
}
export interface NativePlatformLease {
  readonly element: HTMLElement;
  readonly owner: NativeServiceOwner;
  readonly ref: string;
  readonly keys: readonly (string | number)[];
  readonly signal: AbortSignal;
  isCurrent(): boolean;
}
export interface NativePlatformBinding {
  connect?(): void;
  command?(name: string, payload: Record<string, unknown>): unknown;
  executeCommand?(name: string, payload: Record<string, unknown>): unknown;
  policySnapshot?(): Record<string, unknown>;
  update?(value: Record<string, unknown>): unknown;
  leaseBounds?(active: boolean): void;
  readonly manager?: HTMLElement;
  readonly controller?: unknown;
  release(): void;
}
export interface NativeServiceHostPorts {
  state?: XTendStateRuntime;
  theme?: { manager: XThemeManager; root: Element; global?: true; release?(): void };
  themeEnvironment?: {
    storage?: Pick<Storage, 'getItem' | 'setItem'>;
    matchMedia?: (query: string) => MediaQueryList;
    loadCss?: (url: string, context: { root: Element; owner: string; signal?: AbortSignal; scopeSelector: string }) => Promise<string>;
  };
  transition?: (input: Record<string, unknown> & { target: Element; signal?: AbortSignal }) => unknown;
  platform?: Partial<Record<'bindRouter' | 'bindManager' | 'bindPortal' | 'bindSurface', (args: Record<string, unknown>, lease: NativePlatformLease) => NativePlatformBinding>>;
}
export interface ManagedNativeServices {
  readonly schema: typeof NATIVE_SERVICES_SCHEMA;
  readonly apiVersion: '1.0.0';
  readonly owner: string;
  readonly state: ManagedNativeStatePort;
  readonly i18n: XtendI18nApi & { dispose(): void };
  readonly theme: XThemeManager & { dispose?(): void };
  readonly utils: Pick<XUtilsApi, 'hexToRgb' | 'contrastColor' | 'formatDate' | 'formatNumber' | 'deepClone' | 'setAria'> & { runUiTransition(input: Record<string, unknown> & { target?: Element; element?: Element }): unknown };
  dispatch(capability: string, args: Record<string, unknown>, lease: NativePlatformLease): NativePlatformBinding;
  dispose(): void;
}
export type NativeServiceOwner = string | { id: string } | { documentId: string; surfaceId: string; generation: number; controllerId?: string };
export declare function createManagedStatePort(options: { owner: NativeServiceOwner; runtime?: XTendStateRuntime; signal?: AbortSignal }): ManagedNativeStatePort;
export declare function createManagedNativeServices(options: { root: Element; owner: NativeServiceOwner; ports?: NativeServiceHostPorts; signal?: AbortSignal }): ManagedNativeServices;
