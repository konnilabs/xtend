# Roadmap XTend Enterprise-Reife

- Status: Ready
- Datum: 5. Mai 2026
- Contract: `xtend.enterprise-readiness.roadmap.v1`
- Quelle: `development/XTend-Enterprise-Reife-Implementierungsplan.md`
- Bezug:
  - `development/XTend-Produktreife-Checkpoint-nach-Epic-05.md`
  - `development/XTend-Enterprise-Reife-Implementierungsplan.md`
  - `development/ADR-XTend-Loader-und-Lokale-Entwicklung.md`
  - `development/ER-WP-01-Loader-Contract-und-Rename-ADR-fuer-xtend-loader-js.md`
  - `development/ER-WP-02-xtend-loader-js-als-kanonischen-ESM-Loader-einfuehren.md`
  - `development/ER-WP-03-CDN-Fallbacks-aus-Core-Pfaden-entfernen.md`
  - `development/ER-WP-04-Lokalen-Dev-Test-Server-produktisieren.md`
  - `development/ER-WP-05-Demo-und-Fixture-Pfade-auf-neuen-Loader-migrieren.md`
  - `development/XTend-Package-Export-und-Release-Strategie.md`
  - `development/ER-WP-06-Package-Export-und-Release-Strategie-festlegen.md`
  - `development/ADR-XTend-Fabric.md`
  - `development/ER-WP-07-XTend-Fabric-ADR-und-API-Surface-definieren.md`
  - `development/ER-WP-08-Fabric-Runtime-Skeleton-implementieren.md`
  - `development/XTend-Component-Lifecycle-Error-Boundary.md`
  - `development/ER-WP-09-Component-Lifecycle-Error-Boundary-einfuehren.md`
  - `development/XTend-Fabric-Reporter-Adapter-Contract.md`
  - `development/ER-WP-10-Reporter-Adapter-Contract-vorbereiten.md`
  - `development/XTend-Fabric-Runtime-Diagnostics-Bridge.md`
  - `development/ER-WP-11-Fabric-an-xstate-API-und-XTendRMT-Diagnostics-anbinden.md`
  - `development/XTend-Telemetry-Snapshot-und-Backpressure-Contract.md`
  - `development/ER-WP-16-Telemetry-Snapshots-und-Backpressure-Signale-integrieren.md`
  - `development/XTend-Fiber-und-Lane-Contract.md`
  - `development/ER-WP-12-Fiber-und-Lane-Contract-spezifizieren.md`
  - `development/XTend-Fabric-RMT-Lane-Mapping.md`
  - `development/ER-WP-13-Lane-Mapping-auf-RMT-Schedules-definieren.md`
  - `development/XTend-Component-Fiber-Instrumentierung.md`
  - `development/ER-WP-14-Component-Mount-Hydration-als-Fibers-instrumentieren.md`
  - `development/XTend-Performance-Budget-Matrix.md`
  - `development/ER-WP-17-Performance-Budget-Matrix-fuer-Component-Profile-erstellen.md`
  - `docs/performance.md`
  - `development/ER-WP-21-Performance-Doku-fuer-Komponentenautoren-schreiben.md`
  - `development/XTend-A11y-Component-Contract.md`
  - `development/ER-WP-22-A11y-Component-Contract-1-0-definieren.md`
  - `development/XTend-Scaffold-A11y-Profile-Plan.md`
  - `development/ER-WP-23-Scaffold-Blueprints-um-A11y-Pflichten-erweitern.md`
  - `development/XTend-Screenreader-Signal-Contract.md`
  - `development/ER-WP-25-Screenreader-Signal-Contracts-einfuehren.md`
  - `a11y/screenreader-signals.js`
  - `tests/a11y/screenreader_signal_suite.js`
  - `docs/screenreader-signals.md`
  - `development/XTend-Motion-und-Contrast-Policy.md`
  - `development/ER-WP-26-Reduced-Motion-und-High-Contrast-Regeln-gatebar-machen.md`
  - `a11y/motion-contrast-policy.js`
  - `tests/a11y/motion_contrast_suite.js`
  - `docs/motion-contrast.md`
  - `development/ADR-XTend-Security-Trust-Boundaries.md`
  - `development/ER-WP-27-Security-ADR-fuer-Loader-Manifest-Templates-und-Events-schreiben.md`
  - `development/XTend-Trusted-DOM-und-Sanitizing-Policy.md`
  - `development/ER-WP-29-Sanitizing-und-Trusted-DOM-Policy-fuer-RMT-und-Docs-vorbereiten.md`
  - `security/trusted-dom-policy.js`
  - `docs/trusted-dom-sanitizing.md`
  - `development/XTend-Supply-Chain-Gate-Plan.md`
  - `development/ER-WP-30-Dependency-License-und-Vulnerability-Gates-planen.md`
  - `security/supply-chain-gate-policy.js`
  - `scripts/verify_supply_chain_policy.js`
  - `tests/security/supply_chain_policy_suite.js`
  - `docs/supply-chain-gates.md`
  - `development/XTend-Component-Catalog-Coverage-Matrix.md`
  - `development/ER-WP-31-Component-Catalog-Coverage-Matrix-erzeugen.md`
  - `development/XTend-Component-Catalog-Naming-Konvention.md`
  - `development/ER-WP-32-Naming-und-Doku-Luecken-im-Component-Catalog-schliessen.md`
  - `development/ER-WP-33-Component-Level-Suites-fuer-priorisierte-Komponenten-nachziehen.md`
  - `catalog/component-catalog-coverage.js`
  - `tests/catalog/component_catalog_coverage_suite.js`
  - `docs/component-catalog-coverage.md`
  - `tests/components/priority_component_contracts.js`
  - `tests/components/component_suite.js`
  - `catalog/component-regression-priority.js`
  - `tests/catalog/component_regression_priority_suite.js`
  - `development/XTend-Visuelle-und-Browsernahe-Regression-Prioritaetsplan.md`
  - `development/ER-WP-35-Visuelle-und-browsernahe-Regression-priorisieren.md`
  - `docs/visual-browser-regression.md`
  - `.github/workflows/xtend-default-gates.yml`
  - `development/XTend-CI-Default-Gates-Workflow.md`
  - `development/ER-WP-36-CI-Workflow-fuer-Default-Gates-anlegen.md`
  - `development/XTend-CI-Gate-Matrix.md`
  - `development/ER-WP-37-Schnelle-PR-Gates-und-volle-Release-Gates-trennen.md`
  - `development/XTend-Release-Checklist-und-SemVer-Policy.md`
  - `development/ER-WP-38-Release-Checklist-und-SemVer-Policy-schreiben.md`
  - `docs/xtendrmt-parsedown-docs.rmt`
  - `tests/rmt/docs_rmt_pilot_suite.js`
  - `development/ER-WP-40-Docs-App-mit-RMT-Parsedown-Scheduling-pilotieren.md`
  - `development/XTend-Test-Reporting-und-CI-Vorbereitung.md`
  - `docs/components/xsummary.md`
  - `docs/components/xutils.md`
  - `development/XTend-Dokumentations-und-Demo-Referenzpfade.md`
  - `tests/references/reference_path_suite.js`

## Zweck

Diese Roadmap uebersetzt das Enterprise-Reife-Journey-Papier in konkret startbare Workpackages. Sie ist bewusst als Umsetzungsplan nach Epic 05 angelegt und priorisiert nicht neue UI-Flaechen, sondern Produktreife: Loader, lokaler Server, Distribution, XTend-Fabric, Telemetry, Fibers, Lanes, Performance-by-design, A11y-by-design, Security, Catalog Coverage und CI/CD.

Die Roadmap ist der direkte Arbeitsvorrat fuer die naechsten Enterprise-Epics:

- `EPIC 06`: Enterprise Runtime, Loader und Local Development
- `EPIC 07`: XTend-Fabric, Telemetry und UI Scheduler Lanes
- `EPIC 08`: Performance und A11y by Design
- `EPIC 09`: Catalog, Security und Release Readiness

## Roadmap-Leitplanken

- `xtend-dev.js` wird nicht als dauerhafte Loader-Oberflaeche weitergefuehrt.
- `xtend-loader.js` wird kanonischer lokaler ESM-Loader.
- CDN ist kein Default- oder Testpfad.
- Entwicklung und Browser-Smokes nutzen einen lokalen Server.
- `@xtend-fabric` wird Sicherheits-, Telemetry-, Error-Boundary- und Enterprise-Hook-Schicht.
- UI-Arbeit wird als Fiber mit Lane, Budget und Diagnostics-Korrelation modelliert.
- XTendRMT bleibt framework-agnostischer Scheduler/Kernel; XTend-Kopplung bleibt Adapter-/Fabric-Arbeit.
- Performance-by-design und A11y-by-design sind Pflicht fuer neue Komponenten.

## Definition of Ready

Ein Roadmap-Workpackage darf gestartet werden, wenn:

- die betroffenen Dateien, Tests und Docs bekannt sind
- bestehende Gates nicht bewusst gebrochen werden
- die Kernel-/Adapter-/Fabric-Grenze klar ist
- lokale Entwicklung ohne CDN erhalten bleibt oder gezielt hergestellt wird
- eine Definition of Done und ein Validierungsgate benannt sind

## Priorisierungslogik

- `P0`: blockiert Enterprise-Reife, Loader-Migration, Safety Boundary oder Basis-Gates
- `P1`: macht Runtime-, Catalog-, Scheduler-, Performance- oder A11y-Reife produktiv nutzbar
- `P2`: erweitert Abdeckung, Doku, Release-Komfort oder Langfrist-Governance

## Statuslogik

- `ready`: kann sofort als Paket gestartet werden
- `next`: soll nach Abschluss der benannten Vorgaenger starten
- `blocked`: ist fachlich wichtig, aber noch nicht startbar
- `planned`: ist Teil der Roadmap, aber nicht im naechsten Durchlauf
- `completed`: Zielartefakt ist umgesetzt und gatebar

## Naechste startbare Workpackages

