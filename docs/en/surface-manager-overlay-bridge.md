# SurfaceManager Overlay Bridge

Contract: `xtend.surface.overlay-stack-bridge.v1`

The SurfaceManager Overlay Bridge connects existing overlay components to the shared Surface Stack. It preserves legacy components and can expose them as Surface Records.

## Components

- `x-modal`
- `x-dialog`
- `x-drawer`
- `x-popover`
- `x-tooltip`
- `x-toast`
- `x-lightbox`
- `x-menu`

## Runtime

`components/xsurfaceoverlay-bridge.js` creates Surface Records for overlays, applies stack z-values and responds to `surface-overlay-command`.

The bridge is a Surface Stack adapter. It does not replace components, does not create a second registry and keeps existing lifecycle events.

## Gate

```bash
node scripts/run_xtend_tests.js surface-overlay-bridge --json
```

