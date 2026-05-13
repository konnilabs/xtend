import type {
  XtendCatalogConstant,
  XtendCatalogGate,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const EPIC14_RMT_TOOLING_BUNDLE_REPORT_SCRIPT: XtendCatalogConstant;
export declare const EPIC14_RMT_TOOLING_BUNDLE_SCRIPT: XtendCatalogConstant;
export declare const EPIC14_RMT_TOOLING_CONTRACT: string;
export declare const EPIC14_RMT_TOOLING_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const EPIC14_RMT_TOOLING_GATE_RECORD_SCHEMA: string;
export declare const EPIC14_RMT_TOOLING_LOCAL_GATE: string;
export declare const EPIC14_RMT_TOOLING_MODULE: string;
export declare const EPIC14_RMT_TOOLING_PACKAGE_SCRIPT: string;
export declare const EPIC14_RMT_TOOLING_PR_REPORT_SCRIPT: XtendCatalogConstant;
export declare const EPIC14_RMT_TOOLING_PR_SCRIPT: XtendCatalogConstant;
export declare const EPIC14_RMT_TOOLING_REPORT_SCHEMA: string;
export declare const EPIC14_RMT_TOOLING_SCHEMA: string;
export declare const EPIC14_RMT_TOOLING_STATUS: string;
export declare const EPIC14_RMT_TOOLING_SUITE: string;
export declare const EPIC14_RMT_TOOLING_WORKPACKAGE: string;
export declare const EPIC14_RMT_TOOLING_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare const KERNEL_BOUNDARY: XtendCatalogConstant;
export declare const RMT_TOOLING_EXPORTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const RMT_TOOLING_OPTIONAL_PR_SUITE_IDS: XtendCatalogConstant;
export declare const RMT_TOOLING_SUITE_IDS: XtendCatalogConstant;
export declare function createEpic14RmtToolingGatePlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createEpic14RmtToolingGateReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateEpic14RmtToolingGatePlan(plan?: unknown): XtendCatalogReport;
