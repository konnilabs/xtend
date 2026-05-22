# RMT Surface Resource Graph Runtime

- Contract: `xtend.epic18.rmt-surface-resource-graph-runtime.v1`
- Gate: `node scripts/run_xtend_tests.js rmt-surface-resource-graph-runtime --json`
- Workpackage: `WP-E18-10`
- Handoff: `WP-E18-11`

## Goal

The Surface Resource Graph Runtime makes dynamic app layouts modelable in RMT as a generic platform capability. Developers can create their own surface models from arbitrary records, manage bounds and focus, stack overlays through portals and clean up instance-owned resources without writing a product-local registry or shell-specific repaint logic.

The Media Manager remains only a proof of need. The runtime knows no product surface list and imports no XTend components.

## Keyed Surface Repeater

`surface` definitions can declare `source`, `repeat` and `key`. The runtime creates stable surface instances such as `surface.workspace:alpha` from this. When materializing again with the same keys, runtime state, bounds, focus order, resource status and persistence data are preserved.

Important operations:

- `materialize(recordsBySource)`: creates or reuses surface instances.
- `openSurface(id)`: opens an instance and acquires its resources.
- `minimizeSurface(id)`: minimizes without discarding DOM or resource state.
- `restoreSurface(id)`: restores bounds and open state.
- `closeSurface(id)`: closes by policy without necessarily destroying.
- `destroySurface(id)`: releases instance-owned resources and detaches the event owner.

## Portal Layer Stack

Portals describe layer and policy boundaries for tooltips, toasts, popovers, lightboxes, menus, dialogs and other overlay kinds. `openOverlay` places overlay instances in their portal and assigns a stable stack order through `zIndexStart` and `zStep`. `closeTopOverlay` closes the topmost dismissible overlay entry per portal or globally.

The portal policy is generic:

- `stacked` for normal app surfaces.
- `modal` and `nonmodal` for blocking and non-blocking overlays.
- `toast-region` for feedback layers.
- `clipping-escape` for viewport-fixed layers such as tooltips.

## Resource Ownership

Resources are injected through the WP-E18-08 Resource Manager. The surface runtime has no own adapters, but calls `acquireMany` and `releaseOwner` per surface or overlay instance.

This creates clear rules:

- Minimize preserves resources and component state.
- Close can optionally release resources.
- Destroy releases resources of the affected instance.
- Overlay close releases overlay resources.
- Destroying a surface additionally calls `eventRuntime.detachOwner(owner)`.

## Persistence

`persistSnapshot` returns a snapshot with surface state, bounds, focus, open overlays and portal metadata. An optional persistence adapter can store this snapshot. `hydrateSnapshot` later plays it back into already materialized instances.

## Boundaries

- No product surface taxonomy as framework default.
- No product-local registry repaint obligation.
- No XTend component imports in the RMT kernel.
- Normal UI stays with DOM descriptors and component templates; HTML string renderers remain a separate Trusted DOM boundary.

## Gates

```bash
node scripts/run_xtend_tests.js rmt-surface-resource-graph-runtime --json
node scripts/run_xtend_tests.js rmt-app-platform-authoring rmt-dom-descriptor-renderer rmt-component-template-primitives rmt-state-selector-runtime rmt-action-effect-runtime rmt-event-routing-runtime rmt-surface-resource-graph-runtime --json
```

`WP-E18-11` builds on this with Scaffold, linter, LSP and diagnostics so surface, overlay, portal and resource graphs become visible and checkable already during authoring.
