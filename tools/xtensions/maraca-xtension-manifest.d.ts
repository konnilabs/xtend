export const XTENSIONS_MARACA_MANIFEST_SCHEMA: 'xtend.maraca.xtension-manifest.v1';
export const XTENSIONS_MARACA_CONTRACT_SNAPSHOT_SCHEMA: 'xtend.maraca.xtension-contract-snapshot.v1';
export const XTENSIONS_MARACA_ARTIFACT_SCHEMA: 'xtend.maraca.xtension-artifact.v1';
export const XTENSIONS_MARACA_BUILD_PROVENANCE_SCHEMA: 'xtend.maraca.xtension-build-provenance.v1';
export const XTENSIONS_MARACA_BUILD_PLAN_SCHEMA: 'xtend.maraca.xtension-build-plan.v1';
export const XTENSIONS_MARACA_BUNDLE_REPORT_SCHEMA: 'xtend.maraca.xtensions-bundle-report.v1';
export const XTENSIONS_MARACA_BUNDLE_SECTION_SCHEMA: 'xtend.maraca.xtensions-bundle-section.v1';
export const XTENSIONS_MARACA_DEPENDENCY_CLASSIFICATION_SCHEMA: 'xtend.maraca.xtension-dependency-classification.v1';
export const XTENSIONS_MARACA_DIAGNOSTIC_SCHEMA: 'xtend.maraca.xtension-diagnostic.v1';
export const XTENSIONS_MARACA_MODULE_PATH: 'tools/xtensions/maraca-xtension-manifest.js';
export const XTENSIONS_MARACA_TYPES_PATH: 'tools/xtensions/maraca-xtension-manifest.d.ts';
export const XTENSIONS_MARACA_SUITE_PATH: 'tests/xtensions/maraca_xtensions_suite.js';
export const XTENSIONS_MARACA_CONTRACT_PATH: 'development/XTensions-Maraca-Manifest-and-Build-Provenance-Contract.md';
export const XTENSIONS_MARACA_VALID_FIXTURE_PATH: 'tests/fixtures/xtensions/maraca-xtension-manifest-valid.json';
export const XTENSIONS_MARACA_MISSING_FIXTURE_PATH: 'tests/fixtures/xtensions/maraca-xtension-manifest-missing.json';
export const XTENSIONS_MARACA_POLICY_BLOCKED_FIXTURE_PATH: 'tests/fixtures/xtensions/maraca-xtension-manifest-policy-blocked.json';
export const XTENSIONS_MARACA_WORKPACKAGE: 'XTN-03';
export const XTENSIONS_MARACA_PACKAGE_SCRIPT: 'npm run test:maraca-xtensions';

export type XTensionsMaracaLazyMode = 'none' | 'explicit' | 'route' | 'visible' | 'idle';
export type XTensionsMaracaFallbackMode = 'native-placeholder' | 'host-error-boundary' | 'skip' | 'static-html';
export type XTensionsMaracaDependencyClassification = 'none' | 'external-peer' | 'optional-peer' | 'host-provided' | 'legacy-local-artifact' | 'product-local-bundled' | 'policy-blocked' | 'vendored' | 'root-runtime';
export type XTensionsMaracaStatus = 'ready' | 'blocked' | 'policy-blocked' | 'missing';

export interface XTensionsMaracaDiagnostic {
  schema: typeof XTENSIONS_MARACA_DIAGNOSTIC_SCHEMA;
  source: typeof XTENSIONS_MARACA_MANIFEST_SCHEMA;
  workpackage: typeof XTENSIONS_MARACA_WORKPACKAGE;
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  xtensionId: string | null;
  framework: string | null;
  field: string | null;
  metadata: Record<string, unknown>;
}

export interface XTensionsMaracaEntry {
  module: string;
  exportName: string;
  format: string;
  dynamicImport: boolean;
}

export interface XTensionsMaracaLazyPolicy {
  mode: XTensionsMaracaLazyMode | string;
  optIn: boolean;
  policy: string;
  prefetch: boolean;
  preload: boolean;
}

