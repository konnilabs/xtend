# XTend Enterprise Adoption Guide

- Status: Active ab `ER-WP-39`, erweitert in `WP-E12-16`
- Docs Contract: `xtend.docs.enterprise-adoption.v1`
- Epic-12 Adoption Contract: `xtend.epic12.docs-adoption.v1`
- Workpackage: `ER-WP-39`, `WP-E12-15`, `WP-E12-16`
- Package Metadata: `xtend.enterpriseAdoption`, `xtend.epic12DocsAdoption`
- Scope: Loader, Dev Server, XTend-Fabric, XTendRMT, Security, A11y, Performance, CI Gates, RC0 Gate Matrix und Release Readiness

## Ziel

Dieser Guide ist der offizielle Startpfad fuer Teams, die XTend in Enterprise-Web-Apps einsetzen wollen. Er verbindet die bisher getrennten Produktbausteine zu einem operativen Ablauf:

- XTend UI bleibt das Web-Component- und UI-Builder-Produkt.
- XTendRMT bleibt Scheduler, Runtime Bridge und Templating-Kernel.
- XTend-Fabric ist die lokale Safety-, Diagnostics-, Telemetry- und Reporter-Schicht.
- Lokale Entwicklung bleibt CDN-frei und nutzt den kanonischen ESM Loader `xtend-loader.js`.

Der Guide startet keinen Publish-Prozess. `package.json` traegt fuer RC1-Publish-Prep `private: false`, nachdem Release Checklist und Release Owner die Publish Boundary explizit freigegeben haben.

## Adoption-Stufen

| Stufe | Ergebnis | Primaere Artefakte |
|-------|----------|--------------------|
| 1. Local Baseline | XTend laeuft lokal und CDN-frei | `xtend-loader.js`, `components/manifest.json`, `npm run dev:local` |
| 2. UI Baseline | Komponenten werden manifestbasiert geladen | `docs/components.md`, `docs/public-component-types.md` |
| 3. Fabric Baseline | Fehler, Diagnostics und Telemetry sind lokal sichtbar | `fabric/xtend-fabric.js`, `docs/xtend-fabric.md` |
| 4. RMT Baseline | Scheduling, Routes und Components laufen ueber native RMT-Domains | `docs/xtendrmt-app-dsl.md`, `docs/xtendrmt-runtime-bridge.md` |
| 5. Security Baseline | Loader-, Import-, DOM- und Supply-Chain-Grenzen sind verstanden | `docs/manifest-import-policy.md`, `docs/trusted-dom-sanitizing.md`, `docs/supply-chain-gates.md` |
| 6. Quality Baseline | Performance, A11y und Component-Coverage sind gatebar | `docs/performance.md`, `docs/screenreader-signals.md`, `docs/component-catalog-coverage.md` |
| 7. Release Baseline | PR-, Full-Release- und Release-Kandidaten-Gates sind nachvollziehbar | `development/XTend-CI-Gate-Matrix.md`, `development/XTend-Release-Checklist-und-SemVer-Policy.md` |
| 8. Epic 10 Baseline | TypeScript-first Component Platform und RMT-first Apps sind gatebar | `docs/component-platform.md`, `docs/rmt-first-xtend-apps.md`, `docs/epic10-release-handoff.md` |
| 9. Epic 12 RC0 Baseline | Long-Tail Closure, Snapshot Gate, Design Tokens, RMT DSL Polish, RC0 Matrix und Owner-Handoff sind adoptionfaehig dokumentiert | `docs/rc0-adoption-guide.md`, `docs/rc0-gate-matrix.md`, `docs/epic12-rc0-handoff.md` |
| 10. Epic 13 RC1 Readiness | RC0-zu-RC1-Gate-Abgleich, Release Owner Acceptance, Network Evidence, Package Dry Run Export Lock, Known Residual Triage, Hydration Performance Closure, PROD-nahe CSP-Smokes, Visual Owner Artifacts, RMT Production Readiness und Docs RMT Production Hardening sind geschnitten | `docs/rc1-readiness.md`, `docs/hydration-performance-closure.md`, `docs/prod-browser-csp-smokes.md`, `docs/rmt-production-readiness.md`, `docs/docs-rmt-production-hardening.md`, `development/RC0-RC1-transfer-EPIC13.md` |

