# XTend SurfaceManager Release Handoff Contract

- Schema: `xtend.surface.release-handoff.v1`
- Report: `xtend.surface.release-handoff-report.v1`
- Component Lab Fixture: `xtend.surface.component-lab-fixture.v1`
- Workpackage: `WP-SM-09`
- Status: accepted-docs-component-lab-release-handoff
- Local Gate: `node scripts/run_xtend_tests.js surface-release-handoff --json`
- Kernel Boundary: `no-rmt-kernel-import-of-xtend-types`

## Zweck

`WP-SM-09` schliesst die erste SurfaceManager-Linie ab. Der Contract buendelt die Authoring-Doku, die SurfaceManager-Erweiterung im Component Lab, den Migrationspfad von `components[*].metadata.surface` zu `surfaces[*]` und den Release-Handoff fuer die Folgearbeit.

Dieser Contract behauptet keine produktive `xtend.surface` Runtime. `xtend.surface.adapter.v1` bleibt ein Host-/Adapter-Handoff. Der SurfaceManager nutzt weiterhin die Komponentenfamilie `x-surface-manager`, `x-surface-window`, `x-side-panel` und die Overlay-Bridge; der RMT Kernel importiert keine XTend-Typen.

## Abschlusskriterien

- `docs/en/surface-manager-authoring-guide.md` beschreibt die drei Authoring-Modi `component-metadata-mvp`, `dual-record-handoff` und `native-surfaces-preferred`.
- `docs/surface-manager-component-lab.md` beschreibt das SurfaceManager Component Lab mit den Panels `surface-preview`, `native-rmt-inspector`, `migration-diff`, `quality-gates` und `source-links`.
- `docs/en/surface-manager-migration-guide.md` beschreibt die Migrationsschritte `inventory-component-metadata-surfaces`, `stabilize-surface-ids-and-state-keys`, `add-native-surfaces-records`, `keep-dual-records-during-handoff`, `switch-authoring-default-to-surfaces-domain` und `defer-xtend-surface-runtime-until-adapter-implementation`.
- `development/docs-evidence/root/surface-manager-release-handoff.md` beschreibt den Release-Status, die lokalen Gates und die verbleibende Adapter-Grenze `no-public-runtime-claim-for-xtend.surface-adapter-yet`.
- `tests/fixtures/rmt-surface-manager-component-lab.rmt` beweist eine Lab-Fixture mit nativen `surfaces[*]` und kompatiblen `components[*].metadata.surface` Records.
- `catalog/surface-manager-release-handoff.js` und `tests/rmt/surface_manager_release_handoff_suite.js` liefern den statischen Gate.

## Vorherige Contracts

Der Handoff setzt diese abgeschlossenen Schichten voraus:

- `xtend.rmt.surface-authoring.v1`
- `xtend.surface.controller.v2`
- `xtend.surface.window-runtime.v1`
- `xtend.surface.side-panel-runtime.v1`
- `xtend.surface.workbench-fixture.v1`
- `xtend.surface.overlay-stack-bridge.v1`
- `xtend.surface.quality-gates.v1`
- `xtend.rmt.surfaces-domain.v1`
- `xtend.surface.adapter.v1`

## Release Boundary

Die SurfaceManager-Komponenten und die RMT-native Surface-Domain sind authoring- und gatebereit. Die produktive `xtend.surface` Adapter-Ausfuehrung bleibt bewusst Folgearbeit:

```text
surfaces[*]
  -> xtend.surface.adapter.v1
  -> host adapter implementation
  -> x-surface-manager controller
  -> xstate/Fabric diagnostics
```

Bis diese Adapter-Implementierung existiert, bleiben `surfaces[*]` Datenrecords und `components[*].metadata.surface` die stabile Kompatibilitaetsquelle fuer bereits laufende Component-Record-Flows.
