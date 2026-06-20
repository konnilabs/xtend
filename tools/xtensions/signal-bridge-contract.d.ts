export const XTENSIONS_SIGNAL_BRIDGE_SCHEMA: 'xtend.xtensions.signal-bridge.v1';
export const XTENSIONS_KERNEL_SIGNAL_SCHEMA: 'xtend.xtensions.kernel-signal.v1';
export const XTENSIONS_SURFACE_EVENT_SCHEMA: 'xtend.xtensions.surface-event.v1';
export const XTENSIONS_EVENT_GOVERNANCE_MATRIX_SCHEMA: 'xtend.xtensions.event-governance-matrix.v1';
export const XTENSIONS_SIGNAL_BRIDGE_DEAD_LETTER_SCHEMA: 'xtend.xtensions.signal-bridge-dead-letter.v1';
export const XTENSIONS_SIGNAL_BRIDGE_DIAGNOSTIC_SCHEMA: 'xtend.xtensions.signal-bridge-diagnostic.v1';
export const XTENSIONS_SIGNAL_BRIDGE_REPORT_SCHEMA: 'xtend.xtensions.signal-bridge-report.v1';
export const XTENSIONS_SIGNAL_BRIDGE_MODULE_PATH: 'tools/xtensions/signal-bridge-contract.js';
export const XTENSIONS_SIGNAL_BRIDGE_TYPES_PATH: 'tools/xtensions/signal-bridge-contract.d.ts';
export const XTENSIONS_SIGNAL_BRIDGE_SUITE_PATH: 'tests/xtensions/xtensions_signal_bridge_suite.js';
export const XTENSIONS_SIGNAL_BRIDGE_FIXTURE_PATH: 'tests/fixtures/xtensions/signal-bridge-valid.json';
export const XTENSIONS_SIGNAL_BRIDGE_CONTRACT_PATH: 'development/XTensions-Signal-Bridge-and-Event-Governance-Contract.md';
export const XTENSIONS_SIGNAL_BRIDGE_WORKPACKAGE: 'XTN-02';
export const XTENSIONS_SIGNAL_BRIDGE_PACKAGE_SCRIPT: 'npm run test:xtensions-signal-bridge';

export type XTensionsBridgeDirection = 'downstream' | 'upstream';
export type XTensionsSurfaceEventDirection = 'upstream';
export type XTensionsDeliveryMode = 'sync' | 'queued' | 'replayable' | 'drop-if-stale';
export type XTensionsTrustBoundary = 'same-origin-adapter' | 'sandboxed-adapter' | 'remote-surface-adapter' | 'trusted-native-host';
export type XTensionsBackpressurePolicy = 'none' | 'coalesce-by-target' | 'coalesce-by-event' | 'coalesce-by-route' | 'sample' | 'drop-stale' | 'dead-letter';

export interface XTensionsSignalBridgeDiagnostic {
  schema: typeof XTENSIONS_SIGNAL_BRIDGE_DIAGNOSTIC_SCHEMA;
  source: typeof XTENSIONS_SIGNAL_BRIDGE_SCHEMA;
  workpackage: typeof XTENSIONS_SIGNAL_BRIDGE_WORKPACKAGE;
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  signalId: string | null;
  eventId: string | null;
  event: string | null;
  target: Record<string, unknown> | null;
  owner: string | null;
  lane: string | null;
  field: string | null;
  metadata: Record<string, unknown>;
}

export interface XTensionsBridgePolicy {
  deliveryMode: XTensionsDeliveryMode | string;
  ttlMs: number;
  correlationId: 'required' | true | string;
  idempotencyKey: 'required' | true | string;
  coalesceKey: string;
  coalescePolicy: string;
  backpressure: XTensionsBackpressurePolicy | string;
  deadLetter: 'required' | true | string;
  rateLimit: {
    windowMs: number | null;
    maxEvents: number | null;
    overflow: string;
  };
}

export interface XTensionsKernelSignal {
  schema: typeof XTENSIONS_KERNEL_SIGNAL_SCHEMA;
  signalId: string;
  direction: 'downstream';
  type: string;
  target: {
    hostId: string;
    surfaceId: string;
    xtensionId: string;
    containerId: string;
  };
  lane: string;
  rawLane: string;
  priorityHint: string;
  payload: Record<string, unknown>;
  schemaRef: string;
  policy: XTensionsBridgePolicy;
  timestamp: string;
  diagnostics: XTensionsSignalBridgeDiagnostic[];
  ok: boolean;
}

export interface XTensionsSurfaceEvent {
  schema: typeof XTENSIONS_SURFACE_EVENT_SCHEMA;
  eventId: string;
  direction: 'upstream';
  event: string;
  owner: {
    kind: string;
    id: string;
    known: boolean;
  };
  source: {
    hostId: string;
    surfaceId: string;
    xtensionId: string;
    framework: string;
  };
  lane: string;
  rawLane: string;
  payloadSchema: string;
  payload: Record<string, unknown>;
  trustBoundary: XTensionsTrustBoundary | string;
  policy: XTensionsBridgePolicy;
  timestamp: string;
  diagnostics: XTensionsSignalBridgeDiagnostic[];
  ok: boolean;
}

