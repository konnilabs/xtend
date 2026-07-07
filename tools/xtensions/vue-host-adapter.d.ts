export const XTENSIONS_VUE_ADAPTER_SCHEMA: 'xtend.xtensions.vue-adapter.v1';
export const XTENSIONS_VUE_RUNTIME_BOUNDARY_SCHEMA: 'xtend.xtensions.vue-runtime-boundary.v1';
export const XTENSIONS_VUE_ADAPTER_REPORT_SCHEMA: 'xtend.xtensions.vue-adapter-report.v1';
export const XTENSIONS_VUE_ADAPTER_DIAGNOSTIC_SCHEMA: 'xtend.xtensions.vue-adapter-diagnostic.v1';
export const XTENSIONS_VUE_ADAPTER_MODULE_PATH: 'tools/xtensions/vue-host-adapter.js';
export const XTENSIONS_VUE_ADAPTER_TYPES_PATH: 'tools/xtensions/vue-host-adapter.d.ts';
export const XTENSIONS_VUE_ADAPTER_SUITE_PATH: 'tests/xtensions/xtensions_vue_host_adapter_suite.js';
export const XTENSIONS_VUE_ADAPTER_FIXTURE_PATH: 'tests/fixtures/xtensions/vue-host-adapter-valid.json';
export const XTENSIONS_VUE_ADAPTER_CONTRACT_PATH: 'development/XTensions-Vue-Host-Adapter-Contract.md';
export const XTENSIONS_VUE_ADAPTER_WORKPACKAGE: 'XTN-19';
export const XTENSIONS_VUE_ADAPTER_PACKAGE_SCRIPT: 'npm run test:xtensions-vue-host-adapter';
export const VUE_ADAPTER_RUNTIME_BOUNDARY_CODE: 'xtensions.vue.runtime_boundary';
export const VUE_ADAPTER_HOST_RUNTIME_MISSING_CODE: 'xtensions.vue.host_runtime_missing';
export const VUE_ADAPTER_CAPABILITIES: readonly string[];
export const VUE_HOST_PROVIDED_DEPENDENCIES: readonly Record<string, unknown>[];
export const VUE_RUNTIME_PROVIDER_MODULES: readonly string[];

export interface VueAdapterDiagnostic {
  schema: typeof XTENSIONS_VUE_ADAPTER_DIAGNOSTIC_SCHEMA;
  source: typeof XTENSIONS_VUE_ADAPTER_SCHEMA;
  workpackage: typeof XTENSIONS_VUE_ADAPTER_WORKPACKAGE;
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  xtensionId: string | null;
  framework: 'vue';
  field: string | null;
  metadata: Record<string, unknown>;
}

export interface VueRuntimeBoundary {
  schema: typeof XTENSIONS_VUE_RUNTIME_BOUNDARY_SCHEMA;
  runtimeClass: 'vue';
  dependencyClassification: 'host-provided';
  dependencies: Record<string, unknown>[];
  runtimeProvider: Record<string, unknown>;
  hostProvided: true;
  bundledInXtension: false;
  remoteArtifactsAllowed: false;
  domBoundary: 'host-owned-container';
  styleBoundary: 'host-css-owned';
  sameRealmHardSecurity: false;
  explicitUpdateAdapterRequired: true;
  globalPropertiesPatchAllowed: false;
  proxyRefStoreBoundary: 'internal-only';
  capabilities: string[];
  diagnostics: VueAdapterDiagnostic[];
  ok: boolean;
}

export interface VueAdapterReport {
  schema: typeof XTENSIONS_VUE_ADAPTER_REPORT_SCHEMA;
  adapterSchema: typeof XTENSIONS_VUE_ADAPTER_SCHEMA;
  pocCompatibilitySchema: string;
  runtimeBoundarySchema: typeof XTENSIONS_VUE_RUNTIME_BOUNDARY_SCHEMA;
  runtimeRegistrySchema: string;
  workpackage: typeof XTENSIONS_VUE_ADAPTER_WORKPACKAGE;
  generatedAt: string;
  framework: 'vue';
  runtimeExecutionRequired: false;
  runtimeBoundary: VueRuntimeBoundary;
  dependencyBoundary: Record<string, unknown>;
  adapter: Record<string, unknown>;
  runtimeRegistry: Record<string, unknown>;
  runtimeReport: Record<string, unknown>;
  updateRecord: Record<string, unknown>;
  normalizedEvent: Record<string, unknown>;
  payloadBoundary: Record<string, unknown>;
  reportFingerprint: string;
  diagnostics: Record<string, unknown>[];
  ok: boolean;
}

export function normalizeVueRuntimeBoundary(input?: Record<string, unknown>): VueRuntimeBoundary;
export function createVueAdapterContract(options?: Record<string, unknown>): Record<string, unknown>;
export function createVueAdapterDiagnostic(subject?: Record<string, unknown>, code?: string, message?: string, severity?: string, metadata?: Record<string, unknown>): VueAdapterDiagnostic;
export function createVueRuntimeAdapterRecord(input?: Record<string, unknown>, options?: Record<string, unknown>): Record<string, unknown>;
export function createVueHostAdapter(options?: Record<string, unknown>): Record<string, unknown>;
export function inspectVuePayloadBoundary(payload?: Record<string, unknown>): Record<string, unknown>;
export function createVueAdapterReport(input?: Record<string, unknown>, options?: Record<string, unknown>): VueAdapterReport;
export function serializeVueAdapterReport(report?: Record<string, unknown>): string;
export function printVueHostAdapterReport(report?: Record<string, unknown>): void;
