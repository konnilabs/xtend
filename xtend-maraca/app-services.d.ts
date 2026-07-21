export const MARACA_APP_SERVICES_SCHEMA: 'xtend.maraca.app-services.v1';
export const MARACA_APP_SERVICE_SCHEMA: 'xtend.maraca.app-service.v1';
export const MARACA_APP_SERVICE_REGISTRY_SCHEMA: 'xtend.maraca.app-service-registry.v1';
export const MARACA_APP_SERVICE_REQUEST_SCHEMA: 'xtend.maraca.app-service-request.v1';
export const MARACA_APP_SERVICE_RESPONSE_SCHEMA: 'xtend.maraca.app-service-response.v1';
export const MARACA_APP_SERVICE_STREAM_SCHEMA: 'xtend.maraca.app-service-stream.v1';
export const MARACA_APP_SERVICE_STREAM_FRAME_SCHEMA: 'xtend.maraca.app-service-stream-frame.v1';
export const MARACA_APP_SERVICE_TRANSPORT_SCHEMA: 'xtend.maraca.app-service-transport.v1';
export const MARACA_APP_SERVICE_INPUT_POLICY_SCHEMA: 'xtend.maraca.app-service-input-policy.v1';
export const MARACA_APP_SERVICE_INPUT_VERDICT_SCHEMA: 'xtend.maraca.app-service-input-verdict.v1';

export type AppServiceKind = 'query' | 'command' | 'stream';
export type AppServiceTarget = 'local' | 'server' | 'remote-surface';
export type AppServiceConcurrency = 'latest' | 'serial' | 'parallel';
export type AppServiceScope = 'client' | 'server';
export type AppServiceStreamFrameType = 'start' | 'delta' | 'tool-call' | 'tool-result' | 'complete' | 'error' | 'cancelled';

export interface AppServiceInputFieldPolicy {
  readonly name: string;
  readonly type: 'string';
  readonly boundary: 'xtend.security.sanitizing-boundary.v1';
  readonly sanitize: 'text';
}

export interface AppServiceInputPolicy {
  readonly schema: typeof MARACA_APP_SERVICE_INPUT_POLICY_SCHEMA;
  readonly fields: readonly AppServiceInputFieldPolicy[];
}

export interface AppServiceInputFieldVerdict {
  readonly name: string;
  readonly ok: boolean;
  readonly changed: boolean;
  readonly boundary: string;
  readonly sanitize: string;
  readonly sanitizerSchema: string;
  readonly diagnostics: readonly string[];
}

export interface AppServiceInputVerdict {
  readonly schema: typeof MARACA_APP_SERVICE_INPUT_VERDICT_SCHEMA;
  readonly ok: boolean;
  readonly sanitized: boolean;
  readonly serviceId: string;
  readonly phase: string;
  readonly boundary: 'xtend.security.sanitizing-boundary.v1';
  readonly fields: readonly AppServiceInputFieldVerdict[];
}

export interface AppServiceInputPolicyManifest {
  readonly services: ReadonlyArray<{
    readonly id: string;
    readonly inputPolicy?: AppServiceInputPolicy | null;
    readonly [key: string]: unknown;
  }>;
  readonly [key: string]: unknown;
}

export interface AppServiceInputPolicyApplication<TInput = unknown> {
  readonly input: TInput;
  readonly verdict: AppServiceInputVerdict | null;
}

export function applyAppServiceInputPolicy<TInput = unknown>(
  input: TInput,
  options: {
    serviceId: string;
    policy?: AppServiceInputPolicy | null;
    manifest?: AppServiceInputPolicyManifest | null;
    phase?: string;
    onVerdict?(verdict: AppServiceInputVerdict): void;
  }
): AppServiceInputPolicyApplication<TInput>;

declare const appServiceInputType: unique symbol;
declare const appServiceOutputType: unique symbol;

export interface AppServiceErrorOptions {
  code?: string;
  details?: Record<string, unknown>;
  expose?: boolean;
  cause?: unknown;
}

export class AppServiceError extends Error {
  constructor(message?: string, options?: AppServiceErrorOptions);
  readonly code: string;
  readonly details: Record<string, unknown>;
  readonly expose: boolean;
  readonly cause?: unknown;
}

export class AppServiceAbortError extends AppServiceError {
  constructor(message?: string, options?: AppServiceErrorOptions);
}

