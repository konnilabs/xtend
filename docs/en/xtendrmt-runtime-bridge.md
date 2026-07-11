# XTendRMT Runtime Bridge

Adapters connect RMT core records to XTend UI, XRouter, Fabric and host APIs.

## What it covers

The runtime bridge connects host-neutral core records to browser services, XTend components, routing, and Fabric. It translates data and lifecycle requests but owns neither canonical app state nor framework internals.

## Public building blocks

- `xtendrmt/rmt-app-runtime.js` processes app records.
- `xtendrmt/rmt-runtime.esm.js` provides the browser runtime entry point.
- `xtendrmt/rmt-runtime.browser.js` attaches explicit browser boundaries.

## Recommended workflow

Validate the core document, inject only required host adapters, and mount one surface. Unmount must release listeners and resource handles; missing adapters return diagnostics or fallbacks.

## Next steps

- [XTendRMT overview](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)
