# WP-E02-02 - Testprojektstruktur und lokale Runner-Entry-Points

- Status: Completed
- Datum: 3. Mai 2026
- Epic: `EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren`
- Backlog: `BACKLOG-EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren`

## Ziel

Dieses Workpackage legt die sichtbare Projektstruktur fuer die XTend-Test-Suite an und schafft einen lokalen Runner-Entry-Point. Ziel ist ein klarer Einstieg fuer Entwickler und AI-Agenten, ohne den bestehenden Core-Verify-Pfad aus Epic 01 zu brechen oder die eigentliche Core-Testmigration aus `WP-03` vorwegzunehmen.

## Umgesetzte Aenderungen

- `tests/` als fachliche Test-Suite-Struktur angelegt
- Unterbereiche fuer Core-, Component-, Browser-, Fixture- und Utility-Tests dokumentiert
- `scripts/run_xtend_tests.js` als lokaler Test-Runner angelegt
- Runner-Suite `core` verdrahtet den bestehenden Verify-Script als ersten implementierten Testpfad
- `tests/README.md` dokumentiert lokale Befehle und die Verantwortungen der Testbereiche
- der bestehende Befehl `node scripts/verify_xtend_core_contracts.js` bleibt unveraendert gueltig

## Teststruktur

Die Suite-Struktur lautet:

```text
tests/
  README.md
  core/
    README.md
  components/
    README.md
  browser/
    README.md
  fixtures/
    README.md
  utils/
    README.md
```

Die Verzeichnisse sind bewusst ueber README-Dateien belegt, damit ihre Verantwortung im Repository sichtbar bleibt, bevor konkrete Testdateien entstehen.

## Lokale Entry-Points

Alle aktuell implementierten Suites ausfuehren:

```bash
node scripts/run_xtend_tests.js
```

Nur Core-Contract-Suite ausfuehren:

```bash
node scripts/run_xtend_tests.js core
```

Verfuegbare Suites anzeigen:

```bash
node scripts/run_xtend_tests.js --list
```

Legacy-Core-Verify direkt ausfuehren:

```bash
node scripts/verify_xtend_core_contracts.js
```

## Abgrenzung zu Folgepaketen

`WP-02` fuehrt noch keine neue Assertion-Utility, keine Browser-Toolchain und keine Component-Level-Tests ein.

Bewusst nachgelagert bleiben:

- `WP-03`: Core-Verify in den strukturierten Harness ueberfuehren
- `WP-04`: Shared Assertions, Fixtures und Test Utilities definieren
- `WP-05`: Browser-Smoke-Harness fuer Custom Elements einfuehren
- `WP-07`: Component-Level-Teststandard definieren

## Betroffene Dateien

- `scripts/run_xtend_tests.js`
- `tests/README.md`
- `tests/core/README.md`
- `tests/components/README.md`
- `tests/browser/README.md`
- `tests/fixtures/README.md`
- `tests/utils/README.md`
- `development/BACKLOG-EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren.md`
- `development/EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren.md`

## Verifikation

- `node --check scripts/run_xtend_tests.js`
- `node scripts/run_xtend_tests.js --list`
- `node scripts/run_xtend_tests.js core`
- `node scripts/verify_xtend_core_contracts.js`

## Ergebnis

`WP-E02-02` ist abgeschlossen. XTend besitzt jetzt eine sichtbare Test-Suite-Struktur und einen lokalen Runner-Entry-Point. Der erste Runner-Pfad delegiert kontrolliert an den bestehenden Core-Verify-Script, bis `WP-03` diesen Pfad in den strukturierten Harness ueberfuehrt.
