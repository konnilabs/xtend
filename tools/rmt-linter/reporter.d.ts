export * from '../rmt-language/rmt-tooling-public-types';
import type { RmtLanguageServiceReport, RmtToolingConstant, RmtToolingFactory, RmtToolingFunction } from '../rmt-language/rmt-tooling-public-types';

export declare const createFileAgentReport: RmtToolingFactory;
export declare const createRmtAgentRepairReport: RmtToolingFactory;
export declare const createRmtAgentRepairReportForFiles: RmtToolingFactory;
export declare const inferImpact: RmtToolingFunction;
export type RmtAgentRepairReport = RmtLanguageServiceReport;
export declare const RMT_AGENT_NOOP_SCHEMA: RmtToolingConstant;
export declare const RMT_AGENT_REPAIR_FILE_SCHEMA: RmtToolingConstant;
export declare const RMT_AGENT_REPAIR_REPORT_MODULE_PATH: RmtToolingConstant;
export declare const RMT_AGENT_REPAIR_REPORT_PACKAGE_SCRIPT: RmtToolingConstant;
export declare const RMT_AGENT_REPAIR_REPORT_SCHEMA: RmtToolingConstant;
export declare const RMT_AGENT_REPAIR_REPORT_SUITE_PATH: RmtToolingConstant;
export declare const RMT_AGENT_REPAIR_REPORT_WORKPACKAGE: RmtToolingConstant;
export declare const RMT_AGENT_REPAIR_STEP_SCHEMA: RmtToolingConstant;
