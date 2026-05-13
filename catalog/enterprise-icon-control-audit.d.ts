import type {
  XtendCatalogConstant,
  XtendCatalogOptions,
  XtendCatalogReport
} from './catalog-public-types';

export declare const CONTROL_KEYWORDS: readonly XtendCatalogConstant[];
export declare const ENTERPRISE_ICON_CONTROL_AUDIT_FINDING_SCHEMA: string;
export declare const ENTERPRISE_ICON_CONTROL_AUDIT_LOCAL_GATE: string;
export declare const ENTERPRISE_ICON_CONTROL_AUDIT_REPORT_SCHEMA: string;
export declare const ENTERPRISE_ICON_CONTROL_AUDIT_SCHEMA: string;
export declare const ENTERPRISE_ICON_CONTROL_AUDIT_WORKPACKAGE: string;
export declare const IGNORED_FILES: readonly XtendCatalogConstant[];
export declare const PRODUCTION_SCAN_PATHS: readonly XtendCatalogConstant[];
export declare const REQUIRED_CORE_ICONS: readonly XtendCatalogConstant[];
export declare const SCAN_EXTENSIONS: readonly XtendCatalogConstant[];
export declare const TEXT_GLYPH_ENTITIES: readonly XtendCatalogConstant[];
export declare const TEXT_GLYPH_LITERALS: readonly XtendCatalogConstant[];
export declare function createEnterpriseIconControlAuditReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function isTextGlyphControlContent(value?: unknown): boolean;
export declare function validateEnterpriseIconControlAuditReport(report?: unknown): XtendCatalogReport;
