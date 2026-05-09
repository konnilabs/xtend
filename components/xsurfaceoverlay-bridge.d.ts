import type { XtendSurfaceRecord, XtendSurfaceType } from './xsurfacemanager-controller';

export declare const SURFACE_OVERLAY_BRIDGE_SCHEMA: 'xtend.surface.overlay-stack-bridge.v1';
export declare const SURFACE_OVERLAY_SELECTOR: 'x-modal, x-dialog, x-drawer';
export declare const OVERLAY_LIFECYCLE_EVENTS: readonly [
  'modal-opened',
  'modal-closed',
  'dialog-opened',
  'dialog-closed',
  'drawer-opened',
  'drawer-closed',
  'drawer-route-selected'
];

export interface XtendSurfaceOverlayCompatibilityProfile {
  schema: typeof SURFACE_OVERLAY_BRIDGE_SCHEMA;
  componentRef: 'x-modal' | 'x-dialog' | 'x-drawer';
  surfaceType: Extract<XtendSurfaceType, 'modal' | 'dialog' | 'drawer'>;
  managerSlot: 'overlays';
  managerEvent: 'surface-overlay-command';
  legacyLifecycleEvents: readonly string[];
  legacyStateKey: string;
  registration: 'optional';
  bridgeModule: 'components/xsurfaceoverlay-bridge.js';
  surfaceRecordSchema: 'xtend.surface.record.v1';
  legacyApiPreserved: true;
  fabric: {
    lane: 'visible' | 'user-blocking';
    diagnosticsLane: 'diagnostics';
  };
  rmt: {
    adapter: 'xtend.component';
    kernelBoundary: 'no-rmt-kernel-import-of-xtend-types';
  };
}

export declare function isSurfaceOverlayElement(element: Element | null | undefined): element is HTMLElement;
export declare function findSurfaceOverlayElement(event: Event): HTMLElement | null;
export declare function overlaySurfaceId(element: HTMLElement): string;
export declare function overlaySurfaceType(element: HTMLElement): Extract<XtendSurfaceType, 'modal' | 'dialog' | 'drawer'>;
export declare function createOverlayCompatibilityProfile(element: HTMLElement): XtendSurfaceOverlayCompatibilityProfile | null;
export declare function toOverlaySurfaceRecord(element: HTMLElement, managerId?: string): Partial<XtendSurfaceRecord> & Record<string, unknown>;
export declare function applyOverlaySurfaceSnapshot(element: HTMLElement, record?: Partial<XtendSurfaceRecord>): void;
