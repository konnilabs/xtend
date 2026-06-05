# XTend RMT Owned Contract Budget Runtime Parity Matrix

- Status: `accepted`
- Datum: 4. Juni 2026
- Matrix Schema: `xtend.rmt-ui-maximality-owned-contract-budget-runtime-parity-matrix.v1`
- Fixture Schema: `xtend.rmt-ui-maximality-owned-contract-budget-runtime-parity-fixtures.v1`
- Report Schema: `xtend.rmt-ui-maximality-owned-contract-budget-runtime-parity-report.v1`
- Workpackage: `WP-RMO-07`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-owned-contract-budget-runtime-parity --json`

## Update-Matrix

| ID | Update-Klasse | Status | Source Contracts | Registry IDs | Runtime-/Evidence-Artefakte | Budget-/Parity-Effekt | Boundary | Handoff |
|----|---------------|--------|------------------|--------------|-----------------------------|------------------------|----------|---------|
| `RMO-PAR-01` | `contract-registry-update` | `registry-update-accepted` | Data Display, Command/Search, Recipe Extension, Browser Lab | `xtend.rmt-ui-maximality-owned-data-display-primitives.v1`, `xtend.rmt-ui-maximality-owned-command-search-primitives.v1`, `xtend.rmt-ui-maximality-owned-recipe-extension.v1`, `xtend.rmt-ui-maximality-owned-surface-browser-lab-visual-evidence.v1`, `xtend.rmt-ui-maximality-owned-contract-budget-runtime-parity.v1` | `development/XTend-RMT-Owned-*.md`, `package.json` | Release- und Audit-Reports koennen neue Contract-IDs referenzieren | `registry-is-index-not-runtime-manager` | `WP-RMO-08` |
| `RMO-PAR-02` | `runtime-parity-map` | `runtime-parity-update-accepted` | Data Display, Command/Search, Recipe Extension | same as above | `tests/fixtures/rmt-owned-data-display-primitives.rmt`, `tests/fixtures/rmt-owned-command-search-primitives.rmt`, `tests/fixtures/rmt-owned-recipe-extension.rmt`, `xtendrmt/rmt-event-routing-runtime.js` | `collectionViews[]`, `commandSources[]`, `searchSources[]`, `actions[]`, `resources[]`, `sourceMap[]` sind auf Runtime-/Fixture-Artefakte gemappt | `rmt-kernel-remains-host-neutral` | `WP-RMO-08` |
| `RMO-PAR-03` | `audit-evidence-update` | `audit-evidence-update-accepted` | Browser Lab, Recipe Extension, Parity Contract | Browser Lab und Parity Contract | `tests/fixtures/native-first/rmt-owned-contract-budget-runtime-parity-fixtures.json`, `tests/browser/fixtures/rmt-owned-surface-browser-lab.html`, `tests/browser/visual-baselines/rmt-owned-surface-browser-lab.dom-baseline.json` | Audit-Pack kann RMO Evidence mit Redaction Class `public-contract` aufnehmen | `redacted-public-contract-evidence` | `WP-RMO-09` |
| `RMO-PAR-04` | `budget-gate-update` | `budget-update-accepted` | Browser Lab, Native-First Budget Gates | Browser Lab und Parity Contract | `tests/fixtures/native-first/rmt-owned-surface-browser-lab-fixtures.json`, `tests/browser/visual-baselines/rmt-owned-surface-browser-lab.dom-baseline.json`, `package.json` | `collectionRenderMs:16`, `commandQueryMs:50`, `routeFeedbackMs:120`, `maxCumulativeLayoutShift:0.01`, `maxMutationCount:20`, `runtimeDependenciesAddedMax:0` | `no-production-budget-claim-without-gate` | `WP-RMO-09` |
| `RMO-PAR-05` | `ownerable-residuals` | `ownerable-residuals-accepted` | Data Display, Command/Search | Data Display und Command/Search | deferred components, blocked claims, residual owners | `x-table`, `x-virtual-list`, `x-command-palette`, `x-autocomplete`, `x-combobox` bleiben sichtbar ownerbar | `no-full-parity-claim-without-runtime-component-evidence` | `WP-RMO-08`, `WP-RMO-09` |

## Registry Entries

| Contract-ID | Owner | Workpackage | Gate | Report Schema | Domain | Evidence Role |
|-------------|-------|-------------|------|---------------|--------|---------------|
| `xtend.rmt-ui-maximality-owned-data-display-primitives.v1` | `component-platform-owner` | `WP-RMO-03` | `rmt-owned-data-display-primitives` | `xtend.rmt-ui-maximality-owned-data-display-primitives-report.v1` | `component` | `source-contract` |
| `xtend.rmt-ui-maximality-owned-command-search-primitives.v1` | `component-platform-owner` | `WP-RMO-04` | `rmt-owned-command-search-primitives` | `xtend.rmt-ui-maximality-owned-command-search-primitives-report.v1` | `component` | `source-contract` |
| `xtend.rmt-ui-maximality-owned-recipe-extension.v1` | `rmt-ui-authoring-owner` | `WP-RMO-05` | `rmt-owned-recipe-extension` | `xtend.rmt-ui-maximality-owned-recipe-extension-report.v1` | `rmt` | `runtime-contract` |
| `xtend.rmt-ui-maximality-owned-surface-browser-lab-visual-evidence.v1` | `browser-lab-owner` | `WP-RMO-06` | `rmt-owned-surface-browser-lab` | `xtend.rmt-ui-maximality-owned-surface-browser-lab-visual-evidence-report.v1` | `release-evidence` | `visual-evidence` |
| `xtend.rmt-ui-maximality-owned-contract-budget-runtime-parity.v1` | `contract-parity-owner` | `WP-RMO-07` | `rmt-owned-contract-budget-runtime-parity` | `xtend.rmt-ui-maximality-owned-contract-budget-runtime-parity-report.v1` | `native-first` | `gate-plan` |

## Residual Owner

| Residual | Owner | Status | Naechster Handoff |
|----------|-------|--------|-------------------|
| `x-table-runtime-component-evidence` | `component-platform-owner` | `ownerable-residual` | `WP-RMO-09` |
| `x-virtual-list-browser-performance-evidence` | `performance-owner` | `ownerable-residual` | `WP-RMO-09` |
| `x-command-palette-runtime-component-evidence` | `component-platform-owner` | `ownerable-residual` | `WP-RMO-09` |
| `x-autocomplete-ime-browser-evidence` | `component-platform-owner` | `ownerable-residual` | `WP-RMO-09` |
| `x-combobox-aria-browser-evidence` | `component-platform-owner` | `ownerable-residual` | `WP-RMO-09` |

## Auswertung

`WP-RMO-08` darf diese Matrix fuer Migration, Deprecation und Docs-Handoff verwenden. `WP-RMO-09` darf sie fuer Release-Handoff, Residual-Entscheid und conditional Pixel-Artefakte verwenden.
