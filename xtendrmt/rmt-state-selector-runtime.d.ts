import type {
  RmtStateProjectionPort,
  RmtStateProjectionPortFactory,
  RmtStateHostAdapterOptions
} from './rmt-state-host-adapter.js';

export type {
  RmtStateProjectionPort,
  RmtStateProjectionPortFactory
} from './rmt-state-host-adapter.js';

export const RMT_STATE_SELECTOR_DIAGNOSTIC_SCHEMA: 'xtend.epic18.rmt-state-selector-diagnostic.v1';
export const RMT_STATE_SELECTOR_RUNTIME_SCHEMA: 'xtend.epic18.rmt-state-selector-runtime.v2';
export const RMT_MODEL_READER_SCHEMA: 'xtend.rmt.model-reader.v1';
export const RMT_MODEL_COMMAND_PORT_SCHEMA: 'xtend.rmt.model-command-port.v1';
export const RMT_STATE_PROJECTION_PORT_SCHEMA: 'xtend.rmt.state-projection-port.v1';

export type RmtStateType = 'collection' | 'array' | 'object' | 'string' | 'number' | 'boolean' | 'nullable' | string;
export type RmtDeepReadonly<T> =
  T extends (...args: never[]) => unknown ? T
    : T extends readonly (infer Entry)[] ? readonly RmtDeepReadonly<Entry>[]
      : T extends object ? { readonly [Key in keyof T]: RmtDeepReadonly<T[Key]> }
        : T;

export interface RmtStateDefinition {
  id: string;
  type: RmtStateType;
  schema?: string;
  initial?: unknown;
  preserve?: 'attribute-sync' | 'component-state' | string;
  projectionKey?: string;
}

export interface RmtSelectorDefinition {
  id: string;
  from: string;
  path?: string;
  where?: unknown[] | unknown;
  filter?: unknown[] | unknown;
  find?: unknown[] | unknown;
  sort?: { by?: string; path?: string; direction?: 'asc' | 'desc' };
  slice?: { start?: unknown; end?: unknown };
  map?: string | { path?: string; expression?: unknown; value?: unknown };
  transform?: RmtTransformExpression;
  countBy?: string;
  key?: string;
  compute?: 'count' | 'countBy' | 'count-by' | 'not-empty' | 'empty' | 'first' | 'boolean' | string;
  structural?: boolean;
  output?: string;
}

export interface RmtDerivedDefinition {
  id: string;
  from: string;
  path?: string;
  expression?: unknown;
  transform?: RmtTransformExpression;
  countBy?: string;
  compute?: 'count' | 'countBy' | 'count-by' | 'not-empty' | 'empty' | 'boolean' | string;
  structural?: boolean;
  output?: string;
}

export interface RmtTransformExpression {
  op?: 'path' | 'map' | 'filter' | 'reduce' | 'countBy' | 'slice' | 'contains' | 'uppercase' | 'lowercase' | 'replace' | 'concat' | 'interpolate' | 'formatBytes' | 'formatDateShort' | 'formatDuration' | 'fallback' | string;
  operator?: string;
  kind?: string;
  compute?: string;
  format?: string;
  value?: unknown;
  from?: unknown;
  source?: unknown;
  path?: string;
  expression?: unknown;
  where?: unknown[] | unknown;
  filter?: unknown[] | unknown;
  rules?: unknown[] | unknown;
  values?: unknown[];
  parts?: unknown[];
  separator?: string;
  start?: unknown;
  end?: unknown;
  search?: unknown;
  replacement?: unknown;
  flags?: string;
  fallback?: unknown;
  key?: unknown;
  mode?: string;
}

export interface RmtReducerDefinition {
  id: string;
  command?: string;
  state: string;
  set?: string;
  patch?: Record<string, unknown>;
  toggle?: string;
}

export interface RmtStateSelectorSnapshot {
  schema: 'xtend.epic18.rmt-state-selector-snapshot.v1';
  states: Record<string, unknown>;
  selectors: Record<string, unknown>;
  derived: Record<string, unknown>;
  model: Record<string, unknown>;
}

export interface RmtStatePatchPlan {
  schema: 'xtend.epic18.rmt-state-patch-plan.v1';
  strategy: 'attribute-sync' | 'rerender';
  preserveDom: boolean;
  structural: boolean;
  changedStates: string[];
  changedSelectors: string[];
  changedDerived: string[];
  structuralStates: string[];
  structuralSelectors: string[];
  structuralDerived: string[];
}

export interface RmtStateChangeEvent {
  schema: 'xtend.epic18.rmt-state-change.v1';
  pending: boolean;
  previous: RmtStateSelectorSnapshot;
  next: RmtStateSelectorSnapshot;
  patchPlan: RmtStatePatchPlan;
  metadata: Record<string, unknown>;
}

export interface RmtModelReader {
  readonly schema: typeof RMT_MODEL_READER_SCHEMA;
  getState<T = unknown>(id: string): RmtDeepReadonly<T>;
  select<T = unknown>(selectorId: string, params?: Record<string, unknown>): RmtDeepReadonly<T>;
  getSelectorValues(): RmtDeepReadonly<Record<string, unknown>>;
  getDerivedValues(): RmtDeepReadonly<Record<string, unknown>>;
  snapshot(): RmtDeepReadonly<RmtStateSelectorSnapshot>;
  subscribe(listener: (event: RmtDeepReadonly<RmtStateChangeEvent>) => void): () => void;
}

