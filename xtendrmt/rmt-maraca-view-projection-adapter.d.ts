import type { RmtDomDescriptorRenderer } from './rmt-dom-descriptor-renderer.js';

export const RMT_MARACA_VIEW_PROJECTION_ADAPTER_API_VERSION: '2.0.0';
export const RMT_MARACA_VIEW_PROJECTION_ADAPTER_SCHEMA: 'xtend.rmt.maraca-view-projection-adapter.v2';
export const RMT_MARACA_VIEW_PROJECTION_ADAPTER_LEGACY_SCHEMA: 'xtend.rmt.maraca-view-projection-adapter.v1';
export const RMT_MARACA_SURFACE_LIFECYCLE_PROJECTION_SCHEMA: 'xtend.rmt.maraca-surface-lifecycle-projection.v1';
export const RMT_MARACA_VIEW_PROJECTION_DIAGNOSTIC_SCHEMA: 'xtend.rmt.maraca-view-projection-diagnostic.v1';

export interface LegacyMaracaViewProjectionPort {
  readonly schema: string;
  validateRoot(): Readonly<{ schema: string; valid: true }>;
  getDocumentTarget(): Document | null;
  readChildNodes(target?: ParentNode): Node[];
  reindexSurfaces(): Readonly<{ schema: string; count: number; surfaceIds: readonly string[] }>;
  resolveSurface(surfaceId: string): Element | null;
  resolveField(fieldId: string): Element | null;
  resolveTarget(target: Readonly<{ surface?: string; field?: string }>): Element | null;
  resolveBindingTarget(binding: Readonly<Record<string, unknown>>, root?: ParentNode): EventTarget | null;
  dispatchHostEvent(name: string, detail?: unknown): boolean;
  clearOwnedDom(): boolean;
  resetSurfaceIndex(): boolean;
  snapshot(): Readonly<Record<string, unknown>>;
  listDiagnostics(): ReadonlyArray<Readonly<Record<string, unknown>>>;
  dispose(): boolean;
}

export interface MaracaSurfaceLifecycleRecord {
  readonly id: string;
  readonly status: 'open' | 'closed' | 'minimized' | 'destroying' | 'destroyed';
  readonly generation?: number;
  readonly minimized?: boolean;
  readonly collapsed?: boolean;
}
export interface MaracaSurfaceLifecycleProjectionInput {
  readonly phase?: 'prepare' | 'project';
  readonly renderer: Pick<RmtDomDescriptorRenderer, 'commit' | 'dispose'>;
  readonly ownership?: Readonly<Record<string, unknown>>;
  readonly context?: Readonly<Record<string, unknown>>;
}
export interface MaracaSurfaceLifecycleProjectionReport {
  readonly schema: typeof RMT_MARACA_SURFACE_LIFECYCLE_PROJECTION_SCHEMA;
  readonly phase: 'prepare' | 'project';
  readonly projected: number;
  readonly hidden: number;
  readonly restored: number;
  readonly removed: number;
  readonly retained: number;
  readonly surfaceIds: readonly string[];
}
export interface MaracaViewProjectionPort extends LegacyMaracaViewProjectionPort {
  /** prepare removes only the lifecycle overlay before a normal View commit;
   * project reapplies Controller visibility against the newly committed View. */
  projectSurfaceLifecycle(snapshot: Readonly<{ surfaces: readonly MaracaSurfaceLifecycleRecord[] }>, input: MaracaSurfaceLifecycleProjectionInput): Readonly<MaracaSurfaceLifecycleProjectionReport>;
}
export interface RmtMaracaViewProjectionAdapterOptions {
  /** Explicit v1 preserves the legacy factory/port; v2 is the default. */
  adapterSchema?: typeof RMT_MARACA_VIEW_PROJECTION_ADAPTER_SCHEMA | typeof RMT_MARACA_VIEW_PROJECTION_ADAPTER_LEGACY_SCHEMA;
  root: ParentNode & { replaceChildren(...nodes: Node[]): void };
  documentTarget?: Document | null;
  windowTarget?: (Window & typeof globalThis) | Window | null;
  publishDiagnostic?(diagnostic: Readonly<Record<string, unknown>>): unknown;
}

export interface RmtMaracaViewProjectionAdapter extends MaracaViewProjectionPort {
  readonly schema: typeof RMT_MARACA_VIEW_PROJECTION_ADAPTER_SCHEMA;
}

export interface RmtMaracaLegacyViewProjectionAdapter extends LegacyMaracaViewProjectionPort {
  readonly schema: typeof RMT_MARACA_VIEW_PROJECTION_ADAPTER_LEGACY_SCHEMA;
}
export function createRmtMaracaViewProjectionAdapter(
  options: RmtMaracaViewProjectionAdapterOptions & { adapterSchema: typeof RMT_MARACA_VIEW_PROJECTION_ADAPTER_LEGACY_SCHEMA }
): RmtMaracaLegacyViewProjectionAdapter;
export function createRmtMaracaViewProjectionAdapter(
  options: RmtMaracaViewProjectionAdapterOptions & { adapterSchema?: typeof RMT_MARACA_VIEW_PROJECTION_ADAPTER_SCHEMA }
): RmtMaracaViewProjectionAdapter;
export function createRmtMaracaViewProjectionAdapter(
  options: RmtMaracaViewProjectionAdapterOptions
): RmtMaracaViewProjectionAdapter | RmtMaracaLegacyViewProjectionAdapter;

declare const api: Readonly<{
  RMT_MARACA_VIEW_PROJECTION_ADAPTER_API_VERSION: typeof RMT_MARACA_VIEW_PROJECTION_ADAPTER_API_VERSION;
  RMT_MARACA_VIEW_PROJECTION_ADAPTER_LEGACY_SCHEMA: typeof RMT_MARACA_VIEW_PROJECTION_ADAPTER_LEGACY_SCHEMA;
  RMT_MARACA_SURFACE_LIFECYCLE_PROJECTION_SCHEMA: typeof RMT_MARACA_SURFACE_LIFECYCLE_PROJECTION_SCHEMA;
  RMT_MARACA_VIEW_PROJECTION_ADAPTER_SCHEMA: typeof RMT_MARACA_VIEW_PROJECTION_ADAPTER_SCHEMA;
  RMT_MARACA_VIEW_PROJECTION_DIAGNOSTIC_SCHEMA: typeof RMT_MARACA_VIEW_PROJECTION_DIAGNOSTIC_SCHEMA;
  createRmtMaracaViewProjectionAdapter: typeof createRmtMaracaViewProjectionAdapter;
}>;

export default api;
