(function attachRmtSurfaceResourceGraphRuntime(globalTarget) {
  const RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_SCHEMA = 'xtend.epic18.rmt-surface-resource-graph-runtime.v2';
  const RMT_SURFACE_RESOURCE_GRAPH_DIAGNOSTIC_SCHEMA = 'xtend.epic18.rmt-surface-resource-graph-diagnostic.v1';
  const DEFAULT_DIAGNOSTIC_CHANNEL = 'rmt.app_platform.surface_resource_graph';
  const DEFAULT_PORTAL_ID = 'portal.app';
  const DEFAULT_BOUNDS = Object.freeze({ x: 0, y: 0, width: 480, height: 320 });
  const UNSAFE_PATH_SEGMENTS = new Set(['__proto__', 'prototype', 'constructor']);

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

  function normalizePathSegments(path) {
    return String(path || '')
      .replace(/\[([0-9]+)\]/gu, '.$1')
      .split('.')
      .filter(Boolean);
  }

  function assertSafePathSegments(path) {
    const parts = normalizePathSegments(path);
    const unsafeSegment = parts.find((part) => UNSAFE_PATH_SEGMENTS.has(String(part).toLowerCase()));
    if (unsafeSegment) {
      const diagnostic = createDiagnostic(
        'rmt.surface.path.unsafe',
        `Unsicheres Surface-Pfadsegment ${unsafeSegment}.`,
        { path: String(path || ''), segment: unsafeSegment },
        'error'
      );
      const error = new Error(diagnostic.message);
      error.code = diagnostic.code;
      error.diagnostic = diagnostic;
      throw error;
    }
    return parts;
  }

  function readPath(source, path) {
    if (!path) return source;
    const parts = assertSafePathSegments(path);
    if (source && typeof source === 'object' && Object.prototype.hasOwnProperty.call(source, path)) return source[path];
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
      const resolved = Object.create(null);
      Object.entries(value).forEach(([key, entry]) => {
        assertSafePathSegments(key);
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
    const strict = options.strict === true || options.strictMaraca === true;
    let domRenderer = options.domRenderer || options.renderer || null;
    const surfaceControllerTarget = options.surfaceController || options.surfaceManager || options.managerElement || options.xSurfaceManager || null;
    const diagnosticsRecorder = createDiagnosticsRecorder(options);
    const managedSurfaceManagerIds = new Set();
    const surfaceManagerBridgeId = clampString(options.surfaceManagerBridgeId || options.runtimeId, 'rmt-surface-resource-graph-runtime');
    let focusSequence = 0;
    let overlaySequence = 0;
    let sharedRendererMissingReported = false;
    let compatibilityRendererAttempted = false;
    let compatibilityRendererUnavailableReported = false;
    let ownsDomRenderer = false;
    let surfaceControllerMissingReported = false;
    let surfaceControllerApplyMissingReported = false;
    let disposed = false;
    let disposing = false;

    function publish(code, message, details = {}, severity = 'info') {
      return diagnosticsRecorder.publish(createDiagnostic(code, message, details, severity));
    }

    if (!options.surfaceController && options.surfaceManager) {
      publish(
        'rmt.surface.mvc.legacy-manager-alias',
        'surfaceManager is a 0.6 compatibility alias; inject surfaceController as the lifecycle authority.',
        { adapter: 'surface-resource-graph-runtime' },
        'info'
      );
    }

    function assertActive(operation) {
      if (!disposed && !disposing) return;
      const error = new Error(`RMT Surface Resource Graph is disposed and cannot run ${operation}.`);
      error.code = 'rmt.surface.runtime.disposed';
      throw error;
    }

    function sharedRenderer(target = null) {
      if (domRenderer && typeof domRenderer.commit === 'function') return domRenderer;
      if (!sharedRendererMissingReported) {
        sharedRendererMissingReported = true;
        publish(
          'rmt.dom.shared-renderer-missing',
          strict
            ? 'Surface Resource Graph requires the shared RMT DOM renderer in strict mode.'
            : 'Surface Resource Graph is creating one compatibility renderer because no shared renderer was injected.',
          { adapter: 'surface-resource-graph-runtime' },
          strict ? 'error' : 'warning'
        );
      }
      if (strict) {
        const error = new Error('Strict Surface Resource Graph requires the shared RMT DOM renderer.');
        error.code = 'rmt.dom.shared-renderer-missing';
        throw error;
      }
      if (!compatibilityRendererAttempted) {
        compatibilityRendererAttempted = true;
        const factory = globalTarget
          && globalTarget.XTendRmtDomDescriptorRenderer
          && globalTarget.XTendRmtDomDescriptorRenderer.createRmtDomDescriptorRenderer;
        const rendererDocument = documentTarget
          || target && target.ownerDocument
          || null;
        if (typeof factory === 'function' && rendererDocument) {
          try {
            domRenderer = factory({
              documentTarget: rendererDocument,
              diagnosticsHub: options.diagnosticsHub,
              diagnosticChannel: options.diagnosticChannel
            });
            ownsDomRenderer = Boolean(domRenderer && typeof domRenderer.commit === 'function');
          } catch (_) {
            domRenderer = null;
          }
        }
      }
      if (domRenderer && typeof domRenderer.commit === 'function') return domRenderer;
      if (!compatibilityRendererUnavailableReported) {
        compatibilityRendererUnavailableReported = true;
        publish(
          'rmt.dom.compatibility-renderer-unavailable',
          'Surface Resource Graph could not create the required compatibility DOM renderer.',
          { adapter: 'surface-resource-graph-runtime' },
          'error'
        );
      }
      const error = new Error('Surface Resource Graph requires a DOM renderer; compatibility renderer creation failed.');
      error.code = 'rmt.dom.compatibility-renderer-unavailable';
      throw error;
    }

    function surfaceGraphOwnership() {
      return {
        owner: 'surface-resource-graph',
        domains: {
          structure: 'surface-resource-graph',
          content: 'surface-resource-graph',
          attributes: 'surface-resource-graph',
          properties: 'surface-resource-graph',
          class: 'surface-resource-graph',
          part: 'surface-resource-graph',
          styleTokens: 'surface-resource-graph'
        },
        mode: strict ? 'strict' : 'compatibility'
      };
    }

    function createDescriptorNode(descriptor, target, pointer, renderContext = {}) {
      const renderer = sharedRenderer(target);
      if (!renderer) return null;
      const result = renderer.commit({
        operation: 'create-node',
        descriptor,
        context: {
          ...objectRecord(renderContext),
          source: {
            ...objectRecord(renderContext && renderContext.source),
            nodeId: clampString(descriptor && descriptor.attributes && (
              descriptor.attributes['data-rmt-overlay']
              || descriptor.attributes['portal-id']
            ), 'surface-resource'),
            pointer
          }
        },
        ownership: surfaceGraphOwnership()
      });
      const nodes = toArray(result && result.nodes).filter(Boolean);
      return nodes[0] || result && result.target || null;
    }

    function disposeDomNode(node) {
      if (!node) return false;
      const renderer = domRenderer && typeof domRenderer.dispose === 'function' ? domRenderer : null;
      if (renderer) {
        try {
          renderer.dispose(node, { clearOwnedDom: true });
        } catch (error) {
          publish('rmt.surface.dom_dispose.failed', 'Owned surface DOM could not be disposed cleanly.', {
            error: error && error.message || String(error)
          }, 'warning');
        }
      }
      try {
        if (typeof node.remove === 'function') {
          node.remove();
          return true;
        }
        if (node.parentNode && typeof node.parentNode.removeChild === 'function') {
          node.parentNode.removeChild(node);
          return true;
        }
      } catch (error) {
        publish('rmt.surface.dom_remove.failed', 'Owned surface DOM could not be removed cleanly.', {
          error: error && error.message || String(error)
        }, 'warning');
      }
      return false;
    }

    function resolveSurfaceManagerTarget() {
      if (typeof surfaceControllerTarget === 'function') return surfaceControllerTarget();
      return surfaceControllerTarget;
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
        capabilities: ['open', 'focus', 'close', 'destroy', 'minimize', 'restore', 'update', 'snapshot'],
        contentRef: instance.component,
        metadata: {
          source: 'rmt-surface-resource-graph-runtime',
          bridgeId: surfaceManagerBridgeId,
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
        capabilities: ['open', 'focus', 'close', 'destroy', 'update', 'snapshot'],
        contentRef: definition.component || '',
        metadata: {
          source: 'rmt-surface-resource-graph-runtime',
          bridgeId: surfaceManagerBridgeId,
          overlayId: overlay.overlayId,
          portal: overlay.portal,
          ownerId: overlay.ownerId
        }
      };
    }

    function readSurfaceManagerSnapshot(manager) {
      if (!manager) return null;
      try {
        if (typeof manager.readSnapshot === 'function') return manager.readSnapshot({ includeDestroyed: true });
        if (typeof manager.snapshot === 'function') return manager.snapshot({ includeDestroyed: true });
      } catch (error) {
        publish('rmt.surface.manager_proxy.snapshot_failed', 'SurfaceManager snapshot could not be read for RMT bridge policy.', {
          error: error && error.message || String(error)
        }, 'warning');
      }
      return null;
    }

    function findSurfaceManagerRecord(manager, surfaceId) {
      const snapshot = readSurfaceManagerSnapshot(manager);
      const surfaces = snapshot && Array.isArray(snapshot.surfaces) ? snapshot.surfaces : [];
      return surfaces.find((record) => record && record.id === surfaceId) || null;
    }

    function isRmtBridgeRecord(record) {
      const metadata = objectRecord(record && record.metadata);
      return metadata.source === 'rmt-surface-resource-graph-runtime' && metadata.bridgeId === surfaceManagerBridgeId;
    }

    function authorizeSurfaceManagerCall(manager, methodName, args, details = {}) {
      const operation = clampString(details.operation, methodName);
      const record = methodName === 'registerSurface' ? objectRecord(args[0]) : {};
      const surfaceId = clampString(record.id || args[0]);
      if (!surfaceId) return true;

      if (methodName === 'registerSurface') {
        const existingRecord = findSurfaceManagerRecord(manager, surfaceId);
        if (existingRecord && !managedSurfaceManagerIds.has(surfaceId) && !isRmtBridgeRecord(existingRecord)) {
          publish('rmt.surface.manager_proxy.denied', 'RMT SurfaceManager proxy refused to replace a host-owned surface.', {
            ...details,
            methodName,
            surfaceId,
            bridgeId: surfaceManagerBridgeId
          }, 'warning');
          return false;
        }
        return true;
      }

      if (!managedSurfaceManagerIds.has(surfaceId)) {
        publish('rmt.surface.manager_proxy.denied', 'RMT SurfaceManager proxy refused an operation for an unmanaged surface id.', {
          ...details,
          methodName,
          surfaceId,
          operation,
          bridgeId: surfaceManagerBridgeId
        }, 'warning');
        return false;
      }
      return true;
    }

    function callSurfaceManager(methodName, args, details = {}) {
      const manager = resolveSurfaceManagerTarget();
      if (!manager) {
        if (!surfaceControllerMissingReported) {
          surfaceControllerMissingReported = true;
          publish(
            'rmt.surface.mvc.controller-missing',
            strict
              ? 'Strict Surface Resource Graph requires an injected surfaceController.'
              : 'Surface Resource Graph is running without a lifecycle controller in compatibility mode.',
            { methodName },
            strict ? 'error' : 'warning'
          );
        }
        return strict
          ? { ok: false, code: 'rmt.surface.mvc.controller-missing', methodName }
          : { ok: true, compatibility: true, methodName };
      }
      if (typeof manager[methodName] !== 'function') {
        return { ok: false, code: 'rmt.surface.mvc.controller-method-missing', methodName };
      }
      if (!authorizeSurfaceManagerCall(manager, methodName, args, details)) {
        return { ok: false, code: 'rmt.surface.manager_proxy.denied', methodName };
      }
      try {
        const result = manager[methodName](...args) || { ok: true };
        if (methodName === 'registerSurface') {
          const record = objectRecord(args[0]);
          const surfaceId = clampString(record.id);
          const succeeded = !result || result.ok !== false;
          if (surfaceId && succeeded) managedSurfaceManagerIds.add(surfaceId);
        }
        return result;
      } catch (error) {
        publish('rmt.surface.manager_proxy.failed', `SurfaceManager proxy ${methodName} failed.`, {
          ...details,
          methodName,
          error: error && error.message || String(error)
        }, 'warning');
        return {
          ok: false,
          code: error && error.code || 'rmt.surface.manager_proxy.failed',
          methodName,
          error
        };
      }
    }

    function callSurfaceControllerApply(operations, details = {}) {
      const manager = resolveSurfaceManagerTarget();
      if (!manager) {
        return callSurfaceManager('apply', [operations, details], details);
      }
      if (typeof manager.apply !== 'function') {
        if (!surfaceControllerApplyMissingReported) {
          surfaceControllerApplyMissingReported = true;
          publish(
            'rmt.surface.mvc.atomic-apply-missing',
            strict
              ? 'Strict Surface Resource Graph requires surfaceController.apply() for atomic lifecycle changes.'
              : 'Surface controller has no atomic apply(); compatibility mode will serialize legacy calls.',
            { operationCount: operations.length },
            strict ? 'error' : 'warning'
          );
        }
        if (strict) {
          return { ok: false, code: 'rmt.surface.mvc.atomic-apply-missing', methodName: 'apply' };
        }
        const results = [];
        for (const operation of operations) {
          const methodName = operation.operation;
          const args = Array.isArray(operation.args) ? operation.args : [];
          let result = callSurfaceManager(methodName, args, { ...details, operation: details.operation || methodName });
          if (methodName === 'destroySurface' && result && result.code === 'rmt.surface.mvc.controller-method-missing') {
            result = callSurfaceManager('closeSurface', [args[0], args[1] && args[1].reason || 'destroy'], {
              ...details,
              operation: 'destroy-fallback-close'
            });
          }
          results.push(result);
          if (result && result.ok === false) {
            return { ok: false, code: result.code, methodName, results };
          }
        }
        return { ok: true, compatibility: true, changed: operations.length > 0, results };
      }
      const registeringIds = new Set(operations
        .filter((operation) => operation.operation === 'registerSurface')
        .map((operation) => clampString(operation.args && operation.args[0] && operation.args[0].id))
        .filter(Boolean));
      for (const operation of operations) {
        const methodName = operation.operation;
        const args = Array.isArray(operation.args) ? operation.args : [];
        if (methodName !== 'registerSurface' && registeringIds.has(clampString(args[0]))) continue;
        if (!authorizeSurfaceManagerCall(manager, methodName, args, details)) {
          return { ok: false, code: 'rmt.surface.manager_proxy.denied', methodName };
        }
      }
      const requests = operations.map((operation) => {
        const args = Array.isArray(operation.args) ? operation.args : [];
        const methodName = operation.operation;
        if (methodName === 'registerSurface') return { operation: methodName, record: args[0] };
        if (methodName === 'closeSurface') return { operation: methodName, id: args[0], reason: args[1] };
        if (methodName === 'destroySurface') return { operation: methodName, id: args[0], options: args[1] };
        if (methodName === 'updateSurface') return { operation: methodName, id: args[0], patch: args[1] };
        if (methodName === 'moveSurface' || methodName === 'resizeSurface') return { operation: methodName, id: args[0], bounds: args[1] };
        return { operation: methodName, id: args[0], input: args[1] };
      });
      try {
        const result = manager.apply(requests, {
          source: 'rmt-surface-resource-graph-runtime',
          bridgeId: surfaceManagerBridgeId,
          ...objectRecord(details)
        }) || { ok: true };
        if (result.ok !== false) {
          operations.forEach((operation) => {
            if (operation.operation !== 'registerSurface') return;
            const record = objectRecord(operation.args && operation.args[0]);
            if (record.id) managedSurfaceManagerIds.add(String(record.id));
          });
        }
        return result;
      } catch (error) {
        return {
          ok: false,
          code: error && error.code || 'rmt.surface.manager_proxy.failed',
          methodName: 'apply',
          error
        };
      }
    }

    function requireSurfaceControllerResult(result, operation, subjectId) {
      if (!result || result.ok !== false) return result;
      const diagnostic = publish(
        result.code || 'rmt.surface.mvc.controller-refused',
        `Surface controller refused ${operation} before resource or DOM projection.`,
        { operation, subjectId: subjectId || null, methodName: result.methodName || null },
        'error'
      );
      const error = new Error(diagnostic.message);
      error.code = diagnostic.code;
      error.diagnostic = diagnostic;
      throw error;
    }

    function proxySurfaceManager(operation, instance, payload = {}) {
      if (!instance) return null;
      const record = surfaceManagerRecordForInstance(instance);
      if (operation === 'register') return callSurfaceManager('registerSurface', [record], { instanceId: instance.id, operation });
      if (operation === 'open') return callSurfaceManager('openSurface', [instance.id, { bounds: instance.bounds, ...objectRecord(payload) }], { instanceId: instance.id, operation });
      if (operation === 'focus') return callSurfaceManager('focusSurface', [instance.id], { instanceId: instance.id, operation });
      if (operation === 'minimize') return callSurfaceManager('minimizeSurface', [instance.id], { instanceId: instance.id, operation });
      if (operation === 'restore') return callSurfaceManager('restoreSurface', [instance.id], { instanceId: instance.id, operation });
      if (operation === 'materialize') return callSurfaceManager('materializeSurface', [instance.id, payload], { instanceId: instance.id, operation });
      if (operation === 'toggle') return callSurfaceManager('toggleSurface', [instance.id, payload], { instanceId: instance.id, operation });
      if (operation === 'close') return callSurfaceManager('closeSurface', [instance.id, payload.reason || operation], { instanceId: instance.id, operation });
      if (operation === 'destroy') {
        const destroyResult = callSurfaceManager('destroySurface', [instance.id, payload], { instanceId: instance.id, operation });
        if (!destroyResult || destroyResult.code !== 'rmt.surface.mvc.controller-method-missing') return destroyResult;
        publish('rmt.surface.manager_proxy.degraded', 'SurfaceManager target does not support destroySurface(); falling back to closeSurface().', {
          instanceId: instance.id,
          operation,
          reason: payload.reason || 'destroy'
        }, 'warning');
        return callSurfaceManager('closeSurface', [instance.id, payload.reason || operation], { instanceId: instance.id, operation: 'destroy-fallback-close' });
      }
      if (operation === 'update') return callSurfaceManager('updateSurface', [instance.id, payload], { instanceId: instance.id, operation });
      return null;
    }

    function controllerRecord(surfaceId, snapshotHint = null) {
      const manager = resolveSurfaceManagerTarget();
      const snapshot = snapshotHint && Array.isArray(snapshotHint.surfaces)
        ? snapshotHint
        : readSurfaceManagerSnapshot(manager);
      const records = snapshot && Array.isArray(snapshot.surfaces) ? snapshot.surfaces : [];
      return records.find((record) => record && record.id === surfaceId) || null;
    }

    function syncLifecycleProjection(handle, snapshotHint = null, compatibilityProjection = null) {
      if (!handle) return handle;
      const record = controllerRecord(handle.id, snapshotHint);
      if (!record) {
        if (!strict && compatibilityProjection) {
          if (compatibilityProjection.state) handle.state = compatibilityProjection.state;
          if (compatibilityProjection.bounds) handle.bounds = normalizeBounds(compatibilityProjection.bounds, handle.bounds);
          handle.metadata = {
            ...objectRecord(handle.metadata),
            lifecycleProjection: true,
            compatibilityProjection: true
          };
        }
        return handle;
      }
      handle.state = clampString(record.status, handle.state);
      handle.bounds = normalizeBounds(record.bounds, handle.bounds);
      handle.previousBounds = cloneValue(record.previousBounds, handle.previousBounds);
      handle.zIndex = Number.isFinite(record.zIndex) ? record.zIndex : handle.zIndex;
      handle.metadata = {
        ...objectRecord(handle.metadata),
        lifecycleProjection: true,
        controllerVersion: snapshotHint && Number.isFinite(snapshotHint.version) ? snapshotHint.version : null,
        generation: Number(record.generation || objectRecord(handle.metadata).generation || 1)
      };
      return handle;
    }

    function lifecycleState(handle) {
      const record = handle && controllerRecord(handle.id);
      return record && clampString(record.status, '') || handle && handle.state || 'closed';
    }

    function projectHandle(handle) {
      if (!handle) return null;
      syncLifecycleProjection(handle);
      return cloneValue(handle, handle);
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
      const registration = callSurfaceControllerApply([{
        operation: 'registerSurface',
        args: [surfaceManagerRecordForInstance(created)]
      }], { instanceId: created.id, operation: 'register' });
      requireSurfaceControllerResult(registration, 'register', created.id);
      syncLifecycleProjection(created, registration && registration.snapshot);
      instances.set(created.id, created);
      publish('rmt.surface.materialized', `RMT Surface ${created.id} wurde materialisiert.`, {
        surfaceId: definition.id,
        instanceId: created.id,
        kind: created.kind
      });
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
      if (disposed || disposing) {
        if (resourceManager && typeof resourceManager.releaseOwner === 'function') {
          resourceManager.releaseOwner(instance.owner);
        }
        return [];
      }
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
      requireSurfaceControllerResult(proxySurfaceManager('focus', instance, metadata), 'focus', instance.id);
      syncLifecycleProjection(instance);
      return projectFocus(instance, metadata);
    }

    function projectFocus(instance, metadata = {}) {
      focusSequence += 1;
      instance.focusOrder = focusSequence;
      if (focusAdapter && typeof focusAdapter.focus === 'function') {
        focusAdapter.focus(projectHandle(instance), metadata);
      }
      publish('rmt.surface.focused', `RMT Surface ${instance.id} wurde fokussiert.`, {
        instanceId: instance.id,
        focusOrder: instance.focusOrder,
        zIndex: instance.zIndex
      });
      return projectHandle(instance);
    }

    function materialize(recordsBySource = {}, materializeOptions = {}) {
      assertActive('materialize');
      const created = [];
      const reused = [];
      const pending = [];
      const lifecycleOperations = [];
      surfaces.forEach((surface) => {
        const records = resolveRecords(surface, recordsBySource);
        records.forEach((record, index) => {
          const id = createInstanceId(surface, record, index);
          const existing = instances.get(id);
          const existingState = existing ? lifecycleState(existing) : null;
          const reusable = Boolean(existing && existingState !== 'destroyed');
          const next = createInstance(surface, record, index, reusable ? existing : null);
          pending.push({ id, next, existing, reusable, surface });
          if (!reusable) {
            lifecycleOperations.push({
              operation: 'registerSurface',
              args: [surfaceManagerRecordForInstance(next)]
            });
          }
        });
      });
      const applyResult = callSurfaceControllerApply(lifecycleOperations, {
        operation: 'materialize',
        instanceCount: pending.length
      });
      requireSurfaceControllerResult(applyResult, 'materialize', null);
      pending.forEach(({ id, next, reusable, surface }) => {
        syncLifecycleProjection(next, applyResult && applyResult.snapshot);
        instances.set(id, next);
        if (reusable) reused.push(id);
        else created.push(id);
        publish('rmt.surface.materialized', `RMT Surface ${id} wurde materialisiert.`, {
          surfaceId: surface.id,
          instanceId: id,
          kind: surface.kind,
          reused: reusable
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
      assertActive('openSurface');
      const instance = ensureSurface(surfaceRef, openOptions);
      if (lifecycleState(instance) === 'destroyed' && openOptions.recreate !== true) {
        throw new Error(`RMT Surface ${surfaceRef} ist bereits zerstoert.`);
      }
      const openResult = proxySurfaceManager('open', instance, openOptions);
      requireSurfaceControllerResult(openResult, 'open', instance.id);
      syncLifecycleProjection(instance, openResult && openResult.snapshot, { state: 'open' });
      try {
        await acquireResources(instance, openOptions);
      } catch (error) {
        instance.metadata = {
          ...objectRecord(instance.metadata),
          projection: { status: 'failed', retryable: true, phase: 'resource-acquire', error: error && error.message || String(error) }
        };
        publish('rmt.surface.projection.retryable', 'Surface lifecycle committed, but resource projection failed and can be retried.', {
          instanceId: instance.id,
          phase: 'resource-acquire'
        }, 'error');
        throw error;
      }
      if (disposed || disposing) {
        const error = new Error('RMT Surface Resource Graph was disposed while opening a surface.');
        error.code = 'rmt.surface.runtime.disposed';
        throw error;
      }
      instance.closedAt = null;
      instance.destroyedAt = null;
      instance.metadata = { ...objectRecord(instance.metadata), projection: { status: 'ready', retryable: false } };
      if (openOptions.focus !== false && surfaceIndex.get(instance.surfaceId).focusOnOpen) {
        projectFocus(instance, openOptions);
      }
      publish('rmt.surface.opened', `RMT Surface ${instance.id} wurde geoeffnet.`, {
        instanceId: instance.id,
        resourcesAcquired: instance.resourcesAcquired
      });
      return projectHandle(instance);
    }

    function minimizeSurface(surfaceRef, metadata = {}) {
      const instance = ensureSurface(surfaceRef);
      if (lifecycleState(instance) === 'destroyed') throw new Error(`RMT Surface ${surfaceRef} ist bereits zerstoert.`);
      const result = proxySurfaceManager('minimize', instance, metadata);
      requireSurfaceControllerResult(result, 'minimize', instance.id);
      instance.previousBounds = cloneValue(instance.bounds, instance.bounds);
      syncLifecycleProjection(instance, result && result.snapshot, { state: 'minimized' });
      instance.minimizedAt = metadata.at || 'static-local';
      publish('rmt.surface.minimized', `RMT Surface ${instance.id} wurde minimiert.`, {
        instanceId: instance.id,
        resourcesPreserved: instance.resourcesAcquired
      });
      return projectHandle(instance);
    }

    function restoreSurface(surfaceRef, metadata = {}) {
      const instance = ensureSurface(surfaceRef);
      if (lifecycleState(instance) === 'destroyed') throw new Error(`RMT Surface ${surfaceRef} ist bereits zerstoert.`);
      const result = proxySurfaceManager('restore', instance, metadata);
      requireSurfaceControllerResult(result, 'restore', instance.id);
      syncLifecycleProjection(instance, result && result.snapshot, { state: 'open' });
      publish('rmt.surface.restored', `RMT Surface ${instance.id} wurde wiederhergestellt.`, {
        instanceId: instance.id,
        bounds: instance.bounds
      });
      if (metadata.focus !== false) projectFocus(instance, metadata);
      return projectHandle(instance);
    }

    function closeSurface(surfaceRef, metadata = {}) {
      const instance = ensureSurface(surfaceRef);
      const definition = surfaceIndex.get(instance.surfaceId) || {};
      if (definition.destroyOnClose || metadata.destroy === true) return destroySurface(instance.id, { reason: 'close' });
      const result = proxySurfaceManager('close', instance, metadata);
      requireSurfaceControllerResult(result, 'close', instance.id);
      syncLifecycleProjection(instance, result && result.snapshot, { state: 'closed' });
      instance.closedAt = metadata.at || 'static-local';
      if (definition.closeReleasesResources || metadata.releaseResources === true) {
        releaseResources(instance, 'close');
      }
      publish('rmt.surface.closed', `RMT Surface ${instance.id} wurde geschlossen.`, {
        instanceId: instance.id,
        resourcesAcquired: instance.resourcesAcquired
      });
      return projectHandle(instance);
    }

    function destroySurface(surfaceRef, metadata = {}) {
      const instance = ensureSurface(surfaceRef);
      const releasePreview = instance.resourcesAcquired ? instance.resources.slice() : [];
      const ownedOverlays = overlayStack
        .filter((overlay) => lifecycleState(overlay) === 'open' && overlay.ownerId === instance.id);
      const lifecycleOperations = ownedOverlays.map((overlay) => ({
        operation: 'closeSurface',
        args: [overlay.id, 'surface-destroy']
      }));
      lifecycleOperations.push({
        operation: 'destroySurface',
        args: [instance.id, { ...metadata, releasedResources: releasePreview }]
      });
      const result = callSurfaceControllerApply(lifecycleOperations, {
        instanceId: instance.id,
        operation: 'destroy-with-overlays'
      });
      requireSurfaceControllerResult(result, 'destroy', instance.id);
      syncLifecycleProjection(instance, result && result.snapshot, { state: 'destroyed' });
      ownedOverlays.forEach((overlay) => finalizeOverlayCloseProjection(overlay, { reason: 'surface-destroy' }));
      const releaseReport = releaseResources(instance, metadata.reason || 'destroy');
      if (eventRuntime && typeof eventRuntime.detachOwner === 'function') {
        eventRuntime.detachOwner(instance.owner);
      }
      instance.destroyedAt = metadata.at || 'static-local';
      publish('rmt.surface.destroyed', `RMT Surface ${instance.id} wurde zerstoert.`, {
        instanceId: instance.id,
        owner: instance.owner,
        releasedCount: releaseReport && releaseReport.releasedCount || 0
      });
      return projectHandle(instance);
    }

    function setBounds(surfaceRef, bounds, metadata = {}) {
      const instance = ensureSurface(surfaceRef);
      const nextBounds = normalizeBounds(bounds, instance.bounds);
      const result = proxySurfaceManager('update', instance, { bounds: nextBounds, reason: metadata.reason || 'set-bounds' });
      requireSurfaceControllerResult(result, 'update', instance.id);
      instance.previousBounds = cloneValue(instance.bounds, instance.bounds);
      syncLifecycleProjection(instance, result && result.snapshot, { bounds: nextBounds });
      publish('rmt.surface.bounds.changed', `RMT Surface ${instance.id} hat neue Bounds.`, {
        instanceId: instance.id,
        bounds: instance.bounds,
        reason: metadata.reason || 'set-bounds'
      });
      return projectHandle(instance);
    }

    function moveSurface(surfaceRef, x, y) {
      const instance = ensureSurface(surfaceRef);
      return setBounds(instance.id, { ...instance.bounds, x, y }, { reason: 'move' });
    }

    function resizeSurface(surfaceRef, width, height) {
      const instance = ensureSurface(surfaceRef);
      return setBounds(instance.id, { ...instance.bounds, width, height }, { reason: 'resize' });
    }

    function materializePortalRoot(portal, target) {
      if (!portal || portal.element || !target || typeof target.appendChild !== 'function') {
        return portal && portal.element || null;
      }
      const descriptor = {
        type: 'element',
        tag: 'x-surface-portal',
        attributes: {
          'portal-id': portal.id,
          policy: portal.policy,
          layer: portal.layer,
          'z-index-start': portal.zIndexStart,
          'z-step': portal.zStep
        }
      };
      sharedRenderer(target);
      const portalElement = createDescriptorNode(descriptor, target, `/portals/${portal.id}`);
      if (!portalElement) {
        publish('rmt.surface.dom_commit.invalid_result', 'Portal DOM commit returned no materialized node.', {
          portalId: portal.id
        }, 'error');
        const error = new Error(`RMT Portal ${portal.id} could not be materialized by the shared DOM renderer.`);
        error.code = 'rmt.surface.dom_commit.invalid_result';
        throw error;
      }
      target.appendChild(portalElement);
      portal.element = portalElement;
      portal.target = target;
      portal.mounted = true;
      return portalElement;
    }

    function mountPortal(portalRef, target) {
      const portal = portalIndex.get(clampString(portalRef));
      if (!portal) throw new Error(`RMT Portal ${portalRef} ist nicht definiert.`);
      assertActive('mountPortal');
      const nextTarget = target || portal.target || documentTarget && documentTarget.body || null;
      sharedRenderer(nextTarget);
      if (portal.element && nextTarget && portal.target !== nextTarget && typeof nextTarget.appendChild === 'function') {
        nextTarget.appendChild(portal.element);
      }
      portal.target = nextTarget;
      portal.mounted = Boolean(materializePortalRoot(portal, nextTarget) || portal.element);
      publish('rmt.portal.mounted', `RMT Portal ${portal.id} wurde gemountet.`, {
        portalId: portal.id,
        layer: portal.layer
      });
      return cloneValue(portal, portal);
    }

    function resolvePortalTarget(portal, metadata = {}) {
      const hostTarget = metadata.target && typeof metadata.target.appendChild === 'function'
        ? metadata.target
        : portal && portal.target && typeof portal.target.appendChild === 'function'
          ? portal.target
          : documentTarget && documentTarget.body && typeof documentTarget.body.appendChild === 'function'
            ? documentTarget.body
            : null;
      if (!portal || !hostTarget) return null;
      if (!portal.element) materializePortalRoot(portal, hostTarget);
      return portal.element || null;
    }

    function materializeOverlayElement(overlay, definition, portal, metadata = {}) {
      if (metadata.materialize === false) return null;
      const target = resolvePortalTarget(portal, metadata);
      if (!target) return null;
      const requestedTag = clampString(metadata.tag || definition.component || definition.tag, definition.kind === 'dialog' ? 'x-dialog' : definition.kind === 'lightbox' ? 'x-lightbox' : 'div');
      sharedRenderer(target);
      const tag = requestedTag;
      const structuredChild = metadata.descriptor
        || (definition.template && typeof definition.template === 'object' ? definition.template : null)
        || (definition.template && (metadata.templates || metadata.renderContext && metadata.renderContext.templates)
          ? { type: 'template', template: definition.template }
          : null);
      const descriptor = {
        type: 'element',
        tag,
        attributes: {
          'data-rmt-overlay': overlay.id,
          'data-rmt-overlay-ref': overlay.overlayId,
          'data-rmt-owner': overlay.ownerId,
          'data-rmt-portal': overlay.portal,
          'data-overlay-kind': overlay.kind,
          role: definition.kind === 'dialog' || definition.kind === 'lightbox' ? 'dialog' : undefined,
          open: true,
          ...objectRecord(definition.attributes),
          style: {
            'z-index': String(overlay.zIndex)
          }
        }
      };
      if (structuredChild) descriptor.children = [structuredChild];
      else if (metadata.text != null) descriptor.text = String(metadata.text);
      const element = createDescriptorNode(descriptor, target, `/overlays/${definition.id}`, {
        ...objectRecord(metadata.renderContext),
        templates: metadata.templates || objectRecord(metadata.renderContext).templates,
        components: metadata.components || objectRecord(metadata.renderContext).components,
        componentRegistry: metadata.componentRegistry || objectRecord(metadata.renderContext).componentRegistry
      });
      if (!element) {
        publish('rmt.surface.dom_commit.invalid_result', 'Overlay DOM commit returned no materialized node.', {
          overlayId: definition.id
        }, 'error');
        const error = new Error(`RMT Overlay ${definition.id} could not be materialized by the shared DOM renderer.`);
        error.code = 'rmt.surface.dom_commit.invalid_result';
        throw error;
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
      const removed = disposeDomNode(element);
      overlay.element = null;
      return removed;
    }

    async function openOverlay(overlayRef, metadata = {}) {
      assertActive('openOverlay');
      const definition = overlayIndex.get(clampString(overlayRef));
      if (!definition) throw new Error(`RMT Overlay ${overlayRef} ist nicht definiert.`);
      const portal = portalIndex.get(clampString(metadata.portal, definition.portal)) || portalIndex.get(DEFAULT_PORTAL_ID);
      const ownerId = clampString(metadata.ownerId || metadata.surfaceId || definition.surface, 'global');
      if (definition.singleton) {
        const existing = overlayStack.find((entry) => lifecycleState(entry) === 'open' && entry.overlayId === definition.id && entry.ownerId === ownerId);
        if (existing) return projectHandle(existing);
      }
      overlaySequence += 1;
      const openInPortal = overlayStack.filter((entry) => lifecycleState(entry) === 'open' && entry.portal === portal.id).length;
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
      const overlayRecord = surfaceManagerRecordForOverlay(overlay, definition);
      const lifecycleResult = callSurfaceControllerApply([
        { operation: 'registerSurface', args: [overlayRecord] },
        { operation: 'openSurface', args: [overlay.id, { zIndex: overlay.zIndex, portal: overlay.portal }] }
      ], {
        overlayId: overlay.overlayId,
        instanceId: overlay.id,
        operation: 'open-overlay'
      });
      requireSurfaceControllerResult(lifecycleResult, 'open-overlay', overlay.id);
      syncLifecycleProjection(overlay, lifecycleResult && lifecycleResult.snapshot, { state: 'open' });
      overlayStack.push(overlay);
      try {
        materializeOverlayElement(overlay, definition, portal, metadata);
      } catch (error) {
        overlay.projection = {
          status: 'failed',
          retryable: true,
          phase: 'dom',
          error: error && error.message || String(error)
        };
        publish('rmt.surface.projection.retryable', 'Overlay lifecycle committed, but DOM projection failed and can be retried.', {
          overlayId: overlay.overlayId,
          instanceId: overlay.id,
          phase: 'dom'
        }, 'error');
        throw error;
      }
      overlay.projection = { status: 'ready', retryable: false };
      if (definition.resources.length > 0) {
        const overlayOwner = overlay.id;
        if (resourceManager && typeof resourceManager.acquireMany === 'function') {
          try {
            await resourceManager.acquireMany(definition.resources, overlayOwner, {
              overlay: cloneValue(overlay, overlay),
              surface: instances.get(ownerId) || null
            });
            if (disposed || disposing) {
              if (typeof resourceManager.releaseOwner === 'function') resourceManager.releaseOwner(overlayOwner);
              overlay.projection = { status: 'failed', retryable: true, phase: 'runtime-dispose' };
              const error = new Error('RMT Surface Resource Graph was disposed while opening an overlay.');
              error.code = 'rmt.surface.runtime.disposed';
              throw error;
            }
            overlay.resourcesAcquired = true;
          } catch (error) {
            if (resourceManager && typeof resourceManager.releaseOwner === 'function') {
              try {
                resourceManager.releaseOwner(overlayOwner);
              } catch (_) {
                // The original acquisition error remains the primary failure.
              }
            }
            removeOverlayElement(overlay);
            overlay.projection = {
              status: 'failed',
              retryable: true,
              phase: 'resource-acquire',
              error: error && error.message || String(error)
            };
            publish('rmt.surface.projection.retryable', 'Overlay lifecycle committed, but resource projection failed and can be retried.', {
              overlayId: overlay.overlayId,
              instanceId: overlay.id,
              phase: 'resource-acquire'
            }, 'error');
            throw error;
          }
        } else {
          publish('rmt.overlay.resources.missing_manager', `RMT Overlay ${definition.id} hat Ressourcen ohne Resource Manager.`, {
            overlayId: definition.id,
            resources: definition.resources
          }, 'warning');
        }
      }
      publish('rmt.overlay.opened', `RMT Overlay ${definition.id} wurde geoeffnet.`, {
        overlayId: definition.id,
        instanceId: overlay.id,
        kind: overlay.kind,
        portal: overlay.portal,
        zIndex: overlay.zIndex
      });
      return projectHandle(overlay);
    }

    function finalizeOverlayCloseProjection(overlay, metadata = {}) {
      if (!overlay) return false;
      syncLifecycleProjection(overlay, null, { state: 'closed' });
      overlay.closedAt = metadata.at || 'static-local';
      const definition = overlayIndex.get(overlay.overlayId) || {};
      const removedElement = removeOverlayElement(overlay);
      if (eventRuntime && typeof eventRuntime.detachOwner === 'function') {
        eventRuntime.detachOwner(overlay.id);
      }
      if (overlay.resourcesAcquired && definition.closeReleasesResources !== false && resourceManager && typeof resourceManager.releaseOwner === 'function') {
        resourceManager.releaseOwner(overlay.id);
        overlay.resourcesAcquired = false;
      }
      overlay.projection = { status: 'closed', retryable: false };
      publish('rmt.overlay.closed', `RMT Overlay ${overlay.overlayId} wurde geschlossen.`, {
        overlayId: overlay.overlayId,
        instanceId: overlay.id,
        reason: metadata.reason || 'close',
        removedElement
      });
      return removedElement;
    }

    function closeOverlay(overlayRef, metadata = {}) {
      const ref = clampString(overlayRef);
      const openOverlays = overlayStack.filter((entry) => lifecycleState(entry) === 'open');
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
      requireSurfaceControllerResult(
        callSurfaceManager('closeSurface', [overlay.id, metadata.reason || 'close'], {
          overlayId: overlay.overlayId,
          instanceId: overlay.id,
          operation: 'close-overlay'
        }),
        'close-overlay',
        overlay.id
      );
      finalizeOverlayCloseProjection(overlay, metadata);
      return {
        schema: 'xtend.epic18.rmt-overlay-close-report.v1',
        closed: true,
        overlay: projectHandle(overlay)
      };
    }

    function closeTopOverlay(metadata = {}) {
      const reason = clampString(metadata.reason, 'escape');
      const portal = clampString(metadata.portal, '');
      const candidate = overlayStack
        .filter((entry) => lifecycleState(entry) === 'open')
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
      const projectedSurfaces = [...instances.values()].map((instance) => projectHandle(instance));
      return {
        schema: 'xtend.epic18.rmt-surface-resource-graph-snapshot.v1',
        runtimeSchema: RMT_SURFACE_RESOURCE_GRAPH_RUNTIME_SCHEMA,
        disposed,
        surfaces: projectedSurfaces.map((instance) => ({
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
        overlays: overlayStack.filter((entry) => lifecycleState(entry) === 'open').map((entry) => projectHandle(entry)),
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
      const pending = [];
      const lifecycleOperations = [];
      source.surfaces.forEach((entry) => {
        const current = instances.get(entry.id);
        if (!current) return;
        const state = clampString(entry.state, lifecycleState(current));
        const bounds = normalizeBounds(entry.bounds, current.bounds);
        lifecycleOperations.push({ operation: 'updateSurface', args: [current.id, { bounds }] });
        if (state === 'open') lifecycleOperations.push({ operation: 'openSurface', args: [current.id, { bounds, recreate: true }] });
        else if (state === 'minimized') lifecycleOperations.push({ operation: 'minimizeSurface', args: [current.id] });
        else if (state === 'destroyed') lifecycleOperations.push({ operation: 'destroySurface', args: [current.id, { reason: 'snapshot-adoption' }] });
        else lifecycleOperations.push({ operation: 'closeSurface', args: [current.id, 'snapshot-adoption'] });
        pending.push({ current, entry });
      });
      const applyResult = callSurfaceControllerApply(lifecycleOperations, {
        operation: 'adopt-snapshot',
        source: 'persistence'
      });
      requireSurfaceControllerResult(applyResult, 'adopt-snapshot', null);
      pending.forEach(({ current, entry }) => {
        syncLifecycleProjection(current, applyResult && applyResult.snapshot, {
          state: clampString(entry.state, current.state),
          bounds: entry.bounds
        });
        current.focusOrder = Number.isFinite(entry.focusOrder) ? entry.focusOrder : current.focusOrder;
        current.metadata = {
          ...objectRecord(current.metadata),
          ...objectRecord(cloneValue(entry.metadata, {})),
          lifecycleProjection: true
        };
      });
      const hydratedCount = pending.length;
      publish('rmt.surface.mvc.lifecycle-adoption', 'Persisted Surface lifecycle was adopted through the authoritative controller.', {
        hydratedCount
      }, 'info');
      publish('rmt.surface.snapshot.hydrated', 'RMT Surface Graph Snapshot wurde hydriert.', {
        hydratedCount
      });
      return {
        schema: 'xtend.epic18.rmt-surface-hydrate-report.v1',
        hydratedCount
      };
    }

    function dispose() {
      if (disposed || disposing) {
        return {
          schema: 'xtend.epic18.rmt-surface-resource-graph-dispose-report.v1',
          disposed: true,
          alreadyDisposed: true,
          closedOverlayCount: 0,
          releasedOwnerCount: 0,
          removedPortalCount: 0
        };
      }
      disposing = true;
      let closedOverlayCount = 0;
      let releasedOwnerCount = 0;
      let removedPortalCount = 0;
      const disposeAttempt = (code, message, details, callback) => {
        try {
          return callback();
        } catch (error) {
          publish(code, message, {
            ...details,
            error: error && error.message || String(error)
          }, 'warning');
          return null;
        }
      };
      const openOverlayHandles = overlayStack.filter((overlay) => lifecycleState(overlay) === 'open');
      const liveInstanceHandles = [...instances.values()]
        .filter((instance) => managedSurfaceManagerIds.has(instance.id) && lifecycleState(instance) !== 'destroyed');
      const lifecycleOperations = [
        ...openOverlayHandles.map((overlay) => ({ operation: 'closeSurface', args: [overlay.id, 'runtime-dispose'] })),
        ...liveInstanceHandles.map((instance) => ({ operation: 'destroySurface', args: [instance.id, { reason: 'runtime-dispose' }] }))
      ];
      const lifecycleResult = callSurfaceControllerApply(lifecycleOperations, {
        operation: 'dispose',
        overlayCount: openOverlayHandles.length,
        surfaceCount: liveInstanceHandles.length
      });
      try {
        requireSurfaceControllerResult(lifecycleResult, 'dispose', null);
      } catch (error) {
        disposing = false;
        throw error;
      }
      try {
        openOverlayHandles.forEach((overlay) => {
          syncLifecycleProjection(overlay, lifecycleResult && lifecycleResult.snapshot, { state: 'closed' });
          finalizeOverlayCloseProjection(overlay, { reason: 'runtime-dispose' });
          closedOverlayCount += 1;
        });
        overlayStack.forEach((overlay) => {
          removeOverlayElement(overlay);
          if (overlay.resourcesAcquired && resourceManager && typeof resourceManager.releaseOwner === 'function') {
            const releaseReport = disposeAttempt(
              'rmt.surface.dispose.resource_failed',
              'An overlay resource handle failed during Surface Resource Graph disposal.',
              { owner: overlay.id },
              () => ({ report: resourceManager.releaseOwner(overlay.id) })
            );
            if (releaseReport) {
              overlay.resourcesAcquired = false;
              releasedOwnerCount += 1;
            }
          }
          if (eventRuntime && typeof eventRuntime.detachOwner === 'function') {
            disposeAttempt(
              'rmt.surface.dispose.event_failed',
              'An overlay event handle failed during Surface Resource Graph disposal.',
              { owner: overlay.id },
              () => eventRuntime.detachOwner(overlay.id)
            );
          }
        });
        instances.forEach((instance) => {
          if (instance.resourcesAcquired) {
            const releaseReport = disposeAttempt(
              'rmt.surface.dispose.resource_failed',
              'A surface resource handle failed during Surface Resource Graph disposal.',
              { owner: instance.owner },
              () => ({ report: releaseResources(instance, 'runtime-dispose') })
            );
            if (releaseReport) releasedOwnerCount += 1;
          }
          if (eventRuntime && typeof eventRuntime.detachOwner === 'function') {
            disposeAttempt(
              'rmt.surface.dispose.event_failed',
              'A surface event handle failed during Surface Resource Graph disposal.',
              { owner: instance.owner },
              () => eventRuntime.detachOwner(instance.owner)
            );
          }
          syncLifecycleProjection(instance, lifecycleResult && lifecycleResult.snapshot, { state: 'destroyed' });
          instance.destroyedAt = instance.destroyedAt || 'runtime-dispose';
        });
        portals.forEach((portal) => {
          if (portal.element && disposeDomNode(portal.element)) removedPortalCount += 1;
          portal.element = null;
          portal.target = null;
          portal.mounted = false;
        });
        managedSurfaceManagerIds.clear();
        if (ownsDomRenderer && domRenderer && typeof domRenderer.dispose === 'function') {
          disposeAttempt(
            'rmt.surface.dispose.dom_renderer_failed',
            'The compatibility DOM renderer failed during Surface Resource Graph disposal.',
            { adapter: 'surface-resource-graph-runtime' },
            () => domRenderer.dispose(undefined, { clearOwnedDom: false })
          );
        }
        ownsDomRenderer = false;
      } finally {
        disposing = false;
        disposed = true;
      }
      return {
        schema: 'xtend.epic18.rmt-surface-resource-graph-dispose-report.v1',
        disposed: true,
        alreadyDisposed: false,
        closedOverlayCount,
        releasedOwnerCount,
        removedPortalCount
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
      dispose,
      getSurface(surfaceRef) {
        const instance = instances.get(clampString(surfaceRef));
        return instance ? projectHandle(instance) : null;
      },
      listSurfaces() {
        return surfaces.map((surface) => cloneValue(surface, surface));
      },
      listInstances(optionsForList = {}) {
        return [...instances.values()]
          .filter((instance) => optionsForList.includeDestroyed === true || lifecycleState(instance) !== 'destroyed')
          .map((instance) => projectHandle(instance));
      },
      listOverlays(optionsForList = {}) {
        return overlayStack
          .filter((overlay) => optionsForList.includeClosed === true || lifecycleState(overlay) === 'open')
          .map((overlay) => projectHandle(overlay));
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
