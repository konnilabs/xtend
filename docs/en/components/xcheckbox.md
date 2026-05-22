# xcheckbox - XTend Component

> **See also:** [xform](./xform.md), [xinput](./xinput.md), [xstate](./xstate.md)

## Overview

`<x-checkbox>` is the TypeScript-first binary control from `WP-E10-09`. It is
form-associated, supports `checked` and `indeterminate`, reports changes
through XTend events, and can be scheduled by RMT as a framework-agnostic UI
component.

## Usage

```html
<x-checkbox id="terms" name="terms" required checked>
  <span slot="label">Accept terms of service</span>
  <span slot="error">Consent is required.</span>
</x-checkbox>
```

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `name` | String | form name |
| `value` | String | form value when active, default `on` |
| `checked` | Boolean | current selected state |
| `indeterminate` | Boolean | visual mixed state |
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
| `checkbox-changed` | `{ checked, value, source: 'x-checkbox' }` |
| `checkbox-invalid` | `{ checked, value, message, source: 'x-checkbox' }` |

## API

- `element.checked`
- `element.value`
- `element.indeterminate`
- `element.toggle()`
- `element.checkValidity()`
- `element.reportValidity()`
- `element.validate()`
- `element.reset()`
- `element.focus()`

## State, RMT, and Fabric

`<x-checkbox>` writes to `xcheckbox-checked-<id>`. RMT sees the component
through `xtend.rmt.component-contract.v1` as a DOM descriptor, not as an XTend
kernel dependency. Fabric metadata binds events to the `user-blocking` lane and
keeps the boundary string `no-rmt-kernel-import-of-xtend-types` visible.

## A11y and Performance

The control mirrors `aria-checked`, `aria-describedby`, `required`, and
`disabled` to the native checkbox. The performance profile uses
`xtend.performance.component-profile.v1` with `budgetClass:
'interactive-small'`, `lane: 'user-blocking'`, and `hydrationPolicy:
'visible'`.

## Form Controls UX from WP-E11-08

`<x-checkbox>` exposes `xtendFormControlUxProfile` with
`xtend.component.form-control-ux-profile.v1`. The profile connects label, hint,
error, `checkbox-changed`, `checkbox-invalid`, `xcheckbox-checked-<id>`,
`ui.user-blocking.input`, Fabric lane `user-blocking`, and RMT shell authoring.

## ECH-WP-08 Form Theme/A11y Hardening

`signatureDesign`: tactile enterprise checkbox with native reliability,
separately themeable selection affordance, and status-stable helper/error
rhythm.

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
| `--xtend-form-radius` | native control/error radius |
| `--xtend-form-gap` | label/helper spacing |
| `--xtend-form-font-family` | form typography |
| `--xtend-form-control-font-size` | label font |
| `--xtend-form-helper-font-size` | helper/error font |
| `--xtend-form-icon-color` | checkbox accent |

Density profiles: `comfortable`, `compact`, `dense`. Invalid state is visible
through outline and error marker in addition to color.

```css
[data-xtend-form-theme="enterprise-foreign"] x-checkbox {
  --xtend-form-icon-color: #8f4f2a;
  --xtend-form-label-text: #22312c;
  --xtend-form-helper-text: #596861;
  --xtend-form-error-text: #7d231c;
  --xtend-form-error-border: #a64036;
  --xtend-form-focus-ring: 3px solid #8f4f2a;
}
```
