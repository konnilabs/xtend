export const XTEND_DEV_SURFACE_EXTENSION_SCHEMA: 'xtend.devsurface.extension.v1';
export const XTEND_DEV_SURFACE_CONTRACT_SCHEMA: 'xtend.devsurface.contract.v1';
export const XTEND_DEV_SURFACE_DEV_API_SCHEMA: 'xtend.devsurface.dev-api.v1';
export const XTEND_DEV_SURFACE_SNAPSHOT_SCHEMA: 'xtend.devsurface.snapshot.v1';
export const XTEND_DEV_SURFACE_PERFORMANCE_SNAPSHOT_SCHEMA: 'xtend.devsurface.performance-snapshot.v1';
export const XTEND_DEV_SURFACE_PERFORMANCE_VIEW_SCHEMA: 'xtend.devsurface.performance-view.v1';
export const XTEND_DEV_SURFACE_HYDRATION_SNAPSHOT_SCHEMA: 'xtend.devsurface.hydration-snapshot.v1';
export const XTEND_DEV_SURFACE_HYDRATION_VIEW_SCHEMA: 'xtend.devsurface.hydration-view.v1';
export const XTEND_DEV_SURFACE_FABRIC_SNAPSHOT_SCHEMA: 'xtend.devsurface.fabric-snapshot.v1';
export const XTEND_DEV_SURFACE_FABRIC_VIEW_SCHEMA: 'xtend.devsurface.fabric-view.v1';
export const XTEND_DEV_SURFACE_KERNEL_SNAPSHOT_SCHEMA: 'xtend.devsurface.kernel-snapshot.v1';
export const XTEND_DEV_SURFACE_KERNEL_MONITOR_SCHEMA: 'xtend.devsurface.kernel-monitor.v1';
export const XTEND_DEV_SURFACE_GATE_RUN_SCHEMA: 'xtend.devsurface.gate-run.v1';
export const XTEND_DEV_SURFACE_DIAGNOSTIC_SCHEMA: 'xtend.devsurface.diagnostic.v1';
export const XTEND_DEV_SURFACE_SECURITY_BOUNDARY_SCHEMA: 'xtend.devsurface.security-boundary.v1';
export const XTEND_DEV_SURFACE_RUNTIME_BRIDGE_SCHEMA: 'xtend.devsurface.runtime-bridge.v1';
export const XTEND_DEV_SURFACE_RUNTIME_BRIDGE_READ_SCHEMA: 'xtend.devsurface.runtime-bridge-read.v1';
export const XTEND_DEV_SURFACE_COMPANION_SCHEMA: 'xtend.devsurface.companion.v1';
export const XTEND_DEV_SURFACE_GATE_STREAM_SCHEMA: 'xtend.devsurface.gate-stream.v1';
export const XTEND_DEV_SURFACE_GATE_ARTIFACT_SCHEMA: 'xtend.devsurface.gate-artifact.v1';
export const XTEND_DEV_SURFACE_WORKER_PATH_SCHEMA: 'xtend.devsurface.worker-path.v1';
export const XTEND_DEV_SURFACE_HANDOFF_SCHEMA: 'xtend.devsurface.handoff.v1';
export const XTEND_DEV_SURFACE_WORKPACKAGE: 'XDS-WP-01';
export const XTEND_DEV_SURFACE_ROOT: string;
export const XTEND_DEV_SURFACE_DIST_PATH: string;
export const XTEND_DEV_SURFACE_CONTRACT_PATH: string;
export const XTEND_DEV_SURFACE_SUITE_PATH: string;
export const XTEND_DEV_SURFACE_TYPES_PATH: string;
export const XTEND_DEV_SURFACE_PACKAGE_SCRIPT: string;
export const DEV_API_GLOBAL: '__XTEND_DEV_API__';
export const COMPANION_DEFAULT_ORIGIN: string;
export const DEV_API_REQUIRED_METHODS: readonly string[];
export const DEV_API_OPTIONAL_METHODS: readonly string[];
export const DEV_SURFACE_VIEWS: readonly string[];
export const DIAGNOSTIC_CATALOG: Readonly<Record<string, {
  code: string;
  severity: string;
  boundary: string;
}>>;
export const SECURITY_BOUNDARY_RULES: readonly {
  id: string;
  code: string;
  description: string;
}[];
export const GATE_ALLOWLIST: Readonly<Record<string, unknown>>;
export const PERFORMANCE_STATUS_TO_GRADE: Readonly<Record<string, string>>;
export const KERNEL_STATE_TO_HEALTH: Readonly<Record<string, string>>;

export type DevSurfaceSeverity = 'info' | 'warning' | 'error' | 'critical';
export type DevSurfacePerformanceStatus = 'pass' | 'warn' | 'fail' | 'blocked' | 'unknown';
export type DevSurfacePerformanceGrade = 'optimal' | 'needs-improvement' | 'flawed' | 'blocked' | 'unknown';

