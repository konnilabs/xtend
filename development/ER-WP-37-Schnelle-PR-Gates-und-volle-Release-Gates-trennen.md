# ER-WP-37 schnelle PR-Gates und volle Release-Gates trennen

- Status: `completed`
- Datum: 7. Mai 2026
- Contract: `xtend.enterprise.er-wp-37.ci-gate-matrix.v1`
- Roadmap: `development/ROADMAP-XTend-Enterprise-Reife.md`
- Entscheidungsdokument: `development/XTend-CI-Gate-Matrix.md`

## Ziel

ER-WP-37 trennt die CI-Verantwortlichkeiten: Pull Requests bekommen ein schnelles, deterministisches Feedback-Gate; Pushes, manuelle Runs und Nightly-Ausfuehrungen bekommen die volle Release-nahe Suite.

## Umgesetzte Artefakte

| Artefakt | Zweck |
|----------|-------|
| `.github/workflows/xtend-default-gates.yml` | Workflow mit `pr-fast-gates` und `full-release-gates` |
| `development/XTend-CI-Gate-Matrix.md` | akzeptierter Gate-Matrix-Contract `xtend.ci.gate-matrix.v1` |
| `package.json` | Scripts `test:pr`, `test:pr:report`, `test:release:full`, `test:release:full:report` und `xtend.ciGateMatrix` |
| `development/XTend-Test-Reporting-und-CI-Vorbereitung.md` | aktualisierte Reporting-Dokumentation fuer Fast-/Full-Gates |
| `tests/references/reference_path_suite.js` | Reference-Gate fuer Workflow, Package-Metadaten und Dokumentation |

## Gate-Zuschnitt

| Gate | Trigger | Command | Artifact |
|------|---------|---------|----------|
| `pr-fast` | `pull_request` | `npm run test:pr:report` | `xtend-pr-gate-report-node-26` |
| `full-release` | `push`, `workflow_dispatch`, `schedule` | `npm run test:release:full:report` | `xtend-release-gate-report-node-26` |

Das PR-Gate laesst browsernahe, performancebezogene, telemetrybreite und RMT-Integrations-Suites aus. Das Full-Release-Gate fuehrt die komplette Runner-Suite aus.

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| PR-Gate hat eigene Suite-Auswahl | `done` |
| Full-Release-Gate fuehrt Vollsuite mit Report aus | `done` |
| Nightly nutzt Full-Release-Gate | `done` |
| Workflow laedt getrennte Artifacts hoch | `done` |
| Package-Metadaten spiegeln Gate-Matrix | `done` |
| Dokumentation und Referenzgate sind aktualisiert | `done` |

## Handoff

| Folgepaket | Status | Inhalt |
|------------|--------|--------|
| `ER-WP-38` | `completed` | Release Checklist und SemVer Policy geschrieben |
| `ER-WP-39` | `completed` | Enterprise Adoption Guide nach Release-Policy |
| `ER-WP-40` | `completed` | Docs-App mit RMT Parsedown Scheduling Pilot abgeschlossen |

`ER-WP-37` ist abgeschlossen. `ER-WP-38` hat auf der Gate-Matrix fuer PR-, Full-Release- und Nightly-Laeufe aufgesetzt; `ER-WP-39` hat daraus den Enterprise Adoption Guide abgeleitet.
