# RMT Node SSR Adapter

Server-side light DOM and hydration payloads for Node hosts.

## What it covers

RMT describes app structure, interaction and runtime intent. The kernel stays host-neutral; adapters connect records to XTend UI, XRouter, Fabric and your environment.

## Public building blocks

- `.rmt` sources.
- Core records and source maps.
- Host adapters for DOM, router and components.
## Example

```js
import { createRmtNodeSsrAdapter } from '@ccslabs/xtend/rmt/node-ssr-adapter';

const adapter = createRmtNodeSsrAdapter({ manifest, sourceTexts });
const result = await adapter.render({ source, filePath: 'app.rmt' });
```

## Recommended workflow

Model shell, state and interaction first. Validate the source with the linter, connect adapters afterwards and keep host-specific code outside the kernel.

If your backend uses PHP or Laravel, use the same core output with the
[RMT PHP/Laravel SSR Adapter](./rmt-php-ssr-adapter.md). Both adapters share
the JSONL frame shape for incremental SSR output.

## Next steps

- [XTendRMT overview](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)
