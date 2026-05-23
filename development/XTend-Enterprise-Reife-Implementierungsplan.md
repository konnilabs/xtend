# XTend Enterprise-Reife Implementierungsplan

- Status: Implementierungsplan fuer Enterprise Readiness
- Datum: 5. Mai 2026
- Contract: `xtend.enterprise-readiness.implementation-plan.v1`
- Ausgangspunkt: `development/XTend-Produktreife-Checkpoint-nach-Epic-05.md`
- Zielreife: kontrollierte Enterprise Adoption fuer XTend UI + XTendRMT
- Pflichtleitplanken:
  - Loader wird von `xtend-dev.js` auf eine produktneutrale Loader-Oberflaeche migriert.
  - CDN ist kein Default- oder Testpfad mehr; Entwicklung und Tests laufen ueber einen lokalen Server.
  - ES6-/ESM-Module bleiben Basistechnologie fuer Loader, Komponenten, XTendRMT und zukuenftige Module.
  - XTend bekommt eine globale Sicherheits-, Telemetry- und Error-Boundary-Schicht: `XTend-Fabric`.
  - Performance-by-design und A11y-by-design sind Pflicht fuer neue Komponenten.

## Executive Summary

XTend ist nach Epic 05 architektonisch weit genug, um in Richtung Enterprise Grade zu gehen. Die naechsten Schritte duerfen nicht primar neue Widgets erzeugen. Sie muessen den Produktkern industrialisieren: lokale Entwicklung statt CDN, reproduzierbare Distribution, ein stabiler Loader, Telemetry und Error Boundaries, Performance Budgets, Accessibility Contracts, Security Boundaries, CI Gates und breite Component-Catalog-Haertung.

Der Zielzustand ist:

- XTend UI ist ein lokal entwickelbares, ESM-basiertes Web Component Framework.
- XTendRMT bleibt framework-agnostischer Scheduler und Templating Kernel.
- XTend-Fabric ist die Host-Schicht, die XTend UI mit RMT-Scheduler-Telemetrie, UI-Lanes, Component-Fibers, Error Reporting und Enterprise-QS-Hooks verbindet.
- Neue Komponenten koennen nur noch ueber Scaffold-, Test-, A11y-, Performance- und Documentation-Gates produktiv werden.

## Nicht verhandelbare Architekturentscheidungen

### 1. Loader-Migration weg von `xtend-dev.js`

`xtend-dev.js` darf nicht die dauerhafte Produktoberflaeche bleiben. Der Dateiname markiert "Development" und transportiert die falsche Erwartung fuer produktive Apps.

Ziel:

- neuer kanonischer Loader: `xtend-loader.js`
- optionaler ESM Entry: `xtend-loader.esm.js`, falls Build-/Packaging-Schritt dies erfordert
- `xtend-dev.js` wird nach einer kurzen Migrationsphase entfernt oder als bewusst markierter Legacy-Stub aus dem Default-Gate genommen
- alle automatisierten Demo- und Browser-Fixtures nutzen den neuen Loader
- Tests duerfen nicht mehr auf den alten Namen assertieren

Migrationsregel:

- P0-Phase: neuen Loader neben altem Loader einfuehren und Tests auf neuen Loader umstellen
- P1-Phase: Legacy-Demos migrieren oder als `manual-legacy` mit explizitem Verfallsdatum markieren
- Release-Phase: `xtend-dev.js` aus Default-Demos, Docs und Scaffolds entfernen

### 2. CDN-Entkopplung und lokaler Entwicklungsserver

CDN-Pfade duerfen nicht mehr als Default-Fallback fuer Core, API, Komponenten, Tests oder Demos dienen.

Ziel:

- `components/manifest.json` bleibt repo-lokal und enthaelt lokale Modulpfade
- `api.js` entfernt CDN-Fallbacks fuer Core-Komponenten
- Komponenten wie `xplayer.js` importieren `xstate` lokal oder ueber den Loader-/Fabric-Resolver
- Historische Root-HTML-Demos werden dekommissioniert; neue HTML-Smokes liegen unter `tests/browser/fixtures/`
- lokaler Server wird offizieller Development- und Testpfad

Vorgeschlagene Entry Points:

```bash
npm run dev:local
npm run test:browser:local
node scripts/serve_xtend_dev.js
```

Server-Pflichten:

- statische Auslieferung aus dem Repo-Root
- MIME Types fuer `.js`, `.mjs`, `.css`, `.json`, `.html`, `.wasm` vorbereiten
- keine externe Netzwerkannahme
- optionaler Import-Map-Support nur fuer lokale Alias-Aufloesung
- Port `0` fuer Test-Harness, konfigurierbarer Port fuer menschliche Entwicklung

