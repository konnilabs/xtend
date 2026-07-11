# Screenreader Signals

Live Regions, Statusmeldungen und Overlay-Kontext sauber signalisieren.

## Worum es geht

Screenreader-Signale unterscheiden Status, Fehler und unmittelbare Warnung. Höfliche Live Regions melden nicht dringende Zustandswechsel; assertive Alerts sind für blockierende Fehler reserviert. Sichtbarer Text und Accessible Name müssen dieselbe Nutzerabsicht ausdrücken.

## Öffentliche Bausteine

- `tests/a11y/screenreader_signal_suite.js` prüft Signalverträge.
- Komponenten verwenden `role="status"`, `role="alert"` und `aria-live` nach Profil.
- Fabric ordnet Announcements der A11y-Lane zu, besitzt aber nicht den Meldungstext.

## Empfohlener Ablauf

Prüfe die gemeinsamen Signalverträge:

```bash
node scripts/run_xtend_tests.js screenreader-signals --json
```

Ein fehlender Status wird am zuständigen Control behoben. Vermeide gleichzeitig mehrere Live Regions mit identischem Text und setze keinen rein visuellen Toast als einzige Fehlermeldung ein. Bei Validation muss der Fehler per `aria-describedby` mit dem Feld verbunden bleiben.

## Nächste Schritte

- [Performance](./performance.md)
- [Hydration Policies](./hydration-policies.md)
- [A11y Keyboard Smokes](./a11y-keyboard-smokes.md)
