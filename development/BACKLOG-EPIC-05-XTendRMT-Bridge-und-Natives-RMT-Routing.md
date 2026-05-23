# Backlog zu Epic 05 - XTendRMT Bridge und natives RMT Routing

- Status: Completed
- Datum: 4. Mai 2026
- Bezug:
  - `development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md`
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
  - `development/EPIC-04-XTend-Templating-Rendering-und-Framework-Erweiterung.md`
  - `development/WP-E04-12-Epic-Abschlussreview-und-KPI-Abnahme.md`
  - `development/XTendRMT-Upstream-Handoff-Spezifikation.md`
  - `development/XTendRMT-Migrations-und-Framework-Agnostik-Leitplanken.md`
  - `development/ADR-XTendRMT-First-Class-Fusion.md`
  - `xtendrmt/rmt.schema.json`
  - `xtendrmt/rmt-manifest.json`
  - `xtendrmt/rmt-core.d.ts`
  - `xtendrmt/xtendrmt-bestcase-demo.rmt`
  - `xtendrmt/xtendrmt-bestcase-demo.js`
  - `tests/browser/fixtures/rmt-xrouter-xtend-smoke.html`
  - `tests/rmt/rmt_compatibility_suite.js`
  - `tests/references/reference_path_suite.js`

## Zweck

Dieses Dokument zerlegt Epic 05 in konkrete Workpackages. Der Epic fuehrt die in Epic 04 vorbereiteten XTendRMT-Contracts in eine produktive Bridge, native RMT Routing-Domain, XTend Component Adapter und XRouter Adapter ueber.

Die zentrale Leitplanke bleibt:

- RMT Kernel bleibt host-neutral und importiert keine XTend-, XRouter- oder `xstate`-Runtime.
- XTend UI wird First-Class Host ueber Adapterqualitaet, nicht ueber Kernel-Sonderfaelle.
- XRouter ist der erste produktive Router Adapter, aber nicht die einzige erlaubte Routing-Implementierung.
- Build-Artefakte in `xtendrmt/` bleiben Output und Regression-Referenz; dauerhafte Produktarbeit gehoert in upstream Source.

## Definition of Ready

Ein Workpackage darf gestartet werden, wenn:

- die Epic-04-Handoff-Spezifikation fuer den betroffenen Bereich gelesen ist
- Kernel-, DSL-, Adapter- und Build-Artefakt-Grenzen klar sind
- betroffene Source-, Schema-, Demo-, Test- und Dokumentationspfade bekannt sind
- ein pruefbares Definition-of-Done vorliegt
- bestehende Template-only-`.rmt` Dokumente nicht gebrochen werden
- Framework-Agnostik und Opt-in-Migration erhalten bleiben

## Priorisierungslogik

- `P0`: schafft Source-of-Truth, zentrale Contracts oder native DSL-Domains
- `P1`: implementiert produktive Runtime-, Adapter-, Registry- oder Build-Pfade
- `P2`: haertet, migriert, testet, dokumentiert oder schliesst den Epic ab

## Statuslogik

- `ready`: kann sofort gestartet werden
- `in_progress`: ist fachlich und technisch in Bearbeitung
- `completed`: Zielartefakt ist erstellt und fuer den Epic wirksam
- `next`: ist als naechstes fachlich sinnvoll, braucht aber einen kurzen Vorgaenger
- `blocked`: sollte erst nach den benannten Abhaengigkeiten gestartet werden

## Naechste startbare Workpackages

Keine offenen Workpackages innerhalb Epic 05.

