import type { RmtKernelScheduler, RmtJobContext, RmtKernelWorkRequest } from '../xtendrmt/rmt-kernel-scheduler.js';
export interface MaracaPresentationToken { readonly owner: object; readonly epoch: number; }
export interface MaracaSuperseded { readonly ok: false; readonly status: 'superseded'; }
export interface MaracaAbortBoundary {
  readonly id: string;
  readonly signal: AbortSignal;
  readonly disposed: boolean;
  readonly active: boolean;
  setActive(value: boolean, reason?: string): boolean;
  capture(): MaracaPresentationToken;
  isCurrent(token: MaracaPresentationToken): boolean;
  invalidate(reason?: string): boolean;
  onInvalidate(listener: (reason: string) => void): () => void;
  dispose(): boolean;
  commit<T>(work: () => T, token?: MaracaPresentationToken): T | MaracaSuperseded;
  scheduleCommit<T>(scheduler: RmtKernelScheduler, work: (context: RmtJobContext) => T | PromiseLike<T>, token?: MaracaPresentationToken, request?: Partial<RmtKernelWorkRequest>): Promise<T | MaracaSuperseded>;
  run<T>(work: (context: { token: MaracaPresentationToken; signal: AbortSignal; isCurrent(): boolean }) => T | PromiseLike<T>, token?: MaracaPresentationToken): Promise<T | MaracaSuperseded>;
}
export function createMaracaAbortBoundary(options?: { id?: string; parent?: MaracaAbortBoundary | null }): MaracaAbortBoundary;
