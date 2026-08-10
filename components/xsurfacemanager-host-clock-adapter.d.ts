import type { XtendSurfaceClockPort } from './xsurfacemanager-controller.js';
export declare const SURFACE_HOST_CLOCK_ADAPTER_SCHEMA: "xtend.surface.host-clock-adapter.v1";
/** Host access is isolated here so the Surface Controller stays deterministic. */
export declare function createSurfaceHostClockAdapter(nowProvider?: () => string | number | Date): XtendSurfaceClockPort;
