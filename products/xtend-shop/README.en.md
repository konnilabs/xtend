# XTend.store

A German demo storefront for Laravel SSR, signed RMT resume, Maraca AppServices and an XScaler payment surface delivered in distinct stream sections. All 36 products and payment methods are fictional. [Deutsche Anleitung](README.md).

Laravel owns persistent guest sessions, SQLite carts, checkout drafts, authoritative prices and mock orders. RMT owns UI actions, validation and surface updates. A separately hosted PHP **XTend DemoPay** provider runs on its own origin. Neither host needs Node after the build.

## Install and build

Use PHP 8.3 with SQLite/PDO SQLite, mbstring, DOM/XML/XMLWriter, OpenSSL and the standard Laravel extensions; Composer 2; Node 24+ and npm for building. Laravel 13 is the default. Separate Laravel 12/PHP 8.2 compatibility locks are under `tests/compatibility/laravel12`.

From this product directory in the framework checkout:

```sh
node scripts/prepare-packages.cjs
node scripts/refresh-local-lock.cjs
npm ci --ignore-scripts --no-audit --no-fund
composer install --no-interaction --prefer-dist --no-scripts
composer install --working-dir=payment-provider --no-interaction --prefer-dist --no-scripts
php scripts/setup.php
npm run build
```

Package preparation builds real npm archives and the Composer package from canonical framework sources. Lock refresh only permits changes to the two rebuilt local archives. Published dependencies retain their locked versions. For a source copy outside the checkout, pass the framework root to `prepare-packages.cjs`.

Setup creates missing keys, configuration, database tables and seed data. It does not reset existing data or rotate keys. Secrets, private signing keys, databases, dependencies and build outputs are ignored; dependency lockfiles are committed.

## Run

Start each PHP host in its own terminal:

```sh
php artisan serve --host=127.0.0.1 --port=8180
php -S 127.0.0.1:8181 -t payment-provider/public payment-provider/public/index.php
```

The equivalent npm aliases are `npm run serve` and `npm run serve:provider`. The shop uses `http://127.0.0.1:8180`; DemoPay uses `http://127.0.0.1:8181`.

For different origins, set shop `APP_URL`/`DEMOPAY_ORIGIN` and provider `SHOP_ORIGIN`/`PROVIDER_ORIGIN` before rebuilding. Both hosts share `DEMOPAY_SECRET`. The public resume key, provider origin and adapter integrity are pinned by the build. Plain HTTP is explicitly limited to local loopback development; deployed remote adapters use HTTPS.

## Guest purchase

Search and filter products, choose a SKU and add it to the cart. Catalog navigation, filters and native cart forms also work with JavaScript disabled. The interactive checkout uses RMT validation, backed by Laravel validation. Example fictional address: **Mara Muster**, `mara@example.test`, **Demostraße 12**, **10115 Berlin**, Germany.

Standard shipping costs €4.90 and becomes free at €50; express shipping costs €9.90. Backend configuration is authoritative. Prices use integer cents and each SKU has independent stock. Contact/address, shipping and review lead into DemoPay. Success, decline, cancellation and timeout are available without collecting real payment information.

The provider is contacted only when the payment action begins. Preflight precedes ATC attachment and SRI-checked adapter loading. Incremental fragments change the visible payment surface. Signed, short-lived capabilities bind authorization to the guest checkout attempt, cart version, EUR amount and expiry. Successful orders are transactional and idempotent. Order confirmation remains private to its guest session; checkout addresses are excluded from URLs and browser history.

`npm run reset:demo` explicitly clears demo data and restores seed stock. Normal host startup never resets data.

## Verification

```sh
npm run test:contracts
npm run test:php
npm run test:browser
```

The framework root exposes `npm run test:xtend-shop:report` through the shared test catalog, with separate contract, PHP and browser suites. `XTEND_SHOP_FIXTURE` selects an installed external fixture; `XTEND_PHP_BINARY` selects PHP. Standard Browser Hypervisor settings select Chromium/Chrome and WebDriver.

Browser tests use temporary databases and copied deployments without npm dependencies, with PHP process execution disabled. Set `XTEND_SHOP_FPM_BINARY` to run both applications behind real FPM pools and the bounded FastCGI test proxy. Product reports use `xtend.store.report.v1`; screenshots and scenario timings accompany browser results. Local evidence is separate from executed GitHub matrix evidence. See the [implementation workpackage](../../development/WP-XTend-Store.md) for acceptance status.

## Deployment and source ownership

`shop.data.view` identifies the active page. RMT `conditional` branches render only that view and the current checkout step; the shell persists. Catalog data is sent only on home/results pages, checkout fields only during checkout. `Catalog::summary()` produces compact cards; `Catalog::product()` supplies descriptions and variants for the detail view. Both use the same selected-variant fields: `id` identifies a product, `sku` a variant, and `price` is in cents. Checkout drafts remain in the server session and the required RMT form state.

The store enables the shared [compact page transport](../../docs/en/ssr-pages.md#compact-transport-and-conditional-views). Repeated object trees use a response-local reference table; signature verification receives the unchanged reconstructed envelope. Pagination, search and filtering use the same fetch client and history when JavaScript is available, and retain native links/forms otherwise. Inactive controls mount on demand; the shared Maraca code still ships as one bundle.

Styles use `style-src 'self'` with a document nonce and `style-src-attr 'none'`. Trusted component templates obtain their nonce from the bootstrap. Browser acceptance tests cover blocked style tags/attributes and authorized component styles throughout streamed payment.

RMT/TypeScript/CSS sources live in `src`; Laravel domain services in `app`; native and AppService routes share those services. Catalog seed data and original SVG artwork are local. `payment-provider` has independent Composer dependencies, configuration and a Maraca bundle.

Builds produce Maraca bundles before PHP page artifacts and reuse compiler results. Fingerprints bind sources, assets and runtimes. PHP deployment includes built `public/build` and `bootstrap/xtend` artifacts, Composer dependencies, application files and private runtime configuration. It excludes Node and `node_modules`. Requests never invoke a compiler. FPM/proxy streaming must forward partial responses without buffering; the provider sends `X-Accel-Buffering: no`.
