import type {
  XtendCatalogConstant,
  XtendCatalogGate,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const KERNEL_BOUNDARY: XtendCatalogConstant;
export declare const MANAGER_METHODS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const ROUTE_LIFECYCLE_EVENTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const ROUTE_LIFECYCLE_POLICIES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_MANAGER_ROUTE_LIFECYCLE_BACKLOG: string;
export declare const SURFACE_MANAGER_ROUTE_LIFECYCLE_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_MANAGER_ROUTE_LIFECYCLE_FIXTURE: XtendCatalogConstant;
export declare const SURFACE_MANAGER_ROUTE_LIFECYCLE_LOCAL_GATE: string;
export declare const SURFACE_MANAGER_ROUTE_LIFECYCLE_MODULE: string;
export declare const SURFACE_MANAGER_ROUTE_LIFECYCLE_PACKAGE_SCRIPT: string;
export declare const SURFACE_MANAGER_ROUTE_LIFECYCLE_REPORT_SCHEMA: string;
export declare const SURFACE_MANAGER_ROUTE_LIFECYCLE_SCHEMA: string;
export declare const SURFACE_MANAGER_ROUTE_LIFECYCLE_STATUS: string;
export declare const SURFACE_MANAGER_ROUTE_LIFECYCLE_SUITE: string;
export declare const SURFACE_MANAGER_ROUTE_LIFECYCLE_TARGET: string;
export declare const SURFACE_MANAGER_ROUTE_LIFECYCLE_WORKPACKAGE: string;
export declare const SURFACE_MANAGER_ROUTE_LIFECYCLE_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare const XROUTER_ROUTE_CONTRACT: string;
export declare function createSurfaceManagerRouteLifecyclePlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createSurfaceManagerRouteLifecycleReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateSurfaceManagerRouteLifecyclePlan(plan?: unknown): XtendCatalogReport;
