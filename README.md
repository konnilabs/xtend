# XTend

- Status: Enterprise Readiness / private package
- Package contract: `xtend.package-export.release-strategy.v1`
- Release checklist: `xtend.release.checklist-semver-policy.v1`
- Canonical loader: `xtend-loader.js`

XTend ist ein Web-Component-Framework fuer lokale, CDN-freie Entwicklung. Die aktuelle Enterprise-Reife-Strecke trennt XTend UI als Component-/UI-Builder-Produkt von XTendRMT als framework-agnostischem Scheduler und Templating Kernel.

## Einstiegspunkte

| Zweck | Pfad |
|-------|------|
| Kanonischer Browser Loader | `xtend-loader.js` |
| Legacy Loader Stub | `xtend-dev.js` |
| UI API | `api.js` |
| Komponentenmanifest | `components/manifest.json` |
| XTend-Fabric Runtime | `fabric/xtend-fabric.js` |
| Fabric/RMT Lane Mapping | `fabric/rmt-lane-mapping.js` |
| Performance fuer Komponentenautoren | `docs/performance.md` |
| Performance Measurements | `docs/performance-measurements.md` |
| Performance Regression | `docs/performance-regression.md` |
| Hydration Policies | `docs/hydration-policies.md` |
| Hydration Performance Closure | `docs/hydration-performance-closure.md` |
| PROD Browser CSP Smokes | `docs/prod-browser-csp-smokes.md` |
| Visual Owner Artifacts | `docs/visual-owner-artifacts.md` |
| Trusted DOM Boundary Proof | `docs/trusted-dom-boundary-browser-proof.md` |
| RC1 Migration Notes | `docs/rc1-migration-notes.md` |
| A11y Keyboard Smokes | `docs/a11y-keyboard-smokes.md` |
| Screenreader Signals | `docs/screenreader-signals.md` |
| Motion und Contrast | `docs/motion-contrast.md` |
| Manifest Import Policy | `security/manifest-import-policy.js` |
| Component Catalog Coverage | `catalog/component-catalog-coverage.js` |
| Visual/Browser Regression Priority | `catalog/component-regression-priority.js` |
| Enterprise Adoption Guide | `docs/enterprise-adoption.md` |
| RC0 Adoption Guide | `docs/rc0-adoption-guide.md` |
| RC0 Gate Matrix | `development/XTend-RC0-Gate-Matrix.md` |
| Docs RMT Parsedown Pilot | `docs/xtendrmt-parsedown-docs.rmt` |
| CI Default Gates | `.github/workflows/xtend-default-gates.yml` |
| CI Gate Matrix | `development/XTend-CI-Gate-Matrix.md` |
| Release Checklist und SemVer | `development/XTend-Release-Checklist-und-SemVer-Policy.md` |
| XTendRMT ESM Runtime | `xtendrmt/rmt-runtime.esm.js` |
| XTendRMT Browser Runtime | `xtendrmt/rmt-runtime.browser.js` |
| Scaffold CLI | `xt`, `xtend`, `xtend-scaffold`, `xtend-builder/scaffold.js` |
| Supply-Chain Policy | `security/supply-chain-gate-policy.js` |

## Lokale Entwicklung

```bash
npm run dev:local
npm test
xt validate --json
npm run test:fabric-performance
npm run test:performance
npm run test:hydration-policy
npm run test:screenreader-signals
npm run test:motion-contrast
npm run test:catalog-coverage
npm run test:regression-priority
npm run test:report
npm run test:pr
npm run test:release:full
npm run test:manifest-policy
npm run test:supply-chain
npm run test:rc0-gate-matrix
npm run test:epic12-docs-adoption
npm run test:epic13-package-export-lock
npm run test:epic13-prod-browser-csp-smoke
npm run test:epic13-visual-owner-artifact
npm run test:epic13-trusted-dom-boundary
npm run test:epic13-rc1-migration-notes
npm run dev:local:csp
npm run test:docs-rmt-pilot
npm run release:check
npm run pack:dry-run:report
npm run pack:dry-run
```

