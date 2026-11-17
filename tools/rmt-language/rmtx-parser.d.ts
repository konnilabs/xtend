import type { RmtClassicAst } from './classic-ast-types';
import type { RmtTextDocument, RmtRange, RmtToolingDiagnostic } from './rmt-tooling-public-types';
export { getRmtxOperatorProfile, RMTX_OPERATOR_PROFILE_SCHEMA, RMTX_OPERATOR_PROFILE_SCHEMA_V2, RMTX_OPERATOR_PROFILE_SCHEMA_V3 } from './rmtx-operator-profiles';
/** Module capability API; individual profiles retain their own result version. */
export declare const RMTX_PARSER_API_VERSION: '4.0.0';
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
