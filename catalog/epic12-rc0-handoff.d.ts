import type {
  XtendCatalogConstant,
  XtendCatalogGate,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const COMPLETED_WORKPACKAGES: XtendCatalogConstant;
export declare const EPIC12_RC0_HANDOFF_CONTRACT: string;
export declare const EPIC12_RC0_HANDOFF_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const EPIC12_RC0_HANDOFF_LOCAL_GATE: string;
export declare const EPIC12_RC0_HANDOFF_MODULE: string;
export declare const EPIC12_RC0_HANDOFF_PACKAGE_SCRIPT: string;
export declare const EPIC12_RC0_HANDOFF_REPORT_SCHEMA: string;
export declare const EPIC12_RC0_HANDOFF_SCHEMA: string;
export declare const EPIC12_RC0_HANDOFF_STATUS: string;
export declare const EPIC12_RC0_HANDOFF_SUITE: string;
export declare const EPIC12_RC0_HANDOFF_WORKPACKAGE: string;
export declare const EPIC12_RC0_HANDOFF_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare const KERNEL_BOUNDARY: XtendCatalogConstant;
export declare const OWNER_REVIEW_INPUTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const PUBLISH_BOUNDARY: XtendCatalogConstant;
export declare const REQUIRED_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_GATES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare function createEpic12Rc0HandoffPlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createEpic12Rc0HandoffReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateEpic12Rc0HandoffPlan(plan?: unknown): XtendCatalogReport;
