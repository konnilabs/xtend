import type { NativeViewProjection } from './native-view-projection';
export const NATIVE_LIFECYCLE_API_VERSION: '1.0.0';
export const NATIVE_LIFECYCLE_PLAN_SCHEMA: 'xtend.rmt.native-lifecycle-plan.v1';
export interface NativeLifecycleOperation {
  readonly id: string; readonly astPointer: string; readonly ownerSurface: string;
  readonly target: string; readonly op: 'mount'; readonly lane: 'visible';
  readonly when: NativeViewProjection;
}
export interface NativeLifecyclePlan {
  readonly schema: typeof NATIVE_LIFECYCLE_PLAN_SCHEMA; readonly documentId: string;
  readonly sourceProfile: Readonly<{ syntax: 'rmtx'; version: '6.0.0' }>;
  readonly viewProfile: Readonly<{ syntax: 'rmtx'; version: '5.0.0' }>;
  readonly actionProfile: Readonly<{ syntax: 'rmtx'; version: '4.0.0' }>;
  readonly operations: readonly NativeLifecycleOperation[];
}
/** Pure descriptor-safe validation, without provider execution or DOM writes. */
export function validateNativeLifecyclePlan(program: unknown): NativeLifecyclePlan;
/** The whole atomic group is checked before any admission result is returned. */
export function evaluateNativeLifecyclePlan(plan: NativeLifecyclePlan | unknown, snapshot: {
  readonly states: Readonly<Record<string, unknown>>; readonly selectors?: Readonly<Record<string, unknown>>;
}): Readonly<{ allowed: readonly string[]; blocked: readonly string[] }>;
/** Internal parent map includes statically composed portal and descriptor owners. */
export function nativeLifecycleParents(program: unknown): Readonly<Record<string, string>>;
/** Restrictions can only remove admission; they cannot override a Model guard. */
export function nativeLifecycleAdmission(program: unknown, snapshot: {
  readonly states: Readonly<Record<string, unknown>>; readonly selectors?: Readonly<Record<string, unknown>>;
}, restriction?: Readonly<Record<string, boolean>>): Readonly<Record<string, boolean>>;
