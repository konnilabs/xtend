# Visual Browser Regression

Browsernahe Regressionen mit stabilen Fixtures und Screenshots erkennen.

## Worum es geht

Diese Seite beschreibt prüfbare Regeln für robuste Nutzererlebnisse. Die Empfehlungen passen zu lokalen Hosts, RMT App Shells und klassischen Web-Component-Seiten.

## Öffentliche Bausteine

- Lokale Testbefehle.
- Browsernahe Fixtures.
- Dokumentierte Akzeptanzkriterien.
- Docs-Vertrag `xtend.docs.visual-browser-regression.v1`.
- Gate `node scripts/run_xtend_tests.js regression-priority --json`.
- Viewports `desktop-1280`, `tablet-768` und `mobile-390`.

## Empfohlener Ablauf

Lege Budgets fest, prüfe Tastatur- und Screenreader-Signale und halte Screenshots reproduzierbar.

## Nächste Schritte

- [Performance](./performance.md)
- [Hydration Policies](./hydration-policies.md)
- [A11y Keyboard Smokes](./a11y-keyboard-smokes.md)
