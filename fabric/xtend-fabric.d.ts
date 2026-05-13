export * from './xtend-policy-public-types';
import type {
  XtendFabricFiberInput,
  XtendFabricFiberResult,
  XtendPolicyConstant,
  XtendPolicyDiagnostic,
  XtendPolicyFactory,
  XtendPolicyFunction,
  XtendPolicyOptions,
  XtendPolicyReport
} from './xtend-policy-public-types';

export interface XtendFabricReporter {
  schema?: string;
  id?: string;
  report?(diagnostic: XtendPolicyDiagnostic): unknown;
  dispose?(): void;
}

export interface XtendFabricApi {
  schema: string;
  contracts: Record<string, string>;
  lanes: Record<string, unknown>;
  createBoundary: XtendPolicyFactory;
  createComponentLifecycleBoundary: XtendPolicyFactory;
  createReporterAdapter: XtendPolicyFactory<XtendFabricReporter>;
  createConsoleReporter: XtendPolicyFactory<XtendFabricReporter>;
  createTestReporter: XtendPolicyFactory<XtendFabricReporter>;
  createComponentFiberInstrumentation: XtendPolicyFactory;
  createRouteFiberInstrumentation: XtendPolicyFactory;
  createRuntimeDiagnosticsBridge: XtendPolicyFactory;
  createBackpressureSignal: XtendPolicyFactory;
  recordComponentTelemetry: XtendPolicyFunction;
  normalizeComponentLifecycleTelemetry: XtendPolicyFunction<XtendPolicyReport>;
  summarizeComponentLifecycleTelemetry: XtendPolicyFunction<XtendPolicyReport>;
  createTelemetrySnapshot: XtendPolicyFunction<XtendPolicyReport>;
  publishTelemetrySnapshot: XtendPolicyFunction<XtendPolicyReport>;
  exportTelemetrySnapshot: XtendPolicyFunction<XtendPolicyReport>;
  wrapComponent: XtendPolicyFunction;
  runFiber: XtendPolicyFunction<XtendFabricFiberResult>;
  emitDiagnostic: XtendPolicyFunction<XtendPolicyDiagnostic>;
  registerReporter: XtendPolicyFunction;
  captureError: XtendPolicyFunction<XtendPolicyDiagnostic>;
  connectRmtDiagnostics: XtendPolicyFunction;
  getDiagnostics(): XtendPolicyDiagnostic[];
  getFibers(): XtendFabricFiberInput[];
  getComponentTelemetry(): unknown[];
  getReporters(): XtendFabricReporter[];
  clearDiagnostics(): void;
  clearFibers(): void;
  clearComponentTelemetry(): void;
  dispose(): void;
}

export declare const CONTRACTS: XtendPolicyConstant<Record<string, string>>;
export declare const BROWSER_NAMESPACE: XtendPolicyConstant<string>;
export declare const DEFAULT_LANE_BY_KIND: XtendPolicyConstant<Record<string, string>>;
export declare const CANONICAL_LANES: XtendPolicyConstant<Record<string, unknown>>;
export declare const LIFECYCLE_METHODS: XtendPolicyConstant<string[]>;
export declare const LIFECYCLE_PHASES: XtendPolicyConstant<Record<string, unknown>>;
export declare const COMPONENT_FIBER_OPERATION_PROFILES: XtendPolicyConstant<Record<string, unknown>>;
export declare const ROUTE_FIBER_OPERATION_PROFILES: XtendPolicyConstant<Record<string, unknown>>;
export declare const COMPONENT_LIFECYCLE_OPERATIONS: XtendPolicyConstant<string[]>;
export declare const BACKPRESSURE_SCORE_THRESHOLDS: XtendPolicyConstant<Record<string, number>>;
export declare const BACKPRESSURE_ACTION_BY_LEVEL: XtendPolicyConstant<Record<string, unknown>>;
export declare const PERFORMANCE_MEASURE_PHASES: XtendPolicyConstant<string[]>;
export declare const PERFORMANCE_MEASURE_NAME_BY_FIBER_KIND: XtendPolicyConstant<Record<string, string>>;
export declare const PERFORMANCE_BUDGET_MS_BY_MEASURE: XtendPolicyConstant<Record<string, number>>;
export declare function createXtendFabric(options?: XtendPolicyOptions): XtendFabricApi;
export declare const createNoopReporter: XtendPolicyFactory<XtendFabricReporter>;
export declare const createReporterAdapter: XtendPolicyFactory<XtendFabricReporter>;
export declare const createConsoleReporter: XtendPolicyFactory<XtendFabricReporter>;
export declare const createTestReporter: XtendPolicyFactory<XtendFabricReporter>;
export declare const normalizeComponentLifecycleTelemetry: XtendPolicyFunction<XtendPolicyReport>;
export declare const summarizeComponentLifecycleTelemetry: XtendPolicyFunction<XtendPolicyReport>;
export declare const normalizeDiagnostic: XtendPolicyFunction<XtendPolicyDiagnostic>;
export declare const normalizeDiagnosticCode: XtendPolicyFunction<string>;
export declare const normalizeError: XtendPolicyFunction<XtendPolicyDiagnostic>;
export declare const normalizeFiber: XtendPolicyFunction<XtendFabricFiberInput>;
export declare const redactDiagnostic: XtendPolicyFunction<XtendPolicyDiagnostic>;
export declare const redactValue: XtendPolicyFunction;
