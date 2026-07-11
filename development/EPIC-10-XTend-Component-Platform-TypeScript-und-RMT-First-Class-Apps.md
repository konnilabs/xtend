# XTend Epic 10 - Component Platform, TypeScript und RMT First-Class Apps

- Status: Completed
- Datum: 7. Mai 2026
- Typ: Epic / Lastenheft und Planungsdokument
- Contract: `xtend.epic10.component-platform-typescript-rmt-first-class.v1`
- Bezug:
  - `development/BACKLOG-EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md`
  - `development/WP-E10-01-Epic-10-Backlog-und-Component-Maturity-Modell-anlegen.md`
  - `development/WP-E10-02-TypeScript-Source-und-Build-Strategie-entscheiden.md`
  - `development/WP-E10-03-Component-Contract-v2-fuer-TypeScript-RMT-und-Fabric-definieren.md`
  - `development/WP-E10-04-RMT-App-Authoring-Contract-fuer-vollstaendige-XTend-Apps-spezifizieren.md`
  - `development/WP-E10-05-XTend-Component-Adapter-um-Fabric-Lane-Ingestion-erweitern.md`
  - `development/WP-E10-06-Telemetry-API-Anschluss-fuer-Component-Lifecycle-standardisieren.md`
  - `development/WP-E10-11-x-tooltip-x-popover-x-drawer-implementieren.md`
  - `development/WP-E10-15-Browser-A11y-Performance-und-Visual-Gates-erweitern.md`
  - `development/WP-E10-16-Dokumentation-Guides-und-Release-Handoff-finalisieren.md`
  - `development/XTend-Overlay-Navigation-Controls-TypeScript-RMT-Contract.md`
  - `development/XTend-Epic10-Platform-Gates.md`
  - `development/XTend-Epic10-Abschluss-und-Release-Handoff.md`
  - `development/XTend-Component-Maturity-Modell-v2.md`
  - `development/XTend-TypeScript-Component-Source-Strategie.md`
  - `development/XTend-Component-Contract-v2.md`
  - `development/XTend-RMT-First-Class-App-Authoring.md`
  - `development/XTend-Fabric-Component-Compatibility-v2.md`
  - `development/XTend-Component-Lifecycle-Telemetry-Contract.md`
  - `tests/fixtures/rmt-first-class-xtend-app.rmt`
  - `tests/rmt/rmt_first_class_app_authoring_suite.js`
  - `tests/rmt/rmt_component_fabric_lane_ingestion_suite.js`
  - `tests/rmt/rmt_component_lifecycle_telemetry_suite.js`
  - `tests/platform/epic10_platform_gates_suite.js`
  - `tests/platform/epic10_release_handoff_suite.js`
  - `catalog/epic10-platform-gates.js`
  - `catalog/epic10-release-handoff.js`
  - `development/XTend-Produktreife-Checkpoint-nach-Epic-05.md`
  - `development/XTend-Enterprise-Reife-Implementierungsplan.md`
  - `development/ROADMAP-XTend-Enterprise-Reife.md`
  - `development/ADR-XTend-Fabric.md`
  - `development/XTend-Fiber-und-Lane-Contract.md`
  - `development/XTend-Fabric-RMT-Lane-Mapping.md`
  - `development/XTend-Component-Fiber-Instrumentierung.md`
  - `development/XTend-Telemetry-Snapshot-und-Backpressure-Contract.md`
  - `development/XTend-Performance-Budget-Matrix.md`
  - `development/XTend-A11y-Component-Contract.md`
  - `development/XTend-Component-Catalog-Coverage-Matrix.md`
  - `development/XTend-Component-Catalog-Naming-Konvention.md`
  - `development/XTend-Visuelle-und-Browsernahe-Regression-Prioritaetsplan.md`
  - `development/EPIC-04-XTend-Templating-Rendering-und-Framework-Erweiterung.md`
  - `development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md`
  - `development/BACKLOG-EPIC-05-XTendRMT-Bridge-und-Natives-RMT-Routing.md`
  - `development/XTendRMT-Upstream-Handoff-Spezifikation.md`
  - `docs/xtendrmt-app-dsl.md`
  - `docs/xtendrmt-overview.md`
  - `docs/xtend-fabric.md`
  - `docs/performance.md`
  - `development/docs-evidence/root/component-catalog-coverage.md`
  - `xtend-builder/typing/component-types.js`
  - `xtend-builder/generators/component-files.js`
  - `xtend-builder/scaffold.config.js`
  - `components/manifest.json`
  - `xtendrmt/rmt.schema.json`

## Ausgangslage

Nach Epic 05 und dem Enterprise-Reife-Paketlauf besitzt XTend eine belastbare Runtime-Basis:

- `xtend-loader.js` ist der kanonische lokale ESM-Loader.
- XTendRMT stellt Scheduler, Template Engine, native Routing-/Component-Domains und Adapterpfade bereit.
- XTend-Fabric ist als Error-Boundary-, Telemetry-, Fiber-, Lane- und Diagnostics-Schicht vorbereitet.
- Performance-, A11y-, Security-, Supply-Chain-, Catalog- und Browser-Smoke-Gates sind vorhanden.
- Die Docs-App nutzt einen Shell-first-RMT-Pilotpfad fuer Parsedown-Scheduling.

Der naechste Produktschritt ist nicht nur ein groesserer Komponentenbestand. XTend braucht eine konsistente Component Platform, in der neue und bestehende Komponenten:

- TypeScript-first implementiert werden koennen,
- vollstaendig aus `.rmt` Dokumenten templated, geroutet, gemountet und hydriert werden koennen,
- Fabric-kompatibel sind,
- Telemetry APIs, Fibers, Lanes und Backpressure-Signale aufnehmen koennen,
- a11y-, performance-, security- und release-gatebar bleiben.

