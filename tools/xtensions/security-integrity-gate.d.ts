export interface SecurityDiagnostic {
  schema: string;
  source: string;
  workpackage: string;
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  xtensionId?: string | null;
  framework?: string | null;
  field?: string | null;
  metadata?: Record<string, unknown>;
}

export interface SecurityGatePolicy {
  schema: string;
  strict: boolean;
  requireOwner: boolean;
  requireVersion: boolean;
  requireContract: boolean;
  requireIntegrity: boolean;
  requireFallback: boolean;
  requireCsp: boolean;
  dynamicImportRequiresIntegrity: boolean;
  remoteArtifactsAllowed: boolean;
  allowCdnForLocalFixtures: boolean;
  denyByDefaultCapabilities: boolean;
  imageDataSrcAllowed: boolean;
  wasmUnsafeEvalRequiresDeclaration: boolean;
  requiredCspDirectives: string[];
  allowedDependencyClassifications: string[];
  blockedDependencyClassifications: string[];
  allowedCapabilities: string[];
  forbiddenFrameworkDependencies: string[];
}

export interface SecurityCspRequirements {
  schema: string;
  scriptSrc: string[];
  connectSrc: string[];
  workerSrc: string[];
  styleSrc: string[];
  imgSrc: string[];
  fontSrc: string[];
  dynamicImport: boolean;
  requiresWorker: boolean;
  requiresWasm: boolean;
  localFixtureNoNetwork: boolean;
  source: Record<string, unknown>;
}

export interface SecuritySupplyChainDependency {
  schema: string;
  name: string;
  versionRange: string;
  classification: string;
  rawClassification: string;
  frameworkDependency: boolean;
  bundled: boolean;
  packageIncluded: boolean;
  allowed: boolean;
}

export interface SecurityManifestReport {
  schema: string;
  gateSchema: string;
  policySchema: string;
  cspRequirementsSchema: string;
  supplyChainClassificationSchema: string;
  workpackage: string;
  ok: boolean;
  status: string;
  xtensionId: string;
  framework: string;
  owner: string;
  version: string;
  entry: Record<string, unknown>;
  remoteCapable: boolean;
  integrity: Record<string, unknown>;
  csp: SecurityCspRequirements;
  capabilities: string[];
  dependencies: SecuritySupplyChainDependency[];
  fallback: Record<string, unknown>;
  manifestFingerprint: string;
  artifactFingerprint: string;
  securityFingerprint: string;
  diagnostics: SecurityDiagnostic[];
}

export interface SecurityIntegrityGateReport {
  schema: string;
  gateSchema: string;
  policySchema: string;
  cspRequirementsSchema: string;
  supplyChainClassificationSchema: string;
  manifestReportSchema: string;
  diagnosticSchema: string;
  hostControllerSchema: string;
  signalBridgeSchema: string;
  kernelSignalSchema: string;
  surfaceEventSchema: string;
  maracaManifestSchema: string;
  maracaArtifactSchema: string;
  maracaBuildPlanSchema: string;
  runtimeRegistrySchema: string;
  runtimeLoadingPolicySchema: string;
  workpackage: string;
  ok: boolean;
  status: string;
  strict: boolean;
  frameworkCodeRequired: false;
  runtimeExecutionRequired: false;
  localFixtureNetworkRequired: false;
  policy: SecurityGatePolicy;
  manifestCount: number;
  readyCount: number;
  blockedCount: number;
  remoteCapableCount: number;
  packagedFrameworkDependencyCount: number;
  reports: SecurityManifestReport[];
  dependencyBoundary: Record<string, unknown>;
  diagnostics: SecurityDiagnostic[];
  summary: Record<string, unknown>;
  boundaries: string[];
  gateFingerprint: string;
  timestamp: string;
}

