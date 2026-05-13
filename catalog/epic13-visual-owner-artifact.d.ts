import type {
  XtendCatalogConstant,
  XtendCatalogGate,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const DETERMINISTIC_VIEWPORTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const EPIC13_VISUAL_OWNER_ARTIFACT_CONTRACT: string;
export declare const EPIC13_VISUAL_OWNER_ARTIFACT_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const EPIC13_VISUAL_OWNER_ARTIFACT_LOCAL_GATE: string;
export declare const EPIC13_VISUAL_OWNER_ARTIFACT_MANIFEST_SCHEMA: string;
export declare const EPIC13_VISUAL_OWNER_ARTIFACT_MODULE: string;
export declare const EPIC13_VISUAL_OWNER_ARTIFACT_PACKAGE_SCRIPT: string;
export declare const EPIC13_VISUAL_OWNER_ARTIFACT_REPORT_SCHEMA: string;
export declare const EPIC13_VISUAL_OWNER_ARTIFACT_SCHEMA: string;
export declare const EPIC13_VISUAL_OWNER_ARTIFACT_STATUS: string;
export declare const EPIC13_VISUAL_OWNER_ARTIFACT_STEERING: XtendCatalogConstant;
export declare const EPIC13_VISUAL_OWNER_ARTIFACT_SUITE: string;
export declare const EPIC13_VISUAL_OWNER_ARTIFACT_TARGET: string;
export declare const EPIC13_VISUAL_OWNER_ARTIFACT_WORKPACKAGE: string;
export declare const EPIC13_VISUAL_OWNER_ARTIFACT_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare const PUBLISH_BOUNDARY: XtendCatalogConstant;
export declare const REQUIRED_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_SOURCE_GATES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const VISUAL_OWNER_ARTIFACT_MANIFEST: XtendCatalogConstant;
export declare const VISUAL_OWNER_ARTIFACT_PATH_TEMPLATE: XtendCatalogConstant;
export declare const VISUAL_OWNER_ARTIFACT_REPORT: XtendCatalogConstant;
export declare const VISUAL_OWNER_ARTIFACT_ROOT: XtendCatalogConstant;
export declare function createEpic13VisualOwnerArtifactPlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createEpic13VisualOwnerArtifactReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateEpic13VisualOwnerArtifactPlan(plan?: unknown): XtendCatalogReport;
