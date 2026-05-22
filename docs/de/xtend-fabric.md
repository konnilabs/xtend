# XTend-Fabric Runtime

- Status: Runtime Skeleton ab `ER-WP-08`, Lifecycle Boundary ab `ER-WP-09`, Reporter Adapter ab `ER-WP-10`, Runtime Diagnostics Bridge ab `ER-WP-11`, Component Fiber Instrumentierung ab `ER-WP-14`, Route Fiber Instrumentierung ab `ER-WP-15`, Telemetry Snapshots ab `ER-WP-16`, Performance Measurements ab `ER-WP-18`, Performance Regression ab `ER-WP-19`, Hydration Policies ab `ER-WP-20`, Performance Authoring ab `ER-WP-21`
- Contract: `xtend.docs.xtend-fabric.v1`
- API Contract: `xtend.fabric.api.v1`
- Lifecycle Boundary Contract: `xtend.fabric.lifecycle-error-boundary.v1`
- Runtime Diagnostics Bridge Contract: `xtend.fabric.runtime-diagnostics-bridge.v1`
- Component Fiber Instrumentation Contract: `xtend.fabric.component-fiber-instrumentation.v1`
- Route Fiber Instrumentation Contract: `xtend.fabric.route-fiber-instrumentation.v1`
- Telemetry Snapshot Contract: `xtend.fabric.telemetry-snapshot.v1`
- Backpressure Signal Contract: `xtend.fabric.backpressure-signal.v1`
- Performance Measurement Contract: `xtend.performance.measurement.v1`
- Component Lifecycle Telemetry Contract: `xtend.component.lifecycle-telemetry.v1`
- Hydration Policy Contract: `xtend.fabric.hydration-policy.v1`
- Performance Authoring: [Performance fuer Komponentenautoren](./performance.md)
- Runtime: `fabric/xtend-fabric.js`
- Lane Mapping: `docs/xtend-fabric-rmt-lane-mapping.md`

## Zweck

`XTend-Fabric` ist die lokale Host-Schicht fuer Safety, Diagnostics, Error Boundaries, Reporter und spaetere UI-Scheduler-Anbindung.

Fabric ersetzt weder XTend UI noch XTendRMT. Die Schicht sitzt zwischen Loader/API/Komponenten und App-spezifischem Code. XTendRMT bleibt framework-agnostischer Scheduler und Kernel; Fabric konsumiert nur Adapter-, Bridge- und Diagnostic-Signale.

## Runtime Entry

Der erste produktive Runtime-Pfad ist:

```html
<script src="/fabric/xtend-fabric.js"></script>
```

Im Browser steht danach die Fassade `window.XTendFabric` bereit. In lokalen Node-Gates kann dasselbe Modul per CommonJS geladen werden.

## API

```js
const fabric = window.XTendFabric.createXtendFabric();
```

Die Instanz stellt bereit:

| API | Zweck |
|-----|-------|
| `createBoundary(scope, options)` | wiederverwendbare Boundary fuer Loader-, Component-, Router-, API- oder RMT-nahe Arbeit |
| `createComponentLifecycleBoundary(componentRef, options)` | Component-spezifische Boundary fuer Lifecycle-, Hydration- und Event-Handler-Fehler |
| `wrapComponent(componentClassOrInstance, options)` | vorbereitetes Lifecycle-Wrapping fuer Component-Fehler |
| `runFiber(fiberInput, callback)` | fuehrt UI-Arbeit als Fiber aus und zeichnet Ergebnis/Fehler lokal auf |
| `emitDiagnostic(event)` | normalisiert, redigiert und speichert lokale Diagnostics |
| `registerReporter(reporter)` | registriert opt-in Reporter |
| `createReporterAdapter(options)` | generische Adapterflaeche fuer Custom- und Enterprise-Reporter |
| `createConsoleReporter(options)` | lokaler Console Reporter fuer Entwicklung |
| `createTestReporter(options)` | Memory Reporter fuer Tests und lokale Gates |
| `createRuntimeDiagnosticsBridge(options)` | verbindet Fabric mit `xstate`, XTend API Compliance und XTendRMT Diagnostics |
| `createComponentFiberInstrumentation(componentRef, options)` | Mount, Hydration und Preload als Component-Fibers instrumentieren |
| `createRouteFiberInstrumentation(routerRef, options)` | XRouter Navigation und Route Render als Route-Fibers instrumentieren |
| `createTelemetrySnapshot(options)` | aggregiert Fibers, Diagnostics, Performance Runtime, Runtime Bridge und Backpressure |
| `publishTelemetrySnapshot(snapshotOrOptions, options)` | exportiert einen Snapshot als redigierte Diagnostic an opt-in Reporter |
| `createBackpressureSignal(signal, defaults)` | erzeugt redigierte Backpressure-Hinweise fuer Scheduler-/Host-Schichten |
| `recordComponentTelemetry(record)` | speichert `xtend.component.lifecycle-telemetry.v1` Records fuer Snapshot-Aggregation |
| `captureError(error, context)` | wandelt Fehler in `xtend.fabric.diagnostic.v1` um |
| `connectRmtDiagnostics(source, options)` | konsumiert RMT Adapter-/Bridge-Diagnostics ohne Kernel-Import |