export const XTENSIONS_SECURITY_INTEGRITY_GATE_SCHEMA: string;
export const XTENSIONS_SECURITY_POLICY_SCHEMA: string;
export const XTENSIONS_SECURITY_CSP_REQUIREMENTS_SCHEMA: string;
export const XTENSIONS_SECURITY_SUPPLY_CHAIN_CLASSIFICATION_SCHEMA: string;
export const XTENSIONS_SECURITY_MANIFEST_REPORT_SCHEMA: string;
export const XTENSIONS_SECURITY_REPORT_SCHEMA: string;
export const XTENSIONS_SECURITY_DIAGNOSTIC_SCHEMA: string;
export const XTENSIONS_SECURITY_INTEGRITY_GATE_WORKPACKAGE: 'XTN-11';
export const XTENSIONS_SECURITY_INTEGRITY_GATE_MODULE_PATH: string;
export const XTENSIONS_SECURITY_INTEGRITY_GATE_TYPES_PATH: string;
export const XTENSIONS_SECURITY_INTEGRITY_GATE_SUITE_PATH: string;
export const XTENSIONS_SECURITY_INTEGRITY_GATE_FIXTURE_PATH: string;
export const XTENSIONS_SECURITY_INTEGRITY_GATE_CONTRACT_PATH: string;
export const XTENSIONS_SECURITY_INTEGRITY_GATE_PACKAGE_SCRIPT: string;
export const SECURITY_GATE_STATUSES: readonly string[];
export const SECURITY_DEPENDENCY_CLASSIFICATIONS: readonly string[];
export const SECURITY_BLOCKED_DEPENDENCY_CLASSIFICATIONS: readonly string[];
export const SECURITY_REQUIRED_CSP_DIRECTIVES: readonly string[];
export const SECURITY_GATE_BOUNDARIES: readonly string[];
export const DEFAULT_ALLOWED_CAPABILITIES: readonly string[];
export const DEFAULT_SECURITY_GATE_POLICY: SecurityGatePolicy;
export const SECURITY_OWNER_MISSING_CODE: string;
export const SECURITY_VERSION_MISSING_CODE: string;
export const SECURITY_CONTRACT_MISSING_CODE: string;
export const SECURITY_INTEGRITY_MISSING_CODE: string;
export const SECURITY_INTEGRITY_INVALID_CODE: string;
export const SECURITY_CSP_DIRECTIVE_MISSING_CODE: string;
export const SECURITY_CSP_UNSAFE_SOURCE_CODE: string;
export const SECURITY_CSP_WASM_POLICY_MISSING_CODE: string;
export const SECURITY_REMOTE_ARTIFACT_BLOCKED_CODE: string;
export const SECURITY_CDN_SOURCE_FORBIDDEN_CODE: string;
export const SECURITY_CAPABILITY_NOT_ALLOWED_CODE: string;
export const SECURITY_DEPENDENCY_CLASSIFICATION_INVALID_CODE: string;
export const SECURITY_PACKAGED_FRAMEWORK_DEPENDENCY_CODE: string;
export const SECURITY_FALLBACK_MISSING_CODE: string;
export const SECURITY_POLICY_DRIFT_CODE: string;
export const SECURITY_FRAMEWORK_DEPENDENCY_CODE: string;

export function assertXTensionsSecurityDependencyBoundary(input?: Record<string, unknown>): {
  ok: boolean;
  diagnostics: SecurityDiagnostic[];
  forbiddenFrameworkDependencies: string[];
};
export function createSecurityDiagnostic(subject?: Record<string, unknown>, code?: string, message?: string, severity?: string, metadata?: Record<string, unknown>): SecurityDiagnostic;
export function createXTensionsSecurityIntegrityGate(input?: Record<string, unknown>, options?: Record<string, unknown>): SecurityIntegrityGateReport;
export function evaluateXTensionSecurity(input?: Record<string, unknown>, options?: Record<string, unknown>): SecurityManifestReport;
export function normalizeCspRequirements(input?: Record<string, unknown>, options?: Record<string, unknown>): SecurityCspRequirements;
export function normalizeSecurityGatePolicy(policy?: Record<string, unknown>): SecurityGatePolicy;
export function normalizeSupplyChainDependency(dependency?: Record<string, unknown> | string): SecuritySupplyChainDependency;
export function serializeXTensionsSecurityIntegrityGateReport(report: SecurityIntegrityGateReport): string;
