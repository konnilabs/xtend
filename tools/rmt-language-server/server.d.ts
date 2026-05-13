export * from '../rmt-language/rmt-tooling-public-types';
import type { RmtLanguageServiceProvider, RmtToolingClassConstructor, RmtToolingConstant, RmtToolingFactory, RmtToolingFunction } from '../rmt-language/rmt-tooling-public-types';

export declare const createCapabilities: RmtToolingFactory;
export declare const createRmtLanguageServer: RmtToolingFactory;
export declare const RMT_LANGUAGE_SERVER_MODULE_PATH: RmtToolingConstant;
export declare const RMT_LANGUAGE_SERVER_PACKAGE_SCRIPT: RmtToolingConstant;
export declare const RMT_LANGUAGE_SERVER_REPORT_SCHEMA: RmtToolingConstant;
export declare const RMT_LANGUAGE_SERVER_SCHEMA: RmtToolingConstant;
export declare const RMT_LANGUAGE_SERVER_SUITE_PATH: RmtToolingConstant;
export declare const RMT_LANGUAGE_SERVER_WORKPACKAGE: RmtToolingConstant;
export declare const RmtLanguageServer: RmtToolingClassConstructor<RmtLanguageServiceProvider>;
export declare const runStdioServer: RmtToolingFunction;
export declare const SERVER_NAME: RmtToolingConstant;
export declare const SERVER_VERSION: RmtToolingConstant;
