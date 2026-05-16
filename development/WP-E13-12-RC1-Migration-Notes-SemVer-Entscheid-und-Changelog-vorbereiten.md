# WP-E13-12 - RC1 Migration Notes, SemVer-Entscheid und Changelog vorbereiten

- Epic: EPIC 13 - RC0 zu RC1 Transfer und Production Readiness
- Status: completed
- Contract: `xtend.epic13.rc1-migration-notes-semver.v1`
- Report Contract: `xtend.epic13.rc1-migration-notes-semver-report.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js epic13-rc1-migration-notes --json`
- Package Script: `npm run test:epic13-rc1-migration-notes`
- Report-Artefakt: `.xtend-test-results/xtend-epic13-rc1-migration-notes-report.json`

## Ziel

Dieses Paket schliesst die offene RC1-Luecke fuer Migration Notes, SemVer-Entscheid und Changelog-Vorgaben. Der Gate ist lokal statisch pruefbar und koppelt an die bereits akzeptierten RC1-Vorbereitungen an:

- Package Export Lock
- Known Residual Triage
- Trusted DOM Boundary
- Release Owner Acceptance

## Umsetzung

- `catalog/epic13-rc1-migration-notes.js` erzeugt Plan, Validator und Report.
- `tests/platform/epic13_rc1_migration_notes_suite.js` prueft Contract, Package Export, Runner, Docs, Release Checklist, CI Matrix, Changelog und Handoff.
- `docs/rc1-migration-notes.md` macht die Migration Notes fuer App- und Komponentenautoren sichtbar.
- `CHANGELOG.md`, `README.md`, `docs/README.md`, `docs/menu.json`, `package.json` und `xtend-builder/scaffold.config.js` wurden an den neuen Contract angebunden.

## Akzeptanzkriterien

| Kriterium | Status |
| --- | --- |
| SemVer-Entscheid `0.1.0-rc.1` dokumentiert | done |
| Consumer-facing Migration Notes mit Loader, RMT, Trusted DOM, Fabric, Typing, Visual und Supply Chain Sections vorhanden | done |
| Changelog-Pflichtfelder dokumentiert | done |
| Package Export Lock von 59 auf 60 erweitert; nach Epic-14/RMT-Tooling auf 78 nachgezogen | done |
| `xtend.epic13Rc1MigrationNotes` in Package- und Scaffold-Metadaten vorhanden | done |
| Handoff auf `WP-E13-13` gesetzt | done |

## Verifikation

```bash
node scripts/run_xtend_tests.js epic13-rc1-migration-notes --json
node scripts/run_xtend_tests.js epic13-rc1-readiness epic13-release-owner-acceptance epic13-package-export-lock epic13-trusted-dom-boundary epic13-rc1-migration-notes --json
npm test
```

## Handoff

`WP-E13-13` ist abgeschlossen. `xtend.epic13.rc1-gate-matrix-ci-handoff.v1` buendelt die finale RC1 Gate Matrix und CI-Handoff-Artefakte aus den akzeptierten WP-E13-01 bis WP-E13-12.
