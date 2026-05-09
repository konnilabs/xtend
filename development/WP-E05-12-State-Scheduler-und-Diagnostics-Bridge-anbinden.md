# WP-E05-12 - State-, Scheduler- und Diagnostics Bridge anbinden

- Status: `completed`
- Datum: 4. Mai 2026
- Epic: `development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md`
- Backlog: `development/BACKLOG-EPIC-05-XTendRMT-Bridge-und-Natives-RMT-Routing.md`
- Bezug:
  - `development/WP-E05-07-Schedules-Domain-als-referenzierbare-Policy-haerten.md`
  - `development/WP-E05-09-Route-Registry-und-Component-Registry-vorbereiten.md`
  - `development/WP-E05-10-XRouter-Adapter-produktfaehig-implementieren.md`
  - `development/WP-E05-11-XTend-Component-Adapter-produktfaehig-implementieren.md`
  - `xtendrmt/rmt.schema.json`
  - `xtendrmt/rmt-core.d.ts`
  - `xtendrmt/rmt-core.esm.js`
  - `xtendrmt/rmt-runtime.esm.js`
  - `xtendrmt/rmt-runtime.browser.js`
  - `tests/rmt/rmt_compatibility_suite.js`
  - `tests/references/reference_path_suite.js`

## Ziel

`WP-12` bindet die produktiven Adapter-Results aus XRouter und XTend Component Adapter an eine gemeinsame State-, Scheduler- und Diagnostics Bridge an.

Die Bridge ist bewusst kein XTend-Sonderfall im RMT Kernel. Sie konsumiert Adapter Results, `scheduleRef` und deklarative Schedule Policies. Optional kann sie nach `xstate`, einen Diagnostics Hub oder eine Performance Runtime spiegeln. Wenn diese Host-Ziele fehlen, bleibt der Pfad deterministisch und erzeugt Diagnostics statt stiller Runtime-Fehler.

## Bridge Contract

Der Contract traegt die stabile ID:

```text
xtend.rmt.state-scheduler-diagnostics-bridge.v1
```

Der offizielle Adapter Record bleibt:

```text
rmt.state-scheduler-diagnostics
```

Die stabile Adapter-ID lautet `rmt.state-scheduler-diagnostics`.

Eingaben sind:

- `xtend.rmt.runtime-registry.v1`
- `xtend.rmt.xrouter-adapter.v1`
- `xtend.rmt.xtend-component-adapter.v1`
- `xtend.rmt.schedules-domain.v1`

## Runtime Surface

Die Bridge stellt folgende Operationen bereit:

- `createStateBridge`
- `scheduleEndpoint`
- `emitDiagnostic`
- `recordAdapterResult`

Die Build-Artefaktversionen exportieren:

- `createRmtStateSchedulerDiagnosticsBridge`
- `createRenderManStateSchedulerDiagnosticsBridge`
- `RmtStateSchedulerDiagnosticsBridge`
- `RmtStateBridgeHandle`
- `RmtBridgeSchedulePolicy`

## State Bridge

`createStateBridge(options)` erzeugt einen kleinen Host-Bridge-Handle:

- `set(key, value, metadata)`
- `get(key, fallbackValue)`
- `snapshot()`
- `publish(eventName, payload, metadata)`

Wenn ein `xstate` Ziel mit `set` oder `setState` vorhanden ist, spiegelt die Bridge State dorthin. Andernfalls nutzt sie einen lokalen In-Memory-State und meldet `rmt.bridge.state.unavailable` als Info-Diagnostic. Der RMT Kernel importiert `xstate` nicht.

Gespiegelte Standardpfade:

- `rmt.bridge.ready`
- `rmt.adapter.lastResult`
- `rmt.adapter.{adapterId}.{operation}.status`
- `rmt.route.{routeId}.lastResult`
- `rmt.component.{componentId}.lastResult`
- `rmt.scheduler.lastEndpoint`
- `rmt.diagnostics.last`

## Scheduler Endpoint Bridge

`scheduleEndpoint(endpointName, scope, callback, options)` loest Schedule Policies aus `schedules[*]`, Inline-Hints oder einem direkten `scheduleRef` auf.

