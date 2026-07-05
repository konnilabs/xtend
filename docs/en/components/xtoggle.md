# x-toggle - XTend component

`x-toggle` is a TypeScript-first form control for binary settings. The source of truth is `src/components/x-toggle/x-toggle.ts`; `tsc` builds `components/xtoggle.js` and `components/xtoggle.d.ts`, and `components/manifest.json` registers `"x-toggle": "./xtoggle.js"`.

## Loading and Registration

```html
<script type="module" src="/xtend-loader.js"></script>
<x-toggle name="notifications" value="enabled" checked label="Notifications"></x-toggle>
```

The switch uses a native checkbox inside Shadow DOM, `static formAssociated = true`, ElementInternals/FormData, and `role="switch"`. The runtime mirrors state with `aria-checked`. `on-label` and `off-label` are visible state symbols only; the default uses `I` for on and `O` for off. The accessible name comes from `label`, the `label` slot, or the default slot.

## API

Attributes: `name`, `value`, `checked`, `disabled`, `required`, `label`, `busy`, `invalid`, `density`.

Slots: `default`, `label`, `hint`, `error`, `on-label`, `off-label`.

Default state symbols: `I` in the checked state, `O` in the unchecked state. Longer visible text can be provided through `on-label` and `off-label`, but it should not replace the accessible name.

Events:

- `toggle-changed` with `{ checked, value, source: "x-toggle" }`
- `toggle-invalid` with `{ checked, value, message, source: "x-toggle" }`

Properties and methods: `checked`, `value`, `stateKey`, `toggle()`, `reset()`, `validate()`, `checkValidity()`, `reportValidity()`, `focus()`.

## Accessibility and Forms

`x-toggle` supports click, touch, and Space activation. `disabled` and `busy` guard interaction. `required` maps unchecked state to native validity, `invalid`, `aria-invalid`, and an assertive error slot.

Important ARIA markers: `role="switch"`, `aria-checked`, `aria-invalid`, `aria-required`, `aria-disabled`, `aria-busy`, `aria-describedby`.

## XState, RMT, and Fabric

The component publishes `xtoggle-checked-<id>` and `xtoggle-state-<id>` through `xstate`. The RMT profile uses `xtend.rmt.component-contract.v1`, shell authoring, DOM-event-to-RMT-command binding, and the `no-rmt-kernel-import-of-xtend-types` boundary.

The form-control profile is `xtend.component.form-control-ux-profile.v1`. The performance profile is `xtend.performance.component-profile.v1`, budget class `interactive-small`, lane `user-blocking`, plus A11y and Diagnostics lanes. `signatureDesign` follows the classic switch pattern from Apple Human Interface Guidelines Toggles.

## Theme, Density, and ECH-WP-08

Density-Profile: `comfortable`, `compact`, `dense`.

Invalid and busy states are not color-only: the error slot uses an inline-start marker, validation adds a ring around the track, and `busy` shows a reduced-motion-aware status indicator.

Token table:

| Token | Purpose |
| --- | --- |
| `--xtend-form-text` | Text color |
| `--xtend-form-control-surface` | Track off surface |
| `--xtend-form-control-text` | Status/icon contrast |
| `--xtend-form-label-text` | Label |
| `--xtend-form-helper-text` | Hint |
| `--xtend-form-error-text` | Error text |
| `--xtend-form-error-surface` | Error surface |
| `--xtend-form-error-border` | Error border |
| `--xtend-form-focus-ring` | Focus |
| `--xtend-form-radius` | Track radius |
| `--xtend-form-gap` | Spacing |
| `--xtend-form-font-family` | Font |
| `--xtend-form-control-font-size` | Control font size |
| `--xtend-form-helper-font-size` | Helper text |
| `--xtend-form-icon-color` | Status/icon color |

Example:

```html
<x-toggle name="alerts" value="enabled" required label="Alerts" density="comfortable">
  <span slot="hint">Sends updates immediately.</span>
  <span slot="error">Enable alerts to continue.</span>
</x-toggle>
```
