import type { XTensionHostControllerResult, XTensionLifecycleRecord, XTensionDiagnostic } from './host-controller-contract';
import type { HostResourceCleanupRecord } from './host-resource-cleanup-record';
import type { XTensionsSurfaceEvent } from './signal-bridge-contract';

export type RuntimeProps = Record<string, unknown>;
export const RUNTIME_HOST_CONTROLLER_SCHEMA: 'xtend.xtensions.runtime-host-controller.v2';
export interface ResourceContext {
  readonly signal: AbortSignal;
  isCurrent(): boolean;
  guard<T extends (...args: any[]) => any>(callback: T): (...args: Parameters<T>) => ReturnType<T> | undefined;
}
export type ResourceFactory = (context: ResourceContext) => (() => void);
export interface ComponentCapabilities {
  emit(event: { type?: string; name?: string; payload?: RuntimeProps }): XTensionsSurfaceEvent | { ok: false; diagnostics: unknown[] };
  readonly resources: { register(name: string, start: ResourceFactory): () => void };
}
export interface RuntimeHostPolicy {
  /** Default: no cooperative resources granted. Names are selected by the host. */
  allowedResources?: readonly string[];
  /** Exact event name -> payload schema identifier; default: no events. */
  events?: Readonly<Record<string, string>>;
  authorize?(context: Readonly<{ hostId: string; surfaceId: string; xtensionId: string; framework: string; operation: string; props: RuntimeProps }>): boolean;
  validateProps?(props: Readonly<RuntimeProps>): boolean;
}
export interface RuntimeHostOptions {
  container: Element;
  /** Trusted, precompiled host component. Framework types never enter the kernel. */
  component: unknown;
  peers?: unknown;
  loadRuntime?(context: Readonly<{ signal: AbortSignal }>): unknown | Promise<unknown>;
  /** Optional exact versions from the host's verified provider manifest. */
  expectedVersions?: Readonly<Record<string, string>>;
  hostId?: string;
  surfaceId?: string;
  xtensionId?: string;
  id?: string;
  lane?: string;
  clock?: () => string;
  runtimeBoundary?: Record<string, unknown>;
  policy?: RuntimeHostPolicy;
  onEvent?(event: XTensionsSurfaceEvent): void;
  onDiagnostic?(diagnostic: XTensionDiagnostic): void;
  fabric?: {
    /** Existing Fabric factories return unknown; the controller validates run at construction. */
    createBoundary(id: string, options: { source: string; lane: string }): unknown;
    emitDiagnostic?(diagnostic: unknown): void;
  };
}
export type RuntimeHostResult = Omit<XTensionHostControllerResult, 'cleanupRecords'> & { cleanupRecords: HostResourceCleanupRecord[] };
export interface RuntimeHostSnapshot {
  hostId: string; surfaceId: string; xtensionId: string; framework: string;
  phase: string; mounted: boolean; suspended: boolean; disposed: boolean;
  props: RuntimeProps;
  runtimeVersions: Record<string, string> | null;
  resources: { running: boolean; closing: boolean; disposed: boolean; generation: number; registered: number; active: number; failures: { resource: string; message: string }[] };
  diagnostics: XTensionDiagnostic[];
}
export interface RuntimeHostController {
  readonly schema: typeof RUNTIME_HOST_CONTROLLER_SCHEMA;
  /** SemVer metadata; the schema discriminator identifies the contract major. */
  readonly apiVersion: string;
  readonly adapterSchema: string;
  readonly framework: 'react' | 'vue';
  mount(target?: Element, props?: RuntimeProps, options?: { lane?: string }): Promise<RuntimeHostResult>;
  /** Full props replacement. Vue requires applyPropsUpdate or type props.update. */
  update(signal: { props?: RuntimeProps; payload?: RuntimeProps; updateAdapter?: 'applyPropsUpdate'; type?: 'props.update' }): Promise<RuntimeHostResult>;
  suspend(reason?: string): Promise<RuntimeHostResult>;
  /** Optional full replacement is committed while suspended, before resources restart. */
  resume(reason?: string, options?: { props: RuntimeProps }): Promise<RuntimeHostResult>;
  unmount(reason?: string): Promise<RuntimeHostResult>;
  reportError(error: unknown, metadata?: { phase?: string }): RuntimeHostResult;
  emit: ComponentCapabilities['emit'];
  snapshot(): RuntimeHostSnapshot;
  getLifecycleRecords(): XTensionLifecycleRecord[];
  getCleanupRecords(): HostResourceCleanupRecord[];
  getEventRecords(): XTensionsSurfaceEvent[];
}

