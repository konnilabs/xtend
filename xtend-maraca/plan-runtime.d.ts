export interface MaracaPlanRuntimeSnapshot {
  schema: 'xtend.maraca.plan-runtime.v1';
  phase: 'created' | 'booting' | 'ready' | 'failed' | 'disposed';
  generation: number;
  renderCount: number;
  diagnostics: ReadonlyArray<Record<string, unknown>>;
  state: unknown;
  kernel: unknown;
  validation: boolean;
  transitions: boolean;
}

export interface MaracaPlanRuntime {
  readonly schema: 'xtend.maraca.plan-runtime.v1';
  boot(): Promise<MaracaPlanRuntime>;
  dispatchCommand(command: string | { id?: string; action?: string }, payload?: unknown, metadata?: Record<string, unknown>): Promise<unknown>;
  snapshot(): MaracaPlanRuntimeSnapshot;
  subscribe(listener: (event: Readonly<Record<string, unknown>>) => void): () => void;
  dispose(): void;
}

export interface MaracaPlanRuntimeOptions {
  plan: Record<string, unknown>;
  root: ParentNode & { replaceChildren(...nodes: Node[]): void };
  componentRegistry?: { ensureTags?(tags: string[]): Promise<unknown>; ensure?(tag: string): Promise<unknown> };
  fabric?: unknown;
  hostServices?: Readonly<Record<string, unknown>>;
  trustedDom?: unknown;
  documentTarget?: Document;
  windowTarget?: Window;
  globalTarget?: typeof globalThis;
  xUtils?: unknown;
  xstate?: unknown;
  loadModules?(plan: Record<string, unknown>): Promise<Record<string, unknown>>;
  moduleUrls?: string[];
}

export declare const PLAN_RUNTIME_SCHEMA: 'xtend.maraca.plan-runtime.v1';
export declare function createMaracaPlanRuntime(options: MaracaPlanRuntimeOptions): MaracaPlanRuntime;
export declare function bootMaracaPlan(options: MaracaPlanRuntimeOptions): Promise<MaracaPlanRuntime>;

declare const api: Readonly<{ PLAN_RUNTIME_SCHEMA: typeof PLAN_RUNTIME_SCHEMA; createMaracaPlanRuntime: typeof createMaracaPlanRuntime; bootMaracaPlan: typeof bootMaracaPlan }>;
export default api;
