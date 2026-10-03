import type {
  RmtJobHandle,
  RmtJobContext,
  RmtKernelScheduler,
  RmtKernelSchedulerOptions,
  RmtKernelWorkRequest
} from './rmt-kernel-scheduler.js';

export declare const RMT_BROWSER_SCHEDULER_SCHEMA: 'xtend.rmt.browser-scheduler.v2';

export interface RmtBrowserScheduleOptions extends Record<string, unknown> {
  id?: string;
  kind?: 'idle' | 'after_paint' | 'delay';
  strategy?: string;
  lane?: string;
  priority?: number;
  deadlineMs?: number;
  /** @deprecated Use deadlineMs. */
  timeout?: number;
  timeoutMs?: number;
  delayMs?: number;
  maxChunkMs?: number;
  budgetClass?: string;
  coalesceKey?: string;
  rootId?: string;
  metadata?: Record<string, unknown>;
  schedule?: Record<string, unknown>;
}

export interface RmtBrowserScheduler {
  readonly schema: typeof RMT_BROWSER_SCHEDULER_SCHEMA;
  readonly kernelScheduler: RmtKernelScheduler;
  schedule<T>(request: RmtKernelWorkRequest, callback: (context: RmtJobContext) => T | PromiseLike<T>): RmtJobHandle<T>;
  afterPaint<T>(callback: (context: RmtJobContext) => T | PromiseLike<T>, options?: RmtBrowserScheduleOptions): RmtJobHandle<T>;
  scheduleEndpoint<T>(endpointName: string, scope: string, callback: (context: RmtJobContext) => T | PromiseLike<T>, options?: RmtBrowserScheduleOptions): RmtJobHandle<T>;
  updatePressure(input: string | { level?: string }): string;
  listDiagnostics(): ReadonlyArray<Readonly<Record<string, unknown>>>;
  dispose(reason?: string): boolean;
  snapshot(): Readonly<Record<string, unknown>>;
}

export declare function createRmtBrowserScheduler(options: RmtKernelSchedulerOptions & ({
  windowTarget?: Window;
  kernelScheduler: RmtKernelScheduler;
  scheduler?: never;
} | {
  windowTarget?: Window;
  scheduler: RmtKernelScheduler;
  kernelScheduler?: never;
})): RmtBrowserScheduler;
