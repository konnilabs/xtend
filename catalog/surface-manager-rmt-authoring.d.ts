import type {
  XtendCatalogConstant,
  XtendCatalogGate,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const COMPATIBILITY_SURFACE_TAGS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const KERNEL_BOUNDARY: XtendCatalogConstant;
export declare const MVP_SURFACE_TYPES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const NEXT_DECISION: XtendCatalogConstant;
export declare const NEXT_WORKPACKAGE: string;
export declare const REQUIRED_ADAPTERS: XtendCatalogConstant;
export declare const REQUIRED_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_COMPONENTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_DOMAINS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_LANES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_SCHEDULES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const RESERVED_ADAPTERS: XtendCatalogConstant;
export declare const SURFACE_COMPONENT_TAGS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_MANAGER_RMT_AUTHORING_CONTRACT: string;
export declare const SURFACE_MANAGER_RMT_AUTHORING_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_MANAGER_RMT_AUTHORING_FIXTURE: XtendCatalogConstant;
export declare const SURFACE_MANAGER_RMT_AUTHORING_LOCAL_GATE: string;
export declare const SURFACE_MANAGER_RMT_AUTHORING_MODULE: string;
export declare const SURFACE_MANAGER_RMT_AUTHORING_PACKAGE_SCRIPT: string;
export declare const SURFACE_MANAGER_RMT_AUTHORING_PLAN: XtendCatalogConstant;
export declare const SURFACE_MANAGER_RMT_AUTHORING_REPORT_SCHEMA: string;
export declare const SURFACE_MANAGER_RMT_AUTHORING_SCHEMA: string;
export declare const SURFACE_MANAGER_RMT_AUTHORING_STATUS: string;
export declare const SURFACE_MANAGER_RMT_AUTHORING_SUITE: string;
export declare const SURFACE_MANAGER_RMT_AUTHORING_TARGET: string;
export declare const SURFACE_MANAGER_RMT_AUTHORING_WORKPACKAGE: string;
export declare const SURFACE_MANAGER_RMT_AUTHORING_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare const SURFACE_MANAGER_SCHEMA: string;
export declare const SURFACE_RECORD_SCHEMA: string;
export declare const SURFACE_TYPES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare function createSurfaceManagerRmtAuthoringPlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createSurfaceManagerRmtAuthoringReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateSurfaceManagerRmtAuthoringPlan(plan?: unknown): XtendCatalogReport;
