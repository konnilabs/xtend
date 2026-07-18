# RMT Lifecycle Demo

Lifecycle and hydration flow in a traceable demo.

## What it covers

The lifecycle demo exposes mount, hydrate, update, and unmount as separate records. It also shows when resources are released and event listeners are removed.

It is registered as a stable tutorial in the central demo inventory and exclusively uses the generic manifest-driven `rmt-build` pipeline.

## Public building blocks

- `demos/xtendrmt/examples/lifecycle/source.rmt` describes the flow.
- `demos/xtendrmt/examples/lifecycle/generated/core.json` records expected core data.
- `demos/xtendrmt/examples/lifecycle/demo.json` defines its role, outputs, gate, and build command.
- `demos/xtendrmt/examples/lifecycle/browser-smoke.html` observes browser lifecycle behavior.

## Recommended workflow

Run the complete demo once and inspect record order. Then repeat mount and unmount; counters, listeners, and resource handles must not keep growing.

Run `npm run demos:rmt:check` to verify the inventory, source hashes, and checked-in compiler outputs without writing files.

## Next steps

- [XTendRMT overview](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)
