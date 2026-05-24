# Parsedown RMT Scheduling

How the Docs app renders Markdown safely and coordinates the shell through RMT.

## What it covers

RMT describes app structure, interaction and runtime intent. The kernel stays host-neutral; adapters connect records to XTend UI, XRouter, Fabric and your environment.

## Public building blocks

- `docs/xtendrmt-parsedown-docs.rmt`.
- `xtend.docs.parsedown-rmt-pilot.v1`.
- `docs.app.shell` and Shell-first rendering.
- `node scripts/run_xtend_tests.js docs-rmt-pilot --json`.

## Recommended workflow

Model shell, state and interaction first. Validate the source with the linter, connect adapters afterwards and keep host-specific code outside the kernel.

## Next steps

- [XTendRMT overview](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)
