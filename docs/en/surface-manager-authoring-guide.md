# SurfaceManager Authoring Guide

This tutorial builds a small workbench with one managed window. SurfaceManager owns registry, focus order, layout snapshots, and cleanup; the surface's domain content remains owned by its feature.

## Prerequisites

Load `x-surface-manager` and `x-surface-window` through `components/manifest.json`. Every surface needs a stable `surface-id` so controller records, persistence, and diagnostics continue to identify the same area across renders.

## Declare a surface

```html
<x-surface-manager id="workspace" manager-id="docs-workspace">
  <x-surface-window
    surface-id="activity"
    label="Activity"
    initial-x="24"
    initial-y="24"
    initial-width="520"
    initial-height="340">
    <x-status state="ready" message="No pending work"></x-status>
  </x-surface-window>
</x-surface-manager>
```

After upgrade, the manager registers its child as an `xtend.surface.record.v1`. `open`, `focus`, `move`, `resize`, `minimize`, `restore`, `close`, and `destroy` go through the controller. Direct changes to private window nodes bypass snapshots and diagnostics and are not supported integration points.

## Open and observe it

```js
await customElements.whenDefined('x-surface-manager');

const manager = document.querySelector('#workspace');
manager.addEventListener('surface-opened', ({ detail }) => {
  console.log(detail.surfaceId);
});

manager.openSurface('activity');
console.log(manager.snapshot());
```

`snapshot()` returns registry, active surface, bounds, and lifecycle data. When persistence is enabled, use a host-owned `restore-key`; treat storage failure as a diagnostic rather than registering the surface twice.

## Focus and cleanup

Overlays and modal surfaces take focus and return it to the previous owner after closing. Escape is evaluated by stack policy. `closeSurface()` retains a record for reuse; `destroySurface()` removes it and releases registered prewarm, chunk, and resource handles.

Verify the public path locally:

```bash
node scripts/run_xtend_tests.js surface-controller surface-manager --json
```

## Troubleshooting

- `surface.duplicate` means two elements use the same `surface-id`; resolve ownership instead of creating a random replacement.
- If focus remains behind an overlay, inspect stack policy, the modal flag, and previous focus owner.
- If restored bounds jump, compare `bounds-mode`, `bounds-scope`, and minimum or maximum constraints.
- If network work or timers survive destroy, register their handles with the manager and inspect `surface-destroyed`.

## Next steps

- [SurfaceManager Controller](./surface-manager-controller.md)
- [SurfaceManager Runtime](./surface-manager-runtime.md)
- [Remote Surfaces](./surface-manager-remote-surfaces.md)
- [Migration Guide](./surface-manager-migration-guide.md)
