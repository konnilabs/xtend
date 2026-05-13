import type {
  XtendCatalogConstant,
  XtendCatalogOptions,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';

export declare const ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_FINDING_SCHEMA: string;
export declare const ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_LOCAL_GATE: string;
export declare const ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_REPORT_SCHEMA: string;
export declare const ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_SCHEMA: string;
export declare const ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_WORKPACKAGE: string;
export declare const LAYOUT_DISPLAY_MEDIA_TARGETS: readonly XtendCatalogRecord[];
export declare const REQUIRED_DOC_MARKERS: readonly XtendCatalogConstant[];
export declare const REQUIRED_FIXTURE_MARKERS: readonly XtendCatalogConstant[];
export declare const REQUIRED_LAYOUT_TOKENS: readonly XtendCatalogConstant[];
export declare const REQUIRED_SOURCE_MARKERS: readonly XtendCatalogConstant[];
export declare const TEXT_GLYPH_CONTROL_PATTERNS: readonly XtendCatalogConstant[];
export declare function createEnterpriseLayoutDisplayMediaTokenizationReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateEnterpriseLayoutDisplayMediaTokenizationReport(report?: unknown): XtendCatalogReport;
