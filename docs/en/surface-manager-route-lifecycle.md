# SurfaceManager Route Lifecycle

Docs contract: `xtend.docs.surface-manager-route-lifecycle.v1`

`WP-SM-14` binds surfaces to XRouter routes without introducing a second routing or surface registry. XRouter remains the route-state source. SurfaceManager remains the lifecycle source for surfaces.

## Contract

- Route lifecycle: `xtend.surface.route-lifecycle.v1`
- Report: `xtend.surface.route-lifecycle-report.v1`
- XRouter relation: `xtend.rmt.xrouter-adapter.v1`
- Gate: `node scripts/run_xtend_tests.js surface-route-lifecycle --json`

## Manager

Route lifecycles are explicit. A manager reacts only when `route-aware` is set:

```html
<x-surface-manager
  manager-id="app.manager"
  route-aware="true"
  route-lifecycle-policy="open-close">
  ...
</x-surface-manager>
```

`snapshotRouteLifecycle()` returns a report with route state, surface policy, match status and the boundaries `controllerRemainsRegistryTruth`, `xrouterOwnsRouteState` and `createsSecondRegistry: false`.

`applyRouteLifecycle(routeInput, options)` can be used by tests, host adapters or XRouter events. The normal runtime path reacts to `route-changed`, `routechange`, `xrouter-after-navigate`, `xtend-route-changed`, `popstate` and `hashchange`.

## Surface Policies

Surfaces are bound through `data-surface-route` and `data-surface-route-policy`:

| Policy | Match | No match |
|--------|-------|----------|
| `global` | remains unchanged | remains unchanged |
| `open-close` | open/restore and route-hydrate | close |
| `open-collapse` | open/restore/expand and route-hydrate | side panels collapse, windows minimize |
| `open-minimize` | open/restore and route-hydrate | minimize, with collapse fallback |
| `open-keep` | open/restore and route-hydrate | remains open |
| `hydrate-only` | route-hydrate | no lifecycle change |
| `manual` | no automatic change | no automatic change |

Global surfaces, command palettes or persistence surfaces can remain stable across route changes with `data-surface-route-policy="global"` or `data-surface-route-persistent="true"`.

## RMT

RMT-materialized surfaces carry route information as DOM attributes:

- `data-surface-route`
- `data-surface-route-policy`
- `data-surface-hydration-policy="route"` as default when a surface has a route and no explicit hydration policy is set

The RMT kernel imports no XTend types. The adapter materializes only attributes; the runtime decision remains in the SurfaceManager.

## No Competing Lifecycle Sources

Standalone `x-side-panel route-aware` keeps its old fallback. However, as soon as a panel is managed by `x-surface-manager`, it delegates route changes to the manager. Managed surfaces therefore have no competing lifecycle sources.
