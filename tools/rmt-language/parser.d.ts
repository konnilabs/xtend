export * from './rmt-tooling-public-types';
import type { RmtParseResult, RmtToolingConstant, RmtToolingFactory, RmtToolingFunction } from './rmt-tooling-public-types';

export declare const createFilePolicyDiagnostics: RmtToolingFactory;
export declare const createRmtParser: RmtToolingFactory;
export declare const parseRmtSource: RmtToolingFunction<RmtParseResult>;
export declare const RMT_FILE_FALLBACK_CODE: RmtToolingConstant;
export declare const RMT_PARSER_MODULE_PATH: RmtToolingConstant;
export declare const RMT_PARSER_PACKAGE_SCRIPT: RmtToolingConstant;
export declare const RMT_PARSER_REPORT_SCHEMA: RmtToolingConstant;
export declare const RMT_PARSER_SCHEMA: RmtToolingConstant;
export declare const RMT_PARSER_SUITE_PATH: RmtToolingConstant;
export declare const RMT_PARSER_WORKPACKAGE: RmtToolingConstant;
export declare const RMT_SOURCE_MODEL_WORKPACKAGE: RmtToolingConstant;
