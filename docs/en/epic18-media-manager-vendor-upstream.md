# Epic 18 RMT App Platform und Media Manager Vendor Upstream

- Contract: `xtend.epic18.rmt-app-platform-vendor-upstream.v1`
- Status: `planned`
- Backlog: `development/BACKLOG-EPIC-18-XTendRMT-App-Platform-und-Media-Manager-Vendor-Upstream.md`
- Initial Workpackage: `development/WP-E18-01-Epic-18-Scope-Vendor-Baseline-und-App-Platform-Leitplanken-finalisieren.md`
- Source vendor snapshot: `@ccslabs/xtend@0.1.0-rc.1`
- Vendor source commit: `fab0e2d1281336d1b6813217e61ee2453ede09e7`
- Vendor package date: `2026-05-17`
- Source docs:
  - `/home/konni/Dokumente/net.ccs.cloud/media-manager/docs/xtend-component-bugfixes.md`
  - `/home/konni/Dokumente/net.ccs.cloud/media-manager/docs/vendor-build.md`
  - `/home/konni/Dokumente/net.ccs.cloud/media-manager/docs/architecture.md`
- Target: XTend main branch, source components, tests, docs, RMT/App-Shell runtime and vendor build.

## Ziel

Epic 18 fuehrt die Media-Manager-Vendor-Fixes kontrolliert in XTend main
zurueck und nutzt die Media-Manager-Lessons-Learned als Proof-of-Need fuer eine
deutlich leistungsfaehigere RMT App Platform. Der kurzfristige Scope ist
Vendor-Paritaet fuer die abweichenden XTend-Komponenten. Der strategische Scope
ist generischer: Entwickler sollen App-Shells, Komponenten, State, Events,
Actions, DataSources, Resources, Overlays und dynamische Layouts nativ in
XTend/RMT modellieren koennen, ohne produktseitige `innerHTML`-Renderer,
manuelle Event-Delegation oder eigene Mini-Frameworks.

Der Media Manager ist dabei keine zu kopierende Produktvorlage. Seine Surfaces
und Records bleiben Beispielmaterial. Die Ziel-API sind flexible App-Platform-
Primitives, mit denen auch Admin-, Content-, Dashboard-, Editor- oder
Media-Apps gebaut werden koennen.

## Vendor-Paritaetsbefund

Der Vergleich von XTend main gegen
`/home/konni/Dokumente/net.ccs.cloud/media-manager/vendor/xtend` zeigt:

| Bereich | Befund |
|---------|--------|
| `components/` | 5 abweichende Dateien, 241 Insertions, 41 Deletions |
| `xtend-builder/` | keine fachliche Abweichung, nur lokale `.DS_Store` |
| `tools/` | keine fachliche Abweichung, nur lokale `.DS_Store` |
| `xtendrmt/` | keine fachliche Abweichung, nur lokale `.DS_Store` |
| `fabric/` | deckungsgleich |
| `a11y/` | deckungsgleich |
| `security/` | deckungsgleich |
| `design-tokens/` | deckungsgleich |
| `catalog/` | deckungsgleich |
| Top-Level Loader/API/CSS | deckungsgleich |

Die Bugfix-Welle darf deshalb eng geschnitten werden: keine ungezielte
Vendor-Kopie, sondern gezielte Uebernahme der fuenf Komponenten-Deltas plus
Tests, Dokumentation und Release-/Pack-Gates.

## P0 Bugfix-Welle

| Modul | Vendor-Delta | Upstream-Ziel |
|-------|--------------|---------------|
| `components/xtooltip.js` | Tooltip-Surface wird als `viewport-fixed-layer` statt als lokaler Anchor-Layer positioniert. Resize/Scroll planen per `requestAnimationFrame` eine Positionsaktualisierung. | Tooltips in Shells und Surfaces duerfen durch `overflow: hidden` nicht mehr clippen und keine Toolbar-Hoehe veraendern. |
| `components/xplayer.js` | Entfernt Module-Scope-`this.shadowRoot`, sichert `customElements.define`, fuehrt Host-/Player-Containment, `ResizeObserver`, langen Titel-Ellipsis, sichtbaren Volume-Overflow und kanonische Media-Events ein. | `x-player` bleibt in resizebaren Surfaces begrenzt, importiert fehlerfrei als ES-Modul und dispatcht `xplayer-play`/`xplayer-pause` aus nativen Media-Zustandswechseln. |
| `components/xsurfacewindow.js` | Content scrollt vertikal, horizontales Scrolling wird an der Surface-Grenze unterbunden. | Lange Inhalte erzeugen keine horizontalen Surface-Scrollbars. |
| `components/xsidepanel.js` | Content scrollt vertikal, horizontales Scrolling wird unterbunden; Collapse-Icon folgt `placement` und `collapsed`. | Side Panels behalten stabile Bounds und korrekt lesbare Collapse-Signale fuer links, rechts, inline und bottom. |
| `components/xsurfacemanager-controller.js` | `registerSurface` bewahrt bei Re-Register `bounds`, `previousBounds`, `minimized`, `maximized`, `pinned`, `collapsed`, `placement` und `mode`. | Dynamisch hinzukommende Surfaces duerfen Runtime-Bounds, Z-Order und Persistenzstatus bestehender Surfaces nicht zuruecksetzen. |

