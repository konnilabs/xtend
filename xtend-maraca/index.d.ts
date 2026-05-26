export const MARACA_PACKAGE_SCHEMA: 'xtend.maraca.package-metadata.v1';
export const MARACA_BUILD_PLAN_SCHEMA: 'xtend.maraca.build-plan.v1';
export const MARACA_BUNDLE_REPORT_SCHEMA: 'xtend.maraca.bundle-report.v1';
export const MARACA_SIZE_BUDGET_REPORT_SCHEMA: 'xtend.maraca.size-budget-report.v1';

export type MaracaProfile = 'debug' | 'production' | 'max';
export type MaracaLazyMode = 'route' | 'component' | 'none';
export type MaracaCssMode = 'inline' | 'external';

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
