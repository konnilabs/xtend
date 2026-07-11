# x-toggle

`x-toggle` is a form-associated switch for binary settings. It combines a native checkbox inside shadow DOM with `ElementInternals`, a public `role="switch"`, and XTend's state, RMT, and Fabric contracts. The source of truth is `src/components/x-toggle/x-toggle.ts`; the build emits `components/xtoggle.js` and `components/xtoggle.d.ts`.

## What it solves

A switch must keep visual state, form value, keyboard behavior, and validation in sync. `x-toggle` mirrors its state through the `checked` property, the matching attribute, `aria-checked`, its form value, and the `toggle-changed` or `toggle-invalid` events. A host therefore never needs to inspect private shadow DOM.

The `I` and `O` marks in the track supplement the color change. Short custom marks can be supplied through `on-label` and `off-label`; the accessible name still comes from `label`, the `label` slot, or the default slot.

## When to use it

Use `x-toggle` for yes/no preferences that take effect immediately, such as notifications or automatic refresh. Use [x-checkbox](./xcheckbox.md) when users select several independent values. If a change only applies after a larger form is submitted, make it clear that the switch is editing a pending value.

`disabled` and `busy` guard interactions. For this control, `required` means that the checked state is required. Choose `comfortable`, `compact`, or `dense` density without silently reducing the 44-pixel interaction target described by the performance profile.

## Avoid when

Do not use `x-toggle` as an action button, a choice among more than two values, or a decorative status display. Do not query shadow DOM to read state or reposition the thumb. Properties, attributes, events, slots, parts, and custom properties are the supported integration surface.

## Load and register

The local loader resolves `x-toggle` through `components/manifest.json`. Set a custom manifest location with `data-manifest`.

```html
<script type="module"
  src="/xtend-loader.js"
  data-manifest="/components/manifest.json"></script>

<form id="preferences">
  <x-toggle
    id="notifications"
    name="notifications"
    value="enabled"
    required
    label="Notifications">
    <span slot="hint">Notifies you about new tasks.</span>
    <span slot="error">Enable notifications to continue.</span>
  </x-toggle>
</form>
```

In a dynamically loaded host, wait for `customElements.whenDefined('x-toggle')` before calling methods. The loader and manifest remain local; the component requires no CDN runtime.

## Examples

The change event carries the boolean state and form value. `reportValidity()` exposes the error region when a required switch remains off.

```js
await customElements.whenDefined('x-toggle');

const toggle = document.querySelector('#notifications');
toggle.addEventListener('toggle-changed', (event) => {
  console.log(event.detail.checked, event.detail.value);
});

document.querySelector('#preferences').addEventListener('submit', (event) => {
  if (!toggle.reportValidity()) event.preventDefault();
});
```

A host may set `toggle.checked = true` or call `toggle.toggle()`. The component then synchronizes the value with the form through `ElementInternals.setFormValue()`.

## API reference

Attributes:
- `name`
- `value`
- `checked`
- `disabled`
- `required`
- `label`
- `busy`
- `invalid`
- `density`

Events:
- `toggle-changed` with `{ checked, value, source: "x-toggle" }`
- `toggle-invalid` with `{ checked, value, message, source: "x-toggle" }`

Properties and methods:
- `checked: boolean`
- `value: string`
- `stateKey: string` (read-only)
- `checkValidity(): boolean`
- `reportValidity(): boolean`
- `validate(): boolean`
- `toggle(): void`
- `reset(): void`
- `focus(): void`

Slots:
- `default` and `label` for the accessible name
- `hint` for supporting guidance
- `error` for the validation message
- `on-label` and `off-label` for short visible state marks

CSS parts:
- `root`, `control`, `track`, `state`, `thumb`
- `label`, `helper`, `error`, `status`

Important CSS custom properties:
- `--xtend-toggle-width`, `--xtend-toggle-height`, `--xtend-toggle-thumb-size`
- `--xtend-toggle-track-off`, `--xtend-toggle-track-on`, `--xtend-toggle-track-border`
- `--xtend-toggle-thumb`, `--xtend-toggle-focus`, `--xtend-toggle-radius`
- `--xtend-form-label-text`, `--xtend-form-helper-text`, `--xtend-form-error-text`
- `--xtend-form-error-surface`, `--xtend-form-error-border`, `--xtend-form-disabled-opacity`

## Theme and accessibility

Tab moves focus to the native control; Space changes the state. `aria-checked`, `aria-required`, `aria-disabled`, `aria-busy`, `aria-invalid`, and `aria-describedby` are derived from public state. The error region uses `role="alert"` and `aria-live="assertive"`, while status changes use a polite live region.

With `prefers-reduced-motion: reduce`, state must remain clear without a thumb animation. Under `forced-colors: active`, focus and the on/off marks remain visible. Start theme changes with the documented tokens before addressing individual parts.

## Integration notes

- Component contract: `xtend.component.contract.v2`
- Form-control profile: `xtend.component.form-control-ux-profile.v1`
- RMT contract: `xtend.rmt.component-contract.v1`
- Performance profile: `xtend.performance.component-profile.v1`
- Schedules: `component.visible.mount`, `component.idle.hydrate`, `ui.user-blocking.input`, `a11y.announce`, `diagnostics.snapshot`

The component publishes `xtoggle-checked-<id>` and `xtoggle-state-<id>` through `xstate`. In an RMT surface, bind `toggle-changed` and `toggle-invalid` DOM events to declarative commands. Neither the component nor a wrapper should import the RMT kernel to do so.

## Troubleshooting

- If the element stays unstyled, verify the `"x-toggle": "./xtoggle.js"` entry in `components/manifest.json` and the loader's manifest path.
- If the form value is absent, check `name`, `value`, and whether the switch is actually `checked`. An unchecked switch contributes no value.
- If Space does nothing, inspect `disabled`, `busy`, and any outer handler that may stop the keyboard event before it reaches the control.
- If `toggle-invalid` fires for an optional field, remove `required` instead of hiding the error region with CSS.
- If the accessible name is missing, set `label` or provide text through the `label` or default slot.

## Next steps

- [Forms and validation](./xform.md)
- [Component development](../components.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)