## P0 Akzeptanztests

- `x-tooltip` in einer Toolbar innerhalb eines resizebaren `x-surface-window`
  oeffnen. Erwartet: Tooltip liegt ueber der Shell, wird nicht geclippt und
  verursacht keinen Layout Shift.
- `x-player` als ES-Modul importieren und eine Instanz mounten. Erwartet: kein
  Module-Scope-Fehler, `customElements.define` ist idempotent, native `title`
  Attribute werden erst nach Shadow-DOM-Aufbau entfernt.
- `x-player` mit `width="100%" height="100%"` in einem resizebaren
  `x-surface-window` testen. Erwartet: Host, `.player`, Media-Element,
  Titelzeile, Controls und Volume-Slider bleiben innerhalb der Surface.
- `x-player` per Button, Keyboard und
  `xstate.set("xplayer-state-<id>", { playing: true })` starten. Erwartet:
  genau ein `xplayer-play` nach echtem Media-Start; `xplayer-pause` kommt aus
  dem nativen `pause` Event.
- Lange ungebrochene Inhalte in `x-surface-window` und `x-side-panel` rendern.
  Erwartet: keine horizontale Surface-Scrollbar; Inhalt muss selbst umbrechen,
  truncaten oder clippen.
- Eine Surface verschieben/resizen, danach eine zweite Surface dynamisch in den
  `x-surface-manager` slotten. Erwartet: die erste Surface behaelt Bounds,
  Status, `active/zIndex`, Minimize/Maximize-Status und Side-Panel Attribute.

## Blind Spots aus dem Media Manager

Der Media Manager startet bereits Shell-first ueber einen RMT Host-Adapter, muss
aber seine eigentliche UI weiterhin imperativ in `media-manager-shell.js`
rendern. Epic 18 schliesst diese Luecke nicht durch eine 1:1-Portierung der
Media-Manager-Oberflaeche, sondern durch generische RMT-App-Platform-
Faehigkeiten.

### BS1 RMT Template Runtime

RMT muss normale UI ausdruecken koennen: Komponenten, Attribute, Textknoten,
konditionale Bereiche, keyed Listen, leere Zustaende, Slots, Tooltips, Icons und
Form Controls. Produkt-Code soll fuer normale App-UI keine HTML-Strings mehr
bauen muessen.

Akzeptanz: Listen, Detailbereiche, Toolbars, Feedback-Zonen und beliebige
Custom-Element-Kompositionen lassen sich als RMT Templates beschreiben und als
Render-Units ausfuehren.

### BS2 Sicherer DOM Descriptor Renderer

Der Compiler braucht DOM-Descriptoren oder erzeugte Renderfunktionen, die mit
`createElement`, `replaceChildren`, keyed Diffing und sicheren Attribut-Settern
arbeiten. Direkte HTML-Sinks bleiben eine explizite Trusted-HTML-Grenze des
Frameworks.

Akzeptanz: normale RMT Shell-Templates verwenden keine produktseitigen
`root.innerHTML`, `element.innerHTML` oder `template.innerHTML` Writes.

### BS3 Typed State und XState Bridge

App-State wie Collection, Filter, Sortierung, aktive Auswahl, Formwerte,
Panel-Zustaende oder dynamische Instanzen wird als RMT State Graph mit
Selectors, derived Values, Reducers und XState-Bindings modellierbar.

Akzeptanz: Selection-Aenderungen koennen Attribute/ARIA-Zustand inkrementell
synchronisieren, ohne Listen neu zu hydrieren oder Scroll/Fokus zu verlieren.

### BS4 Actions, Effects und Feedback

