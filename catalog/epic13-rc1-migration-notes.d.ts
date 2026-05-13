import type {
  XtendCatalogConstant,
  XtendCatalogGate,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const CURRENT_VERSION: string;
export declare const EPIC13_RC1_MIGRATION_NOTES_CONTRACT: string;
export declare const EPIC13_RC1_MIGRATION_NOTES_DOCS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const EPIC13_RC1_MIGRATION_NOTES_LOCAL_GATE: string;
export declare const EPIC13_RC1_MIGRATION_NOTES_MODULE: string;
export declare const EPIC13_RC1_MIGRATION_NOTES_PACKAGE_SCRIPT: string;
export declare const EPIC13_RC1_MIGRATION_NOTES_REPORT_ARTIFACT: string;
export declare const EPIC13_RC1_MIGRATION_NOTES_REPORT_SCHEMA: string;
export declare const EPIC13_RC1_MIGRATION_NOTES_SCHEMA: string;
export declare const EPIC13_RC1_MIGRATION_NOTES_STATUS: string;
export declare const EPIC13_RC1_MIGRATION_NOTES_STEERING: XtendCatalogConstant;
export declare const EPIC13_RC1_MIGRATION_NOTES_SUITE: string;
export declare const EPIC13_RC1_MIGRATION_NOTES_TARGET: string;
export declare const EPIC13_RC1_MIGRATION_NOTES_WORKPACKAGE: string;
export declare const EPIC13_RC1_MIGRATION_NOTES_WORKPACKAGE_DOC: XtendCatalogConstant;
export declare const NEXT_DECISION: XtendCatalogConstant;
export declare const NEXT_WORKPACKAGE: string;
export declare const PROPOSED_VERSION: string;
export declare const PUBLISH_BOUNDARY: XtendCatalogConstant;
export declare const REQUIRED_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_CHANGELOG_SECTIONS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_MIGRATION_SECTIONS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_SOURCE_GATES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare function createEpic13Rc1MigrationNotesPlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createEpic13Rc1MigrationNotesReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateEpic13Rc1MigrationNotesPlan(plan?: unknown): XtendCatalogReport;
