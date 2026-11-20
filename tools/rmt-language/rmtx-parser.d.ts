import type { RmtClassicAst } from './classic-ast-types';
import type { RmtTextDocument, RmtRange, RmtToolingDiagnostic } from './rmt-tooling-public-types';
export { getRmtxOperatorProfile, RMTX_OPERATOR_PROFILE_SCHEMA, RMTX_OPERATOR_PROFILE_SCHEMA_V2, RMTX_OPERATOR_PROFILE_SCHEMA_V3, RMTX_OPERATOR_PROFILE_SCHEMA_V4, RMTX_OPERATOR_PROFILE_SCHEMA_V5, RMTX_OPERATOR_PROFILE_SCHEMA_V6 } from './rmtx-operator-profiles';
/** Module capability API; individual profiles retain their own result version. */
export declare const RMTX_PARSER_API_VERSION: '8.0.0';
export declare const RMTX_PARSER_SCHEMA: 'xtend.rmtx.parser-result.v1';
export declare const RMTX_PARSER_SCHEMA_V2: 'xtend.rmtx.parser-result.v2';
export declare const RMTX_PARSER_SCHEMA_V3: 'xtend.rmtx.parser-result.v3';
export declare const RMTX_PARSER_SCHEMA_V4: 'xtend.rmtx.parser-result.v4';
export declare const RMTX_HOST_SCOPES_SCHEMA_V2: 'xtend.rmtx.host-scopes.v2';
export declare const RMTX_COMPONENTS_SCHEMA: 'xtend.rmtx.components.v1';
export declare const RMTX_ORCHESTRATION_SOURCE_PROFILE: Readonly<{ syntax: 'rmtx'; version: '4.0.0' }>;
export declare const RMTX_HOST_SCOPES_SCHEMA: 'xtend.rmtx.host-scopes.v1';
export declare const RMTX_SYNTAX_VERSION: '1.0.0';
export declare const RMTX_SOURCE_PROFILE: Readonly<{ syntax: 'rmtx'; version: '1.0.0' }>;
export declare const RMTX_SELECTOR_SOURCE_PROFILE: Readonly<{ syntax: 'rmtx'; version: '2.0.0' }>;
export declare const RMTX_KEYED_SOURCE_PROFILE: Readonly<{ syntax: 'rmtx'; version: '3.0.0' }>;
export interface RmtxParserOptionsV3 extends Record<string, unknown> { syntaxVersion: '3.0.0' }
export interface RmtxParserOptions extends Record<string, unknown> { syntaxVersion?: '1.0.0' }
export interface RmtxParserOptionsV2 extends Record<string, unknown> { syntaxVersion: '2.0.0' }
export interface RmtxSourceModel {
  schema: string; uri: string; filePath: string | null; languageId: 'rmtx'; text: string;
  filePolicy: { extension: string; canonical: boolean; fallback: boolean; diagnosticCode: string | null };
  rangeForOffsets(startOffset: number, endOffset: number): RmtRange;
  positionAt(offset: number): { line: number; character: number };
  readonly [key: string]: unknown;
}
/** The complete existing v1 result is retained as a separate type. */
export interface RmtxParseResult {
  schema: typeof RMTX_PARSER_SCHEMA; apiVersion: '1.0.0';
  sourceProfile: typeof RMTX_SOURCE_PROFILE; ok: boolean; phase: string; status: 'invalid' | 'parsed';
  sourceModel: RmtxSourceModel; ast: RmtClassicAst | null; diagnostics: RmtToolingDiagnostic[];
}
export interface RmtxParseResultV2 {
  schema: typeof RMTX_PARSER_SCHEMA_V2; apiVersion: '2.0.0';
  sourceProfile: typeof RMTX_SELECTOR_SOURCE_PROFILE; ok: boolean; phase: string; status: 'invalid' | 'parsed';
  sourceModel: RmtxSourceModel; ast: RmtClassicAst | null; diagnostics: RmtToolingDiagnostic[];
}
/** Statically parses the closed RMTX profile. No imports or source expressions execute. */
export declare function parseRmtxSource(input?: Partial<RmtTextDocument> | string, options?: RmtxParserOptions): RmtxParseResult;
export declare function parseRmtxSource(input: Partial<RmtTextDocument> | string | undefined, options: RmtxParserOptionsV2): RmtxParseResultV2;
export declare function parseRmtxSource(input?: Partial<RmtTextDocument> | string, options?: RmtxParserOptions | RmtxParserOptionsV2): RmtxParseResult | RmtxParseResultV2;

