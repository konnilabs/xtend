/** Host-neutral declarations for server-side TypeScript consumers. */

export interface XTendTextDescriptor {
  type: 'text';
  text: string;
}

export interface XTendElementDescriptor {
  type: 'element';
  tag: string;
  attributes?: Record<string, string | number | boolean | null | undefined>;
  properties?: Record<string, unknown>;
  children?: XTendDescriptor[];
  key?: string;
}

export type XTendDescriptor = XTendTextDescriptor | XTendElementDescriptor;
export type XTendHost = Record<string, unknown>;
export type XTendRoot = object;

export interface XTendScheduleOptions {
  endpointName?: string;
  scope?: string;
  kind?: 'idle' | 'after_paint' | 'delay';
  timeout?: number;
  delayMs?: number;
}

export interface XTendScheduler {
  scheduleEndpoint(endpointName: string, scope: string, callback: (deadline?: unknown) => void, options?: XTendScheduleOptions): () => void;
  afterPaint(callback: () => void): () => void;
  dispose?(): void;
}

export interface XTendRenderer {
  render(root: XTendRoot, descriptor: unknown, options?: Record<string, unknown>): unknown;
  renderNode(descriptor: unknown, options?: Record<string, unknown>): unknown;
  dispose?(): void;
}

export interface XTendRegistryConfiguration {
  orchestration?: 'kernel' | 'lightweight';
  strict?: boolean;
  artifact?: Record<string, unknown>;
  schedules?: Array<Record<string, unknown>>;
  fibers?: Array<Record<string, unknown>>;
  fabric?: XTendRuntime | false;
  ownsFabric?: boolean;
  replaceDefaults?: boolean;
  windowTarget?: XTendHost;
  documentTarget?: XTendHost;
  scheduler?: XTendScheduler;
  renderer?: XTendRenderer;
}

export interface XTendResolvedRegistryConfiguration {
  windowTarget: XTendHost | null;
  documentTarget: XTendHost | null;
  scheduler: XTendScheduler | null;
  renderer: XTendRenderer | null;
}

export interface XTendAppOptions<TState extends object = Record<string, unknown>> {
  initialState?: TState;
  [option: string]: unknown;
}

export interface XTendAppRuntime<TState extends object = Record<string, unknown>> {
  schema: string;
  getState(): TState;
  setState(value: TState): unknown;
  command(commandName: string | Record<string, unknown>, payload?: unknown, options?: Record<string, unknown>): Promise<unknown>;
  [member: string]: unknown;
}

export type XTendStateDefinition<TState extends object, TKey extends keyof TState = keyof TState> =
  TKey extends keyof TState ? { id: TKey; type: string; initial?: TState[TKey]; [option: string]: unknown } : never;

export interface XTendStoreOptions<TState extends object = Record<string, unknown>> {
  states?: Array<XTendStateDefinition<TState>>;
  state?: Array<XTendStateDefinition<TState>>;
  initialState?: Partial<TState>;
  [option: string]: unknown;
}

export interface XTendStore<TState extends object = Record<string, unknown>> {
  schema: string;
  getState<TKey extends keyof TState>(id: TKey): TState[TKey];
  setState<TKey extends keyof TState>(id: TKey, value: TState[TKey], metadata?: Record<string, unknown>): unknown;
  patchState<TKey extends keyof TState>(id: TKey, patch: TState[TKey] extends Record<string, unknown> ? Partial<TState[TKey]> : never, metadata?: Record<string, unknown>): unknown;
  [member: string]: unknown;
}

export interface XTendRuntime {
  schema?: string;
  dispose?(): void;
  [member: string]: unknown;
}

