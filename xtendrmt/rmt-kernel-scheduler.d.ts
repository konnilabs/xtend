export declare const RMT_KERNEL_SCHEDULER_SCHEMA: 'xtend.rmt.kernel-scheduler.v1';
export declare const RMT_KERNEL_WORK_REQUEST_SCHEMA: 'xtend.rmt.kernel-work.v1';
export declare const RMT_KERNEL_JOB_SCHEMA: 'xtend.rmt.kernel-job.v1';
export declare const RMT_KERNEL_JOB_EVENT_SCHEMA: 'xtend.rmt.kernel-job-event.v1';

export type RmtSchedulerLane = 'user-blocking' | 'visible' | 'transition' | 'idle' | 'background' | 'diagnostics';
export type RmtSchedulerJobStatus = 'queued' | 'running' | 'waiting' | 'yielded' | 'completed' | 'failed' | 'cancelled' | 'aborted' | 'panic_blocked';

export interface RmtKernelWorkRequest {
  readonly schema?: typeof RMT_KERNEL_WORK_REQUEST_SCHEMA;
  readonly id?: string;
  readonly endpointName?: string;
  readonly endpoint?: string;
  readonly scope?: string;
  readonly rootId?: string;
  readonly lane?: RmtSchedulerLane | string;
  readonly priority?: number;
  readonly deadlineMs?: number;
  readonly timeoutMs?: number;
  readonly delayMs?: number;
  readonly budgetClass?: string;
  readonly maxChunkMs?: number;
  readonly coalesceKey?: string;
  readonly strategy?: 'microtask' | 'after_paint' | 'idle' | string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface RmtJobContext {
  readonly schema: 'xtend.rmt.kernel-job-context.v1';
  readonly jobId: string;
  readonly endpointName: string;
  readonly scope: string;
  readonly rootId: string;
  readonly lane: RmtSchedulerLane;
  readonly priority: number;
  readonly deadlineMs: number;
  readonly budgetClass: string;
  readonly maxChunkMs: number;
  readonly signal: AbortSignal | null;
  readonly metadata: Readonly<Record<string, unknown>>;
  now(): number;
  shouldYield(): boolean;
  yield(reason?: string): Promise<void>;
}

export interface RmtKernelJobSnapshot {
  readonly schema: typeof RMT_KERNEL_JOB_SCHEMA;
  readonly id: string;
  readonly status: RmtSchedulerJobStatus;
  readonly reason: string;
  readonly request: Readonly<RmtKernelWorkRequest>;
  readonly createdAt: number;
  readonly startedAt: number;
  readonly finishedAt: number;
  readonly yieldCount: number;
}

export interface RmtJobHandle<T = unknown> extends PromiseLike<T> {
  readonly schema: typeof RMT_KERNEL_JOB_SCHEMA;
  readonly id: string;
  readonly status: RmtSchedulerJobStatus;
  readonly reason: string;
  readonly result: Promise<T>;
  readonly signal: AbortSignal | null;
  cancel(reason?: string): boolean;
  snapshot(): RmtKernelJobSnapshot;
  catch<TResult = never>(onRejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null): Promise<T | TResult>;
  finally(onFinally?: (() => void) | null): Promise<T>;
}

export interface RmtSchedulerHostPort {
  readonly schema?: string;
  now(): number;
  queueMicrotask?(callback: () => void): unknown;
  setTimeout?(callback: () => void, delayMs: number): unknown;
  clearTimeout?(handle: unknown): void;
  requestAnimationFrame?(callback: FrameRequestCallback): unknown;
  cancelAnimationFrame?(handle: unknown): void;
  requestIdleCallback?(callback: (deadline: IdleDeadline) => void, options?: { timeout?: number }): unknown;
  cancelIdleCallback?(handle: unknown): void;
  postTask?(callback: () => void, options?: { priority?: string }): Promise<unknown> | unknown;
  createAbortController?(): AbortController | null;
}

export interface RmtKernelSchedulerOptions {
  readonly hostPort?: RmtSchedulerHostPort;
  readonly host?: RmtSchedulerHostPort;
  readonly observer?: ((event: Readonly<Record<string, unknown>>) => void) | { onJobEvent(event: Readonly<Record<string, unknown>>): void };
  readonly panicMonitor?: { getSnapshot(): Readonly<Record<string, unknown>> };
  readonly isPanicBlocked?: (request: Readonly<RmtKernelWorkRequest>) => boolean;
  readonly strict?: boolean;
  readonly allowLegacyLanes?: boolean;
  readonly preferPostTask?: boolean;
  readonly globalTarget?: unknown;
}

export interface RmtKernelScheduler {
  readonly schema: typeof RMT_KERNEL_SCHEDULER_SCHEMA;
  readonly lanes: readonly RmtSchedulerLane[];
  schedule<T>(request: RmtKernelWorkRequest, work: (context: RmtJobContext) => T | PromiseLike<T>): RmtJobHandle<T>;
  scheduleEndpoint<T>(endpointName: string, scope: string, work: (context: RmtJobContext) => T | PromiseLike<T>, request?: RmtKernelWorkRequest): RmtJobHandle<T>;
  updatePressure(input: string | { level?: string }): string;
  getJob(jobId: string): RmtJobHandle | null;
  listDiagnostics(): ReadonlyArray<Readonly<Record<string, unknown>>>;
  snapshot(): Readonly<Record<string, unknown>>;
  dispose(reason?: string): boolean;
}

export declare const RMT_SCHEDULER_LANES: readonly RmtSchedulerLane[];
export declare const RMT_SCHEDULER_JOB_STATUSES: readonly RmtSchedulerJobStatus[];
export declare function createRmtKernelScheduler(options?: RmtKernelSchedulerOptions): RmtKernelScheduler;
