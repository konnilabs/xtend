# XTend RMT Owned Recipe Extension Matrix

- Status: `accepted`
- Datum: 4. Juni 2026
- Contract: `xtend.rmt-ui-maximality-owned-recipe-extension.v1`
- Matrix Schema: `xtend.rmt-ui-maximality-owned-recipe-extension-matrix.v1`
- Fixture Schema: `xtend.rmt-ui-maximality-owned-recipe-extension-fixtures.v1`
- RMT Fixture Schema: `xtend.rmt-ui-maximality-owned-recipe-extension.rmt-fixture.v1`
- Report Schema: `xtend.rmt-ui-maximality-owned-recipe-extension-report.v1`
- Workpackage: `WP-RMO-05`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-owned-recipe-extension --json`

## Bewertungsrahmen

| Feld | Werte |
|------|-------|
| `status` | `recipe-accepted-scoped-owned`, `recipe-accepted-contract-evidence`, `migration-fixture-accepted`, `negative-fixture-accepted` |
| `recipeClass` | `dashboard-data-display`, `command-search-workspace`, `crud-navigation-async`, `recipe-migration`, `negative-security-policy` |
| `claimBoundary` | `allowed-with-scoped-owned-package`, `allowed-with-contract-evidence`, `allowed-migration-fixture`, `blocked-negative-claim` |

## Recipe Extension Matrix

| ID | Recipe Class | Status | Source Recipes | Source Packages | RMT Records | Owned Primitive Use | Source Map / Diagnostics | Claim Boundary | Next Handoff |
|----|--------------|--------|----------------|-----------------|-------------|---------------------|--------------------------|----------------|--------------|
| `RMO-RCR-10` | `dashboard-data-display` | `recipe-accepted-scoped-owned` | `NFM-RCR-02`, `NFM-RCR-06` | `WP-RMO-03` | `collectionViews[]`, `templates[]`, `dataSources[]`, `resources[]`, `selectors[]`, `state[]`, `actions[]`, `sourceMap[]` | `x-section`, `x-cards`, `x-summary`, `x-status`, `x-progress`, `x-alert` | `/collectionViews/0`, `rmt.recipe.collection.source_missing`, `rmt.recipe.collection.template_missing` | `allowed-with-scoped-owned-package` | `WP-RMO-06`, `WP-RMO-07` |
| `RMO-RCR-11` | `command-search-workspace` | `recipe-accepted-scoped-owned` | `NFM-RCR-07` | `WP-RMO-04` | `commandSources[]`, `searchSources[]`, `surfaces[]`, `events[]`, `actions[]`, `effects[]`, `resources[]`, `state[]`, `sourceMap[]` | `x-input`, `x-button`, `x-menu`, `x-popover`, `x-status`, `x-progress`, `x-alert`, `x-icon` | `/commandSources/0`, `/searchSources/0`, `rmt.recipe.command.action_ref_missing`, `rmt.recipe.search.resource_missing` | `allowed-with-scoped-owned-package` | `WP-RMO-06`, `WP-RMO-07` |
| `RMO-RCR-12` | `crud-navigation-async` | `recipe-accepted-contract-evidence` | `NFM-RCR-03`, `NFM-RCR-05`, `NFM-RCR-06`, `NFM-RCR-07` | `WP-RMO-03`, `WP-RMO-04` | `routes[]`, `components[]`, `collectionViews[]`, `commandSources[]`, `searchSources[]`, `events[]`, `actions[]`, `resources[]`, `sourceMap[]` | `x-form`, `x-input`, `x-button`, `x-section`, `x-cards`, `x-status` | `/routes/0`, `/events/0`, `rmt.recipe.action.resource_policy_missing`, `rmt.recipe.route.adapter_residual` | `allowed-with-contract-evidence` | `WP-RMO-06`, `WP-RMO-07` |
| `RMO-RCR-13` | `recipe-migration` | `migration-fixture-accepted` | `NFM-RCR-06`, `NFM-RCR-07` | `WP-RMO-03`, `WP-RMO-04` | `migrationSteps[]`, `sourceMap[]`, `diagnostics[]` | scoped owned packages | `blocked-until-owned-data-display-package -> accepted-with-scoped-owned-package`, `blocked-until-owned-command-search-package -> accepted-with-scoped-owned-package` | `allowed-migration-fixture` | `WP-RMO-06` |
| `RMO-RCR-14` | `negative-security-policy` | `negative-fixture-accepted` | `NFM-RCR-06`, `NFM-RCR-07` | `WP-RMO-03`, `WP-RMO-04` | `negativeFixtures[]`, `diagnostics[]`, `sourceMap[]` | none | `rmt.recipe.manual_html_sink_forbidden`, `rmt.recipe.command.unregistered_forbidden`, `rmt.recipe.command.action_ref_missing` | `blocked-negative-claim` | `WP-RMO-07` |

## Status Summary

| Status | Anzahl |
|--------|--------|
| `recipe-accepted-scoped-owned` | 2 |
| `recipe-accepted-contract-evidence` | 1 |
| `migration-fixture-accepted` | 1 |
| `negative-fixture-accepted` | 1 |

## Complete-UI-Recipe-Erweiterung

`RMO-RCR-10` und `RMO-RCR-11` sind die WP-RMO-05-Erweiterung der historischen `NFM-RCR-06` und `NFM-RCR-07` Rows. Die NFM-WP-17-Matrix bleibt als Baseline erhalten, waehrend diese Matrix die neuen scoped Outcomes fuehrt:

- `blocked-until-owned-data-display-package` -> `accepted-with-scoped-owned-data-display-package`
- `blocked-until-owned-command-search-package` -> `accepted-with-scoped-owned-command-search-package`
- `no-table-tree-data-grid-virtual-list-claim` bleibt blockiert
- `no-command-palette-autocomplete-rich-combobox-claim` bleibt blockiert
- `manual-html-row-renderer`, `manual-html-command-renderer`, `unregistered-command-execution` und `free-command-execution-without-action-ref` bleiben negative Fixtures

## Handoff

`WP-RMO-06` erhaelt konkrete Browser-Smoke- und Visual-Evidence-Kandidaten fuer Dashboard Collection, Command/Search Workspace und CRUD/Navigation Async. `WP-RMO-07` erhaelt Source-Map-, Diagnostics-, Budget- und Runtime-Parity-Anker fuer die neuen scoped Recipes.
