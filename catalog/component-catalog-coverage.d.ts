import type {
  XtendCatalogConstant,
  XtendCatalogGate,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const COMPONENT_CATALOG_COVERAGE_SCHEMA: string;
export declare const COMPONENT_CATALOG_ENTRY_SCHEMA: string;
export declare const COMPONENT_CATALOG_GATE_SCHEMA: string;
export declare const COVERAGE_DIMENSIONS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const EXPECTED_PROFILES_BY_TAG: XtendCatalogConstant;
export declare const STATUS_LABELS: XtendCatalogConstant;
export declare function createComponentCatalogCoverageGate(options?: XtendCatalogOptions): XtendCatalogGate;
export declare function createComponentCatalogCoverageReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function createMarkdownMatrix(...args: unknown[]): string;
export declare function validateComponentCatalogCoverageReport(plan?: unknown): XtendCatalogReport;
