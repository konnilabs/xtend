# XTend RMT Owned Data Display Primitives Matrix

- Status: `accepted`
- Datum: 4. Juni 2026
- Contract: `xtend.rmt-ui-maximality-owned-data-display-primitives.v1`
- Matrix Schema: `xtend.rmt-ui-maximality-owned-data-display-primitives-matrix.v1`
- Workpackage: `WP-RMO-03`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-owned-data-display-primitives --json`

## Bewertungsrahmen

| Feld | Werte |
|------|-------|
| `status` | `accepted-foundation`, `accepted-collection-record`, `accepted-state-policy`, `deferred-owned-component` |
| `surfaceClass` | `display-foundation`, `collection-view`, `state-policy`, `structured-table`, `hierarchy-tree`, `virtualization` |
| `claimBoundary` | `allowed-with-contract-evidence`, `allowed-with-owned-foundation`, `blocked-negative-claim`, `browser-evidence-required` |

## Matrix

| ID | Primitive | Surface Class | Status | Owned Surface | RMT Records | State Coverage | Budget / Evidence | Claim Boundary | Next Handoff |
|----|-----------|---------------|--------|---------------|-------------|----------------|-------------------|----------------|--------------|
| `RMO-DD-01` | Display Foundation | `display-foundation` | `accepted-foundation` | `x-section`, `x-cards`, `x-masonry`, `x-summary`, `x-type`, `x-code` | `components[]`, `templates[]`, `slots[]`, `sourceMap[]` | Layout, responsive grid, summary, rich text/code display | `catalog-coverage`, `layout-display-media-ux` | `allowed-with-owned-foundation` | `WP-RMO-05` |
| `RMO-DD-02` | Collection View | `collection-view` | `accepted-collection-record` | `x-section`, `x-cards`, `x-summary` | `collectionViews[]`, `templates[]`, `dataSources[]`, `resources[]`, `selectors[]`, `sourceMap[]` | Keyed item template, empty state, loading state, error state | `rmt-surface-resource-graph-runtime`, `rmt-component-template-primitives` | `allowed-with-contract-evidence` | `WP-RMO-05` |
| `RMO-DD-03` | Selection Sorting State | `state-policy` | `accepted-state-policy` | `x-status`, `x-progress`, `x-alert` | `state[]`, `selectors[]`, `events[]`, `actions[]`, `schedules[]` | Single selection, sort descriptor, loading, empty, error | `rmt-action-effect-data-resource-primitives`, `native-first-budget-gates` | `allowed-with-contract-evidence` | `WP-RMO-05`, `WP-RMO-07` |
| `RMO-DD-04` | `x-table` | `structured-table` | `deferred-owned-component` | deferred | `columns[]`, `rows[]`, `sort[]` planned | Header/body/cell keyboard model pending | Browser and a11y evidence required | `blocked-negative-claim` | `WP-RMO-07` |
| `RMO-DD-05` | `x-tree` | `hierarchy-tree` | `deferred-owned-component` | deferred | `nodes[]`, `expanded[]`, `selection[]` planned | Roving tabindex and hierarchy ARIA pending | Browser and a11y evidence required | `blocked-negative-claim` | `WP-RMO-07` |
| `RMO-DD-06` | `x-virtual-list` | `virtualization` | `deferred-owned-component` | deferred | `viewport[]`, `range[]`, `measurement[]` planned | Focus preservation and scroll anchoring pending | Browser, performance and visual evidence required | `browser-evidence-required` | `WP-RMO-06`, `WP-RMO-07` |

## Zusammenfassung

| Status | Anzahl |
|--------|--------|
| `accepted-foundation` | 1 |
| `accepted-collection-record` | 1 |
| `accepted-state-policy` | 1 |
| `deferred-owned-component` | 3 |

## Residual-Entscheidung

`data-display-parity` wird auf `scoped-owned-data-display-package` gesetzt. Das Paket erlaubt Collection-Authoring ohne manuelle Host-Shell, blockiert aber weiterhin `full-datagrid-parity`, `framework-table-api-copy` und `virtualization-default-without-browser-evidence`.

