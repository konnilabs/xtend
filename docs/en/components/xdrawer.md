# xdrawer - XTend Component

> **See also:** [xpopover](./xpopover.md), [xtooltip](./xtooltip.md), [xrouter](./xrouter.md), [xlink](./xlink.md)

## Overview

`<x-drawer>` is the shell and navigation component from `WP-E10-11`. It
provides side panels and navigation drawers for RMT-first apps, supports focus
trap, Escape close, outside click, and optional route-aware behavior.

## Usage

```html
<x-drawer id="app-nav" placement="left" modal label="App navigation" route-aware>
  <button slot="trigger" type="button">Open navigation</button>
  <strong slot="header">Navigation</strong>
  <a href="#/overview">Overview</a>
  <small slot="footer">Signed in</small>
</x-drawer>
```

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `open` | Boolean | opens the drawer in controlled mode |
| `placement` | String | `left`, `right`, or `bottom` |
| `modal` | Boolean | activates focus trap and `aria-modal` |
| `label` | String | accessible name for the drawer |
| `route-aware` | Boolean | closes after XRouter route changes and emits route signal |

## Events

| Event | Detail |
|-------|--------|
| `drawer-opened` | `{ id, open, source, placement, modal }` |
| `drawer-closed` | `{ id, open, source, placement, modal }` |
| `drawer-route-selected` | `{ id, routeRef, source: 'x-router' }` |

## API

- `openDrawer()`
- `closeDrawer()`
- `toggle()`

## Theme and Tokens

`<x-drawer>` synchronizes `data-theme` from `document.documentElement` and
automatically uses the global XTend tokens from `x-theme`. Without custom
drawer tokens, background, text, border, and overlay fall back to
`--xtend-surface`, `--xtend-text`, `--xtend-border-color`, and
`--xtend-overlay-bg`. Navigation drawers therefore remain readable in bright
mode and dark mode even when an app shell provides no custom drawer colors.

| Token | Purpose |
|-------|---------|
| `--drawer-bg` / `--drawer-bg-dark` | surface background |
| `--drawer-color` / `--drawer-color-dark` | text color |
| `--drawer-border` / `--drawer-border-dark` | borders and separators |
| `--drawer-overlay-bg` / `--drawer-overlay-bg-dark` | backdrop color |
| `--drawer-focus` | focus ring |
| `--drawer-close-size` | size of the close icon button |
| `--drawer-close-border` / `--drawer-close-color` | border and icon color of the close button |
| `--drawer-close-hover-bg` / `--drawer-close-hover-bg-dark` | hover surface of the close button |

## State, RMT, and Fabric

`<x-drawer>` writes to `xdrawer-open-<id>`. The RMT contract is
`xtend.rmt.component-contract.v1` and uses `component.lazy.hydrate`,
`route.visible.render`, and `overlay.drawer.transition`. The kernel boundary
remains `no-rmt-kernel-import-of-xtend-types`.

## A11y and Performance

The component uses `role="dialog"`, `aria-modal`, `aria-hidden`,
`aria-expanded`, `inert`, focus trap, and focus return. On close, focus is
returned to the trigger or last active element before the drawer surface is
hidden from assistive technology. The screen reader signal
`route-change-announcement` is intended for app-shell navigation. The
performance profile is `xtend.performance.component-profile.v1` with
`budgetClass: 'overlay-large'`, `lane: 'visible'`, and
`hydrationPolicy: 'lazy'`.

## Overlay Interaction UX Profile

Since `WP-E11-11`, `<x-drawer>` declares the runtime profile
`xtend.component.overlay-interaction-ux-profile.v1` through
`xtendOverlayInteractionUxProfile`.

| Field | Value |
|-------|-------|
| Family | `drawer` |
| State Key | `xdrawer-open-<id>` |
| Schedule | `overlay.stack.open` |
| Commands | `open`, `close`, `toggle`, `focus-trap`, `apply-inert`, `lock-scroll`, `snapshot` |

The profile describes drawers as route-aware overlays: modal behavior is
optional, focus trap is active only in modal operation, Escape closes the
topmost overlay, and XRouter route changes may close the drawer in a controlled
way.

## ECH-WP-06 Overlay Parity

`x-drawer` uses the shared overlay part aliases `surface`, `backdrop`, `close`,
and `content`. `overlay` remains as a legacy alias for `backdrop`. Host themes
can control surface, text, border, elevation, backdrop, z-index, and focus ring
through `--xtend-overlay-*` or compatible `--drawer-*` tokens.

Modality is optional: `modal` activates focus trap, background inert, and
scroll lock; non-modal drawers remain controllable for app-shell navigation.
