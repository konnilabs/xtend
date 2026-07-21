# WP-SM-16 - Docking, Split Panes, Tiling und weitere Layout Engines ergaenzen

- Status: `completed`
- Datum: 13. Mai 2026
- Contract: `xtend.surface.layout-engine.v1`
- Report: `xtend.surface.layout-engine-report.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js surface-layout-engines --json`
- Boundary: `no-second-surface-registry`
- Boundary: `no-rmt-kernel-import-of-xtend-types`

## Ziel

App Shells koennen neben freien Fenstern auch docked Workspaces, Split Panes, Tiling und gestapelte Layouts ausdruecken. Docking ist sichtbares Runtime-Verhalten und nicht nur Metadata.

## Umsetzung

- `components/xsurfacemanager.js` kennt die Engines `freeform`, `docked`, `split`, `tile`, `stacked` und `document-flow`.
- `snapshotSurfaceLayout()` erzeugt einen gatebaren Layout-Report mit Viewport, Gap, Snap, Bounds, Zonen, Responsive-Fallback und Snapshot-Kompatibilitaet.
- `applyLayoutEngine()` schreibt berechnete Bounds ueber den bestehenden SurfaceController, damit Persistenz und Restore dieselben Werte sehen.
- `dockSurface()` und `undockSurface()` sind produktive Manager-Operationen fuer sichtbares Docking/Floating.
- `x-side-panel` unterstuetzt `mode="floating"` ueber `--surface-layout-x` und `--surface-layout-y`.
- kompakte Viewports wechseln kontrolliert auf `stacked`.
- `document-flow` komponiert statische Portal-Kinder als scrollbaren normalen Dokumentfluss und schreibt keine absoluten Bounds.

## Artefakte

- `catalog/surface-manager-layout-engines.js`
- `tests/components/surface_manager_layout_engines_suite.js`
- `tests/components/fixtures/xsurfacemanager-layout-engines.component.html`
- `docs/en/components/xsurfacemanager.md`
- `docs/de/components/xsurfacemanager.md`
- `components/xsurfacemanager.js`
- `components/xsurfacemanager.d.ts`
- `components/xsidepanel.js`
- `components/xsidepanel.d.ts`

## Abnahme

- Layout-Wechsel sind snapshotbar
- Docking ist sichtbares Runtime-Verhalten
- mobile und desktop Viewports besitzen stabile Fallbacks
- der SurfaceController bleibt Registry-Wahrheit
- lokaler Gate: `node scripts/run_xtend_tests.js surface-layout-engines --json`
