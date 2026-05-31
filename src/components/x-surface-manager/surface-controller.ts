import {
  SURFACE_CONTROLLER_SCHEMA,
  SURFACE_DIAGNOSTIC_SCHEMA,
  SURFACE_OPERATION_RESULT_SCHEMA,
  SURFACE_RECORD_SCHEMA,
  SURFACE_SNAPSHOT_SCHEMA,
  XTEND_SURFACE_STATE_KEYS,
  XtendSurfaceBounds,
  XtendSurfaceController,
  XtendSurfaceControllerOptions,
  XtendSurfaceDiagnostic,
  XtendSurfaceOperationResult,
  XtendSurfaceRecord,
  XtendSurfaceSnapshot,
  XtendSurfaceType
} from './surface-record';
import {
  mergeSurfaceBounds,
  normalizeSurfaceBounds,
  normalizeSurfaceType,
  toFiniteNumber
} from './surface-layout';

const DEFAULT_CAPABILITIES: Readonly<Record<XtendSurfaceType, readonly string[]>> = Object.freeze({
  window: Object.freeze(['open', 'focus', 'close', 'move', 'resize', 'minimize', 'maximize', 'restore', 'snapshot']),
  'side-panel': Object.freeze(['open', 'focus', 'close', 'dock', 'collapse', 'resize', 'minimize', 'restore', 'snapshot']),
  modal: Object.freeze(['open', 'focus', 'close', 'snapshot']),
  dialog: Object.freeze(['open', 'focus', 'close', 'snapshot']),
  drawer: Object.freeze(['open', 'focus', 'close', 'resize', 'restore', 'snapshot']),
  popover: Object.freeze(['open', 'focus', 'close', 'snapshot']),
  tooltip: Object.freeze(['open', 'close', 'snapshot']),
  region: Object.freeze(['open', 'focus', 'close', 'update', 'restore', 'snapshot']),
  toast: Object.freeze(['open', 'close', 'dismiss', 'snapshot']),
  lightbox: Object.freeze(['open', 'focus', 'close', 'snapshot']),
  menu: Object.freeze(['open', 'focus', 'close', 'update', 'snapshot'])
});

function nowIso(nowProvider?: () => string | number | Date): string {
  if (nowProvider) {
    const value = nowProvider();
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'number') return new Date(value).toISOString();
    if (typeof value === 'string' && value) return value;
  }
  return new Date().toISOString();
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function stateKey(pattern: string, surfaceId: string): string {
  return pattern.replace('<surfaceId>', surfaceId);
}

function operationLane(operation: string): string {
  if (['move', 'resize', 'update', 'restore', 'maximize'].includes(operation)) return 'transition';
  if (['snapshot', 'dispose'].includes(operation)) return 'diagnostics';
  if (operation === 'register') return 'visible';
  return 'user-blocking';
}

function surfaceSource(input: Record<string, unknown>): Record<string, unknown> {
  const metadata = input.metadata as Record<string, unknown> | undefined;
  const surface = metadata && metadata.surface as Record<string, unknown> | undefined;
  return surface || input;
}

