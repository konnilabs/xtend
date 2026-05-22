# xrouter - XTend Component

## Overview

`<x-router>` is the client-side router for XTend SPAs. It processes declarative `<x-route>` definitions, supports hash and history mode, and synchronizes navigation with `xstate`.

## Core Behavior

- only direct `<x-route>` children of `<x-router>` count as top-level routes
- nested routes are processed only through direct child routes of their parent route
- navigation can be triggered declaratively, through `x-link` or programmatically via `xstate.set('router-navigate', '/target')`

## Usage

```html
<x-router mode="history">
  <x-route path="/" component="x-home" import="/components/xhome.js" title="Home"></x-route>
  <x-route path="/docs" component="x-docs" import="/components/xdocs.js" title="Docs">
    <x-route path=":topic" component="x-doc-topic" import="/components/xdoctopic.js" title-template="{{params.topic}} | XTend Docs"></x-route>
  </x-route>
  <x-route path="*" component="x-notfound" import="/components/xnotfound.js"></x-route>
</x-router>
```

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `mode` | string | `hash` or `history` |
| `routesrc` | string | optional JSON source for routes |
| `skeleton` | string | enables a native route skeleton fallback during import, definition and hydration |
| `skeleton-lines` | number | number of skeleton lines for the route fallback |
| `skeleton-min-height` | string | stable minimum height for the route fallback |
| `title-template` / `document-title-template` | string | global document-title template, for example `{{title}} | App` |
| `title-prefix` / `title-suffix` | string | simple prefix/suffix for route titles without a template |
| `default-title` | string | fallback when a route does not define a title |

## Document Title Rewrite and SEO Meta

After every successful route match, XRouter rewrites the browser title and the SEO meta tags `description` and `keywords`. This prevents an SPA from staying on its initial title, and RMT routes can provide title information without XTend-specific runtime imports.

Direct route attributes:

```html
<x-router mode="hash" document-title-template="{{title}} | XTend">
  <x-route
    path="/components/x-router"
    component="x-doc-page"
    title="XRouter"
    document-title="XRouter Routing and SEO"
    meta-description="Routing, page titles and RMT route metadata"
    meta-keywords="xtend, xrouter, rmt">
  </x-route>
</x-router>
```

RMT can provide the same values through route records and `metadata`:

```json
{
  "id": "settings",
  "path": "/settings",
  "router": "xtend.xrouter",
  "component": "page.settings",
  "metadata": {
    "title": "Settings",
    "documentTitle": "Settings | XTend App",
    "metaDescription": "Settings for the XTend RMT app",
    "seo": {
      "keywords": ["xtend", "rmt", "routing"]
    }
  }
}
```

Supported template variables are `{{title}}`, `{{routeTitle}}`, `{{documentTitle}}`, `{{path}}`, `{{routeId}}`, `{{component}}`, `{{params.name}}`, `{{query.name}}` and `{{metadata.name}}`. For nested routes, the leaf route wins so deep links can define their own titles.

## Events

| Event | Description |
|-------|-------------|
| `xrouter-before-navigate` | cancelable, before programmatic router navigation |
| `route-changed` | emitted after successful navigation |
| `routechange` | legacy alias for `route-changed` |
| `xrouter-after-navigate` | legacy window event after rendering a route |
| `route-announced` | emitted after writing the route live region |
| `xrouter-skeleton-shown` / `xrouter-skeleton-hidden` | mark the native route-skeleton lifecycle |
| `xrouter-route-hydrated` | emitted after loader-based hydration of the rendered route subtree |
| `xrouter-title-updated` | emitted after writing `document.title` and SEO meta tags |
| `xrouter-scroll-boundary-normalized` | emitted when the router corrects a stale scroll position or a dead zone below the content area after a route change |
| `xrouter-navigation-overlays-closed` | emitted when the router closes open app-shell overlays such as `x-header` before rendering a route |

## XState Keys

