# SurfaceManager Overlay Bridge

`WP-SM-06` introduces `xtend.surface.overlay-stack-bridge.v1`. The bridge makes `x-modal`, `x-dialog` and `x-drawer` optionally compatible with the `x-surface-manager` surface stack.

## What Changes

`x-surface-manager` now also registers these elements in the `overlays` slot:

- `x-modal` as surface type `modal`
- `x-dialog` as surface type `dialog`
- `x-drawer` as surface type `drawer`

Existing overlay APIs remain available. A modal can still be controlled through `open()` and `close()`, and a drawer through `openDrawer()` and `closeDrawer()`. The legacy events `modal-opened`, `dialog-opened` and `drawer-opened` remain visible.

## Command Bridge

Overlays can use a `surface-overlay-command` event inside the manager:

```js
manager.dispatchEvent(new CustomEvent('surface-overlay-command', {
  bubbles: true,
  composed: true,
  detail: {
    surfaceId: 'settings.dialog',
    command: 'open'
  }
}));
```

Supported commands are the existing surface operations such as `open`, `close`, `focus` and `update`. The manager uses the same controller stack as windows and side panels.

## Stack Behavior

The bridge mirrors the surface snapshot into overlay CSS custom properties:

- `--surface-overlay-z`
- `--surface-overlay-backdrop-z`

Outside a SurfaceManager, `x-modal`, `x-dialog` and `x-drawer` keep their previous default z-indices.

## RMT and Lifecycle

At this stage, RMT remains on `xtend.component`. The bridge internally creates `xtend.surface.record.v1`, but it does not yet activate a native `xtend.surface` domain.

The local gate:

```bash
node scripts/run_xtend_tests.js surface-overlay-bridge --json
```

## Boundary

`WP-SM-06` prepares stack compatibility. Browser, a11y, performance and visual smokes follow in `WP-SM-07`; the native RMT `surfaces` domain follows later in `WP-SM-08`.
