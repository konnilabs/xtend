export const SUPER_PREWARM_WORKER_EXPERIMENT_SCHEMA: 'xtend.maraca.super-prewarm-worker-experiment.v1';
export const SUPER_PREWARM_WORKER_RUN_SCHEMA: 'xtend.maraca.super-prewarm-worker-run.v1';
export const SUPER_PREWARM_WORKER_DIAGNOSTIC_SCHEMA: 'xtend.maraca.super-prewarm-worker-diagnostic.v1';
export const SUPER_PREWARM_WORKER_EVIDENCE_REPORT_PATH: '.xtend-test-results/xtend-super-prewarm-worker-experiment-report.json';

export type SuperPrewarmWorkerRunMode = 'baseline' | 'prewarmWorker' | 'superPrewarmWorker';
export type SuperPrewarmWorkerCachePass = 'cold' | 'warm';
export type SuperPrewarmWorkerClassification = 'positive-signal' | 'neutral' | 'negative-signal' | 'inconclusive';

export interface SuperPrewarmWorkerPwaContext {
  manifestRef: string;
  cacheMode: string;
  serviceWorkerControlled: boolean;
  offlineEligible: boolean;
}

export interface SuperPrewarmWorkerStateContext {
  stateSnapshotHash: string;
  stateProjectionMode: string;
  stateOwnership: 'main-thread' | string;
}

export interface SuperPrewarmWorkerSsrContext {
  ssrRoundtripCount: number;
  serverPrerenderUsed: boolean;
  clientDetermined: boolean;
}

export interface SuperPrewarmWorkerMetrics {
  bootTimeMs: number;
  templateSyncTimeMs: number;
  queueDepthMax: number;
  computeLatencyMs: number;
  transferBytes: number;
  staleResponses: number;
  supersededResponses: number;
  missingApis: string[];
  available: boolean;
}

export interface SuperPrewarmWorkerUiMetrics {
  visibleCommitMs: number;
  interactionReadyMs: number;
  hydrationCommitMs: number;
  longTaskCount: number;
  mainThreadBusyMs: number;
}

export interface SuperPrewarmWorkerRun {
  schema: typeof SUPER_PREWARM_WORKER_RUN_SCHEMA;
  id: string;
  mode: SuperPrewarmWorkerRunMode;
  cachePass: SuperPrewarmWorkerCachePass;
  scenario: string;
  sampleCount: number;
  lanes: Record<string, string>;
  pwa: SuperPrewarmWorkerPwaContext;
  state: SuperPrewarmWorkerStateContext;
  ssr: SuperPrewarmWorkerSsrContext;
  worker: SuperPrewarmWorkerMetrics;
  ui: SuperPrewarmWorkerUiMetrics;
  boundaries: Record<string, unknown>;
  samples: Array<Record<string, unknown>>;
}

export interface SuperPrewarmWorkerExperimentReport {
  schema: typeof SUPER_PREWARM_WORKER_EXPERIMENT_SCHEMA;
  runSchema: typeof SUPER_PREWARM_WORKER_RUN_SCHEMA;
  diagnosticSchema: typeof SUPER_PREWARM_WORKER_DIAGNOSTIC_SCHEMA;
  status: string;
  ok: boolean;
  classification: SuperPrewarmWorkerClassification;
  evidenceMode: string;
  releaseBlocking: false;
  reportPath: string;
  runModes: SuperPrewarmWorkerRunMode[];
  cachePasses: SuperPrewarmWorkerCachePass[];
  modeCoverageComplete: boolean;
  cacheCoverageComplete: boolean;
  pwaAttachment: Record<string, unknown>;
  boundaries: Record<string, unknown>;
  lanes: Record<string, string>;
  summary: Record<string, unknown>;
  runs: SuperPrewarmWorkerRun[];
  diagnostics: Array<Record<string, unknown>>;
}

export function createUiComputeEnvelope(input?: Record<string, unknown>): Record<string, unknown>;
export function createSuperPrewarmWorkerExperimentReport(
  input?: { runs?: Array<Record<string, unknown>> } & Record<string, unknown>,
  options?: { reportPath?: string } & Record<string, unknown>
): SuperPrewarmWorkerExperimentReport;
