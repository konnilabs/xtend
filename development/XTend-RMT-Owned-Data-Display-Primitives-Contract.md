# XTend RMT Owned Data Display Primitives Contract

- Status: `accepted`
- Datum: 4. Juni 2026
- Contract: `xtend.rmt-ui-maximality-owned-data-display-primitives.v1`
- Matrix Schema: `xtend.rmt-ui-maximality-owned-data-display-primitives-matrix.v1`
- Fixture Schema: `xtend.rmt-ui-maximality-owned-data-display-primitives-fixtures.v1`
- RMT Fixture Schema: `xtend.rmt-ui-maximality-owned-data-display-primitives.rmt-fixture.v1`
- Report Schema: `xtend.rmt-ui-maximality-owned-data-display-primitives-report.v1`
- Workpackage: `WP-RMO-03`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-owned-data-display-primitives --json`
- Package Script: `npm run test:rmt-owned-data-display-primitives`
- Bezug:
  - `development/BACKLOG-XTend-RMT-UI-Maximality-und-Owned-Component-Surface-Hardening.md`
  - `development/XTend-RMT-Owned-Data-Display-Primitives-Matrix.md`
  - `development/WP-RMO-03-Owned-Data-Display-Primitive-Package-schneiden.md`
  - `tests/fixtures/native-first/rmt-owned-data-display-primitives-fixtures.json`
  - `tests/fixtures/rmt-owned-data-display-primitives.rmt`
  - `tests/native-first/rmt_owned_data_display_primitives_suite.js`

## Zweck

`WP-RMO-03` schneidet Data Display als eigenes XTend-Primitive-Paket, ohne marktuebliche DataGrid-, Table-, Tree- oder VirtualList-APIs zu kopieren. Der erste akzeptierte Scope ist bewusst kleiner: vorhandene XTend Display-Komponenten bilden die sichtbare Foundation, und RMT erhaelt einen pruefbaren `collection-view`-Authoring-Pfad fuer data-bound Collections.

## Paketgrenzen

- `display-foundation-owned`: `x-section`, `x-cards`, `x-masonry`, `x-summary`, `x-type`, `x-code`, `x-status`, `x-progress` und `x-alert` sind die vorhandene Owned Surface.
- `collection-view-record`: RMT beschreibt Collection, Item Template, Empty State, Loading State, Selection und Sorting als Records.
- `x-list`: in `WP-RMO-03` kein neues Custom Element, sondern ein authorbarer `collection-view`-Contract mit `list`/`grid` Layout Mode.
- `x-table`, `x-tree` und `x-virtual-list`: explizite Deferrals mit Owner, Budget und Evidence-Anforderungen.
- Keine Runtime-Dependency, keine externe UI-Framework-Kopplung und keine RMT-Kernel-Kopplung an XTend-Komponententypen.
- Boundary Literal: `no-runtime-dependency`
- Kernel Boundary: `no-rmt-kernel-import-of-xtend-types`

## Nicht-Ziele

- `full-datagrid-parity`
- `framework-table-api-copy`
- `virtualization-default-without-browser-evidence`
- `manual-html-row-renderer`
- `free-row-render-function`

## Source Gates

| Gate | Zweck |
|------|-------|
| `rmt-owned-data-display-primitives` | lokaler WP-RMO-03 Gate |
| `rmt-ui-primitive-gap` | Quelle fuer `NFM-RUG-11` |
| `native-first-market-pattern-parity` | negative DataGrid-/VirtualList-Claims |
| `rmt-complete-ui-recipes` | Dashboard- und Collection-Recipe-Handoff |
| `rmt-component-template-primitives` | Component-/Template-Authoring |
| `rmt-surface-resource-graph-runtime` | Resource-/Lifecycle-Records |
| `rmt-action-effect-data-resource-primitives` | DataSource-/Resource-Primitive-Schnitt |
| `catalog-coverage` | vorhandene Display-Komponenten |
| `references` | stabile Pfade |

## Claim-Regeln

| Claim | Entscheidung |
|-------|--------------|
| RMT kann eine data-bound Collection mit Loading, Empty, Selection und Sorting als Records ausdruecken | `allowed-with-contract-evidence` |
| XTend besitzt eine eigene Display Foundation fuer Collection UIs | `allowed-with-owned-foundation` |
| XTend hat fertige DataGrid-, Tree- und VirtualList-Paritaet | `blocked-negative-claim` |
| `x-list` ist in WP-RMO-03 ein physisches Custom Element | `blocked-negative-claim` |
| Table/Tree/VirtualList duerfen ohne Browser-/Budget-Evidence produktiv beworben werden | `blocked-negative-claim` |

## Handoff

`data-display-parity` wird nicht als vollstaendig geschlossen markiert, sondern als `scoped-owned-data-display-package` eingegrenzt. `WP-RMO-05` darf die RMT Complete-UI-Recipes auf `collection-view` umstellen. `WP-RMO-06` und `WP-RMO-07` behalten Browser-Lab-, Visual- und Budget-Evidence fuer Virtualisierung und groessere Datenmengen.
