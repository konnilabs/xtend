# Hydration Policies

Sichtbare, idle und progressive Hydration bewusst wählen.

## Worum es geht

Eine Hydration Policy bestimmt Trigger, Lane, Deadline und Backpressure-Verhalten für bereits vorhandenes Markup. `visible` ist für sichtbare oder fokuskritische Arbeit, `idle` und `lazy` für nicht dringende Flächen, `prewarm` für abbrechbare Vorbereitung und `worker_prerender_hydrate` für validierte Worker-Ausgabe.

## Öffentliche Bausteine

- `fabric/hydration-policy.js` enthält die kanonischen Policies.
- `fabric/hydration-policy.d.ts` beschreibt Decision, Controller und Schedule Records.
- `fabric/rmt-lane-mapping.js` verbindet Policy-Lane und RMT Schedule.

## Empfohlener Ablauf

Prüfe jede Policy gegen ihre Trigger- und Backpressure-Fälle:

```bash
node scripts/run_xtend_tests.js hydration-policy --json
```

Der Report muss Policy-ID, gewählte Lane, Schedule und Diagnostic enthalten. Unter hoher Backpressure darf best-effort Prewarm verschoben werden; sichtbare Hydration darf jedoch nicht still in einen permanenten Idle-Zustand fallen. DOM-Commit bleibt auf dem kontrollierten Hauptthread.

## Nächste Schritte

- [XTend DEV API](./xtend-dev-api.md)
- [Performance](./performance.md)
- [A11y Keyboard Smokes](./a11y-keyboard-smokes.md)
