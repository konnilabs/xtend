export const XTENSIONS_OPENUI5_ADAPTER_SCHEMA: 'xtend.xtensions.openui5-adapter.v1';
export const XTENSIONS_OPENUI5_LOADER_BOUNDARY_SCHEMA: 'xtend.xtensions.openui5-loader-boundary.v1';
export const XTENSIONS_OPENUI5_REPORT_SCHEMA: 'xtend.xtensions.openui5-adapter-report.v1';
export const XTENSIONS_OPENUI5_DIAGNOSTIC_SCHEMA: 'xtend.xtensions.openui5-adapter-diagnostic.v1';
export const XTENSIONS_OPENUI5_ADAPTER_MODULE_PATH: 'tools/xtensions/openui5-host-adapter.js';
export const XTENSIONS_OPENUI5_ADAPTER_TYPES_PATH: 'tools/xtensions/openui5-host-adapter.d.ts';
export const XTENSIONS_OPENUI5_ADAPTER_SUITE_PATH: 'tests/xtensions/xtensions_openui5_host_adapter_suite.js';
export const XTENSIONS_OPENUI5_ADAPTER_FIXTURE_PATH: 'tests/fixtures/xtensions/openui5-host-adapter-valid.json';
export const XTENSIONS_OPENUI5_ADAPTER_CONTRACT_PATH: 'development/XTensions-OpenUI5-Host-Adapter-Contract.md';
export const XTENSIONS_OPENUI5_ADAPTER_WORKPACKAGE: 'XTN-16';
export const XTENSIONS_OPENUI5_ADAPTER_PACKAGE_SCRIPT: 'npm run test:xtensions-openui5-host-controller';
export const XTENSIONS_OPENUI5_LOADER_BOUNDARY_PACKAGE_SCRIPT: 'npm run test:xtensions-openui5-loader-boundary';
export const OPENUI5_REMOTE_LOADER_CODE: 'xtensions.openui5.remote_loader';
export const OPENUI5_DEPENDENCY_BOUNDARY_CODE: 'xtensions.openui5.dependency_boundary';
export const OPENUI5_CAPABILITIES: readonly string[];
export const OPENUI5_ALLOWED_DEPENDENCIES: readonly string[];

export interface OpenUi5Diagnostic {
  schema: typeof XTENSIONS_OPENUI5_DIAGNOSTIC_SCHEMA;
  source: typeof XTENSIONS_OPENUI5_ADAPTER_SCHEMA;
  workpackage: typeof XTENSIONS_OPENUI5_ADAPTER_WORKPACKAGE;
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  field: string | null;
  metadata: Record<string, unknown>;
}

export interface OpenUi5LoaderBoundary {
  schema: typeof XTENSIONS_OPENUI5_LOADER_BOUNDARY_SCHEMA;
  runtimeClass: 'openui5';
  domBoundary: 'host-owned-container';
  styleBoundary: 'global-theme-managed';
  trustBoundary: 'same-origin-adapter';
  mutationPolicy: 'adapter-owned-inside-host-container';
  resourceRoot: string;
  bootstrap: string;
  theme: string;
  libraries: string[];
  lazy: boolean;
  sameRealmHardSecurity: false;
  remoteLoaderAllowed: false;
  diagnostics: OpenUi5Diagnostic[];
  ok: boolean;
}

export interface OpenUi5AdapterReport {
  schema: typeof XTENSIONS_OPENUI5_REPORT_SCHEMA;
  adapterSchema: typeof XTENSIONS_OPENUI5_ADAPTER_SCHEMA;
  loaderBoundarySchema: typeof XTENSIONS_OPENUI5_LOADER_BOUNDARY_SCHEMA;
  workpackage: typeof XTENSIONS_OPENUI5_ADAPTER_WORKPACKAGE;
  generatedAt: string;
  loaderBoundary: OpenUi5LoaderBoundary;
  dependencyBoundary: {
    schema: typeof XTENSIONS_OPENUI5_LOADER_BOUNDARY_SCHEMA;
    ok: boolean;
    rootOpenUi5Dependencies: string[];
    diagnostics: OpenUi5Diagnostic[];
  };
  ok: boolean;
}

export function normalizeOpenUi5LoaderBoundary(input?: Record<string, unknown>): OpenUi5LoaderBoundary;
export function createOpenUi5AdapterContract(options?: Record<string, unknown>): Record<string, unknown>;
export function assertOpenUi5DependencyBoundary(input?: Record<string, unknown>): OpenUi5AdapterReport['dependencyBoundary'];
export function createFrameworklessOpenUi5HostAdapter(options?: Record<string, unknown>): Record<string, unknown>;
export function createOpenUi5AdapterReport(input?: Record<string, unknown>, options?: Record<string, unknown>): OpenUi5AdapterReport;
export function serializeOpenUi5AdapterReport(report?: Record<string, unknown>): string;
export function printOpenUi5HostAdapterReport(report?: Record<string, unknown>): void;
