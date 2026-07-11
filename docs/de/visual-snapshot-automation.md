# Visual Snapshot Automation

Deterministische Screenshots für Themes, Viewports und Komponenten erstellen.

## Worum es geht

Snapshot Automation materialisiert definierte Fixture-Zustände, wartet auf stabile Custom Elements und schreibt vergleichbare lokale Artefakte. Theme, Viewport, Motion und State sind Teil der Snapshot-Identität; Netzwerk und Echtzeitdaten bleiben ausgeschlossen.

## Öffentliche Bausteine

- `tests/browser/visual_snapshot_automation_suite.js` prüft den Automation-Vertrag.
- `tests/browser/visual_snapshots_suite.js` führt die eigentlichen Vergleiche aus.
- `.xtend-test-results/` enthält Reports und erzeugte Evidence, nicht die Source of Truth der UI.

## Empfohlener Ablauf

Prüfe Vertrag und Runner zusammen:

```bash
node scripts/run_xtend_tests.js visual-snapshot-automation visual-snapshots --json
```

Ein Timeout weist meist auf ein nicht definiertes Element, laufende Animation oder fehlende Fixture-Bereitschaft hin. Stabilisiere den Zustand explizit. Maskiere keine dynamischen Bereiche, die für Nutzer sichtbar und produktrelevant sind.

## Nächste Schritte

- [Performance](./performance.md)
- [Hydration Policies](./hydration-policies.md)
- [A11y Keyboard Smokes](./a11y-keyboard-smokes.md)
