export const RMT_MARACA_VIEW_PROJECTION_ADAPTER_SCHEMA: 'xtend.rmt.maraca-view-projection-adapter.v1';
export const RMT_MARACA_VIEW_PROJECTION_DIAGNOSTIC_SCHEMA: 'xtend.rmt.maraca-view-projection-diagnostic.v1';

export interface MaracaViewProjectionPort {
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

export interface RmtMaracaViewProjectionAdapterOptions {
  root: ParentNode & { replaceChildren(...nodes: Node[]): void };
  documentTarget?: Document | null;
  windowTarget?: (Window & typeof globalThis) | Window | null;
  publishDiagnostic?(diagnostic: Readonly<Record<string, unknown>>): unknown;
}

export interface RmtMaracaViewProjectionAdapter extends MaracaViewProjectionPort {
  readonly schema: typeof RMT_MARACA_VIEW_PROJECTION_ADAPTER_SCHEMA;
}

export function createRmtMaracaViewProjectionAdapter(
  options: RmtMaracaViewProjectionAdapterOptions
): RmtMaracaViewProjectionAdapter;

declare const api: Readonly<{
  RMT_MARACA_VIEW_PROJECTION_ADAPTER_SCHEMA: typeof RMT_MARACA_VIEW_PROJECTION_ADAPTER_SCHEMA;
  RMT_MARACA_VIEW_PROJECTION_DIAGNOSTIC_SCHEMA: typeof RMT_MARACA_VIEW_PROJECTION_DIAGNOSTIC_SCHEMA;
  createRmtMaracaViewProjectionAdapter: typeof createRmtMaracaViewProjectionAdapter;
}>;

export default api;
