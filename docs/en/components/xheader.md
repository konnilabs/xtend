# x-header

x-header is a public XTend component reference for third-party developers who need to embed the component without private project context.

## What it solves

x-header shapes visible layout or media. Prefer attributes, slots and tokens over DOM rewrites so responsive layout and rendering measurements stay predictable. The component is loaded from `components/xheader.js`, declared through `components/manifest.json` and typed through `components/xheader.d.ts`. That makes the article a practical contract: a host can see which attributes are safe, which events can be listened to, which methods are callable and which CSS hooks are intended for customization.

Use this page when you are integrating XTend into a product shell, a micro frontend, a CMS-rendered page or an RMT-authored surface. It focuses on the public surface instead of internal implementation details, so it is suitable for teams that only consume the package.

## When to use it

Use `x-header` when you need the behavior described by its `display` profile and want a local Web Component that follows XTend theming, accessibility and scheduling conventions. It is especially useful when the host must stay framework-neutral, keep component code local and avoid CDN dependencies.

Third-party teams should prefer the documented attributes, slots, events and methods before wrapping the component. Wrappers are fine for product conventions, but the wrapper should pass through the public API instead of reaching into the shadow DOM.

## Avoid when

Avoid `x-header` when you need behavior that is not represented by the documented API, or when your host cannot load `xtend-loader.js` and `components/manifest.json`. Do not depend on private class names, generated internal nodes or unlisted state keys. If you need a design variant, use tokens, CSS parts or slots before forking the runtime file.

## Load and register

Load the XTend loader once per page. The loader reads the local manifest and resolves `x-header` to `./xheader.js`. Keep the manifest URL same-origin unless your security policy explicitly allows another source.

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<x-header id="demo-xheader"
  src="/docs/assets/rmt-stack-topography.svg"
  logo-size="demo"
  title="demo"
  sticky="demo">
  x-header content
</x-header>
```

## Examples

The integration example shows the host-side pattern: query the element, listen to the first public event when one exists and call a public method only after the element has been upgraded. This keeps hydration and RMT materialization predictable.

```js
const component = document.querySelector('x-header');
component.addEventListener('header-ready', (event) => {
  console.log('header-ready', event.detail);
});
if ('toggleMenu' in component) {
  component.toggleMenu();
}
```

For production screens, keep IDs stable when state keys or diagnostics include `<id>`. Stable IDs make event logs, RMT schedules and browser tests easier to compare across deployments.

## API reference

Attributes:
- `src`
- `logo-size`
- `title` (plain-text fallback for the `title` slot)
- `sticky`
- `shadow`
- `brand-collapse` (`auto`, `never`, or `always`; defaults to `auto`)
- `menu-mode`
- `menu-placement`
- `menu-modal`
- `menu-open`
- `menu-breakpoint`
- `menu-width`
- `menu-max-height`
- `menu-align`

Events:
- `header-ready`
- `header-layout-changed`
- `header-brand-visibility-changed`
- `menu-before-open`
- `menu-before-close`
- `menu-opened`
- `menu-closed`
- `menu-mode-changed`
- `menu-placement-changed`
- `logo-loaded`

Methods:
- `toggleMenu(open: boolean)`
- `toggleMenu(open: boolean, options?: XHeaderToggleMenuOptions)`
- `isMenuOpen()`
- `snapshot()`

Slots:
- `title` (an explicitly assigned node overrides the `title` attribute)
- `search`
- `actions`
- `utility`
- `nav`
- `logo`

CSS parts:
- `root`
- `brand`
- `title`
- `logo`
- `search`
- `actions`
- `utility`
- `trigger`
- `control`
- `trigger-icon`
- `icon`
- `backdrop`
- `menu`
- `drawer`
- `nav`
- `menu-surface`

CSS custom properties:
- `--header-reserved-block-size`
- `--xtend-layout-reserved-block-size`
- `--header-slot-template-areas`
- `--header-tablet-slot-template-areas`
- `--header-mobile-slot-template-areas`
- `--header-title-grid-area`
- `--header-search-grid-area`
- `--header-actions-grid-area`
- `--header-trigger-grid-area`
- `--xtend-header-brand-fit-slack`
- `--xtend-nav-`
- `--xtend-nav-surface`
- `--xtend-nav-text`
- `--xtend-nav-border-color`
- `--xtend-nav-radius`
- `--xtend-nav-gap`
- `--xtend-nav-font-family`

## Integration notes

- UX profile: `xtend.component.layout-display-media-ux-profile.v1`, `xtend.component.navigation-routing-ux-profile.v1`.
- State key: `xheader-state-<id>`.
- RMT contract: `xtend.rmt.component-contract.v1`.
- Performance profile: `xtend.performance.component-profile.v1`.
- Menu Presentation Modes: `drawer`, `side-panel`, `popover`, `fullscreen`, `inline-main`.
- Legacy CSS Parts remain documented for older drawer skins.
- Menu attributes: `menu-mode`, `menu-placement`, `menu-modal`, `menu-open`, `menu-breakpoint`, `menu-width`, `menu-max-height`, `menu-align`.
- Menu events: `menu-before-open`, `menu-before-close`, `menu-mode-changed`, `menu-placement-changed`.
- Menu tokens: `--xtend-header-menu-width`, `--xtend-header-menu-max-height`, `--xtend-header-menu-backdrop`.
- Brand fitting: `brand-collapse="auto"` measures the complete title against the available brand track. If it does not fit, only the logo remains visible while the title stays available to assistive technology. Use `never` to keep the title or `always` to force the logo-only presentation.
- Title fallback: when no node is assigned to `slot="title"`, the `title` attribute is rendered as plain text. The runtime writes it through `textContent`; markup in the attribute is never interpreted. An explicitly assigned title slot always remains authoritative.

RMT Hosts should treat the component as a Custom Element boundary: pass attributes as component props, bind DOM events to commands and keep scheduling metadata outside the component. Plain HTML hosts can use the same attributes and events without an RMT compiler.

Theming should flow through XTend design tokens first. CSS parts are intended for targeted skinning of exposed controls, while CSS custom properties are better for broader color, spacing, radius and motion changes. Accessibility hooks such as labels, live regions and focus handling should be preserved when composing the component.

## Troubleshooting

- If `x-header` stays unupgraded, confirm that `xtend-loader.js` loaded and that `components/manifest.json` contains `x-header`.
- If events are missing, listen after `customElements.whenDefined('x-header')` and check that the interaction is not disabled or blocked by validation.
- If styling does not apply, prefer documented CSS variables and parts; shadow DOM internals are intentionally not stable.
- If the title collapses too early or oscillates near the boundary, keep `brand-collapse="auto"` and adjust `--xtend-header-brand-fit-slack`; do not restore clipping with private shadow styles.
- If an RMT host renders stale state, check the state key and schedule records listed above before changing component code.

## Next steps

- [Component development](../components.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)
