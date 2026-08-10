# XTend SurfaceManager und Multi Window Plan

- Status: Planning abgeschlossen, `WP-SM-01` bis `WP-SM-09` completed
- Datum: 9. Mai 2026
- Contract: `xtend.surface-manager.plan.v1`
- Zielzustand: `rmt-native-app-shell-surface-orchestration`
- Scope: SurfaceManager, WindowManager, SidePanels und erweiterbare Surface-Typen fuer RMT-first XTend Apps
- Kernel Boundary: `no-rmt-kernel-import-of-xtend-types`
- Bezug:
  - `development/ADR-XTend-Fabric.md`
  - `development/XTend-Fabric-RMT-Lane-Mapping.md`
  - `development/XTend-Component-Contract-v2.md`
  - `development/XTend-RMT-First-Class-App-Authoring.md`
  - `development/XTend-Overlay-und-Interaction-UX-Reife-Contract.md`
  - `docs/component-ux-app-authoring.md`
  - `components/xmodal.js`
  - `components/xdialog.js`
  - `components/xdrawer.js`
  - `xtend-loader.js`

## Zweck

XTend soll gezielt fuer App Shells, App-Inhalte und deren Lifecycle-Orchestrierung per RMT reifen. Ein SurfaceManager ist dafuer die fehlende UI-Orchestrierungsschicht oberhalb einzelner Komponenten: Er verwaltet nicht nur modale Overlays, sondern komplette Oberflaechen in einer SPA.

Der SurfaceManager soll mittelfristig diese Aufgaben zusammenfuehren:

- Multi Window Oberflaechen innerhalb eines Browser-Tabs
- SidePanels, Docking, Flyouts und weitere spezialisierte Surface-Typen
- z-Order, Aktivierung, Fokus, Keyboard- und A11y-Regeln
- Mount, Hydration, Update, Close und Dispose von Surface-Inhalten
- RMT-native Beschreibung von App-Shell-Surfaces, Content und Lifecycle
- Fabric-kompatible Diagnostics, Lanes, Fibers, Telemetry und Backpressure
- Lazy Loading der benoetigten Komponenten pro Surface ueber Manifest und XTendLoader-Policy

`WindowManager` meint hier keine nativen OS-Fenster und keine Popup-Fenster. Es geht um mehrere frei positionierbare, minimierbare, maximierbare, fokussierbare und optional andockbare DOM-Surfaces innerhalb einer SPA.

## Leitentscheidung

Der SurfaceManager soll **nicht** als zweite globale Infrastrukturschicht neben Fabric aufgebaut werden. Die empfohlene Form ist eine RMT-native Komponentenfamilie mit einem kleinen, DOM-nahen TypeScript-Controller:

```text
RMT App Document
  -> xtend.component / spaeter xtend.surface Adapter
  -> x-surface-manager + Surface Components
  -> component-owned Surface Controller
  -> XTend-Fabric fuer Fibers, Lanes, Diagnostics und Telemetry
```

Fabric bleibt die Safety-, Diagnostics-, Error-Boundary-, Fiber- und Telemetry-Schicht. Der SurfaceManager ist dagegen eine konkrete UI-Orchestrierung fuer App Shells. Er darf Fabric nutzen, aber er darf Fabric nicht ersetzen und nicht in den RMT Kernel wandern.

Die praktische Empfehlung lautet:

- Kurzfristig: `x-surface-manager` als TypeScript-first XTend-Komponente einfuehren.
- Kurzfristig: `x-surface-window` und `x-side-panel` als erste Surface-Komponenten ergaenzen.
- Mittelfristig: bestehende `x-modal`, `x-dialog`, `x-drawer`, `x-popover` ueber Surface-Profile an den Manager anbinden.
- Mittelfristig: eine optionale Host-/Adapter-Flaeche `xtend.surface` definieren, sobald RMT eine native `surfaces` Domain erhaelt.
- Langfristig: App Shells koennen Workbench-artige Oberflaechen komplett aus RMT Surface Records, Component Records, Templates, Routes und Schedules materialisieren.

## Evaluierung

| Option | Beschreibung | Staerken | Risiken | Bewertung |
|--------|--------------|----------|---------|-----------|
| Separate Schicht neben Fabric | Eigene globale Runtime, z.B. `window.XTendSurfaceManager`, mit direkter Host-API fuer Fenster und Panels | Zentraler Manager, klare WindowManager-API, unabhaengig von Custom Elements | Konkurrenz zu Fabric, potentiell eager geladen, weniger RMT-native, neue globale Lifecycle-Quelle, TreeShaking schwieriger | Nicht als Primaerarchitektur |
| Reines Komponenten-Toolset | Nur Custom Elements ohne geteilten Controller | Passt zu XTendLoader, RMT Component Records und Component Contract v2 | Z-Order, Fokus, Drag/Resize, Persistence und Cross-Surface-Regeln werden zu lokal und fehleranfaellig | Zu schwach fuer Multi Window |
| Komponentenfamilie mit internem Controller | `x-surface-manager` besitzt eine interne Surface Registry, weitere Surface-Komponenten melden sich an, Fabric liefert Diagnostics/Lanes | RMT-native, loaderfreundlich, testbar, kompatibel mit Component Contract v2, keine zweite Fabric | Braucht sauberen Controller Contract und Migration fuer bestehende Overlays | Empfohlen |

