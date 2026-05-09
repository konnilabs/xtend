# XTend-Fabric RMT Lane Mapping

- Status: Accepted
- Datum: 5. Mai 2026
- Contract: `xtend.fabric.rmt-lane-mapping.v1`
- Schedule Wrapper Contract: `xtend.fabric.rmt-lane-schedule.v1`
- RMT Schedule Contract: `xtend.rmt.schedules-domain.v1`
- Roadmap-Paket: `ER-WP-13`
- Runtime Entry: `fabric/rmt-lane-mapping.js`
- Bezug:
  - `development/XTend-Fiber-und-Lane-Contract.md`
  - `development/WP-E05-07-Schedules-Domain-als-referenzierbare-Policy-haerten.md`
  - `development/WP-E05-12-State-Scheduler-und-Diagnostics-Bridge-anbinden.md`
  - `development/ADR-XTend-Fabric.md`
  - `docs/xtend-fabric-rmt-lane-mapping.md`
  - `tests/fabric/fabric_rmt_lane_mapping_suite.js`

## Zweck

Dieser Contract definiert die feste Bridge zwischen Fabric-Lanes und RMT Schedule Policies.

Die Grenze bleibt bewusst asymmetrisch:

- Fabric kennt UI-Semantik, Fiber-Kinds, Component-/Route-Scopes und A11y-Anforderungen.
- RMT kennt host-neutrale `schedules[*]` Records, Endpoints und Scheduling-Parameter.
- XTend-Adapter oder App-Hosts fuehren Endpoints aus; der RMT Kernel fuehrt keine XTend-DOM-Arbeit aus.

## Mapping-Tabelle

| Fabric-Lane | RMT Schedule Lane | Priority | Budgetklasse | Deadline | Prefer Idle | Default Schedule |
|-------------|-------------------|----------|--------------|----------|-------------|------------------|
| `user-blocking` | `user-blocking` | 100 | `critical` | 80 ms | nein | `ui.user-blocking.input` |
| `a11y` | `user-blocking` | 95 | `critical` | 80 ms | nein | `a11y.user-blocking.announce` |
| `visible` | `visible` | 80 | `interactive` | 160 ms | nein | `component.visible.render` |
| `transition` | `transition` | 65 | `interactive` | 240 ms | nein | `route.transition.render` |
| `idle` | `idle` | 35 | `background` | 500 ms | ja | `component.idle.hydrate` |
| `background` | `background` | 25 | `best_effort` | 1000 ms | ja | `ui.background.work` |
| `diagnostics` | `diagnostics` | 20 | `diagnostics` | 750 ms | ja | `diagnostics.snapshot` |

`a11y` ist absichtlich keine neue RMT-Lane. Die Schedule-Domain aus Epic 05 akzeptiert `user-blocking`, `visible`, `transition`, `idle`, `background` und `diagnostics`. Screenreader- und Fokus-Signale sind aber user-facing; deshalb werden sie im RMT-Schedule als `user-blocking` gefuehrt und mit `metadata.fabricLane = "a11y"` korreliert.

## Schedule Records

Das Mapping erzeugt Schedule Records, die von Hosts oder `.rmt` Autorings uebernommen werden koennen:

```json
{
  "schema": "xtend.fabric.rmt-lane-schedule.v1",
  "id": "route.transition.render",
  "endpointName": "xtendrmt.route.render",
  "scope": "xtend.fabric.route.transition",
  "lane": "transition",
  "priority": 65,
  "deadlineMs": 240,
  "preferIdle": false,
  "coalesceKey": "xtend.fabric.route.transition",
  "budgetClass": "interactive",
  "metadata": {
    "contract": "xtend.fabric.rmt-lane-mapping.v1",
    "fabricLane": "transition",
    "rmtLane": "transition",
    "kernelBoundary": "RMT sees schedule policy records only; XTend execution stays in host adapters or Fabric."
  }
}
```

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

## Fiber-Aufloesung

`resolveRmtScheduleForFiber(fiber, options)` setzt die Fiber-Felder aus `xtend.fabric.fiber.v1` in Schedule-Entscheidungen um:

| Fiber-Kind | Default Schedule |
|------------|------------------|
| `component.mount` | `component.visible.mount` |
| `component.hydrate` mit `visible` | `component.visible.hydrate` |
| `component.hydrate` mit `idle` | `component.idle.hydrate` |
| `component.hydrate` mit `scheduleRef: component.lazy.hydrate` | `component.lazy.hydrate` |
| `component.render` | `component.visible.render` |
| `route.navigate` | `ui.user-blocking.input` |
| `route.render` mit `transition` | `route.transition.render` |
| `a11y.announce` | `a11y.user-blocking.announce` |
| `diagnostics.snapshot` | `diagnostics.snapshot` |

Wenn eine Fiber `scheduleRef` oder `endpointNameHint` mitbringt, kann das Mapping bereits normalisierte, vom Host uebergebene RMT Schedule Records bevorzugen. Es validiert diese Records nicht gegen das RMT Schema und importiert keinen RMT Kernel.

## Nicht-Ziele

Dieses Paket fuehrt nicht ein:

- automatische Component-Instrumentierung
- automatische XRouter-Instrumentierung
- RMT-Kernel-Imports in Fabric
- `.rmt` Parsing in Fabric
- neue RMT-Lane `a11y`
- externes Telemetry-Reporting

Diese Punkte gehoeren zu `ER-WP-14`, `ER-WP-15`, `ER-WP-16`, `ER-WP-24` und spaeteren Upstream-RMT-Paketen.

## Handoff

| Folgepaket | Status nach ER-WP-13 | Handoff |
|------------|----------------------|---------|
| `ER-WP-14` | completed | Component Mount/Hydration setzt `scheduleRef`, Lane und Endpoint konsistent |
| `ER-WP-15` | completed | Route-Fibers verbinden Navigation/Render mit Component-Fiber-Korrelation |
| `ER-WP-16` | completed | fuehrt Reporter-/Diagnostics- und Instrumentierungsdaten als Telemetry Snapshot zusammen |
| `ER-WP-20` | completed | Lazy/Idle/Visible Hydration Policies nutzen `component.visible.hydrate`, `component.idle.hydrate` und `component.lazy.hydrate` |

## Verifikation

```bash
node --check fabric/rmt-lane-mapping.js
node --check tests/fabric/fabric_rmt_lane_mapping_suite.js
node scripts/run_xtend_tests.js fabric-lane-mapping --json
node scripts/run_xtend_tests.js hydration-policy --json
node scripts/run_xtend_tests.js references --json
npm test
```

## Ergebnis

`xtend.fabric.rmt-lane-mapping.v1` ist akzeptiert. XTend-Fabric kann Fabric-Lanes deterministisch auf RMT Schedule Records abbilden, ohne die Framework-Agnostik von RMT zu verletzen.