`WP-01` ist abgeschlossen und akzeptiert den Epic-04-Handoff.
`WP-02` ist abgeschlossen und definiert den host-neutralen Adapter Contract mit Lifecycle-Phasen, Operationen, Runtime-Surfaces, Result- und Diagnostics-Contract. `WP-03` kann nun Adapter Registry und Capability Negotiation darauf aufbauen.
`WP-03` ist abgeschlossen und modelliert Adapter Registry, Capability Requests, Negotiation Flow, Results und Diagnostics. `WP-04`, `WP-05` und `WP-06` koennen die nativen Domains nun daran anbinden.
`WP-04` ist abgeschlossen und fuehrt `adapters` als optionale native Top-Level-Domain ein. `WP-05` und `WP-06` koennen Components und Routes nun gegen native Adapter-Records referenzieren.
`WP-05` ist abgeschlossen und fuehrt `components` als optionale native Top-Level-Domain ein. `WP-06` kann Routes nun gegen native Component Records referenzieren.
`WP-06` ist abgeschlossen und fuehrt `routes` als optionale native Top-Level-Domain ein. `WP-07` kann Schedule Policies nun fuer Routes, Components und Templates referenzierbar haerten.
`WP-07` ist abgeschlossen und fuehrt `schedules` als optionale native Top-Level-Policy-Domain ein. `WP-08` kann nun alte und neue `.rmt` Dokumente normalisieren und Schedule-Refs referenziell pruefen.
`WP-08` ist abgeschlossen und sichert die DSL-Normalisierung fuer Template-only-, native App-DSL- und Legacy-Metadata-Dokumente. `WP-09` kann nun Route Registry und Component Registry auf normalisierte Records setzen.
`WP-09` ist abgeschlossen und stellt Route Registry sowie Component Registry als host-neutrale Runtime-Snapshots bereit. `WP-10` und `WP-11` koennen nun produktive Adapter auf diesen Registries implementieren.
`WP-10` ist abgeschlossen und macht XRouter als ersten produktiven Router Adapter fuer native RMT Routes nutzbar. `WP-11`, `WP-12` und `WP-14` koennen nun auf Route-Mapping, Navigation Sync und `scheduleRef`-Weitergabe aufbauen.
`WP-11` ist abgeschlossen und macht XTend UI als ersten produktiven Component Adapter fuer native RMT Components nutzbar. `WP-12` kann nun State-, Scheduler- und Diagnostics Bridge ueber Route-/Component-Adapter-Results anbinden.
`WP-12` ist abgeschlossen und bindet Adapter Results, Schedule Policies, optionale `xstate`-Spiegelung, Scheduler Endpoints und Diagnostics als host-neutrale Bridge zusammen. `WP-13` konnte darauf Artefakt-Paritaet absichern; `WP-14` blieb bis zu diesem Gate geblockt.

`WP-13` ist abgeschlossen und sichert Schema, Manifest, Typen, ESM-Bundles und Browser-Bundle ueber den dedizierten Artifact-Parity-Gate `node scripts/verify_xtendrmt_artifact_parity.js --json` ab. `WP-14` konnte dadurch die Bestcase-Demo auf native `routes`, `components`, produktive Adapter und Bridge-Pfade migrieren.

`WP-14` ist abgeschlossen und migriert die Bestcase-Demo auf native RMT Domains. `xtendrmt/xtendrmt-bestcase-demo.rmt` fuehrt `adapters`, `components`, `routes` und `schedules` nun als Top-Level-Domains; `xtendrmt/xtendrmt-bestcase-demo.js` nutzt `createRmtXRouterAdapter`, `createRmtXtendComponentAdapter` und `createRmtStateSchedulerDiagnosticsBridge` statt eigener dauerhafter Demo-Brueckenlogik. `WP-15` kann nun die Contract-, Schema- und Runtime-Tests auf den nativen Demo-Pfad ausweiten.

`WP-15` ist abgeschlossen und erweitert die RMT-Kompatibilitaetssuite um eine native Bridge-Fixture, produktive Adapter-Regressionen sowie ESM- und browser-nahe Runtime-Probes. `WP-16` konnte darauf Browser-Smokes und Multi-Host-Regression aufbauen.

`WP-16` ist abgeschlossen und fuegt eine browsernahe RMT/XRouter/XTend/Vanilla-Smoke-Fixture mit Contract `xtend.rmt.wp16.browser-smoke-fixture.v1` hinzu. `WP-17` kann nun Authoring-Dokumentation auf getestete native Browser-Flows setzen.

`WP-17` ist abgeschlossen und fuehrt die Guides `docs/xtendrmt-native-authoring.md` sowie `docs/xtendrmt-migration-guide.md` ein. `WP-18` kann nun das Epic-Abschlussreview und die KPI-Abnahme starten.

`WP-18` ist abgeschlossen und nimmt Epic 05 final gegen KPI, Akzeptanzkriterien, Risiken und Testgates ab. Epic 05 ist damit abgeschlossen.

