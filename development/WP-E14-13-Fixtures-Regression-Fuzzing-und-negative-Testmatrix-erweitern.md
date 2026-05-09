# WP-E14-13 - Fixtures, Regression, Fuzzing und negative Testmatrix erweitern

- Status: `completed`
- Datum: 8. Mai 2026
- Epic: `EPIC-14-XTendRMT-DSL-Linter-und-Language-Server`
- Contract: `xtend.rmt.language-regression.v1`
- Matrix Schema: `xtend.rmt.language-regression-matrix.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-language-regression --json`
- Package Script: `npm run test:rmt-language-regression`
- Zielzustand: `rmt-language-regression-ready`

## Ziel

`WP-E14-13` erweitert die RMT-Tooling-Absicherung von einzelnen Provider-Gates auf eine stabile Regression-Matrix.

Die Matrix prueft nicht nur, ob ein Dokument fehlschlaegt, sondern ob die erwarteten Diagnosecodes stabil bleiben. Damit koennen Menschen, IDEs und AI-Agenten Reparaturpfade ueber Versionen hinweg zuverlaessig konsumieren.

## Umgesetzt

- `tests/rmt-language/fixtures/` als dedizierter Regression-Fixture-Ordner angelegt
- valide native `.rmt` Fixture ergaenzt
- Missing-Refs Fixture ergaenzt
- Duplicate-ID- und Duplicate-Route-Path-Fixture ergaenzt
- Syntaxfehler-Fixture ergaenzt
- `.rmt.json` Fallback-Fixture ergaenzt
- groessere native RMT-Fixture mit mehreren Routes, Components und Templates ergaenzt
- Fuzz-Mutanten fuer fehlenden Document-Kind, unbekannte Domain, invaliden Route Path, unbekannten Template Mode und unbekannte Fabric Lane ergaenzt
- CLI-Directory-Regression fuer den kompletten Fixture-Ordner umgesetzt
- LSP-Diagnostics-Regression fuer alle Matrix-Files umgesetzt
- Agent-Report-Regression fuer die komplette Matrix umgesetzt
- `tests/rmt-language/rmt_language_regression_suite.js` als Gate-Suite angelegt
- `scripts/run_xtend_tests.js` und `package.json` um `rmt-language-regression` erweitert

## Negative Testmatrix

| Fixture | Erwartete Codes |
|---------|-----------------|
| `regression-broken-syntax.rmt` | `rmt.syntax.invalid-json` |
| `regression-missing-refs.rmt` | `rmt.adapter.unknown`, `rmt.ref.component.unresolved`, `rmt.ref.template.unresolved`, `rmt.ref.schedule.unresolved` |
| `regression-duplicates.rmt` | `rmt.id.duplicate`, `rmt.ref.route.duplicate-path`, `rmt.fabric.lane.conflict` |
| `regression-legacy.rmt.json` | `rmt.document.extension.fallback-used` |

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| valide Fixtures werden weiter akzeptiert | erfuellt |
| negative Fixtures pruefen konkrete Diagnosecodes | erfuellt |
| Fuzz-Mutanten werfen nicht und liefern stabile Codes | erfuellt |
| CLI verarbeitet den Fixture-Ordner deterministisch | erfuellt |
| LSP publiziert Matrix-Diagnosen | erfuellt |
| Agent-Report kann Matrix-Reparaturen serialisieren | erfuellt |
| keine Runtime-/Netzwerkpflicht | erfuellt |

## Verifikation

```bash
node scripts/run_xtend_tests.js rmt-language-regression --json
npm run test:rmt-language-regression -- --json
```

## Handoff

`WP-E14-13` ist abgeschlossen. `WP-E14-14` kann nun Doku, Quick Start und Authoring Guides auf den neuen Tooling-Stand nachziehen.

Die Doku sollte ab jetzt `.rmt`, Linter, LSP, Snippets, Agent-Report und Regression-Gates als zusammenhaengenden Authoring-Pfad beschreiben.