## Leitentscheidung

Epic 10 etabliert XTend UI als TypeScript-first Component Platform mit nativem First-Class RMT Support.

Das Ziel ist, dass eine XTend-App nach Abschluss des Epics vollstaendig in RMT beschrieben werden kann:

- App Shell
- Layout
- Komponentenbaum
- Props, Attribute und Slots
- Events und Commands
- Routes und XRouter Mapping
- Hydration Policies
- Fabric Lane und Fiber Metadata
- Telemetry, Diagnostics und Performance Budgets
- A11y Profile und Screenreader-Signale

XTendRMT bleibt dabei framework-agnostisch. XTend wird First-Class Citizen ueber Adapter-, Capability-, Typing- und Metadata-Qualitaet, nicht durch Kernel-Kopplung.

## Produktziel

Nach Abschluss dieses Epics soll XTend folgende Reifestufe erreichen:

> Eine Enterprise-App kann mit XTend-Komponenten gebaut werden, waehrend die komplette App-Struktur, Routen, Templates, Hydration und Scheduler-Policies in RMT deklariert werden. Die Komponenten sind TypeScript-first, Fabric-kompatibel, telemetry-aware und ueber Scaffold, Tests, Docs und Types reproduzierbar.

## In Scope

- TypeScript-first Implementierungsmodell fuer neue Komponenten
- Migrationsstrategie fuer bestehende priorisierte Komponenten
- nativer RMT Component-, Template-, Route-, Slot-, Event- und Command-Support
- maschinenlesbare RMT-Metadaten pro Komponente
- Fabric-Compatibility Layer fuer Komponenten
- Telemetry API Anschluss fuer Mount, Hydration, Render, Update, Event und Unmount
- Lane- und Fiber-Ingestion aus RMT, Fabric und Component Metadata
- Component Maturity Framework fuer `core`, `stable`, `preview` und `experimental`
- Scaffold-Erweiterung fuer TypeScript, RMT, Fabric, A11y, Performance, Tests, Fixtures und Docs
- Component Lab als lokaler Preview- und Regression-Pfad
- Ausbau des Enterprise-Komponentenkatalogs
- Integration in lokale Gates und spaetere CI-Pfade

## Out of Scope

- harte XTend-Abhaengigkeit im RMT Kernel
- Ablage produktiver Business-App-Logik in Komponenten
- Aufgabe des framework-agnostischen RMT-Adaptermodells
- erzwungene Big-Bang-Migration aller bestehenden JavaScript-Komponenten
- externe Storybook-, CDN- oder Cloud-Pflicht fuer lokale Entwicklung
- TypeScript-only Runtime ohne generierte ESM-Artefakte fuer Browser
- neues Template-System neben RMT

## Architekturprinzipien

### 1. RMT ist das App-Authoring-Modell

RMT wird nicht nur fuer isolierte Templates genutzt. RMT soll komplette XTend-Apps beschreiben koennen. Dazu gehoeren App Shell, Routen, Komponentenbaum, Slots, Actions, Datenbindungen, Hydration und Schedule Policies.

### 2. TypeScript ist Source, ESM bleibt Runtime

Neue Komponenten werden TypeScript-first entwickelt. Die Browser-Runtime bleibt lokales ESM. Build-Artefakte muessen weiterhin ohne CDN ueber `xtend-loader.js` und `components/manifest.json` funktionieren.

### 3. Fabric ist die Component Runtime Boundary

Komponenten duerfen Lifecycle-, Render-, Event- und Error-Pfade nicht unkontrolliert ausfuehren. Fabric stellt die standardisierte Boundary fuer Diagnostics, Error Handling, Telemetry, Fibers, Lanes und Reporter bereit.

### 4. Lanes und Fibers sind deklarierbar und ingestierbar

Eine Komponente muss Lane- und Fiber-Hints aus mehreren Quellen aufnehmen koennen:

- RMT Schedule Record
- RMT Component Metadata
- Fabric Runtime Defaults
- Component Static Metadata
- Scaffold Blueprint Defaults
- Host Capability Overrides

Die Konfliktaufloesung muss dokumentiert, deterministisch und gatebar sein.

### 5. Komponenten bleiben Web Components

XTend-Komponenten bleiben native Custom Elements. RMT beschreibt und schedult sie, ersetzt sie aber nicht durch ein proprietaeres Komponentensystem.

### 6. Enterprise-Qualitaet ist Pflichtartefakt

Eine neue Komponente ist erst fertig, wenn Source, Manifest, Types, RMT Metadata, Docs, Fixture, Component Suite, A11y Profile, Performance Budget und Fabric Contract vorhanden sind.

## Zielarchitektur

### Component Source Layout

Das Zielmodell fuer neue Komponenten:

```text
components/
  x-select.js
  x-select.d.ts
src/
  components/
    x-select/
      x-select.ts
      x-select.contract.ts
      x-select.rmt.ts
      x-select.a11y.ts
      x-select.performance.ts
      x-select.test-fixture.ts
```

Die genaue Ordnerstruktur wird in einem Workpackage entschieden. Wichtig ist die Trennung:

- TypeScript Source ist fuehrend.
- ESM Runtime bleibt Browser-Artefakt.
- `.d.ts` bleibt Public Contract.
- RMT Metadata ist maschinenlesbares Component Authoring Metadata.
- Tests und Docs werden aus denselben Contracts gespeist.

### Component Metadata Contract

Jede TypeScript-first Komponente liefert einen stabilen Contract:

