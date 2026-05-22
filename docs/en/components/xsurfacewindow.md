# xsurfacewindow - XTend Component

`x-surface-window` is XTend's first visible WindowManager surface. It registers
with an enclosing `x-surface-manager`, provides window chrome, actions, bounds,
and a content slot, and mirrors controller snapshots into attributes and CSS
variables.

## Attributes

- `surface-id`: stable surface ID
- `label`: accessible name and window title
- `open`, `active`, `minimized`, `maximized`
- `draggable`, `resizable`, `modal`
- `initial-x`, `initial-y`, `initial-width`, `initial-height`

## API

`toSurfaceRecord(managerId)` creates an `xtend.surface.record.v1` for the
manager. `applySurfaceSnapshot(record)` updates visible state, bounds, and
z-order.

Commands: `openWindow()`, `closeWindow(reason)`, `focusWindow()`,
`minimizeWindow()`, `maximizeWindow()`, and `restoreWindow()`.

The element emits `surface-window-command` with `open`, `close`, `focus`,
`move`, `resize`, `minimize`, `maximize`, `restore`, or `update`. The manager
translates these commands into controller operations.

RMT: `xtend.rmt.component-contract.v1`, `xtend.surface.record.v1`,
`surface.user-blocking.open`, `surface.user-blocking.close`,
`surface.transition.layout`, `surface.diagnostics.snapshot`.
