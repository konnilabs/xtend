import type {
  XtendCatalogConstant,
  XtendCatalogGate,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const EPIC13_RC1_READINESS_CONTRACT: string;
export declare const EPIC13_RC1_READINESS_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const EPIC13_RC1_READINESS_LOCAL_GATE: string;
export declare const EPIC13_RC1_READINESS_MODULE: string;
export declare const EPIC13_RC1_READINESS_PACKAGE_SCRIPT: string;
export declare const EPIC13_RC1_READINESS_REPORT_SCHEMA: string;
export declare const EPIC13_RC1_READINESS_SCHEMA: string;
export declare const EPIC13_RC1_READINESS_STATUS: string;
export declare const EPIC13_RC1_READINESS_STEERING: XtendCatalogConstant;
export declare const EPIC13_RC1_READINESS_SUITE: string;
export declare const EPIC13_RC1_READINESS_TARGET: string;
export declare const EPIC13_RC1_READINESS_WORKPACKAGE: string;
export declare const EPIC13_RC1_READINESS_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare const FEATURE_DRIFT_DECISIONS: XtendCatalogConstant;
export declare const GATE_GAPS: XtendCatalogConstant;
export declare const GATE_MAPPINGS: XtendCatalogConstant;
export declare const REQUIRED_BASELINE_GATES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_SOURCE_SCHEMAS: XtendCatalogConstant;
export declare const WORKPACKAGES: XtendCatalogConstant;
export declare function createEpic13Rc1ReadinessModel(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createEpic13Rc1ReadinessReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateEpic13Rc1ReadinessModel(plan?: unknown): XtendCatalogReport;
