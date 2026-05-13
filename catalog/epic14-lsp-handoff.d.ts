import type {
  XtendCatalogConstant,
  XtendCatalogGate,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const CAPABILITY_MATRIX: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const EPIC14_LSP_HANDOFF_CONTRACT: string;
export declare const EPIC14_LSP_HANDOFF_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const EPIC14_LSP_HANDOFF_LOCAL_GATE: string;
export declare const EPIC14_LSP_HANDOFF_MODULE: string;
export declare const EPIC14_LSP_HANDOFF_PACKAGE_SCRIPT: string;
export declare const EPIC14_LSP_HANDOFF_REPORT_SCHEMA: string;
export declare const EPIC14_LSP_HANDOFF_SCHEMA: string;
export declare const EPIC14_LSP_HANDOFF_STATUS: string;
export declare const EPIC14_LSP_HANDOFF_SUITE: string;
export declare const EPIC14_LSP_HANDOFF_WORKPACKAGE: string;
export declare const EPIC14_LSP_HANDOFF_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare const FOLLOW_UP_EPIC_CANDIDATES: XtendCatalogConstant;
export declare const KERNEL_BOUNDARY: XtendCatalogConstant;
export declare const KNOWN_LIMITATIONS: XtendCatalogConstant;
export declare function createEpic14LspHandoffPlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createEpic14LspHandoffReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateEpic14LspHandoffPlan(plan?: unknown): XtendCatalogReport;
