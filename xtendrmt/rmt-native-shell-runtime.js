(function attachRmtNativeShellRuntime(globalTarget) {
  const RMT_NATIVE_SHELL_RUNTIME_SCHEMA = 'xtend.mm-rmt.native-shell-runtime.v1';
  const RMT_NATIVE_SHELL_REPORT_SCHEMA = 'xtend.mm-rmt.native-shell-report.v1';

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

  function isNodeRoot(value) {
    return value && typeof value === 'object' && (typeof value.replaceChildren === 'function' || typeof value.appendChild === 'function');
  }

  function createDefaultRenderer(options = {}) {
    if (options.renderer) return options.renderer;
    const rendererApi = globalTarget && globalTarget.XTendRmtDomDescriptorRenderer;
    if (rendererApi && typeof rendererApi.createRmtDomDescriptorRenderer === 'function') {
      return rendererApi.createRmtDomDescriptorRenderer(options.rendererOptions || options);
    }
    return null;
  }

  function createDefaultSurfaceRuntime(options = {}) {
    if (options.surfaceRuntime) return options.surfaceRuntime;
    const surfaceApi = globalTarget && globalTarget.XTendRmtSurfaceResourceGraphRuntime;
    if (surfaceApi && typeof surfaceApi.createRmtSurfaceResourceGraphRuntime === 'function') {
      return surfaceApi.createRmtSurfaceResourceGraphRuntime(options.surfaceOptions || options);
    }
    return null;
  }

  function keyedDescriptor(descriptor, key, attributes = {}) {
    const source = objectRecord(descriptor);
    return {
      ...cloneValue(source, source),
      key: source.key || key,
      attributes: {
        ...objectRecord(source.attributes),
        ...attributes
      }
    };
  }

  function defaultDescriptorFactory(instance) {
    const surface = objectRecord(instance);
    const record = objectRecord(surface.record);
    const baseTemplate = objectRecord(surface.template).root || (objectRecord(surface.template).type ? surface.template : null);
    const attributes = {
      'data-rmt-shell-island': surface.id,
      'data-rmt-surface': surface.surfaceId,
      'data-rmt-surface-state': surface.state,
      'data-rmt-owner': surface.owner,
      'aria-hidden': surface.state === 'minimized' ? 'true' : 'false'
    };
    if (baseTemplate) return keyedDescriptor(baseTemplate, surface.id, attributes);
    return {
      type: 'element',
      tag: surface.component || 'section',
      key: surface.id,
      attributes,
      children: [
        {
          type: 'text',
          text: record.title || record.name || surface.id
        }
      ]
    };
  }

  function createRmtNativeShellController(options = {}) {
    const renderer = createDefaultRenderer(options);
    const surfaceRuntime = createDefaultSurfaceRuntime(options);
    const defaultRoot = options.root || options.mount || null;
    const descriptorFactory = typeof options.descriptorFactory === 'function'
      ? options.descriptorFactory
      : defaultDescriptorFactory;
    const islandRegistry = new Map();
    const diagnostics = [];

    function publish(code, message, details = {}) {
      const diagnostic = {
        schema: 'xtend.mm-rmt.native-shell-diagnostic.v1',
        code,
        message,
        details: cloneValue(details, {})
      };
      diagnostics.push(diagnostic);
      if (options.diagnosticsHub && typeof options.diagnosticsHub.publish === 'function') {
        options.diagnosticsHub.publish('rmt.native_shell', diagnostic, { schema: diagnostic.schema });
      }
      return diagnostic;
    }

    function requireRenderer() {
      if (renderer && typeof renderer.renderKeyed === 'function') return renderer;
      throw new Error('RMT Native Shell Controller benoetigt einen DOM Descriptor Renderer mit renderKeyed().');
    }

    function requireSurfaceRuntime() {
      if (surfaceRuntime) return surfaceRuntime;
      throw new Error('RMT Native Shell Controller benoetigt eine Surface Resource Graph Runtime.');
    }

    function normalizeDescriptorList(descriptors, islandId) {
      return toArray(descriptors).map((descriptor, index) => {
        const record = objectRecord(descriptor);
        const key = clampString(record.key, index === 0 ? islandId : `${islandId}:${index}`);
        return keyedDescriptor(record, key, {
          'data-rmt-shell-island': islandId
        });
      });
    }

    function upsertIsland(id, patch = {}) {
      const islandId = clampString(id);
      if (!islandId) return null;
      const current = islandRegistry.get(islandId) || {
        id: islandId,
        state: 'materialized',
        renderCount: 0,
        root: null,
        nodeCount: 0,
        lastRenderedAt: null
      };
      const next = {
        ...current,
        ...patch
      };
      islandRegistry.set(islandId, next);
      return next;
    }

    function renderIsland(islandRef, rootOrDescriptor, descriptorOrOptions, maybeOptions) {
      const islandId = clampString(typeof islandRef === 'object' ? islandRef.id : islandRef);
      if (!islandId) throw new Error('RMT Shell Island braucht eine stabile id.');
      const root = isNodeRoot(rootOrDescriptor) ? rootOrDescriptor : (objectRecord(descriptorOrOptions).root || defaultRoot);
      const descriptors = isNodeRoot(rootOrDescriptor) ? descriptorOrOptions : rootOrDescriptor;
      const renderOptions = isNodeRoot(rootOrDescriptor) ? objectRecord(maybeOptions) : objectRecord(descriptorOrOptions);
      if (!root) throw new Error(`RMT Shell Island ${islandId} hat keinen Mount-Root.`);
      const list = normalizeDescriptorList(descriptors, islandId);
      const nodes = requireRenderer().renderKeyed(root, list, renderOptions);
      const island = upsertIsland(islandId, {
        root,
        nodeCount: nodes.length,
        renderCount: (islandRegistry.get(islandId) && islandRegistry.get(islandId).renderCount || 0) + 1,
        state: 'rendered',
        lastRenderedAt: renderOptions.at || 'static-local'
      });
      publish('rmt.native_shell.island.rendered', `RMT Shell Island ${islandId} wurde gerendert.`, {
        islandId,
        nodeCount: nodes.length
      });
      return {
        schema: RMT_NATIVE_SHELL_REPORT_SCHEMA,
        islandId,
        nodeCount: nodes.length,
        nodes,
        island: cloneValue(island, island)
      };
    }

    function syncSurfaces(recordsBySource = {}, syncOptions = {}) {
      const runtime = requireSurfaceRuntime();
      const materializeReport = typeof runtime.materialize === 'function'
        ? runtime.materialize(recordsBySource, syncOptions.materialize || syncOptions.materializeOptions || {})
        : { createdCount: 0, reusedCount: 0, created: [], reused: [] };
      const instances = typeof runtime.listInstances === 'function'
        ? runtime.listInstances({ includeDestroyed: false })
        : [];
      const descriptors = instances.map((instance) => descriptorFactory(instance, {
        recordsBySource,
        options: syncOptions,
        controller: api
      }));
      let nodeCount = 0;
      if (syncOptions.root || defaultRoot) {
        const nodes = requireRenderer().renderKeyed(syncOptions.root || defaultRoot, descriptors, {
          ...objectRecord(syncOptions.renderOptions),
          model: {
            ...objectRecord(syncOptions.renderOptions && syncOptions.renderOptions.model),
            instances
          }
        });
        nodeCount = nodes.length;
      }
      instances.forEach((instance) => upsertIsland(instance.id, {
        state: instance.state,
        surfaceId: instance.surfaceId,
        owner: instance.owner,
        nodeCount
      }));
      publish('rmt.native_shell.surfaces.synced', 'RMT Surface Islands wurden synchronisiert.', {
        instanceCount: instances.length,
        renderedCount: nodeCount,
        createdCount: materializeReport.createdCount,
        reusedCount: materializeReport.reusedCount
      });
      return {
        schema: RMT_NATIVE_SHELL_REPORT_SCHEMA,
        materializeReport,
        instanceCount: instances.length,
        renderedCount: nodeCount,
        islandIds: instances.map((instance) => instance.id)
      };
    }

    async function openSurface(surfaceRef, metadata = {}) {
      const result = await requireSurfaceRuntime().openSurface(surfaceRef, metadata);
      upsertIsland(result.id, { state: result.state, surfaceId: result.surfaceId, owner: result.owner });
      return result;
    }

    function closeSurface(surfaceRef, metadata = {}) {
      const result = requireSurfaceRuntime().closeSurface(surfaceRef, metadata);
      upsertIsland(result.id, { state: result.state, surfaceId: result.surfaceId, owner: result.owner });
      return result;
    }

    function minimizeSurface(surfaceRef, metadata = {}) {
      const result = requireSurfaceRuntime().minimizeSurface(surfaceRef, metadata);
      upsertIsland(result.id, { state: result.state, surfaceId: result.surfaceId, owner: result.owner });
      return result;
    }

    function restoreSurface(surfaceRef, metadata = {}) {
      const result = requireSurfaceRuntime().restoreSurface(surfaceRef, metadata);
      upsertIsland(result.id, { state: result.state, surfaceId: result.surfaceId, owner: result.owner });
      return result;
    }

    function focusSurface(surfaceRef, metadata = {}) {
      const result = requireSurfaceRuntime().focusSurface(surfaceRef, metadata);
      upsertIsland(result.id, { state: result.state, surfaceId: result.surfaceId, owner: result.owner, focusOrder: result.focusOrder });
      return result;
    }

    function destroySurface(surfaceRef, metadata = {}) {
      const result = requireSurfaceRuntime().destroySurface(surfaceRef, metadata);
      upsertIsland(result.id, { state: result.state, surfaceId: result.surfaceId, owner: result.owner });
      return result;
    }

    const api = Object.freeze({
      schema: RMT_NATIVE_SHELL_RUNTIME_SCHEMA,
      renderer,
      surfaceRuntime,
      renderIsland,
      syncSurfaces,
      materializeAndRender: syncSurfaces,
      openSurface,
      closeSurface,
      minimizeSurface,
      restoreSurface,
      focusSurface,
      destroySurface,
      getIsland(islandRef) {
        const island = islandRegistry.get(clampString(islandRef));
        return island ? cloneValue(island, island) : null;
      },
      listIslands() {
        return [...islandRegistry.values()].map((island) => cloneValue(island, island));
      },
      listDiagnostics() {
        return diagnostics.slice();
      }
    });

    return api;
  }

  const api = {
    RMT_NATIVE_SHELL_REPORT_SCHEMA,
    RMT_NATIVE_SHELL_RUNTIME_SCHEMA,
    createRmtNativeShellController
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (globalTarget) {
    globalTarget.XTendRmtNativeShellRuntime = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));

const __XTEND_RMT_NATIVE_SHELL_RUNTIME_API__ = globalThis.XTendRmtNativeShellRuntime;

export const RMT_NATIVE_SHELL_REPORT_SCHEMA = __XTEND_RMT_NATIVE_SHELL_RUNTIME_API__.RMT_NATIVE_SHELL_REPORT_SCHEMA;
export const RMT_NATIVE_SHELL_RUNTIME_SCHEMA = __XTEND_RMT_NATIVE_SHELL_RUNTIME_API__.RMT_NATIVE_SHELL_RUNTIME_SCHEMA;
export const createRmtNativeShellController = __XTEND_RMT_NATIVE_SHELL_RUNTIME_API__.createRmtNativeShellController;

export default __XTEND_RMT_NATIVE_SHELL_RUNTIME_API__;
