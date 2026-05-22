# xalert - XTend Component

## Overview

`<x-alert>` is the prominent feedback component for longer-lived notices,
warnings, and errors. Unlike toasts, an alert can be blocking or explicitly
closable.

## Usage

```html
<x-alert type="error" closable overlay aria-label="Error notice">
  An error occurred
</x-alert>
```

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `type` | string | `info`, `success`, `warning`, `error` |
| `closable` | boolean | shows a close button |
| `duration` | number | optional auto-close duration |
| `overlay` | boolean | shows the alert as a centered overlay |
| `aria-label` | string | screen reader label |

## Events

| Event | Description |
|-------|-------------|
| `alert-shown` | after the alert is shown |
| `alert-dismissed` | after the alert is closed |

## State Contract

The instance mirrors its state compatibly into `xstate`:

- `xtend.component.x-alert.<id>`
- `xalert-state-<id>`

The event detail includes:

```js
{
  id: 'alert-abc123',
  type: 'error',
  closable: true,
  overlay: true,
  dismissed: false,
  reason: 'connected'
}
```

## Runtime Contract

- API-managed alerts are aggregated in `xstate.get('ui').alerts`.
- The instance itself exposes its lifecycle through `alert-shown` and
  `alert-dismissed`.
- API and component no longer maintain separate close paths.

## Feedback Status UX from WP-E11-09

`<x-alert>` exposes `xtendFeedbackStatusUxProfile` with
`xtend.component.feedback-status-ux-profile.v1`. The profile describes
`x-alert` as a longer-lived feedback shell with `alert-shown`,
`alert-dismissed`, `xalert-state-<id>`, `a11y.announce`, Fabric lane `a11y`,
and RMT shell authoring.

Errors and warnings use assertive live regions; neutral and success notices
remain polite. Event details include `source: 'x-alert'` and `stateKey`, so
form, router, or RMT adapters can schedule and diagnose alerts consistently.

## Contrast Colors

`<x-alert>` uses solid contrast colors without gradients. The variants `info`,
`success`, `warning`, and `error` each set dedicated tokens for background,
text, border, and accent so alerts remain readable in light and dark mode while
preserving their signal value.

The most important theme tokens are:

- `--xtend-alert-info-bg`, `--xtend-alert-info-fg`, `--xtend-alert-info-border`, `--xtend-alert-info-accent`
- `--xtend-alert-success-bg`, `--xtend-alert-success-fg`, `--xtend-alert-success-border`, `--xtend-alert-success-accent`
- `--xtend-alert-warning-bg`, `--xtend-alert-warning-fg`, `--xtend-alert-warning-border`, `--xtend-alert-warning-accent`
- `--xtend-alert-error-bg`, `--xtend-alert-error-fg`, `--xtend-alert-error-border`, `--xtend-alert-error-accent`

For dark mode, the same tokens can be overridden with the `-dark` suffix, for
example `--xtend-alert-error-bg-dark`.

## Notes

- Alerts are intended for more important, longer-lived, or blocking feedback.
- `window.XAlert.show()` is the preferred entry point for API-managed alerts.
- For short, non-blocking notices, `x-toast` is the better component.
