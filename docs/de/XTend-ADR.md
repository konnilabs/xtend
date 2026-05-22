# XTend Architecture Decision Record

- Status: Accepted
- Datum: 8. Mai 2026
- Contract: `xtend.docs.architecture-decision-record.v2`
- Typ: Produktarchitektur-Baseline fuer XTend UI, XTend-Fabric und XTendRMT

## Zweck

Dieses ADR ersetzt die fruehere Architekturaufnahme aus den ersten Epics. Die alte Fassung beschrieb noch eine Plattform im Umbau: Core-Konsolidierung, Loader-Rename, RMT-Fusion, Test-Harness und Component-Coverage waren damals teilweise erst Zielbild.

Die heutige Entscheidung beschreibt den aktuellen Architekturvertrag fuer XTend als Enterprise-Webframework:

- XTend UI ist das Web-Component- und UI-Builder-Produkt.
- XTendRMT ist Scheduler, Runtime-Kernel, Templating Engine und native `.rmt` Authoring-Sprache.
- XTend-Fabric ist die host-nahe Schutz-, Telemetry-, Lane- und Reporter-Schicht.
- Die Docs-App ist eine XTend-App mit RMT-generierter Shell und Parsedown als scheduled Content-Komponente.
- RMT Tooling, Linter und Language Server sind Teil der Authoring-Plattform.

## Entscheidung

XTend wird als **manifest- und state-zentriertes Web-Components-Framework** mit RMT-first App Authoring, Fabric Boundary und TypeScript-first Component Platform weitergefuehrt.

Dokumentation, Manifest und Laufzeit-APIs muessen kuenftig als zusammengehoerender Vertrag gepflegt werden.

Die Architektur trennt bewusst fuenf Verantwortungen:

| Ebene | Verantwortung | Darf wissen von | Darf nicht tun |
|-------|---------------|-----------------|----------------|
| XTend UI | Custom Elements, Shells, Styling, A11y, UX und Host-Komponenten | Manifest, Loader, Component Contracts, Fabric Context | RMT-Kernel-Semantik implementieren |
| XTend Loader | lokale ESM-Imports, Manifest Policy, Bootstrap, Component Loading | Manifest, Import Policy, Runtime API | CDN-Fallbacks erzwingen oder externe Quellen still laden |
| XTend-Fabric | Fehlergrenzen, Telemetry, Reporter Adapter, Fibers, Lanes, Backpressure | XTend Runtime, optionale RMT Adapter Results | RMT-Dokumente parsen oder XTendRMT ersetzen |
| XTendRMT | `.rmt` Source, DSL-Domains, Scheduling, Templates, Routes, Diagnostics | neutrale Adapter Records und Host Capabilities | XTend, XRouter, DOM, React, Vue oder `xstate` direkt importieren |
| Tooling | Linter, LSP, Snippets, Reports, Editor Bridges | RMT Source Model, Parser, Rule Engine, Schema | eigene Semantik neben dem RMT-Sprachkern pflegen |

## Architekturprinzipien

### 1. Native Web Standards bleiben der Kern

XTend basiert auf Custom Elements, Shadow DOM, Slots, CSS Custom Properties und ES-Modulen. Build- und TypeScript-Artefakte duerfen diese Laufzeit nicht hinter einem proprietaeren Abstraktionsmodell verstecken.

Komponenten sind weiterhin echte Web Components. Framework-Integrationen fuer React, Vue oder Custom Hosts entstehen als Adapter oder Host-Konventionen, nicht als Ersatz fuer die native Oberflaeche.

### 2. State-zentrierte UI

`xstate` bleibt die host-nahe State-Boundary fuer XTend UI. Der State ist die beobachtbare Wahrheit fuer UI-Zustaende, Route-Spiegel, Theme-Kontext, Feedback, Komponentenzustaende und Diagnostics.

Das **Digital Twin Principle** bleibt verbindlich: relevante UI-Aktionen muessen in einen nachvollziehbaren State-, Event- oder Diagnostic-Record zurueckschreiben. Lokale Flags duerfen nur abgeleitete Render-Caches sein.

### 3. RMT-first, aber framework-agnostisch

Neue App-Shells, Routes, Templates und Scheduling-Policies sollen primaer in nativen `.rmt` Dokumenten beschrieben werden. `.rmt.json` bleibt nur ein Edge-Case-Fallback fuer Hosts ohne passenden MIME-Typ oder fuer Legacy-Pfade.

