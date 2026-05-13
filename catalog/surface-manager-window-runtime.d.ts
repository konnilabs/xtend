import type {
  XtendCatalogConstant,
  XtendCatalogGate,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const COMPONENT_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const COMPONENT_FIXTURES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const COMPONENT_SUITES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const COMPONENT_TAGS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const KERNEL_BOUNDARY: XtendCatalogConstant;
export declare const NEXT_DECISION: XtendCatalogConstant;
export declare const NEXT_WORKPACKAGE: string;
export declare const REQUIRED_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_EVENTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_MANAGER_METHODS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_SLOTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_WINDOW_METHODS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const RUNTIME_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SOURCE_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_CONTROLLER_SCHEMA: string;
export declare const SURFACE_MANAGER_SCHEMA: string;
export declare const SURFACE_MANAGER_WINDOW_RUNTIME_CONTRACT: string;
export declare const SURFACE_MANAGER_WINDOW_RUNTIME_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_MANAGER_WINDOW_RUNTIME_LOCAL_GATE: string;
export declare const SURFACE_MANAGER_WINDOW_RUNTIME_MODULE: string;
export declare const SURFACE_MANAGER_WINDOW_RUNTIME_PACKAGE_SCRIPT: string;
export declare const SURFACE_MANAGER_WINDOW_RUNTIME_PLAN: XtendCatalogConstant;
export declare const SURFACE_MANAGER_WINDOW_RUNTIME_REPORT_SCHEMA: string;
export declare const SURFACE_MANAGER_WINDOW_RUNTIME_SCHEMA: string;
export declare const SURFACE_MANAGER_WINDOW_RUNTIME_STATUS: string;
export declare const SURFACE_MANAGER_WINDOW_RUNTIME_SUITE: string;
export declare const SURFACE_MANAGER_WINDOW_RUNTIME_TARGET: string;
export declare const SURFACE_MANAGER_WINDOW_RUNTIME_WORKPACKAGE: string;
export declare const SURFACE_MANAGER_WINDOW_RUNTIME_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare const SURFACE_RECORD_SCHEMA: string;
export declare const SURFACE_SNAPSHOT_SCHEMA: string;
export declare function createSurfaceManagerWindowRuntimePlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createSurfaceManagerWindowRuntimeReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateSurfaceManagerWindowRuntimePlan(plan?: unknown): XtendCatalogReport;