export function normalizeSurfaceRecord(input: Record<string, unknown>, managerId: string): XtendSurfaceRecord {
  const source = surfaceSource(input);
  const type = normalizeSurfaceType(source.type || input.type);
  const id = String(source.surfaceId || source.id || input.surfaceId || input.id || '').trim();
  const props = input.props as Record<string, unknown> | undefined;
  const metadata = input.metadata as Record<string, unknown> | undefined;
  const initialBounds =
    source.initialBounds as Partial<XtendSurfaceBounds> ||
    source.bounds as Partial<XtendSurfaceBounds> ||
    input.initialBounds as Partial<XtendSurfaceBounds> ||
    input.bounds as Partial<XtendSurfaceBounds> ||
    {};
  const capabilities = Array.isArray(source.capabilities) ? source.capabilities as string[] : [];

  return {
    schema: SURFACE_RECORD_SCHEMA,
    id,
    manager: String(source.manager || input.manager || managerId),
    type,
    kind: String(source.kind || input.kind || type),
    label: String(source.label || input.label || props && props.label || id || type),
    stateKey: String(source.stateKey || input.stateKey || `xtend.surface.${id || 'unidentified'}.state`),
    status: source.defaultOpen === true || input.open === true ? 'open' : 'closed',
    active: false,
    minimized: false,
    maximized: false,
    pinned: source.pinned === true || input.pinned === true,
    collapsed: source.collapsed === true || input.collapsed === true,
    modal: source.modal === true || input.modal === true || type === 'modal' || type === 'dialog',
    placement: String(source.placement || input.placement || (type === 'side-panel' ? 'right' : '')) || null,
    mode: String(source.mode || input.mode || (type === 'side-panel' ? 'docked' : 'floating')),
    zIndex: toFiniteNumber(source.zIndex || input.zIndex, 0),
    bounds: normalizeSurfaceBounds(initialBounds, type),
    previousBounds: null,
    capabilities: unique([...(DEFAULT_CAPABILITIES[type] || DEFAULT_CAPABILITIES.window), ...capabilities]),
    persistence: {
      mode: 'none',
      key: null
    },
    contentRef: String(source.content || source.component || input.component || '') || null,
    metadataKeys: Object.keys(metadata || {}).sort(),
    lifecycle: {
      phase: 'declare',
      operation: 'register',
      lane: 'visible',
      timestamp: null
    }
  };
}

