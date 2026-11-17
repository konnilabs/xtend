import type { RmtCompileResult, RmtJsonValue, RmtToolingDiagnostic } from './rmt-tooling-public-types';
import type { RmtVNextCoreDocument } from './vnext-compiler';
import type { XTensionStateBindingArtifact } from '../xtensions/state-binding-artifact';
import type { RmtxParseResult, RmtxParseResultV2, RmtxParseResultV3, RmtxParserOptions, RmtxParserOptionsV2, RmtxParserOptionsV3, RMTX_SOURCE_PROFILE, RMTX_SELECTOR_SOURCE_PROFILE, RMTX_KEYED_SOURCE_PROFILE } from './rmtx-parser';
import type { RmtxSelectorDependencyReport, RmtxSelectorDependencyReportV2 } from './rmtx-selector-dependencies';
import type { RmtxParserOptionsV4 } from './rmtx-parser';
/** Module capability API; individual profiles retain their own result version. */
export declare const RMTX_COMPILER_API_VERSION: '4.0.0';
export declare const RMTX_COMPILE_RESULT_SCHEMA: 'xtend.rmtx.compile-result.v1';
export declare const RMTX_COMPILE_RESULT_SCHEMA_V2: 'xtend.rmtx.compile-result.v2';
export declare const RMTX_COMPILE_RESULT_SCHEMA_V3: 'xtend.rmtx.compile-result.v3';
export declare const RMTX_COMPILE_RESULT_SCHEMA_V4: 'xtend.rmtx.compile-result.v4';
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

export interface RmtxCompilerOptionsV3 extends RmtxParserOptionsV3 { xtensionBindings?: XTensionStateBindingArtifact; contractVersion?: '1.0.0' }
export interface RmtxCompileResultV3 extends RmtCompileResult<RmtVNextCoreDocument> {
  schema: typeof RMTX_COMPILE_RESULT_SCHEMA_V3; apiVersion: '3.0.0';
  sourceProfile: typeof RMTX_KEYED_SOURCE_PROFILE; phase: string; status: string; parserResult: RmtxParseResultV3;
  coreDocument: RmtVNextCoreDocument | null; coreJson: string | null;
  orchestrationArtifacts: RmtJsonValue | null; compilerDiagnostics: RmtToolingDiagnostic[];
  xtensionBindings?: XTensionStateBindingArtifact | null;
  selectorDependencies: RmtxSelectorDependencyReportV2 | null;
}
export declare function compileRmtxSource(input: unknown, options: RmtxCompilerOptionsV3): RmtxCompileResultV3;
export declare function compileRmtxSource(input: unknown, options: RmtxCompilerOptions | RmtxCompilerOptionsV2 | RmtxCompilerOptionsV3): RmtxCompileResult | RmtxCompileResultV2 | RmtxCompileResultV3;
export interface RmtxCompilerV3 {
  name: 'RMTX'; apiVersion: '3.0.0'; schema: typeof RMTX_COMPILE_RESULT_SCHEMA_V3;
  sourceProfile: typeof RMTX_KEYED_SOURCE_PROFILE;
  compileSource(input?: unknown): RmtxCompileResultV3;
  compileSource(input: unknown, options: RmtxCompilerOptionsV3): RmtxCompileResultV3;
  compileSource(input: unknown, options: RmtxCompilerOptionsV2): RmtxCompileResultV2;
  compileSource(input: unknown, options: RmtxCompilerOptions & { syntaxVersion: '1.0.0' }): RmtxCompileResult;
  compileSource(input: unknown, options?: RmtxCompilerOptions | RmtxCompilerOptionsV2 | RmtxCompilerOptionsV3): RmtxCompileResult | RmtxCompileResultV2 | RmtxCompileResultV3;
}
export declare function createRmtxCompiler(defaultOptions: RmtxCompilerOptionsV3): Readonly<RmtxCompilerV3>;
export declare function createRmtxCompiler(defaultOptions: RmtxCompilerOptions | RmtxCompilerOptionsV2 | RmtxCompilerOptionsV3): Readonly<RmtxCompiler | RmtxCompilerV2 | RmtxCompilerV3>;

export interface RmtxCompilerOptionsV4 extends RmtxParserOptionsV4 {
  componentInterfaceCatalog?: import('./rmtx-component-bindings').RmtxComponentCatalog;
  xtensionBindings?: never;
  contractVersion?: '1.0.0';
}
export interface RmtxCompileResultV4 extends Omit<RmtxCompileResultV3, 'schema' | 'apiVersion' | 'sourceProfile' | 'parserResult' | 'selectorDependencies' | 'xtensionBindings'> {
  schema: typeof RMTX_COMPILE_RESULT_SCHEMA_V4; apiVersion: '4.0.0';
  sourceProfile: typeof import('./rmtx-parser').RMTX_ORCHESTRATION_SOURCE_PROFILE;
  parserResult: import('./rmtx-parser').RmtxParseResultV4;
  selectorDependencies: import('./rmtx-selector-dependencies').RmtxSelectorDependencyReportV3 | null;
  xtensionBindings?: import('../xtensions/state-binding-artifact').XTensionProjectionStateBindingArtifact | null;
  xtensionComposition?: ReturnType<typeof import('./rmtx-component-bindings').projectRmtxComponents>['xtensionComposition'] | null;
  componentDependencies?: import('./rmtx-component-bindings').RmtxComponentDependencyReport | null;
}
export declare function compileRmtxSource(input: unknown, options: RmtxCompilerOptionsV4): RmtxCompileResultV4;
export declare function compileRmtxSource(input: unknown, options: RmtxCompilerOptions | RmtxCompilerOptionsV2 | RmtxCompilerOptionsV3 | RmtxCompilerOptionsV4): RmtxCompileResult | RmtxCompileResultV2 | RmtxCompileResultV3 | RmtxCompileResultV4;
export interface RmtxCompilerV4 {
  name: 'RMTX'; apiVersion: '4.0.0'; schema: typeof RMTX_COMPILE_RESULT_SCHEMA_V4;
  sourceProfile: typeof import('./rmtx-parser').RMTX_ORCHESTRATION_SOURCE_PROFILE;
  compileSource(input?: unknown): RmtxCompileResultV4;
  compileSource(input: unknown, options: Omit<RmtxCompilerOptionsV4, 'syntaxVersion'> & { syntaxVersion?: '4.0.0' }): RmtxCompileResultV4;
  compileSource(input: unknown, options: RmtxCompilerOptionsV4): RmtxCompileResultV4;
  compileSource(input: unknown, options: RmtxCompilerOptionsV3): RmtxCompileResultV3;
  compileSource(input: unknown, options: RmtxCompilerOptionsV2): RmtxCompileResultV2;
  compileSource(input: unknown, options: RmtxCompilerOptions & { syntaxVersion: '1.0.0' }): RmtxCompileResult;
  compileSource(input: unknown, options?: RmtxCompilerOptions | RmtxCompilerOptionsV2 | RmtxCompilerOptionsV3 | RmtxCompilerOptionsV4): RmtxCompileResult | RmtxCompileResultV2 | RmtxCompileResultV3 | RmtxCompileResultV4;
}
export declare function createRmtxCompiler(defaultOptions: RmtxCompilerOptionsV4): Readonly<RmtxCompilerV4>;
export declare function createRmtxCompiler(defaultOptions: RmtxCompilerOptions | RmtxCompilerOptionsV2 | RmtxCompilerOptionsV3 | RmtxCompilerOptionsV4): Readonly<RmtxCompiler | RmtxCompilerV2 | RmtxCompilerV3 | RmtxCompilerV4>;
