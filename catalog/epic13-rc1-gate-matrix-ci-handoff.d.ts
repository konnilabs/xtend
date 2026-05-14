import type {
  XtendCatalogConstant,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const CI_LANES: readonly XtendCatalogRecord[] | XtendCatalogRecord;
export declare const DPF_WORKPACKAGE: string;
export declare const EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_CONTRACT: string;
export declare const EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_LOCAL_GATE: string;
export declare const EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_MODULE: string;
export declare const EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_PACKAGE_EXPORT: string;
export declare const EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_PACKAGE_SCRIPT: string;
export declare const EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_REPORT_ARTIFACT: string;
export declare const EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_REPORT_SCHEMA: string;
export declare const EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_SCHEMA: string;
export declare const EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_STATUS: string;
export declare const EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_STEERING: XtendCatalogConstant;
export declare const EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_SUITE: string;
export declare const EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_TARGET: string;
export declare const EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_WORKPACKAGE: string;
export declare const EPIC13_RC1_GATE_MATRIX_CI_HANDOFF_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare const NEXT_DECISION: XtendCatalogConstant;
export declare const NEXT_WORKPACKAGE: string;
export declare const PUBLISH_BOUNDARY: XtendCatalogConstant;
export declare const REQUIRED_REFERENCE_PATHS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_REPORT_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_SOURCE_GATES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SOURCE_GATE_DEFINITIONS: readonly XtendCatalogRecord[] | XtendCatalogRecord;
export declare function createEpic13Rc1GateMatrixCiHandoffPlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createEpic13Rc1GateMatrixCiHandoffReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateEpic13Rc1GateMatrixCiHandoffPlan(plan?: unknown): XtendCatalogReport;