## Backlog-Uebersicht

| ID | Prioritaet | Status | Workstream | Titel | Abhaengigkeiten |
|----|------------|--------|------------|-------|-----------------|
| `WP-01` | P0 | completed | WS6 | Epic-04-Handoff akzeptieren und Upstream-Source-of-Truth festlegen | Epic 04 |
| `WP-02` | P0 | completed | WS1 | Host Adapter Contract und Adapter Lifecycle definieren | `WP-01` |
| `WP-03` | P0 | completed | WS1 | Adapter Registry und Capability Negotiation modellieren | `WP-02` |
| `WP-04` | P0 | completed | WS2 | Native `adapters` Domain im RMT Schema entwerfen | `WP-02`, `WP-03` |
| `WP-05` | P0 | completed | WS4 | Native `components` Domain im RMT Schema entwerfen | `WP-02`, `WP-03` |
| `WP-06` | P0 | completed | WS2 | Native `routes` Domain im RMT Schema entwerfen | `WP-02`, `WP-03` |
| `WP-07` | P1 | completed | WS5 | `schedules` Domain als referenzierbare Policy haerten | `WP-04`, `WP-05`, `WP-06` |
| `WP-08` | P1 | completed | WS2 | DSL Normalisierung und Backward Compatibility fuer alte und neue `.rmt` Dokumente sichern | `WP-04`, `WP-05`, `WP-06`, `WP-07` |
| `WP-09` | P1 | completed | WS2/WS4 | Route Registry und Component Registry im RMT Runtime-Modell vorbereiten | `WP-08` |
| `WP-10` | P1 | completed | WS3 | XRouter Adapter produktfaehig implementieren | `WP-06`, `WP-09` |
| `WP-11` | P1 | completed | WS4 | XTend Component Adapter produktfaehig implementieren | `WP-05`, `WP-09` |
| `WP-12` | P1 | completed | WS5 | State-, Scheduler- und Diagnostics Bridge anbinden | `WP-10`, `WP-11` |
| `WP-13` | P1 | completed | WS6 | Build-Pipeline und Artefakt-Paritaet fuer `xtendrmt/` absichern | `WP-01`, `WP-08` |
| `WP-14` | P2 | completed | WS7 | Bestcase-Demo auf native `routes` und `components` migrieren | `WP-10`, `WP-11`, `WP-12`, `WP-13` |
| `WP-15` | P2 | completed | WS7 | Contract-, Schema- und Runtime-Tests erweitern | `WP-08`, `WP-12`, `WP-14` |
| `WP-16` | P2 | completed | WS7 | Browser-Smokes und Multi-Host-Regression fuer RMT/XRouter/XTend absichern | `WP-14`, `WP-15` |
| `WP-17` | P2 | completed | WS7 | Dokumentation und Authoring-Beispiele fuer native RMT Routes und XTend Components schreiben | `WP-14`, `WP-15` |
| `WP-18` | P2 | completed | WS7 | Epic-Abschlussreview und KPI-Abnahme | `WP-15`, `WP-16`, `WP-17` |

## Workpackages im Detail

### WP-01 - Epic-04-Handoff akzeptieren und Upstream-Source-of-Truth festlegen

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - die upstream-fuehrende RMT-Quellstruktur identifizieren oder als Zielstruktur festlegen
- Scope:
  - `development/XTendRMT-Upstream-Handoff-Spezifikation.md`
  - Source-of-Truth-Regel fuer `rmt-kernel`, `rmt-dsl`, `rmt-routing`, `rmt-components`, `rmt-adapters`, `rmt-adapter-xtend`, `rmt-adapter-xrouter` und `rmt-tests`
  - Grenze zwischen upstream Source, Build-Artefakt und Demo-Code
  - Startentscheidung fuer Build-Pipeline und Modulverantwortung
- Zielartefakte:
  - Workpackage-Dokument unter `development/WP-E05-01-Epic-04-Handoff-akzeptieren-und-Upstream-Source-of-Truth-festlegen.md`
  - Source-of-Truth-Entscheidung fuer Epic 05
  - Modulverantwortungsmatrix
  - erste Build-Artefakt-Grenze fuer `xtendrmt/`
