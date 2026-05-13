export * from '../fabric/xtend-policy-public-types';
import type {
  XtendPolicyConstant,
  XtendPolicyOptions,
  XtendPolicyReport
} from '../fabric/xtend-policy-public-types';

export interface XtendRuntimeA11yContract {
  schema: string;
  componentRef: string;
  domains: Record<string, unknown>;
  screenreader: Record<string, unknown>;
  motion: Record<string, unknown>;
  contrast: Record<string, unknown>;
  states: Record<string, unknown>;
  keyboard: Record<string, unknown>;
  focus: Record<string, unknown>;
  fabric: Record<string, unknown>;
  rmt: Record<string, unknown>;
  compatibility: Record<string, unknown>;
  [key: string]: unknown;
}

export declare const RUNTIME_A11Y_CONTRACT_SCHEMA: XtendPolicyConstant<string>;
export declare const RUNTIME_A11Y_REPORT_SCHEMA: XtendPolicyConstant<string>;
export declare const RUNTIME_A11Y_WORKPACKAGE: XtendPolicyConstant<string>;
export declare const RUNTIME_A11Y_CONTRACT_DOC: XtendPolicyConstant<string>;
export declare const COMPONENT_SHELL_CONTRACT_SCHEMA: XtendPolicyConstant<string>;
export declare const COMPONENT_STYLING_CONTRACT_SCHEMA: XtendPolicyConstant<string>;
export declare const A11Y_COMPONENT_CONTRACT_SCHEMA: XtendPolicyConstant<string>;
export declare const SCREENREADER_SIGNALS_SCHEMA: XtendPolicyConstant<string>;
export declare const MOTION_CONTRAST_POLICY_SCHEMA: XtendPolicyConstant<string>;
export declare const RMT_A11Y_AUTHORING_SCHEMA: XtendPolicyConstant<string>;
export declare const FABRIC_BOUNDARY_SCHEMA: XtendPolicyConstant<string>;
export declare const KERNEL_BOUNDARY: XtendPolicyConstant<string>;
export declare const RUNTIME_A11Y_REQUIRED_DOMAINS: XtendPolicyConstant<string[]>;
export declare const RUNTIME_A11Y_PROFILES: XtendPolicyConstant<string[]>;
export declare const RUNTIME_A11Y_REQUIRED_ASSERTIONS: XtendPolicyConstant<string[]>;
export declare const RUNTIME_A11Y_REQUIRED_STATES: XtendPolicyConstant<string[]>;
export declare const RUNTIME_A11Y_KEYBOARD_KEYS: XtendPolicyConstant<string[]>;
export declare const RUNTIME_A11Y_FOCUS_BEHAVIORS: XtendPolicyConstant<string[]>;
export declare const RUNTIME_A11Y_LIVE_REGION_MODES: XtendPolicyConstant<string[]>;
export declare function createRuntimeA11yContract(options?: XtendPolicyOptions): XtendRuntimeA11yContract;
export declare function validateRuntimeA11yContract(contract: unknown): XtendPolicyReport;
