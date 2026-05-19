export const RMT_APP_PLATFORM_TOOLING_SCHEMA: 'xtend.epic18.rmt-app-platform-tooling.v1';
export const RMT_APP_PLATFORM_TOOLING_REPORT_SCHEMA: 'xtend.epic18.rmt-app-platform-tooling-report.v1';
export const RMT_APP_PLATFORM_SCAFFOLD_SCHEMA: 'xtend.epic18.rmt-app-platform-scaffold.v1';
export const RMT_APP_PLATFORM_SOURCE_MAP_SCHEMA: 'xtend.epic18.rmt-app-platform-source-map.v1';
export const RMT_APP_PLATFORM_TOOLING_WORKPACKAGE: 'WP-E18-11';
export const RMT_APP_PLATFORM_TOOLING_LOCAL_GATE: 'node scripts/run_xtend_tests.js rmt-app-platform-tooling --json';
export const RMT_APP_PLATFORM_TOOLING_MODULE_PATH: 'tools/rmt-language/app-platform-tooling.js';
export const RMT_APP_PLATFORM_TOOLING_SUITE_PATH: 'tests/rmt-language/rmt_app_platform_tooling_suite.js';
export const RMT_APP_PLATFORM_TOOLING_PACKAGE_SCRIPT: 'npm run test:rmt-app-platform-tooling';

export interface RmtAppPlatformDiagnosticCodes {
  manualHtmlSink: 'rmt.app.no-manual-shell.html-sink';
  unsafeHtmlBoundary: 'rmt.app.unsafe-html.boundary-missing';
  unkeyedRepeat: 'rmt.app.repeat.key.missing';
  untypedEvent: 'rmt.app.event.payload-contract.missing';
  missingResourceOwnership: 'rmt.app.resource.ownership.missing';
  unresolvedResource: 'rmt.app.resource.unresolved';
  unresolvedPortal: 'rmt.app.portal.unresolved';
  unresolvedSurfaceSource: 'rmt.app.surface.source.unresolved';
}

export const RMT_APP_PLATFORM_DIAGNOSTIC_CODES: RmtAppPlatformDiagnosticCodes;

export interface RmtAppPlatformDiagnostic {
  schema: 'xtend.rmt.linter.diagnostic.v1';
  source: 'rmt-app-platform-tooling' | string;
  code: string;
  ruleId: string | null;
  severity: 'error' | 'warning' | 'info' | 'hint';
  category: string;
  message: string;
  uri?: string | null;
  file?: string | null;
  pointer?: string | null;
  range?: unknown;
  workpackage: typeof RMT_APP_PLATFORM_TOOLING_WORKPACKAGE | string;
  repair?: unknown;
  relatedInformation?: unknown[];
}

export interface RmtAppPlatformSourceMapEntry {
  domain: string;
  id: string;
  pointer: string;
  range?: unknown;
  capabilities: string[];
}

export interface RmtAppPlatformSourceMap {
  schema: typeof RMT_APP_PLATFORM_SOURCE_MAP_SCHEMA;
  entries: RmtAppPlatformSourceMapEntry[];
  totalCount: number;
  byDomain?: Record<string, number>;
}

export interface RmtAppPlatformToolingReport {
  schema: typeof RMT_APP_PLATFORM_TOOLING_REPORT_SCHEMA;
  toolingSchema: typeof RMT_APP_PLATFORM_TOOLING_SCHEMA;
  workpackage: typeof RMT_APP_PLATFORM_TOOLING_WORKPACKAGE;
  status: 'passed' | 'failed';
  ok: boolean;
  manifest?: Record<string, unknown>;
  diagnostics: RmtAppPlatformDiagnostic[];
  summary: {
    totalCount: number;
    errorCount: number;
    warningCount: number;
    infoCount?: number;
  };
  sourceMap: RmtAppPlatformSourceMap;
  capabilities?: Record<string, number>;
}

export interface RmtAppPlatformScaffoldPlan {
  schema: typeof RMT_APP_PLATFORM_SCAFFOLD_SCHEMA;
  ok: boolean;
  status: 'planned' | 'blocked' | string;
  source: string;
  report: Record<string, unknown>;
  diagnostics: RmtAppPlatformDiagnostic[];
  sourceMap: RmtAppPlatformSourceMap;
  outputs: Array<{
    id: string;
    path: string;
    kind: string;
    generated: boolean;
    content: string;
  }>;
}

export interface RmtAppPlatformToolingInput {
  text?: string;
  filePath?: string;
  uri?: string;
  version?: number;
  document?: Record<string, unknown>;
  source?: string;
  src?: string;
}

export function analyzeRmtAppPlatformSource(input?: RmtAppPlatformToolingInput, options?: Record<string, unknown>): RmtAppPlatformToolingReport;
export function createRmtAppPlatformScaffoldPlan(input?: RmtAppPlatformToolingInput, options?: Record<string, unknown>): RmtAppPlatformScaffoldPlan;
export function getRmtAppPlatformCompletions(input?: RmtAppPlatformToolingInput, options?: Record<string, unknown>): unknown;
export function getRmtAppPlatformHover(input?: RmtAppPlatformToolingInput, options?: Record<string, unknown>): unknown;
export function lintAppPlatformDocument(document?: Record<string, unknown>, context?: Record<string, unknown>): RmtAppPlatformDiagnostic[];
