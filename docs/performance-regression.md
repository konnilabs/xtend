# XTend Performance Regression Gate

- Status: `local deterministic gate`
- Gate Contract: `xtend.performance.regression-gate.v1`
- Baseline Contract: `xtend.performance.regression-baseline.v1`
- Report Schema: `xtend.performance.regression-report.v1`
- Local Gate: `node scripts/run_xtend_tests.js performance-regression --json`

## Purpose

The Performance Regression Gate evaluates deterministic local performance measurements against the checked-in baseline at `tests/performance/baselines/local-performance-baseline.json`.

It is a source gate for Native-First budget decisions. Production browser timing claims still require browser evidence or release-owner review, but local regressions must remain visible before a feature can claim Native-First compliance.

## Budget Rules

- Local baseline entries use `xtend.performance.regression-baseline.v1`.
- Reports use `xtend.performance.regression-report.v1`.
- Hard failures block the gate.
- Warning count is expected to stay at zero for the current RC baseline.
- Hydration, render, event and route measures must remain connected to Fabric telemetry snapshots.

## Native-First Link

`NFM-WP-19` references this gate for mount, hydration, interaction and scheduler budget claims. A feature may not use this gate as a real-browser claim unless a Browser-Lab artifact is attached separately.