`ER-WP-01`, `ER-WP-02`, `ER-WP-03`, `ER-WP-04`, `ER-WP-05`, `ER-WP-06`, `ER-WP-07`, `ER-WP-08`, `ER-WP-09`, `ER-WP-10`, `ER-WP-11`, `ER-WP-12`, `ER-WP-13`, `ER-WP-14`, `ER-WP-15`, `ER-WP-16`, `ER-WP-17`, `ER-WP-18`, `ER-WP-19`, `ER-WP-20`, `ER-WP-21`, `ER-WP-22`, `ER-WP-23`, `ER-WP-24`, `ER-WP-25`, `ER-WP-26`, `ER-WP-27`, `ER-WP-28`, `ER-WP-29`, `ER-WP-30`, `ER-WP-31`, `ER-WP-32`, `ER-WP-33`, `ER-WP-34`, `ER-WP-35`, `ER-WP-36`, `ER-WP-37`, `ER-WP-38`, `ER-WP-39` und `ER-WP-40` sind abgeschlossen. Es gibt kein weiteres unmittelbar startbares ER-Workpackage in diesem Paketlauf.

- Naechster sinnvoller Schritt: neuer Produktreife-Checkpoint fuer Release-, Catalog- oder XTendRMT-Upstream-Entscheidung.

Empfohlene Sequenz: `ER-WP-31` hat die Component Catalog Coverage Matrix erzeugt. `ER-WP-32` hat die erkannten Docs-/Naming-Luecken geschlossen. `ER-WP-33` hat die P0/P1-Komponenten mit Component-Level-Suites und Fixtures auf `18/28` Coverage gehoben. `ER-WP-34` hat Public Types und Event Contracts fuer 18 priorisierte Oberflaechen vervollstaendigt. `ER-WP-35` hat Long-Tail-, Browser- und Performance-Regression als testbaren Prioritaetsplan geschnitten. Nach `WP-SM-04` steht die fortgeschriebene Catalog-Basis bei `41/41` Component-Suites, Fixtures und Types; Form, Feedback, Navigation, Overlay, Iconography, Surface Runtime sowie Layout/Display/Media sind weitgehend `enterprise-ready`, waehrend `xstate` als nicht-visuelle Boundary-Probe `contract-gated` und `x-utils` als Utility-Boundary `typed-contract-gated` ist. `ER-WP-36` hat die lokalen Default-Gates in GitHub Actions produktisiert. `ER-WP-37` hat schnelle PR-Gates, volle Release-Gates und Nightly-Ausfuehrung als Gate-Matrix getrennt. `ER-WP-38` hat Release Checklist und SemVer Policy auf diese Matrix gesetzt. `ER-WP-39` hat den Enterprise Adoption Guide geschrieben. `ER-WP-40` hat den Docs-App-Pfad mit Shell-first RMT Parsedown Scheduling, `docs.app.shell`, `docs.header.search` und future-ready Media-Slots umgesetzt.

## Phasenplan

| Phase | Ziel | Startbedingung | Exit-Kriterium |
|-------|------|----------------|----------------|
| `Phase 0` | Architekturfreeze | Epic 05 abgeschlossen | Loader-, Fabric-, Fiber/Lane-, Performance-, A11y- und Security-Contracts sind entschieden |
| `Phase 1` | Lokale Runtime und Loader-Migration | `ER-WP-01` completed | kein Default-Flow nutzt `xtend-dev.js` oder CDN |
| `Phase 2` | Fabric Runtime und Scheduler-Telemetry | `ER-WP-07`, `ER-WP-12` completed | Component-/Route-Arbeit ist als Fiber messbar und schedulable |
| `Phase 3` | Performance und A11y Gates | `ER-WP-17`, `ER-WP-22` completed | neue Komponenten haben Performance- und A11y-Profile |
| `Phase 4` | Security, Catalog und Release Readiness | Phasen 1-3 stabil | CI, Catalog Coverage, Release- und Security-Gates sind produktreif |

## Backlog-Uebersicht

| ID | Prio | Status | Phase | Epic | Titel | Abhaengigkeiten |
|----|------|--------|-------|------|-------|-----------------|
| `ER-WP-01` | P0 | completed | Phase 0 | EPIC 06 | Loader-Contract und Rename-ADR fuer `xtend-loader.js` erstellen | Produktreife-Checkpoint |
| `ER-WP-02` | P0 | completed | Phase 1 | EPIC 06 | `xtend-loader.js` als kanonischen ESM-Loader einfuehren | `ER-WP-01` |
| `ER-WP-03` | P0 | completed | Phase 1 | EPIC 06 | CDN-Fallbacks aus Core-Pfaden entfernen | `ER-WP-01`, `ER-WP-02` |
| `ER-WP-04` | P0 | completed | Phase 1 | EPIC 06 | lokalen Dev-/Test-Server produktisieren | `ER-WP-01` |
| `ER-WP-05` | P1 | completed | Phase 1 | EPIC 06 | Demo- und Fixture-Pfade auf neuen Loader migrieren | `ER-WP-02`, `ER-WP-03`, `ER-WP-04` |
| `ER-WP-06` | P1 | completed | Phase 1 | EPIC 06 | Package-Export- und Release-Strategie festlegen | `ER-WP-02`, `ER-WP-05` |
| `ER-WP-07` | P0 | completed | Phase 0 | EPIC 07 | XTend-Fabric ADR und API Surface definieren | Produktreife-Checkpoint |
| `ER-WP-08` | P0 | completed | Phase 2 | EPIC 07 | Fabric Runtime Skeleton implementieren | `ER-WP-07` |
| `ER-WP-09` | P0 | completed | Phase 2 | EPIC 07 | Component Lifecycle Error Boundary einfuehren | `ER-WP-08` |
| `ER-WP-10` | P1 | completed | Phase 2 | EPIC 07 | Reporter Adapter Contract vorbereiten | `ER-WP-07`, `ER-WP-08` |
| `ER-WP-11` | P1 | completed | Phase 2 | EPIC 07 | Fabric an `xstate`, API und XTendRMT Diagnostics anbinden | `ER-WP-08`, `ER-WP-10` |
| `ER-WP-12` | P0 | completed | Phase 0 | EPIC 07 | Fiber- und Lane-Contract spezifizieren | Produktreife-Checkpoint |
| `ER-WP-13` | P0 | completed | Phase 2 | EPIC 07 | Lane Mapping auf RMT Schedules definieren | `ER-WP-12` |
| `ER-WP-14` | P1 | completed | Phase 2 | EPIC 07 | Component Mount/Hydration als Fibers instrumentieren | `ER-WP-08`, `ER-WP-13` |
| `ER-WP-15` | P1 | completed | Phase 2 | EPIC 07 | Route Render und XRouter Navigation als Fibers instrumentieren | `ER-WP-08`, `ER-WP-13`, `ER-WP-14` |
| `ER-WP-16` | P1 | completed | Phase 2 | EPIC 07 | Telemetry Snapshots und Backpressure Signale integrieren | `ER-WP-11`, `ER-WP-14`, `ER-WP-15` |
| `ER-WP-17` | P0 | completed | Phase 0 | EPIC 08 | Performance Budget Matrix fuer Component-Profile erstellen | Produktreife-Checkpoint |
| `ER-WP-18` | P0 | completed | Phase 3 | EPIC 08 | Loader- und Hydration-Messpunkte einfuehren | `ER-WP-02`, `ER-WP-17` |
| `ER-WP-19` | P1 | completed | Phase 3 | EPIC 08 | Performance Regression Suite anlegen | `ER-WP-17`, `ER-WP-18` |
| `ER-WP-20` | P1 | completed | Phase 3 | EPIC 08 | Lazy/Idle/Visible Hydration Policies haerten | `ER-WP-13`, `ER-WP-18`, `ER-WP-19` |
| `ER-WP-21` | P1 | completed | Phase 3 | EPIC 08 | Performance-Doku fuer Komponentenautoren schreiben | `ER-WP-17`, `ER-WP-19` |
| `ER-WP-22` | P0 | completed | Phase 0 | EPIC 08 | A11y Component Contract 1.0 definieren | Produktreife-Checkpoint |
| `ER-WP-23` | P0 | completed | Phase 3 | EPIC 08 | Scaffold-Blueprints um A11y-Pflichten erweitern | `ER-WP-22` |
| `ER-WP-24` | P1 | completed | Phase 3 | EPIC 08 | Browsernahe Fokus- und Keyboard-Smokes ausbauen | `ER-WP-22`, `ER-WP-23` |
| `ER-WP-25` | P1 | completed | Phase 3 | EPIC 08 | Screenreader-Signal-Contracts einfuehren | `ER-WP-22`, `ER-WP-24` |
| `ER-WP-26` | P1 | completed | Phase 3 | EPIC 08 | Reduced-Motion und High-Contrast Regeln gatebar machen | `ER-WP-22`, `ER-WP-24` |
| `ER-WP-27` | P0 | completed | Phase 0 | EPIC 09 | Security ADR fuer Loader, Manifest, Templates und Events schreiben | Produktreife-Checkpoint |
| `ER-WP-28` | P1 | completed | Phase 4 | EPIC 09 | Manifest- und Dynamic-Import-Policy haerten | `ER-WP-03`, `ER-WP-27` |
| `ER-WP-29` | P1 | completed | Phase 4 | EPIC 09 | Sanitizing-/Trusted-DOM-Policy fuer RMT und Docs vorbereiten | `ER-WP-27` |
| `ER-WP-30` | P1 | completed | Phase 4 | EPIC 09 | Dependency-, License- und Vulnerability-Gates planen | `ER-WP-06`, `ER-WP-27` |
| `ER-WP-31` | P0 | completed | Phase 4 | EPIC 09 | Component Catalog Coverage Matrix erzeugen | `ER-WP-22` |
| `ER-WP-32` | P0 | completed | Phase 4 | EPIC 09 | Naming- und Doku-Luecken im Component Catalog schliessen | `ER-WP-31` |
| `ER-WP-33` | P1 | completed | Phase 4 | EPIC 09 | Component-Level-Suites fuer priorisierte Komponenten nachziehen | `ER-WP-23`, `ER-WP-31`, `ER-WP-32` |
| `ER-WP-34` | P1 | completed | Phase 4 | EPIC 09 | Types und Public Event Contracts vervollstaendigen | `ER-WP-31`, `ER-WP-33` |
| `ER-WP-35` | P2 | completed | Phase 4 | EPIC 09 | visuelle und browsernahe Regression priorisieren | `ER-WP-24`, `ER-WP-33`, `ER-WP-34` |
| `ER-WP-36` | P0 | completed | Phase 4 | EPIC 09 | CI Workflow fuer Default Gates anlegen | `ER-WP-04` |
| `ER-WP-37` | P1 | completed | Phase 4 | EPIC 09 | schnelle PR-Gates und volle Release-Gates trennen | `ER-WP-19`, `ER-WP-36` |
| `ER-WP-38` | P1 | completed | Phase 4 | EPIC 09 | Release Checklist und SemVer Policy schreiben | `ER-WP-06`, `ER-WP-36`, `ER-WP-37` |
| `ER-WP-39` | P1 | completed | Phase 4 | EPIC 09 | Enterprise Adoption Guide schreiben | `ER-WP-06`, `ER-WP-11`, `ER-WP-21`, `ER-WP-25`, `ER-WP-38` |
| `ER-WP-40` | P2 | completed | Phase 4 | EPIC 09 | Docs-App mit RMT Parsedown Scheduling pilotieren | `ER-WP-13`, `ER-WP-29`, `ER-WP-39` |

