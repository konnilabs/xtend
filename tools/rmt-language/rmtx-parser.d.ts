import type { RmtClassicAst } from './classic-ast-types';
import type { RmtTextDocument, RmtRange, RmtToolingDiagnostic } from './rmt-tooling-public-types';
export { getRmtxOperatorProfile, RMTX_OPERATOR_PROFILE_SCHEMA } from './rmtx-operator-profiles';
/** Module capability API; individual profiles retain their own result version. */
export declare const RMTX_PARSER_API_VERSION: '2.0.0';
export declare const RMTX_PARSER_SCHEMA: 'xtend.rmtx.parser-result.v1';
export declare const RMTX_PARSER_SCHEMA_V2: 'xtend.rmtx.parser-result.v2';
export declare const RMTX_SYNTAX_VERSION: '1.0.0';
export declare const RMTX_SOURCE_PROFILE: Readonly<{ syntax: 'rmtx'; version: '1.0.0' }>;
export declare const RMTX_SELECTOR_SOURCE_PROFILE: Readonly<{ syntax: 'rmtx'; version: '2.0.0' }>;
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