Der beste Schnitt ist also kein Entweder-oder, sondern ein kontrollierter Hybrid: SurfaceManager als Komponenten-Toolset, aber mit einem expliziten TypeScript-Controller innerhalb dieses Toolsets. Diese Controller-API bleibt vorerst produktintern und kann spaeter als `xtend.surface` Host Adapter formalisiert werden.

## Architekturziel

Der SurfaceManager sitzt in der App Shell und verwaltet eine oder mehrere Surface-Zonen:

```text
app.shell
  x-header
  x-router
  x-surface-manager
    x-surface-window
    x-side-panel
    x-modal / x-dialog / x-drawer compatibility surfaces
```

Kernaufgaben:

| Bereich | Verantwortung |
|---------|---------------|
| Registry | Surface Records normalisieren, IDs pruefen, aktive Surfaces indexieren |
| Lifecycle | create, mount, hydrate, activate, update, minimize, maximize, restore, close, destroy |
| Windowing | Bounds, z-Order, Fokus, Drag, Resize, Snap, Maximize, Minimize |
| SidePanels | docked, overlay, pinned, collapsed, responsive full-screen |
| Layering | feste Layer-Zonen fuer windows, panels, modals, popovers und diagnostics |
| A11y | Focus Restore, modal Inert, Labels, Escape-Regeln, Screenreader-Signale |
| State | `xstate` Mirror Keys, Surface Snapshot, optional persistierte Layouts |
| Loader | Surface-Inhalte lazy ueber Manifest/Component Adapter laden |
| Fabric | Surface-Operationen als Fibers ausfuehren und Diagnostics publizieren |
| RMT | Surface Intent, Content, Schedules und Commands beschreiben |

## Komponentenfamilie

### `x-surface-manager`

Die Root-Komponente fuer eine App Shell. Sie stellt Registry, Layer Container und Surface Controller bereit.

Public API:

- Attribute: `layout`, `restore-key`, `route-aware`, `modal-policy`
- Properties: `surfaces`, `activeSurfaceId`, `layoutSnapshot`
- Methods: `openSurface(record)`, `closeSurface(id)`, `focusSurface(id)`, `updateSurface(id, patch)`, `snapshot()`, `restore(snapshot)`
- Events: `surface-opened`, `surface-closed`, `surface-focused`, `surface-updated`, `surface-layout-changed`, `surface-diagnostics`
- Slots: `default`, `windows`, `panels`, `overlays`

Contract:

```text
xtend.component.contract.v2
xtend.surface.manager.v1
xtend.rmt.surface-authoring.v1
```

### `x-surface-window`

Die erste echte WindowManager-Surface. Sie wird von `x-surface-manager` verwaltet, kann aber als Custom Element in RMT authorbar bleiben.

Mindestfaehigkeiten:

- mehrere Instanzen parallel
- activate/focus mit z-Order
- move und resize per Pointer
- keyboard-fokussierbare Chrome-Controls
- minimize, maximize, restore, close
- responsive Fallback auf full-screen oder stacked mode
- optional route-bound oder route-independent
- content via Component Ref, Template Ref oder Slot

Mindestattribute:

```text
surface-id
label
open
active
minimized
maximized
resizable
draggable
modal
initial-x
initial-y
initial-width
initial-height
```

### `x-side-panel`

SidePanels sind keine blossen Drawer. Sie koennen persistent, gepinnt, route-aware und docked sein. `x-drawer` bleibt fuer Overlay-/Drawer-Faelle bestehen, aber `x-side-panel` wird die App-Shell-nahe Surface-Variante.

Mindestfaehigkeiten:

- placements: `left`, `right`, `bottom`, `inline`
- modes: `docked`, `overlay`, `pinned`, `collapsed`
- responsive full-screen mode
- resize am Docking-Rand
- route-aware close/collapse
- optional content hydration bei erstem Oeffnen

### Kompatibilitaet mit bestehenden Overlays

Bestehende Komponenten werden nicht ersetzt:

- `x-modal`
- `x-dialog`
- `x-drawer`
- `x-popover`
- `x-tooltip`

Sie erhalten mittelfristig Surface-Profile und koennen sich beim SurfaceManager registrieren. Dadurch entsteht ein einziger Stack fuer Escape, Fokus, Inert, Scroll Lock und Diagnostics. Der bestehende Overlay Interaction UX Contract bleibt die Grundlage, wird aber um Surface-Typen und WindowManager-Semantik erweitert.

## TypeScript-Unterbau

Die Source-of-Truth sollte TypeScript-first unter `src/components/` liegen:

```text
src/components/x-surface-manager/
  x-surface-manager.ts
  x-surface-manager.contract.ts
  x-surface-manager.rmt.ts
  x-surface-manager.a11y.ts
  x-surface-manager.performance.ts
  x-surface-manager.fixture.ts
  surface-controller.ts
  surface-record.ts
  surface-layout.ts

src/components/x-surface-window/
  x-surface-window.ts
  x-surface-window.contract.ts
  x-surface-window.rmt.ts
  x-surface-window.a11y.ts
  x-surface-window.performance.ts

src/components/x-side-panel/
  x-side-panel.ts
  x-side-panel.contract.ts
  x-side-panel.rmt.ts
  x-side-panel.a11y.ts
  x-side-panel.performance.ts
```

