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
- Historisch blieb `xtend.surface` bis `WP-SM-19` ein Adapter-Handoff; seit dem Runtime-Handoff ist der produktive Adapter-Claim gatebar, waehrend die sichtbare UI weiterhin ueber die SurfaceManager-Komponentenfamilie materialisiert wird.

## Release-Handoff

Nach `WP-SM-09` galt fuer den historischen Authoring-Handoff:

- Component-Metadata ist stabiler Compatibility-Pfad.
- Native `surfaces[*]` ist der bevorzugte Authoring-Pfad fuer neue App Shells.
- Dual Records sind der sichere Migrationsmodus.
- Der RMT Kernel bleibt host-neutral.
- Die produktive `xtend.surface` Adapter Runtime war Folgearbeit und ist seit `WP-SM-19` umgesetzt.

## WP-SM-19 Runtime Authoring

Ab `WP-SM-19` ist die produktive `xtend.surface` Adapter Runtime umgesetzt und ueber `xtend.surface.runtime-release-handoff.v1` gatebar. Fuer neue komplexe App Shells bleibt `native-surfaces-preferred` der Default: `surfaces[*]` beschreibt die fachlichen Surfaces, waehrend Component Records die sichtbaren XTend-UI-Bindings liefern.

Produktive Authoring-Regeln:

- `surfaces[*]` ist die Quelle fuer neue Multi-Surface-App-Shells.
- `components[*].metadata.surface` bleibt fuer bestehende Shells und Dual-Record-Migrationen kompatibel.
- `x-surface-manager` und der SurfaceController bleiben die Runtime-Registry.
- Fabric, XRouter, `xstate` und RMT-Kernel bleiben eigenstaendige Schichten.
- `node scripts/run_xtend_tests.js surface-runtime-release-handoff --json` prueft den finalen Runtime-Handoff.

Details stehen im [SurfaceManager Runtime Release Handoff](./surface-manager-runtime-release-handoff.md).
