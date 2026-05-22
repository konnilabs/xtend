# xselect - XTend Component

> **See also:** [xform](./xform.md), [xinput](./xinput.md), [xstate](./xstate.md)

## Overview

`<x-select>` is the TypeScript-first selection control from `WP-E10-09`. The
component wraps a native `select`, remains form-associated, writes its value to
`xstate`, and carries RMT, Fabric, a11y, and performance metadata without
embedding XTend in the RMT kernel.

## Usage

```html
<x-select id="plan-select" name="plan" value="pro" required>
  <span slot="label">Plan</span>
  <option value="starter">Starter</option>
  <option value="pro">Pro</option>
  <span slot="error">Please choose a plan.</span>
</x-select>
```

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `name` | String | form name |
| `value` | String | current value |
| `multiple` | Boolean | allows multiple selection |
| `required` | Boolean | activates native validation |
| `disabled` | Boolean | disables the control |
| `placeholder` | String | optional placeholder option |
| `label` | String | ARIA/text label without slot |

## Slots

| Slot | Purpose |
|------|---------|
| default | `option` elements for the native select |
| `label` | visible label |
| `hint` | additional helper text |
| `error` | validation error |

## Events

| Event | Detail |
|-------|--------|
| `select-changed` | `{ value, values, source: 'x-select' }` |
| `select-invalid` | `{ value, message, source: 'x-select' }` |

## API

- `element.value`
- `element.values`
- `element.checkValidity()`
- `element.reportValidity()`
- `element.validate()`
- `element.reset()`
- `element.focus()`

## State, RMT, and Fabric

`<x-select>` writes to `xselect-value-<id>` and reacts to external value
updates. RMT metadata uses `xtend.rmt.component-contract.v1`,
`adapter: 'xtend.component'`, and
`kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'`. Shell-first templates
can schedule the component as a DOM descriptor while XTend remains the UI
surface.

## A11y and Performance

The control uses `role="combobox"`, `aria-describedby`, visible label/hint/error
slots, and an assertive error region. The performance profile is
`xtend.performance.component-profile.v1` with
`budgetClass: 'interactive-medium'`, `lane: 'user-blocking'`, and
`hydrationPolicy: 'visible'`.

## Form Controls UX from WP-E11-08

`<x-select>` exposes `xtendFormControlUxProfile` with
`xtend.component.form-control-ux-profile.v1`. The profile connects label, hint,
error, `select-changed`, `select-invalid`, `xselect-value-<id>`,
`ui.user-blocking.input`, Fabric lane `user-blocking`, and RMT shell authoring.

## ECH-WP-08 Form Theme/A11y Hardening

`signatureDesign`: enterprise select with clear native affordance,
non-color-only validation, and density-safe label/helper rhythm.

| Token | Purpose |
| --- | --- |
| `--xtend-form-text` | host text color |
| `--xtend-form-control-surface` | select surface |
| `--xtend-form-control-text` | select text |
| `--xtend-form-label-text` | label |
| `--xtend-form-helper-text` | helper |
| `--xtend-form-error-text` | error text |
| `--xtend-form-error-surface` | error surface |
| `--xtend-form-error-border` | error edge and marker |
| `--xtend-form-focus-ring` | focus outline |
| `--xtend-form-radius` | select and error radius |
| `--xtend-form-gap` | vertical rhythm |
| `--xtend-form-font-family` | form typography |
| `--xtend-form-control-font-size` | select font |
| `--xtend-form-helper-font-size` | helper/error font |
| `--xtend-form-icon-color` | native select affordance |

Density profiles: `comfortable`, `compact`, `dense`. Invalid, `disabled`,
`required`, and `busy` are mirrored visually and through ARIA.

```css
[data-xtend-form-theme="enterprise-foreign"] x-select {
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
