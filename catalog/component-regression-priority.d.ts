import type {
  XtendCatalogConstant,
  XtendCatalogGate,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const COMPONENT_REGRESSION_PRIORITY_ENTRY_SCHEMA: string;
export declare const COMPONENT_REGRESSION_PRIORITY_GATE_SCHEMA: string;
export declare const COMPONENT_REGRESSION_PRIORITY_SCHEMA: string;
export declare const CORE_THEME_VARIANTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const CORE_VIEWPORTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const PROFILE_BROWSER_SMOKES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const PROFILE_VISUAL_STATES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare function createComponentRegressionPriorityGate(options?: XtendCatalogOptions): XtendCatalogGate;
export declare function createComponentRegressionPriorityPlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function validateComponentRegressionPriorityPlan(plan?: unknown): XtendCatalogReport;
