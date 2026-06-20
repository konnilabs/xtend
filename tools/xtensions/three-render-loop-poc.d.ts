export interface ThreePocDiagnostic {
  code: string;
  message: string;
  details: Record<string, unknown>;
  schema?: string;
  source?: string;
  workpackage?: string;
  severity?: 'error' | 'warning' | 'info';
  xtensionId?: string | null;
  framework?: 'three' | string | null;
  field?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ThreeFiberRecord {
  schema: string;
  workpackage: string;
  xtensionId: string;
  framework: 'three';
  fiberId: string;
  endpointName: string;
  lane: string;
  hostRegistered: boolean;
  schedulerAuthority: 'host-fiber';
  freeRunningLoopAllowed: false;
  frameBudgetMs: number;
  lowPowerFrameBudgetMs: number;
  backpressureStrategy: string;
  visibilityPolicy: string;
  contextLossPolicy: string;
  ok: boolean;
  diagnostics: ThreePocDiagnostic[];
  timestamp: string;
}

export interface ThreeFrameRecord {
  schema: string;
  surfaceEventSchema: string;
  workpackage: string;
  xtensionId: string;
  framework: 'three';
  frameId: string;
  sequence: number;
  lane: string;
  status: 'rendered' | 'dropped-over-budget' | 'skipped-hidden' | 'skipped-suspended' | 'skipped-context-lost' | string;
  visible: boolean;
  suspended: boolean;
  contextLost: boolean;
  lowPowerMode: boolean;
  frameBudgetMs: number;
  renderCostMs: number;
  dropped: boolean;
  backpressureStrategy: string;
  nonBlankPixels: number;
  payloadFingerprint: string;
  ok: boolean;
  diagnostics: ThreePocDiagnostic[];
  timestamp: string;
}

export interface ThreeContextLossRecord {
  schema: string;
  workpackage: string;
  xtensionId: string;
  framework: 'three';
  status: 'lost' | 'restored';
  reason: string;
  action: string;
  hostOwned: true;
  diagnostics: ThreePocDiagnostic[];
  timestamp: string;
}

export interface ThreeBrowserSmokeRecord {
  schema: string;
  workpackage: string;
  xtensionId: string;
  framework: 'three';
  smokeMode: string;
  browserRuntimeRequired: false;
  threeRuntimeImported: false;
  nonBlankPixels: number;
  interactionCount: number;
  cleanupVerified: boolean;
  evidence: Record<string, unknown>;
  ok: boolean;
  diagnostics: ThreePocDiagnostic[];
  timestamp: string;
}

export interface ThreeRenderLoopContract {
  schema: string;
  pocSchema: string;
  hostControllerSchema: string;
  runtimeRegistrySchema: string;
  staticContractSchema: string;
  fiberRecordSchema: string;
  frameRecordSchema: string;
  contextLossRecordSchema: string;
  browserSmokeRecordSchema: string;
  workpackage: string;
  status: 'accepted-by-XTN-09';
  framework: 'three';
  peerMode: 'external-opt-in-peer-harness';
  testMode: 'frameworkless-contract-stub';
  frameworkDependenciesAllowed: false;
  vendoredFrameworksAllowed: false;
  runtimeExecutionRequired: false;
  freeRunningLoopAllowed: false;
  defaultFrameBudgetMs: number;
  lowPowerFrameBudgetMs: number;
  lanes: string[];
  states: string[];
  boundaries: string[];
  staticContract: Record<string, unknown>;
}

export interface FrameworklessThreeRenderLoopPoc {
  schema: string;
  id: string;
  framework: 'three';
  version: string;
  contract: Record<string, unknown>;
  mount(container?: Record<string, unknown>, sceneDescriptor?: Record<string, unknown>, mountOptions?: Record<string, unknown>): Record<string, unknown>;
  registerRenderLoop(input?: Record<string, unknown>): Record<string, unknown>;
  tick(input?: Record<string, unknown>): Record<string, unknown>;
  setVisibility(input?: Record<string, unknown>): Record<string, unknown>;
  setLowPowerMode(input?: Record<string, unknown>): Record<string, unknown>;
  suspend(reason?: string): Record<string, unknown>;
  resume(reason?: string): Record<string, unknown>;
  reportContextLoss(input?: Record<string, unknown>): Record<string, unknown>;
  restoreContext(input?: Record<string, unknown>): Record<string, unknown>;
  interact(event?: Record<string, unknown>): Record<string, unknown>;
  browserSmoke(input?: Record<string, unknown>): ThreeBrowserSmokeRecord;
  unmount(reason?: string): Record<string, unknown>;
  snapshot(): Record<string, unknown>;
  getLifecycleRecords(): Record<string, unknown>[];
  getFiberRecords(): ThreeFiberRecord[];
  getFrameRecords(): ThreeFrameRecord[];
  getContextLossRecords(): ThreeContextLossRecord[];
  getBrowserSmokeRecords(): ThreeBrowserSmokeRecord[];
  getCleanupRecords(): Record<string, unknown>[];
}

export interface ThreeRenderLoopPocReport {
  schema: string;
  pocSchema: string;
  contractSchema: string;
  fiberRecordSchema: string;
  frameRecordSchema: string;
  contextLossRecordSchema: string;
  browserSmokeRecordSchema: string;
  runtimeRegistrySchema: string;
  workpackage: string;
  ok: boolean;
  status: string;
  runtimeExecutionRequired: false;
  threeRuntimeImported: false;
  freeRunningLoopAllowed: false;
  contract: ThreeRenderLoopContract;
  adapter: Record<string, unknown>;
  runtimeRegistry: Record<string, unknown>;
  runtimeReport: Record<string, unknown>;
  operationResults: Record<string, unknown>[];
  smokeResults: ThreeBrowserSmokeRecord[];
  snapshot: Record<string, unknown>;
  lifecycleRecords: Record<string, unknown>[];
  fiberRecords: ThreeFiberRecord[];
  frameRecords: ThreeFrameRecord[];
  contextLossRecords: ThreeContextLossRecord[];
  browserSmokeRecords: ThreeBrowserSmokeRecord[];
  cleanupRecords: Record<string, unknown>[];
  dependencyBoundary: Record<string, unknown>;
  diagnostics: ThreePocDiagnostic[];
  timestamp: string;
}

export const XTENSIONS_THREE_RENDER_LOOP_POC_SCHEMA: string;
export const XTENSIONS_THREE_RENDER_LOOP_CONTRACT_SCHEMA: string;
export const XTENSIONS_THREE_FIBER_RECORD_SCHEMA: string;
export const XTENSIONS_THREE_FRAME_RECORD_SCHEMA: string;
export const XTENSIONS_THREE_CONTEXT_LOSS_RECORD_SCHEMA: string;
export const XTENSIONS_THREE_BROWSER_SMOKE_RECORD_SCHEMA: string;
export const XTENSIONS_THREE_RENDER_LOOP_REPORT_SCHEMA: string;
export const XTENSIONS_THREE_RENDER_LOOP_POC_WORKPACKAGE: 'XTN-09';
export const THREE_RENDER_LOOP_BOUNDARIES: readonly string[];
export const THREE_RENDER_LOOP_LANES: readonly string[];
export const THREE_RENDER_LOOP_STATES: readonly string[];

export function assertThreeRenderLoopDependencyBoundary(input?: Record<string, unknown>): {
  ok: boolean;
  diagnostics: ThreePocDiagnostic[];
  forbiddenFrameworkDependencies: string[];
};
export function createFrameworklessThreeRenderLoopPoc(options?: Record<string, unknown>): FrameworklessThreeRenderLoopPoc;
export function createThreeBrowserSmokeRecord(input?: Record<string, unknown>, options?: Record<string, unknown>): ThreeBrowserSmokeRecord;
export function createThreeContextLossRecord(input?: Record<string, unknown>, options?: Record<string, unknown>): ThreeContextLossRecord;
export function createThreeFiberRecord(input?: Record<string, unknown>, options?: Record<string, unknown>): ThreeFiberRecord;
export function createThreeFrameRecord(input?: Record<string, unknown>, options?: Record<string, unknown>): ThreeFrameRecord;
export function createThreeRenderLoopContract(options?: Record<string, unknown>): ThreeRenderLoopContract;
export function createThreeRenderLoopPocReport(input?: Record<string, unknown>, options?: Record<string, unknown>): ThreeRenderLoopPocReport;
export function createThreeRuntimeAdapterRecord(options?: Record<string, unknown>): Record<string, unknown>;
export function createThreePocDiagnostic(subject?: Record<string, unknown>, code?: string, message?: string, severity?: string, metadata?: Record<string, unknown>): ThreePocDiagnostic;
export function inspectThreePayloadBoundary(payload?: Record<string, unknown>, subject?: Record<string, unknown>): {
  ok: boolean;
  diagnostics: ThreePocDiagnostic[];
  apiBoundary: 'hostcontroller-only';
  serializable: boolean;
};
export function serializeThreeRenderLoopPocReport(report: ThreeRenderLoopPocReport): string;
