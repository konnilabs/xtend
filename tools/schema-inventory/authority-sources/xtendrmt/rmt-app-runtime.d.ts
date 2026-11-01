import type {
  RmtAppHostPort,
  RmtSearchPrewarmWorkerPort
} from './rmt-app-host-adapter.js';

export type {
  RmtAppHostPort,
  RmtSearchPrewarmWorkerPort
} from './rmt-app-host-adapter.js';

export declare const RMT_APP_RUNTIME_SCHEMA: 'xtend.rmt.app-runtime.v2';
export declare const RMT_APP_RUNTIME_DIAGNOSTIC_SCHEMA: 'xtend.rmt.app-runtime-diagnostic.v1';
export declare const RMT_COMMAND_SCHEMA: 'xtend.rmt.command.v1';
export declare const RMT_HOST_SERVICE_SCHEMA: 'xtend.rmt.host-service.v1';
export declare const RMT_STREAM_PATCH_SCHEMA: 'xtend.rmt.stream-patch.v1';
export declare const RMT_STREAM_PATCH_PLAN_SCHEMA: 'xtend.rmt.stream-patch-plan.v1';
export declare const RMT_STREAM_PATCH_COMMIT_SCHEMA: 'xtend.rmt.stream-patch-commit.v1';
export declare const RMT_STREAM_PRESSURE_SCHEMA: 'xtend.rmt.app-runtime-stream-pressure.v1';
export declare const RMT_YIELD_ACTION_SCHEMA: 'xtend.rmt.app-runtime-yield-action.v1';
export declare const RMT_VIEW_TEMPLATE_SCHEMA: 'xtend.rmt.view-template.v1';
export declare const RMT_APP_PRESENTATION_MODEL_SCHEMA: 'xtend.rmt.app-presentation-model.v1';
export declare const RMT_SEARCH_RUNTIME_SCHEMA: 'xtend.rmt.search-runtime.v1';
export declare const RMT_SEARCH_RESPONSE_SCHEMA: 'xtend.rmt.search-response.v1';
export declare const RMT_SEARCH_RECOMMENDATION_RESPONSE_SCHEMA: 'xtend.rmt.search-recommendation-response.v1';
export declare const RMT_SEARCH_WORKER_SCHEMA: 'xtend.rmt.prewarm-search-worker.v1';

export interface RmtSearchEntry {
  id?: string;
  slug: string;
  title: string;
  aliases?: string[];
  keywords?: string[];
  headings?: string[];
  summary?: string;
  body?: string;
  locale?: string;
  parent?: string;
  trunk?: string;
  section?: string;
  rank?: number;
  relatedSlugs?: string[];
  metadata?: Record<string, unknown>;
}

export interface RmtSearchResult {
  id: string;
  slug: string;
  title: string;
  locale: string;
  score: number;
  fieldScores: Record<string, number>;
  metadata: Record<string, unknown>;
}

export interface RmtSearchSource {
  id: string;
  queryState?: string;
  resource: string;
  fallbackResource?: string;
  minQueryLength?: number;
  debounceMs?: number;
  resultLimit?: number;
  fallbackThreshold?: number;
  fieldWeights?: Record<string, number>;
  resultTemplate?: string;
  emptyTemplate?: string;
  loadingTemplate?: string;
  activeIndexState?: string;
  selectionState?: string;
  localePolicy?: string;
  a11y?: Record<string, unknown>;
}

export interface RmtSearchResponse {
  schema: typeof RMT_SEARCH_RESPONSE_SCHEMA;
  sourceId: string;
  query: string;
  normalizedQuery: string;
  generation: string;
  superseded: boolean;
  usedFulltext: boolean;
  compactResultCount: number;
  fallbackResultCount: number;
  results: RmtSearchResult[];
}

export interface RmtSearchRecommendationResult {
  id: string;
  slug: string;
  title: string;
  locale: string;
  parent: string | null;
  trunk: string | null;
  section: string | null;
  rank: number;
  score: number;
  semanticScore: number;
  navigationBoost: number;
  signals: Array<{ kind: string; probe: string; score: number }>;
  navigationSignals: string[];
  metadata: Record<string, unknown>;
}

export interface RmtSearchRecommendationResponse {
  schema: typeof RMT_SEARCH_RECOMMENDATION_RESPONSE_SCHEMA;
  sourceId: string;
  seedId: string;
  seedSlug: string;
  generation: string;
  superseded: boolean;
  status: 'ready' | 'degraded';
  resourceId: string;
  durationMs: number;
  rankingStartedAt: number;
  rankingCompletedAt: number;
  rankingDurationMs: number;
  resultCount: number;
  results: RmtSearchRecommendationResult[];
}

