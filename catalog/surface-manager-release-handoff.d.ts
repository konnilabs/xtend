import type {
  XtendCatalogConstant,
  XtendCatalogGate,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const AUTHORING_MODES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const COMPONENT_LAB_PANELS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const KERNEL_BOUNDARY: XtendCatalogConstant;
export declare const MIGRATION_STEPS: XtendCatalogConstant;
export declare const NEXT_DECISION: XtendCatalogConstant;
export declare const NEXT_WORKPACKAGE: string;
export declare const RELEASE_GATES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_PREVIOUS_CONTRACTS: XtendCatalogConstant;
export declare const SURFACE_ADAPTER_SCHEMA: string;
export declare const SURFACE_CONTROLLER_SCHEMA: string;
export declare const SURFACE_MANAGER_AUTHORING_GUIDE: XtendCatalogConstant;
export declare const SURFACE_MANAGER_COMPONENT_LAB_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_MANAGER_COMPONENT_LAB_FIXTURE: XtendCatalogConstant;
export declare const SURFACE_MANAGER_COMPONENT_LAB_FIXTURE_SCHEMA: string;
export declare const SURFACE_MANAGER_MIGRATION_GUIDE: XtendCatalogConstant;
export declare const SURFACE_MANAGER_RELEASE_HANDOFF_CONTRACT: string;
export declare const SURFACE_MANAGER_RELEASE_HANDOFF_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_MANAGER_RELEASE_HANDOFF_LOCAL_GATE: string;
export declare const SURFACE_MANAGER_RELEASE_HANDOFF_MODULE: string;
export declare const SURFACE_MANAGER_RELEASE_HANDOFF_PACKAGE_SCRIPT: string;
export declare const SURFACE_MANAGER_RELEASE_HANDOFF_PLAN: XtendCatalogConstant;
export declare const SURFACE_MANAGER_RELEASE_HANDOFF_REPORT_SCHEMA: string;
export declare const SURFACE_MANAGER_RELEASE_HANDOFF_SCHEMA: string;
export declare const SURFACE_MANAGER_RELEASE_HANDOFF_STATUS: string;
export declare const SURFACE_MANAGER_RELEASE_HANDOFF_SUITE: string;
export declare const SURFACE_MANAGER_RELEASE_HANDOFF_TARGET: string;
export declare const SURFACE_MANAGER_RELEASE_HANDOFF_WORKPACKAGE: string;
export declare const SURFACE_MANAGER_RELEASE_HANDOFF_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare const SURFACE_MANAGER_SCHEMA: string;
export declare const SURFACE_NATIVE_RMT_SCHEMA: string;
export declare const SURFACE_RECORD_SCHEMA: string;
export declare const SURFACE_SNAPSHOT_SCHEMA: string;
export declare function createSurfaceManagerReleaseHandoffPlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createSurfaceManagerReleaseHandoffReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateSurfaceManagerReleaseHandoffPlan(plan?: unknown): XtendCatalogReport;
