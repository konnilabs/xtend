# Backlog zu Epic 04 - XTendRMT DSL-Templating und Kompatibilitaetsvorbereitung

- Status: Completed
- Datum: 4. Mai 2026
- Bezug:
  - `development/EPIC-04-XTend-Templating-Rendering-und-Framework-Erweiterung.md`
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
  - `development/EPIC-03-XTend-Scaffold-Build-Environment-und-Developer-Workflow.md`
  - `development/WP-E03-12-Epic-Abschlussreview-und-KPI-Abnahme.md`
  - `development/ADR-XTendRMT-First-Class-Fusion.md`
  - `development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md`
  - `development/XTend-Scaffold-Extension-Points.md`
  - `development/XTend-Testpflicht-und-Scaffold-Anschluss.md`
  - `development/XTend-Dokumentations-und-Demo-Referenzpfade.md`
  - `tests/rmt/rmt_compatibility_suite.js`
  - `xtend-builder/typing/component-types.js`
  - `xtend-builder/extensions/component-extension-points.js`
  - `xtend-builder/preview/component-preview.js`
  - `xtend-builder/workflows/developer-workflow.js`
  - `xtendrmt/rmt.schema.json`
  - `xtendrmt/xtendrmt-bestcase-demo.rmt`
  - `tests/references/reference_path_suite.js`

## Zweck

Dieses Dokument zerlegt Epic 04 in konkrete Workpackages. Der Epic bereitet XTend auf RMT-basiertes Templating vor, ohne die upstream-fuehrende XTendRMT DSL oder die produktive Bridge in Build-Artefakten vorzuziehen.

Das Backlog bildet das neue Produktmodell ab:

- XTend UI ist das UI Builder / Web Component Produkt.
- XTendRMT ist Scheduler und Templating Engine.
- XTend wird First-Class Citizen in RMT ueber saubere Host-, Component-, Template-, Lifecycle- und Capability-Contracts.
- RMT bleibt framework-agnostisch und kann parallel zu React, Vue, Vanilla JS oder Custom Hosts betrieben werden.

Das konkrete Spannungsfeld fuer alle Workpackages:

- XTendRMT weiss nichts von XTend, kann XTend-Arbeit aber schedulen.
- RMT kann XTend-Templates konstruieren und XRouter-Routen bauen, ohne dass XTend in RMT eingebettet ist.
- Die Loesung liegt in neutralen RMT-Records plus XTend Host Adapter, nicht in XTend-spezifischem Kernel-Wissen.

## Definition of Ready

Ein Workpackage darf gestartet werden, wenn:

- Ziel, Scope und Zielartefakte klar sind
- die benoetigten Vorgaenger erledigt oder bewusst entkoppelt sind
- betroffene XTend-, Scaffold-, RMT-, Doku- oder Testpfade bekannt sind
- ein pruefbares Definition-of-Done vorliegt
- die Grenze zwischen XTend-Kompatibilitaet, upstream XTendRMT und Epic-05-Bridge eindeutig bleibt
- Framework-Agnostik und Digital Twin Principle nicht verletzt werden
- das Kernspannungsfeld zwischen XTend-unwissendem RMT Kernel und XTend-First-Class-Support explizit beruecksichtigt ist

## Priorisierungslogik

- `P0`: Schafft Zielbild, Gap-Analyse oder zentrale XTend/RMT-Kompatibilitaetscontracts
- `P1`: Macht Host-, Lifecycle-, Scaffold-, Typing- oder Test-Kompatibilitaet konkret pruefbar
- `P2`: Haertet, dokumentiert, pilotiert oder bereitet den upstream-Handoff vor

## Statuslogik

- `ready`: kann sofort gestartet werden
- `in_progress`: ist fachlich und technisch in Bearbeitung
- `completed`: Zielartefakt ist erstellt und fuer den Epic wirksam
- `next`: ist als naechstes fachlich sinnvoll, braucht aber einen kurzen Vorgaenger
- `blocked`: sollte erst nach den benannten Abhaengigkeiten gestartet werden