## Workpackages im Detail

### ER-WP-01 - Loader-Contract und Rename-ADR fuer `xtend-loader.js` erstellen

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - dauerhafte Loader-Oberflaeche festlegen und `xtend-dev.js` als Altname aus dem Produktpfad herausfuehren
- Scope:
  - Namensentscheidung `xtend-loader.js`
  - ESM-/ES6-Modulpolicy
  - Migrationsfenster fuer Legacy-Demos
  - Test- und Reference-Gate-Erwartungen
- Zielartefakte:
  - ADR unter `development/ADR-XTend-Loader-und-Lokale-Entwicklung.md`
  - Workpackage-Abnahme unter `development/ER-WP-01-Loader-Contract-und-Rename-ADR-fuer-xtend-loader-js.md`
  - Update dieses Roadmap-Dokuments und des Reference-Registry
- Betroffene Dateien:
  - `xtend-dev.js`
  - `index.html`
  - `tests/browser/browser_smoke_suite.js`
  - `tests/browser/fixtures/core-flows-smoke.html`
  - `development/XTend-Dokumentations-und-Demo-Referenzpfade.md`
- Definition of Done:
  - `xtend-loader.js` ist als Zielname verbindlich
  - Legacy-Strategie fuer `xtend-dev.js` ist dokumentiert
  - `ER-WP-02` kann ohne Namensunklarheit starten
- Ergebnis:
  - abgeschlossen: `development/ADR-XTend-Loader-und-Lokale-Entwicklung.md` akzeptiert `xtend-loader.js` als kanonischen Loader, klassifiziert `xtend-dev.js` als Legacy und macht lokale Entwicklung ohne CDN zum Default.

### ER-WP-02 - `xtend-loader.js` als kanonischen ESM-Loader einfuehren

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - lokalen, kanonischen Loader implementieren
- Scope:
  - bestehende Loader-Logik aus `xtend-dev.js`
  - Manifest-Resolution
  - Core-Modul-Preload
  - API-Initialisierung
  - Performance-Messpunkt-Vorbereitung
- Zielartefakte:
  - `xtend-loader.js`
  - `development/ER-WP-02-xtend-loader-js-als-kanonischen-ESM-Loader-einfuehren.md`
  - optional `xtend-loader.esm.js`, falls Export-Strategie dies verlangt
- Betroffene Dateien:
  - `xtend-loader.js`
  - `xtend-dev.js`
  - `index.html`
  - `tests/browser/fixtures/core-flows-smoke.html`
- Definition of Done:
  - Default-Demo kann mit `xtend-loader.js` laufen
  - Loader bleibt ESM-basiert
  - `node scripts/run_xtend_tests.js browser --json` ist auf neuen Loader vorbereitbar
- Ergebnis:
  - abgeschlossen: `xtend-loader.js` ist als kanonischer lokaler ESM-Loader umgesetzt, `xtend-dev.js` ist Legacy-Stub, `index.html` und der Core-Browser-Smoke nutzen den neuen Loaderpfad.
  - `data-manifest`, `meta[name="xtend-preload"]`, Core-Modul-Preload, DOM-Erkennung, Lazy Loading, lokale API-Initialisierung und Loader-Diagnostics sind umgesetzt.

### ER-WP-03 - CDN-Fallbacks aus Core-Pfaden entfernen

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - lokale Entwicklung und Tests vollstaendig von CDN-Fallbacks entkoppeln
- Scope:
  - statische Imports
  - API-Fallbacks
  - Legacy-Komponentenimports
  - Import-Map-Abloesung fuer Default-Pfade
- Zielartefakte:
  - `api.js` ohne CDN-Import und ohne CDN-Fallback fuer Core-Komponenten
  - lokale Imports in betroffenen Komponenten
  - `development/ER-WP-03-CDN-Fallbacks-aus-Core-Pfaden-entfernen.md`
- Betroffene Dateien:
  - `api.js`
  - `components/xplayer.js`
  - `xstatetest.html`
  - `masonry.html`
  - `hero.html`
  - `xplayerdemo.html`
- Definition of Done:
  - `rg "https://cdn.ccs-networks.de/xtend" api.js components tests/browser/fixtures index.html` findet keinen Default-Core-Pfad
  - Legacy-Demos sind migriert oder explizit klassifiziert
- Ergebnis:
  - abgeschlossen: `api.js`, `components/manifest.json`, Core-Komponenten, Browser-Fixtures und priorisierte manuelle Demos nutzen repo-lokale XTend-Pfade.
  - lokale Fallbacks ersetzen XTend-CDN-Fallbacks; `components/turndown.js` ersetzt den Writer-CDN-Helper.
  - `ER-WP-05` wurde dadurch fachlich startbereit und ist inzwischen abgeschlossen.

### ER-WP-04 - lokalen Dev-/Test-Server produktisieren

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - einheitlichen lokalen Server fuer Entwicklung, Demos und Browser-Smokes bereitstellen
- Scope:
  - statischer Repo-Server
  - MIME Types
  - Port-Konfiguration
  - Testmodus mit Port `0`
  - NPM-Scripts
- Zielartefakte:
  - `scripts/serve_xtend_dev.js`
  - `development/ER-WP-04-Lokalen-Dev-Test-Server-produktisieren.md`
  - `npm run dev:local`
  - `npm run test:browser:local`
- Betroffene Dateien:
  - `package.json`
  - `scripts/`
  - `tests/browser/browser_smoke_suite.js`
- Definition of Done:
  - Browser-Smoke-Harness und manuelle Entwicklung nutzen dieselbe Serverlogik
- Ergebnis:
  - abgeschlossen: `scripts/serve_xtend_dev.js` stellt `xtend.local-dev-server.v1` fuer manuelle Entwicklung und Browser-Smokes bereit.
  - `npm run dev:local` und `npm run test:browser:local` sind in `package.json` registriert.
  - Der Browser-Harness nutzt dieselbe Serverlogik und prueft Port `0`, MIME Types und Path-Traversal-Schutz.
  - kein externer Server ist fuer Default-Tests noetig

### ER-WP-05 - Demo- und Fixture-Pfade auf neuen Loader migrieren

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - Default-Demos und Browser-Fixtures auf `xtend-loader.js` umstellen
- Scope:
  - `index.html`
  - `tests/browser/fixtures/core-flows-smoke.html`
  - XTendRMT-Bestcase, sofern XTend-Loader betroffen ist
  - Legacy-Demo-Klassifikation
- Zielartefakte:
  - aktualisierte Demo- und Fixture-Referenzen
  - Reference-Gate-Assertions auf neuen Loader
- Definition of Done:
  - kein Default-Gate assertiert auf `/xtend-dev.js`
  - Legacy-Demos sind bewusst ausserhalb des Default-Gates
- Ergebnis:
  - abgeschlossen: `xtendrmt-bestcase.html` nutzt nun `xtend-loader.js`, lokales Manifest, `meta[name="xtend-preload"]` und wartet auf `window.__XTendLoaderBootPromise`, bevor die XTendRMT-Demo-Runtime importiert wird.
  - Reference- und Browser-Gates pruefen Default-Demos, Docs-App und Browser-Fixtures auf lokalen Loader, keinen XTend-CDN-Pfad und keine `xtend-dev.js` Default-Abhaengigkeit.
  - `development/ER-WP-05-Demo-und-Fixture-Pfade-auf-neuen-Loader-migrieren.md` dokumentiert Default-, Spezial-Smoke- und Legacy-Klassifikation.

### ER-WP-06 - Package-Export- und Release-Strategie festlegen

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - konsumierbare Distribution fuer XTend vorbereiten
- Scope:
  - Package Exports
  - ESM-Entry-Points
  - Browser-Bundle-Policy
  - SemVer und Changelog
  - Release-Provenance
- Zielartefakte:
  - `development/XTend-Package-Export-und-Release-Strategie.md`
  - vorbereitete `package.json` Export-Entscheidung
- Definition of Done:
  - Paketstrategie ist dokumentiert
  - spaetere Veroeffentlichung braucht keinen Architektur-Refactor
- Ergebnis:
  - abgeschlossen: `development/XTend-Package-Export-und-Release-Strategie.md` akzeptiert `xtend.package-export.release-strategy.v1` fuer Export-Matrix, Browser-Bundle-Policy, SemVer/Changelog, Release-Gates und Provenance.
  - `package.json` ist mit `exports`, `files`, `publishConfig.provenance`, `release:check`, `release:report`, `pack:dry-run` und Package-Metadaten vorbereitet, bleibt aber durch `private: true` bewusst nicht publishbar.
  - `README.md` und `CHANGELOG.md` bilden die Package-Basis fuer spaetere Release-Kandidaten.
  - `ER-WP-30` ist abgeschlossen und hat Supply-Chain-Gates als lokale Offline-Pruefung plus CI-Handoff verankert.

