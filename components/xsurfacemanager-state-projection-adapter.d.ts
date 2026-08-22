import type { XtendSurfaceStateProjectionAdapter } from './xsurfacemanager-controller.js';
export declare const SURFACE_STATE_PROJECTION_ADAPTER_SCHEMA: "xtend.surface.state-projection-adapter.v1";
export declare const SURFACE_STATE_PROJECTION_DIAGNOSTIC_SCHEMA: "xtend.surface.state-projection-diagnostic.v1";
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
/**
 * The only Surface -> Model projection adapter. It never degrades to per-key
 * set()/setState() writes and never discovers a global XTend State target.
 */
export declare function createSurfaceStateProjectionAdapter(target: XtendSurfaceBatchStateTarget | null | undefined, options?: XtendSurfaceStateProjectionAdapterOptions): XtendSurfaceStateProjectionAdapter | null;