```ts
export interface XtendComponentContract {
  schema: 'xtend.component.contract.v2';
  tag: string;
  maturity: 'core' | 'stable' | 'preview' | 'experimental';
  adapter: 'xtend.component';
  props: XtendPropContract[];
  attributes: XtendAttributeContract[];
  slots: XtendSlotContract[];
  events: XtendEventContract[];
  state: XtendStateContract[];
  rmt: XtendRmtComponentContract;
  fabric: XtendFabricComponentContract;
  a11y: XtendA11yContract;
  performance: XtendPerformanceContract;
}
```

Dieser Contract ist zunaechst Planungsziel. Die konkrete TS-Typisierung und Generierung wird in den Workpackages festgelegt.

### RMT Component Authoring

RMT soll eine XTend-Komponente direkt beschreiben koennen:

```json
{
  "id": "form.status",
  "kind": "custom_element",
  "adapter": "xtend.component",
  "tag": "x-status",
  "props": {
    "tone": "success",
    "label": "Ready"
  },
  "slots": {
    "default": "Deployment is healthy"
  },
  "events": {
    "status-dismissed": {
      "command": "status.dismiss"
    }
  },
  "schedule": "component.visible.hydrate",
  "fabric": {
    "lane": "visible",
    "fiber": "component.hydrate",
    "telemetry": true
  },
  "a11y": {
    "role": "status",
    "live": "polite"
  }
}
```

Der RMT Kernel interpretiert dabei keine XTend-spezifische Logik. Der XTend Component Adapter uebersetzt diesen Record in Custom Element Mounting, Attribute/Property Binding, Slot-Fuellung, Event Bridge, Fabric Fiber und Telemetry.

### App Template Authoring

Eine vollstaendige XTend-App soll RMT-first aussehen:

```json
{
  "kind": "rmt_document",
  "version": "1.0",
  "adapters": [
    { "id": "xtend.component", "kind": "component" },
    { "id": "xtend.xrouter", "kind": "router" }
  ],
  "routes": [
    {
      "id": "dashboard",
      "path": "/",
      "component": "pages.dashboard",
      "schedule": "route.visible.render"
    }
  ],
  "components": [
    {
      "id": "pages.dashboard",
      "adapter": "xtend.component",
      "tag": "x-dashboard",
      "template": "dashboard.shell",
      "schedule": "component.visible.hydrate"
    }
  ],
  "templates": [
    {
      "id": "dashboard.shell",
      "kind": "dom_descriptor",
      "nodes": []
    }
  ],
  "schedules": [
    {
      "id": "component.visible.hydrate",
      "lane": "visible",
      "endpoint": "xtendrmt.component.hydrate"
    }
  ]
}
```

## Fabric- und Telemetry-Anforderungen

Komponenten muessen folgende Fabric-Anschlusspunkte bereitstellen oder ueber den Adapter erhalten:

- `component.mount`
- `component.hydrate`
- `component.render`
- `component.update`
- `component.event`
- `component.unmount`
- `component.error`

Jeder Fiber-Lauf soll optional erfassen:

- Component Tag und ID
- RMT Component ID
- Route ID
- Lane
- Fiber Kind
- Schedule ID
- Start, Ende und Dauer
- Status: `completed`, `degraded`, `failed`, `cancelled`
- Diagnostics
- Backpressure-Hints
- Performance Budget Ergebnis

## TypeScript-Anforderungen

TypeScript wird in Epic 10 nicht nur als `.d.ts` Ausgabe verstanden. TypeScript wird Source-Technologie fuer neue Komponenten und Contracts.

Mindestanforderungen:

- lokaler Build ohne CDN
- ESM-kompatible Ausgabe
- generierte oder gepflegte Public `.d.ts`
- typed Custom Events
- typed Props und Attributes
- typed RMT Metadata
- typed Fabric Hooks
- typed A11y und Performance Contracts
- Scaffold-Unterstuetzung fuer neue Komponenten

## Component Platform Scope

Epic 10 soll nicht alle denkbaren Komponenten produktiv fertigstellen. Es soll die Plattform schaffen und eine priorisierte erste Welle liefern.

### P0 Plattform-Komponenten und Contracts

- `x-select`
- `x-checkbox`
- `x-radio`
- `x-textarea`
- `x-tooltip`
- `x-popover`
- `x-drawer`
- `x-status`
- `x-skeleton`
- `x-progress`

### P1 Enterprise UI Komponenten

- `x-table`
- `x-data-grid`
- `x-pagination`
- `x-filter`
- `x-empty-state`
- `x-command-palette`
- `x-stepper`
- `x-breadcrumb`
- `x-badge`
- `x-avatar`

### P2 Tooling- und Preview-Komponenten

- `x-component-lab`
- `x-doc-preview`
- `x-rmt-inspector`
- `x-telemetry-panel`
- `x-a11y-panel`
- `x-performance-panel`

Die finale Auswahl wird im Backlog-Workpackage priorisiert.

## Workstreams

### WS1 - TypeScript Platform Foundation

Ziel: TypeScript als fuehrenden Source-Pfad fuer neue Komponenten etablieren.

Ergebnisse:

- TS Build- und Output-Strategie
- Component Source Layout
- Public Types Contract
- typed Event Contract
- Migration Guard fuer bestehende JS-Komponenten

### WS2 - RMT First-Class App Authoring

Ziel: RMT so anbinden, dass komplette XTend-Apps aus `.rmt` Dokumenten entstehen koennen.

Ergebnisse:

- RMT App Authoring Contract
- Component Tree Mapping
- Slot-, Props-, Event- und Command-Bindings
- Route- und XRouter Mapping
- Hydration Policy Mapping
- Demo-App, die keine manuelle App-Shell mehr benoetigt

### WS3 - Fabric Component Runtime

