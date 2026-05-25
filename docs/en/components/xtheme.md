# x-theme

x-theme is a public XTend component reference for third-party developers who need to embed the component without private project context.

## What it solves

x-theme is classified as theme, stateful. Use the documented attributes, events and methods as the stable contract. The component is loaded from `components/xtheme.js`, declared through `components/manifest.json` and typed through `components/xtheme.d.ts`. That makes the article a practical contract: a host can see which attributes are safe, which events can be listened to, which methods are callable and which CSS hooks are intended for customization.

Use this page when you are integrating XTend into a product shell, a micro frontend, a CMS-rendered page or an RMT-authored surface. It focuses on the public surface instead of internal implementation details, so it is suitable for teams that only consume the package.

## When to use it

Use `x-theme` when you need the behavior described by its `theme, stateful` profile and want a local Web Component that follows XTend theming, accessibility and scheduling conventions. It is especially useful when the host must stay framework-neutral, keep component code local and avoid CDN dependencies.

Third-party teams should prefer the documented attributes, slots, events and methods before wrapping the component. Wrappers are fine for product conventions, but the wrapper should pass through the public API instead of reaching into the shadow DOM.

## Avoid when

Avoid `x-theme` when you need behavior that is not represented by the documented API, or when your host cannot load `xtend-loader.js` and `components/manifest.json`. Do not depend on private class names, generated internal nodes or unlisted state keys. If you need a design variant, use tokens, CSS parts or slots before forking the runtime file.

## Load and register

Load the XTend loader once per page. The loader reads the local manifest and resolves `x-theme` to `./xtheme.js`. Keep the manifest URL same-origin unless your security policy explicitly allows another source.

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<x-theme id="demo-xtheme"
  data-xtend-motion="demo"
  data-xtend-contrast="demo"></x-theme>
```

## Examples

The integration example shows the host-side pattern: query the element, listen to the first public event when one exists and call a public method only after the element has been upgraded. This keeps hydration and RMT materialization predictable.

```js
const component = document.querySelector('x-theme');
component.addEventListener('theme-initialized', (event) => {
  console.log('theme-initialized', event.detail);
});
```

For production screens, keep IDs stable when state keys or diagnostics include `<id>`. Stable IDs make event logs, RMT schedules and browser tests easier to compare across deployments.

## API reference

Attributes:
- `data-xtend-motion`
- `data-xtend-contrast`

Events:
- `theme-initialized`
- `theme-changed`
- `theme-variable-changed`
- `theme-preference-changed`
- `theme-a11y-announcement`
- `theme-density-changed`
- `theme-context-changed`
- `theme-performance-measured`

Methods:
- No public methods beyond HTMLElement methods.

Slots:
- No named slots; use the default content path when the component renders children.

CSS parts:
- No public CSS parts detected in the current runtime.

CSS custom properties:
- `--xtend-color-action`
- `--xtend-color-primary`
- `--xtend-color-action-hover`
- `--xtend-color-primary-dark`
- `--xtend-color-action-subtle`
- `--xtend-signature-accent-soft`
- `--xtend-color-danger`
- `--xtend-error-bg`
- `--xtend-color-warning`
- `--xtend-warning-bg`
- `--xtend-color-success`
- `--xtend-success-bg`
- `--xtend-surface-page`
- `--xtend-surface`
- `--xtend-surface-panel`
- `--xtend-surface-muted`

## Integration notes

- RMT contract: `xtend.rmt.component-contract.v1`.
- Performance profile: `xtend.performance.component-profile.v1`.
- RMT schedules: `theme.provider.initialize`, `theme.user-blocking.apply`, `theme.density.apply`, `theme.propagate.context`, `diagnostics.snapshot`.
- RMT Hosts use this page as the integration reference for the service-style runtime boundary.
- Theme API markers: `getDesignTokenContract()`, `registerTheme(name, definition)`, `setDensity(density)`, `getDesignTokens(themeName?)`, `dense`.

RMT Hosts should treat the component as a Custom Element boundary: pass attributes as component props, bind DOM events to commands and keep scheduling metadata outside the component. Plain HTML hosts can use the same attributes and events without an RMT compiler.

Theming should flow through XTend design tokens first. CSS parts are intended for targeted skinning of exposed controls, while CSS custom properties are better for broader color, spacing, radius and motion changes. Accessibility hooks such as labels, live regions and focus handling should be preserved when composing the component.

## Troubleshooting

- If `x-theme` stays unupgraded, confirm that `xtend-loader.js` loaded and that `components/manifest.json` contains `x-theme`.
- If events are missing, listen after `customElements.whenDefined('x-theme')` and check that the interaction is not disabled or blocked by validation.
- If styling does not apply, prefer documented CSS variables and parts; shadow DOM internals are intentionally not stable.
- If an RMT host renders stale state, check the state key and schedule records listed above before changing component code.

## Next steps

- [Component development](../components.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)
