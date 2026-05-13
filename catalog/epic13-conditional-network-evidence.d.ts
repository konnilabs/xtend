import type {
  XtendCatalogConstant,
  XtendCatalogGate,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const COMMAND_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const DEFERRAL_REASONS: XtendCatalogConstant;
export declare const EPIC13_CONDITIONAL_NETWORK_DEFERRAL_SCHEMA: string;
export declare const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_CONTRACT: string;
export declare const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_LOCAL_GATE: string;
export declare const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_MODULE: string;
export declare const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_PACKAGE_SCRIPT: string;
export declare const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_REPORT_SCHEMA: string;
export declare const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_SCHEMA: string;
export declare const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_STATUS: string;
export declare const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_STEERING: XtendCatalogConstant;
export declare const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_SUITE: string;
export declare const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_TARGET: string;
export declare const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_WORKPACKAGE: string;
export declare const EPIC13_CONDITIONAL_NETWORK_EVIDENCE_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare const EVIDENCE_STATUSES: XtendCatalogConstant;
export declare const PUBLISH_BOUNDARY: XtendCatalogConstant;
export declare const REQUIRED_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_SOURCE_SCHEMAS: XtendCatalogConstant;
export declare function createEpic13ConditionalNetworkEvidencePlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createEpic13ConditionalNetworkEvidenceReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateEpic13ConditionalNetworkEvidencePlan(plan?: unknown): XtendCatalogReport;
