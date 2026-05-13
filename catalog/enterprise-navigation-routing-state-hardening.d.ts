import type {
  XtendCatalogConstant,
  XtendCatalogOptions,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';

export declare const ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_FINDING_SCHEMA: string;
export declare const ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_LOCAL_GATE: string;
export declare const ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_REPORT_SCHEMA: string;
export declare const ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_SCHEMA: string;
export declare const ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_WORKPACKAGE: string;
export declare const NAVIGATION_ROUTING_STATE_TARGETS: readonly XtendCatalogRecord[];
export declare const REQUIRED_DOC_MARKERS: readonly XtendCatalogConstant[];
export declare const REQUIRED_FIXTURE_MARKERS: readonly XtendCatalogConstant[];
export declare const REQUIRED_NAVIGATION_TOKENS: readonly XtendCatalogConstant[];
export declare const REQUIRED_SOURCE_MARKERS: readonly XtendCatalogConstant[];
export declare const TEXT_GLYPH_CONTROL_PATTERNS: readonly XtendCatalogConstant[];
export declare function createEnterpriseNavigationRoutingStateHardeningReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateEnterpriseNavigationRoutingStateHardeningReport(report?: unknown): XtendCatalogReport;
