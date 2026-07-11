# RMT Component Template Primitives

Template primitives for reusable component-oriented UI structures.

## What it covers

Component template primitives describe reusable UI structures as declarative records. They bind a known custom-element tag, properties, slots, and events without importing component classes into the RMT kernel.

## Public building blocks

- `tests/fixtures/rmt-component-template-primitives.rmt` contains the supported primitives.
- `tests/fixtures/rmt-component-template-primitives.core.json` shows their core representation.
- `components/manifest.json` determines whether a referenced tag is locally available.

## Recommended workflow

Define a small template with one registered tag first. Bind public attributes and events only, compile its descriptor, and then compare it with the component reference.

## Next steps

- [XTendRMT overview](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)
