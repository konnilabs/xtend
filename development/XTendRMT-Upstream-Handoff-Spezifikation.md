# XTendRMT Upstream-Handoff-Spezifikation

- Status: Verbindlich fuer Epic 04 ab `WP-E04-11`
- Datum: 4. Mai 2026
- Bezug:
  - `development/EPIC-04-XTend-Templating-Rendering-und-Framework-Erweiterung.md`
  - `development/WP-E04-02-RMT-Schema-Demo-und-DSL-Gap-Analyse-erstellen.md`
  - `development/WP-E04-09-Pilot-Flow-fuer-RMT-basiertes-XTend-Templating-vorbereiten.md`
  - `development/WP-E04-10-Migrations-und-Framework-Agnostik-Leitplanken-dokumentieren.md`
  - `development/WP-E04-11-Upstream-Handoff-Spezifikation-fuer-XTendRMT-DSL-und-Bridge-vorbereiten.md`
  - `development/ADR-XTendRMT-First-Class-Fusion.md`
  - `development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md`
  - `xtendrmt/rmt.schema.json`
  - `xtendrmt/xtendrmt-bestcase-demo.rmt`
  - `tests/rmt/rmt_compatibility_suite.js`

## Zweck

Dieses Dokument ist der Handoff von Epic 04 an upstream XTendRMT und Epic 05. Es beschreibt, welche DSL-Domains, Bridge-Contracts, Adapter-Anforderungen und Testgates produktiv umgesetzt werden sollen.

Der maschinenlesbare Handoff-Contract ist `xtend.rmt.upstream-handoff.v1`.

Die zentrale Regel bleibt:

- XTendRMT weiss nichts von XTend, kann XTend-Arbeit aber schedulen.
- RMT kann XTend-Templates konstruieren und XRouter-Routen bauen, ohne dass XTend in RMT eingebettet ist.
- Build-Artefakte in `xtendrmt/` bleiben Output und Regression-Referenz, nicht Architekturquelle.

## Source-of-Truth-Regel

Ab Epic 05 duerfen dauerhafte DSL-, Bridge- und Routing-Entscheidungen nicht nur in generierte Bundles oder Demo-Dateien gepatcht werden.

| Artefaktklasse | Rolle |
|----------------|-------|
| upstream RMT Source | Architekturquelle fuer Kernel, DSL, Adapter, Routing, Components, Tests und Build-Pipeline |
| `xtendrmt/rmt.schema.json` | generierter oder bewusst synchronisierter Schema-Output und statische Regression-Referenz |
| `xtendrmt/xtendrmt-bestcase-demo.rmt` | Demo- und Handoff-Referenz fuer Pilotdaten, nicht produktive DSL-Quelle |
| `xtendrmt/xtendrmt-bestcase-demo.js` | UI-Inspect-Demo, nicht produktiver Adapter |
| `development/*` | Architektur-, Workpackage- und Review-Contracts |
| `tests/rmt/*` und `tests/references/*` | lokale Gates fuer Handoff- und Regression-Stabilitaet |

## Zielmodule fuer Upstream

Die konkrete Paketstruktur kann upstream anders benannt werden. Die Verantwortungen muessen jedoch getrennt bleiben:

| Modulbereich | Verantwortung |
|--------------|---------------|
| `rmt-kernel` | Scheduler, Runtime, Template Registry, Execution Plans, Diagnostics und Performance-Budgets |
| `rmt-dsl` | Dokumentmodell, Parser/Normalizer, Schema Source, Referenzaufloesung und Backward Compatibility |
| `rmt-routing` | native `routes` Domain, Route Registry, Lifecycle Events, Params, Query und Metadata |
| `rmt-components` | native `components` Domain, Component Registry, Mount/Hydration Contracts |
| `rmt-adapters` | Host Adapter Contract, Capability Negotiation, Diagnostics und Adapter Lifecycle |
| `rmt-adapter-xtend` | XTend Component Adapter fuer Manifest, Custom Elements, Slots, Events, Hydration, Theme, API und `xstate` |
| `rmt-adapter-xrouter` | XRouter Adapter fuer RMT Routes, Navigation Sync, Params und Route Lifecycle |
| `rmt-tests` | Schema-, Contract-, Adapter-, Runtime-, Browser- und Artifact-Parity-Gates |