Ziel: Komponenten standardisiert an Fabric, Fibers, Lanes und Telemetry anbinden.

Ergebnisse:

- Component Fabric Adapter
- Lifecycle Boundary
- Error Boundary
- Telemetry Snapshot Integration
- Lane Ingestion und Precedence Rules
- Backpressure Signale fuer UI-Arbeit

### WS4 - Component Maturity und Catalog Ausbau

Ziel: Neue Komponenten nicht nur bauen, sondern auf Enterprise-Reife bringen.

Ergebnisse:

- Maturity Matrix 2.0
- Stable/Preview/Experimental Regeln
- Component Coverage Erweiterung
- erste P0-Komponentenwelle
- bestehende priorisierte Komponenten mit RMT/Fabric Metadata nachziehen

### WS5 - Toolset und Developer Experience

Ziel: Das Tooling erzeugt Component-Artefakte reproduzierbar.

Ergebnisse:

- `xtend-builder` TypeScript Blueprint
- RMT Metadata Generator
- Component Lab
- Preview Fixtures
- lokale Verify-Kommandos
- Docs- und Demo-Generierung

### WS6 - Regression, Docs und Release Readiness

Ziel: Die Plattform bleibt testbar und dokumentiert.

Ergebnisse:

- Browsernahe Smokes fuer RMT-first Apps
- Component-Level Suites fuer neue Komponenten
- A11y-, Performance- und Visual-Gates
- Docs fuer TypeScript, RMT Authoring, Fabric Integration und Component Maturity
- Abschlussreview und Release-Handoff

## Initiale Workpackages

| ID | Prio | Status | Titel | Ziel |
|----|------|--------|-------|------|
| `WP-E10-01` | P0 | completed | Epic-10-Backlog und Component-Maturity-Modell anlegen | Workpackages, Reifegrade und Abnahmeformat definieren |
| `WP-E10-02` | P0 | completed | TypeScript Source- und Build-Strategie entscheiden | TS als Source einfuehren, ESM als Runtime sichern |
| `WP-E10-03` | P0 | completed | Component Contract v2 fuer TypeScript, RMT und Fabric definieren | einheitlichen maschinenlesbaren Component Contract festlegen |
| `WP-E10-04` | P0 | completed | RMT App Authoring Contract fuer vollstaendige XTend-Apps spezifizieren | App Shell, Routes, Components, Templates und Schedules verbinden |
| `WP-E10-05` | P0 | completed | XTend Component Adapter um Fabric/Lane Ingestion erweitern | RMT/Fabric Lane- und Fiber-Hints in Component Lifecycle aufnehmen |
| `WP-E10-06` | P0 | completed | Telemetry API Anschluss fuer Component Lifecycle standardisieren | Mount, Hydration, Render, Update, Event und Unmount messen |
| `WP-E10-07` | P0 | completed | `xtend-builder` TypeScript Blueprint vorbereiten | neue Komponenten mit TS, RMT, Fabric, A11y und Performance Artefakten scaffolden |
| `WP-E10-08` | P1 | completed | P0-Komponentenwelle priorisieren und Contracts anlegen | erste Enterprise-Komponenten fachlich schneiden |
| `WP-E10-09` | P1 | completed | `x-select`, `x-checkbox`, `x-radio` TypeScript-first implementieren | Form Controls als Referenzlinie erstellen |
| `WP-E10-10` | P1 | completed | `x-textarea`, `x-status`, `x-progress` implementieren | Form- und Feedback-Abdeckung erhoehen |
| `WP-E10-11` | P1 | completed | `x-tooltip`, `x-popover`, `x-drawer` implementieren | Overlay- und Navigationserweiterungen liefern |
| `WP-E10-12` | P1 | completed | Component Lab und RMT Inspector Pilot anlegen | lokale Preview und RMT-Debugging ermoeglichen |
| `WP-E10-13` | P1 | completed | RMT-first Demo-App ohne manuelle Shell bauen | Volltemplate-Pfad demonstrieren |
| `WP-E10-14` | P1 | completed | Existing Component Metadata Migration fuer priorisierte Komponenten | bestehende P0/P1-Komponenten RMT/Fabric-kompatibel nachziehen |
| `WP-E10-15` | P1 | completed | Browser-, A11y-, Performance- und Visual-Gates erweitern | neue Plattformregeln testbar machen |
| `WP-E10-16` | P2 | completed | Dokumentation, Guides und Release-Handoff finalisieren | offizielle Entwicklerdokumentation nachziehen |

## Definition of Ready

Ein Workpackage aus Epic 10 darf gestartet werden, wenn:

- betroffene Komponenten, Builder-Dateien, RMT-Domains und Tests bekannt sind
- keine harte RMT-Kernel-Kopplung an XTend eingefuehrt wird
- TypeScript Source und ESM Output getrennt bleiben
- A11y-, Performance- und Security-Erwartungen benannt sind
- Fabric/Fiber/Lane-Verhalten fuer den Scope definiert ist
- ein lokales Gate oder ein bewusstes Handoff-Gate benannt ist

## Definition of Done

Epic 10 gilt als abgeschlossen, wenn:

- TypeScript-first Component Source fuer neue Komponenten produktiv nutzbar ist
- `xtend-builder` neue Komponenten mit TS, RMT Metadata, Fabric Hooks, Types, Docs, Fixtures und Tests scaffolden kann
- eine RMT-first Demo-App vollstaendig aus `.rmt` App-Struktur gerendert wird
- XTend-Komponenten RMT Component Records, Slots, Props, Events, Routes und Hydration Policies nativ aufnehmen koennen
- Fabric-Kompatibilitaet fuer Mount, Hydration, Render, Update, Event, Error und Unmount gatebar ist
- Telemetry Snapshots Component Lifecycle Daten enthalten
- Lane- und Fiber-Ingestion aus RMT und Fabric deterministisch dokumentiert ist
- mindestens die priorisierte P0-Komponentenwelle implementiert oder als bewusstes Handoff klassifiziert ist
- Docs, Tests, Browser-Smokes und Reference-Gates aktualisiert sind