export class AppServiceStaleResultError extends AppServiceAbortError {
  constructor(message?: string, options?: AppServiceErrorOptions);
}

export interface AppServiceExecutionContext {
  readonly signal: AbortSignal;
  readonly serviceId: string;
  readonly kind: AppServiceKind;
  readonly target: AppServiceTarget;
  readonly concurrency: AppServiceConcurrency;
  readonly concurrencyKey: string;
  /** Monotone registry-owned identity, distinct from a preserved server wire invocation id. */
  readonly executionId: string;
  readonly invocationId: string;
  readonly correlationId: string;
  readonly sequence: number;
  readonly timeoutMs?: number;
  /** Redacted result of the current browser/server input TrustBoundary, when declared by RMT. */
  readonly inputPolicyVerdict?: AppServiceInputVerdict | null;
  /** Registers request-scoped cleanup; Node hosts run callbacks LIFO on completion, abort, disconnect, or dispose. */
  readonly defer?: (cleanup: () => unknown | Promise<unknown>) => unknown;
  readonly [key: string]: unknown;
}

export interface AppServiceStreamFrame<TValue = unknown> {
  readonly schema: typeof MARACA_APP_SERVICE_STREAM_FRAME_SCHEMA;
  readonly id: string;
  readonly streamId: string;
  readonly serviceId: string;
  readonly invocationId: string;
  readonly correlationId: string;
  readonly sequence: number;
  readonly type: AppServiceStreamFrameType;
  readonly value: TValue | null;
  readonly delta: TValue | null;
  readonly toolCall: unknown;
  readonly toolResult: unknown;
  readonly error: unknown;
}

export interface AppServiceStreamFrameInput<TValue = unknown> {
  id?: string;
  sequence?: number;
  type?: AppServiceStreamFrameType;
  kind?: AppServiceStreamFrameType;
  value?: TValue;
  delta?: TValue;
  toolCall?: unknown;
  tool?: unknown;
  toolResult?: unknown;
  error?: unknown;
}

export type AppServiceInvokeHandler<TInput = unknown, TOutput = unknown> = (
  input: TInput,
  context: AppServiceExecutionContext
) => TOutput | Promise<TOutput>;

export type AppServiceStreamHandler<TInput = unknown, TValue = unknown> = (
  input: TInput,
  context: AppServiceExecutionContext
) => AsyncIterable<TValue | AppServiceStreamFrameInput<TValue>>
  | Promise<AsyncIterable<TValue | AppServiceStreamFrameInput<TValue>>>;

