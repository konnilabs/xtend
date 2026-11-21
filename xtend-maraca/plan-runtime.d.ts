import type { RmtJobHandle } from '@ccslabs/xtend/rmt/kernel-scheduler' with { 'resolution-mode': 'import' };
import type { MaracaAbortBoundary, MaracaPresentationToken } from './abort-boundary';
import type * as URLState from '@ccslabs/xtend/xtensions/url-state';
import type * as XTensionBindings from '@ccslabs/xtend/xtensions/state-binding';
export { createMaracaAbortBoundary } from './abort-boundary';
export type { MaracaAbortBoundary, MaracaPresentationToken, MaracaSuperseded } from './abort-boundary';
import type {
  RmtStateProjectionPort,
  RmtStateProjectionPortFactory,
  RmtStateHostTarget
} from '@ccslabs/xtend/rmt/state-host-adapter' with { 'resolution-mode': 'import' };
import type { RmtDomDescriptorRenderer } from '@ccslabs/xtend/rmt/dom-descriptor-renderer' with { 'resolution-mode': 'import' };
import type { RmtKernelOrchestrationController } from '@ccslabs/xtend/rmt/kernel-orchestration-controller' with { 'resolution-mode': 'import' };
import type {
  XtendSurfaceController,
  XtendSurfaceStateProjectionAdapter
} from '@ccslabs/xtend/components/xsurfacemanager-controller.js' with { 'resolution-mode': 'import' };
import type { MaracaSurfaceLifecycleRecord } from '@ccslabs/xtend/rmt/maraca-view-projection-adapter' with { 'resolution-mode': 'import' };

export interface MaracaPlanRuntimeSnapshot {
  readonly schema: 'xtend.maraca.plan-runtime.v7';
  readonly phase: 'created' | 'booting' | 'ready' | 'failed' | 'disposed';
  readonly generation: number;
  readonly renderCount: number;
  readonly commitCount: number;
  readonly stateCommitCount: number;
  readonly lastCommit: MaracaPlanRuntimeCommitSnapshot | null;
  readonly lastEvent: Readonly<Record<string, unknown>> | null;
  readonly domWriterSchema: string | null;
  readonly diagnostics: ReadonlyArray<Record<string, unknown>>;
  readonly state: unknown;
  readonly actions: ReadonlyArray<unknown>;
  readonly events: ReadonlyArray<unknown>;
  readonly appRuntime: unknown;
  readonly surfaces: unknown;
  readonly surfaceController: unknown;
  readonly kernel: unknown;
  readonly validation: boolean;
  readonly validationMode: 'ports' | 'compatibility' | 'disabled';
  readonly validationSnapshot: unknown;
  readonly animationEngine: unknown;
  readonly transitions: boolean;
  readonly transitionSnapshot: unknown;
  readonly surfaceGraph: boolean;
}

