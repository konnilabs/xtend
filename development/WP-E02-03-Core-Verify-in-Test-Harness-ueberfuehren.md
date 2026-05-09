# WP-E02-03 - Core-Verify in Test-Harness ueberfuehren

- Status: Completed
- Datum: 3. Mai 2026
- Epic: `EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren`
- Backlog: `BACKLOG-EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren`

## Ziel

Dieses Workpackage ueberfuehrt den bestehenden Epic-01-Core-Verify aus `scripts/verify_xtend_core_contracts.js` in den neuen strukturierten Test-Harness. Der alte Befehl muss weiterhin lauffaehig bleiben, waehrend die eigentlichen Core-Checks im neuen `tests/core/` Bereich auffindbar und erweiterbar werden.

## Umgesetzte Aenderungen

- `tests/core/core_contract_suite.js` als strukturierte Core-Contract-Suite angelegt
- bestehende Manifest-, Doku-, API-, Theme-, Router-, Overlay-, Feedback- und Syntax-Checks in die Suite ueberfuehrt
- `scripts/verify_xtend_core_contracts.js` als kompatiblen Legacy-Entry-Point erhalten
- `scripts/run_xtend_tests.js` so umgestellt, dass die `core` Suite direkt den strukturierten Harness ausfuehrt
- `tests/core/README.md` um den neuen Suite- und Legacy-Pfad erweitert
- `tests/README.md` auf den neuen Stand nach `WP-E02-03` aktualisiert

## Struktur nach WP-03

Der Core-Testpfad liegt nun hier:

```text
tests/
  core/
    core_contract_suite.js
    README.md
```

Die Einstiegspunkte sind:

```bash
node scripts/run_xtend_tests.js core
node scripts/verify_xtend_core_contracts.js
node tests/core/core_contract_suite.js
```

`scripts/verify_xtend_core_contracts.js` enthaelt keine eigene Kopie der Core-Checks mehr. Der Script importiert die Suite aus `tests/core/core_contract_suite.js`, gibt weiterhin den bekannten Report aus und liefert dieselben Exit-Code-Semantiken.

## Rueckwaertskompatibilitaet

Der bestehende Epic-01-Befehl bleibt gueltig:

```bash
node scripts/verify_xtend_core_contracts.js
```

Damit bleiben Dokumentation, Gewohnheit und bestehende manuelle Pruefpfade intakt. Gleichzeitig kann der neue Runner denselben Core-Testpfad nutzen:

```bash
node scripts/run_xtend_tests.js core
```

## Erweiterbarkeit

Neue Core-Checks koennen jetzt in `tests/core/core_contract_suite.js` ergaenzt werden, ohne den Legacy-Script zu kopieren oder zu vergroessern. Der naechste sinnvolle Schritt ist `WP-04`: wiederkehrende Assertion-, Fixture- und Utility-Muster aus der Suite herausloesen und fuer weitere Testbereiche nutzbar machen.

## Abgrenzung zu Folgepaketen

`WP-03` fuehrt noch keine generischen Shared Test Utilities ein. Die aktuell benoetigten Hilfsfunktionen bleiben bewusst suite-lokal in `core_contract_suite.js`.

Nachgelagert bleiben:

- `WP-04`: Contract-Assertions, Fixtures und Shared Test Utilities
- `WP-05`: Browser-Smoke-Harness fuer Custom Elements
- `WP-06`: Core-Browser-Smokes fuer Loader, API, Router, Theme und Overlays

## Betroffene Dateien

- `tests/core/core_contract_suite.js`
- `tests/core/README.md`
- `tests/README.md`
- `scripts/verify_xtend_core_contracts.js`
- `scripts/run_xtend_tests.js`
- `development/BACKLOG-EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren.md`
- `development/EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren.md`

## Verifikation

- `node --check tests/core/core_contract_suite.js`
- `node --check scripts/verify_xtend_core_contracts.js`
- `node --check scripts/run_xtend_tests.js`
- `node scripts/verify_xtend_core_contracts.js`
- `node scripts/run_xtend_tests.js core`
- `node tests/core/core_contract_suite.js`

## Ergebnis

`WP-E02-03` ist abgeschlossen. Der Core-Verify ist jetzt Teil des strukturierten Test-Harness, bleibt aber ueber den bisherigen Epic-01-Befehl rueckwaertskompatibel erreichbar.
