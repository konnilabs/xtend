import type {
  XtendCatalogConstant,
  XtendCatalogOptions,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';

export declare const ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_FINDING_SCHEMA: string;
export declare const ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_LOCAL_GATE: string;
export declare const ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_REPORT_SCHEMA: string;
export declare const ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_SCHEMA: string;
export declare const ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_WORKPACKAGE: string;
export declare const OVERLAY_TARGETS: readonly XtendCatalogRecord[];
export declare function createEnterpriseOverlayModeTokenParityReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateEnterpriseOverlayModeTokenParityReport(report?: unknown): XtendCatalogReport;
