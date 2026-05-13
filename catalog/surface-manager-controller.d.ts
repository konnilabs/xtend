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
export declare const REQUIRED_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_DIAGNOSTIC_CODES: XtendCatalogConstant;
export declare const REQUIRED_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_LANES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_METHODS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_STATE_KEYS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_SURFACE_TYPES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SOURCE_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_CONTROLLER_CONTRACT: string;
export declare const SURFACE_CONTROLLER_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_CONTROLLER_LOCAL_GATE: string;
export declare const SURFACE_CONTROLLER_MODULE: string;
export declare const SURFACE_CONTROLLER_PACKAGE_SCRIPT: string;
export declare const SURFACE_CONTROLLER_PLAN: XtendCatalogConstant;
export declare const SURFACE_CONTROLLER_REPORT_SCHEMA: string;
export declare const SURFACE_CONTROLLER_RUNTIME: XtendCatalogConstant;
export declare const SURFACE_CONTROLLER_SCHEMA: string;
export declare const SURFACE_DIAGNOSTIC_SCHEMA: string;
export declare const SURFACE_CONTROLLER_STATUS: string;
export declare const SURFACE_CONTROLLER_SUITE: string;
export declare const SURFACE_CONTROLLER_TARGET: string;
export declare const SURFACE_CONTROLLER_TYPES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_CONTROLLER_WORKPACKAGE: string;
export declare const SURFACE_CONTROLLER_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare const SURFACE_OPERATION_RESULT_SCHEMA: string;
export declare const SURFACE_RECORD_SCHEMA: string;
export declare const SURFACE_SNAPSHOT_SCHEMA: string;
export declare function createSurfaceControllerPlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createSurfaceControllerReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateSurfaceControllerPlan(plan?: unknown): XtendCatalogReport;
