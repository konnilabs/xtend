export * from '../rmt-language/rmt-tooling-public-types';
import type { RmtLanguageServiceReport, RmtParseResult, RmtToolingConstant, RmtToolingFactory, RmtToolingFunction } from '../rmt-language/rmt-tooling-public-types';

export declare const buildHelpText: RmtToolingFactory;
export declare const collectRmtFiles: RmtToolingFunction;
export declare const lintFiles: RmtToolingFunction<RmtLanguageServiceReport>;
export declare const parseArgs: RmtToolingFunction<RmtParseResult>;
export declare const RMT_LINTER_CLI_MODULE_PATH: RmtToolingConstant;
export declare const RMT_LINTER_CLI_PACKAGE_SCRIPT: RmtToolingConstant;
export declare const RMT_LINTER_CLI_REPORT_SCHEMA: RmtToolingConstant;
export declare const RMT_LINTER_CLI_SCHEMA: RmtToolingConstant;
export declare const RMT_LINTER_CLI_SUITE_PATH: RmtToolingConstant;
export declare const RMT_LINTER_CLI_WORKPACKAGE: RmtToolingConstant;
export declare const runRmtLinterCli: RmtToolingFunction;