### ER-WP-07 - XTend-Fabric ADR und API Surface definieren

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - `@xtend-fabric` als globale Sicherheits-, Telemetry- und Error-Boundary-Schicht festlegen
- Scope:
  - Browser Namespace `window.XTendFabric`
  - API Surface
  - Reporter Boundary
  - Datenschutz-, Sampling- und Redaction-Grundregeln
- Zielartefakte:
  - `development/ADR-XTend-Fabric.md`
  - `development/ER-WP-07-XTend-Fabric-ADR-und-API-Surface-definieren.md`
  - API Contract `xtend.fabric.api.v1`
- Definition of Done:
  - Fabric ist klar von XTendRMT Kernel und App-Code getrennt
  - `ER-WP-08` kann Runtime Skeleton implementieren
- Ergebnis:
  - abgeschlossen: `development/ADR-XTend-Fabric.md` akzeptiert `XTend-Fabric` als Host-Schicht fuer Safety, Telemetry, Error Boundaries, Reporter und spaetere UI-Scheduler-Anbindung. `@xtend-fabric`, `window.XTendFabric`, `xtend.fabric.api.v1`, `xtend.fabric.diagnostic.v1`, `xtend.fabric.reporter.v1` und `xtend.fabric.redaction.v1` sind als API- und Contract-Surface festgelegt. `ER-WP-08` ist startbereit.

### ER-WP-08 - Fabric Runtime Skeleton implementieren

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - minimalen Fabric Runtime-Kern bereitstellen
- Scope:
  - `createXtendFabric`
  - `wrapComponent`
  - `runFiber`
  - `emitDiagnostic`
  - Noop Reporter
- Zielartefakte:
  - `fabric/xtend-fabric.js`
  - `tests/fabric/fabric_runtime_suite.js`
  - `development/ER-WP-08-Fabric-Runtime-Skeleton-implementieren.md`
  - `docs/xtend-fabric.md`
  - `npm run test:fabric`
- Definition of Done:
  - Fabric laeuft ohne externen Dienst
  - Fehler koennen strukturiert als Diagnostics gemeldet werden
- Ergebnis:
  - abgeschlossen: `fabric/xtend-fabric.js` stellt `xtend.fabric.api.v1` mit `createXtendFabric`, `wrapComponent`, `runFiber`, `emitDiagnostic`, `registerReporter`, `createBoundary`, `captureError` und `connectRmtDiagnostics` bereit.
  - Noop Reporter, lokaler Diagnostic Store, Fiber Store, Redaction, Browser Namespace `window.XTendFabric` und kanonische Lane Records sind umgesetzt.
  - `tests/fabric/fabric_runtime_suite.js` und `npm run test:fabric` pruefen API Shape, Reporter-Opt-in, Redaction, Boundaries, Fibers und RMT-Diagnostic-Consumption.

### ER-WP-09 - Component Lifecycle Error Boundary einfuehren

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - Component-Lifecycle-Fehler nicht mehr unstrukturiert verlieren
- Scope:
  - `connectedCallback`
  - `render`
  - Event Handler
  - `hydrate`
  - `disconnectedCallback`
- Zielartefakte:
  - Fabric Wrapper Contract fuer Lifecycle-Fehler
  - Component-Testfixture mit absichtlich fehlerhaftem Lifecycle
- Definition of Done:
  - Fehler enthalten Component, Phase, Fiber, Lane, Severity und Cause
- Ergebnis:
  - abgeschlossen: `fabric/xtend-fabric.js` stellt `xtend.fabric.lifecycle-error-boundary.v1`, `createComponentLifecycleBoundary`, `wrapEventHandler`, Lifecycle-Phase-zu-Fiber-Mapping und `xtend.fabric.component.lifecycle.failed` bereit.
  - `wrapComponent` nutzt die Lifecycle-Boundary fuer `connectedCallback`, `attributeChangedCallback`, `render`, `hydrate`, `disconnectedCallback` und optionale Event Handler.
  - `tests/fabric/fixtures/broken-lifecycle.component.js` und `tests/fabric/fabric_lifecycle_boundary_suite.js` pruefen absichtlich fehlerhafte Lifecycle-, Hydration-, Disconnect- und Event-Handler-Pfade.
  - `npm run test:fabric-lifecycle` ist als dedizierter Gate verfuegbar.

### ER-WP-10 - Reporter Adapter Contract vorbereiten

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - Enterprise-QS- und Error-Reporting-Anschluesse ohne Vendor-Lock-in vorbereiten
- Scope:
  - Noop Reporter
  - Console Reporter
  - Test Reporter
  - spaetere Enterprise Reporter
- Zielartefakte:
  - `xtend.fabric.reporter.v1`
- Definition of Done:
  - Reporter sind opt-in
  - Default sendet nichts extern
- Ergebnis:
  - abgeschlossen: `fabric/xtend-fabric.js` stellt `createReporterAdapter`, `createConsoleReporter`, `createTestReporter` und Reporter-Severity-Filter bereit.
  - `createNoopReporter` bleibt Default; ohne `registerReporter` wird nichts extern gesendet.
  - Reporter Adapter bewahren `delivery`, `external` und `capabilities`, liefern nur redigierte Diagnostics und erzeugen bei Reporter-Fehlern lokale `xtend.fabric.reporter.failed` Diagnostics.
  - `tests/fabric/fabric_reporter_adapter_suite.js` und `npm run test:fabric-reporters` pruefen Noop-, Console-, Test- und Enterprise-Reporter-Vorbereitung.
  - `ER-WP-11` ist inzwischen abgeschlossen.

### ER-WP-11 - Fabric an `xstate`, API und XTendRMT Diagnostics anbinden

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - XTend Runtime-, State- und RMT-Diagnostics in eine einheitliche Fabric-Sicht bringen
- Scope:
  - `xstate`-Spiegelung
  - API-Diagnostics
  - RMT State/Scheduler/Diagnostics Bridge
  - Correlation IDs
- Zielartefakte:
  - Fabric Diagnostics Bridge
  - `development/XTend-Fabric-Runtime-Diagnostics-Bridge.md`
  - `development/ER-WP-11-Fabric-an-xstate-API-und-XTendRMT-Diagnostics-anbinden.md`
  - `tests/fabric/fabric_runtime_diagnostics_bridge_suite.js`
  - `npm run test:fabric-runtime-bridge`
  - Testfixture fuer State-/RMT-Diagnostic-Sync
- Definition of Done:
  - RMT bleibt host-neutral
  - Fabric konsumiert Adapterdaten, nicht Kernel-Sonderfaelle
- Ergebnis:
  - abgeschlossen: `fabric/xtend-fabric.js` stellt `createRuntimeDiagnosticsBridge`, `connectXState`, `connectApi`, `connectRmtDiagnostics` und `createRmtDiagnosticsHub` bereit.
  - Fabric spiegelt `xtend.fabric.bridge.ready`, `xtend.fabric.diagnostics.last` und `xtend.fabric.diagnostics.snapshot` nach `xstate`, ignoriert eigene Mirror-Keys und erzeugt `xtend.fabric.xstate.changed` fuer externe State-Aenderungen.
  - API Compliance-Metadaten werden defensiv ueber `xtend.fabric.api.connected` gemeldet; RMT Diagnostics werden ueber Arrays, `diagnostics`, `listDiagnostics`, `subscribe`, DOM Events oder Hub-Publish konsumiert.
  - RMT Adapter Results wie `rmt.bridge.adapter.result.degraded` werden als `xtend.rmt.bridge.adapter.result.degraded` normalisiert, mit `routeRef`, `scheduleRef` und `correlationId` korreliert und redigiert.
  - Der RMT Kernel wird nicht importiert. `ER-WP-16` ist abgeschlossen und nutzt diese Bridge als Snapshot-Quelle.

### ER-WP-12 - Fiber- und Lane-Contract spezifizieren

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - UI-Arbeit als planbare, messbare Einheit definieren
- Scope:
  - Fiber-Felder
  - Lane-Liste
  - Budget- und Diagnostics-Korrelation
  - Mapping-Vorbereitung zu RMT Schedules
- Zielartefakte:
  - `development/XTend-Fiber-und-Lane-Contract.md`
  - `development/ER-WP-12-Fiber-und-Lane-Contract-spezifizieren.md`
  - Contract `xtend.fabric.fiber.v1`
  - Contract `xtend.fabric.lane.v1`
- Definition of Done:
  - `ER-WP-13` kann RMT Schedule Mapping darauf aufbauen
- Ergebnis:
  - abgeschlossen: `development/XTend-Fiber-und-Lane-Contract.md` definiert `xtend.fabric.fiber.v1` und `xtend.fabric.lane.v1` als Fabric-seitige Contract-Basis fuer UI-Arbeit, Lanes, Budgetfelder, Diagnostics-Korrelation und RMT-Mapping-Hints. `ER-WP-13` ist startbereit.

### ER-WP-13 - Lane Mapping auf RMT Schedules definieren

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - Fabric-Lanes an bestehende XTendRMT Schedule-Policies anschliessen
- Scope:
  - `user-blocking`
  - `visible`
  - `transition`
  - `idle`
  - `background`
  - `diagnostics`
  - `a11y`
- Zielartefakte:
  - `xtend.fabric.rmt-lane-mapping.v1`
  - `development/XTend-Fabric-RMT-Lane-Mapping.md`
  - `development/ER-WP-13-Lane-Mapping-auf-RMT-Schedules-definieren.md`
  - `fabric/rmt-lane-mapping.js`
  - `tests/fabric/fabric_rmt_lane_mapping_suite.js`
  - `docs/xtend-fabric-rmt-lane-mapping.md`
  - Beispiel `.rmt` Schedule Records fuer UI-Lanes
- Definition of Done:
  - Mapping ist testbar
  - RMT Kernel bleibt framework-agnostisch
- Ergebnis:
  - abgeschlossen: `xtend.fabric.rmt-lane-mapping.v1` mappt Fabric-Lanes deterministisch auf RMT Schedule Records. `a11y` bleibt Fabric-semantisch und wird im RMT-Schedule als `user-blocking` mit `metadata.fabricLane = "a11y"` gefuehrt. `ER-WP-14` ist inzwischen abgeschlossen.