## 1. Lokale Baseline

Nutze den lokalen Dev-/Test-Server und den kanonischen Loader:

```bash
npm run dev:local
```

Der Loader ist:

```text
xtend-loader.js
```

Der Legacy-Stub `xtend-dev.js` bleibt nur Kompatibilitaetsoberflaeche. Neue Apps referenzieren `xtend-loader.js` direkt und konfigurieren das Manifest lokal:

```html
<script
  type="module"
  src="/xtend-loader.js"
  data-manifest="/components/manifest.json">
</script>
```

Pflichtregeln:

- Kein CDN im Default-Pfad.
- Keine externen Manifest- oder Modul-URLs.
- `window.__XTendLoaderBootPromise` nutzen, wenn App-Code auf geladene Komponenten warten muss.
- Browser-nahe Demos und Fixtures laufen ueber den lokalen Server.

Weiterfuehrend: [XTend Loader](./xtend-loader.md), [Manifest Import Policy](./manifest-import-policy.md).

Fuer PROD-nahe CSP-Smokes steht ab `WP-E13-07` zusaetzlich der Contract `xtend.epic13.prod-browser-csp-smoke.v1` bereit:

```bash
npm run test:epic13-prod-browser-csp-smoke
npm run dev:local:csp
```

Weiterfuehrend: [PROD Browser CSP Smokes](./prod-browser-csp-smokes.md).

## 2. UI Baseline

XTend-Komponenten werden als Custom Elements ueber das Manifest geladen. Enterprise-Teams sollten zuerst die priorisierten, type-gated Komponenten verwenden:

- Routing: `x-router`, `x-link`
- Overlays: `x-dialog`, `x-modal`, `x-lightbox`
- Forms: `x-input`, `x-form`, `x-calendar`, `x-writer`
- Feedback: `x-alert`, `x-toast`, `x-spinner`
- Interaction: `x-button`, `x-tabs`, `x-menu`, `x-summary`

Public Types liegen fuer die priorisierten Oberflaechen als `.d.ts` Dateien vor. Events, Attribute und Detail-Payloads sind in [Public Component Types](./public-component-types.md) dokumentiert.

Pflichtregeln:

- Neue Komponenten brauchen Source, Docs, Fixture, Component-Suite, Types, A11y-Profil und Performance-Profil.
- Eventnamen bleiben stabil und werden in Docs sowie Types abgebildet.
- State-getriebene Komponenten spiegeln kanonische `xstate` Keys.

Weiterfuehrend: [Komponenten-Entwicklung](./components.md), [Component Catalog Coverage](./component-catalog-coverage.md), [Visual Browser Regression](./visual-browser-regression.md).

Seit `ECH-WP-11` liegt fuer Corporate-Design-Teams ein eigener Guide vor: [Drittanbieter Design Authoring](./third-party-design-authoring.md). Er gehoert zur UI Baseline und dokumentiert den Contract `xtend.enterprise.third-party-authoring-guide.v1`, XTend.css Override Patterns, XTheme Token Bridge, CSS Parts, Icon Pack Registrierung, Layout Modes, A11y-Dos and Donts, P0 Token-/Part-Referenzen und Legacy-Token-Migration.

Lokaler Gate:

```bash
node scripts/run_xtend_tests.js enterprise-third-party-authoring-guide --json
```

Seit `ECH-WP-12` ist die Enterprise Component Flexibilitaetswelle als Release Handoff geschnitten: [Enterprise Component Flex Release Handoff](./enterprise-component-flex-release-handoff.md). Der Contract `xtend.enterprise.component-flex-release-handoff.v1` dokumentiert SemVer-Bewertung, Deprecated Aliases, Migration Notes, Release Checklist, Adoption Risiken und den Publish Boundary `private-until-release-owner-acceptance`.

Lokaler Gate:

```bash
node scripts/run_xtend_tests.js enterprise-component-flex-release-handoff --json
```

## 3. Fabric Baseline

XTend-Fabric ist die Sicherheits- und Telemetry-Schicht fuer UI-Arbeit:

```js
const fabric = window.XTendFabric.createXtendFabric();
```

Wichtige APIs:

