export interface ImperativePocDiagnostic {
  code: string;
  message: string;
  details: Record<string, unknown>;
  schema?: string;
  source?: string;
  workpackage?: string;
  severity?: 'error' | 'warning' | 'info';
  xtensionId?: string | null;
  framework?: 'chart.js' | 'leaflet' | string | null;
  field?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ChartUpdateRecord {
  schema: string;
  workpackage: string;
  xtensionId: string;
  framework: 'chart.js';
  mode: 'active' | 'none' | 'unsupported';
  policyHint: string;
  animationAllowed: boolean;
  payloadFingerprint: string;
  payloadSchema: string;
  apiBoundary: 'hostcontroller-only';
  ok: boolean;
  diagnostics: ImperativePocDiagnostic[];
  timestamp: string;
}

export interface LeafletEventRecord {
  schema: string;
  surfaceEventSchema: string;
  workpackage: string;
  xtensionId: string;
  framework: 'leaflet';
  owner: string;
  name: string;
  type: 'pan' | 'zoom' | 'layer.click' | 'marker.drag' | 'popup.open' | 'unsupported';
  direction: 'upstream';
  lane: string;
  trustBoundary: 'adapter-normalized';
  payload: Record<string, unknown>;
  payloadFingerprint: string;
  payloadSchema: string;
  rateLimit: {
    maxEventsPerWindow: number;
    eventCount: number;
    windowMs: number;
    limited: boolean;
  };
  ok: boolean;
  diagnostics: ImperativePocDiagnostic[];
  timestamp: string;
}

export interface ImperativeResizeRecord {
  schema: string;
  workpackage: string;
  xtensionId: string | null;
  framework: string | null;
  width: number;
  height: number;
  reason: string;
  hostOwned: true;
  ok: boolean;
  diagnostics: ImperativePocDiagnostic[];
  timestamp: string;
}

export interface ImperativeVisibilityRecord {
  schema: string;
  workpackage: string;
  xtensionId: string | null;
  framework: string | null;
  visibility: 'visible' | 'hidden' | 'invalid';
  action: string;
  hostOwned: true;
  ok: boolean;
  diagnostics: ImperativePocDiagnostic[];
  timestamp: string;
}

export interface ImperativeHostPocContract {
  schema: string;
  pocSchema: string;
  hostControllerSchema: string;
  runtimeRegistrySchema: string;
  staticContractSchema: string;
  chartUpdateRecordSchema: string;
  leafletEventRecordSchema: string;
  resizeRecordSchema: string;
  visibilityRecordSchema: string;
  workpackage: string;
  status: 'accepted-by-XTN-08';
  peerMode: 'external-opt-in-peer-harness';
  testMode: 'frameworkless-contract-stub';
  frameworkDependenciesAllowed: false;
  vendoredFrameworksAllowed: false;
  runtimeExecutionRequired: false;
  chartUpdateModes: string[];
  leafletEventTypes: string[];
  boundaries: string[];
  staticContracts: Record<string, unknown>[];
}

export interface FrameworklessChartHostControllerPoc {
  schema: string;
  id: string;
  framework: 'chart.js';
  version: string;
  contract: Record<string, unknown>;
  mount(container?: Record<string, unknown>, initialData?: Record<string, unknown>, mountOptions?: Record<string, unknown>): Record<string, unknown>;
  update(signal?: Record<string, unknown>): Record<string, unknown>;
  resize(input?: Record<string, unknown>): Record<string, unknown>;
  setVisibility(input?: Record<string, unknown>): Record<string, unknown>;
  unmount(reason?: string): Record<string, unknown>;
  snapshot(): Record<string, unknown>;
  getLifecycleRecords(): Record<string, unknown>[];
  getUpdateRecords(): ChartUpdateRecord[];
  getResizeRecords(): ImperativeResizeRecord[];
  getVisibilityRecords(): ImperativeVisibilityRecord[];
  getCleanupRecords(): Record<string, unknown>[];
}

export interface FrameworklessLeafletHostControllerPoc {
  schema: string;
  id: string;
  framework: 'leaflet';
  version: string;
  contract: Record<string, unknown>;
  mount(container?: Record<string, unknown>, initialViewport?: Record<string, unknown>, mountOptions?: Record<string, unknown>): Record<string, unknown>;
  emit(event?: Record<string, unknown>): LeafletEventRecord;
  resize(input?: Record<string, unknown>): Record<string, unknown>;
  setVisibility(input?: Record<string, unknown>): Record<string, unknown>;
  unmount(reason?: string): Record<string, unknown>;
  snapshot(): Record<string, unknown>;
  getLifecycleRecords(): Record<string, unknown>[];
  getEventRecords(): LeafletEventRecord[];
  getResizeRecords(): ImperativeResizeRecord[];
  getVisibilityRecords(): ImperativeVisibilityRecord[];
  getCleanupRecords(): Record<string, unknown>[];
}

export interface ImperativeHostPocReport {
  schema: string;
  pocSchema: string;
  contractSchema: string;
  chartUpdateRecordSchema: string;
  leafletEventRecordSchema: string;
  resizeRecordSchema: string;
  visibilityRecordSchema: string;
  runtimeRegistrySchema: string;
  workpackage: string;
  ok: boolean;
  status: string;
  runtimeExecutionRequired: false;
  chartRuntimeImported: false;
  leafletRuntimeImported: false;
  contract: ImperativeHostPocContract;
  adapters: Record<string, unknown>[];
  runtimeRegistry: Record<string, unknown>;
  runtimeReport: Record<string, unknown>;
  operationResults: Record<string, unknown>[];
  chartSnapshot: Record<string, unknown>;
  leafletSnapshot: Record<string, unknown>;
  chartUpdateRecords: ChartUpdateRecord[];
  leafletEventRecords: LeafletEventRecord[];
  resizeRecords: ImperativeResizeRecord[];
  visibilityRecords: ImperativeVisibilityRecord[];
  cleanupRecords: Record<string, unknown>[];
  dependencyBoundary: Record<string, unknown>;
  diagnostics: ImperativePocDiagnostic[];
  timestamp: string;
}

export const XTENSIONS_IMPERATIVE_HOST_POCS_SCHEMA: string;
export const XTENSIONS_IMPERATIVE_HOST_CONTRACT_SCHEMA: string;
export const XTENSIONS_CHART_UPDATE_RECORD_SCHEMA: string;
export const XTENSIONS_LEAFLET_EVENT_RECORD_SCHEMA: string;
export const XTENSIONS_IMPERATIVE_RESIZE_RECORD_SCHEMA: string;
export const XTENSIONS_IMPERATIVE_VISIBILITY_RECORD_SCHEMA: string;
export const XTENSIONS_IMPERATIVE_HOST_REPORT_SCHEMA: string;
export const XTENSIONS_IMPERATIVE_HOST_POCS_WORKPACKAGE: 'XTN-08';
export const CHART_UPDATE_MODES: readonly string[];
export const LEAFLET_EVENT_TYPES: readonly string[];
export const IMPERATIVE_POC_BOUNDARIES: readonly string[];

export function assertImperativePocDependencyBoundary(input?: Record<string, unknown>): {
  ok: boolean;
  diagnostics: ImperativePocDiagnostic[];
  forbiddenFrameworkDependencies: string[];
};
export function createChartRuntimeAdapterRecord(options?: Record<string, unknown>): Record<string, unknown>;
export function createChartUpdateRecord(input?: Record<string, unknown>, options?: Record<string, unknown>): ChartUpdateRecord;
export function createFrameworklessChartHostControllerPoc(options?: Record<string, unknown>): FrameworklessChartHostControllerPoc;
export function createFrameworklessLeafletHostControllerPoc(options?: Record<string, unknown>): FrameworklessLeafletHostControllerPoc;
export function createImperativeHostPocContract(options?: Record<string, unknown>): ImperativeHostPocContract;
export function createImperativeHostPocReport(input?: Record<string, unknown>, options?: Record<string, unknown>): ImperativeHostPocReport;
export function createImperativePocDiagnostic(subject?: Record<string, unknown>, code?: string, message?: string, severity?: string, metadata?: Record<string, unknown>): ImperativePocDiagnostic;
export function createLeafletEventRecord(event?: Record<string, unknown>, options?: Record<string, unknown>): LeafletEventRecord;
export function createLeafletRuntimeAdapterRecord(options?: Record<string, unknown>): Record<string, unknown>;
export function inspectImperativePayloadBoundary(payload?: Record<string, unknown>, subject?: Record<string, unknown>): {
  ok: boolean;
  diagnostics: ImperativePocDiagnostic[];
  apiBoundary: 'hostcontroller-only';
  serializable: boolean;
};
export function normalizeResizeRecord(input?: Record<string, unknown>, options?: Record<string, unknown>): ImperativeResizeRecord;
export function normalizeVisibilityRecord(input?: Record<string, unknown>, options?: Record<string, unknown>): ImperativeVisibilityRecord;
export function serializeImperativeHostPocReport(report: ImperativeHostPocReport): string;
