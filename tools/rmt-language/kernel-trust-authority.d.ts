export * from './rmt-tooling-public-types';
import type { RmtToolingConstant, RmtToolingFactory, RmtToolingFunction } from './rmt-tooling-public-types';

export type RmtKernelTrustVerdictKind = 'trusted' | 'sanitized' | 'blocked' | 'panic';
export type RmtKernelTrustScope =
  | 'binding'
  | 'slot'
  | 'template'
  | 'surface'
  | 'remote-surface'
  | 'scheduler-job'
  | 'adapter-output'
  | 'diagnostics'
  | 'kernel';
export type RmtKernelTrustSeverity = 'info' | 'warning' | 'error' | 'fatal';

export interface RmtKernelTrustVerdict {
  schema: typeof RMT_KERNEL_TRUST_VERDICT_SCHEMA;
  authoritySchema: typeof RMT_KERNEL_TRUST_AUTHORITY_SCHEMA;
  source: typeof RMT_KERNEL_TRUST_AUTHORITY_SCHEMA;
  workpackage: typeof RMT_KERNEL_TRUST_AUTHORITY_WORKPACKAGE;
  verdict: RmtKernelTrustVerdictKind;
  scope: RmtKernelTrustScope | string;
  sink: string;
  sourceRef: string | null;
  ownerRef: string | null;
  attributeName: string | null;
  propertyName: string | null;
  severity: RmtKernelTrustSeverity;
  reasonCode: string;
  commitAllowed: boolean;
  sanitized: boolean;
  trustBoundary: string | null;
  panicCandidate: boolean;
  correlationId: string;
  diagnosticCode: string | null;
  metadata: Record<string, unknown>;
}

export interface RmtKernelTrustDiagnostic {
  schema: 'xtend.rmt.linter.diagnostic.v1';
  trustDiagnosticSchema: typeof RMT_KERNEL_TRUST_DIAGNOSTIC_SCHEMA;
  source: typeof RMT_KERNEL_TRUST_AUTHORITY_SCHEMA;
  workpackage: typeof RMT_KERNEL_TRUST_AUTHORITY_WORKPACKAGE;
  severity: RmtKernelTrustSeverity;
  code: string;
  message: string;
  sourceRef: string | null;
  scope: string;
  sink: string;
  correlationId: string;
  reasonCode: string;
  commitAllowed: boolean;
  panicCandidate: boolean;
  metadata: Record<string, unknown>;
}

export interface RmtKernelTrustAuthorityContract {
  schema: typeof RMT_KERNEL_TRUST_AUTHORITY_SCHEMA;
  hardeningContract: typeof RMT_KERNEL_TRUST_HARDENING_CONTRACT;
  securityPolicyContract: string;
  verdictSchema: typeof RMT_KERNEL_TRUST_VERDICT_SCHEMA;
  diagnosticSchema: typeof RMT_KERNEL_TRUST_DIAGNOSTIC_SCHEMA;
  reportSchema: typeof RMT_KERNEL_TRUST_AUTHORITY_REPORT_SCHEMA;
  workpackage: typeof RMT_KERNEL_TRUST_AUTHORITY_WORKPACKAGE;
  status: string;
  module: typeof RMT_KERNEL_TRUST_AUTHORITY_MODULE_PATH;
  suite: typeof RMT_KERNEL_TRUST_AUTHORITY_SUITE_PATH;
  localGate: string;
  packageScript: typeof RMT_KERNEL_TRUST_AUTHORITY_PACKAGE_SCRIPT;
  hostNeutral: boolean;
  runtimeMutations: boolean;
  verdicts: RmtKernelTrustVerdictKind[];
  scopes: string[];
  sinks: string[];
  reasonCodes: string[];
  diagnosticCodes: string[];
  defaultPolicy: Record<string, unknown>;
  diagnosticsIntegration: Record<string, unknown>;
  hostAdapterExtension: Record<string, unknown>;
  handoff: string[];
}

export interface RmtKernelTrustAuthority {
  schema: typeof RMT_KERNEL_TRUST_AUTHORITY_SCHEMA;
  contract: RmtKernelTrustAuthorityContract;
  createVerdict(input?: Record<string, unknown>): RmtKernelTrustVerdict;
  evaluateOutput(input?: Record<string, unknown>): RmtKernelTrustVerdict;
  createDiagnostic(input?: Record<string, unknown> | RmtKernelTrustVerdict, overrides?: Record<string, unknown>): RmtKernelTrustDiagnostic;
  serializeVerdict(input?: Record<string, unknown> | RmtKernelTrustVerdict): string;
}

export declare const HTML_TRUST_SINKS: RmtToolingConstant;
export declare const KERNEL_TRUST_DIAGNOSTIC_CODES: RmtToolingConstant;
export declare const KERNEL_TRUST_REASON_CODES: RmtToolingConstant;
export declare const KERNEL_TRUST_SCOPES: RmtToolingConstant;
export declare const KERNEL_TRUST_SEVERITIES: RmtToolingConstant;
export declare const KERNEL_TRUST_SINKS: RmtToolingConstant;
export declare const KERNEL_TRUST_VERDICTS: RmtToolingConstant;
export declare const RMT_KERNEL_TRUST_AUTHORITY_CONTRACT_PATH: RmtToolingConstant;
export declare const RMT_KERNEL_TRUST_AUTHORITY_MODULE_PATH: RmtToolingConstant;
export declare const RMT_KERNEL_TRUST_AUTHORITY_PACKAGE_SCRIPT: RmtToolingConstant;
export declare const RMT_KERNEL_TRUST_AUTHORITY_REPORT_SCHEMA: RmtToolingConstant;
export declare const RMT_KERNEL_TRUST_AUTHORITY_SCHEMA: RmtToolingConstant;
export declare const RMT_KERNEL_TRUST_AUTHORITY_SUITE_PATH: RmtToolingConstant;
export declare const RMT_KERNEL_TRUST_AUTHORITY_WORKPACKAGE: RmtToolingConstant;
export declare const RMT_KERNEL_TRUST_AUTHORITY_WP_PATH: RmtToolingConstant;
export declare const RMT_KERNEL_TRUST_DIAGNOSTIC_SCHEMA: RmtToolingConstant;
export declare const RMT_KERNEL_TRUST_HARDENING_CONTRACT: RmtToolingConstant;
export declare const RMT_KERNEL_TRUST_VERDICT_SCHEMA: RmtToolingConstant;
export declare const SAFE_PROPERTY_WRITES: RmtToolingConstant;
export declare const URL_ATTRIBUTES: RmtToolingConstant;
export declare const UNSAFE_PROPERTY_WRITES: RmtToolingConstant;
export declare const createKernelTrustAuthority: RmtToolingFactory;
export declare const createKernelTrustAuthorityContract: RmtToolingFactory;
export declare const createKernelTrustDiagnostic: RmtToolingFunction;
export declare const createKernelTrustVerdict: RmtToolingFunction;
export declare const hasUnsafeProtocol: RmtToolingFunction;
export declare const serializeKernelTrustAuthorityContract: RmtToolingFunction;
export declare const serializeKernelTrustVerdict: RmtToolingFunction;
