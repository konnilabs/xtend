export const RMT_XSTATE_HOST_ADAPTER_SCHEMA: 'xtend.rmt.xstate-host-adapter.v1';
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
  get<T = unknown>(key: string, fallbackValue?: T): T;
  subscribe(listener: (event: unknown) => void): () => void;
  listWrites(): RmtStateProjectionWrite[];
  listReads(): RmtStateProjectionRead[];
}

export interface RmtXStateHostTarget {
  batchUpdate?(updates: Record<string, unknown>): unknown;
  set?(key: string, value: unknown): unknown;
  setState?(key: string, value: unknown): unknown;
  get?(key: string): unknown;
  getState?(key: string): unknown;
  subscribe?(listener: (event: unknown) => void): (() => void) | { unsubscribe(): void };
}

export interface RmtXStateHostAdapterOptions {
  target?: RmtXStateHostTarget | null;
  /** @deprecated Use target. */
  xstate?: RmtXStateHostTarget | null;
  strict?: boolean;
  strictMaraca?: boolean;
}

export interface RmtXStateHostAdapter extends RmtStateProjectionPort {
  readonly schema: 'xtend.epic18.rmt-state-selector-runtime.v2';
  readonly adapterSchema: typeof RMT_XSTATE_HOST_ADAPTER_SCHEMA;
  readonly strict: boolean;
  set(key: string, value: unknown, metadata?: Record<string, unknown>): boolean;
  mirrorSnapshot(
    snapshot: {
      states?: Record<string, unknown>;
      selectors?: Record<string, unknown>;
      derived?: Record<string, unknown>;
    },
    metadata?: Record<string, unknown>
  ): boolean;
}

/** @deprecated 0.6 compatibility name. Use RmtXStateHostAdapter. */
export type RmtXStateBridge = RmtXStateHostAdapter;

export type RmtStateProjectionPortFactory = (
  options?: RmtXStateHostAdapterOptions
) => RmtStateProjectionPort;

export function createRmtXStateHostAdapter(options?: RmtXStateHostAdapterOptions): RmtXStateHostAdapter;
/** @deprecated 0.6 compatibility factory. Use createRmtXStateHostAdapter. */
export function createRmtXStateBridge(options?: RmtXStateHostAdapterOptions): RmtXStateBridge;

declare const api: {
  RMT_STATE_PROJECTION_PORT_SCHEMA: typeof RMT_STATE_PROJECTION_PORT_SCHEMA;
  RMT_XSTATE_HOST_ADAPTER_SCHEMA: typeof RMT_XSTATE_HOST_ADAPTER_SCHEMA;
  createRmtXStateBridge: typeof createRmtXStateBridge;
  createRmtXStateHostAdapter: typeof createRmtXStateHostAdapter;
};

export default api;
