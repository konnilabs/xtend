import type { RmtCompileResult, RmtJsonValue, RmtToolingDiagnostic } from './rmt-tooling-public-types';
import type { RmtVNextCoreDocument } from './vnext-compiler';
import type { XTensionStateBindingArtifact } from '../xtensions/state-binding-artifact';
import type { RmtxParseResult, RmtxParseResultV2, RmtxParseResultV3, RmtxParserOptions, RmtxParserOptionsV2, RmtxParserOptionsV3, RMTX_SOURCE_PROFILE, RMTX_SELECTOR_SOURCE_PROFILE, RMTX_KEYED_SOURCE_PROFILE } from './rmtx-parser';
import type { RmtxSelectorDependencyReport, RmtxSelectorDependencyReportV2 } from './rmtx-selector-dependencies';
import type { RmtxParserOptionsV4, RmtxParserOptionsV5, RmtxParserOptionsV6, RmtxParserOptionsV7 } from './rmtx-parser';
/** Module capability API; individual profiles retain their own result version. */
export declare const RMTX_COMPILER_API_VERSION: '7.0.0';
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

export declare const RMTX_COMPILE_RESULT_SCHEMA_V5: 'xtend.rmtx.compile-result.v5';
export interface RmtxCompilerOptionsV5 extends RmtxParserOptionsV5 {
  componentInterfaceCatalog?: import('./rmtx-component-bindings').RmtxComponentCatalog;
  xtensionBindings?: never;
  contractVersion?: '1.0.0';
}
export interface RmtxCompileResultV5 extends Omit<RmtxCompileResultV4, 'schema' | 'apiVersion' | 'sourceProfile' | 'parserResult' | 'selectorDependencies' | 'xtensionBindings' | 'xtensionComposition' | 'componentDependencies'> {
  schema: typeof RMTX_COMPILE_RESULT_SCHEMA_V5; apiVersion: '5.0.0';
  sourceProfile: typeof import('./rmtx-parser').RMTX_NATIVE_SOURCE_PROFILE;
  parserResult: import('./rmtx-parser').RmtxParseResultV5;
  selectorDependencies: import('./rmtx-selector-dependencies').RmtxSelectorDependencyReportV4 | null;
  nativeDependencies: import('./rmtx-native-view').RmtxNativeViewDependencyReport | null;
  xtensionBindings?: import('../xtensions/state-binding-artifact').XTensionNativeStateBindingArtifact | null;
  xtensionComposition?: Readonly<Record<string, unknown>> & { readonly schema: 'xtend.maraca.xtension-composition-manifest.v9' } | null;
  componentDependencies?: import('./rmtx-component-bindings').RmtxComponentDependencyReportV2 | null;
}
export declare function compileRmtxSource(input: unknown, options: RmtxCompilerOptionsV5): RmtxCompileResultV5;
export declare function compileRmtxSource(input: unknown, options: RmtxCompilerOptions | RmtxCompilerOptionsV2 | RmtxCompilerOptionsV3 | RmtxCompilerOptionsV4 | RmtxCompilerOptionsV5): RmtxCompileResult | RmtxCompileResultV2 | RmtxCompileResultV3 | RmtxCompileResultV4 | RmtxCompileResultV5;
export interface RmtxCompilerV5 {
  name: 'RMTX'; apiVersion: '5.0.0'; schema: typeof RMTX_COMPILE_RESULT_SCHEMA_V5;
  sourceProfile: typeof import('./rmtx-parser').RMTX_NATIVE_SOURCE_PROFILE;
  compileSource(input?: unknown): RmtxCompileResultV5;
  compileSource(input: unknown, options: Omit<RmtxCompilerOptionsV5, 'syntaxVersion'> & { syntaxVersion?: '5.0.0' }): RmtxCompileResultV5;
  compileSource(input: unknown, options: RmtxCompilerOptionsV5): RmtxCompileResultV5;
  compileSource(input: unknown, options: RmtxCompilerOptionsV4): RmtxCompileResultV4;
  compileSource(input: unknown, options: RmtxCompilerOptionsV3): RmtxCompileResultV3;
  compileSource(input: unknown, options: RmtxCompilerOptionsV2): RmtxCompileResultV2;
  compileSource(input: unknown, options: RmtxCompilerOptions & { syntaxVersion: '1.0.0' }): RmtxCompileResult;
  compileSource(input: unknown, options?: RmtxCompilerOptions | RmtxCompilerOptionsV2 | RmtxCompilerOptionsV3 | RmtxCompilerOptionsV4 | RmtxCompilerOptionsV5): RmtxCompileResult | RmtxCompileResultV2 | RmtxCompileResultV3 | RmtxCompileResultV4 | RmtxCompileResultV5;
}
export declare function createRmtxCompiler(defaultOptions: RmtxCompilerOptionsV5): Readonly<RmtxCompilerV5>;
export declare function createRmtxCompiler(defaultOptions: RmtxCompilerOptions | RmtxCompilerOptionsV2 | RmtxCompilerOptionsV3 | RmtxCompilerOptionsV4 | RmtxCompilerOptionsV5): Readonly<RmtxCompiler | RmtxCompilerV2 | RmtxCompilerV3 | RmtxCompilerV4 | RmtxCompilerV5>;

