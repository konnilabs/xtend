import type { CssBuildEvidence, CssBuildRequest, CssProviderContract, CssProviderImplementation } from './css-provider';

export const MARACA_PACKAGE_SCHEMA: 'xtend.maraca.package-metadata.v1';
export const MARACA_BUILD_PLAN_SCHEMA: 'xtend.maraca.build-plan.v1';
export const MARACA_BUNDLE_REPORT_SCHEMA: 'xtend.maraca.bundle-report.v1';
export const MARACA_SIZE_BUDGET_REPORT_SCHEMA: 'xtend.maraca.size-budget-report.v1';
export const MARACA_PERFORMANCE_REPORT_SCHEMA: 'xtend.maraca.performance-report.v1';
export const MARACA_ORCHESTRATION_PLAN_SCHEMA: 'xtend.maraca.orchestration-plan.v1';
export const MARACA_KERNEL_PLAN_SCHEMA: 'xtend.maraca.kernel-plan.v1';
export const MARACA_HYDRATION_PLAN_SCHEMA: 'xtend.maraca.hydration-plan.v1';
export const MARACA_WARM_REENTRY_REPORT_SCHEMA: 'xtend.maraca.warm-reentry-report.v1';
export const MARACA_PREWARM_WORKER_RUNTIME_SCHEMA: 'xtend.maraca.prewarm-worker-runtime.v1';
export const MARACA_SUPER_PREWARM_WORKER_EXPERIMENT_SCHEMA: 'xtend.maraca.super-prewarm-worker-experiment.v1';
export const MARACA_UI_COPROCESSOR_PLAN_SCHEMA: 'xtend.maraca.ui-coprocessor-plan.v1';
export const MARACA_WEB_APP_MANIFEST_PLAN_SCHEMA: 'xtend.maraca.web-app-manifest-plan.v1';
export const MARACA_WEB_APP_MANIFEST_REPORT_SCHEMA: 'xtend.maraca.web-app-manifest-report.v1';
export const MARACA_PWA_SERVICE_WORKER_PLAN_SCHEMA: 'xtend.maraca.pwa-service-worker-plan.v1';
export const MARACA_PWA_SERVICE_WORKER_REPORT_SCHEMA: 'xtend.maraca.pwa-service-worker-report.v1';
export const MARACA_VALIDATION_PLAN_SCHEMA: 'xtend.maraca.validation-plan.v1';
export const MARACA_TRANSITION_PLAN_SCHEMA: 'xtend.maraca.transition-plan.v1';
export const MARACA_TEMPLATE_ARTIFACTS_REPORT_SCHEMA: 'xtend.maraca.template-artifacts-report.v1';
export const MARACA_PRODUCTION_BUNDLE_CLOSURE_SCHEMA: 'xtend.maraca.production-bundle-closure.v1';
export const MARACA_BUILD_CONFIG_SCHEMA: 'xtend.maraca.build-config.v1';
export const MARACA_TUNE_REPORT_SCHEMA: 'xtend.maraca.tune-report.v1';

export type MaracaProfile = 'debug' | 'production' | 'max';
export type MaracaLazyMode = 'route' | 'component' | 'none';
export type MaracaCssMode = 'inline' | 'external';
export type MaracaCssPreflightMode = 'disabled' | 'scoped' | 'enabled';
export type MaracaCssProviderFallback = 'none' | 'native';
export type MaracaOrchestrationMode = 'auto' | 'strict' | 'off';
export type MaracaKernelMode = 'auto' | 'strict' | 'off';
export type MaracaKernelBootMode = 'direct' | 'productSurface';
export type MaracaHydrationMode = 'auto' | 'strict' | 'off' | 'warm' | 'prewarm';
export type MaracaValidationMode = 'auto' | 'strict' | 'off';
export type MaracaTransitionMode = 'auto' | 'strict' | 'off';

