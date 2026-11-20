export * from './rmt-tooling-public-types';
import type { RmtAppServiceDemandManifest, RmtCompileResult, RmtJsonValue, RmtParseResult, RmtToolingConstant, RmtToolingDiagnostic, RmtToolingFactory, RmtToolingFunction } from './rmt-tooling-public-types';

export interface RmtVNextCoreDocument {
  schema: 'xtend.rmt.core-format.vnext.v1';
  kind: 'rmt_document';
  version: '2.0-vnext';
  [key: string]: RmtJsonValue;
}
export interface RmtAstCompilationError extends Error {
  code: 'rmt.vnext.ast.compilation_failed';
  phase: string;
  diagnostics: RmtToolingDiagnostic[];
}
export interface RmtVNextCompiler {
  readonly apiVersion: typeof RMT_VNEXT_COMPILER_API_VERSION;
  readonly schema: string;
  readonly coreSchema: string;
  readonly compileSource: typeof compileRmtVNextSource;
  readonly compileAst: typeof compileRmtVNextAst;
  readonly serializeCore: (coreDocument: RmtVNextCoreDocument) => string;
  readonly [metadata: string]: unknown;
}
/** Runs the shared semantic/compiler pipeline; throws RmtAstCompilationError on rejection. */
export declare function compileRmtVNextAst(ast: RmtJsonValue, options?: Record<string, unknown>): RmtVNextCoreDocument;
export interface RmtCompilerSourceProfile { readonly syntax: 'rmtx'; readonly version: '1.0.0' }
export interface RmtCompilerSourceProfileV2 { readonly syntax: 'rmtx'; readonly version: '2.0.0' }
export interface RmtCompilerSourceProfileV3 { readonly syntax: 'rmtx'; readonly version: '3.0.0' }
export interface RmtCompilerSourceProfileV4 { readonly syntax: 'rmtx'; readonly version: '4.0.0' }
export interface RmtCompilerSourceProfileV5 { readonly syntax: 'rmtx'; readonly version: '5.0.0' }
export interface RmtCompilerSourceProfileV6 { readonly syntax: 'rmtx'; readonly version: '6.0.0' }
export interface RmtVNextAstResultOptions extends Record<string, unknown> { sourceProfile?: RmtCompilerSourceProfile }
export interface RmtVNextAstResultOptionsV2 extends Record<string, unknown> { sourceProfile: RmtCompilerSourceProfileV2 }
export interface RmtVNextAstResultOptionsV3 extends Record<string, unknown> { sourceProfile: RmtCompilerSourceProfileV3 }
export interface RmtVNextAstResultOptionsV4 extends Record<string, unknown> { sourceProfile: RmtCompilerSourceProfileV4; rmtxActionInputRules?: import('./action-input-contract').RmtxActionInputRules }
export interface RmtVNextAstResultOptionsV5 extends Record<string, unknown> { sourceProfile: RmtCompilerSourceProfileV5; rmtxActionInputRules: import('./action-input-contract').RmtxActionInputRules; rmtxNativeView: import('./rmtx-native-view').RmtxNativeViewSourceContract }
export interface RmtVNextAstResultOptionsV6 extends Record<string, unknown> {
  sourceProfile: RmtCompilerSourceProfileV6;
  viewProfile: RmtCompilerSourceProfileV5; actionProfile: RmtCompilerSourceProfileV4;
  rmtxActionInputRules: import('./action-input-contract').RmtxActionInputRules;
  rmtxNativeView: import('./rmtx-native-view').RmtxNativeViewSourceContract;
  rmtxNativeLifecycle: import('./rmtx-native-lifecycle').RmtxNativeLifecycleSourceContract;
}
export interface RmtVNextAstCompileResult extends RmtCompileResult<RmtVNextCoreDocument> {
  schema: string; phase: string; status: string;
  coreDocument: RmtVNextCoreDocument | null; coreJson: string | null;
  parserResult: RmtParseResult & { sourceModel: unknown };
  compilerDiagnostics: RmtToolingDiagnostic[];
  orchestrationArtifacts: RmtJsonValue | null;
}
/** Full shared-pipeline result. Only this new AST-result entry accepts the closed sourceProfile option. */
export declare function compileRmtVNextAstResult(ast: RmtJsonValue, options?: RmtVNextAstResultOptions): RmtVNextAstCompileResult;
/** Additional source profile; the existing v1 option type remains unchanged. */
export declare function compileRmtVNextAstResult(ast: RmtJsonValue, options: RmtVNextAstResultOptionsV2): RmtVNextAstCompileResult;
export declare function compileRmtVNextAstResult(ast: RmtJsonValue, options: RmtVNextAstResultOptionsV3): RmtVNextAstCompileResult;
export declare function compileRmtVNextAstResult(ast: RmtJsonValue, options: RmtVNextAstResultOptionsV4): RmtVNextAstCompileResult;
export declare function compileRmtVNextAstResult(ast: RmtJsonValue, options: RmtVNextAstResultOptionsV5): RmtVNextAstCompileResult;
export declare function compileRmtVNextAstResult(ast: RmtJsonValue, options: RmtVNextAstResultOptionsV6): RmtVNextAstCompileResult;
export declare function compileRmtVNextAstResult(ast: RmtJsonValue, options?: RmtVNextAstResultOptions | RmtVNextAstResultOptionsV2 | RmtVNextAstResultOptionsV3 | RmtVNextAstResultOptionsV4 | RmtVNextAstResultOptionsV5 | RmtVNextAstResultOptionsV6): RmtVNextAstCompileResult;
export declare const compileRmtVNextSource: RmtToolingFunction<RmtCompileResult>;
export declare const createRmtAppServiceDemands: (coreDocument?: RmtJsonValue) => RmtAppServiceDemandManifest;
export declare const createRmtVNextCompiler: RmtToolingFactory<RmtVNextCompiler>;
export declare const RMT_FILE_FALLBACK_CODE: RmtToolingConstant;
export declare const RMT_APP_ORCHESTRATION_SCHEMA: RmtToolingConstant;
export declare const RMT_APP_ORCHESTRATION_SCHEMA_V2: 'xtend.rmt.app-orchestration.v2';
export declare const RMT_APP_ORCHESTRATION_SCHEMA_V3: 'xtend.rmt.app-orchestration.v3';
export declare const RMT_APP_ORCHESTRATION_SCHEMA_V4: 'xtend.rmt.app-orchestration.v4';
export declare const RMT_APP_ORCHESTRATION_WORKPACKAGE: RmtToolingConstant;
export declare const RMT_APP_SERVICE_DEMANDS_SCHEMA: RmtToolingConstant<'xtend.maraca.app-service-demands.v1'>;
export declare const RMT_APP_SERVICE_INPUT_POLICY_SCHEMA: RmtToolingConstant<'xtend.maraca.app-service-input-policy.v1'>;
export declare const RMT_COMPONENT_COMMAND_SCHEMA: RmtToolingConstant<'xtend.rmt.component-command.v1'>;
export declare const RMT_APP_PLATFORM_RECORDS_SCHEMA: RmtToolingConstant;
export declare const RMT_FORM_VALIDATION_SCHEMA: RmtToolingConstant;
export declare const RMT_SURFACE_TRANSITION_SCHEMA: RmtToolingConstant;
export declare const RMT_ANIMATION_ENGINE_SCHEMA: RmtToolingConstant;
export declare const RMT_KERNEL_BOUNDARY: RmtToolingConstant;
export declare const RMT_KERNEL_RECORDS_SCHEMA: RmtToolingConstant;
export declare const RMT_VNEXT_COMPILER_DIAGNOSTIC_CODE: RmtToolingConstant;
export declare const RMT_VNEXT_COMPILER_MODULE_PATH: RmtToolingConstant;
export declare const RMT_VNEXT_COMPILER_PACKAGE_SCRIPT: RmtToolingConstant;
export declare const RMT_VNEXT_COMPILER_REPORT_SCHEMA: RmtToolingConstant;
export declare const RMT_VNEXT_COMPILER_SCHEMA: RmtToolingConstant;
export declare const RMT_VNEXT_COMPILER_API_VERSION: '1.10.0';
export declare const RMT_VNEXT_COMPILER_SUITE_PATH: RmtToolingConstant;
export declare const RMT_VNEXT_COMPILER_WORKPACKAGE: RmtToolingConstant;
export declare const RMT_VNEXT_CORE_SCHEMA: RmtToolingConstant;
export declare const RMT_VNEXT_PARSER_WORKPACKAGE: RmtToolingConstant;
export declare const RMT_VNEXT_PRIMITIVE_LOWERING_SCHEMA: RmtToolingConstant;
export declare const RMT_VNEXT_PRIMITIVE_LOWERING_WORKPACKAGE: RmtToolingConstant;
export declare function serializeRmtVNextCore(coreDocument: RmtVNextCoreDocument): string;
export declare function createRmtAppOrchestrationArtifacts(coreDocument: RmtVNextCoreDocument): RmtJsonValue | null;
export declare function createRmtAppOrchestrationArtifacts(coreDocument: RmtVNextCoreDocument, options: RmtVNextAstResultOptionsV4): RmtJsonValue | null;

