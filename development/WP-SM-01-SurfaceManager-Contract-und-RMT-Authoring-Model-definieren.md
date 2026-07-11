# WP-SM-01 - SurfaceManager Contract und RMT Authoring Model definieren

- Status: `completed`
- Datum: 9. Mai 2026
- Contract: `xtend.rmt.surface-authoring.v1`
- Report Contract: `xtend.rmt.surface-authoring-report.v1`
- SurfaceManager Contract: `xtend.surface.manager.v1`
- Surface Record Contract: `xtend.surface.record.v1`
- Plan: `development/XTend-SurfaceManager-und-Multi-Window-Plan.md`
- Zielzustand: `rmt-native-surface-authoring-ready`
- Kernel Boundary: `no-rmt-kernel-import-of-xtend-types`

## Ziel

Dieses Workpackage friert den ersten SurfaceManager-Schnitt ein, bevor Runtime-Komponenten entstehen. XTend soll damit Multi Window Oberflaechen, SidePanels und spaetere Surface-Typen in RMT-first App Shells beschreiben koennen, ohne Fabric zu duplizieren oder den RMT Kernel an XTend zu koppeln.

## Scope

Umgesetzt:

- Contract `xtend.rmt.surface-authoring.v1`
- SurfaceManager Metadata `xtend.surface.manager.v1`
- Surface Record Metadata `xtend.surface.record.v1`
- RMT-MVP ueber `components[*].metadata.surfaceManager` und `components[*].metadata.surface`
- reservierter, noch nicht aktiver Adapter `xtend.surface`
- Schedule-Set fuer Render, Open, Close, Layout, Persist, Diagnostics und A11y
- RMT-Fixture `tests/fixtures/rmt-surface-manager-workbench.rmt`
- Catalog Factory und Validator `catalog/surface-manager-rmt-authoring.js`
- Gate `tests/rmt/rmt_surface_manager_authoring_suite.js`
- Docs-Seite `development/docs-evidence/root/surface-manager-rmt-authoring.md`
- Package-, Scaffold- und Runner-Hooks

Nicht umgesetzt:

- Runtime-Komponenten `x-surface-manager`, `x-surface-window`, `x-side-panel`
- produktiver Surface Controller
- native RMT Top-Level-Domain `surfaces`
- aktiver Adapter-Kind `surface_adapter`
- Browser-Smoke fuer Drag/Resize/Focus

Diese Punkte gehoeren zu `WP-SM-02` bis `WP-SM-08`.

## Artefakte

| Artefakt | Pfad |
|----------|------|
| Contract | `development/XTend-SurfaceManager-Contract-und-RMT-Authoring-Model.md` |
| Workpackage | `development/WP-SM-01-SurfaceManager-Contract-und-RMT-Authoring-Model-definieren.md` |
| Fixture | `tests/fixtures/rmt-surface-manager-workbench.rmt` |
| Catalog | `catalog/surface-manager-rmt-authoring.js` |
| Suite | `tests/rmt/rmt_surface_manager_authoring_suite.js` |
| Docs | `development/docs-evidence/root/surface-manager-rmt-authoring.md` |

## Gate

```bash
node scripts/run_xtend_tests.js rmt-surface-authoring --json
```

Der Gate prueft Contract, Fixture, Catalog, Package, Scaffold, Runner, Docs, RMT-Core-Normalisierung und die Boundary `no-rmt-kernel-import-of-xtend-types`.

## Akzeptanz

- SurfaceManager wird als Komponentenfamilie und nicht als zweite globale Runtime neben Fabric gefuehrt.
- Fabric bleibt Unterbau fuer Fibers, Lanes, Diagnostics und Telemetry.
- Der MVP nutzt `xtend.component` und bleibt mit dem aktuellen RMT Schema kompatibel.
- `xtend.surface` und `surfaces` sind sichtbar reserviert, aber nicht als Runtime-Fakt behauptet.
- Das Fixture beschreibt zwei Windows und ein SidePanel in einer Shell-first Workbench.
- Alle Surface-Inhalte referenzieren Komponenten, Templates und Schedules strukturiert.

## Handoff

`WP-SM-02` kann starten.

Naechste Umsetzung:

```text
Surface Controller und State Snapshot bauen
```

Der Controller soll die in `WP-SM-01` definierten Records materialisieren, Registry und Snapshot fuehren, xstate Mirror Keys schreiben und Surface-Operationen ueber Fabric Fibers diagnostisch sichtbar machen.
