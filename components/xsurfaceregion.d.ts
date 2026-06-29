import type {
  XtendSurfaceRecord
} from './xsurfacemanager-controller';

export type XSurfaceRegionKind = 'root' | 'workspace' | 'page' | 'card' | 'list' | 'region' | 'overlay-host' | string;
export type XSurfaceRegionAttributeName =
  | 'surface-id'
  | 'label'
  | 'kind'
  | 'open'
  | 'active'
  | 'hidden'
  | 'mode'
  | 'placement'
  | 'bounds-mode'
  | 'bounds-scope'
  | 'initial-x'
  | 'initial-y'
  | 'initial-width'
  | 'initial-height'
  | 'initial-min-width'
  | 'initial-min-height'
  | 'initial-max-width'
  | 'initial-max-height'
  | 'role';

export type XSurfaceRegionCommand = 'open' | 'close' | 'focus' | 'restore' | 'update';

export interface XSurfaceRegionCommandDetail {
  surfaceId: string;
  command: XSurfaceRegionCommand;
  payload: Record<string, unknown>;
}

export interface XSurfaceRegionElement extends HTMLElement {
  surfaceManager: HTMLElement | null;
  readonly surfaceId: string;
  readonly kind: XSurfaceRegionKind;
  open: boolean;
  toSurfaceRecord(managerId: string): Partial<XtendSurfaceRecord> & Record<string, unknown>;
  applySurfaceSnapshot(record: XtendSurfaceRecord): void;
  openRegion(): XSurfaceRegionCommandDetail;
  closeRegion(reason?: string): XSurfaceRegionCommandDetail;
  focusRegion(): XSurfaceRegionCommandDetail;
  restoreRegion(): XSurfaceRegionCommandDetail;
  updateRegion(payload?: Record<string, unknown>): XSurfaceRegionCommandDetail;
  addEventListener(type: 'surface-region-command', listener: (event: CustomEvent<XSurfaceRegionCommandDetail>) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-surface-region': XSurfaceRegionElement;
  }
}

export {};
