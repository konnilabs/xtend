# XTend SurfaceManager Window Runtime Contract

- Status: Accepted Window Runtime
- Datum: 9. Mai 2026
- Contract: `xtend.surface.window-runtime.v1`
- Workpackage: `WP-SM-03`
- Komponenten: `x-surface-manager`, `x-surface-window`
- Controller: `xtend.surface.controller.v2`
- Snapshot: `xtend.surface.snapshot.v1`
- Kernel Boundary: `no-rmt-kernel-import-of-xtend-types`

## Zweck

`WP-SM-03` macht den in `WP-SM-02` gebauten Surface Controller sichtbar nutzbar. `x-surface-manager` ist die App-Shell-Wurzel fuer Surface-Zonen, Slots und Controller-Operationen. `x-surface-window` ist die erste sichtbare Multi Window Surface mit Chrome, Bounds, Fokus, Minimize, Maximize, Restore und Close.

Der Runtime-Schnitt bleibt bewusst klein: `x-side-panel`, responsive Panel Modes und SidePanel-spezifische Docking-Regeln bleiben `WP-SM-04`.

## Komponentenmodell

```text
x-surface-manager
  slot=windows
    x-surface-window
    x-surface-window
  slot=panels
  slot=overlays
```

`x-surface-manager` instanziiert den Controller, registriert slotted Windows und uebersetzt `surface-window-command` Events in Controller-Operationen. Danach spiegelt er den Controller-Snapshot per `applySurfaceSnapshot(record)` in die Window-Komponenten.

## Manager API

- `registerSurface(surface)`
- `openSurface(id, input?)`
- `closeSurface(id, reason?)`
- `focusSurface(id)`
- `updateSurface(id, patch?)`
- `moveSurface(id, bounds)`
- `resizeSurface(id, bounds)`
- `minimizeSurface(id)`
- `maximizeSurface(id)`
- `restoreSurface(id)`
- `snapshot()`

Events:

- `surface-manager-ready`
- `surface-registered`
- `surface-opened`
- `surface-closed`
- `surface-focused`
- `surface-updated`
- `surface-layout-changed`

## Window API

- `toSurfaceRecord(managerId)`
- `applySurfaceSnapshot(record)`
- `openWindow()`
- `closeWindow(reason?)`
- `focusWindow()`
- `minimizeWindow()`
- `maximizeWindow()`
- `restoreWindow()`

`x-surface-window` sendet `surface-window-command`. Der Manager bleibt die einzige Stelle, die Controller-Operationen ausfuehrt.

## Snapshot Bridge

Der Snapshot-Bridge-Schnitt ist `controller-snapshot-to-window-attributes-css-vars`:

- `status` wird zu `open` und `minimized`
- `active` wird zu `active`
- `maximized` wird zu `maximized`
- `bounds` werden zu `--surface-window-x`, `--surface-window-y`, `--surface-window-width`, `--surface-window-height`
- `zIndex` wird zu `--surface-window-z`

Dadurch bleibt der Controller die einzige Wahrheit fuer Layout und z-Order.

## Manifest und RMT

Manifest-Policy: `manifest-loadable-components`.

`components/manifest.json` enthaelt:

```json
{
  "x-surface-manager": "./xsurfacemanager.js",
  "x-surface-window": "./xsurfacewindow.js"
}
```

Beide Komponenten bleiben normale `xtend.component` Records. Die native RMT `surfaces` Domain bleibt spaeterer Entwurf.

## Abgrenzung

Nicht in `WP-SM-03` enthalten:

- `x-side-panel`
- responsive SidePanel Modes
- vollstaendige Browser-/Pointer-Smoke-Suite
- native RMT `surfaces` Top-Level-Domain
- Overlay-Kompatibilitaet fuer `x-modal`, `x-dialog`, `x-drawer`, `x-popover`

## Gate

Der lokale Gate ist:

```bash
node scripts/run_xtend_tests.js surface-manager --json
```

Der Gate prueft Runtime-Artefakte, Manifest, Component Docs, Fixtures, TypeScript Source, Manager/Window API, Events, Slots, Package-/Scaffold-Metadaten, Docs und Handoff nach `WP-SM-04`.
