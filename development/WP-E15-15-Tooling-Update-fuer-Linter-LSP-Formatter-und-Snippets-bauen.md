# WP-E15-15 - Tooling Update fuer Linter, LSP, Formatter und Snippets bauen

- Status: `completed`
- Datum: 12. Mai 2026
- Epic: `EPIC_E15_RMT_vNext_Syntax`
- Workstream: `WS5`
- Prioritaet: `P1`
- Gate: `node scripts/run_xtend_tests.js rmt-vnext-tooling --json`
- Contract: `xtend.rmt.vnext-tooling-adapter.v1`

## Ziel

WP-E15-15 erweitert die Epic-14-Tooling-Schicht so, dass native vNext `.rmt` Dateien nicht mehr als JSON-Fehler behandelt werden. Linter, CLI, Language Server und AI-Agent-Reports nutzen den vNext Compiler und dessen Source Maps.

## Umgesetzte Artefakte

- `tools/rmt-language/vnext-tooling.js`
  - vNext-faehige RMT-Language-Schicht
  - vNext Source-Erkennung
  - Compiler-basierte Analyse
  - Linter-Report fuer native vNext-Dateien
  - Completion fuer Keywords, Lanes, Data Sources, Security und Snippets
  - Hover, Document Symbols und Definition Provider fuer vNext Core-Nodes
  - konservativer Formatter
  - Source-Map-Summary fuer AI-Agent-Reports
- `tools/rmt-language/diagnostics.js`
  - Parser-Adapter fuer vNext im generischen `lintRmtSource`
- `tools/rmt-language-server/server.js`
  - vNext-Modus im LSP Analysecache
  - vNext Diagnostics, Completion, Hover, Symbols und Definition
- `tools/rmt-linter/reporter.js`
  - Agent Reports mit `languageMode: "vnext"` und `sourceMapSummary`
- `tools/rmt-language/snippets/`
  - vNext Template-, Stream- und Event-Action-Snippets
- `tests/rmt-language/rmt_vnext_tooling_suite.js`
- `development/XTendRMT-vNext-Tooling-Adapter-Contract.md`

## Contract-Entscheidungen

- Legacy JSON-nahe `.rmt` Dateien bleiben im bestehenden Semantic-Graph-/Format-Adapter-Pfad.
- Native vNext Dateien werden anhand der Authoring-Syntax erkannt und ueber den vNext Compiler analysiert.
- LSP Provider verwenden fuer vNext keine JSON Pointer aus dem Source Text, sondern Core Pointer aus der vNext Source Map.
- Der Formatter ist im MVP bewusst Source-erhaltend und veraendert keine Syntaxstruktur.
- Code Actions bleiben fuer vNext vorerst leer, damit keine unsicheren Source-Rewrites entstehen.

## Definition of Done

- IDE-Feedback funktioniert fuer vNext-Dateien.
- bestehende Epic-14-Funktionen bleiben fuer Legacy-Dokumente nutzbar.
- `package.json` exportiert `./rmt-language/vnext-tooling` und `npm run test:rmt-vnext-tooling`.
- `scripts/run_xtend_tests.js` kennt `rmt-vnext-tooling`.
- Der Gate prueft Linter, CLI, LSP, Completion, Hover, Symbols, Definition, Formatter, Snippets, Agent-Source-Map-Reports und Legacy-Regression.

## Gate-Ergebnis

Bestanden:

```bash
node scripts/run_xtend_tests.js rmt-vnext-tooling --json
```

- Ergebnis: `passed`
- Checks: `60`
- Suiten: `1`
