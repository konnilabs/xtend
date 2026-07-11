# SurfaceManager Controller

The controller is the host-neutral state model behind `x-surface-manager`. Its public contract is `xtend.surface.controller.v1`. The TypeScript source lives in `src/components/x-surface-manager/surface-controller.ts`; browser output and declarations live in `components/xsurfacemanager-controller.js` and `.d.ts`.

## Record model

Every surface has a stable record containing ID, type, status, bounds, capabilities, lifecycle, and optional persistence metadata. The controller maintains a registry and exactly one active surface. It publishes `xtend.surface.snapshot` records and mirrors state to `xstate` only when the host supplies an adapter.

Windows, side panels, modals, dialogs, drawers, popovers, regions, and other types receive different default capabilities. A tooltip cannot be maximized implicitly, for example. Additional capabilities are registered explicitly; disabled capabilities remain blocked.

## Operations and lanes

`registerSurface`, `openSurface`, `focusSurface`, `closeSurface`, `destroySurface`, `moveSurface`, `resizeSurface`, and `snapshot` return structured operation results. Interaction uses the `user-blocking` lane, geometry changes use `transition`, snapshots use `diagnostics`, and cleanup uses `background`.

The controller changes no DOM. The component interprets successful results and updates the corresponding element. This allows the same state logic to run in tests without a browser.

## Failure behavior

Missing IDs, duplicates, unknown records, and disallowed operations produce diagnostics tied to manager, surface, and operation. A failure must not leave a partially changed registry. `destroySurface` returns an `xtend.surface.tombstone.v1` record, clears active ownership, and releases known handles.

Hosts should inspect `ok` and forward diagnostics to Fabric. Private maps and z-index counters are not public API; use `snapshot()` for observation and reproducibility.

## Related pages

- [Authoring Guide](./surface-manager-authoring-guide.md)
- [Runtime](./surface-manager-runtime.md)
- [Stack Policy](./surface-manager-stack-policy.md)
