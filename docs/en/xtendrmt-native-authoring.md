# Native RMT Authoring

Native RMT documents without legacy JSON as the preferred authoring path.

## What it covers

Native authoring keeps an `.rmt` file as the editable source of truth. Legacy JSON and generated core files are comparison or runtime artifacts, not places for handwritten product logic.

## Public building blocks

- `tools/rmt-language/vnext-parser.js` reads native syntax.
- `tools/rmt-linter/cli.js` returns local diagnostics.
- `tools/rmt-language/vnext-compiler.js` emits the core model.

## Recommended workflow

Create RMT source, lint it, and compile only after a clean parser run. Inspect the core diff and commit source with its expected artifact when semantics intentionally change.

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

## Local verification

```bash
node scripts/run_xtend_tests.js rmt-tooling-docs rmt-language-regression --json
```

The first gate checks the documented authoring path; the second checks parser, diagnostic, and editor parity. On failure, change the `.rmt` source or responsible tool first, not generated core JSON.
