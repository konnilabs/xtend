# XTend Epic 04 - XTendRMT DSL-Templating und Kompatibilitaetsvorbereitung

- Status: Completed
- Datum: 4. Mai 2026
- Typ: Epic / Architektur- und Vorbereitungsdokument
- Bezugsdokumente:
  - `docs/XTend-ADR.md`
  - `development/compliance/digital-twin-principle.md`
  - `development/compliance/update-instructions.md`
  - `development/EPIC-01-XTend-Core-Standardisierung-und-Konsolidierung.md`
  - `development/EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren.md`
  - `development/EPIC-03-XTend-Scaffold-Build-Environment-und-Developer-Workflow.md`
  - `development/BACKLOG-EPIC-04-XTendRMT-DSL-Templating-und-Kompatibilitaetsvorbereitung.md`
  - `development/WP-E04-01-Produktmodell-Scope-und-RMT-Templating-Zielbild-festlegen.md`
  - `development/WP-E04-02-RMT-Schema-Demo-und-DSL-Gap-Analyse-erstellen.md`
  - `development/WP-E04-03-XTend-Component-Contract-fuer-RMT-Kompatibilitaet-definieren.md`
  - `development/WP-E04-04-RMT-Template-Authoring-Model-fuer-XTend-UI-vorbereiten.md`
  - `development/WP-E04-05-Root-Lifecycle-und-Scheduler-Handshakes-fuer-XTend-Roots-standardisieren.md`
  - `development/WP-E04-06-XTend-Host-Capabilities-fuer-Manifest-State-Theme-API-und-Hydration-beschreiben.md`
  - `development/WP-E04-07-Scaffold-Typing-und-Extension-Contracts-an-RMT-Kompatibilitaet-anbinden.md`
  - `development/WP-E04-08-Test-und-Referenzgates-fuer-RMT-kompatible-XTend-Artefakte-erweitern.md`
  - `development/WP-E04-09-Pilot-Flow-fuer-RMT-basiertes-XTend-Templating-vorbereiten.md`
  - `development/WP-E04-10-Migrations-und-Framework-Agnostik-Leitplanken-dokumentieren.md`
  - `development/WP-E04-11-Upstream-Handoff-Spezifikation-fuer-XTendRMT-DSL-und-Bridge-vorbereiten.md`
  - `development/WP-E04-12-Epic-Abschlussreview-und-KPI-Abnahme.md`
  - `development/XTendRMT-Pilot-Flow-RMT-basiertes-XTend-Templating.md`
  - `development/XTendRMT-Migrations-und-Framework-Agnostik-Leitplanken.md`
  - `development/XTendRMT-Upstream-Handoff-Spezifikation.md`
  - `development/ADR-XTendRMT-First-Class-Fusion.md`
  - `development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md`
  - `development/XTend-Scaffold-Extension-Points.md`
  - `development/XTend-Core-Compliance-Checklist.md`
  - `xtend-builder/typing/component-types.js`
  - `xtend-builder/extensions/component-extension-points.js`
  - `xtend-builder/scaffold.config.js`
  - `xtendrmt/rmt.schema.json`
  - `xtendrmt/xtendrmt-bestcase-demo.rmt`

## Ausgangslage

Epic 03 hat mit `XTend-Scaffold` die vorbereitenden Artefakt-, Typing-, Preview- und Extension-Point-Contracts geschaffen. Parallel existiert mit `XTendRMT` eine lauffaehige RMT-Runtime, die Scheduler, Template Registry, Rendering, Hydration und Demo-Integration bereitstellt.

Die Produktlinie ist nun klarer als zu Beginn der Epic-Planung:

- **XTend UI** ist das UI Builder / Web Component Produkt.
- **XTendRMT** ist der framework-agnostische Scheduler und die Templating Engine.
- Zusammen bilden beide Produkte die Zielplattform, ohne dass der RMT Kernel hart an XTend gekoppelt wird.

Das bisherige Ziel "XTend-Templating" wird deshalb nicht als eigener XTend-intern gebauter Template-Layer verstanden. XTend-Templating soll ueber das RMT-Format abgedeckt werden. Epic 04 bereitet XTend so darauf vor, dass upstream in XTendRMT spaeter vor allem die DSL-Syntax, Ergonomie und produktive Adapterausfuehrung verbessert werden muessen.

## Konkretisierte Zielsetzung