| API | Einsatz |
|-----|---------|
| `createComponentLifecycleBoundary` | Lifecycle-Fehler von Komponenten kapseln |
| `runFiber` | UI-Arbeit mit Lane, Kind und Diagnostics ausfuehren |
| `createTelemetrySnapshot` | lokale Runtime-Snapshots erstellen |
| `createBackpressureSignal` | Scheduler- und Host-Druck sichtbar machen |
| `createReporterAdapter` | Enterprise-Reporter sicher vorbereiten |
| `createRuntimeDiagnosticsBridge` | Fabric, `xstate`, API und RMT Diagnostics verbinden |

Reporter sind opt-in. Ohne registrierten Reporter verlaesst keine Diagnostic die Runtime. Enterprise-Reporter muessen redigierte Payloads akzeptieren und duerfen keine DOM Nodes, Tokens, Cookies oder Credentials serialisieren.

Weiterfuehrend: [XTend-Fabric Runtime](./xtend-fabric.md), [Fabric RMT Lane Mapping](./xtend-fabric-rmt-lane-mapping.md).

## 4. RMT Baseline

XTendRMT ist framework-agnostisch. RMT kennt XTend nicht als Kernel-Abhaengigkeit, kann XTend-Arbeit aber ueber neutrale Records und Adapter schedulen.

Native Domains:

| Domain | Zweck |
|--------|-------|
| `adapters` | Host-Adapter fuer XTend, XRouter, Vanilla oder Custom Hosts |
| `components` | Component Records, Props, Slots, Events und ScheduleRefs |
| `routes` | Native Route Records mit XRouter-kompatibler Adapterausgabe |
| `schedules` | sichtbare, idle, diagnostics und user-blocking Policies |
| `templates` | strukturierte Templating-Pfade ohne Framework-Einbettung |

Enterprise-Regel: XTend UI und XTendRMT werden zusammen betrieben, aber nicht ineinander eingebettet. XTend-Fabric darf RMT Adapter- und Bridge-Signale konsumieren; der RMT Kernel bleibt host-neutral.

Weiterfuehrend: [XTendRMT App-DSL](./xtendrmt-app-dsl.md), [XTendRMT Runtime Bridge](./xtendrmt-runtime-bridge.md), [Native RMT Authoring](./xtendrmt-native-authoring.md).

## 5. Security Baseline

Enterprise-Adoption beginnt mit klaren Trust Boundaries:

| Bereich | Betriebsregel |
|---------|---------------|
| Loader | nur lokale, same-origin oder loopback Manifest-/Modulpfade |
| Manifest | keine URL-Dependencies, keine invaliden Tags, keine externen Defaults |
| Dynamic Imports | `.js` und `.mjs`, keine `javascript:`, `data:`, `blob:` oder CDN-URLs |
| Trusted DOM | `html_fragment` und Parsedown HTML bleiben DOM-untrusted |
| Events | keine Credentials in Event-Details oder Diagnostics |
| Supply Chain | privates Paket, explizite License- und Vulnerability-Policy |

Lokale Gates:

```bash
npm run test:manifest-policy
npm run test:supply-chain
```

Weiterfuehrend: [Manifest Import Policy](./manifest-import-policy.md), [Trusted DOM und Sanitizing](./trusted-dom-sanitizing.md), [Supply-Chain Gates](./supply-chain-gates.md).

## 6. Performance Baseline

XTend folgt Performance-by-design. Komponenten bekommen Profile, Budgets, Hydration Policies und Messpunkte.

Pflichtpunkte:

- `visible`, `idle` und `lazy` Hydration bewusst einsetzen.
- `user-blocking` nur fuer echte Nutzerinteraktion und A11y-kritische Arbeit verwenden.
- DOM-Reads und DOM-Writes trennen.
- High-frequency Events drosseln oder zusammenfassen.
- Performance Regression lokal auswerten und Warnungen triagieren.

Lokale Gates:

```bash
npm run test:fabric-performance
npm run test:performance
npm run test:hydration-policy
```

Weiterfuehrend: [Performance fuer Komponentenautoren](./performance.md), [Performance Measurements](./performance-measurements.md), [Performance Regression](./performance-regression.md), [Hydration Policies](./hydration-policies.md).

Seit `WP-E13-06` ist der RC1-Watchpoint `xtend.component.hydrate` ueber `xtend.epic13.hydration-performance-closure.v1` geschlossen. Die lokale Baseline liegt bei `31ms / 32ms`, meldet `warnCount === 0` und bleibt ueber [Hydration Performance Closure](./hydration-performance-closure.md) nachvollziehbar.

