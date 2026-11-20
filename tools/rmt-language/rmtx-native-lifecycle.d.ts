import type { RmtRange } from './rmt-tooling-public-types';
import type { RmtxNativeProjection, RmtxNativeDependencyRead, RmtNativeViewContract } from './rmtx-native-view';
import type { RmtVNextCoreDocument } from './vnext-compiler';
export declare const RMTX_NATIVE_LIFECYCLE_API_VERSION: '1.0.0';
export declare const RMTX_NATIVE_LIFECYCLE_SCHEMA: 'xtend.rmtx.native-lifecycle.v1';
export declare const RMTX_LIFECYCLE_DEPENDENCIES_SCHEMA: 'xtend.rmtx.lifecycle-dependencies.v1';
export interface RmtxNativeLifecycleProfiles {
  readonly sourceProfile: Readonly<{ syntax: 'rmtx'; version: '6.0.0' }>;
  readonly viewProfile: Readonly<{ syntax: 'rmtx'; version: '5.0.0' }>;
  readonly actionProfile: Readonly<{ syntax: 'rmtx'; version: '4.0.0' }>;
}
export interface RmtxNativeLifecycleSourceOperation {
  readonly astPointer: string;
  readonly ownerSurface: string;
  readonly target: string;
  readonly op: 'mount';
  readonly lane: 'visible';
  readonly when: RmtxNativeProjection;
  readonly range?: RmtRange;
}
export interface RmtxNativeLifecycleSourceContract extends RmtxNativeLifecycleProfiles {
  readonly schema: typeof RMTX_NATIVE_LIFECYCLE_SCHEMA;
  readonly documentId: string;
  readonly operations: readonly RmtxNativeLifecycleSourceOperation[];
}
export interface RmtxLifecycleDependencyReport {
  readonly schema: typeof RMTX_LIFECYCLE_DEPENDENCIES_SCHEMA;
  readonly sourceProfile: RmtxNativeLifecycleProfiles['sourceProfile'];
  readonly operations: readonly {
    readonly id: string; readonly ownerSurface: string; readonly reads: readonly RmtxNativeDependencyRead[];
    readonly transitiveStateReads?: readonly RmtxNativeDependencyRead[]; readonly allSyntacticBranches: true;
  }[];
  readonly runtimeTracking: false;
  readonly runtimeSubscriptionsChanged: false;
}
export interface RmtNativeLifecyclePlan extends RmtxNativeLifecycleProfiles {
  readonly schema: 'xtend.rmt.native-lifecycle-plan.v1';
  readonly documentId: string;
  readonly operations: readonly (Omit<RmtxNativeLifecycleSourceOperation, 'range'> & { readonly id: string })[];
}
export declare function validateRmtxNativeLifecycleContract(contract: RmtxNativeLifecycleSourceContract): RmtxNativeLifecycleSourceContract;
export declare function validateRmtxNativeLifecycleAst(contract: RmtxNativeLifecycleSourceContract, ast: import('./classic-ast-types').RmtClassicAst): RmtxNativeLifecycleSourceContract;
export declare function lowerRmtxNativeLifecycle(contract: RmtxNativeLifecycleSourceContract, core: RmtVNextCoreDocument,
  nativeViewContract: RmtNativeViewContract): Readonly<{ plan: RmtNativeLifecyclePlan; dependencies: RmtxLifecycleDependencyReport }>;

