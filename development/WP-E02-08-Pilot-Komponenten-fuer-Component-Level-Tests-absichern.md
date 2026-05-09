# WP-E02-08 - Pilot-Komponenten fuer Component-Level-Tests absichern

- Status: Completed
- Datum: 4. Mai 2026
- Epic: `EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren`
- Backlog: `BACKLOG-EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren`

## Ziel

Dieses Workpackage setzt den in `WP-E02-07` definierten Component-Level-Teststandard erstmals praktisch um. Ziel ist ein Pilot-Set, das unterschiedliche Komponentenprofile abdeckt und als Vorlage fuer weitere XTend-Komponenten dient.

## Umgesetzter Abschluss

- `tests/components/component_contract_helpers.js` als gemeinsame Hilfsschicht fuer Component-Level-Contract-Suites angelegt
- `tests/components/component_suite.js` als Aggregator fuer den lokalen Runner angelegt
- `tests/components/xalert.component_suite.js` fuer `x-alert` angelegt
- `tests/components/xtoast.component_suite.js` fuer `x-toast` angelegt
- `tests/components/xmodal.component_suite.js` fuer `x-modal` angelegt
- `tests/components/fixtures/xalert.component.html` als lokale Component-Fixture angelegt
- `tests/components/fixtures/xtoast.component.html` als lokale Component-Fixture angelegt
- `tests/components/fixtures/xmodal.component.html` als lokale Component-Fixture angelegt
- `scripts/run_xtend_tests.js` um die Suite `components` erweitert
- Test-Dokumentation fuer Component-Level-Entry-Point und Pilot-Suites aktualisiert

## Pilot-Auswahl

Die Pilot-Komponenten decken bewusst unterschiedliche Profile aus dem Component-Level-Teststandard ab:

| Komponente | Profile | Abgedeckte Schwerpunkte |
|------------|---------|-------------------------|
| `x-alert` | `feedback`, `stateful` | Attribute, Slot, Events, `xstate`, Accessibility, Hydration |
| `x-toast` | `feedback`, `interactive` | Attribute, Slot, Events, Dismissal, Accessibility, Reduced Motion |
| `x-modal` | `overlay`, `stateful`, `accessibility` | Open-State, Slots, Actions, Events, Fokus, Escape, `xstate` |

`x-button` und `x-router` bleiben als Erweiterungskandidaten fuer spaetere Component-Level-Ausbaupakete erhalten.

## Lokale Entry-Points

Nur Component-Level-Pilot-Suites:

```bash
node scripts/run_xtend_tests.js components
```

Vollstaendige Suite:

```bash
node scripts/run_xtend_tests.js
```

Einzelne Pilot-Suites:

```bash
node tests/components/xalert.component_suite.js
node tests/components/xtoast.component_suite.js
node tests/components/xmodal.component_suite.js
```

## Abnahme

Die Component-Level-Pilot-Suites pruefen fuer jede Pilot-Komponente:

- Manifest- und Source-Contract
- Syntaxcheck
- Custom-Element-Registrierung
- lokale Fixture ohne CDN-Abhaengigkeit
- dokumentierte Attribute
- Slot- oder DOM-Vertrag
- dokumentierte Custom Events
- Accessibility-Mindestvertrag
- State-Sync oder bewusst dokumentierte State-Abgrenzung
- Hydration-/Lifecycle-Fragmente wie Attributwechsel, Timer, Unsubscribe oder Focus-Management
- Abgleich mit der Komponentendokumentation

## Abgrenzung zu Folgepaketen

`WP-08` etabliert Pilot-Component-Suites. Noch nicht enthalten sind:

- breite Accessibility- und Hydration-Automation fuer den gesamten Komponenten-Katalog (`WP-09`)
- SSOT-/Digital-Twin-Gates als automatisierte Querschnittsregeln (`WP-10`)
- Doku-/Demo-Referenzpfade (`WP-11`)
- Testpflicht und Scaffold-Anschluss als verbindlicher Workflow (`WP-13`)

## Betroffene Dateien

- `tests/components/component_contract_helpers.js`
- `tests/components/component_suite.js`
- `tests/components/xalert.component_suite.js`
- `tests/components/xtoast.component_suite.js`
- `tests/components/xmodal.component_suite.js`
- `tests/components/fixtures/xalert.component.html`
- `tests/components/fixtures/xtoast.component.html`
- `tests/components/fixtures/xmodal.component.html`
- `tests/components/README.md`
- `tests/README.md`
- `scripts/run_xtend_tests.js`
- `development/BACKLOG-EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren.md`
- `development/EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren.md`
- `development/XTend-Component-Level-Teststandard.md`

## Verifikation

Erfolgreich:

- `node --check tests/components/component_contract_helpers.js`
- `node --check tests/components/component_suite.js`
- `node --check tests/components/xalert.component_suite.js`
- `node --check tests/components/xtoast.component_suite.js`
- `node --check tests/components/xmodal.component_suite.js`
- `node --check scripts/run_xtend_tests.js`
- `node tests/components/component_suite.js`
- `node tests/components/xalert.component_suite.js`
- `node tests/components/xtoast.component_suite.js`
- `node tests/components/xmodal.component_suite.js`
- `node scripts/run_xtend_tests.js components`
- `node scripts/run_xtend_tests.js`
- `node scripts/verify_xtend_core_contracts.js`

## Ergebnis

`WP-E02-08` ist abgeschlossen. XTend besitzt jetzt die ersten drei Component-Level-Pilot-Suites nach dem neuen Standard, und der lokale Test-Runner kann sie als eigene Suite ausfuehren.
