# x-alert

x-alert is a public XTend component reference for third-party developers who need to embed the component without private project context.

## What it solves

x-alert reports status to users. Wire events and live-region behavior carefully so automated hosts and assistive technology receive the same signal. The component is loaded from `components/xalert.js`, declared through `components/manifest.json` and typed through `components/xalert.d.ts`. That makes the article a practical contract: a host can see which attributes are safe, which events can be listened to, which methods are callable and which CSS hooks are intended for customization.

Use this page when you are integrating XTend into a product shell, a micro frontend, a CMS-rendered page or an RMT-authored surface. It focuses on the public surface instead of internal implementation details, so it is suitable for teams that only consume the package.

## When to use it

Use `x-alert` when you need the behavior described by its `feedback, stateful` profile and want a local Web Component that follows XTend theming, accessibility and scheduling conventions. It is especially useful when the host must stay framework-neutral, keep component code local and avoid CDN dependencies.

Third-party teams should prefer the documented attributes, slots, events and methods before wrapping the component. Wrappers are fine for product conventions, but the wrapper should pass through the public API instead of reaching into the shadow DOM.

## Avoid when

Avoid `x-alert` when you need behavior that is not represented by the documented API, or when your host cannot load `xtend-loader.js` and `components/manifest.json`. Do not depend on private class names, generated internal nodes or unlisted state keys. If you need a design variant, use tokens, CSS parts or slots before forking the runtime file.

## Load and register

Load the XTend loader once per page. The loader reads the local manifest and resolves `x-alert` to `./xalert.js`. Keep the manifest URL same-origin unless your security policy explicitly allows another source.

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<x-alert id="demo-xalert"
  type="info"
  closable
  duration="4000"
  overlay>
  x-alert content
</x-alert>
```

## Examples

The integration example shows the host-side pattern: query the element, listen to the first public event when one exists and call a public method only after the element has been upgraded. This keeps hydration and RMT materialization predictable.

```js
const component = document.querySelector('x-alert');
component.addEventListener('alert-shown', (event) => {
  console.log('alert-shown', event.detail);
});
if ('dismiss' in component) {
  component.dismiss();
}
```

For production screens, keep IDs stable when state keys or diagnostics include `<id>`. Stable IDs make event logs, RMT schedules and browser tests easier to compare across deployments.

## API reference

Attributes:
- `type`
- `closable`
- `duration`
- `overlay`
- `aria-label`

Events:
- `alert-shown`
- `alert-dismissed`

Methods:
- `dismiss(reason?: XAlertDismissReason)`

Slots:
- No named slots; use the default content path when the component renders children.

CSS parts:
- `close-icon`
- `control`
- `icon`

CSS custom properties:
- `--xtend-font-family`
- `--xtend-overlay-bg`
- `--xtend-glass-blur`
- `--xalert-bg`
- `--xtend-alert-bg`
- `--xalert-fg`
- `--xtend-alert-fg`
- `--xalert-border-color`
- `--xtend-alert-border`
- `--xalert-accent`
- `--xtend-alert-accent`
- `--xalert-close-bg`
- `--xalert-close-border`
- `--xtend-feedback-radius`
- `--xtend-radius`
- `--xtend-feedback-shadow`

## Integration notes

- UX profile: `xtend.component.feedback-status-ux-profile.v1`.
- State key: `xalert-state-<id>`.
- RMT contract: `xtend.rmt.component-contract.v1`.
- Performance profile: `xtend.performance.component-profile.v1`.
- RMT schedules: `component.visible.mount`, `a11y.announce`, `diagnostics.snapshot`.

RMT Hosts should treat the component as a Custom Element boundary: pass attributes as component props, bind DOM events to commands and keep scheduling metadata outside the component. Plain HTML hosts can use the same attributes and events without an RMT compiler.

Theming should flow through XTend design tokens first. CSS parts are intended for targeted skinning of exposed controls, while CSS custom properties are better for broader color, spacing, radius and motion changes. Accessibility hooks such as labels, live regions and focus handling should be preserved when composing the component.

## Troubleshooting

- If `x-alert` stays unupgraded, confirm that `xtend-loader.js` loaded and that `components/manifest.json` contains `x-alert`.
- If events are missing, listen after `customElements.whenDefined('x-alert')` and check that the interaction is not disabled or blocked by validation.
- If styling does not apply, prefer documented CSS variables and parts; shadow DOM internals are intentionally not stable.
- If an RMT host renders stale state, check the state key and schedule records listed above before changing component code.

## Next steps

- [Component development](../components.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)
