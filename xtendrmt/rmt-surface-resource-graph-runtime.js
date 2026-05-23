(function attachRmtSurfaceResourceGraphRuntime(globalTarget) {
  const RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_SCHEMA = 'xtend.epic18.rmt-surface-resource-graph-runtime.v1';
  const RMT_SURFACE_RESOURCE_GRAPH_DIAGNOSTIC_SCHEMA = 'xtend.epic18.rmt-surface-resource-graph-diagnostic.v1';
  const DEFAULT_DIAGNOSTIC_CHANNEL = 'rmt.app_platform.surface_resource_graph';
  const DEFAULT_PORTAL_ID = 'portal.app';
  const DEFAULT_BOUNDS = Object.freeze({ x: 0, y: 0, width: 480, height: 320 });

  function clampString(value, fallback = '') {
    const normalized = String(value == null ? '' : value).trim();
    return normalized || fallback;
  }

  function toArray(value) {
    return Array.isArray(value) ? value : (value == null ? [] : [value]);
  }

  function objectRecord(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function cloneValue(value, fallback = null) {
    if (typeof value === 'undefined') return fallback;
    if (value === null || typeof value !== 'object') return value;
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (_) {
      return value;
    }
  }

  function cloneOverlayInstance(overlay, fallback = null) {
    if (!overlay) return fallback;
    const { element, ...safeOverlay } = overlay;
    return {
      ...cloneValue(safeOverlay, safeOverlay),
      elementMounted: Boolean(element)
    };
  }

  function readPath(source, path) {
    if (!path) return source;
    if (source && typeof source === 'object' && Object.prototype.hasOwnProperty.call(source, path)) return source[path];
    const parts = String(path).split('.').filter(Boolean);
    let cursor = source;
    for (const part of parts) {
      if (cursor == null) return undefined;
      if (part === 'length' && (Array.isArray(cursor) || typeof cursor === 'string')) return cursor.length;
      cursor = cursor[part];
    }
    return cursor;
  }

  function resourceIds(resources) {
    return toArray(resources)
      .map((resource) => typeof resource === 'string' ? resource : clampString(resource && resource.id))
      .filter(Boolean);
  }

  function normalizeBounds(bounds, fallback = DEFAULT_BOUNDS) {
    const source = objectRecord(bounds);
    const base = objectRecord(fallback);
    return {
      x: Number.isFinite(source.x) ? source.x : (Number.isFinite(base.x) ? base.x : DEFAULT_BOUNDS.x),
      y: Number.isFinite(source.y) ? source.y : (Number.isFinite(base.y) ? base.y : DEFAULT_BOUNDS.y),
      width: Number.isFinite(source.width) ? source.width : (Number.isFinite(base.width) ? base.width : DEFAULT_BOUNDS.width),
      height: Number.isFinite(source.height) ? source.height : (Number.isFinite(base.height) ? base.height : DEFAULT_BOUNDS.height)
    };
  }

  function resolveTemplateValue(value, context = {}) {
    if (Array.isArray(value)) return value.map((entry) => resolveTemplateValue(entry, context));
    if (value && typeof value === 'object') {
      const resolved = {};
      Object.entries(value).forEach(([key, entry]) => {
        resolved[key] = resolveTemplateValue(entry, context);
      });
      return resolved;
    }
    if (typeof value !== 'string') return value;

    const record = context.record || {};
    const surface = context.surface || {};
    const instance = context.instance || {};
    if (value === '$record') return record;
    if (value.startsWith('$record.')) return readPath(record, value.slice(8));
    if (value === '$surface') return surface;
    if (value.startsWith('$surface.')) return readPath(surface, value.slice(9));
    if (value === '$instance') return instance;
    if (value.startsWith('$instance.')) return readPath(instance, value.slice(10));
    if (value === '$index') return context.index;

    return value
      .replace(/\$\{record\.([^}]+)\}/gu, (_, path) => clampString(readPath(record, path), ''))
      .replace(/\$\{surface\.([^}]+)\}/gu, (_, path) => clampString(readPath(surface, path), ''))
      .replace(/\$\{instance\.([^}]+)\}/gu, (_, path) => clampString(readPath(instance, path), ''))
      .replace(/\$\{index\}/gu, clampString(context.index, '0'));
  }

  function createDiagnosticsRecorder(deps = {}) {
    const diagnostics = [];
    const diagnosticsHub = deps.diagnosticsHub || null;
    const channel = clampString(deps.diagnosticChannel, DEFAULT_DIAGNOSTIC_CHANNEL);
    return {
      diagnostics,
      publish(diagnostic) {
        diagnostics.push(diagnostic);
        if (diagnosticsHub && typeof diagnosticsHub.publish === 'function') {
          diagnosticsHub.publish(channel, diagnostic, {
            schema: RMT_SURFACE_RESOURCE_GRAPH_DIAGNOSTIC_SCHEMA
          });
        }
        return diagnostic;
      }
    };
  }

  function createDiagnostic(code, message, details = {}, severity = 'info') {
    return {
      schema: RMT_SURFACE_RESOURCE_GRAPH_DIAGNOSTIC_SCHEMA,
      code,
      message,
      severity,
      details: cloneValue(details, {})
    };
  }

  function normalizePortals(input) {
    const portals = toArray(input).map((portal) => {
      const source = objectRecord(portal);
      return {
        ...source,
        id: clampString(source.id),
        root: clampString(source.root || source.target, ''),
        layer: clampString(source.layer, source.id || 'app'),
        policy: clampString(source.policy, 'stacked'),
        focusPolicy: clampString(source.focusPolicy, 'preserve'),
        pointerPolicy: clampString(source.pointerPolicy, 'auto'),
        scrollPolicy: clampString(source.scrollPolicy, 'contain'),
        zIndexStart: Number.isFinite(source.zIndexStart) ? source.zIndexStart : 1000,
        zStep: Number.isFinite(source.zStep) ? source.zStep : 10,
        element: null,
        target: null,
        mounted: false
      };
    }).filter((portal) => portal.id);
    if (!portals.some((portal) => portal.id === DEFAULT_PORTAL_ID)) {
      portals.unshift({
        id: DEFAULT_PORTAL_ID,
        root: '',
        layer: 'app',
        policy: 'stacked',
        focusPolicy: 'preserve',
        pointerPolicy: 'auto',
        scrollPolicy: 'contain',
        zIndexStart: 1000,
        zStep: 10,
        element: null,
        target: null,
        mounted: false
      });
    }
    return portals;
  }

  function normalizeSurfaces(input) {
    return toArray(input).map((surface) => {
      const source = objectRecord(surface);
      const hasSource = Boolean(source.source || source.from || source.records);
      return {
        ...source,
        id: clampString(source.id),
        kind: clampString(source.kind || source.type, 'surface'),
        source: clampString(source.source || source.from, ''),
        repeat: source.repeat === true || hasSource,
        key: source.key || source.keyPath || '$record.id',
        owner: source.owner || source.ownerId || '',
        component: clampString(source.component || source.tag, ''),
        template: source.template || null,
        portal: clampString(source.portal, DEFAULT_PORTAL_ID),
        resources: resourceIds(source.resources),
        bounds: normalizeBounds(source.bounds || source.defaultBounds),
        placement: clampString(source.placement, ''),
        mode: clampString(source.mode, ''),
        initialState: clampString(source.initialState || source.state, 'closed'),
        persistent: source.persistent !== false,
        closeReleasesResources: source.closeReleasesResources === true,
        destroyOnClose: source.destroyOnClose === true,
        focusOnOpen: source.focusOnOpen !== false,
        preserveOnMinimize: source.preserveOnMinimize !== false
      };
    }).filter((surface) => surface.id);
  }

  function normalizeOverlays(input) {
    return toArray(input).map((overlay) => {
      const source = objectRecord(overlay);
      return {
        ...source,
        id: clampString(source.id),
        kind: clampString(source.kind || source.type, 'popover'),
        portal: clampString(source.portal, DEFAULT_PORTAL_ID),
        layer: clampString(source.layer, source.kind || source.type || 'overlay'),
        surface: clampString(source.surface, ''),
        component: clampString(source.component || source.tag, ''),
        template: source.template || null,
        attributes: objectRecord(source.attributes),
        resources: resourceIds(source.resources),
        dismissible: source.dismissible !== false,
        singleton: source.singleton !== false,
        focusPolicy: clampString(source.focusPolicy, 'restore-origin'),
        escapePolicy: clampString(source.escapePolicy, 'close-top'),
        pointerPolicy: clampString(source.pointerPolicy, 'auto'),
        scrollPolicy: clampString(source.scrollPolicy, 'contain'),
        closeReleasesResources: source.closeReleasesResources !== false
      };
    }).filter((overlay) => overlay.id);
  }

  function createRmtSurfaceResourceGraphRuntime(options = {}) {
    const portals = normalizePortals(options.portals);
    const surfaces = normalizeSurfaces(options.surfaces || options.surfaceTemplates || options.surfaceDefinitions);
    const overlays = normalizeOverlays(options.overlays || options.overlayDefinitions);
    const portalIndex = new Map(portals.map((portal) => [portal.id, portal]));
    const surfaceIndex = new Map(surfaces.map((surface) => [surface.id, surface]));
    const overlayIndex = new Map(overlays.map((overlay) => [overlay.id, overlay]));
    const instances = new Map();
    const overlayStack = [];
    const resourceManager = options.resourceManager || null;
    const eventRuntime = options.eventRuntime || null;
    const persistenceAdapter = options.persistenceAdapter || null;
    const focusAdapter = options.focusAdapter || null;
    const documentTarget = options.documentTarget || options.document || (globalTarget && globalTarget.document) || null;
    const surfaceManagerTarget = options.surfaceManager || options.managerElement || options.xSurfaceManager || null;
    const diagnosticsRecorder = createDiagnosticsRecorder(options);
    let focusSequence = 0;
    let overlaySequence = 0;

    function publish(code, message, details = {}, severity = 'info') {
      return diagnosticsRecorder.publish(createDiagnostic(code, message, details, severity));
    }

    function resolveSurfaceManagerTarget() {
      if (typeof surfaceManagerTarget === 'function') return surfaceManagerTarget();
      return surfaceManagerTarget;
    }

    function surfaceRuntimeType(kind) {
      const normalized = clampString(kind, 'surface').toLowerCase();
      if (['root', 'workspace', 'page', 'card', 'list', 'region', 'overlay-host', 'surface'].includes(normalized)) return 'region';
      if (['panel', 'side-panel', 'sidepanel'].includes(normalized)) return 'side-panel';
      if (['window', 'modal', 'dialog', 'drawer', 'popover', 'tooltip', 'toast', 'lightbox', 'menu'].includes(normalized)) return normalized;
      return 'region';
    }

    function surfaceManagerRecordForInstance(instance) {
      return {
        schema: 'xtend.surface.record.v1',
        id: instance.id,
        type: surfaceRuntimeType(instance.kind),
        kind: instance.kind,
        manager: clampString(options.managerId, 'xtend.surface.manager'),
        label: clampString(instance.label || instance.id, instance.id),
        stateKey: `xtend.surface.${instance.id}.state`,
        defaultOpen: instance.state === 'open',
        open: instance.state === 'open',
        bounds: cloneValue(instance.bounds, {}),
        placement: instance.placement || null,
        mode: instance.mode || (surfaceRuntimeType(instance.kind) === 'region' ? 'region' : 'floating'),
        capabilities: ['open', 'focus', 'close', 'minimize', 'restore', 'update', 'snapshot'],
        contentRef: instance.component,
        metadata: {
          source: 'rmt-surface-resource-graph-runtime',
          surfaceId: instance.surfaceId,
          portal: instance.portal,
          owner: instance.owner
        }
      };
    }

    function surfaceManagerRecordForOverlay(overlay, definition = {}) {
      return {
        schema: 'xtend.surface.record.v1',
        id: overlay.id,
        type: surfaceRuntimeType(overlay.kind),
        kind: overlay.kind,
        manager: clampString(options.managerId, 'xtend.surface.manager'),
        label: clampString(definition.label || definition.id || overlay.id, overlay.id),
        stateKey: `xtend.surface.${overlay.id}.state`,
        defaultOpen: true,
        open: true,
        placement: definition.placement || null,
        mode: 'overlay',
        capabilities: ['open', 'focus', 'close', 'update', 'snapshot'],
        contentRef: definition.component || '',
        metadata: {
          source: 'rmt-surface-resource-graph-runtime',
          overlayId: overlay.overlayId,
          portal: overlay.portal,
          ownerId: overlay.ownerId
        }
      };
    }

    function callSurfaceManager(methodName, args, details = {}) {
      const manager = resolveSurfaceManagerTarget();
      if (!manager || typeof manager[methodName] !== 'function') return null;
      try {
        return manager[methodName](...args);
      } catch (error) {
        publish('rmt.surface.manager_proxy.failed', `SurfaceManager proxy ${methodName} failed.`, {
          ...details,
          methodName,
          error: error && error.message || String(error)
        }, 'warning');
        return null;
      }
    }

    function proxySurfaceManager(operation, instance, payload = {}) {
      if (!instance) return null;
      const record = surfaceManagerRecordForInstance(instance);
      if (operation === 'register') return callSurfaceManager('registerSurface', [record], { instanceId: instance.id, operation });
      if (operation === 'open') return callSurfaceManager('openSurface', [instance.id, { bounds: instance.bounds, ...objectRecord(payload) }], { instanceId: instance.id, operation });
      if (operation === 'focus') return callSurfaceManager('focusSurface', [instance.id], { instanceId: instance.id, operation });
      if (operation === 'minimize') return callSurfaceManager('minimizeSurface', [instance.id], { instanceId: instance.id, operation });
      if (operation === 'restore') return callSurfaceManager('restoreSurface', [instance.id], { instanceId: instance.id, operation });
      if (operation === 'close' || operation === 'destroy') return callSurfaceManager('closeSurface', [instance.id, payload.reason || operation], { instanceId: instance.id, operation });
      if (operation === 'update') return callSurfaceManager('updateSurface', [instance.id, payload], { instanceId: instance.id, operation });
      return null;
    }

    function resolveRecords(surface, input) {
      if (Array.isArray(input)) return input;
      const sourceId = surface.source;
      const source = objectRecord(input);
      if (sourceId && Array.isArray(source[sourceId])) return source[sourceId];
      if (source.records && Array.isArray(source.records[sourceId])) return source.records[sourceId];
      if (source.data && Array.isArray(source.data[sourceId])) return source.data[sourceId];
      if (Array.isArray(surface.records)) return surface.records;
      return surface.repeat ? [] : [null];
    }

    function createInstanceId(surface, record, index) {
      if (!surface.repeat) return surface.id;
      const key = resolveTemplateValue(surface.key, { surface, record, index });
      const normalizedKey = clampString(key, Number.isFinite(index) ? String(index) : '0');
      return `${surface.id}:${normalizedKey}`;
    }

    function createInstance(surface, record = null, index = 0, existing = null) {
      const id = existing ? existing.id : createInstanceId(surface, record, index);
      const instanceShell = { id };
      const owner = clampString(resolveTemplateValue(surface.owner, {
        surface,
        record,
        index,
        instance: instanceShell
      }), id);
      const next = {
        id,
        surfaceId: surface.id,
        kind: surface.kind,
        key: surface.repeat ? id.slice(surface.id.length + 1) : surface.id,
        owner,
        source: surface.source,
        record: cloneValue(record, record),
        component: surface.component,
        template: surface.template,
        portal: surface.portal,
        placement: surface.placement,
        mode: surface.mode,
        persistent: surface.persistent,
        resources: surface.resources.slice(),
        resourcesAcquired: existing ? Boolean(existing.resourcesAcquired) : false,
        state: existing ? existing.state : surface.initialState,
        bounds: normalizeBounds(existing && existing.bounds || surface.bounds),
        previousBounds: existing ? cloneValue(existing.previousBounds, null) : null,
        minimizedAt: existing ? existing.minimizedAt : null,
        closedAt: existing ? existing.closedAt : null,
        destroyedAt: existing ? existing.destroyedAt : null,
        zIndex: existing ? existing.zIndex : 0,
        focusOrder: existing ? existing.focusOrder : 0,
        metadata: existing ? cloneValue(existing.metadata, {}) : {}
      };
      return next;
    }

    function ensureSurface(surfaceRef, optionsForCreate = {}) {
      const id = clampString(surfaceRef);
      const existing = instances.get(id);
      if (existing) return existing;
      const definition = surfaceIndex.get(id);
      if (!definition) throw new Error(`RMT Surface ${surfaceRef} ist nicht definiert.`);
      const created = createInstance(definition, optionsForCreate.record || null, 0, null);
      instances.set(created.id, created);
      publish('rmt.surface.materialized', `RMT Surface ${created.id} wurde materialisiert.`, {
        surfaceId: definition.id,
        instanceId: created.id,
        kind: created.kind
      });
      proxySurfaceManager('register', created);
      return created;
    }

    async function acquireResources(instance, context = {}) {
      if (!instance || instance.resourcesAcquired || instance.resources.length === 0) return [];
      if (!resourceManager || typeof resourceManager.acquireMany !== 'function') {
        publish('rmt.surface.resources.missing_manager', `RMT Surface ${instance.id} hat Ressourcen ohne Resource Manager.`, {
          instanceId: instance.id,
          resources: instance.resources
        }, 'warning');
        return [];
      }
      const records = await resourceManager.acquireMany(instance.resources, instance.owner, {
        surface: cloneValue(instance, instance),
        ...objectRecord(context)
      });
      instance.resourcesAcquired = true;
      publish('rmt.surface.resources.acquired', `RMT Surface ${instance.id} hat Ressourcen uebernommen.`, {
        instanceId: instance.id,
        owner: instance.owner,
        count: instance.resources.length
      });
      return records;
    }

    function releaseResources(instance, reason = 'release') {
      if (!instance || !instance.resourcesAcquired) return null;
      let report = null;
      if (resourceManager && typeof resourceManager.releaseOwner === 'function') {
        report = resourceManager.releaseOwner(instance.owner);
      }
      instance.resourcesAcquired = false;
      publish('rmt.surface.resources.released', `RMT Surface ${instance.id} hat Ressourcen freigegeben.`, {
        instanceId: instance.id,
        owner: instance.owner,
        reason,
        releasedCount: report && report.releasedCount || 0
      });
      return report;
    }

    function focusSurface(surfaceRef, metadata = {}) {
      const instance = ensureSurface(surfaceRef);
      focusSequence += 1;
      instance.focusOrder = focusSequence;
      instance.zIndex = Math.max(instance.zIndex, 100 + focusSequence);
      if (focusAdapter && typeof focusAdapter.focus === 'function') {
        focusAdapter.focus(cloneValue(instance, instance), metadata);
      }
      proxySurfaceManager('focus', instance, metadata);
      publish('rmt.surface.focused', `RMT Surface ${instance.id} wurde fokussiert.`, {
        instanceId: instance.id,
        focusOrder: instance.focusOrder,
        zIndex: instance.zIndex
      });
      return cloneValue(instance, instance);
    }

    function materialize(recordsBySource = {}, materializeOptions = {}) {
      const created = [];
      const reused = [];
      surfaces.forEach((surface) => {
        const records = resolveRecords(surface, recordsBySource);
        records.forEach((record, index) => {
          const id = createInstanceId(surface, record, index);
          const existing = instances.get(id);
          const next = createInstance(surface, record, index, existing && existing.state !== 'destroyed' ? existing : null);
          instances.set(id, next);
          if (existing && existing.state !== 'destroyed') reused.push(id);
          else created.push(id);
          proxySurfaceManager('register', next);
          publish('rmt.surface.materialized', `RMT Surface ${id} wurde materialisiert.`, {
            surfaceId: surface.id,
            instanceId: id,
            kind: surface.kind,
            reused: Boolean(existing && existing.state !== 'destroyed')
          });
        });
      });
      if (materializeOptions.hydrate === true) hydrateSnapshot();
      return {
        schema: 'xtend.epic18.rmt-surface-materialize-report.v1',
        createdCount: created.length,
        reusedCount: reused.length,
        created,
        reused
      };
    }

    async function openSurface(surfaceRef, openOptions = {}) {
      const instance = ensureSurface(surfaceRef, openOptions);
      if (instance.state === 'destroyed') instance.state = 'closed';
      await acquireResources(instance, openOptions);
      instance.state = 'open';
      instance.closedAt = null;
      instance.destroyedAt = null;
      if (openOptions.focus !== false && surfaceIndex.get(instance.surfaceId).focusOnOpen) {
        focusSurface(instance.id, openOptions);
      }
      publish('rmt.surface.opened', `RMT Surface ${instance.id} wurde geoeffnet.`, {
        instanceId: instance.id,
        resourcesAcquired: instance.resourcesAcquired
      });
      proxySurfaceManager('open', instance, openOptions);
      return cloneValue(instance, instance);
    }

    function minimizeSurface(surfaceRef, metadata = {}) {
      const instance = ensureSurface(surfaceRef);
      if (instance.state === 'destroyed') throw new Error(`RMT Surface ${surfaceRef} ist bereits zerstoert.`);
      instance.previousBounds = cloneValue(instance.bounds, instance.bounds);
      instance.state = 'minimized';
      instance.minimizedAt = metadata.at || 'static-local';
      publish('rmt.surface.minimized', `RMT Surface ${instance.id} wurde minimiert.`, {
        instanceId: instance.id,
        resourcesPreserved: instance.resourcesAcquired
      });
      proxySurfaceManager('minimize', instance, metadata);
      return cloneValue(instance, instance);
    }

    function restoreSurface(surfaceRef, metadata = {}) {
      const instance = ensureSurface(surfaceRef);
      if (instance.state === 'destroyed') throw new Error(`RMT Surface ${surfaceRef} ist bereits zerstoert.`);
      instance.state = 'open';
      if (instance.previousBounds) instance.bounds = normalizeBounds(instance.previousBounds, instance.bounds);
      publish('rmt.surface.restored', `RMT Surface ${instance.id} wurde wiederhergestellt.`, {
        instanceId: instance.id,
        bounds: instance.bounds
      });
      if (metadata.focus !== false) focusSurface(instance.id, metadata);
      proxySurfaceManager('restore', instance, metadata);
      return cloneValue(instance, instance);
    }

    function closeSurface(surfaceRef, metadata = {}) {
      const instance = ensureSurface(surfaceRef);
      const definition = surfaceIndex.get(instance.surfaceId) || {};
      if (definition.destroyOnClose || metadata.destroy === true) return destroySurface(instance.id, { reason: 'close' });
      instance.state = 'closed';
      instance.closedAt = metadata.at || 'static-local';
      if (definition.closeReleasesResources || metadata.releaseResources === true) {
        releaseResources(instance, 'close');
      }
      publish('rmt.surface.closed', `RMT Surface ${instance.id} wurde geschlossen.`, {
        instanceId: instance.id,
        resourcesAcquired: instance.resourcesAcquired
      });
      proxySurfaceManager('close', instance, metadata);
      return cloneValue(instance, instance);
    }

    function destroySurface(surfaceRef, metadata = {}) {
      const instance = ensureSurface(surfaceRef);
      overlayStack
        .filter((overlay) => overlay.state === 'open' && overlay.ownerId === instance.id)
        .forEach((overlay) => closeOverlay(overlay.id, { reason: 'surface-destroy' }));
      releaseResources(instance, metadata.reason || 'destroy');
      if (eventRuntime && typeof eventRuntime.detachOwner === 'function') {
        eventRuntime.detachOwner(instance.owner);
      }
      instance.state = 'destroyed';
      instance.destroyedAt = metadata.at || 'static-local';
      publish('rmt.surface.destroyed', `RMT Surface ${instance.id} wurde zerstoert.`, {
        instanceId: instance.id,
        owner: instance.owner
      });
      proxySurfaceManager('destroy', instance, metadata);
      return cloneValue(instance, instance);
    }

    function setBounds(surfaceRef, bounds, metadata = {}) {
      const instance = ensureSurface(surfaceRef);
      instance.previousBounds = cloneValue(instance.bounds, instance.bounds);
      instance.bounds = normalizeBounds(bounds, instance.bounds);
      publish('rmt.surface.bounds.changed', `RMT Surface ${instance.id} hat neue Bounds.`, {
        instanceId: instance.id,
        bounds: instance.bounds,
        reason: metadata.reason || 'set-bounds'
      });
      proxySurfaceManager('update', instance, { bounds: instance.bounds, reason: metadata.reason || 'set-bounds' });
      return cloneValue(instance, instance);
    }

    function moveSurface(surfaceRef, x, y) {
      const instance = ensureSurface(surfaceRef);
      return setBounds(instance.id, { ...instance.bounds, x, y }, { reason: 'move' });
    }

    function resizeSurface(surfaceRef, width, height) {
      const instance = ensureSurface(surfaceRef);
      return setBounds(instance.id, { ...instance.bounds, width, height }, { reason: 'resize' });
    }

    function mountPortal(portalRef, target) {
      const portal = portalIndex.get(clampString(portalRef));
      if (!portal) throw new Error(`RMT Portal ${portalRef} ist nicht definiert.`);
      portal.target = target || null;
      portal.mounted = true;
      if (!portal.element && portal.target && typeof portal.target.appendChild === 'function' && documentTarget && typeof documentTarget.createElement === 'function') {
        const portalElement = documentTarget.createElement('x-surface-portal');
        setDomAttribute(portalElement, 'portal-id', portal.id);
        setDomAttribute(portalElement, 'policy', portal.policy);
        setDomAttribute(portalElement, 'layer', portal.layer);
        setDomAttribute(portalElement, 'z-index-start', portal.zIndexStart);
        setDomAttribute(portalElement, 'z-step', portal.zStep);
        portal.target.appendChild(portalElement);
        portal.element = portalElement;
      }
      publish('rmt.portal.mounted', `RMT Portal ${portal.id} wurde gemountet.`, {
        portalId: portal.id,
        layer: portal.layer
      });
      return cloneValue(portal, portal);
    }

    function setDomAttribute(element, name, value) {
      if (!element || typeof element.setAttribute !== 'function' || value === null || typeof value === 'undefined' || value === false) return;
      element.setAttribute(name, value === true ? '' : String(value));
    }

    function resolvePortalTarget(portal, metadata = {}) {
      if (metadata.target && typeof metadata.target.appendChild === 'function') return metadata.target;
      if (portal && portal.target && typeof portal.target.appendChild === 'function') return portal.target;
      if (documentTarget && documentTarget.body && typeof documentTarget.body.appendChild === 'function') return documentTarget.body;
      return null;
    }

    function materializeOverlayElement(overlay, definition, portal, metadata = {}) {
      if (metadata.materialize === false) return null;
      const target = resolvePortalTarget(portal, metadata);
      if (!target || !documentTarget || typeof documentTarget.createElement !== 'function') return null;
      const tag = clampString(metadata.tag || definition.component || definition.tag, definition.kind === 'dialog' ? 'x-dialog' : definition.kind === 'lightbox' ? 'x-lightbox' : 'div');
      const element = documentTarget.createElement(tag);
      setDomAttribute(element, 'data-rmt-overlay', overlay.id);
      setDomAttribute(element, 'data-rmt-overlay-ref', overlay.overlayId);
      setDomAttribute(element, 'data-rmt-owner', overlay.ownerId);
      setDomAttribute(element, 'data-rmt-portal', overlay.portal);
      setDomAttribute(element, 'data-overlay-kind', overlay.kind);
      setDomAttribute(element, 'role', definition.kind === 'dialog' || definition.kind === 'lightbox' ? 'dialog' : undefined);
      setDomAttribute(element, 'open', true);
      Object.entries(objectRecord(definition.attributes)).forEach(([name, value]) => setDomAttribute(element, name, value));
      if (element.style && typeof element.style.setProperty === 'function') {
        element.style.setProperty('z-index', String(overlay.zIndex));
      }
      if (metadata.text && typeof documentTarget.createTextNode === 'function' && typeof element.appendChild === 'function') {
        element.appendChild(documentTarget.createTextNode(String(metadata.text)));
      }
      target.appendChild(element);
      portal.mounted = true;
      overlay.element = element;
      publish('rmt.overlay.materialized', `RMT Overlay ${overlay.id} wurde im Portal materialisiert.`, {
        overlayId: overlay.overlayId,
        instanceId: overlay.id,
        portal: portal.id,
        tag
      });
      return element;
    }

    function removeOverlayElement(overlay) {
      const element = overlay && overlay.element;
      if (!element) return false;
      if (typeof element.remove === 'function') {
        element.remove();
        overlay.element = null;
        return true;
      }
      if (element.parentNode && typeof element.parentNode.removeChild === 'function') {
        element.parentNode.removeChild(element);
        overlay.element = null;
        return true;
      }
      overlay.element = null;
      return false;
    }

    async function openOverlay(overlayRef, metadata = {}) {
      const definition = overlayIndex.get(clampString(overlayRef));
      if (!definition) throw new Error(`RMT Overlay ${overlayRef} ist nicht definiert.`);
      const portal = portalIndex.get(clampString(metadata.portal, definition.portal)) || portalIndex.get(DEFAULT_PORTAL_ID);
      const ownerId = clampString(metadata.ownerId || metadata.surfaceId || definition.surface, 'global');
      if (definition.singleton) {
        const existing = overlayStack.find((entry) => entry.state === 'open' && entry.overlayId === definition.id && entry.ownerId === ownerId);
        if (existing) return cloneOverlayInstance(existing, existing);
      }
      overlaySequence += 1;
      const openInPortal = overlayStack.filter((entry) => entry.state === 'open' && entry.portal === portal.id).length;
      const id = `${definition.id}:${ownerId}:${overlaySequence}`;
      const overlay = {
        id,
        overlayId: definition.id,
        kind: definition.kind,
        ownerId,
        portal: portal.id,
        layer: definition.layer,
        state: 'open',
        dismissible: definition.dismissible,
        focusPolicy: definition.focusPolicy,
        escapePolicy: definition.escapePolicy,
        pointerPolicy: definition.pointerPolicy,
        scrollPolicy: definition.scrollPolicy,
        zIndex: portal.zIndexStart + openInPortal * portal.zStep,
        resources: definition.resources.slice(),
        resourcesAcquired: false,
        payload: cloneValue(metadata.payload, {}),
        openedAt: metadata.at || 'static-local',
        closedAt: null,
        element: null
      };
      overlayStack.push(overlay);
      const overlayRecord = surfaceManagerRecordForOverlay(overlay, definition);
      callSurfaceManager('registerSurface', [overlayRecord], { overlayId: overlay.overlayId, instanceId: overlay.id, operation: 'register-overlay' });
      callSurfaceManager('openSurface', [overlay.id, { zIndex: overlay.zIndex, portal: overlay.portal }], { overlayId: overlay.overlayId, instanceId: overlay.id, operation: 'open-overlay' });
      if (definition.resources.length > 0) {
        const overlayOwner = overlay.id;
        if (resourceManager && typeof resourceManager.acquireMany === 'function') {
          await resourceManager.acquireMany(definition.resources, overlayOwner, {
            overlay: cloneValue(overlay, overlay),
            surface: instances.get(ownerId) || null
          });
          overlay.resourcesAcquired = true;
        } else {
          publish('rmt.overlay.resources.missing_manager', `RMT Overlay ${definition.id} hat Ressourcen ohne Resource Manager.`, {
            overlayId: definition.id,
            resources: definition.resources
          }, 'warning');
        }
      }
      materializeOverlayElement(overlay, definition, portal, metadata);
      publish('rmt.overlay.opened', `RMT Overlay ${definition.id} wurde geoeffnet.`, {
        overlayId: definition.id,
        instanceId: overlay.id,
        kind: overlay.kind,
        portal: overlay.portal,
        zIndex: overlay.zIndex
      });
      return cloneOverlayInstance(overlay, overlay);
    }

    function closeOverlay(overlayRef, metadata = {}) {
      const ref = clampString(overlayRef);
      const openOverlays = overlayStack.filter((entry) => entry.state === 'open');
      const overlay = openOverlays
        .filter((entry) => entry.id === ref || entry.overlayId === ref)
        .sort((left, right) => right.zIndex - left.zIndex)[0];
      if (!overlay) {
        return {
          schema: 'xtend.epic18.rmt-overlay-close-report.v1',
          closed: false,
          overlay: ref
        };
      }
      overlay.state = 'closed';
      overlay.closedAt = metadata.at || 'static-local';
      const definition = overlayIndex.get(overlay.overlayId) || {};
      const removedElement = removeOverlayElement(overlay);
      if (overlay.resourcesAcquired && definition.closeReleasesResources !== false && resourceManager && typeof resourceManager.releaseOwner === 'function') {
        resourceManager.releaseOwner(overlay.id);
        overlay.resourcesAcquired = false;
      }
      publish('rmt.overlay.closed', `RMT Overlay ${overlay.overlayId} wurde geschlossen.`, {
        overlayId: overlay.overlayId,
        instanceId: overlay.id,
        reason: metadata.reason || 'close',
        removedElement
      });
      callSurfaceManager('closeSurface', [overlay.id, metadata.reason || 'close'], { overlayId: overlay.overlayId, instanceId: overlay.id, operation: 'close-overlay' });
      return {
        schema: 'xtend.epic18.rmt-overlay-close-report.v1',
        closed: true,
        overlay: cloneOverlayInstance(overlay, overlay)
      };
    }

    function closeTopOverlay(metadata = {}) {
      const reason = clampString(metadata.reason, 'escape');
      const portal = clampString(metadata.portal, '');
      const candidate = overlayStack
        .filter((entry) => entry.state === 'open')
        .filter((entry) => !portal || entry.portal === portal)
        .filter((entry) => entry.dismissible)
        .filter((entry) => reason !== 'escape' || entry.escapePolicy !== 'ignore')
        .sort((left, right) => right.zIndex - left.zIndex)[0];
      if (!candidate) {
        return {
          schema: 'xtend.epic18.rmt-overlay-close-report.v1',
          closed: false,
          reason
        };
      }
      return closeOverlay(candidate.id, { reason });
    }

    function getSnapshot() {
      return {
        schema: 'xtend.epic18.rmt-surface-resource-graph-snapshot.v1',
        runtimeSchema: RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_SCHEMA,
        surfaces: [...instances.values()].map((instance) => ({
          id: instance.id,
          surfaceId: instance.surfaceId,
          kind: instance.kind,
          key: instance.key,
          owner: instance.owner,
          state: instance.state,
          bounds: cloneValue(instance.bounds, instance.bounds),
          previousBounds: cloneValue(instance.previousBounds, null),
          zIndex: instance.zIndex,
          focusOrder: instance.focusOrder,
          resourcesAcquired: instance.resourcesAcquired,
          metadata: cloneValue(instance.metadata, {})
        })),
        overlays: overlayStack.filter((entry) => entry.state === 'open').map((entry) => cloneOverlayInstance(entry, entry)),
        portals: portals.map((portal) => ({
          id: portal.id,
          layer: portal.layer,
          policy: portal.policy,
          zIndexStart: portal.zIndexStart,
          zStep: portal.zStep,
          mounted: portal.mounted
        }))
      };
    }

    function persistSnapshot() {
      const snapshot = getSnapshot();
      if (persistenceAdapter && typeof persistenceAdapter.save === 'function') {
        persistenceAdapter.save(snapshot);
      }
      publish('rmt.surface.snapshot.persisted', 'RMT Surface Graph Snapshot wurde persistiert.', {
        surfaceCount: snapshot.surfaces.length,
        overlayCount: snapshot.overlays.length
      });
      return snapshot;
    }

    function hydrateSnapshot(snapshot) {
      const source = snapshot || (persistenceAdapter && typeof persistenceAdapter.load === 'function' ? persistenceAdapter.load() : null);
      if (!source || !Array.isArray(source.surfaces)) {
        return {
          schema: 'xtend.epic18.rmt-surface-hydrate-report.v1',
          hydratedCount: 0
        };
      }
      let hydratedCount = 0;
      source.surfaces.forEach((entry) => {
        const current = instances.get(entry.id);
        if (!current) return;
        current.state = clampString(entry.state, current.state);
        current.bounds = normalizeBounds(entry.bounds, current.bounds);
        current.previousBounds = cloneValue(entry.previousBounds, current.previousBounds);
        current.zIndex = Number.isFinite(entry.zIndex) ? entry.zIndex : current.zIndex;
        current.focusOrder = Number.isFinite(entry.focusOrder) ? entry.focusOrder : current.focusOrder;
        current.metadata = cloneValue(entry.metadata, current.metadata);
        hydratedCount += 1;
      });
      publish('rmt.surface.snapshot.hydrated', 'RMT Surface Graph Snapshot wurde hydriert.', {
        hydratedCount
      });
      return {
        schema: 'xtend.epic18.rmt-surface-hydrate-report.v1',
        hydratedCount
      };
    }

    return Object.freeze({
      schema: RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_SCHEMA,
      materialize,
      openSurface,
      closeSurface,
      destroySurface,
      minimizeSurface,
      restoreSurface,
      focusSurface,
      setBounds,
      moveSurface,
      resizeSurface,
      openOverlay,
      closeOverlay,
      closeTopOverlay,
      mountPortal,
      persistSnapshot,
      hydrateSnapshot,
      getSnapshot,
      getSurface(surfaceRef) {
        const instance = instances.get(clampString(surfaceRef));
        return instance ? cloneValue(instance, instance) : null;
      },
      listSurfaces() {
        return surfaces.map((surface) => cloneValue(surface, surface));
      },
      listInstances(optionsForList = {}) {
        return [...instances.values()]
          .filter((instance) => optionsForList.includeDestroyed === true || instance.state !== 'destroyed')
          .map((instance) => cloneValue(instance, instance));
      },
      listOverlays(optionsForList = {}) {
        return overlayStack
          .filter((overlay) => optionsForList.includeClosed === true || overlay.state === 'open')
          .map((overlay) => cloneOverlayInstance(overlay, overlay));
      },
      listPortals() {
        return portals.map((portal) => cloneValue(portal, portal));
      },
      listDiagnostics() {
        return diagnosticsRecorder.diagnostics.slice();
      }
    });
  }

  const api = {
    RMT_SURFACE_RESOURCE_GRAPH_DIAGNOSTIC_SCHEMA,
    RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_SCHEMA,
    createRmtSurfaceResourceGraphRuntime
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (globalTarget) {
    globalTarget.XTendRmtSurfaceResourceGraphRuntime = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));

const __XTEND_RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_API__ = globalThis.XTendRmtSurfaceResourceGraphRuntime;

export const RMT_SURFACE_RESOURCE_GRAPH_DIAGNOSTIC_SCHEMA = __XTEND_RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_API__.RMT_SURFACE_RESOURCE_GRAPH_DIAGNOSTIC_SCHEMA;
export const RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_SCHEMA = __XTEND_RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_API__.RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_SCHEMA;
export const createRmtSurfaceResourceGraphRuntime = __XTEND_RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_API__.createRmtSurfaceResourceGraphRuntime;

export default __XTEND_RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_API__;