## Contracts

Fabric exportiert diese stabilen Contract IDs:

- `xtend.fabric.api.v1`
- `xtend.fabric.diagnostic.v1`
- `xtend.fabric.reporter.v1`
- `xtend.fabric.redaction.v1`
- `xtend.fabric.fiber.v1`
- `xtend.fabric.lane.v1`
- `xtend.fabric.lifecycle-error-boundary.v1`
- `xtend.fabric.runtime-diagnostics-bridge.v1`
- `xtend.fabric.component-fiber-instrumentation.v1`
- `xtend.fabric.route-fiber-instrumentation.v1`
- `xtend.fabric.telemetry-snapshot.v1`
- `xtend.fabric.backpressure-signal.v1`
- `xtend.performance.measurement.v1`
- `xtend.component.lifecycle-telemetry.v1`
- `xtend.fabric.hydration-policy.v1`

Das RMT-Lane-Mapping ist als separates Modul unter `fabric/rmt-lane-mapping.js` gefuehrt und traegt `xtend.fabric.rmt-lane-mapping.v1`.

## Diagnostics

Diagnostics werden lokal gespeichert und als Browser-Event `xtend-fabric-diagnostic` publiziert, sofern eine Browser-Umgebung vorhanden ist.

Mindestfelder:

- `schema`
- `id`
- `timestamp`
- `level`
- `code`
- `message`
- `source`
- `phase`

Optionale Korrelation:

- `componentRef`
- `component`
- `fiberId`
- `lane`
- `severity`
- `correlationId`
- `routeRef`
- `scheduleRef`

## Component Lifecycle Error Boundary

Ab `ER-WP-09` besitzt Fabric eine produktive Component Lifecycle Error Boundary. Sie faengt Fehler aus `connectedCallback`, `attributeChangedCallback`, `render`, `hydrate`, `disconnectedCallback` und explizit gewrappten Event Handlern ab.

```js
const boundary = fabric.createComponentLifecycleBoundary('x-alert', {
  swallowErrors: true,
  fallbackValue: undefined
});

boundary.runPhase('render', () => component.render());
const safeDismiss = boundary.wrapEventHandler(component.handleDismiss, {
  eventName: 'dismiss'
});
```

`wrapComponent` nutzt dieselbe Boundary:

```js
const SafeAlert = fabric.wrapComponent(XAlert, {
  componentRef: 'x-alert',
  eventHandlers: ['handleDismiss']
});
```

Lifecycle-Fehler verwenden den Code `xtend.fabric.component.lifecycle.failed` und tragen mindestens `component`, `componentRef`, `phase`, `fiberId`, `lane`, `severity` und `cause`. Das Mapping ist stabil:

| Phase | Fiber Kind | Lane |
|-------|------------|------|
| `connectedCallback` | `component.mount` | `visible` |
| `attributeChangedCallback` | `component.update` | `visible` |
| `render` | `component.render` | `visible` |
| `hydrate` | `component.hydrate` | `visible` |
| `disconnectedCallback` | `component.disconnect` | `background` |
| `eventHandler` | `event.handler` | `user-blocking` |

## Reporter

