import type {
  XtendSurfaceSnapshot,
  XtendSurfaceStateProjectionAdapter
} from './surface-record';

export const SURFACE_STATE_PROJECTION_ADAPTER_SCHEMA = 'xtend.surface.state-projection-adapter.v1' as const;
export const SURFACE_STATE_PROJECTION_DIAGNOSTIC_SCHEMA = 'xtend.surface.state-projection-diagnostic.v1' as const;

export interface XtendSurfaceBatchStateTarget {
  batchUpdate(updates: Record<string, unknown>): unknown;
}

export interface XtendSurfaceStateProjectionDiagnostic {
  schema: typeof SURFACE_STATE_PROJECTION_DIAGNOSTIC_SCHEMA;
  code: 'xtend.surface.state-projection.batch-required';
  severity: 'warning';
  message: string;
}

export interface XtendSurfaceStateProjectionAdapterOptions {
  strict?: boolean;
  diagnose?(diagnostic: XtendSurfaceStateProjectionDiagnostic): unknown;
}

function batchRequiredError(): Error & { code: string } {
  const error = new TypeError('Surface state projection requires an injected batchUpdate() port.') as Error & { code: string };
  error.code = 'xtend.surface.state-projection.batch-required';
  return error;
}

/**
 * The only Surface -> Model projection adapter. It never degrades to per-key
 * set()/setState() writes and never discovers a global XState target.
 */
export function createSurfaceStateProjectionAdapter(
  target: XtendSurfaceBatchStateTarget | null | undefined,
  options: XtendSurfaceStateProjectionAdapterOptions = {}
): XtendSurfaceStateProjectionAdapter | null {
  if (!target || typeof target.batchUpdate !== 'function') {
    if (options.strict === true) throw batchRequiredError();
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
    apply(updates: Record<string, unknown>, _snapshot: XtendSurfaceSnapshot) {
      target.batchUpdate(updates);
      return Object.freeze({ mode: 'batch', updateCount: Object.keys(updates).length });
    }
  });
}
