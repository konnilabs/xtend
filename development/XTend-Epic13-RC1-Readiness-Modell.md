# XTend Epic 13 RC1 Readiness Modell

- Status: Accepted
- Datum: 8. Mai 2026
- Contract: `xtend.epic13.rc1-production-readiness.v1`
- Report: `xtend.epic13.rc1-readiness-report.v1`
- Workpackage: `WP-E13-01`
- Lokaler Gate: `node scripts/run_xtend_tests.js epic13-rc1-readiness --json`
- Zielzustand: `rc1-production-candidate-ready`
- Publish Boundary: `private-until-release-owner-acceptance`

## Zweck

Dieses Modell macht den Transfer von RC0 zu RC1 gatebar. Epic 12 hat XTend in den Zustand `ready-for-release-owner-review-not-publish` gebracht. Epic 13 fuehrt diesen Stand in einen PROD-naeheren Release Candidate, ohne die Publish Boundary automatisch zu oeffnen.

Das Modell ist bewusst kein Feature-Wunschzettel. Es trennt vorhandene Gates, echte Gate-Luecken und Feature Drift.

## RC0 Gate-Abgleich

| Goalpost | Vorhandener Gate | RC1-Entscheidung |
|----------|------------------|------------------|
| RC0 Owner-Handoff | `npm run test:epic12-rc0-handoff` | als Baseline uebernehmen |
| Full Release Report | `npm run test:release:full:report` | Pflichtartefakt |
| PR Fast Report | `npm run test:pr:report` | Regressionslinie |
| RC0 Gate Matrix | `npm run test:rc0-gate-matrix` | zu RC1 Matrix erweitern |
| Docs und Migration Notes | `npm run test:epic12-docs-adoption` | auf RC1 erweitern |
| Release Report | `npm run release:report` | Owner-Artefakt |
| Package Dry Run | `npm run pack:dry-run` | maschinenlesbar pruefen |
| Manifest Security | `npm run test:manifest-policy`, `npm run test:epic13-prod-browser-csp-smoke` | PROD/CSP-Smoke vorbereitet |
| Supply Chain lokal | `npm run test:supply-chain` | mit Network Evidence verbinden |
| Conditional Network Gates | `npm audit --audit-level=moderate`, `npm sbom --json` | ausfuehren oder Owner-Deferral dokumentieren |
| Visual DOM Snapshots | `npm run test:visual-snapshots` | behalten, optionales Pixel-Artefakt ergaenzen |
| Performance Regression | `npm run test:performance` | Hydration-Warnung schliessen oder neu entscheiden |
| A11y Baseline | `npm run test:a11y`, `npm run test:screenreader-signals`, `npm run test:motion-contrast` | browsernah verdichten |
| RMT Compatibility | `npm run test:rmt-compatibility`, `npm run test:rmt-first-class-app`, `npm run test:rmt-artifact-parity` | als RMT Production Readiness buendeln |
| Docs-App RMT Pilot | `npm run test:docs-rmt-pilot` | PROD-nahe Docs-Shell haerten |

## Gate-Luecken

| Luecke | Zielpaket |
|--------|-----------|
| RC1 Gate Matrix | `WP-E13-13` |
| Release Owner Acceptance Contract | `WP-E13-02` |
| Conditional Network Gate Evidence | `WP-E13-03` |
| Package Dry Run Export Surface Lock | `WP-E13-04` |
| RC0 Known Residuals | `WP-E13-05` completed, `WP-E13-06` completed |
| PROD-nahe Browser- und CSP-Smokes | `WP-E13-07` completed, `WP-E13-11` completed |
| Visual Screenshot/Pixels als Owner-Artefakt | `WP-E13-08` |
| RMT-first App Production Readiness | `WP-E13-09`, `WP-E13-10` |
| RC1 Migration Notes und SemVer | `WP-E13-12` completed |
| RC1 finaler Handoff | `WP-E13-14` |

## Feature Drift

Abgelehnt fuer Epic 13:

- XTend in den RMT Kernel einbetten
- CDN-Fallbacks zurueckbringen
- neue Produktfeatures ohne PROD-Readiness-Zweck bauen
- grosse Component-Design-Refreshes ohne Gate-Luecke starten
- Pixel-Diff als hartes lokales Default-Gate erzwingen
- `private: true` automatisch oeffnen

## Workpackage-Status nach WP-E13-12

| Status | Workpackages |
|--------|--------------|
| `completed` | `WP-E13-01` bis `WP-E13-12` |
| `ready` | `WP-E13-13` |
| `planned` | `WP-E13-14` |

## Lokale Verifikation

```bash
node scripts/run_xtend_tests.js epic13-rc1-readiness --json
node scripts/run_xtend_tests.js epic12-rc0-handoff rc0-gate-matrix references --json
```

## Handoff

`WP-E13-03` akzeptiert `xtend.epic13.conditional-network-evidence.v1`. `WP-E13-04` akzeptiert `xtend.epic13.package-export-lock.v1`. `WP-E13-05` akzeptiert `xtend.epic13.known-residual-triage.v1`. `WP-E13-06` akzeptiert `xtend.epic13.hydration-performance-closure.v1`. `WP-E13-07` akzeptiert `xtend.epic13.prod-browser-csp-smoke.v1`. `WP-E13-08` bis `WP-E13-12` akzeptieren Visual Owner Artifact, RMT Production Readiness, Docs RMT Production Hardening, Trusted DOM Boundary und `xtend.epic13.rc1-migration-notes-semver.v1`.

Naechster Schritt: `WP-E13-13` RC1 Gate Matrix und CI-Handoff erstellen.
