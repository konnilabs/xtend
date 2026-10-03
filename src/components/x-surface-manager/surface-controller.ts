import {
  SURFACE_CONTROLLER_SCHEMA,
  SURFACE_APPLY_RESULT_SCHEMA,
  SURFACE_DIAGNOSTIC_SCHEMA,
  SURFACE_OPERATION_RESULT_SCHEMA,
  SURFACE_RECORD_SCHEMA,
  SURFACE_SNAPSHOT_SCHEMA,
  XTEND_SURFACE_STATE_KEYS,
  XtendSurfaceBounds,
  XtendSurfaceApplyOperation,
  XtendSurfaceApplyResult,
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
  window: Object.freeze(['open', 'focus', 'close', 'destroy', 'move', 'resize', 'minimize', 'maximize', 'restore', 'snapshot']),
  'side-panel': Object.freeze(['open', 'focus', 'close', 'destroy', 'dock', 'collapse', 'resize', 'minimize', 'restore', 'snapshot']),
  modal: Object.freeze(['open', 'focus', 'close', 'destroy', 'snapshot']),
  dialog: Object.freeze(['open', 'focus', 'close', 'destroy', 'snapshot']),
  drawer: Object.freeze(['open', 'focus', 'close', 'destroy', 'resize', 'restore', 'snapshot']),
  popover: Object.freeze(['open', 'focus', 'close', 'destroy', 'snapshot']),
  tooltip: Object.freeze(['open', 'close', 'destroy', 'snapshot']),
  region: Object.freeze(['open', 'focus', 'close', 'destroy', 'update', 'restore', 'snapshot']),
  toast: Object.freeze(['open', 'close', 'destroy', 'dismiss', 'snapshot']),
  lightbox: Object.freeze(['open', 'focus', 'close', 'destroy', 'snapshot']),
  menu: Object.freeze(['open', 'focus', 'close', 'destroy', 'update', 'snapshot'])
});

const DETERMINISTIC_TIMESTAMP = '1970-01-01T00:00:00.000Z';

function nowIso(nowProvider?: () => string | number | Date): string {
  if (nowProvider) {
    const value = nowProvider();
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'number') return new Date(value).toISOString();
    if (typeof value === 'string' && value) return value;
  }
  return DETERMINISTIC_TIMESTAMP;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function stateKey(pattern: string, surfaceId: string): string {
  return pattern.replace('<surfaceId>', surfaceId);
}

