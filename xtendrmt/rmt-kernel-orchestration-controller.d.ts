export const RMT_KERNEL_ORCHESTRATION_CONTROLLER_SCHEMA: 'xtend.rmt.kernel-orchestration-controller.v1';
export const RMT_KERNEL_ORCHESTRATION_DIAGNOSTIC_SCHEMA: 'xtend.rmt.kernel-orchestration-diagnostic.v1';

export interface RmtKernelOrchestrationControllerOptions {
  kernelApi?: Record<string, unknown> | null;
  artifact?: Record<string, unknown> | null;
  plan?: Record<string, unknown>;
  scheduler?: Record<string, unknown> | null;
  diagnostics?: unknown[];
  strict?: boolean;
  hostAdapter?: Record<string, unknown> | null;
  windowTarget?: unknown;
  documentTarget?: unknown;
  runtimeKind?: string;
  kernelBootMode?: 'direct' | 'productSurface';
  enablePrewarmWorker?: boolean;
  prewarmWorkerName?: string;
  prewarmWorkerType?: 'classic' | 'module' | string;
  telemetryLimit?: number;
  productSurface?: Record<string, unknown> | null;
  productSurfaceOptions?: Record<string, unknown>;
  fabric?: Record<string, unknown> | null;
  fabricRuntime?: Record<string, unknown> | null;
  manifest?: Record<string, unknown> | null;
  featureAdoptionRegistry?: {
    snapshot(): Record<string, unknown>;
  } | null;
  dispatchEvent?: (name: string, detail: unknown) => void;
  publishDiagnostic?: (diagnostic: unknown) => void;
}

export interface RmtKernelOrchestrationController {
  schema: typeof RMT_KERNEL_ORCHESTRATION_CONTROLLER_SCHEMA;
  enabled: boolean;
  mode: string;
  readonly status: string;
  readonly runtime: unknown;
  readonly core: unknown;
  readonly performanceRuntime: unknown;
  readonly schedulerBridge: unknown;
  readonly hostAdapter: unknown;
  boot(): unknown;
  scheduleWork(kind: string, callback: (context: unknown) => unknown, metadata?: Record<string, unknown>): unknown;
  recordAppRuntimeBackpressure(record?: Record<string, unknown>, metadata?: Record<string, unknown>): Record<string, unknown>;
  listScheduledEndpoints(): unknown[];
  listDiagnostics(): unknown[];
  listPanicRecoveryRecords(): unknown[];
  getPanicRecoverySnapshot(): Record<string, unknown>;
  snapshot(): Record<string, unknown>;
}

export function createRmtKernelOrchestrationController(
  options?: RmtKernelOrchestrationControllerOptions
): RmtKernelOrchestrationController;
