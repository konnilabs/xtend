import type {
  XtendCatalogConstant,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';

export declare const KERNEL_BOUNDARY: string;
export declare const NEXT_DECISION: string;
export declare const NEXT_WORKPACKAGE: string;
export declare const REQUIRED_ADAPTERS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_BOUNDARIES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_COMPONENT_ADAPTER_CAPABILITIES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_LANES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_PRIMITIVES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_SCHEDULES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_TEMPLATE_PRIMITIVES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const RMT_APP_PLATFORM_AUTHORING_BACKLOG: string;
export declare const RMT_APP_PLATFORM_AUTHORING_DOCS: string;
export declare const RMT_APP_PLATFORM_AUTHORING_EPIC: string;
export declare const RMT_APP_PLATFORM_AUTHORING_FIXTURE: string;
export declare const RMT_APP_PLATFORM_AUTHORING_LOCAL_GATE: string;
export declare const RMT_APP_PLATFORM_AUTHORING_MODULE: string;
export declare const RMT_APP_PLATFORM_AUTHORING_PACKAGE_SCRIPT: string;
export declare const RMT_APP_PLATFORM_AUTHORING_REPORT_SCHEMA: string;
export declare const RMT_APP_PLATFORM_AUTHORING_SCHEMA: string;
export declare const RMT_APP_PLATFORM_AUTHORING_STATUS: string;
export declare const RMT_APP_PLATFORM_AUTHORING_SUITE: string;
export declare const RMT_APP_PLATFORM_AUTHORING_TARGET: string;
export declare const RMT_APP_PLATFORM_AUTHORING_WORKPACKAGE: string;
export declare const RMT_APP_PLATFORM_AUTHORING_WORKPACKAGE_DOC: string;
export declare const RMT_APP_PLATFORM_FIXTURE_SCHEMA: string;
export declare function collectFixturePrimitiveCoverage(fixture?: unknown): XtendCatalogRecord;
export declare function createRmtAppPlatformAuthoringPlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createRmtAppPlatformAuthoringReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateRmtAppPlatformAuthoringPlan(plan?: unknown): XtendCatalogReport;
