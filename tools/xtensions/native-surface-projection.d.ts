import type { NativeViewProjection, NativeViewValue, NativeViewRepeat, NativeViewTagName } from './native-view-projection';
import type { NativeComponentMetadata } from './native-component-contract';
export const NATIVE_SURFACE_VIEW_API_VERSION: '3.0.0';
export const NATIVE_SURFACE_VIEW_SCHEMA: 'xtend.rmt.native-view.v2';
export { assertNativeCanonicalData } from './native-view-projection';
export interface NativeSurfaceViewScope {
  readonly surface: string;
  readonly repeat?: NativeViewRepeat;
  readonly presence?: { readonly state: string; readonly path: readonly (string | number | { readonly repeat: number })[] };
  readonly parent?: string;
  readonly placement?: 'nested' | 'portal';
}
export interface NativeSurfaceViewEventKeys {
  readonly event: string; readonly surface: string; readonly astPointer: string; readonly fields: Readonly<Record<string, number>>;
}
export interface NativeSurfaceViewHeader {
  readonly schema: typeof NATIVE_SURFACE_VIEW_SCHEMA;
  readonly documentId: string;
  readonly surfaces: readonly string[];
  readonly components: readonly NativeComponentMetadata[];
  readonly scopes: readonly NativeSurfaceViewScope[];
  readonly eventKeys: readonly NativeSurfaceViewEventKeys[];
}
export type NativeSurfaceViewNode = {
  readonly type: 'element'; readonly nativeDeclarationId: string; readonly tag: NativeViewTagName;
  readonly attributes?: Readonly<Record<string, NativeViewValue>>; readonly properties?: Readonly<Record<string, NativeViewValue>>;
  readonly children: readonly NativeSurfaceViewNode[];
} | { readonly type: 'text'; readonly nativeDeclarationId: string; readonly value: NativeViewValue }
  | { readonly type: 'native-repeat'; readonly nativeDeclarationId: string; readonly repeat: NativeViewRepeat; readonly children: readonly NativeSurfaceViewNode[] }
  | { readonly type: 'native-when'; readonly nativeDeclarationId: string; readonly test: NativeViewProjection; readonly children: readonly NativeSurfaceViewNode[] }
  | { readonly type: 'native-component'; readonly nativeDeclarationId: string; readonly tag: string;
      readonly attributes?: Readonly<Record<string, NativeViewValue>>; readonly properties?: Readonly<Record<string, NativeViewValue>>;
      readonly slots: readonly { readonly type: 'native-slot'; readonly name: string; readonly nativeDeclarationId: string; readonly children: readonly NativeSurfaceViewNode[] }[] };
export interface NativeSurfaceViewProgram {
  readonly schema: 'xtend.rmt.app-orchestration.v5';
  readonly render: { readonly nativeView: NativeSurfaceViewHeader; readonly root: unknown; readonly [field: string]: unknown };
  readonly state?: { readonly states?: readonly { readonly id: string; readonly initial?: unknown }[]; readonly selectors?: readonly { readonly id: string }[] };
  readonly surfaces: readonly { readonly id: string; readonly component: NativeViewTagName; readonly kind?: string; readonly events?: readonly string[] }[];
  readonly lifecycle: import('./native-orchestration-lifecycle').NativeOrchestrationLifecyclePlan;
  readonly [field: string]: unknown;
}
export type NativeOrchestrationViewProgram = NativeSurfaceViewProgram;
export function validateNativeSurfaceViewProgram(program: unknown): NativeSurfaceViewProgram;
export const validateNativeOrchestrationViewProgram: typeof validateNativeSurfaceViewProgram;
export function materializeNativeSurfaceView(program: unknown, snapshot: { readonly states: Readonly<Record<string, unknown>>; readonly selectors?: Readonly<Record<string, unknown>> }, root?: unknown, restriction?: Readonly<Record<string, boolean>>): unknown;
export const materializeNativeOrchestrationView: typeof materializeNativeSurfaceView;
export interface NativeComponentCapability { readonly properties: readonly string[] }
export type NativeComponentRegistryCallbackName = 'ensureTags' | 'hydrate' | 'bindComponentInstance' | 'snapshot';
/** Only supplied operational methods are forwarded. Supplied capability/descriptor resolvers cannot extend compiled grants. */
export type NativeComponentRegistry<T extends object = Record<never, never>> = Readonly<{
  resolveComponentCapability(tag: string): Readonly<NativeComponentCapability> | null;
} & {
  readonly [K in keyof T as K extends NativeComponentRegistryCallbackName
    ? NonNullable<T[K]> extends (...args: never[]) => unknown ? K : never : never]: T[K]
}>;
export function createNativeComponentRegistry<T extends object = Record<never, never>>(program: unknown, supplied?: T | null): NativeComponentRegistry<T>;
export const NATIVE_SURFACE_VIEW_RUNTIME: Readonly<{
  API_VERSION: '3.0.0'; NATIVE_VIEW_PROJECTION_API_VERSION: '3.0.0';
  assertNativeCanonicalData: typeof import('./native-view-projection').assertNativeCanonicalData;
  validateNativeViewProgram: typeof validateNativeSurfaceViewProgram;
  materializeNativeView: typeof materializeNativeSurfaceView;
  materializeSurfaceScopes: typeof import('./native-surface-scopes').materializeNativeSurfaceScopes;
  resolveSurfaceInstance: typeof import('./native-surface-scopes').resolveNativeSurfaceInstance;
  materializeNativeEvents: typeof import('./native-surface-scopes').materializeNativeSurfaceEvents;
  scopeNativeEvent: typeof import('./native-surface-scopes').scopeNativeEvent;
  createComponentRegistry: typeof createNativeComponentRegistry;
}>;
export const NATIVE_ORCHESTRATION_VIEW_RUNTIME: typeof NATIVE_SURFACE_VIEW_RUNTIME;