### ER-WP-14 - Component Mount/Hydration als Fibers instrumentieren

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - Component Mount und Hydration messbar und schedulable machen
- Scope:
  - Custom Element Mount
  - Adapter-Hydration
  - Loader-Preload
  - Diagnostics
- Zielartefakte:
  - Fabric Instrumentierung fuer Component Lifecycle
  - `development/XTend-Component-Fiber-Instrumentierung.md`
  - `development/ER-WP-14-Component-Mount-Hydration-als-Fibers-instrumentieren.md`
  - `tests/fabric/fabric_component_fiber_suite.js`
  - `npm run test:fabric-component-fibers`
- Definition of Done:
  - Component-Fibers enthalten Dauer, Ergebnis, Lane und Diagnostics
- Ergebnis:
  - abgeschlossen: `fabric/xtend-fabric.js` stellt `createComponentFiberInstrumentation` bereit. Mount, Hydration und Preload erzeugen `xtend.fabric.fiber.v1` Records mit `durationMs`, `result`, `lane`, `scheduleRef`, `endpointNameHint` und redigierten Diagnostics.
  - `component.mount` nutzt `component.visible.mount` und `xtendrmt.component.mount`.
  - `component.hydrate` nutzt standardmaessig `idle`, `component.idle.hydrate` und `xtendrmt.component.hydrate`; sichtbare Hydration bleibt per Override moeglich.
  - `ER-WP-15` ist inzwischen abgeschlossen.

### ER-WP-15 - Route Render und XRouter Navigation als Fibers instrumentieren

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - Navigation und Route Render telemetry-driven machen
- Scope:
  - XRouter Navigation
  - Route Render
  - RMT Route ScheduleRefs
  - Backpressure Signals
- Zielartefakte:
  - XRouter/Fabric Integration
  - Route-Fiber Gate fuer XRouter-Boundaries
  - `development/XTend-Route-Fiber-Instrumentierung.md`
  - `development/ER-WP-15-Route-Render-und-XRouter-Navigation-als-Fibers-instrumentieren.md`
  - `tests/fabric/fabric_route_fiber_suite.js`
  - `npm run test:fabric-route-fibers`
- Definition of Done:
  - Navigation erzeugt korrelierbare Route-Fibers
- Ergebnis:
  - abgeschlossen: `fabric/xtend-fabric.js` stellt `createRouteFiberInstrumentation` bereit. `navigate` erzeugt `route.navigate` Fibers mit `user-blocking`, `ui.user-blocking.input` und `xtendrmt.ui.user-blocking`; `render` erzeugt `route.render` Fibers mit `transition`, `route.transition.render` und `xtendrmt.route.render`.
  - Fehler erzeugen `xtend.fabric.route.navigate.failed` oder `xtend.fabric.route.render.failed`; Route-Fiber-Metadata wird redigiert.
  - XRouter bleibt lose gekoppelt ueber `navigate(to, options)`, `_handleNavigation()`, `_renderRoute(match, container)` und `router-navigate`. Fabric importiert keinen RMT Kernel.
  - `ER-WP-16` ist abgeschlossen und fuehrt Route-Fibers in Telemetry Snapshots und Backpressure-Signale zusammen.

### ER-WP-16 - Telemetry Snapshots und Backpressure Signale integrieren

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - Scheduler-Optimierung datengetrieben vorbereiten
- Scope:
  - Snapshot API
  - Backpressure Profile
  - Performance Runtime Anschluss
  - Reporter Export
- Zielartefakte:
  - `xtend.fabric.telemetry-snapshot.v1`
  - `xtend.fabric.backpressure-signal.v1`
  - `development/XTend-Telemetry-Snapshot-und-Backpressure-Contract.md`
  - `development/ER-WP-16-Telemetry-Snapshots-und-Backpressure-Signale-integrieren.md`
  - `tests/fabric/fabric_telemetry_snapshot_suite.js`
  - `npm run test:fabric-telemetry`
- Definition of Done:
  - Fabric kann belastbare lokale Telemetry Snapshots liefern
- Ergebnis:
  - abgeschlossen: `fabric/xtend-fabric.js` stellt `createTelemetrySnapshot`, `createBackpressureSignal`, `publishTelemetrySnapshot` und `exportTelemetrySnapshot` bereit.
  - Snapshots aggregieren Component-/Route-Fibers nach Lane, Zaehlern, Fehlern, Budget-Misses, Durchschnitts- und Maximaldauer.
  - Backpressure entsteht aus Fiber-Fehlern, Deadline-Ueberschreitungen, expliziter `backpressureSignal` Metadata, Diagnostic-Signalen und Snapshot-Inputs.
  - Performance Runtime wird optional ueber `performance`, `performanceTarget`, `window.performance` oder `performanceEntries` angebunden.
  - Reporter Export laeuft ueber `xtend.fabric.telemetry.snapshot`; Reporter bleiben opt-in, der Default sendet nichts extern.
  - `ER-WP-18` ist jetzt der empfohlene Folgepfad fuer echte Loader- und Hydration-Messpunkte.

### ER-WP-17 - Performance Budget Matrix fuer Component-Profile erstellen

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - Performance-Erwartungen pro Component-Profil definieren
- Scope:
  - display
  - interactive
  - overlay
  - routing
  - form
  - media
- Zielartefakte:
  - `development/XTend-Performance-Budget-Matrix.md`
  - `development/ER-WP-17-Performance-Budget-Matrix-fuer-Component-Profile-erstellen.md`
  - Contract `xtend.performance.budget-matrix.v1`
  - Contract `xtend.performance.component-profile.v1`
  - Contract `xtend.performance.measurement.v1`
- Definition of Done:
  - neue Komponenten koennen ein Budget-Profil referenzieren
- Ergebnis:
  - abgeschlossen: `development/XTend-Performance-Budget-Matrix.md` definiert Initialbudgets fuer `display`, `interactive`, `overlay`, `routing`, `form`, `media` sowie die bestehenden Erweiterungsprofile `stateful`, `feedback` und `theme`. Messphasen, Gate-Stufen, Hydration Policies und Fabric-/RMT-Korrelation sind fuer `ER-WP-18` und `ER-WP-19` vorbereitet.

### ER-WP-18 - Loader- und Hydration-Messpunkte einfuehren

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - Kernpfade messbar machen
- Scope:
  - Manifest Load
  - Component Define
  - Hydration
  - Render
  - Route Render
- Zielartefakte:
  - Performance Marks im Loader/Fabric-Pfad
  - `development/XTend-Performance-Messpunkte-und-Snapshots.md`
  - `development/ER-WP-18-Loader-und-Hydration-Messpunkte-einfuehren.md`
  - `docs/performance-measurements.md`
  - `tests/fabric/fabric_performance_measurement_suite.js`
- Definition of Done:
  - Performance Snapshots erfassen Loader- und Hydration-Phasen
  - abgeschlossen: `xtend-loader.js` misst `xtend.loader.manifest`, `xtend.loader.module` und `xtend.component.define`. `fabric/xtend-fabric.js` misst bekannte Fiber-Kinds als `xtend.performance.measurement.v1`, und `createTelemetrySnapshot()` aggregiert `measurements` sowie `phaseSummary` fuer Loader, Hydration, Render und Route.

### ER-WP-19 - Performance Regression Suite anlegen

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - Performance-Budgets gatebar machen
- Scope:
  - JSON-Report
  - lokale deterministische Baselines
  - CI-Anschluss vorbereiten
- Zielartefakte:
  - `tests/performance/`
  - `npm run test:performance`
  - `development/XTend-Performance-Regression-Gate.md`
  - `development/ER-WP-19-Performance-Regression-Suite-anlegen.md`
  - `tests/performance/baselines/local-performance-baseline.json`
  - `docs/performance-regression.md`
- Definition of Done:
  - Budgetverletzungen erscheinen im Testreport
- Ergebnis:
  - abgeschlossen: `tests/performance/performance_regression_suite.js` wertet lokale deterministische Baselines ueber Fabric `createTelemetrySnapshot()` gegen `xtend.performance.measurement.v1` und `xtend.performance.regression-report.v1` aus.
  - `npm run test:performance` ist angebunden; Warnungen bleiben sichtbar, harte Budgetverletzungen schlagen die Suite fehl.

### ER-WP-20 - Lazy/Idle/Visible Hydration Policies haerten

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - nicht-kritische Arbeit bewusst schedulen
- Scope:
  - visible hydration
  - idle hydration
  - lazy loading
  - RMT Schedule Delegation
- Zielartefakte:
  - `development/XTend-Hydration-Policy-Contract.md`
  - `development/ER-WP-20-Lazy-Idle-Visible-Hydration-Policies-haerten.md`
  - `fabric/hydration-policy.js`
  - `tests/performance/hydration_policy_suite.js`
  - `docs/hydration-policies.md`
  - `npm run test:hydration-policy`
- Definition of Done:
  - nicht sichtbare Komponenten blockieren keine user-blocking Lane
- Ergebnis:
  - abgeschlossen: `fabric/hydration-policy.js` definiert `visible`, `idle` und `lazy` als `xtend.fabric.hydration-policy.v1`.
  - `component.lazy.hydrate` ist in `fabric/rmt-lane-mapping.js` als RMT-kompatible Idle-Schedule ergaenzt.
  - `npm run test:hydration-policy` prueft Policy-Auswahl, Backpressure-Deferral, User-Blocking-Guard und Component-Fiber-Integration.

### ER-WP-21 - Performance-Doku fuer Komponentenautoren schreiben

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - Performance-by-design fuer Component-Autoren praktisch machen
- Scope:
  - DOM-Regeln
  - Event-Regeln
  - Shadow DOM
  - Layout und Animation
- Zielartefakte:
  - `docs/performance.md`
  - `development/ER-WP-21-Performance-Doku-fuer-Komponentenautoren-schreiben.md`
  - `xtend-builder/performance/component-performance-profile.js`
  - `xtend-builder/scaffold.config.js`
- Definition of Done:
  - Scaffold und Docs referenzieren dieselbe Performance Policy
- Ergebnis:
  - abgeschlossen: `docs/performance.md` dokumentiert DOM-, Event-, Shadow-DOM-, Layout-, Animations- und Hydration-Regeln.
  - Scaffold und Blueprint referenzieren `xtend.scaffold.performance-policy.v1`.
  - Component-Dry-Runs tragen `xtendScaffoldPerformanceProfile` und `performanceProfile` im Manifest-Patch-Plan.

