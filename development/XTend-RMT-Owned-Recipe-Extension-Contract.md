# XTend RMT Owned Recipe Extension Contract

- Status: `accepted`
- Datum: 4. Juni 2026
- Contract: `xtend.rmt-ui-maximality-owned-recipe-extension.v1`
- Matrix Schema: `xtend.rmt-ui-maximality-owned-recipe-extension-matrix.v1`
- Fixture Schema: `xtend.rmt-ui-maximality-owned-recipe-extension-fixtures.v1`
- RMT Fixture Schema: `xtend.rmt-ui-maximality-owned-recipe-extension.rmt-fixture.v1`
- Report Schema: `xtend.rmt-ui-maximality-owned-recipe-extension-report.v1`
- Workpackage: `WP-RMO-05`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-owned-recipe-extension --json`
- Package Script: `npm run test:rmt-owned-recipe-extension`
- Bezug:
  - `development/BACKLOG-XTend-RMT-UI-Maximality-und-Owned-Component-Surface-Hardening.md`
  - `development/XTend-Native-First-RMT-Complete-UI-Recipe-Matrix.md`
  - `development/XTend-RMT-Owned-Data-Display-Primitives-Contract.md`
  - `development/XTend-RMT-Owned-Command-Search-Primitives-Contract.md`
  - `development/XTend-RMT-Owned-Recipe-Extension-Matrix.md`
  - `development/WP-RMO-05-RMT-Data-Display-und-Command-Search-Recipes-erweitern.md`
  - `tests/fixtures/native-first/rmt-owned-recipe-extension-fixtures.json`
  - `tests/fixtures/rmt-owned-recipe-extension.rmt`
  - `tests/native-first/rmt_owned_recipe_extension_suite.js`

## Zweck

`WP-RMO-05` hebt die in `NFM-WP-17` noch blockierten Complete-UI-Recipes fuer Data Display und Command/Search auf die durch `WP-RMO-03` und `WP-RMO-04` akzeptierten scoped Owned Packages. Das Paket erweitert die Recipe-Evidence, ohne vollstaendige DataGrid-, Command-Palette-, Autocomplete- oder rich Combobox-Paritaet zu claimen.

## Paketgrenzen

- `owned-dashboard-collection-recipe`: nutzt `collectionViews[]`, Display Foundation, Resources, Selectors, Selection und Sorting.
- `owned-command-search-workspace-recipe`: nutzt `commandSources[]`, `searchSources[]`, Overlay/Focus Policy, Actions, Effects und Resources.
- `owned-crud-navigation-async-recipe`: verbindet Form-/Navigation-Flows mit Collection- und Command/Search-Records ueber registrierte Actions.
- `migration-fixture`: migriert `blocked-until-owned-data-display-package` und `blocked-until-owned-command-search-package` auf `accepted-with-scoped-owned-package`.
- `negative-fixtures`: blockieren `manual-html-row-renderer`, `manual-html-command-renderer`, `unregistered-command-execution` und `free-command-execution-without-action-ref`.
- Blockierte Data-Display-Claims: `full-datagrid-parity`, `framework-table-api-copy`, `virtualization-default-without-browser-evidence`.
- Blockierte Command/Search-Claims: `command-palette-full-parity`, `framework-command-api-copy`, `rich-combobox-autocomplete-parity`.
- Keine neue Runtime-Dependency, keine externe UI-Framework-Kopplung und keine RMT-Kernel-Kopplung an XTend-Komponententypen.
- Boundary Literal: `no-runtime-dependency`
- Kernel Boundary: `no-rmt-kernel-import-of-xtend-types`

## Nicht-Ziele

- physische `x-table`, `x-tree`, `x-virtual-list`, `x-command-palette`, `x-autocomplete` oder `x-combobox` Komponenten produktisieren
- neue RMT-Syntax in Runtime oder Compiler implementieren
- Browser-Smoke- oder Visual-Evidence-Artefakte erzeugen
- freie Runtime-Ausfuehrung, Inline-JavaScript oder HTML-String-Renderer erlauben

## Source Gates

| Gate | Zweck |
|------|-------|
| `rmt-owned-recipe-extension` | lokaler WP-RMO-05 Gate |
| `rmt-owned-data-display-primitives` | scoped Data Display Source Package |
| `rmt-owned-command-search-primitives` | scoped Command/Search Source Package |
| `rmt-complete-ui-recipes` | historische NFM-WP-17 Recipe Baseline |
| `rmt-action-effect-data-resource-primitives` | Action-, Effect-, Resource- und Policy-Kompatibilitaet |
| `rmt-event-routing-runtime` | deklaratives Event-to-Action Routing |
| `rmt-surface-resource-graph-runtime` | Resource Lifecycle und Owner Scope |
| `native-first-overlay-focus` | Overlay-, Popover-, Escape- und Focus-Restore-Handoff |
| `rmt-ui-primitive-gap` | Quelle fuer `NFM-RUG-11` und `NFM-RUG-12` |
| `references` | stabile Pfade |

## Claim-Regeln

| Claim | Entscheidung |
|-------|--------------|
| Data Display Collection Recipes sind mit `collectionViews[]` authorbar | `allowed-with-scoped-owned-package` |
| Command/Search Recipes sind mit `commandSources[]` und `searchSources[]` authorbar | `allowed-with-scoped-owned-package` |
| CRUD-/Navigation-Flows koennen registrierte Actions mit Data Display und Command/Search verbinden | `allowed-with-contract-evidence` |
| alte NFM-Blocker werden nur fuer scoped Packages migriert | `allowed-migration-fixture` |
| DataGrid-, VirtualList-, Command-Palette-, Autocomplete- oder rich Combobox-Paritaet ist fertig | `blocked-negative-claim` |
| manuelle DOM-Sinks oder unregistrierte Commands sind erlaubt | `blocked-negative-claim` |

## Handoff

`WP-RMO-05` macht `WP-RMO-06` startbar: Browser-Lab, Visual Evidence und Interaction-Budget-Artefakte koennen nun auf konkrete Data Display und Command/Search Recipes zeigen. `WP-RMO-07` uebernimmt Runtime-Parity, Budget und physische Component-Claims fuer die weiterhin deferred Components.
