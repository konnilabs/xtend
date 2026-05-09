import type {
  XtendSurfaceRecord
} from './xsurfacemanager-controller';

export type XSidePanelAttributeName =
  | 'surface-id'
  | 'label'
  | 'open'
  | 'active'
  | 'collapsed'
  | 'pinned'
  | 'mode'
  | 'placement'
  | 'responsive-mode'
  | 'resizable'
  | 'route-aware'
  | 'modal'
  | 'initial-width'
  | 'initial-height';

export type XSidePanelPlacement = 'left' | 'right' | 'bottom' | 'inline';
export type XSidePanelMode = 'docked' | 'overlay' | 'pinned' | 'collapsed' | 'fullscreen';
export type XSidePanelCommand = 'open' | 'close' | 'focus' | 'resize' | 'pin' | 'unpin' | 'collapse' | 'expand' | 'dock' | 'restore' | 'update';

export interface XSidePanelCommandDetail {
  surfaceId: string;
  command: XSidePanelCommand;
  payload: Record<string, unknown>;
}

export interface XSidePanelElement extends HTMLElement {
  surfaceManager: HTMLElement | null;
  readonly surfaceId: string;
  open: boolean;
  readonly active: boolean;
  toSurfaceRecord(managerId: string): Partial<XtendSurfaceRecord> & Record<string, unknown>;
  applySurfaceSnapshot(record: XtendSurfaceRecord): void;
  openPanel(): void;
  closePanel(reason?: string): void;
  focusPanel(): void;
  pinPanel(): void;
  collapsePanel(): void;
  expandPanel(mode?: XSidePanelMode): void;
  setPanelMode(mode: XSidePanelMode, placement?: XSidePanelPlacement): void;
  resizePanel(bounds: Partial<XtendSurfaceRecord['bounds']>): void;
  restorePanel(): void;
  addEventListener(type: 'surface-panel-command', listener: (event: CustomEvent<XSidePanelCommandDetail>) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-side-panel': XSidePanelElement;
  }
}

export {};