export interface MaracaBuildInput {
  source?: string;
  sourceText?: string;
  sourceContent?: string;
  virtualSourcePath?: string;
  filePath?: string;
  sourcePath?: string;
  config?: string;
  configPath?: string;
  'build-config'?: string;
  out?: string;
  outDir?: string;
  profile?: MaracaProfile;
  lazy?: MaracaLazyMode;
  css?: MaracaCssMode;
  cssProvider?: string;
  'css-provider'?: string;
  cssInput?: string;
  'css-input'?: string;
  cssSources?: string | string[];
  'css-sources'?: string | string[];
  cssPreflight?: MaracaCssPreflightMode;
  'css-preflight'?: MaracaCssPreflightMode;
  cssBudget?: number | string;
  'css-budget'?: number | string;
  cssProviderFallback?: MaracaCssProviderFallback;
  'css-provider-fallback'?: MaracaCssProviderFallback;
  cssProviderImplementation?: CssProviderImplementation;
  vendor?: boolean | string;
  components?: 'document' | 'all';
  componentMode?: 'document' | 'all';
  'component-mode'?: 'document' | 'all';
  stack?: 'plan' | 'runtime' | 'full' | 'none';
  stackMode?: 'plan' | 'runtime' | 'full' | 'none';
  'stack-mode'?: 'plan' | 'runtime' | 'full' | 'none';
  orchestration?: MaracaOrchestrationMode;
  orchestrationMode?: MaracaOrchestrationMode;
  'orchestration-mode'?: MaracaOrchestrationMode;
  kernel?: MaracaKernelMode;
  kernelMode?: MaracaKernelMode;
  'kernel-mode'?: MaracaKernelMode;
  kernelBootMode?: MaracaKernelBootMode;
  kernelBoot?: MaracaKernelBootMode;
  'kernel-boot-mode'?: MaracaKernelBootMode;
  'kernel-boot'?: MaracaKernelBootMode;
  hydration?: MaracaHydrationMode;
  hydrationMode?: MaracaHydrationMode;
  'hydration-mode'?: MaracaHydrationMode;
  validation?: MaracaValidationMode;
  validationMode?: MaracaValidationMode;
  'validation-mode'?: MaracaValidationMode;
  'form-validation'?: MaracaValidationMode;
  transitions?: MaracaTransitionMode;
  transitionMode?: MaracaTransitionMode;
  'transition-mode'?: MaracaTransitionMode;
  'surface-transitions'?: MaracaTransitionMode;
  json?: boolean;
  allowDynamicComponents?: boolean;
  'allow-dynamic-components'?: boolean | string;
  enablePrewarmWorker?: boolean | string;
  'enable-prewarm-worker'?: boolean | string;
  prewarmWorker?: boolean | string;
  enableUiCoprocessor?: boolean | string;
  'enable-ui-coprocessor'?: boolean | string;
  uiCoprocessor?: boolean | string | MaracaUiCoprocessorConfig;
  webAppManifest?: boolean | string | MaracaWebAppManifestConfig;
  'web-app-manifest'?: boolean | string | MaracaWebAppManifestConfig;
  enableWebAppManifest?: boolean | string;
  'enable-web-app-manifest'?: boolean | string;
  manifest?: boolean | string | MaracaWebAppManifestConfig | Record<string, unknown>;
  pwa?: boolean | string | MaracaPwaConfig;
  enablePwa?: boolean | string;
  'enable-pwa'?: boolean | string;
  enableServiceWorker?: boolean | string;
  'enable-service-worker'?: boolean | string;
  policyParityReports?: Array<Record<string, unknown>>;
  policyParityContracts?: Array<Record<string, unknown>>;
  policyParityRuntimeHooks?: string[];
  policyParityRequiredFactories?: string[];
  write?: boolean | string;
  check?: boolean | string;
  _?: string[];
}

export interface MaracaRunOptions {
  rootDir?: string;
}

export interface MaracaDiagnostic {
  code: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  tag?: string;
  surface?: string;
  event?: string;
  resource?: string;
  target?: string;
  [key: string]: unknown;
}

export interface MaracaKernelFeatureAdoptionReport {
  schema: 'xtend.rmt-kernel-feature-adoption-report.v1';
  contract: 'xtend.rmt-kernel-feature-adoption.v1';
  ok: boolean;
  status: string;
  capabilityKeys: string[];
  capabilityCount: number;
  supportedCount: number;
  activeCount: number;
  degradedCount: number;
  blockedCount: number;
  capabilities: Array<{
    key: string;
    supported: boolean;
    active: boolean;
    status: string;
    runtimeRequired: boolean;
    prodDefault: string;
    diagnosticsRequired: boolean;
    strictFallbackAllowed: boolean;
    requiredFactories: string[];
    missingFactories: string[];
    diagnostics: MaracaDiagnostic[];
    [key: string]: unknown;
  }>;
  diagnostics: MaracaDiagnostic[];
}

export interface MaracaKernelProductSurfaceReport {
  schema: 'xtend.maraca.kernel-product-surface-bootstrap.v1';
  bootMode: MaracaKernelBootMode;
  supported: boolean;
  status: string;
  entryPoints: Array<{ kind: string; name: string; [key: string]: unknown }>;
  entryPointCount: number;
  entryPointNames: string[];
  optionalCompat: Record<string, unknown>;
  runtimeFactories: Record<string, boolean>;
  diagnostics: MaracaDiagnostic[];
}

export interface MaracaPrewarmWorkerRuntimeReport {
  schema: typeof MARACA_PREWARM_WORKER_RUNTIME_SCHEMA;
  enabled: boolean;
  enabledBy?: 'none' | 'prewarmWorker' | 'uiCoprocessor' | string;
  supported: boolean;
  optional: boolean;
  status: string;
  runtimeExpectedStatus: string;
  workerName: string;
  workerType: string;
  topologySchema: 'xtend.rmt.prewarm-worker-topology.v1';
  requiredHostApis: string[];
  topologyFields: string[];
  ownership: Record<string, boolean>;
  fallbackPolicy: Record<string, unknown>;
  coprocessor?: MaracaUiCoprocessorSnapshot;
  diagnostics: MaracaDiagnostic[];
  summary: Record<string, unknown>;
}

export interface MaracaUiCoprocessorConfig {
  enabled?: boolean;
  mode?: 'opportunistic' | 'alwaysOn' | string;
  maxQueueDepth?: number;
  stalePolicy?: 'discard' | string;
  lifecycle?: 'runtime' | 'app' | string;
}

