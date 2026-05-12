# WP-E15-11 - Imports, Module Resolution und Package Boundaries implementieren

- Status: `completed`
- Datum: 12. Mai 2026
- Epic: `EPIC_E15_RMT_vNext_Syntax`
- Workstream: `WS3`
- Prioritaet: `P1`
- Gate: `node scripts/run_xtend_tests.js rmt-vnext-imports --json`
- Contract: `xtend.rmt.vnext-import-resolver.v1`

## Ziel

WP-E15-11 macht RMT-vNext-Dateien modular, ohne dynamische Codeausfuehrung einzufuehren. Der Resolver erzeugt einen stabilen Module Graph fuer CLI, Bundler und LSP.

## Umgesetzte Artefakte

- `tools/rmt-language/vnext-import-resolver.js`
  - Import Resolver Contract
  - Module Graph Snapshot
  - Module Records und Import Edges
  - Package Root Boundary Validation
  - Cycle Diagnostics
  - deterministische Load- und Merge-Reihenfolge
- `tests/rmt-language/rmt_vnext_import_resolver_suite.js`
  - gueltige lokale Dateiimporte
  - erlaubte Glob-Formen
  - Nested Imports
  - fehlende Dateien
  - Package Boundary Violations
  - Import-Zyklen
  - unsupported Globs
- Fixture-Familien:
  - `tests/rmt-language/fixtures/vnext-modules/`
  - `tests/rmt-language/fixtures/vnext-modules-cycle/`
  - `tests/rmt-language/fixtures/vnext-modules-missing/`
  - `tests/rmt-language/fixtures/vnext-modules-boundary/`
  - `tests/rmt-language/fixtures/vnext-modules-invalid-glob/`
- `development/XTendRMT-vNext-Import-Resolver-Contract.md`

## Contract-Entscheidungen

- Nur relative `.rmt`-Dateien sind im MVP aufloesbar.
- Erlaubte Glob-Formen sind `./dir/*.rmt` und `./dir/**/*.rmt`.
- Glob-Ergebnisse werden stabil nach POSIX-Pfad sortiert.
- Module Loading folgt Authoring-Reihenfolge.
- Merge-Order ist `dependency-first-postorder`.
- Package Roots sind harte Grenzen.
- Zyklen sind Diagnosefaelle und werden nicht automatisch entknotet.

## Definition of Done

- Imports sind statisch analysierbar.
- Bundler, CLI und LSP koennen denselben Module Graph Contract nutzen.
- `package.json` exportiert `./rmt-language/vnext-import-resolver` und `npm run test:rmt-vnext-imports`.
- `scripts/run_xtend_tests.js` kennt `rmt-vnext-imports`.
- Der Gate validiert stabile Aufloesungs- und Merge-Reihenfolgen.

## Gate-Ergebnis

Bestanden:

```bash
node scripts/run_xtend_tests.js rmt-vnext-imports --json
```

- Ergebnis: `passed`
- Checks: `56`
- Suiten: `1`
