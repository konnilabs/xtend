import type {
  AppServiceDefinition,
  AppServiceInputPolicy,
  AppServiceInputPolicyManifest,
  AppServiceInputVerdict,
  AppServiceTarget,
  CommandAppServiceOptions,
  QueryAppServiceOptions,
  StreamAppServiceOptions
} from './app-services';

export {
  MARACA_APP_SERVICES_SCHEMA,
  MARACA_APP_SERVICE_SCHEMA,
  MARACA_APP_SERVICE_REGISTRY_SCHEMA,
  MARACA_APP_SERVICE_REQUEST_SCHEMA,
  MARACA_APP_SERVICE_RESPONSE_SCHEMA,
  MARACA_APP_SERVICE_STREAM_SCHEMA,
  MARACA_APP_SERVICE_STREAM_FRAME_SCHEMA,
  MARACA_APP_SERVICE_INPUT_POLICY_SCHEMA,
  MARACA_APP_SERVICE_INPUT_VERDICT_SCHEMA,
  AppServiceError,
  AppServiceAbortError,
  AppServiceStaleResultError,
  defineServerServices,
  applyAppServiceInputPolicy,
  createAppServiceRegistry
} from './app-services';

export type {
  AppServiceConcurrency,
  AppServiceDefinition,
  AppServiceInputPolicy,
  AppServiceInputPolicyManifest,
  AppServiceInputVerdict,
  AppServiceExecutionContext,
  AppServiceInvocation,
  AppServiceKind,
  AppServiceMap,
  AppServiceMarker,
  AppServiceRegistry,
  AppServiceRegistryOptions,
  AppServiceStream,
  AppServiceStreamFrame,
  AppServiceStreamFrameInput,
  AppServiceTarget,
  AppServicesDefinition
} from './app-services';

export {
  MARACA_NODE_APP_SERVICE_HOST_SCHEMA,
  createNodeAppServiceHost
} from './node-app-service-host';

export type {
  NodeAppServiceHost,
  NodeAppServiceHostOptions,
  NodeAppServiceRequest,
  NodeAppServiceResponse
} from './node-app-service-host';

type ServerQueryOptions<TInput, TOutput, TTarget extends AppServiceTarget> =
  Omit<QueryAppServiceOptions<TInput, TOutput, TTarget>, 'target'> & { target?: TTarget };
type ServerCommandOptions<TInput, TOutput, TTarget extends AppServiceTarget> =
  Omit<CommandAppServiceOptions<TInput, TOutput, TTarget>, 'target'> & { target?: TTarget };
type ServerStreamOptions<TInput, TValue, TTarget extends AppServiceTarget> =
  Omit<StreamAppServiceOptions<TInput, TValue, TTarget>, 'target'> & { target?: TTarget };

export function service<TInput = unknown, TOutput = unknown, TTarget extends AppServiceTarget = 'server'>(
  options: ServerQueryOptions<TInput, TOutput, TTarget>
): AppServiceDefinition<TInput, TOutput, 'query', TTarget>;
export function service<TInput = unknown, TOutput = unknown, TTarget extends AppServiceTarget = 'server'>(
  options: ServerCommandOptions<TInput, TOutput, TTarget>
): AppServiceDefinition<TInput, TOutput, 'command', TTarget>;
export function service<TInput = unknown, TValue = unknown, TTarget extends AppServiceTarget = 'server'>(
  options: ServerStreamOptions<TInput, TValue, TTarget>
): AppServiceDefinition<TInput, TValue, 'stream', TTarget>;
