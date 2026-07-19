export declare const XSCALER_PUBLIC_PROTOCOL_SCHEMA: 'xtend.xscaler.public-protocol.v1';
export declare const XSCALER_ATC_HANDOFF_SCHEMA: 'xtend.xscaler.atc-handoff.v1';
export declare const XSCALER_PREFLIGHT_REQUEST_SCHEMA: 'xtend.xscaler.preflight-request.v1';
export declare const XSCALER_PREFLIGHT_RESPONSE_SCHEMA: 'xtend.xscaler.preflight-response.v1';
export declare const XSCALER_REMOTE_SURFACE_PLAN_SCHEMA: 'xtend.xscaler.remote-surface-plan.v1';
export declare const XSCALER_XTENSION_DEPLOYMENT_SCHEMA: 'xtend.xscaler.xtension-deployment.v1';
export declare const XSCALER_PROTOCOL: 'xscaler';

export declare const XSCALER_ORIGIN_BLOCKED_CODE: 'xscaler.preflight.origin_blocked';
export declare const XSCALER_INTEGRITY_MISSING_CODE: 'xscaler.preflight.integrity_missing';
export declare const XSCALER_SSR_NETWORK_DENIED_CODE: 'xscaler.preflight.ssr_network_denied';
export declare const XSCALER_FALLBACK_MISSING_CODE: 'xscaler.preflight.fallback_missing';
export declare const XSCALER_XTENSION_DENIED_CODE: 'xscaler.preflight.xtension_denied';
export declare const XSCALER_CAPABILITY_MISMATCH_CODE: 'xscaler.preflight.capability_mismatch';

export type XScalerJsonPrimitive = string | number | boolean | null;
export type XScalerJsonValue = XScalerJsonPrimitive | XScalerJsonValue[] | { [key: string]: XScalerJsonValue };
export type XScalerPreflightCapability = 'remote-surface-plan' | 'ssr-compatible' | 'xtension-deployment' | string;
export type XScalerAtcSignal = 'attach' | 'cancel' | 'detach' | 'dispose' | 'refuse' | string;
export type XScalerAtcLifecycleState = 'planned' | 'loading' | 'attached' | 'cancelled' | 'detached' | 'disposed' | 'refused' | 'failed' | string;

export interface XScalerDiagnostic {
  code: string;
  severity: 'error' | 'warning' | 'info' | string;
  message: string;
  [key: string]: unknown;
}

export interface XScalerRuntimeBoundary {
  remoteRuntimeExecution: false;
  kernelRemoteExecution: false;
  networkRequiredByKernel?: false;
  networkRequiredByHandoff?: false;
}

export interface XScalerPreflightHost {
  runtime: string;
  ssr: boolean;
  xtensions: string[];
  [key: string]: XScalerJsonValue | undefined;
}

export interface XScalerPreflightConstraints {
  allowNetworkDuringSsr: boolean;
  maxHydrationMs?: number;
  [key: string]: XScalerJsonValue | undefined;
}

export interface XScalerPreflightRequest {
  schema: typeof XSCALER_PREFLIGHT_REQUEST_SCHEMA;
  protocol: typeof XSCALER_PROTOCOL;
  requestId: string;
  surface: string;
  host: XScalerPreflightHost;
  capabilities: XScalerPreflightCapability[];
  constraints: XScalerPreflightConstraints;
}

export interface XScalerIntegrity {
  algorithm: 'sha256' | 'sha384' | 'sha512' | string;
  digest: string;
}

export interface XScalerRemoteSurfaceLane {
  lane: string;
  target: string;
}

export interface XScalerRemoteSurfacePlan {
  schema: typeof XSCALER_REMOTE_SURFACE_PLAN_SCHEMA;
  protocol: typeof XSCALER_PROTOCOL;
  surface: string;
  surfaceId: string;
  owner: string;
  origin: string;
  integrity: XScalerIntegrity;
  fallbackSurface: string;
  lanes: XScalerRemoteSurfaceLane[];
  ssr: {
    mode: string;
    networkDuringRender: boolean;
  };
  runtimeBoundary: XScalerRuntimeBoundary & {
    networkRequiredByKernel: false;
  };
}

export interface XScalerAtcHandoff {
  schema: typeof XSCALER_ATC_HANDOFF_SCHEMA;
  protocol: typeof XSCALER_PROTOCOL;
  surfaceId: string;
  sessionId: string;
  handoffSignal: XScalerAtcSignal;
  lifecycleState: XScalerAtcLifecycleState;
  accepted: boolean;
  ok: boolean;
  status: string;
  fallback: XScalerJsonValue | null;
  runtimeBoundary: XScalerRuntimeBoundary & {
    networkRequiredByHandoff: false;
  };
  diagnostics: XScalerDiagnostic[];
}

export interface XScalerPreflightRejection {
  code: string;
  message: string;
}

export interface XScalerPreflightResponse {
  schema: typeof XSCALER_PREFLIGHT_RESPONSE_SCHEMA;
  protocol: typeof XSCALER_PROTOCOL;
  requestId: string;
  accepted: boolean;
  ok: boolean;
  surface: string;
  compatibility: {
    ssr: string;
    remoteSurfacePlan: string;
    xtensionDeployment: string;
  };
  requiredAnchors: string[];
  remoteSurfacePlan: XScalerRemoteSurfacePlan | null;
  atc: XScalerAtcHandoff;
  rejection: XScalerPreflightRejection | null;
  diagnostics: XScalerDiagnostic[];
}

export interface XScalerXtensionDeployment {
  schema: typeof XSCALER_XTENSION_DEPLOYMENT_SCHEMA;
  protocol: typeof XSCALER_PROTOCOL;
  deploymentId: string;
  xtension: string;
  surface: string;
  remoteSurfacePlan: string;
  rollout: {
    strategy: string;
    percent: number;
    [key: string]: XScalerJsonValue | undefined;
  };
  ssr: {
    hydrateAfterPreflight: boolean;
    requiresDom: boolean;
  };
  accepted: boolean;
}

export interface XScalerHostCapabilities {
  allowedOrigins?: string[];
  origins?: string[];
  allowXtensionDeployment?: boolean;
  [key: string]: unknown;
}

export interface XScalerPreflightEvaluationInput {
  request?: Partial<XScalerPreflightRequest> & Record<string, unknown>;
  remoteSurfacePlan?: Partial<XScalerRemoteSurfacePlan> & Record<string, unknown>;
  remoteManifest?: Record<string, unknown>;
  remoteSecurityReport?: { diagnostics?: XScalerDiagnostic[] } & Record<string, unknown>;
  degradationReport?: { diagnostics?: XScalerDiagnostic[] } & Record<string, unknown>;
  hostCapabilities?: XScalerHostCapabilities;
}

export declare function createXScalerPreflightRequest(input?: Partial<XScalerPreflightRequest> & Record<string, unknown>): XScalerPreflightRequest;
export declare function createXScalerPreflightResponse(input?: Partial<XScalerPreflightResponse> & Record<string, unknown>): XScalerPreflightResponse;
export declare function createXScalerRemoteSurfacePlan(input?: Partial<XScalerRemoteSurfacePlan> & Record<string, unknown>): XScalerRemoteSurfacePlan;
export declare function createXScalerXtensionDeployment(input?: Partial<XScalerXtensionDeployment> & Record<string, unknown>): XScalerXtensionDeployment;
export declare function createXScalerAtcHandoff(input?: Partial<XScalerAtcHandoff> & Record<string, unknown>): XScalerAtcHandoff;
export declare function evaluateXScalerPreflight(input?: XScalerPreflightEvaluationInput): XScalerPreflightResponse;
