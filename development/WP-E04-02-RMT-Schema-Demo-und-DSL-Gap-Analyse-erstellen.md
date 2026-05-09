# WP-E04-02 - RMT-Schema-, Demo- und DSL-Gap-Analyse erstellen

- Status: `completed`
- Datum: 4. Mai 2026
- Epic: `development/EPIC-04-XTend-Templating-Rendering-und-Framework-Erweiterung.md`
- Backlog: `development/BACKLOG-EPIC-04-XTendRMT-DSL-Templating-und-Kompatibilitaetsvorbereitung.md`
- Bezug:
  - `development/WP-E04-01-Produktmodell-Scope-und-RMT-Templating-Zielbild-festlegen.md`
  - `development/ADR-XTendRMT-First-Class-Fusion.md`
  - `development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md`
  - `xtendrmt/rmt.schema.json`
  - `xtendrmt/xtendrmt-bestcase-demo.rmt`
  - `xtendrmt/xtendrmt-bestcase-demo.js`
  - `xtendrmt/rmt-core.d.ts`
  - `tests/references/reference_path_suite.js`

## Ziel

`WP-E04-02` analysiert den aktuellen RMT-Iststand gegen das Epic-04-Zielmodell. Das Paket prueft, welche Teile bereits als neutrale RMT-Domaenen vorhanden sind, welche heute noch ueber `manifest.metadata` oder Demo-Code laufen und welche Arbeit bewusst an upstream XTendRMT und Epic 05 uebergeben werden muss.

## Analysierte Artefakte

| Artefakt | Befund |
|----------|--------|
| `xtendrmt/rmt.schema.json` | definiert ein `rmt_document` mit Top-Level `templates`, Manifest, Template Props, Bindings, Slots, Hydration und Error Boundary |
| `xtendrmt/xtendrmt-bestcase-demo.rmt` | nutzt Top-Level `templates`, legt `adapters`, `components`, `routes` und `schedules` aber in `manifest.metadata` ab |
| `xtendrmt/xtendrmt-bestcase-demo.js` | extrahiert Metadata-Domaenen, baut daraus `x-route` Elemente, spiegelt Status nach `xstate` und ruft RMT Scheduling ueber `scheduleEndpoint` auf |
| `xtendrmt/rmt-core.d.ts` | enthaelt Host-, Root-, Scheduler-, Template- und Performance-Typen, aber keinen konkreten XTend Component Adapter oder XRouter Adapter |

## Messbarer Iststand

Aus dem aktuellen Schema:

- Top-Level Properties: `$schema`, `kind`, `version`, `documentId`, `namespace`, `loaderHint`, `sourceUrl`, `manifest`, `templates`
- Schema-Definitionen: `metadata`, `templateMode`, `bindingKind`, `slotKind`, `hydrationMode`, `ownershipMode`, `documentManifest`, `templateRef`, `props`, `bindings`, `slots`, `hydration`, `errorBoundary`, `template`
- Required Top-Level: `kind`, `version`, `manifest`, `templates`

Aus der Bestcase-Demo:

- `1` Host Adapter Record in `manifest.metadata.adapters`
- `4` Component Records in `manifest.metadata.components`
- `5` Route Records in `manifest.metadata.routes`
- `4` Schedule Records in `manifest.metadata.schedules`
- `4` Template Records in `templates`

## Zentrale Gap-These

RMT besitzt bereits starke Template-, Hydration-, Root- und Scheduler-Grundlagen. Fuer das Epic-04-Zielbild fehlen aber native App-DSL-Domaenen oberhalb von `templates`.

Heute gilt:

- `templates` ist eine echte Top-Level-Domain.
- `adapters`, `components`, `routes` und `schedules` existieren in der Demo nur als freie Metadata.
- Die Demo beweist den Produktpfad, ist aber noch kein stabiler Contract.
- XRouter-Aufbau und XTend-Ausfuehrung liegen in Demo-Code, nicht in einem wiederverwendbaren Adapter.

