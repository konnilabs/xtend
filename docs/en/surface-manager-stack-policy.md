# SurfaceManager Stack Policy

Contract: `xtend.surface.stack-policy.v1`

The Stack Policy belongs to `x-surface-manager`. It coordinates modality, Focus Restore, Inert, Escape, Scroll Lock and Layer Tokens for windows, panels and overlays.

## Policy

- `modal-policy` decides whether only the top Surface or multiple Surfaces behave as modal.
- Focus Restore returns focus to the previous source after close.
- Inert and `aria-hidden` isolate background Surfaces.
- Escape acts on the topmost Surface.
- Scroll Lock is tied to active modal Surfaces.
- The runtime creates no second registry.

## Gate

```bash
node scripts/run_xtend_tests.js surface-stack-policy --json
```

