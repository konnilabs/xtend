# Performance

Budgets, Messpunkte und Hydration-Regeln für schnelle XTend Apps.

## Worum es geht

XTend misst Loader-, Mount-, Hydration-, Render-, Route- und Interaktionsarbeit als versionierte Measurements. Ein Budget gehört zu einer benannten Phase und Zeitbasis; eine große absolute Zeit darf nicht mit einem relativen Navigation-Timestamp verwechselt werden.

## Öffentliche Bausteine

- `fabric/xtend-fabric.js` sammelt Fiber- und Komponentenmesswerte.
- `tests/performance/performance_regression_suite.js` prüft deterministische Budgetfälle.
- `xtend.performance.measurement.v1` verwendet die Statuswerte `pass`, `warn` und `fail`.

## Empfohlener Ablauf

Führe Regression und Fabric-Messung gemeinsam aus:

```bash
node scripts/run_xtend_tests.js performance-regression fabric-performance-measurements --json
```

Lies im Report zuerst Phase, Istwert, Budget und Status. Ein `fail` wird an der betroffenen Arbeit behoben; das Budget wird nur geändert, wenn sich die dokumentierte Nutzeranforderung geändert hat. Prüfe Trends mit mehreren vergleichbaren Samples, nicht mit Zeitstempeln unterschiedlicher Herkunft.

## Nächste Schritte

- [XTend DEV API](./xtend-dev-api.md)
- [Hydration Policies](./hydration-policies.md)
- [A11y Keyboard Smokes](./a11y-keyboard-smokes.md)