## Naechste startbare Workpackages

Keine offenen Workpackages innerhalb Epic 04.

`WP-01` ist abgeschlossen und legt Produktmodell, Scope, RMT-Templating-Zielbild sowie das Kernspannungsfeld zwischen XTend-unwissendem RMT Kernel und XTend-First-Class-Support fest. `WP-02` ist abgeschlossen und trennt RMT-Schema, Bestcase-Demo und DSL-Domains nach Kernel-Wissen, DSL-Record und Host-Adapter-Ausfuehrung. `WP-03` ist abgeschlossen und definiert `xtend.rmt.component-contract.v1` fuer XTend Component Records. `WP-04` ist abgeschlossen und definiert `xtend.rmt.template-authoring.v1` fuer RMT Template Authoring mit XTend Component-Refs, Slots, Events und Hydration. `WP-05` ist abgeschlossen und definiert `xtend.rmt.root-handshake.v1` fuer Root-Lifecycle, Scheduler-Endpoint-Hints und Planner/Executor-Grenzen. `WP-06` ist abgeschlossen und definiert `xtend.rmt.host-capabilities.v1` fuer Manifest, Custom Elements, `xstate`, Hydration, Scheduler-Endpoints, Theme, API, Router und Diagnostics. `WP-07` ist abgeschlossen und definiert `xtend.scaffold.rmt-compatibility-binding.v1` fuer Typing, Manifest-Plan, Preview-Plan, Extension-Punkte, Component-Files und Workflow. `WP-08` ist abgeschlossen und fuehrt den lokalen Gate `rmt-compatibility` fuer RMT-kompatible XTend-Artefakte ein. `WP-09` ist abgeschlossen und fuehrt `xtend.rmt.template-pilot-flow.v1`, die `/templating` Demo-Route und das Template `demo.templating.pilot` als kontrollierten Pilot-Flow ein. `WP-10` ist abgeschlossen und dokumentiert Opt-in-Migration, Parallelbetrieb, Anti-Technical-Debt-Regeln und Review-Checkliste fuer framework-agnostische RMT-Kompatibilitaet. `WP-11` ist abgeschlossen und uebergibt die upstream-Handoff-Spezifikation an Epic 05. `WP-12` ist abgeschlossen und nimmt Epic 04 gegen KPI, Akzeptanzkriterien, Risiken und finale Gates ab. Die produktive XTendRMT Bridge, native RMT Routes und der XRouter Adapter bleiben in Epic 05.

## Backlog-Uebersicht

| ID | Prioritaet | Status | Workstream | Titel | Abhaengigkeiten |
|----|------------|--------|------------|-------|-----------------|
| `WP-01` | P0 | completed | WS1 | Produktmodell, Scope und RMT-Templating-Zielbild festlegen | Epic 03 |
| `WP-02` | P0 | completed | WS1 | RMT-Schema-, Demo- und DSL-Gap-Analyse erstellen | `WP-01` |
| `WP-03` | P0 | completed | WS2 | XTend Component Contract fuer RMT-Kompatibilitaet definieren | `WP-01`, `WP-02` |
| `WP-04` | P0 | completed | WS2 | RMT Template Authoring Model fuer XTend UI vorbereiten | `WP-02`, `WP-03` |
| `WP-05` | P1 | completed | WS3 | Root-Lifecycle- und Scheduler-Handshakes fuer XTend Roots standardisieren | `WP-03`, `WP-04` |
| `WP-06` | P1 | completed | WS3 | XTend Host Capabilities fuer Manifest, State, Theme, API und Hydration beschreiben | `WP-03`, `WP-05` |
| `WP-07` | P1 | completed | WS4 | Scaffold-, Typing- und Extension-Contracts an RMT-Kompatibilitaet anbinden | `WP-03`, `WP-06` |
| `WP-08` | P1 | completed | WS4 | Test- und Referenzgates fuer RMT-kompatible XTend-Artefakte erweitern | `WP-07` |
| `WP-09` | P2 | completed | WS5 | Pilot-Flow fuer RMT-basiertes XTend-Templating vorbereiten | `WP-04`, `WP-05`, `WP-08` |
| `WP-10` | P2 | completed | WS5 | Migrations- und Framework-Agnostik-Leitplanken dokumentieren | `WP-06`, `WP-09` |
| `WP-11` | P2 | completed | WS5 | Upstream-Handoff-Spezifikation fuer XTendRMT DSL und Bridge vorbereiten | `WP-02`, `WP-09`, `WP-10` |
| `WP-12` | P2 | completed | WS5 | Epic-Abschlussreview und KPI-Abnahme | `WP-08`, `WP-10`, `WP-11` |

