# XTend SurfaceManager SidePanel Runtime Contract

- Status: accepted-side-panel-runtime
- Workpackage: `WP-SM-04`
- Schema: `xtend.surface.side-panel-runtime.v1`
- Report: `xtend.surface.side-panel-runtime-report.v1`
- Zielzustand: `responsive-side-panel-surface-runtime-ready`
- Local Gate: `node scripts/run_xtend_tests.js surface-side-panel --json`
- Kernel Boundary: `no-rmt-kernel-import-of-xtend-types`

## Zweck

`WP-SM-04` erweitert die SurfaceManager-Komponentenfamilie um `x-side-panel`. SidePanels sind App-Shell-nahe Surfaces und keine reine Drawer-Variante. Sie koennen dauerhaft gedockt, gepinnt, als Overlay geoeffnet, kollabiert oder auf kleinen Viewports full-screen dargestellt werden.

Der Contract baut direkt auf `WP-SM-02` und `WP-SM-03` auf: `x-surface-manager` bleibt die Registry- und Snapshot-Wahrheit, `components/xsurfacemanager-controller.js` bleibt der Controller, und `x-side-panel` ist ein manifest-loadable Custom Element mit `xtend.surface.record.v1`.

## Runtime-Schnitt

| Bereich | Contract |
|---------|----------|
| Component | `x-side-panel` |
| Surface Type | `side-panel` |
| Record | `xtend.surface.record.v1` |
| Controller | `xtend.surface.controller.v1` |
| Manager | `xtend.surface.manager.v1` |
| Command Event | `surface-panel-command` |
| Snapshot Bridge | `controller-snapshot-to-panel-attributes-css-vars` |
| Responsive Policy | `fullscreen-under-720` |

## Modes

| Mode | Verhalten |
|------|-----------|
| `docked` | Panel sitzt im App-Shell-Rand und bleibt Teil des Workspace-Layouts |
| `overlay` | Panel liegt ueber dem Workspace und nutzt Scrim/Modal-Semantik |
| `pinned` | Panel bleibt offen und setzt `pinned` im Surface Snapshot |
| `collapsed` | Panel bleibt als kompakte Leiste sichtbar |
| `fullscreen` | Panel kann auf kleinen Viewports die komplette Surface-Zone einnehmen |

## Placements

`x-side-panel` unterstuetzt `left`, `right`, `bottom` und `inline`. `bottom` ist die mobile/bottom-sheet-nahe Variante; `inline` ist fuer spaetere Workbench-Layouts vorbereitet, in denen Panels nicht absolut am Viewport-Rand liegen.

## Manager Bridge

`x-surface-manager` erkennt `x-side-panel` im `panels`-Slot, registriert es ueber `toSurfaceRecord(managerId)` und wendet Controller-Snapshots ueber `applySurfaceSnapshot(record)` an.

Panel Commands werden ueber `surface-panel-command` verschickt:

- `open`, `close`, `focus`
- `resize`
- `pin`, `unpin`
- `collapse`, `expand`
- `dock`
- `restore`
- `update`

Der Manager uebersetzt diese Commands in bestehende Controller-Operationen. Es entsteht keine zweite Registry und keine zweite Runtime neben Fabric.

## RMT-Authoring

Kurzfristig bleibt `x-side-panel` ein normaler `xtend.component` Record:

```json
{
  "id": "workbench.properties",
  "kind": "custom_element",
  "adapter": "xtend.component",
  "tag": "x-side-panel",
  "schedule": "surface.visible.render",
  "metadata": {
    "surface": {
      "schema": "xtend.surface.record.v1",
      "type": "side-panel",
      "placement": "right",
      "mode": "pinned",
      "defaultOpen": true
    }
  }
}
```

Die native `surfaces` Domain und der spaetere `xtend.surface` Adapter bleiben fuer `WP-SM-08` reserviert.

## Done Criteria

- `components/xsidepanel.js` und `components/xsidepanel.d.ts` existieren.
- `src/components/x-side-panel/x-side-panel.ts` beschreibt die TypeScript-Quelle.
- `components/manifest.json` kennt `x-side-panel`.
- `x-surface-manager` registriert `x-side-panel` und verarbeitet `surface-panel-command`.
- Docked, Overlay, Pinned, Collapsed und responsive Fullscreen sind im Runtime-Contract sichtbar.
- Component Docs, Fixture, Component Suite, Catalog Coverage und Reference Registry kennen `x-side-panel`.
- Der lokale Gate `node scripts/run_xtend_tests.js surface-side-panel --json` ist gruen.

## Handoff

`WP-SM-05` baut darauf das RMT-first Workbench Fixture: eine App Shell mit zwei Windows, einem gepinnten SidePanel, route-bound Content und einem gemeinsamen Surface Snapshot.