## DSL-Domain-Anforderungen

### `adapters`

Die `adapters` Domain beschreibt ausfuehrende Host-, Component-, Router- oder Data-Adapter.

Mindestfelder:

- `id`
- `kind`: `host_adapter`, `component_adapter`, `router_adapter`, `state_adapter` oder `scheduler_adapter`
- `package` oder `moduleRef`
- `capabilities`
- `version`
- `negotiation`
- `diagnostics`

XTend-spezifische Adapter verwenden stabile IDs wie `xtend`, `xtend.component`, `xtend.template` und `xtend.xrouter`. Andere Hosts duerfen eigene IDs registrieren.

### `components`

Die `components` Domain beschreibt neutrale Component Records.

Mindestfelder:

- `id`
- `kind`
- `adapter`
- `tag` oder `renderer`
- `props`
- `attributes`
- `slots`
- `events`
- `hydration`
- `schedule`
- `diagnostics`

Fuer XTend gilt: `tag: "x-..."` ist Adapterdatenfeld. Der Kernel darf daraus keinen Import, kein Manifest-Wissen und keine Custom-Element-Pflicht ableiten.

### `routes`

Die `routes` Domain beschreibt Navigationszustand und Route-Ziele, nicht XRouter-DOM-Strukturen.

Mindestfelder:

- `id`
- `path`
- `title`
- `component`
- `template`
- `router`
- `schedule`
- `params`
- `query`
- `metadata`
- `lifecycle`

`xtend.xrouter` ist der erste produktive Router Adapter. Die DSL muss aber auch React Router, Vue Router oder Custom Router erlauben.

### `schedules`

Die `schedules` Domain bleibt eigenstaendig und referenzierbar.

Mindestfelder:

- `id`
- `endpointName`
- `scope`
- `lane`
- `priority`
- `deadlineMs`
- `preferIdle`
- `coalesceKey`
- `budgetClass`

Routes, Components, Templates und Actions duerfen Schedule Policies referenzieren. Scheduling darf nicht nur als verstreuter privater Optionsblock wachsen.

### `templates`

Die bestehende `templates` Domain bleibt gueltig. Upstream soll sie ergonomischer machen, ohne Template-only-Dokumente zu brechen.

Benannte Verbesserungen:

- `component_ref` oder aequivalente Kurzsyntax fuer Component Attachments
- named slot children syntax
- event command shorthand
- explizite hydration boundaries
- Authoring-Diagnostics fuer fehlende Components, Slots, Events oder Schedules

### spaetere Domains

`actions`, `data` und `roots` sind absehbare Erweiterungen, aber nicht Blocker fuer Epic 05. Ihre Syntax muss an dieselben Adapter- und Scheduler-Grenzen anschliessen.

## Bridge- und Adapter-Anforderungen

Der generische Host Adapter Contract muss fachlich mindestens diese Operationen abbilden:

- `registerAdapter(definition, options)`
- `negotiateCapabilities(requirements, options)`
- `registerComponent(definition, options)`
- `mountComponent(target, componentRef, model, options)`
- `hydrateComponent(target, componentRef, model, options)`
- `registerRoutes(routes, options)`
- `navigate(to, options)`
- `createStateBridge(options)`
- `resolveManifestEntry(tagOrId, options)`
- `scheduleEndpoint(endpointName, scope, callback, options)`
- `emitDiagnostic(event, payload)`

Die Implementierung darf andere Funktionsnamen waehlen. Verbindlich ist die Trennung: Kernel plant und normalisiert, Adapter fuehren Host-Arbeit aus.

## XTend Product Adapter

Der XTend Adapter muss XTend als First-Class Host ausfuehren, ohne XTend zum Pflicht-Host von RMT zu machen.

Pflichten:

- XTend Manifest Lookup
- Custom Element Registration Check
- Erzeugung und Hydration von `x-*` Komponenten
- Props-, Attribute- und Property-Normalisierung
- Slot-Fuellung aus Template- oder Component-Refs
- Event Bridge zu RMT Commands oder Scheduler Jobs
- `xstate` Diagnostics Bridge als optionale Capability
- Theme- und API-Zugriff nur als deklarierte Host Capabilities
- Fehlerdiagnostics fuer fehlende Components, Slots, Events, Capabilities und Manifest-Eintraege

Verboten:

- XTend Runtime Import im RMT Kernel
- XRouter Runtime Import im RMT Kernel
- `xstate.set` direkt aus dem RMT Kernel
- implizite XTend-Pflicht fuer nicht-XTend Hosts

## XRouter Adapter

Der XRouter Adapter ist die erste produktive Implementierung der generischen `routes` Domain.

Pflichten:

- RMT Route Records in XRouter-Konfiguration oder `x-route` Strukturen ueberfuehren
- Navigation zwischen RMT Commands und XRouter Events synchronisieren
- Route Params und Query Values in Template-/Component-Modelle geben
- Route Lifecycle Events fuer enter, leave, update, error und notFound melden
- Route-Wechsel, sichtbares Rendering und Hydration ueber Schedule Policies koppeln
- Diagnostics an RMT und optional an XTend `xstate` spiegeln

XRouter darf nicht zur einzigen erlaubten Routing-Implementierung werden.

## Epic-05-Startkriterien

Epic 05 startet produktiv, wenn diese Bedingungen akzeptiert sind:

- diese Handoff-Spezifikation ist in Epic 05 verlinkt
- Build-Artefakte bleiben Output und werden aus upstream Source erzeugt oder bewusst synchronisiert
- native Top-Level-Domains `adapters`, `components`, `routes`, `schedules` und `templates` sind als additive Zielstruktur bestaetigt
- bestehende Template-only-`.rmt` Dokumente bleiben gueltig
- der Kernel importiert keine XTend-, XRouter- oder `xstate`-Runtime
- XTend-spezifische Adapterdaten sind nicht kernel-visible
- `xtend.component`, `xtend.template` und `xtend.xrouter` sind stabile Adapter-IDs fuer die erste produktive XTend Integration
- `node scripts/run_xtend_tests.js rmt-compatibility --json` und `node scripts/run_xtend_tests.js references --json` sind Mindestgates fuer Handoff-Aenderungen

## Verifikationsanforderungen

Epic 05 muss die Gates aus Epic 04 fortfuehren und ausbauen:

- Schema-Tests fuer alte Template-only-Dokumente und neue App-DSL-Dokumente
- Contract-Tests fuer Adapter Lifecycle und Capability Negotiation
- Component-Domain-Tests fuer XTend Component Records
- Route-Domain-Tests fuer XRouter und mindestens einen nicht-XRouter-Adapterpfad oder Mock-Adapter
- Scheduler-Policy-Tests fuer route, component, template und diagnostics work
- Browser-Smokes fuer XTend Bestcase, Route-Wechsel, Hydration und sichtbare Aktivierung
- Artifact-Parity-Tests, die upstream Source mit `xtendrmt/` Output abgleichen
- Reference-Gates fuer Doku, Demo und Migration

## Nicht-Ziele fuer den Handoff

- keine produktive Bridge-Implementierung in Epic 04
- keine native RMT Route Runtime in Epic 04
- keine erzwungene Migration bestehender XTend-, React-, Vue-, Vanilla- oder Custom-Apps
- keine zweite XTend-eigene Template-Sprache neben RMT
- keine dauerhafte Demo-Sonderlogik als DSL-Contract

## Ergebnis

Epic 04 uebergibt einen stabilen, pruefbaren Handoff an Epic 05. XTend UI ist als First-Class Host vorbereitet, XTendRMT bleibt framework-agnostisch und die produktive DSL-/Bridge-Arbeit kann upstream an klar getrennten Modulen beginnen.