## 7. A11y Baseline

XTend behandelt Accessibility als Designpflicht.

Pflichtpunkte:

- Fokus, Tastatur und Screenreader-Signale fuer interaktive Komponenten dokumentieren.
- `aria-live`, Statusregionen, Errorregionen und Announcements ueber `xtend.a11y.screenreader-signals.v1` modellieren.
- `prefers-reduced-motion` und `forced-colors` respektieren.
- Nicht nur Farbe als Statussignal verwenden.
- A11y-Arbeit darf ueber Fabric-Lane `a11y` und RMT `user-blocking` gemappt werden.

Lokale Gates:

```bash
npm run test:screenreader-signals
npm run test:motion-contrast
npm run test:a11y
```

Weiterfuehrend: [A11y Keyboard Smokes](./a11y-keyboard-smokes.md), [Screenreader Signals](./screenreader-signals.md), [Motion und Contrast](./motion-contrast.md).

## 8. CI und Release Readiness

Die CI-Matrix trennt schnelle PR-Pruefung von Release-nahem Full Gate:

| Gate | Command | Zweck |
|------|---------|-------|
| PR Fast | `npm run test:pr:report` | schnelles Feedback fuer Pull Requests |
| Full Release | `npm run test:release:full:report` | komplette lokale Runner-Suite mit JSON Report |
| Nightly | `npm run test:release:full:report` | wiederkehrender Release-naher Lauf |

Release-Kandidaten brauchen zusaetzlich:

```bash
npm run test:manifest-policy
npm run test:supply-chain
npm run test:docs-rmt-pilot
npm run test:rmt-artifact-parity
npm run release:report
npm run pack:dry-run
```

Conditional Network Gates:

```bash
npm audit --audit-level=moderate
npm sbom --sbom-format=cyclonedx --json
```

Wenn Netzwerk-Gates nicht laufen, bleibt der Kandidat ein lokaler Dry-Run. Fuer RC1-Publish-Prep sind Release Owner, License-Entscheidung, Changelog, Migration Notes und Gate-Artefakte akzeptiert; `npm publish` bleibt ein separater manueller Schritt.

Weiterfuehrend: [Release Checklist und SemVer Policy](../development/XTend-Release-Checklist-und-SemVer-Policy.md), [CI Gate Matrix](../development/XTend-CI-Gate-Matrix.md).

## 9. Epic 10 Release Handoff

Epic 10 ist seit `WP-E10-16` abgeschlossen. Der Handoff `xtend.epic10.release-handoff.v1` dokumentiert:

- TypeScript-first Component Platform
- RMT-first XTend Apps
- Existing Component Metadata Overlays
- Component Lab und RMT Inspector
- Browser-, A11y-, Performance- und Visual-Gates
- Migration Notes und Next-Wave Handoff

Die kanonische Component-Fabric-Boundary ist `adapter-injection-via-xtend-component-resolveFabricContext`.

Lokaler Gate:

```bash
npm run test:epic10-release-handoff
```

Weiterfuehrend: [Epic 10 Release Handoff](./epic10-release-handoff.md), [RMT-first XTend Apps](./rmt-first-xtend-apps.md).

## 10. Epic 11 Enterprise UX Handoff

Epic 11 ist seit `WP-E11-18` im Modus `completed-with-accepted-long-tail-handoff` abgeschlossen. Der Handoff `xtend.epic11.enterprise-ux-handoff.v1` dokumentiert:

- Component Shell, Styling, Runtime-A11y, Performance und Component Network
- RMT Shell Authoring fuer Component UX
- Component Lab UX Inspector
- Browsernahe UX-Smokes und Component Shell Theme Matrix
- Authoring Guides fuer Komponenten- und App-Autoren
- Historische Accepted Residuals fuer `xstate` und `x-utils`; `x-tabs`, `x-theme`, `x-button` und `x-menu` sind in Epic 12 geschlossen, `xstate` besitzt seit `WP-E12-08` Suite, Fixture und Types, `x-utils` besitzt seit `WP-E12-09` Utility Contract, Import Policy, Fixture und Types. Seit `WP-E13-05` sind `xstate` und `x-utils` als Boundary-Contracts geschlossen.
- Next-Wave Handoff fuer Long-Tail Runtime, visuelle Snapshot-Automation und Release Owner Acceptance

