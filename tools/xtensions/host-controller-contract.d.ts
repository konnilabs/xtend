export const XTENSIONS_HOST_CONTROLLER_SCHEMA: 'xtend.xtensions.host-controller.v1';
export const XTENSIONS_HOST_CONTROLLER_RESULT_SCHEMA: 'xtend.xtensions.host-controller-result.v1';
export const XTENSIONS_HOST_CONTROLLER_LIFECYCLE_RECORD_SCHEMA: 'xtend.xtensions.host-controller-lifecycle-record.v1';
export const XTENSIONS_HOST_CONTROLLER_REPORT_SCHEMA: 'xtend.xtensions.host-controller-report.v1';
export const XTENSIONS_HOST_CONTROLLER_MODULE_PATH: 'tools/xtensions/host-controller-contract.js';
export const XTENSIONS_HOST_CONTROLLER_TYPES_PATH: 'tools/xtensions/host-controller-contract.d.ts';
export const XTENSIONS_HOST_CONTROLLER_SUITE_PATH: 'tests/xtensions/xtensions_host_controller_suite.js';
export const XTENSIONS_HOST_CONTROLLER_FIXTURE_PATH: 'tests/fixtures/xtensions/host-controller-dummy.json';
export const XTENSIONS_HOST_CONTROLLER_WORKPACKAGE: 'XTN-01';
export const XTENSIONS_HOST_CONTROLLER_PACKAGE_SCRIPT: 'npm run test:xtensions-host-controller';

export type XTensionHostControllerStatus = 'ok' | 'skipped' | 'degraded' | 'failed' | 'policy-blocked';
export type XTensionHostControllerMethod = 'mount' | 'update' | 'suspend' | 'resume' | 'reportError' | 'unmount';

export interface XTensionDiagnostic {
  code: string;
  message: string;
  details: Record<string, unknown>;
}

export interface XTensionLifecycleRecord {
  schema: typeof XTENSIONS_HOST_CONTROLLER_LIFECYCLE_RECORD_SCHEMA;
  hostId: string | null;
  surfaceId: string | null;
  operation: XTensionHostControllerMethod;
  event: string | null;
  status: XTensionHostControllerStatus;
  phase: string;
  lane: string;
  sequence: number;
  terminal: boolean;
  timestamp: string;
  payload: Record<string, unknown>;
  diagnostics: XTensionDiagnostic[];
}

export interface XTensionCleanupRecord {
  schema: 'xtend.xtensions.host-controller-cleanup-record.v1';
  hostId: string;
  surfaceId: string;
  resource: string;
  status: 'released';
  sequence: number;
  timestamp: string;
}

export interface XTensionHostControllerResult {
  schema: typeof XTENSIONS_HOST_CONTROLLER_RESULT_SCHEMA;
  operation: XTensionHostControllerMethod;
  ok: boolean;
  status: XTensionHostControllerStatus;
  hostId: string | null;
  surfaceId: string | null;
  timestamp: string;
  lifecycleRecord: XTensionLifecycleRecord | null;
  cleanupRecords: XTensionCleanupRecord[];
  diagnostics: XTensionDiagnostic[];
  metadata: Record<string, unknown>;
}

export interface XTensionHostControllerContract {
  schema: typeof XTENSIONS_HOST_CONTROLLER_SCHEMA;
  resultSchema: typeof XTENSIONS_HOST_CONTROLLER_RESULT_SCHEMA;
  lifecycleRecordSchema: typeof XTENSIONS_HOST_CONTROLLER_LIFECYCLE_RECORD_SCHEMA;
  reportSchema: typeof XTENSIONS_HOST_CONTROLLER_REPORT_SCHEMA;
  workpackage: typeof XTENSIONS_HOST_CONTROLLER_WORKPACKAGE;
  status: 'accepted-by-XTN-01';
  hostNeutral: true;
  requiredMethods: XTensionHostControllerMethod[];
  resultStatuses: XTensionHostControllerStatus[];
  lifecycle: Array<Record<string, unknown>>;
  cleanupResources: string[];
  containerOwnership: Record<string, string>;
  dependencyPolicy: {
    frameworkDependenciesAllowed: false;
    vendoredFrameworksAllowed: false;
    networkRequired: false;
    allowedTestModes: string[];
    forbiddenFrameworkDependencies: string[];
  };
  boundaries: string[];
}

export interface XTensionFrameworklessHostController {
  schema: typeof XTENSIONS_HOST_CONTROLLER_SCHEMA;
  id: string;
  framework: 'frameworkless-stub';
  version: '0.0.0-test';
  hostNeutral: true;
  contract: XTensionHostControllerContract;
  dependencyPolicy: XTensionHostControllerContract['dependencyPolicy'];
  methods: XTensionHostControllerMethod[];
  mount(container?: Record<string, unknown>, initialProps?: Record<string, unknown>, mountOptions?: Record<string, unknown>): XTensionHostControllerResult;
  update(signal?: Record<string, unknown>): XTensionHostControllerResult;
  suspend(reason?: string): XTensionHostControllerResult;
  resume(reason?: string): XTensionHostControllerResult;
  reportError(error?: Error, metadata?: Record<string, unknown>): XTensionHostControllerResult;
  unmount(reason?: string): XTensionHostControllerResult;
  snapshot(): Record<string, unknown>;
  getLifecycleRecords(): XTensionLifecycleRecord[];
  getCleanupRecords(): XTensionCleanupRecord[];
}

export const DEFAULT_CLEANUP_RESOURCES: readonly string[];
export const FORBIDDEN_FRAMEWORK_DEPENDENCIES: readonly string[];
export const HOST_CONTROLLER_BOUNDARIES: readonly string[];
export const HOST_CONTROLLER_LIFECYCLE_MATRIX: readonly Readonly<Record<string, unknown>>[];
export const HOST_CONTROLLER_RESULT_STATUSES: readonly XTensionHostControllerStatus[];
export const REQUIRED_HOST_CONTROLLER_METHODS: readonly XTensionHostControllerMethod[];

export function assertNoFrameworkDependencies(input?: Record<string, unknown>): {
  ok: boolean;
  diagnostics: XTensionDiagnostic[];
  forbiddenFrameworkDependencies: string[];
};

export function createFrameworklessHostControllerStub(options?: Record<string, unknown>): XTensionFrameworklessHostController;
export function createLifecycleRecord(operation: XTensionHostControllerMethod, event?: string | null, options?: Record<string, unknown>): XTensionLifecycleRecord;
export function createXTensionHostControllerContract(options?: Record<string, unknown>): XTensionHostControllerContract;
export function normalizeHostControllerDefinition(definition?: Record<string, unknown>): Record<string, unknown>;
export function normalizeHostControllerResult(operation: XTensionHostControllerMethod, result?: Record<string, unknown>, options?: Record<string, unknown>): XTensionHostControllerResult;
