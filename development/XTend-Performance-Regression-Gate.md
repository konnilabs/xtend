# XTend Performance Regression Gate

- Status: Accepted
- Datum: 6. Mai 2026
- Gate Contract: `xtend.performance.regression-gate.v1`
- Baseline Contract: `xtend.performance.regression-baseline.v1`
- Report Schema: `xtend.performance.regression-report.v1`
- Measurement Contract: `xtend.performance.measurement.v1`
- Roadmap-Paket: `ER-WP-19`
- Bezug:
  - `development/XTend-Performance-Budget-Matrix.md`
  - `development/XTend-Performance-Messpunkte-und-Snapshots.md`
  - `fabric/xtend-fabric.js`
  - `tests/performance/performance_regression_suite.js`
  - `tests/performance/baselines/local-performance-baseline.json`

## Zweck

`ER-WP-19` macht Performance-by-design zum lokalen Regression Gate. XTend wertet dafuer die in `ER-WP-18` eingefuehrten Performance Measurements aus und vergleicht sie gegen die Budget-Matrix aus `ER-WP-17`.

Das Gate ist absichtlich deterministisch. Es nutzt eine lokale Baseline und Fabric `createTelemetrySnapshot`, statt echte Browser-Laufzeitwerte direkt als harte Release-Blocker zu verwenden. Damit ist der Pfad CI-freundlich und nicht flaky.

## Contract

Der Gate-Contract lautet:

```text
xtend.performance.regression-gate.v1
```

Jeder Report nutzt:

```text
xtend.performance.regression-report.v1
```

Jede lokale Baseline nutzt:

```text
xtend.performance.regression-baseline.v1
```

## Auswertung

Die Suite erzeugt aus Performance Entries einen Fabric Telemetry Snapshot und liest daraus `xtend.performance.measurement.v1` Records.

Die Budgetlogik bleibt identisch zur Budget-Matrix:

| Status | Bedingung | Gate-Wirkung |
|--------|-----------|--------------|
| `pass` | `durationMs <= budgetMs` | keine Aktion |
| `warn` | `durationMs <= budgetMs * 1.5` | Report-Signal, kein harter Blocker |
| `fail` | `durationMs > budgetMs * 1.5` | lokaler Gate-Fail |

Warnungen bleiben sichtbar, damit die Baselines spaeter kalibriert werden koennen. Harte Failures duerfen fuer Kernpfade nicht still passieren.

## Baseline

Die erste Baseline liegt unter:

```text
tests/performance/baselines/local-performance-baseline.json
```

Sie deckt diese Phasen ab:

- `load`
- `define`
- `mount`
- `hydrate`
- `render`
- `update`
- `event`
- `route`
- `diagnostics`

Seit `WP-E13-06` enthaelt die Baseline keine offene Hydration-Warnung mehr. `xtend.component.hydrate` liegt bei `31ms` unter dem unveraenderten `32ms` Budget; die Suite erwartet fuer RC1 `warnCount === 0`.

## JSON-Report

Ein Report enthaelt:

- `schema`
- `contract`
- `baseline`
- `measurementSchema`
- `measurementCount`
- `passCount`
- `warnCount`
- `failCount`
- `warnings`
- `failures`
- `checks`
- `phaseSummary`

Budgetverletzungen erscheinen unter `failures` und fuehren zu einem fehlgeschlagenen Runner-Report.

## Lokale Gates

```bash
node scripts/run_xtend_tests.js performance-regression --json
npm run test:performance
npm test
```

## Handoff

| Folgepaket | Startstatus nach ER-WP-19 | Handoff |
|------------|---------------------------|---------|
| `ER-WP-20` | completed | haertet Lazy/Idle/Visible Hydration Policies gegen Budget-Failures und Lane-Budgets |
| `ER-WP-21` | completed | Komponentenautor-Doku nutzt dieselben Profile, Phasen, Hydration Policies und Reportfelder |
| `ER-WP-37` | unblocked-by-performance | kann spaeter schnelle PR-Gates und volle Performance-/Browser-Gates trennen |
| `WP-E13-06` | completed | schliesst `xtend.component.hydrate` owner-frei und haelt das 32ms Budget |

## Ergebnis

XTend besitzt mit `xtend.performance.regression-gate.v1` ein lokales, deterministisches Performance Regression Gate. Die Suite macht Budget-Fails hart sichtbar, erwartet fuer die RC1-Baseline keine Warnungen mehr und nutzt die bestehende Fabric-Telemetry statt einen zweiten Messpfad aufzubauen.
