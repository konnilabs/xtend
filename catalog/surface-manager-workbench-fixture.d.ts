import type {
  XtendCatalogConstant,
  XtendCatalogGate,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const COMPONENT_TAGS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const KERNEL_BOUNDARY: XtendCatalogConstant;
export declare const NEXT_DECISION: XtendCatalogConstant;
export declare const NEXT_WORKPACKAGE: string;
export declare const REQUIRED_ADAPTERS: XtendCatalogConstant;
export declare const REQUIRED_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_COMPONENTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_ROUTE_IDS: XtendCatalogConstant;
export declare const REQUIRED_SCHEDULES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_SURFACE_TYPES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_TEMPLATES: XtendCatalogConstant;
export declare const RUNTIME_COMPONENT_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_AUTHORING_SCHEMA: string;
export declare const SURFACE_COMPONENTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_CONTROLLER_SCHEMA: string;
export declare const SURFACE_MANAGER_SCHEMA: string;
export declare const SURFACE_MANAGER_WORKBENCH_BROWSER_SMOKE: XtendCatalogConstant;
export declare const SURFACE_MANAGER_WORKBENCH_CONTRACT: string;
export declare const SURFACE_MANAGER_WORKBENCH_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_MANAGER_WORKBENCH_FIXTURE: XtendCatalogConstant;
export declare const SURFACE_MANAGER_WORKBENCH_HOST: XtendCatalogConstant;
export declare const SURFACE_MANAGER_WORKBENCH_LOCAL_GATE: string;
export declare const SURFACE_MANAGER_WORKBENCH_MODULE: string;
export declare const SURFACE_MANAGER_WORKBENCH_PACKAGE_SCRIPT: string;
export declare const SURFACE_MANAGER_WORKBENCH_PLAN: XtendCatalogConstant;
export declare const SURFACE_MANAGER_WORKBENCH_REPORT_SCHEMA: string;
export declare const SURFACE_MANAGER_WORKBENCH_RUNTIME: XtendCatalogConstant;
export declare const SURFACE_MANAGER_WORKBENCH_SCHEMA: string;
export declare const SURFACE_MANAGER_WORKBENCH_STATUS: string;
export declare const SURFACE_MANAGER_WORKBENCH_SUITE: string;
export declare const SURFACE_MANAGER_WORKBENCH_TARGET: string;
export declare const SURFACE_MANAGER_WORKBENCH_WORKPACKAGE: string;
export declare const SURFACE_MANAGER_WORKBENCH_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare const SURFACE_RECORD_SCHEMA: string;
export declare const SURFACE_SNAPSHOT_SCHEMA: string;
export declare const WORKBENCH_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare function createSurfaceManagerWorkbenchFixturePlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createSurfaceManagerWorkbenchFixtureReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateSurfaceManagerWorkbenchFixturePlan(plan?: unknown): XtendCatalogReport;
