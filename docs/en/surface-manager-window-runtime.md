# SurfaceManager Window Runtime

Contract: `xtend.surface.window-runtime.v1`

`x-surface-manager` and `x-surface-window` form the owned Multi-Window Surface Runtime for XTend App Shells.

Gate:

```bash
node scripts/run_xtend_tests.js surface-manager --json
```

## Runtime Contract

The Window Runtime is the owned layer for free-positioned surfaces inside an XTend App Shell. `x-surface-manager` owns registration, active window state, stack order, focus handoff and snapshot data. `x-surface-window` provides the visible frame: title, region, slot content, state, resize signals and move signals. The two components belong together. A window without the manager loses orchestration, and a manager without window records cannot prove a usable multi-window app.

The `xtend.surface.window-runtime.v1` contract separates authoring from runtime. RMT describes that a surface exists, which resource it shows and which actions are allowed. The runtime decides how windows are registered, activated, minimized, restored or closed. This separation matters because RMT should not import DOM classes or XTend types. The host remains the owner of the concrete custom elements.

Window chrome sends user intent through `surface-window-command`; it does not mutate the registry directly. `destroySurface()` is terminal for the current generation: the manager cancels owned loading and hydration work, removes materialized DOM, emits `surface-destroyed` and retains an `xtend.surface.tombstone.v1` record only for diagnostics. Use close when a surface should be reusable and destroy when its resources must be released.

## Authoring Rules

A window record needs a stable id, a readable title, a surface type and state that fits into the manager snapshot. Actions such as `activate`, `close`, `focus` and `restore` are treated as events, not as direct DOM manipulation. When a host creates a window from RMT, it should validate the record first and then pass it to `x-surface-manager`. The manager can derive stack values, the active surface and the focus target from that record.

Windows should not be used as a general overlay solution. Modality, background inertness and Escape policy belong to the Stack Policy, not to individual windows. A window can own its internal focus path, but it does not decide alone whether the rest of the app becomes inert. That boundary prevents conflicts with `x-modal`, `x-dialog`, side panels and the Overlay Bridge.

## Evidence And Failure Modes

The `surface-manager` gate checks that window records are registered, activation is observable and snapshot data remains stable. Common failures are duplicate ids, a window without a title, a lost focus-restore target or an action that only affects the DOM and never reaches manager state. Those failures are release-relevant because multi-window apps become hard to reproduce without a reliable manager snapshot.

A change to `x-surface-window` is accepted when it strengthens the manager record and does not introduce a second registry. Manual HTML renderers, unnamespaced global helpers and framework-specific shortcuts are blocked. The Window Runtime remains a Native-First surface that RMT can describe but the XTend host executes.

## Related reading

The controller contract defines the commands and snapshots consumed by window surfaces. [Related article](./surface-manager-controller.md)