export interface AppServiceMarker {
  readonly schema: typeof MARACA_APP_SERVICE_SCHEMA;
  readonly id?: string;
  readonly kind: AppServiceKind;
  readonly target: AppServiceTarget;
  readonly concurrency: AppServiceConcurrency;
  readonly invoke: unknown;
  readonly stream: unknown;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface AppServiceDefinition<
  TInput = unknown,
  TOutput = unknown,
  TKind extends AppServiceKind = AppServiceKind,
  TTarget extends AppServiceTarget = AppServiceTarget
> extends AppServiceMarker {
  readonly [appServiceInputType]?: TInput;
  readonly [appServiceOutputType]?: TOutput;
  readonly kind: TKind;
  readonly target: TTarget;
  readonly invoke: TKind extends 'stream' ? null : AppServiceInvokeHandler<TInput, TOutput> | null;
  readonly stream: TKind extends 'stream' ? AppServiceStreamHandler<TInput, TOutput> | null : null;
}

export interface QueryAppServiceOptions<TInput = unknown, TOutput = unknown, TTarget extends AppServiceTarget = AppServiceTarget> {
  kind: 'query';
  target: TTarget;
  concurrency?: AppServiceConcurrency;
  invoke?: AppServiceInvokeHandler<TInput, TOutput>;
  stream?: never;
  metadata?: Record<string, unknown>;
}

export interface CommandAppServiceOptions<TInput = unknown, TOutput = unknown, TTarget extends AppServiceTarget = AppServiceTarget> {
  kind: 'command';
  target: TTarget;
  concurrency?: AppServiceConcurrency;
  invoke?: AppServiceInvokeHandler<TInput, TOutput>;
  stream?: never;
  metadata?: Record<string, unknown>;
}

export interface StreamAppServiceOptions<TInput = unknown, TValue = unknown, TTarget extends AppServiceTarget = AppServiceTarget> {
  kind: 'stream';
  target: TTarget;
  concurrency?: AppServiceConcurrency;
  invoke?: never;
  stream?: AppServiceStreamHandler<TInput, TValue>;
  metadata?: Record<string, unknown>;
}

export function service<TInput = unknown, TOutput = unknown, TTarget extends AppServiceTarget = AppServiceTarget>(
  options: QueryAppServiceOptions<TInput, TOutput, TTarget>
): AppServiceDefinition<TInput, TOutput, 'query', TTarget>;
export function service<TInput = unknown, TOutput = unknown, TTarget extends AppServiceTarget = AppServiceTarget>(
  options: CommandAppServiceOptions<TInput, TOutput, TTarget>
): AppServiceDefinition<TInput, TOutput, 'command', TTarget>;
export function service<TInput = unknown, TValue = unknown, TTarget extends AppServiceTarget = AppServiceTarget>(
  options: StreamAppServiceOptions<TInput, TValue, TTarget>
): AppServiceDefinition<TInput, TValue, 'stream', TTarget>;

export type AppServiceMap = Readonly<Record<string, AppServiceMarker>>;

export interface AppServicesDefinition<TServices extends AppServiceMap = AppServiceMap> {
  readonly schema: typeof MARACA_APP_SERVICES_SCHEMA;
  readonly scope: AppServiceScope;
  readonly services: TServices;
}

export function defineAppServices<const TServices extends AppServiceMap>(
  services: TServices
): AppServicesDefinition<TServices> & { readonly scope: 'client' };

export function defineServerServices<const TServices extends AppServiceMap>(
  services: TServices
): AppServicesDefinition<TServices> & { readonly scope: 'server' };

export interface AppServiceInvocation<TOutput = unknown> extends Promise<TOutput> {
  readonly id: string;
  readonly invocationId: string;
  readonly correlationId: string;
  readonly sequence: number;
  readonly signal: AbortSignal;
  cancel(reason?: string): boolean;
}

export interface AppServiceStreamHandlers<TValue = unknown> {
  onFrame?(frame: AppServiceStreamFrame<TValue>): void;
  onStart?(frame: AppServiceStreamFrame<TValue>): void;
  onDelta?(frame: AppServiceStreamFrame<TValue>): void;
  onToolCall?(frame: AppServiceStreamFrame<TValue>): void;
  onToolResult?(frame: AppServiceStreamFrame<TValue>): void;
  onComplete?(frame: AppServiceStreamFrame<TValue>): void;
  onError?(frame: AppServiceStreamFrame<TValue>): void;
  onCancel?(frame: AppServiceStreamFrame<TValue>): void;
}

export interface AppServiceStream<TValue = unknown> extends AsyncIterable<AppServiceStreamFrame<TValue>> {
  readonly schema: typeof MARACA_APP_SERVICE_STREAM_SCHEMA;
  readonly id: string;
  readonly streamId: string;
  readonly invocationId: string;
  readonly correlationId: string;
  readonly sequence: number;
  readonly signal: AbortSignal;
  readonly done: Promise<AppServiceStreamFrame<TValue>>;
  cancel(reason?: string | Error): boolean;
}

export interface AppServiceCancelResult {
  readonly schema: 'xtend.maraca.app-service-cancel.v1';
  readonly id: string;
  readonly cancelled: boolean;
  readonly count: number;
  readonly reason: string;
}

export interface AppServiceExecutionSnapshot {
  readonly id: string;
  readonly invocationId: string;
  readonly correlationId: string;
  readonly sequence: number;
  readonly serviceId: string;
  readonly kind: AppServiceKind;
  readonly target: AppServiceTarget;
  readonly concurrency: AppServiceConcurrency;
  readonly concurrencyKey: string;
  readonly status: string;
  readonly aborted?: boolean;
  readonly inputPolicyVerdict?: AppServiceInputVerdict | null;
}

export interface AppServiceTransportRequest<TInput = unknown> {
  serviceId: string;
  kind: AppServiceKind;
  target: AppServiceTarget;
  input: TInput;
  invocationId: string;
  correlationId: string;
  signal: AbortSignal;
  context?: Record<string, unknown>;
}

export interface AppServiceTransport {
  readonly schema: typeof MARACA_APP_SERVICE_TRANSPORT_SCHEMA;
  readonly kind: string;
  invoke<TInput = unknown, TOutput = unknown>(request: AppServiceTransportRequest<TInput>): Promise<TOutput>;
  stream<TInput = unknown, TValue = unknown>(request: AppServiceTransportRequest<TInput>): AsyncIterable<AppServiceStreamFrameInput<TValue>>;
  dispose(reason?: string): boolean;
}

type AppServiceInput<TService> = TService extends { readonly [appServiceInputType]?: infer TInput }
  ? TInput
  : unknown;
type AppServiceOutput<TService> = TService extends { readonly [appServiceOutputType]?: infer TOutput }
  ? TOutput
  : unknown;
type AppServiceKeys<TServices extends AppServiceMap, TKind extends AppServiceKind> = string extends keyof TServices
  ? string
  : ({
      [TKey in keyof TServices]: TServices[TKey] extends { readonly kind: TKind } ? TKey : never;
    }[keyof TServices] & string);

export interface AppServiceRegistry<TServices extends AppServiceMap = AppServiceMap> {
  readonly schema: typeof MARACA_APP_SERVICE_REGISTRY_SCHEMA;
  readonly scope: AppServiceScope;
  readonly disposed: boolean;
  invoke<TKey extends AppServiceKeys<TServices, 'query' | 'command'>>(
    serviceId: TKey,
    input: AppServiceInput<TServices[TKey]>,
    context?: Record<string, unknown> & { signal?: AbortSignal; invocationId?: string; correlationId?: string; concurrencyKey?: string; timeoutMs?: number }
  ): AppServiceInvocation<AppServiceOutput<TServices[TKey]>>;
  stream<TKey extends AppServiceKeys<TServices, 'stream'>>(
    serviceId: TKey,
    input: AppServiceInput<TServices[TKey]>,
    handlers?: AppServiceStreamHandlers<AppServiceOutput<TServices[TKey]>>,
    context?: Record<string, unknown> & { signal?: AbortSignal; invocationId?: string; correlationId?: string; concurrencyKey?: string; timeoutMs?: number }
  ): AppServiceStream<AppServiceOutput<TServices[TKey]>>;
  cancel(identifier: string, reason?: string): AppServiceCancelResult;
  dispose(reason?: string): boolean;
  whenIdle(): Promise<void>;
  getService(serviceId: string): AppServiceMarker;
  listServices(): AppServiceMarker[];
  listActive(): AppServiceExecutionSnapshot[];
  listHistory(): AppServiceExecutionSnapshot[];
  listInputPolicyVerdicts(): AppServiceInputVerdict[];
  listListenerErrors(): Array<{ name: string; error: unknown }>;
}

export interface AppServiceRegistryOptions {
  transport?: AppServiceTransport;
  historyLimit?: number;
  disposeTransport?: boolean;
  /** RMT-generated manifest is the registry's single input-policy source of truth. */
  manifest?: AppServiceInputPolicyManifest | null;
  inputPolicyPhase?: string;
  onInputPolicyVerdict?(verdict: AppServiceInputVerdict): void;
}

export function createAppServiceRegistry<const TServices extends AppServiceMap>(
  definition: AppServicesDefinition<TServices> | TServices,
  options?: AppServiceRegistryOptions
): AppServiceRegistry<TServices>;

export interface AppServiceWireRequest<TInput = unknown> {
  schema: typeof MARACA_APP_SERVICE_REQUEST_SCHEMA;
  serviceId: string;
  kind: AppServiceKind;
  target: AppServiceTarget;
  invocationId: string | null;
  correlationId: string | null;
  input: TInput;
}

export interface AppServiceWireResponse<TOutput = unknown> {
  schema: typeof MARACA_APP_SERVICE_RESPONSE_SCHEMA;
  ok: boolean;
  serviceId: string;
  invocationId: string | null;
  correlationId: string | null;
  value?: TOutput;
  error?: { code: string; message: string };
}

export interface HttpAppServiceTransportOptions {
  baseUrl?: string;
  pathPrefix?: string;
  headers?: Record<string, string> | ((request: AppServiceWireRequest) => Record<string, string> | Promise<Record<string, string>>);
  credentials?: RequestCredentials;
  fetch?: typeof fetch;
  maxFrameBytes?: number;
}

export interface HttpAppServiceTransport extends AppServiceTransport {
  readonly kind: 'http';
  endpoint(serviceId: string): string;
}

export function createHttpAppServiceTransport(options?: HttpAppServiceTransportOptions): HttpAppServiceTransport;