export interface MaracaUiCoprocessorSnapshot extends MaracaUiCoprocessorConfig {
  enabled: boolean;
  mode: 'opportunistic' | 'alwaysOn' | string;
  maxQueueDepth: number;
  stalePolicy: 'discard' | string;
  lifecycle: 'runtime' | 'app' | string;
  queueDepthMax?: number;
  status?: string;
  pendingJobs?: number;
  submittedJobs?: number;
  transferBytes?: number;
  staleResponses?: number;
  supersededResponses?: number;
  stateOwnership?: 'main-thread' | string;
  trustedDomCommit?: 'main-thread' | string;
  clientDetermined?: boolean;
  ssrRoundtripCount?: number;
}

export interface MaracaUiCoprocessorPlan {
  schema: typeof MARACA_UI_COPROCESSOR_PLAN_SCHEMA;
  enabled: boolean;
  supported: boolean;
  optional: boolean;
  status: string;
  runtimeExpectedStatus: string;
  mode: 'opportunistic' | 'alwaysOn' | string;
  lifecycle: 'runtime' | 'app' | string;
  maxQueueDepth: number;
  stalePolicy: 'discard' | string;
  evidenceMode: 'non-blocking' | string;
  eligibility: {
    recordCount: number;
    eligibleRecordCount: number;
    activeRecordCount: number;
    activeRecordIds: string[];
  };
  ownership: Record<string, unknown>;
  lanes: Record<string, string>;
  pwaAttachment: Record<string, unknown>;
  state: Record<string, unknown>;
  ssr: Record<string, unknown>;
  diagnostics: MaracaDiagnostic[];
  summary: Record<string, unknown>;
}

