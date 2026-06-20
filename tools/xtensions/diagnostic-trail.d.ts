export interface DiagnosticTrailDiagnostic {
  schema: string;
  source: string;
  workpackage: string;
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  recordId?: string | null;
  xtensionId?: string | null;
  surfaceId?: string | null;
  lane?: string | null;
  field?: string | null;
  metadata?: Record<string, unknown>;
}

export interface DiagnosticTrailCorrelation {
  schema: string;
  xtensionId: string;
  framework: string;
  manifestId: string;
  artifactId: string;
  artifactFingerprint: string;
  buildFingerprint: string;
  runtimeHostId: string;
  hostId: string;
  surfaceId: string;
  lane: string;
  eventId: string;
  signalId: string;
  routeId: string;
  traceId: string;
  correlationId: string;
  parentRecordId: string;
  timestamp: string;
  ok: boolean;
  diagnostics: DiagnosticTrailDiagnostic[];
}

export interface DiagnosticRedactionPolicy {
  schema: string;
  mode: string;
  defaultAction: string;
  sensitiveAction: string;
  redactUnknownPayloads: boolean;
  passthroughSchemas: string[];
  schemaRules: Record<string, unknown>[];
  fieldRules: Record<string, unknown>[];
}

export interface DiagnosticPayloadRedaction {
  schema: string;
  ok: boolean;
  payload: unknown;
  payloadSchema: string;
  policy: DiagnosticRedactionPolicy;
  action: string;
  redacted: boolean;
  redactions: Record<string, unknown>[];
  diagnostics: DiagnosticTrailDiagnostic[];
}

export interface DiagnosticTrailRecord {
  schema: string;
  trailSchema: string;
  workpackage: string;
  recordId: string;
  action: string;
  status: string;
  ok: boolean;
  severity: 'error' | 'warning' | 'info';
  sequence: number;
  timestamp: string;
  correlation: DiagnosticTrailCorrelation;
  payloadSchema: string;
  payload: unknown;
  payloadFingerprint: string;
  rawPayloadFingerprint: string;
  redaction: {
    schema: string;
    redacted: boolean;
    action: string;
    redactionCount: number;
    redactions: Record<string, unknown>[];
    policyFingerprint: string;
  };
  diagnosticCodes: string[];
  diagnostics: DiagnosticTrailDiagnostic[];
}

export interface DiagnosticTrailContract {
  schema: string;
  recordSchema: string;
  correlationSchema: string;
  redactionPolicySchema: string;
  reportSchema: string;
  hostControllerSchema: string;
  lifecycleRecordSchema: string;
  signalBridgeSchema: string;
  kernelSignalSchema: string;
  surfaceEventSchema: string;
  runtimeRegistrySchema: string;
  runtimeReportSchema: string;
  maracaManifestSchema: string;
  workpackage: string;
  status: 'accepted-by-XTN-10';
  optional: true;
  frameworkDependenciesAllowed: false;
  vendoredFrameworksAllowed: false;
  runtimeExecutionRequired: false;
  actions: string[];
  statuses: string[];
  requiredCorrelationFields: string[];
  redactionPolicy: DiagnosticRedactionPolicy;
  boundaries: string[];
}

export interface DiagnosticTrailReport {
  schema: string;
  trailSchema: string;
  recordSchema: string;
  correlationSchema: string;
  redactionPolicySchema: string;
  workpackage: string;
  ok: boolean;
  status: string;
  ciReadable: true;
  devtoolsReadable: true;
  frameworkCodeRequired: false;
  runtimeExecutionRequired: false;
  contract: DiagnosticTrailContract;
  records: DiagnosticTrailRecord[];
  summary: Record<string, unknown>;
  dependencyBoundary: Record<string, unknown>;
  diagnostics: DiagnosticTrailDiagnostic[];
  timestamp: string;
}

export const XTENSIONS_DIAGNOSTIC_TRAIL_SCHEMA: string;
export const XTENSIONS_DIAGNOSTIC_TRAIL_RECORD_SCHEMA: string;
export const XTENSIONS_DIAGNOSTIC_TRAIL_CORRELATION_SCHEMA: string;
export const XTENSIONS_DIAGNOSTIC_REDACTION_POLICY_SCHEMA: string;
export const XTENSIONS_DIAGNOSTIC_TRAIL_REPORT_SCHEMA: string;
export const XTENSIONS_DIAGNOSTIC_TRAIL_WORKPACKAGE: 'XTN-10';
export const DIAGNOSTIC_TRAIL_ACTIONS: readonly string[];
export const DIAGNOSTIC_TRAIL_STATUSES: readonly string[];
export const DIAGNOSTIC_TRAIL_BOUNDARIES: readonly string[];
export const REQUIRED_CORRELATION_FIELDS: readonly string[];
export const DEFAULT_REDACTION_POLICY: DiagnosticRedactionPolicy;

export function assertDiagnosticTrailDependencyBoundary(input?: Record<string, unknown>): {
  ok: boolean;
  diagnostics: DiagnosticTrailDiagnostic[];
  forbiddenFrameworkDependencies: string[];
};
export function createDiagnosticTrailContract(options?: Record<string, unknown>): DiagnosticTrailContract;
export function createDiagnosticTrailCorrelation(input?: Record<string, unknown>, options?: Record<string, unknown>): DiagnosticTrailCorrelation;
export function createDiagnosticTrailDiagnostic(subject?: Record<string, unknown>, code?: string, message?: string, severity?: string, metadata?: Record<string, unknown>): DiagnosticTrailDiagnostic;
export function createDiagnosticTrailRecord(input?: Record<string, unknown>, options?: Record<string, unknown>): DiagnosticTrailRecord;
export function createDiagnosticTrailReport(input?: Record<string, unknown>, options?: Record<string, unknown>): DiagnosticTrailReport;
export function redactPayload(payload?: unknown, options?: Record<string, unknown>): DiagnosticPayloadRedaction;
export function serializeDiagnosticTrailReport(report: DiagnosticTrailReport): string;
