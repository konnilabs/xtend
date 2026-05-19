export const RMT_SURFACE_RESOURCE_GRAPH_DIAGNOSTIC_SCHEMA: 'xtend.epic18.rmt-surface-resource-graph-diagnostic.v1';
export const RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_SCHEMA: 'xtend.epic18.rmt-surface-resource-graph-runtime.v1';

export type RmtSurfaceKind = 'window' | 'panel' | 'workspace' | 'overlay-host' | 'surface' | string;
export type RmtOverlayKind = 'tooltip' | 'toast' | 'popover' | 'lightbox' | 'menu' | 'dialog' | string;
export type RmtSurfaceState = 'closed' | 'open' | 'minimized' | 'destroyed' | string;

export interface RmtSurfaceBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RmtSurfaceDefinition {
  id: string;
  kind?: RmtSurfaceKind;
  type?: RmtSurfaceKind;
  source?: string;
  from?: string;
  records?: unknown[];
  repeat?: boolean;
  key?: string;
  keyPath?: string;
  owner?: string;
  ownerId?: string;
  component?: string;
  tag?: string;
  template?: unknown;
  portal?: string;
  resources?: string[] | Array<{ id: string }>;
  bounds?: Partial<RmtSurfaceBounds>;
  defaultBounds?: Partial<RmtSurfaceBounds>;
  placement?: string;
  mode?: string;
  initialState?: RmtSurfaceState;
  state?: RmtSurfaceState;
  persistent?: boolean;
  closeReleasesResources?: boolean;
  destroyOnClose?: boolean;
  focusOnOpen?: boolean;
  preserveOnMinimize?: boolean;
}

export interface RmtPortalDefinition {
  id: string;
  root?: string;
  target?: string;
  layer?: string;
  policy?: string;
  focusPolicy?: string;
  pointerPolicy?: string;
  scrollPolicy?: string;
  zIndexStart?: number;
  zStep?: number;
}

export interface RmtOverlayDefinition {
  id: string;
  kind?: RmtOverlayKind;
  type?: RmtOverlayKind;
  portal?: string;
  layer?: string;
  surface?: string;
  resources?: string[] | Array<{ id: string }>;
  dismissible?: boolean;
  singleton?: boolean;
  focusPolicy?: string;
  escapePolicy?: string;
  pointerPolicy?: string;
  scrollPolicy?: string;
  closeReleasesResources?: boolean;
}

export interface RmtSurfaceInstance {
  id: string;
  surfaceId: string;
  kind: RmtSurfaceKind;
  key: string;
  owner: string;
  source: string;
  record: unknown;
  component: string;
  template: unknown;
  portal: string;
  placement: string;
  mode: string;
  persistent: boolean;
  resources: string[];
  resourcesAcquired: boolean;
  state: RmtSurfaceState;
  bounds: RmtSurfaceBounds;
  previousBounds: RmtSurfaceBounds | null;
  minimizedAt: string | null;
  closedAt: string | null;
  destroyedAt: string | null;
  zIndex: number;
  focusOrder: number;
  metadata: Record<string, unknown>;
}

export interface RmtOverlayInstance {
  id: string;
  overlayId: string;
  kind: RmtOverlayKind;
  ownerId: string;
  portal: string;
  layer: string;
  state: 'open' | 'closed' | string;
  dismissible: boolean;
  focusPolicy: string;
  escapePolicy: string;
  pointerPolicy: string;
  scrollPolicy: string;
  zIndex: number;
  resources: string[];
  resourcesAcquired: boolean;
  payload: unknown;
  openedAt: string;
  closedAt: string | null;
}

export interface RmtSurfaceResourceGraphDiagnostic {
  schema: typeof RMT_SURFACE_RESOURCE_GRAPH_DIAGNOSTIC_SCHEMA;
  code: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  details?: Record<string, unknown>;
}

export interface RmtSurfaceResourceGraphSnapshot {
  schema: 'xtend.epic18.rmt-surface-resource-graph-snapshot.v1';
  runtimeSchema: typeof RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_SCHEMA;
  surfaces: Array<Partial<RmtSurfaceInstance> & { id: string }>;
  overlays: RmtOverlayInstance[];
  portals: Array<Record<string, unknown>>;
}

