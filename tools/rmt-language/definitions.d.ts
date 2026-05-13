export * from './rmt-tooling-public-types';
import type { RmtDefinitionTarget, RmtToolingConstant, RmtToolingFactory, RmtToolingFunction } from './rmt-tooling-public-types';

export declare const createDefinitionTarget: RmtToolingFactory;
export declare const createRmtDefinitionProvider: RmtToolingFactory;
export declare const getRmtDefinition: RmtToolingFunction<RmtDefinitionTarget | null>;
export declare const RMT_DEFINITION_MODULE_PATH: RmtToolingConstant;
export declare const RMT_DEFINITION_PACKAGE_SCRIPT: RmtToolingConstant;
export declare const RMT_DEFINITION_PROVIDER_SCHEMA: RmtToolingConstant;
export declare const RMT_DEFINITION_REPORT_SCHEMA: RmtToolingConstant;
export declare const RMT_DEFINITION_SUITE_PATH: RmtToolingConstant;
export declare const RMT_DEFINITION_TARGET_SCHEMA: RmtToolingConstant;
export declare const RMT_DEFINITION_WORKPACKAGE: RmtToolingConstant;
