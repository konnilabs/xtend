export const MARACA_PACKAGE_SCHEMA: 'xtend.maraca.package-metadata.v1';
export const MARACA_BUILD_PLAN_SCHEMA: 'xtend.maraca.build-plan.v1';
export const MARACA_BUNDLE_REPORT_SCHEMA: 'xtend.maraca.bundle-report.v1';
export const MARACA_SIZE_BUDGET_REPORT_SCHEMA: 'xtend.maraca.size-budget-report.v1';
export const MARACA_ORCHESTRATION_PLAN_SCHEMA: 'xtend.maraca.orchestration-plan.v1';
export const MARACA_KERNEL_PLAN_SCHEMA: 'xtend.maraca.kernel-plan.v1';
export const MARACA_HYDRATION_PLAN_SCHEMA: 'xtend.maraca.hydration-plan.v1';
export const MARACA_VALIDATION_PLAN_SCHEMA: 'xtend.maraca.validation-plan.v1';
export const MARACA_TRANSITION_PLAN_SCHEMA: 'xtend.maraca.transition-plan.v1';

export type MaracaProfile = 'debug' | 'production' | 'max';
export type MaracaLazyMode = 'route' | 'component' | 'none';
export type MaracaCssMode = 'inline' | 'external';
export type MaracaOrchestrationMode = 'auto' | 'strict' | 'off';
export type MaracaKernelMode = 'auto' | 'strict' | 'off';
export type MaracaHydrationMode = 'auto' | 'strict' | 'off';
export type MaracaValidationMode = 'auto' | 'strict' | 'off';
export type MaracaTransitionMode = 'auto' | 'strict' | 'off';

export interface MaracaBuildInput {
  source?: string;
  out?: string;
  outDir?: string;
  profile?: MaracaProfile;
  lazy?: MaracaLazyMode;
  css?: MaracaCssMode;
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
  vendor?: boolean;
  componentMode?: 'document' | 'all';
  stackMode?: 'plan' | 'runtime' | 'full' | 'none';
  orchestrationMode?: MaracaOrchestrationMode;
  kernelMode?: MaracaKernelMode;
  hydrationMode?: MaracaHydrationMode;
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
    diagnostics: MaracaDiagnostic[];
    summary: Record<string, unknown>;
  };
  kernel?: {
    schema: typeof MARACA_KERNEL_PLAN_SCHEMA;
    mode: MaracaKernelMode;
    strict: boolean;
    enabled: boolean;
    status: string;
    supported: boolean;
    artifact?: unknown;
    runtimeModules: string[];
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
    diagnostics: MaracaDiagnostic[];
    summary: Record<string, unknown>;
  };
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
  vendor?: boolean;
  componentMode?: string;
  stackMode?: string;
  orchestration?: {
    schema: typeof MARACA_ORCHESTRATION_PLAN_SCHEMA;
    mode: MaracaOrchestrationMode;
    enabled: boolean;
    status: string;
    supported: boolean;
    artifactSchema?: string | null;
    runtimeModules: string[];
    summary: Record<string, unknown>;
    diagnostics: MaracaDiagnostic[];
  };
  kernel?: {
    schema: typeof MARACA_KERNEL_PLAN_SCHEMA;
    mode: MaracaKernelMode;
    enabled: boolean;
    status: string;
    supported: boolean;
    artifactSchema?: string | null;
    recordsSchema?: string | null;
    runtimeModules: string[];
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
    summary: Record<string, unknown>;
    diagnostics: MaracaDiagnostic[];
  };
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
export function createMaracaSizeBudgetReport(input: {
  plan: MaracaBuildPlan;
  entryPath: string;
  entryBytes: number;
}): MaracaSizeBudgetReport;
export function getMaracaToolchainAvailability(rootDir?: string): {
  rollup: { requested: boolean; available: boolean; mode: string; version?: string };
  terser: { requested: boolean; available: boolean; mode: string; version?: string };
};
