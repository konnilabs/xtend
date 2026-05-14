export * from './rmt-tooling-public-types';
import type { RmtToolingConstant, RmtToolingFactory, RmtToolingFunction } from './rmt-tooling-public-types';
import type { RmtKernelPanicMonitor, RmtKernelPanicState } from './kernel-panic-monitor';

export type RmtKernelRecoveryAction =
  | 'quarantine-scope'
  | 'pause-scheduler-jobs'
  | 'restore-last-safe-snapshot'
  | 'render-safe-fallback'
  | 'notify-host'
  | 'mark-recovered'
  | 'mark-failed';
export type RmtKernelRecoveryOutcomeStatus = 'planned' | 'recovering' | 'recovered' | 'failed' | 'skipped';
export type RmtKernelRecoveryFallbackPolicy = 'text-only' | 'trusted-html' | 'sanitized-html';

export interface RmtKernelRecoveryPolicy {
  schema: typeof RMT_KERNEL_RECOVERY_POLICY_SCHEMA;
  recoverySchema: typeof RMT_KERNEL_RECOVERY_SCHEMA;
  panicMonitorSchema: string;
  workpackage: typeof RMT_KERNEL_RECOVERY_WORKPACKAGE;
  quarantineAffectedScope: boolean;
  pausePendingSchedulerJobs: boolean;
  restoreLastSafeSnapshot: boolean;
  renderSafeFallback: boolean;
  notifyHost: boolean;
  failWithoutRestoreOrFallback: boolean;
  fallbackPolicy: RmtKernelRecoveryFallbackPolicy;
  safeFallbackText: string;
  safeFallbackHtml: string;
  diagnosticsChannel: string;
  panicDiagnosticsChannel: string;
  recoveryFailureEscalatesPanic: boolean;
  redactsRawOutput: boolean;
}

export interface RmtKernelRecoverySafeSnapshot {
  schema: typeof RMT_KERNEL_RECOVERY_SAFE_SNAPSHOT_SCHEMA;
  recoverySchema: typeof RMT_KERNEL_RECOVERY_SCHEMA;
  workpackage: typeof RMT_KERNEL_RECOVERY_WORKPACKAGE;
  snapshotId: string;
  snapshotKey: string;
  rootId: string | null;
  scope: string;
  sourceRef: string | null;
  templateQualifiedId: string | null;
  trustBoundary: string;
  commitAllowed: boolean;
  sanitized: boolean;
  html: string;
  textContent: string;
  modelSnapshot: Record<string, unknown>;
  capturedAt: number;
  metadata: Record<string, unknown>;
}

export interface RmtKernelRecoveryPlan {
  schema: typeof RMT_KERNEL_RECOVERY_PLAN_SCHEMA;
  recoverySchema: typeof RMT_KERNEL_RECOVERY_SCHEMA;
  policySchema: typeof RMT_KERNEL_RECOVERY_POLICY_SCHEMA;
  panicMonitorSchema: string;
  workpackage: typeof RMT_KERNEL_RECOVERY_WORKPACKAGE;
  planId: string;
  scope: string;
  rootId: string | null;
  templateQualifiedId: string | null;
  panicId: string | null;
  correlationId: string | null;
  actions: RmtKernelRecoveryAction[];
  forceFallback: boolean;
  safeFallbackText: string;
  safeFallbackHtml: string;
  panicSnapshot: Record<string, unknown> | RmtKernelPanicState;
  createdAt: number;
  metadata: Record<string, unknown>;
}

export interface RmtKernelRecoveryOutcome {
  schema: typeof RMT_KERNEL_RECOVERY_OUTCOME_SCHEMA;
  recoverySchema: typeof RMT_KERNEL_RECOVERY_SCHEMA;
  planSchema: typeof RMT_KERNEL_RECOVERY_PLAN_SCHEMA;
  safeSnapshotSchema: typeof RMT_KERNEL_RECOVERY_SAFE_SNAPSHOT_SCHEMA;
  workpackage: typeof RMT_KERNEL_RECOVERY_WORKPACKAGE;
  outcomeId: string;
  planId: string | null;
  status: RmtKernelRecoveryOutcomeStatus;
  scope: string | null;
  rootId: string | null;
  panicId: string | null;
  correlationId: string | null;
  quarantined: boolean;
  schedulerPaused: boolean;
  restoredSnapshotId: string | null;
  fallbackRendered: boolean;
  hostNotified: boolean;
  actions: string[];
  failures: Array<Record<string, unknown>>;
  panicState: RmtKernelPanicState | Record<string, unknown> | null;
  completedAt: number;
  metadata: Record<string, unknown>;
}