Runtime-Artefakte folgen der vorhandenen XTend-Konvention:

```text
components/xsurfacemanager.js
components/xsurfacemanager.d.ts
components/xsurfacewindow.js
components/xsurfacewindow.d.ts
components/xsidepanel.js
components/xsidepanel.d.ts
```

Der interne Controller bleibt zuerst component-owned:

```ts
interface XtendSurfaceController {
  registerSurface(record: XtendSurfaceRecord): XtendSurfaceRegistration;
  openSurface(id: string, input?: XtendSurfaceOpenInput): XtendSurfaceResult;
  closeSurface(id: string, reason?: string): XtendSurfaceResult;
  focusSurface(id: string): XtendSurfaceResult;
  updateSurface(id: string, patch: XtendSurfacePatch): XtendSurfaceResult;
  moveSurface(id: string, bounds: XtendSurfaceBounds): XtendSurfaceResult;
  resizeSurface(id: string, bounds: XtendSurfaceBounds): XtendSurfaceResult;
  snapshot(): XtendSurfaceSnapshot;
}
```

Diese API kann spaeter als oeffentliche `xtend.surface` Adapter-Flaeche stabilisiert werden, sollte aber im MVP nicht als separate globale Runtime beworben werden.

## RMT-Modell

### MVP ueber Component Records

Kurzfristig koennen Surfaces als normale `components` Records mit Surface-Metadata authored werden:

```json
{
  "id": "workbench.manager",
  "kind": "custom_element",
  "adapter": "xtend.component",
  "tag": "x-surface-manager",
  "schedule": "surface.visible.render",
  "slots": {
    "windows": {
      "component": "workbench.inspector"
    },
    "panels": {
      "component": "workbench.properties"
    }
  },
  "metadata": {
    "surfaceManager": {
      "schema": "xtend.surface.manager.v1",
      "stateKey": "xtend.surface.registry",
      "defaultLayer": "workspace"
    },
    "fabric": {
      "lane": "visible",
      "fiber": "surface.render",
      "telemetry": true
    }
  }
}
```

```json
{
  "id": "workbench.inspector",
  "kind": "custom_element",
  "adapter": "xtend.component",
  "tag": "x-surface-window",
  "schedule": "surface.user-blocking.open",
  "props": {
    "label": "Inspector"
  },
  "attributes": {
    "surface-id": "inspector",
    "resizable": "true",
    "draggable": "true"
  },
  "slots": {
    "default": {
      "component": "inspector.content"
    }
  },
  "metadata": {
    "surface": {
      "schema": "xtend.surface.record.v1",
      "type": "window",
      "manager": "workbench.manager",
      "initialBounds": {
        "x": 96,
        "y": 88,
        "width": 520,
        "height": 360
      },
      "capabilities": [
        "move",
        "resize",
        "minimize",
        "maximize",
        "close"
      ],
      "persistence": {
        "mode": "session",
        "key": "workbench.inspector.layout"
      }
    },
    "fabric": {
      "lane": "user-blocking",
      "fiber": "surface.open",
      "telemetry": true
    }
  }
}
```

Diese Form passt sofort zu `xtend.component`, zum XTendLoader und zum Component Contract v2. Sie vermeidet einen RMT-Schema-Big-Bang.

### Zielbild mit nativer `surfaces` Domain

Langfristig sollte RMT eine Top-Level-Domain `surfaces` bekommen:

```json
{
  "surfaces": [
    {
      "id": "workbench.inspector",
      "type": "window",
      "manager": "workbench.manager",
      "component": "inspector.content",
      "template": "inspector.template",
      "schedule": "surface.user-blocking.open",
      "state": {
        "key": "xtend.surface.workbench.inspector",
        "persistence": "session"
      },
      "geometry": {
        "initial": {
          "x": 96,
          "y": 88,
          "width": 520,
          "height": 360
        },
        "minWidth": 320,
        "minHeight": 220,
        "constraints": "viewport"
      },
      "a11y": {
        "role": "dialog",
        "label": "Inspector",
        "modal": false,
        "focusRestore": true
      },
      "fabric": {
        "lane": "user-blocking",
        "fiber": "surface.open",
        "telemetry": true
      }
    }
  ]
}
```

Die Domain bleibt Datenmodell. DOM-Arbeit, Loader-Zugriff, Custom-Element-Definitionen, State Writes und Fabric-Ausfuehrung bleiben Host-/Adapteraufgabe.

## Adapter- und Schedule-Modell

Kurzfristig reicht `xtend.component`. Mittelfristig sollte ein `xtend.surface` Adapter beschrieben werden:

| Adapter | Kind | Aufgabe |
|---------|------|---------|
| `xtend.component` | `component_adapter` | Custom Elements laden, mounten, hydrieren |
| `xtend.surface` | `surface_adapter` | Surface Records normalisieren, Manager adressieren, Open/Close/Focus/Geometry ausfuehren |
| `rmt.state-scheduler-diagnostics` | `scheduler_adapter` | Scheduler Endpoints, State Bridge, Diagnostics spiegeln |

Mindest-Schedules:

| Schedule | Endpoint | Lane | Zweck |
|----------|----------|------|-------|
| `surface.user-blocking.open` | `xtendrmt.surface.open` | `user-blocking` | Surface oeffnen und Fokus setzen |
| `surface.user-blocking.close` | `xtendrmt.surface.close` | `user-blocking` | Surface schliessen, Fokus restaurieren |
| `surface.visible.render` | `xtendrmt.surface.render` | `visible` | Manager und sichtbare Surface-Shell rendern |
| `surface.transition.layout` | `xtendrmt.surface.layout` | `transition` | Move, Resize, Docking und Snap committen |
| `surface.background.persist` | `xtendrmt.surface.persist` | `background` | Layout Snapshot persistieren |
| `surface.diagnostics.snapshot` | `xtendrmt.surface.diagnostics` | `diagnostics` | Registry, Stack und Telemetry snapshotten |
| `a11y.user-blocking.announce` | `xtendrmt.a11y.announce` | `user-blocking` | Surface Fokus- und Statuswechsel ansagen |

Fabric-Lanes bleiben die kanonische UI-Semantik. RMT sieht nur Schedule Records und Endpoints.

## State und Lifecycle

Surface State wird als Digital Twin gefuehrt. Der Manager besitzt den Live-State, spiegelt aber stabile Keys nach `xstate`:

```text
xtend.surface.registry
xtend.surface.active
xtend.surface.<surfaceId>.state
xtend.surface.<surfaceId>.bounds
xtend.surface.<surfaceId>.lifecycle
xtend.surface.snapshot
```

Lifecycle-Phasen:

```text
declare -> create -> mount -> hydrate -> open -> activate -> update -> deactivate -> close -> unmount -> dispose
```

Window-spezifische Phasen:

```text
move.start -> move.commit
resize.start -> resize.commit
minimize -> restore
maximize -> restore
dock -> undock
```

RMT plant diese Phasen ueber Schedules. Der Manager fuehrt sie im DOM aus. Fabric instrumentiert sie als Fibers.

## Loader und TreeShaking

Der vorhandene XTendLoader laedt Komponenten aus dem Manifest nur, wenn sie im DOM vorkommen oder als Preload deklariert sind. Dynamische Surface-Inhalte koennen aber erst beim Oeffnen entstehen. Deshalb braucht der SurfaceManager einen manifestbasierten Ensure-Pfad:

```text
surface.open
  -> resolve component/template refs
  -> ensure required custom elements via manifest
  -> mount/hydrate content
  -> activate surface
```

Empfehlung:

- `x-surface-manager` wird nur geladen, wenn die App Shell es nutzt.
- `x-surface-window` und `x-side-panel` werden nur geladen, wenn Surface Records sie referenzieren.
- Surface-Content-Komponenten werden erst beim ersten Oeffnen oder bei explizitem Prewarm geladen.
- Der Ensure-Pfad muss dieselbe Loader- und Manifest-Policy nutzen wie `xtend-loader.js`.
- RMT kann `requiredComponents` oder `surface.prewarm` Metadata liefern, aber der Kernel importiert keine Module.

## A11y-Regeln

Multi Window in einer SPA ist nur PROD-reif, wenn Tastatur- und Screenreader-Regeln von Anfang an Teil des Contracts sind.

Pflichten:

- Jede Surface hat einen stabilen Accessible Name.
- Modale Surfaces setzen `aria-modal` und aktivieren Inert/Focus Trap.
- Nicht-modale Windows duerfen den Rest der App nicht inert setzen.
- Escape schliesst nur das oberste closable modale Surface; nicht-modale Windows brauchen explizite Close Controls.
- Move/Resize muss eine tastaturbedienbare Alternative erhalten.
- Focus Restore ist fuer Close, Minimize und Route-Wechsel Pflicht.
- Screenreader-Signale laufen ueber `a11y.user-blocking.announce`.
- Reduced Motion deaktiviert Drag-/Open-/Close-Animationen, aber nicht Statuswechsel.
- Forced Colors und High Contrast muessen Chrome, Resize Handles und Fokus sichtbar halten.

## Responsive Verhalten

Desktop und Mobile duerfen nicht dieselbe Window-Mechanik erzwingen.

| Surface | Desktop | Mobile |
|---------|---------|--------|
| Window | frei positionierbar, resize, snap, maximize | full-screen, stacked oder route-bound |
| SidePanel | docked, pinned, resizable | bottom sheet oder full-screen panel |
| Modal/Dialog | zentriert, focus trapped | full-width oder full-screen nach Groesse |
| Popover | anchored | sheet oder inline fallback bei wenig Platz |

Das responsive Verhalten gehoert in den Surface Record und in Component Defaults, nicht in App-spezifische Sonderlogik.

## Security und Trust Boundary

Der SurfaceManager darf keine neue unsichere HTML-Schicht einfuehren.

