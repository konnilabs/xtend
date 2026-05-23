# XTendRMT Epic 05 - Bridge und natives RMT Routing

- Status: Completed
- Datum: 4. Mai 2026
- Typ: Epic / Architektur- und Upstream-Planungsdokument
- Bezugsdokumente:
  - `development/ADR-XTendRMT-First-Class-Fusion.md`
  - `development/EPIC-04-XTend-Templating-Rendering-und-Framework-Erweiterung.md`
  - `development/WP-E04-12-Epic-Abschlussreview-und-KPI-Abnahme.md`
  - `development/BACKLOG-EPIC-05-XTendRMT-Bridge-und-Natives-RMT-Routing.md`
  - `development/WP-E05-01-Epic-04-Handoff-akzeptieren-und-Upstream-Source-of-Truth-festlegen.md`
  - `development/WP-E05-02-Host-Adapter-Contract-und-Adapter-Lifecycle-definieren.md`
  - `development/WP-E05-03-Adapter-Registry-und-Capability-Negotiation-modellieren.md`
  - `development/WP-E05-04-Native-Adapters-Domain-im-RMT-Schema-entwerfen.md`
  - `development/WP-E05-05-Native-Components-Domain-im-RMT-Schema-entwerfen.md`
  - `development/WP-E05-06-Native-Routes-Domain-im-RMT-Schema-entwerfen.md`
  - `development/WP-E05-07-Schedules-Domain-als-referenzierbare-Policy-haerten.md`
  - `development/WP-E05-08-DSL-Normalisierung-und-Backward-Compatibility-sichern.md`
  - `development/WP-E05-09-Route-Registry-und-Component-Registry-vorbereiten.md`
  - `development/WP-E05-10-XRouter-Adapter-produktfaehig-implementieren.md`
  - `development/WP-E05-11-XTend-Component-Adapter-produktfaehig-implementieren.md`
  - `development/WP-E05-12-State-Scheduler-und-Diagnostics-Bridge-anbinden.md`
  - `development/WP-E05-13-Build-Pipeline-und-Artefakt-Paritaet-fuer-XTendRMT-absichern.md`
  - `development/WP-E05-14-Bestcase-Demo-auf-native-Routes-und-Components-migrieren.md`
  - `development/WP-E05-15-Contract-Schema-und-Runtime-Tests-erweitern.md`
  - `development/WP-E05-16-Browser-Smokes-und-Multi-Host-Regression-absichern.md`
  - `development/WP-E05-17-Dokumentation-und-Authoring-Beispiele-schreiben.md`
  - `development/WP-E05-18-Epic-Abschlussreview-und-KPI-Abnahme.md`
  - `development/WP-E04-11-Upstream-Handoff-Spezifikation-fuer-XTendRMT-DSL-und-Bridge-vorbereiten.md`
  - `development/XTendRMT-Upstream-Handoff-Spezifikation.md`
  - `development/XTendRMT-Migrations-und-Framework-Agnostik-Leitplanken.md`
  - `docs/XTend-ADR.md`
  - `xtendrmt/rmt.schema.json`
  - `xtendrmt/rmt-manifest.json`
  - `xtendrmt/rmt-core.d.ts`
  - `xtendrmt/xtendrmt-bestcase-demo.rmt`
  - `xtendrmt/xtendrmt-bestcase-demo.js`
  - `tests/browser/fixtures/rmt-xrouter-xtend-smoke.html`

## Ausgangslage

XTendRMT liegt im aktuellen Repository primaer als Build-Artefaktversion vor. Die Dateien in `xtendrmt/` zeigen eine lauffaehige RMT-Runtime mit Scheduler, Template Registry, Manifest und Browser-/ESM-Bundles, aber nicht die upstream-fuehrende Modulstruktur, aus der diese Artefakte erzeugt werden.

Die Bestcase-Demo zeigt bereits den gewuenschten Produktpfad:

- RMT agiert als Scheduler und Kernel.
- XTend-Komponenten bilden die vollstaendige UI.
- XRouter wird aus RMT-Metadaten heraus initialisiert.
- RMT-Dokumente koennen als konzeptionelle App-DSL genutzt werden, obwohl das aktuelle Schema noch hauptsaechlich auf Templates ausgerichtet ist.

Die Demo ist damit ein valider Proof of Concept, aber noch keine dauerhafte Produktintegration. Die Routing-, Komponenten- und Bridge-Logik lebt aktuell im Demo-Code und teilweise in `manifest.metadata`, weil `rmt.schema.json` noch keine nativen Top-Level-Domains fuer `routes`, `components`, `adapters` und vollstaendige `schedules` besitzt.

## Epic-04-Handoff-Status

Epic 04 uebergibt mit `development/XTendRMT-Upstream-Handoff-Spezifikation.md` einen verbindlichen Startcontract fuer dieses Epic.

Die Startkriterien sind:

- Build-Artefakte in `xtendrmt/` bleiben Output, Demo-Basis und Regression-Referenz, nicht Architekturquelle.
- upstream trennt Kernel, DSL, Routing, Components, Host Adapter, XTend Product Adapter, XRouter Adapter und Tests als eigene Verantwortungsbereiche.
- die DSL-Domains `adapters`, `components`, `routes`, `schedules` und `templates` werden additiv modelliert.
- bestehende Template-only-`.rmt` Dokumente bleiben gueltig.
- XTend-spezifische Daten bleiben Adapterdaten und duerfen nicht kernel-visible werden.
- `xtend.component`, `xtend.template` und `xtend.xrouter` sind stabile Adapter-IDs fuer die erste produktive XTend Integration.
- Handoff-Aenderungen muessen mindestens `node scripts/run_xtend_tests.js rmt-compatibility --json` und `node scripts/run_xtend_tests.js references --json` bestehen.

## Problemstellung