export type RmtModelOperation =
  | { operation: 'set'; state: string; value: unknown }
  | { operation: 'patch'; state: string; patch: Record<string, unknown> }
  | { operation: 'dispatch'; command: string; payload?: Record<string, unknown> };

export interface RmtModelCommandPort {
  readonly schema: typeof RMT_MODEL_COMMAND_PORT_SCHEMA;
  apply(operations: RmtModelOperation | RmtModelOperation[], metadata?: Record<string, unknown>): RmtStateChangeEvent;
}

export interface RmtStateSelectorRuntime {
  schema: typeof RMT_STATE_SELECTOR_RUNTIME_SCHEMA;
  stateDefinitions: RmtStateDefinition[];
  selectorDefinitions: RmtSelectorDefinition[];
  derivedDefinitions: RmtDerivedDefinition[];
  reducers: RmtReducerDefinition[];
  readonly model: RmtModelReader;
  readonly modelReader: RmtModelReader;
  readonly modelCommandPort: RmtModelCommandPort;
  getState<T = unknown>(id: string): T;
  setState(id: string, value: unknown, metadata?: Record<string, unknown>): RmtStateChangeEvent;
  patchState(id: string, patch: Record<string, unknown>, metadata?: Record<string, unknown>): RmtStateChangeEvent;
  dispatch(commandId: string, payload?: Record<string, unknown>, metadata?: Record<string, unknown>): RmtStateChangeEvent;
  transaction(callback: (runtime: RmtStateSelectorRuntime) => unknown, metadata?: Record<string, unknown>): RmtStateChangeEvent;
  select<T = unknown>(selectorId: string, params?: Record<string, unknown>): T;
  getSelectorValues(): Record<string, unknown>;
  getDerivedValues(): Record<string, unknown>;
  getRenderModel(): Record<string, unknown>;
  createRenderContext(extra?: Record<string, unknown>): Record<string, unknown>;
  resolve(expression: unknown, item?: unknown, payload?: Record<string, unknown>, params?: Record<string, unknown>): unknown;
  snapshot(): RmtStateSelectorSnapshot;
  planPatch(previousSnapshot: RmtStateSelectorSnapshot, nextSnapshot: RmtStateSelectorSnapshot): RmtStatePatchPlan;
  subscribe(listener: (event: RmtStateChangeEvent) => void): () => void;
  connectStateProjection(target: unknown, options?: RmtStateHostAdapterOptions): RmtStateProjectionPort;
  stateProjectionPort: RmtStateProjectionPort | null;
  listDiagnostics(): unknown[];
}

export interface RmtStateSelectorRuntimeOptions {
  states?: RmtStateDefinition[];
  state?: RmtStateDefinition[];
  selectors?: RmtSelectorDefinition[];
  derive?: RmtDerivedDefinition[];
  derived?: RmtDerivedDefinition[];
  reducers?: RmtReducerDefinition[];
  commands?: RmtReducerDefinition[];
  initialState?: Record<string, unknown>;
  stateProjectionPort?: RmtStateProjectionPort | null;
  createStateProjectionPort?: RmtStateProjectionPortFactory;
  stateProjectionTarget?: unknown;
  strict?: boolean;
  strictMaraca?: boolean;
  diagnosticsHub?: { publish(channel: string, payload: unknown, meta?: Record<string, unknown>): unknown };
  diagnosticChannel?: string;
}

/** @deprecated Import RmtStateBindingApplication from state-binding-view-projector. */
export type RmtStateBindingApplication = import('./rmt-state-binding-view-projector.js').RmtStateBindingApplication;
/** @deprecated Import RmtStateBindingDomRenderer from state-binding-view-projector. */
export type RmtStateBindingDomRenderer = import('./rmt-state-binding-view-projector.js').RmtStateBindingDomRenderer;
/** @deprecated Import RmtStateBindingViewProjectorOptions from state-binding-view-projector. */
export type RmtStateBindingOptions = import('./rmt-state-binding-view-projector.js').RmtStateBindingViewProjectorOptions & {
  stateBindingViewProjector?: import('./rmt-state-binding-view-projector.js').RmtStateBindingViewProjector;
  projector?: import('./rmt-state-binding-view-projector.js').RmtStateBindingViewProjector;
  createStateBindingViewProjector?: typeof import('./rmt-state-binding-view-projector.js').createRmtStateBindingViewProjector;
};

export function createRmtStateSelectorRuntime(options?: RmtStateSelectorRuntimeOptions): RmtStateSelectorRuntime;
export function planRmtStatePatch(previousSnapshot: RmtStateSelectorSnapshot, nextSnapshot: RmtStateSelectorSnapshot, options?: Record<string, unknown>): RmtStatePatchPlan;
/** @deprecated Use createRmtStateBindingViewProjector().project() with model.snapshot(). */
export function applyRmtStateBindings(root: Element, bindings: unknown[], runtime: RmtStateSelectorRuntime, options?: RmtStateBindingOptions): RmtStateBindingApplication;
/** @deprecated Use createRmtStateBindingViewProjector(). */
export function createRmtStateBindingAdapter(options?: RmtStateBindingOptions): {
  schema: typeof RMT_STATE_SELECTOR_RUNTIME_SCHEMA;
  apply(root: Element, bindings: unknown[], runtime: RmtStateSelectorRuntime): RmtStateBindingApplication;
  dispose(): {
    schema: typeof RMT_STATE_SELECTOR_RUNTIME_SCHEMA;
    disposed: true;
    alreadyDisposed: boolean;
  };
};