## Workpackages im Detail

### WP-01 - Produktmodell, Scope und RMT-Templating-Zielbild festlegen

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - das konkretisierte Produktmodell und den Epic-04-Scope verbindlich festlegen
- Scope:
  - XTend UI als UI Builder / Web Component Produkt
  - XTendRMT als Scheduler und Templating Engine
  - RMT als kanonischer XTend-Templating-Pfad
  - Kernspannungsfeld: XTendRMT weiss nichts von XTend, kann XTend-Arbeit aber schedulen
  - Kernspannungsfeld: RMT kann XTend-Templates und XRouter-Routen ueber Adapter-Records konstruieren
  - Grenze zu produktiver Bridge, nativen Routes und upstream RMT-DSL-Implementierung
  - Framework-Agnostik als nicht verhandelbare Leitplanke
- Zielartefakte:
  - Workpackage-Dokument unter `development/WP-E04-01-Produktmodell-Scope-und-RMT-Templating-Zielbild-festlegen.md`
  - bestaetigtes Produktmodell in Epic 04
  - Entscheidung, welche Arbeit in XTend vorbereitet und welche an upstream XTendRMT uebergeben wird
  - siehe `development/WP-E04-01-Produktmodell-Scope-und-RMT-Templating-Zielbild-festlegen.md`
- Betroffene Dateien:
  - `development/EPIC-04-XTend-Templating-Rendering-und-Framework-Erweiterung.md`
  - `development/BACKLOG-EPIC-04-XTendRMT-DSL-Templating-und-Kompatibilitaetsvorbereitung.md`
  - `development/ADR-XTendRMT-First-Class-Fusion.md`
- Definition of Done:
  - Produktmodell ist fuer Menschen und AI-Agenten eindeutig
  - RMT ist als Templating-Zielpfad festgelegt
  - XTend-unwissender RMT Kernel und XTend-First-Class-Support sind als gewollte Spannung dokumentiert
  - Out-of-Scope-Grenzen zu Epic 05 und upstream sind dokumentiert
  - `WP-02` kann mit einer konkreten Gap-Analyse starten

### WP-02 - RMT-Schema-, Demo- und DSL-Gap-Analyse erstellen

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - den aktuellen RMT-Iststand gegen das Epic-04-Zielmodell analysieren
- Scope:
  - `xtendrmt/rmt.schema.json`
  - `xtendrmt/xtendrmt-bestcase-demo.rmt`
  - Demo-Metadaten fuer `adapters`, `components`, `routes`, `schedules`
  - Abgleich mit ADR und Epic 05
  - Unterscheidung zwischen additiver XTend-Vorbereitung und upstream DSL-Arbeit
  - Pruefung, welche Demo-Logik bereits Adapter-Arbeit ausdrueckt und welche noch Metadata-Ausweichpfad ist
