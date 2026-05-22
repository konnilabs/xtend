# xtooltip - XTend Component

> **See also:** [xpopover](./xpopover.md), [xdrawer](./xdrawer.md), [xdialog](./xdialog.md), [xmodal](./xmodal.md)

## Overview

`<x-tooltip>` is the lightweight overlay help component from `WP-E10-11`. The
component connects to a target element through `aria-describedby`, opens on
hover or focus, and closes on blur, mouseleave, or `Escape`.

## Usage

```html
<button id="schedule-help">Inspect schedule</button>
<x-tooltip id="route-tooltip" for="schedule-help" placement="top" delay="20" label="Tooltip help">
  Explains the scheduled action.
</x-tooltip>
```

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `for` | String | ID of the anchor element |
| `placement` | String | `top`, `right`, `bottom`, or `left` |
| `open` | Boolean | opens the tooltip in controlled mode |
| `delay` | Number | opening delay in milliseconds |
| `label` | String | accessible name for the tooltip |

## Events

| Event | Detail |
|-------|--------|
| `tooltip-opened` | `{ id, open, source, placement }` |
| `tooltip-closed` | `{ id, open, source, placement }` |

## API

- `show()`
- `hide()`
- `toggle()`

## State, RMT, and Fabric

`<x-tooltip>` writes to `xtooltip-open-<id>`. The RMT contract is
`xtend.rmt.component-contract.v1` and uses the schedules
`component.visible.mount`, `component.idle.hydrate`, and
`overlay.tooltip.position`. The kernel boundary remains
`no-rmt-kernel-import-of-xtend-types`.

## A11y and Performance

The component uses `role="tooltip"`, sets `aria-describedby` on the anchor, and
documents `dismiss-on-escape` as a screen reader signal. The performance
profile is `xtend.performance.component-profile.v1` with
`budgetClass: 'overlay-small'`, `lane: 'visible'`, and `hydrationPolicy:
'idle'`.

## Overlay Interaction UX Profile

Since `WP-E11-11`, `<x-tooltip>` declares the runtime profile
`xtend.component.overlay-interaction-ux-profile.v1` through
`xtendOverlayInteractionUxProfile`.

| Field | Value |
|-------|-------|
| Family | `tooltip` |
| State Key | `xtooltip-open-<id>` |
| Schedule | `overlay.position.update` |
| Commands | `show`, `hide`, `toggle`, `snapshot` |

The profile intentionally keeps tooltip overlays non-modal: no focus trap, no
inert, no scroll lock. RMT can schedule positioning and dismissal while the
host continues to manage `aria-describedby`, hover/focus, and Escape.

## ECH-WP-06 Overlay Parity

`x-tooltip` exposes `surface`, `backdrop`, `close`, and `content` as overlay
parts, with `backdrop` and `close` intentionally acting as non-interactive
sentinels for theme/part parity. The tooltip remains non-modal and
information-oriented.

Surface, text, elevation, radius, typography, and z-index use
`--xtend-overlay-*`, `--tooltip-*`, or `--xtooltip-*` tokens. Focus trap, inert,
and scroll lock do not apply to tooltips.
