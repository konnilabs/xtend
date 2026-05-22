# SurfaceManager SidePanel Runtime

`WP-SM-04` fuehrt `x-side-panel` als native Surface-Komponente ein. Der Contract `xtend.surface.side-panel-runtime.v1` erweitert die Window Runtime um App-Shell-nahe SidePanels mit Docking, Pinning, Collapse, Overlay und responsive Fullscreen-Verhalten.

## Komponenten

- `x-surface-manager`: erkennt `x-side-panel` im `panels`-Slot und verarbeitet `surface-panel-command`.
- `x-side-panel`: erzeugt `xtend.surface.record.v1` mit `type: "side-panel"`.
- `components/xsurfacemanager-controller.js`: bleibt die einzige Registry- und Snapshot-Wahrheit.

## Modes

| Mode | Einsatz |
|------|---------|
| Docked | dauerhafte App-Shell-Seitenleiste |
| Pinned | geoeffnetes, persistentes Panel |
| Overlay | temporaeres Panel ueber dem Workspace |
| Collapsed | kompakte Panel-Leiste |
| Fullscreen | responsive Fallback fuer kleine Viewports |

Placements: `left`, `right`, `bottom`, `inline`.

## Commands

`x-side-panel` sendet `surface-panel-command` mit `open`, `close`, `focus`, `resize`, `pin`, `unpin`, `collapse`, `expand`, `dock`, `restore` oder `update`.

Der Manager mappt diese Commands auf `openSurface`, `closeSurface`, `focusSurface`, `resizeSurface`, `updateSurface`, `pinSurface`, `collapseSurface`, `expandSurface`, `dockSurface` und `restoreSurface`.

## Gates

```bash
node scripts/run_xtend_tests.js surface-side-panel --json
npm run test:surface-side-panel -- --json
```

`WP-SM-05` baut darauf das RMT-first Workbench Fixture mit zwei Windows, SidePanel, route-bound Content und shared Surface Snapshot.
