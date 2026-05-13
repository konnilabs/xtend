import type {
  XtendCatalogConstant,
  XtendCatalogGate,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const BRIDGE_EVENTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const COMPONENT_TAGS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const KERNEL_BOUNDARY: XtendCatalogConstant;
export declare const LEGACY_EVENTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const LEGACY_STATE_KEYS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const NEXT_DECISION: XtendCatalogConstant;
export declare const NEXT_WORKPACKAGE: string;
export declare const OVERLAY_SURFACE_TYPES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const RUNTIME_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_CONTROLLER_SCHEMA: string;
export declare const SURFACE_MANAGER_OVERLAY_BRIDGE_CONTRACT: string;
export declare const SURFACE_MANAGER_OVERLAY_BRIDGE_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_MANAGER_OVERLAY_BRIDGE_FIXTURE: XtendCatalogConstant;
export declare const SURFACE_MANAGER_OVERLAY_BRIDGE_LOCAL_GATE: string;
export declare const SURFACE_MANAGER_OVERLAY_BRIDGE_MODULE: string;
export declare const SURFACE_MANAGER_OVERLAY_BRIDGE_PACKAGE_SCRIPT: string;
export declare const SURFACE_MANAGER_OVERLAY_BRIDGE_PLAN: XtendCatalogConstant;
export declare const SURFACE_MANAGER_OVERLAY_BRIDGE_REPORT_SCHEMA: string;
export declare const SURFACE_MANAGER_OVERLAY_BRIDGE_SCHEMA: string;
export declare const SURFACE_MANAGER_OVERLAY_BRIDGE_STATUS: string;
export declare const SURFACE_MANAGER_OVERLAY_BRIDGE_SUITE: string;
export declare const SURFACE_MANAGER_OVERLAY_BRIDGE_TARGET: string;
export declare const SURFACE_MANAGER_OVERLAY_BRIDGE_WORKPACKAGE: string;
export declare const SURFACE_MANAGER_OVERLAY_BRIDGE_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare const SURFACE_MANAGER_SCHEMA: string;
export declare const SURFACE_RECORD_SCHEMA: string;
export declare const SURFACE_SNAPSHOT_SCHEMA: string;
export declare function createSurfaceManagerOverlayBridgePlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createSurfaceManagerOverlayBridgeReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateSurfaceManagerOverlayBridgePlan(plan?: unknown): XtendCatalogReport;
