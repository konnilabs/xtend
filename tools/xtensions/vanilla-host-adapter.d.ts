export const XTENSIONS_VANILLA_ADAPTER_SCHEMA: 'xtend.xtensions.vanilla-adapter.v1';
export const XTENSIONS_DOM_BOUNDARY_SCHEMA: 'xtend.xtensions.dom-boundary.v1';
export const XTENSIONS_LEGACY_SANDBOX_SCHEMA: 'xtend.xtensions.legacy-sandbox-adapter.v1';
export const XTENSIONS_VANILLA_REPORT_SCHEMA: 'xtend.xtensions.vanilla-adapter-report.v1';
export const XTENSIONS_VANILLA_DIAGNOSTIC_SCHEMA: 'xtend.xtensions.vanilla-adapter-diagnostic.v1';
export const XTENSIONS_VANILLA_ADAPTER_MODULE_PATH: 'tools/xtensions/vanilla-host-adapter.js';
export const XTENSIONS_VANILLA_ADAPTER_TYPES_PATH: 'tools/xtensions/vanilla-host-adapter.d.ts';
export const XTENSIONS_VANILLA_ADAPTER_SUITE_PATH: 'tests/xtensions/xtensions_vanilla_host_adapter_suite.js';
export const XTENSIONS_VANILLA_ADAPTER_FIXTURE_PATH: 'tests/fixtures/xtensions/vanilla-host-adapter-valid.json';
export const XTENSIONS_VANILLA_ADAPTER_CONTRACT_PATH: 'development/XTensions-Vanilla-Host-Adapter-und-Legacy-Sandbox-Contract.md';
export const XTENSIONS_VANILLA_ADAPTER_WORKPACKAGE: 'XTN-15';
export const XTENSIONS_VANILLA_ADAPTER_PACKAGE_SCRIPT: 'npm run test:xtensions-vanilla-host-controller';
export const XTENSIONS_DOM_BOUNDARY_PACKAGE_SCRIPT: 'npm run test:xtensions-dom-boundary';
export const XTENSIONS_LEGACY_SANDBOX_PACKAGE_SCRIPT: 'npm run test:xtensions-legacy-sandbox-adapter';

export type VanillaDomBoundary = 'shadow-root' | 'host-owned-container' | 'iframe-sandbox';
export type VanillaStyleBoundary = 'shadow-root' | 'scoped-css' | 'iframe';
export type VanillaTrustBoundary = 'same-origin-adapter' | 'sandboxed-adapter';
export type VanillaMutationPolicy = 'observe-and-degrade' | 'blocked-by-iframe' | 'contract-only';
export type VanillaReportStatus = 'ready' | 'blocked' | 'degraded';

export interface VanillaDiagnostic {
  schema: typeof XTENSIONS_VANILLA_DIAGNOSTIC_SCHEMA;
  source: typeof XTENSIONS_VANILLA_ADAPTER_SCHEMA;
  workpackage: typeof XTENSIONS_VANILLA_ADAPTER_WORKPACKAGE;
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  field: string | null;
  metadata: Record<string, unknown>;
}

export interface VanillaIsolation {
  schema: typeof XTENSIONS_DOM_BOUNDARY_SCHEMA;
  runtimeClass: string;
  domBoundary: VanillaDomBoundary;
  styleBoundary: VanillaStyleBoundary;
  trustBoundary: VanillaTrustBoundary;
  mutationPolicy: VanillaMutationPolicy;
  sandbox: string[];
  hardSecurity: boolean;
  sameRealmHardSecurity: false;
  cooperative: boolean;
  legacy: boolean;
  diagnostics: VanillaDiagnostic[];
  ok: boolean;
}

export interface VanillaAdapterContract {
  schema: typeof XTENSIONS_VANILLA_ADAPTER_SCHEMA;
  domBoundarySchema: typeof XTENSIONS_DOM_BOUNDARY_SCHEMA;
  legacySandboxSchema: typeof XTENSIONS_LEGACY_SANDBOX_SCHEMA;
  hostControllerSchema: string;
  signalBridgeSchema: string;
  surfaceEventSchema: string;
  workpackage: typeof XTENSIONS_VANILLA_ADAPTER_WORKPACKAGE;
  status: 'accepted-by-XTN-15';
  framework: 'vanilla';
  hostNeutral: true;
  requiredMethods: string[];
  domBoundaries: VanillaDomBoundary[];
  styleBoundaries: VanillaStyleBoundary[];
  trustBoundaries: VanillaTrustBoundary[];
  mutationPolicies: VanillaMutationPolicy[];
  boundaries: string[];
  sameRealmHardSecurity: false;
  legacyRequiresIframe: true;
  allowedSandboxTokens: string[];
  blockedSandboxTokens: string[];
  postMessagePolicy: {
    allowlistRequired: boolean;
    serializableOnly: boolean;
    topNavigationAllowed: false;
  };
}

