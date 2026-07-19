import type {
  AppServiceStreamFrameInput,
  AppServiceTransport,
  AppServiceTransportRequest
} from '../xtend-maraca/app-services';
import type {
  XScalerHostCapabilities,
  XScalerPreflightRequest,
  XScalerRemoteSurfacePlan
} from './protocol';
import type {
  XScalerRemoteAdapterLoader,
  XScalerRemoteAdapterLoaderOptions,
  XScalerRemoteAdapterLoaderSnapshot
} from './remote-adapter-loader';

export declare const MARACA_APP_SERVICE_TRANSPORT_SCHEMA: 'xtend.maraca.app-service-transport.v1';
export declare const XSCALER_APP_SERVICE_TRANSPORT_SCHEMA: 'xtend.xscaler.app-service-transport.v1';
export declare const XSCALER_APP_SERVICE_TARGET_REQUIRED_CODE: 'xscaler.app-service.remote_surface_required';
export declare const XSCALER_APP_SERVICE_CONFIG_MISSING_CODE: 'xscaler.app-service.config_missing';
export declare const XSCALER_APP_SERVICE_ATTACH_REFUSED_CODE: 'xscaler.app-service.attach_refused';
export declare const XSCALER_APP_SERVICE_OPERATION_FAILED_CODE: 'xscaler.app-service.operation_failed';
export declare const XSCALER_APP_SERVICE_CANCELLED_CODE: 'xscaler.app-service.cancelled';
export declare const XSCALER_APP_SERVICE_DISPOSED_CODE: 'xscaler.app-service.disposed';

export interface XScalerAppServiceRemoteConfig {
  remoteSurfacePlan: XScalerRemoteSurfacePlan;
  adapterUrl: string;
  sessionId?: string | ((request: AppServiceTransportRequest) => string);
  preflightRequest?: Partial<XScalerPreflightRequest> & Record<string, unknown>;
  hostCapabilities?: XScalerHostCapabilities;
  remoteSecurityReport?: Record<string, unknown>;
  degradationReport?: Record<string, unknown>;
  nonce?: string;
  hostContext?: unknown;
}

export type XScalerAppServiceRemoteConfigResolver = (
  request: AppServiceTransportRequest
) => XScalerAppServiceRemoteConfig | null | undefined | Promise<XScalerAppServiceRemoteConfig | null | undefined>;

export interface XScalerAppServiceTransportOptions {
  services?: Readonly<Record<string, XScalerAppServiceRemoteConfig | XScalerAppServiceRemoteConfigResolver>>;
  remoteServices?: Readonly<Record<string, XScalerAppServiceRemoteConfig | XScalerAppServiceRemoteConfigResolver>>;
  resolveService?: XScalerAppServiceRemoteConfigResolver;
  loader?: XScalerRemoteAdapterLoader;
  loaderOptions?: XScalerRemoteAdapterLoaderOptions;
  disposeLoader?: boolean;
}

export interface XScalerAppServiceTransportSnapshot {
  readonly schema: typeof XSCALER_APP_SERVICE_TRANSPORT_SCHEMA;
  readonly kind: 'xscaler-remote-surface';
  readonly disposed: boolean;
  readonly activeCount: number;
  readonly configuredServiceIds: string[];
  readonly ownsLoader: boolean;
  readonly runtimeBoundary: {
    readonly remoteSurfaceOnly: true;
    readonly remoteRuntimeExecution: false;
    readonly kernelRemoteExecution: false;
  };
  readonly loader: XScalerRemoteAdapterLoaderSnapshot | null;
}

export class XScalerAppServiceTransportError extends Error {
  constructor(message: string, options?: { code?: string; details?: Record<string, unknown>; fallback?: unknown });
  readonly code: string;
  readonly details: Readonly<Record<string, unknown>>;
  readonly fallback: unknown;
}

export interface XScalerAppServiceTransport extends AppServiceTransport {
  readonly schema: typeof MARACA_APP_SERVICE_TRANSPORT_SCHEMA;
  readonly xscalerSchema: typeof XSCALER_APP_SERVICE_TRANSPORT_SCHEMA;
  readonly kind: 'xscaler-remote-surface';
  invoke<TInput = unknown, TOutput = unknown>(request: AppServiceTransportRequest<TInput> & { target: 'remote-surface' }): Promise<TOutput>;
  stream<TInput = unknown, TValue = unknown>(request: AppServiceTransportRequest<TInput> & { target: 'remote-surface' }): AsyncIterable<AppServiceStreamFrameInput<TValue>>;
  dispose(reason?: string): boolean;
  snapshot(): XScalerAppServiceTransportSnapshot;
  whenDisposed(): Promise<XScalerRemoteAdapterLoaderSnapshot | null>;
}

export declare function createXScalerAppServiceTransport(options?: XScalerAppServiceTransportOptions): XScalerAppServiceTransport;
