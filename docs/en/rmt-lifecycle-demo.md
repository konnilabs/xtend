# RMT Lifecycle Demo

Lifecycle and hydration flow in a traceable demo.

## What it covers

The lifecycle demo exposes mount, hydrate, update, and unmount as separate records. It also shows when resources are released and event listeners are removed.

## Public building blocks

- `xtendrmt/rmt-lifecycle-demo.rmt` describes the flow.
- `xtendrmt/rmt-lifecycle-demo.core.json` records expected core data.
- `tests/browser/fixtures/rmt-lifecycle-demo-smoke.html` observes browser lifecycle behavior.

## Recommended workflow

Run the complete demo once and inspect record order. Then repeat mount and unmount; counters, listeners, and resource handles must not keep growing.

## Next steps

- [XTendRMT overview](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)
