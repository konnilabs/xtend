# xbutton - XTend Component

> **See also:** [xalert](./xalert.md), [xstate](./xstate.md), [xtheme](./xtheme.md)

## Overview

`<x-button>` is the interactive base button for XTend apps. The component
provides variants, sizes, loading state, decorative icons, focus-visible
styles, reduced-motion/forced-colors paths, and, since `WP-E12-06`, an explicit
performance and interaction budget.

## Features

- Variants: `primary`, `secondary`, `danger`
- Sizes: `small`, normal, `large`
- Loading state through `loading` and `aria-busy`
- Disabled/busy guards for click and keyboard activation
- Touch target token `--xtend-button-min-touch-target`
- State integration through `xbutton-state-<id>`
- Fabric-compatible events `button-interaction` and
  `button-performance-measured`
- Slot fallback remains intact so late content such as `x-icon` hydrates cleanly

## Usage

```html
<x-button variant="primary" size="large" icon="/icons/save.svg">Save</x-button>
<x-button loading aria-label="Saving">Please wait...</x-button>
<x-button aria-label="Switch theme"><x-icon name="sun" decorative></x-icon></x-button>
```

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `disabled` | Boolean | disables interaction and sets `aria-disabled` |
| `label` | String | fallback text when no slot content exists |
| `variant` | String | `primary`, `secondary`, `danger`, or custom class |
| `size` | String | `small`, normal, or `large` |
| `icon` | String | SVG string or icon URL |
| `loading` | Boolean | shows spinner, blocks interaction, and sets busy state |
| `aria-label` | String | accessible name for screen readers |
| `aria-busy` | Boolean | explicit busy state without requiring a loading spinner |

## Events

| Event | Description |
|-------|-------------|
| `click` | forwarded click from the internal button shell |
| `focus` / `blur` | forwarded focus events |
| `loading-start` | `loading` was activated |
| `loading-end` | `loading` was deactivated |
| `button-interaction` | Fabric-compatible interaction measurement for click/keyboard |
| `button-performance-measured` | performance measurement after hydration, update, or interaction |

## API

| Method | Purpose |
|--------|---------|
| `setLoading(loading, options?)` | toggles loading state programmatically |
| `getPerformanceBudget()` | returns the millisecond budgets of the performance profile |
| `getInteractionBudget()` | returns click, keyboard, busy, and touch-target budgets |
| `snapshotPerformance()` | returns the current `xtend.component.performance-snapshot.v1` snapshot |

## Performance Profile

`x-button` has the runtime profile `xtend.performance.component-profile.v1`:

- `budgetClass`: `interactive-small`
- `lane`: `user-blocking`
- `hydrationPolicy`: `visible`
- `criticalMeasurements`: `xtend.component.hydrate`, `xtend.component.render`,
  `xtend.component.update`, `xtend.event.handler`,
  `xtend.interaction.click`, `xtend.interaction.keyboard`
- `budgetsMs`: `hydrate`, `renderUpdate`, `eventAction`, `keyboardAction`,
  `busyToggle`, `stateSync`

Fabric, regression gates, and later RMT shells can therefore schedule the
button as a small user-blocking interaction.

## RMT and Fabric

The component declares `xtendRmtMetadata` with `adapter: 'xtend.component'`,
`templateMode: 'dom_descriptor'`, `eventBindingMode:
'dom-event-to-rmt-command'`, and the boundary
`no-rmt-kernel-import-of-xtend-types`. RMT can author and schedule the button
without importing XTend types into the kernel.

Fabric consumes:

- `button-interaction`
- `button-performance-measured`
- `snapshotPerformance()`
- State key `xbutton-state-<id>`

## Styling and Theming

```css
x-button {
  --primary-color: #007bff;
  --focus-color: #80bfff;
  --xtend-button-min-touch-target: 44px;
}
```

The button respects `prefers-reduced-motion` and `forced-colors`. In
forced-colors mode it uses system colors, visible focus, and a textual busy
signal.

## Accessibility

- native button in Shadow DOM with `role="button"`
- visible `:focus-visible` state
- `aria-disabled` and `aria-busy`
- decorative icons with empty `alt`
- minimum touch target through token
- keyboard activation through native button semantics plus measurement point
  for `Enter` and `Space`