Das ist fuer Epic 04 als Analysebasis akzeptabel. Fuer Epic 05 darf es nicht als Architekturquelle stehen bleiben.

## Gap-Matrix

| Domain | Aktueller Ort | Kernel-Wissen | Fehlender DSL-Record | Host-Adapter-Ausfuehrung |
|--------|---------------|---------------|----------------------|--------------------------|
| `templates` | Top-Level `templates` im Schema | Template ID, Mode, Markup, Props, Bindings, Slots, Hydration, Error Boundary | keine neue Top-Level-Domain noetig, aber bessere Authoring-Ergonomie fuer Component-Komposition | Template in Host-Ziel rendern, Slots fuellen, Events verdrahten |
| `adapters` | `manifest.metadata.adapters` in Demo | nur abstrakte Host Capabilities und Adapter-ID | native Top-Level `adapters` Domain mit Capability-Schema | Adapter registrieren, Capabilities validieren, Host API anbinden |
| `components` | `manifest.metadata.components` in Demo | generische Component Definition, Adapter-ID, optional Schedule-Referenz | native Top-Level `components` Domain mit `kind`, `adapter`, `tag`, `props`, `slots`, `events`, `hydration` | XTend Manifest Lookup, Custom Element laden, instanziieren, mounten, hydrieren |
| `routes` | `manifest.metadata.routes` in Demo | neutrale Route ID, Path, Title, Component/Template-Refs, Schedule-Ref | native Top-Level `routes` Domain ohne XRouter-DOM-Struktur | XRouter Adapter baut `x-route` oder direkte Route-Registrierung |
| `schedules` | `manifest.metadata.schedules` in Demo | Schedule Policy, Endpoint, Lane, Priority, Budget, Coalescing | native Top-Level `schedules` Domain mit referenzierbaren Policies | Runtime ruft `scheduleEndpoint` oder kompatible Host-Scheduler-Ausfuehrung auf |
| `actions` | teilweise Template Bindings und Demo-Controls | abstrakte Commands und Root Events | spaetere Top-Level `actions` Domain fuer wiederverwendbare Commands | XTend API, DOM Events oder Host Commands ausfuehren |
| `data` | nicht nativ, nur Template Sources/Metadata | abstrakte Model-/Data-Refs | spaetere Top-Level `data` Domain fuer Modelle, Loader und Fetch-Policies | Host holt Daten, normalisiert Model und spiegelt optional State |
| `roots` | RMT Core Types, Demo DOM Host | Root ID, Ownership, Hydration Boundary | explizite Root/Target-Records oder Host Capability fuer Root Lifecycle | DOM Target suchen, Root mounten, unmounten, diagnostizieren |

## Demo-Logik: schon Adapterarbeit oder Metadata-Ausweichpfad?

| Demo-Bereich | Bewertung | Folge |
|--------------|-----------|-------|
| `loadDemoDocument()` liest `manifest.metadata.adapters/components/routes/schedules` | Metadata-Ausweichpfad | `WP-02` markiert diese Domaenen als upstream Top-Level-Kandidaten |
| `buildRoutesFromDocument()` erzeugt `x-route` Elemente | Adapterarbeit | Epic 05 soll daraus `xtend.xrouter` Adapterlogik machen |
| `navigateWithRmt()` setzt `xstate` und Hash-Route | Adapterarbeit plus Demo-Komfort | Route-Sync gehoert spaeter in XRouter Adapter und State Bridge |
| `runScheduled()` ruft `runtime.scheduleEndpoint(...)` mit Policy-Daten | tragfaehiger Scheduler-Handschlag | `WP-05` kann daraus abstrakte Endpoint-Regeln ableiten |
| `refreshDemoUi()` visualisiert Metadata-Domaenen | Demo-Diagnostics | spaeter optional Diagnostics Adapter, kein Kernel-Contract |
| `registerDocumentWithRuntime()` nutzt RMT Template API | tragfaehiger RMT-Kernpfad | bleibt als neutraler Dokumentregistrierungs-Pfad relevant |

