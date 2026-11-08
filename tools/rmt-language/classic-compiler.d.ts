export * from './classic-ast-types';
export declare const RMT_CLASSIC_COMPILER_API_VERSION: '2.0.0';
export declare const RMT_CLASSIC_COMPILE_RESULT_SCHEMA: 'xtend.rmt.classic.compile-result.v2';
export { validateStateBindingArtifact } from '../xtensions/state-binding-artifact';
import type { RmtClassicAst } from './classic-ast-types';
import type { RmtJsonValue, RmtToolingDiagnostic, RmtCompileResult, RmtParseResult } from './rmt-tooling-public-types';
import type { RmtVNextCoreDocument } from './vnext-compiler';
import type { XTensionStateBindingArtifact } from '../xtensions/state-binding-artifact';
export { serializeRmtVNextCore as serializeRmtClassicCore } from './vnext-compiler';
export interface RmtClassicCompilerOptions extends Record<string, unknown> { contractVersion?: '1.0.0'; xtensionBindings?: XTensionStateBindingArtifact }
export interface RmtClassicCompileResult extends RmtCompileResult<RmtVNextCoreDocument> {
  schema: typeof RMT_CLASSIC_COMPILE_RESULT_SCHEMA; phase: string; status: string;
  coreDocument: RmtVNextCoreDocument | null; coreJson: string | null;
  parserResult: RmtParseResult & { sourceModel: unknown };
  compilerDiagnostics: RmtToolingDiagnostic[];
  orchestrationArtifacts: RmtJsonValue | null;
  xtensionBindings?: XTensionStateBindingArtifact | null;
}
export declare function compileRmtClassicSource(input?: unknown, options?: RmtClassicCompilerOptions): RmtClassicCompileResult;
export declare function compileRmtClassicAst(ast: RmtClassicAst, options?: RmtClassicCompilerOptions): RmtVNextCoreDocument;
export declare function compileRmtClassicAstWithBindings(ast: RmtClassicAst, bindings: XTensionStateBindingArtifact, options?: RmtClassicCompilerOptions): {
  coreDocument: RmtVNextCoreDocument; coreJson: string; orchestrationArtifacts: RmtJsonValue | null; xtensionBindings: XTensionStateBindingArtifact;
};
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
  readonly apiVersion: typeof RMT_CLASSIC_COMPILER_API_VERSION;
  readonly schema: string; readonly coreSchema: string;
  readonly compileSource: typeof compileRmtClassicSource; readonly compileAst: typeof compileRmtClassicAst;
  readonly compileAstWithBindings: typeof compileRmtClassicAstWithBindings;
  readonly serializeCore: (core: RmtVNextCoreDocument) => string;
  readonly [metadata: string]: unknown;
}
export declare function createRmtClassicCompiler(options?: RmtClassicCompilerOptions): RmtClassicCompiler;
