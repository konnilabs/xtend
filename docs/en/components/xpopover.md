# xpopover - XTend Component

> **See also:** [xtooltip](./xtooltip.md), [xdrawer](./xdrawer.md), [xdialog](./xdialog.md), [xmodal](./xmodal.md)

## Overview

`<x-popover>` is an interactive anchored overlay from `WP-E10-11`. It is useful
for filters, menus, toolbars, and contextual actions, can operate modally, and
remains describable as a Custom Element through RMT.

## Usage

```html
<x-popover id="filters" placement="bottom" modal label="Filter options">
  <button slot="trigger" type="button">Open filters</button>
  <p>Filter content can be mounted by RMT.</p>
  <button slot="actions" type="button">Apply</button>
</x-popover>
```

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `open` | Boolean | opens the popover in controlled mode |
| `placement` | String | `top`, `right`, `bottom`, or `left` |
| `modal` | Boolean | activates focus trap and `aria-modal` |
| `anchor` | String | prepared anchor mapping for RMT authoring |
| `label` | String | accessible name for the dialog |

## Events

| Event | Detail |
|-------|--------|
| `popover-opened` | `{ id, open, source, placement, modal }` |
| `popover-closed` | `{ id, open, source, placement, modal }` |

## API

- `show()`
- `hide()`
- `toggle()`

## State, RMT, and Fabric

`<x-popover>` writes to `xpopover-open-<id>`. RMT uses
`xtend.rmt.component-contract.v1`, `dom_descriptor` templates, and can bind
events as `dom-event-to-rmt-command`. Interactive UIs use the `user-blocking`
lane; the kernel boundary remains `no-rmt-kernel-import-of-xtend-types`.

## A11y and Performance

The popover uses `role="dialog"`, `aria-expanded`, `aria-controls`, optional
`aria-modal`, and focus return. `Escape`, outside click, and `focus-return` are
required signals. The performance profile is
`xtend.performance.component-profile.v1` with `budgetClass: 'overlay-medium'`,
`lane: 'user-blocking'`, and `hydrationPolicy: 'visible'`.

## Overlay Interaction UX Profile

Since `WP-E11-11`, `<x-popover>` declares the runtime profile
`xtend.component.overlay-interaction-ux-profile.v1` through
`xtendOverlayInteractionUxProfile`.

| Field | Value |
|-------|-------|
| Family | `popover` |
| State Key | `xpopover-open-<id>` |
| Schedule | `overlay.position.update` |
| Commands | `show`, `hide`, `toggle`, `focus-trap`, `snapshot` |

The profile separates the lightweight anchor layer from optional modal
operation. Focus trap is activated only with `modal`; Escape closes the topmost
popover, and outside click remains documented as intentional dismissal
behavior.

## ECH-WP-06 Overlay Parity

`x-popover` exposes `surface`, `backdrop`, `close`, and `content` as shared
overlay parts. The backdrop is visible only with `modal`; the close button is
tokenized and can be adapted to corporate patterns through
`--popover-close-display` and `--xpopover-close-*`.

The default remains non-modal: no inert and no scroll lock. With `modal`, the
popover activates backdrop, focus trap, Escape, and focus return. Surface,
text, border, elevation, radius, backdrop, and z-index use
`--xtend-overlay-*`, `--popover-*`, or `--xpopover-*` tokens.