export interface RmtResourceManagerLike {
  acquireMany(resourceIds: string[], ownerId?: string, context?: Record<string, unknown>): Promise<unknown[]> | unknown[];
  releaseOwner(ownerId?: string): { schema?: string; owner?: string; releasedCount: number };
}

export interface RmtEventRuntimeLike {
  detachOwner(ownerId?: string): { schema?: string; owner?: string; detachedCount: number };
}

export interface RmtSurfaceResourceGraphRuntimeOptions {
  surfaces?: RmtSurfaceDefinition[];
  surfaceTemplates?: RmtSurfaceDefinition[];
  surfaceDefinitions?: RmtSurfaceDefinition[];
  overlays?: RmtOverlayDefinition[];
  overlayDefinitions?: RmtOverlayDefinition[];
  portals?: RmtPortalDefinition[];
  resourceManager?: RmtResourceManagerLike;
  eventRuntime?: RmtEventRuntimeLike;
  persistenceAdapter?: {
    save(snapshot: RmtSurfaceResourceGraphSnapshot): unknown;
    load(): RmtSurfaceResourceGraphSnapshot | null | undefined;
  };
  focusAdapter?: { focus(surface: RmtSurfaceInstance, metadata?: Record<string, unknown>): unknown };
  diagnosticsHub?: { publish(channel: string, payload: unknown, meta?: Record<string, unknown>): unknown };
  diagnosticChannel?: string;
}

export interface RmtSurfaceResourceGraphRuntime {
  schema: typeof RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_SCHEMA;
  materialize(recordsBySource?: unknown[] | Record<string, unknown[]>, options?: Record<string, unknown>): {
    schema: 'xtend.epic18.rmt-surface-materialize-report.v1';
    createdCount: number;
    reusedCount: number;
    created: string[];
    reused: string[];
  };
  openSurface(surfaceRef: string, options?: Record<string, unknown>): Promise<RmtSurfaceInstance>;
  closeSurface(surfaceRef: string, metadata?: Record<string, unknown>): RmtSurfaceInstance;
  destroySurface(surfaceRef: string, metadata?: Record<string, unknown>): RmtSurfaceInstance;
  minimizeSurface(surfaceRef: string, metadata?: Record<string, unknown>): RmtSurfaceInstance;
  restoreSurface(surfaceRef: string, metadata?: Record<string, unknown>): RmtSurfaceInstance;
  focusSurface(surfaceRef: string, metadata?: Record<string, unknown>): RmtSurfaceInstance;
  setBounds(surfaceRef: string, bounds: Partial<RmtSurfaceBounds>, metadata?: Record<string, unknown>): RmtSurfaceInstance;
  moveSurface(surfaceRef: string, x: number, y: number): RmtSurfaceInstance;
  resizeSurface(surfaceRef: string, width: number, height: number): RmtSurfaceInstance;
  openOverlay(overlayRef: string, metadata?: Record<string, unknown>): Promise<RmtOverlayInstance>;
  closeOverlay(overlayRef: string, metadata?: Record<string, unknown>): { schema: 'xtend.epic18.rmt-overlay-close-report.v1'; closed: boolean; overlay?: RmtOverlayInstance | string };
  closeTopOverlay(metadata?: Record<string, unknown>): { schema: 'xtend.epic18.rmt-overlay-close-report.v1'; closed: boolean; overlay?: RmtOverlayInstance; reason?: string };
  mountPortal(portalRef: string, target?: unknown): Record<string, unknown>;
  persistSnapshot(): RmtSurfaceResourceGraphSnapshot;
  hydrateSnapshot(snapshot?: RmtSurfaceResourceGraphSnapshot): { schema: 'xtend.epic18.rmt-surface-hydrate-report.v1'; hydratedCount: number };
  getSnapshot(): RmtSurfaceResourceGraphSnapshot;
  getSurface(surfaceRef: string): RmtSurfaceInstance | null;
  listSurfaces(): RmtSurfaceDefinition[];
  listInstances(options?: { includeDestroyed?: boolean }): RmtSurfaceInstance[];
  listOverlays(options?: { includeClosed?: boolean }): RmtOverlayInstance[];
  listPortals(): Array<Record<string, unknown>>;
  listDiagnostics(): RmtSurfaceResourceGraphDiagnostic[];
}

export function createRmtSurfaceResourceGraphRuntime(options?: RmtSurfaceResourceGraphRuntimeOptions): RmtSurfaceResourceGraphRuntime;