- `router-navigate`: programmatic navigation input
- `router-navigated`: most recently triggered target path
- `router-current`: currently rendered route
- `router-rendered`: most recently rendered route
- `router-scroll-boundary`: legacy snapshot of the last scroll-boundary check
- `router-closed-navigation-overlays`: legacy snapshot of navigation overlays closed before route render
- `xtend.router.current`: canonical route context
- `xtend.router.announcement`: most recently announced route
- `xtend.router.documentMeta`: most recently set document title and SEO meta tags
- `xtend.router.skeleton`: current route-skeleton lifecycle
- `xtend.router.scrollBoundary`: canonical snapshot of the last scroll-boundary check
- `xtend.router.closedNavigationOverlays`: canonical snapshot of navigation overlays closed before route render

The canonical mirror paths are maintained as well:

- `xtend.router.lastNavigated`
- `xtend.router.current`
- `xtend.router.lastRendered`

## Route Detail

`route-changed` and `xrouter-after-navigate` provide a detail object with:

```js
{
  path: '/docs/router',
  routeId: 'docs-topic',
  component: 'x-doc-topic',
  params: { topic: 'router' },
  query: {},
  template: 'docs.topic.shell',
  scheduleRef: 'route.visible.render',
  title: 'Router',
  documentTitle: 'Router | XTend Docs',
  meta: {
    schema: 'xtend.router.document-meta.v1',
    scheduleRef: 'route.document.title.rewrite'
  },
  metadata: {}
}
```

For nested routes, `component` is the leaf route; `params` are merged from the complete match chain.

## Skeleton and Lazy Hydration

XRouter can load route components shell-first:

```html
<x-router mode="hash" skeleton="article" skeleton-lines="8" skeleton-min-height="20rem">
  <x-route
    path="/docs"
    component="xtend-doc-page"
    import="/docs/utils/pageloader.js"
    hydrate-schedule="docs.page.hydrate">
  </x-route>
</x-router>
```

If the component tag is not defined yet, XRouter first uses the route's explicit `import`. If no import is present, it delegates to `window.XTendLoader.ensureComponent(componentTag)`, so manifest components can be lazy-loaded natively through routes. After rendering, XRouter hydrates the route subtree through `window.XTendLoader.hydrateTree(...)`.

## Navigation Routing UX Profile

`<x-router>` provides `xtendNavigationRoutingUxProfile` with `xtend.component.navigation-routing-ux-profile.v1`. The profile describes `x-router` as a router outlet with `route-changed`, `route-announced`, `xrouter-before-navigate`, `xtend.router.current`, `route.visible.render`, `route.focus.restore`, `a11y.announce`, Fabric lane `transition` and RMT shell authoring.

After a successful render, the router focuses its outlet and writes a polite, atomic live region. This lets RMT and Fabric schedule route render, focus restore and screen-reader announcement separately, without requiring the RMT kernel to import XTend internals.

The new diagnostics details include `source: 'x-router'`, `stateKey` and `scheduleRef`, so `x-link`, feedback components and RMT schedulers can share the same route context.

## Scroll Boundary, Overlays and Dead-Zone Protection

Before every successful route render, `<x-router>` closes open navigation overlays that provide the stable component contract `isMenuOpen()` and `toggleMenu(false, options)`. This primarily stabilizes `x-header`: an open menu does not remain a layout factor from the previous page and does not create a dead zone when switching to a shorter route.

After rendering, `<x-router>` sets native scroll restoration to `manual`, scrolls to the top or the given `scroll-to` target, and re-checks document height in microtask, frame and settled-timeout phases. If the browser still holds a stale scroll position from the previous, taller route, or if the current position is beyond the new maximum scroll range, the router normalizes the position and writes a snapshot to `xtend.router.scrollBoundary`.

The snapshot follows `xtend.router.scroll-boundary.v1` and includes `path`, `phase`, `strategy`, `viewportHeight`, `scrollHeight`, `maxScrollTop`, `previousTop`, `normalizedTop`, `normalized` and `deadzoneDetected`. Fabric/RMT diagnostics can therefore make dead zones visible without app-specific scroll hacks.

## RMT / XTendRMT Adapter

Since Epic 05 / `WP-E05-10`, XRouter can consume native RMT routes through the adapter contract `xtend.rmt.xrouter-adapter.v1`.

```js
const adapter = window.xtend.rmt.createRmtXRouterAdapter({ routerElement });
adapter.registerRoutes(runtimeRegistry);
adapter.navigate({ routeId: 'home' }, { mapping });
```

