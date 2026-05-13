export * from '../fabric/xtend-policy-public-types';
import type {
  XtendPolicyConstant,
  XtendPolicyOptions,
  XtendPolicyReport
} from '../fabric/xtend-policy-public-types';

export interface XtendMotionContrastPolicy {
  schema: string;
  componentRef: string;
  motion: Record<string, unknown>;
  contrast: Record<string, unknown>;
  fabric: Record<string, unknown>;
  requiredCss: string[];
  testRefs: string[];
  boundaries: Record<string, unknown>;
  [key: string]: unknown;
}

export declare const CONTRACTS: XtendPolicyConstant<Record<string, string>>;
export declare const MOTION_CONTRAST_POLICY_SCHEMA: XtendPolicyConstant<string>;
export declare const MOTION_POLICY_SCHEMA: XtendPolicyConstant<string>;
export declare const CONTRAST_POLICY_SCHEMA: XtendPolicyConstant<string>;
export declare const MOTION_CONTRAST_TEST_SCHEMA: XtendPolicyConstant<string>;
export declare const MOTION_MEDIA_QUERY: XtendPolicyConstant<string>;
export declare const CONTRAST_MEDIA_QUERY: XtendPolicyConstant<string>;
export declare const PROFILE_POLICY_DEFAULTS: XtendPolicyConstant<Record<string, unknown>>;
export declare const SYSTEM_COLOR_TOKENS: XtendPolicyConstant<string[]>;
export declare const FABRIC_A11Y_PREFERENCE: XtendPolicyConstant<Record<string, unknown>>;
export declare function createMotionContrastPolicy(options?: XtendPolicyOptions): XtendMotionContrastPolicy;
export declare function normalizeMotionContrastPolicy(input?: XtendPolicyOptions | XtendMotionContrastPolicy): XtendMotionContrastPolicy;
export declare function validateMotionContrastPolicy(input?: XtendPolicyOptions | XtendMotionContrastPolicy): XtendPolicyReport<XtendMotionContrastPolicy>;
