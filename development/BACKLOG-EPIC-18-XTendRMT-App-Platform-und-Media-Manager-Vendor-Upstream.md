# Backlog zu Epic 18 - XTendRMT App Platform und Media-Manager Vendor Upstream

- Status: Planned
- Datum: 2026-05-19
- Contract: `xtend.epic18.rmt-app-platform-backlog.v1`
- Epic Docs: `docs/epic18-media-manager-vendor-upstream.md`
- Initial Workpackage: `development/WP-E18-01-Epic-18-Scope-Vendor-Baseline-und-App-Platform-Leitplanken-finalisieren.md`
- Vendor Source: `/home/konni/Dokumente/net.ccs.cloud/media-manager/vendor/xtend`
- Lessons Source: `/home/konni/Dokumente/net.ccs.cloud/media-manager/docs/xtend-component-bugfixes.md`

## Zweck

Dieses Backlog macht Epic 18 startbar. Es trennt den kurzfristigen Vendor-
Bugfix-Rueckfluss von der groesseren RMT-Produktwelle:

- Die Vendor-Fixes werden als kleine, kontrollierte Stabilisierung in die
  betroffenen XTend-Komponenten zurueckgefuehrt.
- Die Media-Manager-Lessons werden nicht als Produkt-Surface-Blaupause
  uebernommen. Sie dienen als Beweis, dass XTend generische App-Platform-
  Faehigkeiten braucht.
- RMT wird zu einer leistungsfaehigeren App Platform ausgebaut: Entwickler
  sollen native Komponenten, Shells, State, Actions, Daten, Events, Overlays,
  Resources und Builds in XTend/RMT modellieren koennen, ohne externe
  `innerHTML`-Hilfskruecken oder produktlokale Runtime-Frameworks.

## Leitplanken

- RMT beschreibt App-Struktur und Runtime-Verhalten generisch, nicht
  Media-Manager-spezifisch.
- Surfaces bleiben flexible Layout- und Lifecycle-Primitives. Das Backlog legt
  keine Produkt-Surface-Taxonomie wie Explorer, Player oder Inspector fest.
- Entwickler muessen eigene App-Strukturen, Komponentenfamilien, Datenquellen
  und Interaktionsmodelle frei kombinieren koennen.
- Normale UI wird ueber RMT Templates, DOM Descriptoren und sichere Renderer
  erzeugt. `innerHTML` bleibt eine explizite Trusted-DOM-Boundary fuer
  Sonderfaelle.
- Der RMT Kernel importiert keine XTend-Komponenten und bleibt
  framework-agnostisch.
- XTend Custom Elements bleiben die native Ausfuehrungsschicht fuer UI.
- Scaffold und Tooling muessen aus RMT App Sources testbare Artefakte,
  Diagnosen und Browser-Smokes erzeugen koennen.
- Lokale Gates bleiben netzwerkfrei und CDN-frei.

## Definition of Ready

Ein Workpackage darf gestartet werden, wenn:

- Ziel, Scope und erwartete Artefakte klar benannt sind
- das Paket entweder Vendor-Paritaet oder generische RMT-App-Platform-Faehigkeit
  liefert
- keine Media-Manager-Produktlogik als Framework-Default uebernommen wird
- betroffene Module, Tests und Dokumentationspfade benannt sind
- lokale Gates oder ein bewusstes Handoff definiert sind
- die Trusted-DOM- und `no-rmt-kernel-import-of-xtend-types` Boundaries intakt
  bleiben

## Priorisierungslogik

- `P0`: macht die naechste Implementierung startbar, verhindert bekannte
  Regressionen oder schafft App-Platform-Fundament
- `P1`: erweitert die Plattformfaehigkeit zu produktiven App-Flows und
  Entwicklerwerkzeugen
- `P2`: Dokumentation, Migration, Handoff, Release- und Vendor-Rebuild

## Statuslogik

- `ready`: kann als naechstes gestartet werden
- `next`: fachlich naechstes Paket nach einem klaren Vorgaenger
- `blocked`: haengt an benannten Vorgaengern
- `planned`: Teil des Epics, aber noch nicht unmittelbar startbar
- `completed`: umgesetzt und durch Gates oder Handoff akzeptiert

