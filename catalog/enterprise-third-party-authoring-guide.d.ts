import type {
  XtendCatalogConstant,
  XtendCatalogOptions,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';

export declare const ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_DOC: string;
export declare const ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_LOCAL_GATE: string;
export declare const ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_MODULE: string;
export declare const ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_PACKAGE_SCRIPT: string;
export declare const ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_REPORT_SCHEMA: string;
export declare const ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_SCHEMA: string;
export declare const ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_SUITE: string;
export declare const ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_WORKPACKAGE: string;
export declare const P0_COMPONENT_REFERENCES: readonly XtendCatalogRecord[];
export declare const REQUIRED_A11Y_MARKERS: readonly XtendCatalogConstant[];
export declare const REQUIRED_DENSITIES: readonly XtendCatalogConstant[];
export declare const REQUIRED_SECTIONS: readonly XtendCatalogConstant[];
export declare const REQUIRED_THEME_MODES: readonly XtendCatalogConstant[];
export declare function createEnterpriseThirdPartyAuthoringGuide(options?: XtendCatalogOptions): XtendCatalogRecord;
export declare function createEnterpriseThirdPartyAuthoringGuideReport(options?: XtendCatalogOptions): XtendCatalogReport;
export declare function validateEnterpriseThirdPartyAuthoringGuide(guide?: unknown): XtendCatalogReport;
