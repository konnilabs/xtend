export interface DashboardDiagnostic {
  schema: string;
  source: string;
  workpackage: string;
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  dashboardId?: string | null;
  surfaceId?: string | null;
  xtensionId?: string | null;
  framework?: string | null;
  field?: string | null;
  metadata?: Record<string, unknown>;
}

export interface DashboardSurface {
  schema: string;
  dashboardId: string;
  surfaceId: string;
  xtensionId: string;
  role: string;
  framework: string;
  hostId: string;
  nativeSurface: boolean;
  lazy: Record<string, unknown>;
  fallback: Record<string, unknown>;
  manifest: Record<string, unknown> | null;
  expectedRuntimeStatus: string;
  ownsContainer: boolean;
  diagnostics: DashboardDiagnostic[];
  timestamp: string;
}

export interface DashboardBrowserSmokeRecord {
  schema: string;
  workpackage: string;
  dashboardId: string | null;
  surfaceId: string | null;
  xtensionId: string | null;
  framework: string;
  kind: string;
  smokeMode: string;
  browserRuntimeRequired: false;
  frameworkRuntimeImported: false;
  localNetworkRequired: false;
  nonBlankPixels: number;
  interactionCount: number;
  lazyLoaded: boolean;
  suspended: boolean;
  cleanupVerified: boolean;
  evidence: Record<string, unknown>;
  ok: boolean;
  diagnostics: DashboardDiagnostic[];
  timestamp: string;
}

export interface DashboardEventFlow {
  schema: string;
  surfaceEventSchema: string;
  kernelSignalSchema: string;
  workpackage: string;
  flowId: string;
  dashboardId: string | null;
  sourceRole: string;
  targetRoles: string[];
  stages: string[];
  mapEvent: Record<string, unknown> | null;
  leafletRecord: Record<string, unknown> | null;
  targetSignals: Record<string, unknown>[];
  adapterRecords: Record<string, unknown>[];
  targetStatuses: Record<string, unknown>[];
  deliveredCount: number;
  degradedCount: number;
  ok: boolean;
  status: string;
  diagnostics: DashboardDiagnostic[];
  timestamp: string;
}

export interface MultiFrameworkDashboardReport {
  schema: string;
  dashboardSchema: string;
  surfaceSchema: string;
  eventFlowSchema: string;
  browserSmokeSchema: string;
  diagnosticSchema: string;
  signalBridgeSchema: string;
  kernelSignalSchema: string;
  surfaceEventSchema: string;
  maracaManifestSchema: string;
  maracaBuildPlanSchema: string;
  runtimeRegistrySchema: string;
  runtimeReportSchema: string;
  securityGateSchema: string;
  securityReportSchema: string;
  workpackage: string;
  ok: boolean;
  status: string;
  dashboardId: string;
  hostId: string;
  frameworkCodeRequired: false;
  runtimeExecutionRequired: false;
  localNetworkRequired: false;
  appShellBlocked: boolean;
  appShellResponsive: boolean;
  surfaces: DashboardSurface[];
  manifests: Record<string, unknown>[];
  maracaPlan: Record<string, unknown>;
  securityReport: Record<string, unknown>;
  runtimeReport: Record<string, unknown>;
  eventFlows: DashboardEventFlow[];
  browserSmokeRecords: DashboardBrowserSmokeRecord[];
  threeSmokeRecords: Record<string, unknown>[];
  threeFrameRecords: Record<string, unknown>[];
  dependencyBoundary: Record<string, unknown>;
  diagnostics: DashboardDiagnostic[];
  summary: Record<string, unknown>;
  boundaries: string[];
  dashboardFingerprint: string;
  timestamp: string;
}

export const XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_SCHEMA: string;
export const XTENSIONS_DASHBOARD_SURFACE_SCHEMA: string;
export const XTENSIONS_DASHBOARD_EVENT_FLOW_SCHEMA: string;
export const XTENSIONS_DASHBOARD_BROWSER_SMOKE_SCHEMA: string;
export const XTENSIONS_DASHBOARD_REPORT_SCHEMA: string;
export const XTENSIONS_DASHBOARD_DIAGNOSTIC_SCHEMA: string;
export const XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_MODULE_PATH: string;
export const XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_TYPES_PATH: string;
export const XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_SUITE_PATH: string;
export const XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_FIXTURE_PATH: string;
export const XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_CONTRACT_PATH: string;
export const XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_WORKPACKAGE: 'XTN-12';
export const XTENSIONS_MULTI_FRAMEWORK_DASHBOARD_PACKAGE_SCRIPT: string;
export const DASHBOARD_FRAMEWORK_DEPENDENCY_CODE: string;
export const DASHBOARD_SURFACE_MISSING_CODE: string;
export const DASHBOARD_EVENT_FLOW_TARGET_MISSING_CODE: string;
export const DASHBOARD_SMOKE_BLANK_CODE: string;
export const DASHBOARD_SMOKE_INTERACTION_MISSING_CODE: string;
export const DASHBOARD_SMOKE_LAZY_MISSING_CODE: string;
export const DASHBOARD_SMOKE_SUSPEND_MISSING_CODE: string;
export const DASHBOARD_SMOKE_CLEANUP_MISSING_CODE: string;
export const DASHBOARD_NETWORK_REQUIRED_CODE: string;
export const DASHBOARD_SURFACE_ROLES: readonly string[];
export const DASHBOARD_BROWSER_SMOKE_KINDS: readonly string[];
export const DASHBOARD_EVENT_FLOW_STAGES: readonly string[];
export const DASHBOARD_BOUNDARIES: readonly string[];

export function assertMultiFrameworkDashboardDependencyBoundary(input?: Record<string, unknown>): {
  ok: boolean;
  diagnostics: DashboardDiagnostic[];
  forbiddenFrameworkDependencies: string[];
};
export function createDashboardBrowserSmokeRecord(input?: Record<string, unknown>, options?: Record<string, unknown>): DashboardBrowserSmokeRecord;
export function createDashboardDiagnostic(subject?: Record<string, unknown>, code?: string, message?: string, severity?: string, metadata?: Record<string, unknown>): DashboardDiagnostic;
export function createDashboardEventFlow(input?: Record<string, unknown>, surfaces?: DashboardSurface[], options?: Record<string, unknown>): DashboardEventFlow;
export function createXTensionsMultiFrameworkDashboardReport(input?: Record<string, unknown>, options?: Record<string, unknown>): MultiFrameworkDashboardReport;
export function normalizeSurface(surface?: Record<string, unknown>, options?: Record<string, unknown>): DashboardSurface;
export function serializeMultiFrameworkDashboardReport(report: MultiFrameworkDashboardReport): string;
