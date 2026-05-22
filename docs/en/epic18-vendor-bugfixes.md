# Epic 18 Vendor Bugfixes

This page documents the component fixes that were brought back from the Media Manager vendor version into XTend main. It is intentionally not a product guide for a specific app, but a bugfix and compatibility reference for XTend components.

## Components

| Component | Behavior |
|-----------|----------|
| `x-tooltip` | Uses a viewport-fixed overlay layer, writes position values through `--xtooltip-left` and `--xtooltip-top`, and remains within the visible area after scroll or container shifts. |
| `x-player` | Registers custom events only once, stays bounded inside surface containers and uses canonical `xplayer-*` events for play, pause, fullscreen, PIP, captions and mute. |
| `x-surface-window` | Keeps long titles, scrollbars and resize limits stable without redrawing the SurfaceManager registry. |
| `x-side-panel` | Keeps placement and icon controls stable and compatible with the SurfaceManager layout gates. |
| `x-surface-manager-controller` | Provides generic surface types for window, side panel, modal, dialog, drawer, popover and tooltip. |

## Gates

The local bugfix gate remains:

```bash
node scripts/run_xtend_tests.js components surface-controller surface-manager-browser overlay-interaction-ux layout-display-media-ux epic18-vendor-bugfix-smokes browser references --json
```

The browser-close smoke is located at
`tests/browser/fixtures/epic18-vendor-bugfix-smoke.html`; the contract gate is in
`tests/components/epic18_vendor_bugfix_smoke_suite.js`.

## Handoff

The fixes are platform behavior. They must not remain in XTend as Media Manager-specific paths. New apps should use the generic component, surface, event and RMT app-platform contracts.
