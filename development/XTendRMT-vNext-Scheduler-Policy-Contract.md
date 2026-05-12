# XTendRMT vNext Scheduler Policy Contract

- Status: `accepted by WP-E15-07`
- Datum: 12. Mai 2026
- Epic: `EPIC_E15_RMT_vNext_Syntax`
- Contract: `xtend.rmt.vnext-scheduler-policy.v1`
- Lane Contract: `xtend.rmt.vnext-scheduler-lane.v1`
- Depends on: `xtend.rmt.core-format.vnext.v1`
- Boundary: `no-rmt-kernel-import-of-host-runtime-types`
- Zielzustand: `rmt-vnext-scheduler-policy-ready`
- Folgepakete: `WP-E15-08`, `WP-E15-14`, `WP-E15-17`

## Zweck

Contract marker:

```text
schema: "xtend.rmt.vnext-scheduler-policy.v1"
```

Dieser Contract normalisiert vNext-Core-Lanes in host-neutrale Scheduler Policies. Runtime-Hosts muessen danach keinen DSL-Text parsen, sondern koennen Lane-Priority, Budgets, Chunking und Backpressure direkt aus Core-abgeleiteten Policy-Records lesen.

## Eingabe

Scheduler-Validation liest ausschliesslich Core-Lanes und Operation-Refs:

```json
{
  "schema": "xtend.rmt.core-format.vnext.v1",
  "lanes": [
    {
      "id": "lane:scheduler.page/root/critical",
      "name": "critical",
      "weight": 100,
      "operationRefs": [
        "operation:scheduler.page/root/critical/0"
      ],
      "sourceRef": "src:lane:scheduler.page/root/critical"
    }
  ],
  "operations": []
}
```

## Canonical Lanes

| Authoring Lane | Scheduler Lane | Priority | Budget Class | Deadline | Backpressure |
|----------------|----------------|----------|--------------|----------|--------------|
| `critical`, `urgent`, `input` | `user-blocking` | `100` | `critical` | `80ms` | `shed-deferred-work` |
| `normal`, `interactive`, `visible` | `visible` | `80` | `interactive` | `160ms` | `coalesce-by-scope` |
| `transition`, `route` | `transition` | `65` | `interactive` | `240ms` | `coalesce-by-route` |
| `idle`, `deferred` | `idle` | `35` | `background` | `500ms` | `pause-until-idle` |
| `background`, `bg` | `background` | `25` | `best_effort` | `1000ms` | `drop-stale` |
| `diagnostics`, `telemetry`, `debug` | `diagnostics` | `20` | `diagnostics` | `750ms` | `sample` |

Wenn `weight` gesetzt ist, ueberschreibt es die Default-Priority nach Normalisierung auf `0..100`. Wenn `weight` fehlt, gilt die Canonical-Lane-Priority.

## Scheduler Lane

Eine normalisierte Lane hat diese Shape:

```json
{
  "schema": "xtend.rmt.vnext-scheduler-lane.v1",
  "laneId": "lane:scheduler.page/root/critical",
  "name": "critical",
  "schedulerLane": "user-blocking",
  "operationRefs": [
    "operation:scheduler.page/root/critical/0"
  ],
  "weight": 100,
  "priority": 100,
  "budget": {
    "class": "critical",
    "deadlineMs": 80
  },
  "chunking": {
    "strategy": "cooperative",
    "maxChunkMs": 8,
    "yieldAfterMs": 12,
    "preferIdle": false
  },
  "backpressure": {
    "signal": "rmt.vnext.backpressure.user-blocking",
    "behavior": "shed-deferred-work",
    "coalescePolicy": "none"
  },
  "status": "ready",
  "diagnostics": []
}
```

## Diagnostics

| Code | Bedeutung |
|------|-----------|
| `rmt.vnext.scheduler.lane.unknown` | Lane-Name ist nicht kanonisch und wird mit sichtbarer Diagnostic auf `visible` normalisiert |
| `rmt.vnext.scheduler.lane.duplicate` | Core enthaelt doppelte Lane-IDs |
| `rmt.vnext.scheduler.weight.invalid` | Lane-Weight ist nicht numerisch |
| `rmt.vnext.scheduler.weight.out_of_range` | Lane-Weight liegt ausserhalb `0..100` und wird geklemmt |
| `rmt.vnext.scheduler.budget.invalid` | explizites Budget ist ungueltig und faellt auf das Lane-Profil zurueck |
| `rmt.vnext.scheduler.operation_ref.missing` | Lane referenziert eine fehlende Operation |
| `rmt.vnext.scheduler.operation_ref.lane_mismatch` | Operation und Lane widersprechen sich im Core |

Unknown Lanes, ungueltige Weights und ungueltige Budgets bleiben normalisierbar. Fehlende Operation-Refs, Lane-Mismatches und doppelte Lane-IDs blockieren die Policy.

## Gate

```bash
node scripts/run_xtend_tests.js rmt-vnext-scheduler --json
```

Fixture:

- `tests/rmt-language/fixtures/vnext-scheduler-valid.rmt`

Modul:

- `tools/rmt-language/vnext-scheduler.js`