Pflichten:

- keine Inline-JS-Handler in Surface Records
- Events nur als `dom-event-to-rmt-command`
- Templates bevorzugt als `dom_descriptor`
- `html_fragment` nur ueber bestehende Trusted-DOM-Boundary
- keine externen Imports oder CDN-Pfade
- keine Serialisierung von DOM Nodes in Diagnostics
- keine Form-, Token-, Query- oder Header-Daten in Surface Metadata
- Persistierte Layouts enthalten nur Bounds, IDs, Typen und UI-Status

## Migration bestehender Overlays

Die bestehende Overlay-Landschaft sollte schrittweise in den SurfaceManager wachsen:

1. SurfaceManager fuehrt einen zentralen Stack ein, ohne bestehende APIs zu brechen.
2. `x-modal`, `x-dialog` und modale `x-drawer` melden sich optional als `type: "modal"` oder `type: "dialog"` an.
3. `x-popover` und `x-tooltip` bleiben anchor-lokal, koennen aber Diagnostics und Topmost-Regeln melden.
4. `x-drawer` bleibt Overlay Drawer; `x-side-panel` wird die dauerhafte App-Shell-Surface.
5. Alte State Keys wie `modal-open-<id>` und `dialog-open-<id>` werden als Compatibility Keys weiter gespiegelt.

## MVP-Schnitt

Ein sinnvoller erster Produktionsschnitt:

- `x-surface-manager` mit Registry, Layern, Stack, xstate Snapshot und Fabric Diagnostics
- `x-surface-window` mit Open, Focus, Close, z-Order, Move, Resize, Minimize, Maximize und Restore
- `x-side-panel` mit Docked, Overlay, Pinned, Collapse und Responsive Full-Screen
- RMT Component-Record Authoring mit `metadata.surface`
- Lazy Ensure fuer Surface-Content-Komponenten aus dem Manifest
- Browser-Smoke mit zwei parallelen Windows und einem SidePanel
- A11y-Smoke fuer Fokus, Escape, Close, Keyboard Move/Resize und Reduced Motion
- Performance-Smoke fuer Open/Close und Drag/Resize ohne Layout-Thrashing
- Docs und Component Lab Fixture

Nicht im MVP:

- native Browser-Popup-Fenster
- Cross-tab Windowing
- Remote Components
- externe Persistence Provider
- vollstaendige RMT `surfaces` Top-Level-Domain
- Ersetzung von `x-modal`, `x-dialog`, `x-drawer` und `x-popover`

## Workpackages

| ID | Prioritaet | Status | Titel | Ergebnis |
|----|------------|--------|-------|----------|
| `WP-SM-01` | P0 | completed | SurfaceManager Contract und RMT Authoring Model definieren | `xtend.surface.manager.v1`, `xtend.surface.record.v1`, MVP-RMT-Beispiele |
| `WP-SM-02` | P0 | completed | Surface Controller und State Snapshot bauen | TypeScript Controller, Registry, xstate Mirror, Diagnostics |
| `WP-SM-03` | P0 | completed | `x-surface-manager` und `x-surface-window` implementieren | erste Multi Window SPA-Oberflaeche |
| `WP-SM-04` | P1 | completed | `x-side-panel` und responsive Surface Modes umsetzen | Docked/Pinned/Overlay/Collapsed Panels |
| `WP-SM-05` | P1 | completed | RMT-first Workbench Fixture bauen | App Shell mit zwei Windows, SidePanel, route-bound Content |
| `WP-SM-06` | P1 | completed | Overlay-Kompatibilitaet und Stack-Bridge vorbereiten | `x-modal`, `x-dialog`, `x-drawer` optional an Surface Stack |
| `WP-SM-07` | P1 | completed | Browser-, A11y-, Performance- und Visual-Gates ergaenzen | SurfaceManager Smoke-Suites |
| `WP-SM-08` | P2 | completed | Native RMT `surfaces` Domain und `xtend.surface` Adapter entwerfen | `xtend.rmt.surfaces-domain.v1`, `xtend.surface.adapter.v1`, Tooling-Handoff |
| `WP-SM-09` | P2 | completed | Docs, Component Lab und Migration Guide finalisieren | Authoring Guide und Release-Handoff |

## Gate-Vorschlag

Neue lokale Gates sollten klein starten und dann in die bestehenden Gate-Familien integriert werden:

```bash
node scripts/run_xtend_tests.js surface-manager --json
node scripts/run_xtend_tests.js surface-side-panel --json
node scripts/run_xtend_tests.js surface-workbench-fixture --json
node scripts/run_xtend_tests.js surface-overlay-bridge --json
node scripts/run_xtend_tests.js surface-manager-quality --json
node scripts/run_xtend_tests.js surface-manager-browser --json
node scripts/run_xtend_tests.js surface-manager-a11y --json
node scripts/run_xtend_tests.js surface-manager-performance --json
node scripts/run_xtend_tests.js surface-manager-visual --json
node scripts/run_xtend_tests.js surface-native-rmt --json
node scripts/run_xtend_tests.js surface-release-handoff --json
node scripts/run_xtend_tests.js rmt-surface-authoring --json
node scripts/run_xtend_tests.js component-shell-theme-matrix --json
node scripts/run_xtend_tests.js browser --json
```

