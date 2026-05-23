# Component Catalog Coverage

- Contract: `xtend.docs.component-catalog-coverage.v1`
- Matrix Contract: `xtend.catalog.component-coverage-matrix.v1`
- Gate Contract: `xtend.catalog.component-coverage-gate.v1`
- Workpackage: `ER-WP-31`, continued by `ER-WP-32`, `ER-WP-33`,
  `ER-WP-34`, `ER-WP-35`, `WP-E11-12`, `WP-E11-17`, `WP-E12-02`,
  `WP-E12-03`, `WP-E12-04`, `WP-E12-05`, `WP-E12-06`, `WP-E12-07`,
  `WP-E12-08`, `WP-E12-09`, `WP-E13-12A`, `WP-SM-03`, `WP-SM-04`, and
  `RC1TB-WP-03`

The Component Catalog Coverage Matrix shows how mature each component from
`components/manifest.json` currently is. It combines source, documentation,
component-level suite, fixture, types, accessibility, and performance into one
status model.

## Check Locally

```bash
npm run test:catalog-coverage
node scripts/run_xtend_tests.js catalog-coverage --json
```

The gate is green when all manifest sources resolve locally and the matrix
report is structurally valid. Missing suites, fixtures, types, a11y profiles,
and performance profiles appear as warnings. This lets the catalog harden step
by step without hiding follow-up work.

## Status Model

| Status | Meaning |
|--------|---------|
| `enterprise-ready` | complete source, docs, suite, fixture, types, a11y, and performance coverage |
| `typed-contract-gated` | types and a11y exist, performance is still missing |
| `contract-gated` | source, docs, component suite, and fixture exist |
| `documented` | source and docs exist |
| `source-only` | source exists, docs or gates are missing |
| `missing-source` | manifest points to no local source; this state blocks |

## Current State

The snapshot after `RC1TB-WP-03` shows:

- 44 manifest components
- 44 local source files
- 44 component docs
- 44 component-level suites and fixtures
- 44 public type artifacts for prioritized components
- 43 components with a recognizable a11y surface
- 42 components with an explicit runtime/UI performance profile

`x-input`, `x-select`, `x-checkbox`, `x-radio`,
`x-rmt-lifecycle-demo-build`, `x-textarea`, `x-form`, `x-calendar`,
`x-writer`, `x-status`, `x-progress`, `x-tooltip`, `x-popover`, `x-drawer`,
`x-surface-manager`, `x-surface-portal`, `x-surface-region`,
`x-surface-window`, `x-side-panel`, `x-modal`,
`x-dialog`, `x-alert`, `x-toast`, `x-spinner`, `x-router`, `x-link`,
`x-tabs`, `x-theme`, `x-button`, `x-icon`, `x-menu`, `x-footer`,
`x-lightbox`, `x-masonry`, `x-code`, `x-header`, `x-hero`, `x-type`,
`x-summary`, `x-section`, `x-cards`, and `x-player` form the current
`enterprise-ready` line: source, docs, component suite, fixture, public types,
a11y, and performance profile are complete. Since
[Known Residual Triage](./known-residual-triage.md), `xstate` is closed as a
runtime boundary and `x-utils` is closed as a utility boundary. Both
intentionally remain outside the visual `enterprise-ready` component class.

Since `ER-WP-35`, the regression priority plan
`xtend.catalog.component-regression-priority-plan.v1` also exists. It
prioritizes all 44 manifest entries for `desktop-1280`, `mobile-390`, `light`,
`dark`, `forced-colors`, `reduced-motion`, browser smokes, and performance
profile derivation. The 42 visible runtime/UI components bring their
performance profiles; `xstate` and `x-utils` are evaluated through their
boundary contracts instead.

## Handoff

| Package | Responsibility |
|---------|----------------|
| `ER-WP-32` | completed: close docs and naming gaps |
| `ER-WP-33` | completed: add component-level suites and fixtures for prioritized components |
| `ER-WP-34` | completed: complete public types and event contracts for prioritized components |
| `ER-WP-35` | completed: prioritize long-tail suites, performance profiles, visual and browser-near regression |
| `WP-E11-12` | completed: bring layout, display, and media shell maturity into catalog, types, suites, and performance profiles |

`WP-E11-17` combines this matrix with the regression priority plan in
`xtend.epic11.legacy-long-tail-migration.v1`. After `WP-E12-09`, `x-tabs`,
`x-theme`, `x-button`, and `x-menu` are closed from this long tail. Since
`WP-E13-05`, `xstate` and `x-utils` are also closed as boundary contracts:
`xstate` as a runtime boundary with suite, fixture, types, lifecycle events,
Fabric diagnostics, and RMT state adapter; `x-utils` as a utility boundary with
utility contract, import policy, fixture, and public types. The gate
`node scripts/run_xtend_tests.js component-long-tail-migration --json`
continues to check this closed long-tail line against plan, package, scaffold,
references, and handoff.

The complete matrix lives in
`development/XTend-Component-Catalog-Coverage-Matrix.md`. The naming
convention lives in `development/XTend-Component-Catalog-Naming-Konvention.md`.
Public types are documented in `docs/public-component-types.md`.
Visual/browser regression is documented in `docs/visual-browser-regression.md`.
The machine-readable coverage module lives in
`catalog/component-catalog-coverage.js`; the regression priority plan lives in
`catalog/component-regression-priority.js`; the long-tail migration plan lives
in `catalog/component-long-tail-migration.js`.
