# xtextarea - XTend Component

> **See also:** [xform](./xform.md), [xinput](./xinput.md), [xselect](./xselect.md), [xstate](./xstate.md)

## Overview

`<x-textarea>` is the long-form input from `WP-E10-10`. The component wraps a
native `textarea`, is form-associated, writes its value to `xstate`, and brings
RMT, Fabric, a11y, and performance metadata.

## Usage

```html
<x-textarea id="notes" name="notes" maxlength="240" rows="5" required>
  <span slot="label">Notes</span>
  <span slot="hint">Keep the message concise.</span>
  <span slot="error">A note is required.</span>
</x-textarea>
```

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `name` | String | form name |
| `value` | String | current text value |
| `placeholder` | String | placeholder text |
| `required` | Boolean | activates native validation |
| `disabled` | Boolean | disables the control |
| `readonly` | Boolean | makes the control read-only |
| `maxlength` | Number | maximum character count |
| `minlength` | Number | minimum character count |
| `rows` | Number | visible rows |
| `label` | String | label without slot |

## Events

| Event | Detail |
|-------|--------|
| `textarea-changed` | `{ value, length, maxLength, source: 'x-textarea' }` |
| `textarea-invalid` | `{ value, message, source: 'x-textarea' }` |

## API

- `element.value`
- `element.maxLength`
- `element.checkValidity()`
- `element.reportValidity()`
- `element.validate()`
- `element.reset()`
- `element.focus()`

## State, RMT, and Fabric

`<x-textarea>` writes to `xtextarea-value-<id>` and accepts external value
updates through the same key. RMT metadata uses
`xtend.rmt.component-contract.v1`, `adapter: 'xtend.component'`, and
`kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'`. RMT can create the
control as a DOM descriptor and bind events such as `textarea-changed` to
scheduler commands.

## A11y and Performance

The control uses `role="textbox"` through the native textarea,
`aria-describedby`, a polite counter region with
`character-count-announcement`, and an assertive error region. The performance
profile is `xtend.performance.component-profile.v1` with
`budgetClass: 'interactive-medium'`, `lane: 'user-blocking'`, and
`hydrationPolicy: 'visible'`.

## Form Controls UX from WP-E11-08

`<x-textarea>` exposes `xtendFormControlUxProfile` with
`xtend.component.form-control-ux-profile.v1`. The profile connects label, hint,
error, `textarea-changed`, `textarea-invalid`, `xtextarea-value-<id>`,
`ui.user-blocking.input`, Fabric lane `user-blocking`, and RMT shell authoring.

## ECH-WP-08 Form Theme/A11y Hardening

`signatureDesign`: enterprise writing surface with calm surface quality, live
counter, and separately themeable helper/error roles.

| Token | Purpose |
| --- | --- |
| `--xtend-form-text` | host text color |
| `--xtend-form-control-surface` | textarea surface |
| `--xtend-form-control-text` | textarea text |
| `--xtend-form-label-text` | label |
| `--xtend-form-helper-text` | helper and counter |
| `--xtend-form-error-text` | error text |
| `--xtend-form-error-surface` | error surface |
| `--xtend-form-error-border` | error edge and marker |
| `--xtend-form-focus-ring` | focus outline |
| `--xtend-form-radius` | textarea/error radius |
| `--xtend-form-gap` | meta and error spacing |
| `--xtend-form-font-family` | form typography |
| `--xtend-form-control-font-size` | textarea font |
| `--xtend-form-helper-font-size` | helper/error font |
| `--xtend-form-icon-color` | status/affordance fallback |

Density profiles: `comfortable`, `compact`, `dense`. Invalid/error state uses
edge, ring, and marker instead of color only.

```css
[data-xtend-form-theme="enterprise-foreign"] x-textarea {
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
