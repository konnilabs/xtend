export const SURFACE_HOST_CLOCK_ADAPTER_SCHEMA = 'xtend.surface.host-clock-adapter.v1';
/** Host access is isolated here so the Surface Controller stays deterministic. */
export function createSurfaceHostClockAdapter(nowProvider = () => new Date()) {
    if (typeof nowProvider !== 'function') {
        throw new TypeError('Surface host clock adapter requires a now() provider.');
    }
    return Object.freeze({
        schema: SURFACE_HOST_CLOCK_ADAPTER_SCHEMA,
        now: nowProvider
    });
}
