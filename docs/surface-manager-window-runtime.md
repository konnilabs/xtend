# SurfaceManager Window Runtime

`WP-SM-03` macht den SurfaceManager erstmals sichtbar: `x-surface-manager` verwaltet den Controller und `x-surface-window` ist die erste WindowManager-Surface.

- Contract: `xtend.surface.window-runtime.v1`
- Manager: `components/xsurfacemanager.js`
- Window: `components/xsurfacewindow.js`
- Controller: `components/xsurfacemanager-controller.js`
- Gate: `node scripts/run_xtend_tests.js surface-manager --json`

## Beispiel

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

`x-surface-manager` bietet `registerSurface`, `openSurface`, `closeSurface`, `focusSurface`, `updateSurface`, `moveSurface`, `resizeSurface`, `minimizeSurface`, `maximizeSurface`, `restoreSurface` und `snapshot`.

Slots: `windows`, `panels`, `overlays`, `default`.

Events: `surface-manager-ready`, `surface-registered`, `surface-opened`, `surface-closed`, `surface-focused`, `surface-updated`, `surface-layout-changed`.

## Window

`x-surface-window` bietet `toSurfaceRecord`, `applySurfaceSnapshot`, `openWindow`, `closeWindow`, `focusWindow`, `minimizeWindow`, `maximizeWindow` und `restoreWindow`.

Das Element sendet `surface-window-command`. Der Manager fuehrt daraus die Controller-Operation aus und spiegelt den Snapshot zurueck.

## Handoff

`WP-SM-04` erweitert diese Runtime um `x-side-panel` und responsive Surface Modes. Die Window-Runtime bleibt der erste Multi Window Beweis und darf keine zweite Registry neben dem Controller einfuehren.