- Zielartefakte:
  - Workpackage-Dokument unter `development/WP-E04-02-RMT-Schema-Demo-und-DSL-Gap-Analyse-erstellen.md`
  - Gap-Matrix fuer Domains, Syntax, Ergonomie, Schema und Runtime-Ausfuehrung
  - Entscheidung, welche Domaenen in Epic 04 nur vorbereitet werden
  - siehe `development/WP-E04-02-RMT-Schema-Demo-und-DSL-Gap-Analyse-erstellen.md`
- Betroffene Dateien:
  - `xtendrmt/rmt.schema.json`
  - `xtendrmt/xtendrmt-bestcase-demo.rmt`
  - `tests/references/reference_path_suite.js`
- Definition of Done:
  - aktuelle RMT-Domains und Metadata-Ausweichpfade sind sichtbar
  - upstream-Gaps sind benannt
  - Gap-Matrix trennt Kernel-Wissen, DSL-Record und Host-Adapter-Ausfuehrung
  - XTend-seitige Kompatibilitaetspunkte fuer `WP-03` und `WP-04` sind ableitbar

### WP-03 - XTend Component Contract fuer RMT-Kompatibilitaet definieren

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - XTend-Komponenten als RMT-kompatible Component Records beschreiben
- Scope:
  - `xtend.component` Adapter-ID
  - Trennung zwischen generischem RMT Component Record und XTend-spezifischer Host-Ausfuehrung
  - Custom Element Tag, Manifest Lookup, Attribute, Properties, Slots und Events
  - Component Metadata fuer Hydration, State Bridge, Theme und Diagnostics
  - keine produktive Bridge-Implementierung
- Zielartefakte:
  - Workpackage-Dokument unter `development/WP-E04-03-XTend-Component-Contract-fuer-RMT-Kompatibilitaet-definieren.md`
  - maschinenlesbarer oder dokumentierter Component Attachment Contract
  - Abgleich mit Scaffold-Typing aus Epic 03
  - siehe `development/WP-E04-03-XTend-Component-Contract-fuer-RMT-Kompatibilitaet-definieren.md`
- Betroffene Dateien:
  - `xtend-builder/typing/component-types.js`
  - `xtend-builder/templates/component/types.template.d.ts`
  - `xtend-builder/extensions/component-extension-points.js`
- Definition of Done:
  - XTend Component Attachment ist ohne Runtime-Sonderfall beschreibbar
  - der RMT Kernel muss keine XTend-Tags, Manifeststruktur oder `xstate`-Keys kennen
  - Slots, Events und Props haben klare Authoring-Regeln
  - `WP-04` und `WP-05` koennen darauf aufbauen

### WP-04 - RMT Template Authoring Model fuer XTend UI vorbereiten

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - beschreiben, wie XTend UI durch RMT-Templates authorbar wird
- Scope:
  - Template-IDs, Template-Refs, Slots, Component-Refs und DOM-Fragmente
  - Aufbau von XTend-Templates aus RMT-Records ohne XTend-Kernel-Einbettung
  - Grenze zwischen RMT Template und XTend Custom Element
  - spaetere DSL-Syntax-Verbesserungen upstream vorbereiten
  - Lesbarkeit fuer Menschen und AI-Agenten
- Zielartefakte:
  - Workpackage-Dokument unter `development/WP-E04-04-RMT-Template-Authoring-Model-fuer-XTend-UI-vorbereiten.md`
  - Authoring-Regeln fuer `.rmt` als XTend-Templating-DSL
  - Beispiele fuer einfache und verschachtelte XTend-Komponenten
  - maschinenlesbarer Contract `xtend.rmt.template-authoring.v1`
  - siehe `development/WP-E04-04-RMT-Template-Authoring-Model-fuer-XTend-UI-vorbereiten.md`
- Betroffene Dateien:
  - `xtendrmt/rmt.schema.json`
  - `xtendrmt/xtendrmt-bestcase-demo.rmt`
  - `xtend-builder/extensions/component-extension-points.js`
