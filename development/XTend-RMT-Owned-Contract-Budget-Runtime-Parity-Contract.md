# XTend RMT Owned Contract Budget Runtime Parity Contract

- Status: `accepted`
- Datum: 4. Juni 2026
- Contract: `xtend.rmt-ui-maximality-owned-contract-budget-runtime-parity.v1`
- Matrix Schema: `xtend.rmt-ui-maximality-owned-contract-budget-runtime-parity-matrix.v1`
- Fixture Schema: `xtend.rmt-ui-maximality-owned-contract-budget-runtime-parity-fixtures.v1`
- Report Schema: `xtend.rmt-ui-maximality-owned-contract-budget-runtime-parity-report.v1`
- Workpackage: `WP-RMO-07`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-owned-contract-budget-runtime-parity --json`
- Package Script: `npm run test:rmt-owned-contract-budget-runtime-parity`
- Bezug:
  - `development/BACKLOG-XTend-RMT-UI-Maximality-und-Owned-Component-Surface-Hardening.md`
  - `development/XTend-RMT-Owned-Data-Display-Primitives-Contract.md`
  - `development/XTend-RMT-Owned-Command-Search-Primitives-Contract.md`
  - `development/XTend-RMT-Owned-Recipe-Extension-Contract.md`
  - `development/XTend-RMT-Owned-Surface-Browser-Lab-Visual-Evidence-Contract.md`
  - `development/XTend-Native-First-Contract-Registry-Contract.md`
  - `development/XTend-Native-First-Contract-Runtime-Parity-Contract.md`
  - `development/XTend-Native-First-Audit-Evidence-Pack-Contract.md`
  - `development/XTend-Native-First-Performance-Complexity-Bundle-Budget-Gates-Contract.md`
  - `tests/fixtures/native-first/rmt-owned-contract-budget-runtime-parity-fixtures.json`
  - `tests/native-first/rmt_owned_contract_budget_runtime_parity_suite.js`

## Zweck

`WP-RMO-07` produktisiert die in `WP-RMO-03` bis `WP-RMO-06` entstandenen owned Data-Display-, Command/Search-, Recipe- und Browser-Lab-Artefakte fuer `Contract Registry`, `Runtime Parity`, `Audit Evidence` und `Budget Gates`. Release- und Audit-Reports duerfen die neuen RMO-Contract-IDs referenzieren, wenn sie ueber dieses Paket auf Owner, Gate, Report Schema, Runtime-Artefakte, Evidence-Pfade und Budget-Schwellen zeigen.

## Update-Oberflaechen

| Oberflaeche | Update | Boundary |
|-------------|--------|----------|
| `contract-registry` | RMO-Contract-IDs werden als `registry-update-entry` mit Owner, Gate, Docs-Pfad und Report Schema beschrieben | `registry-is-index-not-runtime-manager` |
| `contract-runtime-parity` | RMO-Primitives werden auf RMT-Fixtures, Runtime-Artefakte, Browser-Lab-Fixture und DOM-Baseline gemappt | `rmt-kernel-remains-host-neutral` |
| `native-first-evidence-pack` | Audit-Evidence Items koennen RMO-Contracts, Matrices, Fixtures und Gates referenzieren | `redacted-public-contract-evidence` |
| `native-first-budget-gates` | Collection, Command/Search, Route, CLS, Mutation und Dependency-Budgets werden als RMO-Budget-Entries beschrieben | `no-production-budget-claim-without-gate` |

## Contract-IDs

| Contract-ID | Owner | Gate |
|-------------|-------|------|
| `xtend.rmt-ui-maximality-owned-data-display-primitives.v1` | `component-platform-owner` | `rmt-owned-data-display-primitives` |
| `xtend.rmt-ui-maximality-owned-command-search-primitives.v1` | `component-platform-owner` | `rmt-owned-command-search-primitives` |
| `xtend.rmt-ui-maximality-owned-recipe-extension.v1` | `rmt-ui-authoring-owner` | `rmt-owned-recipe-extension` |
| `xtend.rmt-ui-maximality-owned-surface-browser-lab-visual-evidence.v1` | `browser-lab-owner` | `rmt-owned-surface-browser-lab` |
| `xtend.rmt-ui-maximality-owned-contract-budget-runtime-parity.v1` | `contract-parity-owner` | `rmt-owned-contract-budget-runtime-parity` |

## Budget-Schwellen

| Budget | Schwelle | Evidence |
|--------|----------|----------|
| `collectionRenderMs` | `16` | `tests/fixtures/native-first/rmt-owned-surface-browser-lab-fixtures.json` |
| `commandQueryMs` | `50` | `tests/browser/fixtures/rmt-owned-surface-browser-lab.html` |
| `routeFeedbackMs` | `120` | `tests/browser/visual-baselines/rmt-owned-surface-browser-lab.dom-baseline.json` |
| `maxCumulativeLayoutShift` | `0.01` | `tests/browser/visual-baselines/rmt-owned-surface-browser-lab.dom-baseline.json` |
| `maxMutationCount` | `20` | `tests/fixtures/native-first/rmt-owned-surface-browser-lab-fixtures.json` |
| `runtimeDependenciesAddedMax` | `0` | `package.json` |

## Nicht-Ziele

- keine Mutation der Native-First Registry zur Laufzeit
- keine zweite Contract-, Surface-, Component- oder Command-Registry
- keine neue Runtime-Dependency
- keine DataGrid-, Command-Palette-, Autocomplete- oder Virtualization-Vollstaendigkeitsclaims
- keine Browser-Pixel-Pflicht im lokalen Gate
- kein Import von XTend-Komponenten oder Browser-Typen in den RMT-Kernel
- Boundary Literal: `no-full-parity-claim-without-runtime-component-evidence`
- Dependency Boundary: `no-runtime-dependency`

## Source Gates

| Gate | Zweck |
|------|-------|
| `rmt-owned-contract-budget-runtime-parity` | lokaler WP-RMO-07 Gate |
| `contract-registry` | Contract-ID-Discoverability |
| `contract-runtime-parity` | Runtime-Artefakt- und Residual-Mapping |
| `native-first-evidence-pack` | Audit- und Release-Evidence |
| `native-first-budget-gates` | Performance-, Complexity- und Browser-Evidence-Boundary |
| `rmt-owned-data-display-primitives` | Data Display Source Contract |
| `rmt-owned-command-search-primitives` | Command/Search Source Contract |
| `rmt-owned-recipe-extension` | RMO Recipe Source Contract |
| `rmt-owned-surface-browser-lab` | Browser-Lab und Visual Evidence Source Contract |
| `references` | stabile Pfade |

## Handoff

`WP-RMO-07` macht `WP-RMO-08` startbar: Migration, Deprecation und Docs-Handoff koennen nun auf gatebare RMO-Contract-, Evidence-, Runtime-Parity- und Budget-Eintraege zeigen. `WP-RMO-09` uebernimmt die Release-Handoff-Entscheidung und conditional Pixel-Artefakte.
