# WP-E14-09 - LSP Server MVP ueber stdio bereitstellen

- Status: `completed`
- Datum: 8. Mai 2026
- Epic: `EPIC-14-XTendRMT-DSL-Linter-und-Language-Server`
- Contract: `xtend.rmt.language-server.v1`
- Protocol Contract: `xtend.rmt.language-server.protocol.v1`
- Report Schema: `xtend.rmt.language-server-report.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-language-server --json`
- Package Script: `npm run test:rmt-language-server`
- Zielzustand: `rmt-lsp-mvp-ready`

## Ziel

`WP-E14-09` stellt den ersten editor-agnostischen RMT Language Server bereit.

Der Server spricht JSON-RPC/LSP ueber stdio, verwaltet Dirty Documents und adaptiert die bereits vorhandenen Sprachprovider:

- Diagnostics aus `xtend.rmt.linter.rule-engine.v1`
- Completion aus `xtend.rmt.completion-provider.v1`
- Hover aus `xtend.rmt.hover-provider.v1`
- Document Symbols aus `xtend.rmt.document-symbols-provider.v1`
- Definition aus `xtend.rmt.definition-provider.v1`

## Umgesetzt

- `tools/rmt-language-server/protocol.js` angelegt
- `tools/rmt-language-server/server.js` angelegt
- LSP Framing mit `Content-Length` Header implementiert
- JSON-RPC Responses, Errors und Notifications implementiert
- `initialize` mit Capability Matrix implementiert
- Full Document Sync umgesetzt:
  - `textDocument/didOpen`
  - `textDocument/didChange`
  - `textDocument/didClose`
- `textDocument/publishDiagnostics` ueber den bestehenden RMT-Linter umgesetzt
- `textDocument/completion` auf `getRmtCompletions(...)` gemappt
- `textDocument/hover` auf `getRmtHover(...)` gemappt
- `textDocument/documentSymbol` auf `getRmtDocumentSymbols(...)` gemappt
- `textDocument/definition` auf `getRmtDefinition(...)` gemappt
- Position-zu-JSON-Pointer Mapping ueber Source Model Ranges umgesetzt
- Protokoll-Harness fuer Tests ohne echten Editor bereitgestellt
- `tests/rmt-language/rmt_language_server_suite.js` als Gate-Suite angelegt
- `scripts/run_xtend_tests.js` und `package.json` um `rmt-language-server` erweitert

## Architekturentscheidung

Der Language Server enthaelt keine eigene RMT-Fachsemantik.

Er ist eine Transport- und Workspace-Schicht:

- stdio JSON-RPC
- Dokument-Snapshots
- Position-zu-Pointer Mapping
- LSP-Response Mapping

Alle fachlichen Antworten kommen aus `tools/rmt-language`. Dadurch bleiben CLI, Linter, Completion und LSP auf derselben Wahrheit.

Code Actions sind im MVP bewusst deaktiviert. `codeActionProvider: false` bleibt sichtbar, bis `WP-E14-10` sichere Quick Fixes bereitstellt.

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Server funktioniert ueber stdio JSON-RPC Framing | erfuellt |
| `initialize` liefert stabile Capabilities | erfuellt |
| Dirty Documents koennen geoeffnet, geaendert und geschlossen werden | erfuellt |
| Diagnostics werden als LSP Diagnostics publiziert | erfuellt |
| Completion, Hover, Document Symbols und Definition werden auf bestehende Provider gemappt | erfuellt |
| Tests koennen LSP Requests ohne echten Editor ausfuehren | erfuellt |
| keine neue RMT-Semantik im Server | erfuellt |

## Verifikation

```bash
node scripts/run_xtend_tests.js rmt-language-server --json
npm run test:rmt-language-server -- --json
```

## Handoff

`WP-E14-09` ist abgeschlossen. `WP-E14-10` kann nun Code Actions und Quick Fixes auf denselben Diagnose- und Repair-Hint-Contracts aufbauen.

Die naechste Schicht soll den LSP Server erweitern, aber die Fix-Logik in `tools/rmt-language/code-actions.js` halten.
