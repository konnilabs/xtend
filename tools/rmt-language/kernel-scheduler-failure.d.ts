export * from './rmt-tooling-public-types';
import type { RmtToolingConstant, RmtToolingFactory, RmtToolingFunction } from './rmt-tooling-public-types';
import type { RmtKernelPanicMonitor, RmtKernelPanicState } from './kernel-panic-monitor';

export type RmtKernelSchedulerFinalStatus =
  | 'scheduled'
  | 'dispatch_pending'
  | 'running'
  | 'executed'
  | 'failed'
  | 'cancelled'
  | 'aborted'
  | 'stale_scope'
  | 'stale_root'
  | 'panic_blocked';
export type RmtKernelSchedulerFailureStatus = 'failed' | 'aborted' | 'panic_blocked';
export type RmtKernelSchedulerFailureSeverity = 'info' | 'warning' | 'error' | 'critical' | 'fatal';

export interface RmtKernelSchedulerFailurePolicy {
  schema: typeof RMT_KERNEL_SCHEDULER_FAILURE_POLICY_SCHEMA;
  schedulerFailureSchema: typeof RMT_KERNEL_SCHEDULER_FAILURE_SCHEMA;
  panicMonitorSchema: string;
  workpackage: typeof RMT_KERNEL_SCHEDULER_FAILURE_WORKPACKAGE;
  callbackFailureSeverity: RmtKernelSchedulerFailureSeverity;
  abortSeverity: RmtKernelSchedulerFailureSeverity;
  panicBlockedSeverity: RmtKernelSchedulerFailureSeverity;
  backpressureSeverity: RmtKernelSchedulerFailureSeverity;
  panicSeverityThreshold: RmtKernelSchedulerFailureSeverity;
  diagnosticsChannel: string;
  escalationDiagnosticsChannel: string;
  panicDiagnosticsChannel: string;
  callbackFailureActivatesPanic: boolean;
  backpressureActivatesPanic: boolean;
  trustRelevantActivatesPanic: boolean;
  redactsPayload: boolean;
}

export interface RmtKernelSchedulerFailureRecord {
  schema: typeof RMT_KERNEL_SCHEDULER_FAILURE_RECORD_SCHEMA;
  schedulerFailureSchema: typeof RMT_KERNEL_SCHEDULER_FAILURE_SCHEMA;
  policySchema: typeof RMT_KERNEL_SCHEDULER_FAILURE_POLICY_SCHEMA;
  panicMonitorSchema: string;
  panicStateSchema: string;
  workpackage: typeof RMT_KERNEL_SCHEDULER_FAILURE_WORKPACKAGE;
  recordId: string;
  eventType: string;
  jobId: string;
  status: RmtKernelSchedulerFailureStatus | string;
  reason: string;
  severity: RmtKernelSchedulerFailureSeverity;
  panicRelevant: boolean;
  trustRelevant: boolean;
  trigger: string;
  scope: string;
  sourceRef: string;
  rootId: string | null;
  rootVersion: number | null;
  lane: string;
  strategy: string;
  pressureLevel: string | null;
  waitMs: number;
  runMs: number;
  scheduledAt: number | null;
  startedAt: number | null;
  finishedAt: number | null;
  diagnosticCode: string;
  reasonCode: string;
  error: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  createdAt: number;
  panicState?: RmtKernelPanicState | Record<string, unknown> | null;
}

export interface RmtKernelSchedulerFailureContract {
  schema: typeof RMT_KERNEL_SCHEDULER_FAILURE_SCHEMA;
  policySchema: typeof RMT_KERNEL_SCHEDULER_FAILURE_POLICY_SCHEMA;
  recordSchema: typeof RMT_KERNEL_SCHEDULER_FAILURE_RECORD_SCHEMA;
  panicMonitorSchema: string;
  panicStateSchema: string;
  reportSchema: typeof RMT_KERNEL_SCHEDULER_FAILURE_REPORT_SCHEMA;
  workpackage: typeof RMT_KERNEL_SCHEDULER_FAILURE_WORKPACKAGE;
  status: string;
  module: typeof RMT_KERNEL_SCHEDULER_FAILURE_MODULE_PATH;
  suite: typeof RMT_KERNEL_SCHEDULER_FAILURE_SUITE_PATH;
  localGate: string;
  packageScript: typeof RMT_KERNEL_SCHEDULER_FAILURE_PACKAGE_SCRIPT;
  diagnosticsChannel: typeof RMT_KERNEL_SCHEDULER_FAILURE_DIAGNOSTIC_CHANNEL;
  escalationDiagnosticsChannel: typeof RMT_KERNEL_SCHEDULER_ESCALATION_DIAGNOSTIC_CHANNEL;
  hostNeutral: boolean;
  finalStatuses: RmtKernelSchedulerFinalStatus[];
  failureStatuses: RmtKernelSchedulerFailureStatus[];
  severities: RmtKernelSchedulerFailureSeverity[];
  defaultPolicy: RmtKernelSchedulerFailurePolicy;
  runtimeAdapterHooks: string[];
  invariants: string[];
  handoff: string[];
}

