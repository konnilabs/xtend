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
