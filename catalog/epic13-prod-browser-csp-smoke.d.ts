import type {
  XtendCatalogConstant,
  XtendCatalogGate,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const EPIC13_PROD_BROWSER_CSP_SMOKE_CONTRACT: string;
export declare const EPIC13_PROD_BROWSER_CSP_SMOKE_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const EPIC13_PROD_BROWSER_CSP_SMOKE_FIXTURE_SCHEMA: string;
export declare const EPIC13_PROD_BROWSER_CSP_SMOKE_LOCAL_GATE: string;
export declare const EPIC13_PROD_BROWSER_CSP_SMOKE_MODULE: string;
export declare const EPIC13_PROD_BROWSER_CSP_SMOKE_PACKAGE_SCRIPT: string;
export declare const EPIC13_PROD_BROWSER_CSP_SMOKE_REPORT_SCHEMA: string;
export declare const EPIC13_PROD_BROWSER_CSP_SMOKE_SCHEMA: string;
export declare const EPIC13_PROD_BROWSER_CSP_SMOKE_STATUS: string;
export declare const EPIC13_PROD_BROWSER_CSP_SMOKE_STEERING: XtendCatalogConstant;
export declare const EPIC13_PROD_BROWSER_CSP_SMOKE_SUITE: string;
export declare const EPIC13_PROD_BROWSER_CSP_SMOKE_TARGET: string;
export declare const EPIC13_PROD_BROWSER_CSP_SMOKE_WORKPACKAGE: string;
export declare const EPIC13_PROD_BROWSER_CSP_SMOKE_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare const PROD_CSP_FIXTURE: XtendCatalogConstant;
export declare const PROD_CSP_MANIFEST: XtendCatalogConstant;
export declare const PROD_CSP_NONCE: string;
export declare const PROD_CSP_RESULT_KEY: string;
export declare const PUBLISH_BOUNDARY: XtendCatalogConstant;
export declare const REQUIRED_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_PROD_SMOKE_ASSERTIONS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_SOURCE_GATES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare function createEpic13ProdBrowserCspSmokePlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createEpic13ProdBrowserCspSmokeReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateEpic13ProdBrowserCspSmokePlan(plan?: unknown): XtendCatalogReport;
