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
export declare const PERSISTENCE_EVENTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const PERSISTENCE_MODES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const RESTORE_POLICIES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_CONTROLLER_SCHEMA: string;
export declare const SURFACE_MANAGER_PERSISTENCE_BACKLOG: string;
export declare const SURFACE_MANAGER_PERSISTENCE_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_MANAGER_PERSISTENCE_FIXTURE: XtendCatalogConstant;
export declare const SURFACE_MANAGER_PERSISTENCE_LOCAL_GATE: string;
export declare const SURFACE_MANAGER_PERSISTENCE_MODULE: string;
export declare const SURFACE_MANAGER_PERSISTENCE_PACKAGE_SCRIPT: string;
export declare const SURFACE_MANAGER_PERSISTENCE_REPORT_SCHEMA: string;
export declare const SURFACE_MANAGER_PERSISTENCE_SCHEMA: string;
export declare const SURFACE_MANAGER_PERSISTENCE_STATUS: string;
export declare const SURFACE_MANAGER_PERSISTENCE_SUITE: string;
export declare const SURFACE_MANAGER_PERSISTENCE_TARGET: string;
export declare const SURFACE_MANAGER_PERSISTENCE_WORKPACKAGE: string;
export declare const SURFACE_MANAGER_PERSISTENCE_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare const SURFACE_MANAGER_SCHEMA: string;
export declare const SURFACE_PERSISTED_SNAPSHOT_SCHEMA: string;
export declare const SURFACE_RECORD_SCHEMA: string;
export declare const SURFACE_SNAPSHOT_SCHEMA: string;
export declare function createSurfaceManagerPersistencePlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createSurfaceManagerPersistenceReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateSurfaceManagerPersistencePlan(plan?: unknown): XtendCatalogReport;
