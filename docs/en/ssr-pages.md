# Page runtime for Node and Laravel

Node and PHP/Laravel are independent SSR hosts. Node retains its compiler access,
JavaScript services and streams. Production Laravel uses prebuilt RMT artifacts and
the Composer package; it needs no Node process after the build.

The page runtime extends the existing [Node](./rmt-node-ssr-adapter.md) and
[PHP adapters](./rmt-php-ssr-adapter.md). It uses an XTend protocol without an Inertia dependency.

## Build and contracts

`xt pages build --root /path/to/app --target both --json` uses the existing vNext
compiler and import resolver. Render targets are `node`, `php` and `both`;
`--host laravel` selects the Laravel output path. Existing CLI server targets remain available.

Declare sources in `xtend.pages.json`:

```json
{
  "schema": "xtend.page-build.v1",
  "target": "both",
  "pages": {
    "Orders/Detail": {
      "source": "pages/order.rmt",
      "inputs": ["orders.detail"]
    }
  }
}
```

The build produces `xtend.page-manifest.v1` and TypeScript page/layout mappings.
The default output is `.xtend-build/pages.json`, or `bootstrap/xtend/pages.json` for
Laravel. Host props replace declared inputs; omitted inputs retain defaults. The project
index links configuration, page names, RMT sources, render targets and artifacts.
Composer `vendor` directories are excluded from project sources.

The portable projection is `xtend.rmt.portable-render.v1`. It executes compiler
descriptors without a PHP RMT parser. Text nodes render strings, numbers and booleans;
null, missing and structured values produce empty text. Bindings, attributes, lists and
explicit formatting handle structured data. PHP decoding preserves JSON objects and lists.

PHP supports the expressions listed by the portable renderer. Regex replacement and
JavaScript functions, for example, are outside that target. A PHP build diagnoses these
capabilities. Existing Node compiler and adapter access remains available.

`assets.entry` and `assets.css` contain same-origin URLs. Alternatively,
`"vite": {"manifest": "public/build/manifest.json", "entry": "resources/js/app.js"}`
reads the entry and its CSS dependencies from a completed Vite build.
`vite.base` defaults to `/build/`. `assetRoot` is the local public directory, defaulting
to `public`. Asset, configuration, source and runtime fingerprints contribute to the
build version. Rebuild page artifacts with the package actually deployed after a package update.

## Node integration

The runtime exports `@ccslabs/xtend-rmt/node-page-host`; the full package exposes
`@ccslabs/xtend/rmt/node-page-host`.

```js
import { createNodePageHost } from '@ccslabs/xtend-rmt/node-page-host';
import { Prop } from '@ccslabs/xtend-rmt/page-contract';

const pages = createNodePageHost({
  manifest,
  createContext: (request, signal) => host.requestContext(request, signal),
  resolvePage: async context => ({
    page: 'Orders/Detail',
    props: { 'orders.detail': Prop.once(() => host.loadOrder(context)) }
  }),
  validate: (context, fields) => host.validateOnly(context, fields),
  appServiceHost,
  cleanup: context => host.release(context)
});
// In the existing HTTP host:
// if (!await pages.handle(request, response)) nextHandler(request, response);
```

`host`, `manifest` and `appServiceHost` are application integration points.
`createNodePageHost()` starts no server. The request context supplies an opaque
`contextKey` bound to the application, user and tenant, and optionally a `csrfToken`.
Authentication, routing, upload limits and business validation belong to the HTTP host.
An existing `createNodeAppServiceHost()` instance can provide `appServiceHost`.

Resolvers return a page, `{ redirect }`, or `{ download }` carrying a Node/Web stream.
Providers receive an abort signal. Request deadlines and cleanup budgets are configured
separately; abort signals cannot interrupt synchronously blocking JavaScript callbacks.

`createNodePageRouteManifest()` consumes named routes explicitly obtained from the
host router. Laravel independently exports its Route Collection. Both use
`xtend.page-routes.v1` with a distinct host field.

## Laravel integration

`scripts/build_laravel_package.js /absolute/fresh/output` assembles
`ccslabs/xtend-laravel` with its canonical PHP files. Install that artifact through
a Composer repository. Local package tests use a Composer path repository with
`symlink: false`. Publishing to Packagist remains a separate action.

```php
use Ccslabs\XTend\Facades\XTend;
use Ccslabs\XTend\Data\Prop;

XTend::share('account', fn ($request) => $request->user()?->only('id', 'name'));
return XTend::render('Orders/Detail', [
    'orders.detail' => ['text' => $order->name, 'tone' => 'neutral'],
    'statistics' => Prop::defer(fn () => $order->statistics(), 'statistics'),
]);
```

Register `Ccslabs\XTend\HandleXTendRequests` in web middleware after session middleware.
Composer discovers the ServiceProvider. FormRequests, redirects, error bags, flash
and `UploadedFile` retain Laravel's lifecycle. API routes without this middleware keep
their JSON behavior. Live validation additionally uses `HandlePrecognitiveRequests`.

`xtend:install` publishes configuration. `xtend:routes` exports names configured in
`xtend.routes`. `xtend:doctor` checks the manifest, render target and PHP source hashes
from `xtend.php-package-sources.v1`. Override `xtend.root_view` to customize the Blade root.
A compiler bridge is an explicitly configured development tool; production pages render artifacts.

## Shared browser lifecycle

