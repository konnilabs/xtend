export const MARACA_CSS_PROVIDER_SCHEMA: 'xtend.maraca.css-provider.v1';
export const MARACA_CSS_BUILD_REQUEST_SCHEMA: 'xtend.maraca.css-build-request.v1';
export const MARACA_CSS_INSPECTION_SCHEMA: 'xtend.maraca.css-provider-inspection.v1';
export const MARACA_CSS_BUILD_PLAN_SCHEMA: 'xtend.maraca.css-build-plan.v1';
export const MARACA_CSS_ARTIFACT_SCHEMA: 'xtend.maraca.css-artifact.v1';
export const MARACA_CSS_BUILD_EVIDENCE_SCHEMA: 'xtend.maraca.css-build-evidence.v1';
export const MARACA_CSS_LIFECYCLE_RESULT_SCHEMA: 'xtend.maraca.css-provider-lifecycle-result.v1';
export const MARACA_CSS_DIAGNOSTIC_SCHEMA: 'xtend.maraca.css-provider-diagnostic.v1';

export const CSS_PROVIDER_LIFECYCLE: readonly ['inspect', 'plan', 'build', 'report', 'dispose'];
export const CSS_PROVIDER_STATUSES: readonly CssProviderStatus[];
export const CSS_OUTPUT_MODES: readonly CssOutputMode[];
export const CSS_PROVIDER_INVALID_CODE: 'xtend.maraca.css_provider.invalid';
export const CSS_PROVIDER_UNAVAILABLE_CODE: 'xtend.maraca.css_provider.unavailable';
export const CSS_PROVIDER_SOURCE_BLOCKED_CODE: 'xtend.maraca.css_provider.source_blocked';
export const CSS_PROVIDER_BUILD_FAILED_CODE: 'xtend.maraca.css_provider.build_failed';
export const CSS_PROVIDER_OUTPUT_MISSING_CODE: 'xtend.maraca.css_provider.output_missing';

export type CssProviderStatus = 'ready' | 'unavailable' | 'blocked' | 'failed' | 'degraded';
export type CssOutputMode = 'inline' | 'external';

export interface CssProviderDiagnostic {
  schema: typeof MARACA_CSS_DIAGNOSTIC_SCHEMA;
  code: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  [key: string]: unknown;
}

export interface CssSourceRecord {
  path: string;
  kind: string;
  fingerprint: string | null;
}