- Definition of Done:
  - Template-Authoring ist ohne neue XTend-eigene Syntax beschrieben
  - XTend-Templates koennen durch RMT konstruiert werden, waehrend XTend-Ausfuehrung Adapter-Aufgabe bleibt
  - notwendige upstream-Syntaxverbesserungen sind separiert
  - `WP-05` kann Lifecycle und Scheduler daran koppeln

### WP-05 - Root-Lifecycle- und Scheduler-Handshakes fuer XTend Roots standardisieren

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - XTend-Roots planbar fuer RMT Scheduler und Root Lifecycle machen
- Scope:
  - create, mount, hydrate, update, unmount, diagnostics
  - Scheduler-Hints fuer visible, idle, route, component und diagnostics work
  - Scheduler-Endpoints bleiben abstrakt und kennen keine XTend-Implementierungsdetails
  - sichtbare UI-Aktivierung ohne async Workarounds
  - Digital Twin Principle und SSOT
- Zielartefakte:
  - Workpackage-Dokument unter `development/WP-E04-05-Root-Lifecycle-und-Scheduler-Handshakes-fuer-XTend-Roots-standardisieren.md`
  - Root-Lifecycle-Contract fuer XTend Host Attachments
  - Scheduler-Endpoint-Hint-Matrix
  - maschinenlesbarer Contract `xtend.rmt.root-handshake.v1`
  - siehe `development/WP-E04-05-Root-Lifecycle-und-Scheduler-Handshakes-fuer-XTend-Roots-standardisieren.md`
- Betroffene Dateien:
  - `xtend-builder/extensions/component-extension-points.js`
  - `development/XTend-Scaffold-Extension-Points.md`
  - `compliance/digital-twin-principle.md`
- Definition of Done:
  - RMT kann XTend-Root-Arbeit fachlich planen
  - Planung und Ausfuehrung sind sauber zwischen RMT Scheduler und XTend Host Adapter getrennt
  - XTend bleibt State- und Hydration-konform
  - `WP-06` kann Host-Capabilities darauf beziehen

### WP-06 - XTend Host Capabilities fuer Manifest, State, Theme, API und Hydration beschreiben

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - XTend als RMT Host ueber explizite Capabilities beschreiben
- Scope:
  - Manifest und Loader
  - Custom Elements
  - `xstate` State Bridge
  - Theme und API als optionale Capabilities
  - XRouter nur als optionale Router-Capability, nicht als Epic-04-Bridge-Implementierung
  - XRouter-Routen werden als RMT Route Records vorbereitet und erst im Adapter gebaut
  - Diagnostics und Error Boundaries
- Zielartefakte:
  - Workpackage-Dokument unter `development/WP-E04-06-XTend-Host-Capabilities-fuer-Manifest-State-Theme-API-und-Hydration-beschreiben.md`
  - Host-Capability-Matrix
  - Kompatibilitaetsregeln fuer parallelen Betrieb mit anderen Frameworks
  - maschinenlesbarer Contract `xtend.rmt.host-capabilities.v1`
  - siehe `development/WP-E04-06-XTend-Host-Capabilities-fuer-Manifest-State-Theme-API-und-Hydration-beschreiben.md`
- Betroffene Dateien:
  - `api.js`
  - `components/manifest.json`
  - `components/xstate.js`
  - `components/xtheme.js`
  - `components/xrouter.js`
- Definition of Done:
  - Host-Capabilities sind explizit und optional modelliert
  - der RMT Kernel muss keine XTend-spezifischen APIs kennen
  - XRouter bleibt Adapter-Implementierung, nicht RMT-Kernelwissen
  - `WP-07` kann Scaffold-Contracts gezielt erweitern

### WP-07 - Scaffold-, Typing- und Extension-Contracts an RMT-Kompatibilitaet anbinden

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - Epic-03-Vorarbeiten in konkrete Epic-04-Kompatibilitaetscontracts ueberfuehren
- Scope:
  - Typing-Metadaten fuer RMT Component Attachment
  - Extension-Punkte fuer Template Adapter, Rendering Adapter und Root Lifecycle
  - Preview- und Manifest-Plaene fuer RMT-Kompatibilitaet
  - keine produktiven Schreibpfade
