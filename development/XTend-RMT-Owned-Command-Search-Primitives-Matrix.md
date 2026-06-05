# XTend RMT Owned Command Search Primitives Matrix

- Status: `accepted`
- Datum: 4. Juni 2026
- Contract: `xtend.rmt-ui-maximality-owned-command-search-primitives.v1`
- Matrix Schema: `xtend.rmt-ui-maximality-owned-command-search-primitives-matrix.v1`
- Workpackage: `WP-RMO-04`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-owned-command-search-primitives --json`

## Bewertungsrahmen

| Feld | Werte |
|------|-------|
| `status` | `accepted-foundation`, `accepted-command-source`, `accepted-search-resource`, `accepted-overlay-focus-policy`, `deferred-owned-component` |
| `surfaceClass` | `command-search-foundation`, `command-source`, `search-resource`, `overlay-focus-policy`, `command-palette`, `autocomplete`, `combobox` |
| `claimBoundary` | `allowed-with-contract-evidence`, `allowed-with-owned-foundation`, `blocked-negative-claim`, `browser-evidence-required` |

## Matrix

| ID | Primitive | Surface Class | Status | Owned Surface | RMT Records | Interaction / A11y Coverage | Policy / Evidence | Claim Boundary | Next Handoff |
|----|-----------|---------------|--------|---------------|-------------|-----------------------------|-------------------|----------------|--------------|
| `RMO-CS-01` | Command/Search Foundation | `command-search-foundation` | `accepted-foundation` | `x-input`, `x-button`, `x-menu`, `x-popover`, `x-status`, `x-progress`, `x-alert`, `x-icon` | `components[]`, `templates[]`, `slots[]`, `sourceMap[]` | Search input, trigger button, menu result region, status feedback | `native-first-form-navigation-media`, `catalog-coverage` | `allowed-with-owned-foundation` | `WP-RMO-05` |
| `RMO-CS-02` | Command Source | `command-source` | `accepted-command-source` | `x-button`, `x-menu`, `x-status` | `commandSources[]`, `events[]`, `actions[]`, `effects[]`, `state[]`, `sourceMap[]` | Keyboard trigger, active item, disabled state, result announcement | `rmt-event-routing-runtime`, `rmt-action-effect-data-resource-primitives` | `allowed-with-contract-evidence` | `WP-RMO-05` |
| `RMO-CS-03` | Search Resource Binding | `search-resource` | `accepted-search-resource` | `x-input`, `x-progress`, `x-alert`, `x-menu` | `searchSources[]`, `dataSources[]`, `resources[]`, `selectors[]`, `state[]`, `actions[]`, `sourceMap[]` | Query state, loading, empty, error, selection, debounce | `rmt-action-effect-data-resource-primitives`, `rmt-surface-resource-graph-runtime` | `allowed-with-contract-evidence` | `WP-RMO-05`, `WP-RMO-07` |
| `RMO-CS-04` | Overlay Focus Policy | `overlay-focus-policy` | `accepted-overlay-focus-policy` | `x-popover`, `x-dialog`, `x-button` | `surfaces[]`, `events[]`, `effects[]`, `schedules[]`, `sourceMap[]` | Escape, focus restore, modal handoff, aria-controls | `native-first-overlay-focus`, `overlay-interaction-ux` | `allowed-with-contract-evidence` | `WP-RMO-06`, `WP-RMO-07` |
| `RMO-CS-05` | `x-command-palette` | `command-palette` | `deferred-owned-component` | deferred | `commandSources[]`, `surfaces[]`, `templates[]` planned | Roving focus, shortcut discovery and command grouping pending | Browser, keyboard, a11y and visual evidence required | `blocked-negative-claim` | `WP-RMO-07` |
| `RMO-CS-06` | `x-autocomplete` | `autocomplete` | `deferred-owned-component` | deferred | `searchSources[]`, `resources[]`, `state[]` planned | async results, highlighted option and input composition pending | Browser, IME, a11y and performance evidence required | `browser-evidence-required` | `WP-RMO-06`, `WP-RMO-07` |
| `RMO-CS-07` | `x-combobox` | `combobox` | `deferred-owned-component` | deferred | `comboboxSources[]`, `events[]`, `actions[]` planned | ARIA combobox, listbox, active descendant and value commit pending | Browser, keyboard and a11y evidence required | `blocked-negative-claim` | `WP-RMO-07` |

## Zusammenfassung

| Status | Anzahl |
|--------|--------|
| `accepted-foundation` | 1 |
| `accepted-command-source` | 1 |
| `accepted-search-resource` | 1 |
| `accepted-overlay-focus-policy` | 1 |
| `deferred-owned-component` | 3 |

## Residual-Entscheidung

`command-search-parity` wird auf `scoped-owned-command-search-package` gesetzt. Das Paket erlaubt Command/Search-Authoring ohne manuelle Host-Shell, blockiert aber weiterhin `command-palette-full-parity`, `framework-command-api-copy`, `rich-combobox-autocomplete-parity`, `unregistered-command-execution` und `free-command-execution-without-action-ref`.
