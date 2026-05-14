export * from './rmt-tooling-public-types';
import type { RmtToolingConstant, RmtToolingFactory, RmtToolingFunction } from './rmt-tooling-public-types';
import type { RmtKernelTrustVerdict } from './kernel-trust-authority';

export type RmtKernelPanicStateKind = 'none' | 'suspected' | 'active' | 'recovering' | 'recovered' | 'failed';
export type RmtKernelPanicSeverity = 'info' | 'warning' | 'error' | 'critical' | 'fatal';
export type RmtKernelPanicTrigger =
  | 'trust-verdict-blocked'
  | 'trust-verdict-panic'
  | 'scheduler-failure'
  | 'command-bus-failure'
  | 'diagnostics-failure'
  | 'adapter-output-blocked'
  | 'threshold-breached'
  | 'recovery-failure'
  | 'manual';
export type RmtKernelPanicEventType =
  | 'signal-recorded'
  | 'state-transition'
  | 'recovery-started'
  | 'recovery-completed'
  | 'recovery-failed'
  | 'reset';
export type RmtKernelPanicRecoveryAction =
  | 'none'
  | 'observe'
  | 'quarantine-scope'
  | 'pause-scheduler'
  | 'rollback-last-safe-snapshot'
  | 'render-safe-fallback'
  | 'notify-host'
  | 'manual-intervention';

export interface RmtKernelPanicEscalationPolicy {
  repeatedBlockThreshold: number;
  recoveryFailureThreshold: number;
  criticalTrustViolationsActivate: boolean;
  panicCandidateActivates: boolean;
  fatalSeverityActivates: boolean;
  thresholdState: RmtKernelPanicStateKind | string;
  suspectedState: RmtKernelPanicStateKind | string;
  diagnosticsChannel: string;
  defaultRecoveryAction: RmtKernelPanicRecoveryAction | string;
  redactsRawOutput: boolean;
  triggerSources: string[];
}

export interface RmtKernelPanicState {
  schema: typeof RMT_KERNEL_PANIC_STATE_SCHEMA;
  monitorSchema: typeof RMT_KERNEL_PANIC_MONITOR_SCHEMA;
  workpackage: typeof RMT_KERNEL_PANIC_MONITOR_WORKPACKAGE;
  state: RmtKernelPanicStateKind;
  previousState: RmtKernelPanicStateKind;
  severity: RmtKernelPanicSeverity;
  trigger: RmtKernelPanicTrigger;
  panicId: string | null;
  correlationId: string | null;
  sourceRef: string | null;
  scope: string | null;
  sink: string | null;
  reasonCode: string | null;
  diagnosticCode: string | null;
  blockedCommitCount: number;
  criticalViolationCount: number;
  recoveryAttemptCount: number;
  recoveryFailureCount: number;
  recoveryAction: RmtKernelPanicRecoveryAction | string;
  affectedScopes: string[];
  affectedJobs: string[];
  activeSince: number | null;
  recoveringSince: number | null;
  recoveredAt: number | null;
  failedAt: number | null;
  lastSeenAt: number;
  eventCount: number;
  lastEventId: string | null;
  lastVerdict: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
}

export interface RmtKernelPanicEvent {
  schema: typeof RMT_KERNEL_PANIC_EVENT_SCHEMA;
  monitorSchema: typeof RMT_KERNEL_PANIC_MONITOR_SCHEMA;
  stateSchema: typeof RMT_KERNEL_PANIC_STATE_SCHEMA;
  workpackage: typeof RMT_KERNEL_PANIC_MONITOR_WORKPACKAGE;
  eventId: string;
  type: RmtKernelPanicEventType;
  previousState: RmtKernelPanicStateKind;
  state: RmtKernelPanicStateKind;
  severity: RmtKernelPanicSeverity;
  trigger: RmtKernelPanicTrigger;
  panicId: string | null;
  correlationId: string | null;
  sourceRef: string | null;
  scope: string | null;
  sink: string | null;
  reasonCode: string | null;
  diagnosticCode: string | null;
  blockedCommitCount: number;
  criticalViolationCount: number;
  recoveryAttemptCount: number;
  recoveryFailureCount: number;
  recoveryAction: RmtKernelPanicRecoveryAction | string;
  at: number;
  metadata: Record<string, unknown>;
}

