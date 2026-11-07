export * from './classic-ast-types';
import type { RmtClassicAst } from './classic-ast-types';
import type { RmtJsonValue, RmtToolingDiagnostic, RmtCompileResult, RmtParseResult } from './rmt-tooling-public-types';
import type { RmtVNextCoreDocument } from './vnext-compiler';
export { serializeRmtVNextCore as serializeRmtClassicCore } from './vnext-compiler';
export interface RmtClassicCompilerOptions extends Record<string, unknown> { contractVersion?: '1.0.0' }
export interface RmtClassicCompileResult extends RmtCompileResult<RmtVNextCoreDocument> {
  schema: string; phase: string; status: string;
  coreDocument: RmtVNextCoreDocument | null; coreJson: string | null;
  parserResult: RmtParseResult & { sourceModel: unknown };
  compilerDiagnostics: RmtToolingDiagnostic[];
  orchestrationArtifacts: RmtJsonValue | null;
}
export declare function compileRmtClassicSource(input?: unknown, options?: RmtClassicCompilerOptions): RmtClassicCompileResult;
export declare function compileRmtClassicAst(ast: RmtClassicAst, options?: RmtClassicCompilerOptions): RmtVNextCoreDocument;
export type { RmtVNextCoreDocument as RmtClassicCoreDocument, RmtAstCompilationError as RmtClassicAstCompilationError } from './vnext-compiler';
export declare const RMT_CLASSIC_COMPILER_CONTRACT: Readonly<{
  schema: 'xtend.rmt.classic.compiler-contract.v1'; version: '1.0.0'; name: 'RMT Classic';
  inputSchema: 'xtend.rmt.vnext.ast.v1'; coreSchema: 'xtend.rmt.core-format.vnext.v1';
  appPlatformSchema: string; kernelSchema: string; orchestrationSchema: string; portableRenderSchema: string;
}>;
export declare function getRmtClassicAstSchema(): RmtJsonValue;
/** Structural/field/context validation; compilation additionally resolves symbols and checks executable semantics. */
export declare function validateRmtClassicAst(ast: unknown, options?: Record<string, unknown>): RmtToolingDiagnostic[];
export declare function isRmtClassicAst(ast: unknown): ast is RmtClassicAst;
export interface RmtClassicCompiler {
  readonly name: 'RMT Classic'; readonly contract: typeof RMT_CLASSIC_COMPILER_CONTRACT;
  readonly schema: string; readonly coreSchema: string;
  readonly compileSource: typeof compileRmtClassicSource; readonly compileAst: typeof compileRmtClassicAst;
  readonly serializeCore: (core: RmtVNextCoreDocument) => string;
  readonly [metadata: string]: unknown;
}
export declare function createRmtClassicCompiler(options?: RmtClassicCompilerOptions): RmtClassicCompiler;
