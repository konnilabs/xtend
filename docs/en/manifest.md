# Manifest

The component manifest describes which XTend modules a host may load.

## What it covers

The core layer keeps hosts intentionally simple: one loader, one manifest, public TypeScript surfaces and local modules instead of CDN dependencies.

## Public building blocks

- `components/manifest.json` as the local registry.
- `data-manifest` am Loader.
- `meta name="xtend-preload"` for critical components.

## Recommended workflow

Read the overview, copy the smallest suitable example and add host-specific details only afterwards.

## Next steps

- [API](./api.md)
- [XTend Loader](./xtend-loader.md)
- [Design Tokens](./design-tokens.md)
