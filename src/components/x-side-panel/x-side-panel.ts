import type {
  XtendSurfaceBounds,
  XtendSurfaceRecord
} from '../x-surface-manager/surface-record';

export const XSIDE_PANEL_TAG = 'x-side-panel' as const;

export type XSidePanelPlacement = 'left' | 'right' | 'bottom' | 'inline';
export type XSidePanelMode = 'docked' | 'overlay' | 'pinned' | 'collapsed' | 'fullscreen';

export interface XSidePanelPublicApi {
  surfaceManager: HTMLElement | null;
  readonly surfaceId: string;
  open: boolean;
  readonly active: boolean;
  toSurfaceRecord(managerId: string): Partial<XtendSurfaceRecord> & Record<string, unknown>;
  applySurfaceSnapshot(record: XtendSurfaceRecord): void;
  openPanel(): void;
  closePanel(reason?: string): void;
  focusPanel(): void;
  minimizePanel(): void;
  pinPanel(): void;
  collapsePanel(): void;
  expandPanel(mode?: XSidePanelMode): void;
  setPanelMode(mode: XSidePanelMode, placement?: XSidePanelPlacement): void;
  resizePanel(bounds: Partial<XtendSurfaceBounds>): void;
  restorePanel(): void;
}

export interface XSidePanelInitialBounds extends Partial<XtendSurfaceBounds> {
  width: number;
  height: number;
}

export const xSidePanelContract = Object.freeze({
  schema: 'xtend.component.contract.v2',
  tag: XSIDE_PANEL_TAG,
  surfaceContract: 'xtend.surface.record.v1',
  controller: 'xtend.surface.controller.v1',
  runtime: 'components/xsidepanel.js',
  declaration: 'components/xsidepanel.d.ts',
  attributes: [
    'surface-id',
    'label',
    'open',
    'active',
    'minimized',
    'collapsed',
    'pinned',
    'mode',
    'placement',
    'responsive-mode',
    'resizable',
    'route-aware',
    'modal',
    'initial-width',
    'initial-height'
  ],
  placements: ['left', 'right', 'bottom', 'inline'],
  modes: ['docked', 'overlay', 'pinned', 'collapsed', 'fullscreen'],
  commands: ['open', 'close', 'focus', 'resize', 'minimize', 'pin', 'unpin', 'collapse', 'expand', 'dock', 'restore', 'update'],
  event: 'surface-panel-command',
  responsiveMode: 'fullscreen-under-720',
  kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
});
