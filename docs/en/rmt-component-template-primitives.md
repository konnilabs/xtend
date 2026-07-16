# RMT Component Template Primitives

Template primitives for reusable component-oriented UI structures.

Contract schema: `xtend.epic18.rmt-component-template-primitives.v1`

## What it covers

Component template primitives describe reusable UI structures as declarative records. They bind a known custom-element tag, properties, slots, and events without importing component classes into the RMT kernel.

The primitive vocabulary includes `component`, props, attributes, public parts and slots, conditional or repeated content, static class tokens and `style-token` mappings. A `style-token` maps an approved semantic token to a custom property without exposing arbitrary inline styles.

## Public building blocks

- `tests/fixtures/rmt-component-template-primitives.rmt` contains the supported primitives.
- `tests/fixtures/rmt-component-template-primitives.core.json` shows their core representation.
- `components/manifest.json` determines whether a referenced tag is locally available.

The generic component path applies equally to small helpers such as `x-tooltip`, form controls such as `x-select`, and the shell components used by XTend Material. Recipes compose these public contracts and never inspect a component Shadow Root.

## Recommended workflow

Define a small template with one registered tag first. Bind public attributes and events only, compile its descriptor, and then compare it with the component reference.

`WP-E18-07` builds typed state selectors on the same descriptor and capability foundation.

## Next steps

- [XTendRMT overview](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)
