import type {
  XtendCatalogConstant,
  XtendCatalogGate,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const ADOPTION_STAGES: XtendCatalogConstant;
export declare const EPIC12_DOCS_ADOPTION_CONTRACT: string;
export declare const EPIC12_DOCS_ADOPTION_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const EPIC12_DOCS_ADOPTION_LOCAL_GATE: string;
export declare const EPIC12_DOCS_ADOPTION_MODULE: string;
export declare const EPIC12_DOCS_ADOPTION_PACKAGE_SCRIPT: string;
export declare const EPIC12_DOCS_ADOPTION_REPORT_SCHEMA: string;
export declare const EPIC12_DOCS_ADOPTION_SCHEMA: string;
export declare const EPIC12_DOCS_ADOPTION_STATUS: string;
export declare const EPIC12_DOCS_ADOPTION_SUITE: string;
export declare const EPIC12_DOCS_ADOPTION_WORKPACKAGE: string;
export declare const EPIC12_DOCS_ADOPTION_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare const KERNEL_BOUNDARY: XtendCatalogConstant;
export declare const MIGRATION_NOTE_TOPICS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const PUBLISH_BOUNDARY: XtendCatalogConstant;
export declare const REQUIRED_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare function createEpic12DocsAdoptionGuide(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createEpic12DocsAdoptionReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateEpic12DocsAdoptionGuide(plan?: unknown): XtendCatalogReport;
