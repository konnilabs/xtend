# XTendRMT App DSL

Reference for state, selectors, actions, events, resources and surfaces.

## What it covers

The App DSL connects state, selectors, actions, events, resources, and surfaces in one referential document model. Every record has a clear owner and may appear only in parser-approved contexts.

## Public building blocks

- `tools/rmt-language/vnext-parser.js` defines syntactic contexts.
- `tools/rmt-language/vnext-compiler.js` resolves references and emits core records.
- `docs/en/rmt-reference.md` lists operators, parameters, and diagnostics.

## Recommended workflow

Model data and one visible surface first. Add user actions and resources with explicit references; reserve host adapters for network, storage, and other platform services.

## Next steps

- [XTendRMT overview](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)