### 3. XTend-Fabric als globale Sicherheits- und Telemetry-Schicht

XTend-Fabric ist die neue Host-Schicht oberhalb von XTend-Komponenten und unterhalb von App-spezifischem Code. Sie ist kein Ersatz fuer XTendRMT. Sie ist der sichere Adapter- und Sugar-Layer, der XTend UI in Enterprise-Kontexten betreibbar macht.

Contract:

- API-Name: `@xtend-fabric`
- Contract Namespace: `xtend.fabric.*`
- Browser Namespace: `window.XTendFabric`
- spaeterer Package Export: `@xtend-fabric/core` und `@xtend-fabric/browser`, sofern Packaging eingefuehrt wird

Pflichten:

- Lifecycle-Fehler in Komponenten abfangen
- Render-, Event-, Hydration- und Disconnect-Fehler strukturiert melden
- Diagnostics aus XTendRMT konsumieren und in UI-nahe Events uebersetzen
- Reporter-Adapter fuer Enterprise QS vorbereiten
- defaultmaessig ohne externes Error Reporting laufen
- Privacy-, Sampling- und Redaction-Regeln vorsehen
- keine XTendRMT-Kernel-Abhaengigkeit von XTend erzeugen

### 4. Telemetry-driven UI Scheduling mit Fibers und Lanes

XTendRMT hat Scheduler-, Diagnostics- und Performance-Budgeting-Surfaces. XTend muss diese nicht duplizieren, sondern ueber Fabric in UI-Arbeit uebersetzen.

Begriffe:

- Fiber: eine nachvollziehbare Einheit von UI-Arbeit, z.B. Component Mount, Hydration, Render, Event Handler, Route Render, Theme Apply oder A11y Announcement.
- Lane: priorisierte Ausfuehrungsschiene fuer UI-Arbeit, gemappt auf RMT Schedule Policies und Browser-Zeitfenster.

Mindest-Lanes:

- `user-blocking`: Eingabe, Fokus, Navigation, Dialog-Interaktion
- `visible`: sichtbare Mount-/Render-Arbeit
- `transition`: Route- und UI-Uebergaenge
- `idle`: nicht sichtbare Hydration oder Prefetch
- `background`: Cache-, Preview- oder Doku-nahe Arbeit
- `diagnostics`: Telemetry, Snapshots und Reporting
- `a11y`: Screenreader-Announcements, Fokusreparatur und ARIA-State-Korrektur

Ziel:

- jede wichtige XTend UI Operation kann als Fiber mit Lane, Budget, Scope, Component Ref und Diagnostics-Korrelation beschrieben werden
- Fabric kann Fibers lokal ausfuehren oder an RMT Scheduler Endpoints delegieren
- RMT bleibt Kernel-neutral und kennt nur Schedule-, Adapter- und Diagnostics-Records

### 5. Performance-by-design

Performance wird nicht als spaeteres Tuning verstanden, sondern als Contract.

Pflichten:

- Performance Budget pro Component-Profil
- Hydration-Strategie pro Component-Profil
- keine unbounded DOM-Scans im Default-Pfad ohne Budget und Messpunkt
- keine globalen Layout-Thrash-Schleifen
- lazy/visible/idle Hydration fuer nicht kritische Components
- Performance Marks fuer Loader, Manifest, Component Load, Hydration, Render und Route Render
- Regression Gate fuer definierte Kernpfade

### 6. A11y-by-design

A11y ist Pflichtoberflaeche neuer Komponenten.

Pflichten:

- jedes neue Component-Profil deklariert Rolle, Name, Fokusstrategie, Keyboard-Verhalten und ARIA-State
- Screenreader-relevante Komponenten nutzen `aria-live`, `role`, `aria-modal`, `aria-expanded`, `aria-selected`, `aria-controls` oder entsprechende Alternativen bewusst
- Scaffold generiert A11y-Abschnitte und Testpflichten
- Tests pruefen Fokus, Tastatur, sichtbare Labels und Screenreader-Signale statisch oder browsernah
- Performance- und Animation-Features beachten `prefers-reduced-motion`

## Zielbild 1.0

