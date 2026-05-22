# SurfaceManager Layout Engines

Ab `WP-SM-16` besitzt `x-surface-manager` den Contract `xtend.surface.layout-engine.v1` fuer sichtbare, snapshot-kompatible Surface Layouts.

## Engines

| Engine | Zweck |
|--------|-------|
| `freeform` | freie Fenster mit Viewport-Clamp, Snap und einfacher Kollisionskorrektur |
| `docked` | SidePanels und docked Surfaces belegen Ränder, Workspace-Surfaces fuellen den Rest |
| `split` | offene Layout-Surfaces werden als Split Panes verteilt |
| `tile` | offene Layout-Surfaces werden in einem Raster verteilt |
| `stacked` | offene Layout-Surfaces werden als versetzter Stack dargestellt und als kompakter Fallback genutzt |

## Runtime

- `snapshotSurfaceLayout()` liefert `xtend.surface.layout-engine-report.v1`.
- `applyLayoutEngine(engine)` schreibt berechnete Bounds ueber den bestehenden SurfaceController in den Snapshot.
- `dockSurface()` setzt Placement/Mode und wendet eine docked oder aktuell aktive Layout Engine sichtbar an.
- `undockSurface()` setzt eine Surface auf `floating` und laesst sie wieder im Freeform-Modus laufen.
- `surface-layout-gap` und `surface-layout-snap` steuern Abstaende und Snap-Raster.
- kompakte Viewports fallen auf `stacked` zurueck.

## Boundary

Die Layout Engine bleibt eine XTend-UI-Unterstuetzungsschicht. Der SurfaceController bleibt Registry- und Snapshot-Quelle, Fabric bleibt fuer Diagnostics/Backpressure zustaendig, und der RMT Kernel importiert keine XTend-Typen. Es entsteht keine zweite Registry.

Lokaler Gate:

```bash
node scripts/run_xtend_tests.js surface-layout-engines --json
```