## Naechste startbare Workpackages

| ID | Grund |
|----|-------|
| - | Kein internes Epic-18-Workpackage ist offen; Folgearbeit gehoert in neue Epics oder Host-Adapter-Slices |

## Backlog-Uebersicht

| ID | Prioritaet | Status | Workstream | Titel | Abhaengigkeiten |
|----|------------|--------|------------|-------|-----------------|
| `WP-E18-01` | P0 | completed | WS0 | Epic-18-Scope, Vendor-Baseline und App-Platform-Leitplanken finalisieren | Epic 18 |
| `WP-E18-02` | P0 | completed | WS1 | Vendor Component Bugfix Backport in main | `WP-E18-01` |
| `WP-E18-03` | P0 | completed | WS1 | Bugfix Contract- und Browser-Smokes bauen | `WP-E18-02` |
| `WP-E18-04` | P0 | completed | WS2 | RMT App Platform Authoring Model erweitern | `WP-E18-01` |
| `WP-E18-05` | P0 | completed | WS2 | sicheren DOM Descriptor Renderer und No-Manual-HTML-Gate bauen | `WP-E18-04` |
| `WP-E18-06` | P0 | completed | WS3 | Component-native Template Primitives fuer RMT implementieren | `WP-E18-04`, `WP-E18-05` |
| `WP-E18-07` | P0 | completed | WS4 | Typed State, Selectors und XState Bridge fuer Apps bauen | `WP-E18-04`, `WP-E18-06` |
| `WP-E18-08` | P1 | completed | WS5 | Actions, Effects, DataSources und Resource Runtime anbinden | `WP-E18-07` |
| `WP-E18-09` | P1 | completed | WS6 | deklaratives Event Routing und Component Interaction Contracts bauen | `WP-E18-06`, `WP-E18-08` |
| `WP-E18-10` | P1 | completed | WS7 | Surface-, Overlay-, Portal- und Resource-Graph generisch haerten | `WP-E18-03`, `WP-E18-08`, `WP-E18-09` |
| `WP-E18-11` | P1 | completed | WS8 | Scaffold, Linter, LSP und Diagnostics fuer RMT Apps erweitern | `WP-E18-05`, `WP-E18-06`, `WP-E18-09`, `WP-E18-10` |
| `WP-E18-12` | P1 | completed | WS9 | generische RMT App Platform Fixture bauen | `WP-E18-07`, `WP-E18-08`, `WP-E18-10`, `WP-E18-11` |
| `WP-E18-13` | P2 | completed | WS10 | Docs, Migration Guide, Vendor Rebuild und Release Handoff | `WP-E18-03`, `WP-E18-12` |

## Workstreams

| Workstream | Zweck |
|------------|-------|
| WS0 | Scope, Baseline und Nicht-Produkt-Klon-Leitplanken |
| WS1 | konkrete Vendor-Komponentenstabilisierung |
| WS2 | RMT App Authoring und sichere DOM-Ausfuehrung |
| WS3 | native Template Primitives fuer Komponenten und App-Shells |
| WS4 | State Graph, Selectors und XState App Bridge |
| WS5 | Actions, Effects, DataSources und Resources |
| WS6 | Event Routing und Component Interaction |
| WS7 | Surface, Overlay, Portal und Resource Lifecycle |
| WS8 | Scaffold, Tooling und Diagnostics |
| WS9 | generische App-Platform-Fixture |
| WS10 | Docs, Vendor Build und Release Handoff |

## Workpackages im Detail

### WP-E18-01 - Epic-18-Scope, Vendor-Baseline und App-Platform-Leitplanken finalisieren

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - Epic 18 formal startbar machen und festlegen, dass die Media-Manager-
    Lessons generische Plattformanforderungen sind.
- Scope:
  - Vendor-Diff-Baseline fuer die fuenf Komponenten
  - Backlog-Reihenfolge und Startpakete
  - Nicht-Ziele fuer Produkt-Surface-Kopien
  - Definition of Ready fuer RMT-App-Platform-Pakete