Die naechste Stufe darf nicht darin bestehen, immer mehr XTend-Sonderlogik in Demo-Dateien oder generierte RMT-Bundles zu patchen. Sonst entsteht genau der Technical Debt, den die Fusion vermeiden soll:

- RMT wuerde schleichend an XTend gekoppelt.
- Routing wuerde als XRouter-Spezialfall statt als generische RMT-Domain wachsen.
- `.rmt` Dokumente wuerden ueber Metadaten-Ausweichpfade statt ueber klare DSL-Contracts erweitert.
- spaetere React-, Vue-, Vanilla- oder Custom-Adapter muessten gegen implizite XTend-Annahmen arbeiten.
- jede Erweiterung der RMT-DSL wuerde komplexe Refactors in Build-Artefakten erzwingen.

Der Epic schafft deshalb eine feste Bridge-Schicht zwischen XTend und RMT und definiert gleichzeitig, welche Upstream-Aenderungen in RMT noetig sind.

## Zielbild

Nach Abschluss dieses Epics existiert eine produktfaehige XTendRMT Bridge, die XTend als offiziellen First-Class Host Adapter an RMT anbindet, ohne den RMT Kernel an XTend zu koppeln.

Das Zielbild umfasst:

- XTend-Komponenten sind First-Class Citizens in `.rmt` Dokumenten.
- XRouter-Routing kann nativ in `.rmt` deklariert werden.
- Route-Wechsel, Komponenten-Mounting, Hydration und Folgearbeit koennen RMT Schedule Policies nutzen.
- RMT bleibt framework-agnostischer Scheduler und Kernel fuer grosse Web Apps.
- XTend kann parallel zu React, Vue, Vanilla JS oder individuellen Host-Systemen betrieben werden.
- die upstream-fuehrende RMT-Struktur enthaelt die neuen Domains, statt sie nur in Build-Artefakten nachzuziehen.

## In Scope

- Annahme und Umsetzung der Epic-04-Handoff-Spezifikation
- Bridge Contract zwischen RMT Kernel und Host-Systemen
- offizieller XTend Host Adapter fuer Components, Custom Elements, Manifest, State, Theme und optional API
- nativer RMT Routing Domain Contract
- XRouter Adapter als erste produktive Router-Implementierung fuer RMT Routes
- additive Erweiterung von `rmt.schema.json` um `adapters`, `components`, `routes` und robuste `schedules`
- Migration der Demo-Logik in wiederverwendbare Bridge-/Adapter-Module
- Upstream-Modulstruktur fuer RMT oberhalb der aktuellen Build-Artefakte
- Contract-Tests, Schema-Tests, Runtime-Smokes und Demo-Regression
- Dokumentation des Authoring-Modells fuer `.rmt` Routing und XTend-Komponenten

## Out of Scope

- harte XTend-Abhaengigkeit im RMT Kernel
- XRouter als einzige moegliche RMT Routing-Implementierung
- Bruch bestehender `.rmt` Template-Dokumente
- Umschreiben von XTend-Komponenten in ein proprietaeres RMT-only Komponentenmodell
- dauerhafte Produktlogik in `xtendrmt-bestcase-demo.js`
- manuelles Patchen generierter RMT Bundles als Source of Truth
- erzwungene Migration bestehender React-, Vue-, Vanilla- oder Custom-Apps auf XTend

## Architekturleitplanken

### 1. RMT Kernel bleibt Host-neutral

Der RMT Kernel kennt nur abstrakte Domains und Adapter-Contracts. Er darf keine XTend-Tags, keine XRouter-Klassen und keine `xstate`-Keys voraussetzen.

Erlaubt sind generische Konzepte:

- Component Definition
- Router Definition
- Schedule Policy
- Render Target
- Hydration Boundary
- State Bridge
- Host Capability
- Diagnostics Event

Nicht erlaubt sind Kernel-Abhaengigkeiten auf:

- `x-router`
- konkrete `x-*` Komponenten
- `window.XTend`
- XTend Manifest-Struktur als Kernel-Pflicht
- XRouter-spezifische Navigation Events als Kernel-Contract

### 2. XTend wird ueber einen offiziellen Adapter First-Class

XTend wird nicht als Sonderfall im Kernel behandelt. Stattdessen erhaelt XTend einen offiziellen Adapter, der dieselbe Adapterklasse nutzt, die spaeter auch React, Vue, Vanilla oder Custom Hosts verwenden koennen.

Der XTend Adapter verantwortet:

- Manifest Lookup fuer XTend-Komponenten
- Custom Element Registration Checks
- Mounting und Hydration von `x-*` Komponenten
- Attribut-, Property- und Slot-Normalisierung
- Event Bridging zu RMT Commands oder Scheduler Jobs
- optionale Spiegelung von RMT Diagnostics nach `xstate`
- Zugriff auf XTend Theme/API nur als deklarierte Host Capability

### 3. Routing wird native RMT Domain

Routing darf nicht als Metadata-Anhang in Templates wachsen. RMT braucht eine eigene `routes` Domain, die Router-unabhaengig beschrieben ist.

XRouter ist der erste offizielle Adapter fuer diese Domain. Dieselbe Route Definition muss spaeter aber auch von anderen Routern interpretiert werden koennen.

### 4. Schedules bleiben eigene Policies

RMT Scheduling bleibt als eigene Domain lesbar und pruefbar. Routes, Components, Templates und Actions duerfen Schedule Policies referenzieren, aber sie sollen Scheduling nicht als verstreute private Optionsbloecke verstecken.

### 5. Build-Artefakte sind Output, nicht Architekturquelle

Die aktuelle Version in `xtendrmt/` ist fuer Integration, Smoke Tests und Demos nutzbar. Dauerhafte Produktarbeit muss jedoch upstream in der RMT-Quellstruktur erfolgen. Die Bundles `rmt-core.esm.js`, `rmt-runtime.esm.js` und `rmt-runtime.browser.js` duerfen nicht die einzige Quelle fuer Bridge-, Routing- und Schema-Logik werden.

