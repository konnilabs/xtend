import type {
  XtendSurfaceRecord
} from './xsurfacemanager-controller';

export type XSurfaceWindowAttributeName =
  | 'surface-id'
  | 'label'
  | 'open'
  | 'active'
  | 'minimized'
  | 'maximized'
  | 'resizable'
  | 'draggable'
  | 'modal'
  | 'initial-x'
  | 'initial-y'
  | 'initial-width'
  | 'initial-height';

export type XSurfaceWindowCommand = 'open' | 'close' | 'focus' | 'move' | 'resize' | 'minimize' | 'maximize' | 'restore' | 'update';

export interface XSurfaceWindowCommandDetail {
  surfaceId: string;
  command: XSurfaceWindowCommand;
  payload: Record<string, unknown>;
}

export interface XSurfaceWindowElement extends HTMLElement {
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
  addEventListener(type: 'surface-window-command', listener: (event: CustomEvent<XSurfaceWindowCommandDetail>) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-surface-window': XSurfaceWindowElement;
  }
}

export {};