### ER-WP-22 - A11y Component Contract 1.0 definieren

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - A11y-by-design als Component Contract festlegen
- Scope:
  - Rolle
  - Name
  - Fokusstrategie
  - Keyboard
  - ARIA-State
  - Screenreader
- Zielartefakte:
  - `development/XTend-A11y-Component-Contract.md`
  - `development/ER-WP-22-A11y-Component-Contract-1-0-definieren.md`
  - Contract `xtend.a11y.component-contract.v1`
  - Contract `xtend.a11y.profile.v1`
  - Contract `xtend.a11y.test-contract.v1`
- Definition of Done:
  - neue Komponenten haben ein klares A11y-Profil
- Ergebnis:
  - abgeschlossen: `development/XTend-A11y-Component-Contract.md` definiert A11y-by-design fuer Rollen, zugaengliche Namen, Fokusstrategie, Keyboard, ARIA-State, Screenreader, Reduced Motion und Contrast. `ER-WP-23` ist umgesetzt; `ER-WP-24` ist startbereit.

### ER-WP-23 - Scaffold-Blueprints um A11y-Pflichten erweitern

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - A11y-Pflichten automatisch in neue Komponentenarbeit einbetten
- Scope:
  - Blueprint
  - Docs Template
  - Fixture Template
  - Test Template
- Zielartefakte:
  - aktualisierte Scaffold-Templates
  - `xtend-builder/a11y/component-a11y-profile.js`
  - `development/XTend-Scaffold-A11y-Profile-Plan.md`
  - `development/ER-WP-23-Scaffold-Blueprints-um-A11y-Pflichten-erweitern.md`
- Definition of Done:
  - Scaffold-Dry-Runs erzeugen A11y-Plan und A11y-Testpflicht
- Ergebnis:
  - abgeschlossen: Component-Dry-Runs erzeugen `xtend.a11y.profile.v1`, Source-Templates tragen `xtendScaffoldA11yProfile`, Docs/Tests/Fixtures/Types/Manifest enthalten A11y-Pflichten und `ER-WP-24` ist startbereit.

### ER-WP-24 - Browsernahe Fokus- und Keyboard-Smokes ausbauen

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - A11y-Verhalten im Browser-Kontext pruefbar machen
- Scope:
  - Tab
  - Enter
  - Space
  - Escape
  - Pfeiltasten
  - Fokusfalle
- Zielartefakte:
  - `tests/browser/fixtures/a11y-focus-keyboard-smoke.html`
  - `development/XTend-Browsernaher-Fokus-und-Keyboard-Smoke-Plan.md`
  - `development/ER-WP-24-Browsernahe-Fokus-und-Keyboard-Smokes-ausbauen.md`
  - `docs/a11y-keyboard-smokes.md`
- Definition of Done:
  - Overlay-, Routing- und Form-Komponenten haben browsernahe Fokus-/Keyboard-Smokes
- Ergebnis:
  - abgeschlossen: `tests/browser/fixtures/a11y-focus-keyboard-smoke.html` prueft `xtend.a11y.browser-keyboard-smoke.v1` fuer `x-link`/`x-router`, `x-input`/`x-form`, `x-tabs` und `x-modal`.
  - Browser- und A11y-Hydration-Gates pruefen lokale Loader-/Manifest-Nutzung, Enter, Space, Tab, Shift+Tab, Escape, Pfeiltasten, Fokusfalle, Fokusrestore und State-Synchronisierung.
  - `ER-WP-25`, `ER-WP-26` und `ER-WP-31` sind abgeschlossen; die Catalog Matrix macht A11y-Coverage nun gegen Fokus, Keyboard, Screenreader, Motion und Contrast sichtbar.

### ER-WP-25 - Screenreader-Signal-Contracts einfuehren

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - Screenreader-relevante UI-Signale als Contract pruefbar machen
- Scope:
  - `aria-live`
  - Statusregionen
  - Errorregionen
  - Announcements
- Zielartefakte:
  - `xtend.a11y.screenreader-signals.v1`
  - `a11y/screenreader-signals.js`
  - `tests/a11y/screenreader_signal_suite.js`
  - `docs/screenreader-signals.md`
  - `development/XTend-Screenreader-Signal-Contract.md`
  - `development/ER-WP-25-Screenreader-Signal-Contracts-einfuehren.md`
- Definition of Done:
  - Feedback-, Form- und Overlay-Komponenten deklarieren Screenreader-Signale
- Ergebnis:
  - abgeschlossen: `xtend.a11y.screenreader-signals.v1` normalisiert Live-Regionen, Statusregionen, Errorregionen und Announcement-Records.
  - Feedback-, Form- und Overlay-Komponenten deklarieren `xtendScreenreaderSignals`.
  - Scaffold-Source, Manifest, Fixture, Docs und Types fuehren Screenreader-Signal-Contracts mit.
  - `npm run test:screenreader-signals` ist als lokaler Gate verfuegbar.

### ER-WP-26 - Reduced-Motion und High-Contrast Regeln gatebar machen

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - Motion- und Contrast-Accessibility pruefbar machen
- Scope:
  - `prefers-reduced-motion`
  - High Contrast
  - Theme Tokens
  - Animation Policies
- Zielartefakte:
  - `xtend.a11y.motion-contrast-policy.v1`
  - `xtend.a11y.motion-policy.v1`
  - `xtend.a11y.contrast-policy.v1`
  - `a11y/motion-contrast-policy.js`
  - `tests/a11y/motion_contrast_suite.js`
  - `docs/motion-contrast.md`
  - `development/XTend-Motion-und-Contrast-Policy.md`
  - `development/ER-WP-26-Reduced-Motion-und-High-Contrast-Regeln-gatebar-machen.md`
- Definition of Done:
  - relevante Komponenten respektieren Motion- und Contrast-Policies
- Ergebnis:
  - abgeschlossen: `xtend.a11y.motion-contrast-policy.v1` normalisiert Reduced-Motion und Forced-Colors/High-Contrast als gemeinsamen Component-Contract.
  - Feedback-, Overlay-, Form- und Basis-Komponenten deklarieren `xtendMotionContrastPolicy` und enthalten gatebare `prefers-reduced-motion`- sowie `forced-colors`-CSS.
  - Scaffold-Source, Manifest, Fixture, Docs, Types und Testtemplates fuehren Motion-/Contrast-Policies mit.
  - `npm run test:motion-contrast` ist als lokaler Gate verfuegbar.

### ER-WP-27 - Security ADR fuer Loader, Manifest, Templates und Events schreiben

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - Trust Boundaries fuer dynamische XTend-Arbeit festlegen
- Scope:
  - Loader
  - Manifest
  - Dynamic Imports
  - RMT Templates
  - Parsedown Docs
  - Events
- Zielartefakte:
  - `development/ADR-XTend-Security-Trust-Boundaries.md`
  - `development/ER-WP-27-Security-ADR-fuer-Loader-Manifest-Templates-und-Events-schreiben.md`
  - `xtend.security.trust-boundaries.adr.v1`
  - `xtend.security.loader-policy.v1`
  - `xtend.security.manifest-policy.v1`
  - `xtend.security.trusted-dom-policy.v1`
  - `xtend.security.event-policy.v1`
- Definition of Done:
  - `ER-WP-28` und `ER-WP-29` koennen ohne Security-Unklarheit starten
- Ergebnis:
  - Trust Boundaries fuer Loader, Manifest, Dynamic Imports, RMT Templates, Parsedown Docs, Events, Trusted DOM und Fabric Diagnostics sind akzeptiert
  - erlaubte und verbotene DOM-Sinks sind festgelegt
  - `ER-WP-28`, `ER-WP-29` und `ER-WP-30` sind als Security-/Supply-Chain-Folgen abgeschlossen

### ER-WP-28 - Manifest- und Dynamic-Import-Policy haerten

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - Loader- und Manifest-Imports kontrolliert absichern
- Scope:
  - lokale URLs
  - Allowlist
  - Fehlerdiagnostics
  - Import Refusal
- Zielartefakte:
  - `development/XTend-Manifest-und-Dynamic-Import-Policy.md`
  - `development/ER-WP-28-Manifest-und-Dynamic-Import-Policy-haerten.md`
  - `security/manifest-import-policy.js`
  - `scripts/verify_manifest_import_policy.js`
  - `tests/security/manifest_import_policy_suite.js`
  - `docs/manifest-import-policy.md`
- Definition of Done:
  - unsichere oder externe Manifest-URLs koennen nicht still geladen werden
- Ergebnis:
  - abgeschlossen: `xtend-loader.js` validiert `data-manifest`, Manifest Fetch, Manifest Records, Component Imports und `api.js` Import gegen `xtend.security.loader-policy.v1`, `xtend.security.manifest-policy.v1` und `xtend.security.import-policy.v1`.
  - externe Manifest-/Modul-URLs, `javascript:`, `data:`, `blob:`, falsche Dateiendungen und encoded Path Traversal werden mit `xtend.security.loader.refused`, `xtend.security.manifest.invalid` oder `xtend.security.import.refused` verweigert.
  - `npm run test:manifest-policy` prueft die Policy offline und ist im Release-Gate vorbereitet.

### ER-WP-29 - Sanitizing-/Trusted-DOM-Policy fuer RMT und Docs vorbereiten

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - dynamisches Markup bewusst absichern
- Scope:
  - RMT `html_fragment`
  - Parsedown HTML-Ausgabe
  - Trusted DOM Sinks
  - Sanitizing Boundary
- Zielartefakte:
  - `development/XTend-Trusted-DOM-und-Sanitizing-Policy.md`
  - `development/ER-WP-29-Sanitizing-und-Trusted-DOM-Policy-fuer-RMT-und-Docs-vorbereiten.md`
  - `security/trusted-dom-policy.js`
  - `docs/trusted-dom-sanitizing.md`
- Definition of Done:
  - RMT und Docs-App besitzen klare Markup-Trust-Regeln