RMT ist trotzdem kein XTend-Untermodul. XTend ist First-Class Host, aber nicht Pflicht-Host. Der RMT-Kernel sieht Adapter-Records wie `xtend.component` oder `xtend.xrouter`, importiert aber keine XTend-Komponenten und fuehrt keine DOM-Arbeit selbst aus.

### 4. Shell-first Rendering

App-Shells sollen zuerst stabil rendern. Content, Markdown, Rich HTML, Medien und schwere Komponenten werden anschliessend scheduled oder lazy nachgeladen.

Die Docs-App ist der Referenzpfad: RMT erzeugt die Shell, Parsedown ist eine scheduled Content-Komponente. Spaetere Inhalte wie XPlayer-Tutorials oder Rich-Content-Bloecke koennen in dieselbe Scheduling-Struktur aufgenommen werden.

### 5. Fabric als Sicherheits- und Telemetry-Schicht

XTend-Fabric ist der globale Host-Sicherheitslayer fuer Fehlergrenzen, Reporter Adapter, Telemetry, Lane/Fiber-Kontext, Backpressure und Qualitaetssignale.

Fabric darf RMT Adapter Results und Scheduler-Signale aufnehmen, aber nicht den RMT-Kernel ersetzen. Dadurch bleibt die Grenze klar:

```text
RMT Kernel -> Adapter / Bridge Result -> XTend-Fabric -> XTend UI / Reporter
```

### 6. Performance-by-design

Performance ist kein spaeter Optimierungsschritt. Komponenten muessen ihre Hydration-, Visibility-, Idle-, Busy- und Measurement-Profile deklarieren. Loader, Fabric und RMT duerfen diese Profile fuer Scheduling und Diagnostics verwenden.

Die akzeptierten Baselines sind:

- lokales ESM statt CDN-Abhaengigkeit
- manifestbasierte Import Policy
- Lazy, Idle und Visible Hydration Policies
- Performance Regression Gates
- Component-level Performance Profiles
- Shell-first Rendering fuer App-Erstaufbau

### 7. A11y-by-design

A11y ist Teil des Component Contracts. Neue Komponenten muessen Keyboard-Verhalten, Focus, ARIA, Screenreader-Signale, Reduced Motion, Contrast und sichtbare States als Produktoberflaeche behandeln.

RMT darf A11y-relevante Shell- und Component-Metadaten beschreiben. Die konkrete Ausfuehrung bleibt bei XTend UI und den Host-Adaptern.

### 8. Tooling ist Teil des Produkts

RMT ist nicht nur Runtime-Format, sondern Authoring-Sprache. Deshalb gehoeren Linter, AI-Agent Repair Report, Snippets, LSP, Editor Bridges und Release Gates zur Plattform.

Der Language Server nutzt dieselbe Semantik wie `xt rmt lint`; Editor-Integrationen duerfen keine zweite RMT-Regelwelt pflegen.

## Systembild

```text
App / Host
  |
  | local ESM + manifest policy
  v
XTend Loader
  |
  +-- XTend UI Components
  |     +-- x-router / x-link
  |     +-- x-header / x-menu / x-icon / x-hero / ...
  |     +-- form, feedback, overlay, media and layout components
  |
  +-- xstate / xtheme / api.js
  |
  +-- XTend-Fabric
        |
        +-- telemetry, fibers, lanes, reporter adapters
        |
        +-- optional RMT adapter results

XTendRMT
  |
  +-- .rmt source model
  +-- templates, routes, components, schedules, adapters
  +-- linter, language server, snippets, diagnostics
  |
  +-- host adapters: xtend.component, xtend.xrouter, docs.parsedown, custom hosts
```

## Laufzeitentscheidungen

### Loader und Manifest

Der kanonische Loader ist `xtend-loader.js`. Er arbeitet lokal, ESM-basiert und manifestgesteuert. Externe CDNs sind kein Normalpfad. Manifest-URLs und Component-Imports unterliegen der Import Policy.

### Komponenten

Komponenten folgen dem Component Contract v2 und der Epic-11-UX-Shell-Linie:

- TypeScript-first Source, wenn neue Komponenten entstehen
- Public Types
- RMT Metadata
- Fabric Boundary
- A11y- und Performance-Profil
- Component Fixture
- Component Suite
- Docs-Seite

