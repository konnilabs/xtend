export interface VuePocDiagnostic {
  code: string;
  message: string;
  details: Record<string, unknown>;
  schema?: string;
  source?: string;
  workpackage?: string;
  severity?: 'error' | 'warning' | 'info';
  xtensionId?: string | null;
  framework?: 'vue';
  field?: string | null;
  metadata?: Record<string, unknown>;
}

export interface VueUpdateAdapterRecord {
  schema: string;
  workpackage: string;
  xtensionId: string;
  framework: 'vue';
  kind: 'applyPropsUpdate' | 'applyStatePatch' | 'dispatchCommand' | string;
  adapterFunction: string | null;
  payloadFingerprint: string;
  proxyBoundary: 'internal-only';
  globalPropertiesPatchUsed: false;
  ok: boolean;
  diagnostics: VuePocDiagnostic[];
  timestamp: string;
}

export interface VueNormalizedEventRecord {
  schema: string;
  surfaceEventSchema: string;
  workpackage: string;
  xtensionId: string;
  framework: 'vue';
  owner: string;
  name: string;
  direction: 'upstream';
  lane: string;
  trustBoundary: 'adapter-normalized';
  payload: Record<string, unknown>;
  payloadFingerprint: string;
  ok: boolean;
  diagnostics: VuePocDiagnostic[];
  timestamp: string;
}

export interface VueBoundaryRecord {
  schema: string;
  workpackage: string;
  kind: string;
  status: string;
  hostId: string | null;
  surfaceId: string | null;
  xtensionId: string;
  framework: 'vue';
  diagnostics: VuePocDiagnostic[];
  timestamp: string;
}

export interface VueHostControllerPocContract {
  schema: string;
  pocSchema: string;
  hostControllerSchema: string;
  runtimeRegistrySchema: string;
  staticContractSchema: string;
  updateAdapterRecordSchema: string;
  eventRecordSchema: string;
  workpackage: string;
  status: 'accepted-by-XTN-07';
  framework: 'vue';
  peerMode: 'external-opt-in-peer-harness';
  testMode: 'frameworkless-contract-stub';
  frameworkDependenciesAllowed: false;
  vendoredFrameworksAllowed: false;
  runtimeExecutionRequired: false;
  updateAdapters: string[];
  boundaries: string[];
  staticContract: Record<string, unknown>;
}

export interface FrameworklessVueHostControllerPoc {
  schema: string;
  id: string;
  framework: 'vue';
  version: string;
  hostNeutral: true;
  contract: VueHostControllerPocContract;
  dependencyPolicy: Record<string, unknown>;
  methods: string[];
  mount(container?: Record<string, unknown>, initialProps?: Record<string, unknown>, mountOptions?: Record<string, unknown>): Record<string, unknown>;
  update(signal?: Record<string, unknown>): Record<string, unknown>;
  emit(event?: Record<string, unknown>): VueNormalizedEventRecord;
  suspend(reason?: string): Record<string, unknown>;
  resume(reason?: string): Record<string, unknown>;
  reportError(error?: Error, metadata?: Record<string, unknown>): Record<string, unknown>;
  unmount(reason?: string): Record<string, unknown>;
  snapshot(): Record<string, unknown>;
  getLifecycleRecords(): Record<string, unknown>[];
  getUpdateRecords(): VueUpdateAdapterRecord[];
  getEventRecords(): VueNormalizedEventRecord[];
  getBoundaryRecords(): VueBoundaryRecord[];
  getCleanupRecords(): Record<string, unknown>[];
}

export interface VueHostControllerPocReport {
  schema: string;
  pocSchema: string;
  contractSchema: string;
  updateAdapterRecordSchema: string;
  eventRecordSchema: string;
  boundaryRecordSchema: string;
  runtimeRegistrySchema: string;
  workpackage: string;
  ok: boolean;
  status: string;
  framework: 'vue';
  runtimeExecutionRequired: false;
  vueRuntimeImported: false;
  globalPropertiesPatchUsed: false;
  contract: VueHostControllerPocContract;
  adapter: Record<string, unknown>;
  runtimeRegistry: Record<string, unknown>;
  runtimeReport: Record<string, unknown>;
  operationResults: Record<string, unknown>[];
  snapshot: Record<string, unknown>;
  lifecycleRecords: Record<string, unknown>[];
  updateRecords: VueUpdateAdapterRecord[];
  eventRecords: VueNormalizedEventRecord[];
  boundaryRecords: VueBoundaryRecord[];
  cleanupRecords: Record<string, unknown>[];
  dependencyBoundary: Record<string, unknown>;
  diagnostics: VuePocDiagnostic[];
  timestamp: string;
}

export const XTENSIONS_VUE_HOST_CONTROLLER_POC_SCHEMA: string;
export const XTENSIONS_VUE_HOST_CONTROLLER_CONTRACT_SCHEMA: string;
export const XTENSIONS_VUE_UPDATE_ADAPTER_RECORD_SCHEMA: string;
export const XTENSIONS_VUE_EVENT_RECORD_SCHEMA: string;
export const XTENSIONS_VUE_BOUNDARY_RECORD_SCHEMA: string;
export const XTENSIONS_VUE_HOST_CONTROLLER_REPORT_SCHEMA: string;
export const XTENSIONS_VUE_HOST_CONTROLLER_POC_WORKPACKAGE: 'XTN-07';
export const VUE_UPDATE_ADAPTER_KINDS: readonly string[];
export const VUE_POC_BOUNDARIES: readonly string[];

export function applyVueExplicitUpdateAdapter(currentState?: Record<string, unknown>, signal?: Record<string, unknown>, options?: Record<string, unknown>): {
  ok: boolean;
  status: string;
  state: Record<string, unknown>;
  record: VueUpdateAdapterRecord;
  diagnostics: VuePocDiagnostic[];
};
export function assertVuePocDependencyBoundary(input?: Record<string, unknown>): {
  ok: boolean;
  diagnostics: VuePocDiagnostic[];
  forbiddenFrameworkDependencies: string[];
};
export function createFrameworklessVueHostControllerPoc(options?: Record<string, unknown>): FrameworklessVueHostControllerPoc;
export function createVueHostControllerPocContract(options?: Record<string, unknown>): VueHostControllerPocContract;
export function createVueHostControllerPocReport(input?: Record<string, unknown>, options?: Record<string, unknown>): VueHostControllerPocReport;
export function createVueRuntimeAdapterRecord(options?: Record<string, unknown>): Record<string, unknown>;
export function createVueUpdateAdapterRecord(kind?: string, payload?: Record<string, unknown>, options?: Record<string, unknown>): VueUpdateAdapterRecord;
export function inspectVuePayloadBoundary(payload?: Record<string, unknown>): {
  ok: boolean;
  diagnostics: VuePocDiagnostic[];
  proxyBoundary: 'internal-only';
  serializable: boolean;
};
export function normalizeVueSurfaceEvent(event?: Record<string, unknown>, options?: Record<string, unknown>): VueNormalizedEventRecord;
export function serializeVueHostControllerPocReport(report: VueHostControllerPocReport): string;
