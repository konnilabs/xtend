# ER-WP-13 - Lane Mapping auf RMT Schedules definieren

- Status: `completed`
- Datum: 5. Mai 2026
- Roadmap: `development/ROADMAP-XTend-Enterprise-Reife.md`
- Contract: `xtend.enterprise.er-wp-13.rmt-lane-mapping.v1`
- Mapping Contract: `xtend.fabric.rmt-lane-mapping.v1`
- Schedule Wrapper Contract: `xtend.fabric.rmt-lane-schedule.v1`
- Runtime Entry: `fabric/rmt-lane-mapping.js`
- Bezug:
  - `development/XTend-Fiber-und-Lane-Contract.md`
  - `development/XTend-Fabric-RMT-Lane-Mapping.md`
  - `development/WP-E05-07-Schedules-Domain-als-referenzierbare-Policy-haerten.md`
  - `development/ER-WP-08-Fabric-Runtime-Skeleton-implementieren.md`
  - `development/XTend-Dokumentations-und-Demo-Referenzpfade.md`
  - `docs/xtend-fabric-rmt-lane-mapping.md`
  - `fabric/rmt-lane-mapping.js`
  - `tests/fabric/fabric_rmt_lane_mapping_suite.js`
  - `package.json`

## Ziel

`ER-WP-13` verbindet die in `ER-WP-12` definierten Fabric-Lanes mit den nativen RMT Schedule Policies aus Epic 05.

Das Paket ist eine Bridge- und Contract-Arbeit. Es instrumentiert noch keine Komponenten. Der RMT Kernel bleibt framework-agnostisch und sieht weiterhin nur `schedules[*]` Records und Endpoint-Namen.

## Ergebnisartefakte

| Artefakt | Status | Rolle |
|----------|--------|-------|
| `fabric/rmt-lane-mapping.js` | produktiv | Fabric-seitiges Mapping von Lanes und Fibers auf RMT Schedule Records |
| `development/XTend-Fabric-RMT-Lane-Mapping.md` | akzeptiert | Contract- und Architekturentscheidung fuer `xtend.fabric.rmt-lane-mapping.v1` |
| `tests/fabric/fabric_rmt_lane_mapping_suite.js` | produktiv | lokaler Mapping-Gate |
| `docs/xtend-fabric-rmt-lane-mapping.md` | produktiv | offizieller Entwicklerguide |
| `npm run test:fabric-lanes` | produktiv | lokaler Einzelgate |

## Mapping-Ergebnis

| Fabric-Lane | RMT Schedule Lane | Default Schedule |
|-------------|-------------------|------------------|
| `user-blocking` | `user-blocking` | `ui.user-blocking.input` |
| `a11y` | `user-blocking` | `a11y.user-blocking.announce` |
| `visible` | `visible` | `component.visible.render` |
| `transition` | `transition` | `route.transition.render` |
| `idle` | `idle` | `component.idle.hydrate` |
| `background` | `background` | `ui.background.work` |
| `diagnostics` | `diagnostics` | `diagnostics.snapshot` |

Die Fabric-Lane `a11y` wird nicht als neue RMT-Lane eingefuehrt. Sie wird auf `user-blocking` gemappt und bleibt ueber `metadata.fabricLane = "a11y"` diagnostizierbar.

## Runtime Surface

Das Mapping-Modul exportiert:

```js
createFabricRmtLaneMapping(options)
createRmtScheduleRecords(options)
resolveRmtScheduleForFiber(fiber, options)
normalizeFabricLaneForRmt(lane, options)
```

Im Browser steht optional `window.XTendFabricRmtLaneMapping` bereit. Das Modul importiert keinen XTendRMT Kernel.

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Mapping ist testbar | erfuellt: `node scripts/run_xtend_tests.js fabric-lane-mapping --json` |
| alle Fabric-Lanes sind gemappt | erfuellt: sieben Fabric-Lanes auf sechs RMT Schedule-Lanes |
| `a11y` bleibt Fabric-semantisch | erfuellt: RMT-Lane `user-blocking`, `metadata.fabricLane = "a11y"` |
| RMT Kernel bleibt framework-agnostisch | erfuellt: kein RMT Runtime Import, Schedule Records only |
| Beispiel `.rmt` Schedule Records existieren | erfuellt: Contract- und Docs-Beispiele plus generierte Schedule Records |
| Folgepaket `ER-WP-14` kann starten | erfuellt |

## Handoff an Folgepakete

| Folgepaket | Startstatus nach ER-WP-13 | Handoff |
|------------|---------------------------|---------|
| `ER-WP-14` | completed | Component Mount/Hydration instrumentiert Fibers mit `scheduleRef` und Lane-Entscheidung |
| `ER-WP-15` | completed | Route Render und XRouter Navigation nutzen `scheduleRef` und Lane-Entscheidung |
| `ER-WP-16` | completed | fuehrt Reporter-/Diagnostics- und Instrumentierungsdaten als Telemetry Snapshot zusammen |
| `ER-WP-20` | completed | bezieht Lazy/Idle/Visible Hydration Policies auf Schedule Records |

## Verifikation

Mindestgate fuer dieses Paket:

```bash
node --check fabric/rmt-lane-mapping.js
node --check tests/fabric/fabric_rmt_lane_mapping_suite.js
node scripts/run_xtend_tests.js fabric-lane-mapping --json
node scripts/run_xtend_tests.js references --json
npm test
```

## Ergebnis

`ER-WP-13` ist abgeschlossen. XTend-Fabric besitzt eine feste, testbare Bridge von Fabric-Lanes und Fiber-Kinds auf RMT Schedule Records. `ER-WP-14`, `ER-WP-15`, `ER-WP-11` und `ER-WP-16` sind inzwischen abgeschlossen.
