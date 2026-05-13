import type {
  XtendCatalogConstant,
  XtendCatalogGate,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const KERNEL_BOUNDARY: XtendCatalogConstant;
export declare const LAYOUT_ENGINES: XtendCatalogConstant;
export declare const LAYOUT_ENGINE_EVENTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const MANAGER_METHODS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_MANAGER_LAYOUT_ENGINE_BACKLOG: string;
export declare const SURFACE_MANAGER_LAYOUT_ENGINE_DIAGNOSTIC_SCHEMA: string;
export declare const SURFACE_MANAGER_LAYOUT_ENGINE_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_MANAGER_LAYOUT_ENGINE_FIXTURE: XtendCatalogConstant;
export declare const SURFACE_MANAGER_LAYOUT_ENGINE_LOCAL_GATE: string;
export declare const SURFACE_MANAGER_LAYOUT_ENGINE_MODULE: string;
export declare const SURFACE_MANAGER_LAYOUT_ENGINE_PACKAGE_SCRIPT: string;
export declare const SURFACE_MANAGER_LAYOUT_ENGINE_REPORT_SCHEMA: string;
export declare const SURFACE_MANAGER_LAYOUT_ENGINE_SCHEMA: string;
export declare const SURFACE_MANAGER_LAYOUT_ENGINE_STATUS: string;
export declare const SURFACE_MANAGER_LAYOUT_ENGINE_SUITE: string;
export declare const SURFACE_MANAGER_LAYOUT_ENGINE_TARGET: string;
export declare const SURFACE_MANAGER_LAYOUT_ENGINE_WORKPACKAGE: string;
export declare const SURFACE_MANAGER_LAYOUT_ENGINE_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare function createSurfaceManagerLayoutEnginesPlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createSurfaceManagerLayoutEnginesReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateSurfaceManagerLayoutEnginesPlan(plan?: unknown): XtendCatalogReport;
