import type {
  XtendCatalogConstant,
  XtendCatalogGate,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const BROWSER_FIXTURES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const EPIC10_PLATFORM_GATES_DEVELOPER_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const EPIC10_PLATFORM_GATES_DOC: XtendCatalogConstant;
export declare const EPIC10_PLATFORM_GATES_LOCAL_GATE: string;
export declare const EPIC10_PLATFORM_GATES_MODULE: string;
export declare const EPIC10_PLATFORM_GATES_PACKAGE_SCRIPT: string;
export declare const EPIC10_PLATFORM_GATES_REPORT_SCHEMA: string;
export declare const EPIC10_PLATFORM_GATES_SCHEMA: string;
export declare const EPIC10_PLATFORM_GATES_STATUS: string;
export declare const EPIC10_PLATFORM_GATES_SUITE: string;
export declare const EPIC10_PLATFORM_GATES_WORKPACKAGE: string;
export declare const EPIC10_PLATFORM_GATES_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare const EPIC10_PLATFORM_GATE_RECORD_SCHEMA: string;
export declare const FAST_PR_SUITE_IDS: XtendCatalogConstant;
export declare const GATE_DEFINITIONS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const KERNEL_BOUNDARY: XtendCatalogConstant;
export declare const RELEASE_SUITE_IDS: XtendCatalogConstant;
export declare const REQUIRED_GATE_DOMAINS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare function createEpic10PlatformGatePlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createEpic10PlatformGateReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateEpic10PlatformGatePlan(plan?: unknown): XtendCatalogReport;
