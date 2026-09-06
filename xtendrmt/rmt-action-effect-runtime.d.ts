export const RMT_ACTION_EFFECT_DIAGNOSTIC_SCHEMA: 'xtend.epic18.rmt-action-effect-diagnostic.v1';
export const RMT_ACTION_EFFECT_RUNTIME_SCHEMA: 'xtend.epic18.rmt-action-effect-runtime.v1';
export const RMT_COMPONENT_COMMAND_SCHEMA: 'xtend.rmt.component-command.v1';

export type RmtDataSourceKind = 'fixture' | 'rest' | 'ssr' | 'host' | 'host-service' | 'service' | string;
export type RmtEffectKind = 'toast' | 'feedback' | 'navigation' | 'focus' | 'lazy-import' | 'host-service' | 'service' | 'stream-service' | 'side-effect' | string;
export type RmtComponentCommandName = 'focus' | 'reset' | 'snapshot';
export type RmtResourceKind = 'object-url' | 'stream' | 'observer' | 'timer' | 'lazy-import' | string;

export interface RmtActionDefinition {
  id: string;
  datasource?: string;
  dataSource?: string;
  resultState?: string;
  result?: string;
  loadingState?: string;
  statusState?: string;
  resourceOwner?: string;
  effects?: string[] | Array<{ id: string }>;
  reducers?: string[] | Array<Record<string, unknown>>;
  resources?: string[] | Array<{ id: string }>;
  cancelable?: boolean;
}

export interface RmtDataSourceDefinition {
  id: string;
  kind?: RmtDataSourceKind;
  type?: RmtDataSourceKind;
  records?: unknown[];
  data?: unknown[];
  payload?: unknown;
  endpoint?: string;
  url?: string;
  adapter?: string;
  resultPath?: string;
  delayMs?: number;
}

export interface RmtEffectDefinition {
  id: string;
  kind?: RmtEffectKind;
  type?: RmtEffectKind;
  target?: string;
  message?: unknown;
  path?: unknown;
  severity?: string;
  resource?: string;
  service?: string;
  serviceId?: string;
  mode?: string;
  componentCommand?: RmtComponentCommand;
  payload?: unknown;
  resources?: string[];
}

export interface RmtComponentCommand {
  schema: typeof RMT_COMPONENT_COMMAND_SCHEMA;
  command: RmtComponentCommandName;
  target: {
    kind: 'surface';
    id: string;
    ref: string;
    component: 'x-textarea';
  };
}

export interface RmtResourceDefinition {
  id: string;
  kind?: RmtResourceKind;
  type?: RmtResourceKind;
  owner?: string;
  source?: unknown;
  importId?: string;
  module?: string;
  delayMs?: number;
}

export interface RmtActionEffectDiagnostic {
  schema: typeof RMT_ACTION_EFFECT_DIAGNOSTIC_SCHEMA;
  code: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  details?: Record<string, unknown>;
}

export interface RmtActionResult {
  schema: 'xtend.epic18.rmt-action-result.v1';
  id: string;
  runId: string;
  status: 'success' | 'error' | 'cancelled';
  data?: unknown;
  error?: { name: string; message: string; code?: string; details?: {errors:Record<string,string[]>;errorBag:string} };
  payload?: unknown;
  metadata?: Record<string, unknown>;
  effects?: unknown[];
  modelOperations?: Array<
    | { operation: 'set'; state: string; value: unknown }
    | { operation: 'patch'; state: string; patch: Record<string, unknown> }
    | { operation: 'dispatch'; command: string; payload?: unknown }
  >;
  postCommitEffects?: unknown[];
  diagnostics?: RmtActionEffectDiagnostic[];
}

export interface RmtResourceManager {
  schema: typeof RMT_ACTION_EFFECT_RUNTIME_SCHEMA;
  acquire(resourceId: string, ownerId?: string, context?: Record<string, unknown>): Promise<unknown>;
  acquireMany(resourceIds: string[], ownerId?: string, context?: Record<string, unknown>): Promise<unknown[]>;
  releaseOwner(ownerId?: string): { schema: 'xtend.epic18.rmt-resource-release.v1'; owner: string; releasedCount: number };
  listOwned(ownerId?: string): unknown[];
  listAcquisitions(): unknown[];
  listDisposals(): unknown[];
}

