import type {
  XtendCatalogConstant,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogReport
} from './catalog-public-types';

export declare const NEXT_DECISION: string;
export declare const NEXT_WORKPACKAGE: string;
export declare const REQUIRED_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_BOUNDARIES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_COMPLETION_CONTEXTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_DIAGNOSTIC_CODES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_TOOLING_CAPABILITIES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const RMT_APP_PLATFORM_SCAFFOLD_SCHEMA: string;
export declare const RMT_APP_PLATFORM_SOURCE_MAP_SCHEMA: string;
export declare const RMT_APP_PLATFORM_TOOLING_BACKLOG: string;
export declare const RMT_APP_PLATFORM_TOOLING_DOCS: string;
export declare const RMT_APP_PLATFORM_TOOLING_EPIC: string;
export declare const RMT_APP_PLATFORM_TOOLING_FIXTURE: string;
export declare const RMT_APP_PLATFORM_TOOLING_FIXTURE_SCHEMA: string;
export declare const RMT_APP_PLATFORM_TOOLING_GENERATOR: string;
export declare const RMT_APP_PLATFORM_TOOLING_LOCAL_GATE: string;
export declare const RMT_APP_PLATFORM_TOOLING_MODULE: string;
export declare const RMT_APP_PLATFORM_TOOLING_PACKAGE_SCRIPT: string;
export declare const RMT_APP_PLATFORM_TOOLING_REPORT_SCHEMA: string;
export declare const RMT_APP_PLATFORM_TOOLING_RUNTIME: string;
export declare const RMT_APP_PLATFORM_TOOLING_SCHEMA: string;
export declare const RMT_APP_PLATFORM_TOOLING_STATUS: string;
export declare const RMT_APP_PLATFORM_TOOLING_SUITE: string;
export declare const RMT_APP_PLATFORM_TOOLING_TARGET: string;
export declare const RMT_APP_PLATFORM_TOOLING_TYPES: string;
export declare const RMT_APP_PLATFORM_TOOLING_WORKPACKAGE: string;
export declare const RMT_APP_PLATFORM_TOOLING_WORKPACKAGE_DOC: string;
export declare function createRmtAppPlatformToolingPlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createRmtAppPlatformToolingReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateRmtAppPlatformToolingPlan(plan?: unknown): XtendCatalogReport;