| Bereich | Zielzustand Enterprise 1.0 |
|---------|----------------------------|
| Loader | `xtend-loader.js` als lokale, ESM-basierte Standardoberflaeche; kein CDN Default |
| Dev Server | repo-lokaler HTTP-Server fuer Entwicklung, Demos und Browser-Smokes |
| Fabric | `@xtend-fabric` API fuer Error Boundaries, Telemetry, Fibers, Lanes und Reporter |
| Scheduler | XTend UI Arbeit wird ueber Fabric in RMT Schedule Lanes uebersetzbar |
| Performance | Budgets, Marks, Snapshots und Regression-Gates fuer Kernpfade |
| A11y | Scaffold-, Component- und Browser-Gates erzwingen A11y-by-design |
| CI | lokale Gates werden in CI reproduzierbar ausgefuehrt |
| Distribution | Package-Exports, SemVer, Changelog und Release-Artefakte sind definiert |
| Security | Trust Boundaries fuer Manifest, Template, Markdown, Events und Dynamic Imports |
| Component Catalog | alle priorisierten Manifest-Komponenten besitzen Component-Level-Contracts |

## Workstreams

### WS1 - Runtime Loading, Local Development und Distribution

Ziel: XTend wird lokal und reproduzierbar konsumierbar, ohne CDN Default.

Arbeitspakete:

| ID | Prio | Titel | Ergebnis |
|----|------|-------|----------|
| `ER-WP-01` | P0 | Loader-Contract und Rename-ADR fuer `xtend-loader.js` erstellen | verbindliche Loader-Namens- und Migrationsentscheidung |
| `ER-WP-02` | P0 | `xtend-loader.js` als kanonischen ESM-Loader einfuehren | neuer Loader laedt Manifest, Core, Preload und API lokal |
| `ER-WP-03` | P0 | CDN-Fallbacks aus Core-Pfaden entfernen | `api.js`, Komponenten und Default-Demos nutzen lokale Pfade |
| `ER-WP-04` | P0 | lokalen Dev-/Test-Server produktisieren | `npm run dev:local` und browsernahe Tests nutzen denselben Server |
| `ER-WP-05` | P1 | Demo- und Fixture-Pfade auf neuen Loader migrieren | Default-Demos assertieren nicht mehr auf `xtend-dev.js` |
| `ER-WP-06` | P1 | Package-Export- und Release-Strategie festlegen | ESM Exports, Browser Bundle, SemVer, Changelog, Provenance |

Definition of Done:

- kein Default-Gate laedt `xtend-dev.js`
- kein Default-Gate benoetigt `https://cdn.ccs-networks.de`
- `node scripts/run_xtend_tests.js browser --json` laeuft ueber lokalen Server
- Docs nennen lokalen Loader und lokalen Server als Standard

### WS2 - XTend-Fabric, Error Boundaries und Enterprise Hooks

Ziel: XTend bekommt eine sichere Host-Schicht fuer Betrieb, QS und Telemetry.

Arbeitspakete:

| ID | Prio | Titel | Ergebnis |
|----|------|-------|----------|
| `ER-WP-07` | P0 | XTend-Fabric ADR und API Surface definieren | `@xtend-fabric` Contract, Browser Namespace, Reporter Boundary |
| `ER-WP-08` | P0 | Fabric Runtime Skeleton implementieren | `createXtendFabric`, `wrapComponent`, `runFiber`, `emitDiagnostic` |
| `ER-WP-09` | P0 | Component Lifecycle Error Boundary einfuehren | Fehler in `connectedCallback`, `render`, Events, Hydration und Disconnect werden gefangen |
| `ER-WP-10` | P1 | Reporter Adapter Contract vorbereiten | Noop, Console, Test Reporter und spaeter Enterprise Reporter |
| `ER-WP-11` | P1 | Fabric an `xstate`, API und XTendRMT Diagnostics anbinden | einheitliche Correlation IDs und Diagnostics Events |

Definition of Done:

- Fabric funktioniert ohne externen Dienst
- jeder Reporter ist opt-in
- Fehler werden strukturiert mit Component, Fiber, Lane, Phase und Severity gemeldet
- XTendRMT bleibt framework-agnostisch

### WS3 - Telemetry-driven Scheduler Integration mit Fibers und Lanes

Ziel: XTend UI Arbeit wird als planbare, messbare und optimierbare Einheiten gefuehrt.

Arbeitspakete:

| ID | Prio | Titel | Ergebnis |
|----|------|-------|----------|
| `ER-WP-12` | P0 | Fiber- und Lane-Contract spezifizieren | `xtend.fabric.fiber.v1` und `xtend.fabric.lane.v1` |
| `ER-WP-13` | P0 | Lane Mapping auf RMT Schedules definieren | Mapping zu `user-blocking`, `visible`, `transition`, `idle`, `background`, `diagnostics`, `a11y` |
| `ER-WP-14` | P1 | Component Mount/Hydration als Fibers instrumentieren | Component-Arbeit wird messbar und schedulable |
| `ER-WP-15` | P1 | Route Render und XRouter Navigation als Fibers instrumentieren | Navigation bekommt Correlation und Budgets |
| `ER-WP-16` | P1 | Telemetry Snapshots und Backpressure Signale integrieren | Fabric kann Scheduler-Entscheidungen datengetrieben vorbereiten |

