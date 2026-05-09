import type {
  XtendSurfaceController,
  XtendSurfaceOperationResult,
  XtendSurfaceSnapshot
} from './xsurfacemanager-controller';

export type XSurfaceManagerAttributeName = 'layout' | 'restore-key' | 'route-aware' | 'modal-policy' | 'manager-id' | 'state-key';
export type XSurfaceManagerEventName =
  | 'surface-manager-ready'
  | 'surface-registered'
  | 'surface-opened'
  | 'surface-closed'
  | 'surface-focused'
  | 'surface-updated'
  | 'surface-layout-changed';

export interface XSurfaceManagerEventDetail {
  managerId: string;
  result: XtendSurfaceOperationResult | null;
  snapshot: XtendSurfaceSnapshot;
}

export interface XSurfaceManagerElement extends HTMLElement {
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
  pinSurface(id: string, pinned?: boolean): XtendSurfaceOperationResult;
  collapseSurface(id: string): XtendSurfaceOperationResult;
  expandSurface(id: string, mode?: string): XtendSurfaceOperationResult;
  dockSurface(id: string, placement?: string, mode?: string): XtendSurfaceOperationResult;
  snapshot(): XtendSurfaceSnapshot;
  addEventListener(type: XSurfaceManagerEventName, listener: (event: CustomEvent<XSurfaceManagerEventDetail>) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-surface-manager': XSurfaceManagerElement;
  }
}

export {};
