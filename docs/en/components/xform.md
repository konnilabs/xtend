# xform - XTend Component

> **See also:** [xinput](./xinput.md), [xselect](./xselect.md), [xcheckbox](./xcheckbox.md), [xradio](./xradio.md), [xtextarea](./xtextarea.md), [xcalendar](./xcalendar.md), [xstate](./xstate.md)

## Overview

`<x-form>` is a flexible form component that wraps arbitrary content and
supports state integration and theming.

---

## Features

- Flexible layout for forms
- Slot for arbitrary content
- State integration through xstate
- Aggregation of `x-input`, `x-slider`, `x-calendar`, `x-select`,
  `x-checkbox`, `x-radio`, and `x-textarea`
- Theming through CSS custom properties

---

## Usage

```html
<x-form>
  <input type="text" />
  <x-button>Submit</x-button>
</x-form>
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
| `submit` | emitted on submit |
| `invalid` | emitted when child validation fails |
| `reset` | emitted after form reset |

---

## API

- **Submit form by JS:** `element.submit()`
- **Read form data:** `element.getFormData()`
- **State integration:** automatic through xstate

## State and Validation Contract from ER-WP-33

`<x-form>` collects values from `x-input`, `x-slider`, `x-calendar`,
`x-select`, `x-checkbox`, `x-radio`, `x-textarea`, and `x-writer`, mirrors them
to `xform-data-<id>`, and updates that key on `input-changed`,
`select-changed`, `checkbox-changed`, `radio-changed`, `textarea-changed`,
`date-select`, and `writer:change`. Checkboxes provide boolean values; radio
groups provide the value of the active control. The Shadow DOM contains
`role="form"`, a `role="status"` region for submit/reset feedback, and a
`role="alert"` region for validation errors.

## Form Controls UX from WP-E11-08

`<x-form>` exposes `xtendFormControlUxProfile` with
`xtend.component.form-control-ux-profile.v1`. The profile describes the form
host, `submit`, `invalid`, `reset`, `xform-data-<id>`, validation aggregation,
Fabric lane `user-blocking`, and RMT shell authoring.

---

## Example: Dynamic JS

```js
const form = document.createElement('x-form');
form.innerHTML = '<input type="text" />';
document.body.appendChild(form);
```

---

## Styling and Theming

```css
x-form {
  --form-gap: 2em;
  --form-border: 2px solid #007bff;
}
```

---

## Accessibility

- Semantic HTML, ARIA

---

*Last updated: July 16, 2025*

## ECH-WP-08 Form Theme/A11y Hardening

`signatureDesign`: enterprise form host with polished surface composition,
aggregated status regions, and density-safe rhythm for nested controls.

| Token | Purpose |
| --- | --- |
| `--xtend-form-text` | form text color |
| `--xtend-form-surface` | form surface |
| `--xtend-form-control-surface` | child control surface |
| `--xtend-form-control-text` | child control text |
| `--xtend-form-label-text` | label cascade |
| `--xtend-form-helper-text` | helper cascade |
| `--xtend-form-error-text` | error cascade |
| `--xtend-form-error-surface` | error cascade surface |
| `--xtend-form-error-border` | form and error edge |
| `--xtend-form-focus-ring` | focus cascade |
| `--xtend-form-radius` | form and control radius |
| `--xtend-form-gap` | form and control spacing |
| `--xtend-form-font-family` | form typography |
| `--xtend-form-control-font-size` | control font |
| `--xtend-form-helper-font-size` | helper/error font for child controls |
| `--xtend-form-icon-color` | child-control icon accent |

Density profiles: `comfortable`, `compact`, `dense`. `busy`, `disabled`, and
invalid state are mirrored on the form host as surface state and through ARIA.

```css
[data-xtend-form-theme="enterprise-foreign"] x-form {
  --xtend-form-surface: #fffaf2;
  --xtend-form-control-surface: #fbf8f2;
  --xtend-form-text: #16231f;
  --xtend-form-label-text: #22312c;
  --xtend-form-helper-text: #596861;
  --xtend-form-error-text: #7d231c;
  --xtend-form-error-border: #a64036;
  --xtend-form-focus-ring: 3px solid #8f4f2a;
  --xtend-form-radius: 0.45rem;
  --xtend-form-gap: 0.8rem;
}
```
