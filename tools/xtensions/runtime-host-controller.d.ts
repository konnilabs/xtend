import type { XTensionHostControllerResult, XTensionLifecycleRecord, XTensionDiagnostic, XTENSIONS_HOST_CONTROLLER_SCHEMA } from './host-controller-contract';
import type { HostResourceCleanupRecord } from './host-resource-cleanup-record';
import type { XTensionsSurfaceEvent } from './signal-bridge-contract';

export type RuntimeProps = Record<string, unknown>;
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
  readonly schema: typeof XTENSIONS_HOST_CONTROLLER_SCHEMA;
  readonly adapterSchema: string;
  readonly framework: 'react' | 'vue';
  mount(target?: Element, props?: RuntimeProps, options?: { lane?: string }): Promise<RuntimeHostResult>;
  /** Full props replacement. Vue requires applyPropsUpdate or type props.update. */
  update(signal: { props?: RuntimeProps; payload?: RuntimeProps; updateAdapter?: 'applyPropsUpdate'; type?: 'props.update' }): Promise<RuntimeHostResult>;
  suspend(reason?: string): Promise<RuntimeHostResult>;
  resume(reason?: string): Promise<RuntimeHostResult>;
  unmount(reason?: string): Promise<RuntimeHostResult>;
  reportError(error: unknown, metadata?: { phase?: string }): RuntimeHostResult;
  emit: ComponentCapabilities['emit'];
  snapshot(): RuntimeHostSnapshot;
  getLifecycleRecords(): XTensionLifecycleRecord[];
  getCleanupRecords(): HostResourceCleanupRecord[];
  getEventRecords(): XTensionsSurfaceEvent[];
}
