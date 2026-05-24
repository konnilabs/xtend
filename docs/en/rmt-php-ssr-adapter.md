# RMT PHP/Laravel SSR Adapter

Server-side rendering for PHP and Laravel hosts.

## What it covers

RMT describes app structure, interaction and runtime intent. The kernel stays host-neutral; adapters connect records to XTend UI, XRouter, Fabric and your environment.

## Public building blocks

- `.rmt` sources.
- Core records and source maps.
- Host adapters for DOM, router and components.
- Adapter schema `xtend.rmt.php-ssr-adapter.v1`.
- JSONL streaming through `xtend.rmt.node-ssr-jsonl-frame.v1`, so PHP hosts can use the same incremental frame shape as the Node SSR adapter.

## Example

```php
require __DIR__ . '/xtendrmt/rmt-php-ssr-adapter.php';

$adapter = createRmtPhpSsrAdapter(['manifest' => $manifest]);
$result = $adapter->render(['coreDocument' => $coreDocument]);
```

## Recommended workflow

Model shell, state and interaction first. Validate the source with the linter, connect adapters afterwards and keep host-specific code outside the kernel.

## Next steps

- [XTendRMT overview](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)
