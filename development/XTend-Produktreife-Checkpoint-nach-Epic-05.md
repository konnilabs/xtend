# XTend Produktreife-Checkpoint nach Epic 05

- Status: Reifegradbericht nach Abschluss der ersten fuenf Epics
- Datum: 5. Mai 2026
- Contract: `xtend.product-maturity.checkpoint.epic05.v1`
- Bewertungsstand: XTend Core + XTend-Scaffold + XTendRMT Bridge nach Epic 05
- Quellen:
  - `development/WP-14-Epic-Abschlussreview-und-KPI-Abnahme.md`
  - `development/WP-E02-14-Epic-Abschlussreview-und-KPI-Abnahme.md`
  - `development/WP-E03-12-Epic-Abschlussreview-und-KPI-Abnahme.md`
  - `development/WP-E04-12-Epic-Abschlussreview-und-KPI-Abnahme.md`
  - `development/WP-E05-18-Epic-Abschlussreview-und-KPI-Abnahme.md`
  - `docs/README.md`
  - `docs/xtendrmt-overview.md`
  - `docs/xtendrmt-app-dsl.md`
  - `docs/xtendrmt-runtime-bridge.md`
  - `components/manifest.json`
  - `tests/README.md`
  - `package.json`

## Executive Summary

XTend hat nach fuenf abgeschlossenen Epics einen belastbaren Framework-Kern erreicht. Loader, Manifest, `xstate`, Router, Theme, API-Fassade, Overlay-/Feedback-Fluesse, Dokumentation, lokale Test-Suite, Scaffold-Dry-Run und XTendRMT-Bridge sind dokumentiert, testbar und ueber wiederholbare Gates abgesichert.

Der aktuelle Reifegrad ist am besten als **produktreifer Framework-Kern mit Beta-/Pre-Enterprise-Reife** zu beschreiben. XTend ist fuer kontrollierte Produktentwicklung, interne Apps, Demos, Proof-of-Concepts und gezielte Web-Component-Modernisierung bereits gut tragfaehig. Fuer Enterprise-Grade Adoption fehlen jedoch noch Breitenhaertung, Distribution, CI/CD, Security-/Observability-Standards, echte Cross-Browser-Automation und eine vollstaendige Component-Catalog-Abdeckung.

Bewertung: **6.8 / 10 Enterprise-Reife**.

Das ist keine schwache Note. Die Architektur ist weiter als viele fruehe Frameworks: Der technische Kern hat gute Leitplanken gegen Technical Debt. Die fehlenden Punkte liegen vor allem in Produktisierung, Breite und Betrieb.

## Fortschreibung nach ER-WP-31

Die nachgelagerte Enterprise-Reife-Strecke hat den Checkpoint inzwischen operativ weitergefuehrt. Mit `ER-WP-31` liegt `development/XTend-Component-Catalog-Coverage-Matrix.md` als gatebarer Source-of-Truth fuer den Component Catalog vor. Der lokale Gate `npm run test:catalog-coverage` bewertet alle `28` Manifest-Komponenten nach Source, Docs, Component-Suite, Fixture, Types, A11y und Performance und uebergibt die offenen Luecken gezielt an `ER-WP-32`, `ER-WP-33`, `ER-WP-34` und `ER-WP-35`.

Der urspruengliche Reifegrad bleibt als Epic-05-Snapshot erhalten; die Matrix ersetzt jedoch die fruehere qualitative Catalog-Einschaetzung durch einen maschinenlesbaren Folgereport.

## Fortschreibung nach ER-WP-32

`ER-WP-32` hat die Docs-/Naming-Luecken aus der Matrix geschlossen. `development/XTend-Component-Catalog-Naming-Konvention.md` traegt `xtend.catalog.naming-convention.v1`, `docs/components/xsummary.md` dokumentiert `x-summary` und `docs/components/xutils.md` dokumentiert `x-utils`. Die Docs-Dimension steht damit bei `28/28`; die verbleibende Catalog-Reife liegt in Component-Level-Suites, Fixtures, Types und Performance-Profilen.

## Fortschreibung nach ER-WP-33

