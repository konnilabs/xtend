# Performance Regression

- Docs contract: `xtend.docs.performance-regression.v1`
- Gate contract: `xtend.performance.regression-gate.v1`
- Baseline contract: `xtend.performance.regression-baseline.v1`
- Report schema: `xtend.performance.regression-report.v1`
- Since: `ER-WP-19`

XTend already measures loader, hydration, render and route work as `xtend.performance.measurement.v1`. The Performance Regression Gate evaluates these measurements against local baselines.

## Local Gate

```bash
node scripts/run_xtend_tests.js performance-regression
npm run test:performance
node scripts/run_xtend_tests.js performance-regression --json
```

The suite uses:

- `tests/performance/performance_regression_suite.js`
- `tests/performance/baselines/local-performance-baseline.json`
- Fabric `createTelemetrySnapshot`
- budget values from `fabric/xtend-fabric.js` and `development/XTend-Performance-Budget-Matrix.md`

## Status Model

| Status | Condition | Effect |
|--------|-----------|--------|
| `pass` | `durationMs <= budgetMs` | no action |
| `warn` | `durationMs <= budgetMs * 1.5` | visible in report |
| `fail` | `durationMs > budgetMs * 1.5` | suite fails |

Warnings are calibration signals. Hard `fail` entries are regressions and appear in the runner report under `failures`. Since `WP-E13-06`, the local RC1 baseline must report `warnCount === 0`; the earlier hydration warning is closed without owner dependency through [Hydration Performance Closure](./hydration-performance-closure.md).

## Baseline

The first baseline is intentionally deterministic and local:

```text
tests/performance/baselines/local-performance-baseline.json
```

It covers at least these measurement points:

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

## JSON Report

The embedded regression report uses:

```text
xtend.performance.regression-report.v1
```

Important fields:

- `measurementSchema`
- `measurementCount`
- `passCount`
- `warnCount`
- `failCount`
- `warnings`
- `failures`
- `phaseSummary`

`phaseSummary` makes visible which phase creates budget pressure without requiring every component to have its own browser test.

## Relationship to Measurements

The regression gate builds on [Performance Measurements](./performance-measurements.md). It does not introduce a second measurement logic, but uses Fabric telemetry snapshots as the source.

## RC1 Closure

`WP-E13-06` calibrated `xtend.component.hydrate` from `36ms / 32ms` to `31ms / 32ms` without raising the budget. The failure fixture remains active and continues to prove that real budget violations fail hard.

## Handoff

`ER-WP-20` uses these reports for lazy/idle/visible hydration policies. `ER-WP-21` derived the practical rules for component authors in [Performance for component authors](./performance.md).
