# XTend Fabric

Fabric coordinates lanes, telemetry and runtime diagnostics.

## What it covers

The core layer keeps hosts intentionally simple: one loader, one manifest, public TypeScript surfaces and local modules instead of CDN dependencies.

## Public building blocks

- `createXtendFabric()` for runtime coordination.
- Lanes for visible, idle and diagnostic work.
- Telemetry snapshots without a required external reporter.

## Recommended workflow

Read the overview, copy the smallest suitable example and add host-specific details only afterwards.

## Next steps

- [Manifest](./manifest.md)
- [API](./api.md)
- [XTend Loader](./xtend-loader.md)
- [Design Tokens](./design-tokens.md)
