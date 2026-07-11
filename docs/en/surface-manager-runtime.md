# SurfaceManager Runtime

The runtime connects the host-neutral controller to `x-surface-manager`, `x-surface-window`, `x-side-panel`, `x-surface-region`, `x-surface-portal`, and the overlay bridge. Each layer has a distinct responsibility.

## Component roles

`x-surface-manager` discovers declared children, executes controller operations, and publishes lifecycle events. Windows and side panels translate visible state into surface records. Regions mark layout areas; portals identify DOM targets. The overlay bridge brings dialogs, drawers, and popovers into the same focus and stack policy.

`components/xsurfacemanager.js` contains materialization, persistence, layout engine, route lifecycle, and remote policy. The public method and event list is in the [component reference](./components/xsurfacemanager.md).

## Lifecycle

Registration creates a record, mount materializes content, and open makes a surface visible. Focus updates active ownership and stack order. Close hides a reusable surface; destroy removes it permanently and performs cleanup. Persisted snapshots apply only after schema and policy validation.

Lazy content may expose a skeleton state. `hydrateSurfaceContent()` ends it with `surface-content-hydrated` or a visible error or skipped diagnostic. The runtime starts no undocumented network request during render.

## Boundaries

The manager owns layout and lifecycle state, not domain state inside a window. Fabric receives diagnostics and telemetry but does not own the registry. Router adapters may open or close surfaces while remaining responsible for the canonical URL.

A missing capability refuses only the affected operation. Failure in a remote surface must not close local windows; its registered fallback remains active under the same surface ID.

## Continue reading

- [Controller](./surface-manager-controller.md)
- [Window Runtime](./surface-manager-window-runtime.md)
- [Side Panel Runtime](./surface-manager-side-panel-runtime.md)
- [Overlay Bridge](./surface-manager-overlay-bridge.md)