Async-Flows wie Daten laden, Reindex, Upload, Delete, Lazy Imports,
Navigation, Preview-Open oder externe Component-Commands laufen ueber
deklarative RMT Actions und Effects mit Loading-, Success-, Error- und
Feedback-Resultaten.

Akzeptanz: `x-toast` kann als RMT Feedback Surface vorgeladen und ueber
Action-Resultate gesteuert werden; Produktcode ruft keine ad-hoc Toast-Handler
fuer Standardfluesse mehr auf.

### BS5 DataSources und Contracts

RMT braucht DataSources fuer Fixture, REST, SSR und spaeter Electron/Node,
inklusive Schema-Validierung, Normalisierung und Pagination.

Akzeptanz: frei definierbare Record-Vertraege wirken in Template-, Selector-
und Action-Typen hinein; Backend-Endpunkte bleiben reine Daten-, Stream- und
Mutation-Adapter.

### BS6 Surface Graph Runtime

Dynamische Surface-Instanzen muessen frameworknativ als keyed Surface-Repeater
ausdrueckbar sein. Minimize, restore, close, destroy, focus, persistence,
bounds, placement und Layout-Modi gehoeren in den Surface Graph.

Akzeptanz: Entwickler koennen eigene Surface-Modelle aus beliebigen Records
erzeugen, ohne produktseitige Registry-Repaints oder Bounds-Recovery zu
schreiben.

### BS7 Island Diffing und Preserve-Regeln

Insular Hydration braucht strukturelle Patches. Auswahlwechsel duerfen Listen
nicht neu schreiben, Scroll/Fokus duerfen nicht verloren gehen und
Component-Shadow-DOM darf nicht unnoetig neu entstehen.

Akzeptanz: Hydration-Keys unterscheiden strukturelle Aenderungen von reinem
Selection-/State-Sync; Browser-Smokes pruefen Scroll- und Fokus-Erhalt.

### BS8 Event Routing

DOM-Events wie `click`, `change`, `input`, `drop`, `surface-closed`,
`xplayer-play` und `lightbox-closed` laufen ueber deklarative RMT Event Bindings
in Actions. Produktseitige `event.target.closest(...)`-Ketten sind nur noch
Host-Adapter-Fallback.

Akzeptanz: RMT Build-Diagnostics koennen Event-Quelle, Action-Ziel und Payload-
Contract sichtbar machen.

### BS9 Overlay- und Portal-Layer

`x-tooltip`, `x-toast`, `x-lightbox`, Popovers, Menus, Dialoge und andere
Overlays brauchen eine gemeinsame Portal-Schicht fuer Z-Index, Focus, Escape,
Pointer, Scroll und Clipping. Diese Schicht muss ueber RMT adressierbar sein.

Akzeptanz: Tooltip-Fix ist der erste Slice; weitere Overlays teilen danach
Portal-/Layer-Policy statt App-Shell-Workarounds.

### BS10 Resource Lifecycle Manager

Custom Elements, Object URLs, ResizeObserver, Idle Handles, Streams, Timers und
dynamische Imports brauchen deklarative Ownership. Destroy einer Surface oder
Render-Unit raeumt nur Ressourcen dieser Instanz auf.

Akzeptanz: Close zerstoert Surface-DOM und instanzgebundene Ressourcen;
Minimize erhaelt DOM, Shadow DOM und Runtime-State.

### BS11 SSR und Prehydration Contract

Backend-Adapter sollen initiale Records, Surface-Snapshots und optional
vorhydrierte Daten als RMT Data Payload liefern koennen. Der Client initialisiert
daraus denselben State Graph.

Akzeptanz: eine generische App-Platform-Fixture kann mit Fixture- oder
SSR-Payload starten, ohne doppelten produktseitigen Boot-State.

### BS12 Diagnostics und Gates

Der Build muss erkennen, wenn Produkt-Shells direkte `innerHTML`-Sinks, manuelle
Full-Root-Repaints oder nicht-keyed Listen einfuehren.

Akzeptanz: ein Gate markiert normale App-UI-`innerHTML`-Writes ausserhalb der
Trusted-DOM-Boundary als Regression.

## Workpackages

Die operative Reihenfolge liegt im Backlog
`development/BACKLOG-EPIC-18-XTendRMT-App-Platform-und-Media-Manager-Vendor-Upstream.md`.
Die Backlog-Linie ist bewusst zweigeteilt: zuerst konkrete Vendor-
Stabilisierung, danach RMT als generische App Platform.

