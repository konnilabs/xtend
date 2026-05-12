# WP-E16-09: Tooling, LSP, Snippets und Agent Reports fuer Enterprise-MFE erweitern

- Status: `completed`
- Epic: `EPIC_E16_RMT_Remote_Surfaces_and_Surface_Registry.md`
- Gate: `node scripts/run_xtend_tests.js rmt-vnext-remote-tooling --json`

## Ergebnis

WP-E16-09 macht Remote Surface Authoring fuer Entwickler sichtbar, reparierbar
und reviewbar. Die Tooling-Schicht nutzt den WP-E16-08 Remote Compiler als
Source of Truth und fuegt Lint-Regeln, LSP-kompatible Providerdaten, Snippets und
Agent Reports hinzu.

## Implementierung

- Remote Tooling: `tools/rmt-language/vnext-remote-tooling.js`
  - Analyse ueber `compileRmtVNextRemoteSource()`.
  - Linter-Regeln fuer Owner, Version, Integrity, Fallback, Event Direction und
    Payload Schema.
  - Reparaturhinweise als Snippet-basierte Handoffs.
  - Completion-, Hover- und Document-Symbol-Provider fuer Remote Surfaces,
    Shell Targets und Cross Surface Events.
  - Agent Report fuer Registry-, Security- und Degradation-Status.
- Snippets:
  - `rmt-vnext-remote-surface`
  - `rmt-vnext-remote-event`
  - `rmt-vnext-remote-fallback`
  - `rmt-vnext-remote-degradation`

## Nachweis

- Valid Fixture: `tests/rmt-language/fixtures/vnext-remote-compiler-valid.rmt`
- Negative Fixture: `tests/rmt-language/fixtures/vnext-remote-tooling-invalid.rmt`
- Suite: `tests/rmt-language/rmt_vnext_remote_tooling_suite.js`

`WP-E16-09` ist abgeschlossen. `WP-E16-10` und `WP-E16-11` sind startbar.