Definition of Done:

- jede Fiber hat `id`, `kind`, `componentRef`, `lane`, `phase`, `startedAt`, `durationMs`, `result`, `diagnostics`
- Lane-Entscheidungen sind testbar und dokumentiert
- Scheduling kann lokal simuliert und ueber RMT delegiert werden

### WS4 - Performance-by-design

Ziel: Performance wird Gate, nicht Bauchgefuehl.

Arbeitspakete:

| ID | Prio | Titel | Ergebnis |
|----|------|-------|----------|
| `ER-WP-17` | P0 | Performance Budget Matrix fuer Component-Profile erstellen | Budgets fuer display, interactive, overlay, routing, form, media |
| `ER-WP-18` | P0 | Loader- und Hydration-Messpunkte einfuehren | Marks fuer manifest, load, define, hydrate, render, route |
| `ER-WP-19` | P1 | Performance Regression Suite anlegen | lokale Budget-Auswertung mit JSON-Report |
| `ER-WP-20` | P1 | Lazy/Idle/Visible Hydration Policies haerten | Fabric/RMT Scheduling steuert nicht-kritische Arbeit |
| `ER-WP-21` | P1 | Performance-Doku fuer Komponentenautoren schreiben | klare Regeln fuer DOM, Shadow DOM, Layout und Events |

Definition of Done:

- neue Komponenten brauchen ein Performance-Profil
- Kernpfade erzeugen Performance Snapshots
- Budget-Verletzungen werden im Testbericht sichtbar

### WS5 - A11y-by-design und Screenreader-Reife

Ziel: Accessibility ist Teil des Component Contracts.

Arbeitspakete:

| ID | Prio | Titel | Ergebnis |
|----|------|-------|----------|
| `ER-WP-22` | P0 | A11y Component Contract 1.0 definieren | Rollen, Namen, Fokus, Keyboard, ARIA und Screenreader-Pflichten |
| `ER-WP-23` | P0 | Scaffold-Blueprints um A11y-Pflichten erweitern | neue Komponenten bekommen A11y-Plan, Tests und Docs |
| `ER-WP-24` | P1 | Browsernahe Fokus- und Keyboard-Smokes ausbauen | Fokusfalle, Escape, Tab, Enter, Space, Pfeiltasten |
| `ER-WP-25` | P1 | Screenreader-Signal-Contracts einfuehren | `aria-live`, Announcements, Status- und Error-Regionen |
| `ER-WP-26` | P1 | Reduced-Motion und High-Contrast Regeln gatebar machen | Theme und Motion werden zuganglich |

Definition of Done:

- neue Component-Level-Suites pruefen A11y-Verhalten passend zum Profil
- Docs-Komponenten enthalten Accessibility-Abschnitte mit konkreten Erwartungen
- A11y-Verletzungen koennen nicht still in den Catalog gelangen

### WS6 - Security, Trust Boundaries und Supply Chain

Ziel: XTend verarbeitet dynamische Module, Templates und Markdown bewusst abgesichert.

Arbeitspakete:

| ID | Prio | Titel | Ergebnis |
|----|------|-------|----------|
| `ER-WP-27` | P0 | Security ADR fuer Loader, Manifest, Templates und Events schreiben | Trust Boundary und erlaubte Sinks sind festgelegt |
| `ER-WP-28` | P1 | Manifest- und Dynamic-Import-Policy haerten | lokale URLs, Allowlist und Fehlerdiagnostics |
| `ER-WP-29` | P1 | Sanitizing-/Trusted-DOM-Policy fuer RMT und Docs vorbereiten | Parsedown und `html_fragment` bekommen Boundary-Regeln |
| `ER-WP-30` | P1 | Dependency-, License- und Vulnerability-Gates planen | Release-Gates fuer Supply Chain |

Definition of Done:

- keine unbewussten HTML-/Script-Sinks in neuen Core-Pfaden
- CDN-Entkopplung ist Security- und Reproduzierbarkeitsentscheidung
- RMT-Templating bleibt authoring-stark, aber nicht blind vertrauend

### WS7 - Component Catalog Completion

Ziel: der Manifest-Katalog wird breit, reproduzierbar und testbar.

Arbeitspakete:

| ID | Prio | Titel | Ergebnis |
|----|------|-------|----------|
| `ER-WP-31` | P0 | Component Catalog Coverage Matrix erzeugen | alle Manifest-Komponenten mit Profil, Status, Test, Docs, A11y, Types |
| `ER-WP-32` | P0 | Naming- und Doku-Luecken im Component Catalog schliessen | `x-summary`, `x-utils` und Manifest-/Docs-Konvention geklaert |
| `ER-WP-33` | P1 | Component-Level-Suites fuer priorisierte Komponenten nachziehen | mindestens interactive, form, routing, media |
| `ER-WP-34` | P1 | Types und Public Event Contracts vervollstaendigen | jede oeffentliche Komponente hat Types |
| `ER-WP-35` | P2 | visuelle und browsernahe Regression priorisieren | Core- und high-usage-Komponenten zuerst |

Definition of Done:

- jede Manifest-Komponente hat einen sichtbaren Reifestatus
- neue Komponenten koennen nicht ohne Tests, Docs, Types und A11y-Plan landen

### WS8 - CI/CD, Release und Enterprise Dokumentation

Ziel: lokale Reife wird organisatorisch verbindlich.

Arbeitspakete:

| ID | Prio | Titel | Ergebnis |
|----|------|-------|----------|
| `ER-WP-36` | P0 | CI Workflow fuer Default Gates anlegen | `npm test`, Reports und Artifact Upload |
| `ER-WP-37` | P1 | schnelle PR-Gates und volle Release-Gates trennen | Core schnell, Browser/Performance voll |
| `ER-WP-38` | P1 | Release Checklist und SemVer Policy schreiben | Versionierung und Breaking-Change-Prozess |
| `ER-WP-39` | P1 | Enterprise Adoption Guide schreiben | Loader, Dev Server, Fabric, RMT, Security, A11y, Performance |
| `ER-WP-40` | P2 | Docs-App perspektivisch mit RMT Parsedown Scheduling pilotieren | Docs-App wird selbst XTendRMT-Beispiel |

Definition of Done:

- Enterprise-User finden einen offiziellen Startpfad
- Release-Qualitaet ist nicht nur lokal, sondern in CI reproduzierbar
- Docs beschreiben den aktuellen Produktstand, nicht historische Demo-Pfade

## Priorisierte Roadmap

### Phase 0 - Architekturfreeze fuer Enterprise-Reife

Ziel: Entscheidungen festzurren, bevor Code verschoben wird.

Pflichtpakete:

- `ER-WP-01`
- `ER-WP-07`
- `ER-WP-12`
- `ER-WP-17`
- `ER-WP-22`
- `ER-WP-27`

Exit-Kriterien:

- Loader-Zielname ist entschieden
- Fabric API Surface ist entschieden
- Fiber/Lane-Vokabular ist entschieden
- Performance- und A11y-Pflichten sind fuer Scaffold anschlussfaehig
- Security Trust Boundary ist entschieden

### Aktueller Workpackage-Stand nach ER-WP-40

Der Dokumentations-Check vom 7. Mai 2026 bestaetigt folgenden Roadmap-Stand:

| Status | Workpackages |
|--------|--------------|
| `completed` | `ER-WP-01`, `ER-WP-02`, `ER-WP-03`, `ER-WP-04`, `ER-WP-05`, `ER-WP-06`, `ER-WP-07`, `ER-WP-08`, `ER-WP-09`, `ER-WP-10`, `ER-WP-11`, `ER-WP-12`, `ER-WP-13`, `ER-WP-14`, `ER-WP-15`, `ER-WP-16`, `ER-WP-17`, `ER-WP-18`, `ER-WP-19`, `ER-WP-20`, `ER-WP-21`, `ER-WP-22`, `ER-WP-23`, `ER-WP-24`, `ER-WP-25`, `ER-WP-26`, `ER-WP-27`, `ER-WP-28`, `ER-WP-29`, `ER-WP-30`, `ER-WP-31`, `ER-WP-32`, `ER-WP-33`, `ER-WP-34`, `ER-WP-35`, `ER-WP-36`, `ER-WP-37`, `ER-WP-38`, `ER-WP-39`, `ER-WP-40` |
| `ready` | - |
| `next` | - |

