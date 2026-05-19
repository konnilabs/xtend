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
export declare const REQUIRED_COMPONENT_FAMILIES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_RENDERER_CAPABILITIES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_TEMPLATE_PRIMITIVES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const RMT_COMPONENT_TEMPLATE_PRIMITIVES_DOCS: string;
export declare const RMT_COMPONENT_TEMPLATE_PRIMITIVES_FIXTURE: string;
export declare const RMT_COMPONENT_TEMPLATE_PRIMITIVES_FIXTURE_SCHEMA: string;
export declare const RMT_COMPONENT_TEMPLATE_PRIMITIVES_LOCAL_GATE: string;
export declare const RMT_COMPONENT_TEMPLATE_PRIMITIVES_MODULE: string;
export declare const RMT_COMPONENT_TEMPLATE_PRIMITIVES_PACKAGE_SCRIPT: string;
export declare const RMT_COMPONENT_TEMPLATE_PRIMITIVES_REPORT_SCHEMA: string;
export declare const RMT_COMPONENT_TEMPLATE_PRIMITIVES_RUNTIME: string;
export declare const RMT_COMPONENT_TEMPLATE_PRIMITIVES_SCHEMA: string;
export declare const RMT_COMPONENT_TEMPLATE_PRIMITIVES_STATUS: string;
export declare const RMT_COMPONENT_TEMPLATE_PRIMITIVES_SUITE: string;
export declare const RMT_COMPONENT_TEMPLATE_PRIMITIVES_TARGET: string;
export declare const RMT_COMPONENT_TEMPLATE_PRIMITIVES_TYPES: string;
export declare const RMT_COMPONENT_TEMPLATE_PRIMITIVES_WORKPACKAGE: string;
export declare const RMT_COMPONENT_TEMPLATE_PRIMITIVES_WORKPACKAGE_DOC: string;
export declare function createRmtComponentTemplatePrimitivesPlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createRmtComponentTemplatePrimitivesReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateRmtComponentTemplatePrimitivesPlan(plan?: unknown): XtendCatalogReport;
