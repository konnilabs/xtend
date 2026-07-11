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

## Policy Goals

The Stack Policy is the part of the Surface Manager that turns many visible areas into an operable app. Windows, panels, modals, dialogs and short-lived overlays can exist at the same time. Without a shared policy they would set competing Escape handlers, scroll locks, focus targets and z-values. `xtend.surface.stack-policy.v1` defines which surface is on top, which surface behaves as modal, when background regions become inert and where focus returns after close.

The policy is intentionally manager-owned. Individual components keep their local semantics, but they do not make global decisions for the rest of the app. A modal can report that it is blocking. A panel can report that it is visible as an overlay. A window can report that it wants to become active. The manager turns those signals into an order so the host, the browser and assistive technology all see the same structure.

## Modality And Focus

`modal-policy` decides whether only the top surface is modal or whether a defined set of surfaces blocks interaction. That decision affects `aria-hidden`, inert, scroll lock and Escape. Focus moves to a useful target inside the active surface on open and returns to the previous source on close. If that source no longer exists, the runtime needs a stable fallback such as the triggering controller or the next active surface.

Escape acts on the topmost layer. A key press must not close a deep window while a dialog sits above it. A toast must not steal the focus path of a modal surface. These rules are small but important for real app shells: users need to predict which layer they are operating, and tests need to reproduce the same layer.

## Release Review

Reviewers check stack changes against three risks. First, did a global decision move into an individual component? Second, can two surfaces both become topmost? Third, are orphaned locks, inert markers or focus targets left behind after close? The `surface-stack-policy` gate covers these risks locally and makes the main policy decisions visible in the report.

New layer tokens, modality modes or Escape rules need evidence. They are not accepted through CSS or a new attribute alone. A good change describes the record, the policy decision and the visible effect. That keeps the Surface Stack predictable when Workbench, Side Panel and Overlay Bridge run in the same app.

## Related reading

The controller contract identifies which surface transitions invoke stack policy. [Related article](./surface-manager-controller.md)
