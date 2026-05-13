export * from '../fabric/xtend-policy-public-types';
import type {
  XtendA11ySignal,
  XtendPolicyConstant,
  XtendPolicyFunction,
  XtendPolicyOptions,
  XtendPolicyReport
} from '../fabric/xtend-policy-public-types';

export interface XtendScreenreaderSignalContract {
  schema: string;
  componentRef: string;
  liveRegion: string;
  signals: XtendA11ySignal[];
  statusRegions: unknown[];
  errorRegions: unknown[];
  announcementPolicy: Record<string, unknown>;
  fabric: Record<string, unknown>;
  requiredAssertions: string[];
  [key: string]: unknown;
}

export declare const CONTRACTS: XtendPolicyConstant<Record<string, string>>;
export declare const FABRIC_A11Y_ANNOUNCEMENT: XtendPolicyConstant<Record<string, unknown>>;
export declare const LIVE_REGION_POLICIES: XtendPolicyConstant<Record<string, unknown>>;
export declare const SCREENREADER_SIGNALS_SCHEMA: XtendPolicyConstant<string>;
export declare const SCREENREADER_SIGNAL_DEFINITIONS: XtendPolicyConstant<Record<string, unknown>>;
export declare const SCREENREADER_SIGNAL_RECORD_SCHEMA: XtendPolicyConstant<string>;
export declare function createScreenreaderSignal(signal: string, options?: XtendPolicyOptions): XtendA11ySignal;
export declare function createScreenreaderSignalContract(componentRef?: string, options?: XtendPolicyOptions): XtendScreenreaderSignalContract;
export declare const normalizeLiveRegion: XtendPolicyFunction<string>;
export declare function validateScreenreaderSignalContract(contract: unknown): XtendPolicyReport;
