import type { XTensionStateBindingArtifact, XTensionProjectionStateBindingArtifact, XTensionNativeStateBindingArtifact, XTensionLifecycleStateBindingArtifact, XTensionBindingModelReader } from './state-binding';
export const API_VERSION: '1.0.0';
export const PROJECTION_URL_STATE_API_VERSION: '2.0.0';
export const NATIVE_URL_STATE_API_VERSION: '3.0.0';
export const PARAMETER: 'xtend-state';
export type Scalar = string | number | boolean | null;
export interface Address { readonly declarationId: string; readonly keys: readonly (string | number)[] }
export interface Policy {
  readonly schema: 'xtend.xtensions.url-state-policy.v1'; readonly id: string; readonly version: number; readonly documentId: string;
  readonly exposure: 'public-url';
  readonly fields: readonly { readonly id: string; readonly surface: string; readonly prop: string; readonly default: Scalar }[];
  readonly limits: { readonly tokenBytes: number; readonly entries: number; readonly valueBytes: number; readonly instances: number };
}
export interface Snapshot {
  readonly schema: 'xtend.xtensions.url-state.v1'; readonly documentId: string; readonly policyId: string; readonly policyVersion: number;
  readonly entries: readonly (Address & { readonly values: Readonly<Record<string,Scalar>> })[];
}
export interface RestorePlan {
  readonly schema: 'xtend.xtensions.url-state-restore-plan.v1'; readonly documentId: string; readonly policyId: string; readonly policyVersion: number;
  readonly navigationId: string; readonly status: 'ready' | 'unchanged' | 'deferred';
  readonly changes: readonly (Address & { readonly field: string; readonly previous: Scalar; readonly value: Scalar })[];
  readonly missing: readonly Address[];
}
export interface HistoryProposal {
  readonly schema: 'xtend.xtensions.url-history-proposal.v1'; readonly documentId: string; readonly policyId: string; readonly policyVersion: number;
  readonly navigationId: string; readonly parameter: 'xtend-state'; readonly mode: 'none' | 'replace' | 'push';
  readonly cause: 'initialize' | 'commit' | 'checkpoint' | 'traverse' | 'reset'; readonly token: string | null;
}
export interface Lifetime { navigationId(): string; isCurrent(): boolean; readonly signal?: AbortSignal; isViewCommitted?(): boolean }
export function createURLStateContract(policy: Policy, inputs: { program: unknown; bindings: XTensionStateBindingArtifact }): {
  readonly apiVersion: typeof API_VERSION; readonly policy: Policy;
  dispose(): void;
  capture(snapshot: ReturnType<XTensionBindingModelReader['snapshot']>): Snapshot;
  encode(snapshot: Snapshot): string;
  decode(token: string): Snapshot;
  planRestore(token: string | null, snapshot: ReturnType<XTensionBindingModelReader['snapshot']>, context: { navigationId: string }): RestorePlan;
  /** Synchronous sealed planning seam; managed hosts enter through Maraca.restoreURLState(). */
  applyRestore(plan: RestorePlan, ports: { modelReader: XTensionBindingModelReader; modelCommandPort: { readonly schema: 'xtend.rmt.model-command-port.v1'; apply(operations: { operation: 'set'; state: string; value: unknown }[], metadata?: Record<string,unknown>): unknown } }, lifetime: Lifetime): boolean;
  proposeHistory(snapshot: ReturnType<XTensionBindingModelReader['snapshot']>, context: { cause: HistoryProposal['cause']; currentToken: string | null; navigationId: string }): HistoryProposal;
  checkHistory(proposal: HistoryProposal, snapshot: ReturnType<XTensionBindingModelReader['snapshot']>, lifetime: Lifetime): boolean;
};
export function readQuery(query: string): string | null;
export function withToken(query: string, token: string | null): string;
export function canonical(value: unknown): string;

