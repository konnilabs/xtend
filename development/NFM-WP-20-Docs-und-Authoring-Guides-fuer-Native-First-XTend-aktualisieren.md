# NFM-WP-20 - Docs und Authoring Guides fuer Native-First XTend aktualisieren

- Status: `completed`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Contract: `xtend.native-first.docs-authoring-guides.v1`
- Matrix: `xtend.native-first.docs-authoring-guide-matrix.v1`
- Report Schema: `xtend.native-first.docs-authoring-guides-report.v1`
- Local Gate: `node scripts/run_xtend_tests.js native-first-docs-authoring --json`
- Package Script: `npm run test:native-first-docs-authoring`

## Ziel

Die Native-First-Mission ist fuer Component-Autoren, App-Autoren und Release-Reviewer als nutzbare Authoring-Oberflaeche dokumentiert. Die Guides fuehren zu browser-nativen, dependency-minimalen, contract-safe und RMT-first Implementierungen.

## Umgesetzte Artefakte

- `development/XTend-Native-First-Docs-Authoring-Guides-Contract.md`
- `development/XTend-Native-First-Docs-Authoring-Guides-Matrix.md`
- `docs/de/native-first-authoring-guide.md`
- `docs/en/native-first-authoring-guide.md`
- `docs/de/native-first-rmt-recipes.md`
- `docs/en/native-first-rmt-recipes.md`
- `docs/de/native-first-release-review.md`
- `docs/en/native-first-release-review.md`
- `tests/native-first/native_first_docs_authoring_suite.js`

## Entscheidungen

| Entscheidung | Ergebnis |
|--------------|----------|
| Native-First-Leitfaden | Guide-Familie `native-first-authoring-guide` ist oeffentlich in DE/EN verankert |
| RMT UI Primitive Recipes | Guide-Familie `native-first-rmt-recipes` verbindet Complete-UI-Recipes, Action/Effect/Data/Resource-Primitives und DOM Descriptor Renderer |
| Release Review | Guide-Familie `native-first-release-review` verbindet Registry, Evidence Pack, Budget Gates und Browser-Residuals |
| Contract Discoverability | `xtend.native-first.docs-authoring-guides.v1` ist in Registry, Package-Metadaten und Runner eingebunden |
| Public Docs Hygiene | Guides vermeiden interne Planungsbegriffe und blockierte Framework-/Sink-/Dependency-Claims |

## Source Gates

```bash
node scripts/run_xtend_tests.js native-first-docs-authoring --json
node scripts/run_xtend_tests.js contract-registry --json
node scripts/run_xtend_tests.js native-first-budget-gates --json
node scripts/run_xtend_tests.js native-first-evidence-pack --json
node scripts/run_xtend_tests.js rmt-complete-ui-recipes --json
node scripts/run_xtend_tests.js rmt-renderer-dom-descriptor-proofs --json
node scripts/run_xtend_tests.js docs-public-quality --json
node scripts/run_xtend_tests.js references --json
```

## Akzeptanz

| Kriterium | Entscheidung |
|-----------|--------------|
| Native-First-Leitfaden existiert lokalisiert | erfuellt |
| RMT-first Recipes sind lokalisiert und menu-verankert | erfuellt |
| Release-Review-Guide benennt Registry, Evidence, Budgets und Residuals | erfuellt |
| Contract Registry enthaelt `xtend.native-first.docs-authoring-guides.v1` | erfuellt |
| Package und Runner expose `native-first-docs-authoring` | erfuellt |
| Keine neue Runtime-Dependency | erfuellt |

## Handoff

- `NFM-WP-21` startet auf Basis der dokumentierten blockierten non-native, vendor-backed und legacy Pfade.
- `NFM-WP-22` kann Mission-Abschluss und naechste Epic-Grenze mit den Docs-, Registry-, Budget- und Evidence-Artefakten bewerten.