export function createSurfaceController(options: XtendSurfaceControllerOptions = {}): XtendSurfaceController {
  const managerId = options.managerId || 'xtend.surface.manager';
  const stateKeyRoot = options.stateKey || XTEND_SURFACE_STATE_KEYS.registry;
  const registry = new Map<string, XtendSurfaceRecord>();
  const diagnostics: XtendSurfaceDiagnostic[] = [];
  const maxDiagnostics = Math.max(1, toFiniteNumber(options.maxDiagnostics, 50));
  let activeSurfaceId: string | null = null;
  let zIndexCursor = Math.max(1, toFiniteNumber(options.baseZIndex, 1000));
  let snapshotVersion = 0;

  function mirror(): void {
    if (!options.xstate || typeof options.xstate.set !== 'function') return;
    const records = Array.from(registry.values());
    options.xstate.set(XTEND_SURFACE_STATE_KEYS.registry, records);
    options.xstate.set(XTEND_SURFACE_STATE_KEYS.active, activeSurfaceId);
    records.forEach((record) => {
      options.xstate!.set(stateKey(XTEND_SURFACE_STATE_KEYS.state, record.id), record);
      options.xstate!.set(stateKey(XTEND_SURFACE_STATE_KEYS.bounds, record.id), record.bounds);
      options.xstate!.set(stateKey(XTEND_SURFACE_STATE_KEYS.lifecycle, record.id), record.lifecycle);
    });
    options.xstate.set(XTEND_SURFACE_STATE_KEYS.diagnostics, diagnostics.slice(-maxDiagnostics));
    options.xstate.set(XTEND_SURFACE_STATE_KEYS.snapshot, buildSnapshot());
  }

  function emit(code: string, record: XtendSurfaceRecord | null, operation: string, message: string, detail: Record<string, unknown> = {}): XtendSurfaceDiagnostic {
    const event: XtendSurfaceDiagnostic = {
      schema: SURFACE_DIAGNOSTIC_SCHEMA,
      code,
      severity: 'info',
      managerId,
      surfaceId: record ? record.id : null,
      operation,
      lane: operationLane(operation),
      message,
      timestamp: nowIso(options.now),
      detail
    };
    diagnostics.push(event);
    while (diagnostics.length > maxDiagnostics) diagnostics.shift();
    options.fabric?.emitDiagnostic?.(event);
    return event;
  }

  function result(operation: string, record: XtendSurfaceRecord | null, ok: boolean, diagnostic: XtendSurfaceDiagnostic | null): XtendSurfaceOperationResult {
    return {
      schema: SURFACE_OPERATION_RESULT_SCHEMA,
      ok,
      managerId,
      surfaceId: record ? record.id : null,
      operation,
      code: diagnostic ? diagnostic.code : null,
      phase: record ? record.lifecycle.phase : null,
      snapshotVersion,
      diagnostic
    };
  }

  function commit(record: XtendSurfaceRecord | null, operation: string, phase: string, code: string, message: string): XtendSurfaceOperationResult {
    snapshotVersion += 1;
    if (record) {
      record.lifecycle = {
        phase,
        operation,
        lane: operationLane(operation),
        timestamp: nowIso(options.now)
      };
    }
    const event = emit(code, record, operation, message);
    mirror();
    return result(operation, record, true, event);
  }

  function activateRecord(record: XtendSurfaceRecord): void {
    if (activeSurfaceId && registry.has(activeSurfaceId)) {
      registry.get(activeSurfaceId)!.active = false;
    }
    record.active = true;
    record.zIndex = ++zIndexCursor;
    activeSurfaceId = record.id;
  }

  function focusRecord(record: XtendSurfaceRecord, operation = 'focus'): void {
    activateRecord(record);
    record.status = 'open';
    record.minimized = false;
    emit('xtend.surface.focused', record, operation, `Surface ${record.id} focused.`);
  }

  function buildSnapshot(): XtendSurfaceSnapshot {
    const surfaces = Array.from(registry.values()).map((record) => ({ ...record, bounds: { ...record.bounds }, lifecycle: { ...record.lifecycle } }));
    const stack = surfaces.filter((record) => record.status === 'open').sort((left, right) => left.zIndex - right.zIndex).map((record) => record.id);
    return {
      schema: SURFACE_SNAPSHOT_SCHEMA,
      managerId,
      stateKey: stateKeyRoot,
      activeSurfaceId,
      version: snapshotVersion,
      surfaceCount: surfaces.length,
      openSurfaceCount: surfaces.filter((record) => record.status === 'open').length,
      surfaces,
      stack,
      diagnostics: diagnostics.slice(-maxDiagnostics),
      updatedAt: nowIso(options.now)
    };
  }

  return {
    schema: SURFACE_CONTROLLER_SCHEMA,
    managerId,
    stateKey: stateKeyRoot,
    registerSurface(input) {
      const record = normalizeSurfaceRecord(input, managerId);
      registry.set(record.id, record);
      return commit(record, 'register', 'create', 'xtend.surface.registered', `Surface ${record.id} registered.`);
    },
    openSurface(id, input) {
      const record = registry.get(id);
      if (!record) return result('open', null, false, emit('xtend.surface.not-found', null, 'open', `Surface ${id} is not registered.`));
      if (input?.bounds) record.bounds = mergeSurfaceBounds(record.bounds, input.bounds, record.type);
      focusRecord(record, 'open');
      return commit(record, 'open', 'open', 'xtend.surface.opened', `Surface ${record.id} opened.`);
    },
    closeSurface(id, reason) {
      const record = registry.get(id);
      if (!record) return result('close', null, false, emit('xtend.surface.not-found', null, 'close', `Surface ${id} is not registered.`));
      record.status = 'closed';
      record.active = false;
      if (activeSurfaceId === id) activeSurfaceId = null;
      return commit(record, 'close', 'close', 'xtend.surface.closed', reason || `Surface ${record.id} closed.`);
    },
    focusSurface(id) {
      const record = registry.get(id);
      if (!record) return result('focus', null, false, emit('xtend.surface.not-found', null, 'focus', `Surface ${id} is not registered.`));
      focusRecord(record, 'focus');
      return commit(record, 'focus', 'activate', 'xtend.surface.focused', `Surface ${record.id} focused.`);
    },
    updateSurface(id, patch) {
      const record = registry.get(id);
      if (!record) return result('update', null, false, emit('xtend.surface.not-found', null, 'update', `Surface ${id} is not registered.`));
      if (typeof patch.label === 'string') record.label = patch.label;
      if (patch.bounds) record.bounds = mergeSurfaceBounds(record.bounds, patch.bounds as Partial<XtendSurfaceBounds>, record.type);
      if (typeof patch.placement === 'string') record.placement = patch.placement;
      if (typeof patch.mode === 'string') record.mode = patch.mode;
      if (typeof patch.pinned === 'boolean') record.pinned = patch.pinned;
      if (typeof patch.collapsed === 'boolean') record.collapsed = patch.collapsed;
      if (typeof patch.modal === 'boolean') record.modal = patch.modal;
      return commit(record, 'update', 'update', 'xtend.surface.updated', `Surface ${record.id} updated.`);
    },
    moveSurface(id, bounds) {
      const record = registry.get(id);
      if (!record) return result('move', null, false, emit('xtend.surface.not-found', null, 'move', `Surface ${id} is not registered.`));
      record.bounds = mergeSurfaceBounds(record.bounds, { x: bounds.x, y: bounds.y }, record.type);
      return commit(record, 'move', 'move.commit', 'xtend.surface.moved', `Surface ${record.id} moved.`);
    },
    resizeSurface(id, bounds) {
      const record = registry.get(id);
      if (!record) return result('resize', null, false, emit('xtend.surface.not-found', null, 'resize', `Surface ${id} is not registered.`));
      record.bounds = mergeSurfaceBounds(record.bounds, bounds, record.type);
      return commit(record, 'resize', 'resize.commit', 'xtend.surface.resized', `Surface ${record.id} resized.`);
    },
    minimizeSurface(id) {
      const record = registry.get(id);
      if (!record) return result('minimize', null, false, emit('xtend.surface.not-found', null, 'minimize', `Surface ${id} is not registered.`));
      record.status = 'minimized';
      record.minimized = true;
      record.active = false;
      if (activeSurfaceId === id) activeSurfaceId = null;
      return commit(record, 'minimize', 'minimize', 'xtend.surface.minimized', `Surface ${record.id} minimized.`);
    },
    maximizeSurface(id) {
      const record = registry.get(id);
      if (!record) return result('maximize', null, false, emit('xtend.surface.not-found', null, 'maximize', `Surface ${id} is not registered.`));
      record.previousBounds = { ...record.bounds };
      record.maximized = true;
      record.status = 'open';
      record.minimized = false;
      activateRecord(record);
      return commit(record, 'maximize', 'maximize', 'xtend.surface.maximized', `Surface ${record.id} maximized.`);
    },
    restoreSurface(id) {
      const record = registry.get(id);
      if (!record) return result('restore', null, false, emit('xtend.surface.not-found', null, 'restore', `Surface ${id} is not registered.`));
      if (record.previousBounds) record.bounds = normalizeSurfaceBounds(record.previousBounds, record.type);
      record.previousBounds = null;
      record.status = 'open';
      record.minimized = false;
      record.maximized = false;
      activateRecord(record);
      return commit(record, 'restore', 'restore', 'xtend.surface.restored', `Surface ${record.id} restored.`);
    },
    materializeSurface(id, input) {
      const record = registry.get(id);
      if (!record) return result('materialize', null, false, emit('xtend.surface.not-found', null, 'materialize', `Surface ${id} is not registered.`));
      if (record.status === 'closed') return this.openSurface(id, input);
      if (record.status === 'minimized' || record.minimized) return this.restoreSurface(id);
      return this.focusSurface(id);
    },
    toggleSurface(id, input) {
      const record = registry.get(id);
      if (!record) return result('toggle', null, false, emit('xtend.surface.not-found', null, 'toggle', `Surface ${id} is not registered.`));
      if (record.status === 'closed' || record.status === 'minimized' || record.minimized) return this.materializeSurface(id, input);
      return this.minimizeSurface(id);
    },
    snapshot() {
      snapshotVersion += 1;
      emit('xtend.surface.snapshot', null, 'snapshot', 'Surface snapshot captured.');
      mirror();
      return buildSnapshot();
    },
    readSnapshot() {
      return buildSnapshot();
    },
    dispose() {
      registry.clear();
      activeSurfaceId = null;
      snapshotVersion += 1;
      const event = emit('xtend.surface.disposed', null, 'dispose', 'Surface controller disposed.');
      mirror();
      return result('dispose', null, true, event);
    }
  };
}