export interface RmtKernelSchedulerFailureController {
  schema: typeof RMT_KERNEL_SCHEDULER_FAILURE_SCHEMA;
  contract: RmtKernelSchedulerFailureContract;
  policy: RmtKernelSchedulerFailurePolicy;
  panicMonitor: RmtKernelPanicMonitor;
  getSchedulerFailurePolicy(): RmtKernelSchedulerFailurePolicy;
  recordFailure(input?: Record<string, unknown>): RmtKernelSchedulerFailureRecord;
  recordCallbackFailure(input?: Record<string, unknown>): RmtKernelSchedulerFailureRecord;
  recordAbort(input?: Record<string, unknown>): RmtKernelSchedulerFailureRecord;
  recordPanicBlocked(input?: Record<string, unknown>): RmtKernelSchedulerFailureRecord;
  recordBackpressure(input?: Record<string, unknown>): RmtKernelSchedulerFailureRecord;
  listFailures(): RmtKernelSchedulerFailureRecord[];
}

export declare const DEFAULT_KERNEL_SCHEDULER_FAILURE_POLICY: RmtToolingConstant;
export declare const KERNEL_SCHEDULER_FAILURE_SEVERITIES: RmtToolingConstant;
export declare const KERNEL_SCHEDULER_FAILURE_STATUSES: RmtToolingConstant;
export declare const KERNEL_SCHEDULER_FINAL_STATUSES: RmtToolingConstant;
export declare const RMT_KERNEL_SCHEDULER_ESCALATION_DIAGNOSTIC_CHANNEL: RmtToolingConstant;
export declare const RMT_KERNEL_SCHEDULER_FAILURE_CONTRACT_PATH: RmtToolingConstant;
export declare const RMT_KERNEL_SCHEDULER_FAILURE_DIAGNOSTIC_CHANNEL: RmtToolingConstant;
export declare const RMT_KERNEL_SCHEDULER_FAILURE_MODULE_PATH: RmtToolingConstant;
export declare const RMT_KERNEL_SCHEDULER_FAILURE_PACKAGE_SCRIPT: RmtToolingConstant;
export declare const RMT_KERNEL_SCHEDULER_FAILURE_POLICY_SCHEMA: RmtToolingConstant;
export declare const RMT_KERNEL_SCHEDULER_FAILURE_RECORD_SCHEMA: RmtToolingConstant;
export declare const RMT_KERNEL_SCHEDULER_FAILURE_REPORT_SCHEMA: RmtToolingConstant;
export declare const RMT_KERNEL_SCHEDULER_FAILURE_SCHEMA: RmtToolingConstant;
export declare const RMT_KERNEL_SCHEDULER_FAILURE_SUITE_PATH: RmtToolingConstant;
export declare const RMT_KERNEL_SCHEDULER_FAILURE_WORKPACKAGE: RmtToolingConstant;
export declare const RMT_KERNEL_SCHEDULER_FAILURE_WP_PATH: RmtToolingConstant;
export declare const classifySchedulerFinalStatus: RmtToolingFunction;
export declare const createKernelSchedulerFailureContract: RmtToolingFactory;
export declare const createKernelSchedulerFailureController: RmtToolingFactory;
export declare const createKernelSchedulerFailurePolicy: RmtToolingFunction;
export declare const createKernelSchedulerFailureRecord: RmtToolingFunction;
export declare const redactSchedulerFailureMetadata: RmtToolingFunction;
export declare const serializeKernelSchedulerFailureContract: RmtToolingFunction;
export declare const serializeKernelSchedulerFailureRecord: RmtToolingFunction;
