# ER-WP-15 - Route Render und XRouter Navigation als Fibers instrumentieren

- Status: `completed`
- Contract: `xtend.enterprise.er-wp-15.route-fiber-instrumentation.v1`
- Runtime Contract: `xtend.fabric.route-fiber-instrumentation.v1`
- Roadmap: `ROADMAP-XTend-Enterprise-Reife.md`
- Umsetzung: `fabric/xtend-fabric.js`
- Gate: `tests/fabric/fabric_route_fiber_suite.js`

## Ziel

Navigation und Route Render sind ab diesem Paket als korrelierbare Fabric-Fibers modelliert. XRouter bleibt dabei Router und Render-Host; Fabric stellt die messbare Route-Fiber-Schicht bereit. XTendRMT kann diese Arbeit ueber `scheduleRef` und `endpointNameHint` schedulen, ohne dass Fabric den RMT Kernel importiert.

## Umgesetzte Artefakte

| Artefakt | Status | Ergebnis |
|----------|--------|----------|
| `fabric/xtend-fabric.js` | completed | `createRouteFiberInstrumentation` und `ROUTE_FIBER_OPERATION_PROFILES` implementiert |
| `development/XTend-Route-Fiber-Instrumentierung.md` | completed | akzeptierter Contract fuer Route-Fiber-Instrumentierung |
| `tests/fabric/fabric_route_fiber_suite.js` | completed | Gate fuer Navigation, Render, Diagnostics, Redaction und RMT-Grenze |
| `scripts/run_xtend_tests.js` | completed | Suite `fabric-route-fibers` registriert |
| `package.json` | completed | Script `npm run test:fabric-route-fibers` ergaenzt |
| `docs/xtend-fabric.md` | completed | Entwicklerdoku um Route-Fibers erweitert |
| `tests/fabric/README.md` | completed | Fabric-Testuebersicht aktualisiert |

## Operation Profiles

| Operation | Fiber Kind | Lane | ScheduleRef | Endpoint Hint | Fehlercode |
|-----------|------------|------|-------------|---------------|------------|
| `navigate` | `route.navigate` | `user-blocking` | `ui.user-blocking.input` | `xtendrmt.ui.user-blocking` | `xtend.fabric.route.navigate.failed` |
| `render` | `route.render` | `transition` | `route.transition.render` | `xtendrmt.route.render` | `xtend.fabric.route.render.failed` |

`render` akzeptiert sichtbare Overrides mit `lane: "visible"` und `scheduleRef: "route.visible.render"`.

## XRouter-/RMT-Boundary

Die Umsetzung beruehrt XRouter nicht direkt. Die bestehende XRouter-Oberflaeche bleibt die Integrationskante:

- `navigate(to, options = {})`
- `async _handleNavigation()`
- `async _renderRoute(match, container)`
- `router-navigate` als `xstate`/RMT-Adapter-Signal

Fabric erzeugt korrelierbare Fibers fuer diese Grenzen. XTendRMT wird nicht importiert und bleibt Scheduler/Kernel. Die RMT-Anbindung erfolgt ueber:

- `scheduleRef`
- `endpointNameHint`
- `routeRef`
- `correlationId`
- `backpressureSignal`

## Abnahme

- `createRouteFiberInstrumentation(routerRef, options)` ist auf Fabric-Instanzen verfuegbar.
- Navigation erzeugt `route.navigate` Fibers mit `user-blocking` Lane.
- Route Render erzeugt `route.render` Fibers mit `transition` Lane.
- RMT Schedule-Hints sind stabil: `ui.user-blocking.input`, `route.transition.render`, `route.visible.render`.
- Fehler erzeugen `xtend.fabric.route.navigate.failed` oder `xtend.fabric.route.render.failed`.
- Metadata wird redigiert.
- Der Gate stellt sicher, dass kein `rmt-runtime` importiert wird.

## Validierung

```bash
node scripts/run_xtend_tests.js fabric-route-fibers --json
node scripts/run_xtend_tests.js references --json
npm test
```

## Handoff

| Paket | Status | Notiz |
|-------|--------|-------|
| `ER-WP-11` | completed | Fabric ist an `xstate`, API und XTendRMT Diagnostics angebunden |
| `ER-WP-16` | completed | fuehrt Telemetry Snapshots und Backpressure aus Component-/Route-Fibers und Runtime-Diagnostics zusammen |
| `ER-WP-18` | completed | Loader-/Hydration-Messpunkte korrelieren mit Route-Fibers |

`ER-WP-15` ist abgeschlossen.
