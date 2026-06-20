export interface RegistryDiagnostic {
  schema: string;
  source: string;
  workpackage: string;
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  registryId?: string | null;
  xtensionId?: string | null;
  packageName?: string | null;
  framework?: string | null;
  field?: string | null;
  metadata?: Record<string, unknown>;
}

export interface RegistryPackageStrategy {
  schema: string;
  primaryDistribution: string;
  packageNamePattern: string;
  packageNamespace: string;
  npmSubpackages: string;
  marketplaceEntries: string;
  adapterPackaging: string;
  registryScope: string;
  registrySourceOfTruth: string;
  runtimeSourceOfTruth: string;
  allowGlobalRegistry: boolean;
  allowRemoteArtifacts: boolean;
  allowNpmSubpackagesByDefault: boolean;
  requireSecurityReview: boolean;
  requireCompatibilityMatrix: boolean;
  requireDeprecationPolicy: boolean;
  packageFrameworkDependenciesAllowed: boolean;
  vendoredFrameworksAllowed: boolean;
  boundaries: string[];
}

export interface RegistryCompatibilityMatrix {
  schema: string;
  status: string;
  xtendVersionRange: string;
  maracaManifestSchema: string;
  runtimeRegistrySchema: string;
  securityGateSchema: string;
  hostControllerSchema: string;
  notes: string;
}

export interface RegistryDeprecationPolicy {
  schema: string;
  status: string;
  replacement: string;
  sunsetVersion: string;
  sunsetDate: string;
  migrationGuide: string;
  policy: string;
}

export interface RegistryReleasePolicy {
  schema: string;
  owner: string;
  securityReviewed: boolean;
  compatibilityReviewed: boolean;
  deprecationReviewed: boolean;
  provenanceRequired: boolean;
  publishApproved: boolean;
  releaseChannel: string;
  packagePublishingAllowed: boolean;
}

export interface RegistryEntry {
  schema: string;
  registryId: string;
  xtensionId: string;
  packageName: string;
  distribution: string;
  framework: string;
  version: string;
  owner: string;
  sourceOfTruth: string;
  runtimeRegistryRef: string;
  globalRegistry: boolean;
  manifest: Record<string, unknown>;
  manifestFingerprint: string;
  artifactFingerprint: string;
  marketplace: Record<string, unknown>;
  package: Record<string, unknown>;
  dependencies: Record<string, unknown>[];
  compatibility: RegistryCompatibilityMatrix;
  deprecation: RegistryDeprecationPolicy;
  release: RegistryReleasePolicy;
  diagnostics: RegistryDiagnostic[];
  timestamp: string;
  ok: boolean;
  status: string;
  registryFingerprint: string;
}

export interface RegistryPackageStrategyReport {
  schema: string;
  strategySchema: string;
  entrySchema: string;
  compatibilityMatrixSchema: string;
  releasePolicySchema: string;
  deprecationPolicySchema: string;
  diagnosticSchema: string;
  maracaManifestSchema: string;
  maracaArtifactSchema: string;
  maracaBuildPlanSchema: string;
  runtimeRegistrySchema: string;
  securityGateSchema: string;
  securityReportSchema: string;
  workpackage: string;
  ok: boolean;
  status: string;
  registryId: string;
  registryScope: string;
  runtimeSourceOfTruth: string;
  noSecondRuntimeSourceOfTruth: true;
  frameworkCodeRequired: false;
  runtimeExecutionRequired: false;
  packageFrameworkDependenciesAllowed: false;
  vendoredFrameworksAllowed: false;
  strategy: RegistryPackageStrategy;
  entries: RegistryEntry[];
  maracaPlan: Record<string, unknown>;
  securityReport: Record<string, unknown>;
  dependencyBoundary: Record<string, unknown>;
  diagnostics: RegistryDiagnostic[];
  summary: Record<string, unknown>;
  boundaries: string[];
  registryFingerprint: string;
  timestamp: string;
}