## Zielmodell fuer `.rmt`

Das RMT-Dokumentmodell wird additiv von einem Template-zentrierten Format zu einer App-DSL erweitert:

```json
{
  "kind": "rmt_document",
  "version": "1.0",
  "manifest": {
    "documentId": "app.shell",
    "namespace": "app"
  },
  "adapters": [],
  "components": [],
  "routes": [],
  "templates": [],
  "schedules": [],
  "actions": [],
  "data": []
}
```

Bestehende Dokumente mit nur `templates` bleiben gueltig.

## Native Route Definition

Eine Route beschreibt fachlich den Navigationszustand, nicht die konkrete DOM-Struktur eines Routers:

```json
{
  "id": "overview",
  "path": "/",
  "title": "Overview",
  "component": "pages.overview",
  "template": "pages.overview.content",
  "schedule": "route.visible.render",
  "metadata": {
    "description": "RMT orchestrates; XTend renders."
  }
}
```

Der XRouter Adapter darf daraus `x-route` Elemente, XRouter-Konfigurationen oder direkte Runtime-Registrierungen erzeugen. Diese Umwandlung gehoert in den Adapter, nicht in die `.rmt` DSL und nicht in den RMT Kernel.

## XTend Component Definition

XTend-Komponenten werden als generische RMT Components beschrieben:

```json
{
  "id": "pages.overview",
  "kind": "custom_element",
  "adapter": "xtend.component",
  "tag": "x-section",
  "props": {
    "layout": "column",
    "label": "RMT Kernel Overview"
  },
  "slots": {
    "header": {
      "template": "pages.overview.header"
    },
    "default": {
      "template": "pages.overview.body"
    }
  }
}
```

Der RMT Kernel registriert nur die Definition. Der XTend Adapter entscheidet, wie das Custom Element geladen, erzeugt, attributiert, mit Slots befuellt und hydriert wird.

## Adapter Contract

Ein Host Adapter meldet seine Faehigkeiten explizit:

```json
{
  "id": "xtend",
  "kind": "host_adapter",
  "package": "xtendrmt/xtend-adapter",
  "capabilities": {
    "components": true,
    "customElements": true,
    "routing": true,
    "stateBridge": true,
    "templateHydration": true,
    "schedulerEndpoints": true,
    "theme": true
  }
}
```

Fachlich muss der Bridge Contract mindestens diese Operationen abbilden:

- `registerComponent(definition, options)`
- `mountComponent(target, componentRef, model, options)`
- `hydrateComponent(target, componentRef, model, options)`
- `registerRoutes(routes, options)`
- `navigate(to, options)`
- `createStateBridge(options)`
- `resolveManifestEntry(tagOrId, options)`
- `scheduleEndpoint(endpointName, scope, callback, options)`
- `emitDiagnostic(event, payload)`

Die konkreten Funktionsnamen koennen in der Implementierung abweichen. Verbindlich ist die Trennung der Verantwortlichkeiten.

## Upstream-Aenderungsbedarf

Die aktuelle Build-Artefaktversion reicht fuer Demo und Smoke Tests, aber nicht als dauerhafte Quelle der neuen Architektur. Upstream sollte eine nachvollziehbare Modulstruktur erhalten, die ungefaehr diese Verantwortungen trennt:

- `rmt-kernel`: Scheduler, Runtime, Template Registry, Diagnostics, Execution Plans
- `rmt-dsl`: Dokumentmodell, Normalisierung, Referenzaufloesung, Schema Source
- `rmt-routing`: generische Route Domain, Route Registry, Route Lifecycle Events
- `rmt-components`: generische Component Domain, Component Registry, Mount/Hydration Contracts
- `rmt-adapters`: Host Adapter Contracts und Capability Negotiation
- `rmt-adapter-xtend`: XTend Component, Manifest, State, Theme und API Bridge
- `rmt-adapter-xrouter`: XRouter Mapping, Navigation Sync, Route Parameter Bridge
- `rmt-tests`: Schema-, Contract-, Runtime- und Adapter-Smokes

Die Namen sind Arbeitsnamen. Wichtig ist, dass die Build-Pipeline aus diesen Quellen die Artefakte in `xtendrmt/` erzeugt:

- `rmt-core.d.ts`
- `rmt-core.esm.js`
- `rmt-runtime.esm.js`
- `rmt-runtime.browser.js`
- `rmt.schema.json`
- `rmt-manifest.json`
- optionale Adapter-Bundles wie `xtend-adapter.esm.js` und `xrouter-adapter.esm.js`

Damit bleibt die Build-Artefaktversion testbar, ohne zur Architekturquelle zu werden.

## Arbeitsstroeme

### WS1 - Bridge Contract und Paketgrenzen

Ziel: Einen stabilen Contract zwischen RMT Kernel und Host Adaptern definieren.

Erwartete Ergebnisse:

- Adapter Lifecycle fuer Registrierung, Mounting, Hydration, Navigation und Diagnostics
- Capability-Modell fuer Hosts
- klare Runtime-Oberflaeche fuer `window.XTend.rmt` und ESM-Nutzung
- Entscheidung, welche Adapter als separate Bundles ausgeliefert werden

### WS2 - Native RMT Routing Domain

Ziel: Routing als eigene DSL-Domain in RMT verankern.

Erwartete Ergebnisse:

- Top-Level `routes` im Schema
- Route Registry und Route Reference Resolver
- Route Lifecycle Events fuer enter, leave, update, error und notFound
- Parameter-, Query- und Metadata-Modell
- Schedule Policy Referenzen fuer Route-Wechsel

### WS3 - XRouter Adapter

Ziel: XRouter als ersten offiziellen Router Adapter anbinden.

Erwartete Ergebnisse:

