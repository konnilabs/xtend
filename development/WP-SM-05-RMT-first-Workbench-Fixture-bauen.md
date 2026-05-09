# WP-SM-05 RMT-first Workbench Fixture bauen

- Status: `completed`
- Datum: 9. Mai 2026
- Contract: `xtend.surface.workbench-fixture.v1`
- Gate: `node scripts/run_xtend_tests.js surface-workbench-fixture --json`
- Handoff: `WP-SM-06`

## Ziel

Dieses Paket baut den ersten RMT-first Nachweis fuer die SurfaceManager-Familie: eine App Shell, die ohne manuelle Surface-Markup aus RMT gerendert wird und darin zwei Windows, ein SidePanel, route-bound Content und einen gemeinsamen Surface Snapshot enthaelt.

## Ergebnis

- `xtendrmt/surface-workbench.rmt` beschreibt die Workbench als RMT-Dokument.
- `xtendrmt-surface-workbench.html` stellt nur den generischen RMT-Host bereit.
- `xtendrmt/surface-workbench.js` materialisiert `dom_descriptor` Templates, Component Records, Slots und Routen.
- `tests/browser/fixtures/rmt-surface-workbench-smoke.html` bereitet den browsernahen Smoke fuer `WP-SM-07` vor.
- `catalog/surface-manager-workbench-fixture.js` und `tests/rmt/surface_manager_workbench_fixture_suite.js` pruefen Contract, Fixture, Host, Runtime, Docs, Package und Runner.

## Done Criteria

- RMT-Dokument gehoert zu `WP-SM-05` und deklariert `xtend.surface.workbench-fixture.v1`.
- Surface Authoring bleibt ueber Component Records mit `metadata.surfaceManager` und `metadata.surface`.
- Die Workbench besitzt genau einen `x-surface-manager`, zwei `x-surface-window` Records und ein `x-side-panel`.
- `workbench` ist als Route vorhanden und bindet alle drei Surfaces.
- Der shared Snapshot Key ist `xtend.surface.snapshot`.
- Host und Browser-Smoke nutzen `xtend-loader.js` mit lokalem Manifest.
- Der lokale Gate bleibt statisch, browserfrei und netzwerkfrei.

## Folgepaket

`WP-SM-06` sollte die Overlay-Kompatibilitaet und Stack-Bridge vorbereiten. Die Workbench-Fixture ist dann die Referenz, um `x-modal`, `x-dialog` und `x-drawer` kontrolliert neben Windows und SidePanels in denselben Surface Stack zu fuehren.
