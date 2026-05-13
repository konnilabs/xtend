# SurfaceManager Route Lifecycle

Docs Contract: `xtend.docs.surface-manager-route-lifecycle.v1`

`WP-SM-14` bindet Surfaces an XRouter-Routen, ohne eine zweite Routing- oder Surface-Registry einzufuehren. XRouter bleibt Route-State-Quelle. SurfaceManager bleibt Lifecycle-Quelle fuer Surfaces.

## Contract

- Route Lifecycle: `xtend.surface.route-lifecycle.v1`
- Report: `xtend.surface.route-lifecycle-report.v1`
- XRouter Bezug: `xtend.rmt.xrouter-adapter.v1`
- Gate: `node scripts/run_xtend_tests.js surface-route-lifecycle --json`

## Manager

Route-Lifecycles sind explizit. Ein Manager reagiert nur, wenn `route-aware` gesetzt ist:

```html
<x-surface-manager
  manager-id="app.manager"
  route-aware="true"
  route-lifecycle-policy="open-close">
  ...
</x-surface-manager>
```

`snapshotRouteLifecycle()` liefert einen Report mit Route-State, Surface-Policy, Match-Status und den Boundaries `controllerRemainsRegistryTruth`, `xrouterOwnsRouteState` und `createsSecondRegistry: false`.

`applyRouteLifecycle(routeInput, options)` kann von Tests, Host-Adaptern oder XRouter-Events genutzt werden. Der normale Runtime-Pfad reagiert auf `route-changed`, `routechange`, `xrouter-after-navigate`, `xtend-route-changed`, `popstate` und `hashchange`.

## Surface Policies

Surfaces werden ueber `data-surface-route` und `data-surface-route-policy` gebunden:

| Policy | Match | Kein Match |
|--------|-------|------------|
| `global` | bleibt unveraendert | bleibt unveraendert |
| `open-close` | open/restore und route-hydrate | close |
| `open-collapse` | open/restore/expand und route-hydrate | SidePanels collapse, Windows minimize |
| `open-minimize` | open/restore und route-hydrate | minimize, mit Collapse-Fallback |
| `open-keep` | open/restore und route-hydrate | bleibt offen |
| `hydrate-only` | route-hydrate | kein Lifecycle-Wechsel |
| `manual` | kein automatischer Wechsel | kein automatischer Wechsel |

globale Surfaces, Command Palettes oder Persistenz-Surfaces koennen mit `data-surface-route-policy="global"` oder `data-surface-route-persistent="true"` routewechselstabil bleiben.

## RMT

RMT-materialisierte Surfaces tragen Route-Informationen als DOM-Attribute:

- `data-surface-route`
- `data-surface-route-policy`
- `data-surface-hydration-policy="route"` als Default, wenn eine Surface eine Route besitzt und keine explizite Hydration-Policy gesetzt ist

Der RMT Kernel importiert keine XTend-Typen. Der Adapter materialisiert nur Attribute; die Runtime-Entscheidung bleibt im SurfaceManager.

## Keine konkurrierenden Lifecycle-Quellen

Standalone `x-side-panel route-aware` behaelt seinen alten Fallback. Sobald ein Panel aber von `x-surface-manager` verwaltet wird, delegiert es Routewechsel an den Manager. Damit gibt es fuer verwaltete Surfaces keine konkurrierenden Lifecycle-Quellen.
