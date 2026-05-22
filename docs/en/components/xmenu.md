# xmenu - XTend Component

> **See also:** [xlink](./xlink.md), [xrouter](./xrouter.md), [xheader](./xheader.md), [xfooter](./xfooter.md)

## Overview

`<x-menu>` is the enterprise navigation component for menubars, toolbars, and
app navigation. Since `WP-E12-07`, it has an explicit performance, RMT, Fabric,
and routing contract. RMT can declare menu entries as DOM descriptors; the
XTend host adapter handles hydration, keyboard navigation, active-state sync,
and XRouter compatibility.

## Features

- Slotted entries for `a`, `button`, `x-link`, and `[role="menuitem"]`
- ARIA roles with `role="menubar"` and `role="menuitem"`
- Keyboard navigation with arrow keys, `Home`, `End`, `Enter`, and `Space`
- Roving `tabindex` and `aria-current="page"` for active entries
- `x-link` and `x-router` compatibility through `x-navigate` and
  `router-navigate`
- `xtend.performance.component-profile.v1` with navigation and interaction
  budgets
- Fabric-compatible events for navigation, keyboard, and performance

## Usage

```html
<x-menu data-rmt-schedule="ui.user-blocking.navigation" data-xtend-lane="user-blocking">
  <a href="/overview">Overview</a>
  <x-link href="/settings">Settings</x-link>
  <button type="button">Action</button>
</x-menu>
```

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `menu-item-clicked` | `{ href, index, label, source, scheduleRef }` | emitted on click or keyboard activation of an entry |
| `menu-navigate` | `{ href, path, mode, scheduleRef }` | signals internal navigation to XRouter/RMT |
| `menu-keyboard-navigation` | `{ key, fromIndex, toIndex }` | measures roving-focus navigation |
| `menu-performance-measured` | `xtend.performance.measurement.v1` | Fabric/diagnostics measurement for hydration, slotchange, keyboard, and route activation |

## Runtime API

```js
const menu = document.querySelector('x-menu');

menu.getPerformanceBudget();
menu.getInteractionBudget();
menu.snapshotPerformance();
```

`snapshotPerformance()` returns `xtend.component.performance-snapshot.v1` with
counters, budgets, and the latest measurement points.

## Performance Contract

`x-menu` uses:

- Schema: `xtend.performance.component-profile.v1`
- `componentRef`: `x-menu`
- Profile: `interactive`, `routing`
- Budget Class: `navigation-small`
- Lane: `user-blocking`
- Hydration Policy: `visible`
- critical measurements:
  - `xtend.component.hydrate`
  - `xtend.component.render`
  - `xtend.component.slotchange`
  - `xtend.interaction.keyboard`
  - `xtend.route.navigate`
  - `xtend.state.sync`

The interaction budget includes `keyboardBudgetMs`, `routeActivationBudgetMs`,
`touchTargetMinPx: 44`, `rovingTabindexRequired`, `xLinkCompatible`, and
`xRouterCompatible`.

## RMT and Fabric

The RMT contract stays host-neutral:

- Adapter: `xtend.component`
- Template Mode: `dom_descriptor`
- Event Binding Mode: `dom-event-to-rmt-command`
- Schedule Refs: `component.visible.hydrate`, `ui.user-blocking.navigation`,
  `route.transition.navigate`, `diagnostics.snapshot`
- Boundary: `no-rmt-kernel-import-of-xtend-types`

Fabric can connect the component through `menu-performance-measured`,
`menu-keyboard-navigation`, `menu-navigate`, and `snapshotPerformance()`.

## State and Routing

- `xmenu-active` is the canonical `xstate` key for the active entry.
- `xmenu-state-<id>` contains the full local state including performance
  snapshot.
- Internal links write `router-navigate` and emit `x-navigate`, so XRouter can
  trigger hash and history mode.
- Active entries receive `aria-current="page"` and remain focusable in the
  roving tabindex.

## Styling and Theming

```css
x-menu {
  --xtend-menu-bg: rgba(40, 60, 120, 0.25);
  --xtend-menu-color: #fff;
  --xtend-menu-min-touch-target: 44px;
}
```

## Accessibility

- ARIA roles: `menubar` on the shell, `menuitem` on slotted items.
- Keyboard navigation: `ArrowRight`, `ArrowDown`, `ArrowLeft`, `ArrowUp`,
  `Home`, `End`, `Enter`, `Space`.
- Focus visible and forced colors are supported without relying on motion.
- `prefers-reduced-motion` disables non-essential transitions.

## Component-Level Contract from WP-E12-07

- `xtendComponentContract`, `xtendRmtMetadata`,
  `xtendComponentLifecycleTelemetry`, `xtendScaffoldA11yProfile`, and
  `xtendScaffoldPerformanceProfile` exist in the runtime.
- `menu-item-clicked`, `menu-navigate`, `menu-keyboard-navigation`, and
  `menu-performance-measured` form the public event surface.
- `snapshotPerformance()`, `getPerformanceBudget()`, and
  `getInteractionBudget()` make the component testable for Fabric, RMT
  adapters, and local gates.

---

*Last updated: May 7, 2026*

## ECH-WP-09 Token Table and Navigation States

`signatureDesign`: `x-menu` uses a calm enterprise menu bar with clearly
visible active route, non-color-only current indicator, and replaceable
typography. Active/current/selected, hover, focus, and disabled states must
remain visible in external themes.

| Token | Purpose |
| --- | --- |
| `--xtend-nav-surface` | menu surface |
| `--xtend-nav-text` | menu and item text |
| `--xtend-nav-border-color` | menu edge |
| `--xtend-nav-radius` | menu and item radius |
| `--xtend-nav-gap` | spacing between navigation entries |
| `--xtend-nav-font-family` | navigation typography |
| `--xtend-nav-font-size` | navigation text size |
| `--xtend-nav-active-surface` | active/current/selected surface |
| `--xtend-nav-active-text` | active/current/selected text |
| `--xtend-nav-current-indicator` | non-color-only route indicator |
| `--xtend-nav-hover-surface` | hover surface |
| `--xtend-nav-focus-ring` | keyboard focus |
| `--xtend-nav-disabled-opacity` | disabled dimming |

## ECH-WP-09 Keyboard Behavior

`ArrowRight`, `ArrowDown`, `ArrowLeft`, `ArrowUp`, `Home`, `End`, `Enter`, and
`Space` remain gateable. Disabled items are not activated and are skipped by
roving focus. Nested menus may display disclosure controls only with icon
controls such as `part="disclosure-icon control icon"` or authorized `x-icon`
elements, not with text glyphs.

## ECH-WP-09 External Theme

```css
[data-xtend-nav-theme="enterprise-foreign"] x-menu {
  --xtend-nav-surface: #f7f4ee;
  --xtend-nav-text: #19231f;
  --xtend-nav-border-color: rgba(25, 35, 31, 0.24);
  --xtend-nav-radius: 0.4rem;
  --xtend-nav-gap: 0.35rem;
  --xtend-nav-font-family: "Aptos", "Segoe UI", sans-serif;
  --xtend-nav-font-size: 0.96rem;
  --xtend-nav-active-surface: #173f35;
  --xtend-nav-active-text: #fffaf0;
  --xtend-nav-current-indicator: #b56b35;
  --xtend-nav-hover-surface: rgba(181, 107, 53, 0.14);
  --xtend-nav-focus-ring: 3px solid #b56b35;
  --xtend-nav-disabled-opacity: 0.44;
}
```
