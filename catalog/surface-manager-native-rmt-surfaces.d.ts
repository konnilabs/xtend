import type {
  XtendCatalogConstant,
  XtendCatalogGate,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const KERNEL_BOUNDARY: XtendCatalogConstant;
export declare const NEXT_DECISION: XtendCatalogConstant;
export declare const NEXT_WORKPACKAGE: string;
export declare const REQUIRED_ADAPTERS: XtendCatalogConstant;
export declare const REQUIRED_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_DOMAINS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_ADAPTER_ID: XtendCatalogConstant;
export declare const SURFACE_ADAPTER_KIND: XtendCatalogConstant;
export declare const SURFACE_ADAPTER_OPERATIONS: XtendCatalogConstant;
export declare const SURFACE_ADAPTER_SCHEMA: string;
export declare const SURFACE_CONTROLLER_SCHEMA: string;
export declare const SURFACE_DOMAIN: XtendCatalogConstant;
export declare const SURFACE_FIELDS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_MANAGER_NATIVE_RMT_CONTRACT: string;
export declare const SURFACE_MANAGER_NATIVE_RMT_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_MANAGER_NATIVE_RMT_FIXTURE: XtendCatalogConstant;
export declare const SURFACE_MANAGER_NATIVE_RMT_LOCAL_GATE: string;
export declare const SURFACE_MANAGER_NATIVE_RMT_MODULE: string;
export declare const SURFACE_MANAGER_NATIVE_RMT_PACKAGE_SCRIPT: string;
export declare const SURFACE_MANAGER_NATIVE_RMT_PLAN: XtendCatalogConstant;
export declare const SURFACE_MANAGER_NATIVE_RMT_REPORT_SCHEMA: string;
export declare const SURFACE_MANAGER_NATIVE_RMT_SCHEMA: string;
export declare const SURFACE_MANAGER_NATIVE_RMT_STATUS: string;
export declare const SURFACE_MANAGER_NATIVE_RMT_SUITE: string;
export declare const SURFACE_MANAGER_NATIVE_RMT_TARGET: string;
export declare const SURFACE_MANAGER_NATIVE_RMT_WORKPACKAGE: string;
export declare const SURFACE_MANAGER_NATIVE_RMT_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare const SURFACE_MANAGER_SCHEMA: string;
export declare const SURFACE_QUALITY_GATES_SCHEMA: string;
export declare const SURFACE_RECORD_SCHEMA: string;
export declare const SURFACE_REFERENCE_CHECKS: XtendCatalogConstant;
export declare const SURFACE_SNAPSHOT_SCHEMA: string;
export declare const SURFACE_TYPES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const TOOLING_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare function createSurfaceManagerNativeRmtSurfacesPlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createSurfaceManagerNativeRmtSurfacesReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateSurfaceManagerNativeRmtSurfacesPlan(plan?: unknown): XtendCatalogReport;