Der Default ist ein `noop` Reporter. Ohne `registerReporter` gibt es keine externe Uebertragung. Ab `ER-WP-10` gibt es einen expliziten Reporter Adapter Contract fuer Console-, Test- und spaetere Enterprise-Reporter.

Reporter muessen mindestens dieses Shape haben:

```js
{
  id: 'test',
  schema: 'xtend.fabric.reporter.v1',
  kind: 'test',
  delivery: 'memory',
  external: false,
  minimumLevel: 'warn',
  capabilities: ['diagnostics'],
  publish(event, context) {},
  flush(reason) {},
  dispose() {}
}
```

Runtime-Factories:

| Factory | Zweck |
|---------|-------|
| `createNoopReporter()` | Default ohne externe Ausgabe |
| `createReporterAdapter(options)` | Vendor-neutraler Adapter fuer Custom- und Enterprise-Reporter |
| `createConsoleReporter(options)` | lokale Console-Ausgabe, opt-in |
| `createTestReporter(options)` | Memory-Reporter fuer Gates, opt-in |

```js
const testReporter = window.XTendFabric.createTestReporter({
  minimumLevel: 'warn'
});
const unregister = fabric.registerReporter(testReporter);
```

```js
const enterpriseReporter = window.XTendFabric.createReporterAdapter({
  id: 'enterprise-probe',
  kind: 'enterprise',
  external: true,
  minimumLevel: 'error',
  capabilities: ['diagnostics', 'lifecycle-errors'],
  sink(event, context) {
    // Future enterprise transport hook.
  }
});
```

Reporter erhalten nur redigierte Diagnostics. Sensitive Felder wie `token`, `password`, `cookie`, `authorization`, `header`, `query` oder `form` werden entfernt. DOM Nodes werden nicht serialisiert. `minimumLevel`, `filter(event, context)` und `mapEvent(event, context)` koennen Auslieferung und Zielpayload kontrollieren. `mapEvent` wird nach dem Mapping erneut redigiert. Fehler in Reportern erzeugen lokale Diagnostics mit `xtend.fabric.reporter.failed`.

## Runtime Diagnostics Bridge

Ab `ER-WP-11` verbindet `createRuntimeDiagnosticsBridge(options)` Fabric mit `xstate`, XTend API Compliance und XTendRMT Diagnostics. Die Bridge importiert keinen RMT Kernel. Sie konsumiert Adapterdaten, Bridge-Outputs und Diagnostics-Hubs.

```js
const runtimeBridge = fabric.createRuntimeDiagnosticsBridge({
  xstate: window.xstate,
  api: window.XTend
});

runtimeBridge.connectXState();
runtimeBridge.connectApi();
const diagnosticsHub = runtimeBridge.createRmtDiagnosticsHub();
```

`connectXState` schreibt stabile Mirror-Keys:

| Key | Zweck |
|-----|-------|
| `xtend.fabric.bridge.ready` | Bridge-Readiness mit Contract-ID |
| `xtend.fabric.diagnostics.last` | letzte redigierte Fabric Diagnostic |
| `xtend.fabric.diagnostics.snapshot` | lokaler Snapshot mit Diagnostic- und Fiber-Zaehlern |

Stabile Bridge-Diagnostics:

| Code | Quelle |
|------|--------|
| `xtend.fabric.xstate.connected` | xstate ist angebunden |
| `xtend.fabric.xstate.changed` | ein externer State-Key wurde geaendert |
| `xtend.fabric.api.connected` | XTend API Compliance-Metadaten wurden gelesen |
| `xtend.fabric.rmt.connected` | RMT Diagnostic Source ist angebunden |
| `xtend.rmt.bridge.adapter.result.degraded` | RMT Adapter Result wurde in Fabric normalisiert |

`connectRmtDiagnostics` akzeptiert Arrays, `source.diagnostics`, `source.listDiagnostics()`, `source.subscribe(fn)`, DOM Events und das von `createRmtDiagnosticsHub()` erzeugte Hub-Shape. Alle Payloads werden vor State- oder Reporter-Ausgabe redigiert.

Details stehen im Contract [XTend-Fabric Runtime Diagnostics Bridge](../development/XTend-Fabric-Runtime-Diagnostics-Bridge.md).

