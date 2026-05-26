# WP-TypeExports-01 - Public Package Entry Points und `types`-Conditions haerten

- Status: `completed`
- Datum: 13. Mai 2026
- Contract: `xtend.type-exports.plan.v1`
- Report: `xtend.type-exports.report.v1`
- Gate: `node scripts/run_xtend_tests.js type-exports --json`
- Package Script: `npm run test:type-exports`
- Report Artifact: `.xtend-test-results/xtend-type-exports-report.json`
- Export Fingerprint: `e41952a514ccf3d7cd6914512f90e74fcac2b0be8a79c73fb6acb6c609dfb192`
- Boundary: `types-only-no-runtime-imports`
- Boundary: `no-rmt-kernel-import-of-xtend-types`
- Boundary: `declarations-follow-js-runtime-surface`

## Ziel

Der erste Run macht die gesamte Public Package Surface von XTend als TypeExports-Matrix pruefbar. Alle aktuellen 126 Exports aus dem Package Export Lock sind klassifiziert, P0-Exports haben einen vorgeschlagenen `types`-Pfad oder eine dokumentierte `types-not-required` Ausnahme, und neue unklassifizierte Public Exports brechen lokal den Gate.

## Artefakte

| Artefakt | Zweck |
| --- | --- |
| `catalog/type-exports.js` | erstellt TypeExports Plan, Klassifikationen, Fingerprint und Report |
| `tests/types/type_exports_suite.js` | lokaler Gate fuer Drift zwischen `package.json`, Export Lock und TypeExports |
| `docs/type-exports.md` | Consumer- und Release-Doku fuer TypeExports |
| `package.json#xtend.typeExports` | Package-Metadaten fuer Release Owner und lokale Gates |

## Umsetzung

- `package.json` Exports bleiben runtime-kompatibel und erhalten in diesem Run noch keine breiten `types`-Conditions.
- Die Package-Export-Lock-Liste wird per Count und SHA-256 Fingerprint an TypeExports gekoppelt.
- Assets wie `./style.css`, Manifeste, Theme-JSON und `./package.json` sind als `types-not-required` klassifiziert.
- Loader, API, RMT, Builder, Fabric, A11y, Security, Catalog und Design Tokens haben vorbereitete Declaration-Zielpfade.
- Die Folge-WPs koennen Declaration Packs schrittweise liefern, ohne die Export-Surface neu zu interpretieren.

## Definition of Done

- Alle Public Exports sind klassifiziert.
- P0-Exports haben `types`-Pfad oder begruendete Ausnahme.
- Der lokale Gate schlaegt bei neuem untypisierten Public Export fehl.
- Package-Metadaten, Doku und Tests verweisen auf denselben Contract.

## Handoff

Naechster startbarer Run ist `WP-TypeExports-02`: `XTendLoader`, `XTendStyleRegistry` und `XTendSkeletonLoader` typisieren.
