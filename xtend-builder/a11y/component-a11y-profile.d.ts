import type { XtendBuilderComponentInput, XtendBuilderRecord } from '../builder-public-types';

export declare const A11Y_COMPONENT_CONTRACT_SCHEMA: string;
export declare const A11Y_PROFILE_SCHEMA: string;
export declare const A11Y_MOTION_CONTRAST_POLICY_SCHEMA: string;
export declare const A11Y_MOTION_POLICY_SCHEMA: string;
export declare const A11Y_CONTRAST_POLICY_SCHEMA: string;
export declare const A11Y_MOTION_CONTRAST_TEST_SCHEMA: string;
export declare const A11Y_SCREENREADER_SIGNALS_SCHEMA: string;
export declare const A11Y_SCREENREADER_SIGNAL_RECORD_SCHEMA: string;
export declare const A11Y_TEST_CONTRACT_SCHEMA: string;
export declare const PROFILE_A11Y_RULES: XtendBuilderRecord;
export declare const SCAFFOLD_A11Y_PROFILE_PLAN_SCHEMA: string;
export declare function createComponentA11yProfile(input?: XtendBuilderComponentInput, options?: XtendBuilderRecord): XtendBuilderRecord;
