# WP-E15-04 - Lexer/Parser MVP fuer Templates, Surfaces, Lanes und Lifecycle Ops bauen

- Status: `completed`
- Datum: 12. Mai 2026
- Epic: `EPIC_E15_RMT_vNext_Syntax`
- Grammar Contract: `xtend.rmt.vnext.grammar.v1`
- Core Contract: `xtend.rmt.core-format.vnext.v1`
- Parser Contract: `xtend.rmt.vnext-parser.v1`
- AST Schema: `xtend.rmt.vnext.ast.v1`
- Boundary: `no-rmt-kernel-import-of-host-runtime-types`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-vnext-parser --json`
- Package Script: `npm run test:rmt-vnext-parser`
- Zielzustand: `rmt-vnext-parser-mvp-ready`

## Ziel

`WP-E15-04` baut den nativen Lexer/Parser-MVP fuer RMT vNext. Das Paket uebersetzt `.rmt` Authoring-Text in einen AST mit stabilen Node Types, Source Ranges und Diagnostics. Es kompiliert noch nicht in Core-JSON und fuehrt keine Runtime-, Import-, Adapter- oder Reference-Validation aus.

## Umgesetzt

- `tools/rmt-language/vnext-parser.js` als eigene vNext-Sprachebene angelegt
- Lexer fuer Whitespace, Newlines, Semikolons, Kommentare, Strings, Integer, Identifier, escaped Identifier, Symbole und Operatoren implementiert
- Parser fuer `RmtVNextDocument`, `RmtImportDeclaration`, `RmtTemplateDeclaration`, `RmtSurfaceDeclaration`, `RmtLaneDeclaration`, `RmtLifecycleStatement`, `RmtStreamStatement`, `RmtSourceClause`, `RmtConditionClause`, `RmtPolicyBlock`, `RmtSlotDeclaration`, `RmtEventBinding`, `RmtTrustBoundaryPolicy` und `RmtSanitizePolicy` umgesetzt
- deklaratives Condition-Subset mit Literalen, Pfaden, Klammern, `!`, Vergleich, `&&` und `||` geparst
- Funktionsaufrufe in Conditions, imperative Keywords und Top-Level-Operations diagnostiziert
- `.rmt.json` und `.json` bleiben als Fallback-Dateitypen parsebar und erzeugen Warnungen
- positive Fixtures fuer minimalen und komplexen vNext-Text angelegt
- negative Fixtures fuer imperative Syntax, Funktionsaufruf in Condition und Top-Level-Operation angelegt
- `tests/rmt-language/rmt_vnext_parser_suite.js` als Gate-Suite angelegt
- `scripts/run_xtend_tests.js` um `rmt-vnext-parser` erweitert
- `package.json` um Export, Metadaten und Script fuer den vNext-Parser erweitert
- Epic-Backlog aktualisiert: `WP-E15-04` completed, `WP-E15-05` ready

## Implementierungsentscheidung

Der vNext-Parser ist absichtlich ein neues Modul:

- `tools/rmt-language/vnext-parser.js`

Der bestehende JSON-nahe Parser bleibt:

- `tools/rmt-language/parser.js`

Damit bleibt Epic-14-Tooling fuer bestehende `.rmt` JSON-Dokumente stabil, waehrend Epic 15 die neue Authoring-Syntax additiv einfuehrt.

## AST- und Diagnostic-Oberflaeche

Der Parser liefert:

- `schema: "xtend.rmt.vnext-parser.v1"`
- `ast.schema: "xtend.rmt.vnext.ast.v1"`
- `ok`, `phase`, `status`
- `tokens`
- `diagnostics`
- `syntaxDiagnostics`
- `filePolicyDiagnostics`

Diagnosecodes:

- `rmt.vnext.syntax.error`
- `rmt.vnext.syntax.context`
- `rmt.document.extension.fallback-used`

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| MVP-Dateien koennen deterministisch geparst werden | erfuellt: Minimal- und Complex-Fixture parsen erfolgreich |
| Fehler enthalten verwertbare Positionen | erfuellt: Diagnostics enthalten Line/Column-Ranges |
| Parser bleibt host-neutral | erfuellt: kein XTend-, XRouter-, React-, Vue- oder DOM-Import |
| bestehender JSON-Parser bleibt stabil | erfuellt: vNext ist eigenes Modul |
| AST Node Types entsprechen WP-E15-03 | erfuellt |
| positive und negative Fixtures existieren | erfuellt |
| lokaler Gate ist registriert | erfuellt: `rmt-vnext-parser` |

## Verifikation

```bash
node scripts/run_xtend_tests.js rmt-vnext-parser --json
```

Ergebnis:

- Status: `passed`
- Suites: `1`
- Passes: `57`
- Failures: `0`
- Warnings: `0`

Zusaetzlicher Regression-Gate:

```bash
node scripts/run_xtend_tests.js rmt-parser --json
```

Ergebnis:

- Status: `passed`
- Suites: `1`
- Passes: `84`
- Failures: `0`
- Warnings: `0`

Referenzpfad-Gate:

```bash
node scripts/run_xtend_tests.js references --json
```

Ergebnis:

- Status: `passed`
- Suites: `1`
- Passes: `7472`
- Failures: `0`
- Warnings: `0`

## Handoff

`WP-E15-04` ist abgeschlossen. `WP-E15-05` kann den Compiler von vNext-AST zu Core-Format bauen.

Die naechste Umsetzung soll auf diesen Parser-Artefakten aufbauen:

- AST Node Types aus `tools/rmt-language/vnext-parser.js`
- Source Ranges und AST Pointer
- positive und negative Fixtures aus `tests/rmt-language/fixtures/`
- Core-Ziel aus `development/XTendRMT-vNext-Core-Format-Contract.md`

Noch nicht Teil von `WP-E15-05`:

- Runtime-Ausfuehrung
- Adapter-Validation
- LSP-Integration
- automatische Migration aller Legacy-Dokumente
