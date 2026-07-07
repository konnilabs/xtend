export const XTENSIONS_REACT_ADAPTER_SCHEMA: 'xtend.xtensions.react-adapter.v1';
export const XTENSIONS_REACT_RUNTIME_BOUNDARY_SCHEMA: 'xtend.xtensions.react-runtime-boundary.v1';
export const XTENSIONS_REACT_ADAPTER_REPORT_SCHEMA: 'xtend.xtensions.react-adapter-report.v1';
export const XTENSIONS_REACT_ADAPTER_DIAGNOSTIC_SCHEMA: 'xtend.xtensions.react-adapter-diagnostic.v1';
export const XTENSIONS_REACT_ADAPTER_MODULE_PATH: 'tools/xtensions/react-host-adapter.js';
export const XTENSIONS_REACT_ADAPTER_TYPES_PATH: 'tools/xtensions/react-host-adapter.d.ts';
export const XTENSIONS_REACT_ADAPTER_SUITE_PATH: 'tests/xtensions/xtensions_react_host_adapter_suite.js';
export const XTENSIONS_REACT_ADAPTER_FIXTURE_PATH: 'tests/fixtures/xtensions/react-host-adapter-valid.json';
export const XTENSIONS_REACT_ADAPTER_CONTRACT_PATH: 'development/XTensions-React-Host-Adapter-Contract.md';
export const XTENSIONS_REACT_ADAPTER_WORKPACKAGE: 'XTN-18';
export const XTENSIONS_REACT_ADAPTER_PACKAGE_SCRIPT: 'npm run test:xtensions-react-host-adapter';
export const REACT_ADAPTER_RUNTIME_BOUNDARY_CODE: 'xtensions.react.runtime_boundary';
export const REACT_ADAPTER_HOST_RUNTIME_MISSING_CODE: 'xtensions.react.host_runtime_missing';
export const REACT_ADAPTER_CAPABILITIES: readonly string[];
export const REACT_HOST_PROVIDED_DEPENDENCIES: readonly Record<string, unknown>[];
export const REACT_RUNTIME_PROVIDER_MODULES: readonly string[];

export interface ReactAdapterDiagnostic {
  schema: typeof XTENSIONS_REACT_ADAPTER_DIAGNOSTIC_SCHEMA;
  source: typeof XTENSIONS_REACT_ADAPTER_SCHEMA;
  workpackage: typeof XTENSIONS_REACT_ADAPTER_WORKPACKAGE;
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  xtensionId: string | null;
  framework: 'react';
  field: string | null;
  metadata: Record<string, unknown>;
}

export interface ReactRuntimeBoundary {
  schema: typeof XTENSIONS_REACT_RUNTIME_BOUNDARY_SCHEMA;
  runtimeClass: 'react';
  dependencyClassification: 'host-provided';
  dependencies: Record<string, unknown>[];
  runtimeProvider: Record<string, unknown>;
  hostProvided: true;
  bundledInXtension: false;
  remoteArtifactsAllowed: false;
  domBoundary: 'host-owned-container';
  styleBoundary: 'host-css-owned';
  sameRealmHardSecurity: false;
  startTransitionIsSchedulingHint: true;
  contextStoreFiberBoundary: 'internal-only';
  capabilities: string[];
  diagnostics: ReactAdapterDiagnostic[];
  ok: boolean;
}

export interface ReactAdapterReport {
  schema: typeof XTENSIONS_REACT_ADAPTER_REPORT_SCHEMA;
  adapterSchema: typeof XTENSIONS_REACT_ADAPTER_SCHEMA;
  pocCompatibilitySchema: string;
  runtimeBoundarySchema: typeof XTENSIONS_REACT_RUNTIME_BOUNDARY_SCHEMA;
  runtimeRegistrySchema: string;
  workpackage: typeof XTENSIONS_REACT_ADAPTER_WORKPACKAGE;
  generatedAt: string;
  framework: 'react';
  runtimeExecutionRequired: false;
  runtimeBoundary: ReactRuntimeBoundary;
  dependencyBoundary: Record<string, unknown>;
  adapter: Record<string, unknown>;
  runtimeRegistry: Record<string, unknown>;
  runtimeReport: Record<string, unknown>;
  schedulingDecision: Record<string, unknown>;
  payloadBoundary: Record<string, unknown>;
  reportFingerprint: string;
  diagnostics: Record<string, unknown>[];
  ok: boolean;
}

export function normalizeReactRuntimeBoundary(input?: Record<string, unknown>): ReactRuntimeBoundary;
export function createReactAdapterContract(options?: Record<string, unknown>): Record<string, unknown>;
export function createReactAdapterDiagnostic(subject?: Record<string, unknown>, code?: string, message?: string, severity?: string, metadata?: Record<string, unknown>): ReactAdapterDiagnostic;
export function createReactRuntimeAdapterRecord(input?: Record<string, unknown>, options?: Record<string, unknown>): Record<string, unknown>;
export function createReactHostAdapter(options?: Record<string, unknown>): Record<string, unknown>;
export function inspectReactPayloadBoundary(payload?: Record<string, unknown>): Record<string, unknown>;
export function createReactAdapterReport(input?: Record<string, unknown>, options?: Record<string, unknown>): ReactAdapterReport;
export function serializeReactAdapterReport(report?: Record<string, unknown>): string;
export function printReactHostAdapterReport(report?: Record<string, unknown>): void;
