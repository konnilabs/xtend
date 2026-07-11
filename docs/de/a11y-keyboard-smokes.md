# A11y Keyboard Smokes

Tastaturpfade und Fokuszustände für echte Bedienbarkeit prüfen.

## Worum es geht

Keyboard Smokes prüfen den vollständigen Bedienpfad statt nur vorhandener `tabindex`-Attribute. Relevant sind Fokusreihenfolge, sichtbarer Fokus, Enter-/Space-Aktivierung, Pfeiltasten, Escape, Fokusfalle und Wiederherstellung nach Overlays.

## Öffentliche Bausteine

- `tests/browser/fixtures/a11y-focus-keyboard-smoke.html` ist das browsernahe Fixture.
- Komponentenprofile nennen Rolle, Fokusstrategie und erlaubte Tasten.
- Surface- und Overlay-Tests prüfen Fokus-Owner über Open und Close.

## Empfohlener Ablauf

Starte den A11y-/Hydration-Gate lokal:

```bash
node scripts/run_xtend_tests.js a11y-hydration --json
```

Behebe zuerst den frühesten fehlgeschlagenen Fokusübergang. Ein Maus-Klick beweist keine Tastaturbedienung. Bei einem Overlay müssen Tab und Shift+Tab innerhalb der aktiven Grenze bleiben, Escape die dokumentierte Aktion auslösen und Close den vorherigen Fokus wiederherstellen.

## Nächste Schritte

- [Performance](./performance.md)
- [Hydration Policies](./hydration-policies.md)
