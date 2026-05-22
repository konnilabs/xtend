# xsurfacewindow - XTend Komponente

`x-surface-window` ist die erste sichtbare WindowManager-Surface fuer XTend. Sie registriert sich bei einem umgebenden `x-surface-manager`, stellt Window-Chrome, Aktionen, Bounds und Content-Slot bereit und spiegelt Controller-Snapshots in Attribute und CSS-Variablen.

## Attribute

- `surface-id`: stabile Surface-ID
- `label`: Accessible Name und Window-Titel
- `open`, `active`, `minimized`, `maximized`
- `draggable`, `resizable`, `modal`
- `initial-x`, `initial-y`, `initial-width`, `initial-height`

## API

`toSurfaceRecord(managerId)` erzeugt ein `xtend.surface.record.v1` fuer den Manager. `applySurfaceSnapshot(record)` aktualisiert sichtbaren Status, Bounds und z-Order.

Commands: `openWindow()`, `closeWindow(reason)`, `focusWindow()`, `minimizeWindow()`, `maximizeWindow()` und `restoreWindow()`.

Das Element sendet `surface-window-command` mit `open`, `close`, `focus`, `move`, `resize`, `minimize`, `maximize`, `restore` oder `update`. Der Manager uebersetzt diese Commands in Controller-Operationen.

RMT: `xtend.rmt.component-contract.v1`, `xtend.surface.record.v1`, `surface.user-blocking.open`, `surface.user-blocking.close`, `surface.transition.layout`, `surface.diagnostics.snapshot`.