- Mapping von RMT Routes auf XRouter
- Erzeugung oder Registrierung von `x-route` Definitionen
- Navigation Sync zwischen RMT Commands und XRouter Events
- Route Params und Query Values als Template-/Component-Model
- Regression gegen die Bestcase-Demo

### WS4 - XTend Component Adapter

Ziel: XTend-Komponenten als RMT Components produktfaehig machen.

Erwartete Ergebnisse:

- Component Definition fuer Custom Elements
- Manifest Lookup gegen XTend `components/manifest.json`
- Mounting und Hydration von `x-*` Komponenten
- Slot-, Attribute-, Property- und Event-Mapping
- Fehler- und Diagnostics-Modell bei fehlenden Komponenten

### WS5 - State, Scheduler und Diagnostics Bridge

Ziel: RMT-Orchestrierung fuer XTend sichtbar, pruefbar und steuerbar machen.

Erwartete Ergebnisse:

- `xstate` Bridge fuer relevante RMT Runtime-Zustaende
- Scheduler Endpoints fuer Route Rendering, Hydration und Hintergrundarbeit
- Diagnostics Events fuer Route-, Component- und Schedule-Fluesse
- Performance Budgets fuer sichtbare und idle Arbeit

### WS6 - Upstream-Struktur und Build-Pipeline

Ziel: Die neue Architektur in der RMT-Quelle statt nur im Bundle verankern.

Erwartete Ergebnisse:

- Quellmodule fuer Kernel, DSL, Routing, Components und Adapter Contracts
- Build-Schritte fuer Browser-, ESM- und Typ-Artefakte
- Schema Source of Truth statt manuell auseinanderlaufender JSON-Dateien
- Artefaktvergleich oder Smoke Test nach jedem Build

### WS7 - Migration, Tests und Dokumentation

Ziel: Den neuen Pfad rueckwaertskompatibel und belegbar machen.

Erwartete Ergebnisse:

- Migration der Demo auf native `routes` und `components`
- Schema-Tests fuer alte und neue `.rmt` Dokumente
- Adapter Contract Tests fuer XTend und XRouter
- Runtime-Smokes fuer Browser und ESM
- Dokumentation fuer `.rmt` Routing, XTend Components und Scheduler Policies

## Initiale Arbeitspakete

- `E05-000`: Epic-04-Handoff-Spezifikation akzeptieren und upstream Source-of-Truth festlegen.
- `E05-001`: Upstream-Quellstruktur von RMT identifizieren oder anlegen und als Source of Truth festlegen.
- `E05-002`: Host Adapter Contract fuer RMT definieren.
- `E05-003`: Capability Negotiation fuer Adapter und `.rmt` Dokumente modellieren.
- `E05-004`: `routes` Domain im RMT Schema entwerfen.
- `E05-005`: `components` Domain im RMT Schema entwerfen.
- `E05-006`: `adapters` Domain im RMT Schema entwerfen.
- `E05-007`: `schedules` Domain pruefen und als referenzierbare Policy haerten.
- `E05-008`: generische Route Registry im RMT Runtime-Modell vorbereiten.
- `E05-009`: XRouter Adapter aus der Demo-Logik extrahieren und produktfaehig machen.
- `E05-010`: XTend Component Adapter aus der Demo-Logik extrahieren und produktfaehig machen.
- `E05-011`: `xstate` Diagnostics Bridge fuer RMT Runtime-Zustaende aufbauen.
- `E05-012`: Bestcase-Demo auf native `routes` und `components` migrieren.
- `E05-013`: Contract- und Schema-Tests fuer alte und neue `.rmt` Dokumente ergaenzen.
- `E05-014`: Browser-Smoke fuer XRouter + RMT Scheduler + XTend Components automatisieren.
- `E05-015`: Dokumentation und Authoring-Beispiele fuer native RMT Routes und XTend Components schreiben.

Die operative Zerlegung liegt in `development/BACKLOG-EPIC-05-XTendRMT-Bridge-und-Natives-RMT-Routing.md`.

## Abhaengigkeiten

- ADR fuer XTendRMT First-Class Fusion ist Grundlage dieses Epics.
- Epic 04 liefert den fachlichen Rahmen fuer Templating und Rendering.
- `development/XTendRMT-Upstream-Handoff-Spezifikation.md` liefert die verbindlichen Startkriterien fuer DSL-Domains, Adapter, Kernel-Grenzen und Gates.
- Eine upstream-fuehrende RMT-Quellstruktur muss verfuegbar sein oder im Rahmen dieses Epics angelegt werden.
- XRouter Contract muss stabil genug sein, um Mapping, Navigation und Lifecycle Events sauber zu kapseln.
- XTend Component Manifest und Loader Contracts muessen verlaesslich genug fuer Adapter-basiertes Mounting sein.

## Risiken

- Ohne Upstream-Source-of-Truth landen Bridge-Features in Build-Artefakten und werden schwer wartbar.
- Wenn `.rmt` Routing zu stark an XRouter-DOM-Strukturen gebunden wird, wird spaeterer Multi-Router-Support teuer.
- Wenn der XTend Adapter zu viel Verantwortung in den Kernel drueckt, verliert RMT seine framework-agnostische Rolle.
- Wenn `routes`, `components` und `schedules` nicht frueh getrennt werden, waechst die DSL in unklare Metadaten-Bloecke.
- Wenn Adapter-Capabilities nicht validiert werden, koennen `.rmt` Dokumente zur Laufzeit scheitern, obwohl sie formal gueltig aussehen.
- Wenn die Demo nicht in Regressionstests ueberfuehrt wird, kann die zentrale Produktvision unbemerkt brechen.

## Akzeptanzkriterien

