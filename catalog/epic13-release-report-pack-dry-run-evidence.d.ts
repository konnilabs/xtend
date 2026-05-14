import type {
  XtendCatalogConstant,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_CONTRACT: string;
export declare const EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_LOCAL_GATE: string;
export declare const EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_MODULE: string;
export declare const EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_PACKAGE_EXPORT: string;
export declare const EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_PACKAGE_SCRIPT: string;
export declare const EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_REPORT_ARTIFACT: string;
export declare const EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_REPORT_SCHEMA: string;
export declare const EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_SCHEMA: string;
export declare const EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_STATUS: string;
export declare const EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_SUITE: string;
export declare const EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_TARGET: string;
export declare const EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_WORKPACKAGE: string;
export declare const EPIC13_RELEASE_REPORT_PACK_DRY_RUN_EVIDENCE_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare const NEXT_DECISION: XtendCatalogConstant;
export declare const NEXT_WORKPACKAGE: string;
export declare const PACK_DRY_RUN_COMMAND: string;
export declare const PACK_DRY_RUN_RAW_COMMAND: string;
export declare const PACK_DRY_RUN_REPORT_COMMAND: string;
export declare const PUBLISH_BOUNDARY: XtendCatalogConstant;
export declare const RELEASE_REPORT_ARTIFACT: string;
export declare const RELEASE_REPORT_COMMAND: string;
export declare const REQUIRED_OWNER_EVIDENCE: readonly XtendCatalogRecord[] | XtendCatalogRecord;
export declare const REQUIRED_REFERENCE_PATHS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare function createEpic13ReleaseReportPackDryRunEvidencePlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createEpic13ReleaseReportPackDryRunEvidenceReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateEpic13ReleaseReportPackDryRunEvidencePlan(plan?: unknown): XtendCatalogReport;