export interface RmtxHostScopeSourceContract {
  readonly schema: typeof RMTX_HOST_SCOPES_SCHEMA;
  readonly sourceProfile: typeof RMTX_KEYED_SOURCE_PROFILE;
  readonly hosts: readonly {
    readonly surface: string;
    readonly repeat?: readonly [
      { readonly state: string; readonly path: readonly string[]; readonly key: readonly [string, ...string[]] },
      ...{ readonly path: readonly string[]; readonly key: readonly [string, ...string[]] }[]
    ];
    readonly presence?: { readonly state: string; readonly path: readonly (string | { readonly repeat: number })[] };
    readonly range: RmtRange;
  }[];
}
export interface RmtxParseResultV3 {
  schema: typeof RMTX_PARSER_SCHEMA_V3; apiVersion: '3.0.0';
  sourceProfile: typeof RMTX_KEYED_SOURCE_PROFILE; ok: boolean; phase: string; status: 'invalid' | 'parsed';
  sourceModel: RmtxSourceModel; ast: RmtClassicAst | null; diagnostics: RmtToolingDiagnostic[];
  hostScopes: RmtxHostScopeSourceContract | null;
}
export declare function parseRmtxSource(input: Partial<RmtTextDocument> | string | undefined, options: RmtxParserOptionsV3): RmtxParseResultV3;
export declare function parseRmtxSource(input: Partial<RmtTextDocument> | string | undefined, options: RmtxParserOptions | RmtxParserOptionsV2 | RmtxParserOptionsV3): RmtxParseResult | RmtxParseResultV2 | RmtxParseResultV3;

export interface RmtxParserOptionsV4 extends Record<string, unknown> { syntaxVersion: '4.0.0' }
export interface RmtxHostScopeSourceContractV2 extends Omit<RmtxHostScopeSourceContract, 'schema' | 'sourceProfile'> {
  readonly schema: typeof RMTX_HOST_SCOPES_SCHEMA_V2;
  readonly sourceProfile: typeof RMTX_ORCHESTRATION_SOURCE_PROFILE;
}
export interface RmtxParseResultV4 extends Omit<RmtxParseResultV3, 'schema' | 'apiVersion' | 'sourceProfile' | 'hostScopes'> {
  schema: typeof RMTX_PARSER_SCHEMA_V4; apiVersion: '4.0.0'; sourceProfile: typeof RMTX_ORCHESTRATION_SOURCE_PROFILE;
  hostScopes: RmtxHostScopeSourceContractV2 | null;
  components: import('./rmtx-component-bindings').RmtxComponentSourceContract | null;
  actionInputRules: import('./action-input-contract').RmtxActionInputRules | null;
}
export declare function parseRmtxSource(input: Partial<RmtTextDocument> | string | undefined, options: RmtxParserOptionsV4): RmtxParseResultV4;
export declare function parseRmtxSource(input: Partial<RmtTextDocument> | string | undefined, options: RmtxParserOptions | RmtxParserOptionsV2 | RmtxParserOptionsV3 | RmtxParserOptionsV4): RmtxParseResult | RmtxParseResultV2 | RmtxParseResultV3 | RmtxParseResultV4;

