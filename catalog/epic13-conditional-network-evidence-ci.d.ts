import type {
  XtendCatalogConstant,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogReport
} from './catalog-public-types';

export declare const CI_EVIDENCE_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const CONDITIONAL_NETWORK_EVIDENCE_CAPTURE_COMMAND: string;
export declare const CONDITIONAL_NETWORK_EVIDENCE_CAPTURE_MODULE: string;
export declare const CONDITIONAL_NETWORK_EVIDENCE_CAPTURE_SCRIPT: string;
export declare const CONDITIONAL_NETWORK_EVIDENCE_WORKFLOW: string;
export declare const CONDITIONAL_NETWORK_EVIDENCE_WORKFLOW_ARTIFACT: string;
export declare const CONDITIONAL_NETWORK_EVIDENCE_WORKFLOW_JOB: string;
export declare const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_CONTRACT: string;
export declare const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_LOCAL_GATE: string;
export declare const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_MODULE: string;
export declare const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_PACKAGE_EXPORT: string;
export declare const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_PACKAGE_SCRIPT: string;
export declare const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_REPORT_ARTIFACT: string;
export declare const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_REPORT_SCHEMA: string;
export declare const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_SCHEMA: string;
export declare const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_STATUS: string;
export declare const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_SUITE: string;
export declare const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_TARGET: string;
export declare const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_WORKPACKAGE: string;
export declare const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CI_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare const NEXT_DECISION: XtendCatalogConstant;
export declare const NEXT_WORKPACKAGE: string;
export declare const PUBLISH_BOUNDARY: XtendCatalogConstant;
export declare const REQUIRED_REFERENCE_PATHS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare function createEpic13ConditionalNetworkEvidenceCiPlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createEpic13ConditionalNetworkEvidenceCiReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateEpic13ConditionalNetworkEvidenceCiPlan(plan?: unknown): XtendCatalogReport;
