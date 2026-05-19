import type {
  XtendCatalogConstant,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogReport
} from './catalog-public-types';

export declare const NEXT_DECISION: string;
export declare const NEXT_WORKPACKAGE: string;
export declare const REQUIRED_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_BOUNDARIES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_STATE_CAPABILITIES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_STATE_TYPES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const RMT_STATE_SELECTOR_RUNTIME_BACKLOG: string;
export declare const RMT_STATE_SELECTOR_RUNTIME_DOCS: string;
export declare const RMT_STATE_SELECTOR_RUNTIME_EPIC: string;
export declare const RMT_STATE_SELECTOR_RUNTIME_FIXTURE: string;
export declare const RMT_STATE_SELECTOR_RUNTIME_FIXTURE_SCHEMA: string;
export declare const RMT_STATE_SELECTOR_RUNTIME_LOCAL_GATE: string;
export declare const RMT_STATE_SELECTOR_RUNTIME_MODULE: string;
export declare const RMT_STATE_SELECTOR_RUNTIME_PACKAGE_SCRIPT: string;
export declare const RMT_STATE_SELECTOR_RUNTIME_REPORT_SCHEMA: string;
export declare const RMT_STATE_SELECTOR_RUNTIME_RUNTIME: string;
export declare const RMT_STATE_SELECTOR_RUNTIME_SCHEMA: string;
export declare const RMT_STATE_SELECTOR_RUNTIME_STATUS: string;
export declare const RMT_STATE_SELECTOR_RUNTIME_SUITE: string;
export declare const RMT_STATE_SELECTOR_RUNTIME_TARGET: string;
export declare const RMT_STATE_SELECTOR_RUNTIME_TYPES: string;
export declare const RMT_STATE_SELECTOR_RUNTIME_WORKPACKAGE: string;
export declare const RMT_STATE_SELECTOR_RUNTIME_WORKPACKAGE_DOC: string;
export declare function createRmtStateSelectorRuntimePlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createRmtStateSelectorRuntimeReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateRmtStateSelectorRuntimePlan(plan?: unknown): XtendCatalogReport;
