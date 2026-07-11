# RMT App Platform Tooling

Build, lint and editor support for RMT app platform projects.

## What it covers

App Platform tooling connects RMT source to lint, compile, and scaffold reports. It checks more than syntax: missing references, forbidden DOM sinks, and incomplete app records are rejected before a host loads output.

## Public building blocks

- `tools/rmt-language/app-platform-tooling.js` creates the public tooling report.
- `tests/fixtures/rmt-app-platform-tooling.rmt` is the executable input.
- `tests/fixtures/rmt-app-platform-tooling.core.json` records expected normalized output.

## Recommended workflow

Run lint and compile against the same source. Fix diagnostics in that source, update the core snapshot only for an intentional semantic change, and then exercise the host fixture.

## Next steps

- [XTendRMT overview](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Reference](./rmt-reference.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)
- [XTend Maraca](./xtend-maraca.md)

## Tooling For Orchestration

The app-platform tooling layer treats `validation`, `animation` and `transition` as first-class records. Completion, hover, document symbols and snippets explain field rules, animation presets, transition effects, `durationMs`, `target action`, `use animation`, `from surfaces`, `to surfaces`, `interrupt`, `reducedMotion` and `lane transition`. That gives the editor the same contracts that the compiler and Maraca consume.

For precise keyword contexts, this page points to the [RMT Reference](./rmt-reference.md).

New snippets:

- `rmt-vnext-validation`
- `rmt-vnext-animation`
- `rmt-vnext-transition`
- `rmt-vnext-maraca-orchestration-app`

Local gates for changes in this layer:

```bash
node scripts/run_xtend_tests.js rmt-completions rmt-navigation rmt-vnext-tooling rmt-editor-packaging --json
node scripts/run_xtend_tests.js maraca-docs rmt-tooling-docs rmt-reference-docs --json
```
