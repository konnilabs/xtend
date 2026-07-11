# x-surface-window

`x-surface-window` is the public managed-window element for `xtend.surface.record.v1`.

## Stable API

`toSurfaceRecord(managerId)` returns a SurfaceManager-compatible record. `applySurfaceSnapshot(record)` applies controller state to the visible window frame.

The element sends user intent through `surface-window-command` instead of mutating manager state directly. The manager decides whether commands map to open, close, focus, minimize, maximize, restore or destroy operations.

Gate:

```bash
node scripts/run_xtend_tests.js surface-manager --json
```