export declare const RMTX_PARSER_SCHEMA_V5: 'xtend.rmtx.parser-result.v5';
export declare const RMTX_HOST_SCOPES_SCHEMA_V3: 'xtend.rmtx.host-scopes.v3';
export declare const RMTX_COMPONENTS_SCHEMA_V2: 'xtend.rmtx.components.v2';
export declare const RMTX_NATIVE_SOURCE_PROFILE: Readonly<{ syntax: 'rmtx'; version: '5.0.0' }>;
export interface RmtxParserOptionsV5 extends Record<string, unknown> { syntaxVersion: '5.0.0' }
export interface RmtxHostScopeSourceContractV3 extends Omit<RmtxHostScopeSourceContract, 'schema' | 'sourceProfile'> {
  readonly schema: typeof RMTX_HOST_SCOPES_SCHEMA_V3;
  readonly sourceProfile: typeof RMTX_NATIVE_SOURCE_PROFILE;
}
/** Native source5 intentionally delegates its unchanged Action grammar to profile4. */
export interface RmtxParseResultV5 extends Omit<RmtxParseResultV4, 'schema' | 'apiVersion' | 'sourceProfile' | 'hostScopes' | 'components'> {
  schema: typeof RMTX_PARSER_SCHEMA_V5; apiVersion: '5.0.0'; sourceProfile: typeof RMTX_NATIVE_SOURCE_PROFILE;
  hostScopes: RmtxHostScopeSourceContractV3 | null;
  components: import('./rmtx-component-bindings').RmtxComponentSourceContractV2 | null;
  nativeView: import('./rmtx-native-view').RmtxNativeViewSourceContract | null;
  actionProfile: typeof RMTX_ORCHESTRATION_SOURCE_PROFILE;
}
export declare function parseRmtxSource(input: Partial<RmtTextDocument> | string | undefined, options: RmtxParserOptionsV5): RmtxParseResultV5;
export declare function parseRmtxSource(input: Partial<RmtTextDocument> | string | undefined, options: RmtxParserOptions | RmtxParserOptionsV2 | RmtxParserOptionsV3 | RmtxParserOptionsV4 | RmtxParserOptionsV5): RmtxParseResult | RmtxParseResultV2 | RmtxParseResultV3 | RmtxParseResultV4 | RmtxParseResultV5;

export declare const RMTX_PARSER_SCHEMA_V6: 'xtend.rmtx.parser-result.v6';
export declare const RMTX_LIFECYCLE_SOURCE_PROFILE: Readonly<{ syntax: 'rmtx'; version: '6.0.0' }>;
export interface RmtxParserOptionsV6 extends Record<string, unknown> { syntaxVersion: '6.0.0' }
/** Source6 delegates unchanged Action4 and View5 subcontracts explicitly. */
export interface RmtxParseResultV6 extends Omit<RmtxParseResultV5, 'schema' | 'apiVersion' | 'sourceProfile'> {
  schema: typeof RMTX_PARSER_SCHEMA_V6; apiVersion: '6.0.0'; sourceProfile: typeof RMTX_LIFECYCLE_SOURCE_PROFILE;
  viewProfile: typeof RMTX_NATIVE_SOURCE_PROFILE;
  nativeLifecycle: import('./rmtx-native-lifecycle').RmtxNativeLifecycleSourceContract | null;
}
export declare function parseRmtxSource(input: Partial<RmtTextDocument> | string | undefined, options: RmtxParserOptionsV6): RmtxParseResultV6;
export declare function parseRmtxSource(input: Partial<RmtTextDocument> | string | undefined, options: RmtxParserOptions | RmtxParserOptionsV2 | RmtxParserOptionsV3 | RmtxParserOptionsV4 | RmtxParserOptionsV5 | RmtxParserOptionsV6): RmtxParseResult | RmtxParseResultV2 | RmtxParseResultV3 | RmtxParseResultV4 | RmtxParseResultV5 | RmtxParseResultV6;

