# Changelog

Alle sichtbaren Produktaenderungen werden in diesem Dokument gesammelt. XTend bleibt bis zur Freigabe der Supply-Chain- und Release-Gates als privates Paket markiert.

## 0.0.0-enterprise-readiness - 2026-05-06

- Package-Export-Strategie unter `xtend.package-export.release-strategy.v1` vorbereitet.
- Kanonische Package-Subpaths fuer Loader, API, Komponentenmanifest, Fabric, Fabric/RMT Lane Mapping, XTendRMT Runtime und Scaffold CLI festgelegt.
- Release-Gates `release:check`, `release:report` und `pack:dry-run` in `package.json` ergaenzt.
- Supply-Chain-Gate-Plan unter `xtend.security.supply-chain-gate-plan.v1` mit Offline-Verify, License Policy, Vulnerability Policy und CI-Audit-Handoff ergaenzt.
- Lokale Gates `test:supply-chain` und `supply-chain:verify` ergaenzt.
- Performance Measurements unter `xtend.performance.measurement.v1` fuer Loader, Hydration, Render und Route Render ergaenzt.
- Lokales Gate `test:fabric-performance` ergaenzt.
- Performance Regression Gate unter `xtend.performance.regression-gate.v1` mit deterministischer Baseline und `test:performance` ergaenzt.
- Hydration Policies unter `xtend.fabric.hydration-policy.v1` fuer visible, idle und lazy Hydration mit `test:hydration-policy` ergaenzt.
- Performance-Autorendoku und Scaffold Policy `xtend.scaffold.performance-policy.v1` fuer Component-Profile ergaenzt.
- Browsernahe A11y-Fokus-/Keyboard-Smokes unter `xtend.a11y.browser-keyboard-smoke.v1` fuer Routing, Overlay, Form/Input und Tabs ergaenzt.
- Screenreader-Signal-Contracts unter `xtend.a11y.screenreader-signals.v1` fuer `aria-live`, Statusregionen, Errorregionen und Announcements mit `test:screenreader-signals` ergaenzt.
- Motion-/Contrast-Policy unter `xtend.a11y.motion-contrast-policy.v1` fuer `prefers-reduced-motion`, `forced-colors`, Fokus und Nicht-Farbstatus mit `test:motion-contrast` ergaenzt.
- Manifest-/Dynamic-Import-Policy unter `xtend.security.manifest-import-gate.v1` mit Loader-Refusals und lokalem Gate ergaenzt.
- Component Catalog Coverage Matrix unter `xtend.catalog.component-coverage-matrix.v1` mit `test:catalog-coverage`, Package-Export und Handoff an Catalog-Folgepakete ergaenzt.
- Visual-/Browser-Regression-Prioritaetsplan unter `xtend.catalog.component-regression-priority-plan.v1` mit `test:regression-priority`, Package-Export und CI-Handoff ergaenzt.
- CI Default Gates unter `xtend.ci.default-gates.v1` mit GitHub-Actions-Workflow, Node `26.x`, `npm run test:report` und Artifact `xtend-test-report-node-26` ergaenzt.
- CI Gate Matrix unter `xtend.ci.gate-matrix.v1` mit `test:pr`, `test:pr:report`, `test:release:full`, `test:release:full:report`, PR-Fast-Artifact und Full-Release-Artifact ergaenzt.
- Release Checklist und SemVer Policy unter `xtend.release.checklist-semver-policy.v1` mit `xtend.releaseChecklist`, Candidate Gates, Conditional Network Gates, Breaking-Change-Pflichten, Migration Notes, Artifact-Checklist und Release-Owner-Publish-Boundary ergaenzt.
- Enterprise Adoption Guide unter `xtend.docs.enterprise-adoption.v1` mit `xtend.enterpriseAdoption`, Loader-, Fabric-, RMT-, Security-, A11y-, Performance-, CI- und Release-Readiness-Pfad ergaenzt.
- RC0 Gate Matrix und RC0 Adoption Guide unter `xtend.epic12.rc0-gate-matrix.v1` und `xtend.epic12.docs-adoption.v1` mit `test:rc0-gate-matrix`, `test:epic12-docs-adoption`, Migration Notes, Known Residual Policy und Publish Boundary ergaenzt.
- Epic 12 RC0 Handoff unter `xtend.epic12.rc0-handoff.v1` mit `test:epic12-rc0-handoff`, Owner Review Inputs, Conditional Network Gate Status, Known Residual Policy und Status `ready-for-release-owner-review-not-publish` ergaenzt.
- Epic 13 RC1 Readiness Model unter `xtend.epic13.rc1-production-readiness.v1` mit `test:epic13-rc1-readiness`, RC0-zu-RC1-Gate-Abgleich, Feature-Drift-Bereinigung und Workpackages fuer Production Readiness vorbereitet.
- Epic 13 Release Owner Acceptance Contract unter `xtend.epic13.release-owner-acceptance.v1` mit `test:epic13-release-owner-acceptance`, Owner Checklist, `accepted`/`deferred`/`blocked` Statuswerten, blockierter `automatic-publish-approval` und Handoff an `WP-E13-03` ergaenzt.
- Epic 13 Conditional Network Evidence unter `xtend.epic13.conditional-network-evidence.v1` mit `test:epic13-conditional-network-evidence`, Audit-/SBOM-Artefaktpfaden, `xtend.epic13.conditional-network-deferral.v1` und lokal netzwerkfreiem Owner-Deferral-Modell ergaenzt.
- Epic 13 Package Export Lock unter `xtend.epic13.package-export-lock.v1` mit `test:epic13-package-export-lock`, `pack:dry-run:report`, `.xtend-test-results/xtend-pack-dry-run.json`, `.xtend-test-results/xtend-package-export-surface-lock.json` und Drift-Check gegen `package.json#exports` ergaenzt.
- Epic 13 Known Residual Triage unter `xtend.epic13.known-residual-triage.v1` mit `test:epic13-known-residual-triage`, Boundary-Schliessungen fuer `xstate`/`x-utils` und `xtend.component.hydrate` als WP-E13-06 Watchpoint ergaenzt.
- Epic 13 Hydration Performance Closure unter `xtend.epic13.hydration-performance-closure.v1` mit `test:epic13-hydration-performance-closure`, `xtend.component.hydrate` bei `31ms / 32ms`, `warnCount === 0` und Handoff nach `WP-E13-09` ergaenzt.
- Epic 13 PROD Browser CSP Smoke unter `xtend.epic13.prod-browser-csp-smoke.v1` mit `test:epic13-prod-browser-csp-smoke`, `dev:local:csp`, Nonce, same-origin Manifest, lokalem CSP Header und `tests/browser/fixtures/epic13-prod-csp-smoke.html` ergaenzt.
- Epic 13 Visual Owner Artifact unter `xtend.epic13.visual-owner-artifact.v1` mit `test:epic13-visual-owner-artifact`, Manifest `tests/browser/visual-baselines/rc1-visual-owner-artifact.manifest.json`, deterministischen Viewports und optionalem Screenshot-/Pixel-Artefaktpfad ergaenzt.
- Epic 13 RMT Production Readiness unter `xtend.epic13.rmt-production-readiness.v1` mit `test:epic13-rmt-production-readiness`, RMT-first App Shell, Routing, Components, Fabric/Lanes, Lifecycle Telemetry, Diagnostics und Artifact Parity als RC1-Buendel ergaenzt.
- Epic 13 Docs RMT Production Hardening unter `xtend.epic13.docs-rmt-production-hardening.v1` mit `test:epic13-docs-rmt-production-hardening`, stabilen Docs-App Extension-Slots, Parsedown-Host-Boundary, Rich-HTML-/XPlayer-Schedules und Diagnostics ergaenzt.
- Epic 13 Trusted DOM Boundary unter `xtend.epic13.trusted-dom-boundary.v1` mit `test:epic13-trusted-dom-boundary`, Sanitizer `xtend.security.trusted-dom-sanitizer.v1`, browsernaher Fixture `tests/browser/fixtures/epic13-trusted-dom-boundary-smoke.html` und Package-Metadaten `xtend.epic13TrustedDomBoundary` ergaenzt.
- Epic 13 RC1 Migration Notes unter `xtend.epic13.rc1-migration-notes-semver.v1` mit `test:epic13-rc1-migration-notes`, vorgeschlagener Version `0.1.0-rc.1`, Migration Notes, SemVer Decision, Changelog-Pflichten und Package-Metadaten `xtend.epic13Rc1MigrationNotes` ergaenzt.
- Docs-App RMT Parsedown Scheduling Pilot unter `xtend.docs.parsedown-rmt-pilot.v1` auf Shell-first erweitert: `docs.app.shell`, `docs.header.search`, `docs.media.lazy`, `xtend.docsRmtPilot`, `docs/xtendrmt-parsedown-docs.rmt`, per-page Host-Metadaten und `test:docs-rmt-pilot` sind gatebar.
- Docs-App UX-Hardening fuer `x-header`/`x-hero` ergaenzt: strukturierte Docs-Navigation, `search`-/`actions`-Slotmodell, kontraststarke Header-Shell, themenfaehiger Hero und leichte Route-Mikrointeraktionen ohne Docs-App-Monkeypatching.
- XRouter Scroll-Boundary-Normalisierung unter `xtend.router.scroll-boundary.v1` ergaenzt, damit Route-Wechsel von langen auf kurze Seiten keine stale Scrollpositionen oder Deadzones unterhalb des Contentbereichs hinterlassen.
- Form-Control-Shell-Sizing fuer `x-form` und `x-input` gehaertet, damit Header-Suchen und kompakte Form-Slots Padding, Border und Control-Breite ohne horizontales Herausragen berechnen.
- Header-Navigation als fixed Full-Width-Overlay gehaertet und XRouter Overlay-Cleanup unter `xtend.router.closedNavigationOverlays` ergaenzt, damit geoeffnete Menues beim Route-Wechsel keine Deadzones oder lange Scrollbereiche erzeugen.
- Docs-App Parsedown SafeMode-Nachbearbeitung fuer Inline-Code ergaenzt, damit Komponenten-Namen wie `<x-code>` nicht als doppelt escapete Entities angezeigt werden und die Trusted-DOM-Boundary trotzdem erhalten bleibt.
- Docs-App Navigation von flacher Linkliste auf kaskadierende Artikelhierarchie mit `id`, `group`, `parent`, `tier` und PageRank-artigem `rank` umgestellt, sodass Basics zuerst sichtbar sind und Spezialthemen als Deep Dives aufklappen.
- `x-icon` als RMT-kompatible XTend-Komponente ergaenzt: lokale Core-Icons, lokaler Lucide-Adapter, globale `window.XTend.icons` Registry, Public Types, Component-Suite, Fixture und Docs-App-Menue-Ikonographie ohne CDN-Abhaengigkeit.
- npm Provenance fuer spaetere Releases vorbereitet, aber Publishing durch `private: true` bewusst blockiert.
- Root-README fuer Package-Konsumenten und lokale Enterprise-Entwicklung ergaenzt.