export interface XTensionsMaracaContractSnapshot {
  schema: typeof XTENSIONS_MARACA_CONTRACT_SNAPSHOT_SCHEMA;
  hostControllerSchema: string;
  signalBridgeSchema: string;
  kernelSignalSchema: string;
  surfaceEventSchema: string;
  accepts: string[];
  emits: string[];
  capabilities: string[];
  source: Record<string, unknown>;
  fingerprint: string;
}

export interface XTensionsMaracaDependencyRecord {
  schema: typeof XTENSIONS_MARACA_DEPENDENCY_CLASSIFICATION_SCHEMA;
  name: string;
  versionRange: string;
  classification: XTensionsMaracaDependencyClassification | string;
  frameworkDependency: boolean;
  bundled: boolean;
  packageIncluded: boolean;
  allowed: boolean;
}

export interface XTensionsMaracaDependencyClassificationReport {
  schema: typeof XTENSIONS_MARACA_DEPENDENCY_CLASSIFICATION_SCHEMA;
  dependencies: XTensionsMaracaDependencyRecord[];
  diagnostics: XTensionsMaracaDiagnostic[];
  dependencyCount: number;
  packageDependencyCount: number;
  vendoredDependencyCount: number;
  legacyLocalArtifactCount: number;
  externalPeerCount: number;
  ok: boolean;
}

export interface XTensionsMaracaIsolation {
  runtimeClass: string;
  domBoundary: string;
  styleBoundary: string;
  trustBoundary: string;
  mutationPolicy: string;
  sandbox: string[];
  source: Record<string, unknown>;
}

export interface XTensionsMaracaManifest {
  schema: typeof XTENSIONS_MARACA_MANIFEST_SCHEMA;
  id: string;
  name: string;
  framework: string;
  version: string;
  entry: XTensionsMaracaEntry;
  lazy: XTensionsMaracaLazyPolicy;
  contractSnapshot: XTensionsMaracaContractSnapshot | null;
  capabilities: string[];
  integrity: {
    sha256: string;
    source: string;
  };
  isolation: XTensionsMaracaIsolation;
  csp: Record<string, string[]>;
  fallback: {
    mode: XTensionsMaracaFallbackMode | string;
    component: string;
    message: string;
    degradedStatus: string;
  };
  dependencies: XTensionsMaracaDependencyClassificationReport | null;
  policy: Record<string, unknown>;
  source?: Record<string, unknown>;
  timestamp: string;
  diagnostics: XTensionsMaracaDiagnostic[];
  ok: boolean;
  status: XTensionsMaracaStatus;
  manifestFingerprint: string;
  artifactFingerprint: string | null;
}

export interface XTensionsMaracaArtifact {
  schema: typeof XTENSIONS_MARACA_ARTIFACT_SCHEMA;
  xtensionId: string;
  framework: string;
  version: string;
  status: XTensionsMaracaStatus;
  entry: XTensionsMaracaEntry | null;
  lazy: XTensionsMaracaLazyPolicy | null;
  integrity: Record<string, unknown> | null;
  isolation: Record<string, unknown> | null;
  csp: Record<string, string[]> | null;
  fallback: Record<string, unknown> | null;
  contractSnapshot: XTensionsMaracaContractSnapshot | null;
  manifestFingerprint: string;
  artifactFingerprint: string | null;
  diagnostics: XTensionsMaracaDiagnostic[];
  timestamp: string;
  provenance: XTensionsMaracaBuildProvenance;
}

export interface XTensionsMaracaBuildProvenance {
  schema: typeof XTENSIONS_MARACA_BUILD_PROVENANCE_SCHEMA;
  xtensionId: string | null;
  framework: string | null;
  source: 'maraca-xtension-manifest';
  buildId: string;
  manifestFingerprint: string | null;
  contractFingerprint: string | null;
  artifactFingerprint: string | null;
  integrity: Record<string, unknown> | null;
  isolation: Record<string, unknown> | null;
  dependencyClassification: XTensionsMaracaDependencyClassificationReport | null;
  packageIncluded: false;
  vendoredFrameworksAllowed: false;
  frameworkDependenciesAllowed: false;
  timestamp: string;
}

