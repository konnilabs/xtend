export * from './rmt-tooling-public-types';
import type { RmtToolingConstant, RmtToolingFactory, RmtToolingFunction } from './rmt-tooling-public-types';

export type RmtKernelSecurityRegressionStatus = 'passed' | 'failed' | string;
export type RmtKernelSecurityRegressionVerdict = 'trusted' | 'sanitized' | 'blocked' | 'panic' | string;

export interface RmtKernelSecurityRegressionFixture {
  id: string;
  sink: string;
  payload?: string;
  attributeName?: string;
  propertyName?: string;
  expectedVerdict?: RmtKernelSecurityRegressionVerdict;
  expectedDiagnosticCode?: string;
  expectedRemovedPatterns?: string[];
}

export interface RmtKernelSecurityRegressionPanicSequence {
  id: string;
  repeatedBlockThreshold: number;
  verdicts: RmtKernelSecurityRegressionVerdict[];
  expectedState: string;
  expectedTrigger: string;
  expectedRecoveryStatus: string;
}

export interface RmtKernelSecurityRegressionBrowserSmokeScenario {
  id: string;
  sink: string;
  expectedVerdict: RmtKernelSecurityRegressionVerdict;
  artifactTargets: string[];
}

export interface RmtKernelSecurityRegressionFixtureSet {
  schema: typeof RMT_KERNEL_SECURITY_REGRESSION_FIXTURE_SCHEMA;
  regressionSchema: typeof RMT_KERNEL_SECURITY_REGRESSION_SCHEMA;
  workpackage: typeof RMT_KERNEL_SECURITY_REGRESSION_WORKPACKAGE;
  status: string;
  fixtureCategories: string[];
  totalFixtureCount: number;
  maliciousHtmlFragments: RmtKernelSecurityRegressionFixture[];
  maliciousAttributes: RmtKernelSecurityRegressionFixture[];
  maliciousUrls: RmtKernelSecurityRegressionFixture[];
  maliciousProperties: RmtKernelSecurityRegressionFixture[];
  panicSequences: RmtKernelSecurityRegressionPanicSequence[];
  browserSmokeScenarios: RmtKernelSecurityRegressionBrowserSmokeScenario[];
}

export interface RmtKernelSecurityRegressionValidationIssue {
  code: string;
  category?: string;
  id?: string;
  index?: number;
  message: string;
}

export interface RmtKernelSecurityRegressionValidation {
  schema: typeof RMT_KERNEL_SECURITY_REGRESSION_REPORT_SCHEMA;
  regressionSchema: typeof RMT_KERNEL_SECURITY_REGRESSION_SCHEMA;
  fixtureSchema: typeof RMT_KERNEL_SECURITY_REGRESSION_FIXTURE_SCHEMA;
  workpackage: typeof RMT_KERNEL_SECURITY_REGRESSION_WORKPACKAGE;
  ok: boolean;
  issueCount: number;
  issues: RmtKernelSecurityRegressionValidationIssue[];
}

export interface RmtKernelSecurityRegressionArtifactResult {
  artifact: string;
  artifactKind: string;
  unsafeCommitDetected: boolean;
  trustVerdictCount: number;
  blockedCommitCount: number;
  panicState: string;
  panicTrigger: string;
  recoveryStatus: string;
  sanitizedSinks: string[];
  browserSmokeScenarios: string[];
  diagnosticChannels: string[];
}

export interface RmtKernelSecurityRegressionBrowserSmokeResult {
  id: string;
  status: string;
  scenarioCount: number;
  scenarios: string[];
  unsafeCommitDetected: boolean;
}

export interface RmtKernelSecurityRegressionReport {
  schema: typeof RMT_KERNEL_SECURITY_REGRESSION_REPORT_SCHEMA;
  regressionSchema: typeof RMT_KERNEL_SECURITY_REGRESSION_SCHEMA;
  fixtureSchema: typeof RMT_KERNEL_SECURITY_REGRESSION_FIXTURE_SCHEMA;
  browserSmokeSchema: typeof RMT_KERNEL_SECURITY_REGRESSION_BROWSER_SMOKE_SCHEMA;
  workpackage: typeof RMT_KERNEL_SECURITY_REGRESSION_WORKPACKAGE;
  status: RmtKernelSecurityRegressionStatus;
  ok: boolean;
  validation: RmtKernelSecurityRegressionValidation;
  artifactCoverageOk: boolean;
  requiredArtifactCount: number;
  artifactResultCount: number;
  browserSmokeCovered: boolean;
  panicRecoveryCovered: boolean;
  unsafeCommitCount: number;
  artifactResults: RmtKernelSecurityRegressionArtifactResult[];
  browserSmokeResults: RmtKernelSecurityRegressionBrowserSmokeResult[];
  diagnosticChannel: typeof RMT_KERNEL_SECURITY_REGRESSION_DIAGNOSTIC_CHANNEL;
}