- RMT besitzt einen dokumentierten Host Adapter Contract.
- XTend besitzt einen offiziellen RMT Adapter fuer Komponenten, Manifest, State und Diagnostics.
- XRouter besitzt einen offiziellen RMT Adapter fuer native `.rmt` Routes.
- `rmt.schema.json` erlaubt additive Top-Level-Domains fuer `adapters`, `components`, `routes` und robuste `schedules`.
- Bestehende Template-only `.rmt` Dokumente bleiben gueltig.
- Eine `.rmt` Datei kann Routen deklarieren, die in XRouter ausgefuehrt werden.
- Eine `.rmt` Datei kann XTend-Komponenten deklarieren, die durch den XTend Adapter gemountet oder hydriert werden.
- Route-Wechsel und Komponenten-Hydration koennen RMT Schedule Policies nutzen.
- Der RMT Kernel importiert keine XTend- oder XRouter-spezifischen Module.
- Die Bestcase-Demo nutzt die produktive Bridge statt eigener Demo-Brueckenlogik.
- Contract-, Schema- und Browser-Smoke-Tests decken den neuen Pfad ab.

## KPI-Baseline

- `0` produktive XTendRMT Bridge-Module ausserhalb der Demo
- `0` native Top-Level `routes` im aktuellen RMT Schema
- `0` native Top-Level `components` im aktuellen RMT Schema
- `0` offizieller XRouter Adapter fuer RMT
- `0` offizieller XTend Component Adapter fuer RMT
- Routing-Daten der Demo liegen noch in `manifest.metadata`
- RMT liegt im aktuellen Repository primaer als Build-Artefaktversion vor

## KPI-Ziele

- `1` dokumentierter und getesteter Host Adapter Contract
- `1` offizieller XTend Adapter
- `1` offizieller XRouter Adapter
- additive Schema-Unterstuetzung fuer `adapters`, `components`, `routes` und referenzierbare `schedules`
- `100%` Rueckwaertskompatibilitaet fuer bestehende Template-only `.rmt` Dokumente
- mindestens `1` Browser-Smoke, der RMT Scheduler, XRouter und XTend Components gemeinsam prueft
- Bestcase-Demo laeuft ohne eigene Routing-/Component-Bridge im Demo-Code

## Vorschlag fuer die Umsetzungsreihenfolge

1. Upstream-Quellstruktur und Build-Verantwortung klaeren.
2. Host Adapter Contract und Capability-Modell definieren.
3. RMT Schema additiv um `adapters`, `components`, `routes` und `schedules` erweitern.
4. generische Route Registry und Component Registry im RMT Runtime-Modell vorbereiten.
5. XRouter Adapter implementieren.
6. XTend Component Adapter implementieren.
7. State-, Scheduler- und Diagnostics Bridge anbinden.
8. Bestcase-Demo auf native `.rmt` Domains migrieren.
9. Contract-, Schema- und Browser-Smokes automatisieren.
10. Dokumentation und Migrationshinweise abschliessen.

## Implementierungsstart Mai 2026

Epic 05 startet nach Abschluss von Epic 04.

Aktueller Arbeitsstand:

- `WP-01`: Epic-04-Handoff akzeptieren und Upstream-Source-of-Truth festlegen ist `completed`.
- `WP-02`: Host Adapter Contract und Adapter Lifecycle definieren ist `completed`.
- `WP-03`: Adapter Registry und Capability Negotiation modellieren ist `completed`.
- `WP-04`: Native `adapters` Domain im RMT Schema entwerfen ist `completed`.
- `WP-05`: Native `components` Domain im RMT Schema entwerfen ist `completed`.
- `WP-06`: Native `routes` Domain im RMT Schema entwerfen ist `completed`.
- `WP-07`: `schedules` Domain als referenzierbare Policy haerten ist `completed`.
- `WP-08`: DSL Normalisierung und Backward Compatibility fuer alte und neue `.rmt` Dokumente sichern ist `completed`.
- `WP-09`: Route Registry und Component Registry im RMT Runtime-Modell vorbereiten ist `completed`.
- `WP-10`: XRouter Adapter produktfaehig implementieren ist `completed`.
- `WP-11`: XTend Component Adapter produktfaehig implementieren ist `completed`.
- `WP-12`: State-, Scheduler- und Diagnostics Bridge anbinden ist `completed`.
- `WP-13`: Build-Pipeline und Artefakt-Paritaet fuer `xtendrmt/` absichern ist `completed`.
- `WP-14`: Bestcase-Demo auf native `routes` und `components` migrieren ist `completed`.
- `WP-15`: Contract-, Schema- und Runtime-Tests erweitern ist `completed`.
- `WP-16`: Browser-Smokes und Multi-Host-Regression fuer RMT/XRouter/XTend absichern ist `completed`.
- `WP-17`: Dokumentation und Authoring-Beispiele fuer native RMT Routes und XTend Components schreiben ist `completed`.
- `WP-18`: Epic-Abschlussreview und KPI-Abnahme ist `completed`.

### WP-01 Ergebnis

`WP-E05-01` akzeptiert den Epic-04-Handoff und legt die upstream RMT-Quellstruktur als Source-of-Truth fest. In diesem Repository bleibt `xtendrmt/` Build-Artefakt, Demo-Basis und Regression-Referenz; produktive Bridge-, Routing-, Component-, Adapter- und DSL-Entscheidungen muessen in upstream Source oder Workpackage-Contracts fuehren.

### WP-02 Ergebnis

`WP-E05-02` definiert den host-neutralen Adapter Contract mit Adapter-Klassen, Lifecycle-Phasen, Operations-Matrix, Runtime-Surfaces, Result- und Diagnostics-Contract. `xtend.rmt.host-adapter-lifecycle.v1` ist als synchronisierte Artefakt-Referenz in `xtendrmt/rmt.schema.json` sichtbar; `xtendrmt/rmt-core.d.ts` deklariert mit `RmtHostAdapterRuntimeBridge` und den zugehoerigen Host-Adapter-Typen die synchronisierte Typoberflaeche.

### WP-03 Ergebnis

