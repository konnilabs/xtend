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
export declare const SKELETON_LOADER_CONTRACT: string;
export declare const STYLE_REGISTRY_CONTRACT: string;
export declare const SURFACE_LOADING_EVENTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_LOADING_POLICIES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_LOADING_POLICY_SCHEMA: string;
export declare const SURFACE_LOADING_REPORT_SCHEMA: string;
export declare const SURFACE_MANAGER_LAZY_LOADING_BACKLOG: string;
export declare const SURFACE_MANAGER_LAZY_LOADING_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_MANAGER_LAZY_LOADING_FIXTURE: XtendCatalogConstant;
export declare const SURFACE_MANAGER_LAZY_LOADING_LOCAL_GATE: string;
export declare const SURFACE_MANAGER_LAZY_LOADING_MODULE: string;
export declare const SURFACE_MANAGER_LAZY_LOADING_PACKAGE_SCRIPT: string;
export declare const SURFACE_MANAGER_LAZY_LOADING_REPORT_SCHEMA: string;
export declare const SURFACE_MANAGER_LAZY_LOADING_SCHEMA: string;
export declare const SURFACE_MANAGER_LAZY_LOADING_STATUS: string;
export declare const SURFACE_MANAGER_LAZY_LOADING_SUITE: string;
export declare const SURFACE_MANAGER_LAZY_LOADING_TARGET: string;
export declare const SURFACE_MANAGER_LAZY_LOADING_WORKPACKAGE: string;
export declare const SURFACE_MANAGER_LAZY_LOADING_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare function createSurfaceManagerLazyLoadingPlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createSurfaceManagerLazyLoadingReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateSurfaceManagerLazyLoadingPlan(plan?: unknown): XtendCatalogReport;
