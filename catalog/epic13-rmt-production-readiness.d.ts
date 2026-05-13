import type {
  XtendCatalogConstant,
  XtendCatalogGate,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const EPIC13_RMT_PRODUCTION_READINESS_CONTRACT: string;
export declare const EPIC13_RMT_PRODUCTION_READINESS_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const EPIC13_RMT_PRODUCTION_READINESS_LOCAL_GATE: string;
export declare const EPIC13_RMT_PRODUCTION_READINESS_MODULE: string;
export declare const EPIC13_RMT_PRODUCTION_READINESS_PACKAGE_SCRIPT: string;
export declare const EPIC13_RMT_PRODUCTION_READINESS_REPORT_ARTIFACT: string;
export declare const EPIC13_RMT_PRODUCTION_READINESS_REPORT_SCHEMA: string;
export declare const EPIC13_RMT_PRODUCTION_READINESS_SCHEMA: string;
export declare const EPIC13_RMT_PRODUCTION_READINESS_STATUS: string;
export declare const EPIC13_RMT_PRODUCTION_READINESS_STEERING: XtendCatalogConstant;
export declare const EPIC13_RMT_PRODUCTION_READINESS_SUITE: string;
export declare const EPIC13_RMT_PRODUCTION_READINESS_TARGET: string;
export declare const EPIC13_RMT_PRODUCTION_READINESS_WORKPACKAGE: string;
export declare const EPIC13_RMT_PRODUCTION_READINESS_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare const NEXT_DECISION: XtendCatalogConstant;
export declare const NEXT_WORKPACKAGE: string;
export declare const PUBLISH_BOUNDARY: XtendCatalogConstant;
export declare const REQUIRED_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_RMT_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_RMT_DOMAINS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_RMT_SOURCE_GATES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const RMT_EVIDENCE_RECORDS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare function createEpic13RmtProductionReadinessPlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createEpic13RmtProductionReadinessReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateEpic13RmtProductionReadinessPlan(plan?: unknown): XtendCatalogReport;
