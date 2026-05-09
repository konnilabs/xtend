# WP-E02-09 - Accessibility- und Hydration-Checks aufbauen

- Status: completed
- Datum: 4. Mai 2026
- Epic: `development/EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren.md`
- Backlog: `development/BACKLOG-EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren.md`
- Bezug:
  - `development/XTend-Accessibility-Hydration-Testregeln.md`
  - `development/XTend-Component-Level-Teststandard.md`
  - `compliance/xtend-design-guidelines.md`
  - `tests/components/accessibility_hydration_suite.js`
  - `tests/browser/browser_smoke_suite.js`
  - `scripts/run_xtend_tests.js`

## Ziel

`WP-E02-09` verankert Accessibility und Hydration als eigene Qualitaetsbarriere im lokalen XTend-Test-Harness. Die bestehenden Component-Piloten aus `WP-E02-08` bleiben fachliche Component-Suites; der neue Gate prueft zusaetzlich Mindestkriterien, die ueber einzelne Komponenten hinaus als Standard fuer sichtbare Runtime-Komponenten gelten.

## Umgesetzter Scope

- ARIA-Rollen und zentrale `aria-*` Attribute fuer Feedback- und Overlay-Komponenten
- Fokusziele, sichtbare Fokuszustaende und Fokus-Rueckgabe fuer Overlays
- Tastaturpfade fuer `Escape` und `Tab`
- `prefers-reduced-motion` als Pflichtpfad fuer animierte Komponenten
- Hydration ueber `connectedCallback`
- Rehydration ueber `attributeChangedCallback`
- Cleanup ueber `disconnectedCallback`
- Timer-, Listener- und `xstate`-Subscription-Bereinigung
- sichtbare Aktivierung und State-Sync in Browser-Fixtures
- repo-lokale Imports fuer Component-Fixtures

## Zielartefakte

- `development/XTend-Accessibility-Hydration-Testregeln.md`
  - beschreibt A11y-Regeln `A1` bis `A6`
  - beschreibt Hydration-Regeln `H1` bis `H5`
  - legt automatisierte und Review-Gates fest
- `tests/components/accessibility_hydration_suite.js`
  - prueft `x-alert`, `x-toast`, `x-modal` und `x-dialog`
  - prueft Component-Fixtures fuer lokale Imports und Ergebnisobjekte
  - prueft Browser-Smoke-Fixtures fuer sichtbare Aktivierung und Hydration
- `scripts/run_xtend_tests.js`
  - stellt den neuen Runner-Einstieg `a11y-hydration` bereit
- Dokumentation in `tests/README.md`, `tests/components/README.md` und `development/XTend-Component-Level-Teststandard.md`

## Implementierungsnotizen

Die neue Suite ist bewusst statisch und fixture-contract-basiert. Sie soll als schneller lokaler Gate funktionieren und keine externe Browser-Automation erzwingen. Browsernahe Ausfuehrung bleibt weiterhin ueber den bestehenden `browser`-Harness moeglich; Safari-WebDriver bleibt optional, weil der Lauf von lokalen OS-/Browser-Faktoren abhaengt.

`x-dialog` wurde aufgenommen, obwohl es in `WP-E02-08` noch keine eigene Component-Pilot-Suite erhalten hat. Grund: Dialog und Modal bilden gemeinsam den priorisierten Overlay-Contract; die Accessibility- und Hydration-Mindestregeln muessen fuer beide gelten.

## Lokaler Testpfad

Einzelner Gate:

```bash
node scripts/run_xtend_tests.js a11y-hydration
```

Gesamtsuite:

```bash
node scripts/run_xtend_tests.js
```

Rueckwaertskompatibler Core-Verify:

```bash
node scripts/verify_xtend_core_contracts.js
```

## Definition of Done

- Accessibility-Mindestkriterien sind als Test- und Review-Regeln dokumentiert
- A11y-/Hydration-Gate ist ueber den lokalen Runner ausfuehrbar
- relevante Core-Komponenten respektieren die definierten Mindestchecks
- Hydration wird reproduzierbar gegen Component- und Browser-Fixtures geprueft
- keine externe Browser-Abhaengigkeit ist fuer den Default-Lauf erforderlich

## Abschluss

`WP-E02-09` ist abgeschlossen. Der naechste fachlich sinnvolle Schritt ist `WP-E02-10`, damit SSOT, Digital Twin Principle und Anti-Technical-Debt-Regeln ebenfalls als explizite Gates operationalisiert werden.
