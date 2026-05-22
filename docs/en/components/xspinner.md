# xspinner - XTend Component

> **See also:** [xtoast](./xtoast.md), [xalert](./xalert.md)

## Overview

`<x-spinner>` is an animated, accessible loading indicator for asynchronous
processes, loading states, and feedback. It is flexible, themeable, and
supports multiple variants, overlay mode, state integration, and accessibility
integration.

---

## Features

- Animated loading indicator (circle, dots)
- Size, color, speed, and type through attributes
- Overlay mode (centered, translucent)
- Slot for custom content
- State integration through xstate
- Events for pause/resume
- Theming through CSS custom properties and XTheme
- Accessibility: ARIA, `aria-busy`, `aria-label`, `aria-valuetext`
- `prefers-reduced-motion` support

---

## Usage

```html
<x-spinner size="32" color="#C70039" speed="0.7s" type="dots"></x-spinner>
```

---

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `size` | String | spinner size, for example 32, 48, 64 |
| `color` | String | color as CSS color value, for example #007bff |
| `speed` | String | animation duration, for example 1s, 0.7s |
| `type` | String | `circle` (default), `dots` |
| `paused` | Boolean | pauses animation |
| `overlay` | Boolean | shows spinner as page overlay |
| `aria-label` | String | accessible text for screen readers |
| `aria-busy` | String | ARIA state (`true`/`false`) |
| `aria-valuetext` | String | progress text for screen readers |

---

## Events

| Event | Description |
|-------|-------------|
| `spinner-started` | emitted when inserted |
| `spinner-stopped` | emitted when removed |
| `paused` | animation was paused |
| `resumed` | animation was resumed |

---

## API

- **Set size:** `element.setAttribute('size', '48')`
- **Change type:** `element.setAttribute('type', 'dots')`
- **Pause/resume:** `element.setAttribute('paused', '')` /
  `element.removeAttribute('paused')`
- **Imperative pause/resume:** `element.pause()` / `element.resume()`
- **Snapshot:** `element.snapshot()`
- **Enable overlay:** `element.setAttribute('overlay', '')`
- **State integration:** `xstate.set('xspinner-paused-'+element.id, true)`

## Feedback Status UX from WP-E11-09

`<x-spinner>` exposes `xtendFeedbackStatusUxProfile` with
`xtend.component.feedback-status-ux-profile.v1`. The profile describes the
spinner as busy status with `spinner-started`, `spinner-stopped`, `paused`,
`resumed`, `xspinner-paused-<id>`, `component.visible.mount`, Fabric lane
`feedback`, a11y lane `a11y`, and RMT shell authoring.

The component reports pause/resume through events with `source: 'x-spinner'`
and `stateKey`. Animations are reduced-motion safe; busy state and
`aria-valuetext` remain available to screen readers even without visible
motion.

---

## Example: Dynamic JS

```js
const spinner = document.createElement('x-spinner');
spinner.setAttribute('size', '48');
spinner.setAttribute('type', 'dots');
document.body.appendChild(spinner);
```

---

## Styling and Theming

```css
x-spinner {
  --spinner-color: #007bff;
  --spinner-size: 40px;
}
```

---

## Accessibility

- ARIA role, `aria-busy`, `aria-label`, `aria-valuetext`
- respects `prefers-reduced-motion`

---

*Last updated: July 18, 2025*
