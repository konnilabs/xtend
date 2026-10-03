# RMT-Kernel auf XTend 0.8 migrieren

XTend 0.8 ist ein Breaking Release innerhalb der Pre-1.0-Policy. Konkurrierende Scheduling-Pfade werden durch einen hostneutralen Kernel-Scheduler ersetzt. Die neue Grenze trennt den Microkernel in `xtendrmt/rmt-kernel-scheduler.js` von Rendering, Product Surface, Performance-Reports und Prewarm-Services. Die Hintergründe und die vollständige Modulgrenze stehen in der [Kernel-Topographie](./rmt-kernel-topography-map.md).

## Scheduling und Rückgabewerte

Der Microkernel kann direkt komponiert werden:

```js
import { createRmtKernelScheduler } from '@ccslabs/xtend/rmt/kernel-scheduler';

const scheduler = createRmtKernelScheduler();
const handle = scheduler.schedule({
  scope: 'surface.editor',
  endpointName: 'editor.render',
  lane: 'visible'
}, async ({ signal, shouldYield, yield: yieldWork }) => {
  if (shouldYield()) await yieldWork();
  return renderEditor(signal);
});

const result = await handle;
// Cancellation erfolgt über handle.cancel(), nicht über eine Closure.
```

`scheduleWork()`, `scheduleEndpoint()` und `createRmtBrowserScheduler().schedule()` liefern jetzt ein thenable `RmtJobHandle`. Bestehende `await`-Aufrufer erhalten weiterhin direkt das Arbeitsergebnis. Synchrone Aufrufer müssen `await handle` oder `handle.result` verwenden. Abbruch, Timeout und Dispose laufen über dasselbe Abort-Signal; eine Deadline beeinflusst dagegen nur Aging und Dringlichkeit.

## Lane-Mapping

Zulässig sind nur `user-blocking`, `visible`, `transition`, `idle`, `background` und `diagnostics`. Der 0.8-Browser-Adapter mappt `critical_input`, `visible_commit`, `hydration_followup`, `background_prepare` und `idle_maintenance`. Fabric-`a11y` wird zu `user-blocking`. Neue Anwendungen sollten ausschließlich die kanonischen Namen schreiben; die alten Namen gehören nur zur delegierenden Browser-Migrationsoberfläche.

## Entferntes Verhalten

- `inline` und `runInline` umgehen die Queue nicht mehr. Strict Mode lehnt sie ab; nicht-strikt wird regulär mit einer Migrationsdiagnose geplant.
- Globale `AppModules`-Factory-Mirrors und die 0.6-Composers sind entfernt. Der dokumentierte Browser-Namespace bleibt erhalten.
- ESM-Importe erzeugen weder Product Surface noch Runtime-Instanz.
- Product Surface muss explizit aktiviert werden; direkter Microkernel-Boot ist der Default.
- Abgelaufene 0.7-Compatibility-Exports und `removeBy: 0.7.0`-Ausnahmen sind entfernt.

Registry, Maraca, Browser Runtime und State-/Telemetry-Bridge erhalten dieselbe Scheduler-Instanz vom Orchestration Controller. Fabric übergibt nur Work-Intents, Backpressure und Telemetrie; es besitzt keine zweite Queue.

## Betriebsdefaults und Verifikation

Der Prewarm Worker bleibt ohne explizite Aktivierung aus. Retained Chunks verwenden ein LRU mit 32 Einträgen und maximal zwei Generationen pro Scope. Kritischer Backpressure pausiert und invalidiert Prewarm-Arbeit. Panic-/Recovery-Records werden immer redigiert auf der Diagnostics-Lane an Fabric gespiegelt.

Vor dem Upgrade sind die fokussierten Gates auszuführen:

```sh
node scripts/run_xtend_tests.js scaffold-kernel-lab rmt-kernel-scheduler rmt-vnext-scheduler rmt-kernel-scheduler-failure rmt-vnext-compatibility type-exports-rmt rmt-artifact-parity --json
```

Anschließend folgen `schema-inventory`, `contract-registry`, `contract-runtime-parity` und der Pack-Dry-Run. Publish bleibt ein separater manueller Owner-Schritt. Die neue Scheduler-Autorität und die Service-Grenzen sind außerdem in der [Feature-Adoption-Evaluation](./rmt-kernel-feature-adoption-evaluation.md) dokumentiert.

## Shell-Reaktion und Diagnosen

Paint-, Idle- und `postTask`-Wartephasen halten keinen aktiven Scheduler-Job fest. Bereits bereite Arbeit durchläuft dieselbe Prioritätsauswahl. `postTask`-Hosts müssen das optionale `AbortSignal` weiterreichen. `ctx.scheduler.getPriorityQueueStats()` in delegierten Events und Commands liest den aktuellen Snapshot des injizierten Schedulers.

Für Lifecycle-Beobachtung verwende `runtime.subscribeEvents(listener)` statt eines Vollsnapshot-Abonnements. `subscribe(listener)` bleibt kompatibel; es aktiviert bewusst die vollständige Aufbereitung. `snapshot()` und die redigierten DEV-Einzelabrufe bleiben aktuell, auch nach später Verbindung. Panic-/Recovery-Aufzeichnung wird nicht abgeschaltet.

FastPass ist mit `execution fastpass` oder `fastPassActions` explizit. `dispatchFastPass()` liefert einen abbrechbaren `RmtJobHandle`; `dispatchCommand()` behält seinen Promise-Vertrag. Verwaltete Surface-Arbeit erhält automatisch Präsentationsepochen. Übernimm ihre Tokens auch in eigene Worker-, Hydration- und Chart-Adapter; ein `superseded`-Ergebnis darf keinen synchronen Rendering-Fallback auslösen.

Die erweiterten Verträge heißen `xtend.maraca.plan-runtime.v3` und `xtend.rmt.presentation-effect-adapter.v2`. Verbraucher mit expliziter Schema-Prüfung müssen diese IDs akzeptieren. Das additive FastPass-Authoring steht in `xtend-maraca/fastpass.schema.json`; das RMT-v2-Dokumentschema bleibt unverändert. Baue ausgelieferte Bundles und ihre Typen aus denselben 0.8.0-Quellen neu.

[FastPass und Abort Boundary](./maraca-fastpass-abort-boundary.md) dokumentiert die API und die Grenzen zwischen Präsentation und fachlicher Arbeit. Ergänze die obigen Prüfungen um `maraca-responsiveness`, `maraca-orchestration`, `rmt-vnext-surfaces` und `xtend-dev-surface`.
