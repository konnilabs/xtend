# SurfaceManager Controller

Contract: `xtend.surface.controller.v2`

The SurfaceManager Controller is the DOM-free state engine behind `x-surface-manager`. It lives in `components/xsurfacemanager-controller.js`, mirrors state into `xtend.surface.snapshot`, emits diagnostics and stays outside the RMT kernel boundary.

## Runtime Contract

The controller owns registration, focus, stacking, layout state and lifecycle diagnostics. `registerSurface` adds a declarative surface record, while `openSurface`, `closeSurface`, `focusSurface`, `moveSurface`, `resizeSurface`, `materializeSurface` and `toggleSurface` mutate the active runtime state.

`destroySurface(surfaceRef, options?)` is the terminal lifecycle operation. It releases the current surface generation, removes it from normal snapshots and keeps a small diagnostic tombstone using `xtend.surface.tombstone.v1`. Diagnostic snapshots can opt into those records with `snapshot({ includeDestroyed: true })`.

## Lifecycle Rules

- `closeSurface` remains reversible.
- `destroySurface` is idempotent for the same generation.
- `openSurface` refuses a destroyed generation unless `recreate: true` is supplied.
- A recreated surface receives a new `generation` and no inherited tombstone.
- Destroy diagnostics use the `background` lane so visible detach work and later cleanup stay observable.

## Handoff

This controller is the WP-SM-02 contract and hands visible runtime behavior to `WP-SM-03`. The window runtime must keep the same controller schema, operation result schema and snapshot semantics.

Gate:

```bash
node scripts/run_xtend_tests.js surface-controller --json
```