export interface RmtActionEffectRuntime {
  schema: typeof RMT_ACTION_EFFECT_RUNTIME_SCHEMA;
  runAction(actionId: string, payload?: Record<string, unknown>, metadata?: Record<string, unknown>): Promise<RmtActionResult>;
  cancelAction(actionId: string, reason?: string): { schema: 'xtend.epic18.rmt-action-cancel.v1'; action: string; cancelled: number };
  dispose(reason?: string): { schema: 'xtend.epic18.rmt-action-runtime-dispose.v1'; cancelled: number; reason: string };
  runEffect(effectId: string, context?: Record<string, unknown>): Promise<unknown>;
  resourceManager: RmtResourceManager;
  listActions(): RmtActionDefinition[];
  listDataSources(): RmtDataSourceDefinition[];
  listEffects(): RmtEffectDefinition[];
  getActionStatus(id: string): string;
  listHistory(): RmtActionResult[];
  listDiagnostics(): RmtActionEffectDiagnostic[];
}

export interface RmtActionEffectRuntimeOptions {
  actions?: RmtActionDefinition[];
  dataSources?: RmtDataSourceDefinition[];
  datasources?: RmtDataSourceDefinition[];
  effects?: RmtEffectDefinition[];
  resources?: RmtResourceDefinition[];
  stateRuntime?: unknown;
  resourceManager?: RmtResourceManager;
  dataSourceAdapters?: Record<string, unknown>;
  hostServiceRegistry?: {
    invoke(serviceId: string, payload?: unknown, context?: Record<string, unknown>): Promise<unknown> | unknown;
    stream?(serviceId: string, payload?: unknown, handlers?: Record<string, Function>, context?: Record<string, unknown>): Promise<unknown> | unknown;
  };
  hostPort?: RmtActionHostPort;
  /** Alias for hostPort for explicit Action-Controller composition. */
  actionHostPort?: RmtActionHostPort;
  resourceAdapters?: Record<string, unknown>;
  feedbackAdapter?: { publish(payload: unknown, context?: unknown): unknown };
  navigationAdapter?: { navigate(path: unknown, context?: unknown): unknown };
  focusAdapter?: { focus(target: unknown, context?: unknown): unknown };
  componentCommandAdapter?: { invoke(command: RmtComponentCommand, context?: unknown): Promise<unknown> | unknown };
  effectAdapter?: { invoke(effect: unknown, context?: unknown): unknown };
  deferCustomEffects?: boolean;
  /** Produces Model operations and deferred presentation effects without mutating State or View ports. */
  planningOnly?: boolean;
  /** Alias for planningOnly used by managed application controllers. */
  managedController?: boolean;
  objectUrlFactory?: { create(value: unknown): string; revoke(value: string): unknown };
  importAdapter?: { load(id: string, context?: unknown): Promise<unknown> | unknown };
  timerAdapter?: { set(delayMs: number, context?: unknown): unknown; clear(handle: unknown): unknown };
  diagnosticsHub?: { publish(channel: string, payload: unknown, meta?: Record<string, unknown>): unknown };
  diagnosticChannel?: string;
}

export interface RmtActionAbortSignal {
  readonly aborted: boolean;
  readonly reason?: unknown;
  addEventListener(type: 'abort', listener: (event: unknown) => void, options?: { once?: boolean }): void;
  removeEventListener(type: 'abort', listener: (event: unknown) => void): void;
}

export interface RmtActionAbortController {
  readonly signal: RmtActionAbortSignal;
  abort(reason?: unknown): void;
}

export interface RmtActionHostPort {
  readonly schema?: string;
  createAbortController(): RmtActionAbortController;
  createRunId?(actionId: string, sequence: number): string;
}

export function createRmtResourceManager(options?: RmtActionEffectRuntimeOptions): RmtResourceManager;
export function createRmtActionEffectRuntime(options?: RmtActionEffectRuntimeOptions): RmtActionEffectRuntime;