`WP-E05-03` modelliert Adapter Registry und Capability Negotiation als host-neutrale Contracts. `xtend.rmt.adapter-registry.v1` ist als synchronisierte Artefakt-Referenz in `xtendrmt/rmt.schema.json` sichtbar; `xtendrmt/rmt-core.d.ts` deklariert mit `RmtCapabilityNegotiationResult` Registry Records, Capability Requests und Negotiation Results.

### WP-04 Ergebnis

`WP-E05-04` fuehrt `adapters` als optionale native Top-Level-Domain im RMT Schema ein. `xtend.rmt.adapters-domain.v1` ist als synchronisierte Artefakt-Referenz in `xtendrmt/rmt.schema.json` sichtbar; `xtendrmt/rmt-core.d.ts` deklariert mit `RmtAdapterDomainRecord` die native Adapter-Domain-Oberflaeche.

`WP-05` und `WP-06` koennen nun `components` und `routes` gegen native Adapter-Records referenzieren.

### WP-05 Ergebnis

`WP-E05-05` fuehrt `components` als optionale native Top-Level-Domain im RMT Schema ein. `xtend.rmt.components-domain.v1` ist als synchronisierte Artefakt-Referenz in `xtendrmt/rmt.schema.json` sichtbar; `xtendrmt/rmt-core.d.ts` deklariert mit `RmtComponentDomainRecord` die native Component-Domain-Oberflaeche.

`WP-06` kann nun `routes[*].component` gegen `components[*].id` referenzieren, ohne XTend, XRouter oder Custom Elements in den RMT Kernel einzubetten.

### WP-06 Ergebnis

`WP-E05-06` fuehrt `routes` als optionale native Top-Level-Domain im RMT Schema ein. `xtend.rmt.routes-domain.v1` ist als synchronisierte Artefakt-Referenz in `xtendrmt/rmt.schema.json` sichtbar; `xtendrmt/rmt-core.d.ts` deklariert mit `RmtRouteDomainRecord` die native Route-Domain-Oberflaeche.

`WP-07` kann nun `routes[*].schedule`, `components[*].schedule` und spaetere Template-Schedule-Refs gegen eine eigenstaendige `schedules` Policy-Domain haerten.

### WP-07 Ergebnis

`WP-E05-07` fuehrt `schedules` als optionale native Top-Level-Policy-Domain im RMT Schema ein. `xtend.rmt.schedules-domain.v1` ist als synchronisierte Artefakt-Referenz in `xtendrmt/rmt.schema.json` sichtbar; `xtendrmt/rmt-core.d.ts` deklariert mit `RmtScheduleDomainRecord`, `RmtScheduleLane` und `RmtScheduleBudgetClass` die native Schedule-Policy-Oberflaeche.

`WP-08` kann nun alte Template-only-Dokumente und neue App-DSL-Dokumente gemeinsam normalisieren, Schedule-Refs referenziell pruefen und Inline-Hints ohne Kernel-Kopplung auf native Policies abbilden.

### WP-08 Ergebnis

`WP-E05-08` fuehrt `xtend.rmt.dsl-normalization.v1` als Normalisierungscontract ein. `xtendrmt/rmt.schema.json` beschreibt Input-Modi, Legacy-Promotion, Reference Checks und Diagnostic Codes; `xtendrmt/rmt-core.d.ts` deklariert mit `RmtDslNormalizationSummary` und `RmtDslDiagnostic` die synchronisierte Typoberflaeche.

Die Build-Artefaktversionen `rmt-core.esm.js`, `rmt-runtime.esm.js` und `rmt-runtime.browser.js` normalisieren jetzt Template-only-, native App-DSL- und Legacy-Metadata-Dokumente additiv. Fehlende Referenzen werden als Diagnostics gemeldet, waehrend Adapter-Ausfuehrung, Router-Registrierung, Component-Mounting, DOM-Arbeit und `xstate`-Writes ausserhalb des RMT Kernels bleiben.

`WP-09` kann nun Route Registry und Component Registry auf normalisierte `routes` und `components` Records aufbauen.

### WP-09 Ergebnis

`WP-E05-09` fuehrt `xtend.rmt.runtime-registry.v1` als host-neutralen Runtime-Registry-Contract ein. `xtendrmt/rmt.schema.json` beschreibt Route-/Component-Registry-Indizes, Lifecycle-Events, Adapter-Consumption und Runtime-Diagnostic-Codes; `xtendrmt/rmt-core.d.ts` deklariert mit `RmtRuntimeRegistrySnapshot`, `RmtRouteRegistryEntry` und `RmtComponentRegistryEntry` die synchronisierte Typoberflaeche.

Die Build-Artefaktversionen `rmt-core.esm.js`, `rmt-runtime.esm.js` und `rmt-runtime.browser.js` koennen normalisierte `routes` und `components` jetzt als konsumierbare Registry-Snapshots bereitstellen. Fehlende required Routes/Components und duplizierte Registry-IDs werden diagnostiziert, waehrend Navigation, Component-Mounting, DOM-Arbeit, XTend, XRouter und `xstate` weiterhin ausserhalb des RMT Kernels bleiben.

`WP-10` und `WP-11` koennen nun produktive Adapter gegen `routeRegistry` und `componentRegistry` implementieren.

### WP-10 Ergebnis

`WP-E05-10` fuehrt `xtend.rmt.xrouter-adapter.v1` als produktiven XRouter-Adapter-Contract ein. `xtendrmt/rmt.schema.json` beschreibt den Adapter, seine `routeRegistry.byRouter["xtend.xrouter"]` Consumption, Mapping-Felder, Navigation Sync, Diagnostics und Kernel-Grenze; `xtendrmt/rmt-core.d.ts` deklariert mit `RmtXRouterAdapter`, `RmtXRouterMappedRoute` und `createRmtXRouterAdapter` die synchronisierte Typoberflaeche.