/** Source7 commands are separate from the unchanged Source6 mount gate. */
export const RMTX_EXTENDED_LIFECYCLE_API_VERSION: '2.0.0';
export const RMTX_EXTENDED_LIFECYCLE_SCHEMA: 'xtend.rmtx.native-lifecycle.v2';
export const RMTX_EXTENDED_LIFECYCLE_DEPENDENCIES_SCHEMA: 'xtend.rmtx.lifecycle-dependencies.v2';
export type RmtxExtendedLifecycleOperation = 'mount' | 'hydrate' | 'suspend' | 'resume' | 'invalidate' | 'dispose' | 'prewarm' | 'recycle' | 'detach' | 'reattach';
export interface RmtxExtendedLifecycleProfiles {
  readonly sourceProfile: Readonly<{syntax: 'rmtx'; version: '7.0.0'}>;
  readonly viewProfile: Readonly<{syntax: 'rmtx'; version: '7.0.0'}>;
  readonly actionProfile: Readonly<{syntax: 'rmtx'; version: '4.0.0'}>;
}
export interface RmtxExtendedLifecycleSourceOperation extends Omit<RmtxNativeLifecycleSourceOperation, 'op' | 'lane'> {
  readonly op: RmtxExtendedLifecycleOperation;
  readonly lane: 'user-blocking' | 'visible' | 'transition' | 'idle' | 'background' | 'diagnostics';
  readonly repeat?: import('../xtensions/state-binding-artifact').XTensionRepeatScope[];
}
export interface RmtxExtendedLifecycleSourceContract extends RmtxExtendedLifecycleProfiles {
  readonly schema: typeof RMTX_EXTENDED_LIFECYCLE_SCHEMA;
  readonly documentId: string;
  readonly operations: readonly RmtxExtendedLifecycleSourceOperation[];
}
export interface RmtExtendedLifecyclePlan extends RmtxExtendedLifecycleProfiles {
  readonly schema: 'xtend.rmt.native-lifecycle-plan.v2';
  readonly documentId: string;
  readonly operations: readonly (Omit<RmtxExtendedLifecycleSourceOperation, 'range'> & {readonly id: string})[];
}
export interface RmtxExtendedLifecycleDependencyReport extends Omit<RmtxLifecycleDependencyReport, 'schema' | 'sourceProfile'> {
  readonly schema: typeof RMTX_EXTENDED_LIFECYCLE_DEPENDENCIES_SCHEMA;
  readonly sourceProfile: RmtxExtendedLifecycleProfiles['sourceProfile'];
}
export function validateRmtxExtendedLifecycleContract(contract: RmtxExtendedLifecycleSourceContract): RmtxExtendedLifecycleSourceContract;
export function validateRmtxExtendedLifecycleAst(contract: RmtxExtendedLifecycleSourceContract, ast: import('./classic-ast-types').RmtClassicAst): RmtxExtendedLifecycleSourceContract;
export function lowerRmtxExtendedLifecycle(contract: RmtxExtendedLifecycleSourceContract, core: RmtVNextCoreDocument, nativeViewContract: unknown): Readonly<{plan: RmtExtendedLifecyclePlan; dependencies: RmtxExtendedLifecycleDependencyReport}>;
export { validateRmtxExtendedLifecycleContract as validateRmtxNativeOrchestrationLifecycleContract,
  validateRmtxExtendedLifecycleAst as validateRmtxNativeOrchestrationLifecycleAst,
  lowerRmtxExtendedLifecycle as lowerRmtxNativeOrchestrationLifecycle };

export interface RmtxManagedNativeLifecycleProfiles {readonly sourceProfile:Readonly<{syntax:'rmtx';version:'8.0.0'}>;readonly viewProfile:Readonly<{syntax:'rmtx';version:'8.0.0'}>;readonly actionProfile:Readonly<{syntax:'rmtx';version:'8.0.0'}>}
export interface RmtxManagedNativeLifecycleSourceContract extends RmtxManagedNativeLifecycleProfiles {readonly schema:'xtend.rmtx.native-lifecycle.v3';readonly documentId:string;readonly operations:readonly RmtxExtendedLifecycleSourceOperation[]}
export interface RmtManagedNativeLifecyclePlan extends RmtxManagedNativeLifecycleProfiles {readonly schema:'xtend.rmt.native-lifecycle-plan.v3';readonly documentId:string;readonly operations:readonly (Omit<RmtxExtendedLifecycleSourceOperation,'range'>&{readonly id:string})[]}
export interface RmtxManagedNativeLifecycleDependencyReport extends Omit<RmtxLifecycleDependencyReport,'schema'|'sourceProfile'>{readonly schema:'xtend.rmtx.lifecycle-dependencies.v3';readonly sourceProfile:RmtxManagedNativeLifecycleProfiles['sourceProfile']}
export function validateRmtxManagedNativeLifecycleContract(contract:RmtxManagedNativeLifecycleSourceContract):RmtxManagedNativeLifecycleSourceContract;
export function validateRmtxManagedNativeLifecycleAst(contract:RmtxManagedNativeLifecycleSourceContract,ast:import('./classic-ast-types').RmtClassicAst):RmtxManagedNativeLifecycleSourceContract;
export function lowerRmtxManagedNativeLifecycle(contract:RmtxManagedNativeLifecycleSourceContract,core:RmtVNextCoreDocument,nativeViewContract:unknown):Readonly<{plan:RmtManagedNativeLifecyclePlan;dependencies:RmtxManagedNativeLifecycleDependencyReport}>;
