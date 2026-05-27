# XTend Fabric Runtime

XTend Fabric ist die Koordinationsschicht für Runtime-Arbeit. Sie ordnet RMT Scheduling-Absicht in Lanes und Fibers ein, trifft Hydration-Entscheidungen und stellt Telemetrie sowie Diagnostics bereit.

## Was diese Schicht ist

Fabric ist die Brücke zwischen Kernel-Absicht und Host-Ausführung. Der Kernel beschreibt, welche Arbeit existiert; Fabric hilft dem Host zu entscheiden, wann und mit welcher Priorität diese Arbeit ausgeführt wird.

## Was diese Schicht weiß

Fabric kennt Fabric-Lanes, RMT-Lane-Mapping, Schedule Records, Fiber-Kontext, Hydration Policies, Backpressure, Completion-Signale, Diagnostics und Telemetrie-Snapshots.

Fabric kann erkennen, ob Arbeit sichtbar, idle, diagnostisch oder user-blocking ist. Dadurch kann die App Repaints, Reflows und unnötige Hydration-Arbeit besser kontrollieren.

## Was sie nicht weiß

Fabric parst kein RMT, rendert keine UI, besitzt keine Framework-Komponenten und führt keine Geschäftslogik aus.

Fabric entscheidet nicht, ob eine React-, Vue- oder XTend-Komponente fachlich korrekt ist. Es bewertet nur Runtime-Absicht, Priorität, Hydration und Diagnoseinformationen.

## Schnittstellen

```js
import { createXtendFabric } from '@ccslabs/xtend/fabric';
import { resolveRmtScheduleForFiber } from '@ccslabs/xtend/fabric/rmt-lane-mapping';

const fabric = createXtendFabric();
const schedule = resolveRmtScheduleForFiber({
  lane: 'visible',
  scheduleRef: 'component.visible.hydrate',
  kind: 'component.hydrate'
});
```

Die wichtigsten öffentlichen Einstiege sind `createXtendFabric`, Hydration Policy Helpers, RMT Lane Mapping, Diagnostics und Telemetrie-Snapshots.

## Kommunikation mit anderen Schichten

Der RMT Kernel liefert Schedule-Intent, Lane-Namen und Diagnostics. Fabric normalisiert diese Informationen und gibt Host Adaptern konkrete Ausführungs- und Hydration-Hinweise.

XTend UI und andere Framework-Adapter können Fabric-Kontext nutzen, um sichtbare Arbeit vor Idle-Arbeit zu priorisieren, Diagnostics zu sammeln und Component-Hydration nachvollziehbar zu machen.

## Nächste Schritte

- [RMT Stack-Topographie](./rmt-stack-topography.md)
- [RMT Kernel Runtime](./rmt-kernel-runtime.md)
- [XTend Fabric](./xtend-fabric.md)
- [Fabric RMT Lane Mapping](./xtend-fabric-rmt-lane-mapping.md)

## Öffentlicher Vertrag

XTend Fabric Runtime ist der öffentliche Fabric Scheduling-Vertrag für `docs/de/xtend-fabric-runtime.md`. Stabil ist nicht die Textlänge, sondern ob ein externer Host die genannten Dateien, Namen und Prüfungen ohne internes Projektwissen nachvollziehen kann.

- Rolle: erklärt, welche Entscheidung ein Integrator auf dieser Seite treffen kann.
- Stabile Oberfläche: Fabric Lanes, Fiber Inputs, RMT Lane Mapping, Hydration-Policy und Diagnostics.
- Nicht versprochen: Private Runtime-Interna, generierte DOM-Strukturen und interne Planungsbegriffe bleiben außerhalb des öffentlichen Vertrags.

## Schnittstellen und Anker

Diese Anker sind konkret genug, damit ein Drittentwickler Verhalten lokal nachprüfen kann:

Quellen:
- `docs/de/xtend-fabric-runtime.md`
- `docs/menu.json`
- `package.json`
- `fabric/xtend-fabric.js`
- `fabric/rmt-lane-mapping.js`
- `fabric/rmt-lane-mapping.d.ts`
- `docs/utils/fabric-runtime.js`
- `docs/dev-router.php`

Namen:
- `docs/de/xtend-fabric-runtime.md`
- `docs/menu.json`
- `fabric/xtend-fabric.js`
- `fabric/rmt-lane-mapping.js`
- `fabric/rmt-lane-mapping.d.ts`
- `docs/utils/fabric-runtime.js`
- `docs/dev-router.php`
- `package.json`
- `createXtendFabric`
- `resolveRmtScheduleForFiber`

Befehle:
- `node scripts/run_xtend_tests.js fabric fabric-lane-mapping fabric-runtime-bridge --json`
- `node scripts/run_xtend_tests.js docs-content-depth docs-public-quality --json`

## Minimaler Prüfpfad

Führe diese Prüfung aus, wenn der Artikel, ein Beispiel oder die genannte öffentliche Oberfläche geändert wird:

```bash
node scripts/run_xtend_tests.js fabric fabric-lane-mapping fabric-runtime-bridge --json
node scripts/run_xtend_tests.js docs-content-depth docs-public-quality --json
```

- Erwartetes Signal: Der Befehl muss ohne Linkfehler, ohne bekannte Boilerplate und mit konkreten Ankern im Artikel abschließen.
- Quellen: Wenn Source und Artikel voneinander abweichen, ist die Source maßgeblich; aktualisiere danach beide Locales mit identischen Codeblöcken.

## Spezifische Fehlerbilder

- Wenn Arbeit in der falschen Lane landet, prüfe Fiber Input, Mapping-Tabelle und Diagnostics-Snapshot.
- Wenn ein Link aus diesem Artikel bricht, repariere den lokalen Markdown-Zielpfad und prüfe danach `node scripts/verify_docs_public_quality.js`.
- Wenn ein Beispiel kopiert wird, müssen Dateipfade, Record-Namen und Commands aus diesem Abschnitt unverändert startfähig bleiben.
