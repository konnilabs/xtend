# xsidepanel - XTend Komponente

`x-side-panel` ist die App-Shell-nahe SidePanel-Surface fuer XTend. Sie registriert sich bei einem umgebenden `x-surface-manager`, nutzt den Surface Controller aus `WP-SM-02` und spiegelt Snapshots in Placement, Mode, Pinning, Collapse-State, Groesse und z-Order.

## Attribute

- `surface-id`: stabile Surface-ID
- `label`: Accessible Name und Panel-Titel
- `open`, `active`, `collapsed`, `pinned`
- `placement`: `left`, `right`, `bottom` oder `inline`
- `mode`: `docked`, `overlay`, `pinned`, `collapsed` oder `fullscreen`
- `responsive-mode`: Standard `fullscreen-under-720`
- `resizable`, `route-aware`, `modal`
- `initial-width`, `initial-height`

## API

`toSurfaceRecord(managerId)` erzeugt ein `xtend.surface.record.v1` mit `type: "side-panel"`. `applySurfaceSnapshot(record)` aktualisiert sichtbaren Status, Bounds, Placement, Mode und A11y-State.

Commands: `openPanel()`, `closePanel(reason)`, `focusPanel()`, `pinPanel()`, `collapsePanel()`, `expandPanel(mode)`, `setPanelMode(mode, placement)`, `resizePanel(bounds)` und `restorePanel()`.

Das Element sendet `surface-panel-command` mit `open`, `close`, `focus`, `resize`, `pin`, `unpin`, `collapse`, `expand`, `dock`, `restore` oder `update`. Der Manager uebersetzt diese Commands in Controller-Operationen beziehungsweise `updateSurface`.

RMT: `xtend.rmt.component-contract.v1`, `xtend.surface.record.v1`, `surface.visible.render`, `surface.user-blocking.open`, `surface.user-blocking.close`, `surface.transition.layout`, `surface.diagnostics.snapshot`.