Die PR-Default-Gates duerfen erst erweitert werden, wenn die Surface-Suites deterministisch und schnell genug sind.

## Risiken

| Risiko | Gegenmassnahme |
|--------|----------------|
| Zweite globale Runtime neben Fabric | SurfaceManager als Komponentenfamilie fuehren; Fabric nur als Unterbau nutzen |
| Z-Index- und Fokus-Konflikte mit bestehenden Overlays | zentraler Surface Stack, Legacy-Compatibility Keys und schrittweise Migration |
| Dynamische Inhalte werden nicht vom Loader geladen | manifestbasierter `ensureComponent` Pfad im Component/Surface Adapter |
| Drag/Resize erzeugt Layout-Thrashing | Pointer-Events throttlen, Layout Commits ueber `surface.transition.layout`, Performance Gate |
| Mobile Windows werden unbedienbar | responsive Surface Modes verpflichtend machen |
| RMT wird zu XTend-spezifisch | `surfaces` bleiben Datenrecords; Ausfuehrung bleibt Adapterarbeit |
| Persistenz speichert sensible Nutzdaten | nur Layout- und UI-State persistieren, keine Content Payloads |

## Handoff nach WP-SM-01

`WP-SM-01` ist abgeschlossen und akzeptiert den Contract `xtend.rmt.surface-authoring.v1`.

Erledigt:

- `development/XTend-SurfaceManager-Contract-und-RMT-Authoring-Model.md` definiert `xtend.surface.manager.v1`, `xtend.surface.record.v1` und das RMT-MVP ueber Component Records
- `tests/fixtures/rmt-surface-manager-workbench.rmt` beschreibt eine Shell-first Workbench mit zwei Windows und einem SidePanel
- `catalog/surface-manager-rmt-authoring.js` und `tests/rmt/rmt_surface_manager_authoring_suite.js` liefern Factory, Validator und lokalen Gate
- `development/docs-evidence/root/surface-manager-rmt-authoring.md`, `package.json`, `xtend-builder/scaffold.config.js` und der Runner spiegeln den neuen Contract

Naechstes Paket:

`WP-SM-02` sollte direkt den Surface Controller und State Snapshot bauen. Danach sollte `WP-SM-03` folgen, weil ein WindowManager ohne echten Controller schnell in komponentenlokale Sonderfaelle zerfaellt. Der erste sichtbare End-to-End-Nachweis sollte eine RMT-first App Shell sein, die `x-surface-manager` laedt, zwei `x-surface-window` Instanzen oeffnet, ein `x-side-panel` dockt und alle Operationen in Fabric/xstate diagnostisch sichtbar macht.

## Handoff nach WP-SM-02

`WP-SM-02` ist abgeschlossen und akzeptiert den Contract `xtend.surface.controller.v2`.

Erledigt:

- `components/xsurfacemanager-controller.js` stellt den DOM-freien Controller mit `registerSurface`, `openSurface`, `closeSurface`, `focusSurface`, `moveSurface`, `resizeSurface`, `minimizeSurface`, `maximizeSurface`, `restoreSurface`, `snapshot` und `dispose` bereit.
- `src/components/x-surface-manager/surface-record.ts`, `surface-layout.ts` und `surface-controller.ts` definieren den TypeScript-Unterbau fuer Records, Bounds, Controller, Snapshots und Operation Results.
- Der Controller normalisiert `metadata.surface` Records aus `WP-SM-01`, fuehrt Registry, aktive Surface, z-Order und Lifecycle-Status und spiegelt nach `xtend.surface.*` xstate Keys.
- Fabric bleibt optionaler Unterbau: Diagnostics werden ueber `emitDiagnostic` publiziert, aber der Controller hat keine harte Fabric-Abhaengigkeit.
- `catalog/surface-manager-controller.js`, `tests/components/surface_controller_suite.js`, `docs/en/surface-manager-controller.md`, Package- und Scaffold-Metadaten liefern den lokalen Gate `node scripts/run_xtend_tests.js surface-controller --json`.

Naechstes Paket:

`WP-SM-03` sollte nun `x-surface-manager` und `x-surface-window` als sichtbare Custom Elements auf diesem Controller bauen. Wichtig ist, dass die Komponenten keine zweite Registry erzeugen, sondern Controller-Events, Snapshot und xstate Mirror als gemeinsame Wahrheit verwenden.

## Handoff nach WP-SM-03

`WP-SM-03` ist abgeschlossen und akzeptiert den Contract `xtend.surface.window-runtime.v1`.

Erledigt:

- `components/xsurfacemanager.js` implementiert `x-surface-manager` als sichtbare Surface-Wurzel mit Slots `windows`, `panels`, `overlays` und `default`.
- `components/xsurfacewindow.js` implementiert `x-surface-window` als erste WindowManager-Surface mit Chrome, Open/Close, Focus, Move, Resize, Minimize, Maximize und Restore.
- Beide Komponenten sind in `components/manifest.json` eingetragen und bleiben ueber `xtend.component` authorbar.
- Der Manager nutzt den Controller aus `WP-SM-02`, uebersetzt `surface-window-command` Events in Controller-Operationen und spiegelt Snapshots in Window-Attribute und CSS-Variablen.
- `catalog/surface-manager-window-runtime.js`, `tests/components/surface_manager_runtime_suite.js`, Component Fixtures, Component Docs, Package- und Scaffold-Metadaten liefern den lokalen Gate `node scripts/run_xtend_tests.js surface-manager --json`.

