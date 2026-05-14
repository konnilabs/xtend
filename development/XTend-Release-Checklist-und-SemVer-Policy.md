# XTend Release Checklist und SemVer Policy

- Status: Accepted
- Datum: 7. Mai 2026
- Contract: `xtend.release.checklist-semver-policy.v1`
- Workpackage: `ER-WP-38`
- Bezug:
  - `package.json`
  - `CHANGELOG.md`
  - `README.md`
  - `development/XTend-Package-Export-und-Release-Strategie.md`
  - `development/XTend-CI-Gate-Matrix.md`
  - `development/XTend-Supply-Chain-Gate-Plan.md`
  - `development/XTend-Manifest-und-Dynamic-Import-Policy.md`
  - `development/XTend-Performance-Regression-Gate.md`
  - `development/XTend-Visuelle-und-Browsernahe-Regression-Prioritaetsplan.md`

## Zweck

Diese Policy macht XTend releasefaehig planbar, ohne den Publish-Prozess zu starten. Sie verbindet Package-Exports, SemVer, Changelog, Migration Notes, Gate-Matrix, Supply-Chain und Artifact-Review zu einer nachvollziehbaren Release-Checkliste.

`private: true` bleibt bestehen, bis ein Release Owner den Publish Boundary bewusst oeffnet. Diese Datei beschreibt also den Prozess fuer Release-Kandidaten, nicht die Freigabe selbst.

## Release-Kandidat

Ein Release-Kandidat ist erst reviewbar, wenn alle folgenden Punkte erfuellt sind:

| Bereich | Pflicht |
|---------|---------|
| Version | `package.json` enthaelt die geplante Version und bleibt bis zur Freigabe `private: true` |
| Changelog | `CHANGELOG.md` enthaelt Loader-, Component-, Fabric-, RMT-, Security-, A11y-, Performance- und CI-Auswirkungen |
| SemVer | Breaking-/Feature-/Patch-Klasse ist nach dieser Policy dokumentiert |
| Migration Notes | Breaking Changes haben konkrete Migrationshinweise |
| CI Matrix | `pr-fast`, `full-release` und `nightly` sind aus `xtend.ci.gate-matrix.v1` nachvollziehbar |
| Supply Chain | License-, Vulnerability-, SBOM- und Provenance-Punkte sind entschieden oder explizit blockierend |
| Artifacts | Release Reports und Pack-Dry-Run sind erzeugt oder bewusst als nicht ausgefuehrt markiert |
| Owner | Release Owner bestaetigt Publish Boundary, Tag, Changelog und Gate-Ergebnis |

## SemVer Policy

XTend bleibt bis zur ersten stabilen Enterprise-Freigabe im `0.x`-Bereich.

### Vor `1.0.0`

- Minor-Versionen duerfen breaking sein, muessen aber explizit als Breaking Change im `CHANGELOG.md` und in Migration Notes markiert werden.
- Patch-Versionen duerfen keine bewussten Breaking Changes enthalten.
- Contract-Aenderungen an Loader, Manifest, Fabric, RMT, Security, A11y, Performance oder Component Public Types gelten als release-relevant.
- Jede Entfernung eines Legacy-Pfads, auch vor `1.0.0`, braucht einen Migrationshinweis.

### Ab `1.0.0`

| Versionsteil | Verwendung |
|--------------|------------|
| Major | Breaking API-, Contract-, Loader-, Component-, Fabric-, RMT-Adapter- oder Package-Export-Aenderungen |
| Minor | rueckwaertskompatible Features, neue Komponenten, neue optionale Contracts, neue Adapter, neue Doku-Oberflaechen |
| Patch | rueckwaertskompatible Fixes, Testhaertungen, Doku-Korrekturen, Policy-Klarstellungen, nicht-brechende Security-Haertung |

## Breaking-Change-Definition

Ein Change ist breaking, wenn mindestens einer dieser Punkte zutrifft:

- Package Export wird entfernt, umbenannt oder semantisch inkompatibel geaendert.
- `xtend-loader.js`, Manifest Resolution oder Default Loader Boot Contract aendert sich inkompatibel.
- oeffentliche Component-Attribute, Events, Slots, Public Types oder Custom Element Tags aendern sich inkompatibel.
- `XTend-Fabric` API, Reporter Contract, Fiber/Lane Contract oder Diagnostics Contract aendert sich inkompatibel.
- XTendRMT Adapter-, Runtime-Bridge-, Routing- oder Template-Contracts aendern sich inkompatibel.
- Security-, Trusted-DOM-, Manifest-Import- oder Supply-Chain-Policy blockiert bisher gueltige Default-Pfade ohne Migration.
- A11y- oder Performance-Pflichten erzwingen neue Pflichtfelder fuer bestehende Komponenten.