export interface RmtSearchPrewarmWorker extends RmtSearchPrewarmWorkerPort {}

export interface RmtSearchRuntimeOptions extends Record<string, unknown> {
  hostPort?: RmtAppHostPort;
  appHostPort?: RmtAppHostPort;
  prewarmWorker?: RmtSearchPrewarmWorkerPort;
  searchSources?: RmtSearchSource[];
  sources?: RmtSearchSource[];
  resources?: Record<string, RmtSearchEntry[]>;
  resourceResolver?: (resourceId: string, context?: Readonly<Record<string, unknown>>) => Promise<RmtSearchEntry[]> | RmtSearchEntry[];
}

export interface RmtSearchRuntime {
  schema: typeof RMT_SEARCH_RUNTIME_SCHEMA;
  query(sourceId: string, query: string, options?: Record<string, unknown>): Promise<RmtSearchResponse>;
  recommend(sourceId: string, seed: string | RmtSearchEntry, options?: Record<string, unknown>): Promise<RmtSearchRecommendationResponse>;
  searchEntries(entries: RmtSearchEntry[], query: string, options?: Record<string, unknown>): RmtSearchResult[];
  recommendEntries(entries: RmtSearchEntry[], seed: string | RmtSearchEntry, options?: Record<string, unknown>): RmtSearchRecommendationResult[];
  registerSource(source: RmtSearchSource): string;
  registerResource(id: string, entries?: RmtSearchEntry[]): number;
  listDiagnostics(): unknown[];
  listHistory(): RmtSearchResponse[];
  listRecommendationHistory(): RmtSearchRecommendationResponse[];
  snapshot(): Record<string, unknown>;
  dispose(): void;
}

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

export interface RmtStreamPatchModelOperation {
  operation: 'set';
  state: string;
  value: unknown;
}

export interface RmtStreamPostCommitEffect {
  schema: 'xtend.rmt.stream-post-commit-effect.v1';
  type: 'dispatch-command';
  command: string;
  payload: { patch: RmtStreamPatch; state: unknown };
  metadata: Record<string, unknown>;
}

export interface RmtStreamPatchPlan {
  schema: typeof RMT_STREAM_PATCH_PLAN_SCHEMA;
  status: 'planned' | 'ignored' | 'rejected';
  accepted: boolean;
  changed: boolean;
  patch: RmtStreamPatch;
  target: { state: string; path: string } | null;
  modelOperations: RmtStreamPatchModelOperation[];
  postCommitEffects: RmtStreamPostCommitEffect[];
  diagnostics: unknown[];
  metadata: Record<string, unknown>;
}

