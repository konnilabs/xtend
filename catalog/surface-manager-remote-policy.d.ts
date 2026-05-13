import type {
  XtendCatalogConstant,
  XtendCatalogGate,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const KERNEL_BOUNDARY: XtendCatalogConstant;
export declare const REMOTE_POLICY_DECISIONS: XtendCatalogConstant;
export declare const REMOTE_POLICY_DIAGNOSTICS: XtendCatalogConstant;
export declare const REMOTE_POLICY_EVENTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REMOTE_POLICY_METHODS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_MANAGER_REMOTE_POLICY_BACKLOG: string;
export declare const SURFACE_MANAGER_REMOTE_POLICY_DIAGNOSTIC_SCHEMA: string;
export declare const SURFACE_MANAGER_REMOTE_POLICY_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_MANAGER_REMOTE_POLICY_FIXTURE: XtendCatalogConstant;
export declare const SURFACE_MANAGER_REMOTE_POLICY_LOCAL_GATE: string;
export declare const SURFACE_MANAGER_REMOTE_POLICY_MODULE: string;
export declare const SURFACE_MANAGER_REMOTE_POLICY_PACKAGE_SCRIPT: string;
export declare const SURFACE_MANAGER_REMOTE_POLICY_REPORT_SCHEMA: string;
export declare const SURFACE_MANAGER_REMOTE_POLICY_SCHEMA: string;
export declare const SURFACE_MANAGER_REMOTE_POLICY_STATUS: string;
export declare const SURFACE_MANAGER_REMOTE_POLICY_SUITE: string;
export declare const SURFACE_MANAGER_REMOTE_POLICY_TARGET: string;
export declare const SURFACE_MANAGER_REMOTE_POLICY_WORKPACKAGE: string;
export declare const SURFACE_MANAGER_REMOTE_POLICY_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare const SURFACE_REMOTE_TRUST_BOUNDARY: XtendCatalogConstant;
export declare function createSurfaceManagerRemotePolicyPlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createSurfaceManagerRemotePolicyReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateSurfaceManagerRemotePolicyPlan(plan?: unknown): XtendCatalogReport;
