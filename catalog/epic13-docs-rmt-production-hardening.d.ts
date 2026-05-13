import type {
  XtendCatalogConstant,
  XtendCatalogGate,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const DOCS_RMT_DOCUMENT: XtendCatalogConstant;
export declare const DOCS_RMT_HOST: XtendCatalogConstant;
export declare const DOCS_RMT_PAGE_LOADER: XtendCatalogConstant;
export declare const DOCS_RMT_PILOT_SCHEMA: string;
export declare const DOCS_RMT_RENDER_SCHEMA: string;
export declare const EPIC13_DOCS_RMT_PRODUCTION_HARDENING_CONTRACT: string;
export declare const EPIC13_DOCS_RMT_PRODUCTION_HARDENING_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const EPIC13_DOCS_RMT_PRODUCTION_HARDENING_LOCAL_GATE: string;
export declare const EPIC13_DOCS_RMT_PRODUCTION_HARDENING_MODULE: string;
export declare const EPIC13_DOCS_RMT_PRODUCTION_HARDENING_PACKAGE_SCRIPT: string;
export declare const EPIC13_DOCS_RMT_PRODUCTION_HARDENING_REPORT_ARTIFACT: string;
export declare const EPIC13_DOCS_RMT_PRODUCTION_HARDENING_REPORT_SCHEMA: string;
export declare const EPIC13_DOCS_RMT_PRODUCTION_HARDENING_SCHEMA: string;
export declare const EPIC13_DOCS_RMT_PRODUCTION_HARDENING_STATUS: string;
export declare const EPIC13_DOCS_RMT_PRODUCTION_HARDENING_STEERING: XtendCatalogConstant;
export declare const EPIC13_DOCS_RMT_PRODUCTION_HARDENING_SUITE: string;
export declare const EPIC13_DOCS_RMT_PRODUCTION_HARDENING_TARGET: string;
export declare const EPIC13_DOCS_RMT_PRODUCTION_HARDENING_WORKPACKAGE: string;
export declare const EPIC13_DOCS_RMT_PRODUCTION_HARDENING_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare const NEXT_DECISION: XtendCatalogConstant;
export declare const NEXT_WORKPACKAGE: string;
export declare const PUBLISH_BOUNDARY: XtendCatalogConstant;
export declare const REQUIRED_DOCS_RMT_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_DOCS_RMT_GATES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_EXTENSION_SLOTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const TRUST_BOUNDARY: XtendCatalogConstant;
export declare function createEpic13DocsRmtProductionHardeningPlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createEpic13DocsRmtProductionHardeningReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateEpic13DocsRmtProductionHardeningPlan(plan?: unknown): XtendCatalogReport;
