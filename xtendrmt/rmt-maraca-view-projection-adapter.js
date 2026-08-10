(function attachRmtMaracaViewProjectionAdapter(globalTarget) {
  const RMT_MARACA_VIEW_PROJECTION_ADAPTER_SCHEMA = 'xtend.rmt.maraca-view-projection-adapter.v1';
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
    const root = options.root || null;
    const explicitDocumentTarget = options.documentTarget || null;
    const windowTarget = options.windowTarget || null;
    const surfaceElements = new Map();
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
        schema: RMT_MARACA_VIEW_PROJECTION_ADAPTER_SCHEMA,
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
        if (!element || typeof element.getAttribute !== 'function') return;
        const surfaceId = clampString(element.getAttribute('data-maraca-surface'));
        if (surfaceId && !surfaceElements.has(surfaceId)) surfaceElements.set(surfaceId, element);
      });
      return Object.freeze({
        schema: RMT_MARACA_VIEW_PROJECTION_ADAPTER_SCHEMA,
        count: surfaceElements.size,
        surfaceIds: Object.freeze([...surfaceElements.keys()])
      });
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
      return true;
    }

    function resetSurfaceIndex() {
      if (disposed) return false;
      surfaceElements.clear();
      return true;
    }

    function snapshot() {
      return Object.freeze({
        schema: RMT_MARACA_VIEW_PROJECTION_ADAPTER_SCHEMA,
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
      invalidSelectorDiagnostics.clear();
      return true;
    }

    return Object.freeze({
      schema: RMT_MARACA_VIEW_PROJECTION_ADAPTER_SCHEMA,
      validateRoot,
      getDocumentTarget,
      readChildNodes,
      reindexSurfaces,
      resolveSurface,
      resolveField,
      resolveTarget,
      resolveBindingTarget,
      dispatchHostEvent,
      clearOwnedDom,
      resetSurfaceIndex,
      snapshot,
      listDiagnostics: () => diagnostics.slice(),
      dispose
    });
  }

  const api = Object.freeze({
    RMT_MARACA_VIEW_PROJECTION_ADAPTER_SCHEMA,
    RMT_MARACA_VIEW_PROJECTION_DIAGNOSTIC_SCHEMA,
    createRmtMaracaViewProjectionAdapter
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (globalTarget) globalTarget.XTendRmtMaracaViewProjectionAdapter = api;
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));

const __XTEND_RMT_MARACA_VIEW_PROJECTION_ADAPTER_API__ = globalThis.XTendRmtMaracaViewProjectionAdapter;

export const RMT_MARACA_VIEW_PROJECTION_ADAPTER_SCHEMA = __XTEND_RMT_MARACA_VIEW_PROJECTION_ADAPTER_API__.RMT_MARACA_VIEW_PROJECTION_ADAPTER_SCHEMA;
export const RMT_MARACA_VIEW_PROJECTION_DIAGNOSTIC_SCHEMA = __XTEND_RMT_MARACA_VIEW_PROJECTION_ADAPTER_API__.RMT_MARACA_VIEW_PROJECTION_DIAGNOSTIC_SCHEMA;
export const createRmtMaracaViewProjectionAdapter = __XTEND_RMT_MARACA_VIEW_PROJECTION_ADAPTER_API__.createRmtMaracaViewProjectionAdapter;

export default __XTEND_RMT_MARACA_VIEW_PROJECTION_ADAPTER_API__;