`ER-WP-33` hat die priorisierten Component-Level-Suites und Fixtures nachgezogen. `tests/components/component_suite.js` aggregiert nun `18` Component-Level-Suites; `componentSuite` und `fixture` stehen in der Coverage Matrix bei `18/28`. `x-router` ist `typed-contract-gated`, die weiteren priorisierten P0/P1-Komponenten sind `contract-gated`. Die verbleibende Catalog-Reife liegt nun vor allem in Public Types/Event Contracts (`ER-WP-34`) sowie Long-Tail-, Browser- und Performance-Regression (`ER-WP-35`).

## Fortschreibung nach ER-WP-34

`ER-WP-34` hat Public Types und Event Contracts fuer die 18 priorisierten Oberflaechen nachgezogen. `components/xtend-public-types.d.ts` stellt den gemeinsamen Contract `xtend.enterprise.er-wp-34.public-component-types.v1`; die Komponenten-`.d.ts` Dateien typisieren Attribute, Methoden, Eventnamen, `CustomEvent` Detail-Payloads und Element-/Window-Mappings. Die Coverage Matrix steht nun bei `18/28` Types. 16 Komponenten sind `typed-contract-gated`; `x-theme` und `x-writer` bleiben wegen A11y-Nacharbeit `contract-gated`.

## Fortschreibung nach ER-WP-35

`ER-WP-35` hat die offenen Catalog-Risiken in den Regression-Priority-Plan `xtend.catalog.component-regression-priority-plan.v1` ueberfuehrt. `catalog/component-regression-priority.js` plant fuer alle 28 Manifest-Komponenten `desktop-1280`, `mobile-390`, `light`, `dark`, `forced-colors`, `reduced-motion`, profilbasierte Browser-Smokes und Performance-Profil-Ableitung. Damit ist die Luecke nicht geschlossen, aber fuer CI und Release Readiness konkret geschnitten.

## Fortschreibung nach WP-E10-11

Epic 10 hat mit `WP-E10-09`, `WP-E10-10` und `WP-E10-11` die erste TypeScript-first Komponentenlinie umgesetzt. `x-select`, `x-checkbox`, `x-radio`, `x-textarea`, `x-status`, `x-progress`, `x-tooltip`, `x-popover` und `x-drawer` sind im Manifest, besitzen Runtime, TypeScript Source, Public Types, Docs, Fixtures, Component-Suites, A11y-Profile und explizite Performance-Profile. Die Catalog Coverage steht damit bei `37/37` Source und Docs, `27/37` Component-Suites, Fixtures und Types, `33/37` A11y-Erkennung sowie `9/37` expliziten Performance-Profilen. Diese neun Controls sind die erste `enterprise-ready` Referenzlinie.

## Fortschreibung nach WP-E11-08

`WP-E11-08` hebt die Form-Control-Familie in die Epic-11-UX-Reife. `x-input`, `x-form`, `x-calendar` und `x-writer` besitzen nun ebenfalls Form-Control-UX-Profil, RMT/Fabric/A11y/Performance-Metadaten, stabilisierte Events und Public Types. Die Catalog Coverage steht damit weiter bei `37/37` Source und Docs sowie `27/37` Component-Suites, Fixtures und Types, steigt aber auf `34/37` A11y-Erkennung und `13/37` explizite Performance-Profile.

## Fortschreibung nach WP-E11-10

`WP-E11-10` hebt nach Feedback/Status nun auch Navigation und Routing in dieselbe Epic-11-UX-Reife. `x-router` und `x-link` besitzen Navigation-Routing-UX-Profil, RMT/Fabric/A11y/Performance-Metadaten, Active State, Focus Restore, Route Announcements, Keyboard Navigation und Public Types. Die Catalog Coverage steht damit weiter bei `37/37` Source und Docs sowie `27/37` Component-Suites, Fixtures und Types, bleibt bei `34/37` A11y-Erkennung und steigt auf `18/37` explizite Performance-Profile.

## Fortschreibung nach WP-E11-12