- Ergebnis:
  - abgeschlossen: RMT `html_fragment` und Parsedown HTML sind als DOM-untrusted klassifiziert, `dom_descriptor` bleibt der bevorzugte strukturierte Template-Pfad, eingeschraenkte DOM-Sinks verlangen `xtend.security.sanitizing-boundary.v1` und die Docs-App besitzt eine offizielle Trusted-DOM-Entwicklerseite.

### ER-WP-30 - Dependency-, License- und Vulnerability-Gates planen

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - Supply-Chain-Risiken fuer Release Readiness adressieren
- Scope:
  - Dependency Audit
  - License Check
  - Vulnerability Policy
  - Release Gate
- Zielartefakte:
  - `development/XTend-Supply-Chain-Gate-Plan.md`
  - `development/ER-WP-30-Dependency-License-und-Vulnerability-Gates-planen.md`
  - `security/supply-chain-gate-policy.js`
  - `scripts/verify_supply_chain_policy.js`
  - `tests/security/supply_chain_policy_suite.js`
  - `docs/supply-chain-gates.md`
- Definition of Done:
  - Release-Pipeline kann Security-/License-Gates aufnehmen
- Ergebnis:
  - abgeschlossen: Supply-Chain-Gates sind unter `xtend.security.supply-chain-gate-plan.v1`, `xtend.security.dependency-audit-gate.v1`, `xtend.security.license-policy.v1`, `xtend.security.vulnerability-policy.v1` und `xtend.security.release-supply-chain-gate.v1` dokumentiert.
  - `security/supply-chain-gate-policy.js` und `scripts/verify_supply_chain_policy.js` liefern einen lokalen Offline-Gate ohne Registry-Zugriff.
  - `npm run test:supply-chain` ist als Runner-Suite angebunden; CI-/Release-Handoff fuer `npm audit --audit-level=moderate` und `npm sbom --json` ist dokumentiert.

### ER-WP-31 - Component Catalog Coverage Matrix erzeugen

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - Manifest-Komponenten nach Reifestatus sichtbar machen
- Scope:
  - Profil
  - Docs
  - Tests
  - Fixtures
  - Types
  - A11y
  - Performance
- Zielartefakte:
  - `development/XTend-Component-Catalog-Coverage-Matrix.md`
  - `development/ER-WP-31-Component-Catalog-Coverage-Matrix-erzeugen.md`
  - `catalog/component-catalog-coverage.js`
  - `tests/catalog/component_catalog_coverage_suite.js`
  - `docs/component-catalog-coverage.md`
- Definition of Done:
  - jede Manifest-Komponente besitzt einen dokumentierten Reifestatus
- Ergebnis:
  - abgeschlossen: `xtend.catalog.component-coverage-matrix.v1`, `xtend.catalog.component-coverage-entry.v1` und `xtend.catalog.component-coverage-gate.v1` sind als maschinenlesbare Catalog-Coverage-Contracts umgesetzt.
  - `npm run test:catalog-coverage` prueft aktuell 41 Manifest-Komponenten, Source-, Docs-, Suite-, Fixture-, Types-, A11y- und Performance-Coverage sowie den Handoff an `ER-WP-32`, `ER-WP-33`, `ER-WP-34` und den Regression-Priority-Plan aus `ER-WP-35`.
  - Fortschreibung nach `WP-E10-11`: 37/37 Source, 37/37 Docs, 27/37 Component-Suites, 27/37 Fixtures, 27/37 Types, 33/37 A11y-Erkennung, 9/37 explizite Runtime-Performance-Profile und 37/37 geplante Regression-Priority-Eintraege.

### ER-WP-32 - Naming- und Doku-Luecken im Component Catalog schliessen

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - Naming Drift zwischen Manifest, Docs und Component-Dateien reduzieren
- Scope:
  - `xstate`/`x-state`
  - `xtheme`/`x-theme`
  - `x-summary`
  - `x-utils`
- Zielartefakte:
  - `development/XTend-Component-Catalog-Naming-Konvention.md`
  - `development/ER-WP-32-Naming-und-Doku-Luecken-im-Component-Catalog-schliessen.md`
  - `docs/components/xsummary.md`
  - `docs/components/xutils.md`
  - `docs/menu.json`
  - `docs/README.md`
  - `docs/components.md`
  - aktualisierte Catalog Coverage Matrix und Reference-Gates
- Definition of Done:
  - neue Komponenten folgen einer einheitlichen Benennungsregel
  - `x-summary` und `x-utils` sind dokumentiert
  - die Docs-Dimension der Catalog Coverage Matrix steht bei 28/28
- Ergebnis:
  - abgeschlossen: `xtend.catalog.naming-convention.v1` legt Manifest-Key, Custom-Element-Tag, Source-Basename, Component-Doku, Menu-Slug und Label fest.
  - `x-summary` und `x-utils` sind in `docs/components/` dokumentiert und im Docs-Menue sichtbar.
  - `npm run test:catalog-coverage` klassifiziert beide Eintraege nun als `documented`; die P0/P1-Component-Suite-Haertung ist mit `ER-WP-33` nachgezogen.

### ER-WP-33 - Component-Level-Suites fuer priorisierte Komponenten nachziehen

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - Catalog-Breite ueber echte Component-Level-Suites erhoehen
- Scope:
  - interactive
  - form
  - routing
  - media
  - theme
- Zielartefakte:
  - `development/ER-WP-33-Component-Level-Suites-fuer-priorisierte-Komponenten-nachziehen.md`
  - `tests/components/priority_component_contracts.js`
  - neue `tests/components/*.component_suite.js`
  - neue `tests/components/fixtures/*.component.html`
  - aktualisierte Component-Dokumentation fuer Input, Form, Tabs, Lightbox, Calendar und Menu
- Definition of Done:
  - priorisierte Komponenten besitzen echte Assertions, keine Platzhaltertests
- Ergebnis:
  - abgeschlossen: `node scripts/run_xtend_tests.js components` aggregiert nach `WP-E10-11` 27 Component-Level-Suites.
  - Component Catalog Coverage steht bei 27/37 Component-Suites und 27/37 Fixtures.
  - `x-router` war bereits `typed-contract-gated`; die weiteren priorisierten P0/P1-Komponenten wurden an `ER-WP-34` uebergeben.
  - Weitere Typisierung und Public Event Contracts sind in `ER-WP-34` abgeschlossen; Long-Tail- und Browser-/Performance-Regression gehen an `ER-WP-35`.

### ER-WP-34 - Types und Public Event Contracts vervollstaendigen

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - oeffentliche Component APIs typsicher dokumentieren
- Scope:
  - Attribute
  - Properties
  - Events
  - Detail Payloads
- Zielartefakte:
  - `.d.ts` Dateien fuer priorisierte Komponenten
  - `components/xtend-public-types.d.ts`
  - `tests/components/component_public_types_suite.js`
  - `docs/public-component-types.md`
  - aktualisierte Component Catalog Coverage Matrix
- Definition of Done:
  - Public Events und Attribute sind typisiert und dokumentiert
- Ergebnis:
  - abgeschlossen: 18 priorisierte Public-Type-Artefakte liegen neben den Runtime-Sources.
  - `node scripts/run_xtend_tests.js components` prueft Eventnamen, Detail Payloads, Attribute, Methoden, `HTMLElementTagNameMap` und `x-theme` Window-/Document-Events.
  - Component Catalog Coverage steht bei 27/37 Public Types.
  - 16 Komponenten sind `typed-contract-gated`; `x-theme` und `x-writer` bleiben wegen A11y-Nacharbeit `contract-gated`.

### ER-WP-35 - visuelle und browsernahe Regression priorisieren

- Prioritaet: `P2`
- Status: `completed`
- Ziel:
  - UI-Regressionsrisiken fuer high-usage-Komponenten reduzieren
- Scope:
  - visuelle Snapshots
  - Browser-Smokes
  - mobile Viewports
  - Theme-Varianten
- Zielartefakte:
  - `catalog/component-regression-priority.js`
  - `tests/catalog/component_regression_priority_suite.js`
  - `development/XTend-Visuelle-und-Browsernahe-Regression-Prioritaetsplan.md`
  - `development/ER-WP-35-Visuelle-und-browsernahe-Regression-priorisieren.md`
  - `docs/visual-browser-regression.md`
  - `npm run test:regression-priority`
- Definition of Done:
  - Core- und high-usage-Komponenten haben einen sichtbaren Regression-Plan
- Ergebnis:
  - abgeschlossen: `xtend.catalog.component-regression-priority-plan.v1`, `xtend.catalog.component-regression-priority-entry.v1` und `xtend.catalog.component-regression-priority-gate.v1` sind umgesetzt.
  - `node scripts/run_xtend_tests.js regression-priority --json` deckt nach `WP-SM-04` alle 41 Manifest-Komponenten ab und priorisiert `desktop-1280`, `mobile-390`, `light`, `dark`, `forced-colors`, `reduced-motion`, profilbasierte Browser-Smokes und Performance-Profil-Ableitung.
  - P0-Komponenten sind als `p0-browser-critical` geschnitten; `x-theme` behaelt A11y-Remediation sichtbar, waehrend `x-writer` seit `WP-E11-08` geschlossen ist; `x-utils` bleibt als nicht-Custom-Element-Integration-Probe im Long-Tail.
  - `ER-WP-36` hat lokale Gates in CI gebunden; `ER-WP-37` trennt nun schnelle PR-Gates und volle Release-Gates.

### ER-WP-36 - CI Workflow fuer Default Gates anlegen

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - lokale Gates organisatorisch verbindlich machen
- Scope:
  - `npm run test:report` als reportfaehige Vollsuite-Variante von `npm test`
  - JSON Reports
  - Artifact Upload
  - Node-Version
- Zielartefakte:
  - `.github/workflows/xtend-default-gates.yml`
  - `development/XTend-CI-Default-Gates-Workflow.md`
  - `development/ER-WP-36-CI-Workflow-fuer-Default-Gates-anlegen.md`
  - aktualisierte Dokumentation in `development/XTend-Test-Reporting-und-CI-Vorbereitung.md`
- Definition of Done:
  - Default-Gates laufen reproduzierbar in CI