function operationLane(operation: string): string {
  if (['move', 'resize', 'update', 'restore', 'maximize'].includes(operation)) return 'transition';
  if (['snapshot', 'dispose'].includes(operation)) return 'diagnostics';
  if (['destroySurface', 'cleanup', 'release'].includes(operation)) return 'background';
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
  const capabilities = stringList(source.capabilities || input.capabilities);
  const disabledCapabilities = new Set(stringList(source.disabledCapabilities || input.disabledCapabilities));

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
    ownershipMode: String(source.ownershipMode || input.ownershipMode || metadata && metadata.rmtOwnershipMode || '') || null,
    zIndex: toFiniteNumber(source.zIndex || input.zIndex, 0),
    bounds: normalizeSurfaceBounds(initialBounds, type),
    previousBounds: null,
    generation: Math.max(1, toFiniteNumber(source.generation || input.generation, 1)),
    destroyedAt: null,
    destroyReason: null,
    releasedResources: [],
    lastBounds: null,
    tombstone: null,
    capabilities: unique([...(DEFAULT_CAPABILITIES[type] || DEFAULT_CAPABILITIES.window), ...capabilities])
      .filter((capability) => !disabledCapabilities.has(capability)),
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
  const subscribers = new Set<(snapshot: XtendSurfaceSnapshot) => void>();
  const stateProjection = options.stateProjection || null;
  const nowProvider = options.clock && typeof options.clock.now === 'function'
    ? () => options.clock!.now()
    : options.now;
  const maxDiagnostics = Math.max(1, toFiniteNumber(options.maxDiagnostics, 50));
  let activeSurfaceId: string | null = null;
  let zIndexCursor = Math.max(1, toFiniteNumber(options.baseZIndex, 1000));
  let snapshotVersion = 0;
  let disposed = false;
  let applying = false;
  let applyChanged = false;
  let pendingFabricDiagnostics: XtendSurfaceDiagnostic[] = [];

  function mirror(): void {
    if (applying) return;
    const records = Array.from(registry.values());
    const updates: Record<string, unknown> = Object.create(null);
    updates[XTEND_SURFACE_STATE_KEYS.registry] = records;
    updates[XTEND_SURFACE_STATE_KEYS.active] = activeSurfaceId;
    records.forEach((record) => {
      updates[stateKey(XTEND_SURFACE_STATE_KEYS.state, record.id)] = record;
      updates[stateKey(XTEND_SURFACE_STATE_KEYS.bounds, record.id)] = record.bounds;
      updates[stateKey(XTEND_SURFACE_STATE_KEYS.lifecycle, record.id)] = record.lifecycle;
    });
    updates[XTEND_SURFACE_STATE_KEYS.diagnostics] = diagnostics.slice(-maxDiagnostics);
    const currentSnapshot = buildSnapshot();
    updates[XTEND_SURFACE_STATE_KEYS.snapshot] = currentSnapshot;
    stateProjection?.apply(updates, currentSnapshot);
    subscribers.forEach((listener) => {
      try {
        listener(currentSnapshot);
      } catch (_) {
        // Observers cannot interrupt the authoritative controller commit.
      }
    });
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
      timestamp: nowIso(nowProvider),
      detail
    };
    diagnostics.push(event);
    while (diagnostics.length > maxDiagnostics) diagnostics.shift();
    if (applying) pendingFabricDiagnostics.push(event);
    else options.fabric?.emitDiagnostic?.(event);
    return event;
  }

  function result(operation: string, record: XtendSurfaceRecord | null, ok: boolean, diagnostic: XtendSurfaceDiagnostic | null): XtendSurfaceOperationResult {
    return {
      schema: SURFACE_OPERATION_RESULT_SCHEMA,
      ok,
      managerId,
      surfaceId: record ? record.id : null,
      operation,
      status: ok ? 'ok' : 'failed',
      generation: record ? record.generation || 1 : null,
      tombstone: record && record.tombstone ? { ...record.tombstone } : null,
      diagnostics: diagnostic ? [diagnostic] : [],
      code: diagnostic ? diagnostic.code : null,
      phase: record ? record.lifecycle.phase : null,
      snapshotVersion,
      diagnostic
    };
  }

  function commit(record: XtendSurfaceRecord | null, operation: string, phase: string, code: string, message: string): XtendSurfaceOperationResult {
    if (!applying) snapshotVersion += 1;
    if (record) {
      record.lifecycle = {
        phase,
        operation,
        lane: operationLane(operation),
        timestamp: nowIso(nowProvider)
      };
    }
    const event = emit(code, record, operation, message);
    mirror();
    if (applying) applyChanged = true;
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

  function buildSnapshot(optionsForSnapshot: Record<string, unknown> = {}): XtendSurfaceSnapshot {
    const includeDestroyed = optionsForSnapshot.includeDestroyed === true;
    const allSurfaces = Array.from(registry.values()).map((record) => ({ ...record, bounds: { ...record.bounds }, lifecycle: { ...record.lifecycle } }));
    const surfaces = includeDestroyed ? allSurfaces : allSurfaces.filter((record) => record.status !== 'destroyed');
    const stack = surfaces.filter((record) => record.status === 'open').sort((left, right) => left.zIndex - right.zIndex).map((record) => record.id);
    return {
      schema: SURFACE_SNAPSHOT_SCHEMA,
      managerId,
      stateKey: stateKeyRoot,
      activeSurfaceId,
      version: snapshotVersion,
      surfaceCount: surfaces.length,
      openSurfaceCount: surfaces.filter((record) => record.status === 'open').length,
      destroyedSurfaceCount: allSurfaces.filter((record) => record.status === 'destroyed').length,
      surfaces,
      stack,
      diagnostics: diagnostics.slice(-maxDiagnostics),
      updatedAt: nowIso(nowProvider)
    };
  }

  const controller: XtendSurfaceController = {
    schema: SURFACE_CONTROLLER_SCHEMA,
    managerId,
    stateKey: stateKeyRoot,
    registerSurface(input) {
      const record = normalizeSurfaceRecord(input, managerId);
      const previous = registry.get(record.id);
      if (previous && previous.status === 'destroyed') record.generation = (previous.generation || 1) + 1;
      registry.set(record.id, record);
      return commit(record, 'register', 'create', 'xtend.surface.registered', `Surface ${record.id} registered.`);
    },
    openSurface(id, input) {
      const record = registry.get(id);
      if (!record) return result('open', null, false, emit('xtend.surface.not-found', null, 'open', `Surface ${id} is not registered.`));
      if (record.status === 'destroyed') {
        if (input && (input as Record<string, unknown>).recreate === true) {
          record.status = 'closed';
          record.destroyedAt = null;
          record.destroyReason = null;
          record.releasedResources = [];
          record.lastBounds = null;
          record.tombstone = null;
          record.generation = (record.generation || 1) + 1;
        } else {
          return result('open', record, false, emit('xtend.surface.already-destroyed', record, 'open', `Surface ${id} is destroyed.`));
        }
      }
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
    destroySurface(id, destroyOptions = {}) {
      const record = registry.get(id);
      if (!record) return result('destroySurface', null, false, emit('xtend.surface.not-found', null, 'destroySurface', `Surface ${id} is not registered.`));
      if (record.status === 'destroyed') {
        return commit(record, 'destroySurface', 'destroy', 'xtend.surface.already-destroyed', `Surface ${record.id} is already destroyed.`);
      }
      const destroyedAt = nowIso(nowProvider);
      const releasedResources = Array.isArray(destroyOptions.releasedResources)
        ? destroyOptions.releasedResources.map(String)
        : [];
      record.status = 'destroyed';
      record.active = false;
      record.minimized = false;
      record.maximized = false;
      record.lastBounds = { ...record.bounds };
      record.destroyedAt = destroyedAt;
      record.destroyReason = String(destroyOptions.reason || 'destroy');
      record.releasedResources = releasedResources;
      record.tombstone = {
        schema: 'xtend.surface.tombstone.v1',
        surfaceId: record.id,
        managerId,
        generation: record.generation || 1,
        destroyedAt,
        reason: record.destroyReason,
        releasedResources,
        lastBounds: { ...record.lastBounds }
      };
      if (activeSurfaceId === id) activeSurfaceId = null;
      return commit(record, 'destroySurface', 'destroy', 'xtend.surface.destroyed', `Surface ${record.id} destroyed.`);
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
      if (Array.isArray(patch.capabilities) || Array.isArray(patch.disabledCapabilities)) {
        const nextCapabilities = stringList(patch.capabilities || record.capabilities);
        const disabledCapabilities = new Set(stringList(patch.disabledCapabilities));
        record.capabilities = unique([...(DEFAULT_CAPABILITIES[record.type] || DEFAULT_CAPABILITIES.window), ...nextCapabilities])
          .filter((capability) => !disabledCapabilities.has(capability));
      }
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
    apply(operations: XtendSurfaceApplyOperation[], metadata: Record<string, unknown> = {}): XtendSurfaceApplyResult {
      if (!Array.isArray(operations)) throw new TypeError('Surface Controller apply() requires an operation array.');
      if (applying) throw new Error('Surface Controller apply() cannot be nested.');
      if (operations.length === 0) {
        return {
          schema: SURFACE_APPLY_RESULT_SCHEMA,
          ok: true,
          operation: 'apply',
          operationCount: 0,
          changed: false,
          snapshotVersion,
          results: [],
          diagnostics: [],
          snapshot: buildSnapshot({ includeDestroyed: true }),
          metadata: { ...metadata }
        };
      }
      const beforeRecords = Array.from(registry.entries()).map(([id, record]) => [id, {
        ...record,
        bounds: { ...record.bounds },
        previousBounds: record.previousBounds ? { ...record.previousBounds } : null,
        capabilities: record.capabilities.slice(),
        persistence: { ...record.persistence },
        metadataKeys: record.metadataKeys.slice(),
        lifecycle: { ...record.lifecycle }
      } as XtendSurfaceRecord] as const);
      const beforeDiagnostics = diagnostics.slice();
      const beforeActive = activeSurfaceId;
      const beforeZIndex = zIndexCursor;
      const beforeVersion = snapshotVersion;
      const results: XtendSurfaceOperationResult[] = [];
      pendingFabricDiagnostics = [];
      applyChanged = false;
      applying = true;
      let failed = false;
      try {
        operations.forEach((operation) => {
          if (failed) return;
          const raw = operation as unknown as Record<string, unknown>;
          const name = String(raw.operation || '');
          const method = ({
            register: 'registerSurface', open: 'openSurface', close: 'closeSurface', destroy: 'destroySurface',
            focus: 'focusSurface', update: 'updateSurface', move: 'moveSurface', resize: 'resizeSurface',
            minimize: 'minimizeSurface', maximize: 'maximizeSurface', restore: 'restoreSurface',
            materialize: 'materializeSurface', toggle: 'toggleSurface'
          } as Record<string, string>)[name] || name;
          let operationResult: XtendSurfaceOperationResult;
          if (method === 'registerSurface') operationResult = controller.registerSurface(raw.record as Record<string, unknown>);
          else if (method === 'closeSurface') operationResult = controller.closeSurface(String(raw.id || raw.surfaceId || ''), raw.reason as string | undefined);
          else if (method === 'destroySurface') operationResult = controller.destroySurface(String(raw.id || raw.surfaceId || ''), raw.options as Record<string, unknown> | undefined);
          else if (method === 'focusSurface' || method === 'minimizeSurface' || method === 'maximizeSurface' || method === 'restoreSurface') {
            const callable = (controller as unknown as Record<string, (id: string) => XtendSurfaceOperationResult>)[method];
            if (typeof callable !== 'function') throw new TypeError(`Unsupported Surface apply operation: ${name}.`);
            operationResult = callable(String(raw.id || raw.surfaceId || ''));
          } else {
            const id = String(raw.id || raw.surfaceId || '');
            const payload = raw.input || raw.patch || raw.bounds || raw.options || {};
            const callable = (controller as unknown as Record<string, (surfaceId: string, input?: Record<string, unknown>) => XtendSurfaceOperationResult>)[method];
            if (typeof callable !== 'function') throw new TypeError(`Unsupported Surface apply operation: ${name}.`);
            operationResult = callable(id, payload as Record<string, unknown>);
          }
          results.push(operationResult);
          if (!operationResult.ok) failed = true;
        });
      } finally {
        applying = false;
      }
      if (failed) {
        registry.clear();
        beforeRecords.forEach(([id, record]) => registry.set(id, record));
        diagnostics.splice(0, diagnostics.length, ...beforeDiagnostics);
        activeSurfaceId = beforeActive;
        zIndexCursor = beforeZIndex;
        snapshotVersion = beforeVersion;
        pendingFabricDiagnostics = [];
        const failure = emit('xtend.surface.apply.operation-failed', null, 'apply', 'Atomic Surface Controller apply failed before projection.');
        mirror();
        return {
          schema: SURFACE_APPLY_RESULT_SCHEMA,
          ok: false,
          operation: 'apply',
          operationCount: operations.length,
          changed: false,
          snapshotVersion,
          results,
          diagnostics: [failure],
          snapshot: buildSnapshot({ includeDestroyed: true }),
          metadata: { ...metadata }
        };
      }
      snapshotVersion += 1;
      results.forEach((entry) => { entry.snapshotVersion = snapshotVersion; });
      pendingFabricDiagnostics.forEach((entry) => options.fabric?.emitDiagnostic?.(entry));
      const applyDiagnostics = pendingFabricDiagnostics.slice();
      pendingFabricDiagnostics = [];
      mirror();
      return {
        schema: SURFACE_APPLY_RESULT_SCHEMA,
        ok: true,
        operation: 'apply',
        operationCount: operations.length,
        changed: applyChanged,
        snapshotVersion,
        results,
        diagnostics: applyDiagnostics,
        snapshot: buildSnapshot({ includeDestroyed: true }),
        metadata: { ...metadata }
      };
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
    subscribe(listener, subscribeOptions = {}) {
      if (typeof listener !== 'function') throw new TypeError('Surface Controller subscribe() requires a listener.');
      subscribers.add(listener);
      if (subscribeOptions.emitCurrent === true) listener(buildSnapshot());
      return () => subscribers.delete(listener);
    },
    dispose() {
      if (disposed) return result('dispose', null, true, null);
      disposed = true;
      registry.clear();
      activeSurfaceId = null;
      snapshotVersion += 1;
      const event = emit('xtend.surface.disposed', null, 'dispose', 'Surface controller disposed.');
      mirror();
      subscribers.clear();
      return result('dispose', null, true, event);
    }
  };
  return controller;
}