export type { RmtxNativeViewSourceContract, RmtxNativeViewDependencyReport, RmtxNativeProjection, RmtxNativeSourceNode } from './rmtx-native-view';

export declare const RMTX_COMPILE_RESULT_SCHEMA_V6: 'xtend.rmtx.compile-result.v6';
export interface RmtxCompilerOptionsV6 extends RmtxParserOptionsV6 {
  componentInterfaceCatalog?: import('./rmtx-component-bindings').RmtxComponentCatalog;
  xtensionBindings?: never;
  contractVersion?: '1.0.0';
}
export interface RmtxCompileResultV6 extends Omit<RmtxCompileResultV5, 'schema' | 'apiVersion' | 'sourceProfile' | 'parserResult' | 'selectorDependencies' | 'xtensionBindings' | 'xtensionComposition' | 'componentDependencies'> {
  schema: typeof RMTX_COMPILE_RESULT_SCHEMA_V6; apiVersion: '6.0.0';
  sourceProfile: typeof import('./rmtx-parser').RMTX_LIFECYCLE_SOURCE_PROFILE;
  parserResult: import('./rmtx-parser').RmtxParseResultV6;
  selectorDependencies: import('./rmtx-selector-dependencies').RmtxSelectorDependencyReportV5 | null;
  lifecycleDependencies: import('./rmtx-native-lifecycle').RmtxLifecycleDependencyReport | null;
  xtensionBindings?: import('../xtensions/state-binding-artifact').XTensionLifecycleStateBindingArtifact | null;
  xtensionComposition?: ReturnType<typeof import('./rmtx-component-bindings').projectRmtxLifecycleComponents>['xtensionComposition'] | null;
  componentDependencies?: import('./rmtx-component-bindings').RmtxComponentDependencyReportV3 | null;
}
export declare function compileRmtxSource(input: unknown, options: RmtxCompilerOptionsV6): RmtxCompileResultV6;
export declare function compileRmtxSource(input: unknown, options: RmtxCompilerOptions | RmtxCompilerOptionsV2 | RmtxCompilerOptionsV3 | RmtxCompilerOptionsV4 | RmtxCompilerOptionsV5 | RmtxCompilerOptionsV6): RmtxCompileResult | RmtxCompileResultV2 | RmtxCompileResultV3 | RmtxCompileResultV4 | RmtxCompileResultV5 | RmtxCompileResultV6;
export interface RmtxCompilerV6 {
  name: 'RMTX'; apiVersion: '6.0.0'; schema: typeof RMTX_COMPILE_RESULT_SCHEMA_V6;
  sourceProfile: typeof import('./rmtx-parser').RMTX_LIFECYCLE_SOURCE_PROFILE;
  compileSource(input?: unknown): RmtxCompileResultV6;
  compileSource(input: unknown, options: Omit<RmtxCompilerOptionsV6, 'syntaxVersion'> & { syntaxVersion?: '6.0.0' }): RmtxCompileResultV6;
  compileSource(input: unknown, options: RmtxCompilerOptionsV6): RmtxCompileResultV6;
  compileSource(input: unknown, options: RmtxCompilerOptionsV5): RmtxCompileResultV5;
  compileSource(input: unknown, options: RmtxCompilerOptionsV4): RmtxCompileResultV4;
  compileSource(input: unknown, options: RmtxCompilerOptionsV3): RmtxCompileResultV3;
  compileSource(input: unknown, options: RmtxCompilerOptionsV2): RmtxCompileResultV2;
  compileSource(input: unknown, options: RmtxCompilerOptions & { syntaxVersion: '1.0.0' }): RmtxCompileResult;
  compileSource(input: unknown, options?: RmtxCompilerOptions | RmtxCompilerOptionsV2 | RmtxCompilerOptionsV3 | RmtxCompilerOptionsV4 | RmtxCompilerOptionsV5 | RmtxCompilerOptionsV6): RmtxCompileResult | RmtxCompileResultV2 | RmtxCompileResultV3 | RmtxCompileResultV4 | RmtxCompileResultV5 | RmtxCompileResultV6;
}
export declare function createRmtxCompiler(defaultOptions: RmtxCompilerOptionsV6): Readonly<RmtxCompilerV6>;
export declare function createRmtxCompiler(defaultOptions: RmtxCompilerOptions | RmtxCompilerOptionsV2 | RmtxCompilerOptionsV3 | RmtxCompilerOptionsV4 | RmtxCompilerOptionsV5 | RmtxCompilerOptionsV6): Readonly<RmtxCompiler | RmtxCompilerV2 | RmtxCompilerV3 | RmtxCompilerV4 | RmtxCompilerV5 | RmtxCompilerV6>;
export type { RmtxNativeLifecycleSourceContract, RmtNativeLifecyclePlan, RmtxLifecycleDependencyReport } from './rmtx-native-lifecycle';