`WP-E11-12` hebt Layout-, Display- und Media-Komponenten in dieselbe Epic-11-UX-Reife. `x-section`, `x-cards`, `x-header`, `x-footer`, `x-hero`, `x-type`, `x-code`, `x-masonry`, `x-summary`, `x-player` und `x-lightbox` besitzen nun Shell-first Layout/Display/Media-Profile, RMT/Fabric/A11y/Performance-Metadaten, CSS Parts, Snapshots, Public Types, Fixtures und Component-Level-Suites. Mit `WP-E12-02` ist zusaetzlich `x-tabs` performance-seitig geschlossen; `WP-E12-03` haertet `x-tabs` in Browser-Smoke und Theme-Matrix; `WP-E12-04` schliesst `x-theme` A11y, Reduced Motion und Forced Colors; `WP-E12-05` schliesst `x-theme` Performance, Theme Propagation und Density Boundary; `WP-E12-06` schliesst `x-button` Performance und Interaction Budget; `WP-E12-07` schliesst `x-menu` Performance, Keyboard Navigation und Router-Kompatibilitaet; `WP-E12-08` hebt `xstate` als nicht-visuelle Boundary-Probe mit Suite, Fixture, Public Types, Lifecycle Events, Fabric Diagnostics und RMT State Adapter auf `contract-gated`; `WP-E12-09` hebt `x-utils` als Utility-Boundary mit Utility Contract, Import Policy, Fixture und Public Types auf `typed-contract-gated`; `WP-E13-12A` ergaenzt `x-icon` als lokalen, CDN-freien Iconography Adapter mit Core Pack, Lucide Superset, Pack Registry, Public Types, Docs, Suite, Fixture, A11y und Performance-Profil; `WP-SM-03` ergaenzt `x-surface-manager` und `x-surface-window` als native Multi-Window-Surface-Komponenten; `WP-SM-04` ergaenzt `x-side-panel` mit Docked/Pinned/Overlay/Collapsed Modes. Die Catalog Coverage steht damit bei `41/41` Source und Docs, `41/41` Component-Suites, Fixtures und Types, `40/41` A11y-Erkennung und `39/41` expliziten Performance-Profilen.

## Reifegrad nach Dimension

| Dimension | Reife | Bewertung | Begruendung |
|-----------|-------|------------|-------------|
| Core Architecture | hoch | 8/10 | Core-Contracts, Digital Twin Principle, `xstate`, API, Router, Theme und Overlays sind konsolidiert und architecture-gated. |
| Test- und Qualitaetsbarrieren | mittel-hoch | 7/10 | Lokaler Runner, JSON-Reports, Core-, Architecture-, Component-, A11y-, Reference-, Browser- und RMT-Gates bestehen. Breite Component-Abdeckung und echte Browser-Automation fehlen noch. |
| Component Catalog | hoch | 9.2/10 | `components/manifest.json` fuehrt `37` Eintraege. Component-Level-Suites, Fixtures und Public Types existieren fuer `35` Komponenten. Form, Feedback, Navigation, Overlay, `x-theme`, `x-button`, `x-menu` sowie Layout/Display/Media bilden eine breite `enterprise-ready` Linie mit `35` expliziten Performance-Profilen; offen bleiben die Boundary-Probes fuer `xstate` und `x-utils`. |
| Developer Experience | mittel-hoch | 7/10 | XTend-Scaffold erzeugt Dry-Run-Artefakte fuer Component, Docs, Tests, Fixtures, Types, Manifest und Demo. Produktive Write-Modi und Konfliktstrategie fehlen bewusst noch. |
| Dokumentation | mittel-hoch | 7/10 | Docs-App, Component-Doku, Core-Migration, RMT-Guides und neue XTendRMT-Entwicklerdocs sind vorhanden. Vollstaendige API-Referenz, Tutorials und Enterprise-Guides fehlen noch. |
| XTendRMT Integration | hoch fuer aktuellen Scope | 8/10 | Native `adapters`, `components`, `routes`, `schedules`, Runtime Registry, XRouter Adapter, XTend Component Adapter und Bridge sind getestet. DSL-Ergonomie und weitere Host-Adapter fehlen. |
| Packaging und Distribution | niedrig-mittel | 4/10 | `package.json` ist `private`, es gibt keine sichtbare `main`/`module`/`exports`-Strategie und keine Release-/SemVer-Automation. Manifest verweist weiter auf CDN-Pfade. |
| Enterprise Operations | niedrig-mittel | 4/10 | CI ist vorbereitet, aber kein aktiver Workflow im Repository sichtbar. Security, telemetry, observability, support matrix und release artifacts sind noch nicht produktisiert. |

## Erreichte Staerken

### 1. Solider Framework-Kern

Epic 01 hat den priorisierten Core stabilisiert:

