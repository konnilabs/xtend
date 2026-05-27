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
  listScheduledEndpoints(): unknown[];
  listDiagnostics(): unknown[];
  snapshot(): Record<string, unknown>;
}

export function createRmtKernelOrchestrationController(
  options?: RmtKernelOrchestrationControllerOptions
): RmtKernelOrchestrationController;