- Zielartefakte:
  - Workpackage-Dokument unter `development/WP-E04-07-Scaffold-Typing-und-Extension-Contracts-an-RMT-Kompatibilitaet-anbinden.md`
  - maschinenlesbarer Binding-Contract `xtend.scaffold.rmt-compatibility-binding.v1`
  - erweiterte Scaffold-Contracts fuer Typing, Preview, Extension-Punkte, Component-Files und Workflow
  - Manifest-Plan-Anschluss `rmtCompatibility`
  - Reference-Gate-Anschluss fuer neue Contracts
  - siehe `development/WP-E04-07-Scaffold-Typing-und-Extension-Contracts-an-RMT-Kompatibilitaet-anbinden.md`
- Betroffene Dateien:
  - `xtend-builder/typing/component-types.js`
  - `xtend-builder/extensions/component-extension-points.js`
  - `xtend-builder/preview/component-preview.js`
  - `xtend-builder/workflows/developer-workflow.js`
- Definition of Done:
  - RMT-Kompatibilitaet ist in Scaffold-Dry-Runs maschinenlesbar
  - Typing bleibt types-only und ohne Runtime-Imports
  - `WP-08` kann Tests und Referenzen darauf setzen

### WP-08 - Test- und Referenzgates fuer RMT-kompatible XTend-Artefakte erweitern

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - RMT-Kompatibilitaet lokal pruefbar machen
- Scope:
  - Reference-Gates fuer Epic-04-Dokumente
  - statische Contract-Checks fuer RMT Attachment, Host Capabilities und Authoring-Regeln
  - optional Fixtures fuer RMT-kompatible XTend-Artefakte
  - Reporting ueber bestehenden Test Runner
- Zielartefakte:
  - Workpackage-Dokument unter `development/WP-E04-08-Test-und-Referenzgates-fuer-RMT-kompatible-XTend-Artefakte-erweitern.md`
  - dedizierte Suite `tests/rmt/rmt_compatibility_suite.js`
  - Runner-Einstieg `node scripts/run_xtend_tests.js rmt-compatibility`
  - NPM-Script `npm run test:rmt-compatibility`
  - erweiterte `tests/references/reference_path_suite.js`
  - lokale Verify-Befehle
  - siehe `development/WP-E04-08-Test-und-Referenzgates-fuer-RMT-kompatible-XTend-Artefakte-erweitern.md`
- Betroffene Dateien:
  - `tests/references/reference_path_suite.js`
  - `tests/fixtures/`
  - `scripts/run_xtend_tests.js`
- Definition of Done:
  - neue Epic-04-Contracts sind im lokalen Testpfad sichtbar
  - `npm test` bleibt der finale Default-Gate
  - `WP-09` kann einen Pilot-Flow abgesichert vorbereiten

### WP-09 - Pilot-Flow fuer RMT-basiertes XTend-Templating vorbereiten

- Prioritaet: `P2`
- Status: `completed`
- Ziel:
  - den vorbereiteten RMT-Templating-Pfad an einem kontrollierten Flow belegen
- Scope:
  - Bestcase-Demo als Analyse- und Reference-Basis
  - Reduktion von Demo-Sonderlogik, soweit ohne upstream-Umbau sinnvoll
  - RMT-Template mit XTend Component Attachment
  - keine produktive Bridge- oder Routing-Domain-Implementierung
- Zielartefakte:
  - Workpackage-Dokument unter `development/WP-E04-09-Pilot-Flow-fuer-RMT-basiertes-XTend-Templating-vorbereiten.md`
  - Pilot- oder Reference-Dokument fuer RMT-basiertes XTend-Templating unter `development/XTendRMT-Pilot-Flow-RMT-basiertes-XTend-Templating.md`
  - Pilot-Contract `xtend.rmt.template-pilot-flow.v1`
  - Demo-Route `/templating` und Template `demo.templating.pilot`
  - dokumentierte Grenzen zur Epic-05-Bridge
