# XTend-Fabric RMT Lane Mapping

- Status: produktiver Mapping-Contract ab `ER-WP-13`
- Contract: `xtend.docs.xtend-fabric-rmt-lane-mapping.v1`
- Mapping Contract: `xtend.fabric.rmt-lane-mapping.v1`
- Runtime: `fabric/rmt-lane-mapping.js`
- Test: `tests/fabric/fabric_rmt_lane_mapping_suite.js`

## Zweck

`fabric/rmt-lane-mapping.js` verbindet Fabric-Lanes mit RMT Schedule Policies, ohne XTend in den RMT Kernel einzubauen.

Fabric beschreibt UI-Arbeit semantisch: `user-blocking`, `a11y`, `visible`, `transition`, `idle`, `background`, `diagnostics`. RMT bleibt host-neutral und sieht weiterhin nur Schedule Records mit `endpointName`, `scope`, `lane`, `priority`, `deadlineMs`, `preferIdle`, `coalesceKey` und `budgetClass`.

Seit `WP-E13-09` referenziert [RMT Production Readiness](./rmt-production-readiness.md) dieses Mapping unter `xtend.epic13.rmt-production-readiness.v1`, damit RMT-first Apps Fabric/Lane-Signale produktionsnah ingestieren koennen, ohne die RMT-Kernel-Boundary zu verletzen.

## Lane Mapping

| Fabric-Lane | RMT Schedule Lane | Grund |
|-------------|-------------------|-------|
| `user-blocking` | `user-blocking` | Eingabe, Navigation und Fokus sind kritisch |
| `a11y` | `user-blocking` | Screenreader- und Fokus-Signale sind user-facing; RMT hat noch keine eigene `a11y` Lane |
| `visible` | `visible` | sichtbare Component-Arbeit |
| `transition` | `transition` | Route- und UI-Uebergaenge |
| `idle` | `idle` | nicht sichtbare Hydration und Follow-up |
| `background` | `background` | best-effort Arbeit |
| `diagnostics` | `diagnostics` | Telemetry und Snapshots |

`a11y` bleibt also eine Fabric-Lane. Das erzeugte RMT Schedule Record traegt die RMT-Lane `user-blocking` und bewahrt `metadata.fabricLane = "a11y"`, damit Reporter und spaetere Adapter die urspruengliche Semantik sehen koennen.

## API

```js
const mapping = window.XTendFabricRmtLaneMapping.createFabricRmtLaneMapping();

const result = mapping.resolveFiber({
  kind: 'component.hydrate',
  lane: 'idle',
  scope: 'x-alert#secondary',
  componentRef: 'x-alert'
});
```

Wichtige Funktionen:

| API | Zweck |
|-----|-------|
| `createFabricRmtLaneMapping(options)` | erzeugt ein Mapping-Objekt mit Lane-Map und Schedule Records |
| `createRmtScheduleRecords(options)` | erzeugt host-neutrale RMT Schedule Records fuer Fabric-Lanes |
| `resolveRmtScheduleForFiber(fiber, options)` | loest eine Fiber auf ein Schedule Record auf |
| `normalizeFabricLaneForRmt(lane)` | uebersetzt eine einzelne Fabric-Lane in eine RMT-Lane |

## Beispiel Schedule Records

```json
{
  "schema": "xtend.fabric.rmt-lane-schedule.v1",
  "id": "component.idle.hydrate",
  "endpointName": "xtendrmt.component.hydrate",
  "scope": "xtend.fabric.idle",
  "lane": "idle",
  "priority": 35,
  "deadlineMs": 500,
  "preferIdle": true,
  "coalesceKey": "xtend.fabric.idle",
  "budgetClass": "background",
  "metadata": {
    "contract": "xtend.fabric.rmt-lane-mapping.v1",
    "fabricLane": "idle",
    "rmtLane": "idle"
  }
}
```

Seit `ER-WP-20` gibt es zusaetzlich `component.lazy.hydrate` fuer unterhalb des Fold oder bei Backpressure verschobene Hydration. Die RMT-Lane bleibt `idle`; der Unterschied liegt in `scheduleRef`, Scope und Coalescing.

```json
{
  "schema": "xtend.fabric.rmt-lane-schedule.v1",
  "id": "a11y.user-blocking.announce",
  "endpointName": "xtendrmt.a11y.announce",
  "scope": "xtend.fabric.a11y",
  "lane": "user-blocking",
  "priority": 95,
  "deadlineMs": 80,
  "preferIdle": false,
  "coalesceKey": "xtend.fabric.a11y.announce",
  "budgetClass": "critical",
  "metadata": {
    "contract": "xtend.fabric.rmt-lane-mapping.v1",
    "fabricLane": "a11y",
    "rmtLane": "user-blocking",
    "reason": "RMT schedules-domain has no dedicated a11y lane in xtend.rmt.schedules-domain.v1."
  }
}
```

## Kernel Boundary

Das Mapping importiert keinen XTendRMT Kernel und parst keine `.rmt` Dokumente. Es kann bereits normalisierte Schedule Records aus einem Host oder Test-Fixture entgegennehmen und `scheduleRef` oder `endpointNameHint` darauf aufloesen.

Erlaubt:

- Fabric-Fiber auf RMT Schedule Records mappen
- generierte Schedule Records als App-/Adapter-Hints verwenden
- bestehende `schedules[*]` Records aus normalisierten RMT-Dokumenten referenzieren
- `metadata.fabricLane` fuer Diagnostics und Reporter erhalten

Nicht erlaubt:

- RMT Runtime oder Kernel in Fabric importieren
- `a11y` als RMT-Kernel-Lane erzwingen
- XTend-Komponenten im RMT Kernel ausfuehren
- RMT Schema-Validierung in Fabric duplizieren

## Adapter-Ingestion

Ab Epic 10 / `WP-E10-05` nutzt der produktive `xtend.component` Adapter dieselbe Semantik als Runtime-Context. Der Contract heisst `xtend.component.fabric-lane-ingestion.v2`.

Precedence im Adapter:

1. `rmt.schedule-record`
2. `rmt.component-metadata`
3. `fabric.runtime-override`
4. `component.static-contract`
5. `scaffold.blueprint-default`

Der Adapter importiert Fabric nicht in den RMT Kernel. Er loest beim Mounting und bei Hydration nur den Fabric Context auf, setzt `result.metadata.fabric` und markiert DOM-Hosts mit `data-xtend-fabric-lane`, `data-xtend-rmt-lane`, `data-xtend-fabric-fiber`, `data-xtend-fabric-source` und `data-rmt-endpoint`.

## Gates

```bash
node scripts/run_xtend_tests.js fabric-lane-mapping --json
node scripts/run_xtend_tests.js rmt-component-fabric-ingestion --json
node scripts/run_xtend_tests.js hydration-policy --json
npm run test:fabric-lanes
npm run test:rmt-component-fabric-ingestion
npm run test:hydration-policy
node scripts/run_xtend_tests.js references --json
npm test
```

`ER-WP-20` ist darauf aufgebaut und haertet Lazy/Idle/Visible Hydration Policies mit konkreten `scheduleRef`-Entscheidungen. Route Render und XRouter Navigation bleiben ueber `ER-WP-15` korrelierbar.