## Domain-Priorisierung fuer Epic 04

| Prioritaet | Domain | Warum |
|------------|--------|-------|
| P0 | `components` | XTend UI wird nur First-Class, wenn Component Records sauber beschreibbar sind |
| P0 | `templates` | RMT ist der kanonische XTend-Templating-Pfad |
| P0 | `adapters` | Framework-Agnostik braucht explizite Host-Capabilities statt Kernel-Sonderfaelle |
| P1 | `schedules` | Scheduler-Handshakes muessen abstrakt bleiben und XTend-Arbeit planen koennen |
| P1 | `routes` | XRouter-Routen muessen vorbereitet werden, produktive Route-Domain folgt aber Epic 05 |
| P2 | `actions`, `data`, `roots` | wichtig fuer DSL-Reife, aber nach Component/Template/Adapter/Handshake ableitbar |

## Entscheidungen aus WP-02

1. Epic 04 behandelt `adapters`, `components`, `routes` und `schedules` als Ziel-Domaenen, implementiert sie aber nicht produktiv in den RMT Kernel.
2. `manifest.metadata` bleibt fuer Demo und Regression akzeptiert, wird aber als Ausweichpfad markiert.
3. `components` und `templates` sind die ersten fachlichen Inputs fuer `WP-03` und `WP-04`.
4. `routes` werden in Epic 04 nur neutral vorbereitet; produktive native RMT Routes und XRouter Adapter bleiben Epic 05.
5. Scheduler-Daten der Demo sind ausreichend konkret, um in `WP-05` einen abstrakten Scheduler-Handshake zu standardisieren.
6. Die Gap-Matrix trennt ab sofort drei Verantwortungen: Kernel-Wissen, DSL-Record und Host-Adapter-Ausfuehrung.

## Input fuer WP-03

`WP-03` soll aus dieser Analyse den XTend Component Contract ableiten:

- `id`
- `kind`
- `adapter`
- `tag`
- `props`
- `attributes`
- `slots`
- `events`
- `hydration`
- `schedule`
- `diagnostics`

Verbindliche Grenze: Der RMT Kernel darf daraus keine XTend-Tags, keine XTend-Manifeststruktur, keine `xstate`-Keys und keine XRouter-Klassen importieren.

## Input fuer WP-04

`WP-04` soll das RMT Template Authoring Model fuer XTend UI beschreiben:

- Templates bleiben Top-Level-Domain.
- Component-Refs und Slot-Refs werden als Authoring-Mechanik vorbereitet.
- HTML-Fragmente bleiben zulaessig, aber die langfristige DSL muss weniger Markup-String-lastig werden.
- Verschachtelte XTend-Komponenten brauchen klare Slot- und Component-Kompositionsregeln.

## Input fuer Epic 05

Diese Punkte werden bewusst an Epic 05 uebergeben:

- native Top-Level `adapters`, `components`, `routes` und robuste `schedules` im RMT Schema
- produktiver XTend Host Adapter
- produktiver XRouter Adapter
- Migration der Demo-Brueckenlogik aus `xtendrmt-bestcase-demo.js` in wiederverwendbare Adapter-Module
- Regression-Smoke, der Bestcase-Demo und produktive Bridge gemeinsam prueft

## Lokaler Testpfad

```bash
node --check tests/references/reference_path_suite.js
node scripts/run_xtend_tests.js references --json
npm test
```

## Ergebnis

`WP-E04-02` ist abgeschlossen. RMT-Schema, Bestcase-Demo und DSL-Domains sind gegen das Epic-04-Zielmodell analysiert. `WP-E04-03` kann den XTend Component Contract fuer RMT-Kompatibilitaet definieren.
