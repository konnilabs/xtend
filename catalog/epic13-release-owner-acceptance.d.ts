import type {
  XtendCatalogConstant,
  XtendCatalogGate,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const EPIC13_RELEASE_OWNER_ACCEPTANCE_CONTRACT: string;
export declare const EPIC13_RELEASE_OWNER_ACCEPTANCE_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const EPIC13_RELEASE_OWNER_ACCEPTANCE_LOCAL_GATE: string;
export declare const EPIC13_RELEASE_OWNER_ACCEPTANCE_MODULE: string;
export declare const EPIC13_RELEASE_OWNER_ACCEPTANCE_PACKAGE_SCRIPT: string;
export declare const EPIC13_RELEASE_OWNER_ACCEPTANCE_REPORT_SCHEMA: string;
export declare const EPIC13_RELEASE_OWNER_ACCEPTANCE_SCHEMA: string;
export declare const EPIC13_RELEASE_OWNER_ACCEPTANCE_STATUS: string;
export declare const EPIC13_RELEASE_OWNER_ACCEPTANCE_STEERING: XtendCatalogConstant;
export declare const EPIC13_RELEASE_OWNER_ACCEPTANCE_SUITE: string;
export declare const EPIC13_RELEASE_OWNER_ACCEPTANCE_TARGET: string;
export declare const EPIC13_RELEASE_OWNER_ACCEPTANCE_WORKPACKAGE: string;
export declare const EPIC13_RELEASE_OWNER_ACCEPTANCE_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare const OWNER_DECISION_STATES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const OWNER_REVIEW_CHECKLIST: XtendCatalogConstant;
export declare const PUBLISH_BOUNDARY: XtendCatalogConstant;
export declare const REQUIRED_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_LOCAL_GATES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_OWNER_INPUTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_SOURCE_SCHEMAS: XtendCatalogConstant;
export declare function createEpic13ReleaseOwnerAcceptanceContract(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createEpic13ReleaseOwnerAcceptanceReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateEpic13ReleaseOwnerAcceptanceContract(plan?: unknown): XtendCatalogReport;