## Risikoanalyse

| Risiko | Auswirkung | Gegenmassnahme |
|--------|------------|----------------|
| TypeScript wird nur `.d.ts` Nebenprodukt | keine echte Implementierungsqualitaet | TS Source als P0 Workpackage festlegen |
| RMT-Authoring bleibt Demo-Sonderfall | keine vollstaendigen RMT Apps | RMT-first Demo-App als Epic-Abnahme erzwingen |
| Fabric wird optionaler Zusatz | Telemetry und Error Boundaries bleiben lueckenhaft | Fabric Contract v2 pro Komponente gatebar machen |
| zu viele Komponenten gleichzeitig | Qualitaet sinkt | P0/P1/P2-Komponentenwelle priorisieren |
| RMT Kernel erhaelt XTend-Wissen | Framework-Agnostik bricht | Adapter Boundary als Review-Gate definieren |
| bestehende JS-Komponenten blockieren TS-Einfuehrung | Migration wird zu gross | neue Komponenten TS-first, bestehende Komponenten inkrementell migrieren |

## Entschiedene Entscheidungen aus WP-E10-02

- TypeScript Source fuer neue Komponenten liegt unter `src/components/<tag>/`.
- Lokale Browser-Artefakte bleiben unter `components/`.
- Runtime-Output bleibt ESM und wird weiterhin ueber `xtend-loader.js` sowie `components/manifest.json` geladen.
- Public Types bleiben `.d.ts` Artefakte unter `components/`.
- Core-Komponenten bekommen keine Bundler-, CDN- oder neue Runtime-Dependency-Pflicht.
- bestehende JavaScript-Komponenten bleiben ueber den Migration Guard `js-legacy`, `ts-planned`, `ts-source`, `ts-generated-esm` und `contract-only` geschuetzt.

## Entschiedene Entscheidungen aus WP-E10-03

- Component Contract v2 ist `xtend.component.contract.v2`.
- Der Builder-Anschluss liegt in `xtend-builder/typing/component-contract-v2.js`.
- Der lokale Gate heisst `component-contract-v2`.
- Pflichtdomains sind `source`, `runtime`, `publicApi`, `rmt`, `fabric`, `telemetry`, `lanes`, `a11y`, `performance`, `tests`, `docs` und `maturity`.
- Fabric-/Telemetry-Operationen sind `mount`, `hydrate`, `render`, `update`, `event`, `error` und `unmount`.
- Die RMT Boundary bleibt `no-rmt-kernel-import-of-xtend-types`.

## Entschiedene Entscheidungen aus WP-E10-04

- RMT-first XTend App Authoring traegt den Contract `xtend.rmt.first-class-app-authoring.v1`.
- Das Referenz-Fixture liegt in `tests/fixtures/rmt-first-class-xtend-app.rmt`.
- Der lokale Gate heisst `rmt-first-class-app`.
- Pflichtdomains fuer vollstaendige Apps sind `manifest`, `adapters`, `components`, `routes`, `schedules` und `templates`.
- Pflichtadapter bleiben host-neutral: `xtend.component`, `xtend.xrouter` und `rmt.state-scheduler-diagnostics`.
- Der bevorzugte Template-Modus ist `dom_descriptor`; Event-Bindings laufen als `dom-event-to-rmt-command`.
- Shell-first Rendering ist Pflicht fuer App-Shells, damit Routen, Rich Content und Lazy-Media spaeter gescheduled werden koennen.
- Die RMT Kernel Boundary bleibt `no-rmt-kernel-import-of-xtend-types`.

## Entschiedene Entscheidungen aus WP-E10-05

- Fabric/Lane-Ingestion traegt den Contract `xtend.component.fabric-lane-ingestion.v2`.
- Der produktive XTend Component Adapter bietet `resolveFabricContext(...)` zusaetzlich zu `mountComponent(...)` und `hydrateComponent(...)`.
- Der lokale Gate heisst `rmt-component-fabric-ingestion`.
- Precedence ist verbindlich: `rmt.schedule-record`, `rmt.component-metadata`, `fabric.runtime-override`, `component.static-contract`, `scaffold.blueprint-default`.
- Konflikte werden als `rmt.xtend.component.fabric_lane.conflict` diagnostiziert.
- Mount/Hydration spiegeln den Context in `result.metadata.fabric` und setzen DOM-Attribute fuer Lane, RMT-Lane, Fiber, Source und Endpoint.
- ESM- und Browser-Runtime-Artefakte bleiben paritaetisch.
- Die RMT Boundary bleibt `no-rmt-kernel-import-of-xtend-types`.

## Entschiedene Entscheidungen aus WP-E10-06

- Component Lifecycle Telemetry traegt den Contract `xtend.component.lifecycle-telemetry.v1`.
- Der lokale Gate heisst `rmt-component-lifecycle-telemetry`.
- `mountComponent(...)` und `hydrateComponent(...)` schreiben `result.metadata.telemetry`.
- Die Event Bridge erzeugt `event` Records; Render, Update, Unmount und Error laufen ueber `recordComponentTelemetry(...)`.
- Fabric Snapshots enthalten `snapshot.componentTelemetry` mit Aggregation nach Operation, Component und Lane.
- Component-Fehler, Deadline-Ueberschreitungen und explizite `backpressureSignal` Metadata koennen Backpressure-Signale erzeugen.
- Die RMT Boundary bleibt `no-rmt-kernel-import-of-xtend-types`.

