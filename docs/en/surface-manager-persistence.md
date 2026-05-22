# SurfaceManager Persistence

`x-surface-manager` can save surface layouts under a `restore-key` and restore them through the SurfaceController on the next start.

## Attributes

| Attribute | Values | Purpose |
| --- | --- | --- |
| `restore-key` | string | Stable key for the app-shell layout |
| `persistence-mode` | `none`, `memory`, `session`, `local` | Storage backend for snapshots |
| `restore-policy` | `auto`, `manual`, `reset` | Auto-restore on connect or manual control |

Without `restore-key`, persistence stays disabled. With `restore-key` and no explicit `persistence-mode`, the runtime uses `session`.

## API

- `snapshotPersistence()` returns the active persistence contract.
- `persistSnapshot(snapshot, options)` stores a layout-only snapshot.
- `restorePersistedSnapshot(options)` reads and hydrates a stored snapshot.
- `clearPersistedSnapshot(options)` removes the stored snapshot.
- `resetSurfaceLayout(options)` clears persistence and registers the declared surface elements again.

The stored format is `xtend.surface.persisted-snapshot.v1`. Content payloads are not persisted; surface IDs, bounds, stack, active surface, panel modes, status and content refs are preserved.

## Boundaries

- The SurfaceController remains the only source of registry truth.
- Restore runs through controller operations, not by directly mutating a second registry.
- Invalid or incompatible snapshots lead to a controlled skip with diagnostics.
- The RMT kernel imports no XTend components.