Damit ist Phase 0 als Architekturfreeze fachlich abgeschlossen, der kanonische Loader ist umgesetzt, der lokale Dev-/Test-Server ist produktiv, die Core-CDN-Entkopplung ist abgeschlossen, Demo-/Fixture-Pfade sind formal auf den neuen Loader beziehungsweise explizite Spezial-Smokes klassifiziert, die Package-Export- und Release-Strategie ist vorbereitet, der Fabric Runtime-Kern steht mit produktiver Component Lifecycle Error Boundary, Reporter Adapter Contract, Runtime Diagnostics Bridge, Component Mount/Hydration Fiber Instrumentierung, Route Navigation/Render Fiber Instrumentierung, Telemetry Snapshots, Backpressure-Signalen, Loader-/Hydration-Performance-Messpunkten, lokalem Performance Regression Gate, Lazy/Idle/Visible Hydration Policies und Performance-Autorenpolicy, Fabric-Lanes sind auf RMT Schedule Records gemappt, neue Scaffold-Komponenten erhalten Performance- und A11y-Profile, browsernahe Fokus-/Keyboard-Smokes sind fuer Routing, Overlay, Form/Input und Tabs gatebar, Screenreader-Signal-Contracts sind fuer Live-Regionen, Statusregionen, Errorregionen und Announcements gatebar, Reduced-Motion- und High-Contrast-Policies sind als `xtend.a11y.motion-contrast-policy.v1` gatebar, die Manifest-/Dynamic-Import-Policy ist technisch im Loader und als lokaler Gate umgesetzt, die Trusted-DOM-/Sanitizing-Boundary fuer RMT und Docs ist dokumentiert, Supply-Chain-Gates sind lokal gatebar vorbereitet, die Component Catalog Coverage Matrix ist als `xtend.catalog.component-coverage-matrix.v1` gatebar, die Catalog-Naming-Konvention ist als `xtend.catalog.naming-convention.v1` akzeptiert. Nach `WP-SM-04` liegen 39 Komponenten als `enterprise-ready` vor; `xstate` ist als nicht-visuelle Boundary-Probe `contract-gated`; `x-utils` ist als Utility-Boundary `typed-contract-gated`; Component-Suites, Fixtures und Public Types stehen bei 41/41, A11y-Coverage bei 40/41, Performance-Profile bei 39/41. `x-tabs` ist zusaetzlich in Browser-Smoke und Theme-Matrix gehaertet, `x-theme` ist als A11y-/Motion-/Contrast-/Performance-/Density-/Propagation-Provider geschlossen, `x-button` ist als Performance-/Interaction-Budget-Basisbutton geschlossen, `x-icon` ist als lokaler Iconography Adapter mit Core Pack, lokalem Lucide Superset, Pack Registry und RMT-kompatiblem Contract geschlossen, `x-menu` ist als Performance-/Keyboard-/Routing-Navigation geschlossen, `x-surface-manager`, `x-surface-window` und `x-side-panel` sind als native Multi-Window- und SidePanel-Surface-Schicht geschlossen, `xstate` besitzt Suite, Fixture, Public Types, Lifecycle Events, Fabric Diagnostics und einen RMT State Adapter, und `x-utils` besitzt Utility Contract, Import Policy, Fixture und Public Types. Mit `xtend.catalog.component-regression-priority-plan.v1` sind Long-Tail-, Browser-, Mobile-, Theme- und Performance-Regression jetzt fuer alle 41 Manifest-Komponenten priorisiert. Mit `xtend.ci.default-gates.v1` laufen die Default-Gates nun in GitHub Actions unter Node `26.x`; mit `xtend.ci.gate-matrix.v1` sind PR-Fast-Gates, Full-Release-Gates und Nightly-Ausfuehrung getrennt. Mit `xtend.release.checklist-semver-policy.v1` sind Release-Kandidaten, SemVer, Breaking Changes, Migration Notes, Candidate Gates, conditional Network Gates, Artifacts und Publish Boundary nachvollziehbar beschrieben. Mit `xtend.docs.enterprise-adoption.v1` ist der offizielle Enterprise Adoption Guide fuer Loader, Dev Server, XTend UI, Fabric, RMT, Security, A11y, Performance, CI und Release Readiness dokumentiert. Mit `xtend.docs.parsedown-rmt-pilot.v1` ist die Parsedown-basierte Docs-App als Shell-first RMT Scheduling Pilot modelliert: `docs.app.shell` und `docs.header.search` werden aus RMT-Descriptoren gerendert, waehrend Parsedown, PHP und Sanitizing ausserhalb des RMT Kernels bleiben. Der Enterprise-Reife-Paketlauf ist damit fachlich abgeschlossen.

### Phase 1 - Lokale Runtime und Loader-Migration

Ziel: kein Enterprise-Pfad basiert mehr auf CDN oder `xtend-dev.js`.

Pflichtpakete:

- `ER-WP-02`
- `ER-WP-03`
- `ER-WP-04`
- `ER-WP-05`

Exit-Kriterien:

- `index.html`, Browser Fixtures und Docs nutzen `xtend-loader.js`
- `api.js` hat keine CDN-Fallbacks
- `npm run dev:local` ist dokumentiert
- Reference- und Browser-Gates pruefen lokale Pfade

### Phase 2 - Fabric Runtime und Scheduler-Telemetry

Ziel: XTend bekommt eine Enterprise-faehige Betriebs- und Optimierungsschicht.

Pflichtpakete:

- `ER-WP-08`
- `ER-WP-09`
- `ER-WP-10`
- `ER-WP-11`
- `ER-WP-13`
- `ER-WP-14`
- `ER-WP-15`
- `ER-WP-16`

Exit-Kriterien:

- Component-Lifecycle-Fehler werden nicht mehr unstrukturiert verloren
- UI-Arbeit ist als Fiber messbar
- Lane Mapping zu RMT Schedules ist testbar
- Reporter koennen ohne Produktcode-Refactor angeschlossen werden

### Phase 3 - Performance und A11y Gates

Ziel: Performance-by-design und A11y-by-design werden echte Gates.

Pflichtpakete:

- `ER-WP-18`
- `ER-WP-19`
- `ER-WP-20`
- `ER-WP-21`
- `ER-WP-23`
- `ER-WP-24`
- `ER-WP-25`
- `ER-WP-26`

Exit-Kriterien:

- neue Komponenten haben Performance- und A11y-Profile
- Browser-Smokes pruefen Fokus- und Keyboard-Flows
- Performance-Berichte koennen in CI aufgenommen werden

### Phase 4 - Security, Catalog und Release Readiness

Ziel: Produktisierung fuer reale Organisationen.

Pflichtpakete:

- `ER-WP-28`
- `ER-WP-29`
- `ER-WP-30`
- `ER-WP-31`
- `ER-WP-32`
- `ER-WP-33`
- `ER-WP-34`
- `ER-WP-36`
- `ER-WP-37`
- `ER-WP-38`
- `ER-WP-39`

Exit-Kriterien:

- Component Catalog hat messbare Coverage
- CI fuehrt die Default-Gates verbindlich aus
- Release- und Security-Dokumentation ist vorhanden

## Konkrete Codebase-Todos aus dem Iststand

Diese Punkte sind aus der aktuellen Codebase ableitbar und muessen in Phase 1 oder 4 behandelt werden:

- `xtend-dev.js` in `xtend-loader.js` ueberfuehren.
- `index.html` als einzigen Root-HTML-Einstieg halten und Browser-Smokes unter `tests/browser/fixtures/` gatebar machen.
- Historische Root-HTML-Demos entfernen statt weiter als Legacy-CDN-Demos zu pflegen.
- `api.js` darf nicht mehr direkt von `https://cdn.ccs-networks.de/xtend/components/xstate.js` importieren.
- `api.js` darf fuer `xtheme` keinen CDN-Fallback mehr nutzen.
- `components/xplayer.js` darf `xstate` nicht mehr vom CDN importieren.
- Browser-Smoke-Assertions in `tests/browser/browser_smoke_suite.js` auf `xtend-loader.js` und lokale Serverpflicht umstellen.
- `components/manifest.json` und Scaffold-Wiring muessen lokale Loader- und Manifest-Policies als Pflicht ausweisen.
- Dokumentation muss lokale Entwicklung als Default zeigen.
- Legacy-Demos mit CDN-Assets muessen im Reference-Registry bewusst klassifiziert bleiben.

## Akzeptanzkriterien fuer Enterprise-Reife 1.0

XTend erreicht Enterprise-Reife 1.0, wenn:

- kein Default-Flow CDN benoetigt
- `xtend-loader.js` die einzige kanonische Loader-Oberflaeche ist
- `XTend-Fabric` Fehler, Telemetry, Fibers, Lanes und Reporter Contracts bereitstellt
- RMT Scheduler und XTend UI ueber Adapter/Fabric gekoppelt sind, nicht ueber Kernel-Sonderfaelle
- Performance Budgets und A11y Contracts im Scaffold verankert sind
- Component Catalog Coverage fuer priorisierte Komponenten messbar ist
- CI fuehrt lokale Gates reproduzierbar aus
- Release-, Security- und Enterprise-Adoption-Dokumentation existiert

## Risiko- und Debt-Kontrolle

