# SurfaceManager Stack Policy

As of `WP-SM-15`, `x-surface-manager` owns the `xtend.surface.stack-policy.v1` contract for mixed surface stacks made of windows, side panels, dialogs, modals and drawers.

## Goal

`modal-policy` is evaluated productively at manager level. The SurfaceController remains the registry source while the manager applies the UI-close stack policy to existing XTend components:

- `snapshotStackPolicy()` returns the current report `xtend.surface.stack-policy-report.v1`.
- `applyStackPolicy()` applies layer tokens, active modality, inert, `aria-hidden`, `aria-modal`, focus trap, focus restore, Escape priority and scroll lock.
- existing overlay components keep their local APIs and focus/Escape implementations.

## Modal Policies

| Policy | Effect |
|--------|--------|
| `topmost` | the topmost modal surface receives active modality |
| `none` | no manager modality, no inert or scroll-lock rule |
| `all-modal` | every open surface can be treated as modal; the topmost one is active |
| `surface-modal` | all surfaces declared as modal are recognized; the topmost modal surface is active |

## Runtime Rules

- Focus restore: when a modal surface is activated, the manager remembers the previous focus target and restores it after close.
- Inert: background surfaces receive `data-surface-inert="manager"`, `inert` and `aria-hidden` while an active modal surface exists.
- Escape: a document-wide capture handler closes the active modal surface or otherwise the topmost closable surface.
- Scroll lock: active modality sets `data-xtend-surface-scroll-lock` on `html` and `body`.
- Layer tokens: every surface receives `data-surface-layer-token`, `--surface-layer-z` and compatible component z variables.
- Diagnostics: missing labels, missing focus targets and modality below non-modal surfaces become visible in the stack-policy report.

## Boundary

The stack policy is a supporting XTend UI layer. It creates no second registry, replaces neither Fabric nor the RMT kernel, and does not change SurfaceController truth. RMT can declare `modal-policy`, but the runtime decision remains with `x-surface-manager`.

Local gate:

```bash
node scripts/run_xtend_tests.js surface-stack-policy --json
```
