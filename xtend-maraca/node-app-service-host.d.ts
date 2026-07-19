import type {
  AppServiceMap,
  AppServiceRegistry,
  AppServiceStreamFrame,
  AppServiceTransport,
  AppServiceWireRequest,
  AppServiceWireResponse,
  AppServicesDefinition
} from './app-services';

export const MARACA_NODE_APP_SERVICE_HOST_SCHEMA: 'xtend.maraca.node-app-service-host.v1';

export interface NodeAppServiceRequest extends AsyncIterable<string | Uint8Array> {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
  once?(event: string, listener: (...args: unknown[]) => void): unknown;
  removeListener?(event: string, listener: (...args: unknown[]) => void): unknown;
}

export interface NodeAppServiceResponse {
  statusCode: number;
  headersSent?: boolean;
  writableEnded?: boolean;
  setHeader?(name: string, value: string): unknown;
  write(chunk: string): boolean;
  end(chunk?: string): unknown;
  once?(event: string, listener: (...args: unknown[]) => void): unknown;
  removeListener?(event: string, listener: (...args: unknown[]) => void): unknown;
}

export interface NodeAppServiceHostOptions<TServices extends AppServiceMap = AppServiceMap> {
  services?: AppServicesDefinition<TServices> | TServices;
  registry?: AppServiceRegistry<TServices>;
  transport?: AppServiceTransport;
  pathPrefix?: string;
  bodyLimit?: number;
  historyLimit?: number;
  exposeErrors?: boolean;
  createContext?(
    request: NodeAppServiceRequest,
    wireRequest: AppServiceWireRequest
  ): Record<string, unknown> | Promise<Record<string, unknown>>;
  onError?(error: unknown, context: Record<string, unknown>): void;
  onCleanupError?(error: unknown, context: Record<string, unknown>): void;
}

export interface NodeAppServiceHost<TServices extends AppServiceMap = AppServiceMap> {
  readonly schema: typeof MARACA_NODE_APP_SERVICE_HOST_SCHEMA;
  readonly registry: AppServiceRegistry<TServices>;
  readonly pathPrefix: string;
  readonly disposed: boolean;
  handle(request: NodeAppServiceRequest, response: NodeAppServiceResponse): Promise<boolean>;
  handleEnvelope<TInput = unknown, TOutput = unknown>(
    request: AppServiceWireRequest<TInput>,
    context?: Record<string, unknown> & { signal?: AbortSignal }
  ): Promise<AppServiceWireResponse<TOutput>>;
  streamEnvelope<TInput = unknown, TValue = unknown>(
    request: AppServiceWireRequest<TInput>,
    context?: Record<string, unknown> & { signal?: AbortSignal }
  ): AsyncIterable<AppServiceStreamFrame<TValue>>;
  dispose(reason?: string): boolean;
  whenDisposed(): Promise<void>;
}

export function createNodeAppServiceHost<const TServices extends AppServiceMap = AppServiceMap>(
  options?: NodeAppServiceHostOptions<TServices>
): NodeAppServiceHost<TServices>;
