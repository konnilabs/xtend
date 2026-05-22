# Screenreader Signals

- Contract: `xtend.docs.screenreader-signals.v1`
- Runtime-/Gate-Contract: `xtend.a11y.screenreader-signals.v1`
- Signal Record: `xtend.a11y.screenreader-signal.v1`
- Gate: `node scripts/run_xtend_tests.js screenreader-signals --json`

## Zweck

Screenreader-Signale machen sichtbar, welche UI-Zustandswechsel nicht still bleiben duerfen. Der Contract beschreibt `aria-live`, Statusregionen, Errorregionen und Announcements, ohne eine bestimmte UI-Runtime in XTendRMT einzubetten.

XTend nutzt den Contract fuer Komponenten und Scaffold-Artefakte. XTendRMT kann die resultierende A11y-Arbeit ueber Fabric-Lane `a11y`, Fiber `a11y.announce` und Schedule `a11y.user-blocking.announce` schedulen.

## Signalarten

| Signal | Live Region | Region | Typischer Einsatz |
|--------|-------------|--------|-------------------|
| `status-announcement` | `polite` | `status` | Toasts, Alerts, Submit-Erfolg |
| `dismissal-announcement` | `polite` | `status` | Toast/Alert wurde geschlossen |
| `validation-error-summary` | `assertive` | `error` | Formular- oder Input-Fehler |
| `submit-status` | `polite` | `status` | Formular erfolgreich verarbeitet |
| `dialog-context` | `none` | `dialog` | Dialog-/Modal-Kontext via Rolle und Label |
| `focus-return` | `none` | `focus` | Fokus geht nach Overlay-Schluss zur Quelle zurueck |
| `route-change-announcement` | `polite` | `status` | Route wurde gewechselt |

## Komponentenpflichten

Feedback-Komponenten deklarieren Statussignale und setzen eine Live-Region. Fehlerzustaende duerfen assertiv sein, muessen aber reviewbar bleiben.

Form-Komponenten deklarieren mindestens `validation-error-summary` und `submit-status`. Errorregionen brauchen eine klare Quelle und duerfen leere Announcements nicht als Erfolg werten.

Overlay-Komponenten deklarieren `dialog-context` und `focus-return`. Sie brauchen nicht zwingend `aria-live`, weil der Screenreader-Kontext ueber `role="dialog"`, `aria-modal`, `aria-labelledby` und Fokusmanagement entsteht.

## Scaffold

Neue Scaffold-Komponenten enthalten den Screenreader-Contract in:

- `xtendScaffoldA11yProfile.screenreader.signalContract`
- Manifest-Key `screenreaderSignals`
- Component-Doku Abschnitt `Screenreader-Signale`
- Fixture-Ergebnis `screenreaderSignals`
- Type Contract `ScreenreaderSignalContract`

## Verifikation

```bash
npm run test:screenreader-signals
node scripts/run_xtend_tests.js screenreader-signals --json
node scripts/run_xtend_tests.js a11y-hydration --json
```

Der Gate prueft die Contract-Fabrik, reale Feedback-/Form-/Overlay-Komponenten, Scaffold-Ausgaben und Package-Metadaten.

## Grenzen

Der Contract ist kein Ersatz fuer manuelle Screenreader-Abnahme. Er verhindert aber, dass relevante Status-, Fehler- oder Overlay-Signale unbenannt bleiben.