Lokaler Gate:

```bash
npm run test:epic11-enterprise-ux-handoff
```

Weiterfuehrend: [Epic 11 Enterprise UX Handoff](./epic11-enterprise-ux-handoff.md), [Component UX Gates](./component-ux-gates.md).

## 11. Epic 12 RC0 Adoption

Epic 12 fuehrt den Long-Tail- und Release-Candidate-Strang bis zu einem lokal reviewbaren `RC0`. Die offizielle Adoption-Flaeche liegt im [RC0 Adoption Guide](./rc0-adoption-guide.md) und traegt den Contract `xtend.epic12.docs-adoption.v1`.

Der RC0-Stand umfasst:

- `x-tabs`, `x-theme`, `x-button` und `x-menu` sind als sichtbare Long-Tail-Komponenten geschlossen
- `xstate` und `x-utils` bleiben als akzeptierte Boundary-Probes sichtbar
- DOM-first Visual Snapshots und Design Tokens bilden die lokale visuelle Baseline
- RMT DSL Authoring Polish macht Shells, Routes, Links, Slots, Commands, Hydration und Lanes besser authorbar
- RC0 Gate Matrix verbindet PR Fast, Full Release, Snapshot, RMT Authoring, Conditional Network, Package Dry Run und Known Residual Policy

Lokale Gates:

```bash
npm run test:epic12-docs-adoption
npm run test:rc0-gate-matrix
```

RC0 bleibt durch `private-until-release-owner-approval` blockiert. `WP-E12-16` hat daraus den finalen Owner-Handoff gebaut.

Weiterfuehrend: [RC0 Adoption Guide](./rc0-adoption-guide.md), [RC0 Gate Matrix](./rc0-gate-matrix.md).

## 12. Epic 12 RC0 Handoff

Epic 12 ist seit `WP-E12-16` abgeschlossen. Der Handoff `xtend.epic12.rc0-handoff.v1` dokumentiert:

- KPI-Abnahme und Long-Tail-Status
- DOM-first Visual Snapshot Gate und Design Token Productization
- RMT DSL Authoring Polish
- RC0 Gate Matrix und Docs Adoption
- Known Residual Policy fuer `xstate`, `x-utils` und `xtend.component.hydrate`
- Conditional Network Gates als owner-review-required
- Publish Boundary `private-until-release-owner-approval`

Lokaler Gate:

```bash
npm run test:epic12-rc0-handoff
```

Der Status ist `ready-for-release-owner-review-not-publish`. Die naechste Entscheidung ist `release-owner-acceptance`.

Weiterfuehrend: [Epic 12 RC0 Handoff](./epic12-rc0-handoff.md).

## 13. Epic 13 RC1 Readiness

Epic 13 ist seit `WP-E13-01` startbar. Der Contract `xtend.epic13.rc1-production-readiness.v1` beschreibt den Transfer von RC0 zu RC1:

- vorhandene RC0-Gates werden als Baseline uebernommen
- Release Owner Acceptance ist seit `WP-E13-02` ueber `xtend.epic13.release-owner-acceptance.v1` formalisiert
- Conditional Network Gates sind seit `WP-E13-03` ueber `xtend.epic13.conditional-network-evidence.v1` als Evidence/Deferral vorbereitet
- Package Dry Run und Export Surface sind seit `WP-E13-04` ueber `xtend.epic13.package-export-lock.v1` und `pack:dry-run:report` maschinenlesbar pruefbar
- Known Residuals sind seit `WP-E13-05` ueber `xtend.epic13.known-residual-triage.v1` und [Known Residual Triage](./known-residual-triage.md) neu bewertet: `xstate` und `x-utils` sind geschlossen
- `xtend.component.hydrate` ist seit `WP-E13-06` ueber [Hydration Performance Closure](./hydration-performance-closure.md) owner-frei geschlossen
- PROD-nahe Browser-/CSP-, Visual-, RMT- und Trusted-DOM-Pfade werden vorbereitet
- Visual Owner Artifacts sind seit `WP-E13-08` ueber `xtend.epic13.visual-owner-artifact.v1`, [Visual Owner Artifacts](./visual-owner-artifacts.md) und `optional-browser-driver-or-ci-artifact` normalisiert
- RMT-first App Readiness ist seit `WP-E13-09` ueber `xtend.epic13.rmt-production-readiness.v1`, [RMT Production Readiness](./rmt-production-readiness.md) und das statische Gate-Buendel aus Shell-first App Shell, Routing, Components, Fabric/Lanes, Lifecycle Telemetry, Diagnostics und Artifact Parity abgedeckt
- Docs-App RMT Production Hardening ist seit `WP-E13-10` ueber `xtend.epic13.docs-rmt-production-hardening.v1`, [Docs RMT Production Hardening](./docs-rmt-production-hardening.md), Extension-Slots, Parsedown-Host-Boundary, Rich-HTML-/XPlayer-Schedules und Diagnostics abgedeckt
- `automatic-publish-approval` bleibt `blocked`, bis ein spaeterer Owner-Handoff entscheidet

