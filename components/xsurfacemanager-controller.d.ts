export declare const SURFACE_CONTROLLER_SCHEMA: 'xtend.surface.controller.v1';
export declare const SURFACE_RECORD_SCHEMA: 'xtend.surface.record.v1';
export declare const SURFACE_SNAPSHOT_SCHEMA: 'xtend.surface.snapshot.v1';
export declare const SURFACE_DIAGNOSTIC_SCHEMA: 'xtend.surface.diagnostic.v1';
export declare const SURFACE_OPERATION_RESULT_SCHEMA: 'xtend.surface.operation-result.v1';

export type XtendSurfaceType = 'window' | 'side-panel' | 'modal' | 'dialog' | 'drawer' | 'popover' | 'tooltip' | 'region' | 'toast' | 'lightbox' | 'menu';
export type XtendSurfaceStatus = 'closed' | 'open' | 'minimized';

export interface XtendSurfaceBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
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
  zIndex: number;
  bounds: XtendSurfaceBounds;
  previousBounds: XtendSurfaceBounds | null;
  capabilities: string[];
  persistence: {
    mode: 'none' | 'memory' | 'session' | 'local';
    key: string | null;
  };
  contentRef: string | null;
  metadataKeys: string[];
  lifecycle: {
    phase: string;
    operation: string;
    lane: string;
    timestamp: string | null;
  };
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
  surfaces: XtendSurfaceRecord[];
  stack: string[];
  diagnostics: XtendSurfaceDiagnostic[];
  updatedAt: string;
  diagnostic?: XtendSurfaceDiagnostic;
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
  diagnostic: XtendSurfaceDiagnostic | null;
}

export interface XtendSurfaceController {
  schema: typeof SURFACE_CONTROLLER_SCHEMA;
  managerId: string;
  stateKey: string;
  stateKeys: Record<string, string>;
  contracts: Record<string, string>;
  registerSurface(record: Partial<XtendSurfaceRecord> | Record<string, unknown>): XtendSurfaceOperationResult;
  openSurface(id: string, input?: { bounds?: Partial<XtendSurfaceBounds> }): XtendSurfaceOperationResult;
  closeSurface(id: string, reason?: string): XtendSurfaceOperationResult;
  focusSurface(id: string): XtendSurfaceOperationResult;
  updateSurface(id: string, patch: Record<string, unknown>): XtendSurfaceOperationResult;
  moveSurface(id: string, bounds: Partial<XtendSurfaceBounds>): XtendSurfaceOperationResult;
  resizeSurface(id: string, bounds: Partial<XtendSurfaceBounds>): XtendSurfaceOperationResult;
  minimizeSurface(id: string): XtendSurfaceOperationResult;
  maximizeSurface(id: string): XtendSurfaceOperationResult;
  restoreSurface(id: string): XtendSurfaceOperationResult;
  materializeSurface(id: string, input?: { bounds?: Partial<XtendSurfaceBounds> }): XtendSurfaceOperationResult;
  toggleSurface(id: string, input?: { bounds?: Partial<XtendSurfaceBounds> }): XtendSurfaceOperationResult;
  snapshot(): XtendSurfaceSnapshot;
  readSnapshot(): XtendSurfaceSnapshot;
  dispose(): XtendSurfaceOperationResult;
}

export interface XtendSurfaceControllerOptions {
  managerId?: string;
  stateKey?: string;
  xstate?: {
    set(key: string, value: unknown): void;
  };
  fabric?: {
    emitDiagnostic?(event: XtendSurfaceDiagnostic): unknown;
    runFiber?(fiber: Record<string, unknown>, callback: () => unknown): unknown;
  };
  now?: () => string | number | Date;
  baseZIndex?: number;
  maxDiagnostics?: number;
}

export declare function normalizeSurfaceBounds(bounds?: Partial<XtendSurfaceBounds>, type?: XtendSurfaceType): XtendSurfaceBounds;
export declare function normalizeSurfaceRecord(record?: Record<string, unknown>, defaults?: { managerId?: string }): XtendSurfaceRecord;
export declare function createSurfaceController(options?: XtendSurfaceControllerOptions): XtendSurfaceController;
