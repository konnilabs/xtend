export * from './rmt-tooling-public-types';
import type { RmtParseResult, RmtRange, RmtToolingConstant, RmtToolingFactory, RmtToolingFunction } from './rmt-tooling-public-types';

export declare const classifyRmtFile: RmtToolingConstant;
export declare const createRmtSourceModel: RmtToolingFactory;
export declare const parseJsonPointer: RmtToolingFunction<RmtParseResult>;
export declare const RMT_SOURCE_MODEL_MODULE_PATH: RmtToolingConstant;
export declare const RMT_SOURCE_MODEL_PACKAGE_SCRIPT: RmtToolingConstant;
export declare const RMT_SOURCE_MODEL_REPORT_SCHEMA: RmtToolingConstant;
export declare const RMT_SOURCE_MODEL_SCHEMA: RmtToolingConstant;
export declare const RMT_SOURCE_MODEL_SUITE_PATH: RmtToolingConstant;
export declare const RMT_SOURCE_MODEL_WORKPACKAGE: RmtToolingConstant;
export declare const RMT_SYNTAX_ERROR_CODE: RmtToolingConstant;
export type RmtSourceModelRange = RmtRange;
