export const XTENSIONS_STATIC_INTROSPECTION_SCHEMA: 'xtend.xtensions.static-introspection.v1';
export const XTENSIONS_STATIC_CONTRACT_SCHEMA: 'xtend.xtensions.static-contract.v1';
export const XTENSIONS_STATIC_CONTRACT_SOURCE_SCHEMA: 'xtend.xtensions.static-contract-source.v1';
export const XTENSIONS_STATIC_CONTRACT_INDEX_SCHEMA: 'xtend.xtensions.static-contract-index.v1';
export const XTENSIONS_STATIC_CONTRACT_DRIFT_SCHEMA: 'xtend.xtensions.static-contract-drift-report.v1';
export const XTENSIONS_STATIC_LSP_INDEX_SCHEMA: 'xtend.xtensions.static-contract-lsp-index.v1';
export const XTENSIONS_STATIC_DEVTOOLS_PANEL_SCHEMA: 'xtend.xtensions.static-contract-devtools-panel.v1';
export const XTENSIONS_STATIC_AI_AGENT_REPORT_SCHEMA: 'xtend.xtensions.static-contract-ai-agent-report.v1';
export const XTENSIONS_STATIC_DIAGNOSTIC_SCHEMA: 'xtend.xtensions.static-contract-diagnostic.v1';
export const XTENSIONS_STATIC_INTROSPECTION_REPORT_SCHEMA: 'xtend.xtensions.static-introspection-report.v1';
export const XTENSIONS_STATIC_INTROSPECTION_MODULE_PATH: 'tools/xtensions/static-contract-introspection.js';
export const XTENSIONS_STATIC_INTROSPECTION_TYPES_PATH: 'tools/xtensions/static-contract-introspection.d.ts';
export const XTENSIONS_STATIC_INTROSPECTION_SUITE_PATH: 'tests/xtensions/xtensions_static_introspection_suite.js';
export const XTENSIONS_STATIC_INTROSPECTION_CONTRACT_PATH: 'development/XTensions-Static-Contract-Introspection-Contract.md';
export const XTENSIONS_STATIC_INTROSPECTION_FIXTURE_PATH: 'tests/fixtures/xtensions/static-introspection-valid.json';
export const XTENSIONS_STATIC_INTROSPECTION_SOURCE_FIXTURE_PATH: 'tests/fixtures/xtensions/static-introspection-module.mjs';
export const XTENSIONS_STATIC_INTROSPECTION_DRIFT_FIXTURE_PATH: 'tests/fixtures/xtensions/static-introspection-drift-module.mjs';
export const XTENSIONS_STATIC_INTROSPECTION_NO_EXPORT_FIXTURE_PATH: 'tests/fixtures/xtensions/static-introspection-no-export.mjs';
export const XTENSIONS_STATIC_INTROSPECTION_WORKPACKAGE: 'XTN-04';
export const XTENSIONS_STATIC_INTROSPECTION_PACKAGE_SCRIPT: 'npm run test:xtensions-static-introspection';
export const XTENSION_CONTRACT_EXPORT_NAME: 'XTENSION_CONTRACT';

export interface XTensionsStaticDiagnostic {
  schema: typeof XTENSIONS_STATIC_DIAGNOSTIC_SCHEMA;
  source: typeof XTENSIONS_STATIC_INTROSPECTION_SCHEMA;
  workpackage: typeof XTENSIONS_STATIC_INTROSPECTION_WORKPACKAGE;
  severity: 'error' | 'warning' | 'info' | 'hint';
  code: string;
  message: string;
  xtensionId: string | null;
  framework: string | null;
  field: string | null;
  metadata: Record<string, unknown>;
}

export interface XTensionStaticContract {
  schema: typeof XTENSIONS_STATIC_CONTRACT_SCHEMA;
  id: string;
  name: string;
  framework: string;
  version: string;
  hostControllerSchema: string;
  signalBridgeSchema: string;
  kernelSignalSchema: string;
  surfaceEventSchema: string;
  accepts: string[];
  emits: string[];
  capabilities: string[];
  source: {
    schema: typeof XTENSIONS_STATIC_CONTRACT_SOURCE_SCHEMA;
    kind: string;
    path: string;
    exportName: typeof XTENSION_CONTRACT_EXPORT_NAME;
    runtimeExecutionRequired: false;
  };
  manifestFingerprint: string;
  artifactFingerprint: string;
  sourceFingerprint: string;
  diagnostics: XTensionsStaticDiagnostic[];
  ok: boolean;
  status: 'ready' | 'blocked';
  contractFingerprint: string;
}

export interface XTensionsStaticContractIndex {
  schema: typeof XTENSIONS_STATIC_CONTRACT_INDEX_SCHEMA;
  introspectionSchema: typeof XTENSIONS_STATIC_INTROSPECTION_SCHEMA;
  staticContractSchema: typeof XTENSIONS_STATIC_CONTRACT_SCHEMA;
  workpackage: typeof XTENSIONS_STATIC_INTROSPECTION_WORKPACKAGE;
  status: 'ready' | 'blocked';
  ok: boolean;
  runtimeExecutionRequired: false;
  contractCount: number;
  contracts: XTensionStaticContract[];
  diagnostics: XTensionsStaticDiagnostic[];
  indexes: {
    byFramework: Record<string, string[]>;
    accepts: Record<string, string[]>;
    emits: Record<string, string[]>;
    capabilities: Record<string, string[]>;
  };
  indexFingerprint: string;
}

