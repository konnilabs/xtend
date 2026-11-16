import type { RmtCompileResult, RmtJsonValue, RmtToolingDiagnostic } from './rmt-tooling-public-types';
import type { RmtVNextCoreDocument } from './vnext-compiler';
import type { XTensionStateBindingArtifact } from '../xtensions/state-binding-artifact';
import type { RmtxParseResult, RmtxParseResultV2, RmtxParserOptions, RmtxParserOptionsV2, RMTX_SOURCE_PROFILE, RMTX_SELECTOR_SOURCE_PROFILE } from './rmtx-parser';
import type { RmtxSelectorDependencyReport } from './rmtx-selector-dependencies';
/** Module capability API; individual profiles retain their own result version. */
export declare const RMTX_COMPILER_API_VERSION: '2.0.0';
export declare const RMTX_COMPILE_RESULT_SCHEMA: 'xtend.rmtx.compile-result.v1';
export declare const RMTX_COMPILE_RESULT_SCHEMA_V2: 'xtend.rmtx.compile-result.v2';
export interface RmtxCompilerOptions extends RmtxParserOptions { xtensionBindings?: XTensionStateBindingArtifact; contractVersion?: '1.0.0' }
export interface RmtxCompilerOptionsV2 extends RmtxParserOptionsV2 { xtensionBindings?: XTensionStateBindingArtifact; contractVersion?: '1.0.0' }
/** The complete existing v1 result is retained as a separate type. */
export interface RmtxCompileResult extends RmtCompileResult<RmtVNextCoreDocument> {
  schema: typeof RMTX_COMPILE_RESULT_SCHEMA; apiVersion: '1.0.0';
  sourceProfile: typeof RMTX_SOURCE_PROFILE; phase: string; status: string; parserResult: RmtxParseResult;
  coreDocument: RmtVNextCoreDocument | null; coreJson: string | null;
  orchestrationArtifacts: RmtJsonValue | null; compilerDiagnostics: RmtToolingDiagnostic[];
  xtensionBindings?: XTensionStateBindingArtifact | null;
}
export interface RmtxCompileResultV2 extends RmtCompileResult<RmtVNextCoreDocument> {
  schema: typeof RMTX_COMPILE_RESULT_SCHEMA_V2; apiVersion: '2.0.0';
  sourceProfile: typeof RMTX_SELECTOR_SOURCE_PROFILE; phase: string; status: string; parserResult: RmtxParseResultV2;
  coreDocument: RmtVNextCoreDocument | null; coreJson: string | null;
  orchestrationArtifacts: RmtJsonValue | null; compilerDiagnostics: RmtToolingDiagnostic[];
  xtensionBindings?: XTensionStateBindingArtifact | null;
  selectorDependencies: RmtxSelectorDependencyReport | null;
}
export declare function compileRmtxSource(input?: unknown, options?: RmtxCompilerOptions): RmtxCompileResult;
export declare function compileRmtxSource(input: unknown, options: RmtxCompilerOptionsV2): RmtxCompileResultV2;
export declare function compileRmtxSource(input?: unknown, options?: RmtxCompilerOptions | RmtxCompilerOptionsV2): RmtxCompileResult | RmtxCompileResultV2;
export interface RmtxCompiler {
  name: 'RMTX'; apiVersion: '1.0.0'; schema: typeof RMTX_COMPILE_RESULT_SCHEMA;
  sourceProfile: typeof RMTX_SOURCE_PROFILE;
  compileSource: (input?: unknown, options?: RmtxCompilerOptions) => RmtxCompileResult;
}
export interface RmtxCompilerV2 {
  name: 'RMTX'; apiVersion: '2.0.0'; schema: typeof RMTX_COMPILE_RESULT_SCHEMA_V2;
  sourceProfile: typeof RMTX_SELECTOR_SOURCE_PROFILE;
  compileSource(input?: unknown): RmtxCompileResultV2;
  compileSource(input: unknown, options: RmtxCompilerOptionsV2): RmtxCompileResultV2;
  compileSource(input: unknown, options: RmtxCompilerOptions & { syntaxVersion: '1.0.0' }): RmtxCompileResult;
  /** Optional v1 overrides can select v1 or inherit the factory's v2 default. */
  compileSource(input: unknown, options?: RmtxCompilerOptions | RmtxCompilerOptionsV2): RmtxCompileResult | RmtxCompileResultV2;
}
export declare function createRmtxCompiler(defaultOptions?: RmtxCompilerOptions): Readonly<RmtxCompiler>;
export declare function createRmtxCompiler(defaultOptions: RmtxCompilerOptionsV2): Readonly<RmtxCompilerV2>;
export declare function createRmtxCompiler(defaultOptions?: RmtxCompilerOptions | RmtxCompilerOptionsV2): Readonly<RmtxCompiler | RmtxCompilerV2>;