| ID | Prioritaet | Status | Workstream | Titel |
|----|------------|--------|------------|-------|
| `WP-E18-01` | P0 | completed | WS0 | Epic-18-Scope, Vendor-Baseline und App-Platform-Leitplanken finalisieren |
| `WP-E18-02` | P0 | completed | WS1 | Vendor Component Bugfix Backport in main |
| `WP-E18-03` | P0 | completed | WS1 | Bugfix Contract- und Browser-Smokes bauen |
| `WP-E18-04` | P0 | completed | WS2 | RMT App Platform Authoring Model erweitern |
| `WP-E18-05` | P0 | completed | WS2 | sicheren DOM Descriptor Renderer und No-Manual-HTML-Gate bauen |
| `WP-E18-06` | P0 | completed | WS3 | Component-native Template Primitives fuer RMT implementieren |
| `WP-E18-07` | P0 | completed | WS4 | Typed State, Selectors und XState Bridge fuer Apps bauen |
| `WP-E18-08` | P1 | completed | WS5 | Actions, Effects, DataSources und Resource Runtime anbinden |
| `WP-E18-09` | P1 | completed | WS6 | deklaratives Event Routing und Component Interaction Contracts bauen |
| `WP-E18-10` | P1 | completed | WS7 | Surface-, Overlay-, Portal- und Resource-Graph generisch haerten |
| `WP-E18-11` | P1 | completed | WS8 | Scaffold, Linter, LSP und Diagnostics fuer RMT Apps erweitern |
| `WP-E18-12` | P1 | completed | WS9 | generische RMT App Platform Fixture bauen |
| `WP-E18-13` | P2 | completed | WS10 | Docs, Migration Guide, Vendor Rebuild und Release Handoff |

Naechste startbare Pakete:

- Kein internes Epic-18-Workpackage ist offen.

Abgeschlossener WP-E18-12 Fixture-Gate:
`node scripts/run_xtend_tests.js rmt-app-platform-fixture --json`.

Abgeschlossener WP-E18-11 Tooling-Gate:
`node scripts/run_xtend_tests.js rmt-app-platform-tooling --json`.

Abgeschlossener WP-E18-13 Handoff-Gate:
`node scripts/run_xtend_tests.js epic18-rmt-app-platform --json`.

Release-Handoff-Schema:
`xtend.epic18.rmt-app-platform-release-handoff.v1`.

`WP-E18-12` kopiert keine 1:1-Media-Manager-Surface-Struktur. Die Fixture
belegt mit `generic-catalog`, `admin-queue` und `content-board`, dass dieselben
RMT-Primitives flexibel verschiedene App-Domaenen tragen koennen.

## Modul-Upgrade-Matrix

| XTend-Modul | Upgrade in Epic 18 |
|-------------|--------------------|
| `components/` | P0 Backports fuer Tooltip, Player, Surface Window, Side Panel und Surface Controller. |
| `tests/components/` | Contract-Tests fuer Re-Register-Preserve, SidePanel Placement Icons und Component-Level Regressionen. |
| `tests/browser/` | Browser-nahe Fixtures fuer Tooltip-Clipping, Player-Resize, Volume-Hover, langen Titel, XState-Playback und Surface-Scrollbar-Grenzen. |
| `docs/components/` | User-facing Dokumentation der neuen Verhaltensgarantien und Akzeptanzbeispiele. |
| `docs/epic18-vendor-bugfixes.md` | Zentrale Bugfix-Doku fuer Tooltip, Player, Surface Window, Side Panel und SurfaceManager Controller. |
| `docs/rmt-app-platform-migration-guide.md` | Migration weg von externen HTML-Hosts hin zu DOM Descriptor, Actions, DataSources, Surfaces, Overlays und Resource Cleanup. |
| `docs/epic18-rmt-app-platform-release-handoff.md` | Epic-18-Handoff mit Gate-Matrix, GitHub Actions und Pack-/Export-Lock-Evidence. |
| `xtendrmt/` | App-Platform Authoring Model, Shell Render-Units, DOM Descriptor Renderer (`xtendrmt/rmt-dom-descriptor-renderer.js`), component-native Template Primitives, State Selector Runtime (`xtendrmt/rmt-state-selector-runtime.js`), Action Effect Runtime (`xtendrmt/rmt-action-effect-runtime.js`), Event Routing Runtime (`xtendrmt/rmt-event-routing-runtime.js`), Surface Resource Graph Runtime (`xtendrmt/rmt-surface-resource-graph-runtime.js`), DataSources, Events, Surfaces, Overlays, Portals und Resources; die WP12-Fixture verbindet diese Bausteine end-to-end. |
| `tools/rmt-language/` | Linter-, Diagnostics-, Completion- und Hover-Support fuer `state`, `derive`, `repeat`, `when`, `bind`, `effect`, `datasource`, `resource`, `portal`, `overlay`, Component Bindings und no-manual-shell Gates; `tools/rmt-language/app-platform-tooling.js` liefert Analyzer, Source Maps und Scaffold-Plan. |
| `fabric/` | Diagnostics, Lane-Mapping, Resource-Lifecycle- und Runtime-Signale fuer Render-Units, Component-Instanzen und Surface-Graphen. |
| `xtend-builder/` | Nutzung der Epic-17 Build-Pipeline fuer generische RMT-App-Artefakte, Fixture-Generierung, Browser-Smokes und Vendor-Rebuild; `rmt-app-platform` erzeugt Diagnostics, Source Maps und Build Reports. |
| `catalog/` | Epic-18 App-Platform-Authoring-, DOM-Descriptor-Renderer-, Component-Template-Primitives-, State-Selector-, Action-Effect-, Event-Routing-, Surface-Resource-Graph-Runtime-, App-Platform-Tooling-, App-Platform-Fixture- und Release-Handoff-Contracts fuer Runtime- und Tooling-Slices. |
| `package.json` | Neue Test-Scripts erst mit implementierten Suites aufnehmen; `test:rmt-app-platform-authoring`, `test:rmt-dom-descriptor-renderer`, `test:rmt-component-template-primitives`, `test:rmt-state-selector-runtime`, `test:rmt-action-effect-runtime`, `test:rmt-event-routing-runtime`, `test:rmt-surface-resource-graph-runtime`, `test:rmt-app-platform-tooling`, `test:rmt-app-platform-fixture` und `test:epic18-rmt-app-platform` sind verfuegbar. |

