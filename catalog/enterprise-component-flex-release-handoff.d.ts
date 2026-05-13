import type {
  XtendCatalogConstant,
  XtendCatalogOptions,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';

export declare const ADOPTION_RISKS: readonly XtendCatalogRecord[];
export declare const COMPATIBILITY_ALIASES: readonly XtendCatalogRecord[];
export declare const CURRENT_VERSION: string;
export declare const ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_BACKLOG: string;
export declare const ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_DOC: string;
export declare const ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_LOCAL_GATE: string;
export declare const ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_MODULE: string;
export declare const ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_PACKAGE_SCRIPT: string;
export declare const ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_REPORT_SCHEMA: string;
export declare const ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_SCHEMA: string;
export declare const ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_STATUS: string;
export declare const ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_SUITE: string;
export declare const ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_TARGET: string;
export declare const ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_WORKPACKAGE: string;
export declare const MIGRATION_SECTIONS: readonly XtendCatalogRecord[];
export declare const PROPOSED_VERSION: string;
export declare const PUBLISH_BOUNDARY: string;
export declare const RELEASE_CHECKLIST: readonly XtendCatalogConstant[];
export declare const RELEASE_GATES: readonly XtendCatalogConstant[];
export declare const REQUIRED_WORKPACKAGES: readonly XtendCatalogConstant[];
export declare const SEMVER_IMPACTS: readonly XtendCatalogRecord[];
export declare const SOURCE_GATES: readonly XtendCatalogConstant[];
export declare function createEnterpriseComponentFlexReleaseHandoff(options?: XtendCatalogOptions): XtendCatalogRecord;
export declare function createEnterpriseComponentFlexReleaseHandoffReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateEnterpriseComponentFlexReleaseHandoff(handoff?: unknown): XtendCatalogReport;
