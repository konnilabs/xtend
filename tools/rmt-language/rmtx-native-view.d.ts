import type { XTensionRepeatScope } from '../xtensions/state-binding-artifact';
import type { NativeViewTagName, NativeViewPropertyName } from '../xtensions/native-view-projection';

export const RMTX_NATIVE_VIEW_API_VERSION: '1.0.0';
export const RMTX_NATIVE_VIEW_SCHEMA: 'xtend.rmtx.native-view.v1';
export const RMT_NATIVE_VIEW_SCHEMA: 'xtend.rmt.native-view.v1';
export const RMTX_NATIVE_VIEW_DEPENDENCIES_SCHEMA: 'xtend.rmtx.native-view-dependencies.v1';
export type RmtxNativeScalar = string | number | boolean | null;
/** Source markers are replaced by the existing typed key materializer at runtime. */
export type RmtxNativeSourcePath = readonly (string | number | { readonly repeat: number })[];
export type RmtxNativeProjection =
  | { readonly kind: 'literal'; readonly value: RmtxNativeScalar }
  | { readonly kind: 'path'; readonly root: 'state' | 'selector'; readonly symbol: string; readonly path: RmtxNativeSourcePath }
  | { readonly kind: 'unary'; readonly op: '!' | '-' | '+'; readonly value: RmtxNativeProjection }
  | { readonly kind: 'binary'; readonly op: '===' | '!==' | '<' | '<=' | '>' | '>=' | '&&' | '||' | '+' | '-' | '*' | '/' | '%'; readonly left: RmtxNativeProjection; readonly right: RmtxNativeProjection }
  | { readonly kind: 'conditional'; readonly test: RmtxNativeProjection; readonly then: RmtxNativeProjection; readonly else: RmtxNativeProjection };
export type RmtxNativeRepeatScopes = readonly [XTensionRepeatScope & { readonly state: string }, ...XTensionRepeatScope[]];
export type RmtxNativeSourceNode =
  | { readonly type: 'text'; readonly nativeDeclarationId: string; readonly value: RmtxNativeProjection }
  | { readonly type: 'element'; readonly nativeDeclarationId: string; readonly tag: NativeViewTagName;
      readonly attributes?: Readonly<Record<string, RmtxNativeProjection>>;
      readonly properties?: Readonly<Partial<Record<NativeViewPropertyName, RmtxNativeProjection>>>;
      readonly children: readonly RmtxNativeSourceNode[] }
  | { readonly type: 'native-repeat'; readonly nativeDeclarationId: string; readonly repeat: RmtxNativeRepeatScopes; readonly children: readonly RmtxNativeSourceNode[] }
  | { readonly type: 'native-when'; readonly nativeDeclarationId: string; readonly test: RmtxNativeProjection; readonly children: readonly RmtxNativeSourceNode[] };
export interface RmtxNativeViewSourceContract {
  readonly schema: typeof RMTX_NATIVE_VIEW_SCHEMA;
  readonly sourceProfile: Readonly<{ syntax: 'rmtx'; version: '5.0.0' }>;
  readonly documentId: string;
  readonly views: readonly { readonly surface: string; readonly children: readonly RmtxNativeSourceNode[] }[];
}
export interface RmtxNativeDependencyRead {
  readonly root: 'state' | 'selector'; readonly symbol: string; readonly path: RmtxNativeSourcePath;
}
export interface RmtxNativeViewDependencyReport {
  readonly schema: typeof RMTX_NATIVE_VIEW_DEPENDENCIES_SCHEMA;
  readonly sourceProfile: RmtxNativeViewSourceContract['sourceProfile'];
  readonly surfaces: readonly { readonly surface: string; readonly reads: readonly RmtxNativeDependencyRead[];
    readonly transitiveStateReads?: readonly RmtxNativeDependencyRead[]; readonly allSyntacticBranches: true }[];
  readonly runtimeTracking: false; readonly runtimeSubscriptionsChanged: false;
}
export interface RmtNativeViewContract {
  readonly schema: typeof RMT_NATIVE_VIEW_SCHEMA; readonly documentId: string; readonly surfaces: readonly string[];
}
export type RmtNativeExpression = { readonly op: 'literal'; readonly value: RmtxNativeScalar }
  | { readonly op: 'native-projection'; readonly projection: RmtxNativeProjection };
