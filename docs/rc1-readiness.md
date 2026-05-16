# RC1 Readiness

- Contract: `xtend.epic13.rc1-production-readiness.v1`
- Report: `xtend.epic13.rc1-readiness-report.v1`
- Workpackage: `WP-E13-01`
- Lokaler Gate: `node scripts/run_xtend_tests.js epic13-rc1-readiness --json`
- Zielzustand: `rc1-production-candidate-ready`

RC1 fuehrt den RC0-Handoff in einen PROD-naeheren Release Candidate. Der Status bedeutet nicht Publish. `private-until-release-owner-acceptance` bleibt aktiv.

## Was RC1 pruefbar machen muss

| Bereich | RC1-Pflicht |
|---------|-------------|
| Release Owner Acceptance | formaler Contract mit Accepted, Deferred und Blocked Entscheidungen |
| Conditional Network Gates | `npm audit --audit-level=moderate` und `npm sbom --sbom-format=cyclonedx --json` ausfuehren oder Owner-Deferral dokumentieren |
| Package Dry Run | Paketinhalt und Export Surface maschinenlesbar pruefen |
| Known Residuals | `xstate` und `x-utils` sind geschlossen; `xtend.component.hydrate` ist in `WP-E13-06` owner-frei geschlossen |
| Browser/CSP | PROD-nahe same-origin, Nonce und Loader-Smokes sind unter [PROD Browser CSP Smokes](./prod-browser-csp-smokes.md) vorbereitet |
| Visual Evidence | DOM-first Snapshots behalten und optionales Screenshot/Pixels-Artefakt unter [Visual Owner Artifacts](./visual-owner-artifacts.md) normalisieren |
| RMT Apps | RMT-first App Shell, Routing, Components, Fabric, Lanes und Diagnostics buendeln |
| Docs-App | Parsedown bleibt orchestrierte Komponente innerhalb einer RMT Shell |
| Trusted DOM | Parsedown/RMT HTML Boundary browsernah geprueft |
| Migration Notes | RC1 SemVer- und Changelog-Entscheid vorbereiten |

## Baseline Gates

```bash
node scripts/run_xtend_tests.js epic13-rc1-readiness --json
node scripts/run_xtend_tests.js epic12-rc0-handoff --json
node scripts/run_xtend_tests.js rc0-gate-matrix --json
node scripts/run_xtend_tests.js references --json
```

## Feature Drift

Nicht Teil von RC1:

- XTend in den RMT Kernel einbetten
- CDN-Fallbacks in Default-Pfade zurueckbringen
- neue Produktfeatures ohne PROD-Readiness-Zweck bauen
- `private: true` automatisch oeffnen

## Handoff

`WP-E13-02` ist abgeschlossen und dokumentiert den Release Owner Acceptance Contract unter [Release Owner Acceptance](./release-owner-acceptance.md). `WP-E13-03` ist ebenfalls abgeschlossen und dokumentiert die Conditional Network Evidence unter [Conditional Network Evidence](./conditional-network-evidence.md). `WP-E13-04` ist abgeschlossen und dokumentiert den Package Export Lock unter [Package Export Lock](./package-export-lock.md). `WP-E13-05` ist abgeschlossen und dokumentiert die Known Residual Triage unter [Known Residual Triage](./known-residual-triage.md). `WP-E13-06` ist abgeschlossen und dokumentiert die [Hydration Performance Closure](./hydration-performance-closure.md). `WP-E13-07` ist abgeschlossen und dokumentiert die [PROD Browser CSP Smokes](./prod-browser-csp-smokes.md). `WP-E13-08` ist abgeschlossen und dokumentiert `xtend.epic13.visual-owner-artifact.v1` unter [Visual Owner Artifacts](./visual-owner-artifacts.md). `WP-E13-09` ist abgeschlossen und dokumentiert `xtend.epic13.rmt-production-readiness.v1` unter [RMT Production Readiness](./rmt-production-readiness.md). `WP-E13-10` ist abgeschlossen und dokumentiert `xtend.epic13.docs-rmt-production-hardening.v1` unter [Docs RMT Production Hardening](./docs-rmt-production-hardening.md). `WP-E13-11` ist abgeschlossen und dokumentiert `xtend.epic13.trusted-dom-boundary.v1` unter [Trusted DOM Boundary Browser Proof](./trusted-dom-boundary-browser-proof.md). `WP-E13-12` ist abgeschlossen und dokumentiert `xtend.epic13.rc1-migration-notes-semver.v1` unter [RC1 Migration Notes](./rc1-migration-notes.md). `WP-E13-13` ist abgeschlossen und dokumentiert `xtend.epic13.rc1-gate-matrix-ci-handoff.v1` unter [RC1 Gate Matrix und CI-Handoff](./rc1-gate-matrix-ci-handoff.md). `WP-E13-14` ist ready fuer den finalen Epic-13-Abschlussreview.
