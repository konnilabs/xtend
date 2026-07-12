# WP-SM-04 - x-side-panel und responsive Surface Modes umsetzen

- Status: `completed`
- Contract: `xtend.surface.side-panel-runtime.v1`
- Report: `xtend.surface.side-panel-runtime-report.v1`
- Local Gate: `node scripts/run_xtend_tests.js surface-side-panel --json`
- Package Script: `npm run test:surface-side-panel`
- Kernel Boundary: `no-rmt-kernel-import-of-xtend-types`

## Ziel

`WP-SM-04` setzt die erste SidePanel-Surface der SurfaceManager-Familie um. `x-side-panel` ist fuer App Shells gedacht und unterstuetzt `docked`, `overlay`, `pinned`, `collapsed` und responsive Fullscreen-Verhalten.

## Umsetzung

| Artefakt | Pfad |
|----------|------|
| Runtime | `components/xsidepanel.js` |
| Types | `components/xsidepanel.d.ts` |
| TypeScript Source | `src/components/x-side-panel/x-side-panel.ts` |
| Component Docs | `docs/components/xsidepanel.md` |
| Fixture | `tests/components/fixtures/xsidepanel.component.html` |
| Component Suite | `tests/components/xsidepanel.component_suite.js` |
| Contract Module | `catalog/surface-manager-side-panel-runtime.js` |
| Gate Suite | `tests/components/surface_manager_side_panel_suite.js` |
| Public Docs | `docs/de/surface-manager-side-panel-runtime.md`, `docs/en/surface-manager-side-panel-runtime.md` |

## Done Criteria

- `x-side-panel` registriert sich bei `x-surface-manager`.
- `surface-panel-command` wird vom Manager verarbeitet.
- `placement` unterstuetzt `left`, `right`, `bottom` und `inline`.
- `mode` unterstuetzt `docked`, `overlay`, `pinned`, `collapsed` und `fullscreen`.
- Resize, Collapse, Pin/Unpin, Dock, Open, Close und Focus sind als Component API sichtbar.
- Snapshot-Spiegelung setzt Attribute und CSS-Variablen.
- A11y- und Performance-Profile sind als Static Contracts vorhanden.
- Manifest, Package Metadata, Scaffold Config, Docs-Menue und Reference Registry sind aktualisiert.

## Handoff nach WP-SM-04

`WP-SM-05` ist abgeschlossen und hat ein RMT-first Workbench Fixture gebaut. Dieses Fixture fuehrt `x-surface-manager`, zwei `x-surface-window` Instanzen und ein `x-side-panel` in einem RMT App-Shell-Dokument zusammen.