export type RmtNativeViewNode =
  | { readonly type: 'text'; readonly nativeDeclarationId: string; readonly value: RmtNativeExpression }
  | { readonly type: 'element'; readonly nativeDeclarationId: string; readonly tag: NativeViewTagName;
      readonly attributes?: Readonly<Record<string, RmtNativeExpression>>;
      readonly properties?: Readonly<Partial<Record<NativeViewPropertyName, RmtNativeExpression>>>;
      readonly children: readonly RmtNativeViewNode[] }
  | { readonly type: 'native-repeat'; readonly nativeDeclarationId: string; readonly repeat: RmtxNativeRepeatScopes; readonly children: readonly RmtNativeViewNode[] }
  | { readonly type: 'native-when'; readonly nativeDeclarationId: string; readonly test: RmtxNativeProjection; readonly children: readonly RmtNativeViewNode[] };
export interface RmtxNativeViewLowering {
  readonly surfaces: Map<string, readonly RmtNativeViewNode[]>;
  readonly contract: RmtNativeViewContract;
  readonly dependencies: RmtxNativeViewDependencyReport;
}
export function validateNativeViewContract(contract: RmtxNativeViewSourceContract, appPlatform?: {
  readonly state?: readonly { readonly id: string }[]; readonly selectors?: readonly { readonly id: string }[];
  readonly surfaces?: readonly { readonly id: string }[];
} | null): RmtxNativeViewLowering;
export function lowerRmtxNativeViews(contract: RmtxNativeViewSourceContract, appPlatform: {
  readonly state?: readonly { readonly id: string }[]; readonly selectors?: readonly { readonly id: string }[];
  readonly surfaces?: readonly { readonly id: string }[];
}): RmtxNativeViewLowering;

/** Explicit Source7 component, slot and whole-Surface scope grammar. */
export const RMTX_NATIVE_ORCHESTRATION_VIEW_API_VERSION:'2.0.0';
export const RMTX_NATIVE_ORCHESTRATION_VIEW_SCHEMA:'xtend.rmtx.native-view.v2';
export const RMT_NATIVE_ORCHESTRATION_VIEW_SCHEMA:'xtend.rmt.native-view.v2';
export const RMTX_NATIVE_ORCHESTRATION_VIEW_DEPENDENCIES_SCHEMA:'xtend.rmtx.native-view-dependencies.v2';
export interface RmtxNativeSurfaceScope {
  readonly surface:string; readonly repeat?:RmtxNativeRepeatScopes;
  readonly presence?:{readonly state:string;readonly path:RmtxNativeSourcePath};
  readonly parent?:string; readonly placement?:'nested'|'portal';
}
export interface RmtxNativeEventKeys {
  readonly astPointer:string;readonly surface:string;readonly fields:Readonly<Record<string,number>>;
}
export interface RmtxNativeSourceSlot {
  readonly type:'native-slot';readonly name:string;readonly nativeDeclarationId:string;readonly children:readonly RmtxNativeOrchestrationSourceNode[];
}
export type RmtxNativeOrchestrationSourceNode =
  | Extract<RmtxNativeSourceNode,{type:'text'}>
  | (Omit<Extract<RmtxNativeSourceNode,{type:'element'}>,'children'>&{readonly children:readonly RmtxNativeOrchestrationSourceNode[]})
  | {readonly type:'native-repeat';readonly nativeDeclarationId:string;readonly repeat:RmtxNativeRepeatScopes;readonly children:readonly RmtxNativeOrchestrationSourceNode[]}
  | {readonly type:'native-when';readonly nativeDeclarationId:string;readonly test:RmtxNativeProjection;readonly children:readonly RmtxNativeOrchestrationSourceNode[]}
  | {readonly type:'native-component';readonly nativeDeclarationId:string;readonly tag:string;
     readonly attributes?:Readonly<Record<string,RmtxNativeProjection>>;readonly properties?:Readonly<Record<string,RmtxNativeProjection>>;readonly slots:readonly RmtxNativeSourceSlot[]};
