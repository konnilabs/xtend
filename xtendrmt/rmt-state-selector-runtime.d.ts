export const RMT_STATE_SELECTOR_DIAGNOSTIC_SCHEMA: 'xtend.epic18.rmt-state-selector-diagnostic.v1';
export const RMT_STATE_SELECTOR_RUNTIME_SCHEMA: 'xtend.epic18.rmt-state-selector-runtime.v1';

export type RmtStateType = 'collection' | 'array' | 'object' | 'string' | 'number' | 'boolean' | 'nullable' | string;

export interface RmtStateDefinition {
  id: string;
  type: RmtStateType;
  schema?: string;
  initial?: unknown;
  preserve?: 'attribute-sync' | 'component-state' | string;
  xstateKey?: string;
}

export interface RmtSelectorDefinition {
  id: string;
  from: string;
  path?: string;
  where?: unknown[] | unknown;
  filter?: unknown[] | unknown;
  find?: unknown[] | unknown;
  sort?: { by?: string; path?: string; direction?: 'asc' | 'desc' };
  map?: string | { path?: string };
  compute?: 'count' | 'not-empty' | 'empty' | 'first' | 'boolean' | string;
  structural?: boolean;
  output?: string;
}

export interface RmtDerivedDefinition {
  id: string;
  from: string;
  path?: string;
  expression?: string;
  compute?: 'count' | 'not-empty' | 'empty' | 'boolean' | string;
  structural?: boolean;
  output?: string;
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

export interface RmtXStateBridge {
  schema: typeof RMT_STATE_SELECTOR_RUNTIME_SCHEMA;
  external: boolean;
  set(key: string, value: unknown, metadata?: Record<string, unknown>): boolean;
  get<T = unknown>(key: string, fallbackValue?: T): T;
  mirrorSnapshot(snapshot: RmtStateSelectorSnapshot, metadata?: Record<string, unknown>): void;
  subscribe(listener: (event: unknown) => void): () => void;
  listWrites(): Array<{ key: string; value: unknown; mirrored: boolean; metadata: Record<string, unknown> }>;
  listReads(): Array<{ key: string; hit: boolean }>;
}

export interface RmtStateSelectorRuntime {
  schema: typeof RMT_STATE_SELECTOR_RUNTIME_SCHEMA;
  stateDefinitions: RmtStateDefinition[];
  selectorDefinitions: RmtSelectorDefinition[];
  derivedDefinitions: RmtDerivedDefinition[];
  reducers: RmtReducerDefinition[];
  getState<T = unknown>(id: string): T;
  setState(id: string, value: unknown, metadata?: Record<string, unknown>): { patchPlan: RmtStatePatchPlan };
  patchState(id: string, patch: Record<string, unknown>, metadata?: Record<string, unknown>): { patchPlan: RmtStatePatchPlan };
  dispatch(commandId: string, payload?: Record<string, unknown>, metadata?: Record<string, unknown>): { patchPlan: RmtStatePatchPlan };
  select<T = unknown>(selectorId: string, params?: Record<string, unknown>): T;
  getSelectorValues(): Record<string, unknown>;
  getDerivedValues(): Record<string, unknown>;
  getRenderModel(): Record<string, unknown>;
  createRenderContext(extra?: Record<string, unknown>): Record<string, unknown>;
  resolve(expression: unknown, item?: unknown, payload?: Record<string, unknown>, params?: Record<string, unknown>): unknown;
  snapshot(): RmtStateSelectorSnapshot;
  planPatch(previousSnapshot: RmtStateSelectorSnapshot, nextSnapshot: RmtStateSelectorSnapshot): RmtStatePatchPlan;
  subscribe(listener: (event: { previous: RmtStateSelectorSnapshot; next: RmtStateSelectorSnapshot; patchPlan: RmtStatePatchPlan }) => void): () => void;
  connectXState(target: unknown): RmtXStateBridge;
  xstateBridge: RmtXStateBridge;
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
  xstate?: unknown;
  diagnosticsHub?: { publish(channel: string, payload: unknown, meta?: Record<string, unknown>): unknown };
  diagnosticChannel?: string;
}

export interface RmtStateBindingApplication {
  schema: 'xtend.epic18.rmt-state-binding-application.v1';
  strategy: 'attribute-sync' | string;
  replacedRoot: false;
  operationCount: number;
  operations: Array<Record<string, unknown>>;
}

export function createRmtXStateBridge(options?: { xstate?: unknown }): RmtXStateBridge;
export function createRmtStateSelectorRuntime(options?: RmtStateSelectorRuntimeOptions): RmtStateSelectorRuntime;
export function planRmtStatePatch(previousSnapshot: RmtStateSelectorSnapshot, nextSnapshot: RmtStateSelectorSnapshot, options?: Record<string, unknown>): RmtStatePatchPlan;
export function applyRmtStateBindings(root: Element, bindings: unknown[], runtime: RmtStateSelectorRuntime, options?: Record<string, unknown>): RmtStateBindingApplication;
export function createRmtStateBindingAdapter(options?: Record<string, unknown>): {
  schema: typeof RMT_STATE_SELECTOR_RUNTIME_SCHEMA;
  apply(root: Element, bindings: unknown[], runtime: RmtStateSelectorRuntime): RmtStateBindingApplication;
};