The stable adapter ID is `xtend.xrouter`. The adapter consumes `routeRegistry.byRouter["xtend.xrouter"]`, maps `RmtRouteRegistryEntry` to XRouter-compatible records and calls `registerRoutes(...)` or `navigate(...)` on the target router.

`<x-router>` provides:

- `registerRoutes(routes, options)`
- `navigate(to, options)`
- `reuse-component` as opt-in for InsularHydration for SPA routes whose target uses the same component tag and implements `updateRoute(context)` or `routeChangedCallback(context)`

RMT-relevant route data is preserved as attributes on `<x-route>`:

- `data-rmt-route-id`
- `data-rmt-router`
- `data-rmt-template`
- `data-rmt-schedule`
- `data-rmt-params`
- `data-rmt-query`
- `data-rmt-metadata`

This keeps XRouter a productive adapter for RMT routes without giving it RMT kernel knowledge.

Further details:

- [XTendRMT App DSL Reference](../xtendrmt-app-dsl.md)
- [XTendRMT Runtime Bridge](../xtendrmt-runtime-bridge.md)
- [XTendRMT Native Authoring Guide](../xtendrmt-native-authoring.md)

## Notes

- `routesrc` is loaded before the first render.
- Lazy loading happens through the `import` attribute of each route.
- Guards (`before-enter`) and lifecycle hooks remain supported.
- With `reuse-component`, an app shell can keep its route component; XRouter then updates params, query and state and fires `xrouter-route-reused`.
- RMT schedule refs are forwarded to route details via `data-rmt-schedule`.
- Scroll-boundary normalization runs centrally in the router and should not be duplicated in app shells.
- Core router changes should be checked against `node scripts/verify_xtend_core_contracts.js`.

## ECH-WP-09 Token Table and Navigation States

`signatureDesign`: `x-router` is the calm route-outlet base for enterprise shells. The router itself delegates active/current/selected state to `x-link`, `x-menu`, `x-tabs` and `x-header`, but exposes the same navigation-state contract, route announcements and focus restore.

| Token | Purpose |
| --- | --- |
| `--xtend-nav-surface` | optional outlet/route surface |
| `--xtend-nav-text` | outlet text and inherited navigation color |
| `--xtend-nav-border-color` | shared navigation edge for route shells |
| `--xtend-nav-radius` | shared radius preset |
| `--xtend-nav-gap` | shared navigation spacing |
| `--xtend-nav-font-family` | inherited navigation typography |
| `--xtend-nav-font-size` | inherited navigation text size |
| `--xtend-nav-active-surface` | active/current/selected surface for connected navigation |
| `--xtend-nav-active-text` | active/current/selected text |
| `--xtend-nav-current-indicator` | non-color-only current indicator |
| `--xtend-nav-hover-surface` | hover surface for connected navigation |
| `--xtend-nav-focus-ring` | route focus and navigation focus |
| `--xtend-nav-disabled-opacity` | disabled dimming for connected navigation |

## ECH-WP-09 Keyboard Behavior

After rendering, the router focuses the outlet and emits `route-announced` through a polite live region. Link and menu keyboard behavior remains in the respective navigation elements; the router keeps the route context `xtend.router.current`, so active/current/selected can be synchronized through `aria-current="page"` and `aria-selected="true"`.

## ECH-WP-09 Foreign Theme

```css
[data-xtend-nav-theme="enterprise-foreign"] x-router {
  --xtend-nav-surface: transparent;
  --xtend-nav-text: #17231f;
  --xtend-nav-border-color: rgba(23, 35, 31, 0.22);
  --xtend-nav-radius: 0.35rem;
  --xtend-nav-gap: 0.45rem;
  --xtend-nav-font-family: "Aptos", "Segoe UI", sans-serif;
  --xtend-nav-font-size: 1rem;
  --xtend-nav-active-surface: #173f35;
  --xtend-nav-active-text: #fffaf0;
  --xtend-nav-current-indicator: #b56b35;
  --xtend-nav-hover-surface: rgba(181, 107, 53, 0.14);
  --xtend-nav-focus-ring: 3px solid #b56b35;
  --xtend-nav-disabled-opacity: 0.44;
}
```
