# SurfaceManager Workbench Fixture

Docs Contract: `xtend.docs.surface-manager-workbench-fixture.v1`

Runtime Contract: `xtend.surface.workbench-fixture.v1`

`WP-SM-05` fuehrt die erste RMT-first Workbench fuer den SurfaceManager ein. Sie rendert eine App Shell aus RMT, bindet den SurfaceManager an eine Route und zeigt zwei Windows plus SidePanel mit gemeinsamem Snapshot.

## Artefakte

| Pfad | Zweck |
|------|-------|
| `xtendrmt/surface-workbench.rmt` | RMT-Dokument mit App Shell, Route, SurfaceManager, zwei Windows, SidePanel und Content |
| `tests/browser/fixtures/rmt-surface-workbench-smoke.html` | Host-/Smoke-Fixture ohne manuelle Surface-Komponenten |
| `xtendrmt/surface-workbench.js` | Workbench Renderer fuer `dom_descriptor`, Slots, Routes und Snapshot |

## Modell

Die Workbench nutzt weiter den MVP-Pfad aus `xtend.rmt.surface-authoring.v1`: Surfaces sind normale `components` Records mit `metadata.surface`. Die native RMT `surfaces` Domain bleibt reserviert.

Enthalten sind:

- `workbench.manager` als `x-surface-manager`
- `workbench.inspector` und `workbench.editor` als zwei Windows
- `workbench.properties` als `x-side-panel`
- `app.router` als route-bound Outlet
- `workbench` als Route fuer Surface Content
- `xtend.surface.snapshot` als shared Surface Snapshot Key

## Runtime

`xtendrmt/surface-workbench.js` rendert nur strukturierte DOM Nodes. Der Renderer verwendet kein `innerHTML`, sondern `renderDomDescriptor`, `renderSurfaceWorkbenchFromDocument` und `root.replaceChildren(shellFragment)`.

Der Snapshot wird ueber `collectSurfaceSnapshot(root)` gelesen. Wenn `x-surface-manager.snapshot()` verfuegbar ist, kommt der Snapshot direkt vom Manager; andernfalls liefert das Fixture einen DOM-Fallback fuer statische Gates.

## Gate

```bash
node scripts/run_xtend_tests.js surface-workbench-fixture --json
```

Der Gate prueft Contract, RMT-Normalisierung, Host-Boundary, Runtime-Boundary, route-bound Content, zwei Windows, SidePanel, shared Surface Snapshot, Package-/Scaffold-Metadaten, Docs und Runner-Registrierung.