Die Build-Artefaktversionen `rmt-core.esm.js`, `rmt-runtime.esm.js` und `rmt-runtime.browser.js` koennen `RmtRouteRegistryEntry`-Snapshots jetzt in XRouter-kompatible Route Records mappen, an ein `<x-router>` Ziel registrieren und Navigation ueber `navigate` oder `_navigateTo` anstossen. `components/xrouter.js` bietet dafuer `registerRoutes`, `navigate`, RMT-Route-Normalisierung und RMT-relevante Route-Details an. XRouter bleibt Adapter, nicht Kernelwissen; DOM-Arbeit, URL-State und `xstate`-Writes bleiben ausserhalb des RMT Kernels.

`WP-11` kann nun den XTend Component Adapter gegen dieselbe Adaptergrenze produktiv machen; `WP-12` kann `scheduleRef`, Navigation Sync und Diagnostics Bridge anbinden.

### WP-11 Ergebnis

`WP-E05-11` fuehrt `xtend.rmt.xtend-component-adapter.v1` als produktiven XTend Component Adapter Contract ein. `xtendrmt/rmt.schema.json` beschreibt den Adapter, seine `componentRegistry.byAdapter["xtend.component"]` Consumption, Mapping-Felder, Mount-/Hydration-Modell, Diagnostics und Kernel-Grenze; `xtendrmt/rmt-core.d.ts` deklariert mit `RmtXtendComponentAdapter`, `RmtXtendMappedComponent` und `createRmtXtendComponentAdapter` die synchronisierte Typoberflaeche.

Die Build-Artefaktversionen `rmt-core.esm.js`, `rmt-runtime.esm.js` und `rmt-runtime.browser.js` koennen `RmtComponentRegistryEntry`-Snapshots jetzt in XTend-kompatible Component Records mappen, Custom Elements in ein Host-Ziel mounten und bestehende Elemente hydrieren. Manifest Lookup, Custom-Element-Checks, Props, Attribute, Slots, Event Bridges und `data-xtend-hydrated` bleiben Adapteraufgabe. XTend bleibt Adapter, nicht Kernelwissen; Manifest-Lesen, DOM-Arbeit und `xstate`-Writes bleiben ausserhalb des RMT Kernels.

`WP-12` hat darauf die State-, Scheduler- und Diagnostics Bridge ueber `scheduleRef`, Adapter Results, Route-Wechsel und Component Events angebunden.

### WP-12 Ergebnis

`WP-E05-12` fuehrt `xtend.rmt.state-scheduler-diagnostics-bridge.v1` als produktiven State-, Scheduler- und Diagnostics Bridge Contract ein. `xtendrmt/rmt.schema.json` beschreibt Input-Contracts, Adapter-Result-Consumption, State-Mirror-Pfade, Scheduler Endpoints, Diagnostics-Matrix, Performance-Budget-Felder und Kernel-Grenze; `xtendrmt/rmt-core.d.ts` deklariert mit `RmtStateSchedulerDiagnosticsBridge`, `RmtStateBridgeHandle`, `RmtBridgeSchedulePolicy` und `createRmtStateSchedulerDiagnosticsBridge` die synchronisierte Typoberflaeche.

Die Build-Artefaktversionen `rmt-core.esm.js`, `rmt-runtime.esm.js` und `rmt-runtime.browser.js` koennen Adapter Results aus XRouter und XTend Component Adapter jetzt aufnehmen, relevante Route-/Component-Zustaende optional nach `xstate` spiegeln, Schedule Policies zu host-neutralen Scheduler Endpoints aufloesen und Diagnostics lokal sowie optional ueber einen Diagnostics Hub publizieren. `xstate`, Diagnostics Hub, Performance Runtime, XTend und XRouter bleiben optionale Host-Ziele ausserhalb des RMT Kernels.

`WP-13` konnte darauf Build-Pipeline und Artefakt-Paritaet fuer die produktiven Adapter- und Bridge-Factories absichern.

### WP-13 Ergebnis

`WP-E05-13` fuehrt `xtend.rmt.artifact-parity.v1` als Artefakt-Paritaetscontract ein. `xtendrmt/rmt.schema.json` und `xtendrmt/rmt-manifest.json` beschreiben die synchronisierten Artefakte, Required Factories, Required Contract IDs, Drift Checks und den dedizierten Gate `node scripts/verify_xtendrmt_artifact_parity.js --json`; `xtendrmt/rmt-core.d.ts` deklariert mit `RmtArtifactParityContract` die synchronisierte Typoberflaeche.

Der neue Gate prueft `rmt-core.esm.js`, `rmt-runtime.esm.js`, `rmt-runtime.browser.js`, `rmt-core.d.ts`, `rmt.schema.json` und `rmt-manifest.json` zusammen. Dabei wurde ein Manifest-Drift zwischen Datei-Manifest und generated Product Manifest sichtbar und synchronisiert: `createRmtFormat`, `createRmtXRouterAdapter`, `createRmtXtendComponentAdapter` und `createRmtStateSchedulerDiagnosticsBridge` sind nun in Manifest-Datei, generated Product Manifest, ESM-Exports, Browser-Artefakt und Typoberflaeche gemeinsam abgesichert.

`WP-14` konnte darauf die Bestcase-Demo auf native `routes`, `components`, produktive Adapter und die Bridge migrieren.

### WP-14 Ergebnis

`WP-E05-14` migriert die Bestcase-Demo auf native RMT Domains. `xtendrmt/xtendrmt-bestcase-demo.rmt` fuehrt operative `adapters`, `components`, `routes` und `schedules` jetzt als Top-Level-Domains; `manifest.metadata` bleibt fuer Authoring-, Handoff-, Host-Capability- und Demo-Migrations-Metadaten zustaendig.

