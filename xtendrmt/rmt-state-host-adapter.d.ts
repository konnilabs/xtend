export const RMT_STATE_HOST_ADAPTER_SCHEMA: 'xtend.rmt.state-host-adapter.v1';
export const RMT_STATE_PROJECTION_PORT_SCHEMA: 'xtend.rmt.state-projection-port.v1';

export interface RmtStateProjectionWrite {
  key: string;
  value: unknown;
  mirrored: boolean;
  batched?: boolean;
  metadata: Record<string, unknown>;
}

export interface RmtStateProjectionRead {
  key: string;
  hit: boolean;
}

export interface RmtStateProjectionPort {
  readonly portSchema: typeof RMT_STATE_PROJECTION_PORT_SCHEMA;
  readonly external: boolean;
  batchUpdate(updates: Record<string, unknown>, metadata?: Record<string, unknown>): boolean;
}

export interface RmtStateHostTarget {
  batchUpdate?(updates: Record<string, unknown>): unknown;
  set?(key: string, value: unknown): unknown;
  setState?(key: string, value: unknown): unknown;
  get?(key: string): unknown;
  getState?(key: string): unknown;
  subscribe?(listener: (event: unknown) => void): (() => void) | { unsubscribe(): void };
}

export interface RmtStateHostAdapterOptions {
  target?: RmtStateHostTarget | null;
  strict?: boolean;
  strictMaraca?: boolean;
}

export interface RmtStateHostAdapter extends RmtStateProjectionPort {
  readonly schema: 'xtend.epic18.rmt-state-selector-runtime.v2';
  readonly adapterSchema: typeof RMT_STATE_HOST_ADAPTER_SCHEMA;
  readonly strict: boolean;
  set(key: string, value: unknown, metadata?: Record<string, unknown>): boolean;
  get<T = unknown>(key: string, fallbackValue?: T): T;
  subscribe(listener: (event: unknown) => void): () => void;
  listWrites(): RmtStateProjectionWrite[];
  listReads(): RmtStateProjectionRead[];
  mirrorSnapshot(
    snapshot: {
      states?: Record<string, unknown>;
      selectors?: Record<string, unknown>;
      derived?: Record<string, unknown>;
    },
    metadata?: Record<string, unknown>
  ): boolean;
}

export type RmtStateProjectionPortFactory = (
  options?: RmtStateHostAdapterOptions
) => RmtStateProjectionPort;

export function createRmtStateHostAdapter(options?: RmtStateHostAdapterOptions): RmtStateHostAdapter;

declare const api: {
  RMT_STATE_PROJECTION_PORT_SCHEMA: typeof RMT_STATE_PROJECTION_PORT_SCHEMA;
  RMT_STATE_HOST_ADAPTER_SCHEMA: typeof RMT_STATE_HOST_ADAPTER_SCHEMA;
  createRmtStateHostAdapter: typeof createRmtStateHostAdapter;
};

export default api;