/** A03.1: explicit kernel-backed factory; the existing v2 factories keep their contract. */
export const KERNEL_RUNTIME_HOST_CONTROLLER_SCHEMA: 'xtend.xtensions.runtime-host-controller.v3';
export interface KernelRequestPolicy {
  readonly lane?: 'user-blocking' | 'visible' | 'transition' | 'idle' | 'background' | 'diagnostics';
  readonly priority?: number; readonly maxChunkMs?: number; readonly timeoutMs?: number; readonly budgetClass?: string;
}
export interface RuntimeKernelContext {
  readonly jobId: string; readonly signal: AbortSignal | null; readonly rootId: string; readonly scope: string; readonly lane: string;
  shouldYield(): boolean; yield(reason?: string): Promise<void>;
}
export interface RuntimeKernelHandle<T> {
  readonly schema: 'xtend.rmt.kernel-job.v1'; readonly id: string; readonly status: string;
  readonly result: Promise<T>; cancel(reason?: string): boolean;
}
export interface RuntimeKernelSchedulerPort {
  /** Structural consumer view; construction validates the exact v1 brand.
   * The complete Kernel ABI remains owned by rmt-kernel-scheduler.d.ts. */
  readonly schema: string;
  schedule<T>(request: KernelRequestPolicy & { readonly schema: 'xtend.rmt.kernel-work.v1'; readonly rootId: string; readonly scope: string; readonly endpointName: string; readonly metadata: Readonly<Record<string, unknown>> }, callback: (context: RuntimeKernelContext) => T | PromiseLike<T>): RuntimeKernelHandle<T>;
}
export interface KernelRuntimeHostOptions extends RuntimeHostOptions {
  readonly fabric: NonNullable<RuntimeHostOptions['fabric']>;
  readonly kernelWork: { readonly scheduler: RuntimeKernelSchedulerPort; readonly rootId: string; readonly scope: string;
    readonly lifecycle?: KernelRequestPolicy; readonly work?: Readonly<Record<string, KernelRequestPolicy>> };
}
export interface CooperativeWorkContext extends ResourceContext {
  readonly jobId: string; shouldYield(): boolean; yield(reason?: string): Promise<void>;
}
export interface CooperativeWorkHandle<T> {
  /** Null means no kernel job was created: closed lifetime, or v5 budget admission refusal. */
  readonly jobId: string | null; readonly signal: AbortSignal; readonly result: Promise<T>; cancel(reason?: string): boolean;
}
export interface KernelComponentCapabilities extends ComponentCapabilities {
  readonly work: { schedule<T>(name: string, callback: (context: CooperativeWorkContext) => T | PromiseLike<T>): CooperativeWorkHandle<T> };
}
export interface RuntimeKernelCapabilities {
  readonly schema: 'xtend.xtensions.runtime-capabilities.v1'; readonly framework: 'react' | 'vue';
  readonly lifecycle: 'kernel-jobs'; readonly fabricBoundary: true; readonly namedWork: readonly string[];
  readonly cooperativeResources: true; readonly cooperativeCancellation: true; readonly budgets: 'cooperative';
  readonly frameworkInternalScheduling: false; readonly preemption: false; readonly terminalCleanup: 'immediate';
}
export interface KernelWorkRecord { readonly id: string; readonly kind: 'work' | 'lifecycle'; readonly name: string; readonly lane: string; readonly status: string }
export interface KernelWorkSnapshot {
  readonly schema: 'xtend.xtensions.kernel-work-scope.v1'; readonly phase: 'mounting' | 'active' | 'suspended' | 'resuming' | 'disposed';
  readonly generation: number; readonly pending: readonly KernelWorkRecord[]; readonly history: readonly KernelWorkRecord[];
}
export interface KernelRuntimeHostSnapshot extends RuntimeHostSnapshot {
  readonly capabilities: RuntimeKernelCapabilities; readonly kernelWork: KernelWorkSnapshot;
}
export interface KernelRuntimeHostController {
  readonly schema: typeof KERNEL_RUNTIME_HOST_CONTROLLER_SCHEMA;
  /** SemVer metadata; the schema discriminator identifies the contract major. */
  readonly apiVersion: '3.0.0';
  readonly adapterSchema: string;
  readonly framework: 'react' | 'vue';
  mount(target?: Element, props?: RuntimeProps, options?: { lane?: string }): Promise<RuntimeHostResult>;
  /** Full props replacement. Vue requires applyPropsUpdate or type props.update. */
  update(signal: { props?: RuntimeProps; payload?: RuntimeProps; updateAdapter?: 'applyPropsUpdate'; type?: 'props.update' }): Promise<RuntimeHostResult>;
  suspend(reason?: string): Promise<RuntimeHostResult>;
  /** Optional full replacement is committed while suspended, before resources restart. */
  resume(reason?: string, options?: { props: RuntimeProps }): Promise<RuntimeHostResult>;
  unmount(reason?: string): Promise<RuntimeHostResult>;
  reportError(error: unknown, metadata?: { phase?: string }): RuntimeHostResult;
  emit: ComponentCapabilities['emit'];
  getCapabilities(): RuntimeKernelCapabilities;
  snapshot(): KernelRuntimeHostSnapshot;
  getLifecycleRecords(): XTensionLifecycleRecord[];
  getCleanupRecords(): HostResourceCleanupRecord[];
  getEventRecords(): XTensionsSurfaceEvent[];
}

