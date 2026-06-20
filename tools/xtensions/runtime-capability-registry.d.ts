export interface XTensionsRuntimeDiagnostic {
  schema: string;
  source: string;
  workpackage: string;
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  xtensionId: string | null;
  framework: string | null;
  field: string | null;
  metadata: Record<string, unknown>;
}

export interface XTensionsRuntimeLoadingPolicy {
  schema: string;
  scope: 'host-local' | string;
  allowGlobalRegistry: boolean;
  dynamicImportRequiresIntegrity: boolean;
  capabilityNegotiationRequired: boolean;
  fallbackRequired: boolean;
  missingRuntimeStrategy: string;
  packageFrameworkDependenciesAllowed: boolean;
  vendoredFrameworksAllowed: boolean;
}

export interface XTensionsRuntimeHostCapabilities {
  schema: string;
  hostId: string;
  surfaceRegistryRef: string;
  scope: 'host-local';
  globalRegistry: false;
  capabilities: string[];
  providedFrameworks: Array<{
    name: string;
    version: string;
    source: string;
    available: boolean;
  }>;
  loadingPolicy: XTensionsRuntimeLoadingPolicy;
  boundaries: string[];
}

export interface XTensionsRuntimeAdapterRecord {
  schema: string;
  xtensionId: string;
  framework: string;
  version: string;
  status: string;
  hostControllerSchema: string;
  entry: {
    module: string;
    exportName: string;
    format: string;
    dynamicImport: boolean;
  };
  lazy: Record<string, unknown>;
  integrity: {
    sha256: string;
    source: string;
  };
  fallback: {
    mode: string;
    component: string;
    message: string;
    degradedStatus: string;
  };
  dependencies: Array<{
    name: string;
    versionRange: string;
    classification: string;
    available?: boolean;
    bundled: boolean;
    packageIncluded: boolean;
  }>;
  contract: Record<string, unknown> | null;
  requiredHostCapabilities: string[];
  manifestFingerprint: string;
  artifactFingerprint: string;
  source: Record<string, unknown>;
  loadingPolicy: XTensionsRuntimeLoadingPolicy;
  globalRegistry: boolean;
  diagnostics: XTensionsRuntimeDiagnostic[];
  adapterFingerprint: string;
}

export interface XTensionsRuntimeCapabilityRegistry {
  schema: string;
  hostCapabilitiesSchema: string;
  adapterRecordSchema: string;
  loadingPolicySchema: string;
  workpackage: string;
  status: string;
  ok: boolean;
  host: XTensionsRuntimeHostCapabilities;
  scope: 'host-local';
  globalRegistry: false;
  adapterCount: number;
  adapters: XTensionsRuntimeAdapterRecord[];
  indexes: {
    byId: Record<string, string>;
    byFramework: Record<string, string[]>;
  };
  diagnostics: XTensionsRuntimeDiagnostic[];
  registryFingerprint: string;
}

export interface XTensionsRuntimeCapabilityNegotiation {
  schema: string;
  adapterRecordSchema: string;
  hostCapabilitiesSchema: string;
  workpackage: string;
  ok: boolean;
  status: string;
  xtensionId: string;
  framework: string;
  hostId: string;
  missingCapabilities: string[];
  missingPeers: string[];
  versionMismatches: string[];
  diagnostics: XTensionsRuntimeDiagnostic[];
}

export interface XTensionsRuntimeLoadDecision {
  schema: string;
  registrySchema: string;
  loadingPolicySchema?: string;
  negotiationSchema: string;
  workpackage: string;
  ok: boolean;
  status: 'loaded' | 'skipped' | 'failed' | 'degraded' | 'policy-blocked';
  action: string;
  xtensionId: string | null;
  framework: string | null;
  hostId: string;
  surfaceId: string;
  dynamicImportAllowed: boolean;
  runtimeExecutionRequired: false;
  fallback: Record<string, unknown> | null;
  negotiation: XTensionsRuntimeCapabilityNegotiation | null;
  diagnostics: XTensionsRuntimeDiagnostic[];
  loadToken: string;
  timestamp: string;
}

export interface XTensionsRuntimeReport {
  schema: string;
  registrySchema: string;
  adapterRecordSchema: string;
  loadingPolicySchema: string;
  loadDecisionSchema: string;
  negotiationSchema: string;
  workpackage: string;
  ok: boolean;
  status: string;
  appShellBlocked: boolean;
  hostId: string;
  adapterCount: number;
  requestCount: number;
  loadedCount: number;
  skippedCount: number;
  degradedCount: number;
  failedCount: number;
  policyBlockedCount: number;
  registry: XTensionsRuntimeCapabilityRegistry;
  decisions: XTensionsRuntimeLoadDecision[];
  diagnostics: XTensionsRuntimeDiagnostic[];
  runtimeExecutionRequired: false;
  timestamp: string;
}

export const XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA: string;
export const XTENSIONS_RUNTIME_HOST_CAPABILITIES_SCHEMA: string;
export const XTENSIONS_RUNTIME_ADAPTER_RECORD_SCHEMA: string;
export const XTENSIONS_RUNTIME_LOADING_POLICY_SCHEMA: string;
export const XTENSIONS_RUNTIME_CAPABILITY_NEGOTIATION_SCHEMA: string;
export const XTENSIONS_RUNTIME_LOAD_DECISION_SCHEMA: string;
export const XTENSIONS_RUNTIME_REPORT_SCHEMA: string;
export const XTENSIONS_RUNTIME_DIAGNOSTIC_SCHEMA: string;
export const RUNTIME_LOAD_STATUSES: string[];

export function assertRuntimeCapabilityDependencyBoundary(input?: Record<string, unknown>): {
  ok: boolean;
  diagnostics: XTensionsRuntimeDiagnostic[];
  forbiddenFrameworkDependencies: string[];
};
export function createXTensionsRuntimeCapabilityRegistry(input?: Record<string, unknown>, options?: Record<string, unknown>): XTensionsRuntimeCapabilityRegistry;
export function createXTensionsRuntimeReport(input?: Record<string, unknown>, options?: Record<string, unknown>): XTensionsRuntimeReport;
export function negotiateRuntimeCapabilities(adapterInput?: Record<string, unknown>, hostInput?: Record<string, unknown>, options?: Record<string, unknown>): XTensionsRuntimeCapabilityNegotiation;
export function normalizeRuntimeAdapterRecord(adapter?: Record<string, unknown>, options?: Record<string, unknown>): XTensionsRuntimeAdapterRecord;
export function normalizeRuntimeHostCapabilities(host?: Record<string, unknown>, options?: Record<string, unknown>): XTensionsRuntimeHostCapabilities;
export function normalizeRuntimeLoadingPolicy(policy?: Record<string, unknown>): XTensionsRuntimeLoadingPolicy;
export function resolveAdapterLoadingPolicy(adapterInput?: Record<string, unknown>, hostInput?: Record<string, unknown>, request?: Record<string, unknown>, options?: Record<string, unknown>): XTensionsRuntimeLoadDecision;
export function serializeRuntimeCapabilityRegistryReport(report: XTensionsRuntimeReport): string;
export function versionSatisfies(version: string, range: string): boolean;
