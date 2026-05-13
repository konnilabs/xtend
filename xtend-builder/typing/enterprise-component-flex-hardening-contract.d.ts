import type { XtendBuilderRecord, XtendBuilderReport } from '../builder-public-types';

export declare const ENTERPRISE_COMPONENT_FLEX_HARDENING_SCHEMA: string;
export declare const ENTERPRISE_COMPONENT_FLEX_HARDENING_REPORT_SCHEMA: string;
export declare const ENTERPRISE_COMPONENT_FLEX_HARDENING_WORKPACKAGE: string;
export declare const ENTERPRISE_COMPONENT_FLEX_HARDENING_CONTRACT_DOC: string;
export declare const SIGNATURE_UI_DIRECTION_SCHEMA: string;
export declare const COMPONENT_SHELL_CONTRACT_SCHEMA: string;
export declare const COMPONENT_STYLING_CONTRACT_SCHEMA: string;
export declare const RUNTIME_A11Y_CONTRACT_SCHEMA: string;
export declare const KERNEL_BOUNDARY: string;
export declare const FLEX_HARDENING_RULE_IDS: readonly string[];
export declare const FLEX_HARDENING_REQUIRED_DOMAINS: readonly string[];
export declare const FLEX_HARDENING_THEME_MODES: readonly string[];
export declare const FLEX_HARDENING_TYPOGRAPHY_ROLES: readonly string[];
export declare const FLEX_HARDENING_XHEADER_MENU_MODES: readonly string[];
export declare const FLEX_HARDENING_REQUIRED_GATES: readonly string[];

export declare function createEnterpriseComponentFlexHardeningContract(input?: XtendBuilderRecord): XtendBuilderRecord;
export declare function validateEnterpriseComponentFlexHardeningContract(contract?: unknown): XtendBuilderReport<XtendBuilderRecord>;
