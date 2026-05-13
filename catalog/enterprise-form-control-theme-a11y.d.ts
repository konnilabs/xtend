import type {
  XtendCatalogConstant,
  XtendCatalogOptions,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';

export declare const ENTERPRISE_FORM_CONTROL_THEME_A11Y_FINDING_SCHEMA: string;
export declare const ENTERPRISE_FORM_CONTROL_THEME_A11Y_LOCAL_GATE: string;
export declare const ENTERPRISE_FORM_CONTROL_THEME_A11Y_REPORT_SCHEMA: string;
export declare const ENTERPRISE_FORM_CONTROL_THEME_A11Y_SCHEMA: string;
export declare const ENTERPRISE_FORM_CONTROL_THEME_A11Y_WORKPACKAGE: string;
export declare const FORM_CONTROL_THEME_TARGETS: readonly XtendCatalogRecord[];
export declare const REQUIRED_DOC_MARKERS: readonly XtendCatalogConstant[];
export declare const REQUIRED_FIXTURE_MARKERS: readonly XtendCatalogConstant[];
export declare const REQUIRED_FORM_TOKENS: readonly XtendCatalogConstant[];
export declare const REQUIRED_SOURCE_MARKERS: readonly XtendCatalogConstant[];
export declare function createEnterpriseFormControlThemeA11yReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateEnterpriseFormControlThemeA11yReport(report?: unknown): XtendCatalogReport;
