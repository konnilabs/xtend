export const XTENSIONS_ANGULAR_ADAPTER_SCHEMA: 'xtend.xtensions.angular-adapter.v1';
export const XTENSIONS_ANGULAR_ZONE_BOUNDARY_SCHEMA: 'xtend.xtensions.angular-zone-boundary.v1';
export const XTENSIONS_ANGULAR_REPORT_SCHEMA: 'xtend.xtensions.angular-adapter-report.v1';
export const XTENSIONS_ANGULAR_DIAGNOSTIC_SCHEMA: 'xtend.xtensions.angular-adapter-diagnostic.v1';
export const XTENSIONS_ANGULAR_ADAPTER_MODULE_PATH: 'tools/xtensions/angular-host-adapter.js';
export const XTENSIONS_ANGULAR_ADAPTER_TYPES_PATH: 'tools/xtensions/angular-host-adapter.d.ts';
export const XTENSIONS_ANGULAR_ADAPTER_SUITE_PATH: 'tests/xtensions/xtensions_angular_host_adapter_suite.js';
export const XTENSIONS_ANGULAR_ADAPTER_FIXTURE_PATH: 'tests/fixtures/xtensions/angular-host-adapter-valid.json';
export const XTENSIONS_ANGULAR_ADAPTER_CONTRACT_PATH: 'development/XTensions-Angular-Host-Adapter-Contract.md';
export const XTENSIONS_ANGULAR_ADAPTER_WORKPACKAGE: 'XTN-17';
export const XTENSIONS_ANGULAR_ADAPTER_PACKAGE_SCRIPT: 'npm run test:xtensions-angular-host-controller';
export const XTENSIONS_ANGULAR_ZONE_BOUNDARY_PACKAGE_SCRIPT: 'npm run test:xtensions-angular-zone-boundary';
export const ANGULAR_REMOTE_LOADER_CODE: 'xtensions.angular.remote_loader';
export const ANGULAR_DEPENDENCY_BOUNDARY_CODE: 'xtensions.angular.dependency_boundary';
export const ANGULAR_RUNTIME_COMPILER_CODE: 'xtensions.angular.runtime_compiler';
export const ANGULAR_CAPABILITIES: readonly string[];
export const ANGULAR_ALLOWED_RUNTIME_DEPENDENCIES: readonly string[];
export const ANGULAR_ALLOWED_BUILD_DEPENDENCIES: readonly string[];

export interface AngularDiagnostic {
  schema: typeof XTENSIONS_ANGULAR_DIAGNOSTIC_SCHEMA;
  source: typeof XTENSIONS_ANGULAR_ADAPTER_SCHEMA;
  workpackage: typeof XTENSIONS_ANGULAR_ADAPTER_WORKPACKAGE;
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  field: string | null;
  metadata: Record<string, unknown>;
}

export interface AngularZoneBoundary {
  schema: typeof XTENSIONS_ANGULAR_ZONE_BOUNDARY_SCHEMA;
  runtimeClass: 'angular';
  buildMode: 'aot';
  changeDetection: string;
  domBoundary: 'host-owned-container';
  styleBoundary: 'host-css-owned';
  trustBoundary: 'same-origin-adapter';
  mutationPolicy: 'adapter-owned-inside-host-container';
  lazy: boolean;
  runtimeCompilerAllowed: false;
  remoteArtifactsAllowed: false;
  sameRealmHardSecurity: false;
  diagnostics: AngularDiagnostic[];
  ok: boolean;
}

export interface AngularAdapterReport {
  schema: typeof XTENSIONS_ANGULAR_REPORT_SCHEMA;
  adapterSchema: typeof XTENSIONS_ANGULAR_ADAPTER_SCHEMA;
  zoneBoundarySchema: typeof XTENSIONS_ANGULAR_ZONE_BOUNDARY_SCHEMA;
  workpackage: typeof XTENSIONS_ANGULAR_ADAPTER_WORKPACKAGE;
  generatedAt: string;
  zoneBoundary: AngularZoneBoundary;
  dependencyBoundary: {
    schema: typeof XTENSIONS_ANGULAR_ZONE_BOUNDARY_SCHEMA;
    ok: boolean;
    rootAngularDependencies: string[];
    diagnostics: AngularDiagnostic[];
  };
  ok: boolean;
}

export function normalizeAngularZoneBoundary(input?: Record<string, unknown>): AngularZoneBoundary;
export function createAngularAdapterContract(options?: Record<string, unknown>): Record<string, unknown>;
export function assertAngularDependencyBoundary(input?: Record<string, unknown>): AngularAdapterReport['dependencyBoundary'];
export function createFrameworklessAngularHostAdapter(options?: Record<string, unknown>): Record<string, unknown>;
export function createAngularAdapterReport(input?: Record<string, unknown>, options?: Record<string, unknown>): AngularAdapterReport;
export function serializeAngularAdapterReport(report?: Record<string, unknown>): string;
export function printAngularHostAdapterReport(report?: Record<string, unknown>): void;
