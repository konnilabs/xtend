import type {
  XtendCatalogConstant,
  XtendCatalogGate,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const APP_SHELL_PROBES: XtendCatalogConstant;
export declare const DOCS_APP_REFERENCE: XtendCatalogConstant;
export declare const DOCS_RMT_REFERENCE: XtendCatalogConstant;
export declare const KERNEL_BOUNDARY: XtendCatalogConstant;
export declare const PERFORMANCE_BUDGETS: XtendCatalogConstant;
export declare const REQUIRED_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_MANAGER_BROWSER_LAB_BACKLOG: string;
export declare const SURFACE_MANAGER_BROWSER_LAB_CLS_REPORT_SCHEMA: string;
export declare const SURFACE_MANAGER_BROWSER_LAB_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_MANAGER_BROWSER_LAB_FIXTURE: XtendCatalogConstant;
export declare const SURFACE_MANAGER_BROWSER_LAB_LOCAL_GATE: string;
export declare const SURFACE_MANAGER_BROWSER_LAB_MODULE: string;
export declare const SURFACE_MANAGER_BROWSER_LAB_PACKAGE_SCRIPT: string;
export declare const SURFACE_MANAGER_BROWSER_LAB_PERFORMANCE_REPORT_SCHEMA: string;
export declare const SURFACE_MANAGER_BROWSER_LAB_REPORT_SCHEMA: string;
export declare const SURFACE_MANAGER_BROWSER_LAB_SCHEMA: string;
export declare const SURFACE_MANAGER_BROWSER_LAB_STATUS: string;
export declare const SURFACE_MANAGER_BROWSER_LAB_SUITE: string;
export declare const SURFACE_MANAGER_BROWSER_LAB_TARGET: string;
export declare const SURFACE_MANAGER_BROWSER_LAB_VISUAL_BASELINE: XtendCatalogConstant;
export declare const SURFACE_MANAGER_BROWSER_LAB_VISUAL_BASELINE_SCHEMA: string;
export declare const SURFACE_MANAGER_BROWSER_LAB_WORKPACKAGE: string;
export declare const SURFACE_MANAGER_BROWSER_LAB_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare const VISUAL_SNAPSHOT_IDS: XtendCatalogConstant;
export declare const VISUAL_STATES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const WORKBENCH_REFERENCE: XtendCatalogConstant;
export declare function createSurfaceManagerBrowserLabPlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createSurfaceManagerBrowserLabReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateSurfaceManagerBrowserLabPlan(plan?: unknown): XtendCatalogReport;