Lokaler Gate:

```bash
npm run test:epic13-rc1-readiness
npm run test:epic13-release-owner-acceptance
npm run test:epic13-conditional-network-evidence
npm run test:epic13-hydration-performance-closure
npm run test:epic13-visual-owner-artifact
```

Lokale Network Evidence nutzt standardmaessig `network-restricted-local-default`, bis `npm audit --audit-level=moderate` und `npm sbom --sbom-format=cyclonedx --json` in einer Netzwerk-/CI-Umgebung ausgefuehrt oder owner-akzeptiert deferred sind.

Weiterfuehrend: [RC1 Readiness](./rc1-readiness.md), [Release Owner Acceptance](./release-owner-acceptance.md), [Conditional Network Evidence](./conditional-network-evidence.md), [Package Export Lock](./package-export-lock.md), [Known Residual Triage](./known-residual-triage.md), [Visual Owner Artifacts](./visual-owner-artifacts.md), [RMT Production Readiness](./rmt-production-readiness.md) und [Docs RMT Production Hardening](./docs-rmt-production-hardening.md).

## Enterprise Adoption Checklist

| Check | Status |
|-------|--------|
| `xtend-loader.js` statt `xtend-dev.js` verwendet | Pflicht |
| lokaler Dev Server fuer Entwicklung und Tests genutzt | Pflicht |
| keine CDN-Defaults in Manifest, Demos oder Fixtures | Pflicht |
| priorisierte Komponenten mit Types und Events verwendet | Pflicht |
| Fabric Boundary und Reporter-Strategie entschieden | Pflicht |
| RMT-Adapter fuer XTend/XRouter oder Custom Host dokumentiert | Pflicht bei RMT-Nutzung |
| Manifest Import Policy und Trusted DOM Boundary verstanden | Pflicht |
| Performance-, Hydration- und Regression-Gates ausgefuehrt | Pflicht fuer Release-Kandidaten |
| A11y-, Screenreader-, Motion-/Contrast-Gates ausgefuehrt | Pflicht fuer neue UI |
| Supply-Chain- und Release-Checklist-Punkte entschieden | Pflicht fuer Release-Kandidaten |
| RC0 Adoption Guide und RC0 Gate Matrix geprueft | Pflicht fuer RC0 |
| Epic 12 RC0 Handoff geprueft | Pflicht fuer Release Owner Review |

## Bekannte Reifegrenzen

XTend ist nach `ER-WP-40`, `WP-E10-16` und `WP-E11-18` enterprise-adoptionsfaehig vorbereitet, aber noch kein finaler `1.0.0`-Release:

- `private: false` ist fuer RC1-Publish-Prep aktiv.
- Component Catalog Coverage steht nach `RC1TB-WP-03` bei 44/44 Source und Docs, 44/44 Component-Suites, Fixtures und Types, 43/44 A11y sowie 42 expliziten Runtime-/UI-Performance-Profilen. `x-input`, `x-select`, `x-checkbox`, `x-radio`, `x-rmt-lifecycle-demo-build`, `x-textarea`, `x-form`, `x-calendar`, `x-writer`, `x-status`, `x-progress`, `x-tooltip`, `x-popover`, `x-drawer`, `x-surface-manager`, `x-surface-portal`, `x-surface-region`, `x-surface-window`, `x-side-panel`, `x-modal`, `x-dialog`, `x-alert`, `x-toast`, `x-spinner`, `x-router`, `x-link`, `x-tabs`, `x-theme`, `x-button`, `x-icon`, `x-menu`, `x-footer`, `x-lightbox`, `x-masonry`, `x-code`, `x-header`, `x-hero`, `x-type`, `x-summary`, `x-section`, `x-cards` und `x-player` sind `enterprise-ready`; `xstate` ist seit `WP-E13-05` als Runtime-Boundary geschlossen; `x-utils` ist seit `WP-E13-05` als Utility-Boundary geschlossen. `x-icon` stellt den lokalen, CDN-freien Iconography Adapter mit internem Core Pack, lokalem Lucide Superset und RMT-kompatibler Pack-Schnittstelle bereit; `x-surface-manager`, `x-surface-portal`, `x-surface-region`, `x-surface-window` und `x-side-panel` bilden die native Multi-Window-, Portal-, Region- und SidePanel-Surface-Schicht.
- Performance-Profile sind fuer alle sichtbaren Runtime-/UI-Komponenten priorisiert und vorhanden; Infrastruktur-/Utility-Pfade werden ueber Boundary-Contracts bewertet.
- Netzwerkbasierte Supply-Chain-Gates sind Conditional Gates.
- `WP-E12-15` aktualisiert die oeffentliche Adoption-Flaeche: Long-Tail Closure, DOM-first Snapshot Gate, Design Token Productization, RMT DSL Authoring Polish, Known Residual Policy und RC0 Gate Matrix sind in `docs/rc0-adoption-guide.md` zusammengefuehrt.
- Die Docs-App nutzt weiterhin Parsedown als Parser-Host; `ER-WP-40` beschreibt und nutzt die RMT-Shell-first-Shell `docs.app.shell`, `docs.header.search`, Scheduling, Routen, Templates, Rich-Content-Slots und Diagnostics in `docs/xtendrmt-parsedown-docs.rmt`.

## Handoff

`ER-WP-39` ist abgeschlossen: Dieser Guide, `docs/menu.json`, `docs/README.md`, `README.md`, `CHANGELOG.md`, `package.json`, die Roadmap und das Reference-Gate beschreiben denselben Enterprise-Adoption-Contract.

`ER-WP-40` ist ebenfalls abgeschlossen: `xtend.docs.parsedown-rmt-pilot.v1`, `docs.app.shell`, `docs.header.search`, `docs.media.lazy`, `xtend.docsRmtPilot` und `npm run test:docs-rmt-pilot` finalisieren den Shell-first Docs-App RMT Parsedown Scheduling Pilot. Der naechste sinnvolle Schritt ist ein Produktreife-Checkpoint fuer Release-, Catalog- oder XTendRMT-Upstream-Entscheidungen.

`WP-E10-16` ist abgeschlossen: `xtend.epic10.release-handoff.v1`, `docs/epic10-release-handoff.md`, `docs/rmt-first-xtend-apps.md`, `catalog/epic10-release-handoff.js` und `npm run test:epic10-release-handoff` finalisieren den Epic-10-Abschluss ohne Publish-Freigabe.

`WP-E11-18` ist abgeschlossen: `xtend.epic11.enterprise-ux-handoff.v1`, `docs/epic11-enterprise-ux-handoff.md`, `catalog/epic11-enterprise-ux-handoff.js` und `npm run test:epic11-enterprise-ux-handoff` finalisieren den Epic-11-Abschluss mit explizitem Long-Tail-Handoff.

`WP-E12-15` ist abgeschlossen: `xtend.epic12.docs-adoption.v1`, `docs/rc0-adoption-guide.md`, `development/XTend-Epic12-Docs-Migration-und-Adoption-Guide.md`, `catalog/epic12-docs-adoption.js` und `npm run test:epic12-docs-adoption` finalisieren Docs, Migration Notes und Enterprise Adoption fuer den RC0-Schnitt.

`WP-E12-16` ist abgeschlossen: `xtend.epic12.rc0-handoff.v1`, `docs/epic12-rc0-handoff.md`, `development/XTend-Epic12-Abschluss-und-RC0-Handoff.md`, `catalog/epic12-rc0-handoff.js` und `npm run test:epic12-rc0-handoff` finalisieren Epic 12 als `ready-for-release-owner-review-not-publish`.