| Risiko | Gegenmassnahme |
|--------|----------------|
| Loader-Rename bricht Demos | Zwei-Phasen-Migration mit Reference-Gate und expliziter Legacy-Klassifikation |
| Fabric wird zu schwer | Minimaler Core, Reporter und Scheduler-Anschluss als Adapter, kein Pflicht-Backend |
| Telemetry erzeugt Privacy-Risiko | Redaction, Sampling, opt-in Reporter, keine externen Ziele im Default |
| Performance-Gates werden flaky | statische Budgets + lokale deterministic snapshots zuerst, echte Browser-Budgets spaeter staffeln |
| A11y bleibt Dokumentation ohne Durchsetzung | Scaffold-Pflichten, Component-Level-Tests und Browser-Smokes verbinden |
| RMT wird XTend-spezifisch | Fabric/Adapter Boundary strikt halten, Kernel sieht nur Schedules und Diagnostics |

## Empfohlene naechste Epics

### EPIC 06 - Enterprise Runtime, Loader und Local Development

Scope:

- `xtend-loader.js`
- lokaler Dev Server
- CDN-Entkopplung
- Packaging-/Export-Entscheidung
- Docs- und Test-Migration

Startpakete: `ER-WP-01`, `ER-WP-02`, `ER-WP-03`, `ER-WP-04`, `ER-WP-05` und `ER-WP-06` sind abgeschlossen. EPIC 06 ist fachlich vollstaendig: Loader-Rename, lokaler Server, CDN-Entkopplung, Demo-/Fixture-Migration sowie Package-Export- und Release-Strategie stehen.

### EPIC 07 - XTend-Fabric, Telemetry und UI Scheduler Lanes

Scope:

- `@xtend-fabric`
- Error Boundary
- Reporter Adapter
- Fibers
- Lanes
- RMT Scheduler Mapping

Startpakete: `ER-WP-07`, `ER-WP-08`, `ER-WP-09`, `ER-WP-10`, `ER-WP-11`, `ER-WP-12`, `ER-WP-13`, `ER-WP-14`, `ER-WP-15`, `ER-WP-16`, `ER-WP-18`, `ER-WP-19`, `ER-WP-20`, `ER-WP-21`, `ER-WP-25`, `ER-WP-26`, `ER-WP-31`, `ER-WP-32`, `ER-WP-33`, `ER-WP-34`, `ER-WP-35`, `ER-WP-36`, `ER-WP-37`, `ER-WP-38`, `ER-WP-39` und `ER-WP-40` sind abgeschlossen. Operativer Folgeschritt ist ein Produktreife-Checkpoint.

### EPIC 08 - Performance und A11y by Design

Scope:

- Performance Budgets
- Hydration Policies
- Performance Regression Gate
- A11y Component Contract
- Screenreader- und Keyboard-Smokes

Startpakete: `ER-WP-17`, `ER-WP-18`, `ER-WP-19`, `ER-WP-20`, `ER-WP-21`, `ER-WP-22`, `ER-WP-23`, `ER-WP-24`, `ER-WP-25`, `ER-WP-26`, `ER-WP-31`, `ER-WP-32`, `ER-WP-33`, `ER-WP-34`, `ER-WP-35`, `ER-WP-36`, `ER-WP-37`, `ER-WP-38`, `ER-WP-39` und `ER-WP-40` sind abgeschlossen. Operativer Folgeschritt ist ein Produktreife-Checkpoint.

### EPIC 09 - Catalog, Security und Release Readiness

Scope:

- Component Catalog Coverage
- Security ADR
- Supply Chain Gates
- CI/CD
- Release und Enterprise Adoption Guides

Startpakete: `ER-WP-27`, `ER-WP-28`, `ER-WP-29`, `ER-WP-30`, `ER-WP-31`, `ER-WP-32`, `ER-WP-33`, `ER-WP-34`, `ER-WP-35`, `ER-WP-36`, `ER-WP-37`, `ER-WP-38`, `ER-WP-39` und `ER-WP-40` sind abgeschlossen. Der Docs-App RMT Parsedown Scheduling Pilot ist umgesetzt; der naechste Schritt ist keine weitere ER-Paketnummer, sondern ein Release-/Produktreife-Checkpoint.

## Mindest-Gates waehrend der Umsetzung

```bash
node --check tests/references/reference_path_suite.js
node scripts/run_xtend_tests.js references --json
node scripts/run_xtend_tests.js browser --json
node scripts/run_xtend_tests.js fabric-lane-mapping --json
node scripts/run_xtend_tests.js rmt-compatibility --json
npm test
```

Neue Runtime-Arbeit an Loader, Fabric, Scheduler, Performance oder A11y muss mindestens `core`, `architecture`, `browser`, `a11y-hydration`, `fabric`, `fabric-lane-mapping`, `references` und `rmt-compatibility` beruehren oder explizit begruenden, warum ein Gate nicht betroffen ist.
