# SurfaceManager Authoring Guide

- Contract: `xtend.surface.release-handoff.v1`
- Workpackage: `WP-SM-09`
- Fixture: `tests/fixtures/rmt-surface-manager-component-lab.rmt`
- Local Gate: `node scripts/run_xtend_tests.js surface-release-handoff --json`

## Ziel

Dieser Guide beschreibt den empfohlenen Authoring-Pfad fuer XTend App Shells mit SurfaceManager. Er verbindet den fruehen Component-Metadata-Pfad aus `WP-SM-01` mit der nativen RMT `surfaces` Domain aus `WP-SM-08`.

## Authoring-Modi

| Modus | Wann nutzen | Quelle |
|-------|-------------|--------|
| `component-metadata-mvp` | Kleine Shells, bestehende Component Records, schnelle Migration | `components[*].metadata.surface` |
| `dual-record-handoff` | Uebergang, Tooling-Vergleich, Regression gegen bestehende Runtime | `components[*].metadata.surface` plus `surfaces[*]` |
| `native-surfaces-preferred` | Komplexe App Shells, Multi Window, Panels, Overlay Stack | `surfaces[*]` als fachliche Surface-Quelle |

## Component-Metadata bleibt gueltig

Bestehende RMT Component Records bleiben kompatibel:

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
      "id": "surface.inspector",
      "type": "window",
      "manager": "workbench.manager",
      "stateKey": "xtend.surface.inspector.state"
    }
  }
}
```

Dieser Modus reicht, wenn eine App Shell ueber `x-surface-manager` bereits korrekt laeuft und keine native RMT Surface-Domain fuer Tooling, Migration oder Cross-Record-Validierung gebraucht wird.

## Native Surfaces bevorzugen

Fuer neue komplexe Shells ist `surfaces[*]` der Zielzustand:

```json
{
  "id": "surface.inspector",
  "schema": "xtend.surface.record.v1",
  "type": "window",
  "adapter": "xtend.surface",
  "manager": "workbench.manager",
  "component": "workbench.inspector",
  "route": "workbench",
  "schedule": "surface.user-blocking.open",
  "stateKey": "xtend.surface.inspector.state"
}
```

Authoring-Regeln:

- `manager` referenziert den `x-surface-manager` Component Record.
- `component` referenziert die sichtbare Surface-Komponente.
- `route` bindet die Surface an den App-Shell-Kontext.
- `schedule` bindet Open, Layout, Persistenz oder Diagnostics an RMT Scheduling.
- `stateKey` bleibt stabil zwischen Component-Metadata und nativer Domain.
- `xtend.surface` bleibt vorerst Adapter-Handoff; die sichtbare Runtime laeuft weiterhin ueber die Komponentenfamilie.

## Release-Handoff

Nach `WP-SM-09` gilt:

- Component-Metadata ist stabiler Compatibility-Pfad.
- Native `surfaces[*]` ist der bevorzugte Authoring-Pfad fuer neue App Shells.
- Dual Records sind der sichere Migrationsmodus.
- Der RMT Kernel bleibt host-neutral.
- Die produktive `xtend.surface` Adapter Runtime ist Folgearbeit, nicht Teil dieses Handoffs.