- Manifest- und Loader-Contract sind dokumentiert.
- `xstate` ist als zentraler UI-State-Baustein etabliert.
- API-nahe Komponenten nutzen konsolidierte State-/Event-Contracts.
- Router, Theme, Dialog, Modal, Toast und Alert sind als Kernpfade gehaertet.
- Compliance, Runtime und Doku beschreiben denselben Zielvertrag.

Das ist eine echte Produktbasis. Besonders wertvoll ist, dass der Core nicht nur "funktioniert", sondern eine Architekturhaltung besitzt: SSOT, Digital Twin und kanonische State Keys.

### 2. Test-Suite als Qualitaetsprodukt

Epic 02 hat aus einem Core-Verify-Pfad eine strukturierte Testlandschaft gemacht:

- `core`
- `architecture`
- `components`
- `a11y-hydration`
- `references`
- `rmt-compatibility`
- `browser`

Der Runner kann JSON-Reports erzeugen und ist ueber NPM-Scripts ansprechbar. Das Projekt hat damit einen lokalen Qualitaetskern, der fuer Menschen und AI-Agenten nutzbar ist.

Der groesste Wert liegt in den Architecture- und Reference-Gates: Sie pruefen nicht nur Code, sondern verhindern, dass Doku, Demo, Runtime und Contracts auseinanderlaufen.

### 3. Scaffold als Standardisierungsschicht

Epic 03 hat mit `XTend-Scaffold` einen guten Ausgangspunkt fuer skalierbare Komponentenarbeit geschaffen:

- Dry-Run-first
- keine produktiven Schreibpfade ohne spaetere Review-Strategie
- Blueprint, Generator Registry und Template Registry
- Pflichtartefakte fuer Component, Docs, Tests, Fixtures, Types, Manifest und Demo
- Typing-, Preview-, Extension- und Workflow-Contracts

Das reduziert kuenftige Technical Debt deutlich. Der Scaffold ist noch kein vollstaendiger Generator fuer produktive Writes, aber als Contract- und Planungswerkzeug stark.

### 4. XTendRMT als differenzierendes Produktmerkmal

Epic 04 und Epic 05 haben XTend deutlich ueber ein klassisches Web-Component-Kit hinausgehoben:

- RMT ist kanonischer Templating- und Scheduling-Pfad.
- XTend UI bleibt First-Class Host, aber nicht Pflicht-Host.
- XRouter Routes koennen nativ in `.rmt` beschrieben und produktiv ueber Adapter registriert werden.
- XTend Components koennen als native RMT Components gemappt, gemountet und hydriert werden.
- Scheduler-, State- und Diagnostics-Arbeit laeuft ueber eine Bridge, nicht ueber Kernel-Sonderfaelle.
- `vanilla.component` belegt framework-agnostische Host-Erweiterbarkeit.

Das ist strategisch stark. Die Verbindung aus Web Components und schedulerfaehiger App-DSL ist ein echtes Produktprofil.

## Gemessener Iststand

| Bereich | Iststand |
|---------|----------|
| abgeschlossene Epics | `5` von `5` |
| abgeschlossene Epic-05-Workpackages | `18` von `18` |
| Manifest-Eintraege | `37` |
| Custom-Element-nahe Manifest-Eintraege | `36` |
| Component-Level-Suites | `35` von `37` Manifest-Eintraegen |
| priorisierte Runner-Suites | `7` |
| XTendRMT produktive Factories | `createRmtFormat`, `createRmtXRouterAdapter`, `createRmtXtendComponentAdapter`, `createRmtStateSchedulerDiagnosticsBridge` |
| XTendRMT Regressionen | native Bridge Fixture, Browser Smoke Fixture, Artifact-Parity-Gate |
| aktive CI-Workflow-Dateien im Workspace | keine sichtbar |
| Packaging-Status | `private: true`, keine sichtbare Package-Export-Strategie |

## Enterprise-Grade Blind Spots

### P0 - Component Catalog Breitenhaertung

