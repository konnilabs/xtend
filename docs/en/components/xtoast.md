# xtoast - XTend Component

## Overview

`<x-toast>` is the compact feedback component for temporary notices. Toasts are
non-blocking, short-lived, and are preferably created through `window.XToast`
in XTend Core.

## Usage

```html
<x-toast type="success" duration="3000">Saved</x-toast>
```

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `type` | string | `info`, `success`, `warning`, `error` |
| `duration` | number | duration in milliseconds, `0` disables auto-close |

## Events

| Event | Description |
|-------|-------------|
| `toast-shown` | after the toast is inserted |
| `toast-dismissed` | after the toast is closed |

Events provide:

```js
{
  id: 'toast-abc123',
  message: 'Saved',
  type: 'success',
  duration: 3000,
  reason: 'timeout'
}
```

## Runtime Contract

- API-managed toasts are aggregated in `xstate.get('ui').toasts`
- the component itself exposes lifecycle through events
- the hidden global helper path lives in `api.js`, no longer in the component
- the API toast stack uses `#xtoast-container` as a viewport-safe surface with
  `width: min(24rem, calc(100vw - 2rem))`

## Layout

`window.XToast.show()` places API-managed toasts in a framework-owned stack.
This stack stays bottom-right in the viewport, uses safe-area spacing, and
stretches toasts within the available width instead of letting them overflow
past the right viewport edge.

Directly placed `<x-toast>` elements are container-friendly as well: the
component uses `max-width: 100%`, wraps long content, and reserves space for
the close button.

## Feedback Status UX from WP-E11-09

`<x-toast>` exposes `xtendFeedbackStatusUxProfile` with
`xtend.component.feedback-status-ux-profile.v1`. The profile describes
`x-toast` as a short-lived feedback shell with `toast-shown`,
`toast-dismissed`, `xtoast-state-<id>`, `a11y.announce`, Fabric lane `a11y`,
and RMT shell authoring.

Timeouts provide `reason: 'timeout'`; manual dismiss paths provide
`reason: 'button'` or `manual`. Event details include `source: 'x-toast'`,
`stateKey`, and `dismissed`, so status and diagnostics lanes can unambiguously
map toast lifecycles.

## Notes

- Toasts are semantically meant for short-lived, non-blocking notices.
- Use `x-alert` for messages that should remain visible longer or carry more
  important content.
- `window.XToast.show()` is the preferred entry point for API-managed toasts.
