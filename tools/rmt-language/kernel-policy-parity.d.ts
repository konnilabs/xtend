export * from './rmt-tooling-public-types';
import type { RmtToolingConstant, RmtToolingFactory, RmtToolingFunction } from './rmt-tooling-public-types';

export type RmtKernelPolicyParityStatus = 'ready' | 'drift' | string;
export type RmtKernelPolicyParityVerdict = 'trusted' | 'sanitized' | 'blocked' | 'panic' | 'recovered' | 'drift' | string;

export interface RmtKernelPolicyParityMatrixEntry {
  id: string;
  sourceSchema: string;
  policyFamily: string;
  compileTimeCodes: string[];
  compileTimeStatuses: string[];
  runtimeScope: string;
  runtimeHooks: string[];
  runtimeSchemas: string[];
  runtimeVerdicts: RmtKernelPolicyParityVerdict[];
  trustBoundary: string | null;
  panicTrigger: string;
  recoveryAction: string;
}

export interface RmtKernelPolicyParityMatrix {
  schema: typeof RMT_KERNEL_POLICY_PARITY_MATRIX_SCHEMA;
  paritySchema: typeof RMT_KERNEL_POLICY_PARITY_SCHEMA;
  workpackage: typeof RMT_KERNEL_POLICY_PARITY_WORKPACKAGE;
  entryCount: number;
  entries: RmtKernelPolicyParityMatrixEntry[];
}

export interface RmtKernelPolicyParityContract {
  schema: typeof RMT_KERNEL_POLICY_PARITY_SCHEMA;
  matrixSchema: typeof RMT_KERNEL_POLICY_PARITY_MATRIX_SCHEMA;
  reportSchema: typeof RMT_KERNEL_POLICY_PARITY_REPORT_SCHEMA;
  driftSchema: typeof RMT_KERNEL_POLICY_PARITY_DRIFT_SCHEMA;
  workpackage: typeof RMT_KERNEL_POLICY_PARITY_WORKPACKAGE;
  status: string;
  module: typeof RMT_KERNEL_POLICY_PARITY_MODULE_PATH;
  suite: typeof RMT_KERNEL_POLICY_PARITY_SUITE_PATH;
  localGate: string;
  packageScript: typeof RMT_KERNEL_POLICY_PARITY_PACKAGE_SCRIPT;
  diagnosticsChannel: typeof RMT_KERNEL_POLICY_PARITY_DIAGNOSTIC_CHANNEL;
  hostNeutral: boolean;
  sourcePolicySchemas: string[];
  runtimeScopes: string[];
  runtimeHooks: string[];
  runtimeVerdicts: string[];
  matrix: RmtKernelPolicyParityMatrix;
  invariants: string[];
  handoff: string[];
}

export interface RmtKernelPolicyParityBlock {
  sourceSchema: string;
  reportSchema: string;
  code: string;
  severity: string;
  status: string;
  message: string;
  sourceRef: string;
  metadata: Record<string, unknown>;
}

export interface RmtKernelPolicyParityAppliedPolicy {
  blockCode: string;
  sourceSchema: string;
  matrixEntryId: string;
  policyFamily: string;
  runtimeScope: string;
  runtimeHooks: string[];
  missingRuntimeHooks: string[];
  runtimeSchemas: string[];
  runtimeVerdicts: RmtKernelPolicyParityVerdict[];
  appliedPolicy: string;
  verdict: RmtKernelPolicyParityVerdict;
  panicTrigger: string;
  recoveryAction: string;
  trustBoundary: string | null;
}

export interface RmtKernelPolicyParityDrift {
  schema: typeof RMT_KERNEL_POLICY_PARITY_DRIFT_SCHEMA;
  type: 'missing-runtime-mapping' | 'missing-runtime-hook' | string;
  sourceSchema: string;
  blockCode: string;
  sourceRef: string;
  matrixEntryId?: string;
  missingRuntimeHooks?: string[];
  message: string;
}

export interface RmtKernelPolicyParityReport {
  schema: typeof RMT_KERNEL_POLICY_PARITY_REPORT_SCHEMA;
  paritySchema: typeof RMT_KERNEL_POLICY_PARITY_SCHEMA;
  matrixSchema: typeof RMT_KERNEL_POLICY_PARITY_MATRIX_SCHEMA;
  workpackage: typeof RMT_KERNEL_POLICY_PARITY_WORKPACKAGE;
  status: RmtKernelPolicyParityStatus;
  ok: boolean;
  compileTimeBlockCount: number;
  appliedPolicyCount: number;
  driftCount: number;
  sourcePolicySchemas: string[];
  runtimeScopes: string[];
  runtimeCapabilities: {
    hooks: string[];
    missingDefaultHooks: string[];
  };
  compileTimeBlocks: RmtKernelPolicyParityBlock[];
  appliedPolicies: RmtKernelPolicyParityAppliedPolicy[];
  drift: RmtKernelPolicyParityDrift[];
}

export interface RmtKernelPolicyParityController {
  schema: typeof RMT_KERNEL_POLICY_PARITY_SCHEMA;
  contract: RmtKernelPolicyParityContract;
  getMatrix(): RmtKernelPolicyParityMatrix;
  createRuntimeReport(input?: Record<string, unknown>): RmtKernelPolicyParityReport;
  checkDrift(input?: Record<string, unknown>): RmtKernelPolicyParityDrift[];
  listReports(): RmtKernelPolicyParityReport[];
}

export declare const DEFAULT_KERNEL_POLICY_PARITY_MATRIX: RmtToolingConstant;
export declare const KERNEL_POLICY_PARITY_RUNTIME_HOOKS: RmtToolingConstant;
export declare const KERNEL_POLICY_PARITY_RUNTIME_VERDICTS: RmtToolingConstant;
export declare const RMT_KERNEL_POLICY_PARITY_CONTRACT_PATH: RmtToolingConstant;
export declare const RMT_KERNEL_POLICY_PARITY_DIAGNOSTIC_CHANNEL: RmtToolingConstant;
export declare const RMT_KERNEL_POLICY_PARITY_DRIFT_SCHEMA: RmtToolingConstant;
export declare const RMT_KERNEL_POLICY_PARITY_MATRIX_SCHEMA: RmtToolingConstant;
export declare const RMT_KERNEL_POLICY_PARITY_MODULE_PATH: RmtToolingConstant;
export declare const RMT_KERNEL_POLICY_PARITY_PACKAGE_SCRIPT: RmtToolingConstant;
export declare const RMT_KERNEL_POLICY_PARITY_REPORT_SCHEMA: RmtToolingConstant;
export declare const RMT_KERNEL_POLICY_PARITY_SCHEMA: RmtToolingConstant;
export declare const RMT_KERNEL_POLICY_PARITY_SUITE_PATH: RmtToolingConstant;
export declare const RMT_KERNEL_POLICY_PARITY_WORKPACKAGE: RmtToolingConstant;
export declare const RMT_KERNEL_POLICY_PARITY_WP_PATH: RmtToolingConstant;
export declare const collectCompileTimeBlocks: RmtToolingFunction;
export declare const createKernelPolicyParityContract: RmtToolingFactory;
export declare const createKernelPolicyParityController: RmtToolingFactory;
export declare const createKernelPolicyParityMatrix: RmtToolingFactory;
export declare const createKernelPolicyParityRuntimeReport: RmtToolingFunction;
export declare const createRuntimeCapabilitySnapshot: RmtToolingFunction;
export declare const serializeKernelPolicyParityContract: RmtToolingFunction;
export declare const serializeKernelPolicyParityReport: RmtToolingFunction;
