# SurfaceManager SidePanel Runtime

`WP-SM-04` introduces `x-side-panel` as a native surface component. The contract `xtend.surface.side-panel-runtime.v1` extends the window runtime with app-shell-close side panels for docking, pinning, collapse, overlay and responsive fullscreen behavior.

## Components

- `x-surface-manager`: detects `x-side-panel` in the `panels` slot and processes `surface-panel-command`.
- `x-side-panel`: creates `xtend.surface.record.v1` with `type: "side-panel"`.
- `components/xsurfacemanager-controller.js`: remains the only registry and snapshot truth.

## Modes

| Mode | Use |
|------|-----|
| Docked | persistent app-shell sidebar |
| Pinned | open, persistent panel |
| Overlay | temporary panel above the workspace |
| Collapsed | compact panel rail |
| Fullscreen | responsive fallback for small viewports |

Placements: `left`, `right`, `bottom`, `inline`.

## Commands

`x-side-panel` sends `surface-panel-command` with `open`, `close`, `focus`, `resize`, `pin`, `unpin`, `collapse`, `expand`, `dock`, `restore` or `update`.

The manager maps these commands to `openSurface`, `closeSurface`, `focusSurface`, `resizeSurface`, `updateSurface`, `pinSurface`, `collapseSurface`, `expandSurface`, `dockSurface` and `restoreSurface`.

## Gates

```bash
node scripts/run_xtend_tests.js surface-side-panel --json
npm run test:surface-side-panel -- --json
```

`WP-SM-05` builds on this with the RMT-first workbench fixture containing two windows, a side panel, route-bound content and a shared surface snapshot.
