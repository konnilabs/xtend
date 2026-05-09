# SurfaceManager RMT Authoring

Docs Contract: `xtend.docs.surface-manager-rmt-authoring.v1`

Der SurfaceManager ist der geplante XTend App-Shell-Baustein fuer Multi Window Oberflaechen, SidePanels und spaetere Surface-Typen in einer SPA. `WP-SM-01` definiert zuerst das RMT Authoring Model; Runtime-Komponenten folgen in den naechsten Paketen.

## Entscheidung

SurfaceManager wird als RMT-native Komponentenfamilie aufgebaut:

- `x-surface-manager`
- `x-surface-window`
- `x-side-panel`

Fabric bleibt darunter fuer Lanes, Fibers, Diagnostics und Telemetry. Der SurfaceManager ersetzt Fabric nicht.

## MVP Authoring

Der MVP nutzt vorhandene RMT `components` Records mit `metadata.surfaceManager` und `metadata.surface`:

```json
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

`xtend.surface` und eine native RMT `surfaces` Domain sind reserviert, aber noch nicht aktiv.

## Schedules

| Schedule | Lane | Zweck |
|----------|------|-------|
| `surface.visible.render` | `visible` | Manager und sichtbare Surface Shell rendern |
| `surface.user-blocking.open` | `user-blocking` | Surface oeffnen und Fokus setzen |
| `surface.user-blocking.close` | `user-blocking` | Surface schliessen und Fokus restaurieren |
| `surface.transition.layout` | `transition` | Move, Resize, Docking und Snap committen |
| `surface.background.persist` | `background` | Layout Snapshot persistieren |
| `surface.diagnostics.snapshot` | `diagnostics` | Registry, Stack und Telemetry snapshotten |
| `a11y.user-blocking.announce` | `user-blocking` | Surface Status fuer Screenreader ansagen |

## Fixture

Das Referenzdokument liegt in:

```text
tests/fixtures/rmt-surface-manager-workbench.rmt
```

Es beschreibt eine Shell-first Workbench mit zwei `x-surface-window` Records und einem `x-side-panel` Record.

## Gate

```bash
node scripts/run_xtend_tests.js rmt-surface-authoring --json
```

Der Gate prueft `xtend.rmt.surface-authoring.v1`, das Fixture, Package-/Scaffold-Hooks, Runner-Registrierung, Docs und die RMT-Core-Normalisierung ohne Browser- oder Netzwerkpflicht.
