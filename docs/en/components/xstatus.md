# xstatus - XTend Component

> **See also:** [xalert](./xalert.md), [xtoast](./xtoast.md), [xprogress](./xprogress.md), [xstate](./xstate.md)

## Overview

`<x-status>` is a Fabric- and RMT-capable status control from `WP-E10-10`. It
renders scheduler, validation, and system feedback as a live region and stays
small enough to be used in RMT shells as a feedback building block.

## Usage

```html
<x-status id="route-status" type="warning" state="validating" message="Validation is running" dismissible busy>
  <span slot="label">Scheduler status</span>
</x-status>
```

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `type` | String | `info`, `success`, `warning`, or `error` |
| `state` | String | domain status key |
| `message` | String | visible message |
| `dismissible` | Boolean | shows close action |
| `busy` | Boolean | sets `aria-busy` |
| `polite` | Boolean | forces polite live region |
| `label` | String | label without slot |

## Events

| Event | Detail |
|-------|--------|
| `status-changed` | `{ type, status, message, busy, source: 'x-status' }` |
| `status-dismissed` | `{ type, status, message, busy, source: 'x-status' }` |

## API

- `element.state`
- `element.setStatus(nextState)`
- `element.announce(message?)`
- `element.dismiss()`

## State, RMT, and Fabric

`<x-status>` writes to `xstatus-state-<id>`. RMT can schedule status updates to
`feedback.status.update` through `xtend.rmt.component-contract.v1` without
importing XTend internally. The kernel boundary remains
`no-rmt-kernel-import-of-xtend-types`; the UI component is the adapter outward.

## A11y and Performance

The control uses `role="status"` for polite messages and `role=alert` for
critical warning/error paths. `scheduler-feedback`, `status-update`, and
`validation-feedback` are documented as screen reader signals. The performance
profile is `xtend.performance.component-profile.v1` with
`budgetClass: 'feedback-small'`, `lane: 'feedback'`, and
`hydrationPolicy: 'visible'`.

## Feedback Status UX from WP-E11-09

`<x-status>` exposes `xtendFeedbackStatusUxProfile` with
`xtend.component.feedback-status-ux-profile.v1`. The profile connects
`status-changed`, `status-dismissed`, `xstatus-state-<id>`,
`feedback.status.update`, Fabric lane `feedback`, a11y lane `a11y`, and RMT
shell authoring.

The component is the shared inline status for forms, schedulers, route feedback,
and diagnostics. It avoids color-only communication, remains forced-colors
safe, and can be explicitly updated as a live region with `announce()`.