Der groesste funktionale Reife-Gap liegt weiterhin im Komponenten-Katalog, hat sich nach `WP-E12-09` aber weiter verkleinert: Form Controls, Feedback/Status, Navigation/Routing, Overlay/Interaction, Layout/Display/Media, `x-tabs`, `x-theme`, `x-button` sowie `x-menu` sind enterprise-ready; `x-tabs` besitzt zusaetzlich explizite Keyboard-, ARIA- und Theme-Matrix-Abdeckung. `x-theme` ist A11y-, Reduced-Motion-, Forced-Colors-, Performance-, Density- und Theme-Propagation-seitig gehaertet. `x-button` ist Performance-, Interaction-Budget-, Fabric-Measurement- und RMT-seitig gehaertet. `x-menu` ist Performance-, Keyboard-, Routing-, Fabric-Measurement- und RMT-seitig gehaertet. `xstate` ist als Infrastruktur-Boundary typisiert, testbar und RMT-adapterfaehig, bleibt aber wegen A11y-/Performance-Profilentscheidungen `contract-gated`. `x-utils` ist als Utility-Boundary typisiert, testbar und import-policy-sicher, bleibt aber wegen der Performance-Boundary-Entscheidung `typed-contract-gated`. Diese Restluecken sind ueber `xtend.catalog.component-regression-priority-plan.v1` priorisiert und muessen in CI-/Release-Gates produktisiert werden.

Offen:

- Long-Tail-Suites fuer P2-, Utility- und Infrastrukturpfade priorisieren
- browsernahe Regression fuer interaktive, formnahe, routingnahe und media-nahe Komponenten erweitern
- Accessibility-/Hydration-Abdeckung fuer die verbleibenden Infrastruktur-Boundaries, insbesondere `xstate`
- Type Definitions fuer Long-Tail-, Utility- und Infrastrukturpfade nach Bedarf priorisieren
- Component-Catalog-Naming-Konvention in neuen Scaffold-Pfaden durchsetzen; `x-summary`, `x-utils`, `xstate` und `x-theme` sind seit `ER-WP-32` dokumentiert. `x-theme` ist der einzige Theme-Pfad.

Enterprise-Risiko: Komponenten koennen in realen Apps uneinheitlich reagieren, obwohl Core-Gates gruen sind.

### P0 - Distribution, Versionierung und Release Engineering

XTend ist noch nicht als konsumierbares Enterprise-Package ausmodelliert. `package.json` ist privat und beschreibt Test-/Scaffold-Scripts, aber keine offizielle Library-Distribution.

Offen:

- Package-Exports fuer Core, einzelne Komponenten, Loader, Scaffold und XTendRMT
- ESM-/Browser-Bundle-Strategie fuer XTend selbst, analog zu XTendRMT
- SemVer- und Changelog-Prozess
- Release-Artefakte, Checksums und Provenance
- CDN-Strategie vs. lokale Bundle-Strategie
- Migration Policies fuer Breaking Changes

Enterprise-Risiko: Adoption bleibt demo- oder repo-nah, weil es keinen stabilen Konsum- und Upgrade-Pfad gibt.

### P0 - Aktive CI/CD und Release Gates

Die Test-Suite ist CI-faehig vorbereitet, aber kein aktiver Workflow ist sichtbar. Damit ist Qualitaet lokal sehr gut, organisatorisch aber noch nicht verpflichtend.

Offen:

- GitHub Actions oder vergleichbarer Workflow fuer `npm test`
- Artefakt-Upload fuer JSON-Reports
- getrennte schnelle PR-Gates und volle Release-Gates
- Node-Version-Matrix
- optionaler echter Browser-Gate fuer Chromium/WebKit/Firefox
- Branch Protection Policy

Enterprise-Risiko: Gates koennen umgangen werden oder laufen je nach Entwicklerumgebung unterschiedlich.

### P1 - Echte Browser- und Accessibility-Automation

Der Default-Browser-Harness ist deterministisch und stabil, prueft aber ueber Fixture-/Source-Contracts statt vollwertiger Browser-Automation. Safari-WebDriver ist bewusst optional.

Offen:

- Playwright- oder WebDriver-basierte echte Browser-Smokes
- Chromium, Firefox, WebKit Matrix
- visuelle Regression fuer Kernkomponenten
- Tastatur- und Fokus-Flows in echter DOM-Ausfuehrung
- axe- oder vergleichbare Accessibility-Automation
- Mobile Viewport- und Touch-Interaktionspfade

Enterprise-Risiko: UI-Probleme treten erst in echten Browsern, Devices oder Assistive-Tech-Kontexten auf.

### P1 - Security und Trust Boundary

