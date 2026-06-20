export interface AdoptionDiagnostic {
  schema: string;
  source: string;
  workpackage: string;
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  docPath?: string | null;
  docKind?: string | null;
  startPackageId?: string | null;
  field?: string | null;
  metadata?: Record<string, unknown>;
}

export interface AdoptionDocArtifact {
  schema: string;
  workpackage: string;
  kind: string;
  path: string;
  title: string;
  audience: string;
  status: string;
  requiredTopics: string[];
  presentTopics: string[];
  missingTopics: string[];
  textLength: number;
  fingerprint: string;
  diagnostics: AdoptionDiagnostic[];
  timestamp: string;
  ok: boolean;
}

export interface AdoptionStartPackage {
  schema: string;
  workpackage: string;
  id: string;
  title: string;
  priority: string;
  owner: string;
  status: string;
  dependsOn: string[];
  outcomes: string[];
  frameworkDependenciesAllowed: boolean;
  vendoredFrameworksAllowed: boolean;
  runtimeExecutionRequired: boolean;
  diagnostics: AdoptionDiagnostic[];
  timestamp: string;
  ok: boolean;
  fingerprint: string;
}

export interface AdoptionHandoffReport {
  schema: string;
  handoffSchema: string;
  docArtifactSchema: string;
  startPackageSchema: string;
  diagnosticSchema: string;
  maracaManifestSchema: string;
  runtimeRegistrySchema: string;
  securityGateSchema: string;
  registryStrategySchema: string;
  workpackage: string;
  ok: boolean;
  status: string;
  optInCoexistence: true;
  nativeFirstDefault: true;
  frameworkAgnosticKernel: true;
  frameworkCodeRequired: false;
  runtimeExecutionRequired: false;
  packageFrameworkDependenciesAllowed: false;
  vendoredFrameworksAllowed: false;
  docs: AdoptionDocArtifact[];
  startPackages: AdoptionStartPackage[];
  boundaries: string[];
  dependencyBoundary: Record<string, unknown>;
  diagnostics: AdoptionDiagnostic[];
  summary: Record<string, unknown>;
  handoffFingerprint: string;
  timestamp: string;
}

export const XTENSIONS_ADOPTION_HANDOFF_SCHEMA: string;
export const XTENSIONS_ADOPTION_DOC_ARTIFACT_SCHEMA: string;
export const XTENSIONS_ADOPTION_START_PACKAGE_SCHEMA: string;
export const XTENSIONS_ADOPTION_REPORT_SCHEMA: string;
export const XTENSIONS_ADOPTION_DIAGNOSTIC_SCHEMA: string;
export const XTENSIONS_ADOPTION_HANDOFF_MODULE_PATH: string;
export const XTENSIONS_ADOPTION_HANDOFF_TYPES_PATH: string;
export const XTENSIONS_ADOPTION_HANDOFF_SUITE_PATH: string;
export const XTENSIONS_ADOPTION_HANDOFF_FIXTURE_PATH: string;
export const XTENSIONS_ADOPTION_HANDOFF_CONTRACT_PATH: string;
export const XTENSIONS_ADOPTION_HANDOFF_WORKPACKAGE: 'XTN-14';
export const XTENSIONS_ADOPTION_HANDOFF_PACKAGE_SCRIPT: string;
export const XTENSIONS_AUTHORING_GUIDE_DOC_PATH: string;
export const XTENSIONS_MIGRATION_COEXISTENCE_DOC_PATH: string;
export const XTENSIONS_SECURITY_CHECKLIST_DOC_PATH: string;
export const XTENSIONS_ENTERPRISE_HANDOFF_DOC_PATH: string;
export const ADOPTION_DOC_MISSING_CODE: string;
export const ADOPTION_TOPIC_MISSING_CODE: string;
export const ADOPTION_FORCED_MIGRATION_CODE: string;
export const ADOPTION_BOUNDARY_MISSING_CODE: string;
export const ADOPTION_START_PACKAGE_MISSING_CODE: string;
export const ADOPTION_FRAMEWORK_DEPENDENCY_CODE: string;
export const ADOPTION_DOC_KINDS: readonly string[];
export const ADOPTION_START_PACKAGE_IDS: readonly string[];
export const ADOPTION_REQUIRED_BOUNDARIES: readonly string[];
export const DOC_REQUIRED_TOPICS: Readonly<Record<string, readonly string[]>>;

export function assertAdoptionHandoffDependencyBoundary(input?: Record<string, unknown>): {
  ok: boolean;
  diagnostics: AdoptionDiagnostic[];
  forbiddenFrameworkDependencies: string[];
};
export function createAdoptionDiagnostic(subject?: Record<string, unknown>, code?: string, message?: string, severity?: string, metadata?: Record<string, unknown>): AdoptionDiagnostic;
export function createXTensionsAdoptionHandoffReport(input?: Record<string, unknown>, options?: Record<string, unknown>): AdoptionHandoffReport;
export function normalizeDocArtifact(input?: Record<string, unknown>, options?: Record<string, unknown>): AdoptionDocArtifact;
export function normalizeStartPackage(input?: Record<string, unknown>, options?: Record<string, unknown>): AdoptionStartPackage;
export function serializeAdoptionHandoffReport(report: AdoptionHandoffReport): string;
