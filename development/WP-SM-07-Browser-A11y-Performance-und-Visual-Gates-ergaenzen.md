# WP-SM-07 - Browser-, A11y-, Performance- und Visual-Gates ergaenzen

Status: completed
Local Gate: `node scripts/run_xtend_tests.js surface-manager-quality --json`
Contract: `development/XTend-SurfaceManager-Quality-Gates-Contract.md`

## Ziel

Der SurfaceManager soll nach den Runtime- und Bridge-Paketen nicht nur statisch existieren, sondern in einer gemischten Oberflaeche gatebar sein. `WP-SM-07` ergaenzt deshalb lokale Browser-, A11y-, Performance- und Visual-Gates fuer Windows, SidePanels und Overlay Surfaces.

## Umsetzung

- `tests/browser/fixtures/surface-manager-quality-smoke.html` prueft eine gemischte SPA-Oberflaeche mit zwei Windows, einem SidePanel, Modal, Dialog und Drawer.
- `tests/browser/browser_smoke_suite.js` fuehrt das neue SurfaceManager-Fixture im Browser-Harness mit.
- `tests/browser/visual-baselines/surface-manager-quality.dom-baseline.json` definiert eine DOM-basierte Visual-Baseline fuer Stack-, Mobile-, Overlay- und Forced-Colors-Zustaende.
- `catalog/surface-manager-quality-gates.js` beschreibt Gate-Domaenen, Budgets, Assertions, Artefakte und Handoff.
- `tests/components/surface_manager_quality_gates_suite.js` prueft Contract, Browser-Fixture, A11y-Regeln, Performance-Budgets, Visual-Baseline, Package, Scaffold, Runner und Docs.

## Done Criteria

- Ein kombinierter Gate `surface-manager-quality` ist registriert.
- Domain-Gates `surface-manager-browser`, `surface-manager-a11y`, `surface-manager-performance` und `surface-manager-visual` sind einzeln aufrufbar.
- Das Browser-Fixture nutzt keine externen URLs und enthaelt den gemischten Stack aus `window`, `side-panel`, `modal`, `dialog` und `drawer`.
- A11y Assertions fuer Rollen, Fokus, Escape, Tab Trap, Reduced Motion und Forced Colors sind dokumentiert und statisch gatebar.
- Performance-Budgets fuer Open/Close, Focus, Layout, Snapshot und Registration sind als Contract-Werte gatebar.
- Die Visual-Baseline deckt Desktop, Mobile, Topmost Overlay und Forced Colors ab.
- Der lokale Gate `node scripts/run_xtend_tests.js surface-manager-quality --json` ist gruen.

## Handoff

`WP-SM-08` sollte nun die native RMT `surfaces` Domain und den `xtend.surface` Adapter entwerfen. Die Quality-Gates aus `WP-SM-07` liefern dafuer die Regression-Sicherheit, damit die spaetere native Domain dieselbe sichtbare Oberflaeche reproduziert.
