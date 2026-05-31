(function attachXtendSurfaceController(globalTarget, factory) {
  const api = factory(globalTarget);

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (globalTarget && typeof globalTarget === 'object') {
    globalTarget.XTendSurfaceController = Object.freeze({
      schema: api.SURFACE_CONTROLLER_SCHEMA,
      contracts: api.CONTRACTS,
      createSurfaceController: api.createSurfaceController,
      normalizeSurfaceRecord: api.normalizeSurfaceRecord,
      normalizeSurfaceBounds: api.normalizeSurfaceBounds
    });
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createXtendSurfaceControllerModule(globalTarget) {
  const SURFACE_CONTROLLER_SCHEMA = 'xtend.surface.controller.v1';
  const SURFACE_RECORD_SCHEMA = 'xtend.surface.record.v1';
  const SURFACE_SNAPSHOT_SCHEMA = 'xtend.surface.snapshot.v1';
  const SURFACE_DIAGNOSTIC_SCHEMA = 'xtend.surface.diagnostic.v1';
  const SURFACE_OPERATION_RESULT_SCHEMA = 'xtend.surface.operation-result.v1';
  const SURFACE_MANAGER_SCHEMA = 'xtend.surface.manager.v1';

  const CONTRACTS = Object.freeze({
    controller: SURFACE_CONTROLLER_SCHEMA,
    manager: SURFACE_MANAGER_SCHEMA,
    record: SURFACE_RECORD_SCHEMA,
    snapshot: SURFACE_SNAPSHOT_SCHEMA,
    diagnostic: SURFACE_DIAGNOSTIC_SCHEMA,
    operationResult: SURFACE_OPERATION_RESULT_SCHEMA
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
    'xtend.surface.snapshot',
    'xtend.surface.disposed',
    'xtend.surface.invalid-record',
    'xtend.surface.not-found',
    'xtend.surface.capability-refused',
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
    return new Date().toISOString();
  }

  function surfaceKey(pattern, surfaceId) {
    return String(pattern).replace('<surfaceId>', surfaceId);
  }

  function inferLane(operation) {
    if (operation === 'move' || operation === 'resize' || operation === 'update' || operation === 'restore' || operation === 'maximize') {
      return 'transition';
    }
    if (operation === 'snapshot' || operation === 'dispose') return 'diagnostics';
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

  function normalizeCapabilities(type, capabilities) {
    const defaults = DEFAULT_CAPABILITIES[type] || DEFAULT_CAPABILITIES.window;
    return unique([...defaults, ...(Array.isArray(capabilities) ? capabilities : [])]);
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
      zIndex: toNumber(source.zIndex || record.zIndex, 0),
      bounds,
      previousBounds: null,
      capabilities: normalizeCapabilities(type, source.capabilities || record.capabilities),
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
      zIndex: record.zIndex,
      capabilities: record.capabilities.slice(),
      persistence: { ...record.persistence },
      contentRef: record.contentRef,
      stateKey: record.stateKey,
      metadataKeys: record.metadataKeys.slice()
    };
  }

  function createSnapshotRecord(record) {
    return {
      ...createStatePayload(record),
      bounds: { ...record.bounds },
      previousBounds: record.previousBounds ? { ...record.previousBounds } : null,
      lifecycle: { ...record.lifecycle }
    };
  }

  function createOperationResult(managerId, operation, record, ok, diagnostic, snapshotVersion) {
    return {
      schema: SURFACE_OPERATION_RESULT_SCHEMA,
      ok,
      managerId,
      surfaceId: record && record.id || null,
      operation,
      code: diagnostic && diagnostic.code || null,
      phase: record && record.lifecycle && record.lifecycle.phase || null,
      snapshotVersion,
      diagnostic
    };
  }

  function createSurfaceController(options = {}) {
    const managerId = clampString(options.managerId, 'xtend.surface.manager');
    const stateKey = clampString(options.stateKey, STATE_KEYS.registry);
    const xstate = options.xstate || globalTarget && globalTarget.xstate || null;
    const fabric = options.fabric || null;
    const nowProvider = options.now;
    const registry = new Map();
    const diagnostics = [];
    const maxDiagnostics = Math.max(1, toNumber(options.maxDiagnostics, 50));
    let activeSurfaceId = null;
    let zIndexCursor = Math.max(1, toNumber(options.baseZIndex, 1000));
    let snapshotVersion = 0;
    let disposed = false;

    function mirrorState(key, value) {
      if (!xstate || typeof xstate.set !== 'function') return;
      try {
        xstate.set(key, value);
      } catch (error) {
        diagnostics.push({
          schema: SURFACE_DIAGNOSTIC_SCHEMA,
          code: 'xtend.surface.state-mirror.failed',
          severity: 'warning',
          managerId,
          surfaceId: null,
          operation: 'state-mirror',
          lane: 'diagnostics',
          message: 'Surface state mirror failed.',
          timestamp: nowIso(nowProvider),
          detail: {
            key,
            error: error && error.message || String(error)
          }
        });
      }
    }

    function publishFabricDiagnostic(diagnostic) {
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

    function buildSnapshot() {
      const surfaces = Array.from(registry.values()).map(createSnapshotRecord);
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
        surfaces,
        stack,
        diagnostics: diagnostics.slice(-maxDiagnostics),
        updatedAt: nowIso(nowProvider)
      };
    }

    function mirror() {
      const surfaces = Array.from(registry.values());
      mirrorState(STATE_KEYS.registry, surfaces.map(createStatePayload));
      mirrorState(STATE_KEYS.active, activeSurfaceId);
      surfaces.forEach((record) => {
        mirrorState(surfaceKey(STATE_KEYS.state, record.id), createStatePayload(record));
        mirrorState(surfaceKey(STATE_KEYS.bounds, record.id), { ...record.bounds });
        mirrorState(surfaceKey(STATE_KEYS.lifecycle, record.id), { ...record.lifecycle });
      });
      mirrorState(STATE_KEYS.diagnostics, diagnostics.slice(-maxDiagnostics));
      mirrorState(STATE_KEYS.snapshot, buildSnapshot());
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
      snapshotVersion += 1;
      if (record) {
        record.lifecycle = {
          phase,
          operation,
          lane: inferLane(operation),
          timestamp: nowIso(nowProvider)
        };
      }
      const event = diagnostic(code, record, operation, 'info', message, detail);
      mirror();
      return createOperationResult(managerId, operation, record, true, event, snapshotVersion);
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
        .filter((record) => record.id !== exceptId && record.status !== 'closed' && record.status !== 'minimized')
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
      registry.set(record.id, record);
      if (record.status === 'open') {
        record.zIndex = ++zIndexCursor;
      }
      return commit(record, 'register', 'create', 'xtend.surface.registered', `Surface ${record.id} registered.`, {
        replaced: Boolean(previous)
      });
    }

    function openSurface(id, input = {}) {
      const { record, failure } = getRecord(id, 'open');
      if (failure) return failure;
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
      if (Array.isArray(patch.capabilities)) record.capabilities = normalizeCapabilities(record.type, patch.capabilities);
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

    function snapshot() {
      snapshotVersion += 1;
      const event = diagnostic('xtend.surface.snapshot', null, 'snapshot', 'info', 'Surface snapshot captured.', {
        surfaceCount: registry.size,
        activeSurfaceId
      });
      mirror();
      return {
        ...buildSnapshot(),
        diagnostic: event
      };
    }

    function readSnapshot() {
      return buildSnapshot();
    }

    function dispose() {
      registry.clear();
      activeSurfaceId = null;
      disposed = true;
      snapshotVersion += 1;
      const event = diagnostic('xtend.surface.disposed', null, 'dispose', 'info', 'Surface controller disposed.');
      mirror();
      return createOperationResult(managerId, 'dispose', null, true, event, snapshotVersion);
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
      focusSurface,
      updateSurface,
      moveSurface,
      resizeSurface,
      minimizeSurface,
      maximizeSurface,
      restoreSurface,
      materializeSurface,
      toggleSurface,
      snapshot,
      readSnapshot,
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
    SURFACE_RECORD_SCHEMA,
    SURFACE_SNAPSHOT_SCHEMA,
    SURFACE_TYPES,
    createSurfaceController,
    normalizeSurfaceBounds,
    normalizeSurfaceRecord
  };
});
