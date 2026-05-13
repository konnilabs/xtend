import type {
  XtendCatalogConstant,
  XtendCatalogGate,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const COMPLETED_WORKPACKAGES: XtendCatalogConstant;
export declare const EPIC11_ENTERPRISE_UX_HANDOFF_CONTRACT: string;
export declare const EPIC11_ENTERPRISE_UX_HANDOFF_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const EPIC11_ENTERPRISE_UX_HANDOFF_LOCAL_GATE: string;
export declare const EPIC11_ENTERPRISE_UX_HANDOFF_MODULE: string;
export declare const EPIC11_ENTERPRISE_UX_HANDOFF_PACKAGE_SCRIPT: string;
export declare const EPIC11_ENTERPRISE_UX_HANDOFF_REPORT_SCHEMA: string;
export declare const EPIC11_ENTERPRISE_UX_HANDOFF_SCHEMA: string;
export declare const EPIC11_ENTERPRISE_UX_HANDOFF_STATUS: string;
export declare const EPIC11_ENTERPRISE_UX_HANDOFF_SUITE: string;
export declare const EPIC11_ENTERPRISE_UX_HANDOFF_WORKPACKAGE: string;
export declare const EPIC11_ENTERPRISE_UX_HANDOFF_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare const KERNEL_BOUNDARY: XtendCatalogConstant;
export declare const NEXT_WAVE_HANDOFFS: XtendCatalogConstant;
export declare const REQUIRED_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_GATES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare function createEpic11EnterpriseUxHandoffPlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createEpic11EnterpriseUxHandoffReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateEpic11EnterpriseUxHandoffPlan(plan?: unknown): XtendCatalogReport;