export interface RmtKernelSecurityRegressionContract {
  schema: typeof RMT_KERNEL_SECURITY_REGRESSION_SCHEMA;
  fixtureSchema: typeof RMT_KERNEL_SECURITY_REGRESSION_FIXTURE_SCHEMA;
  reportSchema: typeof RMT_KERNEL_SECURITY_REGRESSION_REPORT_SCHEMA;
  browserSmokeSchema: typeof RMT_KERNEL_SECURITY_REGRESSION_BROWSER_SMOKE_SCHEMA;
  workpackage: typeof RMT_KERNEL_SECURITY_REGRESSION_WORKPACKAGE;
  status: string;
  module: typeof RMT_KERNEL_SECURITY_REGRESSION_MODULE_PATH;
  suite: typeof RMT_KERNEL_SECURITY_REGRESSION_SUITE_PATH;
  fixturePath: typeof RMT_KERNEL_SECURITY_REGRESSION_FIXTURE_PATH;
  browserSmoke: typeof RMT_KERNEL_SECURITY_REGRESSION_BROWSER_SMOKE_PATH;
  contract: typeof RMT_KERNEL_SECURITY_REGRESSION_CONTRACT_PATH;
  workpackageDocument: typeof RMT_KERNEL_SECURITY_REGRESSION_WP_PATH;
  localGate: typeof RMT_KERNEL_SECURITY_REGRESSION_LOCAL_GATE;
  packageScript: typeof RMT_KERNEL_SECURITY_REGRESSION_PACKAGE_SCRIPT;
  diagnosticChannel: typeof RMT_KERNEL_SECURITY_REGRESSION_DIAGNOSTIC_CHANNEL;
  artifacts: string[];
  fixtureCategories: string[];
  invariants: string[];
  handoff: string[];
}

export declare const DEFAULT_KERNEL_SECURITY_REGRESSION_FIXTURES: RmtToolingConstant;
export declare const KERNEL_SECURITY_REGRESSION_ARTIFACTS: RmtToolingConstant;
export declare const KERNEL_SECURITY_REGRESSION_REQUIRED_CATEGORIES: RmtToolingConstant;
export declare const RMT_KERNEL_SECURITY_REGRESSION_BROWSER_SMOKE_PATH: RmtToolingConstant;
export declare const RMT_KERNEL_SECURITY_REGRESSION_BROWSER_SMOKE_SCHEMA: RmtToolingConstant;
export declare const RMT_KERNEL_SECURITY_REGRESSION_CONTRACT_PATH: RmtToolingConstant;
export declare const RMT_KERNEL_SECURITY_REGRESSION_DIAGNOSTIC_CHANNEL: RmtToolingConstant;
export declare const RMT_KERNEL_SECURITY_REGRESSION_FIXTURE_PATH: RmtToolingConstant;
export declare const RMT_KERNEL_SECURITY_REGRESSION_FIXTURE_SCHEMA: RmtToolingConstant;
export declare const RMT_KERNEL_SECURITY_REGRESSION_LOCAL_GATE: RmtToolingConstant;
export declare const RMT_KERNEL_SECURITY_REGRESSION_MODULE_PATH: RmtToolingConstant;
export declare const RMT_KERNEL_SECURITY_REGRESSION_PACKAGE_SCRIPT: RmtToolingConstant;
export declare const RMT_KERNEL_SECURITY_REGRESSION_REPORT_SCHEMA: RmtToolingConstant;
export declare const RMT_KERNEL_SECURITY_REGRESSION_SCHEMA: RmtToolingConstant;
export declare const RMT_KERNEL_SECURITY_REGRESSION_SUITE_PATH: RmtToolingConstant;
export declare const RMT_KERNEL_SECURITY_REGRESSION_WORKPACKAGE: RmtToolingConstant;
export declare const RMT_KERNEL_SECURITY_REGRESSION_WP_PATH: RmtToolingConstant;
export declare const createKernelSecurityRegressionContract: RmtToolingFactory;
export declare const createKernelSecurityRegressionFixtures: RmtToolingFactory;
export declare const createKernelSecurityRegressionReport: RmtToolingFactory;
export declare const redactUnsafePayload: RmtToolingFunction;
export declare const serializeKernelSecurityRegressionContract: RmtToolingFunction;
export declare const serializeKernelSecurityRegressionReport: RmtToolingFunction;
export declare const validateKernelSecurityRegressionFixtures: RmtToolingFunction;
