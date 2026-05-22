# XTend-Fabric RMT Lane Mapping

- Status: production mapping contract starting with `ER-WP-13`
- Contract: `xtend.docs.xtend-fabric-rmt-lane-mapping.v1`
- Mapping Contract: `xtend.fabric.rmt-lane-mapping.v1`
- Runtime: `fabric/rmt-lane-mapping.js`
- Test: `tests/fabric/fabric_rmt_lane_mapping_suite.js`

## Purpose

`fabric/rmt-lane-mapping.js` connects Fabric lanes with RMT schedule policies without building XTend into the RMT kernel.

Fabric describes UI work semantically: `user-blocking`, `a11y`, `visible`, `transition`, `idle`, `background`, `diagnostics`. RMT remains host-neutral and still sees only schedule records with `endpointName`, `scope`, `lane`, `priority`, `deadlineMs`, `preferIdle`, `coalesceKey` and `budgetClass`.

Since `WP-E13-09`, [RMT Production Readiness](./rmt-production-readiness.md) references this mapping under `xtend.epic13.rmt-production-readiness.v1` so RMT-first apps can ingest Fabric/Lane signals in a production-oriented way without violating the RMT kernel boundary.

## Lane Mapping

| Fabric Lane | RMT Schedule Lane | Reason |
|-------------|-------------------|--------|
| `user-blocking` | `user-blocking` | input, navigation and focus are critical |
| `a11y` | `user-blocking` | screen-reader and focus signals are user-facing; RMT does not yet have a dedicated `a11y` lane |
| `visible` | `visible` | visible component work |
| `transition` | `transition` | route and UI transitions |
| `idle` | `idle` | non-visible hydration and follow-up |
| `background` | `background` | best-effort work |
| `diagnostics` | `diagnostics` | telemetry and snapshots |

`a11y` therefore remains a Fabric lane. The generated RMT schedule record carries the RMT lane `user-blocking` and preserves `metadata.fabricLane = "a11y"` so reporters and later adapters can see the original semantics.

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

Important functions:

| API | Purpose |
|-----|---------|
| `createFabricRmtLaneMapping(options)` | creates a mapping object with lane map and schedule records |
| `createRmtScheduleRecords(options)` | creates host-neutral RMT schedule records for Fabric lanes |
| `resolveRmtScheduleForFiber(fiber, options)` | resolves a fiber to a schedule record |
| `normalizeFabricLaneForRmt(lane)` | translates one Fabric lane into an RMT lane |

## Example Schedule Records

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

Since `ER-WP-20`, there is also `component.lazy.hydrate` for hydration deferred below the fold or under backpressure. The RMT lane remains `idle`; the difference is in `scheduleRef`, scope and coalescing.

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

The mapping imports no XTendRMT kernel and parses no `.rmt` documents. It can already accept normalized schedule records from a host or test fixture and resolve `scheduleRef` or `endpointNameHint` against them.

Allowed:

- map Fabric fibers to RMT schedule records
- use generated schedule records as app/adapter hints
- reference existing `schedules[*]` records from normalized RMT documents
- preserve `metadata.fabricLane` for diagnostics and reporters

Not allowed:

- import the RMT runtime or kernel into Fabric
- force `a11y` as an RMT kernel lane
- execute XTend components in the RMT kernel
- duplicate RMT schema validation in Fabric

## Adapter Ingestion

Starting with Epic 10 / `WP-E10-05`, the production `xtend.component` adapter uses the same semantics as runtime context. The contract is `xtend.component.fabric-lane-ingestion.v2`.

Precedence in the adapter:

1. `rmt.schedule-record`
2. `rmt.component-metadata`
3. `fabric.runtime-override`
4. `component.static-contract`
5. `scaffold.blueprint-default`

The adapter does not import Fabric into the RMT kernel. During mounting and hydration it only resolves the Fabric context, sets `result.metadata.fabric` and marks DOM hosts with `data-xtend-fabric-lane`, `data-xtend-rmt-lane`, `data-xtend-fabric-fiber`, `data-xtend-fabric-source` and `data-rmt-endpoint`.

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

`ER-WP-20` builds on this and hardens lazy/idle/visible hydration policies with concrete `scheduleRef` decisions. Route render and XRouter navigation remain correlatable through `ER-WP-15`.