## Fiber

`runFiber` normalisiert UI-Arbeit in `xtend.fabric.fiber.v1`.

```js
fabric.runFiber({
  kind: 'component.hydrate',
  scope: 'x-alert#primary',
  componentRef: 'x-alert',
  correlationId: 'route.alerts'
}, () => {
  // UI work
});
```

Fabric inferiert die Lane aus dem Fiber-Kind, zum Beispiel `component.hydrate` -> `visible` und `route.navigate` -> `user-blocking`.

## Component Fiber Instrumentierung

Ab `ER-WP-14` koennen Hosts und Adapter Component Mount, Hydration und Loader-Preload explizit als Fibers ausfuehren:

```js
const componentFibers = fabric.createComponentFiberInstrumentation('x-alert', {
  scope: 'x-alert#primary',
  routeRef: '/alerts',
  correlationId: 'route.alerts'
});

componentFibers.mount(() => document.createElement('x-alert'));
await componentFibers.hydrate((fiber) => element.hydrate(model, { fiber }));
componentFibers.preload(() => import('/components/xalert.js'));
```

Operation Profiles:

| Operation | Fiber Kind | Default Lane | ScheduleRef | Endpoint Hint |
|-----------|------------|--------------|-------------|---------------|
| `mount` | `component.mount` | `visible` | `component.visible.mount` | `xtendrmt.component.mount` |
| `hydrate` | `component.hydrate` | `idle` | `component.idle.hydrate` | `xtendrmt.component.hydrate` |
| `preload` | `loader.module` | `visible` | `component.visible.mount` | `xtendrmt.component.mount` |

Jeder abgeschlossene Lauf erzeugt einen `xtend.fabric.fiber.v1` Record mit `durationMs`, `result`, `lane`, `scheduleRef`, `endpointNameHint` und `diagnostics`. Fehler erzeugen `xtend.fabric.component.mount.failed`, `xtend.fabric.component.hydrate.failed` oder `xtend.fabric.component.preload.failed` und werden an opt-in Reporter weitergereicht. Metadata wird redigiert, bevor sie im Fiber Store landet.

Fabric importiert dabei keinen RMT Kernel. `scheduleRef` und `endpointNameHint` sind nur Host-/Adapter-Hinweise fuer XTendRMT oder andere Scheduler.

## Route Fiber Instrumentierung

Ab `ER-WP-15` koennen Hosts, App-Shells und XRouter-Adapter Navigation und Route Render explizit als Fibers ausfuehren:

```js
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

await routeFibers.render((fiber) => router._renderRoute(match, outlet, { fiber }), {
  routeRef: '/settings',
  componentRef: 'x-settings'
});
```

Operation Profiles:

| Operation | Fiber Kind | Default Lane | ScheduleRef | Endpoint Hint |
|-----------|------------|--------------|-------------|---------------|
| `navigate` | `route.navigate` | `user-blocking` | `ui.user-blocking.input` | `xtendrmt.ui.user-blocking` |
| `render` | `route.render` | `transition` | `route.transition.render` | `xtendrmt.route.render` |

Route Render kann per Override sichtbar geplant werden, zum Beispiel mit `lane: "visible"` und `scheduleRef: "route.visible.render"`. Fehler erzeugen `xtend.fabric.route.navigate.failed` oder `xtend.fabric.route.render.failed`. Metadata wird redigiert und kann `routeId`, `from`, `to`, `params`, `query`, `componentRef`, `adapterRef`, `hostRef` und `backpressureSignal` tragen.

Die XRouter-Kante bleibt framework-neutral: `navigate(to, options)`, `_handleNavigation()`, `_renderRoute(match, container)` und das `router-navigate` Signal sind instrumentierbare Grenzen. Fabric importiert keinen RMT Kernel; `scheduleRef` und `endpointNameHint` sind nur Scheduler-Hints fuer XTendRMT oder andere Hosts.

## Telemetry Snapshots und Backpressure

Ab `ER-WP-16` fasst `createTelemetrySnapshot(options)` lokale Runtime-Daten zusammen:

```js
const snapshot = fabric.createTelemetrySnapshot({
  runtimeBridge,
  rmtBridge,
  performance: window.performance,
  correlationId: 'route.settings'
});

fabric.publishTelemetrySnapshot(snapshot);
```

