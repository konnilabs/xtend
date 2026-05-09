# XTend Route Fiber Instrumentierung

- Status: Accepted
- Contract: `xtend.fabric.route-fiber-instrumentation.v1`
- Runtime: `fabric/xtend-fabric.js`
- Gate: `tests/fabric/fabric_route_fiber_suite.js`
- Paket: `ER-WP-15`

## Entscheidung

XTend-Fabric fuehrt ab `ER-WP-15` eine eigene Route-Fiber-Instrumentierung ein. Diese Schicht macht XRouter Navigation und Route Render als lokale `xtend.fabric.fiber.v1` Records sichtbar, ohne XRouter fest an XTendRMT zu binden und ohne den RMT Kernel in Fabric zu importieren.

Die Grenze bleibt:

- XRouter bleibt Router und Custom-Element-Host.
- Fabric erzeugt Safety-, Correlation-, Lane-, Diagnostic- und Schedule-Hints.
- XTendRMT kann die erzeugten `scheduleRef` und `endpointNameHint` Felder als Scheduler-/Adapter-Signal nutzen.
- Framework-fremde Hosts koennen dieselbe Route-Fiber-API fuer eigene Router verwenden.

## API

```js
const fabric = window.XTendFabric.createXtendFabric();
const routeFibers = fabric.createRouteFiberInstrumentation('xtend.xrouter', {
  scope: 'x-router#shell',
  adapterRef: 'xtendrmt.xrouter',
  hostRef: 'app-shell'
});

routeFibers.navigate(() => router.navigate('/settings'), {
  from: '/',
  to: '/settings',
  routeId: 'settings'
});

await routeFibers.render(() => router._renderRoute(match, outlet), {
  routeRef: '/settings',
  componentRef: 'x-settings'
});
```

Die Factory stellt bereit:

| API | Zweck |
|-----|-------|
| `createFiberInput(operation, metadata)` | erzeugt geplante Fiber-Eingaben ohne Ausfuehrung |
| `runOperation(operation, task, metadata)` | fuehrt eine benannte Route-Operation als Fiber aus |
| `navigate(task, metadata)` | fuehrt Navigation als `route.navigate` Fiber aus |
| `render(task, metadata)` | fuehrt Route Render als `route.render` Fiber aus |

## Operation Profiles

| Operation | Fiber Kind | Default Lane | ScheduleRef | Endpoint Hint |
|-----------|------------|--------------|-------------|---------------|
| `navigate` | `route.navigate` | `user-blocking` | `ui.user-blocking.input` | `xtendrmt.ui.user-blocking` |
| `render` | `route.render` | `transition` | `route.transition.render` | `xtendrmt.route.render` |

`render` kann fuer sichtbare Sofortarbeit per Override auf `visible` und `route.visible.render` gesetzt werden. `navigate` bleibt bewusst `user-blocking`, weil der Nutzerpfad nicht durch Hintergrundarbeit verdeckt werden darf.

## Fiber-Felder

Route-Fibers enthalten mindestens:

- `schema: xtend.fabric.fiber.v1`
- `kind`
- `lane`
- `phase`
- `source: router`
- `scope`
- `routeRef`
- `componentRef`
- `scheduleRef`
- `endpointNameHint`
- `correlationId`
- `durationMs`
- `result`
- `diagnostics`

Die Metadata traegt:

- `routeFiberInstrumentation: xtend.fabric.route-fiber-instrumentation.v1`
- `operation`
- `router`
- `routeId`
- `path`
- `from`
- `to`
- `params`
- `query`
- `adapterRef`
- `hostRef`
- `backpressureSignal`

Sensitive Felder wie `token`, `secret`, `authorization`, `cookie`, `header`, `query` und DOM Nodes werden vor Speicherung im Fiber Store redigiert.

## Diagnostics

Fehler werden nicht still verschluckt, ausser `swallowErrors: true` ist explizit gesetzt.

| Operation | Diagnostic Code |
|-----------|-----------------|
| `navigate` | `xtend.fabric.route.navigate.failed` |
| `render` | `xtend.fabric.route.render.failed` |

Diagnostics enthalten `routeRef`, `scheduleRef`, `lane`, `correlationId`, `fiberId` und eine redigierte `cause`. Opt-in Reporter erhalten nur redigierte Events.

## XRouter-Integration

XRouter bleibt unveraendert instrumentierbar:

- `navigate(to, options)` bildet die Runtime-Navigation ab.
- `_handleNavigation()` bleibt die Boundary fuer Pfad-Matching, Guards und Render-Orchestrierung.
- `_renderRoute(match, container)` bleibt die Render-Boundary fuer Route-Komponenten.
- `router-navigate` bleibt als `xstate`/RMT-Adapter-Signal erhalten.

ER-WP-15 veraendert diese XRouter-Verantwortung nicht. Es stellt stattdessen die Fabric-API bereit, mit der XRouter-Adapter, RMT-Bridges oder App-Shells Navigation und Render korrelieren koennen.

## RMT-Grenze

Fabric importiert keinen RMT Kernel. `scheduleRef` und `endpointNameHint` sind nur Hinweise fuer Hosts oder Adapter:

- `ui.user-blocking.input` fuer Navigation
- `route.transition.render` fuer normalen Route Render
- `route.visible.render` fuer sichtbare Render-Overrides
- `xtendrmt.ui.user-blocking` und `xtendrmt.route.render` als Endpoint-Hints

Dadurch bleibt XTendRMT framework-agnostisch und XTend UI wird trotzdem als First-Class-Host vorbereitbar.

## Handoff

| Paket | Status | Zweck |
|-------|--------|-------|
| `ER-WP-11` | completed | Fabric ist an `xstate`, API und XTendRMT Diagnostics angebunden |
| `ER-WP-16` | completed | Telemetry Snapshots und Backpressure beziehen Route-Fibers ein |
| `ER-WP-18` | completed | Loader- und Hydration-Messpunkte koennen Route-Fibers korrelieren |

## Gates

```bash
node scripts/run_xtend_tests.js fabric-route-fibers --json
npm run test:fabric-route-fibers
node scripts/run_xtend_tests.js references --json
```