export interface MaracaPlanRuntimeCommitSnapshot {
  readonly schema: string;
  readonly operation: string;
  readonly nodeCount: number;
  readonly changed: boolean;
  readonly structural: boolean;
  readonly diagnostics: ReadonlyArray<Record<string, unknown>>;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export type MaracaSnapshot = MaracaPlanRuntimeSnapshot;

export interface MaracaCommand {
  readonly schema?: 'xtend.rmt.command.v1' | string;
  readonly command?: string;
  readonly id?: string;
  readonly action?: string;
  readonly payload?: unknown;
  readonly correlationId?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface MaracaStreamPatch extends Readonly<Record<string, unknown>> {
  readonly type?: string;
  readonly target?: string;
  readonly correlationId?: string;
}

export interface MaracaCommandResult extends Readonly<Record<string, unknown>> {
  readonly schema?: string;
  readonly id?: string;
  readonly command?: string;
  readonly status?: string;
  readonly data?: unknown;
  readonly diagnostics?: readonly unknown[];
}

export interface MaracaStreamPatchResult extends Readonly<Record<string, unknown>> {
  readonly schema: 'xtend.rmt.stream-patch-commit.v1';
  readonly status: 'applied' | 'ignored' | 'rejected';
  readonly accepted: boolean;
  readonly changed: boolean;
  readonly modelOperations: readonly Readonly<Record<string, unknown>>[];
  readonly postCommitEffects: readonly Readonly<Record<string, unknown>>[];
  readonly diagnostics: readonly unknown[];
  readonly transaction?: Readonly<Record<string, unknown>>;
  readonly commit?: Readonly<Record<string, unknown>>;
}

export interface MaracaPresentationEffectPort {
  setSurfaceHidden?(surfaceId: string, hidden: boolean): unknown;
  readonly schema?: string;
  invoke(
    effect: Readonly<Record<string, unknown>>,
    context?: Readonly<Record<string, unknown>>
  ): unknown | Promise<unknown>;
  dispose?(): boolean | void;
}

export type MaracaSurfaceControllerPort = XtendSurfaceController;

export interface MaracaResourceManagerPort {
  readonly schema?: string;
  listAcquisitions(): readonly Readonly<{ owner?: string | null; [key: string]: unknown }>[];
  releaseOwner(owner: string): unknown;
}

export interface MaracaKernelHostAdapterPort extends Readonly<Record<string, unknown>> {
  readonly schema?: string;
}

export interface MaracaSchedulerPort {
  readonly schema?: string;
  scheduleEndpoint?(
    endpointName: string,
    scope: string,
    callback: (context?: unknown) => unknown,
    options?: Readonly<Record<string, unknown>>
  ): unknown;
}

export interface MaracaRuntimeModuleApis {
  readonly state?: Readonly<Record<string, unknown>>;
  readonly stateProjection?: Readonly<Record<string, unknown>>;
  readonly stateBindings?: Readonly<Record<string, unknown>>;
  readonly action?: Readonly<Record<string, unknown>>;
  readonly app?: Readonly<Record<string, unknown>>;
  readonly events?: Readonly<Record<string, unknown>>;
  readonly animation?: Readonly<Record<string, unknown>>;
  readonly validation?: Readonly<Record<string, unknown>>;
  readonly transitions?: Readonly<Record<string, unknown>>;
  readonly surfaces?: Readonly<Record<string, unknown>>;
  readonly surfaceController?: Readonly<Record<string, unknown>>;
  readonly viewProjection?: Readonly<Record<string, unknown>>;
  readonly presentation?: Readonly<Record<string, unknown>>;
  readonly renderer?: Readonly<Record<string, unknown>>;
  readonly kernel?: Readonly<Record<string, unknown>>;
  readonly kernelRuntime?: Readonly<Record<string, unknown>>;
}

export interface MaracaRuntimeModuleLoaderPort {
  readonly schema?: string;
  load(
    plan: Readonly<Record<string, unknown>>,
    moduleUrls?: readonly string[]
  ): MaracaRuntimeModuleApis | Promise<MaracaRuntimeModuleApis>;
}

export interface MaracaViewProjectionPort {
  readonly schema?: string;
  validateRoot(): Readonly<{ schema: string; valid: true }>;
  getDocumentTarget(): Document | null;
  readChildNodes(target?: ParentNode): Node[];
  reindexSurfaces(): Readonly<{ schema: string; count: number; surfaceIds: readonly string[] }>;
  resolveSurface(surfaceId: string): Element | null;
  resolveTarget(target: Readonly<{ surface?: string; field?: string }>): Element | null;
  resolveBindingTarget(binding: Readonly<Record<string, unknown>>, root?: ParentNode): EventTarget | null;
  dispatchHostEvent(name: string, detail?: unknown): boolean;
  clearOwnedDom(): boolean;
  /** Optional native lifecycle projection introduced by the v2 View port.
   * v1 ports retain their legacy DOM behavior. Lifecycle authority remains
   * with SurfaceController; the adapter owns all DOM reads and writes.
   */
  projectSurfaceLifecycle?(snapshot: Readonly<{ surfaces: readonly MaracaSurfaceLifecycleRecord[] }>, options: {
    readonly renderer: RmtDomDescriptorRenderer;
    readonly ownership?: Readonly<Record<string, unknown>>;
    readonly context?: Readonly<Record<string, unknown>>;
    readonly phase?: 'prepare' | 'project';
  }): Readonly<{
    schema: 'xtend.rmt.maraca-surface-lifecycle-projection.v1';
    phase: 'prepare' | 'project';
    projected: number;
    hidden: number;
    restored: number;
    removed: number;
    retained: number;
    surfaceIds: readonly string[];
  }>;
  resetSurfaceIndex?(): boolean;
  dispose?(): boolean | void;
}

export interface MaracaPostCommitContext {
  readonly schema: 'xtend.maraca.post-commit-context.v1';
  readonly action: string;
  readonly payload: unknown;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly commitResult: Readonly<Record<string, unknown>>;
  readonly modelSnapshot: Readonly<Record<string, unknown>> | null;
  readonly surfaceSnapshot: Readonly<Record<string, unknown>> | null;
  readonly defaultEffects: readonly unknown[];
}

export interface RmtModelReader {
  readonly schema: 'xtend.rmt.model-reader.v1';
  getState<T = unknown>(id: string): Readonly<T>;
  select<T = unknown>(selectorId: string, params?: Readonly<Record<string, unknown>>): Readonly<T>;
  getSelectorValues(): Readonly<Record<string, unknown>>;
  getDerivedValues(): Readonly<Record<string, unknown>>;
  snapshot(): Readonly<Record<string, unknown>> | null;
  subscribe(listener: (event: Readonly<Record<string, unknown>>) => void): () => void;
}

export interface MaracaLegacyActionRuntime {
  readonly schema: 'xtend.maraca.action-runtime-compat.v1';
  runAction(action: string, payload?: unknown, metadata?: Record<string, unknown>): Promise<MaracaCommandResult>;
}

export type MaracaFastPassEffect =
  | { kind: 'navigation'; path: string | { kind: 'reference'; path: string }; scope?: string }
  | { kind: 'focus' | 'close'; target: string; scope?: string };
export interface MaracaFastPassAction {
  id: string;
  execution?: 'fastpass';
  scope?: string;
  effects: readonly MaracaFastPassEffect[];
}
export interface MaracaFastPassOptions {
  signal?: AbortSignal;
  maxChunkMs?: number;
  timeoutMs?: number;
}
export interface MaracaFastPassResult {
  readonly status: 'success' | 'superseded';
  readonly execution?: 'fastpass';
  readonly action?: string;
  readonly intents?: readonly { readonly kind: 'navigation' | 'focus' | 'close'; readonly value: string; readonly scope: string }[];
}

export interface MaracaURLStateLifetime { readonly navigationId: string; readonly signal: AbortSignal; isCurrent(): boolean }
export interface MaracaURLRestoreResult { readonly status: 'restored' | 'deferred' | 'pending-view' | 'superseded'; readonly plan?: URLState.RestorePlan }
export interface MaracaPlanRuntime {
  readonly schema: 'xtend.maraca.plan-runtime.v7';
  readonly model: RmtModelReader;
  /** @deprecated Use model. Removed in 0.7. */
  readonly stateRuntime: RmtModelReader;
  /** @deprecated Use dispatchCommand(). Removed in 0.7. */
  readonly actionRuntime: MaracaLegacyActionRuntime;
  boot(): Promise<MaracaPlanRuntimeSnapshot>;
  dispatchCommand(command: string | MaracaCommand, payload?: unknown, metadata?: Record<string, unknown>, lifetime?: XTensionBindings.XTensionBindingCommandLifetime): Promise<MaracaCommandResult>;
  restoreURLState(token: string | null, lifetime: MaracaURLStateLifetime): Promise<MaracaURLRestoreResult>;
  publishURLState(options: { cause?: URLState.HistoryProposal['cause']; currentToken: string | null; lifetime: MaracaURLStateLifetime; write(proposal: URLState.HistoryProposal): void }): Promise<{ status: 'published' | 'superseded'; mode?: URLState.HistoryProposal['mode'] }>;
  getXTensionBindings(): readonly { readonly surface: string; readonly hostSurface: string; readonly instance: XTensionBindings.XTensionBoundInstance }[];
  /** Also drains asynchronous foreign-root cleanup after dispose(). */
  /** Drains the current command queue, host deliveries and retiring foreign roots. */
  whenXTensionsIdle(): Promise<void>;
  dispatchFastPass(actionId: string, payload?: unknown, options?: MaracaFastPassOptions): RmtJobHandle<MaracaFastPassResult>;
  getSurfaceBoundary(id?: string): MaracaAbortBoundary;
  dispatchStreamPatch(patch: MaracaStreamPatch, metadata?: Readonly<Record<string, unknown>>): Promise<MaracaStreamPatchResult>;
  /** @deprecated Use controller commands. Removed in 0.7. */
  render(metadata?: Record<string, unknown>): Promise<MaracaPlanRuntimeCommitSnapshot>;
  /** @deprecated Use controller commands. Removed in 0.7. */
  refresh(metadata?: Record<string, unknown>): Promise<MaracaPlanRuntimeCommitSnapshot>;
  snapshot(): MaracaPlanRuntimeSnapshot;
  subscribe(listener: (snapshot: MaracaPlanRuntimeSnapshot) => void): () => void;
  subscribeEvents(listener: (event: Readonly<Record<string, unknown>>) => void): () => void;
  dispose(): boolean;
}

export type XTendMaracaRuntime = MaracaPlanRuntime;

export interface MaracaHydrationScope {
  readonly id: string;
  readonly boundary: MaracaAbortBoundary;
  readonly token: MaracaPresentationToken;
  readonly signal: AbortSignal;
  isCurrent(): boolean;
}
export interface MaracaHydrationContext extends Record<string, unknown> {
  signal?: AbortSignal;
  surfaces?: readonly MaracaHydrationScope[];
  isCurrent?(): boolean;
  getSurfaceBoundary?(id?: string): MaracaAbortBoundary;
}

export interface MaracaPlanRuntimeOptions {
  readonly urlStatePolicy?: URLState.Policy;
  readonly urlStateRuntime?: typeof URLState;
  xtensionBindingsRuntime?: Pick<typeof XTensionBindings, 'validateStateBindingArtifact' | 'materializeStateBindingArtifact' | 'createXTensionStateRegistry'>;
  createXTensionHost?(context: XTensionBindings.XTensionBindingHostContext & {
    readonly container: Element; readonly surface: string; readonly hostSurface: string; readonly binding: XTensionBindings.XTensionStateBinding;
  }): XTensionBindings.RuntimeHostController | XTensionBindings.KernelRuntimeHostController | XTensionBindings.GraphRuntimeHostController | XTensionBindings.BudgetRuntimeHostController | XTensionBindings.NegotiatedRuntimeHostController;
  /** Completed Action and Command history limits (default 100 each). 0 disables storage; Infinity is unbounded. */
  actionHistoryLimit?: number;
  commandHistoryLimit?: number;
  /** Per-key State Host Adapter journals (default 100 records each). 0 disables journaling; Infinity is unbounded. */
  stateProjectionWriteHistoryLimit?: number;
  stateProjectionReadHistoryLimit?: number;
  /** Retained runtime diagnostics (default 200). Does not disable live diagnostic publication. */
  diagnosticLimit?: number;
  /** Action result diagnostics: this run (default), retained history, or none. */
  actionResultDiagnostics?: 'current' | 'history' | 'none';
  plan: Record<string, unknown>;
  fastPassActions?: readonly MaracaFastPassAction[];
  root: ParentNode & { replaceChildren(...nodes: Node[]): void };
  componentRegistry?: {
    ensureTags?(tags: string[]): Promise<unknown>;
    ensure?(tag: string): Promise<unknown>;
    hydrate?(root: ParentNode, tags: string[], metadata?: MaracaHydrationContext): Promise<unknown>;
  };
  fabric?: Readonly<Record<string, unknown>>;
  domRenderer?: RmtDomDescriptorRenderer;
  kernelController?: RmtKernelOrchestrationController;
  kernelRuntime?: Readonly<Record<string, unknown>>;
  kernelApi?: Readonly<Record<string, unknown>>;
  kernelRuntimeApi?: Readonly<Record<string, unknown>>;
  kernelHostAdapter?: MaracaKernelHostAdapterPort;
  hostAdapter?: MaracaKernelHostAdapterPort;
  resourceManager?: MaracaResourceManagerPort;
  surfaceController?: MaracaSurfaceControllerPort;
  surfaceControllerId?: string;
  surfaceStateProjection?: XtendSurfaceStateProjectionAdapter;
  initialState?: Readonly<Record<string, unknown>>;
  /** @deprecated Managed Maraca uses initialState as its sole Model authority. */
  appState?: Readonly<Record<string, unknown>>;
  hostServices?: Readonly<Record<string, unknown>>;
  hostServiceRegistry?: { invoke?(id: string, payload?: unknown, metadata?: Record<string, unknown>): Promise<unknown>; stream?(id: string, payload?: unknown, metadata?: Record<string, unknown>): AsyncIterable<unknown> };
  dataSourceAdapters?: Readonly<Record<string, unknown>>;
  hostServiceAdapters?: Readonly<Record<string, unknown>>;
  serviceAdapters?: Readonly<Record<string, unknown>>;
  resourceAdapters?: Readonly<Record<string, unknown>>;
  feedbackAdapter?: unknown;
  navigationAdapter?: unknown;
  focusAdapter?: unknown;
  componentCommandAdapter?: unknown;
  invokeComponentCommand?(
    commandRecord: Readonly<Record<string, unknown>>,
    context: Readonly<Record<string, unknown>>
  ): unknown | Promise<unknown>;
  effectAdapter?: unknown;
  presentationEffectPort?: MaracaPresentationEffectPort;
  /** @deprecated Use presentationEffectPort. */
  presentationAdapter?: MaracaPresentationEffectPort;
  viewProjectionPort?: MaracaViewProjectionPort;
  /** @deprecated Use viewProjectionPort. */
  viewAdapter?: MaracaViewProjectionPort;
  /** Composition roots set this when the runtime owns the injected port lifecycle. */
  ownsViewProjectionPort?: boolean;
  deferCustomEffects?: boolean;
  streamLifecycleActions?: Readonly<Record<string, unknown>>;
  trustedDomRenderer?: (descriptor: unknown, context: unknown) => Node | Node[];
  /** @deprecated Use trustedDomRenderer. */
  trustedDom?: (descriptor: unknown, context: unknown) => Node | Node[];
  adoptExisting?: boolean;
  clearOwnedDom?: boolean;
  ensureComponentsOnBoot?: boolean;
  hydrateOnBoot?: boolean;
  documentTarget?: Document;
  windowTarget?: Window;
  xUtils?: unknown;
  stateProjectionPort?: RmtStateProjectionPort;
  createStateProjectionPort?: RmtStateProjectionPortFactory;
  /** Host target passed to the injected State Projection adapter. */
  stateProjectionTarget?: RmtStateHostTarget;
  transitionStatePort?: {
    readonly schema?: string;
    apply?(projection: Readonly<Record<string, unknown>>): unknown;
    publish?(projection: Readonly<Record<string, unknown>>): unknown;
  };
  scheduler?: MaracaSchedulerPort;
  hostScheduler?: MaracaSchedulerPort;
  schedulerTarget?: Readonly<Record<string, unknown>>;
  diagnosticsHub?: { publish(channel: string, payload: unknown, meta?: Record<string, unknown>): unknown };
  diagnosticChannel?: string;
  targetResolver?(
    binding: Readonly<Record<string, unknown>>,
    root: ParentNode
  ): EventTarget | null;
  projectDescriptor?(
    descriptor: unknown,
    context: Readonly<Record<string, unknown>>
  ): unknown;
  postCommitEffects?(
    actionResult: unknown,
    context: Readonly<MaracaPostCommitContext>
  ): unknown | Promise<unknown>;
  moduleApis?: MaracaRuntimeModuleApis;
  moduleLoaderPort?: MaracaRuntimeModuleLoaderPort;
  /** @deprecated Inject moduleLoaderPort. Removed in 0.7. */
  loadModules?(plan: Record<string, unknown>): MaracaRuntimeModuleApis | Promise<MaracaRuntimeModuleApis>;
  moduleUrls?: string[];
}

export declare const PLAN_RUNTIME_SCHEMA: 'xtend.maraca.plan-runtime.v7';
export declare const LEGACY_PLAN_RUNTIME_SCHEMA: 'xtend.maraca.plan-runtime.v3';
export function createMaracaPlanRuntime(options: NativeRmtxRuntimeOptions14): NativeRmtxPlanRuntime14;
export function bootMaracaPlan(options: NativeRmtxRuntimeOptions14): Promise<NativeRmtxPlanRuntime14>;
export function createMaracaPlanRuntime(options: RmtxPlanRuntimeOptions | ProjectionComponentRuntimeOptions): RmtxPlanRuntime;
export function bootMaracaPlan(options: RmtxPlanRuntimeOptions | ProjectionComponentRuntimeOptions): Promise<RmtxPlanRuntime>;

export declare function createMaracaPlanRuntime(options: SSRComposedMaracaPlanRuntimeOptions): SSRComposedMaracaPlanRuntime;
export declare function createMaracaPlanRuntime(options: ComposedMaracaPlanRuntimeOptions): ComposedMaracaPlanRuntime;
export declare function createMaracaPlanRuntime(options: MaracaPlanRuntimeOptions): MaracaPlanRuntime;
export declare function bootMaracaPlan(options: SSRComposedMaracaPlanRuntimeOptions): Promise<SSRComposedMaracaPlanRuntime>;
export declare function bootMaracaPlan(options: ComposedMaracaPlanRuntimeOptions): Promise<ComposedMaracaPlanRuntime>;
export declare function bootMaracaPlan(options: MaracaPlanRuntimeOptions): Promise<MaracaPlanRuntime>;

declare const api: Readonly<{ LIFECYCLE_RMTX_PLAN_RUNTIME_SCHEMA:typeof LIFECYCLE_RMTX_PLAN_RUNTIME_SCHEMA;NATIVE_RMTX_PLAN_RUNTIME_SCHEMA:typeof NATIVE_RMTX_PLAN_RUNTIME_SCHEMA;RMTX_PLAN_RUNTIME_SCHEMA:typeof RMTX_PLAN_RUNTIME_SCHEMA;SCOPED_COMPONENT_PLAN_RUNTIME_SCHEMA:typeof SCOPED_COMPONENT_PLAN_RUNTIME_SCHEMA;COMPONENT_SSR_PLAN_RUNTIME_SCHEMA:typeof COMPONENT_SSR_PLAN_RUNTIME_SCHEMA;COMPONENT_XTENSION_PLAN_RUNTIME_SCHEMA: typeof COMPONENT_XTENSION_PLAN_RUNTIME_SCHEMA; SSR_XTENSION_PLAN_RUNTIME_SCHEMA: typeof SSR_XTENSION_PLAN_RUNTIME_SCHEMA; PLAN_RUNTIME_SCHEMA: typeof PLAN_RUNTIME_SCHEMA; XTENSION_PLAN_RUNTIME_SCHEMA: typeof XTENSION_PLAN_RUNTIME_SCHEMA; LEGACY_PLAN_RUNTIME_SCHEMA: typeof LEGACY_PLAN_RUNTIME_SCHEMA; createMaracaPlanRuntime: typeof createMaracaPlanRuntime; bootMaracaPlan: typeof bootMaracaPlan }>;
export default api;

/** Separate opt-in v8 contract; manual v7 options, runtime and snapshots remain intact. */
export const XTENSION_PLAN_RUNTIME_SCHEMA: 'xtend.maraca.plan-runtime.v8';
export interface ComposedMaracaPlanRuntimeSnapshot extends Omit<MaracaPlanRuntimeSnapshot, 'schema'> {
  readonly schema: 'xtend.maraca.plan-runtime.v8';
}
export interface ComposedMaracaPlanRuntime extends Omit<MaracaPlanRuntime, 'schema' | 'boot' | 'snapshot' | 'subscribe'> {
  readonly schema: 'xtend.maraca.plan-runtime.v8';
  boot(): Promise<ComposedMaracaPlanRuntimeSnapshot>;
  snapshot(): ComposedMaracaPlanRuntimeSnapshot;
  subscribe(listener: (snapshot: ComposedMaracaPlanRuntimeSnapshot) => void): () => void;
}
export interface ComposedMaracaPlanRuntimeOptions extends Omit<MaracaPlanRuntimeOptions, 'plan' | 'createXTensionHost' | 'xtensionBindingsRuntime'> {
  plan: Record<string, unknown> & { schema: 'xtend.maraca.build-plan.v5'; xtensionComposition: import('./xtension-composition-runtime').IntegratedXTensionCompositionArtifact | import('./xtension-composition-runtime').GraphXTensionCompositionArtifact | import('./xtension-composition-runtime').DeferredXTensionCompositionArtifact | import('./xtension-composition-runtime').SharedXTensionCompositionArtifact | import('./xtension-composition-runtime').DeliveryXTensionCompositionArtifact };
  xtensionCompositionPort: import('./xtension-composition-runtime').MaracaXTensionCompositionPort;
  createXTensionHost?: never; xtensionBindingsRuntime?: never; adoptExisting?: false;
}

export const SSR_XTENSION_PLAN_RUNTIME_SCHEMA: 'xtend.maraca.plan-runtime.v9';
export interface SSRComposedMaracaPlanRuntimeSnapshot extends Omit<ComposedMaracaPlanRuntimeSnapshot, 'schema'> {
  readonly schema: 'xtend.maraca.plan-runtime.v9';
  readonly xtensionSSR: import('./xtension-ssr').XTensionSSRReport | null;
}

export interface SSRComposedMaracaPlanRuntime extends Omit<ComposedMaracaPlanRuntime, 'schema' | 'boot' | 'snapshot' | 'subscribe'> {
  readonly schema: 'xtend.maraca.plan-runtime.v9';
  boot(): Promise<SSRComposedMaracaPlanRuntimeSnapshot>;
  snapshot(): SSRComposedMaracaPlanRuntimeSnapshot;
  subscribe(listener: (snapshot: SSRComposedMaracaPlanRuntimeSnapshot) => void): () => void;
  captureXTensionSSR(): Promise<import('./xtension-ssr').XTensionSSRResponse>;
}
export interface SSRComposedMaracaPlanRuntimeOptions extends Omit<ComposedMaracaPlanRuntimeOptions, 'xtensionCompositionPort' | 'adoptExisting'> {
  xtensionCompositionPort: import('./xtension-composition-runtime').MaracaXTensionSSRCompositionPort;
  adoptExisting?: boolean;
}

export const COMPONENT_XTENSION_PLAN_RUNTIME_SCHEMA: 'xtend.maraca.plan-runtime.v10';
export interface ComponentMaracaPlanRuntimeSnapshot extends Omit<ComposedMaracaPlanRuntimeSnapshot, 'schema'> { readonly schema: 'xtend.maraca.plan-runtime.v10' }
export interface ComponentMaracaPlanRuntime extends Omit<ComposedMaracaPlanRuntime, 'schema' | 'boot' | 'snapshot' | 'subscribe'> {
  readonly schema: 'xtend.maraca.plan-runtime.v10';
  boot(): Promise<ComponentMaracaPlanRuntimeSnapshot>;
  snapshot(): ComponentMaracaPlanRuntimeSnapshot;
  subscribe(listener: (snapshot: ComponentMaracaPlanRuntimeSnapshot) => void): () => void;
}
export interface ComponentMaracaPlanRuntimeOptions extends Omit<ComposedMaracaPlanRuntimeOptions, 'plan' | 'xtensionCompositionPort'> {
  plan: Record<string, unknown> & { schema: 'xtend.maraca.build-plan.v6'; xtensionComposition: import('./xtension-composition-runtime').ComponentXTensionCompositionArtifact };
  xtensionCompositionPort: import('./xtension-composition-runtime').MaracaComponentXTensionCompositionPort;
}
export function createMaracaPlanRuntime(options: ComponentMaracaPlanRuntimeOptions): ComponentMaracaPlanRuntime;
export function bootMaracaPlan(options: ComponentMaracaPlanRuntimeOptions): Promise<ComponentMaracaPlanRuntime>;

export const SCOPED_COMPONENT_PLAN_RUNTIME_SCHEMA:'xtend.maraca.plan-runtime.v11';
export const COMPONENT_SSR_PLAN_RUNTIME_SCHEMA:'xtend.maraca.plan-runtime.v12';
export interface ScopedComponentSnapshot extends Omit<ComponentMaracaPlanRuntimeSnapshot,'schema'> {readonly schema:'xtend.maraca.plan-runtime.v11'}
export interface ComponentSSRSnapshot extends Omit<ScopedComponentSnapshot,'schema'> {readonly schema:'xtend.maraca.plan-runtime.v12';readonly xtensionSSR:import('./xtension-ssr').ComponentSSRReport|null}
export interface ScopedComponentRuntime extends Omit<ComponentMaracaPlanRuntime,'schema'|'boot'|'snapshot'|'subscribe'> {readonly schema:'xtend.maraca.plan-runtime.v11';boot():Promise<ScopedComponentSnapshot>;snapshot():ScopedComponentSnapshot;subscribe(listener:(snapshot:ScopedComponentSnapshot)=>void):()=>void}
export interface ComponentSSRRuntime extends Omit<ScopedComponentRuntime,'schema'|'boot'|'snapshot'|'subscribe'> {readonly schema:'xtend.maraca.plan-runtime.v12';boot():Promise<ComponentSSRSnapshot>;snapshot():ComponentSSRSnapshot;subscribe(listener:(snapshot:ComponentSSRSnapshot)=>void):()=>void;captureXTensionSSR():Promise<import('./xtension-ssr').ComponentSSRResponse>}
export interface ScopedComponentRuntimeOptions extends Omit<ComponentMaracaPlanRuntimeOptions,'plan'|'xtensionCompositionPort'> {plan:Record<string,unknown>&{schema:'xtend.maraca.build-plan.v7';xtensionComposition:import('./xtension-composition-runtime').ScopedComponentArtifact};xtensionCompositionPort:import('./xtension-composition-runtime').MaracaScopedComponentPort}
export interface ComponentSSRRuntimeOptions extends Omit<ScopedComponentRuntimeOptions,'xtensionCompositionPort'|'adoptExisting'> {xtensionCompositionPort:import('./xtension-composition-runtime').MaracaScopedSSRPort;adoptExisting?:boolean}
export function createMaracaPlanRuntime(options:ScopedComponentRuntimeOptions):ScopedComponentRuntime;
export function createMaracaPlanRuntime(options:ComponentSSRRuntimeOptions):ComponentSSRRuntime;
export function bootMaracaPlan(options:ScopedComponentRuntimeOptions):Promise<ScopedComponentRuntime>;
export function bootMaracaPlan(options:ComponentSSRRuntimeOptions):Promise<ComponentSSRRuntime>;

/** Explicit source4 CSR runtime; typed Action ingress also applies without providers. */
export const RMTX_PLAN_RUNTIME_SCHEMA: 'xtend.maraca.plan-runtime.v13';
export interface RmtxPlanSnapshot extends Omit<MaracaPlanRuntimeSnapshot, 'schema'> { readonly schema: typeof RMTX_PLAN_RUNTIME_SCHEMA }
export interface RmtxPlanRuntime extends Omit<MaracaPlanRuntime, 'schema' | 'boot' | 'snapshot' | 'subscribe' | 'restoreURLState' | 'publishURLState'> {
  readonly schema: typeof RMTX_PLAN_RUNTIME_SCHEMA;
  boot(): Promise<RmtxPlanSnapshot>;
  snapshot(): RmtxPlanSnapshot;
  subscribe(listener: (snapshot: RmtxPlanSnapshot) => void): () => void;
  restoreURLState(token: string | null, lifetime: MaracaURLStateLifetime): Promise<Omit<MaracaURLRestoreResult, 'plan'> & { readonly plan?: URLState.RestorePlanV2 }>;
  publishURLState(options: { cause?: URLState.HistoryProposalV2['cause']; currentToken: string | null; lifetime: MaracaURLStateLifetime; write(proposal: URLState.HistoryProposalV2): void }): Promise<{ status: 'published' | 'superseded'; mode?: URLState.HistoryProposalV2['mode'] }>;
}
export interface RmtxPlanRuntimeOptions extends Omit<MaracaPlanRuntimeOptions, 'plan' | 'createXTensionHost' | 'xtensionBindingsRuntime' | 'adoptExisting' | 'urlStatePolicy' | 'urlStateRuntime'> {
  plan: import('./index').MaracaRmtxBuildPlan;
  createXTensionHost?: never; xtensionBindingsRuntime?: never; adoptExisting?: false;
  urlStatePolicy?: URLState.PolicyV2;
  urlStateRuntime?: URLState.ProjectionURLStateRuntime;
}
export interface ProjectionComponentRuntimeOptions extends Omit<RmtxPlanRuntimeOptions, 'plan'> {
  plan: Omit<import('./index').MaracaInlineComponentBuildPlan, 'xtensionComposition'> & { xtensionComposition: import('./xtension-composition-runtime').ProjectionComponentArtifact };
  xtensionCompositionPort: import('./xtension-composition-runtime').ProjectionComponentPort;
}

/** Source5 is CSR-only and uses the explicit native projector before View writes. */
export const NATIVE_RMTX_PLAN_RUNTIME_SCHEMA: 'xtend.maraca.plan-runtime.v14';
export interface NativeRmtxPlanSnapshot14 extends Omit<RmtxPlanSnapshot, 'schema'> {
  readonly schema: typeof NATIVE_RMTX_PLAN_RUNTIME_SCHEMA;
}
export interface NativeRmtxPlanRuntime14 extends Omit<RmtxPlanRuntime, 'schema' | 'boot' | 'snapshot' | 'subscribe'> {
  readonly schema: typeof NATIVE_RMTX_PLAN_RUNTIME_SCHEMA;
  boot(): Promise<NativeRmtxPlanSnapshot14>;
  snapshot(): NativeRmtxPlanSnapshot14;
  subscribe(listener: (snapshot: NativeRmtxPlanSnapshot14) => void): () => void;
}
export type NativeRmtxPlanRuntime = NativeRmtxPlanRuntime14;
export type NativeRmtxPlanSnapshot = NativeRmtxPlanSnapshot14;
export type NativeViewRuntimePort = Pick<typeof import('@ccslabs/xtend/xtensions/native-view-projection'),
  'NATIVE_VIEW_PROJECTION_API_VERSION' | 'validateNativeViewProgram' | 'materializeNativeView' | 'assertNativeCanonicalData'>;
export interface NativeRmtxRuntimeBaseOptions14 extends Omit<RmtxPlanRuntimeOptions,
  'plan' | 'urlStatePolicy' | 'urlStateRuntime' | 'fabric'> {
  nativeViewRuntimePort: NativeViewRuntimePort;
  fabric: import('./xtension-composition-runtime').XTensionHostCompositionOptions['fabric'] & Pick<import('@ccslabs/xtend/fabric').XtendFabricApi, 'runFiber'>;
  ssr?: never; ssrResponse?: never;
}
export type NativeRmtxURLStateOptions14 =
  | { urlStatePolicy?: undefined; urlStateRuntime?: URLState.NativeURLStateRuntime }
  | { urlStatePolicy: URLState.PolicyV2; urlStateRuntime: URLState.NativeURLStateRuntime };
export type NativeRmtxRuntimeOptions14 = NativeRmtxRuntimeBaseOptions14 & NativeRmtxURLStateOptions14 & (
  | { plan: import('./index').NativeRmtxOnlyBuildPlan9; xtensionCompositionPort?: never }
  | { plan: Omit<import('./index').NativeRmtxBuildPlan9, 'xtensionComposition'> & {
      xtensionComposition: import('./xtension-composition-runtime').NativeComponentArtifact;
    }; xtensionCompositionPort: import('./xtension-composition-runtime').NativeComponentPort }
);
export type NativeRmtxPlanRuntimeOptions = NativeRmtxRuntimeOptions14;

/** Source6 level content admission; no Surface Open/Recreate is inferred. */
export const LIFECYCLE_RMTX_PLAN_RUNTIME_SCHEMA: 'xtend.maraca.plan-runtime.v15';
export interface LifecycleRmtxPlanSnapshot extends Omit<NativeRmtxPlanSnapshot14, 'schema'> {
  readonly schema: typeof LIFECYCLE_RMTX_PLAN_RUNTIME_SCHEMA;
}
export interface LifecycleRmtxPlanRuntime extends Omit<NativeRmtxPlanRuntime14, 'schema' | 'boot' | 'snapshot' | 'subscribe'> {
  readonly schema: typeof LIFECYCLE_RMTX_PLAN_RUNTIME_SCHEMA;
  boot(): Promise<LifecycleRmtxPlanSnapshot>;
  snapshot(): LifecycleRmtxPlanSnapshot;
  subscribe(listener: (snapshot: LifecycleRmtxPlanSnapshot) => void): () => void;
}
export type LifecycleNativeViewRuntimePort = typeof import('@ccslabs/xtend/xtensions/native-view-projection').NATIVE_LIFECYCLE_VIEW_RUNTIME;
export interface LifecycleRmtxRuntimeBaseOptions extends Omit<NativeRmtxRuntimeBaseOptions14, 'nativeViewRuntimePort'> {
  nativeViewRuntimePort: LifecycleNativeViewRuntimePort;
}
export type LifecycleRmtxRuntimeOptions = LifecycleRmtxRuntimeBaseOptions & (
  | { urlStatePolicy?: undefined; urlStateRuntime?: typeof URLState.LIFECYCLE_URL_STATE_RUNTIME }
  | { urlStatePolicy: URLState.PolicyV2; urlStateRuntime: typeof URLState.LIFECYCLE_URL_STATE_RUNTIME }
) & (
  | { plan: import('./index').LifecycleRmtxOnlyBuildPlan10; xtensionCompositionPort?: never }
  | { plan: import('./index').LifecycleRmtxBuildPlan10;
      xtensionCompositionPort: import('./xtension-composition-runtime').LifecycleComponentPort }
);

/** Source7: scoped native Surface instances and explicit content commands. */
export const ORCHESTRATED_RMTX_PLAN_RUNTIME_SCHEMA: 'xtend.maraca.plan-runtime.v16';
export interface OrchestratedRmtxPlanSnapshot16 extends Omit<LifecycleRmtxPlanSnapshot, 'schema'> {
  readonly schema: typeof ORCHESTRATED_RMTX_PLAN_RUNTIME_SCHEMA;
  readonly nativeLifecycle: Readonly<{
    schema: 'xtend.rmt.native-orchestration-runtime-state.v1';
    surfaces: readonly Readonly<{id: string; suspended: boolean; detached: boolean; disposed: boolean; hydrated: boolean}>[];
    operations: readonly Readonly<{operationId: string; surfaceId: string; op: import('@ccslabs/xtend/xtensions/native-orchestration-lifecycle').NativeOrchestrationLifecycleOperation; lane: string; status: 'completed'}>[];
  }>;
}
export interface OrchestratedRmtxPlanRuntime16 extends Omit<LifecycleRmtxPlanRuntime, 'schema' | 'boot' | 'snapshot' | 'subscribe'> {
  readonly schema: typeof ORCHESTRATED_RMTX_PLAN_RUNTIME_SCHEMA;
  boot(): Promise<OrchestratedRmtxPlanSnapshot16>;
  snapshot(): OrchestratedRmtxPlanSnapshot16;
  subscribe(listener: (snapshot: OrchestratedRmtxPlanSnapshot16) => void): () => void;
}
export interface OrchestratedRmtxRuntimeBaseOptions16 extends Omit<NativeRmtxRuntimeBaseOptions14, 'nativeViewRuntimePort'> {
  nativeViewRuntimePort: typeof import('@ccslabs/xtend-compiler/xtensions/native-surface-projection').NATIVE_ORCHESTRATION_VIEW_RUNTIME;
}
export type OrchestratedRmtxRuntimeOptions16 = OrchestratedRmtxRuntimeBaseOptions16 & (
  | { urlStatePolicy?: undefined; urlStateRuntime?: typeof URLState.ORCHESTRATED_URL_STATE_RUNTIME }
  | { urlStatePolicy: URLState.PolicyV2; urlStateRuntime: typeof URLState.ORCHESTRATED_URL_STATE_RUNTIME }
) & (
  | { plan: import('./index').OrchestratedRmtxOnlyBuildPlan11; xtensionCompositionPort?: never }
  | { plan: import('./index').OrchestratedRmtxBuildPlan11; xtensionCompositionPort: import('./xtension-composition-runtime').OrchestratedComponentPort }
);

/** Source8: scoped native Surface instances and explicit content commands. */
export const MANAGED_RMTX_PLAN_RUNTIME_SCHEMA: 'xtend.maraca.plan-runtime.v17';
export interface ManagedNativeRouteHost {
  readonly currentPath?: string;
  navigate(href: string, options?: Readonly<{ state?: unknown; replace?: boolean; source?: string; owner?: Readonly<Record<string, unknown>> }>): unknown | Promise<unknown>;
  canNavigate?(href: string): boolean | Readonly<{ capable: boolean }>;
  snapshot?(): Readonly<{ currentPath?: string; current?: Readonly<{ path?: string }> }>;
  addEventListener?: EventTarget['addEventListener'];
  removeEventListener?: EventTarget['removeEventListener'];
}
export interface ManagedRmtxPlanSnapshot17 extends Omit<LifecycleRmtxPlanSnapshot, 'schema'> {
  readonly schema: typeof MANAGED_RMTX_PLAN_RUNTIME_SCHEMA;
  readonly nativeLifecycle: Readonly<{
    schema: 'xtend.rmt.native-orchestration-runtime-state.v1';
    surfaces: readonly Readonly<{id: string; suspended: boolean; detached: boolean; disposed: boolean; hydrated: boolean}>[];
    operations: readonly Readonly<{operationId: string; surfaceId: string; op: import('@ccslabs/xtend/xtensions/native-orchestration-lifecycle').NativeOrchestrationLifecycleOperation; lane: string; status: 'completed'}>[];
  }>;
}
export interface ManagedRmtxPlanRuntime17 extends Omit<LifecycleRmtxPlanRuntime, 'schema' | 'boot' | 'snapshot' | 'subscribe'> {
  readonly schema: typeof MANAGED_RMTX_PLAN_RUNTIME_SCHEMA;
  boot(): Promise<ManagedRmtxPlanSnapshot17>;
  snapshot(): ManagedRmtxPlanSnapshot17;
  subscribe(listener: (snapshot: ManagedRmtxPlanSnapshot17) => void): () => void;
}
export interface ManagedRmtxRuntimeBaseOptions17 extends Omit<NativeRmtxRuntimeBaseOptions14, 'nativeViewRuntimePort'> {
  nativeViewRuntimePort: typeof import('@ccslabs/xtend-compiler/xtensions/native-managed-view-projection').NATIVE_MANAGED_VIEW_RUNTIME;
  nativeServices?: import('@ccslabs/xtend/components/native-services', {with: {'resolution-mode': 'import'}}).ManagedNativeServices;
  nativeComponentPorts?: import('@ccslabs/xtend/xtensions/native-component-managed').ManagedNativePorts;
  routerHost?: ManagedNativeRouteHost;
}
export type ManagedRmtxRuntimeOptions17 = ManagedRmtxRuntimeBaseOptions17 & (
  | { urlStatePolicy?: undefined; urlStateRuntime?: typeof import('@ccslabs/xtend/xtensions/url-state-managed').MANAGED_URL_STATE_RUNTIME }
  | { urlStatePolicy: URLState.PolicyV2; urlStateRuntime: typeof import('@ccslabs/xtend/xtensions/url-state-managed').MANAGED_URL_STATE_RUNTIME }
) & (
  | { plan: import('./index').ManagedRmtxOnlyBuildPlan12; xtensionCompositionPort?: never }
  | { plan: import('./index').ManagedRmtxBuildPlan12; xtensionCompositionPort: import('./xtension-composition-runtime').ManagedComponentPort }
);

/** New prepared handoff capability; legacy runtime entrypoints reject it. */
export const RMTX_SSR_PLAN_RUNTIME_API_VERSION:'1.0.0';
export interface RmtxSSRHandoffOptions {
  readonly rmtxSSRSession:Readonly<{schema:'xtend.maraca.xtension-ssr-session.v3';mode:'server'|'client';[key:string]:unknown}>;
  readonly rmtxSSRBindingAdmission:(snapshot:Readonly<Record<string,unknown>>)=>Readonly<Record<string,boolean>>|undefined;
}
export interface RmtxSSRPlanRuntimeSnapshot18 extends Omit<MaracaPlanRuntimeSnapshot,'schema'> {
  readonly schema:'xtend.maraca.plan-runtime.v18';readonly xtensionSSR:import('./xtension-ssr').RmtxSSRReport|null;
}
export interface RmtxSSRPlanRuntime18 extends Omit<MaracaPlanRuntime,'schema'|'boot'|'snapshot'|'subscribe'> {
  readonly schema:'xtend.maraca.plan-runtime.v18';
  boot():Promise<RmtxSSRPlanRuntimeSnapshot18>;snapshot():RmtxSSRPlanRuntimeSnapshot18;subscribe(listener:(snapshot:RmtxSSRPlanRuntimeSnapshot18)=>void):()=>void;
  captureXTensionSSR():Promise<import('./xtension-ssr').RmtxSSRResponse>;
}
export function createMaracaRmtxSSRPlanRuntime(options:Omit<MaracaPlanRuntimeOptions,'xtensionCompositionPort'> & RmtxSSRHandoffOptions):RmtxSSRPlanRuntime18;

export function createMaracaRmtxSSRModelSnapshot(program:Readonly<Record<string,unknown>>,states:Readonly<Record<string,unknown>>,stateApi:Readonly<Record<string,unknown>>):Readonly<Record<string,unknown>>;