Ein Snapshot traegt `xtend.fabric.telemetry-snapshot.v1` und enthaelt:

| Bereich | Inhalt |
|---------|--------|
| `totals` | Fiber-Zaehler, Fehler, Budget-Misses, Durchschnitts- und Maximaldauer |
| `lanes` | Aggregation pro Fabric-Lane inklusive `scheduleRefs` |
| `backpressure` | Score, Level, Aktion, Signale und Lane-Gruppierung |
| `componentTelemetry` | Component Lifecycle Records nach Operation, Component und Lane |
| `performance` | optionale `mark`/`measure` Eintraege, normalisierte Measurements und `phaseSummary` |
| `runtime` | optionaler Snapshot aus `createRuntimeDiagnosticsBridge` |

Component Lifecycle Telemetry traegt `xtend.component.lifecycle-telemetry.v1`. `recordComponentTelemetry(record)` speichert Records lokal; `createTelemetrySnapshot({ componentTelemetry })` kann alternativ explizite Records normalisieren. Beide Pfade decken `mount`, `hydrate`, `render`, `update`, `event`, `unmount` und `error` ab. Die Snapshot-Sektion `componentTelemetry` enthaelt `recordCount`, `operations`, `components`, `lanes`, `statusCounts`, Dauerwerte, Diagnostics und die letzten Records.

Backpressure-Signale tragen `xtend.fabric.backpressure-signal.v1`. Fabric erzeugt sie aus Fiber-Fehlern, Deadline-Ueberschreitungen, expliziter `backpressureSignal` Metadata, Component Lifecycle Telemetry und optionalen Snapshot-Inputs.

Wenn `createTelemetrySnapshot({ rmtBridge })` eine XTendRMT `createRmtStateSchedulerDiagnosticsBridge` erhaelt, wird der Snapshot automatisch ueber `recordTelemetrySnapshot` an RMT gespiegelt. Dadurch landen `snapshot.backpressure` und die Scheduler-Aktion dauerhaft in `rmt.backpressure.*`, ohne dass Hosts eine eigene Backpressure-API bauen muessen.

| Level | Aktion |
|-------|--------|
| `none` | `continue` |
| `low` | `observe` |
| `medium` | `coalesce-idle-work` |
| `high` | `defer-background-work` |
| `critical` | `protect-user-blocking-work` |

`publishTelemetrySnapshot` erzeugt die lokale Diagnostic `xtend.fabric.telemetry.snapshot` auf der `diagnostics` Lane. Reporter bleiben opt-in; der Default `noop` sendet nichts extern.

Details stehen im Contract [XTend Telemetry Snapshot und Backpressure Contract](../development/XTend-Telemetry-Snapshot-und-Backpressure-Contract.md).

Der Component Lifecycle Anschluss ist in [XTend Component Lifecycle Telemetry Contract](../development/XTend-Component-Lifecycle-Telemetry-Contract.md) beschrieben. Der lokale Gate ist:

```bash
node scripts/run_xtend_tests.js rmt-component-lifecycle-telemetry --json
```

## Performance Measurements

Ab `ER-WP-18` misst Fabric bekannte Fiber-Kinds automatisch ueber `performance.mark` und `performance.measure`.

| Fiber Kind | Measure | Phase |
|------------|---------|-------|
| `loader.module` | `xtend.loader.module` | `load` |
| `component.mount` | `xtend.component.mount` | `mount` |
| `component.hydrate` | `xtend.component.hydrate` | `hydrate` |
| `component.render` | `xtend.component.render` | `render` |
| `component.update` | `xtend.component.update` | `update` |
| `event.handler` | `xtend.event.handler` | `event` |
| `route.navigate` | `xtend.route.navigate` | `route` |
| `route.render` | `xtend.route.render` | `route` |
| `diagnostics.snapshot` | `xtend.diagnostics.snapshot` | `diagnostics` |

`createTelemetrySnapshot()` wandelt Performance Entries mit Prefix `xtend.` in `xtend.performance.measurement.v1` Records um. Die Snapshot-Sektion `performance.phaseSummary` aggregiert unter anderem `load`, `hydrate`, `render` und `route`.

