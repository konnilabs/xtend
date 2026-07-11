# Motion und Contrast

Reduced Motion, Kontrast und nicht-farbige Statushinweise berücksichtigen.

## Worum es geht

Motion- und Contrast-Policies sichern Bedienbarkeit bei `prefers-reduced-motion` und `forced-colors`. Ein Zustand darf nicht nur durch Bewegung oder Farbe erkennbar sein; Fokus, Auswahl, Busy und Fehler brauchen zusätzliche Form-, Text- oder Symbolsignale.

## Öffentliche Bausteine

- `tests/a11y/motion_contrast_suite.js` prüft die Policy-Verträge.
- Komponentenprofile deklarieren Reduced-Motion- und High-Contrast-Verhalten.
- Design Tokens liefern Fokus-, Surface-, Text- und Statuswerte.

## Empfohlener Ablauf

Führe den gemeinsamen Policy-Gate aus:

```bash
node scripts/run_xtend_tests.js motion-contrast --json
```

Prüfe anschließend das relevante Browser-Fixture in beiden Media-Query-Modi. Reduced Motion soll Übergänge vereinfachen, nicht Status entfernen. Unter Forced Colors bleiben native Controls, Fokusoutline und nicht-farbige Zustandsmarker sichtbar.

## Nächste Schritte

- [Performance](./performance.md)
- [Hydration Policies](./hydration-policies.md)
- [A11y Keyboard Smokes](./a11y-keyboard-smokes.md)
