import type {
  XtendCatalogConstant,
  XtendCatalogGate,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const COMPATIBILITY_FIXTURES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const KERNEL_BOUNDARY: XtendCatalogConstant;
export declare const OPEN_SCOPES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const PRODUCTIVE_RUNTIME_CLAIMS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const RELEASE_GATES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_MANAGER_RUNTIME_COMPATIBILITY_NOTES_SCHEMA: string;
export declare const SURFACE_MANAGER_RUNTIME_MIGRATION_NOTES_SCHEMA: string;
export declare const SURFACE_MANAGER_RUNTIME_RELEASE_GATE_MATRIX_SCHEMA: string;
export declare const SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_BACKLOG: string;
export declare const SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_CONTRACT: string;
export declare const SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_LOCAL_GATE: string;
export declare const SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_MODULE: string;
export declare const SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_PACKAGE_SCRIPT: string;
export declare const SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_REPORT_SCHEMA: string;
export declare const SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_SCHEMA: string;
export declare const SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_STATUS: string;
export declare const SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_SUITE: string;
export declare const SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_TARGET: string;
export declare const SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_WORKPACKAGE: string;
export declare const SURFACE_MANAGER_RUNTIME_RELEASE_HANDOFF_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare const UPDATED_GUIDES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare function createSurfaceManagerRuntimeReleaseHandoffPlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createSurfaceManagerRuntimeReleaseHandoffReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateSurfaceManagerRuntimeReleaseHandoffPlan(plan?: unknown): XtendCatalogReport;
