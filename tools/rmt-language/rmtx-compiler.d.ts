import type { RmtCompileResult, RmtJsonValue, RmtTextDocument, RmtToolingDiagnostic } from './rmt-tooling-public-types';
import type { RmtVNextCoreDocument } from './vnext-compiler';
import type { XTensionStateBindingArtifact } from '../xtensions/state-binding-artifact';
import type { RmtxParseResult, RmtxParserOptions, RMTX_SOURCE_PROFILE } from './rmtx-parser';
export declare const RMTX_COMPILER_API_VERSION: '1.0.0';
export declare const RMTX_COMPILE_RESULT_SCHEMA: 'xtend.rmtx.compile-result.v1';
export interface RmtxCompilerOptions extends RmtxParserOptions { xtensionBindings?: XTensionStateBindingArtifact; contractVersion?: '1.0.0' }
export interface RmtxCompileResult extends RmtCompileResult<RmtVNextCoreDocument> {
  schema: typeof RMTX_COMPILE_RESULT_SCHEMA; apiVersion: typeof RMTX_COMPILER_API_VERSION;
  sourceProfile: typeof RMTX_SOURCE_PROFILE; phase: string; status: string; parserResult: RmtxParseResult;
  coreDocument: RmtVNextCoreDocument | null; coreJson: string | null;
  orchestrationArtifacts: RmtJsonValue | null; compilerDiagnostics: RmtToolingDiagnostic[];
  xtensionBindings?: XTensionStateBindingArtifact | null;
}
export declare function compileRmtxSource(input?: unknown, options?: RmtxCompilerOptions): RmtxCompileResult;
export interface RmtxCompiler {
  name: 'RMTX'; apiVersion: typeof RMTX_COMPILER_API_VERSION; schema: typeof RMTX_COMPILE_RESULT_SCHEMA;
  sourceProfile: typeof RMTX_SOURCE_PROFILE;
  compileSource: typeof compileRmtxSource;
}
export declare function createRmtxCompiler(defaultOptions?: RmtxCompilerOptions): Readonly<RmtxCompiler>;
