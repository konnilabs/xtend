# WP-E02-04 - Contract-Assertions, Fixtures und Shared Test Utilities

- Status: Completed
- Datum: 3. Mai 2026
- Epic: `EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren`
- Backlog: `BACKLOG-EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren`

## Ziel

Dieses Workpackage schafft gemeinsame Test-Hilfen fuer Contract-, Manifest-, Event-, State- und spaetere DOM-nahe Pruefungen. Die Core-Suite soll nicht mehr eigene Assertion-, Datei- und Prozesshelfer mitbringen, sondern die ersten wiederverwendbaren Utilities aus `tests/utils/` verwenden.

## Umgesetzte Aenderungen

- `tests/utils/assertions.js` fuer Suite-Kontexte, Pass/Fail-Sammlung und Report-Ausgabe angelegt
- `tests/utils/files.js` fuer repository-relative Text-/JSON-Ladepfade und Temp-Dateipfade angelegt
- `tests/utils/process.js` fuer prozessnahe Checks, aktuell JavaScript-Syntaxchecks, angelegt
- `tests/fixtures/fixtures.md` als Fixture-Konvention dokumentiert
- `tests/utils/README.md` und `tests/fixtures/README.md` aktualisiert
- `tests/core/core_contract_suite.js` auf die Shared Utilities umgestellt

## Utility-Verantwortung

### `tests/utils/assertions.js`

- erzeugt Suite-Kontexte
- sammelt erfolgreiche und fehlgeschlagene Assertions
- stellt `assert` und `assertIncludes` bereit
- druckt konsistente Reports

### `tests/utils/files.js`

- loest repo-relative Pfade auf
- liest Textdateien und JSON-Dateien
- erzeugt sichere Temp-Dateipfade fuer Check-Kopien

### `tests/utils/process.js`

- kapselt prozessnahe Tests
- nutzt `process.execPath` fuer Node-Aufrufe
- fuehrt aktuell `node --check` gegen Temp-Kopien aus

## Fixture-Konvention

Fixtures liegen unter `tests/fixtures/` und duerfen nicht von produktivem Runtime-Code importiert werden.

Regeln:

- klein und explizit halten
- nach Contract oder Verhalten benennen
- Legacy-Verhalten als solches dokumentieren
- generierte oder temporaere Dateien ausserhalb von `tests/fixtures/` halten

## Abgrenzung zu Folgepaketen

`WP-04` schafft bewusst nur die erste Utility-Schicht. Noch nicht enthalten sind:

- DOM-/Custom-Element-Helfer
- Browser-Runner-Helfer
- Accessibility-Helfer
- Component-Level-Fixture-Generatoren

Diese Erweiterungen gehoeren in `WP-05`, `WP-07`, `WP-08` und `WP-09`.

## Betroffene Dateien

- `tests/utils/assertions.js`
- `tests/utils/files.js`
- `tests/utils/process.js`
- `tests/utils/README.md`
- `tests/fixtures/fixtures.md`
- `tests/fixtures/README.md`
- `tests/core/core_contract_suite.js`
- `development/BACKLOG-EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren.md`
- `development/EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren.md`

## Verifikation

- `node --check tests/utils/assertions.js`
- `node --check tests/utils/files.js`
- `node --check tests/utils/process.js`
- `node --check tests/core/core_contract_suite.js`
- `node tests/core/core_contract_suite.js`
- `node scripts/run_xtend_tests.js core`
- `node scripts/verify_xtend_core_contracts.js`

## Ergebnis

`WP-E02-04` ist abgeschlossen. Wiederkehrende Assertion-, Datei- und Prozessmuster sind zentralisiert, die Core-Suite nutzt diese Utilities bereits, und weitere Testbereiche koennen darauf aufbauen, ohne versteckte globale Voraussetzungen einzufuehren.
