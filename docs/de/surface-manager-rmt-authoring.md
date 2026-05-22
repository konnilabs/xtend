# SurfaceManager RMT Authoring

Docs Contract: `xtend.docs.surface-manager-rmt-authoring.v1`

Der SurfaceManager ist der XTend App-Shell-Baustein fuer Multi Window
Oberflaechen, SidePanels und spaetere Surface-Typen in einer SPA. `WP-SM-01`
definiert zuerst das RMT Authoring Model; Runtime-Komponenten folgen in den
naechsten Paketen.

## Entscheidung

SurfaceManager wird als RMT-native Komponentenfamilie aufgebaut:

- `x-surface-manager`
- `x-surface-window`
- `x-side-panel`

Fabric bleibt darunter fuer Lanes, Fibers, Diagnostics und Telemetry. Der
SurfaceManager ersetzt Fabric nicht.

## MVP Authoring

Neue SurfaceManager-Beispiele werden vNext-first geschrieben. Der Compiler kann
daraus weiterhin vorhandene RMT `components` Records mit
`metadata.surfaceManager` und `metadata.surface` erzeugen:

```rmt
template workbench.surfaces {
  state workbench.selection type object initial null

  portal surface.root root "#workbench-root" layer surface

  surface workbench.manager kind workspace component x-surface-manager {
    portal surface.root

    lane visible weight 90 {
      mount x-surface-manager
      hydrate surface-manager from endpoint surface.visible.render
    }
  }

  surface workbench.inspector kind window component x-surface-window {
    source state workbench.selection
    portal surface.root

    lane user-blocking weight 95 {
      hydrate inspector-window from endpoint surface.user-blocking.open
    }

    lane transition weight 55 {
      hydrate inspector-layout from endpoint surface.transition.layout
    }
  }

  surface workbench.details kind panel component x-side-panel {
    portal surface.root

    lane visible weight 70 {
      hydrate details-panel from state workbench.selection
    }
  }
}
```

`xtend.surface` und eine native RMT `surfaces` Domain bleiben die Runtime-
Projektion dieses vNext-Pfads. Legacy `components[*].metadata.surface` ist
Migrationsquelle und Mirror, aber nicht mehr die bevorzugte Schreibform.

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

Es beschreibt eine Shell-first Workbench mit zwei `x-surface-window` Records und
einem `x-side-panel` Record. Die naechste Dokumentationslinie sollte dieselbe
Workbench als RMT-vNext-Draft zeigen und die Records nur noch als
Compiler-/Compatibility-Output fuehren.

## Gate

```bash
node scripts/run_xtend_tests.js rmt-surface-authoring --json
```

Der Gate prueft `xtend.rmt.surface-authoring.v1`, das Fixture,
Package-/Scaffold-Hooks, Runner-Registrierung, Docs und die
RMT-Core-Normalisierung ohne Browser- oder Netzwerkpflicht.