- Betroffene Dateien:
  - `development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md`
  - `development/BACKLOG-EPIC-05-XTendRMT-Bridge-und-Natives-RMT-Routing.md`
  - `development/XTendRMT-Upstream-Handoff-Spezifikation.md`
  - `xtendrmt/`
- Definition of Done:
  - Epic 05 hat eine klare Architekturquelle
  - Build-Artefakte sind weiterhin Output, nicht Source-of-Truth
  - `WP-02` kann den Host Adapter Contract ohne Strukturunklarheit starten

### WP-02 - Host Adapter Contract und Adapter Lifecycle definieren

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - generischen Host Adapter Contract fuer RMT definieren
- Scope:
  - Adapter Registrierung
  - Mounting, Hydration, Navigation und Diagnostics
  - Runtime-Oberflaechen fuer ESM und Browser
  - keine XTend-Sonderfaelle im Kernel
- Zielartefakte:
  - Workpackage-Dokument unter `development/WP-E05-02-Host-Adapter-Contract-und-Adapter-Lifecycle-definieren.md`
  - Adapter Lifecycle Contract
  - Operations-Matrix fuer `registerAdapter`, `mountComponent`, `hydrateComponent`, `registerRoutes`, `navigate`, `emitDiagnostic`
- Betroffene Dateien:
  - upstream `rmt-adapters`
  - `xtendrmt/rmt-core.d.ts`
  - `xtendrmt/rmt.schema.json`
- Definition of Done:
  - Host Adapter Contract ist host-neutral dokumentiert
  - XTend, XRouter und weitere Hosts koennen denselben Contract nutzen
  - `WP-03` kann Capability Negotiation darauf aufbauen

### WP-03 - Adapter Registry und Capability Negotiation modellieren

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - Adapter und Host Capabilities in `.rmt` Dokumenten pruefbar machen
- Scope:
  - Adapter Registry
  - Capability Requirements und Preferences
  - Fehlerdiagnostics bei fehlenden Capabilities
  - Host-neutraler Negotiation Flow
- Zielartefakte:
  - Workpackage-Dokument unter `development/WP-E05-03-Adapter-Registry-und-Capability-Negotiation-modellieren.md`
  - Capability Negotiation Contract
  - Adapter Registry Contract
- Betroffene Dateien:
  - upstream `rmt-adapters`
  - upstream `rmt-dsl`
  - `xtendrmt/rmt.schema.json`
- Definition of Done:
  - `.rmt` Dokumente koennen Adapter- und Capability-Anforderungen deklarieren
  - fehlende Capabilities erzeugen diagnostics statt stiller Runtime-Fehler
  - `WP-04`, `WP-05` und `WP-06` koennen native Domains daran anbinden

### WP-04 - Native `adapters` Domain im RMT Schema entwerfen

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - `adapters` als native Top-Level-Domain modellieren
- Scope:
  - `host_adapter`, `component_adapter`, `router_adapter`, `state_adapter`, `scheduler_adapter`
  - Version, Package/ModuleRef, Capabilities und Diagnostics
  - Backward Compatibility zu bestehenden Template-only-Dokumenten
- Zielartefakte:
  - Workpackage-Dokument unter `development/WP-E05-04-Native-Adapters-Domain-im-RMT-Schema-entwerfen.md`
  - Schema-Entwurf fuer `adapters`
  - Validierungsbeispiele fuer XTend und nicht-XTend Hosts
- Betroffene Dateien:
  - upstream `rmt-dsl`
  - `xtendrmt/rmt.schema.json`
  - `tests/rmt/`
- Definition of Done:
  - `adapters` ist additiv beschreibbar
  - `xtend.component`, `xtend.template` und `xtend.xrouter` sind valide Adapter-IDs
  - alte Dokumente ohne `adapters` bleiben gueltig

### WP-05 - Native `components` Domain im RMT Schema entwerfen

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - XTend-Komponenten und andere Component Hosts als neutrale RMT Components modellieren
- Scope:
  - `id`, `kind`, `adapter`, `tag`, `props`, `attributes`, `slots`, `events`, `hydration`, `schedule`, `diagnostics`
  - XTend Custom Elements als Adapterdaten
  - keine Manifest-Annahme im Kernel