## Geplante Gate-Kette

Kurzfristig fuer die Bugfix-Welle:

```bash
node scripts/run_xtend_tests.js components surface-controller surface-manager-browser overlay-interaction-ux layout-display-media-ux epic18-vendor-bugfix-smokes browser references --json
```

Fuer den RMT/App-Shell-Slice:

```bash
node scripts/run_xtend_tests.js rmt-app-platform-authoring rmt-dom-descriptor-renderer rmt-component-template-primitives rmt-state-selector-runtime rmt-action-effect-runtime rmt-event-routing-runtime rmt-surface-resource-graph-runtime rmt-app-platform-tooling rmt-app-platform-fixture rmt-vnext-compiler rmt-vnext-events rmt-vnext-surfaces rmt-vnext-security rmt-first-demo-app scaffold-rmt-build --json
```

Fuer das Epic-Handoff:

```bash
node scripts/run_xtend_tests.js epic18-rmt-app-platform --json
npm run test:pr:report
npm run test:release:full:report
npm run pack:dry-run
```

Der Epic-18-Umbrella-Gate ist in `WP-E18-13` angelegt. Er prueft Docs,
Migration, GitHub-Gate-Handoff, Package-Metadaten und Pack-/Export-Lock-
Evidence.

## Definition of Done

- Alle fuenf Vendor-Komponenten-Deltas sind in main uebernommen oder bewusst
  mit technischer Begruendung abgelehnt.
- Die Backports sind durch Component- und Browser-Smokes geschuetzt.
- Die Media-Manager-Lessons-Learned sind als generischer RMT-App-Platform-Scope
  in konkrete Workpackages uebersetzt.
- RMT kann mindestens eine flexible App-Shell-Insel ohne produktseitigen
  HTML-String-Renderer ausfuehren.
- Dynamische Surfaces, Component Bindings, Feedback, Lazy Resources,
  DataSources, Event Routing und Resource Cleanup sind als repo-native,
  domain-neutrale Fixture oder Demo nachweisbar.
- Vendor Build, Package Export Lock und Release-Handoff sind aktualisiert.

## Nicht-Ziele

- Keine ungepruefte Komplettkopie aus `vendor/xtend` nach main.
- Kein 1:1-Nachbau der Media-Manager-Surfaces als XTend-Default-App.
- Keine Uebernahme Media-Manager-spezifischer Theme- oder Shadow-DOM-
  Monkeypatches als globale XTend Defaults.
- Kein Bruch der Boundary `no-rmt-kernel-import-of-xtend-types`.
- Kein produktiver Electron-/Node-Backend-Adapter im XTend Framework; Backend
  bleibt Fixture- oder Host-Adapter-Verantwortung.
