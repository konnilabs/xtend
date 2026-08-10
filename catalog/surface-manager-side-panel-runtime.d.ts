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
export declare const REQUIRED_MODES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_PANEL_METHODS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_PLACEMENTS: XtendCatalogConstant;
export declare const RUNTIME_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SOURCE_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_CONTROLLER_SCHEMA: string;
export declare const SURFACE_MANAGER_SCHEMA: string;
export declare const SURFACE_MANAGER_SIDE_PANEL_CONTRACT: string;
export declare const SURFACE_MANAGER_SIDE_PANEL_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_MANAGER_SIDE_PANEL_DOCS_DE: string;
export declare const SURFACE_MANAGER_SIDE_PANEL_LOCAL_GATE: string;
export declare const SURFACE_MANAGER_SIDE_PANEL_MODULE: string;
export declare const SURFACE_MANAGER_SIDE_PANEL_PACKAGE_SCRIPT: string;
export declare const SURFACE_MANAGER_SIDE_PANEL_PLAN: XtendCatalogConstant;
export declare const SURFACE_MANAGER_SIDE_PANEL_REPORT_SCHEMA: string;
export declare const SURFACE_MANAGER_SIDE_PANEL_SCHEMA: string;
export declare const SURFACE_MANAGER_SIDE_PANEL_STATUS: string;
export declare const SURFACE_MANAGER_SIDE_PANEL_SUITE: string;
export declare const SURFACE_MANAGER_SIDE_PANEL_TARGET: string;
export declare const SURFACE_MANAGER_SIDE_PANEL_WORKPACKAGE: string;
export declare const SURFACE_MANAGER_SIDE_PANEL_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare const SURFACE_RECORD_SCHEMA: string;
export declare const SURFACE_SNAPSHOT_SCHEMA: string;
export declare function createSurfaceManagerSidePanelPlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createSurfaceManagerSidePanelReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateSurfaceManagerSidePanelPlan(plan?: unknown): XtendCatalogReport;
