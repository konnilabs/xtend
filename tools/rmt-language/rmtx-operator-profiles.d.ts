export declare const RMTX_OPERATOR_PROFILE_API_VERSION: '1.0.0';
export declare const RMTX_OPERATOR_PROFILE_SCHEMA: 'xtend.rmtx.operator-profile.v1';
export type RmtxOperatorProfileVersion = '1.0.0' | '2.0.0';
export type RmtxOperatorAttributeKind = 'symbol' | 'string' | 'json-literal' | 'boolean' | 'reducer-value'
  | 'model-or-selector-path' | 'boolean-predicate' | 'item-path' | 'enum';
export type RmtxProfileValue = string | number | boolean | null | readonly RmtxProfileValue[] | { readonly [key: string]: RmtxProfileValue };
export interface RmtxOperatorAttribute {
  readonly kind: RmtxOperatorAttributeKind;
  readonly required: boolean;
  readonly expressionContext?: string;
  readonly values?: readonly string[];
  readonly default?: string;
}
export interface RmtxOperatorContract {
  readonly astType: string;
  readonly attributes: Readonly<Record<string, RmtxOperatorAttribute>>;
  readonly children: readonly string[];
  readonly childCardinality?: Readonly<Record<string, Readonly<{ min: number; max: number | null }>>>;
}
export interface RmtxOperatorProfile<V extends RmtxOperatorProfileVersion = RmtxOperatorProfileVersion> {
  readonly schema: typeof RMTX_OPERATOR_PROFILE_SCHEMA;
  readonly apiVersion: typeof RMTX_OPERATOR_PROFILE_API_VERSION;
  readonly syntaxVersion: V;
  readonly sourceProfile: Readonly<{ syntax: 'rmtx'; version: V }>;
  readonly imports: readonly string[];
  readonly operators: Readonly<Record<string, RmtxOperatorContract>>;
  readonly expressionContexts: Readonly<Record<string, RmtxProfileValue>>;
  readonly limits: Readonly<{ sourceUtf8Bytes: number; literalDepth: number; operatorDepth: number; expressionDepth: number; generatedNodes: number }>;
  readonly semantics: Readonly<Record<string, RmtxProfileValue>>;
  readonly reads: Readonly<{
    tracking: 'static-reference-paths'; allSyntacticBranches: true;
    symbolResolution: 'longest-declared-prefix'; runtimeTracking: false; runtimeSubscriptionsChanged: false;
  }>;
}
export declare function getRmtxOperatorProfile(): RmtxOperatorProfile<'1.0.0'>;
export declare function getRmtxOperatorProfile<V extends RmtxOperatorProfileVersion>(version: V): RmtxOperatorProfile<V>;
