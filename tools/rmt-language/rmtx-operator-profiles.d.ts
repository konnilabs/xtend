/** Capability API; retained v1/v2/v3 records keep their original apiVersion. */
export declare const RMTX_OPERATOR_PROFILE_API_VERSION: '6.0.0';
export declare const RMTX_OPERATOR_PROFILE_SCHEMA: 'xtend.rmtx.operator-profile.v1';
export declare const RMTX_OPERATOR_PROFILE_SCHEMA_V2: 'xtend.rmtx.operator-profile.v2';
export declare const RMTX_OPERATOR_PROFILE_SCHEMA_V3: 'xtend.rmtx.operator-profile.v3';
export declare const RMTX_OPERATOR_PROFILE_SCHEMA_V4: 'xtend.rmtx.operator-profile.v4';
export declare const RMTX_OPERATOR_PROFILE_SCHEMA_V5: 'xtend.rmtx.operator-profile.v5';
export type RmtxLegacyOperatorProfileVersion = '1.0.0' | '2.0.0';
export type RmtxOperatorProfileVersion = RmtxLegacyOperatorProfileVersion | '3.0.0' | '4.0.0' | '5.0.0' | '6.0.0' | '7.0.0';
export type RmtxOperatorAttributeKind = 'symbol' | 'string' | 'json-literal' | 'boolean' | 'reducer-value'
  | 'model-or-selector-path' | 'boolean-predicate' | 'item-path' | 'enum';
export type RmtxOperatorAttributeKindV2 = RmtxOperatorAttributeKind
  | 'model-or-item-path' | 'event-payload-map' | 'boolean-model-or-item-path' | 'boolean-condition';
export type RmtxOperatorAttributeKindV3 = RmtxOperatorAttributeKindV2 | 'primitive-expression' | 'number'
  | 'number-or-string' | 'string-or-string-array' | 'policy-values' | 'projection-object' | 'intent-map';
export type RmtxOperatorAttributeKindV4 = RmtxOperatorAttributeKindV3 | 'native-scalar-map' | 'native-scalar-projection' | 'native-boolean-projection';
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
export interface RmtxOperatorAttributeV2 extends Omit<RmtxOperatorAttribute, 'kind'> { readonly kind: RmtxOperatorAttributeKindV2 }
export interface RmtxOperatorContractV2 extends Omit<RmtxOperatorContract, 'attributes'> {
  readonly attributes: Readonly<Record<string, RmtxOperatorAttributeV2>>;
  readonly lowering?: string;
}
export interface RmtxOperatorAttributeV3 extends Omit<RmtxOperatorAttribute, 'kind'> { readonly kind: RmtxOperatorAttributeKindV3 }
export interface RmtxOperatorLoweringRule {
  readonly mode: string;
  readonly fields: Readonly<Record<string, string>>;
  readonly constants: Readonly<Record<string, RmtxProfileValue>>;
}
export interface RmtxOperatorContractV3 extends Omit<RmtxOperatorContractV2, 'attributes' | 'lowering'> {
  readonly attributes: Readonly<Record<string, RmtxOperatorAttributeV3>>;
  readonly lowering?: string | RmtxOperatorLoweringRule;
}
export interface RmtxOperatorAttributeV4 extends Omit<RmtxOperatorAttribute, 'kind'> { readonly kind: RmtxOperatorAttributeKindV4 }
export interface RmtxOperatorContractV4 extends Omit<RmtxOperatorContractV3, 'attributes'> {
  readonly attributes: Readonly<Record<string, RmtxOperatorAttributeV4>>;
  readonly contexts?: Readonly<{ host: readonly string[]; native: readonly string[] }>;
}
export interface RmtxOperatorProfile<V extends RmtxOperatorProfileVersion = RmtxOperatorProfileVersion> {
  readonly schema: V extends '7.0.0' ? typeof RMTX_OPERATOR_PROFILE_SCHEMA_V6 : V extends '6.0.0' ? typeof RMTX_OPERATOR_PROFILE_SCHEMA_V5 : V extends '5.0.0' ? typeof RMTX_OPERATOR_PROFILE_SCHEMA_V4 : V extends '4.0.0' ? typeof RMTX_OPERATOR_PROFILE_SCHEMA_V3 : V extends '3.0.0' ? typeof RMTX_OPERATOR_PROFILE_SCHEMA_V2 : typeof RMTX_OPERATOR_PROFILE_SCHEMA;
  readonly apiVersion: V extends '7.0.0' ? '6.0.0' : V extends '6.0.0' ? '5.0.0' : V extends '5.0.0' ? '4.0.0' : V extends '4.0.0' ? '3.0.0' : V extends '3.0.0' ? '2.0.0' : '1.0.0';
  readonly syntaxVersion: V;
  readonly sourceProfile: Readonly<{ syntax: 'rmtx'; version: V }>;
  readonly imports: readonly string[];
  readonly operators: Readonly<Record<string, V extends '5.0.0' | '6.0.0' | '7.0.0' ? RmtxOperatorContractV4 : V extends '4.0.0' ? RmtxOperatorContractV3 : V extends '3.0.0' ? RmtxOperatorContractV2 : RmtxOperatorContract>>;
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

export const RMTX_OPERATOR_PROFILE_SCHEMA_V6:'xtend.rmtx.operator-profile.v6';
