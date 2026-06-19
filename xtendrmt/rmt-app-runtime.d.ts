export declare const RMT_APP_RUNTIME_SCHEMA: 'xtend.rmt.app-runtime.v1';
export declare const RMT_APP_RUNTIME_DIAGNOSTIC_SCHEMA: 'xtend.rmt.app-runtime-diagnostic.v1';
export declare const RMT_COMMAND_SCHEMA: 'xtend.rmt.command.v1';
export declare const RMT_HOST_SERVICE_SCHEMA: 'xtend.rmt.host-service.v1';
export declare const RMT_STREAM_PATCH_SCHEMA: 'xtend.rmt.stream-patch.v1';
export declare const RMT_STREAM_PRESSURE_SCHEMA: 'xtend.rmt.app-runtime-stream-pressure.v1';
export declare const RMT_YIELD_ACTION_SCHEMA: 'xtend.rmt.app-runtime-yield-action.v1';
export declare const RMT_VIEW_TEMPLATE_SCHEMA: 'xtend.rmt.view-template.v1';

export interface RmtCommandSource {
  kind: string;
  id: string;
  event: string;
  surfaceId: string;
}

export interface RmtCommandEnvelope<TPayload = unknown> {
  schema: typeof RMT_COMMAND_SCHEMA;
  id: string;
  source: RmtCommandSource;
  command: string;
  payload: TPayload;
  target?: unknown;
  correlationId: string;
  runId?: string;
  lane: string;
  timestamp: string;
}

export interface RmtStreamPatch {
  schema: typeof RMT_STREAM_PATCH_SCHEMA;
  id: string;
  type: 'start' | 'delta' | 'tool-call' | 'tool-result' | 'complete' | 'error' | 'cancel';
  streamId: string;
  target: string;
  correlationId: string;
  delta?: unknown;
  value?: unknown;
  toolCall?: unknown;
  toolResult?: unknown;
  error?: unknown;
  timestamp: string;
}

export interface RmtHostServiceRegistry {
  schema: typeof RMT_HOST_SERVICE_SCHEMA;
  invoke(serviceId: string, payload?: unknown, context?: Record<string, unknown>): Promise<unknown>;
  subscribe(serviceId: string, payload?: unknown, handlers?: Record<string, Function>, context?: Record<string, unknown>): unknown;
  stream(serviceId: string, payload?: unknown, handlers?: Record<string, Function>, context?: Record<string, unknown>): Promise<unknown>;
  cancel(id: string, reason?: string): unknown;
  listServices(): unknown[];
  listCalls(): unknown[];
  listSubscriptions(): unknown[];
  listDiagnostics(): unknown[];
}

export interface RmtStreamPressureRecord {
  schema: typeof RMT_STREAM_PRESSURE_SCHEMA;
  id: string;
  timestamp: string;
  source: 'rmt-app-runtime';
  phase: string;
  streamId: string;
  target: string;
  correlationId: string;
  patchId: string;
  patchType: RmtStreamPatch['type'];
  terminal: boolean;
  level: 'none' | 'low' | 'medium' | 'high' | 'critical';
  score: number;
  action: string;
  lane: string;
  schedulerLane: string;
  scheduleRef: string;
  patchCount: number;
  deltaCount: number;
  finalState: string | null;
  cancellationReason: string;
}

export interface RmtAppRuntimeYieldAction {
  schema: typeof RMT_YIELD_ACTION_SCHEMA;
  id: string;
  timestamp: string;
  source: 'rmt-app-runtime';
  reason: string;
  action: string;
  lane: string;
  targetLane: string;
  pressureLevel: string;
  schedulerPressureLevel: string;
  streamId: string;
  patchType: RmtStreamPatch['type'];
  terminal: boolean;
  scheduleRef: string;
  correlationId: string;
  metadata: Record<string, unknown>;
}

export interface RmtAppRuntimePerformanceTelemetrySnapshot {
  schema: 'xtend.rmt.app-runtime-performance-telemetry.v1';
  commandCount: number;
  streamPatchCount: number;
  streamCount: number;
  diagnosticCount: number;
  backpressureSignalCount: number;
  backpressureSignals: unknown[];
  streamPressureRecordCount: number;
  streamPressureRecords: RmtStreamPressureRecord[];
  highestStreamPressureLevel: string;
  yieldActionCount: number;
  yieldActions: RmtAppRuntimeYieldAction[];
  schedulerSampleCount: number;
  schedulerPressureSamples: unknown[];
  streams: unknown[];
}

export interface RmtAppRuntimePanicRecoverySnapshot {
  schema: 'xtend.rmt.app-runtime-panic-recovery-snapshot.v1';
  recordCount: number;
  kernel: unknown;
  fabric: unknown;
  records: unknown[];
}