- Ergebnis:
  - abgeschlossen: GitHub Actions fuehrt `npm run test:report` unter Node `26.x` aus und laedt `.xtend-test-results/xtend-test-report.json` als Artifact `xtend-test-report-node-26` hoch.
  - `package.json` fuehrt `xtend.ciDefaultGates` mit `xtend.ci.default-gates.v1`, Workflow-Pfad, Node-Version, Default-Gate, Report-Pfad und Artifact-Name.
  - `ER-WP-37` ist inzwischen abgeschlossen und hat daraus eine Gate-Matrix fuer schnelle PR-Gates, volle Release-Gates und Nightly-Ausfuehrung gemacht.

### ER-WP-37 - schnelle PR-Gates und volle Release-Gates trennen

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - Entwicklerfeedback schnell halten und Release-Gates vollstaendig machen
- Scope:
  - schnelle PR-Suite
  - volle Browser-/Performance-Suite
  - nightly oder release-only Gates
- Zielartefakte:
  - `development/XTend-CI-Gate-Matrix.md`
  - `.github/workflows/xtend-default-gates.yml`
  - `package.json` Scripts und `xtend.ciGateMatrix`
  - `development/ER-WP-37-Schnelle-PR-Gates-und-volle-Release-Gates-trennen.md`
- Definition of Done:
  - PR- und Release-Gates haben klare Verantwortlichkeiten
- Ergebnis:
  - abgeschlossen: `xtend.ci.gate-matrix.v1` trennt `pr-fast`, `full-release` und `nightly`.
  - Pull Requests fuehren `npm run test:pr:report` aus und laden `.xtend-test-results/xtend-pr-gate-report.json` als Artifact `xtend-pr-gate-report-node-26` hoch.
  - Push-, manuelle und Nightly-Laeufe fuehren `npm run test:release:full:report` aus und laden `.xtend-test-results/xtend-release-gate-report.json` als Artifact `xtend-release-gate-report-node-26` hoch.
  - `package.json` fuehrt die Gate-Matrix mit `xtend.ci.pr-fast-gate.v1`, `xtend.ci.full-release-gate.v1` und `xtend.ci.nightly-gate.v1`.
  - `ER-WP-38` hat darauf Release Checklist und SemVer Policy aufgesetzt.

### ER-WP-38 - Release Checklist und SemVer Policy schreiben

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - kontrollierte Versionierung vorbereiten
- Scope:
  - SemVer
  - Breaking Changes
  - Changelog
  - Migration Notes
- Zielartefakte:
  - `development/XTend-Release-Checklist-und-SemVer-Policy.md`
  - `development/ER-WP-38-Release-Checklist-und-SemVer-Policy-schreiben.md`
  - `package.json` Metadata `xtend.releaseChecklist`
- Definition of Done:
  - Releases koennen nach nachvollziehbarer Checkliste vorbereitet werden
- Ergebnis:
  - abgeschlossen: `xtend.release.checklist-semver-policy.v1` definiert Release-Kandidat, SemVer-Regeln, Breaking-Change-Pflichten, Candidate Gates, conditional Network Gates, Artifact Checklist, Changelog-Pflichten und Publish Boundary.
  - `package.json` spiegelt die Policy unter `xtend.releaseChecklist` mit `candidateGates`, `conditionalNetworkGates`, `artifactChecklist`, `publishBoundary` und `nextWorkpackage`.
  - `private: true` bleibt bestehen; ER-WP-38 startet keinen Publish, sondern macht Release-Kandidaten reviewbar.
  - `ER-WP-39` hat den Enterprise Adoption Guide auf dieser Policy umgesetzt.

### ER-WP-39 - Enterprise Adoption Guide schreiben

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - offiziellen Startpfad fuer Enterprise-Teams schaffen
- Scope:
  - Loader
  - Dev Server
  - Fabric
  - RMT
  - Security
  - A11y
  - Performance
- Zielartefakte:
  - `docs/enterprise-adoption.md`
  - `development/ER-WP-39-Enterprise-Adoption-Guide-schreiben.md`
  - `package.json` Metadata `xtend.enterpriseAdoption`
- Definition of Done:
  - Enterprise-Nutzung ist dokumentiert und verweist auf aktuelle Gates
- Ergebnis:
  - abgeschlossen: `docs/enterprise-adoption.md` definiert `xtend.docs.enterprise-adoption.v1` als operativen Startpfad fuer Loader, lokalen Dev Server, XTend UI, XTend-Fabric, XTendRMT, Security, A11y, Performance, CI Gates und Release Readiness.
  - `package.json` spiegelt den Guide unter `xtend.enterpriseAdoption` mit Scope, Required Gates, Publish Boundary und abgeschlossenem Paketlauf bis `ER-WP-40`.
  - Docs-App Navigation, Root README, Changelog, Referenzregister und Reference-Gate kennen den Guide.
  - `ER-WP-40` hat den Docs-App RMT Parsedown Scheduling Pilot produktnah vorbereitet.

### ER-WP-40 - Docs-App mit RMT Parsedown Scheduling pilotieren

- Prioritaet: `P2`
- Status: `completed`
- Ziel:
  - Docs-App als reales Scheduling-Beispiel fuer Parsedown + RMT vorbereiten
- Scope:
  - Parsedown bleibt Parser-Host
  - RMT plant Scheduling, Routes und Diagnostics
  - kein PHP-/Markdown-Parsing im RMT Kernel
- Zielartefakte:
  - `docs/xtendrmt-parsedown-docs.rmt`
  - aktualisierte `docs/xtendrmt-parsedown-scheduling.md`
  - `docs/index.php` mit per-page RMT Host-Metadaten
  - `docs/utils/pageloader.js` mit Render-Metadaten
  - `tests/rmt/docs_rmt_pilot_suite.js`
  - `development/ER-WP-40-Docs-App-mit-RMT-Parsedown-Scheduling-pilotieren.md`
  - `package.json` Metadata `xtend.docsRmtPilot`
- Definition of Done:
  - Docs-App belegt den framework-agnostischen Scheduling-Pfad praktisch
- Ergebnis:
  - abgeschlossen: `xtend.docs.parsedown-rmt-pilot.v1` beschreibt Parsedown-Templates, Docs-Routen, Schedules, Diagnostics und Host-Boundaries als RMT-Dokument.
  - Parsedown, PHP und Sanitizing bleiben in der Docs-App Boundary; RMT bekommt keine Parser- oder PHP-Abhaengigkeit.
  - `npm run test:docs-rmt-pilot` validiert Dokument, Host-Metadaten, Page Loader, Package Script und Docs.

## Empfohlener naechster Arbeitsschritt

Der Enterprise-Reife-Paketlauf `ER-WP-01` bis `ER-WP-40` ist abgeschlossen. Als naechstes sollte kein weiteres ER-Paket gestartet werden, sondern ein Produktreife-Checkpoint entscheiden, ob XTend zuerst in Release-Vorbereitung, Component-Catalog-Vervollstaendigung oder XTendRMT-Upstream-Ausbau geht.

Nach `WP-SM-04` liegen 39 Komponenten in `enterprise-ready`, `xstate` als nicht-visuelle Boundary-Probe in `contract-gated` und `x-utils` als Utility-Boundary in `typed-contract-gated`; Component-Suites, Fixtures und Public Types stehen bei `41/41`. `x-tabs` ist nach Performance-, Browser-, Keyboard-, ARIA- und Theme-Matrix-Haertung aus dem P0-Sonderrestpunkt heraus. `x-theme` besitzt Public Types, A11y-, Reduced-Motion-, Forced-Colors-, Performance-, Theme-Propagation- und Density-Coverage. `x-button` besitzt Public Types, Performance Profile, Interaction Budget, Fabric Measurements und RMT-Metadaten. `x-icon` besitzt Public Types, lokale Core-/Lucide-Icon-Packs, Pack Registry, A11y-/Performance-Profil und RMT-kompatible Iconography-Adapter-Metadaten. `x-menu` besitzt Public Types, Performance Profile, Keyboard Navigation, Router-Kompatibilitaet, Fabric Measurements und RMT-Metadaten. `x-surface-manager`, `x-surface-window` und `x-side-panel` besitzen Public Types, Component Suites, Fixtures, A11y-/Performance-Profile und RMT-native Multi-Window-/SidePanel-Orchestrierung. `xstate` besitzt Public Types, Boundary Suite, Fixture, Lifecycle Events, Fabric Diagnostics und einen RMT State Adapter; `x-utils` besitzt Public Types, Utility Contract, Import Policy, Fixture und Boundary Snapshot. Offen bleiben nur A11y-/Performance-Profilentscheidungen fuer `xstate` sowie die Performance-Boundary-Entscheidung fuer `x-utils`. Der Regression-Priority-Plan deckt alle 41 Manifest-Komponenten ab, die CI-Gate-Matrix laedt getrennte PR- und Release-JSON-Reports als Artifacts hoch, und Release-Kandidaten haben nun eine nachvollziehbare SemVer-, Changelog-, Migration- und Artifact-Checkliste. Manifest-/Import-Security ist mit `ER-WP-28` abgeschlossen; Supply-Chain ist mit `ER-WP-30` abgeschlossen und in ER-WP-38 als Release-Pflicht eingeordnet. Der Enterprise Adoption Guide verbindet diese Punkte als offiziellen Startpfad, und der Docs-App RMT Parsedown Pilot zeigt den Shell-first Scheduling-Pfad fuer die Dokumentations-App.

## Mindest-Gates

Jedes abgeschlossene Roadmap-Paket muss mindestens eines der folgenden Gates aktualisieren oder bewusst als nicht betroffen dokumentieren:

```bash
node --check tests/references/reference_path_suite.js
node scripts/run_xtend_tests.js references --json
node scripts/run_xtend_tests.js browser --json
node scripts/run_xtend_tests.js a11y-hydration --json
node scripts/run_xtend_tests.js fabric --json
node scripts/run_xtend_tests.js fabric-lane-mapping --json
node scripts/run_xtend_tests.js fabric-performance-measurements --json
node scripts/run_xtend_tests.js performance-regression --json
node scripts/run_xtend_tests.js hydration-policy --json
node scripts/run_xtend_tests.js catalog-coverage --json
node scripts/run_xtend_tests.js rmt-compatibility --json
npm test
```
