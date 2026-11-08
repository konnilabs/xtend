export * from './rmt-tooling-public-types';
import type { RmtAppServiceDemandManifest, RmtCompileResult, RmtJsonValue, RmtToolingConstant, RmtToolingDiagnostic, RmtToolingFactory, RmtToolingFunction } from './rmt-tooling-public-types';

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
  readonly apiVersion: '1.1.0';
  readonly schema: string;
  readonly coreSchema: string;
  readonly compileSource: typeof compileRmtVNextSource;
  readonly compileAst: typeof compileRmtVNextAst;
  readonly serializeCore: (coreDocument: RmtVNextCoreDocument) => string;
  readonly [metadata: string]: unknown;
}
/** Runs the shared semantic/compiler pipeline; throws RmtAstCompilationError on rejection. */
export declare function compileRmtVNextAst(ast: RmtJsonValue, options?: Record<string, unknown>): RmtVNextCoreDocument;
export declare const compileRmtVNextSource: RmtToolingFunction<RmtCompileResult>;
export declare const createRmtAppServiceDemands: (coreDocument?: RmtJsonValue) => RmtAppServiceDemandManifest;
export declare const createRmtVNextCompiler: RmtToolingFactory<RmtVNextCompiler>;
export declare const RMT_FILE_FALLBACK_CODE: RmtToolingConstant;
export declare const RMT_APP_ORCHESTRATION_SCHEMA: RmtToolingConstant;
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
export declare const RMT_VNEXT_COMPILER_API_VERSION: '1.1.0';
export declare const RMT_VNEXT_COMPILER_SUITE_PATH: RmtToolingConstant;
export declare const RMT_VNEXT_COMPILER_WORKPACKAGE: RmtToolingConstant;
export declare const RMT_VNEXT_CORE_SCHEMA: RmtToolingConstant;
export declare const RMT_VNEXT_PARSER_WORKPACKAGE: RmtToolingConstant;
export declare const RMT_VNEXT_PRIMITIVE_LOWERING_SCHEMA: RmtToolingConstant;
export declare const RMT_VNEXT_PRIMITIVE_LOWERING_WORKPACKAGE: RmtToolingConstant;
export declare function serializeRmtVNextCore(coreDocument: RmtVNextCoreDocument): string;
export declare function createRmtAppOrchestrationArtifacts(coreDocument: RmtVNextCoreDocument): RmtJsonValue | null;