- Zielartefakte:
  - dieses Backlog
  - aktualisierte `docs/epic18-media-manager-vendor-upstream.md`
  - `development/WP-E18-01-Epic-18-Scope-Vendor-Baseline-und-App-Platform-Leitplanken-finalisieren.md`
- Definition of Done:
  - erfuellt: `WP-E18-02` und `WP-E18-04` sind startbar
  - erfuellt: Media-Manager-Surfaces sind nur noch Proof-of-Need, nicht Ziel-API

### WP-E18-02 - Vendor Component Bugfix Backport in main

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - die bekannten Vendor-Fixes gezielt in die main-Komponenten uebernehmen.
- Scope:
  - `components/xtooltip.js`
  - `components/xplayer.js`
  - `components/xsurfacewindow.js`
  - `components/xsidepanel.js`
  - `components/xsurfacemanager-controller.js`
- Zielartefakte:
  - `development/WP-E18-02-Vendor-Component-Bugfix-Backport-in-main.md`
  - aktualisierte `components/xtooltip.js`
  - aktualisierte `components/xplayer.js`
  - aktualisierte `components/xsurfacewindow.js`
  - aktualisierte `components/xsidepanel.js`
  - aktualisierte `components/xsurfacemanager-controller.js`
- Nicht-Scope:
  - keine Komplettkopie aus `vendor/xtend`
  - keine Media-Manager-Theme- oder Produkt-Workarounds
- Definition of Done:
  - erfuellt: alle fuenf Deltas sind uebernommen
  - erfuellt: Komponentenbaum ist gegen den Vendor-Snapshot deckungsgleich
  - erfuellt: `components`, `surface-controller`, `overlay-interaction-ux` und
    `layout-display-media-ux` bleiben gruen

### WP-E18-03 - Bugfix Contract- und Browser-Smokes bauen

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - Regressionen der Backports browsernah absichern.
- Scope:
  - Tooltip-Clipping in overflow-hidden Containers
  - XPlayer ES-Modul-Import, Resize, langer Titel, Volume-Hover,
    XState-Playback-Events
  - Surface-Controller Re-Register-Preserve
  - SurfaceWindow/SidePanel horizontale Scrollbar-Grenzen
- Zielartefakte:
  - `development/WP-E18-03-Bugfix-Contract-und-Browser-Smokes-bauen.md`
  - `tests/components/epic18_vendor_bugfix_smoke_suite.js`
  - `tests/browser/fixtures/epic18-vendor-bugfix-smoke.html`
  - aktualisierte `tests/browser/browser_smoke_suite.js`
  - aktualisierte `scripts/run_xtend_tests.js`
- Definition of Done:
  - erfuellt: Tests schlagen ohne Fix reproduzierbar fehl
  - erfuellt: lokale Browser-Smokes bleiben netzwerkfrei
  - erfuellt: `epic18-vendor-bugfix-smokes` ist als Runner-Gate registriert
  - erfuellt: Epic-18-Fixture ist im Browser-Harness eingebunden

### WP-E18-04 - RMT App Platform Authoring Model erweitern

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - RMT als generisches App-Authoring-Modell schaerfen, bevor Runtime-Code
    festgelegt wird.
- Scope:
  - App, route, surface, slot, template, component, state, selector, derive,
    repeat, when, bind, action, effect, datasource, resource und event als
    kombinierbare Konzepte
  - generische Component-Adapter-Faehigkeiten statt Produktkomponenten
  - frei definierbare App-Domains und Record-Vertraege
  - Abgrenzung zwischen strukturierter UI und Trusted-HTML-Sonderfaellen
- Zielartefakte:
  - `development/WP-E18-04-RMT-App-Platform-Authoring-Model-erweitern.md`
  - `catalog/epic18-rmt-app-platform-authoring.js`
  - `tests/fixtures/rmt-app-platform-authoring.rmt`
  - `tests/rmt/rmt_app_platform_authoring_suite.js`
  - `docs/rmt-app-platform-authoring.md`
  - aktualisierte `scripts/run_xtend_tests.js`
  - aktualisierte `package.json`
