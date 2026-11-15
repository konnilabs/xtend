(function attachRmtMaracaViewProjectionAdapter(globalTarget) {
  const RMT_MARACA_VIEW_PROJECTION_ADAPTER_API_VERSION = '2.0.0';
  const RMT_MARACA_VIEW_PROJECTION_ADAPTER_SCHEMA = 'xtend.rmt.maraca-view-projection-adapter.v2';
  const RMT_MARACA_VIEW_PROJECTION_ADAPTER_LEGACY_SCHEMA = 'xtend.rmt.maraca-view-projection-adapter.v1';
  const RMT_MARACA_SURFACE_LIFECYCLE_PROJECTION_SCHEMA = 'xtend.rmt.maraca-surface-lifecycle-projection.v1';
  const RMT_MARACA_VIEW_PROJECTION_DIAGNOSTIC_SCHEMA = 'xtend.rmt.maraca-view-projection-diagnostic.v1';

  function cloneSafe(value, fallback = null) {
    if (value == null || typeof value !== 'object') return value == null ? fallback : value;
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (_) {
      return fallback;
    }
  }

  function clampString(value) {
    return String(value == null ? '' : value).trim();
  }

  function childNodesOf(target) {
    if (target && target.childNodes) return Array.from(target.childNodes);
    if (target && target.children) return Array.from(target.children);
    return [];
  }

  function createRmtMaracaViewProjectionAdapter(options = {}) {
    const adapterSchema = options.adapterSchema || RMT_MARACA_VIEW_PROJECTION_ADAPTER_SCHEMA;
    if (![RMT_MARACA_VIEW_PROJECTION_ADAPTER_SCHEMA, RMT_MARACA_VIEW_PROJECTION_ADAPTER_LEGACY_SCHEMA].includes(adapterSchema)) throw new TypeError('Unsupported Maraca View Projection adapter schema.');
    const root = options.root || null;
    const explicitDocumentTarget = options.documentTarget || null;
    const windowTarget = options.windowTarget || null;
    const surfaceElements = new Map();
    const hiddenElements = new Map();
    const destroyedSurfaces = new Map();
    const retiredElements = new WeakSet();
    const diagnostics = [];
    const invalidSelectorDiagnostics = new Set();
    let disposed = false;

    function diagnostic(code, severity, message, details = {}) {
      const entry = Object.freeze({
        schema: RMT_MARACA_VIEW_PROJECTION_DIAGNOSTIC_SCHEMA,
        code,
        severity,
        message,
        details: cloneSafe(details, {})
      });
      diagnostics.push(entry);
      if (typeof options.publishDiagnostic === 'function') options.publishDiagnostic(entry);
      return entry;
    }

    function failure(code, message, details = {}) {
      const error = new TypeError(message);
      error.code = code;
      error.diagnostic = diagnostic(code, 'error', message, details);
      return error;
    }

    function assertActive(operation) {
      if (!disposed) return;
      throw failure(
        'rmt.maraca.view-projection.disposed',
        `The Maraca View Projection Adapter cannot ${operation} after disposal.`,
        { operation }
      );
    }

    function validateRoot() {
      assertActive('validate its root');
      if (!root || typeof root.replaceChildren !== 'function') {
        throw failure(
          'rmt.maraca.view-projection.root-invalid',
          'The Maraca View Projection Adapter requires a DOM root with replaceChildren().'
        );
      }
      return Object.freeze({
        schema: adapterSchema,
        valid: true
      });
    }

    function getDocumentTarget() {
      assertActive('resolve its document target');
      return explicitDocumentTarget || root && root.ownerDocument || null;
    }

    function readChildNodes(target = root) {
      assertActive('read child nodes');
      return childNodesOf(target);
    }

    function hasRetiredAncestor(element) {
      const seen = new Set();
      for (let current = element; current && !seen.has(current); current = current.parentNode) {
        if (retiredElements.has(current)) return true;
        if (current === root) return false;
        seen.add(current);
      }
      return false;
    }

    function reindexSurfaces() {
      assertActive('index surfaces');
      surfaceElements.clear();
      const nodes = [];
      if (root && typeof root.getAttribute === 'function' && root.getAttribute('data-maraca-surface')) {
        nodes.push(root);
      }
      if (root && typeof root.querySelectorAll === 'function') {
        root.querySelectorAll('[data-maraca-surface]').forEach((element) => nodes.push(element));
      } else {
        childNodesOf(root).forEach((element) => nodes.push(element));
      }
      nodes.forEach((element) => {
        if (!element || typeof element.getAttribute !== 'function' || hasRetiredAncestor(element)) return;
        const surfaceId = clampString(element.getAttribute('data-maraca-surface'));
        if (surfaceId && !destroyedSurfaces.has(surfaceId) && !surfaceElements.has(surfaceId)) surfaceElements.set(surfaceId, element);
      });
      return Object.freeze({
        schema: adapterSchema,
        count: surfaceElements.size,
        surfaceIds: Object.freeze([...surfaceElements.keys()])
      });
    }

    function withinRoot(element) {
      if (!element || !root) return false;
      if (element === root) return true;
      if (typeof root.contains === 'function') return root.contains(element);
      const seen = new Set();
      for (let parent = element.parentNode; parent && !seen.has(parent); parent = parent.parentNode) {
        if (parent === root) return true;
        seen.add(parent);
      }
      return false;
    }

    function visibilityOf(element) {
      return {
        hidden: element.getAttribute('hidden'),
        ariaHidden: element.getAttribute('aria-hidden'),
        marker: element.getAttribute('data-rmt-hidden-display'),
        display: element.style && typeof element.style.getPropertyValue === 'function'
          ? element.style.getPropertyValue('display') : element.style && element.style.display || ''
      };
    }

    function lifecycleOwnership() {
      // This View adapter writes only native visibility/attributes through the
      // existing renderer; the Controller never receives DOM targets.
      return {
        owner: 'maraca-view-lifecycle',
        domains: {
          structure: 'descriptor-renderer', content: 'descriptor-renderer',
          visibility: 'maraca-view-lifecycle', attributes: 'maraca-view-lifecycle',
          properties: 'descriptor-renderer', class: 'descriptor-renderer',
          part: 'descriptor-renderer', styleTokens: 'descriptor-renderer', events: 'event-router'
        }
      };
    }

    function mergeVisibility(element, fields, input) {
      const attributes = {};
      if (Object.prototype.hasOwnProperty.call(fields, 'hidden')) attributes.hidden = fields.hidden;
      if (Object.prototype.hasOwnProperty.call(fields, 'ariaHidden')) attributes['aria-hidden'] = fields.ariaHidden;
      if (Object.prototype.hasOwnProperty.call(fields, 'marker')) attributes['data-rmt-hidden-display'] = fields.marker;
      if (Object.prototype.hasOwnProperty.call(fields, 'display')) attributes.style = { display: fields.display };
      input.renderer.commit({
        operation: 'merge-element', target: element,
        descriptor: { type: 'element', tag: clampString(element.localName || element.tagName).toLowerCase(), attributes },
        ownership: lifecycleOwnership(),
        context: { ...(input.context || {}), metadata: { ...(input.context && input.context.metadata || {}), operation: 'maraca.surface-lifecycle.visibility' } }
      });
    }

    function restoreVisibility(element, remembered, input) {
      if (!withinRoot(element)) return false;
      const current = visibilityOf(element), fields = {};
      // Restore only values that still equal this adapter's last overlay. A
      // presentation/Model update after that overlay keeps its own authority.
      for (const key of ['hidden', 'ariaHidden', 'marker', 'display']) {
        if (current[key] === remembered.applied[key]) fields[key] = remembered.original[key];
      }
      // hidden's renderer setter also changes display and its private marker.
      // Reapply the values already owned by another writer in the same commit.
      if (Object.prototype.hasOwnProperty.call(fields, 'hidden')) {
        if (!Object.prototype.hasOwnProperty.call(fields, 'display')) fields.display = current.display;
        if (!Object.prototype.hasOwnProperty.call(fields, 'marker')) fields.marker = current.marker;
      }
      if (Object.keys(fields).length) mergeVisibility(element, fields, input);
      return true;
    }

    function lifecycleRecords(snapshot) {
      const snapshotFields = snapshot && typeof snapshot === 'object' && Object.getOwnPropertyDescriptors(snapshot);
      if (!snapshotFields || !snapshotFields.surfaces || !Object.prototype.hasOwnProperty.call(snapshotFields.surfaces, 'value') || !Array.isArray(snapshotFields.surfaces.value)) {
        throw failure('rmt.maraca.view-projection.lifecycle-invalid', 'Native lifecycle projection requires a complete Surface snapshot.');
      }
      const rows = snapshotFields.surfaces.value, rowFields = Object.getOwnPropertyDescriptors(rows);
      const length = rowFields.length && rowFields.length.value;
      if (!Number.isSafeInteger(length) || length < 0 || Array.from({ length }, (_, index) => rowFields[index]).some(field => !field || !Object.prototype.hasOwnProperty.call(field, 'value'))) {
        throw failure('rmt.maraca.view-projection.lifecycle-invalid', 'Native lifecycle records must be a dense data array.');
      }
      const ids = new Set();
      return Array.from({ length }, (_, index) => rowFields[index].value).map(record => {
        const descriptors = record && typeof record === 'object' && Object.getOwnPropertyDescriptors(record);
        if (!descriptors || ![Object.prototype, null].includes(Object.getPrototypeOf(record)) || !descriptors.id || !descriptors.status
          || Object.values(descriptors).some(field => !Object.prototype.hasOwnProperty.call(field, 'value'))
          || typeof record.id !== 'string' || !record.id.trim() || ids.has(record.id)
          || !['open', 'closed', 'minimized', 'destroying', 'destroyed'].includes(record.status)
          || record.generation !== undefined && (!Number.isSafeInteger(record.generation) || record.generation < 0)) {
          throw failure('rmt.maraca.view-projection.lifecycle-invalid', 'Native lifecycle records must be unique plain data with a supported status and generation.');
        }
        ids.add(record.id);
        return record;
      });
    }

    function projectSurfaceLifecycle(snapshot, input = {}) {
      assertActive('project native Surface lifecycle');
      const phase = input.phase || 'project';
      if (!['prepare', 'project'].includes(phase) || !input.renderer || typeof input.renderer.commit !== 'function' || typeof input.renderer.dispose !== 'function') {
        throw failure('rmt.maraca.view-projection.lifecycle-port-invalid', 'Native lifecycle projection requires the shared renderer and a supported projection phase.');
      }
      const records = lifecycleRecords(snapshot);
      let hidden = 0, restored = 0, removed = 0, retained = 0, projected = 0;
      // A new generation is an explicit Controller fact. A plain repeated open
      // record without a new generation cannot resurrect a destroyed view.
      for (const record of records) {
        const previous = destroyedSurfaces.get(record.id);
        if (previous !== undefined && record.status !== 'destroyed' && record.status !== 'destroying'
          && Number.isSafeInteger(record.generation) && Number.isSafeInteger(previous) && record.generation > previous) {
          destroyedSurfaces.delete(record.id);
        }
      }
      reindexSurfaces();
      if (phase === 'prepare') {
        for (const [element, remembered] of hiddenElements) {
          if (restoreVisibility(element, remembered, input)) restored++;
        }
        hiddenElements.clear();
      } else {
        for (const record of records) {
          const element = surfaceElements.get(record.id);
          const destroyed = record.status === 'destroyed' || record.status === 'destroying';
          if (destroyed) {
            destroyedSurfaces.set(record.id, record.generation === undefined ? null : record.generation);
            surfaceElements.delete(record.id);
          }
          if (!element || !withinRoot(element) || hasRetiredAncestor(element)) continue;
          projected++;
          if (destroyed) {
            const remembered = hiddenElements.get(element);
            if (remembered) restoreVisibility(element, remembered, input);
            hiddenElements.delete(element);
            // The renderer owns cleanup and privately protected foreign roots.
            // Keep any wrapper it retained instead of detaching a foreign root
            // indirectly by removing that wrapper through raw DOM operations.
            input.renderer.commit({ operation: 'reconcile-children', target: element, descriptors: [],
              ownership: input.ownership, context: input.context || {} });
            if (element !== root) retiredElements.add(element);
            if (childNodesOf(element).length) retained++;
            else {
              input.renderer.dispose(element);
              if (element !== root && element.parentNode && typeof element.parentNode.removeChild === 'function') element.parentNode.removeChild(element);
              removed++;
            }
            continue;
          }
          const closed = record.status !== 'open' || record.minimized === true || record.collapsed === true;
          const remembered = hiddenElements.get(element);
          if (closed) {
            const original = remembered ? remembered.original : visibilityOf(element);
            mergeVisibility(element, { hidden: '', ariaHidden: 'true', display: 'none' }, input);
            hiddenElements.set(element, { original, applied: visibilityOf(element), surfaceId: record.id });
            hidden++;
          } else if (remembered) {
            if (restoreVisibility(element, remembered, input)) restored++;
            hiddenElements.delete(element);
          }
        }
      }
      for (const [element, remembered] of hiddenElements) {
        if (hasRetiredAncestor(element)) restoreVisibility(element, remembered, input);
        if (!withinRoot(element) || hasRetiredAncestor(element)) hiddenElements.delete(element);
      }
      reindexSurfaces();
      return Object.freeze({ schema: RMT_MARACA_SURFACE_LIFECYCLE_PROJECTION_SCHEMA, phase,
        projected, hidden, restored, removed, retained, surfaceIds: Object.freeze([...surfaceElements.keys()]) });
    }

    function resolveSurface(surfaceId) {
      assertActive('resolve a surface');
      return surfaceElements.get(clampString(surfaceId)) || null;
    }

    function resolveField(fieldId) {
      assertActive('resolve a field');
      const normalized = clampString(fieldId);
      if (!normalized || !root || typeof root.querySelectorAll !== 'function') return null;
      return Array.from(root.querySelectorAll('[data-field]')).find((element) => (
        element && typeof element.getAttribute === 'function'
        && element.getAttribute('data-field') === normalized
      )) || null;
    }

    function resolveTarget(target) {
      const record = target && typeof target === 'object' && !Array.isArray(target) ? target : {};
      if (record.surface) return resolveSurface(record.surface);
      if (record.field) return resolveField(record.field);
      return null;
    }

    function resolveBindingTarget(binding, candidateRoot = root) {
      assertActive('resolve an event binding target');
      const record = binding && typeof binding === 'object' && !Array.isArray(binding) ? binding : {};
      const selector = clampString(record.target || record.selector);
      const queryRoot = candidateRoot || root;
      if (!selector || !queryRoot || typeof queryRoot.querySelector !== 'function') return null;
      try {
        return queryRoot.querySelector(selector);
      } catch (_) {
        const diagnosticId = clampString(record.id) || selector;
        if (!invalidSelectorDiagnostics.has(diagnosticId)) {
          invalidSelectorDiagnostics.add(diagnosticId);
          diagnostic(
            'rmt.maraca.view-projection.selector-invalid',
            'warning',
            'An invalid compiled event selector was rejected by the Maraca View Projection Adapter.',
            { bindingId: clampString(record.id) }
          );
        }
        return null;
      }
    }

    function dispatchHostEvent(name, detail) {
      assertActive('dispatch a host event');
      const target = windowTarget || root;
      if (!target || typeof target.dispatchEvent !== 'function') return false;
      const documentTarget = explicitDocumentTarget || root && root.ownerDocument || null;
      const CustomEventCtor = target.CustomEvent
        || documentTarget && documentTarget.defaultView && documentTarget.defaultView.CustomEvent
        || globalTarget && globalTarget.CustomEvent;
      if (typeof CustomEventCtor !== 'function') return false;
      try {
        target.dispatchEvent(new CustomEventCtor(clampString(name), { detail: cloneSafe(detail, {}) }));
        return true;
      } catch (error) {
        diagnostic(
          'rmt.maraca.view-projection.event-dispatch-failed',
          'warning',
          'The Maraca View Projection Adapter could not dispatch a host event.',
          { name: clampString(name), message: String(error && error.message || error || '') }
        );
        return false;
      }
    }

    function clearOwnedDom() {
      assertActive('clear owned DOM');
      validateRoot();
      root.replaceChildren();
      surfaceElements.clear();
      hiddenElements.clear();
      destroyedSurfaces.clear();
      return true;
    }

    function resetSurfaceIndex() {
      if (disposed) return false;
      surfaceElements.clear();
      return true;
    }

    function snapshot() {
      return Object.freeze({
        schema: adapterSchema,
        disposed,
        surfaceCount: surfaceElements.size,
        diagnosticCount: diagnostics.length,
        capabilities: Object.freeze({
          domRead: true,
          domWrite: true,
          eventDispatch: true,
          ownerDocumentRead: true
        })
      });
    }

    function dispose() {
      if (disposed) return false;
      disposed = true;
      surfaceElements.clear();
      hiddenElements.clear();
      destroyedSurfaces.clear();
      invalidSelectorDiagnostics.clear();
      return true;
    }

    return Object.freeze({
      schema: adapterSchema,
      validateRoot,
      getDocumentTarget,
      readChildNodes,
      reindexSurfaces,
      resolveSurface,
      resolveField,
      resolveTarget,
      resolveBindingTarget,
      dispatchHostEvent,
      ...(adapterSchema === RMT_MARACA_VIEW_PROJECTION_ADAPTER_SCHEMA ? { projectSurfaceLifecycle } : {}),
      clearOwnedDom,
      resetSurfaceIndex,
      snapshot,
      listDiagnostics: () => diagnostics.slice(),
      dispose
    });
  }

  const api = Object.freeze({
    RMT_MARACA_VIEW_PROJECTION_ADAPTER_API_VERSION,
    RMT_MARACA_VIEW_PROJECTION_ADAPTER_SCHEMA,
    RMT_MARACA_VIEW_PROJECTION_ADAPTER_LEGACY_SCHEMA,
    RMT_MARACA_SURFACE_LIFECYCLE_PROJECTION_SCHEMA,
    RMT_MARACA_VIEW_PROJECTION_DIAGNOSTIC_SCHEMA,
    createRmtMaracaViewProjectionAdapter
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (globalTarget) globalTarget.XTendRmtMaracaViewProjectionAdapter = api;
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));

const __XTEND_RMT_MARACA_VIEW_PROJECTION_ADAPTER_API__ = globalThis.XTendRmtMaracaViewProjectionAdapter;

export const RMT_MARACA_VIEW_PROJECTION_ADAPTER_API_VERSION = __XTEND_RMT_MARACA_VIEW_PROJECTION_ADAPTER_API__.RMT_MARACA_VIEW_PROJECTION_ADAPTER_API_VERSION;
export const RMT_MARACA_VIEW_PROJECTION_ADAPTER_LEGACY_SCHEMA = __XTEND_RMT_MARACA_VIEW_PROJECTION_ADAPTER_API__.RMT_MARACA_VIEW_PROJECTION_ADAPTER_LEGACY_SCHEMA;
export const RMT_MARACA_SURFACE_LIFECYCLE_PROJECTION_SCHEMA = __XTEND_RMT_MARACA_VIEW_PROJECTION_ADAPTER_API__.RMT_MARACA_SURFACE_LIFECYCLE_PROJECTION_SCHEMA;
export const RMT_MARACA_VIEW_PROJECTION_ADAPTER_SCHEMA = __XTEND_RMT_MARACA_VIEW_PROJECTION_ADAPTER_API__.RMT_MARACA_VIEW_PROJECTION_ADAPTER_SCHEMA;
export const RMT_MARACA_VIEW_PROJECTION_DIAGNOSTIC_SCHEMA = __XTEND_RMT_MARACA_VIEW_PROJECTION_ADAPTER_API__.RMT_MARACA_VIEW_PROJECTION_DIAGNOSTIC_SCHEMA;
export const createRmtMaracaViewProjectionAdapter = __XTEND_RMT_MARACA_VIEW_PROJECTION_ADAPTER_API__.createRmtMaracaViewProjectionAdapter;

export default __XTEND_RMT_MARACA_VIEW_PROJECTION_ADAPTER_API__;
