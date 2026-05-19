import type {
  XtendCatalogConstant,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogReport
} from './catalog-public-types';

export declare const EPIC18_BACKLOG: string;
export declare const EPIC18_DOCUMENT: string;
export declare const EPIC18_LOCAL_GATE: string;
export declare const EPIC18_PACKAGE_SCRIPT: string;
export declare const EPIC18_RMT_APP_PLATFORM_GATE_MATRIX_SCHEMA: string;
export declare const EPIC18_RMT_APP_PLATFORM_MIGRATION_GUIDE: string;
export declare const EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_DOCS: string;
export declare const EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_MODULE: string;
export declare const EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_REPORT_SCHEMA: string;
export declare const EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_SCHEMA: string;
export declare const EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_STATUS: string;
export declare const EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_SUITE: string;
export declare const EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_TARGET: string;
export declare const EPIC18_RMT_APP_PLATFORM_RELEASE_HANDOFF_WORKPACKAGE: string;
export declare const EPIC18_RMT_APP_PLATFORM_WORKPACKAGE_DOC: string;
export declare const EPIC18_VENDOR_BUGFIX_DOCS: string;
export declare const GITHUB_ACTIONS: XtendCatalogConstant;
export declare const REQUIRED_COMMANDS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_RELEASE_GATES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare function createEpic18RmtAppPlatformReleaseHandoffPlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createEpic18RmtAppPlatformReleaseHandoffReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateEpic18RmtAppPlatformReleaseHandoffPlan(plan?: unknown): XtendCatalogReport;
