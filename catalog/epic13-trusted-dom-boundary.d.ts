import type {
  XtendCatalogConstant,
  XtendCatalogGate,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const EPIC13_TRUSTED_DOM_BOUNDARY_CONTRACT: string;
export declare const EPIC13_TRUSTED_DOM_BOUNDARY_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const EPIC13_TRUSTED_DOM_BOUNDARY_FIXTURE_SCHEMA: string;
export declare const EPIC13_TRUSTED_DOM_BOUNDARY_LOCAL_GATE: string;
export declare const EPIC13_TRUSTED_DOM_BOUNDARY_MODULE: string;
export declare const EPIC13_TRUSTED_DOM_BOUNDARY_PACKAGE_SCRIPT: string;
export declare const EPIC13_TRUSTED_DOM_BOUNDARY_REPORT_ARTIFACT: string;
export declare const EPIC13_TRUSTED_DOM_BOUNDARY_REPORT_SCHEMA: string;
export declare const EPIC13_TRUSTED_DOM_BOUNDARY_SCHEMA: string;
export declare const EPIC13_TRUSTED_DOM_BOUNDARY_STATUS: string;
export declare const EPIC13_TRUSTED_DOM_BOUNDARY_STEERING: XtendCatalogConstant;
export declare const EPIC13_TRUSTED_DOM_BOUNDARY_SUITE: string;
export declare const EPIC13_TRUSTED_DOM_BOUNDARY_TARGET: string;
export declare const EPIC13_TRUSTED_DOM_BOUNDARY_WORKPACKAGE: string;
export declare const EPIC13_TRUSTED_DOM_BOUNDARY_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare const NEXT_DECISION: XtendCatalogConstant;
export declare const NEXT_WORKPACKAGE: string;
export declare const PUBLISH_BOUNDARY: XtendCatalogConstant;
export declare const REQUIRED_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_BROWSER_ASSERTIONS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_SOURCE_GATES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const TRUSTED_DOM_BOUNDARY_FIXTURE: XtendCatalogConstant;
export declare const TRUSTED_DOM_BOUNDARY_RESULT_KEY: string;
export declare function createEpic13TrustedDomBoundaryPlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createEpic13TrustedDomBoundaryReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateEpic13TrustedDomBoundaryPlan(plan?: unknown): XtendCatalogReport;
