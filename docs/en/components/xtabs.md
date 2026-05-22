# xtabs - XTend Component

> **See also:** [xsection](./xsection.md), [xstate](./xstate.md)

## Overview

`<x-tabs>` is a component for tab navigation and structured content. It
supports dynamic tabs, theming, and state integration.

---

## Features

- Dynamic tab navigation
- Slot for tab content
- State integration through xstate
- Theming through CSS custom properties

---

## Usage

```html
<x-tabs selected="0">
  <x-tab name="Tab 1">Content 1</x-tab>
  <x-tab name="Tab 2">Content 2</x-tab>
</x-tabs>
```

---

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| - | - | - |

---

## Events

| Event | Description |
|-------|-------------|
| `tab-selected` | tab change with `{ index }`, `bubbles: true`, `composed: true` |

---

## API

- **Insert tabs through slot**
- **State integration:** automatic through xstate

---

## Example: Dynamic JS

```js
const tabs = document.createElement('x-tabs');
tabs.innerHTML = '<div slot="tab" label="A">A</div>';
document.body.appendChild(tabs);
```

---

## Styling and Theming

```css
x-tabs {
  --tab-active-bg: #007bff;
}
```

---

## Accessibility

`x-tabs` renders a `role="tablist"` header, creates `role="tab"` for every
button, and connects buttons and panels through `aria-controls` and
`aria-labelledby`.

Keyboard navigation uses roving `tabindex`:

| Key | Behavior |
|-----|----------|
| `ArrowRight` | next tab |
| `ArrowLeft` | previous tab |
| `Home` | first tab |
| `End` | last tab |
| `Enter` / `Space` | activate focused tab |

Active panels carry `role="tabpanel"` and `aria-hidden="false"`; inactive
panels are removed from visible navigation with `hidden` and
`aria-hidden="true"`.

## Performance Profile from WP-E12-02

`x-tabs` has an explicit `xtendScaffoldPerformanceProfile` under
`xtend.performance.component-profile.v1`.

| Field | Value |
|-------|-------|
| Budget class | `critical` |
| Lane | `user-blocking` |
| Hydration policy | `visible` |
| Tab switch budget | `16 ms` |
| Keyboard budget | `16 ms` |
| Render update budget | `28 ms` |

RMT shells can schedule `x-tabs` through `ui.user-blocking.tabs`,
`route.transition.tab`, `component.visible.hydrate`, and `diagnostics.snapshot`.
The RMT kernel remains framework-agnostic; XTend-specific data lives in the
component adapter metadata profile.

The runtime provides `getPerformanceBudget()` and `snapshotPerformance()`.
`snapshotPerformance()` returns local measurement points for hydration, render,
tab switch, and keyboard interactions so Fabric or a later reporter can consume
the data.

## Component-Level Contract from ER-WP-33

- `selected` determines the active tab index.
- `text-color` synchronizes the text color in the tab header.
- `tab-selected` is emitted after a tab change with `{ index }`.
- `xtabs-selected` is the canonical `xstate` key for external tab changes.
- Keyboard navigation includes `ArrowRight`, `ArrowLeft`, `Home`, `End`,
  `Enter`, and `Space`.
- `data-rmt-schedule="ui.user-blocking.tabs"` and
  `data-xtend-lane="user-blocking"` form the fixture line for RMT/Fabric
  scheduling.
- `snapshotPerformance()` makes the WP-E12-02 runtime budget testable.
- Since `WP-E12-03`, browser smoke and theme matrix explicitly cover `x-tabs`
  keyboard, ARIA, and theme shell journeys.

---

*Last updated: May 7, 2026*

## ECH-WP-09 Token Table and Navigation States

`signatureDesign`: `x-tabs` creates an independent enterprise tab navigation
with visible selected rail, wrap-safe labels, and fully replaceable typography.
Active/current/selected, hover, focus, and disabled states are themeable through
shared navigation tokens.

| Token | Purpose |
| --- | --- |
| `--xtend-nav-surface` | tablist surface |
| `--xtend-nav-text` | tab text |
| `--xtend-nav-border-color` | tab and tablist edges |
| `--xtend-nav-radius` | tab radius |
| `--xtend-nav-gap` | spacing between tabs |
| `--xtend-nav-font-family` | tab typography |
| `--xtend-nav-font-size` | tab text size |
| `--xtend-nav-active-surface` | selected surface |
| `--xtend-nav-active-text` | selected text |
| `--xtend-nav-current-indicator` | non-color-only selected indicator |
| `--xtend-nav-hover-surface` | hover surface |
| `--xtend-nav-focus-ring` | keyboard focus |
| `--xtend-nav-disabled-opacity` | disabled dimming |

## ECH-WP-09 Keyboard Behavior

`ArrowRight`, `ArrowLeft`, `Home`, `End`, `Enter`, and `Space` remain the
binding keys. Disabled tabs are not focusable or activatable.
Active/current/selected is mirrored through `aria-selected="true"` on the tab
and `role="tabpanel"` on the panel; route tabs may additionally carry
`aria-current="page"` through host logic.

## ECH-WP-09 External Theme

```css
[data-xtend-nav-theme="enterprise-foreign"] x-tabs {
  --xtend-nav-surface: #f3f0e8;
  --xtend-nav-text: #202520;
  --xtend-nav-border-color: rgba(32, 37, 32, 0.24);
  --xtend-nav-radius: 0.35rem;
  --xtend-nav-gap: 0.4rem;
  --xtend-nav-font-family: "Aptos", "Segoe UI", sans-serif;
  --xtend-nav-font-size: 0.95rem;
  --xtend-nav-active-surface: #243c34;
  --xtend-nav-active-text: #fff9ed;
  --xtend-nav-current-indicator: #a65f2d;
  --xtend-nav-hover-surface: rgba(166, 95, 45, 0.14);
  --xtend-nav-focus-ring: 3px solid #a65f2d;
  --xtend-nav-disabled-opacity: 0.42;
}
```
