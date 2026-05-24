# XTend Loader

The local ES module loader for manifest-based Web Components.

## What it covers

The core layer keeps hosts intentionally simple: one loader, one manifest, public TypeScript surfaces and local modules instead of CDN dependencies.

## Public building blocks

- `xtend-loader.js` as the canonical loader.
- `window.__XTendLoaderBootPromise` for bootstrapping.
- `window.XTendLoader.ensureComponent(tag)` for late loading.

## Recommended workflow

Read the overview, copy the smallest suitable example and add host-specific details only afterwards.

## Next steps

- [Manifest](./manifest.md)
- [API](./api.md)
- [Design Tokens](./design-tokens.md)
