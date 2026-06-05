# Component Catalog Coverage

- Status: `stable-reference-bridge`
- Docs Contract: `xtend.docs.component-catalog-coverage.v1`
- Coverage Contract: `xtend.catalog.component-coverage-matrix.v1`
- Workpackage Anchor: `WP-E11-17`

## Purpose

This file is the stable developer-docs bridge for the manifest-wide Component Catalog Coverage report. It keeps legacy suite paths resolvable and documents how catalog coverage feeds the long-tail migration plan.

## Coverage Model

`catalog/component-catalog-coverage.js` evaluates component entries across source, docs, component suite, fixture, public types, a11y and performance coverage. The long-tail migration gate consumes that report and keeps only non-enterprise-ready entries visible after prior hardening waves. The current long-tail entries are `xstate`, `x-utils` and `xtend-i18n`.

## Local Verification

```bash
node scripts/run_xtend_tests.js catalog-coverage --json
npm run test:catalog-coverage
```

Run the combined migration check when catalog status, regression priority or long-tail docs change:

```bash
node scripts/run_xtend_tests.js component-long-tail-migration catalog-coverage regression-priority references --json
```
