export const SURFACE_CONTROLLER_SCHEMA = 'xtend.surface.controller.v2' as const;
export const SURFACE_MANAGER_SCHEMA = 'xtend.surface.manager.v1' as const;
export const SURFACE_RECORD_SCHEMA = 'xtend.surface.record.v1' as const;
export const SURFACE_SNAPSHOT_SCHEMA = 'xtend.surface.snapshot.v1' as const;
export const SURFACE_DIAGNOSTIC_SCHEMA = 'xtend.surface.diagnostic.v1' as const;
export const SURFACE_OPERATION_RESULT_SCHEMA = 'xtend.surface.operation-result.v1' as const;
export const SURFACE_APPLY_RESULT_SCHEMA = 'xtend.surface.apply-result.v1' as const;

export type XtendSurfaceType =
  | 'window'
  | 'side-panel'
  | 'modal'
  | 'dialog'
  | 'drawer'
  | 'popover'
  | 'tooltip'
  | 'region'
  | 'toast'
  | 'lightbox'
  | 'menu';

export type XtendSurfaceStatus = 'closed' | 'open' | 'minimized' | 'destroying' | 'destroyed';
export type XtendSurfacePersistenceMode = 'none' | 'memory' | 'session' | 'local';

export interface XtendSurfaceBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
}

export interface XtendSurfaceLifecycle {
  phase: string;
  operation: string;
  lane: string;
  timestamp: string | null;
}

export interface XtendSurfacePersistence {
  mode: XtendSurfacePersistenceMode;
  key: string | null;
}

export interface XtendSurfaceRecord {
  schema: typeof SURFACE_RECORD_SCHEMA;
  id: string;
  manager: string;
  type: XtendSurfaceType;
  kind?: string | null;
  label: string;
  stateKey: string;
  status: XtendSurfaceStatus;
  active: boolean;
  minimized: boolean;
  maximized: boolean;
  pinned: boolean;
  collapsed: boolean;
  modal: boolean;
  placement: string | null;
  mode: string;
  ownershipMode: string | null;
  zIndex: number;
  bounds: XtendSurfaceBounds;
  previousBounds: XtendSurfaceBounds | null;
  generation?: number;
  destroyedAt?: string | null;
  destroyReason?: string | null;
  releasedResources?: string[];
  lastBounds?: XtendSurfaceBounds | null;
  tombstone?: Record<string, unknown> | null;
  capabilities: string[];
  persistence: XtendSurfacePersistence;
  contentRef: string | null;
  metadataKeys: string[];
  lifecycle: XtendSurfaceLifecycle;
}

export interface XtendSurfaceDiagnostic {
  schema: typeof SURFACE_DIAGNOSTIC_SCHEMA;
  code: string;
  severity: 'info' | 'warning' | 'error';
  managerId: string;
  surfaceId: string | null;
  operation: string;
  lane: string;
  message: string;
  timestamp: string;
  detail: Record<string, unknown>;
}

export interface XtendSurfaceSnapshot {
  schema: typeof SURFACE_SNAPSHOT_SCHEMA;
  managerId: string;
  stateKey: string;
  activeSurfaceId: string | null;
  version: number;
  surfaceCount: number;
  openSurfaceCount: number;
  destroyedSurfaceCount?: number;
  surfaces: XtendSurfaceRecord[];
  stack: string[];
  diagnostics: XtendSurfaceDiagnostic[];
  updatedAt: string;
}

export interface XtendSurfaceOperationResult {
  schema: typeof SURFACE_OPERATION_RESULT_SCHEMA;
  ok: boolean;
  managerId: string;
  surfaceId: string | null;
  operation: string;
  code: string | null;
  phase: string | null;
  snapshotVersion: number;
  status?: string;
  generation?: number | null;
  tombstone?: Record<string, unknown> | null;
  diagnostics?: XtendSurfaceDiagnostic[];
  diagnostic: XtendSurfaceDiagnostic | null;
}

export type XtendSurfaceApplyOperation =
  | { operation: 'register' | 'registerSurface'; record: Partial<XtendSurfaceRecord> | Record<string, unknown> }
  | { operation: 'open' | 'openSurface'; id: string; input?: { bounds?: Partial<XtendSurfaceBounds>; recreate?: boolean } }
  | { operation: 'close' | 'closeSurface'; id: string; reason?: string }
  | { operation: 'destroy' | 'destroySurface'; id: string; options?: Record<string, unknown> }
  | { operation: 'focus' | 'focusSurface' | 'minimize' | 'minimizeSurface' | 'maximize' | 'maximizeSurface' | 'restore' | 'restoreSurface'; id: string }
  | { operation: 'update' | 'updateSurface'; id: string; patch?: Record<string, unknown> }
  | { operation: 'move' | 'moveSurface' | 'resize' | 'resizeSurface'; id: string; bounds?: Partial<XtendSurfaceBounds> }
  | { operation: 'materialize' | 'materializeSurface' | 'toggle' | 'toggleSurface'; id: string; input?: Record<string, unknown> };

