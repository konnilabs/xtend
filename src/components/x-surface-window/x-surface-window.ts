import type {
  XtendSurfaceBounds,
  XtendSurfaceRecord
} from '../x-surface-manager/surface-record';

export const XSURFACE_WINDOW_TAG = 'x-surface-window' as const;

export interface XSurfaceWindowPublicApi {
  surfaceManager: HTMLElement | null;
  readonly surfaceId: string;
  open: boolean;
  readonly active: boolean;
  toSurfaceRecord(managerId: string): Partial<XtendSurfaceRecord> & Record<string, unknown>;
  applySurfaceSnapshot(record: XtendSurfaceRecord): void;
  openWindow(): void;
  closeWindow(reason?: string): void;
  focusWindow(): void;
  minimizeWindow(): void;
  maximizeWindow(): void;
  restoreWindow(): void;
}

export interface XSurfaceWindowLifecycleDetail {
  schema: 'xtend.surface.lifecycle-change.v1';
  surfaceId: string;
  status: string;
  open: boolean;
  minimized: boolean;
  maximized: boolean;
  active: boolean;
  source: typeof XSURFACE_WINDOW_TAG;
}

export interface XSurfaceWindowInitialBounds extends Partial<XtendSurfaceBounds> {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const xSurfaceWindowContract = Object.freeze({
  schema: 'xtend.component.contract.v2',
  tag: XSURFACE_WINDOW_TAG,
  surfaceContract: 'xtend.surface.record.v1',
  controller: 'xtend.surface.controller.v1',
  runtime: 'components/xsurfacewindow.js',
  declaration: 'components/xsurfacewindow.d.ts',
  attributes: ['surface-id', 'label', 'open', 'active', 'minimized', 'maximized', 'resizable', 'draggable', 'modal', 'initial-x', 'initial-y', 'initial-width', 'initial-height'],
  commands: ['open', 'close', 'focus', 'move', 'resize', 'minimize', 'maximize', 'restore', 'update'],
  event: 'surface-window-command',
  lifecycleEvent: 'surface-lifecycle-change',
  kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
});
