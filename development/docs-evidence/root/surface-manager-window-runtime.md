# SurfaceManager Window Runtime

Contract: `xtend.surface.window-runtime.v1`

`x-surface-manager` and `x-surface-window` form the owned multi-window Surface Runtime for XTend App Shells. The runtime consumes `xtend.surface.controller.v1` snapshots and keeps the DOM, focus stack, loading state and route lifecycle aligned with controller state.

## Runtime Contract

`x-surface-manager` owns registration, active surface state, stack order, focus handoff, route lifecycle and snapshot persistence. `x-surface-window` provides the visible frame and emits `surface-window-command` events back into the manager.

`destroySurface(id, options?)` is the terminal UI workload lifecycle operation. It cancels pending idle, route and visible hydration, invokes owned element cleanup hooks such as `destroy`, `dispose` or `unmount`, removes owned/materialized DOM and emits `surface-destroyed`. Cleanup hook failures are reported through `surface-destroy-error`.

Destroyed surfaces are omitted from normal snapshots. Diagnostic snapshots can include `xtend.surface.tombstone.v1` records with `includeDestroyed: true`.

## Handoff

The window runtime remains WP-SM-03 and hands side-panel-specific behavior to `WP-SM-04`. Lifecycle cleanup stays compatible with RMT resource release and Fabric background cleanup lanes.

Gate:

```bash
node scripts/run_xtend_tests.js surface-manager --json
```
