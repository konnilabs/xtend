import type {
  XtendSurfaceController,
  XtendSurfaceOperationResult,
  XtendSurfaceSnapshot
} from './surface-record';

export const XSURFACE_MANAGER_TAG = 'x-surface-manager' as const;

export interface XSurfaceManagerPublicApi {
  readonly surfaces: XtendSurfaceSnapshot['surfaces'];
  readonly activeSurfaceId: string | null;
  readonly layoutSnapshot: XtendSurfaceSnapshot;
  readonly surfaceController: XtendSurfaceController;
  registerSurface(surface: HTMLElement | Record<string, unknown>): XtendSurfaceOperationResult;
  openSurface(id: string, input?: Record<string, unknown>): XtendSurfaceOperationResult;
  closeSurface(id: string, reason?: string): XtendSurfaceOperationResult;
  focusSurface(id: string): XtendSurfaceOperationResult;
  updateSurface(id: string, patch?: Record<string, unknown>): XtendSurfaceOperationResult;
  moveSurface(id: string, bounds: Record<string, unknown>): XtendSurfaceOperationResult;
  resizeSurface(id: string, bounds: Record<string, unknown>): XtendSurfaceOperationResult;
  minimizeSurface(id: string): XtendSurfaceOperationResult;
  maximizeSurface(id: string): XtendSurfaceOperationResult;
  restoreSurface(id: string): XtendSurfaceOperationResult;
  materializeSurface(id: string, input?: Record<string, unknown>): XtendSurfaceOperationResult;
  toggleSurface(id: string, input?: Record<string, unknown>): XtendSurfaceOperationResult;
  destroySurface(id: string, options?: Record<string, unknown>): XtendSurfaceOperationResult;
  registerSurfacePrewarmHandle(surfaceId: string, handle: unknown, options?: Record<string, unknown>): Record<string, unknown>;
  registerSurfaceChunkHandle(surfaceId: string, handle: unknown, options?: Record<string, unknown>): Record<string, unknown>;
  pinSurface(id: string, pinned?: boolean): XtendSurfaceOperationResult;
  collapseSurface(id: string): XtendSurfaceOperationResult;
  expandSurface(id: string, mode?: string): XtendSurfaceOperationResult;
  dockSurface(id: string, placement?: string, mode?: string): XtendSurfaceOperationResult;
  snapshot(): XtendSurfaceSnapshot;
  readSnapshot(): XtendSurfaceSnapshot;
}

export const xSurfaceManagerContract = Object.freeze({
  schema: 'xtend.component.contract.v2',
  tag: XSURFACE_MANAGER_TAG,
  surfaceContract: 'xtend.surface.manager.v1',
  controller: 'xtend.surface.controller.v1',
  snapshot: 'xtend.surface.snapshot.v1',
  overlayBridge: 'xtend.surface.overlay-stack-bridge.v1',
  runtime: 'components/xsurfacemanager.js',
  declaration: 'components/xsurfacemanager.d.ts',
  slots: ['default', 'windows', 'panels', 'overlays'],
  events: ['surface-manager-ready', 'surface-registered', 'surface-opened', 'surface-closed', 'surface-focused', 'surface-materialized', 'surface-updated', 'surface-destroyed', 'surface-destroy-error', 'surface-layout-changed', 'surface-panel-command', 'surface-overlay-command'],
  surfaceComponents: ['x-surface-window', 'x-side-panel', 'x-modal', 'x-dialog', 'x-drawer'],
  kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
});
