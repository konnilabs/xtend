import {
  XtendSurfaceBounds,
  XtendSurfaceType
} from './surface-record';

export const XTEND_SURFACE_DEFAULT_BOUNDS: Readonly<Record<XtendSurfaceType, XtendSurfaceBounds>> = Object.freeze({
  window: Object.freeze({ x: 64, y: 64, width: 640, height: 420, minWidth: 280, minHeight: 180 }),
  'side-panel': Object.freeze({ x: 0, y: 0, width: 320, height: 720, minWidth: 240, minHeight: 180 }),
  modal: Object.freeze({ x: 0, y: 0, width: 560, height: 360, minWidth: 320, minHeight: 180 }),
  dialog: Object.freeze({ x: 0, y: 0, width: 480, height: 320, minWidth: 280, minHeight: 160 }),
  drawer: Object.freeze({ x: 0, y: 0, width: 360, height: 720, minWidth: 240, minHeight: 180 }),
  popover: Object.freeze({ x: 0, y: 0, width: 280, height: 160, minWidth: 160, minHeight: 96 }),
  tooltip: Object.freeze({ x: 0, y: 0, width: 220, height: 80, minWidth: 120, minHeight: 48 })
});

export function toFiniteNumber(value: unknown, fallback: number): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function normalizeSurfaceType(type: unknown): XtendSurfaceType {
  const candidate = String(type || 'window').trim();
  if (candidate === 'side-panel') return 'side-panel';
  if (candidate === 'modal') return 'modal';
  if (candidate === 'dialog') return 'dialog';
  if (candidate === 'drawer') return 'drawer';
  if (candidate === 'popover') return 'popover';
  if (candidate === 'tooltip') return 'tooltip';
  return 'window';
}

export function normalizeSurfaceBounds(bounds: Partial<XtendSurfaceBounds> = {}, type: XtendSurfaceType = 'window'): XtendSurfaceBounds {
  const defaults = XTEND_SURFACE_DEFAULT_BOUNDS[type] || XTEND_SURFACE_DEFAULT_BOUNDS.window;
  const minWidth = Math.max(1, toFiniteNumber(bounds.minWidth, defaults.minWidth));
  const minHeight = Math.max(1, toFiniteNumber(bounds.minHeight, defaults.minHeight));
  const width = Math.max(minWidth, toFiniteNumber(bounds.width, defaults.width));
  const height = Math.max(minHeight, toFiniteNumber(bounds.height, defaults.height));

  return {
    x: Math.max(0, toFiniteNumber(bounds.x, defaults.x)),
    y: Math.max(0, toFiniteNumber(bounds.y, defaults.y)),
    width,
    height,
    minWidth,
    minHeight
  };
}

export function mergeSurfaceBounds(base: XtendSurfaceBounds, patch: Partial<XtendSurfaceBounds>, type: XtendSurfaceType): XtendSurfaceBounds {
  return normalizeSurfaceBounds({
    ...base,
    ...patch
  }, type);
}
