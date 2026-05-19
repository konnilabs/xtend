import type {
  XtendCatalogConstant,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogReport
} from './catalog-public-types';

export declare const NEXT_DECISION: string;
export declare const NEXT_WORKPACKAGE: string;
export declare const REQUIRED_ACTION_CAPABILITIES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_BOUNDARIES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_DATASOURCE_KINDS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_EFFECT_KINDS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_RESOURCE_KINDS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const RMT_ACTION_EFFECT_RUNTIME_BACKLOG: string;
export declare const RMT_ACTION_EFFECT_RUNTIME_DOCS: string;
export declare const RMT_ACTION_EFFECT_RUNTIME_EPIC: string;
export declare const RMT_ACTION_EFFECT_RUNTIME_FIXTURE: string;
export declare const RMT_ACTION_EFFECT_RUNTIME_FIXTURE_SCHEMA: string;
export declare const RMT_ACTION_EFFECT_RUNTIME_LOCAL_GATE: string;
export declare const RMT_ACTION_EFFECT_RUNTIME_MODULE: string;
export declare const RMT_ACTION_EFFECT_RUNTIME_PACKAGE_SCRIPT: string;
export declare const RMT_ACTION_EFFECT_RUNTIME_REPORT_SCHEMA: string;
export declare const RMT_ACTION_EFFECT_RUNTIME_RUNTIME: string;
export declare const RMT_ACTION_EFFECT_RUNTIME_SCHEMA: string;
export declare const RMT_ACTION_EFFECT_RUNTIME_STATUS: string;
export declare const RMT_ACTION_EFFECT_RUNTIME_SUITE: string;
export declare const RMT_ACTION_EFFECT_RUNTIME_TARGET: string;
export declare const RMT_ACTION_EFFECT_RUNTIME_TYPES: string;
export declare const RMT_ACTION_EFFECT_RUNTIME_WORKPACKAGE: string;
export declare const RMT_ACTION_EFFECT_RUNTIME_WORKPACKAGE_DOC: string;
export declare function createRmtActionEffectRuntimePlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createRmtActionEffectRuntimeReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateRmtActionEffectRuntimePlan(plan?: unknown): XtendCatalogReport;