export interface RmtAppRuntime {
  schema: typeof RMT_APP_RUNTIME_SCHEMA;
  command(commandName: string | RmtCommandEnvelope, payload?: unknown, options?: Record<string, unknown>): Promise<unknown>;
  refreshSnapshot(commandName?: string, payload?: unknown, options?: Record<string, unknown>): Promise<unknown>;
  dispatchCommand(command: RmtCommandEnvelope | Record<string, unknown>, metadata?: Record<string, unknown>): Promise<unknown>;
  invokeService(serviceId: string, payload?: unknown, context?: Record<string, unknown>): Promise<unknown>;
  streamService(serviceId: string, payload?: unknown, options?: Record<string, unknown>): Promise<unknown>;
  applyStreamPatch(patch: RmtStreamPatch | Record<string, unknown>, options?: Record<string, unknown>): unknown;
  handleStreamPatch(patch: RmtStreamPatch | Record<string, unknown>, options?: Record<string, unknown>): Promise<unknown>;
  applyReducer(reducer: Record<string, unknown>, context?: Record<string, unknown>): unknown;
  applyRecipe(recipe: string | Record<string, unknown>, context?: Record<string, unknown>): unknown;
  createCommandEnvelope(input: Record<string, unknown>, defaults?: Record<string, unknown>): RmtCommandEnvelope;
  hostServices: RmtHostServiceRegistry;
  getState(): unknown;
  setState(value: unknown): unknown;
  listCommands(): unknown[];
  listStreamPatches(): unknown[];
  listStreams(): unknown[];
  listStreamPressureRecords(): RmtStreamPressureRecord[];
  listYieldActions(): RmtAppRuntimeYieldAction[];
  listSchedulerPressureSamples(): unknown[];
  listDiagnostics(): unknown[];
  getPerformanceTelemetrySnapshot(): RmtAppRuntimePerformanceTelemetrySnapshot;
  listPanicRecoveryRecords(): unknown[];
  getPanicRecoverySnapshot(): RmtAppRuntimePanicRecoverySnapshot;
}

export declare function createRmtCommandEnvelope<TPayload = unknown>(input?: Record<string, unknown>, defaults?: Record<string, unknown>): RmtCommandEnvelope<TPayload>;
export declare function isRmtCommandEnvelope(value: unknown): value is RmtCommandEnvelope;
export declare function commandFromComponentEvent(eventName: string, detail?: Record<string, unknown>, defaults?: Record<string, unknown>): RmtCommandEnvelope;
export declare function createRmtHostServiceRegistry(options?: Record<string, unknown>): RmtHostServiceRegistry;
export declare function createRmtStreamPatch(input?: Record<string, unknown>, defaults?: Record<string, unknown>): RmtStreamPatch;
export declare function applyRmtStreamPatch(state?: Record<string, unknown>, patch?: RmtStreamPatch | Record<string, unknown>, options?: Record<string, unknown>): unknown;
export declare function applyRmtReducer(state?: Record<string, unknown>, reducer?: Record<string, unknown>, context?: Record<string, unknown>): unknown;
export declare function applyRmtReducerRecipe(state?: Record<string, unknown>, reducer?: Record<string, unknown>, context?: Record<string, unknown>): unknown;
export declare function createRmtViewTemplateDescriptor(template?: Record<string, unknown>, model?: Record<string, unknown>): unknown;
export declare function createNoManualUiWiringGate(options?: Record<string, unknown>): unknown;
export declare function createRmtAppRuntime(options?: Record<string, unknown>): RmtAppRuntime;

declare const api: {
  RMT_APP_RUNTIME_SCHEMA: typeof RMT_APP_RUNTIME_SCHEMA;
  RMT_APP_RUNTIME_DIAGNOSTIC_SCHEMA: typeof RMT_APP_RUNTIME_DIAGNOSTIC_SCHEMA;
  RMT_COMMAND_SCHEMA: typeof RMT_COMMAND_SCHEMA;
  RMT_HOST_SERVICE_SCHEMA: typeof RMT_HOST_SERVICE_SCHEMA;
  RMT_STREAM_PATCH_SCHEMA: typeof RMT_STREAM_PATCH_SCHEMA;
  RMT_STREAM_PRESSURE_SCHEMA: typeof RMT_STREAM_PRESSURE_SCHEMA;
  RMT_YIELD_ACTION_SCHEMA: typeof RMT_YIELD_ACTION_SCHEMA;
  RMT_VIEW_TEMPLATE_SCHEMA: typeof RMT_VIEW_TEMPLATE_SCHEMA;
  createRmtCommandEnvelope: typeof createRmtCommandEnvelope;
  isRmtCommandEnvelope: typeof isRmtCommandEnvelope;
  commandFromComponentEvent: typeof commandFromComponentEvent;
  createRmtHostServiceRegistry: typeof createRmtHostServiceRegistry;
  createRmtStreamPatch: typeof createRmtStreamPatch;
  applyRmtStreamPatch: typeof applyRmtStreamPatch;
  applyRmtReducer: typeof applyRmtReducer;
  applyRmtReducerRecipe: typeof applyRmtReducerRecipe;
  createRmtViewTemplateDescriptor: typeof createRmtViewTemplateDescriptor;
  createNoManualUiWiringGate: typeof createNoManualUiWiringGate;
  createRmtAppRuntime: typeof createRmtAppRuntime;
};

export default api;
