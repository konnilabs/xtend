# XTendRMT vNext Tooling Adapter Contract

- Status: `accepted by WP-E15-15`
- Datum: 12. Mai 2026
- Epic: `EPIC_E15_RMT_vNext_Syntax`
- Contract: `xtend.rmt.vnext-tooling-adapter.v1`
- Report: `xtend.rmt.vnext-tooling-report.v1`
- Formatter: `xtend.rmt.vnext-formatter.v1`
- Depends on: `xtend.rmt.core-format.vnext.v1`
- Uses: `xtend.rmt.vnext-compiler.v1`
- Boundary: `no-rmt-kernel-import-of-host-runtime-types`
- Zielzustand: `rmt-vnext-tooling-ready`
- Folgepakete: `WP-E15-16`, `WP-E15-17`

## Zweck

Contract marker:

```text
schema: "xtend.rmt.vnext-tooling-adapter.v1"
```

Der Adapter macht native vNext `.rmt` Dateien fuer die bestehende Epic-14-Tooling-Oberflaeche nutzbar. Linter, CLI, Language Server, Completion, Hover, Symbols, Definition, Formatter, Snippets und AI-Agent-Reports erhalten dieselbe host-neutrale Quelle: den vNext Compiler plus Core Source Map.

## Adapter Surface

```json
{
  "schema": "xtend.rmt.vnext-tooling-adapter.v1",
  "languageMode": "vnext",
  "graphStatus": "indexed",
  "coreSchema": "xtend.rmt.core-format.vnext.v1",
  "sourceMapSummary": {
    "totalCount": 26,
    "corePointerCount": 26,
    "astPointerCount": 26
  }
}
```

## Provider

| Provider | vNext-Faehigkeit |
|----------|------------------|
| Linter/CLI | native vNext-Dateien werden erkannt, kompiliert und mit vNext Diagnostics ausgegeben |
| LSP Diagnostics | nutzt denselben vNext Linter-Report |
| Completion | Keywords, Lanes, Data Source Kinds, Security Boundaries und Snippets |
| Hover | erklaert vNext Core-Nodes aus der Source Map |
| Document Symbols | Templates, Surfaces, Lanes, Operations, Slots, Data Sources und Security Policies |
| Definition | Core-Referenzen wie Operation zu Data Source, Lane, Surface, Template oder Policy |
| Formatter | konservative Source-erhaltende Strategie fuer Whitespace und Final Newline |
| AI-Agent Report | markiert `languageMode: "vnext"` und gibt `sourceMapSummary` aus |

## Formatter Strategy

Der MVP-Formatter ist bewusst konservativ:

- CRLF wird zu LF normalisiert.
- trailing Whitespace wird entfernt.
- mehr als zwei Leerzeilen werden kompaktiert.
- eine finale Newline wird gesetzt.
- Semantik, Reihenfolge und Authoring-Struktur bleiben unangetastet.

Ein vollstaendiger Pretty Printer bleibt ein spaeteres Tooling-Thema und blockiert nicht Parser, Compiler oder LSP.

## Gate

```bash
node scripts/run_xtend_tests.js rmt-vnext-tooling --json
```

Modul:

- `tools/rmt-language/vnext-tooling.js`

Suite:

- `tests/rmt-language/rmt_vnext_tooling_suite.js`