Epic 04 ist die Vorbereitungs- und Kompatibilitaetsphase zwischen `XTend-Scaffold` und der spaeteren produktiven XTendRMT Bridge.

Nach Abschluss dieses Epics soll XTend:

- RMT-kompatible Component-, Template-, Lifecycle-, State-, Theme-, Manifest- und API-Contracts besitzen
- XTend UI als First-Class Host fuer RMT-Dokumente beschreiben koennen
- RMT-Template-Dokumente als kuenftige XTend-Templating-DSL behandeln, ohne eine zweite XTend-eigene Template-Syntax einzufuehren
- klare Host-Capability-Grenzen fuer den framework-agnostischen RMT Kernel liefern
- Scaffold-, Typing- und Testpfade so vorbereiten, dass upstream nur noch die RMT-DSL-Syntax und produktive Runtime-Adapter ergonomischer machen muss
- Epic 05 mit einer klaren Grundlage fuer produktive Bridge, natives Routing und XRouter-Adapter starten lassen

## Produktmodell

| Produkt | Rolle | Verantwortungen |
|---------|-------|-----------------|
| XTend UI | UI Builder / Web Component Produkt | Komponenten, Manifest, Loader, Hydration, Theme, API, `xstate`, XRouter, Doku, Scaffold |
| XTendRMT | Scheduler und Templating Engine | RMT-Dokumentmodell, Templates, Scheduler Policies, Root Lifecycle, Execution Plans, Host Adapter Contracts |
| XTendRMT Bridge | spaetere Integrationsschicht | produktiver XTend Host Adapter, native RMT Routes, XRouter Adapter, Runtime-Smokes |

Der RMT Kernel bleibt framework-agnostisch. XTend wird First-Class Citizen ueber Adapter- und Host-Capability-Contracts, nicht ueber Kernel-Sonderfaelle.

## Kernspannungsfeld

Die zentrale Architekturspannung dieses Epics lautet:

- XTendRMT weiss nichts von XTend, kann XTend-Arbeit aber schedulen.
- RMT kann XTend-Templates konstruieren und XRouter-Routen bauen, ohne dass XTend in RMT eingebettet ist.

Diese Spannung wird nicht aufgeloest, indem XTend in den RMT Kernel wandert. Sie wird ueber ein Adapter- und Capability-Modell geloest:

- Der RMT Kernel sieht generische `components`, `templates`, `routes`, `schedules`, `actions`, `roots` und `capabilities`.
- RMT-Dokumente duerfen XTend-Artefakte referenzieren, aber nur ueber deklarierte Adapter-IDs wie `xtend.component` oder spaeter `xtend.xrouter`.
- Der XTend Host Adapter uebersetzt diese neutralen Records in XTend-Komponenten, Manifest-Lookups, Custom-Element-Mounts, Slot-Fuellung, Event-Bridges, `xstate`-Spiegelung und XRouter-Konfiguration.
- XRouter-Routen koennen aus RMT-Records gebaut werden; XRouter selbst bleibt Adapter-Implementierung, nicht Kernel-Wissen.
- Scheduler Policies planen Arbeit ueber abstrakte Endpoints. Ob diese Arbeit XTend-Komponenten, andere Web Components, React, Vue, Vanilla JS oder Custom Hosts betrifft, entscheidet der Host Adapter.

Damit entsteht First-Class Support fuer XTend UI, ohne die Framework-Agnostik von XTendRMT zu verlieren.

## Wichtige Randbedingung

XTendRMT wird upstream entwickelt. In diesem Repository liegt aktuell vor allem eine Build-Artefaktversion plus Bestcase-Demo. Epic 04 darf deshalb nicht versuchen, die upstream-fuehrende RMT-DSL vollstaendig in den generierten Bundles umzubauen.

Daraus folgt:

- Epic 04 bereitet XTend-seitige Kompatibilitaet, Contracts, Tests, Doku und Scaffold-Anschluss vor.
- Additive RMT-Schema- oder Demo-Anpassungen sind erlaubt, wenn sie als Vorbereitung und Regression-Referenz dienen.
- Die produktive Bridge, native RMT-Routing-Domain und Upstream-Modulstruktur bleiben Epic 05 vorbehalten.
- Jede Entscheidung muss Technical Debt vermeiden: keine Demo-Sonderlogik als dauerhafter Contract, keine XTend-Abhaengigkeit im RMT Kernel, keine zweite konkurrierende XTend-Template-Sprache.

