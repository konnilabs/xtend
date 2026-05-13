import type {
  XtendCatalogConstant,
  XtendCatalogOptions,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';

export declare const ANTI_GENERIC_CHECKS: readonly XtendCatalogConstant[];
export declare const ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_BASELINE: string;
export declare const ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_BASELINE_SCHEMA: string;
export declare const ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_FINDING_SCHEMA: string;
export declare const ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_FIXTURE: string;
export declare const ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_FIXTURE_SCHEMA: string;
export declare const ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_LOCAL_GATE: string;
export declare const ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_RECORD_SCHEMA: string;
export declare const ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_REPORT_SCHEMA: string;
export declare const ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_RESULT_KEY: string;
export declare const ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_SCHEMA: string;
export declare const ENTERPRISE_VISUAL_DOM_SNAPSHOT_MATRIX_WORKPACKAGE: string;
export declare const REQUIRED_FIXTURE_CHECKS: readonly XtendCatalogConstant[];
export declare const SIGNATURE_UI_STATES: readonly XtendCatalogConstant[];
export declare const TYPOGRAPHY_SAMPLES: readonly XtendCatalogConstant[];
export declare const VISUAL_DENSITIES: readonly XtendCatalogConstant[];
export declare const VISUAL_MOTION_MODES: readonly XtendCatalogConstant[];
export declare const VISUAL_THEMES: readonly XtendCatalogConstant[];
export declare const VISUAL_VIEWPORTS: readonly XtendCatalogConstant[];
export declare const XHEADER_MENU_MODES: readonly XtendCatalogConstant[];
export declare function createEnterpriseVisualDomSnapshotBaseline(options?: XtendCatalogOptions): XtendCatalogRecord;
export declare function createEnterpriseVisualDomSnapshotMatrixReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function createEnterpriseVisualDomSnapshotRecords(): XtendCatalogRecord[];
export declare function validateEnterpriseVisualDomSnapshotMatrixReport(report?: unknown): XtendCatalogReport;
