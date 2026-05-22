# xinput - XTend Component

> **See also:** [xform](./xform.md), [xstate](./xstate.md)

## Overview

`<x-input>` is a versatile input field with theming, state integration, and
full form support.

---

## Features

- Standard input with slot for label
- State integration through xstate
- Theming through CSS custom properties
- Form integration

---

## Usage

```html
<x-input value="Hello"></x-input>
```

---

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `value` | String | value of the input field |
| `type` | String | input type (text, number, etc.) |
| `placeholder` | String | placeholder text |

---

## Events

| Event | Description |
|-------|-------------|
| `input` | emitted while typing |
| `change` | emitted when the value changes |
| `input-changed` | current XTend contract for value changes, detail: `{ value }` |
| `validation-failed` | validation error, detail: `{ value }` |

---

## API

- **Set/read value:** `element.value = 'Text'`
- **State integration:** automatic through xstate
- **Validation:** `element.checkValidity()`, `element.reportValidity()`
- **Reset:** `element.reset()`

## State Contract from ER-WP-33

`<x-input>` writes its value to `xinput-value-<id>` and reacts to external
changes of that key. The validation region uses `role="alert"` and
`aria-live="assertive"`, so form errors become semantically visible and not
only color-coded.

## Form Controls UX from WP-E11-08

`<x-input>` exposes `xtendFormControlUxProfile` with
`xtend.component.form-control-ux-profile.v1`. The profile connects label, hint,
error, `input-changed`, `validation-failed`, `xinput-value-<id>`,
`ui.user-blocking.input`, Fabric lane `user-blocking`, and RMT shell authoring.

---

## Example: Dynamic JS

```js
const input = document.createElement('x-input');
input.value = 'Hello';
document.body.appendChild(input);
```

---

## Styling and Theming

```css
x-input {
  --input-border: 1px solid #ccc;
  --input-bg: #fff;
  --input-bg-dark: #0f0f12;
  --input-placeholder-color-dark: #b8c4d4;
}
```

`<x-input>` automatically uses `--xtend-surface` and `--xtend-text` from
`x-theme`. In `data-theme="dark"`, a dark background is set through
`--input-bg-dark`, `--xtend-control-bg-dark`, or the theme surface fallback so
text and search fields remain readable in the Docs App.

---

## Accessibility

- Label slot, ARIA, form integration

---

*Last updated: July 16, 2025*

## ECH-WP-08 Form Theme/A11y Hardening

`signatureDesign`: precise enterprise text field with calm surface, clear
status typography, and dense but readable form rhythm.

| Token | Purpose |
| --- | --- |
| `--xtend-form-text` | host text color |
| `--xtend-form-control-surface` | input surface |
| `--xtend-form-control-text` | input text |
| `--xtend-form-label-text` | label |
| `--xtend-form-helper-text` | helper/hint |
| `--xtend-form-error-text` | error text |
| `--xtend-form-error-surface` | error surface |
| `--xtend-form-error-border` | error edge and marker |
| `--xtend-form-focus-ring` | native focus outline |
| `--xtend-form-radius` | control and error radius |
| `--xtend-form-gap` | label, helper, and error spacing |
| `--xtend-form-font-family` | form typography |
| `--xtend-form-control-font-size` | control font |
| `--xtend-form-helper-font-size` | helper/error font |
| `--xtend-form-icon-color` | icon/affordance color for controls with icons |

Density profiles: `density="comfortable"`, `density="compact"`, and
`density="dense"`. Invalid/error state is not color-only: control edge, inner
ring, and error marker remain visible in dark/forced-colors modes.

```css
[data-xtend-form-theme="enterprise-foreign"] x-input {
  --xtend-form-control-surface: #fbf8f2;
  --xtend-form-control-text: #16231f;
  --xtend-form-label-text: #22312c;
  --xtend-form-helper-text: #596861;
  --xtend-form-error-text: #7d231c;
  --xtend-form-error-border: #a64036;
  --xtend-form-focus-ring: 3px solid #8f4f2a;
  --xtend-form-radius: 0.35rem;
}
```