- Betroffene Dateien:
  - `xtendrmt/xtendrmt-bestcase-demo.rmt`
  - `xtendrmt/xtendrmt-bestcase-demo.js`
  - `tests/browser/fixtures/rmt-xrouter-xtend-smoke.html`
  - `tests/rmt/rmt_compatibility_suite.js`
  - `tests/references/reference_path_suite.js`
- Definition of Done:
  - ein realistischer XTend/RMT-Templating-Pfad ist sichtbar
  - der Flow bleibt framework-agnostisch interpretierbar
  - offene upstream-Arbeit ist sauber markiert

### WP-10 - Migrations- und Framework-Agnostik-Leitplanken dokumentieren

- Prioritaet: `P2`
- Status: `completed`
- Ziel:
  - Einfuehrung von RMT-Templating ohne Bruch bestehender XTend- oder Fremd-Apps absichern
- Scope:
  - XTend-only Apps
  - XTend neben React, Vue, Vanilla JS oder Custom Hosts
  - Legacy-Templating-/Demo-Pfade
  - Opt-in-Strategie fuer RMT
  - Anti-Technical-Debt-Regeln
- Zielartefakte:
  - Workpackage-Dokument unter `development/WP-E04-10-Migrations-und-Framework-Agnostik-Leitplanken-dokumentieren.md`
  - Migrationsnotiz oder Compatibility-Guide unter `development/XTendRMT-Migrations-und-Framework-Agnostik-Leitplanken.md`
  - Review-Checkliste fuer framework-agnostische RMT-Kompatibilitaet
- Betroffene Dateien:
  - `docs/core-migration-guide.md`
  - `development/ADR-XTendRMT-First-Class-Fusion.md`
  - `development/XTend-Core-Compliance-Checklist.md`
  - `development/XTendRMT-Migrations-und-Framework-Agnostik-Leitplanken.md`
  - `tests/references/reference_path_suite.js`
- Definition of Done:
  - bestehende XTend-Nutzung bleibt stabil
  - Parallelbetrieb mit anderen Hosts ist explizit geschuetzt
  - `WP-11` kann upstream-Handoff ohne offene Migrationsfrage erstellen

### WP-11 - Upstream-Handoff-Spezifikation fuer XTendRMT DSL und Bridge vorbereiten

- Prioritaet: `P2`
- Status: `completed`
- Ziel:
  - die Ergebnisse von Epic 04 in eine umsetzbare upstream-Spezifikation ueberfuehren
- Scope:
  - DSL-Syntax-Verbesserungen
  - Schema-Domains fuer Components, Templates, Schedules und Host Capabilities
  - Bridge- und Adapter-Anforderungen fuer Epic 05
  - klare Trennung zwischen Kernel, DSL, Host Adapter und XTend Product Adapter
- Zielartefakte:
  - Workpackage-Dokument unter `development/WP-E04-11-Upstream-Handoff-Spezifikation-fuer-XTendRMT-DSL-und-Bridge-vorbereiten.md`
  - Upstream-Handoff-Spezifikation unter `development/XTendRMT-Upstream-Handoff-Spezifikation.md`
  - Epic-05-Startkriterien
  - Schema-Handoff-Metadatum `xtend.rmt.upstream-handoff.v1`
  - Reference- und RMT-Kompatibilitaets-Gate-Anschluss
  - siehe `development/WP-E04-11-Upstream-Handoff-Spezifikation-fuer-XTendRMT-DSL-und-Bridge-vorbereiten.md`
