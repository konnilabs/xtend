import type {
  XtendCatalogConstant,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogReport
} from './catalog-public-types';

export declare const FORBIDDEN_NORMAL_UI_SINKS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const NEXT_DECISION: string;
export declare const NEXT_WORKPACKAGE: string;
export declare const NO_MANUAL_HTML_GATE_SCHEMA: string;
export declare const REQUIRED_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_BOUNDARIES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_RENDER_OPERATIONS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const RMT_DOM_DESCRIPTOR_RENDERER_DOCS: string;
export declare const RMT_DOM_DESCRIPTOR_RENDERER_FIXTURE: string;
export declare const RMT_DOM_DESCRIPTOR_RENDERER_FIXTURE_SCHEMA: string;
export declare const RMT_DOM_DESCRIPTOR_RENDERER_LOCAL_GATE: string;
export declare const RMT_DOM_DESCRIPTOR_RENDERER_MODULE: string;
export declare const RMT_DOM_DESCRIPTOR_RENDERER_PACKAGE_SCRIPT: string;
export declare const RMT_DOM_DESCRIPTOR_RENDERER_REPORT_SCHEMA: string;
export declare const RMT_DOM_DESCRIPTOR_RENDERER_RUNTIME: string;
export declare const RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA: string;
export declare const RMT_DOM_DESCRIPTOR_RENDERER_STATUS: string;
export declare const RMT_DOM_DESCRIPTOR_RENDERER_SUITE: string;
export declare const RMT_DOM_DESCRIPTOR_RENDERER_TARGET: string;
export declare const RMT_DOM_DESCRIPTOR_RENDERER_TYPES: string;
export declare const RMT_DOM_DESCRIPTOR_RENDERER_WORKPACKAGE: string;
export declare const RMT_DOM_DESCRIPTOR_RENDERER_WORKPACKAGE_DOC: string;
export declare const RMT_DOM_RENDERER_DIAGNOSTIC_SCHEMA: string;
export declare const TRUSTED_DOM_BOUNDARY: string;
export declare function createRmtDomDescriptorRendererPlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createRmtDomDescriptorRendererReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateRmtDomDescriptorRendererPlan(plan?: unknown): XtendCatalogReport;
