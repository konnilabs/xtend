import type {
  RmtStateProjectionPort,
  RmtStateProjectionPortFactory,
  RmtXStateHostTarget
} from '../xtendrmt/rmt-xstate-host-adapter.js';
import type { RmtDomDescriptorRenderer } from '../xtendrmt/rmt-dom-descriptor-renderer.js';
import type { RmtKernelOrchestrationController } from '../xtendrmt/rmt-kernel-orchestration-controller.js';
import type {
  XtendSurfaceController,
  XtendSurfaceStateProjectionAdapter
} from '../components/xsurfacemanager-controller.js';

export interface MaracaPlanRuntimeSnapshot {
  readonly schema: 'xtend.maraca.plan-runtime.v2';
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

export interface MaracaPlanRuntime {
  readonly schema: 'xtend.maraca.plan-runtime.v2';
  readonly model: RmtModelReader;
  /** @deprecated Use model. Removed in 0.7. */
  readonly stateRuntime: RmtModelReader;
  /** @deprecated Use dispatchCommand(). Removed in 0.7. */
  readonly actionRuntime: MaracaLegacyActionRuntime;
  boot(): Promise<MaracaPlanRuntimeSnapshot>;
  dispatchCommand(command: string | MaracaCommand, payload?: unknown, metadata?: Record<string, unknown>): Promise<MaracaCommandResult>;
  dispatchStreamPatch(patch: MaracaStreamPatch, metadata?: Readonly<Record<string, unknown>>): Promise<MaracaStreamPatchResult>;
  /** @deprecated Use controller commands. Removed in 0.7. */
  render(metadata?: Record<string, unknown>): Promise<MaracaPlanRuntimeCommitSnapshot>;
  /** @deprecated Use controller commands. Removed in 0.7. */
  refresh(metadata?: Record<string, unknown>): Promise<MaracaPlanRuntimeCommitSnapshot>;
  snapshot(): MaracaPlanRuntimeSnapshot;
  subscribe(listener: (snapshot: MaracaPlanRuntimeSnapshot) => void): () => void;
  dispose(): boolean;
}

export type XTendMaracaRuntime = MaracaPlanRuntime;

export interface MaracaPlanRuntimeOptions {
  plan: Record<string, unknown>;
  root: ParentNode & { replaceChildren(...nodes: Node[]): void };
  componentRegistry?: {
    ensureTags?(tags: string[]): Promise<unknown>;
    ensure?(tag: string): Promise<unknown>;
    hydrate?(root: ParentNode, tags: string[], metadata?: Record<string, unknown>): Promise<unknown>;
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
  /** Host target passed to the injected XState projection adapter. */
  xstate?: RmtXStateHostTarget;
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

export declare const PLAN_RUNTIME_SCHEMA: 'xtend.maraca.plan-runtime.v2';
export declare function createMaracaPlanRuntime(options: MaracaPlanRuntimeOptions): MaracaPlanRuntime;
export declare function bootMaracaPlan(options: MaracaPlanRuntimeOptions): Promise<MaracaPlanRuntime>;

declare const api: Readonly<{ PLAN_RUNTIME_SCHEMA: typeof PLAN_RUNTIME_SCHEMA; createMaracaPlanRuntime: typeof createMaracaPlanRuntime; bootMaracaPlan: typeof bootMaracaPlan }>;
export default api;
