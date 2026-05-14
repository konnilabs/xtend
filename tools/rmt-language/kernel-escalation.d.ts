export * from './rmt-tooling-public-types';
import type { RmtToolingConstant, RmtToolingFactory, RmtToolingFunction } from './rmt-tooling-public-types';
import type { RmtKernelPanicMonitor, RmtKernelPanicState } from './kernel-panic-monitor';

export type RmtKernelEscalationSource = 'diagnostics' | 'command-bus' | 'scheduler' | 'adapter' | 'kernel';
export type RmtKernelEscalationEventType =
  | 'diagnostics-subscriber-failure'
  | 'command-handler-failure'
  | 'command-response-failed'
  | 'command-missing-handler'
  | 'command-subscriber-failure'
  | 'manual';
export type RmtKernelEscalationSeverity = 'info' | 'warning' | 'error' | 'critical' | 'fatal';

export interface RmtKernelEscalationPolicy {
  schema: typeof RMT_KERNEL_ESCALATION_POLICY_SCHEMA;
  escalationSchema: typeof RMT_KERNEL_ESCALATION_SCHEMA;
  panicMonitorSchema: string;
  workpackage: typeof RMT_KERNEL_ESCALATION_WORKPACKAGE;
  diagnosticsSubscriberFailureSeverity: RmtKernelEscalationSeverity;
  commandHandlerFailureSeverity: RmtKernelEscalationSeverity;
  missingCommandHandlerSeverity: RmtKernelEscalationSeverity;
  commandSubscriberFailureSeverity: RmtKernelEscalationSeverity;
  panicSeverityThreshold: RmtKernelEscalationSeverity;
  diagnosticsChannel: string;
  panicDiagnosticsChannel: string;
  escalateCriticalDiagnostics: boolean;
  escalateCriticalCommandFailures: boolean;
  passthroughNonCriticalFailures: boolean;
  redactsPayload: boolean;
  trustRelevantActivatesPanic: boolean;
}

export interface RmtKernelEscalationEnvelope {
  schema: typeof RMT_KERNEL_ESCALATION_ENVELOPE_SCHEMA;
  escalationSchema: typeof RMT_KERNEL_ESCALATION_SCHEMA;
  policySchema: typeof RMT_KERNEL_ESCALATION_POLICY_SCHEMA;
  panicMonitorSchema: string;
  panicStateSchema: string;
  workpackage: typeof RMT_KERNEL_ESCALATION_WORKPACKAGE;
  envelopeId: string;
  source: RmtKernelEscalationSource;
  eventType: RmtKernelEscalationEventType;
  severity: RmtKernelEscalationSeverity;
  panicRelevant: boolean;
  trustRelevant: boolean;
  trigger: string;
  scope: string;
  sourceRef: string | null;
  channel: string | null;
  commandName: string | null;
  correlationId: string | null;
  rootId: string | null;
  responseStatus: string | null;
  reasonCode: string;
  diagnosticCode: string;
  error: Record<string, unknown> | null;
  createdAt: number;
  panicSignal: Record<string, unknown>;
  panicState?: RmtKernelPanicState | Record<string, unknown> | null;
  metadata: Record<string, unknown>;
}

export interface RmtKernelEscalationContract {
  schema: typeof RMT_KERNEL_ESCALATION_SCHEMA;
  policySchema: typeof RMT_KERNEL_ESCALATION_POLICY_SCHEMA;
  envelopeSchema: typeof RMT_KERNEL_ESCALATION_ENVELOPE_SCHEMA;
  panicMonitorSchema: string;
  panicStateSchema: string;
  reportSchema: typeof RMT_KERNEL_ESCALATION_REPORT_SCHEMA;
  workpackage: typeof RMT_KERNEL_ESCALATION_WORKPACKAGE;
  status: string;
  module: typeof RMT_KERNEL_ESCALATION_MODULE_PATH;
  suite: typeof RMT_KERNEL_ESCALATION_SUITE_PATH;
  localGate: string;
  packageScript: typeof RMT_KERNEL_ESCALATION_PACKAGE_SCRIPT;
  diagnosticsChannel: typeof RMT_KERNEL_ESCALATION_DIAGNOSTIC_CHANNEL;
  hostNeutral: boolean;
  sources: RmtKernelEscalationSource[];
  eventTypes: RmtKernelEscalationEventType[];
  severities: RmtKernelEscalationSeverity[];
  defaultPolicy: RmtKernelEscalationPolicy;
  runtimeAdapterHooks: string[];
  handoff: string[];
}

export interface RmtKernelEscalationController {
  schema: typeof RMT_KERNEL_ESCALATION_SCHEMA;
  contract: RmtKernelEscalationContract;
  policy: RmtKernelEscalationPolicy;
  panicMonitor: RmtKernelPanicMonitor;
  getEscalationPolicy(): RmtKernelEscalationPolicy;
  recordEscalation(input?: Record<string, unknown>): RmtKernelEscalationEnvelope;
  recordDiagnosticsSubscriberFailure(input?: Record<string, unknown>): RmtKernelEscalationEnvelope;
  recordCommandHandlerFailure(input?: Record<string, unknown>): RmtKernelEscalationEnvelope;
  recordCommandResponseFailure(input?: Record<string, unknown>): RmtKernelEscalationEnvelope;
  recordCommandSubscriberFailure(input?: Record<string, unknown>): RmtKernelEscalationEnvelope;
  listEscalations(): RmtKernelEscalationEnvelope[];
}

export declare const DEFAULT_KERNEL_ESCALATION_POLICY: RmtToolingConstant;
export declare const KERNEL_ESCALATION_EVENT_TYPES: RmtToolingConstant;
export declare const KERNEL_ESCALATION_SEVERITIES: RmtToolingConstant;
export declare const KERNEL_ESCALATION_SOURCES: RmtToolingConstant;
export declare const RMT_KERNEL_ESCALATION_CONTRACT_PATH: RmtToolingConstant;
export declare const RMT_KERNEL_ESCALATION_DIAGNOSTIC_CHANNEL: RmtToolingConstant;
export declare const RMT_KERNEL_ESCALATION_ENVELOPE_SCHEMA: RmtToolingConstant;
export declare const RMT_KERNEL_ESCALATION_MODULE_PATH: RmtToolingConstant;
export declare const RMT_KERNEL_ESCALATION_PACKAGE_SCRIPT: RmtToolingConstant;
export declare const RMT_KERNEL_ESCALATION_POLICY_SCHEMA: RmtToolingConstant;
export declare const RMT_KERNEL_ESCALATION_REPORT_SCHEMA: RmtToolingConstant;
export declare const RMT_KERNEL_ESCALATION_SCHEMA: RmtToolingConstant;
export declare const RMT_KERNEL_ESCALATION_SUITE_PATH: RmtToolingConstant;
export declare const RMT_KERNEL_ESCALATION_WORKPACKAGE: RmtToolingConstant;
export declare const RMT_KERNEL_ESCALATION_WP_PATH: RmtToolingConstant;
export declare const createKernelEscalationContract: RmtToolingFactory;
export declare const createKernelEscalationController: RmtToolingFactory;
export declare const createKernelEscalationEnvelope: RmtToolingFunction;
export declare const createKernelEscalationPolicy: RmtToolingFunction;
export declare const redactEscalationMetadata: RmtToolingFunction;
export declare const serializeKernelEscalationContract: RmtToolingFunction;
export declare const serializeKernelEscalationEnvelope: RmtToolingFunction;
