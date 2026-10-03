export const SURFACE_STATE_PROJECTION_ADAPTER_SCHEMA = 'xtend.surface.state-projection-adapter.v1';
export const SURFACE_STATE_PROJECTION_DIAGNOSTIC_SCHEMA = 'xtend.surface.state-projection-diagnostic.v1';
function batchRequiredError() {
    const error = new TypeError('Surface state projection requires an injected batchUpdate() port.');
    error.code = 'xtend.surface.state-projection.batch-required';
    return error;
}
/**
 * The only Surface -> Model projection adapter. It never degrades to per-key
 * set()/setState() writes and never discovers a global XTend State target.
 */
export function createSurfaceStateProjectionAdapter(target, options = {}) {
    if (!target || typeof target.batchUpdate !== 'function') {
        if (options.strict === true)
            throw batchRequiredError();
        options.diagnose?.(Object.freeze({
            schema: SURFACE_STATE_PROJECTION_DIAGNOSTIC_SCHEMA,
            code: 'xtend.surface.state-projection.batch-required',
            severity: 'warning',
            message: 'Legacy per-key Surface state projection is disabled; inject batchUpdate().'
        }));
        return null;
    }
    return Object.freeze({
        schema: SURFACE_STATE_PROJECTION_ADAPTER_SCHEMA,
        apply(updates, _snapshot) {
            target.batchUpdate(updates);
            return Object.freeze({ mode: 'batch', updateCount: Object.keys(updates).length });
        }
    });
}