## Release-Gates

Pflichtgates fuer einen Release-Kandidaten:

```bash
npm run test:release:full:report
npm run test:manifest-policy
npm run test:supply-chain
npm run test:rc0-gate-matrix
npm run test:epic12-docs-adoption
npm run test:epic12-rc0-handoff
npm run test:epic13-rc1-readiness
npm run test:epic13-release-owner-acceptance
npm run test:epic13-conditional-network-evidence
npm run test:epic13-package-export-lock
npm run test:epic13-known-residual-triage
npm run test:epic13-hydration-performance-closure
npm run test:epic13-prod-browser-csp-smoke
npm run test:epic13-visual-owner-artifact
npm run test:epic13-rmt-production-readiness
npm run test:epic13-docs-rmt-production-hardening
npm run test:epic13-trusted-dom-boundary
npm run test:epic13-rc1-migration-notes
npm run test:epic13-rc1-gate-matrix-ci-handoff
npm run test:epic13-release-report-pack-dry-run-evidence
npm run test:epic13-conditional-network-evidence-ci
npm run test:docs-rmt-pilot
npm run test:rmt-artifact-parity
npm run release:report
npm run pack:dry-run:report
npm run pack:dry-run
```

Netzwerkbasierte Gates bleiben conditional, weil sie lokale Entwicklung nicht blockieren duerfen:

```bash
npm audit --audit-level=moderate
npm sbom --json
```

Wenn diese Netzwerk-Gates nicht laufen, muss der Release-Kandidat den Grund dokumentieren und darf nur als lokaler Dry-Run, nicht als Publish-Freigabe, gelten.

## Artifact Checklist

