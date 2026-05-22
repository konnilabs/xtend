# SurfaceManager Window Runtime

`WP-SM-03` makes the SurfaceManager visible for the first time: `x-surface-manager` manages the controller, and `x-surface-window` is the first WindowManager surface.

- Contract: `xtend.surface.window-runtime.v1`
- Manager: `components/xsurfacemanager.js`
- Window: `components/xsurfacewindow.js`
- Controller: `components/xsurfacemanager-controller.js`
- Gate: `node scripts/run_xtend_tests.js surface-manager --json`

## Example

```html
<x-surface-manager id="workbench" manager-id="workbench.manager">
  <x-surface-window
    slot="windows"
    surface-id="workbench.inspector"
    label="Inspector"
    open
    draggable
    resizable
    initial-x="96"
    initial-y="88"
    initial-width="520"
    initial-height="360">
    <section>Inspector content</section>
  </x-surface-window>
</x-surface-manager>
```

## Manager

`x-surface-manager` provides `registerSurface`, `openSurface`, `closeSurface`, `focusSurface`, `updateSurface`, `moveSurface`, `resizeSurface`, `minimizeSurface`, `maximizeSurface`, `restoreSurface` and `snapshot`.

Slots: `windows`, `panels`, `overlays`, `default`.

Events: `surface-manager-ready`, `surface-registered`, `surface-opened`, `surface-closed`, `surface-focused`, `surface-updated`, `surface-layout-changed`.

## Window

`x-surface-window` provides `toSurfaceRecord`, `applySurfaceSnapshot`, `openWindow`, `closeWindow`, `focusWindow`, `minimizeWindow`, `maximizeWindow` and `restoreWindow`.

The element sends `surface-window-command`. The manager turns it into the controller operation and mirrors the snapshot back.

## Handoff

`WP-SM-04` extends this runtime with `x-side-panel` and responsive surface modes. The window runtime remains the first multi-window proof and must not introduce a second registry beside the controller.
