# XTendRMT Overview

The mental model for declarative app shells, state, actions and surfaces.

## What it covers

XTendRMT is XTend's declarative application layer. Source describes data, user intent, resources, visible surfaces, and scheduling; compiler and runtime execute those records without pulling UI frameworks into the kernel.

## Public building blocks

- `tools/rmt-language/vnext-parser.js` creates the source model.
- `tools/rmt-language/vnext-compiler.js` emits host-neutral core records.
- `xtendrmt/rmt-app-runtime.js` connects core data to explicit host adapters.

## Recommended workflow

Learn template, state, action, and surface first. Exercise a small source in the playground, inspect its core output, and only then attach browser, SSR, or component adapters.

## Next steps

- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)