export interface XTensionsEventGovernanceMatrixEntry {
  schema: typeof XTENSIONS_EVENT_GOVERNANCE_MATRIX_SCHEMA;
  framework: string;
  runtimeClass: string;
  hostMode: string;
  defaultLane: string;
  acceptedSignals: string[];
  emittedEvents: string[];
  payloadSchemas: string[];
  requiredControls: string[];
  schedulingNotes: string;
  backpressure: string;
  trustBoundary: string;
}

export interface XTensionsDeadLetterRecord {
  schema: typeof XTENSIONS_SIGNAL_BRIDGE_DEAD_LETTER_SCHEMA;
  sourceSchema: string | null;
  sourceId: string | null;
  reasonCode: string;
  severity: string;
  lane: string | null;
  owner: string | null;
  target: Record<string, unknown> | null;
  timestamp: string;
  diagnostic: Record<string, unknown>;
}

export interface XTensionsSignalBridgeReport {
  schema: typeof XTENSIONS_SIGNAL_BRIDGE_REPORT_SCHEMA;
  bridgeSchema: typeof XTENSIONS_SIGNAL_BRIDGE_SCHEMA;
  kernelSignalSchema: typeof XTENSIONS_KERNEL_SIGNAL_SCHEMA;
  surfaceEventSchema: typeof XTENSIONS_SURFACE_EVENT_SCHEMA;
  governanceMatrixSchema: typeof XTENSIONS_EVENT_GOVERNANCE_MATRIX_SCHEMA;
  deadLetterSchema: typeof XTENSIONS_SIGNAL_BRIDGE_DEAD_LETTER_SCHEMA;
  hostControllerSchema: string;
  schedulerSchema: string;
  workpackage: typeof XTENSIONS_SIGNAL_BRIDGE_WORKPACKAGE;
  status: 'ready' | 'blocked';
  ok: boolean;
  kernelSignalCount: number;
  surfaceEventCount: number;
  governanceMatrixCount: number;
  deadLetterCount: number;
  canonicalLanes: string[];
  directions: XTensionsBridgeDirection[];
  deliveryModes: XTensionsDeliveryMode[];
  trustBoundaries: XTensionsTrustBoundary[];
  backpressurePolicies: XTensionsBackpressurePolicy[];
  kernelSignals: XTensionsKernelSignal[];
  surfaceEvents: XTensionsSurfaceEvent[];
  governanceMatrix: XTensionsEventGovernanceMatrixEntry[];
  deadLetters: XTensionsDeadLetterRecord[];
  diagnostics: XTensionsSignalBridgeDiagnostic[];
  indexes: Record<string, unknown>;
}

export const BACKPRESSURE_POLICIES: readonly XTensionsBackpressurePolicy[];
export const COALESCE_POLICIES: readonly string[];
export const DEFAULT_EVENT_GOVERNANCE_MATRIX: readonly Readonly<Record<string, unknown>>[];
export const DELIVERY_MODES: readonly XTensionsDeliveryMode[];
export const PRIORITY_HINTS: readonly string[];
export const SIGNAL_BRIDGE_DIRECTIONS: readonly XTensionsBridgeDirection[];
export const SURFACE_EVENT_DIRECTIONS: readonly XTensionsSurfaceEventDirection[];
export const TRUST_BOUNDARIES: readonly XTensionsTrustBoundary[];
export const WILDCARD_EVENT_NAMES: readonly string[];

export function assertSignalBridgeDependencyBoundary(input?: Record<string, unknown>): {
  ok: boolean;
  diagnostics: XTensionsSignalBridgeDiagnostic[];
  forbiddenFrameworkDependencies: string[];
};

export function createDeadLetterRecord(record?: Record<string, unknown>, diagnostic?: Record<string, unknown>, options?: Record<string, unknown>): XTensionsDeadLetterRecord;
export function createKernelSignal(input?: Record<string, unknown>, options?: Record<string, unknown>): XTensionsKernelSignal;
export function createSignalBridgeReport(input?: Record<string, unknown>, options?: Record<string, unknown>): XTensionsSignalBridgeReport;
export function createSurfaceEvent(input?: Record<string, unknown>, options?: Record<string, unknown>): XTensionsSurfaceEvent;
export function createXTensionsSignalBridgeContract(options?: Record<string, unknown>): Record<string, unknown>;
export function listGovernedFrameworks(matrix?: Record<string, unknown>[]): string[];
export function normalizeGovernanceMatrix(matrix?: Record<string, unknown>[]): XTensionsEventGovernanceMatrixEntry[];
export function serializeSignalBridgeReport(report: XTensionsSignalBridgeReport): string;
