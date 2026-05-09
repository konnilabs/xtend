# WP-E10-06 - Telemetry API Anschluss fuer Component Lifecycle standardisieren

- Status: `completed`
- Datum: 7. Mai 2026
- Epic: `development/EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md`
- Backlog: `development/BACKLOG-EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md`
- Contract: `xtend.epic10.wp06.component-lifecycle-telemetry.v1`
- Telemetry Contract: `xtend.component.lifecycle-telemetry.v1`
- Bezug:
  - `development/XTend-Component-Lifecycle-Telemetry-Contract.md`
  - `development/XTend-Fabric-Component-Compatibility-v2.md`
  - `development/XTend-Telemetry-Snapshot-und-Backpressure-Contract.md`
  - `tests/rmt/rmt_component_lifecycle_telemetry_suite.js`
  - `fabric/xtend-fabric.js`
  - `xtendrmt/rmt-runtime.esm.js`
  - `xtendrmt/rmt-runtime.browser.js`
  - `xtendrmt/rmt-core.d.ts`
  - `xtendrmt/rmt.schema.json`
  - `package.json`

## Ziel

`WP-E10-06` standardisiert den Telemetry API Anschluss fuer Component Lifecycle Operationen. Component Mounting, Hydration und Events erzeugen reproduzierbare Telemetry Records. Render, Update, Unmount und Error koennen ueber `recordComponentTelemetry(...)` in denselben Contract geschrieben werden.

## Umsetzung

Erstellt wurden:

| Artefakt | Zweck |
|----------|-------|
| `development/XTend-Component-Lifecycle-Telemetry-Contract.md` | akzeptierter Lifecycle-Telemetry-Contract |
| `tests/rmt/rmt_component_lifecycle_telemetry_suite.js` | lokaler Gate fuer Runtime, Fabric Snapshot, Backpressure und Dokuanker |

Aktualisiert wurden:

- `fabric/xtend-fabric.js` mit `xtend.component.lifecycle-telemetry.v1`, `normalizeComponentLifecycleTelemetry(...)`, `summarizeComponentLifecycleTelemetry(...)` und `snapshot.componentTelemetry`
- `xtendrmt/rmt-runtime.esm.js` und `xtendrmt/rmt-runtime.browser.js` mit `result.metadata.telemetry`, Event Telemetry und `recordComponentTelemetry(...)`
- `xtendrmt/rmt-core.d.ts` mit `RmtXtendComponentLifecycleTelemetry`
- `xtendrmt/rmt.schema.json` mit `componentLifecycleTelemetry`
- `package.json` mit `xtend.componentLifecycleTelemetry` und `test:rmt-component-lifecycle-telemetry`
- `xtend-builder/scaffold.config.js` mit `componentLifecycleTelemetry`
- `scripts/run_xtend_tests.js` mit Suite `rmt-component-lifecycle-telemetry`
- Epic 10, Backlog, Reference Registry und Entwicklerdokumentation

## Entscheidungen

Lifecycle Operationen:

- `mount`
- `hydrate`
- `render`
- `update`
- `event`
- `unmount`
- `error`

Telemetry Correlation:

- `componentId`
- `rmtComponentId`
- `tag`
- `routeRef`
- `scheduleRef`
- `fabricLane`
- `rmtLane`
- `fiberKind`

Backpressure-Anschluss:

- `failed` Records erzeugen ein Component Lifecycle Backpressure-Signal.
- `durationMs` oberhalb des Lane-Deadlines erzeugt ein Deadline-Signal.
- explizite `backpressureSignal` Metadata wird in Fabric Backpressure uebernommen.

## Nicht umgesetzt in diesem Paket

- keine TypeScript Blueprint-Generierung
- keine neuen Komponenten
- kein Component Lab
- keine automatische Migration existierender Komponenten

Diese Punkte folgen in `WP-E10-07`, `WP-E10-08`, `WP-E10-12`, `WP-E10-14` und `WP-E10-15`.

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Component Lifecycle Telemetry Contract liegt vor | erfuellt |
| Mount/Hydration schreiben Telemetry in Adapter Result | erfuellt |
| Event Bridge erzeugt `event` Records | erfuellt |
| manueller Hook fuer Render/Update/Unmount/Error existiert | erfuellt: `recordComponentTelemetry(...)` |
| Fabric Snapshot aggregiert Component Records | erfuellt: `snapshot.componentTelemetry` |
| Backpressure kann Component-Daten nutzen | erfuellt |
| Kernel Boundary bleibt sichtbar | erfuellt: `no-rmt-kernel-import-of-xtend-types` |
| lokaler Gate ist vorhanden | erfuellt: `rmt-component-lifecycle-telemetry` |

## Verifikation

Durchgefuehrte lokale Gates:

```bash
node --check fabric/xtend-fabric.js
node --check xtendrmt/rmt-runtime.esm.js
node --check xtendrmt/rmt-runtime.browser.js
node --check tests/rmt/rmt_component_lifecycle_telemetry_suite.js
node --check scripts/run_xtend_tests.js
node --check tests/references/reference_path_suite.js
node --check xtend-builder/scaffold.config.js
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('package.json ok')"
node -e "JSON.parse(require('fs').readFileSync('xtendrmt/rmt.schema.json','utf8')); console.log('rmt.schema.json ok')"
node scripts/run_xtend_tests.js rmt-component-lifecycle-telemetry --json
node scripts/run_xtend_tests.js fabric-telemetry-snapshot --json
node scripts/run_xtend_tests.js rmt-component-fabric-ingestion --json
node scripts/run_xtend_tests.js rmt-compatibility --json
node scripts/run_xtend_tests.js references --json
```

## Ergebnis

`WP-E10-06` ist abgeschlossen. XTend-Komponenten sind fuer Telemetry Snapshots, Performance-Auswertung und Backpressure-Gates jetzt nicht mehr unsichtbare DOM-Arbeit, sondern standardisierte Lifecycle Records mit RMT-, Schedule-, Fabric- und Component-Korrelation.
