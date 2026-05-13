import type {
  XtendCatalogConstant,
  XtendCatalogGate,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const KERNEL_BOUNDARY: XtendCatalogConstant;
export declare const MATERIALIZED_COMPONENT_TAGS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const RUNTIME_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_ADAPTER_ID: XtendCatalogConstant;
export declare const SURFACE_ADAPTER_SCHEMA: string;
export declare const SURFACE_CONTROLLER_SCHEMA: string;
export declare const SURFACE_MANAGER_MATERIALIZATION_BACKLOG: string;
export declare const SURFACE_MANAGER_MATERIALIZATION_FIXTURE: XtendCatalogConstant;
export declare const SURFACE_MANAGER_MATERIALIZATION_LOCAL_GATE: string;
export declare const SURFACE_MANAGER_MATERIALIZATION_MODULE: string;
export declare const SURFACE_MANAGER_MATERIALIZATION_PACKAGE_SCRIPT: string;
export declare const SURFACE_MANAGER_MATERIALIZATION_REPORT_SCHEMA: string;
export declare const SURFACE_MANAGER_MATERIALIZATION_SCHEMA: string;
export declare const SURFACE_MANAGER_MATERIALIZATION_STATUS: string;
export declare const SURFACE_MANAGER_MATERIALIZATION_SUITE: string;
export declare const SURFACE_MANAGER_MATERIALIZATION_TARGET: string;
export declare const SURFACE_MANAGER_MATERIALIZATION_WORKPACKAGE: string;
export declare const SURFACE_MANAGER_MATERIALIZATION_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare const SURFACE_MANAGER_SCHEMA: string;
export declare const SURFACE_MATERIALIZATION_DIAGNOSTICS: XtendCatalogConstant;
export declare const SURFACE_MATERIALIZATION_OPERATIONS: XtendCatalogConstant;
export declare const SURFACE_MATERIALIZATION_SCHEMA: string;
export declare const SURFACE_RECORD_SCHEMA: string;
export declare function createSurfaceManagerMaterializationPlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createSurfaceManagerMaterializationReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateSurfaceManagerMaterializationPlan(plan?: unknown): XtendCatalogReport;