```js
import { createPageClient } from '@ccslabs/xtend-rmt/page-client';
import { createPageForm } from '@ccslabs/xtend-rmt/page-form';

const client = createPageClient({
  initialPage: JSON.parse(document.getElementById('xtend-page-data').textContent),
  encryptHistory: true
});
await client.start();
const form = createPageForm({ client, errorBag: 'edit', defaults: { name: '' } });
form.bind(document.querySelector('form'), { action: '/orders/1' });
```

`xtend.page-response.v1` combines page identity, props, layout, head, version and context.
The client handles internal links, superseded visits, Back/Forward, scroll regions
(`data-xtend-scroll`) and anchors. `data-xtend-native` leaves a link to the browser.
Forms expose dirty, processing, success, error and upload state; stale responses cannot
reset newer edits. `bind()` accepts native forms and `x-form` submit events.

Declare layouts through `layouts` and `page.layout`. An RMT layout build names exactly
one compiled node through `outlet`; this position contains the page. Bind resources to
pages or layouts with `registerResource()`. User/tenant changes also release persistent DOM.

`Prop.lazy`, `Prop.defer`, `Prop.merge` and `Prop.once` have JavaScript and PHP APIs.
`reload({ only: [...] })` and deferred groups evaluate selected providers.
`prefetch()`, `poll()` and `whenVisible()` share bounded loading/cache management.
A prefetched visit rechecks host context and does not consume flash data early.
`loadMore()` uses `pagination.next`, `previous` and `props`; Laravel's
`Ccslabs\XTend\Pagination::from()` accepts offset and cursor paginators.

Use `createNodePageValidator()` or `createPrecognitionValidator()` as a form validation
provider. For rotating sessions, supply `csrfToken: () => client.page.csrfToken`.
`client.optimistic()` applies immediate changes; an older failure cannot undo newer
state. Instant Visits and View Transitions are explicit visit options and honor reduced motion.

History stores selected `remember()` data and scroll positions. Passwords, token fields
and files are excluded. Optional WebCrypto encryption does not replace authorization.
`invalidate()` clears cached and remembered state. Background requests report deployment
changes without forcing a document replacement over unsaved forms. Initial Resume uses
the existing signature/integrity contract and its controlled hydration fallback.

## Acceptance and operation

The canonical runner defines `ssr-pages:node`, `ssr-pages:laravel` and
`ssr-pages:laravel-browser`. Executable reference hosts and the same CRUD browser flow
live in `tests/ssr-pages/`. The Laravel matrix covers 12/PHP 8.2–8.5 and 13/PHP 8.3–8.5,
with browser evidence for each Laravel major. Local PHP 8.3 results do not replace that CI matrix.

PHP-FPM/proxy infrastructure timeouts must bound synchronously blocking providers;
frame and cleanup budgets cannot interrupt a running PHP function.
Set `XTEND_PHP_FPM_BINARY=/path/to/php-fpm` before the Laravel browser profile to run it behind an isolated FPM pool and FastCGI proxy.

Run `node tests/ssr-pages/measure_resources.js .xtend-test-results/ssr-pages-resources.json` for 50 render iterations of the same list in both runtimes and a browser bundle measurement. PHP comparisons use scalar identities; compare list entries through their declared keys. String slices must preserve Unicode scalar boundaries.

The Node test path requires no PHP. The additional `ssr-pages-php` suite checks shared render parity once per PHP/Laravel environment. Assign `router.pageClient = client` before attaching an existing `x-router`, and call `client.start()`; the page runtime then owns links and history.

Optional transitions use a host callback: `createPageClient({ initialPage, transition: async update => { if (document.startViewTransition) await document.startViewTransition(update).updateCallbackDone; else await update(); } })`. A visit opts in with `{ transition: true }`. Without a host callback, or with reduced motion, the page uses its regular update.

## Maraca pages and XTend.store

`createMaracaPageClient()` from `@ccslabs/xtend/maraca/page-client` connects the page client to a Maraca bundle. Each page or layout manifest may declare `maraca: { entry: "/build/maraca/xtend.maraca.mjs" }`. The bundle and portable projection use the same compiler facts; `createRmtCompilationSession()` shares analysis within a build. Configuration and referenced assets contribute to the build version.

The page runtime owns URL, history and transport; Maraca owns UI state and DOM commits. Each root has one controller, and unchanged shells survive navigation. Superseded activations are discarded and navigation releases remote surfaces. The generated entry uses `startMaracaPageApplication()` from `@ccslabs/xtend/maraca/page-bootstrap`: capture is installed before loading the composition, P-256 signatures use the public build key, and rejected integrity checks use the existing single hydration fallback.

The shared head contract also accepts canonical links (`tag: "link"`, `rel: "canonical"`, HTTP(S) URL) and identified JSON-LD records (`tag: "json-ld"`, `key`, `data`). Node, PHP and browser consumers deduplicate by identity. Script content is serialized safely; event attributes and executable canonical URLs are rejected.

[XTend.store](../../products/xtend-shop/README.en.md) demonstrates this integration with Laravel, a guest cart and a separate PHP DemoPay provider. The Node SSR adapter and `createNodePageHost()` remain independent integration APIs. The store is an additional reference application.

Maraca pages also route native GET search and filter forms through page navigation. The base page API enables this with `forms: true`; `navigationAction` can close declared RMT surfaces before a visit. POST forms retain their host or RMT contract.
