# xsurfacemanager - XTend Component

`x-surface-manager` is the app-shell surface root for multi-window interfaces.
The component instantiates `xtend.surface.controller.v1`, registers slotted
`x-surface-window`, `x-side-panel`, and compatible overlay elements, and
mirrors layout, focus, and lifecycle changes as `xtend.surface.snapshot.v1`.

## Attributes

- `manager-id`: stable manager ID for surface records
- `state-key`: xstate registry key, defaults to `xtend.surface.registry`
- `layout`: layout profile for the surface zone
- `restore-key`: future persistence key for layout restore
- `route-aware`: marks route-bound surface management
- `modal-policy`: policy for future modal surface stacks

## Slots

- `windows`: freely positioned windows
- `panels`: `x-side-panel` surfaces with docked, pinned, overlay, or collapsed modes
- `overlays`: optional overlay bridge for `x-modal`, `x-dialog`, and `x-drawer`
- `default`: simple Light DOM fallbacks

## API

`registerSurface(surface)`, `openSurface(id)`, `closeSurface(id)`,
`focusSurface(id)`, `updateSurface(id, patch)`, `moveSurface(id, bounds)`,
`resizeSurface(id, bounds)`, `minimizeSurface(id)`, `maximizeSurface(id)`,
`restoreSurface(id)`, `pinSurface(id)`, `collapseSurface(id)`,
`expandSurface(id)`, `dockSurface(id)`, and `snapshot()` delegate to the
Surface Controller.

Events: `surface-manager-ready`, `surface-registered`, `surface-opened`,
`surface-closed`, `surface-focused`, `surface-updated`,
`surface-layout-changed`, `surface-window-command`, `surface-panel-command`,
and `surface-overlay-command`.

RMT: `xtend.rmt.component-contract.v1`, `xtend.surface.manager.v1`,
`xtend.surface.controller.v1`, `xtend.surface.overlay-stack-bridge.v1`,
`surface.visible.render`, `surface.user-blocking.open`,
`surface.user-blocking.close`, `surface.transition.layout`,
`surface.diagnostics.snapshot`.