export declare function createRmtAppOrchestrationArtifacts(coreDocument: RmtVNextCoreDocument, options: RmtVNextAstResultOptionsV5): RmtJsonValue | null;
export declare function createRmtAppOrchestrationArtifacts(coreDocument: RmtVNextCoreDocument, options: RmtVNextAstResultOptionsV6): RmtJsonValue | null;

/** Source7 composes the explicit native Surface/component contract with unchanged Action4. */
export interface RmtCompilerSourceProfileV7 { readonly syntax:'rmtx'; readonly version:'7.0.0' }
export interface RmtVNextAstResultOptionsV7 extends Record<string,unknown> {
 sourceProfile:RmtCompilerSourceProfileV7; viewProfile:RmtCompilerSourceProfileV7; actionProfile:RmtCompilerSourceProfileV4;
 rmtxActionInputRules:import('./action-input-contract').RmtxActionInputRules;
 rmtxNativeView:import('./rmtx-native-view').RmtxNativeOrchestrationViewSourceContract;
 rmtxNativeLifecycle:import('./rmtx-native-lifecycle').RmtxExtendedLifecycleSourceContract;
}
export declare const RMT_APP_ORCHESTRATION_SCHEMA_V5:'xtend.rmt.app-orchestration.v5';
export declare function compileRmtVNextAstResult(ast:RmtJsonValue,options:RmtVNextAstResultOptionsV7):RmtVNextAstCompileResult;
export declare function compileRmtVNextAstResult(ast:RmtJsonValue,options:RmtVNextAstResultOptions|RmtVNextAstResultOptionsV2|RmtVNextAstResultOptionsV3|RmtVNextAstResultOptionsV4|RmtVNextAstResultOptionsV5|RmtVNextAstResultOptionsV6|RmtVNextAstResultOptionsV7):RmtVNextAstCompileResult;
export declare function createRmtAppOrchestrationArtifacts(coreDocument:RmtVNextCoreDocument,options:RmtVNextAstResultOptionsV7):RmtJsonValue|null;
export interface RmtCompilerSourceProfileV8 {readonly syntax:'rmtx';readonly version:'8.0.0'}
export interface RmtVNextAstResultOptionsV8 extends Record<string,unknown>{sourceProfile:RmtCompilerSourceProfileV8;viewProfile:RmtCompilerSourceProfileV8;actionProfile:RmtCompilerSourceProfileV8;rmtxActionInputRules:import('./action-input-contract').RmtxActionInputRules;rmtxNativeView:import('./rmtx-native-view').RmtxManagedNativeViewSourceContract;rmtxNativeLifecycle:import('./rmtx-native-lifecycle').RmtxManagedNativeLifecycleSourceContract}
export const RMT_APP_ORCHESTRATION_SCHEMA_V6:'xtend.rmt.app-orchestration.v6';
export function compileRmtVNextAstResult(ast:RmtJsonValue,options:RmtVNextAstResultOptionsV8):RmtVNextAstCompileResult;
export function compileRmtVNextAstResult(ast:RmtJsonValue,options:RmtVNextAstResultOptions|RmtVNextAstResultOptionsV2|RmtVNextAstResultOptionsV3|RmtVNextAstResultOptionsV4|RmtVNextAstResultOptionsV5|RmtVNextAstResultOptionsV6|RmtVNextAstResultOptionsV7|RmtVNextAstResultOptionsV8):RmtVNextAstCompileResult;
export function createRmtAppOrchestrationArtifacts(coreDocument:RmtVNextCoreDocument,options:RmtVNextAstResultOptionsV8):RmtJsonValue|null;
