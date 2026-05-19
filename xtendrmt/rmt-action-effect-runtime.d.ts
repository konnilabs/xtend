export const RMT_ACTION_EFFECT_DIAGNOSTIC_SCHEMA: 'xtend.epic18.rmt-action-effect-diagnostic.v1';
export const RMT_ACTION_EFFECT_RUNTIME_SCHEMA: 'xtend.epic18.rmt-action-effect-runtime.v1';

export type RmtDataSourceKind = 'fixture' | 'rest' | 'ssr' | 'host' | string;
export type RmtEffectKind = 'toast' | 'feedback' | 'navigation' | 'focus' | 'lazy-import' | 'side-effect' | string;
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
  resources?: string[];
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
  error?: { name: string; message: string };
  payload?: unknown;
  metadata?: Record<string, unknown>;
  effects?: unknown[];
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
  cancelAction(actionId: string): { schema: 'xtend.epic18.rmt-action-cancel.v1'; action: string; cancelled: number };
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
  resourceAdapters?: Record<string, unknown>;
  feedbackAdapter?: { publish(payload: unknown, context?: unknown): unknown };
  navigationAdapter?: { navigate(path: unknown, context?: unknown): unknown };
  focusAdapter?: { focus(target: unknown, context?: unknown): unknown };
  effectAdapter?: { invoke(effect: unknown, context?: unknown): unknown };
  objectUrlFactory?: { create(value: unknown): string; revoke(value: string): unknown };
  importAdapter?: { load(id: string, context?: unknown): Promise<unknown> | unknown };
  timerAdapter?: { set(delayMs: number, context?: unknown): unknown; clear(handle: unknown): unknown };
  diagnosticsHub?: { publish(channel: string, payload: unknown, meta?: Record<string, unknown>): unknown };
  diagnosticChannel?: string;
}

export function createRmtResourceManager(options?: RmtActionEffectRuntimeOptions): RmtResourceManager;
export function createRmtActionEffectRuntime(options?: RmtActionEffectRuntimeOptions): RmtActionEffectRuntime;
