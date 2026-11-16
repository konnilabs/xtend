import type { RmtClassicAst } from './classic-ast-types';
import type { RmtTextDocument, RmtRange, RmtToolingDiagnostic } from './rmt-tooling-public-types';
export declare const RMTX_PARSER_API_VERSION: '1.0.0';
export declare const RMTX_PARSER_SCHEMA: 'xtend.rmtx.parser-result.v1';
export declare const RMTX_SYNTAX_VERSION: '1.0.0';
export declare const RMTX_SOURCE_PROFILE: Readonly<{ syntax: 'rmtx'; version: '1.0.0' }>;
export interface RmtxParserOptions extends Record<string, unknown> { syntaxVersion?: '1.0.0' }
export interface RmtxSourceModel {
  schema: string; uri: string; filePath: string | null; languageId: 'rmtx'; text: string;
  filePolicy: { extension: string; canonical: boolean; fallback: boolean; diagnosticCode: string | null };
  rangeForOffsets(startOffset: number, endOffset: number): RmtRange;
  positionAt(offset: number): { line: number; character: number };
  readonly [key: string]: unknown;
}
export interface RmtxParseResult {
  schema: typeof RMTX_PARSER_SCHEMA; apiVersion: typeof RMTX_PARSER_API_VERSION;
  sourceProfile: typeof RMTX_SOURCE_PROFILE; ok: boolean; phase: string; status: 'invalid' | 'parsed';
  sourceModel: RmtxSourceModel; ast: RmtClassicAst | null; diagnostics: RmtToolingDiagnostic[];
}
/** Statically parses the closed RMTX profile. No imports or source expressions execute. */
export declare function parseRmtxSource(input?: Partial<RmtTextDocument> | string, options?: RmtxParserOptions): RmtxParseResult;
