# WP-RMO-05 - RMT Data Display und Command/Search Recipes erweitern

- Status: `completed`
- Datum: 4. Juni 2026
- Contract: `xtend.rmt-ui-maximality-owned-recipe-extension.v1`
- Matrix Schema: `xtend.rmt-ui-maximality-owned-recipe-extension-matrix.v1`
- Fixture Schema: `xtend.rmt-ui-maximality-owned-recipe-extension-fixtures.v1`
- RMT Fixture Schema: `xtend.rmt-ui-maximality-owned-recipe-extension.rmt-fixture.v1`
- Report Schema: `xtend.rmt-ui-maximality-owned-recipe-extension-report.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-owned-recipe-extension --json`
- Package Script: `npm run test:rmt-owned-recipe-extension`

## Ziel

Die in `NFM-WP-17` noch blockierten Data Display und Command/Search Complete-UI-Recipes werden auf die durch `WP-RMO-03` und `WP-RMO-04` akzeptierten scoped Owned Packages erweitert. Das Paket liefert positive, negative und Migration-Fixtures mit Source-Map- und Diagnostics-Erwartungen.

## Umgesetzte Artefakte

| Artefakt | Status |
|----------|--------|
| `development/XTend-RMT-Owned-Recipe-Extension-Contract.md` | erfuellt |
| `development/XTend-RMT-Owned-Recipe-Extension-Matrix.md` | erfuellt |
| `tests/fixtures/native-first/rmt-owned-recipe-extension-fixtures.json` | erfuellt |
| `tests/fixtures/rmt-owned-recipe-extension.rmt` | erfuellt |
| `tests/native-first/rmt_owned_recipe_extension_suite.js` | erfuellt |

## Entscheidungen

| Entscheidung | Ergebnis |
|--------------|----------|
| Dashboard mit Data Display | akzeptiert als `RMO-RCR-10` mit `collectionViews[]` |
| Command/Search Flow | akzeptiert als `RMO-RCR-11` mit `commandSources[]` und `searchSources[]` |
| CRUD-/Navigation-Async Recipe | akzeptiert als `RMO-RCR-12` mit registrierten Actions, Resources und Route-Adapter-Residual |
| Migration | akzeptiert als `RMO-RCR-13`: NFM-Blocker werden auf scoped RMO-Packages gehoben |
| Negative Fixtures | akzeptiert als `RMO-RCR-14`: manuelle DOM-Sinks und unregistrierte Commands bleiben blockiert |

## Definition of Done

| Kriterium | Ergebnis |
|-----------|----------|
| `rmt-complete-ui-recipes` deckt Data Display und Command/Search explizit ab | erfuellt: `RMO-RCR-10` und `RMO-RCR-11` referenzieren `NFM-RCR-06`, `NFM-RCR-07` und die scoped RMO-Packages |
| `rmt-action-effect-data-resource-primitives` bleibt kompatibel | erfuellt: Actions, Effects, Resources, Adapter-Refs und Policy-Diagnostik sind Source-Gates |
| keine neue RMT-Bypass-Syntax entsteht | erfuellt: negative Fixtures blockieren `manual-html-row-renderer`, `manual-html-command-renderer`, `unregistered-command-execution` und `free-command-execution-without-action-ref` |
| Source-Map- und Diagnostics-Erwartungen sind sichtbar | erfuellt: `/collectionViews/0`, `/commandSources/0`, `/searchSources/0`, `/events/0`, `/actions/0` und Diagnostics-Codes sind dokumentiert |
| lokaler Gate ist gruen | erfuellt: `node scripts/run_xtend_tests.js rmt-owned-recipe-extension --json` |

## Handoff

`WP-RMO-06` kann Browser-Lab und Visual Evidence fuer konkrete Data Display und Command/Search App-Flows bauen. `WP-RMO-07` kann Contract-, Budget- und Runtime-Parity fuer scoped Recipes und deferred physische Components produktisieren.
