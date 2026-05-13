export * from './rmt-tooling-public-types';
import type { RmtHover, RmtToolingConstant, RmtToolingFactory, RmtToolingFunction } from './rmt-tooling-public-types';

export declare const createRmtHoverProvider: RmtToolingFactory;
export declare const getRmtHover: RmtToolingFunction<RmtHover | null>;
export declare const RMT_HOVER_MODULE_PATH: RmtToolingConstant;
export declare const RMT_HOVER_PACKAGE_SCRIPT: RmtToolingConstant;
export declare const RMT_HOVER_PROVIDER_SCHEMA: RmtToolingConstant;
export declare const RMT_HOVER_REPORT_SCHEMA: RmtToolingConstant;
export declare const RMT_HOVER_SCHEMA: RmtToolingConstant;
export declare const RMT_HOVER_SUITE_PATH: RmtToolingConstant;
export declare const RMT_HOVER_WORKPACKAGE: RmtToolingConstant;
