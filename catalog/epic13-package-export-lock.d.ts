import type {
  XtendCatalogConstant,
  XtendCatalogGate,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const EPIC13_PACKAGE_DRY_RUN_ARTIFACT_SCHEMA: string;
export declare const EPIC13_PACKAGE_EXPORT_LOCK_CAPTURE_SCRIPT: XtendCatalogConstant;
export declare const EPIC13_PACKAGE_EXPORT_LOCK_CONTRACT: string;
export declare const EPIC13_PACKAGE_EXPORT_LOCK_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const EPIC13_PACKAGE_EXPORT_LOCK_LOCAL_GATE: string;
export declare const EPIC13_PACKAGE_EXPORT_LOCK_MODULE: string;
export declare const EPIC13_PACKAGE_EXPORT_LOCK_PACKAGE_SCRIPT: string;
export declare const EPIC13_PACKAGE_EXPORT_LOCK_REPORT_SCHEMA: string;
export declare const EPIC13_PACKAGE_EXPORT_LOCK_SCHEMA: string;
export declare const EPIC13_PACKAGE_EXPORT_LOCK_STATUS: string;
export declare const EPIC13_PACKAGE_EXPORT_LOCK_STEERING: XtendCatalogConstant;
export declare const EPIC13_PACKAGE_EXPORT_LOCK_SUITE: string;
export declare const EPIC13_PACKAGE_EXPORT_LOCK_TARGET: string;
export declare const EPIC13_PACKAGE_EXPORT_LOCK_WORKPACKAGE: string;
export declare const EPIC13_PACKAGE_EXPORT_LOCK_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare const EPIC13_PACKAGE_EXPORT_SURFACE_SCHEMA: string;
export declare const EXPECTED_EXPORT_KEYS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const EXPECTED_SCOPED_PACKAGES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const PACKAGE_DRY_RUN_ARTIFACT: XtendCatalogConstant;
export declare const PACKAGE_DRY_RUN_COMMAND: XtendCatalogConstant;
export declare const PACKAGE_DRY_RUN_JSON_COMMAND: XtendCatalogConstant;
export declare const PACKAGE_EXPORT_LOCK_REPORT_ARTIFACT: string;
export declare const PACKAGE_EXPORT_SURFACE_ARTIFACT: XtendCatalogConstant;
export declare const PUBLISH_BOUNDARY: XtendCatalogConstant;
export declare const REQUIRED_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_PACK_ROOTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const SURFACE_GROUPS: XtendCatalogConstant;
export declare function createEpic13PackageExportLockPlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createEpic13PackageExportLockReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function createPackDryRunArtifactSummary(options?: XtendCatalogOptions): XtendCatalogRecord;
export declare function createPackageExportSurfaceSnapshot(options?: XtendCatalogOptions): XtendCatalogRecord;
export declare function validateEpic13PackageExportLockPlan(plan?: unknown): XtendCatalogReport;