- Zielartefakte:
  - Workpackage-Dokument unter `development/WP-E05-05-Native-Components-Domain-im-RMT-Schema-entwerfen.md`
  - Schema-Entwurf fuer `components`
  - Beispiele fuer XTend und generische Custom Elements
- Betroffene Dateien:
  - upstream `rmt-components`
  - upstream `rmt-dsl`
  - `xtendrmt/rmt.schema.json`
- Definition of Done:
  - `components` ist native Domain, nicht nur `manifest.metadata`
  - XTend Component Records bleiben host-neutral interpretierbar
  - `WP-11` kann produktiven XTend Adapter darauf aufbauen
  - siehe `development/WP-E05-05-Native-Components-Domain-im-RMT-Schema-entwerfen.md`

### WP-06 - Native `routes` Domain im RMT Schema entwerfen

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - Routing als generische RMT-Domain statt XRouter-Metadaten modellieren
- Scope:
  - `id`, `path`, `title`, `component`, `template`, `router`, `schedule`, `params`, `query`, `metadata`, `lifecycle`
  - route lifecycle events
  - XRouter als Adapter, nicht als Kernelmodell
- Zielartefakte:
  - Workpackage-Dokument unter `development/WP-E05-06-Native-Routes-Domain-im-RMT-Schema-entwerfen.md`
  - Schema-Entwurf fuer `routes`
  - native Route-Beispiele fuer XRouter und Mock-Router
- Betroffene Dateien:
  - upstream `rmt-routing`
  - upstream `rmt-dsl`
  - `xtendrmt/rmt.schema.json`
- Definition of Done:
  - `routes` ist native Domain
  - Route-Records sind router-unabhaengig
  - `WP-10` kann XRouter darauf produktiv mappen
  - siehe `development/WP-E05-06-Native-Routes-Domain-im-RMT-Schema-entwerfen.md`

### WP-07 - `schedules` Domain als referenzierbare Policy haerten

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - RMT Scheduling fuer Routes, Components, Templates und Diagnostics als eigene Policy-Domain absichern
- Scope:
  - `endpointName`, `scope`, `lane`, `priority`, `deadlineMs`, `preferIdle`, `coalesceKey`, `budgetClass`
  - string refs und inline schedule policies
  - Performance- und Diagnostics-Budgets
- Zielartefakte:
  - Workpackage-Dokument unter `development/WP-E05-07-Schedules-Domain-als-referenzierbare-Policy-haerten.md`
  - Schedule Policy Contract
  - Tests fuer route, component, template und diagnostics work
- Betroffene Dateien:
  - upstream `rmt-kernel`
  - upstream `rmt-dsl`
  - `xtendrmt/rmt.schema.json`
- Definition of Done:
  - Scheduling bleibt eigene Domain
  - Domains referenzieren Policies statt private Optionsbloecke zu duplizieren
  - sichtbare und idle Arbeit sind unterscheidbar
  - siehe `development/WP-E05-07-Schedules-Domain-als-referenzierbare-Policy-haerten.md`

### WP-08 - DSL Normalisierung und Backward Compatibility fuer alte und neue `.rmt` Dokumente sichern

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - alte Template-only-Dokumente und neue App-DSL-Dokumente gemeinsam validieren und normalisieren
- Scope:
  - Parser/Normalizer
  - Referenzaufloesung fuer adapters, components, routes, templates und schedules
  - Backward Compatibility
  - diagnostics fuer fehlende Referenzen
- Zielartefakte:
  - Workpackage-Dokument unter `development/WP-E05-08-DSL-Normalisierung-und-Backward-Compatibility-sichern.md`
  - Normalisierungsregeln
  - Schema-Fixtures fuer alte und neue `.rmt` Dokumente
- Betroffene Dateien:
  - upstream `rmt-dsl`
  - `tests/rmt/`
  - `xtendrmt/xtendrmt-bestcase-demo.rmt`
- Definition of Done:
  - Template-only-Dokumente bleiben gueltig
  - neue Domains werden normalisiert und referenziell geprueft
  - `WP-09` kann Registries auf normalisierte Records setzen
  - siehe `development/WP-E05-08-DSL-Normalisierung-und-Backward-Compatibility-sichern.md`

