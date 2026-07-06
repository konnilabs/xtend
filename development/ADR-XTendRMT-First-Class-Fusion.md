# ADR - XTendRMT First-Class Fusion

- Status: Proposed
- Datum: 3. Mai 2026
- Typ: Architekturentscheidung / Integrationsbaseline
- Bezugsdokumente:
  - `docs/XTend-ADR.md`
  - `development/EPIC-04-XTend-Templating-Rendering-und-Framework-Erweiterung.md`
  - `development/XTendRMT-Migrations-und-Framework-Agnostik-Leitplanken.md`
  - `development/XTendRMT-Pilot-Flow-RMT-basiertes-XTend-Templating.md`
  - `development/XTendRMT-Upstream-Handoff-Spezifikation.md`
  - `development/EPIC-03-XTend-Scaffold-Build-Environment-und-Developer-Workflow.md`
  - `docs/core-migration-guide.md`
  - `xtendrmt/rmt.schema.json`
  - `xtendrmt/rmt-manifest.json`
  - `xtendrmt/rmt-core.d.ts`

## Kontext

XTend besitzt einen konsolidierten Plattform-Kern mit Loader, Manifest, `xstate`, Theme-API, Router, API-Fassade und nativen Web Components. XTendRMT bringt eine eigenstaendige Scheduler-, Template-, Rendering-, Hydration- und Prerender-Laufzeit mit. Ziel der Fusion ist nicht, eines der beiden Systeme im anderen aufgehen zu lassen, sondern beide Produktlinien so zu verbinden, dass sie gemeinsam groesser werden koennen.

Die neue Zielsetzung lautet:

- XTend-Komponenten sollen First Class Citizens unter RMT werden.
- XRouter soll vollstaendig in RMT unterstuetzt werden, sodass Routing direkt in `.rmt` Dateien deklarierbar ist.
- Die Architektur soll Technical Debt vermeiden, damit RMT als DSL wachsen kann, ohne spaetere komplexe Refactors zu erzwingen.
- RMT soll framework-agnostisch bleiben und als Scheduler parallel zu XTend, React, Vue, Vanilla JS oder vollstaendig individuellen Host-Anwendungen laufen koennen.

## Entscheidung

RMT wird als framework-agnostischer Kernel behandelt. XTend wird nicht in den Kernel eingebaut, sondern als offizieller First-Class Product Adapter auf RMT abgebildet.

Die Zielarchitektur besteht aus vier Ebenen:

1. **RMT Kernel**
   - Scheduler
   - Priority Queue
   - Root Lifecycle
   - Template Registry
   - Execution Plans
   - Hydration und Prerender Contracts
   - Diagnostics und Performance-Budgets

2. **RMT DSL**
   - `.rmt` Dokumentmodell
   - Templates
   - Components
   - Routes
   - Schedules
   - Actions
   - Data und Metadata Contracts

3. **Host Adapter**
   - generische Adapter-Schnittstellen fuer Komponenten, Router, State, DOM, Framework-Renderer und Scheduler-Integration
   - keine harte Abhaengigkeit auf XTend, React, Vue oder andere konkrete Frameworks

4. **XTend Product Adapter**
   - XTend-Komponenten als RMT Components
   - XRouter als RMT Router Adapter
   - `xstate` als XTend State Bridge
   - XTend Manifest als Component Loader Registry
   - XTend Theme und API als optionale Host Capabilities

Daraus folgt: RMT darf XTend ueber einen Adapter unterstuetzen, aber der RMT Kernel darf XTend nicht importieren, nicht voraussetzen und nicht als Default-Host behandeln.

## Architekturprinzipien

### 1. Kernel bleibt framework-agnostisch

Der RMT Kernel kennt nur abstrakte Contracts:

- Component Registry
- Router Adapter
- State Bridge
- Scheduler Endpoint
- Render Target
- Hydration Boundary
- Host Capability

Er kennt keine konkreten XTend-Tags wie `x-hero`, `x-section` oder `x-modal`, keine XRouter-Implementierungsdetails und keine `xstate`-Keys.

### 2. XTend wird First-Class ueber Adapter, nicht ueber Sonderfaelle

XTend-Komponenten werden ueber einen `xtend.component` Adapter registriert. Dieser Adapter weiss, wie XTend-Komponenten geladen, instanziiert, mit Attributen und Properties versorgt, mit Slots befuellt und mit Events verdrahtet werden.

Der RMT Kernel sieht dabei nur einen generischen Component Contract. Dadurch koennen spaeter React-, Vue- oder Vanilla-Komponenten denselben DSL-Pfad nutzen.