export const RMTX_COMPILE_RESULT_SCHEMA_V7:'xtend.rmtx.compile-result.v7';
export interface RmtxCompilerOptionsV7 extends RmtxParserOptionsV7 {
 componentInterfaceCatalog?:import('./rmtx-component-bindings').RmtxComponentCatalog;xtensionBindings?:never;contractVersion?:'1.0.0';
}
export interface RmtxCompileResultV7 extends Omit<RmtxCompileResultV6,'schema'|'apiVersion'|'sourceProfile'|'parserResult'|'selectorDependencies'|'nativeDependencies'|'lifecycleDependencies'|'xtensionBindings'|'xtensionComposition'|'componentDependencies'> {
 schema:typeof RMTX_COMPILE_RESULT_SCHEMA_V7;apiVersion:'7.0.0';sourceProfile:typeof import('./rmtx-parser').RMTX_NATIVE_ORCHESTRATION_SOURCE_PROFILE;
 parserResult:import('./rmtx-parser').RmtxParseResultV7;selectorDependencies:import('./rmtx-selector-dependencies').RmtxSelectorDependencyReportV6|null;
 nativeDependencies:import('./rmtx-native-view').RmtxNativeOrchestrationDependencyReport|null;lifecycleDependencies:import('./rmtx-native-lifecycle').RmtxExtendedLifecycleDependencyReport|null;
 xtensionBindings?:import('../xtensions/state-binding-artifact').XTensionOrchestratedStateBindingArtifact|null;
 xtensionComposition?:ReturnType<typeof import('./rmtx-component-bindings').projectRmtxOrchestratedComponents>['xtensionComposition']|null;
 componentDependencies?:import('./rmtx-component-bindings').RmtxComponentDependencyReportV4|null;
}
export interface RmtxCompilerV7 {
 name:'RMTX';apiVersion:'7.0.0';schema:typeof RMTX_COMPILE_RESULT_SCHEMA_V7;sourceProfile:typeof import('./rmtx-parser').RMTX_NATIVE_ORCHESTRATION_SOURCE_PROFILE;
 compileSource(input?:unknown):RmtxCompileResultV7;
 compileSource(input:unknown,options:Omit<RmtxCompilerOptionsV7,'syntaxVersion'>&{syntaxVersion?:'7.0.0'}):RmtxCompileResultV7;
 compileSource(input:unknown,options:RmtxCompilerOptionsV7):RmtxCompileResultV7;
 compileSource(input:unknown,options:RmtxCompilerOptionsV6):RmtxCompileResultV6;
 compileSource(input:unknown,options:RmtxCompilerOptionsV5):RmtxCompileResultV5;
 compileSource(input:unknown,options:RmtxCompilerOptionsV4):RmtxCompileResultV4;
 compileSource(input:unknown,options:RmtxCompilerOptionsV3):RmtxCompileResultV3;
 compileSource(input:unknown,options:RmtxCompilerOptionsV2):RmtxCompileResultV2;
 compileSource(input:unknown,options:RmtxCompilerOptions&{syntaxVersion:'1.0.0'}):RmtxCompileResult;
}
export function compileRmtxSource(input:unknown,options:RmtxCompilerOptionsV7):RmtxCompileResultV7;
export function createRmtxCompiler(options:RmtxCompilerOptionsV7):Readonly<RmtxCompilerV7>;

export function compileRmtxSource(input:unknown,options:RmtxCompilerOptions|RmtxCompilerOptionsV2|RmtxCompilerOptionsV3|RmtxCompilerOptionsV4|RmtxCompilerOptionsV5|RmtxCompilerOptionsV6|RmtxCompilerOptionsV7):RmtxCompileResult|RmtxCompileResultV2|RmtxCompileResultV3|RmtxCompileResultV4|RmtxCompileResultV5|RmtxCompileResultV6|RmtxCompileResultV7;
export function createRmtxCompiler(options:RmtxCompilerOptions|RmtxCompilerOptionsV2|RmtxCompilerOptionsV3|RmtxCompilerOptionsV4|RmtxCompilerOptionsV5|RmtxCompilerOptionsV6|RmtxCompilerOptionsV7):Readonly<RmtxCompiler|RmtxCompilerV2|RmtxCompilerV3|RmtxCompilerV4|RmtxCompilerV5|RmtxCompilerV6|RmtxCompilerV7>;