export interface RmtKernelRecoveryContract {
  schema: typeof RMT_KERNEL_RECOVERY_SCHEMA;
  policySchema: typeof RMT_KERNEL_RECOVERY_POLICY_SCHEMA;
  planSchema: typeof RMT_KERNEL_RECOVERY_PLAN_SCHEMA;
  outcomeSchema: typeof RMT_KERNEL_RECOVERY_OUTCOME_SCHEMA;
  safeSnapshotSchema: typeof RMT_KERNEL_RECOVERY_SAFE_SNAPSHOT_SCHEMA;
  panicMonitorSchema: string;
  panicStateSchema: string;
  reportSchema: typeof RMT_KERNEL_RECOVERY_REPORT_SCHEMA;
  workpackage: typeof RMT_KERNEL_RECOVERY_WORKPACKAGE;
  status: string;
  module: typeof RMT_KERNEL_RECOVERY_MODULE_PATH;
  suite: typeof RMT_KERNEL_RECOVERY_SUITE_PATH;
  localGate: string;
  packageScript: typeof RMT_KERNEL_RECOVERY_PACKAGE_SCRIPT;
  hostNeutral: boolean;
  actions: RmtKernelRecoveryAction[];
  outcomeStatuses: RmtKernelRecoveryOutcomeStatus[];
  fallbackPolicies: RmtKernelRecoveryFallbackPolicy[];
  defaultPolicy: RmtKernelRecoveryPolicy;
  runtimeAdapterHooks: string[];
  handoff: string[];
}

export interface RmtKernelRecoveryController {
  schema: typeof RMT_KERNEL_RECOVERY_SCHEMA;
  contract: RmtKernelRecoveryContract;
  policy: RmtKernelRecoveryPolicy;
  panicMonitor: RmtKernelPanicMonitor;
  rememberSafeSnapshot(input?: Record<string, unknown>): RmtKernelRecoverySafeSnapshot | null;
  getLastSafeSnapshot(input?: Record<string, unknown>): RmtKernelRecoverySafeSnapshot | null;
  listSafeSnapshots(): RmtKernelRecoverySafeSnapshot[];
  registerPendingJob(input?: Record<string, unknown>): Record<string, unknown> | null;
  pausePendingJobs(input?: Record<string, unknown>): string[];
  listPendingJobs(): Array<Record<string, unknown>>;
  quarantineScope(input?: Record<string, unknown>): string;
  listQuarantinedScopes(): string[];
  isScopeQuarantined(input?: Record<string, unknown>): boolean;
  createPlan(input?: Record<string, unknown>): RmtKernelRecoveryPlan;
  executeRecoveryPlan(plan?: RmtKernelRecoveryPlan | Record<string, unknown>, adapter?: Record<string, unknown>): RmtKernelRecoveryOutcome;
  recover(input?: Record<string, unknown>, adapter?: Record<string, unknown>): RmtKernelRecoveryOutcome;
  listRecoveryOutcomes(): RmtKernelRecoveryOutcome[];
}

export declare const DEFAULT_RECOVERY_POLICY: RmtToolingConstant;
export declare const KERNEL_RECOVERY_ACTIONS: RmtToolingConstant;
export declare const KERNEL_RECOVERY_OUTCOME_STATUSES: RmtToolingConstant;
export declare const KERNEL_RECOVERY_SAFE_FALLBACK_POLICY: RmtToolingConstant;
export declare const RMT_KERNEL_RECOVERY_CONTRACT_PATH: RmtToolingConstant;
export declare const RMT_KERNEL_RECOVERY_DIAGNOSTIC_CHANNEL: RmtToolingConstant;
export declare const RMT_KERNEL_RECOVERY_MODULE_PATH: RmtToolingConstant;
export declare const RMT_KERNEL_RECOVERY_OUTCOME_SCHEMA: RmtToolingConstant;
export declare const RMT_KERNEL_RECOVERY_PACKAGE_SCRIPT: RmtToolingConstant;
export declare const RMT_KERNEL_RECOVERY_PLAN_SCHEMA: RmtToolingConstant;
export declare const RMT_KERNEL_RECOVERY_POLICY_SCHEMA: RmtToolingConstant;
export declare const RMT_KERNEL_RECOVERY_REPORT_SCHEMA: RmtToolingConstant;
export declare const RMT_KERNEL_RECOVERY_SAFE_SNAPSHOT_SCHEMA: RmtToolingConstant;
export declare const RMT_KERNEL_RECOVERY_SCHEMA: RmtToolingConstant;
export declare const RMT_KERNEL_RECOVERY_SUITE_PATH: RmtToolingConstant;
export declare const RMT_KERNEL_RECOVERY_WORKPACKAGE: RmtToolingConstant;
export declare const RMT_KERNEL_RECOVERY_WP_PATH: RmtToolingConstant;
export declare const createKernelRecoveryContract: RmtToolingFactory;
export declare const createKernelRecoveryController: RmtToolingFactory;
export declare const createKernelRecoveryOutcome: RmtToolingFunction;
export declare const createKernelRecoveryPlan: RmtToolingFunction;
export declare const createKernelRecoveryPolicy: RmtToolingFunction;
export declare const createKernelRecoverySafeSnapshot: RmtToolingFunction;
export declare const redactRecoveryMetadata: RmtToolingFunction;
export declare const sanitizeRecoveryHtml: RmtToolingFunction;
export declare const serializeKernelRecoveryContract: RmtToolingFunction;
export declare const serializeKernelRecoveryOutcome: RmtToolingFunction;
export declare const serializeKernelRecoveryPlan: RmtToolingFunction;
