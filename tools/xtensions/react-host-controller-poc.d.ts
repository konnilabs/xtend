export interface ReactPocDiagnostic {
  code: string;
  message: string;
  details: Record<string, unknown>;
  schema?: string;
  source?: string;
  workpackage?: string;
  severity?: 'error' | 'warning' | 'info';
  xtensionId?: string | null;
  framework?: 'react';
  field?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ReactSchedulingDecision {
  schema: string;
  workpackage: string;
  operation: string;
  lane: string;
  priorityHint: string;
  budgetMs: number;
  hint: 'sync-render-hint' | 'startTransition-hint' | 'idle-defer-hint' | 'suspense-placeholder-hint';
  renderMode: string;
  reason: string;
  startTransitionEligible: boolean;
  syncRenderEligible: boolean;
  hardKernelPriorityControl: false;
  schedulerAuthority: 'fabric-lane-budget-hint';
  timestamp: string;
}

export interface ReactRenderRecord {
  schema: string;
  workpackage: string;
  hostId: string | null;
  surfaceId: string | null;
  xtensionId: string;
  framework: 'react';
  operation: string;
  rootMode: 'frameworkless-react-root-stub';
  renderMode: string;
  schedulingHint: string;
  startTransitionHint: boolean;
  syncRenderHint: boolean;
  hardKernelPriorityControl: false;
  contextBoundary: 'internal-only';
  payloadFingerprint: string;
  timestamp: string;
}

export interface ReactBoundaryRecord {
  schema: string;
  workpackage: string;
  kind: 'error' | 'suspense' | string;
  status: string;
  hostId: string | null;
  surfaceId: string | null;
  xtensionId: string;
  framework: 'react';
  fallback: Record<string, unknown>;
  diagnostics: ReactPocDiagnostic[];
  timestamp: string;
}

export interface ReactHostControllerPocContract {
  schema: string;
  pocSchema: string;
  hostControllerSchema: string;
  runtimeRegistrySchema: string;
  staticContractSchema: string;
  workpackage: string;
  status: 'accepted-by-XTN-06';
  framework: 'react';
  peerMode: 'external-opt-in-peer-harness';
  testMode: 'frameworkless-contract-stub';
  frameworkDependenciesAllowed: false;
  vendoredFrameworksAllowed: false;
  runtimeExecutionRequired: false;
  schedulingHints: string[];
  boundaries: string[];
  staticContract: Record<string, unknown>;
}

export interface FrameworklessReactHostControllerPoc {
  schema: string;
  id: string;
  framework: 'react';
  version: string;
  hostNeutral: true;
  contract: ReactHostControllerPocContract;
  dependencyPolicy: Record<string, unknown>;
  methods: string[];
  mount(container?: Record<string, unknown>, initialProps?: Record<string, unknown>, mountOptions?: Record<string, unknown>): Record<string, unknown>;
  update(signal?: Record<string, unknown>): Record<string, unknown>;
  suspend(reason?: string): Record<string, unknown>;
  resume(reason?: string): Record<string, unknown>;
  reportError(error?: Error, metadata?: Record<string, unknown>): Record<string, unknown>;
  unmount(reason?: string): Record<string, unknown>;
  snapshot(): Record<string, unknown>;
  getLifecycleRecords(): Record<string, unknown>[];
  getSchedulingDecisions(): ReactSchedulingDecision[];
  getRenderRecords(): ReactRenderRecord[];
  getBoundaryRecords(): ReactBoundaryRecord[];
  getCleanupRecords(): Record<string, unknown>[];
}

export interface ReactHostControllerPocReport {
  schema: string;
  pocSchema: string;
  contractSchema: string;
  schedulingDecisionSchema: string;
  renderRecordSchema: string;
  boundaryRecordSchema: string;
  runtimeRegistrySchema: string;
  workpackage: string;
  ok: boolean;
  status: string;
  framework: 'react';
  runtimeExecutionRequired: false;
  reactRuntimeImported: false;
  contract: ReactHostControllerPocContract;
  adapter: Record<string, unknown>;
  runtimeRegistry: Record<string, unknown>;
  runtimeReport: Record<string, unknown>;
  operationResults: Record<string, unknown>[];
  snapshot: Record<string, unknown>;
  lifecycleRecords: Record<string, unknown>[];
  schedulingDecisions: ReactSchedulingDecision[];
  renderRecords: ReactRenderRecord[];
  boundaryRecords: ReactBoundaryRecord[];
  cleanupRecords: Record<string, unknown>[];
  dependencyBoundary: Record<string, unknown>;
  diagnostics: ReactPocDiagnostic[];
  timestamp: string;
}

export const XTENSIONS_REACT_HOST_CONTROLLER_POC_SCHEMA: string;
export const XTENSIONS_REACT_HOST_CONTROLLER_CONTRACT_SCHEMA: string;
export const XTENSIONS_REACT_SCHEDULING_DECISION_SCHEMA: string;
export const XTENSIONS_REACT_RENDER_RECORD_SCHEMA: string;
export const XTENSIONS_REACT_BOUNDARY_RECORD_SCHEMA: string;
export const XTENSIONS_REACT_HOST_CONTROLLER_REPORT_SCHEMA: string;
export const XTENSIONS_REACT_HOST_CONTROLLER_POC_WORKPACKAGE: 'XTN-06';
export const REACT_SCHEDULING_HINTS: readonly string[];
export const REACT_POC_BOUNDARIES: readonly string[];

export function assertReactPocDependencyBoundary(input?: Record<string, unknown>): {
  ok: boolean;
  diagnostics: ReactPocDiagnostic[];
  forbiddenFrameworkDependencies: string[];
};
export function createFrameworklessReactHostControllerPoc(options?: Record<string, unknown>): FrameworklessReactHostControllerPoc;
export function createReactHostControllerPocContract(options?: Record<string, unknown>): ReactHostControllerPocContract;
export function createReactHostControllerPocReport(input?: Record<string, unknown>, options?: Record<string, unknown>): ReactHostControllerPocReport;
export function createReactRuntimeAdapterRecord(options?: Record<string, unknown>): Record<string, unknown>;
export function decideReactSchedulingHint(input?: Record<string, unknown>, options?: Record<string, unknown>): ReactSchedulingDecision;
export function inspectReactPayloadBoundary(payload?: Record<string, unknown>): {
  ok: boolean;
  diagnostics: ReactPocDiagnostic[];
  contextBoundary: 'internal-only';
  serializable: boolean;
};
export function serializeReactHostControllerPocReport(report: ReactHostControllerPocReport): string;
