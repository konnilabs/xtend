# SurfaceManager Layout Engines

As of `WP-SM-16`, `x-surface-manager` owns the `xtend.surface.layout-engine.v1` contract for visible, snapshot-compatible surface layouts.

## Engines

| Engine | Purpose |
|--------|---------|
| `freeform` | free windows with viewport clamp, snap and simple collision correction |
| `docked` | side panels and docked surfaces occupy edges; workspace surfaces fill the rest |
| `split` | open layout surfaces are distributed as split panes |
| `tile` | open layout surfaces are distributed in a grid |
| `stacked` | open layout surfaces are shown as an offset stack and used as compact fallback |

## Runtime

- `snapshotSurfaceLayout()` returns `xtend.surface.layout-engine-report.v1`.
- `applyLayoutEngine(engine)` writes calculated bounds through the existing SurfaceController into the snapshot.
- `dockSurface()` sets placement/mode and visibly applies a docked or currently active layout engine.
- `undockSurface()` sets a surface to `floating` and lets it run in freeform mode again.
- `surface-layout-gap` and `surface-layout-snap` control spacing and the snap grid.
- compact viewports fall back to `stacked`.

## Boundary

The layout engine remains an XTend UI support layer. The SurfaceController remains the registry and snapshot source, Fabric remains responsible for diagnostics/backpressure, and the RMT kernel imports no XTend types. No second registry is created.

Local gate:

```bash
node scripts/run_xtend_tests.js surface-layout-engines --json
```