- Definition of Done:
  - erfuellt: Authoring Contract beschreibt flexible App-Platform-Primitives
  - erfuellt: keine Media-Manager-spezifischen Surface-Namen oder Datenformen sind
    Voraussetzung
  - erfuellt: `rmt-app-platform-authoring` ist als lokaler Gate registriert

### WP-E18-05 - Sicheren DOM Descriptor Renderer und No-Manual-HTML-Gate bauen

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - RMT Templates ohne externe `innerHTML`-Renderer ausfuehrbar machen.
- Scope:
  - DOM Descriptor Runtime mit `createElement`, `replaceChildren`, keyed
    Diffing und sicheren Attribut-/Property-Settern
  - explizite Trusted-DOM-Boundary fuer HTML-Fragmente
  - No-Manual-HTML-Gate fuer normale App-UI
  - Diagnosepfad von Runtimefehlern zur RMT Source
- Definition of Done:
  - erfuellt: eine generische RMT Shell-Render-Unit laeuft ohne produktseitiges
    `root.innerHTML`, `element.innerHTML` oder `template.innerHTML`
  - erfuellt: `rmt-dom-descriptor-renderer` ist als lokaler Gate registriert
  - erfuellt: Trusted HTML bleibt auf `xtend.rmt.trusted-dom-boundary.explicit`
    begrenzt
  - erfuellt: Runtimefehler werden mit RMT-Source-Pointern diagnostiziert
- Zielartefakte:
  - `development/WP-E18-05-Sicheren-DOM-Descriptor-Renderer-und-No-Manual-HTML-Gate-bauen.md`
  - `catalog/epic18-rmt-dom-descriptor-renderer.js`
  - `xtendrmt/rmt-dom-descriptor-renderer.js`
  - `xtendrmt/rmt-dom-descriptor-renderer.d.ts`
  - `tests/fixtures/rmt-dom-descriptor-renderer.rmt`
  - `tests/rmt/rmt_dom_descriptor_renderer_suite.js`
  - `docs/rmt-dom-descriptor-renderer.md`

### WP-E18-06 - Component-native Template Primitives fuer RMT implementieren

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - Entwickler koennen XTend-Komponenten nativ in RMT komponieren.
- Scope:
  - `component`, `props`, `attributes`, `parts`, `slots`, `text`, `when`,
    `repeat`, `empty`, `fallback`, `key`, `ref`, `class`, `style-token`
  - Icons, Tooltips, Form Controls und beliebige Custom Elements als
    generische Component Bindings
  - Liste, Auswahl, leerer Zustand und Fehlerzustand als Primitives
- Definition of Done:
  - erfuellt: eine App-Shell kann Komponentenfamilien zusammenstellen, ohne HTML-String-
    Hilfsrenderer im Host zu brauchen
  - erfuellt: `rmt-component-template-primitives` ist als lokaler Gate
    registriert
  - erfuellt: Icons, Tooltips, Form Controls, Listen, Selection, Empty State,
    Error State und freie Custom Elements sind als generische Familien
    abgedeckt
- Zielartefakte:
  - `development/WP-E18-06-Component-native-Template-Primitives-fuer-RMT-implementieren.md`
  - `catalog/epic18-rmt-component-template-primitives.js`
  - `tests/fixtures/rmt-component-template-primitives.rmt`
  - `tests/rmt/rmt_component_template_primitives_suite.js`
  - `docs/rmt-component-template-primitives.md`
  - aktualisierte `xtendrmt/rmt-dom-descriptor-renderer.js`
  - aktualisierte `xtendrmt/rmt-dom-descriptor-renderer.d.ts`

### WP-E18-07 - Typed State, Selectors und XState Bridge fuer Apps bauen

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - App-Zustand wird deklarativ, typisiert und komponentennah verwendbar.
- Scope:
  - State Graphs
  - Selectors und derived Values
  - Reducer-/Command-Pattern
  - XState Bridge fuer Component- und App-State
  - Preserve-Regeln fuer nicht-strukturelle State-Aenderungen
