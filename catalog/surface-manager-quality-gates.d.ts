import type {
  XtendCatalogConstant,
  XtendCatalogGate,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const A11Y_ASSERTIONS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const COMPONENT_TAGS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const DOMAIN_GATES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const KERNEL_BOUNDARY: XtendCatalogConstant;
export declare const NEXT_DECISION: XtendCatalogConstant;
export declare const NEXT_WORKPACKAGE: string;
export declare const PERFORMANCE_BUDGETS: XtendCatalogConstant;
export declare const QUALITY_DOMAINS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const RUNTIME_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_CONTROLLER_SCHEMA: string;
export declare const SURFACE_MANAGER_QUALITY_BROWSER_FIXTURE: XtendCatalogConstant;
export declare const SURFACE_MANAGER_QUALITY_BROWSER_SMOKE_SCHEMA: string;
export declare const SURFACE_MANAGER_QUALITY_GATES_CONTRACT: string;
export declare const SURFACE_MANAGER_QUALITY_GATES_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_MANAGER_QUALITY_GATES_MODULE: string;
export declare const SURFACE_MANAGER_QUALITY_GATES_PLAN: XtendCatalogConstant;
export declare const SURFACE_MANAGER_QUALITY_GATES_REPORT_SCHEMA: string;
export declare const SURFACE_MANAGER_QUALITY_GATES_SCHEMA: string;
export declare const SURFACE_MANAGER_QUALITY_GATES_STATUS: string;
export declare const SURFACE_MANAGER_QUALITY_GATES_SUITE: string;
export declare const SURFACE_MANAGER_QUALITY_GATES_TARGET: string;
export declare const SURFACE_MANAGER_QUALITY_GATES_WORKPACKAGE: string;
export declare const SURFACE_MANAGER_QUALITY_GATES_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare const SURFACE_MANAGER_QUALITY_LOCAL_GATE: string;
export declare const SURFACE_MANAGER_QUALITY_PACKAGE_SCRIPT: string;
export declare const SURFACE_MANAGER_QUALITY_VISUAL_BASELINE: XtendCatalogConstant;
export declare const SURFACE_MANAGER_QUALITY_VISUAL_BASELINE_SCHEMA: string;
export declare const SURFACE_MANAGER_SCHEMA: string;
export declare const SURFACE_OVERLAY_BRIDGE_SCHEMA: string;
export declare const SURFACE_RECORD_SCHEMA: string;
export declare const SURFACE_SNAPSHOT_SCHEMA: string;
export declare const SURFACE_TYPES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const VISUAL_SNAPSHOT_IDS: XtendCatalogConstant;
export declare function createSurfaceManagerQualityGatesPlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createSurfaceManagerQualityGatesReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateSurfaceManagerQualityGatesPlan(plan?: unknown): XtendCatalogReport;