### WP-09 - Route Registry und Component Registry im RMT Runtime-Modell vorbereiten

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - native Routes und Components zur Runtime bringbar machen
- Scope:
  - Route Registry
  - Component Registry
  - Reference Resolver
  - Lifecycle Events fuer route/component create, mount, hydrate, update, dispose
- Zielartefakte:
  - Workpackage-Dokument unter `development/WP-E05-09-Route-Registry-und-Component-Registry-vorbereiten.md`
  - Registry Contracts
  - Runtime-Diagnostics fuer fehlende Routes/Components
- Betroffene Dateien:
  - upstream `rmt-routing`
  - upstream `rmt-components`
  - upstream `rmt-kernel`
- Definition of Done:
  - Runtime kann normalisierte routes und components registrieren
  - Adapter koennen Registries konsumieren
  - `WP-10` und `WP-11` koennen produktiv implementieren
  - siehe `development/WP-E05-09-Route-Registry-und-Component-Registry-vorbereiten.md`

### WP-10 - XRouter Adapter produktfaehig implementieren

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - XRouter als ersten offiziellen Router Adapter fuer RMT Routes anbinden
- Scope:
  - Mapping von RMT Routes auf XRouter
  - Navigation Sync zwischen RMT Commands und XRouter Events
  - Route Params, Query und Metadata ins Model
  - Route Lifecycle und Scheduler Coupling
- Zielartefakte:
  - Workpackage-Dokument unter `development/WP-E05-10-XRouter-Adapter-produktfaehig-implementieren.md`
  - produktiver XRouter Adapter
  - Regression gegen Bestcase-Demo
- Betroffene Dateien:
  - upstream `rmt-adapter-xrouter`
  - `components/xrouter.js`
  - `xtendrmt/xtendrmt-bestcase-demo.js`
- Definition of Done:
  - `.rmt` Routes koennen XRouter steuern
  - XRouter bleibt Adapter, nicht Kernelwissen
  - Route-Wechsel koennen Schedule Policies nutzen
  - siehe `development/WP-E05-10-XRouter-Adapter-produktfaehig-implementieren.md`

### WP-11 - XTend Component Adapter produktfaehig implementieren

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - XTend-Komponenten als First-Class RMT Components mounten und hydrieren
- Scope:
  - Manifest Lookup
  - Custom Element Registration Check
  - Props, Attributes, Properties, Slots und Events
  - Hydration und Diagnostics
- Zielartefakte:
  - Workpackage-Dokument unter `development/WP-E05-11-XTend-Component-Adapter-produktfaehig-implementieren.md`
  - produktiver XTend Component Adapter
  - Fehlerdiagnostics fuer fehlende Components und Slots
- Betroffene Dateien:
  - upstream `rmt-adapter-xtend`
  - `components/manifest.json`
  - `xtendrmt/xtendrmt-bestcase-demo.js`
- Definition of Done:
  - `.rmt` Components koennen XTend Custom Elements mounten/hydrieren
  - Manifest- und Custom-Element-Arbeit bleibt Adapteraufgabe
  - RMT Kernel importiert keine XTend Runtime
  - siehe `development/WP-E05-11-XTend-Component-Adapter-produktfaehig-implementieren.md`

### WP-12 - State-, Scheduler- und Diagnostics Bridge anbinden

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - RMT Runtime-Zustaende fuer XTend sichtbar und steuerbar machen
- Scope:
  - `xstate` Diagnostics Bridge
  - Scheduler Endpoints fuer route render, component mount/hydrate und diagnostics
  - Performance Budgets
  - Fehler- und Lifecycle Events
- Zielartefakte:
  - Workpackage-Dokument unter `development/WP-E05-12-State-Scheduler-und-Diagnostics-Bridge-anbinden.md`
  - State Bridge Contract
  - Diagnostics Event Matrix
- Betroffene Dateien:
  - upstream `rmt-kernel`
  - upstream `rmt-adapter-xtend`
  - `components/xstate.js`
- Definition of Done:
  - RMT kann relevante Runtime-Zustaende diagnostizieren
  - XTend kann Diagnostics optional nach `xstate` spiegeln
  - Scheduler-Arbeit bleibt endpoint-basiert und host-neutral
  - siehe `development/WP-E05-12-State-Scheduler-und-Diagnostics-Bridge-anbinden.md`