export interface DomBoundaryRecord {
  schema: typeof XTENSIONS_DOM_BOUNDARY_SCHEMA;
  xtensionId: string;
  surfaceId: string;
  runtimeClass: string;
  domBoundary: VanillaDomBoundary;
  styleBoundary: VanillaStyleBoundary;
  trustBoundary: VanillaTrustBoundary;
  mutationPolicy: VanillaMutationPolicy;
  sandbox: string[];
  hardSecurity: boolean;
  sameRealmHardSecurity: false;
  diagnostics: VanillaDiagnostic[];
  ok: boolean;
  timestamp: string;
}

export interface LegacySandboxRecord {
  schema: typeof XTENSIONS_LEGACY_SANDBOX_SCHEMA;
  boundarySchema: typeof XTENSIONS_DOM_BOUNDARY_SCHEMA;
  xtensionId: string;
  surfaceId: string;
  runtimeClass: 'legacy-global-dom';
  iframeAttributes: {
    sandbox: string;
    allow: string;
    referrerPolicy: string;
  };
  allowSameOrigin: false;
  topNavigation: false;
  popupNavigation: false;
  postMessageOnly: true;
  allowedEventTypes: string[];
  isolation: VanillaIsolation;
  diagnostics: VanillaDiagnostic[];
  ok: boolean;
  timestamp: string;
}

export interface LegacyHtmlInspection {
  schema: typeof XTENSIONS_LEGACY_SANDBOX_SCHEMA;
  inspectedBytes: number;
  remoteAssetCount: number;
  scriptUrlCount: number;
  embedCount: number;
  iframeCount: number;
  analyticsInjectionCount: number;
  topNavigationWriteCount: number;
  globalDomUsageCount: number;
  sameRealmEligible: boolean;
  iframeSandboxRequired: true;
  diagnostics: VanillaDiagnostic[];
  ok: boolean;
}

export interface VanillaAdapterReport {
  schema: typeof XTENSIONS_VANILLA_REPORT_SCHEMA;
  adapterSchema: typeof XTENSIONS_VANILLA_ADAPTER_SCHEMA;
  domBoundarySchema: typeof XTENSIONS_DOM_BOUNDARY_SCHEMA;
  legacySandboxSchema: typeof XTENSIONS_LEGACY_SANDBOX_SCHEMA;
  workpackage: typeof XTENSIONS_VANILLA_ADAPTER_WORKPACKAGE;
  status: VanillaReportStatus;
  ok: boolean;
  contract: VanillaAdapterContract;
  cooperativeBoundary: DomBoundaryRecord;
  legacySandbox: LegacySandboxRecord;
  legacyHtmlInspection: LegacyHtmlInspection | null;
  dependencyBoundary: {
    ok: boolean;
    diagnostics: VanillaDiagnostic[];
    forbiddenFrameworkDependencies: string[];
  };
  diagnostics: VanillaDiagnostic[];
  timestamp: string;
}

export const VANILLA_ALLOWED_SANDBOX_TOKENS: readonly string[];
export const VANILLA_BLOCKED_SANDBOX_TOKENS: readonly string[];
export const VANILLA_BOUNDARIES: readonly string[];
export const VANILLA_DOM_BOUNDARY_MODES: readonly VanillaDomBoundary[];
export const VANILLA_STYLE_BOUNDARY_MODES: readonly VanillaStyleBoundary[];
export const VANILLA_TRUST_BOUNDARIES: readonly VanillaTrustBoundary[];
export const VANILLA_MUTATION_POLICIES: readonly VanillaMutationPolicy[];

export const VANILLA_BOUNDARY_UNSUPPORTED_CODE: string;
export const VANILLA_LEGACY_REQUIRES_IFRAME_CODE: string;
export const VANILLA_SANDBOX_UNSAFE_CODE: string;
export const VANILLA_MUTATION_OUTSIDE_ROOT_CODE: string;
export const VANILLA_FRAMEWORK_DEPENDENCY_CODE: string;
export const VANILLA_REMOTE_ASSET_CODE: string;
export const VANILLA_SCRIPT_URL_CODE: string;
export const VANILLA_EMBED_BLOCKED_CODE: string;
export const VANILLA_GLOBAL_DOM_CODE: string;

export function assertVanillaDependencyBoundary(input?: Record<string, unknown>): {
  ok: boolean;
  diagnostics: VanillaDiagnostic[];
  forbiddenFrameworkDependencies: string[];
};
export function createDomBoundaryRecord(input?: Record<string, unknown>, options?: Record<string, unknown>): DomBoundaryRecord;
export function createFrameworklessVanillaHostAdapter(options?: Record<string, unknown>): Record<string, unknown>;
export function createLegacySandboxRecord(input?: Record<string, unknown>, options?: Record<string, unknown>): LegacySandboxRecord;
export function createVanillaAdapterContract(options?: Record<string, unknown>): VanillaAdapterContract;
export function createVanillaAdapterReport(input?: Record<string, unknown>, options?: Record<string, unknown>): VanillaAdapterReport;
export function createVanillaDiagnostic(code: string, message: string, severity?: string, metadata?: Record<string, unknown>): VanillaDiagnostic;
export function inspectLegacyAssetHtml(html?: string, options?: Record<string, unknown>): LegacyHtmlInspection;
export function normalizeVanillaIsolation(input?: Record<string, unknown>): VanillaIsolation;
export function serializeVanillaAdapterReport(report: Record<string, unknown>): string;