Naechstes Paket:

`WP-SM-04` sollte `x-side-panel` und responsive Surface Modes implementieren. Das SidePanel soll denselben Controller nutzen, aber eigene Docking-, Placement-, Pinning-, Collapse- und Mobile-Fallback-Regeln erhalten.

## Handoff nach WP-SM-04

`WP-SM-04` ist abgeschlossen und akzeptiert den Contract `xtend.surface.side-panel-runtime.v1`.

Erledigt:

- `components/xsidepanel.js` implementiert `x-side-panel` als App-Shell-SidePanel mit `docked`, `overlay`, `pinned`, `collapsed` und responsive Fullscreen-Verhalten.
- `components/xsidepanel.d.ts` und `src/components/x-side-panel/x-side-panel.ts` beschreiben Public API, Modes, Placements und `surface-panel-command`.
- `components/xsurfacemanager.js` registriert nun `x-side-panel` aus dem `panels`-Slot, verarbeitet `surface-panel-command` und bietet `pinSurface`, `collapseSurface`, `expandSurface` und `dockSurface`.
- `components/manifest.json`, Component Docs, Fixture und Component Suite kennen `x-side-panel`.
- `catalog/surface-manager-side-panel-runtime.js`, `tests/components/surface_manager_side_panel_suite.js`, Package- und Scaffold-Metadaten liefern den lokalen Gate `node scripts/run_xtend_tests.js surface-side-panel --json`.

Naechstes Paket:

`WP-SM-05` sollte ein RMT-first Workbench Fixture bauen: App Shell mit zwei Windows, einem SidePanel, route-bound Content und gemeinsamem Surface Snapshot.

## Handoff nach WP-SM-05

`WP-SM-05` ist abgeschlossen und akzeptiert den Contract `xtend.surface.workbench-fixture.v1`.

Erledigt:

- `xtendrmt/surface-workbench.rmt` beschreibt eine shell-first Workbench mit `app.router`, `workbench.manager`, zwei `x-surface-window` Records und einem `x-side-panel`.
- `tests/browser/fixtures/rmt-surface-workbench-smoke.html` stellt den generischen RMT-Host als Browser-Smoke bereit und enthaelt keine manuelle Surface-Shell.
- `xtendrmt/surface-workbench.js` rendert `dom_descriptor` Templates, Component Records, Slots und Routen ohne `innerHTML` und stellt `collectSurfaceSnapshot(root)` bereit.
- `tests/browser/fixtures/rmt-surface-workbench-smoke.html` bereitet den browsernahen Smoke fuer `WP-SM-07` vor.
- `catalog/surface-manager-workbench-fixture.js`, `tests/rmt/surface_manager_workbench_fixture_suite.js`, Package- und Scaffold-Metadaten liefern den lokalen Gate `node scripts/run_xtend_tests.js surface-workbench-fixture --json`.

Naechstes Paket:

`WP-SM-06` sollte die Overlay-Kompatibilitaet und Stack-Bridge vorbereiten. Ziel ist, `x-modal`, `x-dialog` und `x-drawer` schrittweise als kompatible Surface-Profile an denselben Stack aus Windows und SidePanels anzubinden, ohne deren bestehende APIs zu brechen.

## Handoff nach WP-SM-06

`WP-SM-06` ist abgeschlossen und akzeptiert den Contract `xtend.surface.overlay-stack-bridge.v1`.

Erledigt:

- `components/xsurfaceoverlay-bridge.js` und `components/xsurfaceoverlay-bridge.d.ts` adaptieren `x-modal`, `x-dialog` und `x-drawer` zu `xtend.surface.record.v1` Records.
- `components/xsurfacemanager.js` erkennt kompatible Overlays im `overlays` Slot, verarbeitet `surface-overlay-command` und spiegelt Legacy Overlay Events in den gemeinsamen Controller Stack.
- `components/xmodal.js`, `components/xdialog.js` und `components/xdrawer.js` deklarieren `xtendSurfaceOverlayCompatibilityProfile` und behalten ihre bestehenden APIs, Events und Legacy State Keys.
- `tests/components/fixtures/xsurfaceoverlaybridge.component.html` bildet die optionale Stack-Anbindung fuer Modal, Dialog und Drawer ab.
- `catalog/surface-manager-overlay-bridge.js`, `tests/components/surface_manager_overlay_bridge_suite.js`, Package- und Scaffold-Metadaten liefern den lokalen Gate `node scripts/run_xtend_tests.js surface-overlay-bridge --json`.

Naechstes Paket:

`WP-SM-07` sollte die browsernahen Gates aktivieren: gemischte Stack-Smokes mit Windows, SidePanel und Overlays, A11y-Fokusregeln, Escape-Topmost-Verhalten, Performance-Gates fuer Open/Close und Visual-Snapshots fuer z-Order und responsive Surface-Modi.