Unterstuetzte Budgetfelder:

- `lane`
- `priority`
- `deadlineMs`
- `preferIdle`
- `coalesceKey`
- `budgetClass`
- `maxRetries`
- `timeoutMs`

Wenn eine Performance Runtime oder ein Host Scheduler mit `scheduleEndpoint` vorhanden ist, delegiert die Bridge an diesen Host. Fehlt ein Scheduler, wird der Endpoint als Queue-Record erhalten und mit `rmt.bridge.scheduler.endpoint.queued` diagnostiziert. Damit bleibt Scheduler-Arbeit endpoint-basiert und host-neutral.

## Adapter Result Bridge

`recordAdapterResult(result, options)` ist der Kopplungspunkt fuer `WP-10` und `WP-11`.

Die Bridge:

- liest `adapterId`, `operation`, `phase`, `status` und `metadata`
- spiegelt Route- und Component-Resultate in State
- uebernimmt `metadata.scheduleRef` oder `options.scheduleRef`
- loest die passende Schedule Policy
- plant den Endpoint ueber `scheduleEndpoint`
- uebernimmt Adapter-Diagnostics in `emitDiagnostic`
- erzeugt bei degradierten Results `rmt.bridge.adapter.result.degraded`

Dadurch koennen Route-Render, Component-Mount/Hydration und Diagnostics ueber dieselbe Policy-Schicht laufen, ohne dass XRouter oder XTend in den Kernel wandern.

## Diagnostics

Die erste Diagnostic-Matrix umfasst:

- `rmt.bridge.state.mirrored`
- `rmt.bridge.state.unavailable`
- `rmt.bridge.scheduler.endpoint.scheduled`
- `rmt.bridge.scheduler.endpoint.queued`
- `rmt.bridge.diagnostics.emitted`
- `rmt.bridge.adapter.result.degraded`

Diagnostics werden lokal gesammelt, optional an einen Diagnostics Hub publiziert und als `rmt.diagnostics.last` in die State Bridge gespiegelt.

## Kernel Boundary

Der RMT Kernel darf:

- Adapter Results auswerten
- `scheduleRef` und Schedule Policies an die Bridge uebergeben
- generische State-, Scheduler- und Diagnostics-Operationen modellieren
- Operation Results und Diagnostics beobachten

Der RMT Kernel darf nicht:

- `xstate` importieren
- XRouter- oder XTend-Runtimes importieren
- Diagnostics Hubs direkt voraussetzen
- Performance Runtime oder Host Scheduler als Pflicht setzen
- DOM-, URL- oder Custom-Element-Arbeit ausfuehren

## Handoff an Folgepakete

- `WP-13` kann Build-Pipeline und Artefakt-Paritaet fuer die neue Bridge-Fabrik absichern.
- `WP-14` kann die Bestcase-Demo auf native `routes`, `components`, produktive Adapter und die Bridge migrieren.
- `WP-15` kann Contract-, Schema- und Runtime-Tests fuer den gemeinsamen Adapter-/Bridge-Fluss erweitern.
- `WP-16` kann browsernahe Smokes fuer Scheduler-Endpoint-Signale, XRouter und XTend Components aufsetzen.

## Verifikation

Mindestgates:

```bash
node scripts/run_xtend_tests.js rmt-compatibility --json
node scripts/run_xtend_tests.js references --json
npm test
```

Die RMT-Kompatibilitaetssuite prueft die Bridge ueber die Build-Artefaktversion in `xtendrmt/rmt-core.esm.js` mit Fake-`xstate`, Fake-Scheduler und Fake-Diagnostics-Hub.

## Ergebnis

`WP-12` ist abgeschlossen. Adapter Results aus XRouter und XTend Component Adapter koennen nun State spiegeln, Schedule Policies in Host Scheduler Endpoints ueberfuehren und Diagnostics zentral melden. RMT bleibt host-neutral; `xstate`, Diagnostics Hub, Performance Runtime, XTend und XRouter bleiben optionale Adapter-/Host-Ziele ausserhalb des Kernels.
