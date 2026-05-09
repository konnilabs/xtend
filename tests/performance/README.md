# XTend Performance Regression Gates

- Suite: `performance-regression`
- Gate Contract: `xtend.performance.regression-gate.v1`
- Baseline Contract: `xtend.performance.regression-baseline.v1`
- Report Schema: `xtend.performance.regression-report.v1`

## Zweck

Diese Suite wertet die seit `ER-WP-18` vorhandenen `xtend.performance.measurement.v1` Records gegen die Budget-Matrix aus `development/XTend-Performance-Budget-Matrix.md` aus.

Der erste Gate ist bewusst deterministisch:

- keine Browser-Timing-Abhaengigkeit
- keine Netzwerkannahmen
- keine echte CI-Lastmessung
- lokale Baseline aus `tests/performance/baselines/local-performance-baseline.json`
- Auswertung ueber Fabric `createTelemetrySnapshot`

## Lokale Ausfuehrung

```bash
node scripts/run_xtend_tests.js performance-regression
npm run test:performance
node scripts/run_xtend_tests.js performance-regression --json
```

## Gate-Stufen

| Status | Bedeutung | Gate-Wirkung |
|--------|-----------|--------------|
| `pass` | `durationMs <= budgetMs` | kein Signal |
| `warn` | `durationMs <= budgetMs * 1.5` | im Report sichtbar, kein harter Blocker |
| `fail` | `durationMs > budgetMs * 1.5` | Suite schlaegt fehl |

## Handoff

`ER-WP-20` hat auf diesem Gate Lazy/Idle/Visible Hydration Policies gehaertet. `ER-WP-21` dokumentiert dieselben Budget-, Hydration- und Reportbegriffe fuer Komponentenautoren in `docs/performance.md`.
