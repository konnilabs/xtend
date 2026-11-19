import type {NativeViewProjection} from './native-view-projection';

/** Source7 explicit commands; the Source6 API1 contract stays closed. */
export const NATIVE_ORCHESTRATION_LIFECYCLE_API_VERSION: '2.0.0';
export const NATIVE_ORCHESTRATION_LIFECYCLE_PLAN_SCHEMA: 'xtend.rmt.native-lifecycle-plan.v2';
export type NativeOrchestrationLifecycleOperation = 'mount' | 'hydrate' | 'suspend' | 'resume' | 'invalidate' | 'dispose' | 'prewarm' | 'recycle' | 'detach' | 'reattach';
export interface NativeOrchestrationLifecyclePlan {
  readonly schema: typeof NATIVE_ORCHESTRATION_LIFECYCLE_PLAN_SCHEMA; readonly documentId: string;
  readonly sourceProfile: Readonly<{syntax: 'rmtx'; version: '7.0.0'}>;
  readonly viewProfile: Readonly<{syntax: 'rmtx'; version: '7.0.0'}>;
  readonly actionProfile: Readonly<{syntax: 'rmtx'; version: '4.0.0'}>;
  readonly operations: readonly {readonly id: string; readonly astPointer: string; readonly ownerSurface: string; readonly target: string;
    readonly op: NativeOrchestrationLifecycleOperation; readonly lane: 'user-blocking' | 'visible' | 'transition' | 'idle' | 'background' | 'diagnostics';
    readonly when: NativeViewProjection; readonly repeat?: readonly import('./state-binding-artifact').XTensionRepeatScope[]}[];
}
export interface NativeOrchestrationLifecycleEvaluation {
  readonly schema: 'xtend.rmt.native-lifecycle-evaluation.v2';
  readonly operations: readonly {readonly id: string; readonly operationId: string; readonly surfaceId: string; readonly declarationSurface: string;
    readonly keys: readonly (string | number)[]; readonly op: NativeOrchestrationLifecycleOperation; readonly lane: string; readonly enabled: boolean}[];
  readonly scopes: import('./native-surface-scopes').NativeSurfaceMaterialization;
}
export function validateNativeOrchestrationLifecyclePlan(program: unknown): NativeOrchestrationLifecyclePlan;
export function evaluateNativeOrchestrationLifecyclePlan(plan: NativeOrchestrationLifecyclePlan, snapshot: {readonly states: Readonly<Record<string, unknown>>; readonly selectors?: Readonly<Record<string, unknown>>}, materialization?: import('./native-surface-scopes').NativeSurfaceMaterialization): NativeOrchestrationLifecycleEvaluation;
export function nativeOrchestrationLifecycleAdmission(program: unknown, snapshot: {readonly states: Readonly<Record<string, unknown>>; readonly selectors?: Readonly<Record<string, unknown>>}, restriction?: Readonly<Record<string, boolean>>): Readonly<Record<string, boolean>>;