## Zielbild

Nach Abschluss des Epics besitzt XTend einen stabilen, dokumentierten und pruefbaren Kompatibilitaetspfad fuer RMT-basiertes Templating.

Das Zielbild umfasst:

- eine Architekturentscheidung fuer RMT als XTend-Templating-DSL
- ein XTend Host-Capability-Modell fuer Komponenten, State, Theme, API, Manifest, Hydration und Root Lifecycle
- definierte Component- und Template-Attachment-Contracts fuer `xtend.component`
- ein Modell fuer Root-Erstellung, Mounting, Hydration, sichtbare Aktivierung und Scheduler-Handshakes
- ein Scaffold-/Typing-/Extension-Update, das RMT-Kompatibilitaet sichtbar und maschinenlesbar macht
- Test- und Referenzgates fuer RMT-kompatible XTend-Artefakte
- eine upstream-faehige Handoff-Spezifikation fuer die spaetere RMT-DSL-Ergonomie und produktive Bridge-Arbeit

## In Scope

- RMT als kanonisches XTend-Templating-Zielmodell beschreiben
- Analyse der aktuellen `xtendrmt/rmt.schema.json` und Bestcase-RMT-Demo gegen das Zielmodell
- XTend Component-, Template-, Slot-, Event- und Lifecycle-Contracts fuer RMT vorbereiten
- Host-Capabilities fuer XTend UI definieren: Manifest, Loader, Custom Elements, `xstate`, Theme, API, Router als optionale Faehigkeit
- Root-Lifecycle- und Scheduler-Handshakes fuer XTend-Roots standardisieren
- `XTend-Scaffold` Typing-, Extension- und Preview-Contracts an RMT-Kompatibilitaet anbinden
- Tests, Referenzpfade und Doku-Gates fuer RMT-kompatible XTend-Artefakte erweitern
- Handoff-Dokument fuer upstream XTendRMT DSL-Verbesserungen vorbereiten

## Out of Scope

- produktive XTendRMT Bridge-Implementierung
- native RMT-Routes und produktiver XRouter Adapter
- harte XTend-Abhaengigkeit im RMT Kernel
- Vollmigration bestehender XTend-Komponenten in ein RMT-only Modell
- neue zweite XTend-Template-Sprache neben RMT
- Umschreiben generierter RMT-Bundles als Source of Truth fuer upstream Architektur
- erzwungene Migration von React-, Vue-, Vanilla- oder Custom-Apps auf XTend

## Architekturleitplanken

### 1. RMT ist das XTend-Templating-Zielmodell

XTend fuehrt keine konkurrierende Template-Sprache ein. Template-Authoring fuer groessere XTend-UIs wird auf `.rmt` Dokumente und RMT-Domains vorbereitet.

### 2. XTend wird kompatibel, nicht dominant

XTend UI muss ein sehr guter RMT Host werden. Der RMT Kernel darf daraus aber keine XTend-Pflicht ableiten.

### 3. First-Class Citizen bedeutet Adapter-Qualitaet

XTend-Komponenten sind First-Class Citizens, wenn ihre RMT-Contracts vollstaendig sind: Component Definition, Manifest Lookup, Props/Attributes, Slots, Events, State Bridge, Theme, Hydration, Lifecycle und Diagnostics.

### 4. Upstream-Arbeit wird vorbereitet

Epic 04 liefert strukturierte Inputs fuer upstream XTendRMT: Domain-Gaps, Schema-Verbesserungen, DSL-Ergonomie, Handoff-Contracts und Tests. Die produktive upstream Umsetzung folgt danach.

### 5. Framework-Agnostik ist ein Produktversprechen

RMT bleibt Scheduler und Templating Engine fuer XTend, React, Vue, Vanilla JS und Custom Hosts. XTend-Kompatibilitaet darf die Adapter-Schicht verbessern, aber nicht die Kernel-Grenze verwischen.

## Arbeitsstroeme

### WS1 - Zielbild, Scope und DSL-Gap

Ziel: Die konkretisierte Produktlinie und die aktuelle RMT-DSL-Luecke sauber festlegen.

Erwartete Ergebnisse:

- dokumentiertes Produktmodell XTend UI + XTendRMT
- Analyse von RMT-Schema, Demo-Metadaten und Scaffold-Vorarbeiten
- Priorisierung, welche Kompatibilitaetsarbeit in XTend liegt und was upstream gehoert