### WP-13 - Build-Pipeline und Artefakt-Paritaet fuer `xtendrmt/` absichern

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - upstream Source und Build-Artefakte reproduzierbar verbinden
- Scope:
  - Build fuer Browser-, ESM-, Typ- und Schema-Artefakte
  - Artefaktvergleich
  - Smoke nach Build
  - kein manuelles Bundle-Patching als Dauerpfad
- Zielartefakte:
  - Workpackage-Dokument unter `development/WP-E05-13-Build-Pipeline-und-Artefakt-Paritaet-fuer-XTendRMT-absichern.md`
  - Build- oder Sync-Plan
  - Artifact-Parity-Gate
  - `scripts/verify_xtendrmt_artifact_parity.js`
- Betroffene Dateien:
  - upstream RMT Source
  - `xtendrmt/`
  - `tests/rmt/`
- Definition of Done:
  - `xtendrmt/` Artefakte sind reproduzierbarer Output oder bewusst synchronisierte Regression-Referenz
  - Schema, Typen und Runtime-Bundles driften nicht still auseinander
  - `WP-14` kann Demo-Migration auf produktive Artefakte setzen
  - siehe `development/WP-E05-13-Build-Pipeline-und-Artefakt-Paritaet-fuer-XTendRMT-absichern.md`

### WP-14 - Bestcase-Demo auf native `routes` und `components` migrieren

- Prioritaet: `P2`
- Status: `completed`
- Ziel:
  - Demo-Sonderlogik in produktive Bridge-/Adapterpfade ueberfuehren
- Scope:
  - native `routes`
  - native `components`
  - native Adapter- und Schedule-Refs
  - Entfernen dauerhafter Demo-Brueckenlogik
- Zielartefakte:
  - Workpackage-Dokument unter `development/WP-E05-14-Bestcase-Demo-auf-native-Routes-und-Components-migrieren.md`
  - migrierte `xtendrmt/xtendrmt-bestcase-demo.rmt`
  - Demo nutzt produktive Adapter statt eigener Bridge-Logik
- Betroffene Dateien:
  - `xtendrmt/xtendrmt-bestcase-demo.rmt`
  - `xtendrmt/xtendrmt-bestcase-demo.js`
  - `tests/browser/fixtures/rmt-xrouter-xtend-smoke.html`
- Definition of Done:
  - Bestcase-Demo nutzt native RMT Domains
  - produktive Adapter ersetzen Demo-Brueckenlogik
  - bestehende Demo-Experience bleibt stabil
- Ergebnis:
  - siehe `development/WP-E05-14-Bestcase-Demo-auf-native-Routes-und-Components-migrieren.md`

### WP-15 - Contract-, Schema- und Runtime-Tests erweitern

- Prioritaet: `P2`
- Status: `completed`
- Ziel:
  - produktive Bridge-, Schema- und Runtime-Arbeit lokal absichern
- Scope:
  - Schema-Tests fuer alte und neue `.rmt`
  - Adapter Contract Tests
  - Route/Component Registry Tests
  - Runtime-Smokes fuer ESM und Browser-nahe Pfade
- Zielartefakte:
  - Workpackage-Dokument unter `development/WP-E05-15-Contract-Schema-und-Runtime-Tests-erweitern.md`
  - erweiterte `tests/rmt` Suite
  - Referenz-Fixtures fuer native Domains
- Betroffene Dateien:
  - `tests/rmt/`
  - `tests/references/reference_path_suite.js`
  - `scripts/run_xtend_tests.js`
- Definition of Done:
  - neue Domains und Adapter haben Contract-Tests
  - alte Template-only-Dokumente sind weiterhin im Gate
  - produktive Bridge-Regression ist lokal sichtbar
- Ergebnis:
  - siehe `development/WP-E05-15-Contract-Schema-und-Runtime-Tests-erweitern.md`

### WP-16 - Browser-Smokes und Multi-Host-Regression fuer RMT/XRouter/XTend absichern

- Prioritaet: `P2`
- Status: `completed`
- Ziel:
  - RMT Scheduler, XRouter und XTend Components browsernah gemeinsam pruefen
