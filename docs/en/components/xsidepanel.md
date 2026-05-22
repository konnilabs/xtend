# xsidepanel - XTend Component

`x-side-panel` is XTend's app-shell-adjacent side-panel surface. It registers
with an enclosing `x-surface-manager`, uses the Surface Controller from
`WP-SM-02`, and mirrors snapshots into placement, mode, pinning, collapsed
state, size, and z-order.

## Attributes

- `surface-id`: stable surface ID
- `label`: accessible name and panel title
- `open`, `active`, `collapsed`, `pinned`
- `placement`: `left`, `right`, `bottom`, or `inline`
- `mode`: `docked`, `overlay`, `pinned`, `collapsed`, or `fullscreen`
- `responsive-mode`: default `fullscreen-under-720`
- `resizable`, `route-aware`, `modal`
- `initial-width`, `initial-height`

## API

`toSurfaceRecord(managerId)` creates an `xtend.surface.record.v1` with
`type: "side-panel"`. `applySurfaceSnapshot(record)` updates visible state,
bounds, placement, mode, and a11y state.

Commands: `openPanel()`, `closePanel(reason)`, `focusPanel()`, `pinPanel()`,
`collapsePanel()`, `expandPanel(mode)`, `setPanelMode(mode, placement)`,
`resizePanel(bounds)`, and `restorePanel()`.

The element emits `surface-panel-command` with `open`, `close`, `focus`,
`resize`, `pin`, `unpin`, `collapse`, `expand`, `dock`, `restore`, or
`update`. The manager translates these commands into controller operations or
`updateSurface`.

RMT: `xtend.rmt.component-contract.v1`, `xtend.surface.record.v1`,
`surface.visible.render`, `surface.user-blocking.open`,
`surface.user-blocking.close`, `surface.transition.layout`,
`surface.diagnostics.snapshot`.

## ECH-WP-06 Overlay Parity

`x-side-panel` exposes `surface`, `backdrop`, `close`, and `content` as shared
overlay parts. The previous `scrim` part remains as an alias for `backdrop`.
Surface, text, border, elevation, backdrop, z-index, and focus ring use
`--xtend-overlay-*` and component-local `--side-panel-*` tokens.

`mode="docked"` and `mode="pinned"` remain non-modal and app-shell-adjacent.
`mode="overlay"` or `modal` activates the backdrop and overlay controls for
SurfaceManager orchestration.