export interface DevSurfaceDiagnostic {
  schema: typeof XTEND_DEV_SURFACE_DIAGNOSTIC_SCHEMA;
  source: typeof XTEND_DEV_SURFACE_EXTENSION_SCHEMA;
  workpackage: typeof XTEND_DEV_SURFACE_WORKPACKAGE;
  severity: DevSurfaceSeverity | string;
  code: string;
  message: string;
  boundary: string | null;
  metadata: Record<string, unknown>;
}

export interface DevApiRecord {
  schema: typeof XTEND_DEV_SURFACE_DEV_API_SCHEMA;
  globalName: typeof DEV_API_GLOBAL;
  version: string | null;
  requiredMethods: string[];
  optionalMethods: string[];
  providedMethods: string[];
  missingMethods: string[];
  subscribeSupported: boolean;
  diagnostics: DevSurfaceDiagnostic[];
  ok: boolean;
}

export interface DevSurfaceGateDefinition {
  gateId: string;
  label: string;
  command: string[];
  reportPath: string | null;
  category: string;
}

export interface DevSurfaceGateRun {
  schema: typeof XTEND_DEV_SURFACE_GATE_RUN_SCHEMA;
  id: string;
  runId: string;
  gateId: string;
  label: string;
  status: string;
  allowed: boolean;
  command: string[];
  reportPath: string | null;
  startedAt: string | null;
  completedAt: string | null;
  exitCode: number | null;
  pid: number | null;
  progress: number;
  artifactUrl: string | null;
  artifacts: Record<string, unknown>[];
  report: Record<string, unknown> | null;
  stdoutTail: string | null;
  stderrTail: string | null;
  diagnostics: DevSurfaceDiagnostic[];
}

export interface DevSurfaceSnapshot {
  schema: typeof XTEND_DEV_SURFACE_SNAPSHOT_SCHEMA;
  extensionSchema: typeof XTEND_DEV_SURFACE_EXTENSION_SCHEMA;
  runtimeBridgeSchema: typeof XTEND_DEV_SURFACE_RUNTIME_BRIDGE_SCHEMA | string;
  runtimeBridge: Record<string, unknown> | null;
  generatedAt: string;
  devApiGlobal: typeof DEV_API_GLOBAL;
  devApiPresent: boolean;
  devApiVersion: string | null;
  companionOrigin: string;
  performance: Record<string, unknown>;
  hydration: Record<string, unknown>;
  fabric: Record<string, unknown>;
  kernel: Record<string, unknown>;
  workerPath: Record<string, unknown>;
  chartData: Record<string, unknown>;
  gates: DevSurfaceGateRun[];
  diagnostics: DevSurfaceDiagnostic[];
  ok: boolean;
}

export function assertDevApiShape(api?: unknown): {
  ok: boolean;
  version: string | null;
  missing: string[];
  subscribeSupported: boolean;
  diagnostics: DevSurfaceDiagnostic[];
};
export function createDevSurfaceContract(options?: Record<string, unknown>): Record<string, unknown>;
export function createDevSurfaceDiagnostic(code: string, message: string, severity?: string, metadata?: Record<string, unknown>): DevSurfaceDiagnostic;
export function createDevSurfaceHandoffRecord(options?: Record<string, unknown>): Record<string, unknown>;
export function createDevSurfaceSnapshot(input?: Record<string, unknown>, options?: Record<string, unknown>): DevSurfaceSnapshot;
export function createDevSurfaceWorkerChartData(input?: Record<string, unknown>): Record<string, unknown>;
export function createDevSurfaceWorkerPathRecord(input?: Record<string, unknown>): Record<string, unknown>;
export function evaluateDevSurfaceSecurityBoundary(input?: Record<string, unknown>): Record<string, unknown>;
export function evaluateDevSurfaceWorkerPathSource(sourceText?: string): Record<string, unknown>;
export function listGateDefinitions(allowlist?: Record<string, unknown>): DevSurfaceGateDefinition[];
export function normalizeDevApiRecord(api?: unknown): DevApiRecord;
export function normalizeFabricTelemetrySnapshot(snapshot?: unknown): Record<string, unknown>;
export function normalizeGateRun(input?: Record<string, unknown>, options?: Record<string, unknown>): DevSurfaceGateRun;
export function normalizeHydrationSnapshot(snapshot?: unknown): Record<string, unknown>;
export function normalizeKernelSnapshot(snapshot?: unknown): Record<string, unknown>;
export function normalizePerformanceMeasurement(measurement?: unknown, index?: number): Record<string, unknown>;
export function normalizePerformanceSnapshot(snapshot?: unknown): Record<string, unknown>;
export function resolveGateDefinition(gateId: string, allowlist?: Record<string, unknown>): DevSurfaceGateDefinition | null;
export function serializeDevSurfaceSnapshot(snapshot?: Record<string, unknown>): string;
