import type {
  XtendCatalogConstant,
  XtendCatalogGate,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const CANONICAL_FABRIC_BOUNDARY: XtendCatalogConstant;
export declare const EPIC10_RELEASE_HANDOFF_CONTRACT: string;
export declare const EPIC10_RELEASE_HANDOFF_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const EPIC10_RELEASE_HANDOFF_LOCAL_GATE: string;
export declare const EPIC10_RELEASE_HANDOFF_MODULE: string;
export declare const EPIC10_RELEASE_HANDOFF_PACKAGE_SCRIPT: string;
export declare const EPIC10_RELEASE_HANDOFF_REPORT_SCHEMA: string;
export declare const EPIC10_RELEASE_HANDOFF_SCHEMA: string;
export declare const EPIC10_RELEASE_HANDOFF_STATUS: string;
export declare const EPIC10_RELEASE_HANDOFF_SUITE: string;
export declare const EPIC10_RELEASE_HANDOFF_WORKPACKAGE: string;
export declare const EPIC10_RELEASE_HANDOFF_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare const KERNEL_BOUNDARY: XtendCatalogConstant;
export declare const NEXT_WAVE_HANDOFFS: XtendCatalogConstant;
export declare const REQUIRED_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_RELEASE_GATES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const RMT_FIRST_XTEND_APPS_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare function createEpic10ReleaseHandoffPlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createEpic10ReleaseHandoffReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateEpic10ReleaseHandoffPlan(plan?: unknown): XtendCatalogReport;