### WS2 - XTend Host Compatibility

Ziel: XTend als offiziellen RMT Host vorbereiten.

Erwartete Ergebnisse:

- Component-, Template-, Slot- und Event-Contract fuer `xtend.component`
- Host-Capabilities fuer Manifest, Loader, State, Theme, API und Hydration
- klare Grenzen zu produktiver Bridge-Logik aus Epic 05

### WS3 - Root Lifecycle und Scheduler-Handshakes

Ziel: XTend-Roots so beschreiben, dass RMT sie planen, mounten, hydrieren und diagnostizieren kann.

Erwartete Ergebnisse:

- Root-Lifecycle-Modell fuer create, mount, hydrate, update, unmount und diagnostics
- Scheduler-Endpoint-Hints fuer sichtbare Aktivierung, Idle-Hydration und Route-/Component-Arbeit
- SSOT- und Digital-Twin-konforme State-Kopplung

### WS4 - Scaffold, Typing und Testbarkeit

Ziel: Die vorbereiteten EPIC-03-Contracts in echte RMT-Kompatibilitaet ueberfuehren.

Erwartete Ergebnisse:

- erweiterte Scaffold-/Typing-/Extension-Contracts fuer RMT Host Attachments
- Reference-Gates fuer RMT-kompatible XTend-Artefakte
- lokale Verify-Pfade fuer spaetere Bridge- und DSL-Arbeit

### WS5 - Pilot, Migration und Upstream-Handoff

Ziel: Die Vorbereitung an einem pruefbaren Pfad belegen und upstream-fertig uebergeben.

Erwartete Ergebnisse:

- Pilot- oder Reference-Flow fuer RMT-basiertes XTend-Templating
- Migrations- und Kompatibilitaetsleitplanken fuer bestehende XTend-Apps
- Handoff-Spezifikation fuer Epic 05 und upstream XTendRMT

## Initiale Arbeitspakete

- `E04-001`: Produktmodell, Scope und RMT-Templating-Zielbild festlegen.
- `E04-002`: RMT-Schema-, Demo- und DSL-Gap-Analyse erstellen.
- `E04-003`: XTend Component Contract fuer RMT-Kompatibilitaet definieren.
- `E04-004`: RMT Template Authoring Model fuer XTend UI vorbereiten.
- `E04-005`: Root-Lifecycle- und Scheduler-Handshakes fuer XTend Roots standardisieren.
- `E04-006`: XTend Host Capabilities fuer Manifest, State, Theme, API und Hydration beschreiben.
- `E04-007`: Scaffold-, Typing- und Extension-Contracts an RMT-Kompatibilitaet anbinden.
- `E04-008`: Test- und Referenzgates fuer RMT-kompatible XTend-Artefakte erweitern.
- `E04-009`: Pilot-Flow fuer RMT-basiertes XTend-Templating vorbereiten.
- `E04-010`: Migrations- und Framework-Agnostik-Leitplanken dokumentieren.
- `E04-011`: Upstream-Handoff-Spezifikation fuer XTendRMT DSL und Bridge vorbereiten.
- `E04-012`: Abschlussreview und KPI-Abnahme durchfuehren.

Die operative Zerlegung liegt in `development/BACKLOG-EPIC-04-XTendRMT-DSL-Templating-und-Kompatibilitaetsvorbereitung.md`.

## Abhaengigkeiten

- Epic 02 ist abgeschlossen und stellt Test-Suite, Reference-Gates und Reporting bereit.
- Epic 03 ist abgeschlossen und stellt Scaffold-, Typing-, Preview-, Workflow- und Extension-Point-Contracts bereit.
- `development/ADR-XTendRMT-First-Class-Fusion.md` ist die Architekturbaseline fuer die Produktfusion.
- `xtendrmt/` liefert aktuelle Build-Artefakte und eine Bestcase-Demo als Analyse- und Smoke-Basis.
- Epic 05 nimmt produktive Bridge, natives Routing und XRouter-Adapter auf.

## Risiken