- Definition of Done:
  - erfuellt: Selection-, Filter- und UI-State koennen DOM-Attribute
    aktualisieren, ohne Listen oder ganze Inseln neu zu hydrieren
  - erfuellt: `rmt-state-selector-runtime` ist als lokaler Gate registriert
  - erfuellt: `xstate` bleibt injizierter Host-Adapter und wird nicht in die
    Runtime importiert
- Zielartefakte:
  - `development/WP-E18-07-Typed-State-Selectors-und-XState-Bridge-fuer-Apps-bauen.md`
  - `catalog/epic18-rmt-state-selector-runtime.js`
  - `tests/fixtures/rmt-state-selector-runtime.rmt`
  - `tests/rmt/rmt_state_selector_runtime_suite.js`
  - `docs/rmt-state-selector-runtime.md`
  - `xtendrmt/rmt-state-selector-runtime.js`
  - `xtendrmt/rmt-state-selector-runtime.d.ts`

### WP-E18-08 - Actions, Effects, DataSources und Resource Runtime anbinden

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - RMT Apps koennen Daten laden, mutieren und Ressourcen besitzen, ohne
    produktlokale Action-Frameworks.
- Scope:
  - Actions mit Loading, Success, Error und Cancel
  - Effects fuer Toasts, Navigation, Focus, Lazy Imports und Side Effects
  - DataSources fuer Fixture, REST, SSR und Host-Adapter
  - Resource Ownership fuer Object URLs, Streams, Observer, Timers und Imports
- Definition of Done:
  - erfuellt: Standard-App-Flows lassen sich als RMT Actions/Effects
    modellieren und diagnostizieren
  - erfuellt: Fixture-, REST-, SSR- und Host-DataSources laufen ueber
    deklarative Runtime-Definitionen und injizierte Adapter
  - erfuellt: Object URLs, Streams, Observer, Timers und Lazy Imports besitzen
    owner-basierte Cleanup-Semantik
  - erfuellt: `rmt-action-effect-runtime` ist als lokaler Gate registriert
- Zielartefakte:
  - `development/WP-E18-08-Actions-Effects-DataSources-und-Resource-Runtime-anbinden.md`
  - `catalog/epic18-rmt-action-effect-runtime.js`
  - `tests/fixtures/rmt-action-effect-runtime.rmt`
  - `tests/rmt/rmt_action_effect_runtime_suite.js`
  - `docs/rmt-action-effect-runtime.md`
  - `xtendrmt/rmt-action-effect-runtime.js`
  - `xtendrmt/rmt-action-effect-runtime.d.ts`

### WP-E18-09 - Deklaratives Event Routing und Component Interaction Contracts bauen

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - Events werden zur Plattformfaehigkeit statt Host-Adapter-Glue.
- Scope:
  - DOM- und Custom-Event-Bindings
  - Payload-Contracts
  - Event-to-Action-Mapping
  - Event Governance fuer Bubbling, Retargeting, Cancel und Ownership
  - Ersatz fuer produktseitige `event.target.closest(...)`-Ketten
- Definition of Done:
  - erfuellt: RMT Diagnostics zeigen Event-Quelle, Component, Payload und
    Action-Ziel
  - erfuellt: Payload-Contracts blockieren ungueltige Event-Payloads vor der
    Action-Ausfuehrung
  - erfuellt: Listener koennen owner-basiert attached und detached werden
  - erfuellt: `rmt-event-routing-runtime` ist als lokaler Gate registriert
- Zielartefakte:
  - `development/WP-E18-09-Deklaratives-Event-Routing-und-Component-Interaction-Contracts-bauen.md`
  - `catalog/epic18-rmt-event-routing-runtime.js`
  - `tests/fixtures/rmt-event-routing-runtime.rmt`
  - `tests/rmt/rmt_event_routing_runtime_suite.js`
  - `docs/rmt-event-routing-runtime.md`
  - `xtendrmt/rmt-event-routing-runtime.js`
  - `xtendrmt/rmt-event-routing-runtime.d.ts`