### 3. XRouter wird DSL-faehig, aber nicht Kernel-intern

Routing in `.rmt` wird ueber eine generische `routes` Domain modelliert. XRouter ist der erste offizielle Router Adapter fuer diese Domain.

Der XTend Adapter ist dafuer verantwortlich, RMT Routes in XRouter-kompatible Route-Definitionen oder DOM-Strukturen zu ueberfuehren. Andere Host Adapter koennen dieselben RMT Routes in React Router, Vue Router oder eine eigene Routing-Implementierung mappen.

### 4. Scheduling ist eine eigene DSL-Domain

Scheduling darf nicht als verstreute Option innerhalb einzelner Templates wachsen. RMT braucht eine eigene `schedules` Domain und referenzierbare Schedule Policies.

Templates, Routes, Components und Actions koennen Schedule Policies referenzieren, aber die Scheduling-Definition bleibt als eigenstaendiger Contract pruefbar.

### 5. DSL-Domains muessen frueh stabil getrennt werden

Um Refactor-Druck zu vermeiden, wird `.rmt` nicht als reines Template-Format weiterentwickelt. Das Dokumentmodell wird als Applikations-DSL verstanden:

- `templates`
- `components`
- `routes`
- `schedules`
- `actions`
- `data`
- `adapters`
- `metadata`

Diese Domains duerfen sich referenzieren, sollen aber nicht ineinander verschmelzen.

## Zielmodell fuer `.rmt`

Das Zielmodell erweitert das bestehende RMT Document um neue Top-Level-Domains:

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

Diese Erweiterung soll additiv erfolgen. Bestehende `.rmt` Dokumente mit nur `templates` bleiben gueltig.

## XTend-Komponenten als RMT Components

XTend-Komponenten werden in der DSL als generische Component Records beschrieben:

```json
{
  "id": "marketing.hero",
  "kind": "custom_element",
  "adapter": "xtend.component",
  "tag": "x-hero",
  "props": {
    "align": "center",
    "verticalAlign": "center",
    "backgroundImage": "background.webp"
  },
  "slots": {
    "default": {
      "template": "marketing.hero.content"
    }
  },
  "events": {
    "cta.click": {
      "commandName": "marketing.cta.open"
    }
  }
}
```

Der XTend Adapter loest diese Definition auf:

- Manifest-Eintrag suchen und Komponente laden
- Custom Element erzeugen oder vorhandenes Element hydratisieren
- Props und Attribute normalisieren
- Slots aus Templates oder Komponenten einsetzen
- Events in RMT Commands oder Root Events ueberfuehren
- Lifecycle und Diagnostics nach RMT melden

Der RMT Kernel bleibt dabei unabhaengig von der konkreten Web-Component-Implementierung.

## XRouter in `.rmt`

RMT bekommt eine generische Route Domain:

```json
{
  "id": "home",
  "path": "/",
  "router": {
    "adapter": "xtend.xrouter",
    "mode": "history"
  },
  "title": "Home",
  "template": "home.page",
  "component": "layout.page",
  "schedule": "route.visible.render"
}
```

Der XTend XRouter Adapter muss folgende Funktionen bereitstellen:

- RMT Routes in XRouter-Routen ueberfuehren
- Nested Routes abbilden
- Route-Parameter und Query-Werte als Model in Templates weiterreichen
- Meta-Daten fuer Titel, Beschreibung und Keywords mappen
- Navigation ueber RMT Commands und XRouter Events synchronisieren
- Route-Wechsel als Scheduler Endpoint ausfuehren
- Hydration und Prerender fuer Route-Ziele unterstuetzen

XRouter bleibt damit vollstaendig unterstuetzt, aber nicht fest in den Kernel verdrahtet.

## Scheduler Contract

RMT Scheduling wird als eigenstaendige Domain beschrieben:

```json
{
  "id": "route.visible.render",
  "endpointName": "route.render",
  "scope": "router.current",
  "lane": "visible",
  "priority": 80,
  "preferIdle": false,
  "deadlineMs": 120,
  "coalesceKey": "route.current",
  "budgetClass": "interactive"
}
```

Referenzen auf Schedule Policies koennen aus Routes, Components, Templates oder Actions kommen. Der Scheduler soll dabei in grossen Web Apps auch dann funktionieren, wenn mehrere Frameworks parallel laufen.

Beispiele:

- XTend navigiert eine Route und laesst RMT Template-Hydration planen.
- React rendert einen Teilbaum und nutzt RMT nur fuer teure Folgearbeit.
- Vue nutzt RMT fuer Prerender-Transport oder Hintergrund-Tasks.
- Vanilla JS registriert eigene Scheduler Endpoints direkt am RMT Kernel.

