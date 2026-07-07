export * from './rmt-tooling-public-types';
import type { RmtToolingConstant, RmtToolingFactory } from './rmt-tooling-public-types';

export declare const XSCALER_ATC_HANDOFF_SCHEMA: RmtToolingConstant;
export declare const XSCALER_CAPABILITY_MISMATCH_CODE: RmtToolingConstant;
export declare const XSCALER_FALLBACK_MISSING_CODE: RmtToolingConstant;
export declare const XSCALER_INTEGRITY_MISSING_CODE: RmtToolingConstant;
export declare const XSCALER_ORIGIN_BLOCKED_CODE: RmtToolingConstant;
export declare const XSCALER_PREFLIGHT_REQUEST_SCHEMA: RmtToolingConstant;
export declare const XSCALER_PREFLIGHT_RESPONSE_SCHEMA: RmtToolingConstant;
export declare const XSCALER_PROTOCOL: RmtToolingConstant;
export declare const XSCALER_REMOTE_SURFACE_PLAN_SCHEMA: RmtToolingConstant;
export declare const XSCALER_SSR_NETWORK_DENIED_CODE: RmtToolingConstant;
export declare const XSCALER_XTENSION_DENIED_CODE: RmtToolingConstant;
export declare const XSCALER_XTENSION_DEPLOYMENT_SCHEMA: RmtToolingConstant;

export declare const createXScalerAtcHandoff: RmtToolingFactory;
export declare const createXScalerPreflightRequest: RmtToolingFactory;
export declare const createXScalerPreflightResponse: RmtToolingFactory;
export declare const createXScalerRemoteSurfacePlan: RmtToolingFactory;
export declare const createXScalerXtensionDeployment: RmtToolingFactory;
export declare const evaluateXScalerPreflight: RmtToolingFactory;