### WP-E18-10 - Surface-, Overlay-, Portal- und Resource-Graph generisch haerten

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - App-Layout, Overlays und Lifecycle werden generische Runtime-Primitives.
- Scope:
  - keyed Surface-Repeater
  - Bounds, focus, close, destroy, minimize, restore und persistence
  - Portal-Layer fuer Tooltip, Toast, Popover, Lightbox, Menu und Dialog
  - Resource Cleanup pro Instanz
  - keine produktgebundene Surface-Liste
- Definition of Done:
  - erfuellt: Entwickler koennen eigene dynamische Surface- und Overlay-Modelle bauen,
    ohne Registry- oder Portal-Workarounds im Produktcode
  - erfuellt: keyed Surface-Repeater erhaelt Bounds, Fokus und Status bei
    Re-Materialisierung
  - erfuellt: Minimize erhaelt Ressourcen, Destroy gibt Ressourcen frei und
    trennt Event-Owner
  - erfuellt: Tooltip, Toast, Popover, Lightbox, Menu und Dialog teilen eine
    generische Portal-/Layer-Policy
  - erfuellt: `rmt-surface-resource-graph-runtime` ist als lokaler Gate
    registriert
- Zielartefakte:
  - `development/WP-E18-10-Surface-Overlay-Portal-und-Resource-Graph-generisch-haerten.md`
  - `catalog/epic18-rmt-surface-resource-graph-runtime.js`
  - `tests/fixtures/rmt-surface-resource-graph-runtime.rmt`
  - `tests/rmt/rmt_surface_resource_graph_runtime_suite.js`
  - `docs/rmt-surface-resource-graph-runtime.md`
  - `xtendrmt/rmt-surface-resource-graph-runtime.js`
  - `xtendrmt/rmt-surface-resource-graph-runtime.d.ts`

### WP-E18-11 - Scaffold, Linter, LSP und Diagnostics fuer RMT Apps erweitern

- Prioritaet: `P1`
- Status: `completed`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-app-platform-tooling --json`
- Ziel:
  - die neue App-Platform wird authoring- und buildfaehig.
- Scope:
  - Scaffold-Pipeline fuer RMT App Sources
  - Linter-Regeln fuer no-manual-shell, unsafe HTML, unkeyed repeat,
    untyped events und fehlende resource ownership
  - LSP Completion, Hover und Diagnostics fuer neue Primitives
  - Build Reports und Source Maps
- Definition of Done:
  - erfuellt: Entwickler bekommen vor Runtime Fehlerdiagnosen und koennen Apps
    ueber Scaffold in testbare Artefakte bauen
  - erfuellt: App-Platform-Diagnostics decken no-manual-shell, unsafe HTML,
    unkeyed repeat, untyped events, resource ownership und Referenzen ab
  - erfuellt: LSP Completion/Hover kennt Portale, Overlays, Resources, Events
    und Surface-States
  - erfuellt: `rmt-app-platform-tooling` ist als lokaler Gate registriert
  - erfuellt: `rmt-app-platform` erzeugt Diagnostics, Source Map und Build
    Report ueber Scaffold WritePlan
- Zielartefakte:
  - `development/WP-E18-11-Scaffold-Linter-LSP-und-Diagnostics-fuer-RMT-Apps-erweitern.md`
  - `catalog/epic18-rmt-app-platform-tooling.js`
  - `tools/rmt-language/app-platform-tooling.js`
  - `tools/rmt-language/app-platform-tooling.d.ts`
  - `tools/rmt-language/rules/app-platform-policy.js`
  - `xtend-builder/generators/rmt-app-platform.js`
  - `tests/fixtures/rmt-app-platform-tooling.rmt`
  - `tests/rmt-language/rmt_app_platform_tooling_suite.js`
  - `docs/rmt-app-platform-tooling.md`

### WP-E18-12 - Generische RMT App Platform Fixture bauen

- Prioritaet: `P1`
- Status: `completed`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-app-platform-fixture --json`
- Ziel:
  - eine produktnahe, aber domain-neutrale Fixture beweist die Plattform.
