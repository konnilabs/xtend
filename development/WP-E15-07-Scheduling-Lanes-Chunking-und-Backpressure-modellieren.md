# WP-E15-07 - Scheduling, Lanes, Chunking und Backpressure modellieren

- Status: `completed`
- Datum: 12. Mai 2026
- Epic: `EPIC_E15_RMT_vNext_Syntax`
- Core Contract: `xtend.rmt.core-format.vnext.v1`
- Scheduler Contract: `xtend.rmt.vnext-scheduler-policy.v1`
- Lane Contract: `xtend.rmt.vnext-scheduler-lane.v1`
- Boundary: `no-rmt-kernel-import-of-host-runtime-types`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-vnext-scheduler --json`
- Package Script: `npm run test:rmt-vnext-scheduler`
- Zielzustand: `rmt-vnext-scheduler-policy-ready`

## Ziel

`WP-E15-07` macht Scheduling auf vNext-Core-Ebene interpretierbar. Lanes werden in host-neutrale Scheduler Policies normalisiert, inklusive Priority, Weight, Budget, Chunking und Backpressure. Runtime-Hosts sollen dadurch Scheduling lesen koennen, ohne Authoring-DSL zu parsen.

## Umgesetzt

- `tools/rmt-language/vnext-scheduler.js` als Scheduler-Policy-Modul angelegt
- Contract-Schema `xtend.rmt.vnext-scheduler-policy.v1` eingefuehrt
- Lane-Schema `xtend.rmt.vnext-scheduler-lane.v1` eingefuehrt
- Canonical Scheduler Lanes definiert: `user-blocking`, `visible`, `transition`, `idle`, `background`, `diagnostics`
- Authoring-Aliases wie `critical`, `normal`, `deferred`, `telemetry` auf Canonical Lanes gemappt
- `weight` auf Priority `0..100` normalisiert
- Default-Budgets, Deadline, Chunking und Backpressure pro Lane-Profil festgelegt
- Operation-Refs aus Core-Lanes validiert
- Diagnostics fuer unknown lanes, duplicate lanes, invalid weights, invalid budgets, missing operation refs und lane mismatches umgesetzt
- `tests/rmt-language/fixtures/vnext-scheduler-valid.rmt` als Scheduler-Fixture angelegt
- `tests/rmt-language/rmt_vnext_scheduler_suite.js` als Gate-Suite angelegt
- `scripts/run_xtend_tests.js` um `rmt-vnext-scheduler` erweitert
- `package.json` um Export, Metadaten und Script fuer den Scheduler Contract erweitert
- Epic-Backlog aktualisiert: `WP-E15-07` completed, `WP-E15-08` bleibt ready

## Implementierungsentscheidung

Der Scheduler Contract ist eine host-neutrale Policy-Schicht ueber dem Core-Compiler:

- `tools/rmt-language/vnext-scheduler.js`

Er liest:

- `coreDocument.lanes[]`
- `coreDocument.operations[]`
- `coreDocument.sourceMap[]`

Er erzeugt:

- Scheduler Policy
- normalisierte Scheduler Lanes
- Priority- und Budget-Metadaten
- Chunking- und Backpressure-Metadaten
- Source-map-faehige Diagnostics

Er importiert keine Fabric- oder Runtime-Module. Bestehende Fabric-Lane-Konzepte werden als Mapping-Hinweise modelliert, nicht als harte Runtime-Abhaengigkeit.

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Lanes sind validierbar und referenzierbar | erfuellt: Operation-Refs werden gegen Core-Operationen geprueft |
| Hosts koennen Scheduler Policies ohne DSL-Text interpretieren | erfuellt: Policy enthaelt Priority, Budget, Chunking und Backpressure |
| Budgetdiagnostics sind vorhanden | erfuellt: `rmt.vnext.scheduler.budget.invalid` |
| Gewichtung ist normalisiert | erfuellt: `weight` wird auf Priority `0..100` abgebildet |
| Lane-Konflikte sind diagnostizierbar | erfuellt: duplicate lane IDs und lane mismatches blockieren |
| lokaler Scheduler-Gate vorhanden | erfuellt: `rmt-vnext-scheduler` |

## Verifikation

```bash
node scripts/run_xtend_tests.js rmt-vnext-scheduler --json
```

Ergebnis:

- Status: `passed`
- Suites: `1`
- Passes: `68`
- Failures: `0`
- Warnings: `0`

Zusaetzliche Regression-Gates:

```bash
node scripts/run_xtend_tests.js rmt-vnext-lifecycle --json
node scripts/run_xtend_tests.js rmt-vnext-compiler --json
node scripts/run_xtend_tests.js rmt-vnext-parser --json
node scripts/run_xtend_tests.js rmt-parser --json
node scripts/run_xtend_tests.js references --json
```

Ergebnisse:

- `rmt-vnext-lifecycle`: `passed`, `75` Passes, `0` Failures, `0` Warnings
- `rmt-vnext-compiler`: `passed`, `65` Passes, `0` Failures, `0` Warnings
- `rmt-vnext-parser`: `passed`, `57` Passes, `0` Failures, `0` Warnings
- `rmt-parser`: `passed`, `84` Passes, `0` Failures, `0` Warnings
- `references`: `passed`, `7472` Passes, `0` Failures, `0` Warnings
- `package.json` JSON parse: `passed`

## Handoff

`WP-E15-07` ist abgeschlossen. `WP-E15-08` kann Surface-Orchestrierung und Surface Registry auf normalisierte Lane Policies beziehen.

`WP-E15-14` bleibt blocked, bis `WP-E15-12` und `WP-E15-13` abgeschlossen sind.

Noch nicht Teil von `WP-E15-07`:

- Surface Registry Runtime
- echte Host-Scheduler-Ausfuehrung
- Event-/Action-Execution
- Streaming Runtime
- Import-Aufloesung
- Browser-Smokes
