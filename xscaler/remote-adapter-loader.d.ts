import type {
  XScalerAtcHandoff,
  XScalerDiagnostic,
  XScalerHostCapabilities,
  XScalerPreflightEvaluationInput,
  XScalerPreflightRequest,
  XScalerPreflightResponse,
  XScalerRemoteSurfacePlan,
  XScalerRuntimeBoundary
} from './protocol';

export declare const XSCALER_REMOTE_ADAPTER_LOADER_SCHEMA: 'xtend.xscaler.remote-adapter-loader.v1';
export declare const XSCALER_REMOTE_ADAPTER_LOAD_RESULT_SCHEMA: 'xtend.xscaler.remote-adapter-load-result.v1';
export declare const XSCALER_REMOTE_ADAPTER_SESSION_SCHEMA: 'xtend.xscaler.remote-adapter-session.v1';
export declare const XSCALER_REMOTE_ADAPTER_LOADER_SNAPSHOT_SCHEMA: 'xtend.xscaler.remote-adapter-loader-snapshot.v1';
export declare const XSCALER_REMOTE_ADAPTER_REGISTRATION_SCHEMA: 'xtend.xscaler.remote-adapter-registration.v1';

export declare const XSCALER_REMOTE_SURFACE_REQUIRED_CODE: 'xscaler.loader.remote_surface_required';
export declare const XSCALER_REMOTE_URL_INVALID_CODE: 'xscaler.loader.remote_url_invalid';
export declare const XSCALER_REMOTE_ORIGIN_MISMATCH_CODE: 'xscaler.loader.origin_mismatch';
export declare const XSCALER_REMOTE_INTEGRITY_INVALID_CODE: 'xscaler.loader.integrity_invalid';
export declare const XSCALER_REMOTE_PREFLIGHT_INVALID_CODE: 'xscaler.loader.preflight_invalid';
export declare const XSCALER_REMOTE_PREFLIGHT_REJECTED_CODE: 'xscaler.loader.preflight_rejected';
export declare const XSCALER_REMOTE_LOADER_UNSAFE_CODE: 'xscaler.loader.external_loader_unsafe';
export declare const XSCALER_REMOTE_LOAD_FAILED_CODE: 'xscaler.loader.load_failed';
export declare const XSCALER_REMOTE_ADAPTER_INVALID_CODE: 'xscaler.loader.adapter_invalid';
export declare const XSCALER_REMOTE_LIFECYCLE_FAILED_CODE: 'xscaler.loader.lifecycle_failed';
export declare const XSCALER_REMOTE_SESSION_NOT_FOUND_CODE: 'xscaler.loader.session_not_found';
export declare const XSCALER_REMOTE_SESSION_ACTIVE_CODE: 'xscaler.loader.session_active';
export declare const XSCALER_REMOTE_SESSION_ID_CONFLICT_CODE: 'xscaler.loader.session_id_conflict';
export declare const XSCALER_REMOTE_OPERATION_INVALID_CODE: 'xscaler.loader.operation_invalid';
export declare const XSCALER_REMOTE_OPERATION_FAILED_CODE: 'xscaler.loader.operation_failed';
export declare const XSCALER_REMOTE_CANCELLED_CODE: 'xscaler.loader.cancelled';
export declare const XSCALER_REMOTE_LOADER_DISPOSED_CODE: 'xscaler.loader.disposed';
export declare const XSCALER_REMOTE_FALLBACK_ACTIVATION_FAILED_CODE: 'xscaler.loader.fallback_activation_failed';

export type XScalerRemoteAdapterSessionState = 'preflight' | 'loading' | 'attached' | 'refused' | 'failed' | 'cancelled' | 'detached' | 'disposed';
export type XScalerRemoteAdapterResultStatus = 'attached' | 'refused' | 'failed' | 'cancelled' | 'detached' | 'disposed';

export interface XScalerRemoteAdapterLifecycleContext {
  surfaceId: string;
  sessionId: string;
  remoteSurfacePlan: XScalerRemoteSurfacePlan;
  preflight: XScalerPreflightResponse | null;
  signal: AbortSignal;
  reason?: string;
  hostContext?: unknown;
}

