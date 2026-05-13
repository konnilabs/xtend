import type {
  XtendCatalogConstant,
  XtendCatalogGate,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const CONDITIONAL_NETWORK_COMMANDS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const GATE_DEFINITIONS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const KERNEL_BOUNDARY: XtendCatalogConstant;
export declare const PUBLISH_BOUNDARY: XtendCatalogConstant;
export declare const RC0_AUTHORING_SUITES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const RC0_FAST_PR_SUITES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const RC0_GATE_MATRIX_CONTRACT: string;
export declare const RC0_GATE_MATRIX_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const RC0_GATE_MATRIX_LOCAL_GATE: string;
export declare const RC0_GATE_MATRIX_MODULE: string;
export declare const RC0_GATE_MATRIX_PACKAGE_SCRIPT: string;
export declare const RC0_GATE_MATRIX_REPORT_SCHEMA: string;
export declare const RC0_GATE_MATRIX_SCHEMA: string;
export declare const RC0_GATE_MATRIX_STATUS: string;
export declare const RC0_GATE_MATRIX_SUITE: string;
export declare const RC0_GATE_MATRIX_WORKPACKAGE: string;
export declare const RC0_GATE_MATRIX_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare const RC0_GATE_RECORD_SCHEMA: string;
export declare const RC0_KNOWN_RESIDUAL_POLICY_SCHEMA: string;
export declare const RC0_RELEASE_MUST_INCLUDE: XtendCatalogConstant;
export declare const RC0_SNAPSHOT_SUITES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare function commandForSuites(...args: unknown[]): string;
export declare function createEpic12Rc0GateMatrix(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createEpic12Rc0GateMatrixReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function createKnownResidualPolicy(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function validateEpic12Rc0GateMatrix(plan?: unknown): XtendCatalogReport;