export interface MaracaWebAppManifestConfig {
  enabled?: boolean;
  fileName?: string;
  reportFileName?: string;
  iconDirectory?: string;
  name?: string;
  shortName?: string;
  short_name?: string;
  startUrl?: string;
  start_url?: string;
  scope?: string;
  display?: string;
  backgroundColor?: string;
  background_color?: string;
  themeColor?: string;
  theme_color?: string;
  description?: string;
  icons?: Array<Record<string, unknown>>;
  manifest?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface MaracaWebAppManifestPlan {
  schema: typeof MARACA_WEB_APP_MANIFEST_PLAN_SCHEMA;
  enabled: boolean;
  supported: boolean;
  optional: boolean;
  status: string;
  runtimeExpectedStatus: string;
  manifestRef: string;
  iconDirectory: string;
  brandingMode: string;
  manifest: Record<string, unknown>;
  assets: Array<Record<string, unknown>>;
  manifestIcons: Array<Record<string, unknown>>;
  htmlLinkHints: Array<Record<string, unknown>>;
  replacementPaths: string[];
  files: Record<string, string | null>;
  outputs: Record<string, string | null>;
  diagnostics: MaracaDiagnostic[];
  summary: Record<string, unknown>;
}

export interface MaracaWebAppManifestReport {
  schema: typeof MARACA_WEB_APP_MANIFEST_REPORT_SCHEMA;
  ok: boolean;
  status: string;
  enabled: boolean;
  generated: boolean;
  manifestRef: string;
  iconDirectory: string;
  brandingMode: string;
  manifest: Record<string, unknown>;
  manifestIcons: Array<Record<string, unknown>>;
  htmlLinkHints: Array<Record<string, unknown>>;
  assets: Array<Record<string, unknown>>;
  copiedAssets: Array<Record<string, unknown>>;
  replacementPaths: string[];
  files: Record<string, string | null>;
  diagnostics: MaracaDiagnostic[];
  summary: Record<string, unknown>;
}

export interface MaracaPwaConfig {
  enabled?: boolean;
  strategy?: 'app-shell' | string;
  cacheMode?: 'generated-app-shell' | string;
  updateMode?: 'prompt' | 'auto' | 'manual' | string;
  businessLogicImport?: string;
  serviceWorkerFileName?: string;
  manifestFileName?: string;
  offlineFallback?: boolean;
  offlineFallbackFileName?: string;
  scope?: string;
  startUrl?: string;
  name?: string;
  shortName?: string;
  manifest?: Record<string, unknown> | MaracaWebAppManifestConfig;
  serviceWorker?: {
    enabled?: boolean;
    fileName?: string;
    registrationUrl?: string;
    scope?: string;
    type?: 'classic' | 'module' | string;
    businessLogicImport?: string;
    offlineFallback?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface MaracaPwaServiceWorkerPlan {
  schema: typeof MARACA_PWA_SERVICE_WORKER_PLAN_SCHEMA;
  enabled: boolean;
  supported: boolean;
  optional: boolean;
  status: string;
  runtimeExpectedStatus: string;
  strategy: string;
  cacheMode: string;
  updateMode: string;
  businessLogicHook: 'import-script' | string;
  businessLogicImport: string;
  cacheVersion: string;
  manifestRef: string;
  serviceWorkerRef: string;
  offlineEligible: boolean;
  manifest: Record<string, unknown>;
  webAppManifest?: MaracaWebAppManifestPlan;
  serviceWorker: Record<string, unknown>;
  files: Record<string, string | null>;
  outputs: Record<string, string | null>;
  precache: Record<string, unknown>;
  runtimeCaching: Record<string, unknown>;
  boundaries: Record<string, unknown>;
  diagnostics: MaracaDiagnostic[];
  summary: Record<string, unknown>;
}

export interface MaracaPwaServiceWorkerReport {
  schema: typeof MARACA_PWA_SERVICE_WORKER_REPORT_SCHEMA;
  ok: boolean;
  status: string;
  enabled: boolean;
  generated: boolean;
  strategy: string;
  cacheMode: string;
  updateMode: string;
  cacheVersion: string;
  manifestRef: string;
  serviceWorkerRef: string;
  serviceWorkerControlled: boolean;
  offlineEligible: boolean;
  businessLogicHook: string;
  businessLogicImport: string;
  files: Record<string, string | null>;
  webAppManifest?: MaracaWebAppManifestPlan | MaracaWebAppManifestReport | null;
  precacheUrls: string[];
  precacheCount: number;
  bundleFileCount: number;
  runtimeCaching: Record<string, unknown>;
  boundaries: Record<string, unknown>;
  diagnostics: MaracaDiagnostic[];
  summary: Record<string, unknown>;
}

export interface MaracaPanicRecoveryReport {
  schema: 'xtend.maraca.kernel-panic-recovery-report.v1';
  supported: boolean;
  enabled: boolean;
  status: string;
  lane: 'diagnostics' | string;
  runtimeExpectedStatus: string;
  devApis: string[];
  strictDiagnostics: {
    trustVerdict: boolean;
    panicEvent: boolean;
    recoveryOutcome: boolean;
    quarantineScope: boolean;
    safeSnapshot: boolean;
    [key: string]: unknown;
  };
  counters: {
    trustVerdictCount: number;
    blockedTrustVerdictCount: number;
    panicEventCount: number;
    recoveryOutcomeCount: number;
    safeSnapshotCount: number;
    quarantineScopeCount: number;
    [key: string]: unknown;
  };
  diagnostics: MaracaDiagnostic[];
}

export interface MaracaTrustedDomReport {
  schema: 'xtend.maraca.kernel-trusted-dom-report.v1';
  supported: boolean;
  status: string;
  trustBoundary: string;
  sanitizerSchema: string;
  sinkAdapterSchema: string;
  verdictSchema: string;
  panicCandidateSupported: boolean;
  strictDiagnostics: {
    trustVerdict: boolean;
    unsafeHtmlBlocked: boolean;
    panicCandidate: boolean;
    [key: string]: unknown;
  };
  diagnostics: MaracaDiagnostic[];
}

export interface MaracaKernelSecurityReport {
  schema: 'xtend.maraca.kernel-security-report.v1';
  supported: boolean;
  status: string;
  panicRecovery: MaracaPanicRecoveryReport | null;
  trustedDom: MaracaTrustedDomReport | null;
  policyParity: MaracaPolicyParityReport | null;
  diagnostics: MaracaDiagnostic[];
}

export interface MaracaPolicyParityReport {
  schema: 'xtend.rmt.kernel-policy-parity-report.v1';
  paritySchema: 'xtend.rmt.kernel-policy-parity.v1' | string;
  driftSchema?: 'xtend.rmt.kernel-policy-parity-drift.v1' | string;
  status: string;
  ok: boolean;
  compileTimeBlockCount: number;
  appliedPolicyCount: number;
  driftCount: number;
  sourcePolicySchemas: string[];
  runtimeScopes: string[];
  runtimeCapabilities: {
    hooks: string[];
    missingDefaultHooks?: string[];
    [key: string]: unknown;
  };
  compileTimeBlocks: Array<Record<string, unknown>>;
  appliedPolicies: Array<Record<string, unknown>>;
  drift: Array<Record<string, unknown>>;
  requiredFactories: string[];
  missingFactories: string[];
  unsafeTrustSinkCount: number;
  bundleCapabilities: {
    runtimeModules: string[];
    runtimeTrustSinks: Record<string, unknown>;
    surfaceLifecycle: Record<string, unknown>;
    panicRecovery: MaracaPanicRecoveryReport | null;
    trustedDom: MaracaTrustedDomReport | null;
    [key: string]: unknown;
  };
  releaseConstraint: {
    schema: 'xtend.maraca.policy-parity-release-constraint.v1';
    strict: boolean;
    enforced: boolean;
    blocked: boolean;
    reason: string;
    [key: string]: unknown;
  };
  diagnostics: MaracaDiagnostic[];
}

export interface MaracaWorkerPrerenderReport {
  schema: 'xtend.rmt.app-hydration-capability.v1' | string;
  id: 'workerPrerender' | string;
  mode: 'worker_prerender_hydrate' | string;
  supported: boolean;
  degraded: boolean;
  status: 'available' | 'supported' | 'degraded' | string;
  requested: boolean;
  recordCount: number;
  runtimeHooks?: string[];
  fabric?: Record<string, unknown>;
  validation?: Record<string, unknown>;
}

export interface MaracaServerPrerenderReport {
  schema: 'xtend.maraca.server-prerender-interop.v1' | string;
  id: 'serverPrerender' | string;
  mode: 'server_prerender_hydrate' | string;
  supported: boolean;
  degraded: boolean;
  status: 'available' | 'supported' | 'degraded' | string;
  requested: boolean;
  recordCount: number;
  hydrateResponseCompatible: boolean;
  adapterKinds: Array<{
    kind: 'kernel-server-runtime' | 'node-ssr' | 'php-ssr' | string;
    adapterSchema: string;
    supportStatus: string;
    hydrateResponseCompatible: boolean;
    [key: string]: unknown;
  }>;
  evidence?: Record<string, unknown>;
  diagnostics?: MaracaDiagnostic[];
}

export interface MaracaTemplateArtifactsReport {
  schema: typeof MARACA_TEMPLATE_ARTIFACTS_REPORT_SCHEMA;
  ok: boolean;
  status: string;
  supported: boolean;
  trusted: boolean;
  factory: {
    name: string;
    supported: boolean;
    source: string;
  };
  documentIds: string[];
  templateIds: string[];
  documentCount?: number;
  templateCount?: number;
  sourceFingerprint: string;
  artifactBundleFingerprint: string;
  bundleFingerprint?: string | null;
  runtimeProfileHints: string[];
  documents?: Array<Record<string, unknown>>;
  artifactBundle?: Record<string, unknown> | null;
  registration: {
    eligible: boolean;
    enabled: boolean;
    status: string;
    reason?: string;
  };
  sourceToSea: {
    compilerDocumentId?: string | null;
    artifactDocumentIds: string[];
    documentIdsMatchCompiler: boolean;
    compilerTemplateIds?: string[];
    artifactTemplateIds?: string[];
    bundleFileCount?: number;
    bundleFingerprint?: string | null;
  };
  diagnostics: MaracaDiagnostic[];
}

export interface MaracaPerformanceReport {
  schema: typeof MARACA_PERFORMANCE_REPORT_SCHEMA;
  ok: boolean;
  status: string;
  supported: boolean;
  runtimeExpectedStatus: string;
  factory: {
    name: string;
    supported: boolean;
    source: string;
  };
  budgetClasses: string[];
  budgetProfiles?: Array<Record<string, unknown>>;
  budgetSnapshot: Record<string, unknown> | null;
  budgetMissDiagnostics: MaracaDiagnostic[];
  backpressureProfile: Record<string, unknown> | null;
  runReport: Record<string, unknown> | null;
  ciSummary: Record<string, unknown> | null;
  fileArtifact: Record<string, unknown> | null;
  baselineComparison: Record<string, unknown> | null;
  bundleFingerprint?: string | null;
  summary?: Record<string, unknown>;
  diagnostics: MaracaDiagnostic[];
}

export interface MaracaProductionBundleCapability {
  schema: 'xtend.maraca.production-bundle-capability.v1';
  key: string;
  label: string;
  supported: boolean;
  active: boolean;
  optional: boolean;
  requiredInProd: boolean;
  status: string;
  runtimeExpectedStatus: string;
  degraded: boolean;
  blocked: boolean;
  diagnostics: MaracaDiagnostic[];
  sourceToSea: Record<string, unknown>;
  evidence: Record<string, unknown>;
}

export interface MaracaProductionBundleClosureReport {
  schema: typeof MARACA_PRODUCTION_BUNDLE_CLOSURE_SCHEMA;
  ok: boolean;
  status: string;
  profile: MaracaProfile;
  enforced: boolean;
  runtimeExpectedStatus: string;
  capabilityCount: number;
  activeCount: number;
  degradedCount: number;
  blockedCount: number;
  strictFallbackCount: number;
  capabilities: MaracaProductionBundleCapability[];
  capabilityKeys: string[];
  bundleBudget: Record<string, unknown>;
  releaseConstraint: {
    schema: 'xtend.maraca.production-bundle-release-constraint.v1';
    enforced: boolean;
    blocked: boolean;
    reason: string;
    sizeBudgetPass: boolean;
    strictFallbackCount: number;
    blockedCapabilityKeys: string[];
    [key: string]: unknown;
  };
  sourceToSea: {
    source: string;
    sourceFingerprint: string;
    artifactFingerprints: Record<string, unknown>;
    bundle: Record<string, unknown>;
    runtimeFeatureStatus: Array<Record<string, unknown>>;
    tests: string[];
    links: Array<Record<string, unknown>>;
    [key: string]: unknown;
  };
  diagnostics: MaracaDiagnostic[];
}

export interface MaracaComponentRecord {
  tag: string;
  module: string;
  absolutePath: string;
  importPath?: string;
  known: boolean;
}

export interface MaracaBuildPlan {
  schema: typeof MARACA_BUILD_PLAN_SCHEMA;
  ok: boolean;
  status: string;
  source: string;
  sourcePath: string;
  rootDir?: string;
  profile: MaracaProfile;
  lazy: MaracaLazyMode;
  css: MaracaCssMode;
  cssBuild?: {
    schema: 'xtend.maraca.css-build-plan.v1';
    status: string;
    requestedProvider: string;
    resolvedProvider: string;
    fallback: MaracaCssProviderFallback;
    preflight: MaracaCssPreflightMode;
    budgetBytes: number | null;
    contract: CssProviderContract | null;
    request: CssBuildRequest;
    requestFingerprint: string;
    configFingerprint: string;
    evidence: CssBuildEvidence | null;
    diagnostics: MaracaDiagnostic[];
    [key: string]: unknown;
  };
  vendor?: boolean;
  componentMode?: 'document' | 'all';
  stackMode?: 'plan' | 'runtime' | 'full' | 'none';
  orchestrationMode?: MaracaOrchestrationMode;
  kernelMode?: MaracaKernelMode;
  kernelBootMode?: MaracaKernelBootMode;
  hydrationMode?: MaracaHydrationMode;
  enableUiCoprocessor?: boolean;
  validationMode?: MaracaValidationMode;
  transitionsMode?: MaracaTransitionMode;
  outputDir: string;
  diagnostics: MaracaDiagnostic[];
  components: {
    requiredTags: string[];
    selected: MaracaComponentRecord[];
    unknown: string[];
  };
  runtimeModules: string[];
  stackModules?: Array<{
    id: string;
    source: string;
    absolutePath: string;
  }>;
  orchestration?: {
    schema: typeof MARACA_ORCHESTRATION_PLAN_SCHEMA;
    mode: MaracaOrchestrationMode;
    strict: boolean;
    enabled: boolean;
    status: string;
    supported: boolean;
    artifact?: unknown;
    runtimeModules: string[];
    workerPrerender?: MaracaWorkerPrerenderReport | null;
    uiCoprocessor?: MaracaWorkerPrerenderReport | null;
    serverPrerender?: MaracaServerPrerenderReport | null;
    diagnostics: MaracaDiagnostic[];
    summary: Record<string, unknown>;
  };
  templateArtifacts?: MaracaTemplateArtifactsReport;
  performance?: MaracaPerformanceReport;
  kernel?: {
    schema: typeof MARACA_KERNEL_PLAN_SCHEMA;
    mode: MaracaKernelMode;
    bootMode?: MaracaKernelBootMode;
    strict: boolean;
    enabled: boolean;
    status: string;
    supported: boolean;
    artifact?: unknown;
    runtimeModules: string[];
    featureAdoption?: MaracaKernelFeatureAdoptionReport;
    productSurface?: MaracaKernelProductSurfaceReport;
    prewarmWorker?: MaracaPrewarmWorkerRuntimeReport;
    panicRecovery?: MaracaPanicRecoveryReport;
    trustedDom?: MaracaTrustedDomReport;
    policyParity?: MaracaPolicyParityReport;
    security?: MaracaKernelSecurityReport;
    diagnostics: MaracaDiagnostic[];
    summary: Record<string, unknown>;
  };
  hydration?: {
    schema: typeof MARACA_HYDRATION_PLAN_SCHEMA;
    mode: MaracaHydrationMode;
    strict: boolean;
    enabled: boolean;
    status: string;
    supported: boolean;
    artifact?: unknown;
    runtimeModules: string[];
    workerPrerender?: MaracaWorkerPrerenderReport | null;
    uiCoprocessor?: MaracaWorkerPrerenderReport | null;
    serverPrerender?: MaracaServerPrerenderReport | null;
    diagnostics: MaracaDiagnostic[];
    summary: Record<string, unknown>;
  };
  warmReentry?: {
    schema: typeof MARACA_WARM_REENTRY_REPORT_SCHEMA;
    ok: boolean;
    enabled: boolean;
    status: string;
    supported: boolean;
    optional: boolean;
    runtimeExpectedStatus: string;
    supportedFiberKinds: string[];
    observedFiberKinds: string[];
    backpressurePolicy: Record<string, unknown>;
    destroyInvalidation: Record<string, unknown>;
    diagnostics: MaracaDiagnostic[];
    summary: Record<string, unknown>;
  };
  uiCoprocessor?: MaracaUiCoprocessorPlan;
  webAppManifest?: MaracaWebAppManifestPlan;
  pwa?: MaracaPwaServiceWorkerPlan;
  validation?: {
    schema: typeof MARACA_VALIDATION_PLAN_SCHEMA;
    mode: MaracaValidationMode;
    strict: boolean;
    enabled: boolean;
    status: string;
    supported: boolean;
    artifact?: unknown;
    runtimeModules: string[];
    diagnostics: MaracaDiagnostic[];
    summary: Record<string, unknown>;
  };
  transitions?: {
    schema: typeof MARACA_TRANSITION_PLAN_SCHEMA;
    mode: MaracaTransitionMode;
    strict: boolean;
    enabled: boolean;
    status: string;
    supported: boolean;
    artifact?: unknown;
    runtimeModules: string[];
    diagnostics: MaracaDiagnostic[];
    summary: Record<string, unknown>;
  };
  publicNameReservations: string[];
}

export interface MaracaBundleReport {
  schema: typeof MARACA_BUNDLE_REPORT_SCHEMA;
  ok: boolean;
  status: string;
  source: string;
  outputDir: string;
  profile: MaracaProfile;
  lazy: MaracaLazyMode;
  css: MaracaCssMode;
  cssBuild?: MaracaBuildPlan['cssBuild'];
  vendor?: boolean;
  componentMode?: string;
  stackMode?: string;
  kernelFeatureAdoption?: MaracaKernelFeatureAdoptionReport;
  kernelFeatureAdoptionClosure?: MaracaProductionBundleClosureReport;
  productionClosure?: MaracaProductionBundleClosureReport;
  templateArtifacts?: MaracaTemplateArtifactsReport;
  performance?: MaracaPerformanceReport;
  panicRecovery?: MaracaPanicRecoveryReport;
  trustedDom?: MaracaTrustedDomReport;
  policyParity?: MaracaPolicyParityReport;
  orchestration?: {
    schema: typeof MARACA_ORCHESTRATION_PLAN_SCHEMA;
    mode: MaracaOrchestrationMode;
    enabled: boolean;
    status: string;
    supported: boolean;
    artifactSchema?: string | null;
    runtimeModules: string[];
    workerPrerender?: MaracaWorkerPrerenderReport | null;
    uiCoprocessor?: MaracaWorkerPrerenderReport | null;
    serverPrerender?: MaracaServerPrerenderReport | null;
    summary: Record<string, unknown>;
    diagnostics: MaracaDiagnostic[];
  };
  kernel?: {
    schema: typeof MARACA_KERNEL_PLAN_SCHEMA;
    mode: MaracaKernelMode;
    bootMode?: MaracaKernelBootMode;
    enabled: boolean;
    status: string;
    supported: boolean;
    artifactSchema?: string | null;
    recordsSchema?: string | null;
    runtimeModules: string[];
    featureAdoption?: MaracaKernelFeatureAdoptionReport;
    productSurface?: MaracaKernelProductSurfaceReport;
    prewarmWorker?: MaracaPrewarmWorkerRuntimeReport;
    panicRecovery?: MaracaPanicRecoveryReport;
    trustedDom?: MaracaTrustedDomReport;
    policyParity?: MaracaPolicyParityReport;
    security?: MaracaKernelSecurityReport;
    summary: Record<string, unknown>;
    diagnostics: MaracaDiagnostic[];
  };
  hydration?: {
    schema: typeof MARACA_HYDRATION_PLAN_SCHEMA;
    mode: MaracaHydrationMode;
    enabled: boolean;
    status: string;
    supported: boolean;
    artifactSchema?: string | null;
    runtimeModules: string[];
    workerPrerender?: MaracaWorkerPrerenderReport | null;
    uiCoprocessor?: MaracaWorkerPrerenderReport | null;
    serverPrerender?: MaracaServerPrerenderReport | null;
    summary: Record<string, unknown>;
    diagnostics: MaracaDiagnostic[];
  };
  warmReentry?: {
    schema: typeof MARACA_WARM_REENTRY_REPORT_SCHEMA;
    ok: boolean;
    enabled: boolean;
    status: string;
    runtimeExpectedStatus: string;
    optional: boolean;
    supportedFiberKinds: string[];
    observedFiberKinds: string[];
    backpressurePolicy: Record<string, unknown>;
    destroyInvalidation: Record<string, unknown>;
    summary: Record<string, unknown>;
    diagnostics: MaracaDiagnostic[];
  };
  uiCoprocessor?: MaracaUiCoprocessorPlan;
  webAppManifest?: MaracaWebAppManifestReport;
  pwa?: MaracaPwaServiceWorkerReport;
  validation?: {
    schema: typeof MARACA_VALIDATION_PLAN_SCHEMA;
    mode: MaracaValidationMode;
    enabled: boolean;
    status: string;
    supported: boolean;
    artifactSchema?: string | null;
    runtimeModules: string[];
    summary: Record<string, unknown>;
    diagnostics: MaracaDiagnostic[];
  };
  transitions?: {
    schema: typeof MARACA_TRANSITION_PLAN_SCHEMA;
    mode: MaracaTransitionMode;
    enabled: boolean;
    status: string;
    supported: boolean;
    artifactSchema?: string | null;
    runtimeModules: string[];
    summary: Record<string, unknown>;
    diagnostics: MaracaDiagnostic[];
  };
  entry: string;
  entryBytes?: number;
  bytes: number;
  bundleFiles?: Array<{
    type: string;
    fileName: string;
    path: string;
    bytes: number;
    isEntry?: boolean;
    isDynamicEntry?: boolean;
    imports?: string[];
    dynamicImports?: string[];
  }>;
}

export interface MaracaSizeBudgetReport {
  schema: typeof MARACA_SIZE_BUDGET_REPORT_SCHEMA;
  ok: boolean;
  status: string;
  baselineBytes: number;
  bundleBytes: number;
  css?: {
    provider: string;
    bytes: number;
    budgetBytes: number | null;
    withinBudget: boolean;
    requestFingerprint: string | null;
    configFingerprint: string | null;
    evidenceFingerprint: string | null;
    outputFingerprint: string | null;
    sourceFingerprints: Array<{ path: string; fingerprint: string | null }>;
  };
}

export interface MaracaBuildConfig {
  schema: typeof MARACA_BUILD_CONFIG_SCHEMA;
  source: string;
  sourceFingerprint: string;
  output: string;
  selected: {
    profile: 'production' | 'max';
    lazy: MaracaLazyMode;
    css: MaracaCssMode;
  };
  locked: Record<string, unknown>;
  options: MaracaBuildInput;
  toolchain: {
    rollup: string | null;
    terser: string | null;
    mode: 'rollup-terser';
  };
  candidateMatrixFingerprint: string;
  configFingerprint: string;
}

export interface MaracaTuneCandidate {
  id: string;
  profile: 'production' | 'max';
  lazy: MaracaLazyMode;
  css: MaracaCssMode;
  accepted: boolean;
  status: string;
  reason: string;
  metrics: {
    eagerBytes: number;
    totalBytes: number;
    cssBytes: number;
    eagerRequests: number;
    chunkCount: number;
  };
  toolchain: string;
  warningCount: number;
  diagnosticCount: number;
  errorCount: number;
}

export interface MaracaTuneReport {
  schema: typeof MARACA_TUNE_REPORT_SCHEMA;
  ok: boolean;
  status: 'planned' | 'written' | 'checked' | 'blocked';
  source?: string;
  sourceFingerprint?: string;
  configPath: string;
  reportPath?: string;
  output?: string;
  candidateMatrixFingerprint?: string;
  candidateCount?: number;
  acceptedCandidateCount?: number;
  candidates: MaracaTuneCandidate[];
  selected?: {
    id: string;
    profile: 'production' | 'max';
    lazy: MaracaLazyMode;
    css: MaracaCssMode;
    metrics: MaracaTuneCandidate['metrics'];
  } | null;
  config?: MaracaBuildConfig | null;
  configMatches?: boolean;
  finalBuild?: {
    status: string;
    bytes: number;
    entry: string;
    toolchain: string;
  } | null;
  diagnostics: MaracaDiagnostic[];
}

export function createMaracaBuildPlan(input?: string | MaracaBuildInput, options?: MaracaRunOptions): MaracaBuildPlan;
export function buildMaracaBundle(input?: string | MaracaBuildInput, options?: MaracaRunOptions): {
  schema: typeof MARACA_BUNDLE_REPORT_SCHEMA;
  ok: boolean;
  status: string;
  plan: MaracaBuildPlan;
  bundleReport: MaracaBundleReport | null;
  sizeBudgetReport: MaracaSizeBudgetReport | null;
};
export function buildMaracaBundleAsync(input?: string | MaracaBuildInput, options?: MaracaRunOptions): Promise<{
  schema: typeof MARACA_BUNDLE_REPORT_SCHEMA;
  ok: boolean;
  status: string;
  plan: MaracaBuildPlan;
  bundleReport: MaracaBundleReport | null;
  sizeBudgetReport: MaracaSizeBudgetReport | null;
}>;
export function createMaracaTuneConfig(input?: Record<string, unknown>): MaracaBuildConfig;
export function tuneMaracaBuild(
  input?: string | MaracaBuildInput,
  options?: MaracaRunOptions
): Promise<MaracaTuneReport>;
export function createMaracaKernelFeatureAdoptionReport(input?: {
  rootDir?: string;
  enabled?: boolean;
  runtimeModules?: string[];
  planFeatureAdoption?: MaracaKernelFeatureAdoptionReport | null;
  kernelApi?: Record<string, unknown> | null;
  activeCapabilities?: Record<string, boolean>;
}): MaracaKernelFeatureAdoptionReport;
export function createMaracaPanicRecoveryReport(input?: {
  rootDir?: string;
  enabled?: boolean;
  runtimeModules?: string[];
}): MaracaPanicRecoveryReport;
export function createMaracaTrustedDomReport(input?: {
  panicRecovery?: MaracaPanicRecoveryReport | null;
  rootDir?: string;
  enabled?: boolean;
  runtimeModules?: string[];
}): MaracaTrustedDomReport;
export function createMaracaPolicyParityReport(input?: {
  rootDir?: string;
  strict?: boolean;
  enabled?: boolean;
  runtimeModules?: string[];
  panicRecovery?: MaracaPanicRecoveryReport | null;
  trustedDom?: MaracaTrustedDomReport | null;
  compileResult?: Record<string, unknown> | null;
  coreDocument?: Record<string, unknown> | null;
  policyParityReports?: Array<Record<string, unknown>>;
  policyParityContracts?: Array<Record<string, unknown>>;
  policyParityRuntimeHooks?: string[] | null;
  policyParityRequiredFactories?: string[] | null;
}): MaracaPolicyParityReport;
export function createMaracaTemplateArtifactsReport(input?: {
  rootDir?: string;
  sourcePath?: string;
  sourceText?: string;
  profile?: MaracaProfile;
  compileResult?: Record<string, unknown> | null;
  coreDocument?: Record<string, unknown> | null;
  status?: string;
  manifest?: Record<string, unknown> | null;
}): MaracaTemplateArtifactsReport;
export function createMaracaPerformanceReport(input?: {
  rootDir?: string;
  sourcePath?: string;
  sourceText?: string;
  profile?: MaracaProfile;
  compileResult?: Record<string, unknown> | null;
  coreDocument?: Record<string, unknown> | null;
  status?: string;
  runtimeExpectedStatus?: string;
  manifest?: Record<string, unknown> | null;
}): MaracaPerformanceReport;
export function createMaracaWebAppManifestPlan(input?: Record<string, unknown>): MaracaWebAppManifestPlan;
export function createMaracaWebAppManifestReport(
  plan: MaracaBuildPlan,
  copiedAssets?: Array<Record<string, unknown>>
): MaracaWebAppManifestReport;
export function createMaracaPwaServiceWorkerPlan(input?: Record<string, unknown>): MaracaPwaServiceWorkerPlan;
export function createMaracaPwaReport(
  plan: MaracaBuildPlan,
  bundleFiles?: Array<Record<string, unknown>>,
  precacheUrls?: string[]
): MaracaPwaServiceWorkerReport;
export function createMaracaProductionBundleClosure(
  plan: MaracaBuildPlan,
  sizeBudgetReport?: MaracaSizeBudgetReport | null,
  options?: Record<string, unknown>
): MaracaProductionBundleClosureReport;
export function createMaracaSizeBudgetReport(input: {
  plan: MaracaBuildPlan;
  entryPath: string;
  entryBytes: number;
}): MaracaSizeBudgetReport;
export function getMaracaToolchainAvailability(rootDir?: string): {
  rollup: { requested: boolean; available: boolean; mode: string; version?: string };
  terser: { requested: boolean; available: boolean; mode: string; version?: string };
};
