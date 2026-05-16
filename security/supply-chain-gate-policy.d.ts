export * from '../fabric/xtend-policy-public-types';
import type {
  XtendPolicyConstant,
  XtendPolicyReport
} from '../fabric/xtend-policy-public-types';

export interface XtendSupplyChainGatePlan {
  schema: string;
  releaseGate: string;
  localGate: string;
  localCommands: string[];
  ciNetworkGates: string[];
  gates: Record<string, unknown>;
  dependencySections: string[];
  lockfileCandidates: string[];
  scopedReleasePackages: Array<{ name: string; path: string; manifest: string; scope: string }>;
  license: Record<string, unknown>;
  vulnerabilities: Record<string, unknown>;
  publishBoundary: Record<string, unknown>;
}

export interface XtendPackageSupplyChainReport extends XtendPolicyReport {
  dependencyCount: number;
  dependencies: Array<{ section: string; name: string; version: string }>;
  lockfiles: string[];
  hasLockfile: boolean;
  privatePackage: boolean;
  publicRcPackage: boolean;
  packageLicense: string | null;
}

export declare const DEPENDENCY_AUDIT_GATE_CONTRACT: XtendPolicyConstant<string>;
export declare const DEPENDENCY_SECTIONS: XtendPolicyConstant<string[]>;
export declare const LICENSE_POLICY: XtendPolicyConstant<Record<string, unknown>>;
export declare const LICENSE_POLICY_CONTRACT: XtendPolicyConstant<string>;
export declare const LOCKFILE_CANDIDATES: XtendPolicyConstant<string[]>;
export declare const SCOPED_RELEASE_PACKAGES: XtendPolicyConstant<Array<{ name: string; path: string; manifest: string; scope: string }>>;
export declare const RELEASE_SUPPLY_CHAIN_GATE_CONTRACT: XtendPolicyConstant<string>;
export declare const SUPPLY_CHAIN_GATE_PLAN_CONTRACT: XtendPolicyConstant<string>;
export declare const SUPPLY_CHAIN_GATES: XtendPolicyConstant<Record<string, unknown>>;
export declare const VULNERABILITY_POLICY: XtendPolicyConstant<Record<string, unknown>>;
export declare const VULNERABILITY_POLICY_CONTRACT: XtendPolicyConstant<string>;
export declare function classifyPackageSupplyChain(packageManifest?: Record<string, unknown>, lockfiles?: string[]): XtendPackageSupplyChainReport;
export declare function createSupplyChainGatePlan(): XtendSupplyChainGatePlan;
export declare function listDependencies(packageManifest?: Record<string, unknown>): Array<{ section: string; name: string; version: string }>;