```js
const snapshot = fabric.createTelemetrySnapshot({
  performance: window.performance
});

console.log(snapshot.performance.measurements);
console.log(snapshot.performance.phaseSummary.hydrate);
```

Details stehen in [Performance Measurements](./performance-measurements.md) und im Contract [XTend Performance Messpunkte und Snapshots](../development/XTend-Performance-Messpunkte-und-Snapshots.md).

Seit `ER-WP-19` wertet [Performance Regression](./performance-regression.md) diese Measurements ueber lokale deterministische Baselines als `xtend.performance.regression-report.v1` aus.

## Hydration Policies

Ab `ER-WP-20` entscheidet `fabric/hydration-policy.js`, ob Component-Hydration sichtbar, idle oder lazy geplant wird:

| Policy | Lane | ScheduleRef |
|--------|------|-------------|
| `visible` | `visible` | `component.visible.hydrate` |
| `idle` | `idle` | `component.idle.hydrate` |
| `lazy` | `idle` | `component.lazy.hydrate` |

Nicht sichtbare Hydration darf keine `user-blocking` Lane verwenden. RMT erhaelt nur Schedule-Records; XTend-Ausfuehrung bleibt in Fabric oder Host-Adaptern. Details stehen in [Hydration Policies](./hydration-policies.md).

## RMT Boundary

`connectRmtDiagnostics` akzeptiert RMT-nahe Adapter- und Bridge-Outputs, aber importiert keinen RMT Kernel und parst keine `.rmt` Dokumente.

Erlaubt:

- Adapter Results
- Bridge Diagnostics
- Schedule Endpoint Signals
- Diagnostics Snapshots

Nicht erlaubt:

- XTendRMT Kernel importieren
- RMT Scheduler Policies in Fabric umschreiben
- XTend als Pflicht-Host in RMT etablieren

## RMT Lane Mapping

Ab `ER-WP-13` bildet `fabric/rmt-lane-mapping.js` Fabric-Lanes auf RMT Schedule Records ab. Der RMT Kernel bleibt framework-agnostisch: er sieht Schedule Policies und Endpoint-Namen, aber keine XTend-Komponentenlogik.

Kurzform:

| Fabric-Lane | RMT Schedule Lane |
|-------------|-------------------|
| `user-blocking` | `user-blocking` |
| `a11y` | `user-blocking` |
| `visible` | `visible` |
| `transition` | `transition` |
| `idle` | `idle` |
| `background` | `background` |
| `diagnostics` | `diagnostics` |

Details, Beispiele und Gates stehen in [XTend-Fabric RMT Lane Mapping](./xtend-fabric-rmt-lane-mapping.md).

## Gates

```bash
node scripts/run_xtend_tests.js fabric --json
node scripts/run_xtend_tests.js fabric-lane-mapping --json
node scripts/run_xtend_tests.js fabric-lifecycle-boundary --json
node scripts/run_xtend_tests.js fabric-reporters --json
node scripts/run_xtend_tests.js fabric-runtime-bridge --json
node scripts/run_xtend_tests.js fabric-component-fibers --json
node scripts/run_xtend_tests.js fabric-route-fibers --json
node scripts/run_xtend_tests.js fabric-telemetry-snapshot --json
node scripts/run_xtend_tests.js fabric-performance-measurements --json
node scripts/run_xtend_tests.js rmt-component-lifecycle-telemetry --json
node scripts/run_xtend_tests.js performance-regression --json
node scripts/run_xtend_tests.js hydration-policy --json
npm run test:fabric
npm run test:fabric-lanes
npm run test:fabric-lifecycle
npm run test:fabric-reporters
npm run test:fabric-runtime-bridge
npm run test:fabric-component-fibers
npm run test:fabric-route-fibers
npm run test:fabric-telemetry
npm run test:fabric-performance
npm run test:performance
npm run test:hydration-policy
node scripts/run_xtend_tests.js references --json
npm test
```

`ER-WP-19` ist abgeschlossen. Loader-, Hydration-, Render- und Route-Messpunkte haengen jetzt in der Performance Runtime, in Fabric Telemetry Snapshots und im lokalen Performance Regression Gate.
