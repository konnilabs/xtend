# x-textarea

x-textarea is a public XTend component reference for third-party developers who need to embed the component without private project context.

## What it solves

x-textarea is a form-oriented component. Treat validation events, form-associated state and disabled or required attributes as part of the public integration surface. The component is loaded from `components/xtextarea.js`, declared through `components/manifest.json` and typed through `components/xtextarea.d.ts`. That makes the article a practical contract: a host can see which attributes are safe, which events can be listened to, which methods are callable and which CSS hooks are intended for customization.

Use this page when you are integrating XTend into a product shell, a micro frontend, a CMS-rendered page or an RMT-authored surface. It focuses on the public surface instead of internal implementation details, so it is suitable for teams that only consume the package.

## When to use it

Use `x-textarea` when you need the behavior described by its `form, stateful` profile and want a local Web Component that follows XTend theming, accessibility and scheduling conventions. It is especially useful when the host must stay framework-neutral, keep component code local and avoid CDN dependencies.

Third-party teams should prefer the documented attributes, slots, events and methods before wrapping the component. Wrappers are fine for product conventions, but the wrapper should pass through the public API instead of reaching into the shadow DOM.

## Avoid when

Avoid `x-textarea` when you need behavior that is not represented by the documented API, or when your host cannot load `xtend-loader.js` and `components/manifest.json`. Do not depend on private class names, generated internal nodes or unlisted state keys. If you need a design variant, use tokens, CSS parts or slots before forking the runtime file.

## Load and register

Load the XTend loader once per page. The loader reads the local manifest and resolves `x-textarea` to `./xtextarea.js`. Keep the manifest URL same-origin unless your security policy explicitly allows another source.

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<x-textarea id="demo-xtextarea"
  name="demo"
  value="demo"
  placeholder="demo"
  line-numbering="false"
  required>
  <span slot="label">Demo label</span>
  <span slot="hint">Helpful context</span>
  <span slot="error">Validation message</span>
</x-textarea>
```

## Examples

The integration example shows the host-side pattern: query the element, listen to the first public event when one exists and call a public method only after the element has been upgraded. This keeps hydration and RMT materialization predictable.

```js
const component = document.querySelector('x-textarea');
component.addEventListener('textarea-changed', (event) => {
  console.log('textarea-changed', event.detail);
});
if ('checkValidity' in component) {
  component.checkValidity();
}
```

For production screens, keep IDs stable when state keys or diagnostics include `<id>`. Stable IDs make event logs, RMT schedules and browser tests easier to compare across deployments.

Editor surfaces can set `line-numbering="true"`. `x-textarea` then renders a Monaco-style line-number gutter inside its shadow DOM; `line-numbering="false"` or a missing attribute disables it. This is especially useful for RMT playgrounds and diagnostics panels because compiler errors can be read against the source lines.

Prompt-style surfaces can set `submit-on-enter`. In that mode Enter emits `textarea-submit` and asks the nearest form to submit when the event is not canceled. Shift+Enter keeps the native textarea newline behavior.

## API reference

Attributes:
- `name`
- `value`
- `placeholder`
- `required`
- `disabled`
- `readonly`
- `maxlength`
- `minlength`
- `rows`
- `label`
- `busy`
- `invalid`
- `density`
- `fill`
- `submit-on-enter`
- `syntax-highlight`
- `highlight`
- `line-numbering`
- `lang`
- `language`

Events:
- `textarea-changed`
- `textarea-invalid`
- `textarea-submit`
- `xtend-command`

Methods:
- `checkValidity()`
- `reportValidity()`
- `validate()`
- `reset()`
- `focus()`
- `snapshot()`

Slots:
- `label`
- `hint`
- `error`

CSS parts:
- `label`
- `editor`
- `highlight`
- `syntax`
- `highlight-code`
- `syntax-code`
- `line-numbers`
- `line-number`
- `control`
- `helper`
- `status`
- `error`

CSS custom properties:
- `--xtend-form-control-min-height`
- `--xtend-form-text`
- `--text-color`
- `--xtend-form-font-family`
- `--xtend-font-family-body`
- `--xtend-form-control-font-size`
- `--xtend-form-density-control-min-height`
- `--textarea-min-height`
- `--xtend-form-control-padding`
- `--xtend-form-density-padding`
- `--xtend-form-control-gap`
- `--xtend-form-gap`
- `--xtend-form-icon-color`
- `--xtend-form-control-text`
- `--xtend-textarea-code-font-family`
- `--x-code-font-family`
- `--xtend-textarea-line-number-width`
- `--xtend-textarea-line-number-gap`
- `--xtend-textarea-line-number-text`
- `--xtend-textarea-line-number-border`
- `--xtend-textarea-line-number-surface`

## Theme and accessibility

`signatureDesign` stays a multiline input with a clear label, hint and error hierarchy. Density-Profile: `comfortable`, `compact`, `dense`. Invalid: error states are mirrored through text, error surface, border, focus ring and ARIA.

Token table:
- `--xtend-form-text`
- `--xtend-form-control-surface`
- `--xtend-form-control-text`
- `--xtend-form-label-text`
- `--xtend-form-helper-text`
- `--xtend-form-error-text`
- `--xtend-form-error-surface`
- `--xtend-form-error-border`
- `--xtend-form-focus-ring`
- `--xtend-form-radius`
- `--xtend-form-gap`
- `--xtend-form-font-family`
- `--xtend-form-control-font-size`
- `--xtend-form-helper-font-size`
- `--xtend-form-icon-color`

## Integration notes

- UX profile: `xtend.component.form-control-ux-profile.v1`.
- State key: `xtextarea-value-<id>`.
- RMT contract: `xtend.rmt.component-contract.v1`.
- Performance profile: `xtend.performance.component-profile.v1`.
- RMT schedules: `component.visible.mount`, `component.idle.hydrate`, `ui.user-blocking.input`, `diagnostics.snapshot`.

RMT Hosts should treat the component as a Custom Element boundary: pass attributes as component props, bind DOM events to commands and keep scheduling metadata outside the component. Plain HTML hosts can use the same attributes and events without an RMT compiler.

Theming should flow through XTend design tokens first. CSS parts are intended for targeted skinning of exposed controls, while CSS custom properties are better for broader color, spacing, radius and motion changes. Accessibility hooks such as labels, live regions and focus handling should be preserved when composing the component.

## Troubleshooting

- If `x-textarea` stays unupgraded, confirm that `xtend-loader.js` loaded and that `components/manifest.json` contains `x-textarea`.
- If events are missing, listen after `customElements.whenDefined('x-textarea')` and check that the interaction is not disabled or blocked by validation.
- If styling does not apply, prefer documented CSS variables and parts; shadow DOM internals are intentionally not stable.
- If an RMT host renders stale state, check the state key and schedule records listed above before changing component code.

## Next steps

- [Component development](../components.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)
