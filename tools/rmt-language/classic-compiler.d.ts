export * from './classic-ast-types';
export declare const RMT_CLASSIC_COMPILER_API_VERSION: '4.8.0';
export declare const RMT_CLASSIC_COMPILE_RESULT_SCHEMA: 'xtend.rmt.classic.compile-result.v4';
export { validateStateBindingArtifact } from '../xtensions/state-binding-artifact';
import type { RmtClassicAst } from './classic-ast-types';
import type { RmtJsonValue, RmtToolingDiagnostic, RmtCompileResult, RmtParseResult } from './rmt-tooling-public-types';
import type { RmtVNextCoreDocument, RmtCompilerSourceProfile, RmtCompilerSourceProfileV2, RmtCompilerSourceProfileV3, RmtCompilerSourceProfileV4, RmtCompilerSourceProfileV5, RmtVNextAstResultOptionsV6, RmtVNextAstResultOptionsV7 } from './vnext-compiler';
import type { XTensionStateBindingArtifact } from '../xtensions/state-binding-artifact';
export { serializeRmtVNextCore as serializeRmtClassicCore } from './vnext-compiler';
export interface RmtClassicCompilerOptions extends Record<string, unknown> { contractVersion?: '1.0.0'; xtensionBindings?: XTensionStateBindingArtifact }
export interface RmtClassicAstResultOptions extends RmtClassicCompilerOptions { sourceProfile?: RmtCompilerSourceProfile }
export interface RmtClassicAstResultOptionsV2 extends RmtClassicCompilerOptions { sourceProfile: RmtCompilerSourceProfileV2 }
export interface RmtClassicAstResultOptionsV3 extends RmtClassicCompilerOptions { sourceProfile: RmtCompilerSourceProfileV3 }
export interface RmtClassicAstResultOptionsV4 extends RmtClassicCompilerOptions { sourceProfile: RmtCompilerSourceProfileV4; rmtxActionInputRules?: import('./action-input-contract').RmtxActionInputRules }
export interface RmtClassicAstResultOptionsV5 extends RmtClassicCompilerOptions { sourceProfile: RmtCompilerSourceProfileV5; rmtxActionInputRules: import('./action-input-contract').RmtxActionInputRules; rmtxNativeView: import('./rmtx-native-view').RmtxNativeViewSourceContract }
export interface RmtClassicAstResultOptionsV6 extends RmtClassicCompilerOptions, RmtVNextAstResultOptionsV6 {}
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
/** Returns all artifacts and diagnostics from the same validated backend as compileSource. */
export declare function compileRmtClassicAstResult(ast: RmtClassicAst, options?: RmtClassicAstResultOptions): RmtClassicCompileResult;
/** Additional source profile; the existing v1 option type remains unchanged. */
export declare function compileRmtClassicAstResult(ast: RmtClassicAst, options: RmtClassicAstResultOptionsV2): RmtClassicCompileResult;
export declare function compileRmtClassicAstResult(ast: RmtClassicAst, options: RmtClassicAstResultOptionsV3): RmtClassicCompileResult;
export declare function compileRmtClassicAstResult(ast: RmtClassicAst, options: RmtClassicAstResultOptionsV4): RmtClassicCompileResult;
export declare function compileRmtClassicAstResult(ast: RmtClassicAst, options: RmtClassicAstResultOptionsV5): RmtClassicCompileResult;
export declare function compileRmtClassicAstResult(ast: RmtClassicAst, options: RmtClassicAstResultOptionsV6): RmtClassicCompileResult;
export declare function compileRmtClassicAstResult(ast: RmtClassicAst, options?: RmtClassicAstResultOptions | RmtClassicAstResultOptionsV2 | RmtClassicAstResultOptionsV3 | RmtClassicAstResultOptionsV4 | RmtClassicAstResultOptionsV5 | RmtClassicAstResultOptionsV6): RmtClassicCompileResult;
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

export interface RmtClassicAstResultOptionsV7 extends RmtClassicCompilerOptions,RmtVNextAstResultOptionsV7 {}
export declare function compileRmtClassicAstResult(ast:RmtClassicAst,options:RmtClassicAstResultOptionsV7):RmtClassicCompileResult;
export declare function compileRmtClassicAstResult(ast:RmtClassicAst,options:RmtClassicAstResultOptions|RmtClassicAstResultOptionsV2|RmtClassicAstResultOptionsV3|RmtClassicAstResultOptionsV4|RmtClassicAstResultOptionsV5|RmtClassicAstResultOptionsV6|RmtClassicAstResultOptionsV7):RmtClassicCompileResult;