export interface RmtKernelPanicMonitorContract {
  schema: typeof RMT_KERNEL_PANIC_MONITOR_SCHEMA;
  stateSchema: typeof RMT_KERNEL_PANIC_STATE_SCHEMA;
  eventSchema: typeof RMT_KERNEL_PANIC_EVENT_SCHEMA;
  trustAuthoritySchema: string;
  trustVerdictSchema: string;
  reportSchema: typeof RMT_KERNEL_PANIC_MONITOR_REPORT_SCHEMA;
  workpackage: typeof RMT_KERNEL_PANIC_MONITOR_WORKPACKAGE;
  status: string;
  module: typeof RMT_KERNEL_PANIC_MONITOR_MODULE_PATH;
  suite: typeof RMT_KERNEL_PANIC_MONITOR_SUITE_PATH;
  localGate: string;
  packageScript: typeof RMT_KERNEL_PANIC_MONITOR_PACKAGE_SCRIPT;
  hostNeutral: boolean;
  states: RmtKernelPanicStateKind[];
  severities: RmtKernelPanicSeverity[];
  triggers: RmtKernelPanicTrigger[];
  scopes: string[];
  eventTypes: RmtKernelPanicEventType[];
  recoveryActions: RmtKernelPanicRecoveryAction[];
  escalationPolicy: RmtKernelPanicEscalationPolicy;
  runtimeAdapterHooks: string[];
  handoff: string[];
}

export interface RmtKernelPanicMonitor {
  schema: typeof RMT_KERNEL_PANIC_MONITOR_SCHEMA;
  contract: RmtKernelPanicMonitorContract;
  getEscalationPolicy(): RmtKernelPanicEscalationPolicy;
  getSnapshot(): RmtKernelPanicState;
  getState(): RmtKernelPanicStateKind;
  listEvents(): RmtKernelPanicEvent[];
  recordSignal(input?: Record<string, unknown>): RmtKernelPanicState;
  recordTrustVerdict(verdict: RmtKernelTrustVerdict | Record<string, unknown>, overrides?: Record<string, unknown>): RmtKernelPanicState;
  beginRecovery(input?: Record<string, unknown>): RmtKernelPanicState;
  completeRecovery(input?: Record<string, unknown>): RmtKernelPanicState;
  failRecovery(input?: Record<string, unknown>): RmtKernelPanicState;
  reset(input?: Record<string, unknown>): RmtKernelPanicState;
  subscribe(listener: (event: RmtKernelPanicEvent, snapshot: RmtKernelPanicState) => void): () => boolean;
}

export declare const DEFAULT_ESCALATION_POLICY: RmtToolingConstant;
export declare const KERNEL_PANIC_EVENT_TYPES: RmtToolingConstant;
export declare const KERNEL_PANIC_RECOVERY_ACTIONS: RmtToolingConstant;
export declare const KERNEL_PANIC_SCOPES: RmtToolingConstant;
export declare const KERNEL_PANIC_SEVERITIES: RmtToolingConstant;
export declare const KERNEL_PANIC_STATES: RmtToolingConstant;
export declare const KERNEL_PANIC_TRIGGERS: RmtToolingConstant;
export declare const RMT_KERNEL_PANIC_DIAGNOSTIC_CHANNEL: RmtToolingConstant;
export declare const RMT_KERNEL_PANIC_EVENT_SCHEMA: RmtToolingConstant;
export declare const RMT_KERNEL_PANIC_MONITOR_CONTRACT_PATH: RmtToolingConstant;
export declare const RMT_KERNEL_PANIC_MONITOR_MODULE_PATH: RmtToolingConstant;
export declare const RMT_KERNEL_PANIC_MONITOR_PACKAGE_SCRIPT: RmtToolingConstant;
export declare const RMT_KERNEL_PANIC_MONITOR_REPORT_SCHEMA: RmtToolingConstant;
export declare const RMT_KERNEL_PANIC_MONITOR_SCHEMA: RmtToolingConstant;
export declare const RMT_KERNEL_PANIC_MONITOR_SUITE_PATH: RmtToolingConstant;
export declare const RMT_KERNEL_PANIC_MONITOR_WORKPACKAGE: RmtToolingConstant;
export declare const RMT_KERNEL_PANIC_MONITOR_WP_PATH: RmtToolingConstant;
export declare const RMT_KERNEL_PANIC_STATE_SCHEMA: RmtToolingConstant;
export declare const createKernelPanicEvent: RmtToolingFunction;
export declare const createKernelPanicMonitor: RmtToolingFactory;
export declare const createKernelPanicMonitorContract: RmtToolingFactory;
export declare const createKernelPanicState: RmtToolingFunction;
export declare const createSignalFromTrustVerdict: RmtToolingFunction;
export declare const normalizePanicSignal: RmtToolingFunction;
export declare const redactPanicMetadata: RmtToolingFunction;
export declare const serializeKernelPanicEvent: RmtToolingFunction;
export declare const serializeKernelPanicMonitorContract: RmtToolingFunction;
export declare const serializeKernelPanicState: RmtToolingFunction;
