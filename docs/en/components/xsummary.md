# xsummary - XTend Component

## Overview

`<x-summary>` is an expandable disclosure component for compact detail areas.
It uses native `<details>`/`<summary>` semantics, mirrors its open state into
`xstate`, and works well for FAQ blocks, technical details, inline help, or
dashboard summaries.

## Usage

```html
<x-summary id="billing-details" type="info" open>
  <span slot="title">Billing details</span>
  <p>All invoice items are grouped by project and time period.</p>
</x-summary>
```

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `open` | boolean | opens the detail area |
| `type` | string | visual variant: `info`, `success`, `warning`, `danger` |

## Slots

| Slot | Description |
|------|-------------|
| `title` | content of the clickable summary header |
| default | expandable content |

## Events

| Event | Description |
|-------|-------------|
| `open` | emitted when opening |
| `close` | emitted when closing |

The event detail contains:

```js
{
  open: true
}
```

## State Contract

The instance uses a compatible `xstate` key:

```js
xsummary-open-<id>
```

If no `id` is set, the component creates a stable runtime ID for the current
instance. External state changes on the key can open or close the component.

Synchronization is reentrant-safe: attributes, native `<details>` state, and
`xstate` are reconciled through one central open-state routine. Unchanged values
are not published to `xstate` again, so external state updates do not trigger a
recursive `open()`/`close()` loop.

## A11y

- The native `<summary>` remains the primary keyboard and screen reader surface.
- `Enter` and `Space` toggle the state.
- `aria-expanded` is synchronized with the current open state.
- The summary header is focusable and has a visible focus state.

## Notes

- `x-summary` is an interactive display component and has been
  component-suite-gated since `ER-WP-33`.
- The Catalog Coverage Matrix now lists the component as `contract-gated`.
- Further contract hardening for performance, browser regression, and
  long-tail coverage follows in `ER-WP-35`; public types and event details have
  existed since `ER-WP-34`.

## Layout Display Media UX Profile

Starting with `WP-E11-12`, `x-summary` exposes the profile
`xtend.component.layout-display-media-ux-profile.v1`. The component remains a
disclosure display shell and uses the state key `xsummary-open-<id>`.

- Profile getter: `xtendLayoutDisplayMediaUxProfile`
- Schedule: `component.visible.mount`
- Events: `open`, `close`
- Snapshot: `snapshot()`
- CSS parts: `container`, `summary`, `content`
