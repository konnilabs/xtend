# xcalendar - XTend Component

> **See also:** [xcards](./xcards.md), [xform](./xform.md), [xstate](./xstate.md)

## Overview

`<x-calendar>` is a modern, accessible calendar with form integration, state
management, and theming. It is suitable for date selection and appointment
management.

---

## Features

- Form-associated (HTML5 Form API)
- State integration through xstate
- Theming through CSS custom properties
- Responsive design

---

## Usage

```html
<x-calendar></x-calendar>
```

---

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `value` | String | selected date in ISO format |

---

## Events

| Event | Description |
|-------|-------------|
| `change` | emitted when a date is selected |
| `date-select` | current XTend contract for date selection, detail: `{ value, date }` |

---

## API

- **Set/read value:** `element.value = '2025-07-16'`
- **State integration:** automatic through xstate

## Component-Level Contract from ER-WP-33

`<x-calendar>` is form-associated, writes selection and view date to
`xcalendar-state-<id>`, and renders the month view as an ARIA grid. Day cells
use `role="gridcell"` and `aria-selected`; month navigation is exposed through
labeled buttons.

## Form Controls UX from WP-E11-08

`<x-calendar>` exposes `xtendFormControlUxProfile` with
`xtend.component.form-control-ux-profile.v1`. The profile connects date
selection, `date-select`, `xcalendar-state-<id>`, `ui.user-blocking.input`,
grid a11y, Fabric lane `user-blocking`, and RMT shell authoring.

---

## Example: Dynamic JS

```js
const cal = document.createElement('x-calendar');
cal.value = '2025-07-16';
document.body.appendChild(cal);
```

---

## Styling and Theming

```css
x-calendar {
  --border-color: #ccc;
  --background-color: #fff;
}
```

---

## Accessibility

- ARIA roles, keyboard navigation

---

*Last updated: July 16, 2025*