/** Explicit URL profile for direct scalar Model projections in binding artifact v4. */
export interface PolicyV2 extends Omit<Policy, 'schema'> { readonly schema: 'xtend.xtensions.url-state-policy.v2' }
export interface SnapshotV2 extends Omit<Snapshot, 'schema'> { readonly schema: 'xtend.xtensions.url-state.v2' }
export interface RestorePlanV2 extends Omit<RestorePlan, 'schema'> { readonly schema: 'xtend.xtensions.url-state-restore-plan.v2' }
export interface HistoryProposalV2 extends Omit<HistoryProposal, 'schema'> { readonly schema: 'xtend.xtensions.url-history-proposal.v2' }
export interface ProjectionURLStateContract {
  readonly apiVersion: typeof PROJECTION_URL_STATE_API_VERSION; readonly policy: PolicyV2;
  dispose(): void;
  capture(snapshot: ReturnType<XTensionBindingModelReader['snapshot']>): SnapshotV2;
  encode(snapshot: SnapshotV2): string;
  decode(token: string): SnapshotV2;
  planRestore(token: string | null, snapshot: ReturnType<XTensionBindingModelReader['snapshot']>, context: { navigationId: string }): RestorePlanV2;
  /** Reuses the atomic Model writer, typed keys, navigation fences and commit barrier. */
  applyRestore(plan: RestorePlanV2, ports: Parameters<ReturnType<typeof createURLStateContract>['applyRestore']>[1], lifetime: Lifetime): boolean;
  proposeHistory(snapshot: ReturnType<XTensionBindingModelReader['snapshot']>, context: { cause: HistoryProposalV2['cause']; currentToken: string | null; navigationId: string }): HistoryProposalV2;
  checkHistory(proposal: HistoryProposalV2, snapshot: ReturnType<XTensionBindingModelReader['snapshot']>, lifetime: Lifetime): boolean;
}
export interface ProjectionURLStateRuntime {
  readonly API_VERSION: typeof PROJECTION_URL_STATE_API_VERSION;
  readonly PARAMETER: typeof PARAMETER;
  createURLStateContract(policy: PolicyV2, inputs: { program: unknown; bindings: XTensionProjectionStateBindingArtifact }): ProjectionURLStateContract;
  readQuery(query: string): string | null;
  /** Accepts only the explicitly versioned 2. token envelope. */
  withToken(query: string, token: string | null): string;
  canonical(value: unknown): string;
}
export const PROJECTION_URL_STATE_RUNTIME: Readonly<ProjectionURLStateRuntime>;

/** Native program3/artifact5 retain the same URL2 wire data and scalar write rules. */
export interface NativeURLStateContract extends Omit<ProjectionURLStateContract, 'apiVersion'> {
  readonly apiVersion: typeof NATIVE_URL_STATE_API_VERSION;
}
export interface NativeURLStateRuntime extends Omit<ProjectionURLStateRuntime, 'API_VERSION' | 'createURLStateContract'> {
  readonly API_VERSION: typeof NATIVE_URL_STATE_API_VERSION;
  createURLStateContract(policy: PolicyV2, inputs: { program: unknown; bindings: XTensionNativeStateBindingArtifact }): NativeURLStateContract;
}
export const NATIVE_URL_STATE_RUNTIME: Readonly<NativeURLStateRuntime>;

/** Program4/artifact6 capability; URL policy, token and restore wires remain v2. */
export const LIFECYCLE_URL_STATE_API_VERSION: '4.0.0';
export interface LifecycleURLStateContract extends Omit<ProjectionURLStateContract, 'apiVersion'> { readonly apiVersion: typeof LIFECYCLE_URL_STATE_API_VERSION }
export interface LifecycleURLStateRuntime extends Omit<ProjectionURLStateRuntime, 'API_VERSION' | 'createURLStateContract'> {
  readonly API_VERSION: typeof LIFECYCLE_URL_STATE_API_VERSION;
  createURLStateContract(policy: PolicyV2, inputs: { program: unknown; bindings: XTensionLifecycleStateBindingArtifact }): LifecycleURLStateContract;
}
export const LIFECYCLE_URL_STATE_RUNTIME: Readonly<LifecycleURLStateRuntime>;

/** Program5/artifact7 retain URL2 policy/token/wire formats. */
export const ORCHESTRATED_URL_STATE_API_VERSION: '5.0.0';
export interface OrchestratedURLStateContract extends Omit<ProjectionURLStateContract, 'apiVersion'> {readonly apiVersion: typeof ORCHESTRATED_URL_STATE_API_VERSION}
export interface OrchestratedURLStateRuntime extends Omit<ProjectionURLStateRuntime, 'API_VERSION' | 'createURLStateContract'> {
 readonly API_VERSION: typeof ORCHESTRATED_URL_STATE_API_VERSION;
 createURLStateContract(policy: PolicyV2, inputs: {program: unknown; bindings: import('./state-binding-artifact').XTensionOrchestratedStateBindingArtifact}): OrchestratedURLStateContract;
}
export const ORCHESTRATED_URL_STATE_RUNTIME: Readonly<OrchestratedURLStateRuntime>;