## Entschiedene Entscheidungen aus WP-E10-07

- TypeScript Component Blueprint traegt den Contract `xtend.scaffold.typescript-component-blueprint.v1`.
- Der lokale Gate heisst `builder-typescript-blueprint`.
- Neue Source-of-Truth-Artefakte sind `ts-source`, `ts-contract`, `ts-rmt`, `ts-a11y`, `ts-performance` und `ts-fixture`.
- Template-IDs sind `component.ts-source`, `component.ts-contract`, `component.ts-rmt`, `component.ts-a11y`, `component.ts-performance` und `component.ts-fixture`.
- Der Component Files Generator rendert jetzt `wiring.componentContractV2`, `wiring.componentContractV2Report` und `wiring.typescript`.
- RMT Metadata bleibt eigenes TypeScript-Artefakt fuer `xtend.component` und enthaelt Fabric/Lane sowie Lifecycle Telemetry.
- Der Builder bleibt `dry-run-first`; produktiver TypeScript Compiler und automatische Writes sind nicht Teil des Pakets.
- Die RMT Boundary bleibt `no-rmt-kernel-import-of-xtend-types`.

## Entschiedene Entscheidungen aus WP-E10-08

- Die P0-Komponentenwelle traegt den Contract `xtend.epic10.p0-component-wave.v1`.
- Der lokale Gate heisst `epic10-p0-component-wave`.
- Die erste stabile Referenzlinie ist `x-select`, `x-checkbox`, `x-radio`, `x-textarea`, `x-status`, `x-progress`, `x-tooltip`, `x-popover` und `x-drawer`.
- `WP-E10-09` uebernimmt `x-select`, `x-checkbox` und `x-radio`.
- `WP-E10-10` uebernimmt `x-textarea`, `x-status` und `x-progress`.
- `WP-E10-11` uebernimmt `x-tooltip`, `x-popover` und `x-drawer`.
- Alle neun Komponenten der ersten stabilen Referenzlinie sind `ts-source`, `stable` und erfuellen `xtend.component.contract.v2`.
- Jeder Stub fordert `ts-source`, `ts-contract`, `ts-rmt`, `ts-a11y`, `ts-performance` und `ts-fixture`.
- Die RMT Boundary bleibt `no-rmt-kernel-import-of-xtend-types`.

## Entschiedene Entscheidungen aus WP-E10-09

- `x-select`, `x-checkbox` und `x-radio` sind die erste TypeScript-first Implementierungswelle.
- Runtime-Artefakte liegen lokal als ESM unter `components/xselect.js`, `components/xcheckbox.js` und `components/xradio.js`.
- Source-of-Truth-Artefakte liegen unter `src/components/x-select/`, `src/components/x-checkbox/` und `src/components/x-radio/`.
- Public Types liegen als `components/xselect.d.ts`, `components/xcheckbox.d.ts` und `components/xradio.d.ts` vor.
- Alle drei Komponenten sind form-associated, haben A11y-Profile, Performance-Profile, RMT Metadata, Lifecycle Telemetry und Fabric Boundary.
- `x-form` aggregiert die neuen Controls ueber `select-changed`, `checkbox-changed` und `radio-changed`.
- Die Component Catalog Coverage steigt auf 31 Manifest-Komponenten, 21 Component-Level-Suites, 21 Public-Type-Artefakte und 3 `enterprise-ready` Komponenten.
- Die RMT Boundary bleibt `no-rmt-kernel-import-of-xtend-types`.

## Entschiedene Entscheidungen aus WP-E10-10

- `x-textarea`, `x-status` und `x-progress` erweitern die TypeScript-first Referenzlinie um Long-Form Input und Feedback Controls.
- Runtime-Artefakte liegen lokal als ESM unter `components/xtextarea.js`, `components/xstatus.js` und `components/xprogress.js`.
- Source-of-Truth-Artefakte liegen unter `src/components/x-textarea/`, `src/components/x-status/` und `src/components/x-progress/`.
- Public Types liegen als `components/xtextarea.d.ts`, `components/xstatus.d.ts` und `components/xprogress.d.ts` vor.
- `x-textarea` ist form-associated und wird von `x-form` ueber `textarea-changed` aggregiert.
- `x-status` und `x-progress` liefern Live-Region-, Scheduler-Feedback- und Progress-Signale fuer RMT Shells.
- Die Component Catalog Coverage steigt auf 34 Manifest-Komponenten, 24 Component-Level-Suites, 24 Public-Type-Artefakte und 6 `enterprise-ready` Komponenten.
- Die RMT Boundary bleibt `no-rmt-kernel-import-of-xtend-types`.

## Entschiedene Entscheidungen aus WP-E10-11

- `x-tooltip`, `x-popover` und `x-drawer` schliessen die erste Epic-10-Komponentenwelle als Overlay-/Navigation-Controls ab.
- Runtime-Artefakte liegen lokal als ESM unter `components/xtooltip.js`, `components/xpopover.js` und `components/xdrawer.js`.
- Source-of-Truth-Artefakte liegen unter `src/components/x-tooltip/`, `src/components/x-popover/` und `src/components/x-drawer/`.
- Public Types liegen als `components/xtooltip.d.ts`, `components/xpopover.d.ts` und `components/xdrawer.d.ts` vor.
- `x-tooltip` liefert leichte Kontext-Hilfe mit `aria-describedby`, Hover/Fokus-Open und Escape-Close.
- `x-popover` liefert interaktive Anchor-Overlays mit optionalem Modal-Fokusverhalten.
- `x-drawer` liefert route-aware App-Shell-Navigation und Side Panels fuer RMT-first Apps.
- Die Component Catalog Coverage steigt auf 37 Manifest-Komponenten, 27 Component-Level-Suites, 27 Public-Type-Artefakte und 9 `enterprise-ready` Komponenten.
- Die RMT Boundary bleibt `no-rmt-kernel-import-of-xtend-types`.