`x-icon` ist der Referenzfall fuer eine framework-agnostische Erweiterung: internes Core Icon Pack, lokale Lucide-Erweiterung, Pack Registry und RMT-kompatibler Adapter ohne CDN-Pflicht.

### Routing

`x-router` bleibt die XTend-UI-Routing-Komponente. RMT kann Routes deklarieren und ueber den `xtend.xrouter` Adapter an XRouter uebergeben. Seitentitel, Route-Metadaten und shell-nahe Navigation duerfen in RMT beschrieben werden.

### Docs-App

Die Docs-App ist nicht nur Dokumentation, sondern ein Produktbeispiel. Sie soll zeigen:

- Shell-first Rendering mit RMT
- Parsedown als scheduled Content-Komponente
- stabile Navigation mit `x-router`
- Quick Start, RMT Authoring, Linter und LSP als offizielle Developer Journey
- keine App-spezifische Parallel-Logik, wenn eine fehlende Faehigkeit in XTend-Komponenten gehoert

## Non-Goals

Diese Entscheidung bedeutet ausdruecklich nicht:

- XTend wird zu einem React-/Vue-Ersatz mit eigenem virtuellen DOM.
- RMT wird an XTend gebunden.
- Fabric wird zum Parser, Router oder Scheduler-Kernel.
- `.rmt.json` wird als bevorzugtes Authoring-Format beworben.
- Editor-Plugins duerfen eigene RMT-Semantik einfuehren.
- Komponenten duerfen A11y oder Performance als optionale spaetere Politur behandeln.

## Konsequenzen

1. Neue Architekturarbeit muss zuerst einer Ebene zugeordnet werden: Loader, XTend UI, Fabric, RMT, Tooling oder Docs.
2. Wenn XTend-spezifisches Verhalten in RMT gebraucht wird, entsteht ein Adapter-Contract, kein Kernel-Sonderfall.
3. Wenn eine App Sonderlogik braucht, wird zuerst geprueft, ob eine generische Component-, Fabric- oder RMT-Faehigkeit fehlt.
4. Neue Dokumentation muss native `.rmt` Dateien empfehlen. `.rmt.json` darf nur als Fallback beschrieben werden.
5. Jede neue First-Class-Komponente braucht RMT-, Fabric-, A11y-, Performance-, Type- und Testabdeckung.
6. Release- und Reference-Gates bleiben Teil des Architekturvertrags.

## Verbindliche Gates

Die Architektur-Baseline wird durch lokale Gates abgesichert:

```bash
node scripts/run_xtend_tests.js architecture
node scripts/run_xtend_tests.js references --json
node scripts/run_xtend_tests.js rmt-compatibility --json
node scripts/run_xtend_tests.js epic14-lsp-handoff --json
npm run test:release:full:report
```

Fuer gezielte Arbeit bleiben die spezialisierten Gates massgeblich:

| Bereich | Gate |
|---------|------|
| Core Architektur | `node scripts/run_xtend_tests.js architecture` |
| Component Catalog | `npm run test:catalog-coverage` |
| RMT Tooling | `npm run test:rmt-tooling` |
| LSP Handoff | `npm run test:epic14-lsp-handoff` |
| Docs Referenzen | `node scripts/run_xtend_tests.js references --json` |

## Akzeptierte Folgeentscheidungen

Dieses ADR integriert die Ergebnisse der bisherigen Einzelentscheidungen:

- Loader und lokale Entwicklung: `xtend.loader.local-development.adr.v1`
- XTend-Fabric: `xtend.fabric.adr.v1`
- Security Trust Boundaries: `xtend.security.trust-boundaries.adr.v1`
- XTendRMT First-Class Fusion: `development/ADR-XTendRMT-First-Class-Fusion.md`
- RMT Tooling und LSP Handoff: `xtend.epic14.lsp-handoff.v1`

Die Einzel-ADRs bleiben als Detailquellen gueltig. Dieses Dokument ist die aktuelle Docs-App-Baseline fuer das Gesamtbild.

## Fazit

XTend ist heute kein loses Komponentenpaket mehr, sondern eine gekoppelte Plattform aus Web Components, Loader, State, Fabric, RMT und Authoring Tooling.

Der wichtigste Produktpfad ist jetzt nicht mehr die reine Flaechenerweiterung, sondern die konsequente Reife dieser Plattform: native `.rmt` Authoring-Erfahrung, bessere Editor-Unterstuetzung, stabile Component Shells, A11y, Performance, Security und nachvollziehbare Release Gates.
