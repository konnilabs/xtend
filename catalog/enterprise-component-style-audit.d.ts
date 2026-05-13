import type {
  XtendCatalogConstant,
  XtendCatalogOptions,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';

export declare const AUDIT_CATEGORIES: readonly XtendCatalogConstant[];
export declare const CATEGORY_SUGGESTIONS: XtendCatalogRecord;
export declare const ENTERPRISE_COMPONENT_STYLE_AUDIT_FINDING_SCHEMA: string;
export declare const ENTERPRISE_COMPONENT_STYLE_AUDIT_LOCAL_GATE: string;
export declare const ENTERPRISE_COMPONENT_STYLE_AUDIT_REPORT_SCHEMA: string;
export declare const ENTERPRISE_COMPONENT_STYLE_AUDIT_SCHEMA: string;
export declare const ENTERPRISE_COMPONENT_STYLE_AUDIT_WORKPACKAGE: string;
export declare const KNOWN_RESIDUAL_FILES: readonly XtendCatalogConstant[];
export declare const P0_COMPONENTS: readonly XtendCatalogConstant[];
export declare const SCAN_EXTENSIONS: readonly XtendCatalogConstant[];
export declare const SCAN_ROOTS: readonly XtendCatalogConstant[];
export declare function createEnterpriseComponentStyleAuditReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function detectLineFindings(options?: XtendCatalogOptions): XtendCatalogRecord[];
export declare function isBlockingFinding(finding?: unknown): boolean;
export declare function validateEnterpriseComponentStyleAuditReport(report?: unknown): XtendCatalogReport;
