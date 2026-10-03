# XTend Laravel

This package integrates prebuilt RMT pages with Laravel 12 and 13. The deployed
application renders in PHP without a Node process. Node SSR remains available
independently through `@ccslabs/xtend-rmt/node-page-host`.

Build this package from the XTend repository with
`node scripts/build_laravel_package.js /absolute/fresh/output`. The resulting archive
includes its PHP runtime and a source fingerprint receipt. Use the archive in your
Composer repository; installing the unbuilt source directory is not supported.

After installation, run `php artisan xtend:install`, build your Vite assets, then run
`xt pages build --root /path/to/app --host laravel --target php --json` during CI.
Register `Ccslabs\XTend\HandleXTendRequests` on web routes returning XTend pages.
Use the normal Laravel web middleware, session, CSRF and authentication stack.

```php
use Ccslabs\XTend\Facades\XTend;
use Ccslabs\XTend\Data\Prop;

return XTend::render('Orders/Detail', [
    'orders.detail' => ['name' => $order->name],
    'statistics' => Prop::defer(fn () => $order->statistics(), 'statistics'),
]);
```

`php artisan xtend:doctor` checks installed runtime integrity. Route export uses
`php artisan xtend:routes`. FormRequests, redirects, error bags and session flash
remain host responsibilities. API routes keep their existing JSON behavior.

The complete DE/EN guide and reference hosts are in `docs/de/ssr-pages.md`,
`docs/en/ssr-pages.md` and `tests/ssr-pages/` in the XTend repository.
