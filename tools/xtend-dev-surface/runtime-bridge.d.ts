export const DEV_API_ACCESS: 'window.__XTEND_DEV_API__';
export const DEV_API_GLOBAL: '__XTEND_DEV_API__';
export const DEVTOOLS_EVAL_ACCESS: 'chrome.devtools.inspectedWindow.eval';
export const OPTIONAL_METHODS: readonly string[];
export const REQUIRED_METHODS: readonly string[];
export const SNAPSHOT_READS: readonly {
  method: string;
  field: string;
  label: string;
}[];
export const XTEND_DEV_SURFACE_RUNTIME_BRIDGE_READ_SCHEMA: 'xtend.devsurface.runtime-bridge-read.v1';
export const XTEND_DEV_SURFACE_RUNTIME_BRIDGE_SCHEMA: 'xtend.devsurface.runtime-bridge.v1';
export const XTEND_DEV_SURFACE_WORKPACKAGE: 'XDS-WP-03';

export interface RuntimeBridgeDiagnostic {
  schema: 'xtend.devsurface.diagnostic.v1';
  source: typeof XTEND_DEV_SURFACE_RUNTIME_BRIDGE_SCHEMA;
  workpackage: typeof XTEND_DEV_SURFACE_WORKPACKAGE;
  severity: string;
  code: string;
  message: string;
  boundary: string;
  metadata: Record<string, unknown>;
}

export interface RuntimeBridgeRecord {
  schema: typeof XTEND_DEV_SURFACE_RUNTIME_BRIDGE_SCHEMA;
  workpackage: typeof XTEND_DEV_SURFACE_WORKPACKAGE;
  devApiGlobal: typeof DEV_API_GLOBAL;
  devApiAccess: typeof DEV_API_ACCESS;
  devtoolsEvalAccess: typeof DEVTOOLS_EVAL_ACCESS;
  readMode: string;
  allowedReads: string[];
  requiredMethods: string[];
  optionalMethods: string[];
  snapshotReads: { method: string; field: string; label: string }[];
  monkeypatchingAllowed: false;
  remoteRuntimeAllowed: false;
  uiCoprocessorAllowed: false;
  prewarmWorkerAllowed: true;
  diagnostics: RuntimeBridgeDiagnostic[];
  ok: boolean;
}

export interface RuntimeBridgeReadResult {
  schema: typeof XTEND_DEV_SURFACE_RUNTIME_BRIDGE_READ_SCHEMA;
  bridgeSchema: typeof XTEND_DEV_SURFACE_RUNTIME_BRIDGE_SCHEMA;
  bridge: RuntimeBridgeRecord;
  devApiPresent: boolean;
  devApiVersion: string | null;
  methodAvailability: Record<string, boolean>;
  subscribeSupported: boolean;
  performanceSnapshot: Record<string, unknown> | null;
  hydrationSnapshot: Record<string, unknown> | null;
  fabricTelemetrySnapshot: Record<string, unknown> | null;
  kernelSnapshot: Record<string, unknown> | null;
  diagnostics: RuntimeBridgeDiagnostic[];
  ok: boolean;
}

export function createFallbackSnapshot(reason?: string, metadata?: Record<string, unknown>): RuntimeBridgeReadResult;
export function createInspectedWindowReadExpression(): string;
export function createRuntimeBridgeRecord(input?: Record<string, unknown>): RuntimeBridgeRecord;
export function evaluateRuntimeBridgeSource(sourceText?: string): RuntimeBridgeRecord;
export function normalizeBridgeReadResult(result?: Record<string, unknown>): RuntimeBridgeReadResult;
export function readRuntimeSnapshotFromInspectedWindow(devtoolsApi?: unknown): Promise<RuntimeBridgeReadResult>;
