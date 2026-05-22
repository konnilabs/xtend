export const RMT_NATIVE_SHELL_REPORT_SCHEMA: 'xtend.mm-rmt.native-shell-report.v1';
export const RMT_NATIVE_SHELL_RUNTIME_SCHEMA: 'xtend.mm-rmt.native-shell-runtime.v1';

export interface RmtNativeShellIsland {
  id: string;
  state: string;
  surfaceId?: string;
  owner?: string;
  nodeCount: number;
  renderCount: number;
  focusOrder?: number;
  lastRenderedAt?: string | null;
}

export interface RmtNativeShellRendererLike {
  renderKeyed(root: unknown, descriptors: unknown[], options?: Record<string, unknown>): unknown[];
}

export interface RmtNativeShellSurfaceRuntimeLike {
  materialize?(recordsBySource?: unknown[] | Record<string, unknown[]>, options?: Record<string, unknown>): {
    createdCount?: number;
    reusedCount?: number;
    created?: string[];
    reused?: string[];
  };
  listInstances?(options?: { includeDestroyed?: boolean }): Array<Record<string, unknown> & { id: string; state?: string }>;
  openSurface(surfaceRef: string, options?: Record<string, unknown>): Promise<Record<string, unknown> & { id: string; state: string }>;
  closeSurface(surfaceRef: string, metadata?: Record<string, unknown>): Record<string, unknown> & { id: string; state: string };
  destroySurface(surfaceRef: string, metadata?: Record<string, unknown>): Record<string, unknown> & { id: string; state: string };
  minimizeSurface(surfaceRef: string, metadata?: Record<string, unknown>): Record<string, unknown> & { id: string; state: string };
  restoreSurface(surfaceRef: string, metadata?: Record<string, unknown>): Record<string, unknown> & { id: string; state: string };
  focusSurface(surfaceRef: string, metadata?: Record<string, unknown>): Record<string, unknown> & { id: string; state: string };
}

export interface RmtNativeShellControllerOptions {
  renderer?: RmtNativeShellRendererLike;
  rendererOptions?: Record<string, unknown>;
  surfaceRuntime?: RmtNativeShellSurfaceRuntimeLike;
  surfaceOptions?: Record<string, unknown>;
  root?: unknown;
  mount?: unknown;
  descriptorFactory?: (instance: Record<string, unknown>, context: Record<string, unknown>) => unknown;
  diagnosticsHub?: { publish(channel: string, payload: unknown, meta?: Record<string, unknown>): unknown };
}

export interface RmtNativeShellReport {
  schema: typeof RMT_NATIVE_SHELL_REPORT_SCHEMA;
  islandId?: string;
  nodeCount?: number;
  instanceCount?: number;
  renderedCount?: number;
  islandIds?: string[];
  materializeReport?: Record<string, unknown>;
  nodes?: unknown[];
  island?: RmtNativeShellIsland;
}

export interface RmtNativeShellController {
  schema: typeof RMT_NATIVE_SHELL_RUNTIME_SCHEMA;
  renderer: RmtNativeShellRendererLike | null;
  surfaceRuntime: RmtNativeShellSurfaceRuntimeLike | null;
  renderIsland(islandRef: string | { id: string }, root: unknown, descriptors: unknown | unknown[], options?: Record<string, unknown>): RmtNativeShellReport;
  renderIsland(islandRef: string | { id: string }, descriptors: unknown | unknown[], options?: Record<string, unknown>): RmtNativeShellReport;
  syncSurfaces(recordsBySource?: unknown[] | Record<string, unknown[]>, options?: Record<string, unknown>): RmtNativeShellReport;
  materializeAndRender(recordsBySource?: unknown[] | Record<string, unknown[]>, options?: Record<string, unknown>): RmtNativeShellReport;
  openSurface(surfaceRef: string, metadata?: Record<string, unknown>): Promise<Record<string, unknown> & { id: string; state: string }>;
  closeSurface(surfaceRef: string, metadata?: Record<string, unknown>): Record<string, unknown> & { id: string; state: string };
  minimizeSurface(surfaceRef: string, metadata?: Record<string, unknown>): Record<string, unknown> & { id: string; state: string };
  restoreSurface(surfaceRef: string, metadata?: Record<string, unknown>): Record<string, unknown> & { id: string; state: string };
  focusSurface(surfaceRef: string, metadata?: Record<string, unknown>): Record<string, unknown> & { id: string; state: string };
  destroySurface(surfaceRef: string, metadata?: Record<string, unknown>): Record<string, unknown> & { id: string; state: string };
  getIsland(islandRef: string): RmtNativeShellIsland | null;
  listIslands(): RmtNativeShellIsland[];
  listDiagnostics(): Array<Record<string, unknown>>;
}

export function createRmtNativeShellController(options?: RmtNativeShellControllerOptions): RmtNativeShellController;