/** A03.2: explicit graph binding selects a separate v4 host contract. */
export const GRAPH_RUNTIME_HOST_CONTROLLER_SCHEMA: 'xtend.xtensions.runtime-host-controller.v4';
export interface RuntimeKernelResourcePort {
  hasRoot(rootId: string): boolean;
  getRootElement(rootId: string): unknown;
  getScheduler(): RuntimeKernelSchedulerPort;
  listResources(rootId: string): readonly { id: string }[];
  attachResource(rootId: string, resourceId: string, value: unknown, options: Record<string, unknown>): unknown;
}
export interface RuntimeSurfaceGraphPort {
  /** Structural consumer view; construction checks the exact Surface Graph v2 brand. */
  readonly schema: string;
  getSurface(id: string): { id: string } | null;
  getSnapshot(): { disposed: boolean };
}
export interface RuntimeSurfaceControllerPort {
  /** Structural consumer view; construction checks the exact Surface Controller v2 brand. */
  readonly schema: string;
  readSnapshot(options?: Record<string, unknown>): { surfaces: readonly { id: string; status: string; generation?: number; minimized?: boolean; collapsed?: boolean }[] };
  subscribe(listener: (snapshot: ReturnType<RuntimeSurfaceControllerPort['readSnapshot']>) => void): () => void;
}
export interface GraphRuntimeHostOptions extends KernelRuntimeHostOptions {
  readonly resourceGraph: { readonly kernel: RuntimeKernelResourcePort; readonly surfaceGraph: RuntimeSurfaceGraphPort;
    readonly surfaceController: RuntimeSurfaceControllerPort; readonly surfaceId: string };
}
export interface RuntimeResourceGraphBindingSnapshot {
  readonly schema: 'xtend.xtensions.resource-graph-binding.v1';
  readonly rootId: string; readonly scope: string; readonly resourceId: string; readonly surfaceId: string;
  readonly surfaceGeneration: number | null; readonly state: 'detached' | 'active' | 'suspended' | 'disposed'; readonly attached: boolean;
}
export interface GraphRuntimeHostSnapshot extends KernelRuntimeHostSnapshot {
  readonly resourceGraph: RuntimeResourceGraphBindingSnapshot;
}
export interface GraphRuntimeHostController {
  readonly schema: typeof GRAPH_RUNTIME_HOST_CONTROLLER_SCHEMA;
  /** SemVer metadata; the schema discriminator identifies the contract major. */
  readonly apiVersion: '4.0.0';
  readonly adapterSchema: string;
  readonly framework: 'react' | 'vue';
  mount(target?: Element, props?: RuntimeProps, options?: { lane?: string }): Promise<RuntimeHostResult>;
  /** Full props replacement. Vue requires applyPropsUpdate or type props.update. */
  update(signal: { props?: RuntimeProps; payload?: RuntimeProps; updateAdapter?: 'applyPropsUpdate'; type?: 'props.update' }): Promise<RuntimeHostResult>;
  suspend(reason?: string): Promise<RuntimeHostResult>;
  /** Optional full replacement is committed while suspended, before resources restart. */
  resume(reason?: string, options?: { props: RuntimeProps }): Promise<RuntimeHostResult>;
  unmount(reason?: string): Promise<RuntimeHostResult>;
  reportError(error: unknown, metadata?: { phase?: string }): RuntimeHostResult;
  emit: ComponentCapabilities['emit'];
  getCapabilities(): RuntimeKernelCapabilities;
  snapshot(): GraphRuntimeHostSnapshot;
  /** Includes graph-triggered lifecycle delivery and terminal cleanup, not named business work. */
  whenIdle(): Promise<GraphRuntimeHostSnapshot>;
  getLifecycleRecords(): XTensionLifecycleRecord[];
  getCleanupRecords(): HostResourceCleanupRecord[];
  getEventRecords(): XTensionsSurfaceEvent[];
}

