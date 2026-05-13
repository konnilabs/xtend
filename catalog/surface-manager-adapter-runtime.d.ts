import type {
  XtendCatalogConstant,
  XtendCatalogGate,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const KERNEL_BOUNDARY: XtendCatalogConstant;
export declare const REQUIRED_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const RUNTIME_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_ADAPTER_DIAGNOSTICS: XtendCatalogConstant;
export declare const SURFACE_ADAPTER_ID: XtendCatalogConstant;
export declare const SURFACE_ADAPTER_KIND: XtendCatalogConstant;
export declare const SURFACE_ADAPTER_OPERATIONS: XtendCatalogConstant;
export declare const SURFACE_ADAPTER_SCHEMA: string;
export declare const SURFACE_CONTROLLER_SCHEMA: string;
export declare const SURFACE_MANAGER_ADAPTER_RUNTIME_BACKLOG: string;
export declare const SURFACE_MANAGER_ADAPTER_RUNTIME_FIXTURE: XtendCatalogConstant;
export declare const SURFACE_MANAGER_ADAPTER_RUNTIME_LOCAL_GATE: string;
export declare const SURFACE_MANAGER_ADAPTER_RUNTIME_MODULE: string;
export declare const SURFACE_MANAGER_ADAPTER_RUNTIME_PACKAGE_SCRIPT: string;
export declare const SURFACE_MANAGER_ADAPTER_RUNTIME_REPORT_SCHEMA: string;
export declare const SURFACE_MANAGER_ADAPTER_RUNTIME_SCHEMA: string;
export declare const SURFACE_MANAGER_ADAPTER_RUNTIME_STATUS: string;
export declare const SURFACE_MANAGER_ADAPTER_RUNTIME_SUITE: string;
export declare const SURFACE_MANAGER_ADAPTER_RUNTIME_TARGET: string;
export declare const SURFACE_MANAGER_ADAPTER_RUNTIME_WORKPACKAGE: string;
export declare const SURFACE_MANAGER_ADAPTER_RUNTIME_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare const SURFACE_MANAGER_SCHEMA: string;
export declare const SURFACE_RECORD_SCHEMA: string;
export declare const SURFACE_SNAPSHOT_SCHEMA: string;
export declare function createSurfaceManagerAdapterRuntimePlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createSurfaceManagerAdapterRuntimeReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateSurfaceManagerAdapterRuntimePlan(plan?: unknown): XtendCatalogReport;
