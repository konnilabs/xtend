# x-lightbox

x-lightbox is a public XTend component reference for third-party developers who need to embed the component without private project context.

## What it solves

x-lightbox controls layered UI. Use its open or close API together with focus, Escape handling and stable CSS parts instead of replacing the shadow tree. The component is loaded from `components/xlightbox.js`, declared through `components/manifest.json` and typed through `components/xlightbox.d.ts`. That makes the article a practical contract: a host can see which attributes are safe, which events can be listened to, which methods are callable and which CSS hooks are intended for customization.

Use this page when you are integrating XTend into a product shell, a micro frontend, a CMS-rendered page or an RMT-authored surface. It focuses on the public surface instead of internal implementation details, so it is suitable for teams that only consume the package.

## When to use it

Use `x-lightbox` when you need the behavior described by its `overlay, media` profile and want a local Web Component that follows XTend theming, accessibility and scheduling conventions. It is especially useful when the host must stay framework-neutral, keep component code local and avoid CDN dependencies.

Third-party teams should prefer the documented attributes, slots, events and methods before wrapping the component. Wrappers are fine for product conventions, but the wrapper should pass through the public API instead of reaching into the shadow DOM.

## Avoid when

Avoid `x-lightbox` when you need behavior that is not represented by the documented API, or when your host cannot load `xtend-loader.js` and `components/manifest.json`. Do not depend on private class names, generated internal nodes or unlisted state keys. If you need a design variant, use tokens, CSS parts or slots before forking the runtime file.

## Load and register

Load the XTend loader once per page. The loader reads the local manifest and resolves `x-lightbox` to `./xlightbox.js`. Keep the manifest URL same-origin unless your security policy explicitly allows another source.

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<x-lightbox id="demo-xlightbox"
  src="/docs/assets/rmt-stack-topography.svg"
  open
  alt="XTend demo image">
  <button slot="trigger" type="button">Open</button>
  <p>Projected content</p>
</x-lightbox>
```

## Examples

The integration example shows the host-side pattern: query the element, listen to the first public event when one exists and call a public method only after the element has been upgraded. This keeps hydration and RMT materialization predictable.

```js
const component = document.querySelector('x-lightbox');
component.addEventListener('lightbox-opened', (event) => {
  console.log('lightbox-opened', event.detail);
});
if ('open' in component) {
  component.open();
}
```

For production screens, keep IDs stable when state keys or diagnostics include `<id>`. Stable IDs make event logs, RMT schedules and browser tests easier to compare across deployments.

## API reference

Attributes:
- `src`
- `open`
- `alt`

Events:
- `lightbox-opened`
- `lightbox-closed`

Methods:
- `open(src?: string)`
- `snapshot()`

Slots:
- `trigger`

CSS parts:
- `trigger`
- `overlay`
- `root`
- `content`
- `close`
- `control`
- `close-icon`
- `icon`
- `media`

CSS custom properties:
- `--xlightbox-overlay-bg`
- `--lightbox-bg`
- `--xtend-overlay-bg`
- `--xlightbox-blur`
- `--lightbox-blur`
- `--xtend-glass-blur`
- `--xlightbox-padding`
- `--lightbox-padding`
- `--xlightbox-radius`
- `--lightbox-radius`
- `--xtend-radius`
- `--xlightbox-shadow`
- `--lightbox-shadow`
- `--xlightbox-close-bg`
- `--lightbox-close-bg`
- `--xlightbox-close-color`

## Integration notes

- UX profile: `xtend.component.layout-display-media-ux-profile.v1`.
- State key: `xlightbox-open-<id>`.
- RMT contract: `xtend.rmt.component-contract.v1`.
- Performance profile: `xtend.performance.component-profile.v1`.
- Portal behavior: `document.body`, `trigger`, `xlightbox-open-<id>`.

RMT Hosts should treat the component as a Custom Element boundary: pass attributes as component props, bind DOM events to commands and keep scheduling metadata outside the component. Plain HTML hosts can use the same attributes and events without an RMT compiler.

Theming should flow through XTend design tokens first. CSS parts are intended for targeted skinning of exposed controls, while CSS custom properties are better for broader color, spacing, radius and motion changes. Accessibility hooks such as labels, live regions and focus handling should be preserved when composing the component.

## Troubleshooting

- If `x-lightbox` stays unupgraded, confirm that `xtend-loader.js` loaded and that `components/manifest.json` contains `x-lightbox`.
- If events are missing, listen after `customElements.whenDefined('x-lightbox')` and check that the interaction is not disabled or blocked by validation.
- If styling does not apply, prefer documented CSS variables and parts; shadow DOM internals are intentionally not stable.
- If an RMT host renders stale state, check the state key and schedule records listed above before changing component code.

## Next steps

- [Component development](../components.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)