/** A03.3: bounded named work with pressure-aware cooperative budgets. */
export const BUDGET_RUNTIME_HOST_CONTROLLER_SCHEMA: 'xtend.xtensions.runtime-host-controller.v5';
export type RuntimePressureLevel = 'idle' | 'normal' | 'elevated' | 'constrained' | 'critical';
export interface WorkBudgetPolicy {
  readonly schema: 'xtend.xtensions.work-budget-policy.v1';
  /** Total logically pending/running named work in this host, from 1 to 128. */
  readonly maxPending: number;
  /** Exact same names as kernelWork.work. */
  readonly work: Readonly<Record<string, { readonly maxPending: number; readonly overflow?: 'reject-new' | 'replace-oldest';
    readonly pressure?: Partial<Readonly<Record<RuntimePressureLevel, { readonly admission?: 'allow' | 'reject'; readonly maxChunkMs?: number }>>> }>>;
}
export interface BudgetRuntimeHostOptions extends GraphRuntimeHostOptions {
  readonly kernelWork: GraphRuntimeHostOptions['kernelWork'] & { readonly scheduler: RuntimeKernelSchedulerPort & {
    snapshot(): Readonly<Record<string, unknown>>;
  } };
  readonly workBudget: WorkBudgetPolicy;
}
export interface RuntimeWorkBudgetSnapshot {
  readonly schema: 'xtend.xtensions.work-budget-state.v1';
  readonly pressureLevel: RuntimePressureLevel; readonly maxPending: number; readonly pending: number;
  readonly rejected: number; readonly replaced: number;
  readonly lastDecision: { readonly name: string; readonly reason: 'kernel-pressure' | 'pending-limit' | 'replace-oldest'; readonly pressureLevel: RuntimePressureLevel } | null;
}
export interface BudgetRuntimeHostSnapshot extends GraphRuntimeHostSnapshot {
  readonly workBudget: RuntimeWorkBudgetSnapshot;
}
export interface BudgetRuntimeHostController {
  readonly schema: typeof BUDGET_RUNTIME_HOST_CONTROLLER_SCHEMA;
  /** SemVer metadata; the schema discriminator identifies the contract major. */
  readonly apiVersion: '5.0.0';
  readonly adapterSchema: string;
  readonly framework: 'react' | 'vue';
  mount(target?: Element, props?: RuntimeProps, options?: { lane?: string }): Promise<RuntimeHostResult>;
  /** Full props replacement. Vue requires applyPropsUpdate or type props.update. */
  update(signal: { props?: RuntimeProps; payload?: RuntimeProps; updateAdapter?: 'applyPropsUpdate'; type?: 'props.update' }): Promise<RuntimeHostResult>;
  suspend(reason?: string): Promise<RuntimeHostResult>;
  /** Optional full replacement is committed while suspended, before resources restart. */
  resume(reason?: string, options?: { props: RuntimeProps }): Promise<RuntimeHostResult>;
  unmount(reason?: string): Promise<RuntimeHostResult>;
  reportError(error: unknown, metadata?: { phase?: string }): RuntimeHostResult;
  emit: ComponentCapabilities['emit'];
  getCapabilities(): RuntimeKernelCapabilities;
  snapshot(): BudgetRuntimeHostSnapshot;
  /** Includes graph-triggered lifecycle delivery and terminal cleanup, not named business work. */
  whenIdle(): Promise<BudgetRuntimeHostSnapshot>;
  getLifecycleRecords(): XTensionLifecycleRecord[];
  getCleanupRecords(): HostResourceCleanupRecord[];
  getEventRecords(): XTensionsSurfaceEvent[];
}
