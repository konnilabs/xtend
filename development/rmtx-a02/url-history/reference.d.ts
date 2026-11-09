import type { XTensionStateBindingArtifact, XTensionBindingModelReader } from '../../../tools/xtensions/state-binding';
export const API_VERSION: '1.0.0';
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
  /** Development reference for the synchronous atomic RMT Model port, outside Maraca. */
  applyRestore(plan: RestorePlan, ports: { modelReader: XTensionBindingModelReader; modelCommandPort: { readonly schema: 'xtend.rmt.model-command-port.v1'; apply(operations: { operation: 'set'; state: string; value: unknown }[], metadata?: Record<string,unknown>): unknown } }, lifetime: Lifetime): boolean;
  proposeHistory(snapshot: ReturnType<XTensionBindingModelReader['snapshot']>, context: { cause: HistoryProposal['cause']; currentToken: string | null; navigationId: string }): HistoryProposal;
  checkHistory(proposal: HistoryProposal, snapshot: ReturnType<XTensionBindingModelReader['snapshot']>, lifetime: Lifetime): boolean;
};
export function readQuery(query: string): string | null;
export function withToken(query: string, token: string | null): string;
export function canonical(value: unknown): string;