- Wenn XTend eigene Templating-Syntax einfuehrt, entsteht Konkurrenz zum RMT-Format.
- Wenn zu viel Logik in Demo-Metadaten bleibt, entsteht schwer migrierbarer Technical Debt.
- Wenn XTend-Kompatibilitaet in den Kernel wandert, verliert RMT seine Framework-Agnostik.
- Wenn upstream-Gaps nicht explizit dokumentiert werden, wandert spaetere DSL-Arbeit in Build-Artefakt-Patches.
- Wenn Scaffold-/Typing-Contracts nicht nachgezogen werden, bleibt RMT-Kompatibilitaet manuelle Sonderarbeit.

## Akzeptanzkriterien

- Epic 04 besitzt ein dokumentiertes Produktmodell: XTend UI als UI Builder / Web Component Produkt, XTendRMT als Scheduler und Templating Engine.
- RMT ist als kanonischer XTend-Templating-Pfad festgelegt.
- XTend Host-Capabilities und Component-/Template-Attachments sind dokumentiert und testbar.
- Root-Lifecycle, Scheduler-Handshakes und sichtbare UI-Aktivierung sind XTend- und RMT-konform beschrieben.
- `XTend-Scaffold` kann RMT-Kompatibilitaet als Typing-, Extension-, Preview- oder Manifest-Contract sichtbar machen.
- Referenz- und Testgates pruefen die wichtigsten RMT-Kompatibilitaetspfade.
- Framework-Agnostik ist explizit erhalten.
- XTendRMT bleibt unwissend ueber XTend, kann XTend-Arbeit aber ueber neutrale Scheduler-Endpoints planen.
- RMT kann XTend-Templates und XRouter-Routen ueber Adapter-Records konstruieren, ohne XTend in den Kernel einzubetten.
- Epic 05 erhaelt eine konkrete Handoff-Spezifikation fuer produktive Bridge, native Routes und XRouter Adapter.

## KPI-Baseline

- `0` abgeschlossene Epic-04-Workpackages
- `0` dokumentierte XTend Host-Capability-Contracts fuer RMT
- `0` pruefbare XTend Component Attachment Contracts ausserhalb der Scaffold-Vorbereitung
- `0` dokumentierte Root-Lifecycle-Handshakes zwischen XTend und RMT
- `0` upstream-Handoff-Spezifikationen fuer RMT-DSL-Ergonomie
- RMT-Kompatibilitaet lebt aktuell primaer in Demo-Metadaten und Scaffold-Vorbereitungen

## KPI-Ziele

- `1` verbindliches Produktmodell fuer XTend UI + XTendRMT
- `1` dokumentierte RMT-DSL-Gap-Analyse
- `1` XTend Host-Capability-Contract fuer RMT
- `1` Component-/Template-Attachment-Contract fuer `xtend.component`
- `1` Root-Lifecycle- und Scheduler-Handshake-Modell
- `1` Scaffold-/Typing-/Extension-Anschluss fuer RMT-Kompatibilitaet
- `1` Test-/Reference-Gate fuer Epic-04-Kompatibilitaet
- `1` upstream-Handoff-Spezifikation fuer Epic 05 und XTendRMT DSL

## Implementierungsabschluss Mai 2026

Epic 04 startete nach Abschluss von Epic 03 und ist nach `WP-E04-12` abgeschlossen.

Aktueller Arbeitsstand:

- `WP-01`: Produktmodell, Scope und RMT-Templating-Zielbild festlegen ist `completed`.
- `WP-02`: RMT-Schema-, Demo- und DSL-Gap-Analyse erstellen ist `completed`.
- `WP-03`: XTend Component Contract fuer RMT-Kompatibilitaet definieren ist `completed`.
- `WP-04`: RMT Template Authoring Model fuer XTend UI vorbereiten ist `completed`.
- `WP-05`: Root-Lifecycle- und Scheduler-Handshakes fuer XTend Roots standardisieren ist `completed`.
- `WP-06`: XTend Host Capabilities fuer Manifest, State, Theme, API und Hydration beschreiben ist `completed`.
- `WP-07`: Scaffold-, Typing- und Extension-Contracts an RMT-Kompatibilitaet anbinden ist `completed`.
- `WP-08`: Test- und Referenzgates fuer RMT-kompatible XTend-Artefakte erweitern ist `completed`.
- `WP-09`: Pilot-Flow fuer RMT-basiertes XTend-Templating vorbereiten ist `completed`.
- `WP-10`: Migrations- und Framework-Agnostik-Leitplanken dokumentieren ist `completed`.
- `WP-11`: Upstream-Handoff-Spezifikation fuer XTendRMT DSL und Bridge vorbereiten ist `completed`.
- `WP-12`: Epic-Abschlussreview und KPI-Abnahme ist `completed`.
- `development/WP-E04-01-Produktmodell-Scope-und-RMT-Templating-Zielbild-festlegen.md` legt Produktmodell, Scope, RMT-Templating-Zielbild, Kernel/Adapter-Spannung und Out-of-Scope-Grenzen zu Epic 05 verbindlich fest.
- `development/WP-E04-02-RMT-Schema-Demo-und-DSL-Gap-Analyse-erstellen.md` analysiert RMT-Schema, Bestcase-Demo und DSL-Domains gegen Kernel-Wissen, DSL-Record und Host-Adapter-Ausfuehrung.
- `development/WP-E04-03-XTend-Component-Contract-fuer-RMT-Kompatibilitaet-definieren.md` definiert `xtend.rmt.component-contract.v1` fuer XTend Component Records, Manifest Lookup, Attributes, Hydration, Events, Diagnostics und Kernel-Grenzen.
- `development/WP-E04-04-RMT-Template-Authoring-Model-fuer-XTend-UI-vorbereiten.md` definiert `xtend.rmt.template-authoring.v1` fuer RMT Template-Refs, Component-Refs, Slots, Events, Hydration und Kernel-Grenzen.
- `development/WP-E04-05-Root-Lifecycle-und-Scheduler-Handshakes-fuer-XTend-Roots-standardisieren.md` definiert `xtend.rmt.root-handshake.v1` fuer Root-Phasen, Scheduler-Endpoint-Hints, Planner/Executor-Grenze und Digital-Twin-State-Policy.
- `development/WP-E04-06-XTend-Host-Capabilities-fuer-Manifest-State-Theme-API-und-Hydration-beschreiben.md` definiert `xtend.rmt.host-capabilities.v1` fuer Manifest, Custom Elements, `xstate`, Hydration, Scheduler-Endpoints, Theme, API, Router und Diagnostics.
- `development/WP-E04-07-Scaffold-Typing-und-Extension-Contracts-an-RMT-Kompatibilitaet-anbinden.md` definiert `xtend.scaffold.rmt-compatibility-binding.v1` fuer Typing, Manifest-Plan, Preview-Plan, Extension-Punkte, Component-Files und Workflow.
- `development/WP-E04-08-Test-und-Referenzgates-fuer-RMT-kompatible-XTend-Artefakte-erweitern.md` fuehrt den lokalen Gate `rmt-compatibility` fuer Scaffold-Bindings, RMT-Metadaten, Manifest-/Preview-/Extension-Planung und Verify-Workflow ein.
- `development/WP-E04-09-Pilot-Flow-fuer-RMT-basiertes-XTend-Templating-vorbereiten.md` fuehrt `xtend.rmt.template-pilot-flow.v1`, die `/templating` Demo-Route und das Template `demo.templating.pilot` als kontrollierten RMT/XTend-Pilot ein.
- `development/WP-E04-10-Migrations-und-Framework-Agnostik-Leitplanken-dokumentieren.md` dokumentiert Opt-in-Migration, Parallelbetrieb, Anti-Technical-Debt-Regeln und Review-Checkliste fuer framework-agnostische RMT-Kompatibilitaet.
- `development/WP-E04-11-Upstream-Handoff-Spezifikation-fuer-XTendRMT-DSL-und-Bridge-vorbereiten.md` uebergibt `development/XTendRMT-Upstream-Handoff-Spezifikation.md` und `xtend.rmt.upstream-handoff.v1` als verbindliche Startgrundlage fuer Epic 05.
- `development/WP-E04-12-Epic-Abschlussreview-und-KPI-Abnahme.md` schliesst Epic 04 mit KPI-Abnahme, Akzeptanzkriterien-Check, Risikoabdeckung und finalem `npm test` Gate ab.
- Epic 04 ist abgeschlossen. Epic 05 ist der naechste priorisierte Umsetzungsschritt.

## Definition of Done

Der Epic ist abgeschlossen, wenn XTend selbst soweit RMT-kompatibel vorbereitet ist, dass XTendRMT upstream die DSL-Syntax, Ergonomie und produktive Bridge-Ausfuehrung verbessern kann, ohne grundlegende XTend-Core-, Scaffold-, Typing- oder Test-Refactors nachziehen zu muessen.