export interface RmtxNativeOrchestrationViewSourceContract {
  readonly schema:typeof RMTX_NATIVE_ORCHESTRATION_VIEW_SCHEMA;readonly sourceProfile:Readonly<{syntax:'rmtx';version:'7.0.0'}>;readonly documentId:string;
  readonly components:readonly import('../xtensions/native-component-contract').NativeComponentMetadata[];
  readonly scopes:readonly RmtxNativeSurfaceScope[];readonly eventKeys:readonly RmtxNativeEventKeys[];
  readonly views:readonly {readonly surface:string;readonly repeat?:RmtxNativeRepeatScopes;readonly children:readonly RmtxNativeOrchestrationSourceNode[]}[];
}
export interface RmtNativeOrchestrationViewContract extends Omit<RmtNativeViewContract,'schema'> {
  readonly schema:typeof RMT_NATIVE_ORCHESTRATION_VIEW_SCHEMA;
  readonly components:RmtxNativeOrchestrationViewSourceContract['components'];
  readonly scopes:readonly RmtxNativeSurfaceScope[];readonly eventKeys:readonly (RmtxNativeEventKeys&{readonly event:string})[];
}
export interface RmtxNativeOrchestrationDependencyReport extends Omit<RmtxNativeViewDependencyReport,'schema'|'sourceProfile'> {
 readonly schema:typeof RMTX_NATIVE_ORCHESTRATION_VIEW_DEPENDENCIES_SCHEMA;readonly sourceProfile:RmtxNativeOrchestrationViewSourceContract['sourceProfile'];
}
export interface RmtxNativeOrchestrationViewLowering {
 readonly surfaces:Map<string,readonly unknown[]>;readonly contract:RmtNativeOrchestrationViewContract;readonly dependencies:RmtxNativeOrchestrationDependencyReport;
}
export function validateRmtxNativeOrchestrationViewContract(contract:RmtxNativeOrchestrationViewSourceContract,appPlatform?:Parameters<typeof validateNativeViewContract>[1],context?:Readonly<{core?:import('./vnext-compiler').RmtVNextCoreDocument;events?:readonly unknown[];inputContract?:unknown}>):RmtxNativeOrchestrationViewLowering;
export function lowerRmtxNativeOrchestrationViews(contract:RmtxNativeOrchestrationViewSourceContract,appPlatform:Parameters<typeof lowerRmtxNativeViews>[1],context?:Parameters<typeof validateRmtxNativeOrchestrationViewContract>[2]):RmtxNativeOrchestrationViewLowering;
export function lowerRmtxNativeEventKeys(contract:RmtxNativeOrchestrationViewSourceContract,core:import('./vnext-compiler').RmtVNextCoreDocument,events:readonly unknown[],inputContract:unknown):RmtNativeOrchestrationViewContract['eventKeys'];

/** Source8 adds closed typed JSON component props, refs and genuine Action sidecars. */
export type RmtxManagedNativeProjection = RmtxNativeProjection
 | Readonly<{kind:'literal';value:import('./rmt-tooling-public-types').RmtJsonValue}>
 | Readonly<{kind:'object';fields:Readonly<Record<string,RmtxManagedNativeProjection>>}>
 | Readonly<{kind:'array';items:readonly RmtxManagedNativeProjection[]}>
 | Readonly<{kind:'conditional';test:RmtxNativeProjection;then:RmtxManagedNativeProjection;else:RmtxManagedNativeProjection}>;
