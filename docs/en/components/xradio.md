# xradio - XTend Component

> **See also:** [xform](./xform.md), [xinput](./xinput.md), [xstate](./xstate.md)

## Overview

`<x-radio>` completes the TypeScript-first selection controls from
`WP-E10-09`. The component coordinates groups through `name`, supports keyboard
navigation, and provides RMT, Fabric, a11y, and performance metadata for
RMT-first apps.

## Usage

```html
<x-radio id="plan-starter" name="plan" value="starter">
  <span slot="label">Starter</span>
</x-radio>
<x-radio id="plan-pro" name="plan" value="pro" checked>
  <span slot="label">Pro</span>
</x-radio>
```

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `name` | String | group and form name |
| `value` | String | value of the radio control |
| `checked` | Boolean | current selected state |
| `required` | Boolean | activates validation |
| `disabled` | Boolean | disables the control |
| `label` | String | ARIA/text label without slot |

## Slots

| Slot | Purpose |
|------|---------|
| `label` | visible label |
| `hint` | additional helper text |
| `error` | validation error |

## Events

| Event | Detail |
|-------|--------|
| `radio-changed` | `{ checked, value, name, source: 'x-radio' }` |
| `radio-invalid` | `{ checked, value, name, message, source: 'x-radio' }` |

## API

- `element.checked`
- `element.value`
- `element.name`
- `element.check()`
- `element.checkValidity()`
- `element.reportValidity()`
- `element.validate()`
- `element.reset()`
- `element.focus()`

## State, RMT, and Fabric

`<x-radio>` writes individual state to `xradio-checked-<id>` and group value to
`xradio-value-<name>`. RMT metadata uses
`xtend.rmt.component-contract.v1`; RMT can template a radio group as a DOM
descriptor and schedule the UI through `xtend.component` without importing
XTend into the RMT kernel.

## A11y and Performance

The component uses `role="radio"`, `aria-checked`, `aria-describedby`, Space
activation, and arrow-key navigation within the group. The performance profile
is `xtend.performance.component-profile.v1` with
`budgetClass: 'interactive-small'`, `lane: 'user-blocking'`, and
`hydrationPolicy: 'visible'`.

## Form Controls UX from WP-E11-08

`<x-radio>` exposes `xtendFormControlUxProfile` with
`xtend.component.form-control-ux-profile.v1`. The profile connects label, hint,
error, `radio-changed`, `radio-invalid`, `xradio-value-<name>`,
`ui.user-blocking.input`, Fabric lane `user-blocking`, and RMT shell authoring.

## ECH-WP-08 Form Theme/A11y Hardening

`signatureDesign`: enterprise radio option with robust native focus handling,
group-safe validation, and separately themeable selection icon.

| Token | Purpose |
| --- | --- |
| `--xtend-form-text` | host text color |
| `--xtend-form-control-surface` | native control surface |
| `--xtend-form-control-text` | control text fallback |
| `--xtend-form-label-text` | label |
| `--xtend-form-helper-text` | helper |
| `--xtend-form-error-text` | error text |
| `--xtend-form-error-surface` | error surface |
| `--xtend-form-error-border` | error edge and marker |
| `--xtend-form-focus-ring` | focus outline |
| `--xtend-form-radius` | radio/error radius |
| `--xtend-form-gap` | label/helper spacing |
| `--xtend-form-font-family` | form typography |
| `--xtend-form-control-font-size` | label font |
| `--xtend-form-helper-font-size` | helper/error font |
| `--xtend-form-icon-color` | radio accent |

Density profiles: `comfortable`, `compact`, `dense`. Invalid state is not
color-only and is mirrored through `aria-invalid`.

```css
[data-xtend-form-theme="enterprise-foreign"] x-radio {
  --xtend-form-icon-color: #8f4f2a;
  --xtend-form-label-text: #22312c;
  --xtend-form-helper-text: #596861;
  --xtend-form-error-text: #7d231c;
  --xtend-form-error-border: #a64036;
  --xtend-form-focus-ring: 3px solid #8f4f2a;
}
```