| Artifact | Pflicht | Zweck |
|----------|---------|-------|
| `.xtend-test-results/xtend-release-gate-report.json` | ja | Full-Release-Gate aus der CI Gate Matrix |
| `.xtend-test-results/xtend-release-report.json` | ja | lokaler Release Report |
| `.xtend-test-results/xtend-rc0-gate-matrix-report.json` | ja | RC0 Gate Matrix Self Check |
| `docs/rc0-adoption-guide.md` | ja | RC0 Migration Notes und Enterprise Adoption |
| `docs/epic12-rc0-handoff.md` | ja | RC0 Owner Review Handoff |
| `docs/rc1-readiness.md` | ja | RC1 Readiness und offene Gate-Luecken |
| `docs/release-owner-acceptance.md` | ja | Epic 13 Release Owner Acceptance und Publish Boundary |
| `development/XTend-Epic13-Release-Owner-Acceptance-Contract.md` | ja | Owner Checklist, Deferrals und blockierte automatische Publish-Freigabe |
| `docs/conditional-network-evidence.md` | ja | Conditional Network Evidence und Deferral-Regeln |
| `development/XTend-Epic13-Conditional-Network-Evidence-Contract.md` | ja | Audit-/SBOM-Artefakte und Owner-Deferrals |
| `.xtend-test-results/xtend-conditional-network-evidence-report.json` | ja | aggregierte Conditional Network Evidence oder Deferral |
| `docs/package-export-lock.md` | ja | Package Export Lock und Surface Groups |
| `docs/rmt-production-readiness.md` | ja | RMT-first App Shell, Routing, Components, Fabric/Lanes, Diagnostics und Artifact Parity als RC1-Buendel |
| `development/XTend-Epic13-RMT-Production-Readiness-Contract.md` | ja | RMT Production Readiness Contract und Kernel Boundary |
| `.xtend-test-results/xtend-epic13-rmt-production-readiness-report.json` | ja | RMT Production Readiness Report |
| `docs/docs-rmt-production-hardening.md` | ja | Docs-App RMT Extension-Slots, Parsedown-Host-Boundary und Diagnostics |
| `development/XTend-Epic13-Docs-RMT-Production-Hardening-Contract.md` | ja | Docs RMT Production Hardening Contract |
| `.xtend-test-results/xtend-epic13-docs-rmt-production-hardening-report.json` | ja | Docs RMT Production Hardening Report |
| `docs/trusted-dom-boundary-browser-proof.md` | ja | Trusted DOM Boundary Browser Proof fuer Parsedown/RMT HTML |
| `development/XTend-Epic13-Trusted-DOM-Boundary-Contract.md` | ja | Trusted DOM Boundary Contract |
| `.xtend-test-results/xtend-epic13-trusted-dom-boundary-report.json` | ja | Trusted DOM Boundary Report |
| `tests/browser/fixtures/epic13-trusted-dom-boundary-smoke.html` | ja | Browsernahe Trusted-DOM-Fixture |
| `docs/rc1-migration-notes.md` | ja | RC1 Migration Notes, SemVer-Entscheid und Consumer-Kommunikation |
| `development/XTend-Epic13-RC1-Migration-Notes-und-SemVer-Entscheid.md` | ja | maschinenlesbarer Migration-/SemVer-Contract |
| `.xtend-test-results/xtend-epic13-rc1-migration-notes-report.json` | ja | RC1 Migration Notes Report |
| `docs/rc1-gate-matrix-ci-handoff.md` | ja | RC1 Gate Matrix und CI-Handoff |
| `development/XTend-Epic13-RC1-Gate-Matrix-und-CI-Handoff.md` | ja | Source Gates, CI Lanes, Reports und Handoff Contract |
| `.xtend-test-results/xtend-epic13-rc1-gate-matrix-ci-handoff-report.json` | ja | RC1 Gate Matrix und CI-Handoff Report |
| `docs/release-report-pack-dry-run-evidence.md` | ja | Release Report und Pack Dry Run Owner-Evidence |
| `development/XTend-Epic13-Release-Report-und-Pack-Dry-Run-Evidence.md` | ja | maschinenlesbarer Release-/Pack-Evidence-Contract |
| `.xtend-test-results/xtend-epic13-release-report-pack-dry-run-evidence-report.json` | ja | Release Report und Pack Dry Run Evidence Report |
| `docs/conditional-network-evidence-ci.md` | ja | Conditional Network Evidence CI |
| `development/XTend-Epic13-Conditional-Network-Evidence-CI-Contract.md` | ja | Audit-/SBOM-CI-Evidence und Deferral Capture |
| `.xtend-test-results/xtend-epic13-conditional-network-evidence-ci-report.json` | ja | Conditional Network Evidence CI Report |
| `development/XTend-Epic13-Package-Export-Lock-Contract.md` | ja | Dry-Run-Artefakte, Export Surface und Drift-Regeln |
| `.xtend-test-results/xtend-pack-dry-run.json` | ja | rohe `npm pack --dry-run --json` Ausgabe |
| `.xtend-test-results/xtend-package-export-surface-lock.json` | ja | maschinenlesbarer Export-/Files-Snapshot |
| `.xtend-test-results/xtend-package-export-lock-report.json` | ja | validierter Package Export Lock Report |
| `docs/known-residual-triage.md` | ja | Known Residual Triage und Hydration Watchpoint |
| `development/XTend-Epic13-Known-Residual-Triage-Contract.md` | ja | RC1-Entscheidmatrix fuer `xstate`, `x-utils` und `xtend.component.hydrate` |
| `.xtend-test-results/xtend-known-residual-triage-report.json` | ja | validierter Known Residual Triage Report |
| `docs/hydration-performance-closure.md` | ja | owner-freie Hydration Performance Closure |
| `development/XTend-Epic13-Hydration-Performance-Closure-Contract.md` | ja | `xtend.component.hydrate` Closure ohne Budgetlockerung |
| `.xtend-test-results/xtend-hydration-performance-closure-report.json` | ja | validierter Hydration Performance Closure Report |
| `docs/prod-browser-csp-smokes.md` | ja | PROD-nahe Browser-/CSP-Smokes |
| `development/XTend-Epic13-PROD-Browser-CSP-Smoke-Contract.md` | ja | Nonce, same-origin Manifest, lokaler CSP Header und Browser-Fixture |
| `tests/browser/fixtures/epic13-prod-csp-smoke.html` | ja | PROD-nahe Browser-Fixture |
| `docs/visual-owner-artifacts.md` | ja | Visual Owner Artifact und Screenshot-Pfadkonvention |
| `development/XTend-Epic13-Visual-Owner-Artifact-Contract.md` | ja | Manifest, Viewports und optionale Screenshot-/Pixel-Artefakte |
| `tests/browser/visual-baselines/rc1-visual-owner-artifact.manifest.json` | ja | RC1 Visual Owner Artifact Manifest |
| `.xtend-test-results/visual-snapshots/rc1/visual-owner-artifact-report.json` | nein | optionaler Owner-/CI-Report fuer Screenshot-Artefakte |
| `CHANGELOG.md` | ja | Release Notes und Breaking Changes |
| `README.md` | ja | aktueller Consumer-Einstieg |
| `package.json` | ja | Version, Exports, Scripts, Metadata, `private` Boundary |
| Migration Notes | bei Breaking Changes | konkrete Upgrade-Anleitung |
| SBOM | conditional | Supply-Chain-Review bei Netzwerkfreigabe |

