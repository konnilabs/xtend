# Coordinate Parsedown with RMT

The XTend Docs demonstrate a production path where PHP renders Markdown while RMT and AppRuntime own navigation, scheduling and hydration. This separation matters: RMT receives structured state and lifecycle signals, but never PHP execution or unchecked HTML.

## Ownership

| Layer | Responsibility | Public boundary |
| --- | --- | --- |
| PHP and Parsedown | Resolve locale, parse Markdown in safe mode, serve the payload | `docs/index.php?xtend-docs-page={slug}&locale={locale}` |
| RMT | Declare shell, surfaces, lanes, actions and data sources | `docs/xtendrmt-docs-shell-vnext.rmt` |
| AppRuntime | Coordinate commands, navigation, search and Fabric telemetry | `docs/utils/docs-shell-runtime.mjs` |
| Trusted DOM host | Sanitize Parsedown HTML and commit it as an `html_fragment` | `docs/utils/trusted-dom-host.mjs` |
| XRouter and SkeletonLoader | Reuse the route and preserve loading geometry | `skeleton-profile="docs-article"` |

The kernel does not make sanitizer decisions. The host passes a fragment to `createRmtTemplateRuntimeRenderer()` only after validation. Script tags, inline handlers and active URL schemes therefore never become permitted RMT content.

## Route data flow

1. PHP renders the header, hero, active task trunk, current `<x-route>` record and reserved article geometry. The complete bilingual article corpus is absent from the initial HTML.
2. `xtend-doc-page` requests the current Parsedown payload from the same-origin endpoint. The response carries HTML, locale resolution and compact page metadata.
3. The host sanitizes the fragment and commits it through the Trusted DOM runtime into `#md-content`.
4. AppRuntime records `docs.content.ready` on the visible lane. Syntax highlighting, related links and embedded experiences follow on idle lanes.
5. On later navigation, XRouter keeps one shell owner. It reuses the page component, cancels scheduled work from the previous route and fetches only the next payload.

The complete route table is registered through `x-router.registerRoutes()` after content commit or on the first navigation intent. This keeps the SSR path small without limiting URLs or keyboard access.

## RMT declaration

The relevant shell record binds the payload endpoint as a data source. The parser remains outside the DSL:

```rmt
datasource docs.page.payload from endpoint "index.php?xtend-docs-page={slug}&locale={locale}" {
  method GET
  contract DocsParsedownPagePayload
  result html
  fallback fixture docs.page.initial
}

surface docs.page kind page component x-section {
  lane visible weight 82 {
    mount docs-page from datasource docs.page.payload
  }

  lane idle weight 18 {
    hydrate docs-page-content from datasource docs.page.payload
  }
}
```

The AOT compiler validates these records before the build. The browser neither compiles free-form RMT input nor creates a second Markdown parser.

## Search and loading states

Docs search uses two declared `searchsource` records, each with a compact index and a lazy full-text fallback. Title, aliases, keywords, headings, summary and body have separate weights. A typo such as `hydratoin` can therefore find `Hydration Policies` without placing every article in the initial bundle.

Skeletons come from `XTendSkeletonLoader.registerProfile()`. A profile describes rows, tracks, repetitions and responsive minimum sizes as data. Reduced Motion disables shimmer while preserving geometry.

## Inspect telemetry

Docs installs `window.__XTEND_DEV_API__` before the complete runtime boot. Its synchronous methods initially return valid `degraded` snapshots; after hydration, Performance, Kernel, Fabric and Hydration reflect current AppRuntime state. You can therefore inspect Docs itself with [XTend Dev Surface](./xtend-dev-surface.md).

Run the local contracts together:

```bash
node scripts/run_xtend_tests.js docs-rmt-pilot docs-shell-catfooding docs-php-ssr-prehydration docs-php-ssr-performance-budget docs-php-ssr-cls-budget --json
node scripts/smoke_docs_shell_catfooding.mjs
```

The browser smoke covers both locales, Light/Dark, desktop/mobile, keyboard focus, the drawer, route cleanup, DEV API, CLS and FCP/transfer regression.

## Failure behavior

If a payload request fails, the shell remains usable and only the article enters a local error state. A sanitizer failure blocks the fragment commit; it must never fall back to `innerHTML`. Without Worker support, the main-thread runtime processes the same serializable search index in bounded work. An unknown skeleton profile falls back to the built-in route profile.

For a locale mismatch, inspect the URL, `xtend.docs.locale`, and the payload fields `requestedLocale` and `resolvedLocale`. For layout movement, compare `data-xtend-cls-anchor`, the active skeleton profile and reserved block sizes before interpreting timing metrics.

## Related topics

- [XTendRMT overview](./xtendrmt-overview.md)
- [Trusted DOM and sanitizing](./trusted-dom-sanitizing.md)
- [Hydration Policies](./hydration-policies.md)
- [XTend Dev Surface](./xtend-dev-surface.md)