export declare function configureXTend(options?: XTendRegistryConfiguration): Readonly<XTendResolvedRegistryConfiguration>;
export declare function getXTendConfiguration(): Readonly<XTendResolvedRegistryConfiguration>;
export interface XTendKernelHost {
  readonly schema: string;
  readonly mode: 'kernel';
  readonly artifact: Readonly<Record<string, unknown>>;
  readonly controller: Readonly<Record<string, unknown>>;
  readonly runtime: unknown;
  readonly core: unknown;
  readonly performance: unknown;
  readonly schedulerBridge: unknown;
  readonly fabric: XTendRuntime | null;
  snapshot(): Readonly<Record<string, unknown>>;
}
export declare function readyXTend(options?: XTendRegistryConfiguration): Promise<XTendKernelHost | { readonly schema: string; readonly mode: 'lightweight'; snapshot(): Readonly<Record<string, unknown>> }>;
export declare function getXTendHost(): XTendKernelHost | { readonly schema: string; readonly mode: 'lightweight'; snapshot(): Readonly<Record<string, unknown>> };
export declare function getXTendSnapshot(): Readonly<Record<string, unknown>>;
export declare function createXTendKernelArtifact(options?: XTendRegistryConfiguration): Readonly<Record<string, unknown>>;
export declare function schedule(callback: (deadline?: unknown) => void, options?: XTendScheduleOptions): () => void;
export declare function afterPaint(callback: () => void): () => void;
export declare function render<TDescriptor extends XTendDescriptor>(root: XTendRoot, descriptor: TDescriptor, options?: Record<string, unknown>): unknown;
export declare function render(root: XTendRoot, descriptor: unknown, options?: Record<string, unknown>): unknown;
export declare function renderNode<TDescriptor extends XTendDescriptor>(descriptor: TDescriptor, options?: Record<string, unknown>): unknown;
export declare function renderNode(descriptor: unknown, options?: Record<string, unknown>): unknown;
export declare function renderKeyed<TDescriptor extends XTendDescriptor>(root: XTendRoot, descriptors: TDescriptor[], options?: Record<string, unknown>): unknown;
export declare function patchElement<TDescriptor extends XTendElementDescriptor>(element: XTendRoot, descriptor: TDescriptor, options?: Record<string, unknown>): unknown;
export declare function loadComponent(tag: string, options?: Record<string, unknown>): Promise<boolean>;
export declare function hydrate(root?: XTendRoot, options?: Record<string, unknown>): Promise<unknown>;
export declare function boot(options?: Record<string, unknown>): Promise<unknown>;
export declare function disposeXTend(): void;

export declare function createRmtBrowserScheduler(options?: Record<string, unknown>): XTendScheduler;
export declare function createRmtDomDescriptorRenderer(options?: Record<string, unknown>): XTendRenderer;
export declare function createRmtAppRuntime(options?: Record<string, unknown>): XTendRuntime;
export declare function createRmtStateSelectorRuntime(options?: Record<string, unknown>): XTendRuntime;
export declare function createRmtActionEffectRuntime(options?: Record<string, unknown>): XTendRuntime;
export declare function createRmtEventRoutingRuntime(options?: Record<string, unknown>): XTendRuntime;
export declare function createRmtAnimationEngineRuntime(options?: Record<string, unknown>): XTendRuntime;
export declare function createRmtFormValidationRuntime(options?: Record<string, unknown>): XTendRuntime;
export declare function createRmtSurfaceTransitionRuntime(options?: Record<string, unknown>): XTendRuntime;
export declare function createRmtSurfaceResourceGraphRuntime(options?: Record<string, unknown>): XTendRuntime;

export declare function createApp<TState extends object = Record<string, unknown>>(options?: XTendAppOptions<TState>): XTendAppRuntime<TState>;
export declare function createStore<TState extends object = Record<string, unknown>>(options?: XTendStoreOptions<TState>): XTendStore<TState>;
export declare function createEffects(options?: Record<string, unknown>): XTendRuntime;
export declare function createRouter(options?: Record<string, unknown>): XTendRuntime;
export declare function createAnimator(options?: Record<string, unknown>): XTendRuntime;
export declare function createValidator(options?: Record<string, unknown>): XTendRuntime;
export declare function createTransitions(options?: Record<string, unknown>): XTendRuntime;
export declare function createResources(options?: Record<string, unknown>): XTendRuntime;
export declare function createFabric(options?: Record<string, unknown>): Promise<XTendRuntime>;
export { createFabric as createXtendFabric };
