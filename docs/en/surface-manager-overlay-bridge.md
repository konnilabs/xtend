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

## Bridge Contract

The bridge exists because XTend already has mature overlay components while the Surface Stack still needs a shared view of active layers. `x-modal`, `x-dialog`, `x-drawer`, `x-popover`, `x-tooltip`, `x-toast`, `x-lightbox` and `x-menu` keep their own contracts. The bridge reads or creates surface records for those components so stack order, z-values and topmost behavior can be evaluated together. It does not replace the components and it does not turn a tooltip into a window.

The `xtend.surface.overlay-stack-bridge.v1` contract describes an adapter boundary. On one side are legacy and owned overlay components with existing events. On the other side is the Surface Manager with records, Stack Policy and snapshot data. The bridge translates between those sides without building a second registry. If an overlay is already registered, its record is synchronized. If a host provides a surface record for an overlay, the existing component is reused.

## Runtime Rules

`components/xsurfaceoverlay-bridge.js` may apply stack z-values and respond to `surface-overlay-command`, but it must not fully rerender a component. The focus path remains with the component and the Stack Policy. The bridge coordinates which surface is on top, which record is visible and which commands reach the existing overlay instance. Existing integrations keep working while new Surface features can still be evaluated centrally.

Short-lived overlays such as tooltip and toast need special care. They must not receive the same modality as dialog or modal. The bridge must distinguish informational, non-modal and blocking overlays. When an overlay closes, the record must disappear or become inactive without leaving orphaned stack entries. The local gate checks these cases as integration behavior.

## Release Notes

Changes are accepted when they make the translation clearer, more observable or more stable. Changes are blocked when they silently rename events, introduce a second overlay registry, use `innerHTML` as a renderer or create global helpers outside the XTend namespace. When in doubt, the existing component wins: the bridge must not break its lifecycle semantics just to make the Surface Stack look more complete.
