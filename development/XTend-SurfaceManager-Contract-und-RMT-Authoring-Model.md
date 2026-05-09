# XTend SurfaceManager Contract und RMT Authoring Model

- Status: Accepted
- Datum: 9. Mai 2026
- Contract: `xtend.rmt.surface-authoring.v1`
- Report Contract: `xtend.rmt.surface-authoring-report.v1`
- SurfaceManager Contract: `xtend.surface.manager.v1`
- Surface Record Contract: `xtend.surface.record.v1`
- Workpackage: `WP-SM-01`
- Fixture: `tests/fixtures/rmt-surface-manager-workbench.rmt`
- Gate: `node scripts/run_xtend_tests.js rmt-surface-authoring --json`
- Kernel Boundary: `no-rmt-kernel-import-of-xtend-types`

## Zweck

`WP-SM-01` friert den ersten produktfaehigen Authoring-Schnitt fuer einen XTend SurfaceManager ein. Der SurfaceManager ist die App-Shell-nahe UI-Orchestrierung fuer Multi Window Oberflaechen, SidePanels und spaetere spezialisierte Surface-Typen in einer SPA.

Dieser Contract fuehrt noch keine Runtime-Komponenten ein. Er definiert die Records, Schedules, Metadata, Adaptergrenzen und Gates, damit `WP-SM-02` und `WP-SM-03` den Controller und die ersten Komponenten ohne Architekturdrift umsetzen koennen.

## Entscheidung

Der SurfaceManager wird als RMT-native Komponentenfamilie aufgebaut:

```text
x-surface-manager
x-surface-window
x-side-panel
```

Der MVP nutzt vorhandene RMT `components` Records mit `metadata.surfaceManager` und `metadata.surface`. Eine native Top-Level-Domain `surfaces` und ein Adapter `xtend.surface` sind reserviert, werden aber in `WP-SM-01` nicht in das RMT Schema aufgenommen.

Die Grenze bleibt:

```text
RMT beschreibt Surface Intent, Component Refs, Templates, Events, Commands und Schedules.
XTend Host Adapter und spaetere Surface Adapter materialisieren DOM und Lifecycle.
Fabric instrumentiert Lanes, Fibers, Diagnostics und Telemetry.
```

## Contract IDs

| Contract | Zweck |
|----------|-------|
| `xtend.rmt.surface-authoring.v1` | RMT Authoring Contract fuer SurfaceManager Records |
| `xtend.surface.manager.v1` | Manager-Metadata fuer Registry, Stack, Layer und State Snapshot |
| `xtend.surface.record.v1` | Surface-Metadata fuer Window, SidePanel und spaetere Surface-Typen |
| `xtend.rmt.surface-authoring-report.v1` | Gate-Report fuer den lokalen Contract-Nachweis |

## MVP Authoring

Der MVP bleibt bewusst schema-kompatibel mit den vorhandenen Top-Level-Domains:

```json
{
  "components": [
    {
      "id": "workbench.manager",
      "kind": "custom_element",
      "adapter": "xtend.component",
      "tag": "x-surface-manager",
      "schedule": "surface.visible.render",
      "metadata": {
        "surfaceManager": {
          "schema": "xtend.surface.manager.v1",
          "stateKey": "xtend.surface.registry",
          "defaultLayer": "workspace"
        }
      }
    }
  ]
}
```

```json
{
  "id": "workbench.inspector",
  "kind": "custom_element",
  "adapter": "xtend.component",
  "tag": "x-surface-window",
  "schedule": "surface.user-blocking.open",
  "metadata": {
    "surface": {
      "schema": "xtend.surface.record.v1",
      "type": "window",
      "manager": "workbench.manager",
      "stateKey": "xtend.surface.inspector.state"
    }
  }
}
```

Diese Form ist `component-records-with-metadata.surface`. Sie ist sofort kompatibel mit `xtend.component`, `dom_descriptor` Templates, bestehenden Runtime Registries und der XTendLoader-Manifest-Policy.

## SurfaceManager Record

`metadata.surfaceManager` muss mindestens enthalten:

| Feld | Pflicht | Zweck |
|------|---------|-------|
| `schema` | ja | `xtend.surface.manager.v1` |
| `stateKey` | ja | Digital-Twin-Key fuer Registry Snapshot |
| `defaultLayer` | ja | Standard-Layer, z.B. `workspace` |
| `stackPolicy` | empfohlen | Aktivierungs- und Topmost-Regel |
| `persistence` | optional | Layout Snapshot ohne Content Payloads |

Der zugehoerige Component Record nutzt `tag: "x-surface-manager"` und `adapter: "xtend.component"`.

## Surface Record

`metadata.surface` muss mindestens enthalten:

| Feld | Pflicht | Zweck |
|------|---------|-------|
| `schema` | ja | `xtend.surface.record.v1` |
| `type` | ja | `window`, `side-panel` oder spaeterer Surface-Typ |
| `manager` | ja | Component-ID des Managers |
| `stateKey` | ja | Digital-Twin-Key fuer diese Surface |
| `capabilities` | ja | Erlaubte Operationen |
| `initialBounds` | fuer Windows | Startposition und Groesse |
| `placement` / `mode` | fuer SidePanels | Docking- und Layout-Modus |

Erlaubte Surface-Typen im Zielmodell:

```text
window
side-panel
modal
dialog
drawer
popover
tooltip
```

Der MVP deckt `window` und `side-panel` ab. `modal`, `dialog`, `drawer`, `popover` und `tooltip` sind Compatibility-Typen fuer bestehende Overlay-Komponenten.

## Komponenten

Die ersten Komponenten sind reserviert:

| Tag | Rolle |
|-----|-------|
| `x-surface-manager` | Registry, Layer Container, Stack, State Snapshot |
| `x-surface-window` | Multi Window Surface mit Move, Resize, Minimize, Maximize, Close |
| `x-side-panel` | Docked, Pinned, Collapsed, Overlay und responsive Panel Surface |

Bestehende Komponenten bleiben kompatibel und werden spaeter angebunden:

```text
x-modal
x-dialog
x-drawer
x-popover
x-tooltip
```

## Schedules

`WP-SM-01` definiert diese Schedule IDs:

| Schedule | Endpoint | Lane | Zweck |
|----------|----------|------|-------|
| `surface.visible.render` | `xtendrmt.surface.render` | `visible` | Manager und sichtbare Surface Shell rendern |
| `surface.user-blocking.open` | `xtendrmt.surface.open` | `user-blocking` | Surface oeffnen und Fokus setzen |
| `surface.user-blocking.close` | `xtendrmt.surface.close` | `user-blocking` | Surface schliessen und Fokus restaurieren |
| `surface.transition.layout` | `xtendrmt.surface.layout` | `transition` | Move, Resize, Docking und Snap committen |
| `surface.background.persist` | `xtendrmt.surface.persist` | `background` | Layout Snapshot persistieren |
| `surface.diagnostics.snapshot` | `xtendrmt.surface.diagnostics` | `diagnostics` | Registry, Stack und Telemetry snapshotten |
| `a11y.user-blocking.announce` | `xtendrmt.a11y.announce` | `user-blocking` | Fokus- und Surface-Status ansagen |

Zusaetzlich bleiben `app.shell.render`, `route.visible.render`, `component.visible.mount`, `component.idle.hydrate` und `diagnostics.snapshot` Teil der RMT-first App Shell.

## Adaptergrenze

Im MVP gilt:

```text
adapter: "xtend.component"
```

`xtend.surface` ist reserviert, aber noch nicht aktiv. Der aktuelle RMT Schema Contract kennt `host_adapter`, `component_adapter`, `router_adapter`, `state_adapter` und `scheduler_adapter`; deshalb darf `WP-SM-01` kein `surface_adapter` im Schema vortaeuschen.

Handoff fuer spaeter:

```text
WP-SM-08 -> native RMT surfaces Domain und xtend.surface Adapter entwerfen
```

## A11y

Pflichten fuer Surface Records:

- jedes Window und SidePanel besitzt einen Accessible Name
- Close, Minimize, Maximize, Move und Resize muessen tastaturbedienbar geplant sein
- nicht-modale Windows setzen keinen Background-Inert
- modale Compatibility-Surfaces nutzen die bestehenden Overlay-Inert- und Focus-Trap-Regeln
- Close und Minimize restaurieren Fokus
- `a11y.user-blocking.announce` fuehrt Screenreader-Signale als Fabric-Lane `a11y`
- Reduced Motion und Forced Colors muessen Surface Chrome, Handles und Fokus sichtbar halten

## Security

Surface Authoring darf keine neue unsichere DOM-Grenze einfuehren:

- keine Inline-JS-Handler
- Events nur als `dom-event-to-rmt-command`
- Templates bevorzugt als `dom_descriptor`
- `html_fragment` nur ueber bestehende Trusted-DOM-Boundary
- keine externen Imports oder CDN-Pfade
- Diagnostics serialisieren keine DOM Nodes
- persistierte Layouts enthalten nur Bounds, IDs, Typen und UI-Status

## Fixture

Die Fixture `tests/fixtures/rmt-surface-manager-workbench.rmt` beweist:

- Shell-first App mit `app.shell`
- `workbench.manager` als `x-surface-manager`
- zwei `x-surface-window` Records fuer Inspector und Editor
- ein `x-side-panel` Record fuer Properties
- Surface-Metadata ueber `metadata.surfaceManager` und `metadata.surface`
- RMT Commands fuer Focus, Close, Layout und Panel Collapse
- Surface Schedules fuer Open, Close, Layout, Persist, Diagnostics und A11y
- keine native `surfaces` Top-Level-Domain und kein aktiver `xtend.surface` Adapter

## Gate

Der lokale Gate ist:

```bash
node scripts/run_xtend_tests.js rmt-surface-authoring --json
```

Er prueft:

- Catalog Factory und Validator
- Contract-, Workpackage-, Docs- und Fixture-Artefakte
- Package- und Scaffold-Metadaten
- Runner-Registrierung
- RMT-Fixture-Referenzen
- RMT-Core-Normalisierung und Runtime Registry
- Kernel Boundary und reservierte Adaptergrenze

## Handoff

`WP-SM-01` ist abgeschlossen, wenn dieser Contract, die Fixture, der Catalog, die Suite, die Docs-Seite und die Package-/Scaffold-Hooks vorhanden sind.

Naechstes Paket:

```text
WP-SM-02 - Surface Controller und State Snapshot bauen
```