export interface XTensionsMaracaBuildPlan {
  schema: typeof XTENSIONS_MARACA_BUILD_PLAN_SCHEMA;
  manifestSchema: typeof XTENSIONS_MARACA_MANIFEST_SCHEMA;
  artifactSchema: typeof XTENSIONS_MARACA_ARTIFACT_SCHEMA;
  provenanceSchema: typeof XTENSIONS_MARACA_BUILD_PROVENANCE_SCHEMA;
  workpackage: typeof XTENSIONS_MARACA_WORKPACKAGE;
  status: 'ready' | 'blocked';
  ok: boolean;
  outDir: string;
  manifestCount: number;
  artifactCount: number;
  xtensionIds: string[];
  manifests: XTensionsMaracaManifest[];
  artifacts: XTensionsMaracaArtifact[];
  diagnostics: XTensionsMaracaDiagnostic[];
}

export interface XTensionsMaracaBundleReport {
  schema: typeof XTENSIONS_MARACA_BUNDLE_REPORT_SCHEMA;
  manifestSchema: typeof XTENSIONS_MARACA_MANIFEST_SCHEMA;
  buildPlanSchema: typeof XTENSIONS_MARACA_BUILD_PLAN_SCHEMA;
  sectionSchema: typeof XTENSIONS_MARACA_BUNDLE_SECTION_SCHEMA;
  artifactSchema: typeof XTENSIONS_MARACA_ARTIFACT_SCHEMA;
  provenanceSchema: typeof XTENSIONS_MARACA_BUILD_PROVENANCE_SCHEMA;
  workpackage: typeof XTENSIONS_MARACA_WORKPACKAGE;
  status: 'ready' | 'blocked';
  ok: boolean;
  outDir: string;
  xtensions: Record<string, unknown>;
  diagnostics: XTensionsMaracaDiagnostic[];
  timestamp: string;
}

export const VALID_XTENSION_DEPENDENCY_CLASSIFICATIONS: readonly XTensionsMaracaDependencyClassification[];
export const VALID_XTENSION_FALLBACK_MODES: readonly XTensionsMaracaFallbackMode[];
export const VALID_XTENSION_LAZY_MODES: readonly XTensionsMaracaLazyMode[];

export function assertMaracaXTensionDependencyBoundary(input?: Record<string, unknown>): {
  ok: boolean;
  diagnostics: XTensionsMaracaDiagnostic[];
  forbiddenFrameworkDependencies: string[];
  manifestClassifications: XTensionsMaracaDependencyClassificationReport[];
};

export function classifyXTensionDependencies(manifest?: Record<string, unknown>): XTensionsMaracaDependencyClassificationReport;
export function createMaracaXTensionBuildPlan(input?: Record<string, unknown>, options?: Record<string, unknown>): XTensionsMaracaBuildPlan;
export function createMaracaXTensionDiagnostic(subject: Record<string, unknown> | null, code: string, message: string, severity?: string, metadata?: Record<string, unknown>): XTensionsMaracaDiagnostic;
export function createMaracaXTensionsBundleReport(input?: Record<string, unknown> | XTensionsMaracaBuildPlan, options?: Record<string, unknown>): XTensionsMaracaBundleReport;
export function createMissingManifestRecord(reference?: Record<string, unknown>, options?: Record<string, unknown>): XTensionsMaracaManifest;
export function createXTensionArtifact(manifest: XTensionsMaracaManifest | Record<string, unknown>, options?: Record<string, unknown>): XTensionsMaracaArtifact;
export function createXTensionBuildProvenance(manifest: XTensionsMaracaManifest, artifact?: XTensionsMaracaArtifact, options?: Record<string, unknown>): XTensionsMaracaBuildProvenance;
export function normalizeContractSnapshot(contract?: Record<string, unknown>): XTensionsMaracaContractSnapshot;
export function normalizeManifestIsolation(isolation?: Record<string, unknown>): XTensionsMaracaIsolation;
export function normalizeXTensionManifest(input?: Record<string, unknown>, options?: Record<string, unknown>): XTensionsMaracaManifest;
export function serializeMaracaXTensionReport(report: Record<string, unknown>): string;
export function sha256Value(value: unknown): string;
