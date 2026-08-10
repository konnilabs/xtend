export declare const RMT_APP_HOST_PORT_SCHEMA: 'xtend.rmt.app-host-port.v1';
export declare const RMT_SEARCH_WORKER_SCHEMA: 'xtend.rmt.prewarm-search-worker.v1';

export interface RmtSearchPrewarmWorkerPort {
  readonly schema: typeof RMT_SEARCH_WORKER_SCHEMA;
  readonly available: boolean;
  dispatchSearchEnvelope(envelope?: Readonly<Record<string, unknown>>): Promise<Record<string, unknown>>;
  terminate(reason?: string): void;
  snapshot(): Readonly<Record<string, unknown>>;
}

export interface RmtAppHostPort {
  readonly schema: typeof RMT_APP_HOST_PORT_SCHEMA;
  now(): number;
  nowIso(clockOverride?: (() => string | number | Date) | null): string;
  createId(prefix?: string): string;
  schedule(task: () => void, metadata?: Readonly<Record<string, unknown>>): unknown;
  createSearchWorker(input: {
    source: string;
    workerName?: string;
    workerType?: string;
  }): RmtSearchPrewarmWorkerPort;
}

export interface RmtAppHostAdapterOptions {
  hostTarget?: object;
  windowTarget?: object;
  performanceTarget?: { now(): number };
  cryptoTarget?: { randomUUID?(): string };
  Worker?: new (url: string, options?: Record<string, unknown>) => unknown;
  Blob?: new (parts?: unknown[], options?: Record<string, unknown>) => unknown;
  URL?: { createObjectURL(value: unknown): string; revokeObjectURL?(url: string): void };
  setTimeout?: (task: () => void, delayMs?: number) => unknown;
  schedule?: (task: () => void, metadata?: Readonly<Record<string, unknown>>) => unknown;
  clock?: () => string | number | Date;
  now?: () => number;
  random?: () => number;
}

export declare function createRmtAppHostAdapter(options?: RmtAppHostAdapterOptions): RmtAppHostPort;

declare const api: {
  RMT_APP_HOST_PORT_SCHEMA: typeof RMT_APP_HOST_PORT_SCHEMA;
  RMT_SEARCH_WORKER_SCHEMA: typeof RMT_SEARCH_WORKER_SCHEMA;
  createRmtAppHostAdapter: typeof createRmtAppHostAdapter;
};

export default api;