- Betroffene Dateien:
  - `development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md`
  - `development/ADR-XTendRMT-First-Class-Fusion.md`
  - `development/XTendRMT-Upstream-Handoff-Spezifikation.md`
  - `xtendrmt/rmt.schema.json`
- Definition of Done:
  - upstream XTendRMT erhaelt konkrete DSL- und Bridge-Anforderungen
  - Epic 05 kann produktiv statt erneut explorativ starten
  - Build-Artefakte bleiben Output, nicht Architekturquelle

### WP-12 - Epic-Abschlussreview und KPI-Abnahme

- Prioritaet: `P2`
- Status: `completed`
- Ziel:
  - Epic 04 final gegen Ziele, KPI, Risiken und Handoff abnehmen
- Scope:
  - Akzeptanzkriterien aus Epic 04
  - KPI-Bewertung
  - Test- und Reference-Gate-Ergebnis
  - Restrisiken und Epic-05-Folgepunkte
- Zielartefakte:
  - Workpackage-Dokument unter `development/WP-E04-12-Epic-Abschlussreview-und-KPI-Abnahme.md`
  - finaler Abnahmereport
  - aktualisierter Epic- und Backlog-Status
  - KPI-Bewertung, Akzeptanzkriterien-Check, Risikoabdeckung und Epic-05-Folgepunkte
  - siehe `development/WP-E04-12-Epic-Abschlussreview-und-KPI-Abnahme.md`
- Betroffene Dateien:
  - `development/EPIC-04-XTend-Templating-Rendering-und-Framework-Erweiterung.md`
  - `development/BACKLOG-EPIC-04-XTendRMT-DSL-Templating-und-Kompatibilitaetsvorbereitung.md`
  - `tests/references/reference_path_suite.js`
- Definition of Done:
  - Epic 04 ist abgeschlossen oder bewusste Restpunkte sind an Epic 05 uebergeben
  - `npm test` ist als finales lokales Gate gelaufen
  - der upstream-Handoff fuer XTendRMT ist dokumentiert

## Epic-Abschluss Mai 2026

Epic 04 ist abgeschlossen. `WP-01` ist abgeschlossen und legt Produktmodell, Scope, RMT-Templating-Zielbild, Kernel/Adapter-Spannung und Out-of-Scope-Grenzen zu Epic 05 verbindlich fest. `WP-02` ist abgeschlossen und analysiert RMT-Schema, Bestcase-Demo und DSL-Domains nach Kernel-Wissen, DSL-Record und Host-Adapter-Ausfuehrung. `WP-03` ist abgeschlossen und definiert den XTend Component Contract fuer RMT-Kompatibilitaet. `WP-04` ist abgeschlossen und definiert das RMT Template Authoring Model. `WP-05` ist abgeschlossen und standardisiert Root-Lifecycle sowie Scheduler-Handshakes. `WP-06` ist abgeschlossen und beschreibt XTend Host Capabilities. `WP-07` ist abgeschlossen und bindet Scaffold-, Typing-, Preview-, Extension-, Component-Files- und Workflow-Contracts an `xtend.scaffold.rmt-compatibility-binding.v1`. `WP-08` ist abgeschlossen und stellt den dedizierten `rmt-compatibility` Gate bereit. `WP-09` ist abgeschlossen und macht den RMT-basierten XTend-Templating-Pilot ueber `xtend.rmt.template-pilot-flow.v1`, `/templating` und `demo.templating.pilot` sichtbar. `WP-10` ist abgeschlossen und verankert die Opt-in-Migration sowie den Parallelbetrieb mit XTend, React, Vue, Vanilla JS und Custom Hosts. `WP-11` ist abgeschlossen und uebergibt `development/XTendRMT-Upstream-Handoff-Spezifikation.md` an Epic 05. `WP-12` ist abgeschlossen und bestaetigt KPI, Akzeptanzkriterien, Risikoabdeckung und lokale Gates. Alle produktiven Bridge- und Routing-Entscheidungen bleiben bewusst in Epic 05.
