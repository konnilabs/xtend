# Public two-view resource cache

`services.mjs` owns two JSON resources through ordinary local Maraca App Services.
Use `demoPageResourcePolicy(registry, cache)` as `resourceCache` when starting
Maraca. After a successful server response, invoke `demo.cache.write` with
`key: JSON.stringify([client.page.version, client.page.contextKey, new URL(client.page.url, location.origin).href])`
and `value: {url: client.page.url, props: client.page.props, head: client.page.head}`.
`/a` and `/b` links reuse resources; every other route and default visit fetches.
Do not select SSR, credentials or editing drafts. For mutable permissions, validate
a server-issued epoch inside `resolve` before returning a resource. The example
RMT declares both service IDs; bind `createDemoServices().services` through the
composition's explicit local AppServices adapter.

The reproducible two-view service and navigation checks run with
`npm run test:ssr-pages`; the cache has no Search dependencies.
