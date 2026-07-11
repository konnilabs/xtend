# WP-E13-02 - Release Owner Acceptance Contract definieren

- Status: `completed`
- Contract: `xtend.epic13.wp02.release-owner-acceptance.v1`
- Produktiver Contract: `xtend.epic13.release-owner-acceptance.v1`
- Gate: `node scripts/run_xtend_tests.js epic13-release-owner-acceptance --json`
- Ausgangspunkt: `WP-E13-01`
- Handoff nach WP-E13-03: abgeschlossen
- Aktueller Handoff: `WP-E13-08`

## Ziel

WP-E13-02 formalisiert den Release-Owner-Schnitt fuer RC1. Die Arbeit legt fest, welche Owner-Entscheidungen zulaessig sind, welche Artefakte vorliegen muessen und warum die Publish Boundary weiterhin geschlossen bleibt.

## Umsetzung

Erzeugt:

- `catalog/epic13-release-owner-acceptance.js`
- `tests/platform/epic13_release_owner_acceptance_suite.js`
- `development/XTend-Epic13-Release-Owner-Acceptance-Contract.md`
- `development/docs-evidence/legacy-routes/en/release-owner-acceptance.md`

Aktualisiert:

- `development/RC0-RC1-transfer-EPIC13.md`
- `package.json`
- `xtend-builder/scaffold.config.js`
- `scripts/run_xtend_tests.js`
- `docs/en/README.md`
- `docs/menu.json`
- `tests/README.md`
- `README.md`
- `CHANGELOG.md`
- `development/XTend-Dokumentations-und-Demo-Referenzpfade.md`
- `development/XTend-Release-Checklist-und-SemVer-Policy.md`
- `development/XTend-CI-Gate-Matrix.md`
- `docs/enterprise-adoption.md`
- `development/docs-evidence/legacy-routes/en/rc1-readiness.md`

## Decisions

| Entscheidung | Status |
|--------------|--------|
| RC1 Readiness Model als Quelle nutzen | `accepted` |
| RC0 Owner Handoff als Baseline behalten | `accepted` |
| Release Report als Owner-Artefakt fuehren | `accepted` |
| Conditional Network Gates in Folgepaket erfassen | `accepted` seit `WP-E13-03` |
| Package Dry Run Export Lock in Folgepaket erfassen | `accepted` seit `WP-E13-04` |
| Known Residuals triagiert | `accepted` seit `WP-E13-05` |
| Hydration-Warnung entscheiden | `accepted` durch `WP-E13-06` |
| Automatische Publish-Freigabe | `blocked` |

## Done-Kriterien

- Owner Checklist nutzt die Statuswerte `accepted`, `deferred`, `blocked`
- `automatic-publish-approval` ist `blocked`
- alle Deferred Items zeigen auf konkrete Folgepakete
- `publishAllowed` und `automaticPublishApproval` bleiben `false`
- `package.json` bleibt `private: true`
- `WP-E13-03`, `WP-E13-04`, `WP-E13-05`, `WP-E13-06`, `WP-E13-07` und `WP-E13-08` sind abgeschlossen; `WP-E13-09` ist als naechstes Paket `ready`

## Handoff

`WP-E13-03` hat `npm audit --audit-level=moderate` und `npm sbom --sbom-format=cyclonedx --json` als RC1-Evidence/Deferral-Flaeche vorbereitet. `WP-E13-04` hat `npm run pack:dry-run` und die Export-Oberflaeche als Package Export Lock ausgewertet. `WP-E13-05` hat die Known Residuals triagiert. `WP-E13-06` hat die Hydration-Warnung owner-frei geschlossen. `WP-E13-07` hat die PROD-nahen Browser-, Local-Server- und CSP-Smokes vorbereitet. `WP-E13-08` hat Visual Owner Artifacts normalisiert. Das naechste Paket ist `WP-E13-09`.
