# ER-WP-38 Release Checklist und SemVer Policy schreiben

- Status: `completed`
- Datum: 7. Mai 2026
- Contract: `xtend.enterprise.er-wp-38.release-checklist-semver-policy.v1`
- Roadmap: `development/ROADMAP-XTend-Enterprise-Reife.md`
- Entscheidungsdokument: `development/XTend-Release-Checklist-und-SemVer-Policy.md`

## Ziel

ER-WP-38 macht Release-Kandidaten nachvollziehbar: Versionierung, Breaking-Change-Bewertung, Changelog, Migration Notes, Gate-Matrix, Supply-Chain und Artifact-Review sind als verbindlicher Prozess dokumentiert.

Der Publish-Prozess wird dabei nicht gestartet. `package.json` bleibt `private: true`; die neue Policy beschreibt die Pruefung eines Release-Kandidaten und den Publish Boundary.

## Umgesetzte Artefakte

| Artefakt | Zweck |
|----------|-------|
| `development/XTend-Release-Checklist-und-SemVer-Policy.md` | akzeptierter Release-/SemVer-Contract `xtend.release.checklist-semver-policy.v1` |
| `package.json` | `xtend.releaseChecklist` mit SemVer-, Gate-, Artifact- und Publish-Boundary-Metadaten |
| `development/XTend-Package-Export-und-Release-Strategie.md` | Package-Strategie auf ER-WP-38-Policy aktualisiert |
| `development/ROADMAP-XTend-Enterprise-Reife.md` | ER-WP-38, ER-WP-39 und ER-WP-40 abgeschlossen |
| `development/XTend-Dokumentations-und-Demo-Referenzpfade.md` | Release-Policy im Reference-Register sichtbar |
| `tests/references/reference_path_suite.js` | Reference-Gate prueft Policy, Package-Metadaten und Roadmap-Status |

## Release-Policy-Zuschnitt

| Bereich | Entscheidung |
|---------|--------------|
| SemVer vor `1.0.0` | Minor darf breaking sein, braucht aber Changelog, Migration Notes, Contract Impact und Owner Signoff |
| SemVer ab `1.0.0` | Major fuer Breaking, Minor fuer kompatible Features, Patch fuer kompatible Fixes |
| Pflichtgates | Full-Release-Report, Manifest Policy, Supply-Chain, RMT Artifact Parity, Release Report, Pack Dry Run |
| Conditional Gates | `npm audit --audit-level=moderate`, `npm sbom --sbom-format=cyclonedx --json` |
| Publish Boundary | `private: true` bleibt bis Release Owner Approval |
| Handoff | `ER-WP-39` hat den Enterprise Adoption Guide auf dieser Policy aufgesetzt; `ER-WP-40` hat den Docs-App-Pilot abgeschlossen |

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| Release Checklist ist dokumentiert | `done` |
| SemVer-Regeln vor und nach `1.0.0` sind dokumentiert | `done` |
| Breaking-Change-Pflichten sind beschrieben | `done` |
| Candidate Gates und conditional Network Gates sind benannt | `done` |
| Package-Metadaten spiegeln die Policy | `done` |
| Roadmap und Referenzgate kennen ER-WP-38 | `done` |

## Handoff

| Folgepaket | Status | Inhalt |
|------------|--------|--------|
| `ER-WP-39` | `completed` | Enterprise Adoption Guide geschrieben |
| `ER-WP-40` | `completed` | Docs-App perspektivisch mit RMT Parsedown Scheduling pilotiert |

`ER-WP-38` ist abgeschlossen. `ER-WP-39` hat den Enterprise Adoption Guide auf Loader, Dev Server, Fabric, RMT, Security, A11y, Performance, CI Gate Matrix und Release Policy aufgesetzt.
