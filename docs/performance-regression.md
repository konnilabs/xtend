# Performance Regression

- Docs Contract: `xtend.docs.performance-regression.v1`
- Gate Contract: `xtend.performance.regression-gate.v1`
- Baseline Contract: `xtend.performance.regression-baseline.v1`
- Report Schema: `xtend.performance.regression-report.v1`
- Seit: `ER-WP-19`

XTend misst Loader-, Hydration-, Render- und Route-Arbeit bereits als `xtend.performance.measurement.v1`. Das Performance Regression Gate wertet diese Measurements gegen lokale Baselines aus.

## Lokaler Gate

```bash
node scripts/run_xtend_tests.js performance-regression
npm run test:performance
node scripts/run_xtend_tests.js performance-regression --json
```

Die Suite nutzt:

- `tests/performance/performance_regression_suite.js`
- `tests/performance/baselines/local-performance-baseline.json`
- Fabric `createTelemetrySnapshot`
- Budgetwerte aus `fabric/xtend-fabric.js` und `development/XTend-Performance-Budget-Matrix.md`

## Statusmodell

| Status | Bedingung | Wirkung |
|--------|-----------|---------|
| `pass` | `durationMs <= budgetMs` | keine Aktion |
| `warn` | `durationMs <= budgetMs * 1.5` | sichtbar im Report |
| `fail` | `durationMs > budgetMs * 1.5` | Suite schlaegt fehl |

Warnungen sind Kalibrierungssignale. Harte `fail`-Eintraege sind Regressionen und erscheinen im Runner-Report unter `failures`. Seit `WP-E13-06` muss die lokale RC1-Baseline `warnCount === 0` melden; die fruehere Hydration-Warnung ist ueber [Hydration Performance Closure](./hydration-performance-closure.md) owner-frei geschlossen.

## Baseline

Die erste Baseline ist bewusst deterministisch und lokal:

```text
tests/performance/baselines/local-performance-baseline.json
```

Sie deckt mindestens diese Messpunkte ab:

- `xtend.loader.manifest`
- `xtend.loader.module`
- `xtend.component.define`
- `xtend.component.mount`
- `xtend.component.hydrate`
- `xtend.component.render`
- `xtend.component.update`
- `xtend.event.handler`
- `xtend.route.navigate`
- `xtend.route.render`
- `xtend.diagnostics.snapshot`

## JSON-Report

Der eingebettete Regression-Report nutzt:

```text
xtend.performance.regression-report.v1
```

Wichtige Felder:

- `measurementSchema`
- `measurementCount`
- `passCount`
- `warnCount`
- `failCount`
- `warnings`
- `failures`
- `phaseSummary`

`phaseSummary` macht sichtbar, welche Phase Budgetdruck erzeugt, ohne dass jede Komponente einen eigenen Browser-Test braucht.

## Beziehung zu Measurements

Das Regression Gate baut auf [Performance Measurements](./performance-measurements.md) auf. Es fuehrt keine zweite Messlogik ein, sondern nimmt Fabric Telemetry Snapshots als Quelle.

## RC1 Closure

`WP-E13-06` hat `xtend.component.hydrate` von `36ms / 32ms` auf `31ms / 32ms` kalibriert, ohne das Budget anzuheben. Die Failure-Fixture bleibt aktiv und belegt weiterhin, dass echte Budgetverletzungen hart fehlschlagen.

## Handoff

`ER-WP-20` nutzt diese Reports fuer Lazy/Idle/Visible Hydration Policies. `ER-WP-21` hat daraus die praktischen Regeln fuer Komponentenautoren in [Performance fuer Komponentenautoren](./performance.md) abgeleitet.