export interface XScalerRemoteAdapter {
  attach(context: XScalerRemoteAdapterLifecycleContext): unknown | Promise<unknown>;
  cancel(context: XScalerRemoteAdapterLifecycleContext): unknown | Promise<unknown>;
  detach(context: XScalerRemoteAdapterLifecycleContext): unknown | Promise<unknown>;
  dispose(context: XScalerRemoteAdapterLifecycleContext): unknown | Promise<unknown>;
  invoke?<TInput = unknown, TOutput = unknown>(request: XScalerRemoteAdapterOperationRequest<TInput>, context: XScalerRemoteAdapterLifecycleContext): TOutput | Promise<TOutput>;
  stream?<TInput = unknown, TValue = unknown>(request: XScalerRemoteAdapterOperationRequest<TInput>, context: XScalerRemoteAdapterLifecycleContext): AsyncIterable<TValue> | Promise<AsyncIterable<TValue>>;
}

export interface XScalerRemoteAdapterOperationRequest<TInput = unknown> {
  serviceId?: string;
  kind?: string;
  target?: string;
  input: TInput;
  invocationId?: string;
  correlationId?: string;
  signal: AbortSignal;
  context?: Record<string, unknown>;
}

export interface XScalerExternalLoaderCapabilities {
  cspSafe: true;
  sri: true;
  externalOnly: true;
}

export interface XScalerExternalModuleDescriptor {
  schema: typeof XSCALER_REMOTE_ADAPTER_LOADER_SCHEMA;
  url: string;
  integrity: string;
  crossOrigin: 'anonymous';
  referrerPolicy: 'no-referrer';
  nonce: string;
  surfaceId: string;
  sessionId: string;
  signal: AbortSignal;
  runtimeBoundary: XScalerRuntimeBoundary & {
    networkRequiredByKernel: false;
  };
}

export interface XScalerExternalModuleHandle {
  adapter?: XScalerRemoteAdapter;
  element?: Element;
  remove?(): void;
}

export interface XScalerRemoteAdapterRegistration {
  readonly schema?: typeof XSCALER_REMOTE_ADAPTER_REGISTRATION_SCHEMA;
  readonly sessionId?: string;
  readonly surfaceId: string;
  readonly adapter: XScalerRemoteAdapter;
}

export interface XScalerSurfaceFallbackActivation {
  readonly schema: 'xtend.xscaler.surface-fallback-activation.v1';
  readonly status: 'refused' | 'failed';
  readonly surfaceId: string;
  readonly fallbackSurface: string;
  readonly sessionId: string;
  readonly remoteSurfacePlan: XScalerRemoteSurfacePlan | null;
  readonly preflight: XScalerPreflightResponse | null;
  readonly hostContext: unknown;
  readonly diagnostics: XScalerDiagnostic[];
}

export interface XScalerExternalAdapterLoader {
  (descriptor: XScalerExternalModuleDescriptor): XScalerRemoteAdapter | XScalerExternalModuleHandle | Promise<XScalerRemoteAdapter | XScalerExternalModuleHandle>;
  readonly xscalerCapabilities?: XScalerExternalLoaderCapabilities;
}

export interface XScalerRemoteAdapterLoaderOptions {
  preflight?(input: XScalerPreflightEvaluationInput & { signal: AbortSignal }): XScalerPreflightResponse | Promise<XScalerPreflightResponse>;
  hostCapabilities?: XScalerHostCapabilities;
  loadExternalAdapter?: XScalerExternalAdapterLoader;
  externalLoaderCapabilities?: XScalerExternalLoaderCapabilities;
  resolveAdapter?(context: {
    surfaceId: string;
    sessionId: string;
    remoteSurfacePlan: XScalerRemoteSurfacePlan;
    loadResult: unknown;
  }): XScalerRemoteAdapter | null | undefined;
  documentTarget?: Document;
  registrationTarget?: object;
  activateFallback?(activation: XScalerSurfaceFallbackActivation): unknown | Promise<unknown>;
  nonce?: string;
}

export interface XScalerRemoteAdapterAttachInput {
  remoteSurfacePlan: XScalerRemoteSurfacePlan;
  adapterUrl: string;
  sessionId?: string;
  request?: Partial<XScalerPreflightRequest> & Record<string, unknown>;
  hostCapabilities?: XScalerHostCapabilities;
  remoteSecurityReport?: Record<string, unknown>;
  degradationReport?: Record<string, unknown>;
  nonce?: string;
  hostContext?: unknown;
}

