# Visual Browser Regression

Browsernahe Regressionen mit stabilen Fixtures und Screenshots erkennen.

## Worum es geht

Visual Browser Regression vergleicht kontrollierte Zustände in festen Themes und Viewports. Der Test soll Layout, Überlappung, abgeschnittenen Text, Fokusdarstellung und responsive Zustandswechsel erkennen, nicht zufällige Pixel aus Animation oder Systemschrift.

## Öffentliche Bausteine

- `tests/browser/visual_snapshots_suite.js` führt lokale DOM- und Screenshot-Vergleiche aus.
- Die Viewports `desktop-1280`, `tablet-768` und `mobile-390` decken feste Layoutgrenzen ab.
- `xtend.epic12.visual-snapshot-automation-contract.v1` beschreibt den vorhandenen Snapshot-Report.

## Empfohlener Ablauf

Erzeuge Regression-Priorität und Snapshots in derselben Revision:

```bash
node scripts/run_xtend_tests.js regression-priority visual-snapshots --json
```

Bei einem Diff prüfe zuerst Fixture-State, Fonts, Motion und Viewport. Aktualisiere eine Baseline nur nach visueller Prüfung und mit erklärter Produktänderung. Eine neue Baseline ist keine Fehlerbehebung für überlappende oder abgeschnittene UI.

## Nächste Schritte

- [Performance](./performance.md)
- [Hydration Policies](./hydration-policies.md)
- [A11y Keyboard Smokes](./a11y-keyboard-smokes.md)
