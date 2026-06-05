# WP-RMO-08 - Migration, Deprecation und Docs-Handoff fuer Legacy/Highlighter-Residuals finalisieren

- Status: `completed`
- Datum: 4. Juni 2026
- Contract: `xtend.rmt-ui-maximality-owned-migration-deprecation-docs-handoff.v1`
- Matrix Schema: `xtend.rmt-ui-maximality-owned-migration-deprecation-docs-handoff-matrix.v1`
- Fixture Schema: `xtend.rmt-ui-maximality-owned-migration-deprecation-docs-handoff-fixtures.v1`
- Report Schema: `xtend.rmt-ui-maximality-owned-migration-deprecation-docs-handoff-report.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-owned-migration-deprecation-docs-handoff --json`
- Package Script: `npm run test:rmt-owned-migration-deprecation-docs-handoff`

## Ziel

Die Residuals `legacy-loader-warning-window` und `owned-docs-highlighter-review` werden in konkrete Handoff-Entscheidungen ueberfuehrt. Public Docs nennen Alternativen, Warnfenster und Gates, ohne neue Vendor-Defaults oder stille Deprecations zu behaupten.

## Artefakte

| Artefakt | Status |
|----------|--------|
| `development/XTend-RMT-Owned-Migration-Deprecation-Docs-Handoff-Contract.md` | erfuellt |
| `development/XTend-RMT-Owned-Migration-Deprecation-Docs-Handoff-Matrix.md` | erfuellt |
| `docs/de/native-first-migration-guide.md` und `docs/en/native-first-migration-guide.md` | erfuellt |
| `tests/fixtures/native-first/rmt-owned-migration-deprecation-docs-handoff-fixtures.json` | erfuellt |
| `tests/native-first/rmt_owned_migration_deprecation_docs_handoff_suite.js` | erfuellt |
| `package.json` Metadaten `xtend.rmtOwnedMigrationDeprecationDocsHandoff` | erfuellt |
| `scripts/run_xtend_tests.js` Suite-ID `rmt-owned-migration-deprecation-docs-handoff` | erfuellt |

## Entscheidungen

| Thema | Entscheidung |
|-------|--------------|
| Legacy Loader | kompatibel, aber nur mit Warnfenster; kein Silent Removal |
| Docs Highlighter | owned Highlighter oder RMT-aware Semantic Tokens als Ziel; Prism bleibt contained facade |
| Prism/Turndown | keine breiten Public Re-Exports; Turndown fuer neue Raw-HTML-Konvertierung nur mit Trust Boundary |
| Public Docs | Handoff-Dokument und bestehende Native-First Migration Guides nennen Alternativen und Gates |
| Release | offene Entscheidungen bleiben ownerbar fuer `WP-RMO-09` |

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| keine stille Entfernung | erfuellt: `silent-loader-removal` und `loader-deprecation-without-warning-window` sind blockiert |
| Public Docs nennen klare Alternativen | erfuellt: `docs/de/native-first-migration-guide.md` und `docs/en/native-first-migration-guide.md` |
| `native-first-migration-deprecation` bleibt gruen | erfuellt: Source Gate und Regression |
| lokaler Gate ist gruen | erfuellt: `node scripts/run_xtend_tests.js rmt-owned-migration-deprecation-docs-handoff --json` |

## Handoff

`WP-RMO-09` kann Release Handoff, Residual-Entscheidung und naechste Epic-Grenze auf Basis dieser Loader-, Highlighter-, Vendor-Facade- und Public-Docs-Entscheidungen abschliessen.