## Entschiedene Entscheidungen aus WP-E10-12

- Das Component Lab traegt den Contract `xtend.epic10.component-lab-rmt-inspector.v1`.
- Der lokale Gate heisst `component-lab-rmt-inspector`.
- Das maschinenlesbare Plan-Modul liegt in `xtend-builder/preview/component-lab.js`.
- Das Shell-first RMT Fixture liegt in `tests/fixtures/rmt-component-lab-pilot.rmt`.
- Alle neun `enterprise-ready` Komponenten der ersten Epic-10-Welle sind Preview Targets.
- Der RMT Inspector zeigt `manifest`, `adapters`, `components`, `routes`, `schedules`, `templates` und `diagnostics`.
- Das Lab besitzt Panels fuer Component Preview, RMT Inspector, Telemetry, A11y, Performance und Source Links.
- Das Telemetry Panel bindet `snapshot.componentTelemetry`, `xtend.component.lifecycle-telemetry.v1` und `xtend.fabric.telemetry-snapshot.v1`.
- Das Lab bleibt lokaler Pilot, kein produktiver Lab-Server.
- Die RMT Boundary bleibt `no-rmt-kernel-import-of-xtend-types`.

## Entschiedene Entscheidungen aus WP-E10-13

- Die RMT-first Demo-App traegt den Contract `xtend.epic10.rmt-first-demo-app.v1`.
- Der lokale Gate heisst `rmt-first-demo-app`.
- Das vollstaendige App-Dokument liegt in `xtendrmt/rmt-first-demo-app.rmt`.
- Die Host-/Smoke-Fixture liegt in `tests/browser/fixtures/rmt-first-demo-app-smoke.html` und enthaelt keine statischen `x-section` oder `x-router` Shell-Tags.
- Die Demo-Runtime liegt in `xtendrmt/rmt-first-demo-app.js` und rendert `dom_descriptor` Records ohne `innerHTML`.
- Der Browser-Smoke liegt in `tests/browser/fixtures/rmt-first-demo-app-smoke.html`.
- Die Demo nutzt `dashboard`, `settings` und `overlays` als RMT-Routen.
- Alle neun Epic-10 P0-Komponenten sind in der Demo sichtbar referenziert.
- Fabric Lane, Fiber und Schedule Metadata bleiben im RMT-Dokument und werden als DOM-Diagnostik sichtbar.
- Die RMT Boundary bleibt `no-rmt-kernel-import-of-xtend-types`.

## Entschiedene Entscheidungen aus WP-E10-14

- Die Existing Component Metadata Migration traegt den Contract `xtend.epic10.existing-component-metadata.v1`.
- Der lokale Gate heisst `existing-component-metadata`.
- Das maschinenlesbare Modul liegt in `catalog/epic10-existing-component-metadata.js`.
- Die Migration Strategy lautet `js-legacy-contract-overlay-no-runtime-rewrite`.
- `x-router`, `x-link`, `x-input`, `x-form`, `x-modal`, `x-dialog`, `x-tabs`, `x-toast` und `x-alert` sind als RMT/Fabric-kompatible Contract Overlays beschrieben.
- Jede Zielkomponente bleibt `js-legacy`; es gibt keine Big-Bang-TypeScript-Migration und keine Runtime-Rewrite-Pflicht.
- Jeder Record enthaelt `xtend.component.contract.v2`, `xtend.rmt.component-contract.v1`, `xtend.component.fabric-boundary.v2`, `xtend.fabric.telemetry-snapshot.v1`, Lane Precedence und lokale Pfade.
- Die RMT Boundary bleibt `no-rmt-kernel-import-of-xtend-types`.

## Entschiedene Entscheidungen aus WP-E10-15

- Die Epic-10-Plattform-Gates tragen den Contract `xtend.epic10.platform-gates.v1`.
- Der lokale Gate heisst `epic10-platform-gates`.
- Das maschinenlesbare Modul liegt in `catalog/epic10-platform-gates.js`.
- Die Gate-Domains sind `component-contract`, `rmt-first-app`, `browser-smoke`, `a11y`, `performance`, `visual-browser-regression` und `ci-handoff`.
- Fast PR enthaelt Component Contract v2, P0 Component Wave, Component Lab, RMT-first Demo-App, Existing Component Metadata, Browser, A11y, Visual Regression und References.
- Release ergaenzt `fabric-performance-measurements`, `performance-regression` und `hydration-policy`.
- Browser-Smokes bleiben lokal und CDN-frei; `rmt-first-demo-app-smoke.html` und `a11y-focus-keyboard-smoke.html` sind Pflichtfixtures.
- Die RMT Boundary bleibt `no-rmt-kernel-import-of-xtend-types`.
- `WP-E10-16` uebernimmt Docs, Guides und Release-Handoff.

## Entschiedene Entscheidungen aus WP-E10-16

- Der Epic-10-Abschluss traegt den Contract `xtend.epic10.release-handoff.v1`.
- Der lokale Gate heisst `epic10-release-handoff`.
- Das maschinenlesbare Modul liegt in `catalog/epic10-release-handoff.js`.
- Die kanonische Component-Fabric-Boundary ist `adapter-injection-via-xtend-component-resolveFabricContext`.
- `window.XTendFabric` bleibt Host-Komfort- und Enterprise-Integrationsflaeche, aber nicht der Component-Contract.
- Die kanonische Docs-Struktur ist `development/docs-evidence/root/component-platform.md`, `docs/typescript-components.md`, `docs/rmt-first-xtend-apps.md`, `docs/epic10-platform-gates.md` und `docs/epic10-release-handoff.md`.
- Migration Notes und Release-Handoff liegen in `docs/epic10-release-handoff.md`.
- Publishing bleibt durch `private-until-release-owner-acceptance` blockiert.
- Die RMT Boundary bleibt `no-rmt-kernel-import-of-xtend-types`.

