# x-router

x-router is a public XTend component reference for third-party developers who need to embed the component without private project context.

## What it solves

x-router participates in navigation. Keep route state, active indicators and router events explicit so a host can synchronize history, focus and announcements. The component is loaded from `components/xrouter.js`, declared through `components/manifest.json` and typed through `components/xrouter.d.ts`. That makes the article a practical contract: a host can see which attributes are safe, which events can be listened to, which methods are callable and which CSS hooks are intended for customization.

Use this page when you are integrating XTend into a product shell, a micro frontend, a CMS-rendered page or an RMT-authored surface. It focuses on the public surface instead of internal implementation details, so it is suitable for teams that only consume the package.

## When to use it

Use `x-router` when you need the behavior described by its `routing` profile and want a local Web Component that follows XTend theming, accessibility and scheduling conventions. It is especially useful when the host must stay framework-neutral, keep component code local and avoid CDN dependencies.

Third-party teams should prefer the documented attributes, slots, events and methods before wrapping the component. Wrappers are fine for product conventions, but the wrapper should pass through the public API instead of reaching into the shadow DOM.

## Avoid when

Avoid `x-router` when you need behavior that is not represented by the documented API, or when your host cannot load `xtend-loader.js` and `components/manifest.json`. Do not depend on private class names, generated internal nodes or unlisted state keys. If you need a design variant, use tokens, CSS parts or slots before forking the runtime file.

## Load and register

Load the XTend loader once per page. The loader reads the local manifest and resolves `x-router` to `./xrouter.js`. Keep the manifest URL same-origin unless your security policy explicitly allows another source.

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<x-router id="demo-xrouter"
  mode="hash"
  routesrc="demo"
  reuse-component="demo"
  skeleton
  skeleton-profile="route">
  <x-route path="/" component="x-section">Home</x-route>
</x-router>
```

`skeleton-profile` references a structured profile registered through `XTendSkeletonLoader.registerProfile()`. The router adopts its stable rows, tracks and minimum sizes; `skeleton-lines` and `skeleton-min-height` remain focused overrides. An unknown profile degrades to the built-in `route` profile and never evaluates HTML.

## Examples

The integration example shows the host-side pattern: query the element, listen to the first public event when one exists and call a public method only after the element has been upgraded. This keeps hydration and RMT materialization predictable.

```js
const component = document.querySelector('x-router');
component.addEventListener('xrouter-before-navigate', (event) => {
  console.log('xrouter-before-navigate', event.detail);
});
if ('focusRoute' in component) {
  component.focusRoute();
}
```

For production screens, keep IDs stable when state keys or diagnostics include `<id>`. Stable IDs make event logs, RMT schedules and browser tests easier to compare across deployments.

### Adopt a server-prerendered route

With `adopt-prerendered-route`, a host can provide exactly one already-visible direct route node. The router verifies its path, optional route ID, locale, component tag, content identity and trust markers, then moves that same node into the outlet. The route component implements `adoptRoute(context)`, or the compatible `updateRoute(context)`, to attach behavior only; the host does not need to duplicate the article in a bootstrap payload.

While verification and the adoption callback run, XRouter owns the `data-xrouter-adoption-pending` marker. Route components must not remove it. XRouter removes it exactly once after the callback accepts the existing node and emits `xrouter-adoption-pending-released`; rejected descriptors are discarded and rendered normally.

```html
<x-router mode="history" adopt-prerendered-route>
  <x-route path="/docs/en/start" component="docs-page"
    data-rmt-route-id="docs.start"></x-route>
  <docs-page data-xrouter-prerendered-route
    data-xrouter-route-path="/docs/en/start"
    data-xrouter-route-id="docs.start"
    data-xrouter-route-locale="en"
    data-xrouter-route-component="docs-page"
    data-xrouter-content-sha256="…">
    <!-- server-sanitized content with a matching trust proof -->
  </docs-page>