`xtendrmt/xtendrmt-bestcase-demo.js` normalisiert das `.rmt` Dokument mit `createRmtFormat`, erzeugt Runtime Registries und verwendet die produktiven Factories `createRmtXRouterAdapter`, `createRmtXtendComponentAdapter` und `createRmtStateSchedulerDiagnosticsBridge`. Route-Registrierung, Component-Preparation, Hydration, Adapter Results, Schedule Policies und `xstate`-Spiegelung laufen damit ueber dieselben Adapterpfade, die in `WP-10` bis `WP-12` produktfaehig gemacht wurden.

`WP-15` konnte darauf Contract-, Schema- und Runtime-Tests auf den nativen Demo-Pfad ausweiten.

### WP-15 Ergebnis

`WP-E05-15` erweitert die RMT-Kompatibilitaetssuite um die native Fixture `tests/fixtures/rmt-app-dsl.native-bridge.rmt` mit Contract `xtend.rmt.wp15.native-bridge-fixture.v1`. Der Gate prueft nun Template-only-Kompatibilitaet, native App-DSL-Normalisierung, die migrierte Bestcase-Demo, produktive XRouter-/XTend-Component-Adapter, State-/Scheduler-/Diagnostics-Bridge sowie ESM- und browser-nahe Runtime-Bundle-Pfade gemeinsam.

Damit sind Bridge-Regressionen lokal sichtbar, ohne echte Browser-Smokes in dieses Paket zu ziehen. `WP-16` hat darauf die browsernahe Regression in reale Host-/Browser-Flows ueberfuehrt; `WP-17` kann Authoring- und Migrationsdokumentation auf getestete native RMT-Pfade setzen.

### WP-16 Ergebnis

`WP-E05-16` fuehrt die Browser-Smoke-Fixture `tests/browser/fixtures/rmt-xrouter-xtend-smoke.html` mit Contract `xtend.rmt.wp16.browser-smoke-fixture.v1` ein. Die Fixture laedt `xtendrmt/rmt-runtime.browser.js`, XRouter, `x-section`, `x-card` und `xstate` repo-lokal und exposes ihr Ergebnis unter `window.__xtendRmtBrowserSmokeResult`.

Der browsernahe Flow normalisiert ein natives RMT Dokument, erzeugt Runtime Registries, registriert native Routes in einem echten `<x-router>`, navigiert nach `/settings` und `/vanilla`, mountet und hydriert XTend Components ueber `createRmtXtendComponentAdapter`, zeichnet Scheduler Endpoints ueber `createRmtStateSchedulerDiagnosticsBridge` auf und belegt Framework-Agnostik ueber den nicht-XTend Adapter `vanilla.component` mit Endpoint `xtendrmt.vanilla.mount`.

`tests/browser/fixtures/rmt-xrouter-xtend-smoke.html` ist der browsernahe Nachweis fuer den Bestcase-Produktpfad RMT/XRouter/XTend/Vanilla, ohne XTend, XRouter, DOM oder `xstate` in den RMT Kernel zu ziehen. `WP-17` kann nun die Authoring-Dokumentation auf diesen getesteten Pfad setzen.

### WP-17 Ergebnis

`WP-E05-17` fuehrt die produktiven Guides `docs/xtendrmt-native-authoring.md` und `docs/xtendrmt-migration-guide.md` ein. Der Authoring Guide traegt `xtend.rmt.native-authoring-guide.v1` und beschreibt native `adapters`, `components`, `routes`, `schedules`, XTend Component Records, XRouter Route Records, Scheduler Policies, Runtime-Verkabelung und Kernel Boundary.

Der Migration Guide traegt `xtend.rmt.native-migration-guide.v1` und beschreibt die Migration von `manifest.metadata.routes -> routes`, `manifest.metadata.components -> components` und `manifest.metadata.schedules -> schedules`. Er haelt Template-only-Kompatibilitaet, opt-in Migration und Parallelbetrieb mit React, Vue, Vanilla JS und Custom Hosts sichtbar.

Die Guides sind in `docs/README.md`, `docs/menu.json`, `docs/core-migration-guide.md`, `development/XTend-Dokumentations-und-Demo-Referenzpfade.md` und `tests/references/reference_path_suite.js` verankert. `WP-18` kann nun das Epic-Abschlussreview und die KPI-Abnahme starten.

### WP-18 Ergebnis

`WP-E05-18` schliesst Epic 05 mit Contract `xtend.rmt.epic05-closure.v1` ab. Die Abnahme bestaetigt `18` von `18` abgeschlossene Workpackages, produktive Adapter-Factories fuer XRouter und XTend Components, die State-/Scheduler-/Diagnostics Bridge, native RMT Domains, Artefakt-Paritaet, Bestcase-Demo-Migration, Browser-Smoke, Authoring-Guide und Migration-Guide.

Der finale lokale Gate umfasst `node scripts/run_xtend_tests.js browser --json`, `node scripts/run_xtend_tests.js rmt-compatibility --json`, `node scripts/run_xtend_tests.js references --json`, `node scripts/run_xtend_tests.js --report /private/tmp/xtend-e05-final-report.json` und `npm test`.

Epic 05 ist abgeschlossen. Die produktive XTendRMT Bridge ist dokumentiert und getestet; XTend bleibt First-Class Host ueber Adapterqualitaet, waehrend RMT framework-agnostischer Scheduler und Kernel bleibt.

## Definition of Done

Der Epic ist abgeschlossen, wenn XTend und RMT ueber eine feste, dokumentierte und getestete Bridge verbunden sind, XRouter-Routing nativ in `.rmt` Dateien beschrieben und ausgefuehrt werden kann, XTend-Komponenten als First-Class RMT Components nutzbar sind und der RMT Kernel trotzdem framework-agnostisch bleibt. Die produktive Implementierung muss upstream in der RMT-Quellstruktur verankert sein und die Artefakte in `xtendrmt/` reproduzierbar erzeugen.
