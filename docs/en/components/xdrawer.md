# x-drawer

x-drawer is a public XTend component reference for third-party developers who need to embed the component without private project context.

## What it solves

x-drawer participates in navigation. Keep route state, active indicators and router events explicit so a host can synchronize history, focus and announcements. The component is loaded from `components/xdrawer.js`, declared through `components/manifest.json` and typed through `components/xdrawer.d.ts`. That makes the article a practical contract: a host can see which attributes are safe, which events can be listened to, which methods are callable and which CSS hooks are intended for customization.

Use this page when you are integrating XTend into a product shell, a micro frontend, a CMS-rendered page or an RMT-authored surface. It focuses on the public surface instead of internal implementation details, so it is suitable for teams that only consume the package.

## When to use it

Use `x-drawer` when you need the behavior described by its `overlay, routing` profile and want a local Web Component that follows XTend theming, accessibility and scheduling conventions. It is especially useful when the host must stay framework-neutral, keep component code local and avoid CDN dependencies.

Third-party teams should prefer the documented attributes, slots, events and methods before wrapping the component. Wrappers are fine for product conventions, but the wrapper should pass through the public API instead of reaching into the shadow DOM.

## Avoid when

Avoid `x-drawer` when you need behavior that is not represented by the documented API, or when your host cannot load `xtend-loader.js` and `components/manifest.json`. Do not depend on private class names, generated internal nodes or unlisted state keys. If you need a design variant, use tokens, CSS parts or slots before forking the runtime file.

## Load and register

Load the XTend loader once per page. The loader reads the local manifest and resolves `x-drawer` to `./xdrawer.js`. Keep the manifest URL same-origin unless your security policy explicitly allows another source.

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<x-drawer id="demo-xdrawer"
  open
  placement="end"
  modal
  label="Demo">
  <button slot="trigger" type="button">Open</button>
  <p>Projected content</p>
</x-drawer>
```

## Examples

The integration example shows the host-side pattern: query the element, listen to the first public event when one exists and call a public method only after the element has been upgraded. This keeps hydration and RMT materialization predictable.

```js
const component = document.querySelector('x-drawer');
component.addEventListener('drawer-opened', (event) => {
  console.log('drawer-opened', event.detail);
});
if ('toggle' in component) {
  component.toggle();
}
```

For production screens, keep IDs stable when state keys or diagnostics include `<id>`. Stable IDs make event logs, RMT schedules and browser tests easier to compare across deployments.

## API reference

Attributes:
- `open`
- `placement`
- `modal`
- `label`
- `route-aware`

Events:
- `drawer-opened`
- `drawer-closed`
- `drawer-route-selected`

Methods:
- `toggle()`
- `snapshot()`

Slots:
- `trigger`
- `header`
- `default`
- `footer`

CSS parts:
- `trigger`
- `backdrop`
- `overlay`
- `root`
- `surface`
- `overlay-surface`
- `header`
- `close`
- `control`
- `close-icon`
- `icon`
- `content`
- `footer`
- `status`

CSS custom properties:
- `--xtend-overlay-surface`
- `--xtend-surface`
- `--section-bg`
- `--xtend-overlay-text`
- `--xtend-text`
- `--text-color`
- `--xtend-overlay-border-color`
- `--xtend-border-color`
- `--border-color`
- `--xtend-overlay-elevation`
- `--xtend-shadow-overlay`
- `--xtend-overlay-backdrop`
- `--xtend-overlay-bg`
- `--xtend-overlay-focus-ring`
- `--xtend-focus-color`
- `--xtend-color-primary`

## Integration notes

- UX profile: `xtend.component.overlay-interaction-ux-profile.v1`.
- State key: `xdrawer-open-<id>`.
- RMT contract: `xtend.rmt.component-contract.v1`.
- Performance profile: `xtend.performance.component-profile.v1`.
- RMT schedules: `component.visible.mount`, `component.lazy.hydrate`, `route.visible.render`, `overlay.drawer.transition`, `diagnostics.snapshot`.
- Theme und Tokens: `--drawer-bg-dark`, `--drawer-close-size`, `inert`, `openDrawer()`, `closeDrawer()`.

RMT Hosts should treat the component as a Custom Element boundary: pass attributes as component props, bind DOM events to commands and keep scheduling metadata outside the component. Plain HTML hosts can use the same attributes and events without an RMT compiler.

Theming should flow through XTend design tokens first. CSS parts are intended for targeted skinning of exposed controls, while CSS custom properties are better for broader color, spacing, radius and motion changes. Accessibility hooks such as labels, live regions and focus handling should be preserved when composing the component.

Tab navigation includes controls in assigned slots and open shadow roots. Hidden, inert and disabled controls are excluded; Tab and Shift-Tab stay within the open modal surface.

## Troubleshooting

- If `x-drawer` stays unupgraded, confirm that `xtend-loader.js` loaded and that `components/manifest.json` contains `x-drawer`.
- If events are missing, listen after `customElements.whenDefined('x-drawer')` and check that the interaction is not disabled or blocked by validation.
- If styling does not apply, prefer documented CSS variables and parts; shadow DOM internals are intentionally not stable.
- If an RMT host renders stale state, check the state key and schedule records listed above before changing component code.

## Next steps

- [Component development](../components.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)
