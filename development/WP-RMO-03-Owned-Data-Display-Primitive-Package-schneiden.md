# WP-RMO-03 - Owned Data Display Primitive Package schneiden

- Status: `completed`
- Datum: 4. Juni 2026
- Backlog: `development/BACKLOG-XTend-RMT-UI-Maximality-und-Owned-Component-Surface-Hardening.md`
- Contract: `xtend.rmt-ui-maximality-owned-data-display-primitives.v1`
- Matrix Schema: `xtend.rmt-ui-maximality-owned-data-display-primitives-matrix.v1`
- Fixture Schema: `xtend.rmt-ui-maximality-owned-data-display-primitives-fixtures.v1`
- RMT Fixture Schema: `xtend.rmt-ui-maximality-owned-data-display-primitives.rmt-fixture.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-owned-data-display-primitives --json`

## Ziel

Data Display wird als eigenes XTend-Paket geschnitten. Das Paket macht Collections in RMT als Contract- und Fixture-Pfad authorbar, ohne neue Runtime-Dependencies einzufuehren oder vollstaendige DataGrid-/Table-/Tree-/VirtualList-Paritaet zu behaupten.

## Umgesetzte Artefakte

| Artefakt | Zweck |
|----------|-------|
| `development/XTend-RMT-Owned-Data-Display-Primitives-Contract.md` | Produkt- und Claim-Grenzen fuer Owned Data Display |
| `development/XTend-RMT-Owned-Data-Display-Primitives-Matrix.md` | Capability- und Deferral-Matrix |
| `tests/fixtures/native-first/rmt-owned-data-display-primitives-fixtures.json` | maschinenlesbare Primitive- und Gate-Evidence |
| `tests/fixtures/rmt-owned-data-display-primitives.rmt` | RMT Collection-View Fixture |
| `tests/native-first/rmt_owned_data_display_primitives_suite.js` | lokaler Gate fuer WP-RMO-03 |
| `package.json` | Metadata und Script `npm run test:rmt-owned-data-display-primitives` |
| `scripts/run_xtend_tests.js` | Suite-ID `rmt-owned-data-display-primitives` |

## Entscheidungen

- `x-section`, `x-cards`, `x-masonry`, `x-summary`, `x-type`, `x-code`, `x-status`, `x-progress` und `x-alert` bilden die bestehende Display Foundation.
- `collection-view` ist der akzeptierte RMT-Pfad fuer Data Display in diesem Paket.
- `x-list` bleibt in WP-RMO-03 ein Contract-/Layout-Mode, kein neues Custom Element.
- `x-table`, `x-tree` und `x-virtual-list` bleiben explizite Deferrals.
- `data-display-parity` wird als `scoped-owned-data-display-package` eingegrenzt.
- `full-datagrid-parity`, `framework-table-api-copy` und `virtualization-default-without-browser-evidence` bleiben blockiert.

## Verifikation

```bash
node scripts/run_xtend_tests.js rmt-owned-data-display-primitives --json
node scripts/run_xtend_tests.js rmt-owned-data-display-primitives rmt-ui-maximality-owned-surface-baseline rmt-ui-maximality-owned-surface-gate-hygiene rmt-ui-primitive-gap native-first-market-pattern-parity rmt-complete-ui-recipes references --json
```

## Handoff

`WP-RMO-04` bleibt startbar fuer Command/Search. `WP-RMO-05` kann nach `WP-RMO-04` die RMT Complete-UI-Recipes auf `collection-view` und Command/Search aktualisieren.

