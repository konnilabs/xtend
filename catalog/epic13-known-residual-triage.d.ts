import type {
  XtendCatalogConstant,
  XtendCatalogGate,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const EPIC13_KNOWN_RESIDUAL_DECISION_SCHEMA: string;
export declare const EPIC13_KNOWN_RESIDUAL_TRIAGE_CONTRACT: string;
export declare const EPIC13_KNOWN_RESIDUAL_TRIAGE_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const EPIC13_KNOWN_RESIDUAL_TRIAGE_LOCAL_GATE: string;
export declare const EPIC13_KNOWN_RESIDUAL_TRIAGE_MODULE: string;
export declare const EPIC13_KNOWN_RESIDUAL_TRIAGE_PACKAGE_SCRIPT: string;
export declare const EPIC13_KNOWN_RESIDUAL_TRIAGE_REPORT_SCHEMA: string;
export declare const EPIC13_KNOWN_RESIDUAL_TRIAGE_SCHEMA: string;
export declare const EPIC13_KNOWN_RESIDUAL_TRIAGE_STATUS: string;
export declare const EPIC13_KNOWN_RESIDUAL_TRIAGE_STEERING: XtendCatalogConstant;
export declare const EPIC13_KNOWN_RESIDUAL_TRIAGE_SUITE: string;
export declare const EPIC13_KNOWN_RESIDUAL_TRIAGE_TARGET: string;
export declare const EPIC13_KNOWN_RESIDUAL_TRIAGE_WORKPACKAGE: string;
export declare const EPIC13_KNOWN_RESIDUAL_TRIAGE_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare const PUBLISH_BOUNDARY: XtendCatalogConstant;
export declare const RC0_RESIDUAL_SCOPES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_SOURCE_GATES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const RESIDUAL_DECISION_MATRIX: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare function createEpic13KnownResidualTriagePlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createEpic13KnownResidualTriageReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateEpic13KnownResidualTriagePlan(plan?: unknown): XtendCatalogReport;