export const XTENSIONS_REGISTRY_PACKAGE_STRATEGY_SCHEMA: string;
export const XTENSIONS_REGISTRY_ENTRY_SCHEMA: string;
export const XTENSIONS_REGISTRY_COMPATIBILITY_MATRIX_SCHEMA: string;
export const XTENSIONS_REGISTRY_RELEASE_POLICY_SCHEMA: string;
export const XTENSIONS_REGISTRY_DEPRECATION_POLICY_SCHEMA: string;
export const XTENSIONS_REGISTRY_REPORT_SCHEMA: string;
export const XTENSIONS_REGISTRY_DIAGNOSTIC_SCHEMA: string;
export const XTENSIONS_REGISTRY_PACKAGE_STRATEGY_MODULE_PATH: string;
export const XTENSIONS_REGISTRY_PACKAGE_STRATEGY_TYPES_PATH: string;
export const XTENSIONS_REGISTRY_PACKAGE_STRATEGY_SUITE_PATH: string;
export const XTENSIONS_REGISTRY_PACKAGE_STRATEGY_FIXTURE_PATH: string;
export const XTENSIONS_REGISTRY_PACKAGE_STRATEGY_CONTRACT_PATH: string;
export const XTENSIONS_REGISTRY_PACKAGE_STRATEGY_WORKPACKAGE: 'XTN-13';
export const XTENSIONS_REGISTRY_PACKAGE_STRATEGY_PACKAGE_SCRIPT: string;
export const DEFAULT_PACKAGE_STRATEGY: RegistryPackageStrategy;
export const REGISTRY_DISTRIBUTION_MODES: readonly string[];
export const REGISTRY_ALLOWED_DISTRIBUTION_MODES: readonly string[];
export const REGISTRY_COMPATIBILITY_STATUSES: readonly string[];
export const REGISTRY_DEPRECATION_STATUSES: readonly string[];
export const REGISTRY_BOUNDARIES: readonly string[];
export const REGISTRY_FRAMEWORK_DEPENDENCY_CODE: string;
export const REGISTRY_PACKAGE_NAME_INVALID_CODE: string;
export const REGISTRY_OWNER_MISSING_CODE: string;
export const REGISTRY_SECURITY_REVIEW_MISSING_CODE: string;
export const REGISTRY_COMPATIBILITY_MISSING_CODE: string;
export const REGISTRY_COMPATIBILITY_UNSUPPORTED_CODE: string;
export const REGISTRY_DEPRECATION_POLICY_MISSING_CODE: string;
export const REGISTRY_RELEASE_POLICY_INVALID_CODE: string;
export const REGISTRY_RUNTIME_SOURCE_OF_TRUTH_CODE: string;
export const REGISTRY_GLOBAL_REGISTRY_FORBIDDEN_CODE: string;
export const REGISTRY_REMOTE_DISTRIBUTION_BLOCKED_CODE: string;
export const REGISTRY_NPM_SUBPACKAGE_DEFERRED_CODE: string;
export const REGISTRY_PACKAGED_FRAMEWORK_CODE: string;

export function assertRegistryPackageStrategyDependencyBoundary(input?: Record<string, unknown>): {
  ok: boolean;
  diagnostics: RegistryDiagnostic[];
  forbiddenFrameworkDependencies: string[];
};
export function createRegistryDiagnostic(subject?: Record<string, unknown>, code?: string, message?: string, severity?: string, metadata?: Record<string, unknown>): RegistryDiagnostic;
export function createXTensionsRegistryPackageStrategyReport(input?: Record<string, unknown>, options?: Record<string, unknown>): RegistryPackageStrategyReport;
export function normalizeCompatibilityMatrix(matrix?: Record<string, unknown>): RegistryCompatibilityMatrix;
export function normalizeDeprecationPolicy(policy?: Record<string, unknown>): RegistryDeprecationPolicy;
export function normalizePackageStrategy(strategy?: Record<string, unknown>): RegistryPackageStrategy;
export function normalizeRegistryEntry(input?: Record<string, unknown>, options?: Record<string, unknown>): RegistryEntry;
export function normalizeReleasePolicy(policy?: Record<string, unknown>, owner?: string): RegistryReleasePolicy;
export function serializeRegistryPackageStrategyReport(report: RegistryPackageStrategyReport): string;