export interface CssBuildRequestInput {
  provider?: string;
  providerId?: string;
  mode?: CssOutputMode;
  input?: string;
  output?: string;
  profile?: string;
  minify?: boolean;
  sourceMaps?: boolean;
  strict?: boolean;
  sources?: Array<string | Partial<CssSourceRecord>>;
  sourcePolicy?: {
    root?: string;
    allow?: string[];
    deny?: string[];
    automaticDiscovery?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface CssBuildRequest {
  schema: typeof MARACA_CSS_BUILD_REQUEST_SCHEMA;
  provider: string;
  mode: CssOutputMode;
  input: string | null;
  output: string | null;
  profile: string;
  minify: boolean;
  sourceMaps: boolean;
  strict: boolean;
  sources: CssSourceRecord[];
  sourcePolicy: {
    root: string;
    allow: string[];
    deny: string[];
    automaticDiscovery: boolean;
  };
  metadata: Record<string, unknown>;
  fingerprint: string;
}

export interface CssProviderContractInput {
  id: string;
  version: string;
  label?: string;
  capabilities?: Partial<CssProviderContract['capabilities']>;
  sourcePolicy?: Partial<CssProviderContract['sourcePolicy']>;
}

export interface CssProviderContract {
  schema: typeof MARACA_CSS_PROVIDER_SCHEMA;
  id: string;
  version: string;
  label: string;
  lifecycle: string[];
  runtimeBoundary: 'build-time-only';
  capabilities: {
    inline: boolean;
    external: boolean;
    minify: boolean;
    sourceMaps: boolean;
  };
  sourcePolicy: {
    explicitSources: boolean;
    automaticDiscovery: boolean;
    network: boolean;
  };
  diagnostics: {
    schema: typeof MARACA_CSS_DIAGNOSTIC_SCHEMA;
    codes: string[];
  };
  fingerprint: string;
}

export interface CssProviderInspection {
  schema: typeof MARACA_CSS_INSPECTION_SCHEMA;
  status: CssProviderStatus;
  available: boolean;
  toolchain: Record<string, unknown>;
  diagnostics: CssProviderDiagnostic[];
  fingerprint: string;
}

export interface CssBuildPlan {
  schema: typeof MARACA_CSS_BUILD_PLAN_SCHEMA;
  status: CssProviderStatus;
  provider: string;
  providerFingerprint: string;
  requestFingerprint: string;
  inspectionFingerprint: string;
  mode: CssOutputMode;
  output: unknown;
  steps: string[];
  metadata: Record<string, unknown>;
  diagnostics: CssProviderDiagnostic[];
  fingerprint: string;
}

export interface CssArtifact {
  schema: typeof MARACA_CSS_ARTIFACT_SCHEMA;
  status: CssProviderStatus;
  mode: CssOutputMode;
  fileName: string | null;
  cssText: string;
  sourceMap: unknown;
  bytes: number;
  fingerprint: string;
  diagnostics: CssProviderDiagnostic[];
}

export interface CssBuildEvidence {
  schema: typeof MARACA_CSS_BUILD_EVIDENCE_SCHEMA;
  provider: CssProviderContract;
  requestFingerprint: string | null;
  planFingerprint: string | null;
  status: CssProviderStatus;
  mode: CssOutputMode;
  fileName: string | null;
  bytes: number;
  outputFingerprint: string | null;
  sourceFingerprints: Array<{ path: string; fingerprint: string | null }>;
  diagnostics: CssProviderDiagnostic[];
  fingerprint: string;
}

export interface CssProviderDefinition extends CssProviderContractInput {
  inspect(request: CssBuildRequest): unknown | Promise<unknown>;
  plan(request: CssBuildRequest, inspection: CssProviderInspection): unknown | Promise<unknown>;
  build(plan: CssBuildPlan, request: CssBuildRequest, inspection: CssProviderInspection): CssArtifact | Promise<CssArtifact>;
  report(context: Record<string, unknown>): CssBuildEvidence | Promise<CssBuildEvidence>;
  dispose(context: Record<string, unknown>): unknown | Promise<unknown>;
}

export interface CssProviderImplementation {
  contract: CssProviderContract;
  inspect: CssProviderDefinition['inspect'];
  plan: CssProviderDefinition['plan'];
  build: CssProviderDefinition['build'];
  report: CssProviderDefinition['report'];
  dispose: CssProviderDefinition['dispose'];
}

export interface CssProviderLifecycleResult {
  schema: typeof MARACA_CSS_LIFECYCLE_RESULT_SCHEMA;
  ok: boolean;
  status: CssProviderStatus;
  contract: CssProviderContract;
  request: CssBuildRequest;
  inspection: CssProviderInspection | null;
  plan: CssBuildPlan | null;
  artifact: CssArtifact | null;
  evidence: CssBuildEvidence;
  diagnostics: CssProviderDiagnostic[];
  lifecycle: string[];
}

export function createCssBuildRequest(input?: CssBuildRequestInput): CssBuildRequest;
export function validateCssBuildRequest(input?: CssBuildRequestInput | CssBuildRequest): { ok: boolean; status: CssProviderStatus; request: CssBuildRequest; diagnostics: CssProviderDiagnostic[] };
export function createCssProviderContract(input: CssProviderContractInput): CssProviderContract;
export function validateCssProviderContract(input: CssProviderContractInput | CssProviderContract): { ok: boolean; status: CssProviderStatus; contract: CssProviderContract; diagnostics: CssProviderDiagnostic[] };
export function createCssProvider(definition: CssProviderDefinition): CssProviderImplementation;
export function validateCssProvider(provider: CssProviderImplementation): { ok: boolean; status: CssProviderStatus; contract: CssProviderContract; diagnostics: CssProviderDiagnostic[] };
export function createCssArtifact(input?: Record<string, unknown> & { cssText?: string; mode?: CssOutputMode; fileName?: string }): CssArtifact;
export function createCssBuildEvidence(input?: Record<string, unknown>): CssBuildEvidence;
export function createNativeMaracaCssProvider(options?: { version?: string; cssText?: string; buildCss?: (context: Record<string, unknown>) => string | Promise<string> }): CssProviderImplementation;
export function createDummyCssProvider(options?: Record<string, unknown>): CssProviderImplementation;
export function runCssProviderLifecycle(provider: CssProviderImplementation, input?: CssBuildRequestInput): Promise<CssProviderLifecycleResult>;