</x-router>
```

Success and controlled rejection are emitted as `xrouter-route-adopted` using the `xtend.router.route-adoption.v1` schema. When a proof does not match, the router discards the candidate and continues through its normal skeleton/render path.

### Progressive enhancement

`navigation-policy="progressive"` overlays SPA navigation on normal anchors. `canNavigate(href, context)` returns `xtend.router.navigation-capability.v1` and only permits interception when the router is ready, the URL is same-origin, the target is `_self`, the route is registered and native anchor semantics are unchanged. Otherwise the result carries a stable `reason`, and the browser follows the existing `href` as a document navigation. `spa` remains the general compatibility default; `document` disables client navigation. The Docs app explicitly opts into `progressive`.

## API reference

Attributes:
- `mode`
- `routesrc`
- `reuse-component`
- `adopt-prerendered-route`
- `navigation-policy` (`progressive`, `spa`, `document`)
- `skeleton`
- `skeleton-profile`
- `skeleton-lines`
- `skeleton-min-height`
- `title-template`
- `document-title-template`
- `title-prefix`
- `title-suffix`
- `default-title`
- `path`
- `component`
- `import`
- `title`
- `document-title`
- `meta-description`
- `meta-keywords`
- `hydrate-schedule`

Events:
- `xrouter-before-navigate`
- `navigation-error`: Failure from an attached page client, with `detail.error`.
- `route-changed`
- `routechange`
- `xrouter-after-navigate`
- `route-announced`
- `xrouter-routes-registered`
- `xrouter-route-reused`
- `xrouter-route-adopted`
- `xrouter-skeleton-shown`
- `xrouter-skeleton-hidden`
- `xrouter-route-hydrated`
- `xrouter-scroll-boundary-normalized`
- `xrouter-navigation-overlays-closed`
- `xrouter-title-updated`
- `xrouter-route-import-refused`

Methods:
- `focusRoute(detail?: XRouterRouteChangeDetail | null)`
- `announceRoute(detail?: XRouterRouteChangeDetail | null)`
- `canNavigate(href: string, context?: XRouterNavigationContext)`
- `snapshot()`

Slots:
- No named slots; use the default content path when the component renders children.

CSS parts:
- `root`
- `outlet`
- `announcer`

CSS custom properties:
- `--xtend-router-reserved-block-size`
- `--xtend-layout-reserved-block-size`
- `--xtend-nav-`
- `--xtend-nav-surface`
- `--xtend-nav-text`
- `--xtend-nav-border-color`
- `--xtend-nav-radius`
- `--xtend-nav-gap`
- `--xtend-nav-font-family`
- `--xtend-nav-font-size`
- `--xtend-nav-active-surface`
- `--xtend-nav-active-text`
- `--xtend-nav-current-indicator`
- `--xtend-nav-hover-surface`
- `--xtend-nav-focus-ring`
- `--xtend-nav-disabled-opacity`

## Integration notes

- UX profile: `xtend.component.navigation-routing-ux-profile.v1`.
- State key: `xtend.router.current`.
- RMT contract: `xtend.rmt.component-contract.v1`.
- Performance profile: `xtend.performance.component-profile.v1`.
- RMT schedules: `component.visible.mount`, `route.visible.render`, `route.transition.render`, `route.focus.restore`, `component.dynamic.hydrate`, `a11y.announce`.

RMT Hosts should treat the component as a Custom Element boundary: pass attributes as component props, bind DOM events to commands and keep scheduling metadata outside the component. Plain HTML hosts can use the same attributes and events without an RMT compiler.

Theming should flow through XTend design tokens first. CSS parts are intended for targeted skinning of exposed controls, while CSS custom properties are better for broader color, spacing, radius and motion changes. Accessibility hooks such as labels, live regions and focus handling should be preserved when composing the component.

## Troubleshooting

- If `x-router` stays unupgraded, confirm that `xtend-loader.js` loaded and that `components/manifest.json` contains `x-router`.
- If events are missing, listen after `customElements.whenDefined('x-router')` and check that the interaction is not disabled or blocked by validation.
- If styling does not apply, prefer documented CSS variables and parts; shadow DOM internals are intentionally not stable.
- If an RMT host renders stale state, check the state key and schedule records listed above before changing component code.

## Next steps

- [Component development](../components.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)
