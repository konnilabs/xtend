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
export declare const MODAL_POLICIES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const STACK_POLICY_EVENTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_MANAGER_STACK_POLICY_BACKLOG: string;
export declare const SURFACE_MANAGER_STACK_POLICY_DIAGNOSTIC_SCHEMA: string;
export declare const SURFACE_MANAGER_STACK_POLICY_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_MANAGER_STACK_POLICY_FIXTURE: XtendCatalogConstant;
export declare const SURFACE_MANAGER_STACK_POLICY_LOCAL_GATE: string;
export declare const SURFACE_MANAGER_STACK_POLICY_MODULE: string;
export declare const SURFACE_MANAGER_STACK_POLICY_PACKAGE_SCRIPT: string;
export declare const SURFACE_MANAGER_STACK_POLICY_REPORT_SCHEMA: string;
export declare const SURFACE_MANAGER_STACK_POLICY_SCHEMA: string;
export declare const SURFACE_MANAGER_STACK_POLICY_STATUS: string;
export declare const SURFACE_MANAGER_STACK_POLICY_SUITE: string;
export declare const SURFACE_MANAGER_STACK_POLICY_TARGET: string;
export declare const SURFACE_MANAGER_STACK_POLICY_WORKPACKAGE: string;
export declare const SURFACE_MANAGER_STACK_POLICY_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare function createSurfaceManagerStackPolicyPlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createSurfaceManagerStackPolicyReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateSurfaceManagerStackPolicyPlan(plan?: unknown): XtendCatalogReport;