- Scope:
  - Browser-Smoke fuer route Wechsel
  - XTend Component Mount/Hydration
  - Scheduler-Endpoint-Signale
  - mindestens ein Mock- oder Vanilla-Host-Pfad fuer Framework-Agnostik
- Zielartefakte:
  - Workpackage-Dokument unter `development/WP-E05-16-Browser-Smokes-und-Multi-Host-Regression-absichern.md`
  - Browser-Smoke-Fixture
  - Multi-Host-Regression-Notiz
- Betroffene Dateien:
  - `tests/browser/`
  - `tests/rmt/`
  - `tests/browser/fixtures/rmt-xrouter-xtend-smoke.html`
- Definition of Done:
  - gemeinsamer RMT/XRouter/XTend-Flow ist browsernah pruefbar
  - Framework-Agnostik ist mindestens durch einen nicht-XTend Mock- oder Vanilla-Pfad belegt
  - `npm test` bleibt finaler Default-Gate
- Ergebnis:
  - siehe `development/WP-E05-16-Browser-Smokes-und-Multi-Host-Regression-absichern.md`

### WP-17 - Dokumentation und Authoring-Beispiele fuer native RMT Routes und XTend Components schreiben

- Prioritaet: `P2`
- Status: `completed`
- Ziel:
  - das produktive Authoring-Modell fuer `.rmt` Routes und XTend Components dokumentieren
- Scope:
  - native routes
  - native components
  - adapters und schedules
  - Migration von `manifest.metadata` zu Top-Level-Domains
  - Beispiele fuer XRouter und XTend Component Adapter
- Zielartefakte:
  - Workpackage-Dokument unter `development/WP-E05-17-Dokumentation-und-Authoring-Beispiele-schreiben.md`
  - Authoring Guide fuer native RMT Routes und Components
  - Migration Guide fuer Bestcase- und Template-only-Dokumente
- Betroffene Dateien:
  - `docs/`
  - `development/`
  - `tests/references/reference_path_suite.js`
- Definition of Done:
  - Menschen und AI-Agenten koennen native `.rmt` Routing-/Component-Dokumente schreiben
  - Migration von alten Metadatenpfaden ist beschrieben
  - Reference-Gate prueft zentrale Dokumente
- Ergebnis:
  - siehe `development/WP-E05-17-Dokumentation-und-Authoring-Beispiele-schreiben.md`

### WP-18 - Epic-Abschlussreview und KPI-Abnahme

- Prioritaet: `P2`
- Status: `completed`
- Ziel:
  - Epic 05 final gegen Ziele, KPI, Risiken und Tests abnehmen
- Scope:
  - Akzeptanzkriterien aus Epic 05
  - KPI-Bewertung
  - Test- und Browser-Gate-Ergebnis
  - Restrisiken und Folgepunkte
- Zielartefakte:
  - Workpackage-Dokument unter `development/WP-E05-18-Epic-Abschlussreview-und-KPI-Abnahme.md`
  - finaler Abnahmereport
  - aktualisierter Epic- und Backlog-Status
- Betroffene Dateien:
  - `development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md`
  - `development/BACKLOG-EPIC-05-XTendRMT-Bridge-und-Natives-RMT-Routing.md`
  - `tests/references/reference_path_suite.js`
- Definition of Done:
  - Epic 05 ist abgeschlossen oder bewusste Restpunkte sind dokumentiert
  - `npm test` ist als finales lokales Gate gelaufen
  - produktive Bridge, native Routes und XTend/XRouter Adapter sind dokumentiert und getestet
- Ergebnis:
  - siehe `development/WP-E05-18-Epic-Abschlussreview-und-KPI-Abnahme.md`

## Epic-Start Mai 2026

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

## Definition of Done

Der Epic ist abgeschlossen, wenn XTend und RMT ueber eine feste, dokumentierte und getestete Bridge verbunden sind, XRouter-Routing nativ in `.rmt` Dateien beschrieben und ausgefuehrt werden kann, XTend-Komponenten als First-Class RMT Components nutzbar sind und der RMT Kernel trotzdem framework-agnostisch bleibt. Die produktive Implementierung muss upstream in der RMT-Quellstruktur verankert sein und die Artefakte in `xtendrmt/` reproduzierbar erzeugen.