`npm publish` ist durch `private: true` absichtlich gesperrt. Die Package-Exports, Supply-Chain-Gates, Release-Gates und Provenance-Defaults sind vorbereitet, damit spaetere Release-Pakete ohne Architektur-Refactor aufsetzen koennen.

Der aktive GitHub-Actions-Workflow `.github/workflows/xtend-default-gates.yml` nutzt Node `26.x` und trennt Pull-Request-Feedback von Full-Release-Gates: `npm run test:pr:report` laedt `xtend-pr-gate-report-node-26`, `npm run test:release:full:report` laedt `xtend-release-gate-report-node-26`.

Release-Kandidaten folgen `xtend.release.checklist-semver-policy.v1`. `package.json` spiegelt die Pflichten unter `xtend.releaseChecklist`; `private: true` bleibt bis zum Release-Owner-Approval bestehen.

Enterprise-Teams starten mit `docs/enterprise-adoption.md`. Der Guide verbindet Loader, lokalen Dev Server, XTend UI, XTend-Fabric, XTendRMT, Security, A11y, Performance, CI Gates und Release Readiness zu einem operativen Einfuehrungspfad. Die zugehoerige Package-Metadatenflaeche liegt unter `xtend.enterpriseAdoption`.

`WP-E12-15` ergaenzt den RC0 Adoption Guide unter `docs/rc0-adoption-guide.md`. Der Guide verbindet Long-Tail Runtime Closure, DOM-first Visual Snapshots, Design Tokens, RMT DSL Authoring Polish, Known Residual Policy und RC0 Gate Matrix fuer Component Authors, App Authors und Release Owner. Die Package-Metadatenflaeche liegt unter `xtend.epic12DocsAdoption`.

`WP-E12-16` schliesst Epic 12 mit dem RC0 Handoff unter `docs/epic12-rc0-handoff.md` ab. Der Handoff verbindet die Gate-Matrix, Migration Notes, Known Residual Policy, Conditional Network Gates, Package Dry Run und Publish Boundary fuer Release Owner. Die Package-Metadatenflaeche liegt unter `xtend.epic12Rc0Handoff`; der Status ist `ready-for-release-owner-review-not-publish`.

`WP-E13-01` startet den RC0-zu-RC1-Transfer mit dem RC1 Readiness Model unter `docs/rc1-readiness.md`. Der Gate-Abgleich verbindet vorhandene RC0-Gates mit den noch offenen PROD-Readiness-Luecken fuer Release Owner Acceptance, Network Evidence, Package Dry Run Export Lock, Known Residuals, PROD-nahe Browser-/CSP-Smokes, RMT Production Readiness und Migration Notes. Die Package-Metadatenflaeche liegt unter `xtend.epic13Rc1Readiness`.

`WP-E13-02` definiert den Release Owner Acceptance Contract unter `docs/release-owner-acceptance.md`. Die Owner Checklist nutzt `accepted`, `deferred` und `blocked`, blockiert `automatic-publish-approval` und haelt `private-until-release-owner-acceptance` aktiv. Die Package-Metadatenflaeche liegt unter `xtend.epic13ReleaseOwnerAcceptance`; nach `WP-E13-09` zeigt der Handoff auf `WP-E13-10`.

`WP-E13-03` definiert die Conditional Network Evidence unter `docs/conditional-network-evidence.md`. `npm audit --audit-level=moderate` und `npm sbom --json` besitzen erwartete `.xtend-test-results/` Artefakte, waehrend lokale Default-Gates netzwerkfrei bleiben und strukturierte Deferrals wie `network-restricted-local-default` erzeugen koennen. Die Package-Metadatenflaeche liegt unter `xtend.epic13ConditionalNetworkEvidence`.