## Offene Entscheidungen

- Keine offenen Entscheidungen innerhalb von Epic 10. Next-Wave-Themen sind Long-Tail Component Runtime Migration, Performance Profile Authoring, Component Catalog Completion, Release Candidate Packaging und XTendRMT Upstream DSL Polish.

## Erwartete Handoff-Artefakte

- `development/BACKLOG-EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md`
- `development/XTend-Component-Contract-v2.md`
- `development/XTend-TypeScript-Component-Source-Strategie.md`
- `development/XTend-RMT-First-Class-App-Authoring.md`
- `development/XTend-Fabric-Component-Compatibility-v2.md`
- `development/XTend-Component-Lifecycle-Telemetry-Contract.md`
- `development/XTend-TypeScript-Component-Blueprint.md`
- `development/XTend-P0-Komponentenwelle-und-Contract-Stubs.md`
- `development/WP-E10-08-P0-Komponentenwelle-priorisieren-und-Contracts-anlegen.md`
- `development/WP-E10-09-x-select-x-checkbox-x-radio-TypeScript-first-implementieren.md`
- `development/XTend-Form-Selection-Controls-TypeScript-RMT-Contract.md`
- `development/WP-E10-10-x-textarea-x-status-x-progress-implementieren.md`
- `development/XTend-Form-Feedback-Controls-TypeScript-RMT-Contract.md`
- `development/WP-E10-11-x-tooltip-x-popover-x-drawer-implementieren.md`
- `development/XTend-Overlay-Navigation-Controls-TypeScript-RMT-Contract.md`
- `development/WP-E10-12-Component-Lab-und-RMT-Inspector-Pilot-anlegen.md`
- `development/XTend-Component-Lab-und-RMT-Inspector-Pilot.md`
- `development/WP-E10-13-RMT-first-Demo-App-ohne-manuelle-Shell-bauen.md`
- `development/XTend-RMT-First-Demo-App.md`
- `xtendrmt/rmt-first-demo-app.rmt`
- `xtendrmt/rmt-first-demo-app.js`
- `tests/browser/fixtures/rmt-first-demo-app-smoke.html`
- `tests/rmt/rmt_first_demo_app_suite.js`
- `tests/browser/fixtures/rmt-first-demo-app-smoke.html`
- `development/WP-E10-14-Existing-Component-Metadata-Migration-fuer-priorisierte-Komponenten.md`
- `development/XTend-Existing-Component-RMT-Fabric-Metadata.md`
- `catalog/epic10-existing-component-metadata.js`
- `tests/components/existing_component_metadata_migration_suite.js`
- `docs/existing-component-metadata.md`
- `development/WP-E10-15-Browser-A11y-Performance-und-Visual-Gates-erweitern.md`
- `development/XTend-Epic10-Platform-Gates.md`
- `catalog/epic10-platform-gates.js`
- `tests/platform/epic10_platform_gates_suite.js`
- `docs/epic10-platform-gates.md`
- `development/WP-E10-16-Dokumentation-Guides-und-Release-Handoff-finalisieren.md`
- `development/XTend-Epic10-Abschluss-und-Release-Handoff.md`
- `catalog/epic10-release-handoff.js`
- `tests/platform/epic10_release_handoff_suite.js`
- `docs/epic10-release-handoff.md`
- `docs/rmt-first-xtend-apps.md`
- `xtend-builder/preview/component-lab.js`
- `tests/fixtures/rmt-component-lab-pilot.rmt`
- `tests/builder/component_lab_rmt_inspector_suite.js`
- `catalog/epic10-p0-component-wave.js`
- `tests/components/epic10_p0_component_wave_suite.js`
- `tests/components/xselect.component_suite.js`
- `tests/components/xcheckbox.component_suite.js`
- `tests/components/xradio.component_suite.js`
- `tests/components/xtextarea.component_suite.js`
- `tests/components/xstatus.component_suite.js`
- `tests/components/xprogress.component_suite.js`
- `tests/components/xtooltip.component_suite.js`
- `tests/components/xpopover.component_suite.js`
- `tests/components/xdrawer.component_suite.js`
- `docs/typescript-components.md`
- `docs/rmt-first-xtend-apps.md`
- `development/docs-evidence/root/component-platform.md`
- `docs/epic10-release-handoff.md`
- `docs/component-lab.md`
- `docs/en/rmt-first-demo-app.md`
- `docs/existing-component-metadata.md`
- lokale Tests fuer Component Contract v2, RMT App Authoring, Fabric Ingestion, TypeScript Blueprint, P0 Component Wave, Component Suites und Catalog Coverage

## Startempfehlung

`WP-E10-01` bis `WP-E10-16` sind abgeschlossen. Epic 10 ist fachlich und testseitig abnahmefaehig.

Die erste Epic-10-Komponentenwelle ist produktiv im Catalog sichtbar, das Component Lab kann sie lokal inspizieren, die RMT-first Demo-App rendert ohne manuelle Shell-Sonderlogik, bestehende Kernkomponenten besitzen RMT/Fabric Metadata Overlays, `WP-E10-15` verbindet diese Linie mit Browser-, A11y-, Performance- und Visual-Gates, und `WP-E10-16` finalisiert Docs, Guides, Migration Notes und Release-Handoff.