XTend verarbeitet dynamisches Markdown in der Docs-App, Custom Elements, Manifest-URLs, RMT-Dokumente und Template-Markup. Es gibt gute Boundary-Dokumentation, aber noch kein vollstaendiges Security-Modell.

Offen:

- Security ADR fuer Manifest Loading, Template Rendering, Markdown/HTML, Events und Adapters
- CSP-Strategie fuer Produktapps und Docs-App
- Trusted Types oder vergleichbare DOM-Sink-Policy
- XSS-/HTML-Sanitizing-Kontrakte fuer RMT `html_fragment` und Parsedown-Ausgabe
- Supply-Chain-Policy fuer CDN und lokale Artefakte
- Dependency-/License-/Vulnerability-Checks

Enterprise-Risiko: RMT-Templating und Markdown-Rendering koennen spaeter Sicherheitsluecken bekommen, wenn sie nur funktional betrachtet werden.

### P1 - Observability, Diagnostics und Runtime Betrieb

XTendRMT hat Diagnostics- und Bridge-Contracts. XTend Core selbst hat aber noch keine enterpriseweite Observability-Schicht.

Offen:

- einheitliche Diagnostic Event Taxonomie fuer XTend Core
- Log-Level und Debug-Modi
- Performance Marks und Web Vitals Anschluss
- Error Boundary und Error Reporting fuer Komponenten
- Health-/Readiness-Signale fuer App-Roots
- Integrationspunkte fuer Monitoring-Systeme

Enterprise-Risiko: Fehler in grossen Apps sind schwer analysierbar, obwohl lokale Contract-Tests bestehen.

### P1 - Form-, Data- und Resource-Lifecycle

XTend besitzt `x-form`, `x-input`, `x-calendar`, Router und State. Was fuer Enterprise-Apps noch fehlt, ist ein standardisierter Daten- und Formular-Lifecycle.

Offen:

- Validierungsmodell fuer Forms
- Field-State, Error-State und Touched/Dirty-Konventionen
- async Submit, Loading, Abort und Retry
- Data Fetching / Resource Cache / stale state
- Error- und Empty-State-Komponenten
- RMT-Schedules fuer Data Loading und Route Data

Enterprise-Risiko: Geschaeftsanwendungen bauen wieder eigene Mini-Frameworks um XTend herum.

### P1 - XTendRMT Upstream-Produktisierung

Epic 05 sichert die Build-Artefaktversion und produktive Adapter-Factories. Gleichzeitig bleibt dokumentiert, dass upstream RMT Source dauerhaft als Architekturquelle ausgebaut werden soll.

Offen:

- echte upstream Source-Struktur als generierbarer Produktpfad
- Build-Pipeline statt bewusst synchronisierter Artefakte
- DSL-Ergonomie fuer `component_ref`, named slots, event shorthand und route/component shorthands
- React- und Vue-Adapter-Smokes
- Docs-App Parsedown Adapter als erstes nicht-UI Scheduling-Beispiel
- RMT-Tutorials jenseits der Bestcase-Demo

Enterprise-Risiko: XTendRMT bleibt funktional stark, aber schwer zu authoren oder schwer reproduzierbar zu releasen.

### P2 - Internationalisierung und Lokalisierung

Im aktuellen Scope ist kein explizites i18n-Modell sichtbar.

Offen:

- Locale State
- Uebersetzungsressourcen
- Datums-/Zahlenformatierung
- Directionality, z.B. RTL
- komponentenweite Label-/ARIA-Lokalisierung

Enterprise-Risiko: internationale Produktapps muessen i18n selbst loesen.

### P2 - Design System und Theming-Tiefe

Theme-Tokens und `xtheme` sind vorhanden. Fuer Enterprise Design Systems fehlen aber noch Governance und Token-Tiefe.

Offen:

- Token-Hierarchie fuer semantic, component und state tokens
- Design-System-Versionierung
- Theme Package Export
- Dark/Light/High-Contrast Policies
- Figma-/Design-Handoff-Anschluss
- visuelle Regression pro Theme

Enterprise-Risiko: Teams koennen XTend optisch uneinheitlich verwenden.

### P2 - Documentation als Produkt

Die Docs-App ist ein gutes Referenzbeispiel, aber noch keine voll produktisierte Developer Experience.

Offen:

- Getting Started Tutorial von Null bis App
- Enterprise App Blueprint
- API-Referenz nach Component/Attribute/Event/State
- Copy-paste-fertige Recipes
- Upgrade Guides pro Release
- Docs-App Build/Deploy-Story ohne lokale PHP-Annahme
- Parsedown/RMT Scheduling als pruefbarer Pilot

Enterprise-Risiko: Adoption haengt zu stark an Projektwissen statt an selbsttragender Dokumentation.

## Reife nach Einsatzszenario

| Szenario | Reife | Empfehlung |
|----------|-------|------------|
| interne Demos und Bestcase Apps | hoch | gut geeignet |
| kontrollierte interne Web Apps | mittel-hoch | geeignet mit bewusstem Komponenten-Review |
| neue XTend-Komponentenentwicklung | mittel-hoch | Scaffold und Testpflicht nutzen, aber Write-Modus fehlt |
| grosse Enterprise SPA | mittel | Core ist stark, aber Component-, CI-, Security- und Observability-Gaps vorher schliessen |
| Framework fuer externe Distribution | niedrig-mittel | Packaging, Versionierung, Release- und Supportmodell priorisieren |
| Multi-Framework-Orchestrierung mit RMT | mittel | Architektur bereit, React/Vue-Smokes und Authoring-Ergonomie fehlen |

## Priorisierte Folge-Epics

### EPIC 06 - Enterprise Hardening und Release Readiness

Ziel: XTend als konsumierbares, versioniertes Framework paketieren.

Workstreams:

- Package Export Strategy
- SemVer, Changelog, Release Notes
- aktive CI Workflows
- Node-/Browser-Matrix
- Security Baseline
- CDN-vs-local Distribution
- Release Artifact Verification

### EPIC 07 - Component Catalog Completion

Ziel: den Komponenten-Katalog auf denselben Standard wie `x-alert`, `x-toast` und `x-modal` bringen.

Workstreams:

- Profile fuer alle Manifest-Komponenten festlegen
- Component-Level-Suites und Fixtures ausbauen
- Typdefinitionen fuer oeffentliche APIs
- Accessibility- und Hydration-Gates verbreitern
- Doku-Naming-Konvention halten und neue Komponenten ueber Scaffold/Reference-Gates erzwingen

### EPIC 08 - Enterprise App Patterns

Ziel: typische Business-App-Flows als First-Class Patterns bereitstellen.

Workstreams:

- Forms und Validation
- Data Loading und Resource Lifecycle
- Error/Empty/Loading State
- Route Data und Guards
- i18n Baseline
- App Shell Blueprint

### EPIC 09 - Observability, Security und Runtime Governance

Ziel: Betrieb, Debugging und Trust Boundaries produktisieren.

Workstreams:

- Diagnostic Event Taxonomie
- Error Boundary und Reporting
- Performance Instrumentation
- Security ADR fuer Manifest/RMT/Markdown/HTML
- CSP/Trusted Types/Sanitizing-Kontrakte
- Audit- und Compliance-Checks

### EPIC 10 - XTendRMT Upstream und Multi-Host Ausbau

Ziel: XTendRMT von synchronisierter Artefaktversion zu dauerhaft generierbarem, host-neutralem Produktpfad entwickeln.

Workstreams:

- upstream Source-Struktur und Build-Pipeline
- React/Vue Adapter-Smokes
- Parsedown Docs-App Adapter
- DSL-Shorthands und Authoring-Ergonomie
- RMT Tutorials und Recipes
- Multi-Host Performance Budgets

## Entscheidung

XTend ist nach Epic 05 kein reines Experiment mehr. Das Projekt besitzt einen geordneten Core, eine testbare Architektur, einen standardisierten Scaffold, eine dokumentierte Docs-App und mit XTendRMT ein differenzierendes Runtime-/Scheduling-Konzept.

Fuer Enterprise Grade fehlt weniger eine einzelne grosse Kernfunktion als vielmehr die **Produktisierungsschicht**: vollstaendige Komponentenbreite, Distribution, CI, Security, Observability, echte Browser-Automation und Enterprise-App-Patterns.

Die naechste sinnvolle Phase sollte deshalb nicht sofort neue UI-Komponenten stapeln, sondern XTend als Produkt haerten: Release Readiness, Component Catalog Completion und Enterprise Runtime Governance. Danach kann XTend plausibel als Enterprise Web Component Framework positioniert werden.