`WP-E13-04` definiert den Package Export Lock unter `docs/package-export-lock.md`. `npm run pack:dry-run:report` erzeugt `.xtend-test-results/xtend-pack-dry-run.json`, `.xtend-test-results/xtend-package-export-surface-lock.json` und `.xtend-test-results/xtend-package-export-lock-report.json`. Die Package-Metadatenflaeche liegt unter `xtend.epic13PackageExportLock`.

`WP-E13-05` definiert die Known Residual Triage unter `docs/known-residual-triage.md`. `xstate` und `x-utils` sind fuer RC1 als Boundary-Contracts geschlossen, waehrend `xtend.component.hydrate` als einziger Watchpoint nach `WP-E13-06` ging. Die Package-Metadatenflaeche liegt unter `xtend.epic13KnownResidualTriage`.

`WP-E13-06` definiert die Hydration Performance Closure unter `docs/hydration-performance-closure.md`. `xtend.component.hydrate` liegt mit `31ms` unter dem unveraenderten `32ms` Budget, die RC1-Baseline meldet `warnCount === 0`, und es bleibt kein Owner-Residual fuer Hydration uebrig. Die Package-Metadatenflaeche liegt unter `xtend.epic13HydrationPerformanceClosure`.

`WP-E13-07` definiert die PROD Browser CSP Smokes unter `docs/prod-browser-csp-smokes.md`. `xtend.epic13.prod-browser-csp-smoke.v1` beschreibt same-origin Manifest, Nonce, root-lokalen Loader, lokalen CSP Header und `tests/browser/fixtures/epic13-prod-csp-smoke.html`. Die Package-Metadatenflaeche liegt unter `xtend.epic13ProdBrowserCspSmoke`.

`WP-E13-08` definiert die Visual Owner Artifacts unter `docs/visual-owner-artifacts.md`. `xtend.epic13.visual-owner-artifact.v1` beschreibt Manifest, deterministische Viewports, `.xtend-test-results/visual-snapshots/rc1/{family}/{viewport}/{theme}/{density}/{motion}.png` und den lokalen DOM-first Gate ohne verpflichtenden Browser-Treiber. Die Package-Metadatenflaeche liegt unter `xtend.epic13VisualOwnerArtifact`.

`WP-E13-09` definiert die RMT Production Readiness unter `docs/rmt-production-readiness.md`. `xtend.epic13.rmt-production-readiness.v1` buendelt RMT-first App Shell, Routing, Components, Fabric/Lanes, Lifecycle Telemetry, Diagnostics und Artifact Parity als RC1-Gate. Die Package-Metadatenflaeche liegt unter `xtend.epic13RmtProductionReadiness`.

`WP-E13-10` definiert das Docs RMT Production Hardening unter `docs/docs-rmt-production-hardening.md`. `xtend.epic13.docs-rmt-production-hardening.v1` stabilisiert die Docs-App als Shell-first RMT/Parsedown-Pfad mit Extension-Slots fuer `parsedownHtml`, `richHtml`, `xplayerTutorial` und Diagnostics. Die Package-Metadatenflaeche liegt unter `xtend.epic13DocsRmtProductionHardening`.

`WP-E13-11` definiert den Trusted DOM Boundary Browser Proof unter `docs/trusted-dom-boundary-browser-proof.md`. `xtend.epic13.trusted-dom-boundary.v1` prueft Parsedown HTML, RMT `html_fragment`, `dom_descriptor`-Praeferenz, Sanitizer `xtend.security.trusted-dom-sanitizer.v1`, CSP-Anschluss und die Fixture `tests/browser/fixtures/epic13-trusted-dom-boundary-smoke.html`. Die Package-Metadatenflaeche liegt unter `xtend.epic13TrustedDomBoundary`.

