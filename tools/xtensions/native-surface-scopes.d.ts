import type { XTensionRepeatScope, XTensionHostPresence } from './state-binding-artifact';
import type { NativeViewProjection } from './native-view-projection';
export const NATIVE_SURFACE_SCOPES_API_VERSION: '1.0.0';
export const NATIVE_SURFACE_SCOPES_SCHEMA: 'xtend.rmt.native-surface-scopes.v1';
export const NATIVE_SURFACE_MATERIALIZATION_SCHEMA: 'xtend.rmt.native-surface-materialization.v1';
export const MAX_NATIVE_SURFACE_ID_LENGTH: 4096;
export const MAX_NATIVE_SURFACE_INSTANCES: 10000;
export interface NativeSurfaceScope { readonly surface: string; readonly repeat?: readonly XTensionRepeatScope[]; readonly presence?: XTensionHostPresence; readonly parentId?: string; readonly placement?: 'nested' | 'portal' }
export interface NativeSurfaceInstance { readonly id: string; readonly surfaceId: string; readonly keys: readonly (string | number)[]; readonly repeat?: readonly XTensionRepeatScope[]; readonly parentId?: string; readonly record: unknown }
export interface NativeSurfaceMaterialization { readonly schema: typeof NATIVE_SURFACE_MATERIALIZATION_SCHEMA; readonly documentId: string; readonly instances: readonly NativeSurfaceInstance[] }
export function validateNativeSurfaceScopes(program: unknown): Readonly<{ schema: typeof NATIVE_SURFACE_SCOPES_SCHEMA; documentId: string; declarations: readonly NativeSurfaceScope[] }>;
export function nativeSurfaceScopeKey(documentId: string, declaration: string, keys: readonly (string | number)[]): string;
export function nativeSurfaceInstanceId(documentId: string, declaration: string, keys: readonly (string | number)[]): string;
export function resolveNativeSurfaceInstance(program: unknown, declaration: string, keys?: readonly (string | number)[]): string;
export function findNativeSurfaceInstance(materialization: NativeSurfaceMaterialization, declaration: string, keys?: readonly (string | number)[]): NativeSurfaceInstance | null;
export function scopeNativeProjection(expression: NativeViewProjection, instance: NativeSurfaceInstance): NativeViewProjection;
export function evaluateNativeSurfaceProjection(expression: NativeViewProjection, instance: NativeSurfaceInstance, snapshot: { readonly states: Readonly<Record<string, unknown>>; readonly selectors?: Readonly<Record<string, unknown>> }): unknown;
export function materializeNativeSurfaceScopes(program: unknown, snapshot: { readonly states: Readonly<Record<string, unknown>>; readonly selectors?: Readonly<Record<string, unknown>> }): NativeSurfaceMaterialization;

export function concreteSurfaceSelector(id: string): string;
export interface NativeSurfaceEventMaterialization { readonly events: readonly Readonly<Record<string, unknown>>[]; readonly scopes: readonly { readonly eventId: string; readonly surfaceId?: string; readonly keys: readonly (string | number)[]; readonly trustedKeys: boolean }[] }
export function materializeNativeSurfaceEvents(program: unknown, snapshot: { readonly states: Readonly<Record<string, unknown>>; readonly selectors?: Readonly<Record<string, unknown>> }, admission?: Readonly<Record<string, boolean>>): NativeSurfaceEventMaterialization;
export function scopeNativeEvent<T extends object>(event: T, keys: readonly (string | number)[]): T;

export function validateNativeSurfaceMaterialization(program: unknown, input: unknown): NativeSurfaceMaterialization;
