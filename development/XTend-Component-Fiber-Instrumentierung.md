# XTend Component Fiber Instrumentierung

- Status: Accepted
- Datum: 6. Mai 2026
- Contract: `xtend.fabric.component-fiber-instrumentation.v1`
- Fiber Contract: `xtend.fabric.fiber.v1`
- Lane Mapping: `xtend.fabric.rmt-lane-mapping.v1`
- Roadmap-Paket: `ER-WP-14`
- Runtime: `fabric/xtend-fabric.js`
- Gate: `tests/fabric/fabric_component_fiber_suite.js`

## Zweck

Dieser Contract macht Component Mount, Hydration und Loader-Preload in `XTend-Fabric` als messbare, schedulable und diagnostizierbare Fibers sichtbar.

Die Instrumentierung ist Host-nah und framework-agnostisch:

- XTend UI und XTendRMT werden nicht ineinander eingebettet.
- Fabric fuehrt lokale Component- oder Adapter-Arbeit aus.
- RMT sieht nur `scheduleRef`, `endpointNameHint`, Lane- und Budgetfelder.
- Der RMT Kernel wird nicht importiert und kennt keine XTend-Komponenten.

## Runtime API

```js
const fabric = window.XTendFabric.createXtendFabric();
const componentFibers = fabric.createComponentFiberInstrumentation('x-alert', {
  scope: 'x-alert#primary',
  routeRef: '/alerts',
  correlationId: 'route.alerts'
});

componentFibers.mount(() => document.createElement('x-alert'));
await componentFibers.hydrate((fiber) => element.hydrate(model, { fiber }));
componentFibers.preload(() => import('/components/xalert.js'));
```

Die Factory gibt ein Objekt mit stabilem Schema zurueck:

```text
xtend.fabric.component-fiber-instrumentation.v1
```

| API | Zweck |
|-----|-------|
| `createFiberInput(operation, metadata)` | erzeugt einen planbaren Fiber-Input ohne Ausfuehrung |
| `runOperation(operation, task, metadata)` | fuehrt beliebige Component-nahe Operation als Fiber aus |
| `mount(task, metadata)` | fuehrt Custom-Element-Mount als `component.mount` aus |
| `hydrate(task, metadata)` | fuehrt Adapter-/Host-Hydration als `component.hydrate` aus |
| `preload(task, metadata)` | fuehrt Loader-Preload als `loader.module` aus |

## Operation Profiles

| Operation | Fiber Kind | Default Lane | Default Schedule | Endpoint Hint |
|-----------|------------|--------------|------------------|---------------|
| `mount` | `component.mount` | `visible` | `component.visible.mount` | `xtendrmt.component.mount` |
| `hydrate` | `component.hydrate` | `idle` | `component.idle.hydrate` | `xtendrmt.component.hydrate` |
| `preload` | `loader.module` | `visible` | `component.visible.mount` | `xtendrmt.component.mount` |

Hydration nutzt bewusst `idle` als Default, weil Adapter-Hydration oft bestehendes Markup aktiviert und nicht die erste sichtbare Ausgabe blockieren soll. Sichtbare Hydration bleibt explizit moeglich:

```js
componentFibers.hydrate(() => element.hydrate(model), {
  lane: 'visible',
  scheduleRef: 'component.visible.hydrate'
});
```

## Fiber-Ergebnis

Jeder abgeschlossene Mount-/Hydration-/Preload-Lauf erzeugt einen `xtend.fabric.fiber.v1` Record mit mindestens:

- `kind`
- `lane`
- `phase`
- `status`
- `componentRef`
- `scheduleRef`
- `endpointNameHint`
- `startedAt`
- `endedAt`
- `durationMs`
- `result`
- `diagnostics`

Fehler erzeugen lokale Diagnostics mit operationsspezifischen Codes:

| Operation | Diagnostic Code |
|-----------|-----------------|
| `mount` | `xtend.fabric.component.mount.failed` |
| `hydrate` | `xtend.fabric.component.hydrate.failed` |
| `preload` | `xtend.fabric.component.preload.failed` |

Diagnostics tragen `componentRef`, `fiberId`, `lane`, `scheduleRef`, `correlationId` und redigierte Metadata. Opt-in Reporter erhalten dieselben redigierten Diagnostics.

## Boundary

Die Instrumentierung ist keine Error Boundary per Default. Fehler werden aufgezeichnet und danach an den Caller weitergereicht. Hosts koennen explizit `swallowErrors: true` setzen:

```js
const safeFibers = fabric.createComponentFiberInstrumentation('x-safe', {
  swallowErrors: true,
  fallbackValue: undefined
});
```

Die Component Lifecycle Error Boundary aus `xtend.fabric.lifecycle-error-boundary.v1` bleibt fuer Lifecycle-Methoden und Event Handler zustaendig. `ER-WP-14` ergaenzt sie um explizite Host-/Adapter-Fibers fuer Mount, Hydration und Preload.

## RMT-Grenze

Erlaubt:

- `scheduleRef` fuer bestehende RMT Schedule Policies setzen
- `endpointNameHint` fuer Host Scheduler oder XTendRMT Adapter weiterreichen
- `routeRef`, `componentRef`, `correlationId` und `coalesceKey` sichtbar halten
- `component.idle.hydrate` und `component.visible.mount` als Default-Policies vorbereiten

Nicht erlaubt:

- RMT Kernel importieren
- `.rmt` Dokumente in Fabric parsen
- XTend-Komponenten im RMT Kernel ausfuehren
- externe Telemetry ohne opt-in Reporter senden

## Handoff

| Folgepaket | Status | Handoff |
|------------|--------|---------|
| `ER-WP-15` | completed | Route Render und XRouter Navigation koennen Component-Fiber-Korrelation nutzen |
| `ER-WP-16` | completed | fuehrt Component-Fibers, Runtime-Diagnostics und Snapshot-/Backpressure-Arbeit zusammen |
| `ER-WP-18` | completed | Loader-/Hydration-Messpunkte nutzen Component-Fibers als Ziel |
| `ER-WP-24` | completed | browsernahe Fokus-/Keyboard-Smokes sind fuer Routing, Overlay, Form/Input und Tabs gatebar |

## Verifikation

```bash
node --check fabric/xtend-fabric.js
node --check tests/fabric/fabric_component_fiber_suite.js
node scripts/run_xtend_tests.js fabric-component-fibers --json
node scripts/run_xtend_tests.js references --json
npm test
```

## Ergebnis

`ER-WP-14` macht Component Mount, Hydration und Loader-Preload in XTend-Fabric messbar und schedulable. Component-Fibers tragen Dauer, Ergebnis, Lane, Schedule-Hinweise und Diagnostics, ohne RMT an XTend zu koppeln.
