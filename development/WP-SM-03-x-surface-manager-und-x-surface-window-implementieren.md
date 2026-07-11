# WP-SM-03 x-surface-manager und x-surface-window implementieren

- Status: completed
- Datum: 9. Mai 2026
- Contract: `xtend.surface.window-runtime.v1`
- Ergebnis: `multi-window-spa-surface-runtime-ready`
- Lokaler Gate: `node scripts/run_xtend_tests.js surface-manager --json`

## Ziel

Dieses Paket implementiert die erste sichtbare SurfaceManager Runtime fuer XTend: `x-surface-manager` und `x-surface-window`.

`x-surface-manager` besitzt den Controller aus `WP-SM-02`, verwaltet Slots und uebersetzt Window-Commands in Controller-Operationen. `x-surface-window` stellt eine sichtbare Window-Surface mit Chrome, Content-Slot, Bounds, Fokus und Window-Aktionen bereit.

## Artefakte

- `components/xsurfacemanager.js`
- `components/xsurfacemanager.d.ts`
- `components/xsurfacewindow.js`
- `components/xsurfacewindow.d.ts`
- `src/components/x-surface-manager/x-surface-manager.ts`
- `src/components/x-surface-window/x-surface-window.ts`
- `catalog/surface-manager-window-runtime.js`
- `tests/components/surface_manager_runtime_suite.js`
- `tests/components/fixtures/xsurfacemanager.component.html`
- `tests/components/fixtures/xsurfacewindow.component.html`
- `docs/en/components/xsurfacemanager.md`
- `docs/en/components/xsurfacewindow.md`
- `docs/en/surface-manager-window-runtime.md`

## Implementierte Faehigkeiten

- Manifest-loadable `x-surface-manager` und `x-surface-window`
- Manager-Slots `windows`, `panels`, `overlays` und `default`
- Manager API fuer Open, Close, Focus, Update, Move, Resize, Minimize, Maximize, Restore und Snapshot
- Window API fuer `toSurfaceRecord`, `applySurfaceSnapshot`, `openWindow`, `closeWindow`, `focusWindow`, `minimizeWindow`, `maximizeWindow`, `restoreWindow`
- Command Bridge `surface-window-command-to-controller-operation`
- Snapshot Bridge `controller-snapshot-to-window-attributes-css-vars`
- Window Chrome mit Titel, Minimize, Maximize/Restore und Close
- Pointer-basierte Move/Resize Basis
- Tastatur-Fallback fuer Fokus, Escape und Pfeiltasten-Move
- A11y-, Motion-/Contrast- und Performance-Metadaten

## Done Criteria

- Beide Komponenten sind in `components/manifest.json` eingetragen.
- Beide Komponenten registrieren Custom Elements.
- `x-surface-manager` nutzt den Controller aus `WP-SM-02`.
- `x-surface-window` erzeugt `xtend.surface.record.v1` Records und besitzt keine eigene Controller-Registry.
- Snapshot-Status wird sichtbar in Attribute und CSS Variablen gespiegelt.
- RMT Kernel Boundary bleibt `no-rmt-kernel-import-of-xtend-types`.
- Package, Scaffold, Docs, Referenzregister und Test-Runner spiegeln WP-SM-03.
- Der Gate `node scripts/run_xtend_tests.js surface-manager --json` ist gruen.

## Handoff nach WP-SM-04

`WP-SM-04` sollte `x-side-panel` und responsive Surface Modes bauen. Das Panel soll denselben Controller nutzen, aber eigene Placement-, Docking-, Pinning-, Collapse- und Responsive-Regeln erhalten.
