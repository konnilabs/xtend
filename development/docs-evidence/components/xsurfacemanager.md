# x-surface-manager

`x-surface-manager` is the public Web Component for the `xtend.surface.manager.v1` runtime. It consumes `xtend.surface.controller.v2`, hosts windows, panels and overlays, and exposes lifecycle events for product shells and RMT materialization.

## Stable API

Methods:
- `registerSurface(surface)`
- `openSurface(id, input?)`
- `closeSurface(id, reason?)`
- `destroySurface(id, options?)`
- `snapshot(options?)`
- `readSnapshot(options?)`

Events:
- `surface-manager-ready`
- `surface-registered`
- `surface-opened`
- `surface-closed`
- `surface-destroyed`
- `surface-destroy-error`
- `surface-layout-changed`

`destroySurface` is terminal for the current generation. The manager cancels pending hydration, releases internal loading, route, focus and stack state, calls owned cleanup hooks and keeps diagnostics through `xtend.surface.tombstone.v1`. Normal snapshots stay active-only; `snapshot({ includeDestroyed: true })` includes tombstones.

Gate:

```bash
node scripts/run_xtend_tests.js surface-manager --json
```