## Handoff nach WP-SM-07

`WP-SM-07` ist abgeschlossen und akzeptiert den Contract `xtend.surface.quality-gates.v1`.

Erledigt:

- `tests/browser/fixtures/surface-manager-quality-smoke.html` prueft einen gemischten Surface Stack aus zwei Windows, SidePanel, Modal, Dialog und Drawer.
- `tests/browser/browser_smoke_suite.js` aktiviert das SurfaceManager Quality Fixture im bestehenden Browser-Harness.
- `tests/browser/visual-baselines/surface-manager-quality.dom-baseline.json` definiert DOM-Baselines fuer Desktop Mixed Stack, Mobile Responsive Panel, Topmost Overlay und Forced Colors/A11y.
- `catalog/surface-manager-quality-gates.js` beschreibt die Gate-Domaenen Browser, A11y, Performance und Visual samt Budgets, Assertions und Handoff.
- `tests/components/surface_manager_quality_gates_suite.js`, Package- und Scaffold-Metadaten registrieren `surface-manager-quality`, `surface-manager-browser`, `surface-manager-a11y`, `surface-manager-performance` und `surface-manager-visual`.

Naechstes Paket:

`WP-SM-08` sollte die native RMT `surfaces` Domain und den `xtend.surface` Adapter entwerfen. Die Quality-Gates aus `WP-SM-07` sind dabei die Regression-Basis: dieselbe sichtbare Surface-Oberflaeche muss aus Component Records und spaeter aus nativen Surface Records reproduzierbar bleiben.

## Handoff nach WP-SM-08

`WP-SM-08` ist abgeschlossen und akzeptiert den Contract `xtend.rmt.surfaces-domain.v1` sowie den Adapter-Handoff `xtend.surface.adapter.v1`.

Erledigt:

- `xtendrmt/rmt.schema.json` enthaelt die optionale Top-Level-Domain `surfaces`, `#/$defs/surface`, `#/$defs/surfaceType`, `#/$defs/surfaceBounds`, `surface_adapter` und `x-xtendrmt.surfaceAdapterContracts`.
- `xtendrmt/rmt-core.d.ts` beschreibt `RmtSurfaceDomainRecord`, `RmtSurfaceType`, `RmtSurfaceBounds`, `RmtSurfaceA11y` und `surfaces?: RmtSurfaceDomainRecord[]`.
- `xtendrmt/rmt-core.esm.js`, `xtendrmt/rmt-runtime.esm.js` und `xtendrmt/rmt-runtime.browser.js` erhalten und serialisieren native `surfaces[*]` Records.
- `tools/rmt-language/semantic-graph.js`, `tools/rmt-language/completions.js` und `tools/rmt-language/diagnostics.js` kennen `surfaces` als native RMT-Domain.
- `tests/fixtures/rmt-surface-native-domain.rmt` fuehrt Dual Records: native `surfaces[*]` plus kompatible `components[*].metadata.surface`.
- `catalog/surface-manager-native-rmt-surfaces.js`, `tests/rmt/surface_manager_native_rmt_surfaces_suite.js`, Docs, Package- und Scaffold-Metadaten liefern den lokalen Gate `node scripts/run_xtend_tests.js surface-native-rmt --json`.

Naechstes Paket:

`WP-SM-09` sollte Docs, Component Lab und Migration Guide finalisieren. Wichtig ist ein klarer Authoring-Pfad: bestehende Component Records bleiben gueltig, native `surfaces[*]` werden aber der bevorzugte Zielzustand fuer komplexe App-Shells.

## Handoff nach WP-SM-09

`WP-SM-09` ist abgeschlossen und akzeptiert den Contract `xtend.surface.release-handoff.v1`.

Erledigt:

- `development/XTend-SurfaceManager-Release-Handoff-Contract.md` definiert Release Boundary, Authoring-Modi, Component-Lab-Panels und den Abschluss-Gate.
- `docs/en/surface-manager-authoring-guide.md`, `docs/surface-manager-component-lab.md`, `docs/en/surface-manager-migration-guide.md` und `development/docs-evidence/root/surface-manager-release-handoff.md` finalisieren die oeffentliche SurfaceManager-Doku.
- `tests/fixtures/rmt-surface-manager-component-lab.rmt` zeigt eine SurfaceManager Component-Lab-Shell mit nativen `surfaces[*]` und kompatiblen `components[*].metadata.surface` Records.
- `catalog/surface-manager-release-handoff.js`, `tests/rmt/surface_manager_release_handoff_suite.js`, Package- und Scaffold-Metadaten liefern den lokalen Gate `node scripts/run_xtend_tests.js surface-release-handoff --json`.

Naechster sinnvoller Schnitt:

Die Folgearbeit sollte entweder die produktive `xtend.surface` Adapter Runtime implementieren oder den SurfaceManager in realen App-Shell-Projekten gegen Release-Hardening-Gates stabilisieren. Bis dahin gilt die Boundary `no-public-runtime-claim-for-xtend.surface-adapter-yet`.