## Changelog-Pflichtfelder

Jeder Release-Eintrag muss mindestens diese Abschnitte pruefen:

- Loader und lokale Entwicklung
- Package Exports und Distribution
- Components und Public Types
- XTend-Fabric, Fibers, Lanes und Diagnostics
- XTendRMT Runtime, App-DSL und Adapter
- Performance und Hydration
- A11y, Screenreader, Motion und Contrast
- Security, Manifest Import, Trusted DOM und Supply Chain
- CI Gate Matrix und Release Artifacts
- RC0 Gate Matrix und Known Residual Policy
- Epic 12 RC0 Handoff und Owner Review Inputs
- Epic 13 RC1 Readiness und offene Gate-Luecken
- Epic 13 Release Owner Acceptance, `accepted`/`deferred`/`blocked` und `automatic-publish-approval`
- Epic 13 Conditional Network Evidence, Audit/SBOM und Offline-/Sandbox-Deferrals
- Epic 13 Package Export Lock, `pack:dry-run:report`, Export Surface und Dry-Run-Artefakte
- Epic 13 Known Residual Triage, `xstate`/`x-utils` Boundary-Schliessung und `xtend.component.hydrate` Watchpoint
- Epic 13 Visual Owner Artifact, Manifest, deterministische Viewports und optionale Browser-/CI-Screenshots
- Epic 13 Trusted DOM Boundary, `xtend.epic13.trusted-dom-boundary.v1`, Parsedown/RMT HTML Sanitizer und Browser-Fixture
- Epic 13 RC1 Migration Notes, `xtend.epic13.rc1-migration-notes-semver.v1`, vorgeschlagene Version `0.1.0-rc.1` und Handoff zu `WP-E13-13`
- Epic 13 RC1 Gate Matrix und CI-Handoff, `xtend.epic13.rc1-gate-matrix-ci-handoff.v1`, CI Lanes, Report-Artefakte und Handoff zu `WP-E13-14`
- Epic 13 Release Report und Pack Dry Run Evidence, `xtend.epic13.release-report-pack-dry-run-evidence.v1`, `release:report`, `pack:dry-run` und Handoff zu `DPF-WP-03`
- Epic 13 Conditional Network Evidence CI, `xtend.epic13.conditional-network-evidence-ci.v1`, `conditional-network:evidence`, Audit/SBOM-Artefakte und Handoff zu `DPF-WP-04`
- Breaking Changes und Migration Notes

Nicht betroffene Abschnitte duerfen als `keine Aenderung` zusammengefasst werden.

## Publish Boundary

`package.json` bleibt `private: true`. Die Publish Boundary darf nur geoeffnet werden, wenn:

- Release Owner und technische Review die Checkliste akzeptieren.
- `license` fuer einen oeffentlichen Release nicht mehr `UNLICENSED` ist oder bewusst als private/internal bestaetigt wird.
- `npm audit --audit-level=moderate` und `npm sbom --json` ausgefuehrt oder explizit als nicht verfuegbar dokumentiert sind.
- `publishConfig.provenance` aktiv bleibt.
- `pack:dry-run:report` keine unerwarteten Artefakte, fehlenden Kernpfade oder Export-Surface-Drift zeigt.

## Package Metadata

`package.json` spiegelt diese Policy unter:

```text
xtend.releaseChecklist
```

Pflichtfelder:

- `schema: xtend.release.checklist-semver-policy.v1`
- `workpackage: ER-WP-38`
- `semver.currentPhase: 0.x-enterprise-readiness`
- `candidateGates`
- `conditionalNetworkGates`
- `artifactChecklist`
- `publishBoundary`
- `completedRun: ER-WP-40`
- `nextWorkpackage: null`

## Handoff

| Folgepaket | Status | Aufgabe |
|------------|--------|---------|
| `ER-WP-39` | `completed` | Enterprise Adoption Guide auf Loader, Fabric, RMT, Performance, A11y, Security und Release Policy aufgesetzt |
| `ER-WP-40` | `completed` | Docs-App mit Shell-first RMT Parsedown Scheduling Pilot, `docs.app.shell`, `docs.header.search`, `xtend.docsRmtPilot` und `npm run test:docs-rmt-pilot` finalisiert |

`ER-WP-38` ist abgeschlossen, wenn Roadmap, Package-Strategie, Package-Metadaten, Reference-Gate und Dokumentationsregister dieselbe Release Checklist und SemVer Policy beschreiben. Nach `ER-WP-40` ist der Enterprise-Reife-Paketlauf abgeschlossen; vor einem Publish ist ein neuer Produktreife-Checkpoint erforderlich.
