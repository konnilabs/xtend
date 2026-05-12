# WP-E15-16 - Compatibility, Migration und Legacy JSON Roundtrip absichern

- Status: `completed`
- Epic: `EPIC_E15_RMT_vNext_Syntax`
- Workstream: `WS5`
- Gate: `node scripts/run_xtend_tests.js rmt-vnext-compatibility --json`

## Ergebnis

WP-E15-16 fuehrt einen Compatibility- und Migration-Adapter fuer RMT vNext ein. Der Adapter akzeptiert Legacy JSON/Core und vNext Authoring parallel, erzeugt deterministische Reports und stellt sicher, dass kompatible Legacy-Formen Warnungen statt harter Fehler erhalten.

## Artefakte

- Contract: `development/XTendRMT-vNext-Compatibility-Migration-Contract.md`
- Modul: `tools/rmt-language/vnext-compatibility.js`
- Suite: `tests/rmt-language/rmt_vnext_compatibility_suite.js`
- Package Export: `./rmt-language/vnext-compatibility`
- Package Script: `npm run test:rmt-vnext-compatibility`

## Implementierte Funktionen

- `createLegacyRoundtripReport` prueft Legacy JSON gegen parse-/normalisierbaren Roundtrip.
- `createMigrationReport` erzeugt opt-in Migration Reports fuer Legacy JSON und kompiliert vNext Authoring direkt.
- `createCompatibilityMatrix` fasst Docs-, Demo-, Test- und vNext-Fixtures zu einer Compatibility-Matrix zusammen.
- `createRmtVNextCompatibilityAdapter` kapselt die Funktionen fuer CLI, LSP und AI-Agenten.
- `serializeMigrationReport` erzeugt stabile JSON-Ausgabe mit sortierten Keys.

## Entscheidungen

- Migration ist standardmaessig `report-only`.
- Der Preview-Modus muss explizit ueber `migrationMode: "preview"` gesetzt werden.
- Legacy Roundtrip vergleicht fachliche normalisierte JSON-Repraesentation und schliesst das generierte Feld `normalization` aus.
- Legacy Domains wie `routes`, `components`, `templates` und `adapters` bleiben sichtbar und erzeugen kompatible Boundary-Warnungen.

## Definition of Done

- Migration ist opt-in und nachvollziehbar.
- Inkompatible Syntax blockiert mit praezisem Diagnostic.
- Kompatible Altformen bleiben parse- und normalisierbar.
- Docs-, Demo-App- und Test-Fixtures sind in der Compatibility Matrix enthalten.
- `WP-E15-17` ist fuer Golden Tests, Fuzzing und Browser-Smokes entblockt.
