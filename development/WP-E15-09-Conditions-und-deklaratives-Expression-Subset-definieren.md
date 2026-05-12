# WP-E15-09 - Conditions und deklaratives Expression Subset definieren

- Status: `completed`
- Datum: 12. Mai 2026
- Epic: `EPIC_E15_RMT_vNext_Syntax`
- Core Contract: `xtend.rmt.core-format.vnext.v1`
- Condition Contract: `xtend.rmt.vnext-condition-contract.v1`
- Expression Contract: `xtend.rmt.vnext-expression.v1`
- Boundary: `no-rmt-kernel-import-of-host-runtime-types`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-vnext-conditions --json`
- Package Script: `npm run test:rmt-vnext-conditions`
- Zielzustand: `rmt-vnext-condition-expression-ready`

## Ziel

`WP-E15-09` haertet `when` Conditions, ohne RMT zur Programmiersprache zu machen. Core-Expressions werden gegen ein kleines deklaratives Subset validiert, Pfade werden typisiert und unzulaessige Ausdruecke erzeugen Source-map-faehige Diagnostics statt Runtime-Eval.

## Umgesetzt

- `tools/rmt-language/vnext-conditions.js` als Condition-Expression-Contract-Modul angelegt
- Contract-Schema `xtend.rmt.vnext-condition-contract.v1` eingefuehrt
- Condition-Schema `xtend.rmt.vnext-condition.v1` und Expression-Schema `xtend.rmt.vnext-expression.v1` eingefuehrt
- erlaubte Expression-Kinds `literal`, `path`, `unary`, `binary`, `logical`, `group` festgelegt
- Operatoren `==`, `!=`, `>`, `>=`, `<`, `<=`, `&&`, `||`, `!` validiert
- Default Path Catalog fuer `route`, `user`, `feature`, `settings`, `viewport` und `data` definiert
- Typinferenz fuer Literale, Pfade, Gruppen, Unary, Binary und Logical Expressions umgesetzt
- Diagnostics fuer unsupported expression kind, unsupported operator, unknown path, type mismatch, non-boolean root und missing expression umgesetzt
- Parser-negative Fixture fuer Function Calls weiterverwendet
- `tests/rmt-language/fixtures/vnext-conditions-valid.rmt` als Condition-Fixture angelegt
- `tests/rmt-language/rmt_vnext_conditions_suite.js` als Gate-Suite angelegt
- `scripts/run_xtend_tests.js` um `rmt-vnext-conditions` erweitert
- `package.json` um Export, Metadaten und Script fuer den Condition Contract erweitert
- Epic-Backlog aktualisiert: `WP-E15-09` completed, `WP-E15-12` ready

## Implementierungsentscheidung

Der Condition Contract ist eine host-neutrale Analyse-Schicht ueber dem Core-Compiler:

- `tools/rmt-language/vnext-conditions.js`

Er liest:

- `coreDocument.operations[].condition`
- `coreDocument.sourceMap[]`

Er erzeugt:

- Condition Contract Report
- normalisierte Condition Records
- normalisierte Expression Records
- Path-Ref-Listen
- Source-map-faehige Diagnostics

Er importiert keine Runtime-Module und fuehrt keine Expressions aus.

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Conditions sind deterministisch analysierbar | erfuellt: Contract normalisiert Expressions und Path Refs |
| unerlaubte Ausdruecke werden frueh diagnostiziert | erfuellt: Parser blockiert Function Calls; Contract blockiert manipulierte Core-Kinds |
| Pfade sind typisiert | erfuellt: Default Path Catalog plus explizite Erweiterung |
| Typfehler sind diagnostizierbar | erfuellt: Root-, Unary-, Logical- und Comparison-Typregeln |
| kein Runtime-Eval | erfuellt: reine Core-Analyse ohne Ausfuehrung |
| lokaler Condition-Gate vorhanden | erfuellt: `rmt-vnext-conditions` |

## Verifikation

```bash
node scripts/run_xtend_tests.js rmt-vnext-conditions --json
```

Ergebnis:

- Status: `passed`
- Suites: `1`
- Passes: `59`
- Failures: `0`
- Warnings: `0`

Zusaetzliche Regression-Gates:

```bash
node scripts/run_xtend_tests.js rmt-vnext-surfaces --json
node scripts/run_xtend_tests.js rmt-vnext-scheduler --json
node scripts/run_xtend_tests.js rmt-vnext-lifecycle --json
node scripts/run_xtend_tests.js rmt-vnext-compiler --json
node scripts/run_xtend_tests.js rmt-vnext-parser --json
node scripts/run_xtend_tests.js rmt-parser --json
node scripts/run_xtend_tests.js references --json
```

Ergebnisse:

- `rmt-vnext-surfaces`: `passed`, `74` Passes, `0` Failures, `0` Warnings
- `rmt-vnext-scheduler`: `passed`, `68` Passes, `0` Failures, `0` Warnings
- `rmt-vnext-lifecycle`: `passed`, `75` Passes, `0` Failures, `0` Warnings
- `rmt-vnext-compiler`: `passed`, `65` Passes, `0` Failures, `0` Warnings
- `rmt-vnext-parser`: `passed`, `57` Passes, `0` Failures, `0` Warnings
- `rmt-parser`: `passed`, `84` Passes, `0` Failures, `0` Warnings
- `references`: `passed`, `7472` Passes, `0` Failures, `0` Warnings
- `package.json` JSON parse: `passed`

## Handoff

`WP-E15-09` ist abgeschlossen. `WP-E15-10` kann Component Binding auf stabile Surface-, Lifecycle- und Condition-Contracts beziehen. `WP-E15-12` ist jetzt startbar, weil Conditions fuer Events, Actions und Data Sources typisiert sind.

Noch nicht Teil von `WP-E15-09`:

- Event-/Action-Execution
- Data-Source-Aufloesung
- Import-Aufloesung
- LSP-Integration
- Formatter/Snippets
- Browser-Smokes
