# ER-WP-36 CI Workflow fuer Default Gates anlegen

- Status: `completed`
- Datum: 6. Mai 2026
- Contract: `xtend.enterprise.er-wp-36.ci-default-gates.v1`
- Roadmap: `development/ROADMAP-XTend-Enterprise-Reife.md`
- Entscheidungsdokument: `development/XTend-CI-Default-Gates-Workflow.md`

## Ziel

ER-WP-36 produktisiert die lokalen XTend-Default-Gates in CI. Der Workflow fuehrt den zentralen Test-Runner mit JSON-Report aus und macht das Ergebnis als GitHub-Actions-Artifact verfuegbar.

## Umgesetzte Artefakte

| Artefakt | Zweck |
|----------|-------|
| `.github/workflows/xtend-default-gates.yml` | aktiver GitHub-Actions-Workflow fuer Default-Gates |
| `development/XTend-CI-Default-Gates-Workflow.md` | akzeptierter CI-Workflow-Contract `xtend.ci.default-gates.v1` |
| `development/XTend-Test-Reporting-und-CI-Vorbereitung.md` | aktualisierte Test-/Reporting-Dokumentation mit aktivem Workflow |
| `package.json` | `xtend.ciDefaultGates` Metadaten fuer Workflow, Report und Artifact |
| `tests/references/reference_path_suite.js` | Reference-Gate prueft CI-Workflow, Contract und Package-Metadaten |

## Technische Entscheidungen

- Node-Version im Workflow ist `20.x`.
- Primaeres CI-Gate ist `npm run test:report`.
- `npm run test:report` bleibt die reportfaehige Variante von `npm test`, statt die Vollsuite doppelt zu starten.
- Report-Pfad ist `.xtend-test-results/xtend-test-report.json`.
- Artifact-Name ist `xtend-test-report-node-20`.
- Artifact Upload laeuft mit `if: always()`, damit Fehlerberichte erhalten bleiben.
- Netzwerkbasierte Release-/Audit-Gates bleiben nicht Teil des Default-Workflows.

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| Default-Gates laufen in CI reproduzierbar | `done` |
| JSON-Report wird erzeugt | `done` |
| Report wird als Artifact hochgeladen | `done` |
| Node-Version ist festgelegt | `done` |
| Test-/Reporting-Doku ist aktualisiert | `done` |
| Reference-Gate kennt Workflow und Contract | `done` |

## Handoff

| Folgepaket | Status | Inhalt |
|------------|--------|--------|
| `ER-WP-37` | `completed` | schnelle PR-Gates und volle Release-Gates trennen |
| `ER-WP-38` | `completed` | Release Checklist und SemVer Policy auf CI-Gates aufgesetzt |
| `ER-WP-39` | `completed` | Enterprise Adoption Guide nach Release-Policy geschrieben |
| `ER-WP-40` | `completed` | Docs-App mit RMT Parsedown Scheduling Pilot abgeschlossen |

`ER-WP-36` ist abgeschlossen. `ER-WP-37` hat die urspruengliche Vollsuite in eine Gate-Matrix ueberfuehrt; `ER-WP-38` hat daraus die Release Checklist abgeleitet.