`WP-E13-12` definiert die RC1 Migration Notes unter `docs/rc1-migration-notes.md`. `xtend.epic13.rc1-migration-notes-semver.v1` dokumentiert den SemVer-Entscheid von `0.0.0-enterprise-readiness` zu `0.1.0-rc.1`, Consumer-Migrationen fuer Loader, RMT, Docs, Trusted DOM, Fabric, Typing, Visual Owner Artifacts und Supply Chain sowie den Handoff nach `WP-E13-13`. Die Package-Metadatenflaeche liegt unter `xtend.epic13Rc1MigrationNotes`.

`ER-WP-40` finalisiert den Enterprise-Reife-Paketlauf mit dem Docs-App RMT Parsedown Pilot. Das RMT-Dokument `docs/xtendrmt-parsedown-docs.rmt` beschreibt `xtend.docs.parsedown-rmt-pilot.v1` inzwischen Shell-first: `docs.app.shell` und `docs.header.search` werden als RMT-`dom_descriptor` gerendert, waehrend Parsedown, PHP und Sanitizing in der Docs-App Boundary bleiben. Die Package-Metadatenflaeche liegt unter `xtend.docsRmtPilot`.

## Dokumentation

- `docs/` enthaelt die offizielle Entwicklerdokumentation.
- `development/XTend-Package-Export-und-Release-Strategie.md` beschreibt die Distribution- und Release-Entscheidung.
- `docs/performance.md` beschreibt die Performance-Policy fuer Komponentenautoren.
- `development/XTend-Performance-Messpunkte-und-Snapshots.md` beschreibt Loader-, Hydration-, Render- und Route-Messpunkte.
- `development/XTend-Performance-Regression-Gate.md` beschreibt das deterministische Performance Regression Gate.
- `development/XTend-Hydration-Policy-Contract.md` beschreibt Lazy/Idle/Visible Hydration Policies.
- `development/XTend-Browsernaher-Fokus-und-Keyboard-Smoke-Plan.md` beschreibt browsernahe A11y-Fokus- und Keyboard-Smokes.
- `development/XTend-Screenreader-Signal-Contract.md` beschreibt `xtend.a11y.screenreader-signals.v1` fuer Live-Regionen, Statusregionen, Errorregionen und Announcements.
- `development/XTend-Motion-und-Contrast-Policy.md` beschreibt `xtend.a11y.motion-contrast-policy.v1` fuer Reduced Motion, High Contrast, Fokus und Nicht-Farbstatus.
- `development/XTend-Manifest-und-Dynamic-Import-Policy.md` beschreibt Loader-, Manifest- und Dynamic-Import-Haertung.
- `development/XTend-Supply-Chain-Gate-Plan.md` beschreibt Dependency-, License- und Vulnerability-Gates.
- `development/XTend-Epic12-Abschluss-und-RC0-Handoff.md` beschreibt den RC0 Owner-Handoff und die Publish Boundary fuer Epic 12.
- `development/XTend-Epic13-RC1-Readiness-Modell.md` beschreibt den RC0-zu-RC1-Transfer und die Gate-Luecken zur Production Readiness.
- `development/XTend-Epic13-Release-Owner-Acceptance-Contract.md` beschreibt `xtend.epic13.release-owner-acceptance.v1`, Owner Inputs, Checklist-Statuswerte und die blockierte automatische Publish-Freigabe.
- `development/XTend-Epic13-Conditional-Network-Evidence-Contract.md` beschreibt `xtend.epic13.conditional-network-evidence.v1`, Audit-/SBOM-Artefakte und strukturierte Offline-/Sandbox-Deferrals.
- `development/XTend-Epic13-Package-Export-Lock-Contract.md` beschreibt `xtend.epic13.package-export-lock.v1`, Dry-Run-Artefakte und den Export-Surface-Lock.
- `development/XTend-Epic13-Known-Residual-Triage-Contract.md` beschreibt `xtend.epic13.known-residual-triage.v1`, Boundary-Schliessungen fuer `xstate`/`x-utils` und den Hydration-Watchpoint.
- `development/XTend-Epic13-Hydration-Performance-Closure-Contract.md` beschreibt `xtend.epic13.hydration-performance-closure.v1`, die owner-freie Schliessung von `xtend.component.hydrate` und den Handoff nach `WP-E13-09`.
- `development/XTend-Epic13-PROD-Browser-CSP-Smoke-Contract.md` beschreibt `xtend.epic13.prod-browser-csp-smoke.v1`, Nonce, same-origin Manifest, lokalen CSP Header und die PROD-nahe Browser-Fixture.
- `development/XTend-Epic13-Visual-Owner-Artifact-Contract.md` beschreibt `xtend.epic13.visual-owner-artifact.v1`, Manifest, Viewports und optionale Screenshot-/Pixel-Artefakte.
- `development/XTend-Epic13-RMT-Production-Readiness-Contract.md` beschreibt `xtend.epic13.rmt-production-readiness.v1`, RMT-first App Shell, Routing, Components, Fabric/Lanes, Diagnostics, Artifact Parity und Kernel Boundary.
- `development/XTend-Epic13-Docs-RMT-Production-Hardening-Contract.md` beschreibt `xtend.epic13.docs-rmt-production-hardening.v1`, Docs-App Extension-Slots, Parsedown-Host-Boundary, Rich-HTML-/XPlayer-Schedules und Diagnostics.
- `development/XTend-Epic13-Trusted-DOM-Boundary-Contract.md` beschreibt `xtend.epic13.trusted-dom-boundary.v1`, Parsedown/RMT HTML Sanitizer, Browser-Fixture und Kernel Boundary.
- `development/XTend-Epic13-RC1-Migration-Notes-und-SemVer-Entscheid.md` beschreibt `xtend.epic13.rc1-migration-notes-semver.v1`, vorgeschlagene RC-Version `0.1.0-rc.1`, Migration Sections, Changelog-Pflichten und Handoff nach `WP-E13-13`.
- `development/XTend-Component-Catalog-Coverage-Matrix.md` beschreibt `xtend.catalog.component-coverage-matrix.v1` fuer Manifest-weite Component-Reife.
- `development/XTend-Visuelle-und-Browsernahe-Regression-Prioritaetsplan.md` beschreibt `xtend.catalog.component-regression-priority-plan.v1` fuer Visual-/Browser-Regression.
- `development/XTend-CI-Default-Gates-Workflow.md` beschreibt `xtend.ci.default-gates.v1` fuer den aktiven CI-Workflow.
- `development/XTend-CI-Gate-Matrix.md` beschreibt `xtend.ci.gate-matrix.v1` fuer PR-Fast-, Full-Release- und Nightly-Gates.
- `development/XTend-Release-Checklist-und-SemVer-Policy.md` beschreibt `xtend.release.checklist-semver-policy.v1` fuer Release-Kandidaten, SemVer, Breaking Changes, Migration Notes, Artifacts und Publish Boundary.
- `docs/enterprise-adoption.md` beschreibt `xtend.docs.enterprise-adoption.v1` fuer Enterprise Adoption, Betriebsprofile, Gate-Reihenfolge und Release Readiness.
- `docs/rc0-adoption-guide.md` beschreibt `xtend.epic12.docs-adoption.v1` fuer RC0 Migration Notes, Adoption Checks, Known Residuals und Publish Boundary.
- `docs/xtendrmt-parsedown-scheduling.md` beschreibt `xtend.docs.parsedown-rmt-pilot.v1`, `docs.app.shell`, `docs.header.search`, `docs.media.lazy` und `xtend.docsRmtPilot` fuer den Shell-first Docs-App RMT Parsedown Scheduling Pilot.
- `development/ROADMAP-XTend-Enterprise-Reife.md` fuehrt die Enterprise-Workpackages.
