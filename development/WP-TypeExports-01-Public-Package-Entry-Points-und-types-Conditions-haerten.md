# WP-TypeExports-01 - Public Package Entry Points und `types`-Conditions haerten

- Status: `completed`
- Datum: 13. Mai 2026
- Contract: `xtend.type-exports.plan.v1`
- Report: `xtend.type-exports.report.v1`
- Gate: `node scripts/run_xtend_tests.js type-exports --json`
- Package Script: `npm run test:type-exports`
- Report Artifact: `.xtend-test-results/xtend-type-exports-report.json`
- Export Fingerprint: `5852b738283ed9e1679335f45026678aab727244cc84e0f45cc4684104715ba5`
- Boundary: `types-only-no-runtime-imports`
- Boundary: `no-rmt-kernel-import-of-xtend-types`
- Boundary: `declarations-follow-js-runtime-surface`

## Ziel

Der Gate macht die gesamte Public Package Surface von XTend als TypeExports-Matrix pruefbar. Alle aktuellen 199 Exports aus dem Package Export Lock sind klassifiziert, P0-Exports haben einen vorgeschlagenen `types`-Pfad oder eine dokumentierte `types-not-required` Ausnahme, und neue unklassifizierte Public Exports brechen lokal den Gate.

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

Die additive SSR-Erweiterung klassifiziert fünf Laufzeitzugänge und den Seitenbuild. Die beiden bereits ausgelieferten Projektindex-Zugänge sind ebenfalls explizit klassifiziert. Jeder Zugang besitzt konkrete Deklarationen; der Lock wurde anhand dieser acht Entscheidungen aktualisiert.

XTend.store ergänzt genau fünf typisierte Exports: `maraca/page-client`, `maraca/page-bootstrap`, `maraca/remote-surface`, `rmt/resume-capture-adapter` und `rmt-language/compilation-session`. Sie verbinden die vorhandenen Seiten-, Resume- und Compilerverträge; die bestehenden Klassifikationen bleiben erhalten.

## Unapplied product-migration wiring proposal (2026-10-09)

The historical counts and fingerprints above describe earlier snapshots. The current A02.1 contract is exactly 211 ordered export keys, SHA-256 `d54e84d640476e46386fdcee3eb3273a9f2103bb3a80e066cc2b7117c48e4a58` (UTF-8 keys joined by newline, without a final newline). The exact lock now includes the three existing RMT Classic parser/compiler/schema entries and the new `./xtensions/state-binding` entry. Existing targets retain their declarations and runtime paths. Unknown additions, substitutions, reordered keys and mismatched types still fail; count alone cannot prove key identity or target/type correctness. See [A02.1](rmtx-a02/README.md).

All seven existing helpers are explicitly classified as P1 Node helper APIs with declarations, rather than assets or an unrestricted prefix group:

| Existing export | Classification rationale | Declaration binding |
| --- | --- | --- |
| `./product-support` | Shared product orchestration/support is callable Node API, not an asset. | Existing explicit runtime/types conditions retained. |
| `./test-support/browser-hypervisor` | Browser discovery, capabilities and execution are callable test infrastructure. | Matching sibling declaration describes existing browser helper exports. |
| `./test-support/php-fpm` | FPM lifecycle/proxy configuration and returned handle are callable infrastructure. | Matching sibling declaration binds existing options and handle. |
| `./test-support/dev-server` | Existing development-server creation/listening API requires typed options. | Matching sibling declaration reuses existing builder dev-server types and declares the existing CSP constant. |
| `./laravel-package` | Existing Laravel artifact builder takes build options and returns artifact metadata. | Matching sibling declaration describes the existing build API. |
| `./candidate-integrity` | Candidate packing/resolution/integrity checks are executable public migration contracts. | Existing explicit runtime/types conditions retained. |
| `./schema-inventory` | Scanner/ownership/authority verification is executable public migration infrastructure. | Existing explicit runtime/types conditions retained. |

The exact ordered-key fingerprint, expected count, classification and each helper runtime/type target are checked independently. Unreviewed keys, same-count substitutions, wrong existing targets/types, reordered keys and stale metadata fail validation. These classification changes do not accept any schema inventory or governance proposal.

## A02.5.2 URL-state runtime (2026-11-09)

The A02.5.2 contract was exactly 212 ordered export keys, SHA-256 `cc95ac4c5a1f907c0269321f47acd1d67a69d1067139e86aff2329a99af47f43`. The additive `./xtensions/url-state` entry has matching runtime and types targets in the root and compiler packages. Existing ordered keys and targets are preserved; the same strict addition/substitution/order/type checks apply. The 211-key record above is historical.

## A04.1 composition APIs (2026-11-10)

The current contract is exactly 214 ordered export keys, SHA-256 `8a443b512c6993227950c2393eaa722ded512ea4f2243d4c09f527aaf3605924`. The previous 212 keys and targets retain their order. Appended `./maraca/xtension-composition` and `./maraca/xtension-composition-runtime` expose separate API-1.0.0 build/runtime contracts with matching declarations in Root and Maraca. The first captures verified local provider bytes; the second composes actual API-6 hosts with explicit application grants and shared native ports. Strict addition/substitution/order/target checks remain active; full 0.9 feature acceptance remains pending.
