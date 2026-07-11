# SurfaceManager Migration Guide

This guide migrates an ad-hoc window, panel, or modal into a managed surface. The change remains incremental: domain content and visual design may stay in place while lifecycle, focus, and cleanup move to the controller.

## Inventory current behavior

Before changing code, record open, close, focus, Escape, bounds, persistence, routing, and every listener or timer. Decide whether close hides or permanently destroys the area. Then assign a stable `surface-id`; it does not replace a domain ID, but identifies the lifecycle owner.

## Introduce the host boundary

```html
<x-surface-manager id="workspace" manager-id="product-shell">
  <x-surface-window surface-id="legacy-report" label="Report">
    <div id="legacy-report-host"></div>
  </x-surface-window>
</x-surface-manager>
```

Mount existing content unchanged at first. From this point, open and close it through `openSurface('legacy-report')` and `closeSurface('legacy-report')`. Remove parallel global click or Escape handlers once stack policy and browser smoke prove equivalent behavior.

## Move state ownership

Content-local UI state may remain inside the feature. Visibility, active surface, geometry, and persistence belong to the manager. The router retains canonical URL ownership; a route adapter translates navigation into controller operations. Register resource, chunk, and prewarm handles so `destroySurface()` can release them.

## Verify the migration

```bash
node scripts/run_xtend_tests.js surface-controller surface-manager surface-manager-a11y --json
```

Also test repeated opening, close versus destroy, focus restoration, reduced motion, storage failure, and missing optional content. Remove the old owner only when no duplicate listener, second z-index stack, or separate persistence key remains.

## Common failures

- Two owners write visibility or bounds at the same time.
- A modal closes visually but remains active in the focus stack.
- A random ID suffix hides a duplicate diagnostic.
- Remote failure removes the local fallback.
- Destroy leaves network work, observers, or timers running.

## Next steps

- [Authoring Guide](./surface-manager-authoring-guide.md)
- [Controller](./surface-manager-controller.md)
- [Quality Gates](./surface-manager-quality-gates.md)
