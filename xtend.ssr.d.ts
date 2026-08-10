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
export interface XTendHost {
  readonly schema: string;
  readonly mode: 'kernel' | 'lightweight';
  snapshot(): Readonly<Record<string, unknown>>;
}
export type XTendRoot = object;

export type RmtDomOwnershipDomain =
  | 'structure'
  | 'content'
  | 'attributes'
  | 'properties'
  | 'class'
  | 'part'
  | 'styleTokens'
  | 'events'
  | 'visibility'
  | 'validation';

export interface RmtDomOwnershipPolicy {
  mode?: 'strict' | 'compatibility';
  strict?: boolean;
  owner?: string;
  writer?: string;
  domains?: Partial<Record<RmtDomOwnershipDomain, string>>;
  owners?: Partial<Record<RmtDomOwnershipDomain, string>>;
  domainOwners?: Partial<Record<RmtDomOwnershipDomain, string>>;
  reservations?: Partial<Record<RmtDomOwnershipDomain, string>>;
  claims?: Partial<Record<RmtDomOwnershipDomain, string>>;
  domainClaims?: Partial<Record<RmtDomOwnershipDomain, string>>;
  domainWriters?: Partial<Record<RmtDomOwnershipDomain, string>>;
}

export interface RmtDomDescriptorRenderOptions extends Record<string, unknown> {
  model?: Record<string, unknown>;
  selectorValues?: Record<string, unknown>;
  metadata?: unknown;
}

interface RmtDomCommitRequestBase {
  context?: RmtDomDescriptorRenderOptions;
  ownership?: RmtDomOwnershipPolicy;
  metadata?: unknown;
}

export type RmtDomCommitRequest =
  | (RmtDomCommitRequestBase & {
      operation: 'create-node';
      descriptor: unknown;
    })
  | (RmtDomCommitRequestBase & {
      operation: 'replace-children';
      target: XTendRoot;
      descriptor: unknown;
    })
  | (RmtDomCommitRequestBase & {
      operation: 'reconcile-children';
      target: XTendRoot;
      descriptors: unknown[];
    })
  | (RmtDomCommitRequestBase & {
      operation: 'reconcile-element';
      target: XTendRoot;
      descriptor: unknown;
    })
  | (RmtDomCommitRequestBase & {
      operation: 'merge-element';
      target: XTendRoot;
      descriptor: unknown;
    });

export interface RmtDomDescriptorDiagnostic {
  schema: string;
  code: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  [field: string]: unknown;
}

export interface RmtDomCommitResult {
  schema: 'xtend.rmt.dom-commit-result.v1';
  operation: RmtDomCommitRequest['operation'];
  target: XTendRoot | null;
  nodes: unknown[];
  nodeCount: number;
  changed: boolean;
  structural: boolean;
  diagnostics: RmtDomDescriptorDiagnostic[];
  metadata: unknown;
}

export interface RmtDomRenderResult {
  schema: 'xtend.epic18.rmt-dom-render-result.v1';
  root: XTendRoot;
  nodeCount: number;
  diagnostics: RmtDomDescriptorDiagnostic[];
}

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
  schema: string;
  commit(request: RmtDomCommitRequest): RmtDomCommitResult;
  render(root: XTendRoot, descriptor: unknown, options?: RmtDomDescriptorRenderOptions): RmtDomRenderResult;
  renderNode(descriptor: unknown, options?: RmtDomDescriptorRenderOptions): unknown;
  renderKeyed(root: XTendRoot, descriptors: unknown[], options?: RmtDomDescriptorRenderOptions): unknown[];
  /** @deprecated Use commit({ operation: 'merge-element', ... }). Removed in 1.0. */
  patchElement(element: XTendRoot, descriptor: unknown, options?: RmtDomDescriptorRenderOptions): XTendRoot;
  dispose(target?: XTendRoot, options?: { clearOwnedDom?: boolean }): void;
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
  windowTarget?: Record<string, unknown>;
  documentTarget?: Record<string, unknown>;
  scheduler?: XTendScheduler;
  renderer?: XTendRenderer;
}

export interface XTendResolvedRegistryConfiguration {
  windowTarget: Record<string, unknown> | null;
  documentTarget: Record<string, unknown> | null;
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
export declare function readyXTend(options?: XTendRegistryConfiguration): Promise<XTendHost>;
export declare function getXTendHost(): XTendHost;
export declare function getXTendSnapshot(): Readonly<Record<string, unknown>>;
export declare function createXTendKernelArtifact(options?: XTendRegistryConfiguration): Readonly<Record<string, unknown>>;
export declare function schedule(callback: (deadline?: unknown) => void, options?: XTendScheduleOptions): () => void;
export declare function afterPaint(callback: () => void): () => void;
export declare function render<TDescriptor extends XTendDescriptor>(root: XTendRoot, descriptor: TDescriptor, options?: RmtDomDescriptorRenderOptions): RmtDomRenderResult;
export declare function render(root: XTendRoot, descriptor: unknown, options?: RmtDomDescriptorRenderOptions): RmtDomRenderResult;
export declare function renderNode<TDescriptor extends XTendDescriptor>(descriptor: TDescriptor, options?: RmtDomDescriptorRenderOptions): unknown;
export declare function renderNode(descriptor: unknown, options?: RmtDomDescriptorRenderOptions): unknown;
export declare function renderKeyed<TDescriptor extends XTendDescriptor>(root: XTendRoot, descriptors: TDescriptor[], options?: RmtDomDescriptorRenderOptions): unknown[];
/** @deprecated Use commit({ operation: 'merge-element', ... }). Removed in 1.0. */
export declare function patchElement<TDescriptor extends XTendElementDescriptor>(element: XTendRoot, descriptor: TDescriptor, options?: RmtDomDescriptorRenderOptions): XTendRoot;
export declare function commit(request: RmtDomCommitRequest): RmtDomCommitResult;
export declare function loadComponent(tag: string, options?: Record<string, unknown>): Promise<boolean>;
export declare function hydrate(root?: XTendRoot, options?: Record<string, unknown>): Promise<unknown>;
export declare function boot(options?: Record<string, unknown>): Promise<unknown>;
export declare function disposeXTend(): void;

export interface XTendRegistry {
  createXTendKernelArtifact: typeof createXTendKernelArtifact;
  configureXTend: typeof configureXTend;
  getXTendConfiguration: typeof getXTendConfiguration;
  readyXTend: typeof readyXTend;
  getXTendHost: typeof getXTendHost;
  getXTendSnapshot: typeof getXTendSnapshot;
  schedule: typeof schedule;
  afterPaint: typeof afterPaint;
  render: typeof render;
  renderNode: typeof renderNode;
  renderKeyed: typeof renderKeyed;
  patchElement: typeof patchElement;
  commit: typeof commit;
  createApp: typeof createApp;
  createStore: typeof createStore;
  createEffects: typeof createEffects;
  createRouter: typeof createRouter;
  createAnimator: typeof createAnimator;
  createValidator: typeof createValidator;
  createTransitions: typeof createTransitions;
  createResources: typeof createResources;
  loadComponent: typeof loadComponent;
  hydrate: typeof hydrate;
  boot: typeof boot;
  createFabric: typeof createFabric;
  createXtendFabric: typeof createFabric;
  disposeXTend: typeof disposeXTend;
}

export declare function createXTendRegistry(options?: XTendRegistryConfiguration): Readonly<XTendRegistry>;

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
