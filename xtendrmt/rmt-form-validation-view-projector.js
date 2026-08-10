const VIEW_PROJECTOR_SCHEMA = 'xtend.rmt.form-validation-view-projector.v1';

function toArray(value) {
  return Array.isArray(value) ? value : (value == null ? [] : [value]);
}

function clampString(value, fallback = '') {
  const normalized = String(value == null ? '' : value).trim();
  return normalized || fallback;
}

function cloneValue(value, fallback = null) {
  if (typeof value === 'undefined') return fallback;
  if (value === null || typeof value !== 'object') return value;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_) {
    return fallback;
  }
}

function deepFreeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return value;
  seen.add(value);
  Object.getOwnPropertyNames(value).forEach((key) => deepFreeze(value[key], seen));
  return Object.freeze(value);
}

export function createRmtFormValidationViewProjector(options = {}) {
  const root = options.root || null;
  const strict = options.strict === true || options.strictMaraca === true;
  const globalTarget = options.globalTarget || globalThis;
  let domRenderer = options.domRenderer || options.renderer || null;
  let ownsDomRenderer = false;
  let rendererAttempted = false;
  let missingRendererReported = false;
  let unavailableRendererReported = false;
  let disposed = false;

  function publishDiagnostic(diagnostic) {
    if (typeof options.publishDiagnostic === 'function') options.publishDiagnostic(diagnostic);
    return diagnostic;
  }

  function diagnostic(code, severity, message, details = {}) {
    return {
      schema: 'xtend.rmt.form-validation-diagnostic.v1',
      code,
      severity,
      message,
      details: cloneValue(details, {})
    };
  }

  function findTarget(target) {
    if (typeof options.resolveTarget === 'function') return options.resolveTarget(target, root);
    if (!root || typeof root.querySelectorAll !== 'function') return null;
    if (target && target.surface) {
      const surface = Array.from(root.querySelectorAll('[data-maraca-surface]')).find((element) => (
        element.getAttribute && element.getAttribute('data-maraca-surface') === target.surface
      ));
      if (surface) return surface;
    }
    if (target && target.field) {
      return Array.from(root.querySelectorAll('[data-field]')).find((element) => (
        element.getAttribute && element.getAttribute('data-field') === target.field
      )) || null;
    }
    return null;
  }

  function resolveRenderer(target = null) {
    if (domRenderer && typeof domRenderer.commit === 'function') return domRenderer;
    if (!missingRendererReported) {
      missingRendererReported = true;
      publishDiagnostic(diagnostic(
        'rmt.dom.shared-renderer-missing',
        strict ? 'error' : 'warning',
        strict
          ? 'Validation requires the shared RMT DOM renderer in strict mode.'
          : 'Validation is creating one compatibility renderer because no shared renderer was injected.',
        { adapter: 'validation-view-projector' }
      ));
    }
    if (strict) {
      const error = new Error('Strict validation requires the shared RMT DOM renderer.');
      error.code = 'rmt.dom.shared-renderer-missing';
      throw error;
    }
    if (!rendererAttempted) {
      rendererAttempted = true;
      const factory = globalTarget
        && globalTarget.XTendRmtDomDescriptorRenderer
        && globalTarget.XTendRmtDomDescriptorRenderer.createRmtDomDescriptorRenderer;
      const documentTarget = options.documentTarget
        || target && target.ownerDocument
        || root && root.ownerDocument
        || globalTarget && globalTarget.document
        || null;
      if (typeof factory === 'function' && documentTarget) {
        try {
          domRenderer = factory({
            documentTarget,
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
    if (!unavailableRendererReported) {
      unavailableRendererReported = true;
      publishDiagnostic(diagnostic(
        'rmt.dom.compatibility-renderer-unavailable',
        'error',
        'Validation could not create the required compatibility DOM renderer.',
        { adapter: 'validation-view-projector' }
      ));
    }
    const error = new Error('Validation requires a DOM renderer; compatibility renderer creation failed.');
    error.code = 'rmt.dom.compatibility-renderer-unavailable';
    throw error;
  }

  function prepare(evaluation, metadata = {}) {
    const projections = toArray(evaluation && evaluation.viewProjection).map((projection) => ({
      schema: 'xtend.rmt.form-validation-view-projection.v1',
      group: clampString(projection && projection.group),
      target: cloneValue(projection && projection.target, {}),
      invalid: Boolean(projection && projection.invalid),
      revealed: projection && projection.revealed !== false,
      report: Boolean(projection && projection.report),
      message: clampString(projection && projection.message)
    }));
    return deepFreeze({
      schema: 'xtend.rmt.form-validation-view-projection-plan.v1',
      valid: Boolean(evaluation && evaluation.valid),
      projectionCount: projections.length,
      projections,
      metadata: cloneValue(metadata, {})
    });
  }

  function finalize(planOrEvaluation, metadata = {}) {
    const prepared = planOrEvaluation && planOrEvaluation.schema === 'xtend.rmt.form-validation-view-projection-plan.v1'
      ? planOrEvaluation
      : prepare(planOrEvaluation, metadata);
    const reported = [];
    const missing = [];
    toArray(prepared.projections).forEach((projection) => {
      if (!projection.invalid || !projection.report) return;
      const element = findTarget(projection.target);
      if (!element) {
        missing.push(cloneValue(projection.target, {}));
        return;
      }
      if (typeof element.reportValidity === 'function') element.reportValidity();
      else if (typeof element.checkValidity === 'function') element.checkValidity();
      reported.push(cloneValue(projection.target, {}));
    });
    return deepFreeze({
      schema: 'xtend.rmt.form-validation-view-finalize-report.v1',
      valid: prepared.valid !== false,
      projectionCount: prepared.projectionCount,
      reportedCount: reported.length,
      missingCount: missing.length,
      reported,
      missing
    });
  }

  function project(evaluation, metadata = {}) {
    if (disposed) throw new Error('Validation View Projector was disposed.');
    const prepared = prepare(evaluation, metadata);
    const applied = [];
    const missing = [];
    toArray(prepared.projections).forEach((projection) => {
      const element = findTarget(projection.target);
      if (!element) {
        missing.push(cloneValue(projection.target, {}));
        return;
      }
      if (projection.revealed || !projection.invalid) {
        resolveRenderer(element).commit({
          operation: 'merge-element',
          target: element,
          descriptor: {
            type: 'element',
            tag: clampString(element.localName || element.tagName, projection.target && projection.target.component || 'div').toLowerCase(),
            attributes: {
              invalid: projection.invalid ? '' : null,
              'aria-invalid': projection.invalid ? 'true' : null,
              'data-validation-message': projection.invalid && projection.message ? projection.message : null
            }
          },
          ownership: {
            owner: 'validation-runtime',
            domains: { validation: 'validation-runtime' },
            mode: strict ? 'strict' : 'compatibility'
          },
          metadata
        });
        applied.push(cloneValue(projection.target, {}));
      }
    });
    const finalization = finalize(prepared, metadata);
    return deepFreeze({
      schema: 'xtend.rmt.form-validation-view-project-report.v1',
      valid: prepared.valid !== false,
      projectionCount: prepared.projectionCount,
      appliedCount: applied.length,
      missingCount: missing.length,
      applied,
      missing,
      finalization
    });
  }

  function publish(name, detail) {
    const target = options.windowTarget || null;
    if (!target || typeof target.dispatchEvent !== 'function' || typeof target.CustomEvent !== 'function') return false;
    target.dispatchEvent(new target.CustomEvent(name, { detail }));
    return true;
  }

  function dispose() {
    const alreadyDisposed = disposed;
    disposed = true;
    if (ownsDomRenderer && domRenderer && typeof domRenderer.dispose === 'function') {
      try {
        domRenderer.dispose(undefined, { clearOwnedDom: false });
      } catch (_) {
        // Compatibility renderer cleanup is best-effort and idempotent.
      }
    }
    ownsDomRenderer = false;
    domRenderer = null;
    return { schema: VIEW_PROJECTOR_SCHEMA, disposed: true, alreadyDisposed };
  }

  return Object.freeze({
    schema: VIEW_PROJECTOR_SCHEMA,
    prepare,
    finalize,
    project,
    publish,
    dispose
  });
}

export default Object.freeze({ createRmtFormValidationViewProjector });
