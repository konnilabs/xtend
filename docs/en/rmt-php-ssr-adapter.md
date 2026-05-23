# RMT PHP/Laravel SSR Adapter

The PHP SSR adapter is the Laravel-compatible host layer for RMT vNext. It is a
portable single-file PHP 8.1+ module at `xtendrmt/rmt-php-ssr-adapter.php`.
This first slice does not require Composer or a Laravel service provider.

Schema: `xtend.rmt.php-ssr-adapter.v1`

The adapter is wire-compatible with the
[RMT Node SSR Adapter](./rmt-node-ssr-adapter.md). Both backends emit the same
client-facing render result, hydration payload, RenderMan chunk, and JSONL
frame schemas: `xtend.rmt.node-ssr-render-result.v1`,
`xtend.rmt.node-ssr-hydration-payload.v1`, and
`xtend.rmt.node-ssr-jsonl-frame.v1`.

## Role in the Stack

RMT describes the app. XTend Components remain the UI building blocks. The PHP
adapter serializes server-side Light DOM, capability markers, lazy import
hints, and hydration payloads without instantiating custom elements on the
server.

It intentionally avoids:

- server-side Shadow DOM rendering
- private component maps
- docs-app coupling
- a PHP RMT compiler
- implicit network access
- HTML output without a trust boundary

## Public API

```php
require __DIR__ . '/xtendrmt/rmt-php-ssr-adapter.php';

$adapter = createRmtPhpSsrAdapter([
    'manifest' => $manifest,
    'endpointHandlers' => [
        'ssr.hero' => fn () => [
            'html' => '<x-hero>Hero</x-hero>',
            'trustBoundary' => 'xtend.security.sanitizing-boundary.v1',
        ],
    ],
]);

$result = $adapter->render(['coreDocument' => $coreDocument]);
```

`render(...)` handles Core Documents, Prepared Templates, and DOM Descriptors
directly. `.rmt` source requires an injected `compileRmtVNextSource` host
bridge. Without that bridge the adapter reports
`rmt.php_ssr.compiler_required`.

## Laravel Helpers

```php
return $adapter->toLaravelResponse($result);

return $adapter->toLaravelStreamedResponse([
    'coreDocument' => $coreDocument,
]);
```

When Laravel or Symfony response classes are available, the adapter uses them.
Without the framework it degrades to plain arrays, so the same file works in
Laravel, smaller PHP hosts, and tests.

## JSONL Streaming

`streamJsonl(...)` returns newline-delimited JSON with
`xtend.rmt.node-ssr-jsonl-frame.v1`. Supported frame types are `start`,
`component`, `html`, `hydration`, `diagnostic`, `complete`, and `error`.

Each frame carries the same fields as the Node adapter: `requestId`,
`sequence`, `operationId`, `variant`, `capability`, `lane`, `chunkKey`,
`payload`, and `diagnostics`. The XTend browser runtime does not need to know
whether Node or PHP/Laravel produced the stream.

## Data Sources and Trust Boundaries

Server data must come through explicit host hooks:

- `resolveDataSource`
- `endpointHandlers`
- `staticDataSources`
- `fixtures`
- `fetchAdapter`
- `laravelContainerResolver`

HTML fragments need a boundary such as
`xtend.security.sanitizing-boundary.v1` or
`xtend.security.streaming-boundary.v1`. Unsafe URLs, event attributes,
`srcdoc`, and blocked tags are diagnosed and removed by the fallback sanitizer.
Production hosts can inject `sanitizeHtmlOutput`.

## Docs App Integration

The Docs app now uses the adapter directly in `docs/index.php` for shell-first
prehydration.

- Contract: `xtend.docs.php-ssr-prehydration.v1`
- vNext source: `docs/xtendrmt-docs-shell-vnext.rmt`
- Compiler bridge: `scripts/compile_rmt_vnext_bridge.js`
- JSONL endpoint:
  `index.php?xtend-docs-rmt-ssr=shell&format=jsonl&page={slug}&locale={locale}`

The host injects `compileRmtVNextSource` through the Node bridge. Parsedown
stays a host boundary and only fills the content slot, while the shell comes
from RMT primitives, hydration, and RenderMan chunks.

## Gates

```bash
npm run test:rmt-php-ssr-adapter
npm run test:docs-php-ssr-prehydration
node scripts/run_xtend_tests.js rmt-php-ssr-adapter --json
```
