import type {
  XtendCatalogConstant,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogReport
} from './catalog-public-types';

export declare const NEXT_DECISION: string;
export declare const NEXT_WORKPACKAGE: string;
export declare const REQUIRED_APP_PLATFORM_BOUNDARIES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_DATASOURCE_KINDS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_DOMAIN_VARIANTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_FIXTURE_CAPABILITIES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const RMT_APP_PLATFORM_FIXTURE: string;
export declare const RMT_APP_PLATFORM_FIXTURE_BACKLOG: string;
export declare const RMT_APP_PLATFORM_FIXTURE_DOCS: string;
export declare const RMT_APP_PLATFORM_FIXTURE_EPIC: string;
export declare const RMT_APP_PLATFORM_FIXTURE_LOCAL_GATE: string;
export declare const RMT_APP_PLATFORM_FIXTURE_MODULE: string;
export declare const RMT_APP_PLATFORM_FIXTURE_PACKAGE_SCRIPT: string;
export declare const RMT_APP_PLATFORM_FIXTURE_REPORT_SCHEMA: string;
export declare const RMT_APP_PLATFORM_FIXTURE_SCHEMA: string;
export declare const RMT_APP_PLATFORM_FIXTURE_SOURCE_SCHEMA: string;
export declare const RMT_APP_PLATFORM_FIXTURE_STATUS: string;
export declare const RMT_APP_PLATFORM_FIXTURE_SUITE: string;
export declare const RMT_APP_PLATFORM_FIXTURE_TARGET: string;
export declare const RMT_APP_PLATFORM_FIXTURE_WORKPACKAGE: string;
export declare const RMT_APP_PLATFORM_FIXTURE_WORKPACKAGE_DOC: string;
export declare function createRmtAppPlatformFixturePlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createRmtAppPlatformFixtureReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateRmtAppPlatformFixturePlan(plan?: unknown): XtendCatalogReport;