export interface RmtStreamPatchCommitResult {
  schema: typeof RMT_STREAM_PATCH_COMMIT_SCHEMA;
  status: 'applied' | 'ignored' | 'rejected';
  accepted: boolean;
  changed: boolean;
  patch: RmtStreamPatch | null;
  target: { state: string; path: string } | null;
  modelOperations: RmtStreamPatchModelOperation[];
  postCommitEffects: RmtStreamPostCommitEffect[];
  diagnostics: unknown[];
  stream?: unknown;
  streamPressure?: unknown;
  metadata: Record<string, unknown>;
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

export interface RmtAppPresentationModel {
  readonly schema: typeof RMT_APP_PRESENTATION_MODEL_SCHEMA;
  readonly template: Readonly<Record<string, unknown>>;
  readonly model: Readonly<Record<string, unknown>>;
}

export interface RmtAppPresentationViewPort {
  readonly schema?: string;
  project(
    presentationModel: RmtAppPresentationModel,
    metadata?: Readonly<Record<string, unknown>>
  ): Readonly<Record<string, unknown>>;
}

export interface RmtAppPerformanceSamplePort {
  reportPerformanceSample(sample: Readonly<Record<string, unknown>>): unknown;
}

export interface RmtAppRuntimeOptions extends Record<string, unknown> {
  hostPort?: RmtAppHostPort;
  appHostPort?: RmtAppHostPort;
  managedModel?: boolean;
  managedController?: boolean;
  modelReader?: { snapshot(): Readonly<Record<string, unknown>> };
  model?: { snapshot(): Readonly<Record<string, unknown>> };
  dispatchStreamPatch?: (patch: RmtStreamPatch | Record<string, unknown>, metadata?: Record<string, unknown>) => Promise<unknown>;
  streamPatchCommandPort?: {
    dispatch(patch: RmtStreamPatch | Record<string, unknown>, metadata?: Record<string, unknown>): Promise<unknown>;
  };
  initialState?: Record<string, unknown>;
  streamLifecycleActions?: Record<string, string>;
  scheduler?: RmtAppPerformanceSamplePort;
  kernelScheduler?: RmtAppPerformanceSamplePort;
  rmtScheduler?: RmtAppPerformanceSamplePort;
  performanceRuntime?: RmtAppPerformanceSamplePort;
  kernelPerformanceRuntime?: RmtAppPerformanceSamplePort;
  rmtPerformanceRuntime?: RmtAppPerformanceSamplePort;
  presentationViewPort?: RmtAppPresentationViewPort;
  viewProjectionPort?: RmtAppPresentationViewPort;
}

export interface RmtAppRuntime {
  schema: typeof RMT_APP_RUNTIME_SCHEMA;
  command(commandName: string | RmtCommandEnvelope, payload?: unknown, options?: Record<string, unknown>): Promise<unknown>;
  refreshSnapshot(commandName?: string, payload?: unknown, options?: Record<string, unknown>): Promise<unknown>;
  dispatchCommand(command: RmtCommandEnvelope | Record<string, unknown>, metadata?: Record<string, unknown>): Promise<unknown>;
  invokeService(serviceId: string, payload?: unknown, context?: Record<string, unknown>): Promise<unknown>;
  streamService(serviceId: string, payload?: unknown, options?: Record<string, unknown>): Promise<unknown>;
  planStreamPatch(patch: RmtStreamPatch | Record<string, unknown>, modelSnapshot?: Readonly<Record<string, unknown>>, options?: Record<string, unknown>): RmtStreamPatchPlan;
  commitStreamPatchPlan(plan: RmtStreamPatchPlan, options?: Record<string, unknown>): RmtStreamPatchCommitResult;
  applyStreamPatch(patch: RmtStreamPatch | Record<string, unknown>, options?: Record<string, unknown>): unknown;
  handleStreamPatch(patch: RmtStreamPatch | Record<string, unknown>, options?: Record<string, unknown>): Promise<unknown>;
  applyReducer(reducer: Record<string, unknown>, context?: Record<string, unknown>): unknown;
  applyRecipe(recipe: string | Record<string, unknown>, context?: Record<string, unknown>): unknown;
  createPresentationModel(template?: Record<string, unknown>, model?: Record<string, unknown>): RmtAppPresentationModel;
  projectViewTemplate(template?: Record<string, unknown>, model?: Record<string, unknown>): Readonly<Record<string, unknown>>;
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
export declare function createRmtHostServiceRegistry(options?: Record<string, unknown> & { hostPort?: RmtAppHostPort; appHostPort?: RmtAppHostPort }): RmtHostServiceRegistry;
export declare function createRmtStreamPatch(input?: Record<string, unknown>, defaults?: Record<string, unknown>): RmtStreamPatch;
export declare function createRmtStreamPatchPlan(modelSnapshot?: Readonly<Record<string, unknown>>, patch?: RmtStreamPatch | Record<string, unknown>, options?: Record<string, unknown>): RmtStreamPatchPlan;
export declare function applyRmtStreamPatch(state?: Record<string, unknown>, patch?: RmtStreamPatch | Record<string, unknown>, options?: Record<string, unknown>): unknown;
export declare function applyRmtReducer(state?: Record<string, unknown>, reducer?: Record<string, unknown>, context?: Record<string, unknown>): unknown;
export declare function applyRmtReducerRecipe(state?: Record<string, unknown>, reducer?: Record<string, unknown>, context?: Record<string, unknown>): unknown;
export declare function createRmtAppPresentationModel(template?: Record<string, unknown>, model?: Record<string, unknown>): RmtAppPresentationModel;
export declare function createRmtViewTemplateDescriptor(
  template?: Record<string, unknown>,
  model?: Record<string, unknown>,
  options?: { presentationViewPort?: RmtAppPresentationViewPort; viewProjectionPort?: RmtAppPresentationViewPort; viewPort?: RmtAppPresentationViewPort }
): Readonly<Record<string, unknown>>;
export declare function createNoManualUiWiringGate(options?: Record<string, unknown>): unknown;
export declare function normalizeSearchText(value: unknown): string;
export declare function boundedDamerauLevenshtein(left: string, right: string, maxDistance?: number): number;
export declare function searchEntries(entries?: RmtSearchEntry[], query?: string, options?: Record<string, unknown>): RmtSearchResult[];
export declare function recommendEntries(entries?: RmtSearchEntry[], seed?: string | RmtSearchEntry, options?: Record<string, unknown>): RmtSearchRecommendationResult[];
export declare function createRmtSearchWorkerSource(): string;
export declare function createRmtSearchPrewarmWorker(options?: Record<string, unknown> & { hostPort?: RmtAppHostPort; appHostPort?: RmtAppHostPort }): RmtSearchPrewarmWorker;
export declare function createRmtSearchRuntime(options?: RmtSearchRuntimeOptions): RmtSearchRuntime;
export declare function createRmtAppRuntime(options?: RmtAppRuntimeOptions): RmtAppRuntime;

declare const api: {
  RMT_APP_RUNTIME_SCHEMA: typeof RMT_APP_RUNTIME_SCHEMA;
  RMT_APP_RUNTIME_DIAGNOSTIC_SCHEMA: typeof RMT_APP_RUNTIME_DIAGNOSTIC_SCHEMA;
  RMT_COMMAND_SCHEMA: typeof RMT_COMMAND_SCHEMA;
  RMT_HOST_SERVICE_SCHEMA: typeof RMT_HOST_SERVICE_SCHEMA;
  RMT_STREAM_PATCH_SCHEMA: typeof RMT_STREAM_PATCH_SCHEMA;
  RMT_STREAM_PATCH_PLAN_SCHEMA: typeof RMT_STREAM_PATCH_PLAN_SCHEMA;
  RMT_STREAM_PATCH_COMMIT_SCHEMA: typeof RMT_STREAM_PATCH_COMMIT_SCHEMA;
  RMT_STREAM_PRESSURE_SCHEMA: typeof RMT_STREAM_PRESSURE_SCHEMA;
  RMT_YIELD_ACTION_SCHEMA: typeof RMT_YIELD_ACTION_SCHEMA;
  RMT_VIEW_TEMPLATE_SCHEMA: typeof RMT_VIEW_TEMPLATE_SCHEMA;
  RMT_APP_PRESENTATION_MODEL_SCHEMA: typeof RMT_APP_PRESENTATION_MODEL_SCHEMA;
  RMT_SEARCH_RUNTIME_SCHEMA: typeof RMT_SEARCH_RUNTIME_SCHEMA;
  RMT_SEARCH_RESPONSE_SCHEMA: typeof RMT_SEARCH_RESPONSE_SCHEMA;
  RMT_SEARCH_RECOMMENDATION_RESPONSE_SCHEMA: typeof RMT_SEARCH_RECOMMENDATION_RESPONSE_SCHEMA;
  RMT_SEARCH_WORKER_SCHEMA: typeof RMT_SEARCH_WORKER_SCHEMA;
  createRmtCommandEnvelope: typeof createRmtCommandEnvelope;
  isRmtCommandEnvelope: typeof isRmtCommandEnvelope;
  commandFromComponentEvent: typeof commandFromComponentEvent;
  createRmtHostServiceRegistry: typeof createRmtHostServiceRegistry;
  createRmtStreamPatch: typeof createRmtStreamPatch;
  createRmtStreamPatchPlan: typeof createRmtStreamPatchPlan;
  applyRmtStreamPatch: typeof applyRmtStreamPatch;
  applyRmtReducer: typeof applyRmtReducer;
  applyRmtReducerRecipe: typeof applyRmtReducerRecipe;
  createRmtAppPresentationModel: typeof createRmtAppPresentationModel;
  createRmtViewTemplateDescriptor: typeof createRmtViewTemplateDescriptor;
  createNoManualUiWiringGate: typeof createNoManualUiWiringGate;
  normalizeSearchText: typeof normalizeSearchText;
  boundedDamerauLevenshtein: typeof boundedDamerauLevenshtein;
  searchEntries: typeof searchEntries;
  recommendEntries: typeof recommendEntries;
  createRmtSearchWorkerSource: typeof createRmtSearchWorkerSource;
  createRmtSearchPrewarmWorker: typeof createRmtSearchPrewarmWorker;
  createRmtSearchRuntime: typeof createRmtSearchRuntime;
  createRmtAppRuntime: typeof createRmtAppRuntime;
};

export default api;