export interface XTensionsStaticLspIndex {
  schema: typeof XTENSIONS_STATIC_LSP_INDEX_SCHEMA;
  indexSchema: typeof XTENSIONS_STATIC_CONTRACT_INDEX_SCHEMA;
  ok: boolean;
  runtimeExecutionRequired: false;
  completionCount: number;
  symbolCount: number;
  completions: Array<Record<string, unknown>>;
  symbols: Array<Record<string, unknown>>;
  diagnostics: XTensionsStaticDiagnostic[];
}

export interface XTensionsStaticDevToolsPanel {
  schema: typeof XTENSIONS_STATIC_DEVTOOLS_PANEL_SCHEMA;
  indexSchema: typeof XTENSIONS_STATIC_CONTRACT_INDEX_SCHEMA;
  ok: boolean;
  runtimeExecutionRequired: false;
  summary: Record<string, unknown>;
  rows: Array<Record<string, unknown>>;
  diagnostics: XTensionsStaticDiagnostic[];
}

export interface XTensionsStaticAiAgentReport {
  schema: typeof XTENSIONS_STATIC_AI_AGENT_REPORT_SCHEMA;
  indexSchema: typeof XTENSIONS_STATIC_CONTRACT_INDEX_SCHEMA;
  driftSchema: typeof XTENSIONS_STATIC_CONTRACT_DRIFT_SCHEMA;
  ok: boolean;
  status: 'ready' | 'repair-required';
  runtimeExecutionRequired: false;
  contractCount: number;
  diagnosticCount: number;
  repairActionCount: number;
  diagnostics: XTensionsStaticDiagnostic[];
  driftReports: Array<Record<string, unknown>>;
  repairActions: Array<Record<string, unknown>>;
  guidance: string[];
}

export interface XTensionsStaticIntrospectionReport {
  schema: typeof XTENSIONS_STATIC_INTROSPECTION_REPORT_SCHEMA;
  introspectionSchema: typeof XTENSIONS_STATIC_INTROSPECTION_SCHEMA;
  staticContractSchema: typeof XTENSIONS_STATIC_CONTRACT_SCHEMA;
  indexSchema: typeof XTENSIONS_STATIC_CONTRACT_INDEX_SCHEMA;
  lspIndexSchema: typeof XTENSIONS_STATIC_LSP_INDEX_SCHEMA;
  devtoolsPanelSchema: typeof XTENSIONS_STATIC_DEVTOOLS_PANEL_SCHEMA;
  aiAgentReportSchema: typeof XTENSIONS_STATIC_AI_AGENT_REPORT_SCHEMA;
  workpackage: typeof XTENSIONS_STATIC_INTROSPECTION_WORKPACKAGE;
  status: 'ready' | 'blocked';
  ok: boolean;
  runtimeExecutionRequired: false;
  index: XTensionsStaticContractIndex;
  lspIndex: XTensionsStaticLspIndex;
  devtoolsPanel: XTensionsStaticDevToolsPanel;
  aiAgentReport: XTensionsStaticAiAgentReport;
  dependencyBoundary: Record<string, unknown>;
  diagnostics: XTensionsStaticDiagnostic[];
  timestamp: string;
}

export function assertStaticIntrospectionDependencyBoundary(input?: Record<string, unknown>): {
  ok: boolean;
  diagnostics: XTensionsStaticDiagnostic[];
  forbiddenFrameworkDependencies: string[];
};

export function createContractDriftReport(left?: Record<string, unknown>, right?: Record<string, unknown>, options?: Record<string, unknown>): Record<string, unknown>;
export function createStaticDiagnostic(subject: Record<string, unknown> | null, code: string, message: string, severity?: string, metadata?: Record<string, unknown>): XTensionsStaticDiagnostic;
export function createXTensionsAiAgentReport(input?: Record<string, unknown>, options?: Record<string, unknown>): XTensionsStaticAiAgentReport;
export function createXTensionsDevToolsPanel(indexOrInput?: Record<string, unknown>, options?: Record<string, unknown>): XTensionsStaticDevToolsPanel;
export function createXTensionsLspIndex(indexOrInput?: Record<string, unknown>, options?: Record<string, unknown>): XTensionsStaticLspIndex;
export function createXTensionsStaticContractIndex(input?: Record<string, unknown>, options?: Record<string, unknown>): XTensionsStaticContractIndex;
export function createXTensionsStaticIntrospectionReport(input?: Record<string, unknown>, options?: Record<string, unknown>): XTensionsStaticIntrospectionReport;
export function extractXTensionContractFromSource(sourceText?: string, options?: Record<string, unknown>): Record<string, unknown>;
export function normalizeStaticXTensionContract(input?: Record<string, unknown>, options?: Record<string, unknown>): XTensionStaticContract;
export function serializeStaticIntrospectionReport(report: Record<string, unknown>): string;
