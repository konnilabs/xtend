# xprogress - XTend Component

> **See also:** [xstatus](./xstatus.md), [xspinner](./xspinner.md), [xstate](./xstate.md)

## Overview

`<x-progress>` is the RMT-first progress control from `WP-E10-10`. It visualizes
determinate and indeterminate progress, reports progress events to
Fabric/telemetry, and can be used in shell-first RMT templates for hydration,
upload, route, or worker tasks.

## Usage

```html
<x-progress id="route-progress" value="64" max="100" status="Hydrating route" busy>
  <span slot="label">Route hydration</span>
</x-progress>
```

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `value` | Number | current value |
| `max` | Number | maximum value |
| `label` | String | label without slot |
| `status` | String | status message for screen readers and UI |
| `indeterminate` | Boolean | activates indeterminate progress |
| `busy` | Boolean | sets `aria-busy` |

## Events

| Event | Detail |
|-------|--------|
| `progress-changed` | `{ value, max, percent, source: 'x-progress' }` |
| `progress-complete` | `{ value, max, percent: 100, source: 'x-progress' }` |

## API

- `element.value`
- `element.max`
- `element.percent`
- `element.setProgress(value)`
- `element.complete()`
- `element.reset()`

## State, RMT, and Fabric

`<x-progress>` writes to `xprogress-value-<id>` and is prepared for
`feedback.progress.update`. RMT metadata uses
`xtend.rmt.component-contract.v1`, `adapter: 'xtend.component'`, and
`kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'`. RMT can therefore
treat progress as scheduled UI feedback while XTend renders the Web Component.

## A11y and Performance

The control uses `role="progressbar"`, `aria-valuenow`, `aria-valuemax`,
`aria-valuetext`, `aria-busy`, and a polite status region. The performance
profile is `xtend.performance.component-profile.v1` with
`budgetClass: 'feedback-small'`, `lane: 'background'`, and
`hydrationPolicy: 'visible'`.

## Feedback Status UX from WP-E11-09

`<x-progress>` exposes `xtendFeedbackStatusUxProfile` with
`xtend.component.feedback-status-ux-profile.v1`. The profile describes progress
as scheduled feedback with `progress-changed`, `progress-complete`,
`xprogress-value-<id>`, `feedback.progress.update`, Fabric lane `background`,
a11y lane `a11y`, and RMT shell authoring.

Determinate and indeterminate progress states must not be communicated only
through color or animation. `aria-valuetext`, the status region, and
reduced-motion rules therefore remain part of the public UX surface.
