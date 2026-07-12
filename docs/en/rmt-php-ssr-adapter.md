# RMT PHP/Laravel SSR Adapter

Server-side rendering for PHP and Laravel hosts.

## What it covers

The PHP SSR adapter implements the same RMT response contract for PHP and Laravel hosts. It serializes core records, CSP, and resume data without executing JavaScript modules on the server.

## Public building blocks

- `xtendrmt/rmt-php-ssr-adapter.php` contains the adapter and Laravel helper.
- `rmt-php-ssr-adapter` compares rendering, hydration, and security behavior.
- `xtend.rmt.ssr-response.v1` identifies the shared response envelope.

- Adapter schema `xtend.rmt.php-ssr-adapter.v1`.
- JSONL streaming through `xtend.rmt.node-ssr-jsonl-frame.v1`, so PHP hosts can use the same incremental frame shape as the Node SSR adapter.

## Hydration Response Envelope

`render().response` uses `rmt_template_prerender_response` with
`executionMode: "server_prerender_hydrate"`. The response carries `chunk`,
`chunks`, `request`, `metadata.adapterKind: "php-ssr"` and `hydrate_existing`
target metadata so the client runtime can process it through `hydrateResponse`
or degrade in a controlled way when diagnostics block the render.

[Hydration Policies](./hydration-policies.md) explains the choice between regular SSR hydration, deferred hydration, and a full resume handoff with RMT examples.

## Automatic CSP

The adapter creates a framework-managed `xtend.rmt.ssr-csp-policy.v1` policy for
every render. `render().headers`, `render().response.headers`, hydration
metadata, JSONL start frames, `toLaravelResponse()` and
`toLaravelStreamedResponse()` include `Content-Security-Policy` automatically.

## Example

```php
require __DIR__ . '/xtendrmt/rmt-php-ssr-adapter.php';

$adapter = createRmtPhpSsrAdapter(['manifest' => $manifest]);
$result = $adapter->render(['coreDocument' => $coreDocument]);
```

## Recommended workflow

Build the response from validated core data, set CSP headers before the body, and pass resume metadata to the browser unchanged. Treat failures as structured diagnostics rather than suppressed PHP warnings.

## Next steps

- [XTendRMT overview](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)