export interface XtendSurfaceApplyResult {
  schema: typeof SURFACE_APPLY_RESULT_SCHEMA;
  ok: boolean;
  operation: 'apply';
  operationCount: number;
  changed: boolean;
  snapshotVersion: number;
  results: XtendSurfaceOperationResult[];
  diagnostics: XtendSurfaceDiagnostic[];
  snapshot: XtendSurfaceSnapshot;
  metadata: Record<string, unknown>;
}

export interface XtendSurfaceControllerOptions {
  managerId?: string;
  stateKey?: string;
  stateProjection?: XtendSurfaceStateProjectionAdapter;
  fabric?: {
    emitDiagnostic?(event: XtendSurfaceDiagnostic): unknown;
    runFiber?(fiber: Record<string, unknown>, callback: () => unknown): unknown;
  };
  clock?: XtendSurfaceClockPort;
  /** @deprecated Inject `clock` instead. Kept as an explicit 0.6 compatibility alias. */
  now?: () => string | number | Date;
  baseZIndex?: number;
  maxDiagnostics?: number;
}

export interface XtendSurfaceClockPort {
  readonly schema?: string;
  now(): string | number | Date;
}

export interface XtendSurfaceStateProjectionAdapter {
  readonly schema?: string;
  apply(updates: Record<string, unknown>, snapshot: XtendSurfaceSnapshot): unknown;
}

export interface XtendSurfaceController {
  schema: typeof SURFACE_CONTROLLER_SCHEMA;
  managerId: string;
  stateKey: string;
  registerSurface(record: Partial<XtendSurfaceRecord> | Record<string, unknown>): XtendSurfaceOperationResult;
  openSurface(id: string, input?: { bounds?: Partial<XtendSurfaceBounds>; recreate?: boolean }): XtendSurfaceOperationResult;
  closeSurface(id: string, reason?: string): XtendSurfaceOperationResult;
  destroySurface(id: string, options?: Record<string, unknown>): XtendSurfaceOperationResult;
  focusSurface(id: string): XtendSurfaceOperationResult;
  updateSurface(id: string, patch: Record<string, unknown>): XtendSurfaceOperationResult;
  moveSurface(id: string, bounds: Partial<XtendSurfaceBounds>): XtendSurfaceOperationResult;
  resizeSurface(id: string, bounds: Partial<XtendSurfaceBounds>): XtendSurfaceOperationResult;
  minimizeSurface(id: string): XtendSurfaceOperationResult;
  maximizeSurface(id: string): XtendSurfaceOperationResult;
  restoreSurface(id: string): XtendSurfaceOperationResult;
  materializeSurface(id: string, input?: { bounds?: Partial<XtendSurfaceBounds>; recreate?: boolean }): XtendSurfaceOperationResult;
  toggleSurface(id: string, input?: { bounds?: Partial<XtendSurfaceBounds>; recreate?: boolean }): XtendSurfaceOperationResult;
  apply(operations: XtendSurfaceApplyOperation[], metadata?: Record<string, unknown>): XtendSurfaceApplyResult;
  snapshot(options?: Record<string, unknown>): XtendSurfaceSnapshot;
  readSnapshot(options?: Record<string, unknown>): XtendSurfaceSnapshot;
  subscribe(listener: (snapshot: XtendSurfaceSnapshot) => void, options?: { emitCurrent?: boolean }): () => void;
  dispose(): XtendSurfaceOperationResult;
}

export const XTEND_SURFACE_STATE_KEYS = Object.freeze({
  registry: 'xtend.surface.registry',
  active: 'xtend.surface.active',
  state: 'xtend.surface.<surfaceId>.state',
  bounds: 'xtend.surface.<surfaceId>.bounds',
  lifecycle: 'xtend.surface.<surfaceId>.lifecycle',
  diagnostics: 'xtend.surface.diagnostics',
  snapshot: 'xtend.surface.snapshot'
});

export const XTEND_SURFACE_TYPES: readonly XtendSurfaceType[] = Object.freeze([
  'window',
  'side-panel',
  'modal',
  'dialog',
  'drawer',
  'popover',
  'tooltip',
  'region',
  'toast',
  'lightbox',
  'menu'
]);