## Adapter Contract

Ein Adapter beschreibt seine Faehigkeiten explizit:

```json
{
  "id": "xtend",
  "kind": "host_adapter",
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

Der Runtime-Adapter muss mindestens diese Rollen abbilden koennen:

- `registerComponent(definition, options)`
- `mountComponent(target, componentRef, model, options)`
- `hydrateComponent(target, componentRef, model, options)`
- `registerRoutes(routes, options)`
- `navigate(to, options)`
- `createStateBridge(options)`
- `resolveManifestEntry(tagOrId, options)`
- `scheduleEndpoint(endpointName, scope, callback, options)`

Die konkreten Funktionsnamen koennen bei der Implementierung abweichen. Der Contract ist aber fachlich verbindlich.

## Namespace- und Kompatibilitaetsmodell

Kanonische neue Oberflaechen:

- `window.XTend.rmt`
- `window.XTend.rmt.adapters.xtend`
- `window.XTend.rmt.router`
- `window.XTend.rmt.scheduler`
- `window.XTend.rmt.templates`

Kompatibilitaetsoberflaechen:

- `window.xtend.rmt`
- deprecated global compatibility hooks
- deprecated factory aliases

Neue Dokumentation und neue Beispiele duerfen nur die XTendRMT/RMT-Namen verwenden. Deprecated Namen bleiben ausschliesslich historische Kompatibilitaet.

## Konsequenzen fuer das bestehende Schema

`xtendrmt/rmt.schema.json` bleibt die autoritative Schema-Datei fuer RMT Documents. Die naechsten Schema-Aenderungen sollen additiv sein:

- Top-Level `components` ergaenzen
- Top-Level `routes` ergaenzen
- Top-Level `schedules` ergaenzen
- Top-Level `adapters` ergaenzen
- vorhandene `templates` unveraendert gueltig halten
- `template` Referenzen fuer Routes und Components wiederverwenden
- Schedule Policies per String-Ref oder Inline-Objekt erlauben

Wenn die Datei zu gross wird, koennen spaeter Teil-Schemas entstehen:

- `rmt.component.schema.json`
- `rmt.routing.schema.json`
- `rmt.schedule.schema.json`
- `rmt.adapter.schema.json`

Die erste Integration soll jedoch aus einem zusammenhaengenden Document Contract heraus gedacht werden, damit die DSL als ein Produkt lesbar bleibt.

## Migrationsstrategie

### Phase 0 - Opt-in und Parallelbetrieb absichern

- RMT-Templating bleibt additiv und opt-in.
- bestehende XTend-, React-, Vue-, Vanilla-JS- und Custom-Host-Anwendungen duerfen nicht zu XTend oder RMT-only migriert werden muessen.
- RMT aktiviert Arbeit nur ueber explizite Dokumente, Root-Handshakes, Template-Records, Adapter-Registrierungen oder Scheduler-Endpoints.
- XTend-spezifische Adapterdaten bleiben `kernelVisible: false`.
- produktive Bridge- und XRouter-Ausfuehrung bleibt bis Epic 05 `reserved-for-Epic-05`.

Die operative Leitplanke fuer Reviews ist `development/XTendRMT-Migrations-und-Framework-Agnostik-Leitplanken.md`.

### Phase 1 - Architektur und Contracts

- dieses ADR festhalten
- Schema-Domains fuer `components`, `routes`, `schedules` und `adapters` entwerfen
- XTend Adapter Contract dokumentieren
- XRouter Mapping dokumentieren

### Phase 2 - Minimaler XTend Adapter

- `xtendrmt/xtend-adapter.esm.js` einfuehren
- XTend Manifest Lookup anbinden
- XTend-Komponente aus RMT Component Definition mounten
- RMT Scheduler Diagnostics nach `xstate` spiegeln

### Phase 3 - XRouter Pilot

- `.rmt` Routes laden
- XRouter Route-Struktur daraus erzeugen
- Route-Wechsel ueber RMT Schedule Policy ausfuehren
- Route-Parameter als Template Model bereitstellen

### Phase 4 - DSL-Haertung

- Schema validieren
- Contract-Tests fuer Adapter, Routes und Schedules ergaenzen
- Beispiele und Doku aktualisieren
- Deprecated RMT-Namen aus neuen Beispielen entfernen

### Phase 5 - Multi-Framework Faehigkeit

- Vanilla Adapter als Referenz fuer framework-agnostischen Betrieb bereitstellen
- React/Vue Adapter als optionale Host-Adapter vorbereiten
- Scheduler Parallelbetrieb in gemischten Apps testen

## Migrations- und Framework-Agnostik-Leitplanken

Jede Umsetzung der Fusion muss diese Regeln einhalten:

- XTend wird First-Class Host, aber nicht Pflicht-Host.
- RMT darf keine XTend Runtime, XRouter Runtime oder `xstate`-Keys importieren.
- Host Adapter muessen ihre Capabilities deklarieren, bevor sie RMT Records ausfuehren.
- bestehende XTend-Nutzung bleibt ohne `.rmt` Opt-in stabil.
- React, Vue, Vanilla JS und Custom Hosts bleiben gleichberechtigte Adapter-Ziele.
- Demo-Sonderlogik darf nicht zum dauerhaften DSL-Contract werden.
- neue Beispiele verwenden namespaced XTendRMT/RMT APIs und keine deprecated oder unnamespaced Helper-Namen.
- `rmt-compatibility` und `references` bleiben Mindestgates fuer Epic-04-Kompatibilitaetsarbeit.

## Upstream-Handoff ab WP-E04-11

`development/XTendRMT-Upstream-Handoff-Spezifikation.md` ist ab Epic 04 / `WP-E04-11` der verbindliche Input fuer Epic 05.

Die Source-of-Truth-Regel lautet:

- upstream RMT Source ist die Architekturquelle fuer Kernel, DSL, Adapter, Routing, Components und Tests.
- `xtendrmt/` bleibt Build-Output, Demo-Basis und Regression-Referenz.
- native DSL-Domains `adapters`, `components`, `routes`, `schedules` und `templates` werden additiv modelliert.
- XTend-spezifische Daten bleiben Adapterdaten und duerfen nicht kernel-visible werden.
- `xtend.component`, `xtend.template` und `xtend.xrouter` sind stabile Adapter-IDs fuer die erste produktive Integration.
- Handoff-Aenderungen muessen `node scripts/run_xtend_tests.js rmt-compatibility --json` und `node scripts/run_xtend_tests.js references --json` bestehen.

## Nicht-Ziele

- RMT Core soll keine harte XTend-Abhaengigkeit erhalten.
- XRouter soll nicht zur einzigen Routing-Implementierung von RMT werden.
- XTend-Komponenten sollen nicht in ein proprietaeres RMT-only Komponentenmodell umgeschrieben werden.
- Bestehende `.rmt` Template-Dokumente sollen nicht gebrochen werden.
- Deprecated RMT-Namen sollen nicht als neue Produkt-API fortgefuehrt werden.

## Risiken

- Wenn XTend-Sonderlogik in den Kernel wandert, verliert RMT seine framework-agnostische Rolle.
- Wenn Routing nur als XRouter-Spezialfall modelliert wird, wird spaeterer React-, Vue- oder Custom-Router-Support teuer.
- Wenn Scheduling weiter nur als Optionsblock an einzelnen Templates haengt, wird die DSL bei groesseren Apps unuebersichtlich.
- Wenn deprecated RMT-Namen sichtbar bleiben, entsteht erneute Namens- und Contract-Drift.
- Wenn Adapter-Capabilities nicht formalisiert werden, kann die DSL nicht verlaesslich pruefen, ob ein Host ein Dokument wirklich ausfuehren kann.

## Akzeptanzkriterien

- XTend-Komponenten koennen in `.rmt` als Components deklariert und ueber einen XTend Adapter gemountet oder hydriert werden.
- XRouter-Routen koennen direkt in `.rmt` beschrieben und vom XTend Adapter ausgefuehrt werden.
- Route-Wechsel, Template-Rendering und Hydration koennen RMT Schedule Policies nutzen.
- Der RMT Kernel bleibt ohne XTend-Abhaengigkeit lauffaehig.
- Neue DSL-Domains sind additiv und brechen bestehende Template-Dokumente nicht.
- Adapter-Capabilities sind dokumentiert und testbar.
- Neue Beispiele verwenden `XTendRMT`/`RMT` Namen statt deprecated RMT-Namen.

## Entscheidungssatz

XTendRMT wird als framework-agnostischer RMT Kernel mit offizieller XTend Product Adapter Schicht weiterentwickelt. XTend-Komponenten und XRouter werden First Class Citizens der RMT DSL, ohne den RMT Kernel an XTend zu koppeln. Diese Trennung ist die zentrale Leitplanke gegen Technical Debt und sichert die spaetere Erweiterbarkeit von RMT fuer React, Vue, Vanilla JS und individuelle Host-Anwendungen.
