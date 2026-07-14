# XTend Core Compliance Checklist

- Version: `2026-03-24`
- Status: Active
- Bezug:
  - `development/compliance/digital-twin-principle.md`
  - `development/compliance/xtend-design-guidelines.md`
  - `development/compliance/update-instructions.md`
  - `development/XTend-Architecture-Gate-Regeln.md`
  - `development/XTendRMT-Migrations-und-Framework-Agnostik-Leitplanken.md`

## Zweck

Diese Checkliste uebersetzt die Compliance-Dokumente in konkrete Review-Kriterien fuer XTend-Core-Aenderungen. Sie ist die operative Grundlage fuer `WP-E02-10` und die spaetere Core-Review-Pflicht.

## Review-Kriterien

### 1. Digital Twin Principle

- jeder sichtbare UI-Zustand besitzt einen deterministischen Zwilling in `xstate`
- Benutzerinteraktionen schreiben den Zustand synchron in `xstate` zurueck
- lokale UI-Flags sind hoechstens abgeleitete Render-Caches, nie die Wahrheitsquelle
- asynchrone Workarounds fuer Open-/Close- oder Navigationszustand sind nicht erlaubt

### 2. Contract-Klarheit

- kanonische State-Keys liegen unter dem XTend-Namespace
- Legacy-Contracts bleiben nur als dokumentierte Kompatibilitaets-Fassade erhalten
- API, Komponente, Doku und Typdefinitionen beschreiben denselben Vertrag

### 3. Accessibility

- interaktive Elemente tragen Rolle, Label und Fokusbehandlung
- Tastaturpfade fuer Close, Navigation und Aktion sind vorhanden
- Status- und Feedback-Komponenten nutzen passende `aria-live`- bzw. Rollen-Semantik

### 4. Design & Motion

- Komponenten verwenden zentrale XTend-Design-Tokens statt isolierter Einzelwerte
- Animationen respektieren `prefers-reduced-motion`
- Hitboxen und Fokus-States sind fuer Pointer und Tastatur gleichermassen brauchbar

### 5. Defensive Runtime

- Initialisierung ist idempotent oder klar begrenzt
- fehlende Registry-/Manifest-/State-Eintraege werden defensiv behandelt
- API-gemanagte Instanzen raeumen State und DOM konsistent auf

### 6. Verifikation

- Syntax- und Contract-Checks sind ausfuehrbar
- neue oder geaenderte Core-Fluesse sind im Smoke-/Contract-Test beruecksichtigt
- Migrationshinweise dokumentieren Legacy- und Zielcontract

### 7. RMT- und Framework-Agnostik

- RMT-Templating bleibt additiv und opt-in
- bestehende XTend-Apps bleiben ohne `.rmt` Opt-in stabil
- XTend-spezifische RMT-Daten bleiben Adapterdaten mit `kernelVisible: false`
- React, Vue, Vanilla JS und Custom Hosts werden nicht durch XTend-Annahmen ausgeschlossen
- XRouter bleibt Adapter-Aufgabe und darf nicht als Kernel-Pflicht eingefuehrt werden
- `bridgeRuntime: reserved-for-Epic-05` bleibt gesetzt, solange keine produktive Bridge existiert

## Pflichtschritte pro Core-Change

1. Contract gegen diese Checkliste pruefen.
2. Doku und Migrationshinweise mitziehen.
3. `node scripts/run_xtend_tests.js architecture` ausfuehren.
4. `node scripts/verify_xtend_core_contracts.js` ausfuehren.
5. Bei RMT-kompatiblen Aenderungen `node scripts/run_xtend_tests.js rmt-compatibility --json` und `node scripts/run_xtend_tests.js references --json` ausfuehren.
