export * from './rmt-tooling-public-types';
import type { RmtCompileResult, RmtToolingConstant, RmtToolingFactory, RmtToolingFunction } from './rmt-tooling-public-types';

export declare const compileRmtVNextRemoteSource: RmtToolingFunction<RmtCompileResult>;
export declare const createRmtVNextRemoteCompiler: RmtToolingFactory;
export declare const RMT_VNEXT_REMOTE_COMPILER_CONTRACT_PATH: RmtToolingConstant;
export declare const RMT_VNEXT_REMOTE_COMPILER_MODULE_PATH: RmtToolingConstant;
export declare const RMT_VNEXT_REMOTE_COMPILER_PACKAGE_SCRIPT: RmtToolingConstant;
export declare const RMT_VNEXT_REMOTE_COMPILER_REPORT_SCHEMA: RmtToolingConstant;
export declare const RMT_VNEXT_REMOTE_COMPILER_SCHEMA: RmtToolingConstant;
export declare const RMT_VNEXT_REMOTE_COMPILER_SUITE_PATH: RmtToolingConstant;
export declare const RMT_VNEXT_REMOTE_COMPILER_WORKPACKAGE: RmtToolingConstant;
export declare const RMT_VNEXT_REMOTE_COMPILER_WP_PATH: RmtToolingConstant;
export declare const serializeRemoteCompilerCore: RmtToolingFunction;