export interface XScalerRemoteAdapterSessionSnapshot {
  schema: typeof XSCALER_REMOTE_ADAPTER_SESSION_SCHEMA;
  id: string;
  surfaceId: string;
  state: XScalerRemoteAdapterSessionState;
  adapterUrl: string;
  integrity: string;
  preflightAccepted: boolean;
  loadAttempted: boolean;
  loaded: boolean;
  adapterExecutionAttempted: boolean;
  adapterAttached: boolean;
  adapterDisposed: boolean;
  fallbackActivationAttempted: boolean;
  fallbackActivated: boolean;
  runtimeBoundary: XScalerRuntimeBoundary & {
    networkRequiredByKernel: false;
  };
  diagnostics: XScalerDiagnostic[];
}

export interface XScalerRemoteAdapterLoadResult {
  schema: typeof XSCALER_REMOTE_ADAPTER_LOAD_RESULT_SCHEMA;
  ok: boolean;
  status: XScalerRemoteAdapterResultStatus;
  surfaceId: string;
  sessionId: string;
  preflight: XScalerPreflightResponse | null;
  loadAttempted: boolean;
  loaded: boolean;
  adapterExecuted: boolean;
  atc: XScalerAtcHandoff;
  runtimeBoundary: XScalerRuntimeBoundary & {
    networkRequiredByKernel: false;
  };
  diagnostics: XScalerDiagnostic[];
  session: XScalerRemoteAdapterSessionSnapshot | null;
}

export interface XScalerRemoteAdapterLoaderSnapshot {
  schema: typeof XSCALER_REMOTE_ADAPTER_LOADER_SNAPSHOT_SCHEMA;
  loaderSchema: typeof XSCALER_REMOTE_ADAPTER_LOADER_SCHEMA;
  disposed: boolean;
  status: 'ready' | 'disposed';
  sessionCount: number;
  registeredAdapterCount: number;
  counters: {
    preflight: number;
    accepted: number;
    rejected: number;
    loadAttempts: number;
    loaded: number;
    attached: number;
    cancelled: number;
    detached: number;
    disposed: number;
  };
  runtimeBoundary: XScalerRuntimeBoundary & {
    remoteSurfaceOnly: true;
    networkRequiredByKernel: false;
  };
  sessions: XScalerRemoteAdapterSessionSnapshot[];
  history: Array<{
    status: string;
    surfaceId: string;
    sessionId: string;
    loadAttempted: boolean;
    loaded: boolean;
  }>;
}

export interface XScalerRemoteAdapterLoader {
  readonly schema: typeof XSCALER_REMOTE_ADAPTER_LOADER_SCHEMA;
  attach(input: XScalerRemoteAdapterAttachInput): Promise<XScalerRemoteAdapterLoadResult>;
  invoke<TInput = unknown, TOutput = unknown>(reference: string | { sessionId?: string; id?: string; surfaceId?: string; surface?: string }, request: XScalerRemoteAdapterOperationRequest<TInput>): Promise<TOutput>;
  stream<TInput = unknown, TValue = unknown>(reference: string | { sessionId?: string; id?: string; surfaceId?: string; surface?: string }, request: XScalerRemoteAdapterOperationRequest<TInput>): Promise<AsyncIterable<TValue>>;
  cancel(reference: string | { sessionId?: string; id?: string; surfaceId?: string; surface?: string }, reason?: string): Promise<XScalerRemoteAdapterLoadResult>;
  detach(reference: string | { sessionId?: string; id?: string; surfaceId?: string; surface?: string }, reason?: string): Promise<XScalerRemoteAdapterLoadResult>;
  dispose(reason?: string): Promise<XScalerRemoteAdapterLoaderSnapshot>;
  registerAdapter(surfaceReference: string, adapter: XScalerRemoteAdapter): boolean;
  unregisterAdapter(surfaceReference: string): boolean;
  snapshot(): XScalerRemoteAdapterLoaderSnapshot;
  listSessions(): XScalerRemoteAdapterSessionSnapshot[];
}

export declare function registerXScalerRemoteAdapter(registration: XScalerRemoteAdapterRegistration, target?: object): boolean;
export declare function createBrowserExternalModuleLoader(options?: Pick<XScalerRemoteAdapterLoaderOptions, 'documentTarget' | 'registrationTarget'>): XScalerExternalAdapterLoader;
export declare function createXScalerRemoteAdapterLoader(options?: XScalerRemoteAdapterLoaderOptions): XScalerRemoteAdapterLoader;
