# WP-E11-17 - Legacy Long-Tail Migration planen

- Status: `completed`
- Datum: 7. Mai 2026
- Epic: `EPIC-11`
- Contract: `xtend.epic11.legacy-long-tail-migration.v1`
- Entry Contract: `xtend.epic11.legacy-long-tail-migration-entry.v1`
- Gate Contract: `xtend.epic11.legacy-long-tail-migration-gate.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js component-long-tail-migration --json`

## Ziel

Das Paket ueberfuehrt den offenen Component Long Tail in einen belastbaren Migrationsplan. Die Migration bleibt inkrementell, vermeidet Big-Bang-Rewrites und behandelt Infrastruktur-/Utility-Oberflaechen anders als sichtbare Custom Elements.

## Umgesetzte Artefakte

| Artefakt | Zweck |
|----------|-------|
| `catalog/component-long-tail-migration.js` | maschinenlesbarer Plan aus Catalog Coverage und Regression Priority |
| `tests/catalog/component_long_tail_migration_suite.js` | lokaler Gate fuer Plan, Status, Handoff und Referenzen |
| `development/XTend-Epic11-Legacy-Long-Tail-Migrationsplan.md` | akzeptierter Migrationscontract |
| `docs/component-long-tail-migration.md` | Entwicklerdokumentation fuer Long-Tail-Migration |
| `package.json` | Export, Script, PR-Gate und XTend-Metadaten |
| `xtend-builder/scaffold.config.js` | Scaffold-/Governance-Metadaten |

## Entscheidungen

- Der Long Tail umfasste zum Paketabschluss `x-tabs`, `x-theme`, `x-button`, `x-menu`, `xstate` und `x-utils`; nach `WP-E12-09` besitzt `xstate` Suite, Fixture und Public Types und bleibt nur als A11y-/Performance-Boundary-Probe offen. `x-utils` besitzt Utility Contract, Import Policy, Fixture und Public Types und bleibt nur als Performance-Boundary-Entscheidung offen.
- `x-tabs` war P0 in Wave 1 und ist seit `WP-E12-02`/`WP-E12-03` geschlossen.
- `x-theme`, `x-button` und `x-menu` waren Wave 2 und sind seit `WP-E12-04` bis `WP-E12-07` geschlossen.
- `xstate` und `x-utils` werden als Adapter-/Utility-Grenzen behandelt und erhalten Integration-Probes statt erzwungener Visual-Shells.
- Die Strategie bleibt `incremental-no-big-bang`.
- Die RMT-Grenze bleibt `no-rmt-kernel-import-of-xtend-types`.

## Verifikation

```bash
node scripts/run_xtend_tests.js component-long-tail-migration --json
node scripts/run_xtend_tests.js component-long-tail-migration catalog-coverage regression-priority component-ux-authoring-docs references --json
npm test -- --json
```

## Handoff

`WP-E11-18` ist abgeschlossen. Der Abschlussreview hat Epic-11-KPIs, Restluecken, Release Readiness und naechste Produktwelle im Enterprise UX Handoff bewertet.