export interface RmtxManagedNativeEvent {readonly astPointer:string;readonly surface:string;readonly component:string;readonly ref:string;readonly event:string}
export interface RmtxManagedNativeBinding {readonly declarationId:string;readonly surface:string;readonly ref:string;readonly tag:string;readonly repeat:RmtxNativeRepeatScopes|readonly []}
export interface RmtxManagedNativeCommand {readonly astPointer:string;readonly action:string;readonly surface:string;readonly component:string;readonly ref:string;readonly command:string;readonly args:import('./rmtx-native-component-bindings').RmtxNativeCommandExpression;readonly keys:Readonly<{kind:'array';items:readonly import('./rmtx-native-component-bindings').RmtxNativeCommandExpression[]}>}
export type RmtxManagedNativeSourceNode = Extract<RmtxNativeSourceNode,{type:'text'}>
 | (Omit<Extract<RmtxNativeSourceNode,{type:'element'}>,'children'>&{readonly ref?:string;readonly children:readonly RmtxManagedNativeSourceNode[]})
 | Readonly<{type:'native-repeat';nativeDeclarationId:string;repeat:RmtxNativeRepeatScopes;children:readonly RmtxManagedNativeSourceNode[]}>
 | Readonly<{type:'native-when';nativeDeclarationId:string;test:RmtxNativeProjection;children:readonly RmtxManagedNativeSourceNode[]}>
 | Readonly<{type:'native-component';nativeDeclarationId:string;tag:string;ref:string;events:readonly RmtxManagedNativeEvent[];attributes?:Readonly<Record<string,RmtxNativeProjection>>;properties?:Readonly<Record<string,RmtxManagedNativeProjection>>;slots:readonly Readonly<{type:'native-slot';name:string;nativeDeclarationId:string;children:readonly RmtxManagedNativeSourceNode[]}>[]}>;
export interface RmtxManagedNativeViewSourceContract extends Omit<RmtxNativeOrchestrationViewSourceContract,'schema'|'sourceProfile'|'components'|'views'>{
 readonly schema:'xtend.rmtx.native-view.v3';readonly sourceProfile:Readonly<{syntax:'rmtx';version:'8.0.0'}>;readonly components:readonly import('../xtensions/native-component-contract-v2').NativeComponentMetadataV2[];
 readonly views:readonly Readonly<{surface:string;repeat?:RmtxNativeRepeatScopes;children:readonly RmtxManagedNativeSourceNode[]}>[];readonly bindings:readonly RmtxManagedNativeBinding[];readonly events:readonly RmtxManagedNativeEvent[];readonly commands:readonly RmtxManagedNativeCommand[];
}
export interface RmtxManagedNativeDependencyReport extends Omit<RmtxNativeViewDependencyReport,'schema'|'sourceProfile'>{readonly schema:'xtend.rmtx.native-view-dependencies.v3';readonly sourceProfile:RmtxManagedNativeViewSourceContract['sourceProfile']}
export interface RmtManagedNativeViewContract extends Omit<import('../xtensions/native-managed-view-projection').NativeManagedViewHeader,'events'|'commands'>{readonly events:readonly (RmtxManagedNativeEvent|import('../xtensions/native-managed-view-projection').NativeManagedComponentEvent)[];readonly commands:readonly (RmtxManagedNativeCommand|import('../xtensions/native-managed-view-projection').NativeManagedComponentCommand)[]}
export interface RmtxManagedNativeViewLowering {readonly surfaces:Map<string,readonly unknown[]>;readonly contract:RmtManagedNativeViewContract;readonly dependencies:RmtxManagedNativeDependencyReport}
export function validateRmtxManagedNativeViewContract(contract:RmtxManagedNativeViewSourceContract,appPlatform?:Parameters<typeof validateNativeViewContract>[1],context?:Readonly<{ast?:import('./classic-ast-types').RmtClassicAst;core?:import('./vnext-compiler').RmtVNextCoreDocument;events?:unknown[];inputContract?:unknown}>):RmtxManagedNativeViewLowering;
export function lowerRmtxManagedNativeViews(contract:RmtxManagedNativeViewSourceContract,appPlatform?:Parameters<typeof validateNativeViewContract>[1],context?:Parameters<typeof validateRmtxManagedNativeViewContract>[2]):RmtxManagedNativeViewLowering;