- Scope:
  - konfigurierbare Records statt fester Record-Pflicht
  - Liste, Details, Aktionen, Feedback, dynamische Surfaces, Overlays und
    Resource Cleanup
  - austauschbare DataSources
  - keine 1:1-Media-Manager-Surface-Struktur
- Definition of Done:
  - Fixture beweist Flexibilitaet: dieselben RMT-Primitives koennen eine
    Media-App, Admin-App oder Content-App tragen
- Ergebnis:
  - erfuellt: `rmt-app-platform-fixture` ist als lokaler Gate registriert
  - erfuellt: Fixture deckt `generic-catalog`, `admin-queue` und
    `content-board` mit denselben Primitives ab
  - erfuellt: End-to-End-Gate prueft Renderer, State, Actions, Events,
    Surfaces, Overlays, Portals, Resource Cleanup und Scaffold Build Evidence
- Zielartefakte:
  - `development/WP-E18-12-Generische-RMT-App-Platform-Fixture-bauen.md`
  - `catalog/epic18-rmt-app-platform-fixture.js`
  - `tests/fixtures/rmt-app-platform-fixture.rmt`
  - `tests/rmt/rmt_app_platform_fixture_suite.js`
  - `docs/rmt-app-platform-fixture.md`

### WP-E18-13 - Docs, Migration Guide, Vendor Rebuild und Release Handoff

- Prioritaet: `P2`
- Status: `completed`
- Lokaler Gate: `node scripts/run_xtend_tests.js epic18-rmt-app-platform --json`
- Ziel:
  - Epic 18 dokumentiert und release-nah abschliessen.
- Scope:
  - Component Docs fuer Bugfix-Verhalten
  - RMT App Platform Authoring Guide
  - Migration Guide weg von externen `innerHTML`-Hosts
  - Vendor Rebuild und Package Export Lock
  - Epic-18 Handoff Gate
- Definition of Done:
  - Entwickler koennen die neue App Platform nachvollziehen und neue Apps ohne
    externe Shell-Renderer starten
- Ergebnis:
  - erfuellt: Vendor-Bugfix-Doku ist unter `docs/epic18-vendor-bugfixes.md`
    verfuegbar
  - erfuellt: Migration weg von externen HTML-Hosts ist unter
    `docs/rmt-app-platform-migration-guide.md` dokumentiert
  - erfuellt: Epic-18-Umbrella-Gate `epic18-rmt-app-platform` ist registriert
  - erfuellt: PR-Gate `npm run test:pr:report` enthaelt den Epic-18-Handoff
  - erfuellt: GitHub Actions nutzen weiterhin PR- und Full-Release-Reports
- Zielartefakte:
  - `development/WP-E18-13-Docs-Migration-Guide-Vendor-Rebuild-und-Release-Handoff.md`
  - `catalog/epic18-rmt-app-platform-release-handoff.js`
  - `tests/platform/epic18_rmt_app_platform_release_handoff_suite.js`
  - `docs/epic18-vendor-bugfixes.md`
  - `docs/rmt-app-platform-migration-guide.md`
  - `docs/epic18-rmt-app-platform-release-handoff.md`

## Geplante Gate-Kette

Bugfix-Linie:

```bash
node scripts/run_xtend_tests.js components surface-controller surface-manager-browser overlay-interaction-ux layout-display-media-ux epic18-vendor-bugfix-smokes browser references --json
```

RMT-App-Platform-Linie:

```bash
node scripts/run_xtend_tests.js rmt-app-platform-authoring rmt-dom-descriptor-renderer rmt-component-template-primitives rmt-state-selector-runtime rmt-action-effect-runtime rmt-event-routing-runtime rmt-surface-resource-graph-runtime rmt-app-platform-tooling rmt-app-platform-fixture rmt-vnext-compiler rmt-vnext-events rmt-vnext-surfaces rmt-vnext-security rmt-first-demo-app scaffold-rmt-build --json
```

Epic-Handoff:

```bash
node scripts/run_xtend_tests.js epic18-rmt-app-platform --json
npm run test:pr:report
npm run test:release:full:report
npm run pack:dry-run
```