export const RMTX_PARSER_SCHEMA_V7:'xtend.rmtx.parser-result.v7';
export const RMTX_NATIVE_ORCHESTRATION_SOURCE_PROFILE:Readonly<{syntax:'rmtx';version:'7.0.0'}>;
export const RMTX_HOST_SCOPES_SCHEMA_V4:'xtend.rmtx.host-scopes.v4';
export const RMTX_COMPONENTS_SCHEMA_V3:'xtend.rmtx.components.v3';
export interface RmtxParserOptionsV7 extends Record<string,unknown>{syntaxVersion:'7.0.0'}
export interface RmtxHostScopeSourceContractV4 {
 readonly schema:typeof RMTX_HOST_SCOPES_SCHEMA_V4;readonly sourceProfile:typeof RMTX_NATIVE_ORCHESTRATION_SOURCE_PROFILE;
 readonly hosts:readonly (import('./rmtx-native-view').RmtxNativeSurfaceScope&{readonly range:RmtRange})[];
}
export interface RmtxParseResultV7 extends Omit<RmtxParseResultV6,'schema'|'apiVersion'|'sourceProfile'|'viewProfile'|'hostScopes'|'components'|'nativeView'|'nativeLifecycle'> {
 schema:typeof RMTX_PARSER_SCHEMA_V7;apiVersion:'7.0.0';sourceProfile:typeof RMTX_NATIVE_ORCHESTRATION_SOURCE_PROFILE;viewProfile:typeof RMTX_NATIVE_ORCHESTRATION_SOURCE_PROFILE;
 hostScopes:RmtxHostScopeSourceContractV4|null;components:import('./rmtx-component-bindings').RmtxComponentSourceContractV3|null;
 nativeView:import('./rmtx-native-view').RmtxNativeOrchestrationViewSourceContract|null;
 nativeLifecycle:import('./rmtx-native-lifecycle').RmtxExtendedLifecycleSourceContract|null;
}
export function parseRmtxSource(input:Partial<RmtTextDocument>|string|undefined,options:RmtxParserOptionsV7):RmtxParseResultV7;
export function parseRmtxSource(input:Partial<RmtTextDocument>|string|undefined,options:RmtxParserOptions|RmtxParserOptionsV2|RmtxParserOptionsV3|RmtxParserOptionsV4|RmtxParserOptionsV5|RmtxParserOptionsV6|RmtxParserOptionsV7):RmtxParseResult|RmtxParseResultV2|RmtxParseResultV3|RmtxParseResultV4|RmtxParseResultV5|RmtxParseResultV6|RmtxParseResultV7;

export const RMTX_PARSER_SCHEMA_V8:'xtend.rmtx.parser-result.v8';
export const RMTX_MANAGED_NATIVE_SOURCE_PROFILE:Readonly<{syntax:'rmtx';version:'8.0.0'}>;
export interface RmtxParserOptionsV8 extends Record<string,unknown>{syntaxVersion:'8.0.0'}
export interface RmtxHostScopeSourceContractV5 extends Omit<RmtxHostScopeSourceContractV4,'schema'|'sourceProfile'>{readonly schema:'xtend.rmtx.host-scopes.v5';readonly sourceProfile:typeof RMTX_MANAGED_NATIVE_SOURCE_PROFILE}
export interface RmtxParseResultV8 extends Omit<RmtxParseResultV7,'schema'|'apiVersion'|'sourceProfile'|'viewProfile'|'actionProfile'|'hostScopes'|'components'|'nativeView'|'nativeLifecycle'>{
 schema:typeof RMTX_PARSER_SCHEMA_V8;apiVersion:'8.0.0';sourceProfile:typeof RMTX_MANAGED_NATIVE_SOURCE_PROFILE;viewProfile:typeof RMTX_MANAGED_NATIVE_SOURCE_PROFILE;actionProfile:typeof RMTX_MANAGED_NATIVE_SOURCE_PROFILE;
 hostScopes:RmtxHostScopeSourceContractV5|null;components:import('./rmtx-component-bindings').RmtxComponentSourceContractV4|null;
 nativeView:import('./rmtx-native-view').RmtxManagedNativeViewSourceContract|null;nativeLifecycle:import('./rmtx-native-lifecycle').RmtxManagedNativeLifecycleSourceContract|null;
}
export function parseRmtxSource(input:Partial<RmtTextDocument>|string|undefined,options:RmtxParserOptionsV8):RmtxParseResultV8;
export function parseRmtxSource(input:Partial<RmtTextDocument>|string|undefined,options:RmtxParserOptions|RmtxParserOptionsV2|RmtxParserOptionsV3|RmtxParserOptionsV4|RmtxParserOptionsV5|RmtxParserOptionsV6|RmtxParserOptionsV7|RmtxParserOptionsV8):RmtxParseResult|RmtxParseResultV2|RmtxParseResultV3|RmtxParseResultV4|RmtxParseResultV5|RmtxParseResultV6|RmtxParseResultV7|RmtxParseResultV8;
