# Native RMT Authoring

Native RMT documents without legacy JSON as the preferred authoring path.

## What it covers

RMT describes app structure, interaction and runtime intent. The kernel stays host-neutral; adapters connect records to XTend UI, XRouter, Fabric and your environment.

## Public building blocks

- `.rmt` sources.
- Core records and source maps.
- Host adapters for DOM, router and components.

## Recommended workflow

Model shell, state and interaction first. Validate the source with the linter, connect adapters afterwards and keep host-specific code outside the kernel.

## Editor helpers

[RMT Linter](./rmt-linter.md) and
[RMT Language Server](./rmt-language-server.md) cover the linter, LSP, Code
Actions and agent report. Common snippets are `rmt-component` for component
records and `rmt-template-dom` for DOM descriptor templates. Check tooling
regressions with `node scripts/run_xtend_tests.js rmt-language-regression --json`.

## Next steps

- [XTendRMT overview](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)
