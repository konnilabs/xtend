/* xtend-kernel-mvc:compatibility-shell-start */
(function attachXtendSurfaceController(globalTarget, factory) {
  const api = factory(globalTarget);

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (globalTarget && typeof globalTarget === 'object') {
    globalTarget.XTendSurfaceController = Object.freeze({ ...api });
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createXtendSurfaceControllerModule() {
/* xtend-kernel-mvc:compatibility-shell-end */
  const SURFACE_CONTROLLER_SCHEMA = 'xtend.surface.controller.v2';
  const SURFACE_RECORD_SCHEMA = 'xtend.surface.record.v1';
  const SURFACE_SNAPSHOT_SCHEMA = 'xtend.surface.snapshot.v1';
  const SURFACE_DIAGNOSTIC_SCHEMA = 'xtend.surface.diagnostic.v1';
  const SURFACE_OPERATION_RESULT_SCHEMA = 'xtend.surface.operation-result.v1';
  const SURFACE_APPLY_RESULT_SCHEMA = 'xtend.surface.apply-result.v1';
  const SURFACE_MANAGER_SCHEMA = 'xtend.surface.manager.v1';
  const DETERMINISTIC_TIMESTAMP = '1970-01-01T00:00:00.000Z';

  const CONTRACTS = Object.freeze({
    controller: SURFACE_CONTROLLER_SCHEMA,
    manager: SURFACE_MANAGER_SCHEMA,
    record: SURFACE_RECORD_SCHEMA,
    snapshot: SURFACE_SNAPSHOT_SCHEMA,
    diagnostic: SURFACE_DIAGNOSTIC_SCHEMA,
    operationResult: SURFACE_OPERATION_RESULT_SCHEMA,
    applyResult: SURFACE_APPLY_RESULT_SCHEMA
  });

  const STATE_KEYS = Object.freeze({
    registry: 'xtend.surface.registry',
    active: 'xtend.surface.active',
    state: 'xtend.surface.<surfaceId>.state',
    bounds: 'xtend.surface.<surfaceId>.bounds',
    lifecycle: 'xtend.surface.<surfaceId>.lifecycle',
    diagnostics: 'xtend.surface.diagnostics',
    snapshot: 'xtend.surface.snapshot'
  });

  const SURFACE_TYPES = Object.freeze([
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

  const DEFAULT_CAPABILITIES = Object.freeze({
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

  const DEFAULT_BOUNDS = Object.freeze({
    window: Object.freeze({ x: 64, y: 64, width: 640, height: 420, minWidth: 280, minHeight: 180 }),
    'side-panel': Object.freeze({ x: 0, y: 0, width: 320, height: 720, minWidth: 240, minHeight: 180 }),
    modal: Object.freeze({ x: 0, y: 0, width: 560, height: 360, minWidth: 320, minHeight: 180 }),
    dialog: Object.freeze({ x: 0, y: 0, width: 480, height: 320, minWidth: 280, minHeight: 160 }),
    drawer: Object.freeze({ x: 0, y: 0, width: 360, height: 720, minWidth: 240, minHeight: 180 }),
    popover: Object.freeze({ x: 0, y: 0, width: 280, height: 160, minWidth: 160, minHeight: 96 }),
    tooltip: Object.freeze({ x: 0, y: 0, width: 220, height: 80, minWidth: 120, minHeight: 48 }),
    region: Object.freeze({ x: 0, y: 0, width: 640, height: 360, minWidth: 160, minHeight: 96 }),
    toast: Object.freeze({ x: 0, y: 0, width: 360, height: 96, minWidth: 220, minHeight: 48 }),
    lightbox: Object.freeze({ x: 0, y: 0, width: 720, height: 520, minWidth: 320, minHeight: 220 }),
    menu: Object.freeze({ x: 0, y: 0, width: 280, height: 240, minWidth: 160, minHeight: 96 })
  });

  const DIAGNOSTIC_CODES = Object.freeze([
    'xtend.surface.controller.created',
    'xtend.surface.registered',
    'xtend.surface.opened',
    'xtend.surface.closed',
    'xtend.surface.focused',
    'xtend.surface.updated',
    'xtend.surface.moved',
    'xtend.surface.resized',
    'xtend.surface.minimized',
    'xtend.surface.maximized',
    'xtend.surface.restored',
    'xtend.surface.destroyed',
    'xtend.surface.already-destroyed',
    'xtend.surface.snapshot',
    'xtend.surface.disposed',
    'xtend.surface.invalid-record',
    'xtend.surface.not-found',
    'xtend.surface.capability-refused',
    'xtend.surface.state-projection.batch-required',
    'xtend.surface.state-mirror.failed',
    'xtend.surface.fabric-diagnostic.failed'
  ]);

  function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function unique(values) {
    return [...new Set((Array.isArray(values) ? values : []).filter(Boolean))];
  }

  function toNumber(value, fallback) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  }

  function clampString(value, fallback) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    return fallback;
  }

  function nowIso(nowProvider) {
    if (typeof nowProvider === 'function') {
      const value = nowProvider();
      if (value instanceof Date) return value.toISOString();
      if (typeof value === 'number') return new Date(value).toISOString();
      if (typeof value === 'string' && value) return value;
    }
    return DETERMINISTIC_TIMESTAMP;
  }

  function surfaceKey(pattern, surfaceId) {
    return String(pattern).replace('<surfaceId>', surfaceId);
  }

  function inferLane(operation) {
    if (operation === 'move' || operation === 'resize' || operation === 'update' || operation === 'restore' || operation === 'maximize') {
      return 'transition';
    }
    if (operation === 'snapshot' || operation === 'dispose') return 'diagnostics';
    if (operation === 'destroySurface' || operation === 'cleanup' || operation === 'release') return 'background';
    if (operation === 'register') return 'visible';
    return 'user-blocking';
  }

  function normalizeType(type) {
    const candidate = String(type || 'window').trim();
    return SURFACE_TYPES.includes(candidate) ? candidate : 'window';
  }

  function normalizeSurfaceBounds(bounds = {}, type = 'window') {
    const normalizedType = normalizeType(type);
    const defaults = DEFAULT_BOUNDS[normalizedType] || DEFAULT_BOUNDS.window;
    const minWidth = Math.max(1, toNumber(bounds.minWidth, defaults.minWidth));
    const minHeight = Math.max(1, toNumber(bounds.minHeight, defaults.minHeight));
    const width = Math.max(minWidth, toNumber(bounds.width, defaults.width));
    const height = Math.max(minHeight, toNumber(bounds.height, defaults.height));

    return {
      x: Math.max(0, toNumber(bounds.x, defaults.x)),
      y: Math.max(0, toNumber(bounds.y, defaults.y)),
      width,
      height,
      minWidth,
      minHeight
    };
  }

  function extractSurfaceSource(record) {
    if (isObject(record && record.metadata && record.metadata.surface)) return record.metadata.surface;
    if (isObject(record && record.surface)) return record.surface;
    return isObject(record) ? record : {};
  }

  function normalizeCapabilities(type, capabilities, disabledCapabilities) {
    const defaults = DEFAULT_CAPABILITIES[type] || DEFAULT_CAPABILITIES.window;
    const disabled = new Set(Array.isArray(disabledCapabilities) ? disabledCapabilities.map(String) : []);
    return unique([...defaults, ...(Array.isArray(capabilities) ? capabilities : [])])
      .filter((capability) => !disabled.has(capability));
  }

  function normalizePersistence(persistence) {
    if (!isObject(persistence)) return { mode: 'none', key: null };
    const mode = ['none', 'memory', 'session', 'local'].includes(persistence.mode) ? persistence.mode : 'none';
    return {
      mode,
      key: clampString(persistence.key, null)
    };
  }

  function normalizeSurfaceRecord(record = {}, defaults = {}) {
    const source = extractSurfaceSource(record);
    const managerId = clampString(source.manager || record.manager, defaults.managerId || 'xtend.surface.manager');
    const id = clampString(
      source.surfaceId || source.id || record.surfaceId || record.id,
      ''
    );
    const type = normalizeType(source.type || record.type);
    const bounds = normalizeSurfaceBounds(
      source.initialBounds || source.bounds || source.geometry && source.geometry.initial || record.initialBounds || record.bounds || {},
      type
    );
    const defaultOpen = source.defaultOpen === true || record.open === true || record.defaultOpen === true;
    const label = clampString(
      source.label || record.label || record.props && record.props.label || record.attributes && record.attributes.label,
      id || type
    );
    const stateKey = clampString(source.stateKey || record.stateKey, `xtend.surface.${id || 'unidentified'}.state`);

    return {
      schema: SURFACE_RECORD_SCHEMA,
      id,
      manager: managerId,
      type,
      kind: clampString(source.kind || record.kind, type),
      label,
      stateKey,
      status: defaultOpen ? 'open' : 'closed',
      active: false,
      minimized: false,
      maximized: false,
      pinned: source.pinned === true || record.pinned === true,
      collapsed: source.collapsed === true || record.collapsed === true,
      modal: source.modal === true || record.modal === true || type === 'modal' || type === 'dialog',
      placement: clampString(source.placement || record.placement, type === 'side-panel' ? 'right' : null),
      mode: clampString(source.mode || record.mode, type === 'side-panel' ? 'docked' : 'floating'),
      ownershipMode: clampString(source.ownershipMode || record.ownershipMode || record.metadata && record.metadata.rmtOwnershipMode, null),
      zIndex: toNumber(source.zIndex || record.zIndex, 0),
      bounds,
      previousBounds: null,
      generation: Math.max(1, toNumber(source.generation || record.generation, 1)),
      destroyedAt: null,
      destroyReason: null,
      releasedResources: [],
      lastBounds: null,
      tombstone: null,
      capabilities: normalizeCapabilities(
        type,
        source.capabilities || record.capabilities,
        source.disabledCapabilities || record.disabledCapabilities
      ),
      persistence: normalizePersistence(source.persistence || record.persistence),
      contentRef: clampString(source.content || source.component || record.component || record.contentRef, null),
      metadataKeys: Object.keys(isObject(record.metadata) ? record.metadata : {}).sort(),
      lifecycle: {
        phase: 'declare',
        operation: 'register',
        lane: 'visible',
        timestamp: null
      }
    };
  }

  function createStatePayload(record) {
    return {
      schema: SURFACE_RECORD_SCHEMA,
      id: record.id,
      manager: record.manager,
      type: record.type,
      kind: record.kind || record.type,
      label: record.label,
      status: record.status,
      active: record.active,
      minimized: record.minimized,
      maximized: record.maximized,
      pinned: record.pinned,
      collapsed: record.collapsed,
      modal: record.modal,
      placement: record.placement,
      mode: record.mode,
      ownershipMode: record.ownershipMode || null,
      zIndex: record.zIndex,
      capabilities: record.capabilities.slice(),
      persistence: { ...record.persistence },
      contentRef: record.contentRef,
      stateKey: record.stateKey,
      metadataKeys: record.metadataKeys.slice(),
      generation: record.generation || 1,
      destroyedAt: record.destroyedAt || null,
      destroyReason: record.destroyReason || null,
      tombstone: record.tombstone ? { ...record.tombstone } : null
    };
  }

  function createSnapshotRecord(record) {
    return {
      ...createStatePayload(record),
      bounds: { ...record.bounds },
      previousBounds: record.previousBounds ? { ...record.previousBounds } : null,
      releasedResources: Array.isArray(record.releasedResources) ? record.releasedResources.slice() : [],
      lastBounds: record.lastBounds ? { ...record.lastBounds } : null,
      lifecycle: { ...record.lifecycle }
    };
  }

  function cloneControllerRecord(record) {
    if (!record) return record;
    return {
      ...record,
      bounds: { ...record.bounds },
      previousBounds: record.previousBounds ? { ...record.previousBounds } : null,
      lastBounds: record.lastBounds ? { ...record.lastBounds } : null,
      capabilities: Array.isArray(record.capabilities) ? record.capabilities.slice() : [],
      persistence: { ...record.persistence },
      metadataKeys: Array.isArray(record.metadataKeys) ? record.metadataKeys.slice() : [],
      releasedResources: Array.isArray(record.releasedResources) ? record.releasedResources.slice() : [],
      tombstone: record.tombstone
        ? {
          ...record.tombstone,
          releasedResources: Array.isArray(record.tombstone.releasedResources)
            ? record.tombstone.releasedResources.slice()
            : [],
          lastBounds: record.tombstone.lastBounds ? { ...record.tombstone.lastBounds } : null
        }
        : null,
      lifecycle: { ...record.lifecycle }
    };
  }

  function createOperationResult(managerId, operation, record, ok, diagnostic, snapshotVersion) {
    const tombstone = record && record.tombstone ? { ...record.tombstone } : null;
    return {
      schema: SURFACE_OPERATION_RESULT_SCHEMA,
      ok,
      managerId,
      surfaceId: record && record.id || null,
      operation,
      status: ok ? 'ok' : 'failed',
      generation: record && record.generation || null,
      tombstone,
      diagnostics: diagnostic ? [diagnostic] : [],
      code: diagnostic && diagnostic.code || null,
      phase: record && record.lifecycle && record.lifecycle.phase || null,
      snapshotVersion,
      diagnostic
    };
  }

  function createSurfaceController(options = {}) {
    const managerId = clampString(options.managerId, 'xtend.surface.manager');
    const stateKey = clampString(options.stateKey, STATE_KEYS.registry);
    const stateProjection = options.stateProjection || null;
    const fabric = options.fabric || null;
    const nowProvider = options.clock && typeof options.clock.now === 'function'
      ? () => options.clock.now()
      : options.now;
    const registry = new Map();
    const diagnostics = [];
    const subscribers = new Set();
    const maxDiagnostics = Math.max(1, toNumber(options.maxDiagnostics, 50));
    const maxTombstones = Math.max(1, toNumber(options.maxTombstones, 50));
    let activeSurfaceId = null;
    let zIndexCursor = Math.max(1, toNumber(options.baseZIndex, 1000));
    let snapshotVersion = 0;
    let disposed = false;
    let activeApply = null;

    function publishFabricDiagnostic(diagnostic) {
      if (activeApply) {
        activeApply.fabricDiagnostics.push(diagnostic);
        return;
      }
      if (!fabric) return;
      try {
        if (typeof fabric.emitDiagnostic === 'function') {
          fabric.emitDiagnostic(diagnostic);
        } else if (typeof fabric.runFiber === 'function') {
          fabric.runFiber({
            id: `${managerId}.${diagnostic.operation}.${diagnostic.surfaceId || 'manager'}`,
            kind: 'diagnostics.snapshot',
            lane: 'diagnostics'
          }, () => diagnostic);
        }
      } catch (error) {
        diagnostics.push({
          schema: SURFACE_DIAGNOSTIC_SCHEMA,
          code: 'xtend.surface.fabric-diagnostic.failed',
          severity: 'warning',
          managerId,
          surfaceId: diagnostic.surfaceId || null,
          operation: 'fabric-diagnostic',
          lane: 'diagnostics',
          message: 'Surface Fabric diagnostic publication failed.',
          timestamp: nowIso(nowProvider),
          detail: {
            error: error && error.message || String(error)
          }
        });
      }
    }

    function isVisibleRecord(record) {
      return record && record.status === 'open';
    }

    function isDestroyedRecord(record) {
      return record && record.status === 'destroyed';
    }

    function buildSnapshot(optionsForSnapshot = {}) {
      const includeDestroyed = optionsForSnapshot.includeDestroyed === true;
      const allSurfaces = Array.from(registry.values()).map(createSnapshotRecord);
      const surfaces = includeDestroyed ? allSurfaces : allSurfaces.filter((record) => record.status !== 'destroyed');
      const stack = surfaces
        .filter(isVisibleRecord)
        .sort((left, right) => left.zIndex - right.zIndex)
        .map((record) => record.id);

      return {
        schema: SURFACE_SNAPSHOT_SCHEMA,
        managerId,
        stateKey,
        activeSurfaceId,
        version: snapshotVersion,
        surfaceCount: surfaces.length,
        openSurfaceCount: surfaces.filter(isVisibleRecord).length,
        destroyedSurfaceCount: allSurfaces.filter(isDestroyedRecord).length,
        surfaces,
        stack,
        diagnostics: diagnostics.slice(-maxDiagnostics),
        updatedAt: nowIso(nowProvider)
      };
    }

    function trimTombstones() {
      const tombstones = Array.from(registry.values())
        .filter(isDestroyedRecord)
        .sort((left, right) => String(left.destroyedAt || '').localeCompare(String(right.destroyedAt || '')));
      while (tombstones.length > maxTombstones) {
        const next = tombstones.shift();
        if (next) registry.delete(next.id);
      }
    }

    function mirror() {
      if (activeApply) {
        activeApply.mirrorPending = true;
        return;
      }
      const surfaces = Array.from(registry.values());
      const liveSurfaces = surfaces.filter((record) => record.status !== 'destroyed');
      const updates = Object.create(null);
      updates[STATE_KEYS.registry] = liveSurfaces.map(createStatePayload);
      updates[STATE_KEYS.active] = activeSurfaceId;
      liveSurfaces.forEach((record) => {
        updates[surfaceKey(STATE_KEYS.state, record.id)] = createStatePayload(record);
        updates[surfaceKey(STATE_KEYS.bounds, record.id)] = { ...record.bounds };
        updates[surfaceKey(STATE_KEYS.lifecycle, record.id)] = { ...record.lifecycle };
      });
      updates[STATE_KEYS.diagnostics] = diagnostics.slice(-maxDiagnostics);
      const currentSnapshot = buildSnapshot();
      updates[STATE_KEYS.snapshot] = currentSnapshot;
      if (stateProjection && typeof stateProjection.apply === 'function') {
        try {
          stateProjection.apply(updates, currentSnapshot);
        } catch (error) {
          diagnostics.push({
            schema: SURFACE_DIAGNOSTIC_SCHEMA,
            code: 'xtend.surface.state-mirror.failed',
            severity: 'warning',
            managerId,
            surfaceId: null,
            operation: 'state-projection',
            lane: 'diagnostics',
            message: 'Surface state projection failed.',
            timestamp: nowIso(nowProvider),
            detail: { error: error && error.message || String(error) }
          });
        }
      }
      subscribers.forEach((listener) => {
        try {
          listener(currentSnapshot);
        } catch (_) {
          // Surface observers cannot interrupt the authoritative controller commit.
        }
      });
    }

    function diagnostic(code, record, operation, severity, message, detail = {}) {
      const event = {
        schema: SURFACE_DIAGNOSTIC_SCHEMA,
        code,
        severity: severity || 'info',
        managerId,
        surfaceId: record && record.id || null,
        operation,
        lane: inferLane(operation),
        message,
        timestamp: nowIso(nowProvider),
        detail: {
          status: record && record.status || null,
          active: record && record.active || false,
          type: record && record.type || null,
          zIndex: record && record.zIndex || 0,
          ...detail
        }
      };

      diagnostics.push(event);
      while (diagnostics.length > maxDiagnostics) diagnostics.shift();
      publishFabricDiagnostic(event);
      return event;
    }

    function commit(record, operation, phase, code, message, detail) {
      if (!activeApply) snapshotVersion += 1;
      if (record) {
        record.lifecycle = {
          phase,
          operation,
          lane: inferLane(operation),
          timestamp: nowIso(nowProvider)
        };
      }
      if (operation === 'destroySurface' && !activeApply) trimTombstones();
      const event = diagnostic(code, record, operation, 'info', message, detail);
      mirror();
      if (activeApply) activeApply.changed = true;
      return createOperationResult(managerId, operation, record, true, event, activeApply ? snapshotVersion + 1 : snapshotVersion);
    }

    function fail(operation, surfaceId, code, message, detail) {
      const fallbackRecord = surfaceId ? { id: surfaceId, status: 'unknown', active: false, type: null, zIndex: 0 } : null;
      const event = diagnostic(code, fallbackRecord, operation, 'warning', message, detail);
      mirror();
      return createOperationResult(managerId, operation, fallbackRecord, false, event, snapshotVersion);
    }

    function assertReady(operation) {
      if (disposed) {
        return fail(operation, null, 'xtend.surface.capability-refused', 'Surface controller is disposed.', { reason: 'disposed' });
      }
      return null;
    }

    function getRecord(id, operation) {
      const readyFailure = assertReady(operation);
      if (readyFailure) return { failure: readyFailure, record: null };
      const record = registry.get(id);
      if (!record) {
        return {
          record: null,
          failure: fail(operation, id, 'xtend.surface.not-found', `Surface ${id} is not registered.`, { requestedId: id })
        };
      }
      if (record.status === 'destroyed' && operation !== 'destroySurface') {
        return {
          record,
          failure: fail(operation, id, 'xtend.surface.already-destroyed', `Surface ${id} is destroyed.`, {
            requestedId: id,
            destroyedAt: record.destroyedAt || null,
            generation: record.generation || 1
          })
        };
      }
      return { record, failure: null };
    }

    function hasCapability(record, capability, operation) {
      if (record.capabilities.includes(capability)) return null;
      return fail(operation, record.id, 'xtend.surface.capability-refused', `Surface ${record.id} does not support ${capability}.`, {
        capability
      });
    }

    function deactivateActive(exceptId) {
      if (!activeSurfaceId || activeSurfaceId === exceptId) return;
      const activeRecord = registry.get(activeSurfaceId);
      if (activeRecord) activeRecord.active = false;
    }

    function activateTopmostOpen(exceptId) {
      const candidates = Array.from(registry.values())
        .filter((record) => record.id !== exceptId && record.status !== 'closed' && record.status !== 'minimized' && record.status !== 'destroyed')
        .sort((left, right) => right.zIndex - left.zIndex);
      const next = candidates[0] || null;
      activeSurfaceId = next ? next.id : null;
      if (next) next.active = true;
    }

    function focusRecord(record, operation) {
      deactivateActive(record.id);
      record.active = true;
      record.zIndex = ++zIndexCursor;
      activeSurfaceId = record.id;
      if (record.status === 'closed') record.status = 'open';
      if (record.status === 'minimized') {
        record.status = 'open';
        record.minimized = false;
      }
      return commit(record, operation, 'activate', 'xtend.surface.focused', `Surface ${record.id} focused.`);
    }

    function activateRecord(record) {
      deactivateActive(record.id);
      record.active = true;
      record.zIndex = ++zIndexCursor;
      activeSurfaceId = record.id;
    }

    function registerSurface(recordInput) {
      const readyFailure = assertReady('register');
      if (readyFailure) return readyFailure;
      const record = normalizeSurfaceRecord(recordInput, { managerId });
      if (!record.id) {
        return fail('register', null, 'xtend.surface.invalid-record', 'Surface records require a stable id.', { missing: 'id' });
      }
      if (record.manager !== managerId) {
        return fail('register', record.id, 'xtend.surface.invalid-record', 'Surface record targets another manager.', {
          expectedManager: managerId,
          actualManager: record.manager
        });
      }

      const previous = registry.get(record.id);
      if (previous) {
        record.generation = (previous.generation || 1) + (previous.status === 'destroyed' ? 1 : 0);
        if (previous.status !== 'destroyed') {
          record.bounds = normalizeSurfaceBounds(previous.bounds, record.type);
          record.previousBounds = previous.previousBounds
            ? normalizeSurfaceBounds(previous.previousBounds, record.type)
            : null;
          record.zIndex = previous.zIndex;
          record.active = previous.active;
          record.status = previous.status;
          record.minimized = previous.minimized;
          record.maximized = previous.maximized;
          record.pinned = previous.pinned;
          record.collapsed = previous.collapsed;
          record.placement = previous.placement;
          record.mode = previous.mode;
        }
      }
      registry.set(record.id, record);
      if (record.status === 'open') {
        record.zIndex = ++zIndexCursor;
      }
      return commit(record, 'register', 'create', 'xtend.surface.registered', `Surface ${record.id} registered.`, {
        replaced: Boolean(previous),
        recreated: Boolean(previous && previous.status === 'destroyed'),
        generation: record.generation || 1
      });
    }

    function openSurface(id, input = {}) {
      let record = registry.get(id);
      if (record && record.status === 'destroyed' && input && input.recreate === true) {
        record.status = 'closed';
        record.destroyedAt = null;
        record.destroyReason = null;
        record.releasedResources = [];
        record.lastBounds = null;
        record.tombstone = null;
        record.generation = (record.generation || 1) + 1;
      }
      const lookup = getRecord(id, 'open');
      if (lookup.failure) return lookup.failure;
      record = lookup.record;
      const capabilityFailure = hasCapability(record, 'open', 'open');
      if (capabilityFailure) return capabilityFailure;
      if (isObject(input.bounds)) {
        record.bounds = normalizeSurfaceBounds(input.bounds, record.type);
      }
      record.status = 'open';
      record.minimized = false;
      deactivateActive(record.id);
      record.active = true;
      record.zIndex = ++zIndexCursor;
      activeSurfaceId = record.id;
      return commit(record, 'open', 'open', 'xtend.surface.opened', `Surface ${record.id} opened.`);
    }

    function closeSurface(id, reason) {
      const { record, failure } = getRecord(id, 'close');
      if (failure) return failure;
      const capabilityFailure = hasCapability(record, 'close', 'close');
      if (capabilityFailure) return capabilityFailure;
      record.status = 'closed';
      record.active = false;
      record.minimized = false;
      record.maximized = false;
      if (activeSurfaceId === id) {
        activeSurfaceId = null;
        activateTopmostOpen(id);
      }
      return commit(record, 'close', 'close', 'xtend.surface.closed', `Surface ${record.id} closed.`, {
        reason: reason || null
      });
    }

    function destroySurface(id, optionsForDestroy = {}) {
      const { record, failure } = getRecord(id, 'destroySurface');
      if (failure) return failure;
      if (record.status === 'destroyed') {
        return commit(record, 'destroySurface', 'destroy', 'xtend.surface.already-destroyed', `Surface ${record.id} is already destroyed.`, {
          reason: optionsForDestroy.reason || record.destroyReason || null,
          alreadyDestroyed: true,
          generation: record.generation || 1
        });
      }
      const capabilityFailure = hasCapability(record, 'destroy', 'destroySurface');
      if (capabilityFailure) return capabilityFailure;
      const destroyedAt = nowIso(nowProvider);
      const releasedResources = unique([
        ...(Array.isArray(optionsForDestroy.releasedResources) ? optionsForDestroy.releasedResources : []),
        ...(Array.isArray(optionsForDestroy.resourceIds) ? optionsForDestroy.resourceIds : [])
      ].map(String));
      record.status = 'destroying';
      record.active = false;
      record.minimized = false;
      record.maximized = false;
      record.lastBounds = { ...record.bounds };
      record.destroyedAt = destroyedAt;
      record.destroyReason = clampString(optionsForDestroy.reason, 'destroy');
      record.releasedResources = releasedResources;
      record.status = 'destroyed';
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
      if (activeSurfaceId === id) {
        activeSurfaceId = null;
        activateTopmostOpen(id);
      }
      return commit(record, 'destroySurface', 'destroy', 'xtend.surface.destroyed', `Surface ${record.id} destroyed.`, {
        reason: record.destroyReason,
        generation: record.generation || 1,
        releasedResources
      });
    }

    function focusSurface(id) {
      const { record, failure } = getRecord(id, 'focus');
      if (failure) return failure;
      const capabilityFailure = hasCapability(record, 'focus', 'focus');
      if (capabilityFailure) return capabilityFailure;
      return focusRecord(record, 'focus');
    }

    function updateSurface(id, patch = {}) {
      const { record, failure } = getRecord(id, 'update');
      if (failure) return failure;
      if (typeof patch.label === 'string') record.label = patch.label;
      if (Array.isArray(patch.capabilities) || Array.isArray(patch.disabledCapabilities)) {
        record.capabilities = normalizeCapabilities(record.type, patch.capabilities || record.capabilities, patch.disabledCapabilities);
      }
      if (isObject(patch.bounds)) record.bounds = normalizeSurfaceBounds({ ...record.bounds, ...patch.bounds }, record.type);
      if (typeof patch.placement === 'string') record.placement = patch.placement;
      if (typeof patch.mode === 'string') record.mode = patch.mode;
      if (typeof patch.pinned === 'boolean') record.pinned = patch.pinned;
      if (typeof patch.collapsed === 'boolean') record.collapsed = patch.collapsed;
      if (typeof patch.modal === 'boolean') record.modal = patch.modal;
      return commit(record, 'update', 'update', 'xtend.surface.updated', `Surface ${record.id} updated.`);
    }

    function moveSurface(id, bounds = {}) {
      const { record, failure } = getRecord(id, 'move');
      if (failure) return failure;
      const capabilityFailure = hasCapability(record, 'move', 'move');
      if (capabilityFailure) return capabilityFailure;
      record.bounds = normalizeSurfaceBounds({
        ...record.bounds,
        x: bounds.x === undefined ? record.bounds.x : bounds.x,
        y: bounds.y === undefined ? record.bounds.y : bounds.y
      }, record.type);
      return commit(record, 'move', 'move.commit', 'xtend.surface.moved', `Surface ${record.id} moved.`);
    }

    function resizeSurface(id, bounds = {}) {
      const { record, failure } = getRecord(id, 'resize');
      if (failure) return failure;
      const capabilityFailure = hasCapability(record, 'resize', 'resize');
      if (capabilityFailure) return capabilityFailure;
      record.bounds = normalizeSurfaceBounds({ ...record.bounds, ...bounds }, record.type);
      return commit(record, 'resize', 'resize.commit', 'xtend.surface.resized', `Surface ${record.id} resized.`);
    }

    function minimizeSurface(id) {
      const { record, failure } = getRecord(id, 'minimize');
      if (failure) return failure;
      const capabilityFailure = hasCapability(record, 'minimize', 'minimize');
      if (capabilityFailure) return capabilityFailure;
      record.status = 'minimized';
      record.minimized = true;
      record.active = false;
      if (activeSurfaceId === id) {
        activeSurfaceId = null;
        activateTopmostOpen(id);
      }
      return commit(record, 'minimize', 'minimize', 'xtend.surface.minimized', `Surface ${record.id} minimized.`);
    }

    function maximizeSurface(id) {
      const { record, failure } = getRecord(id, 'maximize');
      if (failure) return failure;
      const capabilityFailure = hasCapability(record, 'maximize', 'maximize');
      if (capabilityFailure) return capabilityFailure;
      if (!record.maximized) record.previousBounds = { ...record.bounds };
      record.status = 'open';
      record.minimized = false;
      record.maximized = true;
      record.bounds = normalizeSurfaceBounds({ ...record.bounds, x: 0, y: 0 }, record.type);
      activateRecord(record);
      return commit(record, 'maximize', 'maximize', 'xtend.surface.maximized', `Surface ${record.id} maximized.`);
    }

    function restoreSurface(id) {
      const { record, failure } = getRecord(id, 'restore');
      if (failure) return failure;
      const capabilityFailure = hasCapability(record, 'restore', 'restore');
      if (capabilityFailure) return capabilityFailure;
      if (record.previousBounds) record.bounds = normalizeSurfaceBounds(record.previousBounds, record.type);
      record.previousBounds = null;
      record.status = 'open';
      record.minimized = false;
      record.maximized = false;
      activateRecord(record);
      return commit(record, 'restore', 'restore', 'xtend.surface.restored', `Surface ${record.id} restored.`);
    }

    function materializeSurface(id, input = {}) {
      const { record, failure } = getRecord(id, 'materialize');
      if (failure) return failure;
      if (record.status === 'closed') return openSurface(id, input);
      if (record.status === 'minimized' || record.minimized) return restoreSurface(id);
      return focusSurface(id);
    }

    function toggleSurface(id, input = {}) {
      const { record, failure } = getRecord(id, 'toggle');
      if (failure) return failure;
      if (record.status === 'closed' || record.status === 'minimized' || record.minimized) {
        return materializeSurface(id, input);
      }
      return minimizeSurface(id);
    }

    function normalizeApplyOperation(input, index) {
      if (!isObject(input)) {
        const error = new TypeError(`Surface apply operation at index ${index} must be an object.`);
        error.code = 'xtend.surface.apply.invalid-operation';
        throw error;
      }
      const operation = clampString(input.operation || input.type, '');
      const aliases = {
        register: 'registerSurface',
        open: 'openSurface',
        close: 'closeSurface',
        destroy: 'destroySurface',
        focus: 'focusSurface',
        update: 'updateSurface',
        move: 'moveSurface',
        resize: 'resizeSurface',
        minimize: 'minimizeSurface',
        maximize: 'maximizeSurface',
        restore: 'restoreSurface',
        materialize: 'materializeSurface',
        toggle: 'toggleSurface'
      };
      const method = aliases[operation] || operation;
      const supported = new Set([
        'registerSurface', 'openSurface', 'closeSurface', 'destroySurface',
        'focusSurface', 'updateSurface', 'moveSurface', 'resizeSurface',
        'minimizeSurface', 'maximizeSurface', 'restoreSurface',
        'materializeSurface', 'toggleSurface'
      ]);
      if (!supported.has(method)) {
        const error = new TypeError(`Unsupported Surface apply operation: ${operation || '<missing>'}.`);
        error.code = 'xtend.surface.apply.unsupported-operation';
        throw error;
      }
      if (method === 'registerSurface') {
        const record = input.record || input.value || input.surface;
        if (!isObject(record)) {
          const error = new TypeError(`Surface register operation at index ${index} requires record.`);
          error.code = 'xtend.surface.apply.invalid-record';
          throw error;
        }
        return { method, args: [record] };
      }
      const id = clampString(input.id || input.surfaceId, '');
      if (!id) {
        const error = new TypeError(`Surface apply operation at index ${index} requires id.`);
        error.code = 'xtend.surface.apply.invalid-id';
        throw error;
      }
      if (method === 'closeSurface') return { method, args: [id, input.reason] };
      if (method === 'focusSurface' || method === 'minimizeSurface' || method === 'maximizeSurface' || method === 'restoreSurface') {
        return { method, args: [id] };
      }
      const payload = input.input || input.patch || input.bounds || input.options || {};
      return { method, args: [id, payload] };
    }

    function apply(operations, metadata = {}) {
      const readyFailure = assertReady('apply');
      if (readyFailure) {
        return {
          schema: SURFACE_APPLY_RESULT_SCHEMA,
          ok: false,
          operation: 'apply',
          operationCount: 0,
          changed: false,
          snapshotVersion,
          results: [readyFailure],
          diagnostics: readyFailure.diagnostics || [],
          snapshot: buildSnapshot({ includeDestroyed: true }),
          metadata: isObject(metadata) ? { ...metadata } : {}
        };
      }
      if (activeApply) {
        const error = new Error('Surface Controller apply() cannot be nested.');
        error.code = 'xtend.surface.apply.nested';
        throw error;
      }
      if (!Array.isArray(operations)) {
        const error = new TypeError('Surface Controller apply() requires an operation array.');
        error.code = 'xtend.surface.apply.invalid-operations';
        throw error;
      }
      const normalized = operations.map(normalizeApplyOperation);
      if (normalized.length === 0) {
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
          metadata: isObject(metadata) ? { ...metadata } : {}
        };
      }

      const before = {
        records: Array.from(registry.entries()).map(([id, record]) => [id, cloneControllerRecord(record)]),
        diagnostics: diagnostics.slice(),
        activeSurfaceId,
        zIndexCursor,
        snapshotVersion
      };
      const transaction = {
        changed: false,
        mirrorPending: false,
        fabricDiagnostics: []
      };
      activeApply = transaction;
      const results = [];
      let failedResult = null;
      let thrownError = null;
      try {
        for (const entry of normalized) {
          const result = ({
            registerSurface,
            openSurface,
            closeSurface,
            destroySurface,
            focusSurface,
            updateSurface,
            moveSurface,
            resizeSurface,
            minimizeSurface,
            maximizeSurface,
            restoreSurface,
            materializeSurface,
            toggleSurface
          })[entry.method](...entry.args);
          results.push(result);
          if (!result || result.ok === false) {
            failedResult = result || { code: 'xtend.surface.apply.operation-failed' };
            break;
          }
        }
      } catch (error) {
        thrownError = error;
      }
      activeApply = null;

      if (failedResult || thrownError) {
        registry.clear();
        before.records.forEach(([id, record]) => registry.set(id, cloneControllerRecord(record)));
        diagnostics.splice(0, diagnostics.length, ...before.diagnostics);
        activeSurfaceId = before.activeSurfaceId;
        zIndexCursor = before.zIndexCursor;
        snapshotVersion = before.snapshotVersion;
        const code = thrownError && thrownError.code || failedResult && failedResult.code || 'xtend.surface.apply.operation-failed';
        const failure = fail('apply', null, code, 'Atomic Surface Controller apply failed before projection.', {
          operationCount: normalized.length,
          failedIndex: results.length > 0 ? results.length - 1 : 0,
          error: thrownError && (thrownError.message || String(thrownError)) || null
        });
        return {
          schema: SURFACE_APPLY_RESULT_SCHEMA,
          ok: false,
          operation: 'apply',
          operationCount: normalized.length,
          changed: false,
          snapshotVersion,
          results: [...results, failure],
          diagnostics: failure.diagnostics || [],
          snapshot: buildSnapshot({ includeDestroyed: true }),
          metadata: isObject(metadata) ? { ...metadata } : {}
        };
      }

      snapshotVersion += 1;
      trimTombstones();
      results.forEach((result) => {
        result.snapshotVersion = snapshotVersion;
      });
      transaction.fabricDiagnostics.forEach(publishFabricDiagnostic);
      mirror();
      const currentSnapshot = buildSnapshot({ includeDestroyed: true });
      return {
        schema: SURFACE_APPLY_RESULT_SCHEMA,
        ok: true,
        operation: 'apply',
        operationCount: normalized.length,
        changed: transaction.changed,
        snapshotVersion,
        results,
        diagnostics: transaction.fabricDiagnostics.slice(),
        snapshot: currentSnapshot,
        metadata: isObject(metadata) ? { ...metadata } : {}
      };
    }

    function snapshot(optionsForSnapshot = {}) {
      snapshotVersion += 1;
      const event = diagnostic('xtend.surface.snapshot', null, 'snapshot', 'info', 'Surface snapshot captured.', {
        surfaceCount: registry.size,
        activeSurfaceId
      });
      mirror();
      return {
        ...buildSnapshot(optionsForSnapshot),
        diagnostic: event
      };
    }

    function readSnapshot(optionsForSnapshot = {}) {
      return buildSnapshot(optionsForSnapshot);
    }

    function dispose() {
      if (disposed) return createOperationResult(managerId, 'dispose', null, true, null, snapshotVersion);
      registry.clear();
      activeSurfaceId = null;
      disposed = true;
      snapshotVersion += 1;
      const event = diagnostic('xtend.surface.disposed', null, 'dispose', 'info', 'Surface controller disposed.');
      mirror();
      subscribers.clear();
      return createOperationResult(managerId, 'dispose', null, true, event, snapshotVersion);
    }

    function subscribe(listener, subscribeOptions = {}) {
      if (typeof listener !== 'function') throw new TypeError('Surface Controller subscribe() requires a listener.');
      if (disposed) return () => {};
      subscribers.add(listener);
      if (subscribeOptions.emitCurrent === true) listener(buildSnapshot());
      return () => subscribers.delete(listener);
    }

    diagnostic('xtend.surface.controller.created', null, 'create', 'info', 'Surface controller created.', {
      stateKey
    });
    mirror();

    return {
      schema: SURFACE_CONTROLLER_SCHEMA,
      managerId,
      stateKey,
      stateKeys: STATE_KEYS,
      contracts: CONTRACTS,
      registerSurface,
      openSurface,
      closeSurface,
      destroySurface,
      focusSurface,
      updateSurface,
      moveSurface,
      resizeSurface,
      minimizeSurface,
      maximizeSurface,
      restoreSurface,
      materializeSurface,
      toggleSurface,
      apply,
      snapshot,
      readSnapshot,
      subscribe,
      dispose
    };
  }

  return {
    CONTRACTS,
    DEFAULT_BOUNDS,
    DEFAULT_CAPABILITIES,
    DIAGNOSTIC_CODES,
    STATE_KEYS,
    SURFACE_CONTROLLER_SCHEMA,
    SURFACE_DIAGNOSTIC_SCHEMA,
    SURFACE_OPERATION_RESULT_SCHEMA,
    SURFACE_APPLY_RESULT_SCHEMA,
    SURFACE_RECORD_SCHEMA,
    SURFACE_SNAPSHOT_SCHEMA,
    SURFACE_TYPES,
    createSurfaceController,
    normalizeSurfaceBounds,
    normalizeSurfaceRecord
  };
});
