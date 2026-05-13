import type {
  XtendCatalogConstant,
  XtendCatalogGate,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const EPIC13_HYDRATION_PERFORMANCE_CLOSURE_CONTRACT: string;
export declare const EPIC13_HYDRATION_PERFORMANCE_CLOSURE_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const EPIC13_HYDRATION_PERFORMANCE_CLOSURE_LOCAL_GATE: string;
export declare const EPIC13_HYDRATION_PERFORMANCE_CLOSURE_MODULE: string;
export declare const EPIC13_HYDRATION_PERFORMANCE_CLOSURE_PACKAGE_SCRIPT: string;
export declare const EPIC13_HYDRATION_PERFORMANCE_CLOSURE_REPORT_SCHEMA: string;
export declare const EPIC13_HYDRATION_PERFORMANCE_CLOSURE_SCHEMA: string;
export declare const EPIC13_HYDRATION_PERFORMANCE_CLOSURE_STATUS: string;
export declare const EPIC13_HYDRATION_PERFORMANCE_CLOSURE_STEERING: XtendCatalogConstant;
export declare const EPIC13_HYDRATION_PERFORMANCE_CLOSURE_SUITE: string;
export declare const EPIC13_HYDRATION_PERFORMANCE_CLOSURE_TARGET: string;
export declare const EPIC13_HYDRATION_PERFORMANCE_CLOSURE_WORKPACKAGE: string;
export declare const EPIC13_HYDRATION_PERFORMANCE_CLOSURE_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare const EPIC13_HYDRATION_PERFORMANCE_DECISION_SCHEMA: string;
export declare const HYDRATION_BASELINE: XtendCatalogConstant;
export declare const HYDRATION_MEASURE: XtendCatalogConstant;
export declare const PUBLISH_BOUNDARY: XtendCatalogConstant;
export declare const REQUIRED_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_SOURCE_GATES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare function createEpic13HydrationPerformanceClosurePlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createEpic13HydrationPerformanceClosureReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function createHydrationDecision(options?: XtendCatalogOptions): XtendCatalogRecord;
export declare function validateEpic13HydrationPerformanceClosurePlan(plan?: unknown): XtendCatalogReport;
