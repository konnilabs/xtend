# XTendRMT Epic 14 Abschluss und LSP Handoff

- Status: Accepted
- Datum: 8. Mai 2026
- Workpackage: `WP-E14-16`
- Contract: `xtend.epic14.lsp-handoff.v1`
- Report Contract: `xtend.epic14.lsp-handoff-report.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js epic14-lsp-handoff --json`
- Package Script: `npm run test:epic14-lsp-handoff`
- Zielzustand: `rmt-authoring-tooling-ready`
- Boundary: `no-rmt-kernel-import-of-xtend-types`

## Abschlussbewertung

Epic 14 ist fachlich abgeschlossen. RMT besitzt jetzt ein natives, repo-lokales und netzwerkfreies Authoring-Tooling-Fundament:

- `.rmt` Source Model mit Range Mapping
- Parser- und Format-Adapter auf Basis von `createRmtFormat`
- Semantic Graph fuer Domains, IDs und Referenzen
- Linter Rule Engine mit stabilen Diagnosecodes, Severity und Repair-Hints
- CLI `xt rmt lint` mit Text-, JSON- und Agent-Report
- Completion, Hover, Document Symbols, Definition und Code Actions
- stdio-basierter RMT Language Server
- Snippet Catalog und duenne Editor-Packaging-Schicht
- Regression Matrix inklusive defekter, grosser und Legacy-Fixtures
- Release-Gates und Package-Metadaten fuer RMT Tooling

Die zentrale Architekturentscheidung bleibt intakt: Das Tooling darf RMT lesen, analysieren und reparaturfreundliche Hinweise erzeugen, importiert aber keine XTend Runtime, startet keinen XRouter und materialisiert kein DOM.

## LSP Capability Matrix

| Capability | Protokoll / Oberflaeche | Status | Source of Truth | Gate |
|------------|--------------------------|--------|-----------------|------|
| Diagnostics | `textDocument/publishDiagnostics` | implemented | `xtend.rmt.linter.rule-engine.v1` | `rmt-linter-rules` |
| Completion | `textDocument/completion` | implemented | `xtend.rmt.completion-provider.v1` | `rmt-completions` |
| Hover | `textDocument/hover` | implemented | `xtend.rmt.hover-provider.v1` | `rmt-navigation` |
| Document Symbols | `textDocument/documentSymbol` | implemented | `xtend.rmt.document-symbols-provider.v1` | `rmt-navigation` |
| Definition | `textDocument/definition` | implemented | `xtend.rmt.definition-provider.v1` | `rmt-navigation` |
| Code Actions | `textDocument/codeAction` | implemented | `xtend.rmt.code-action-provider.v1` | `rmt-code-actions` |
| Agent Repair Report | `xt rmt lint --agent` | implemented | `xtend.rmt.ai-agent-repair-report.v1` | `rmt-agent-report` |
| Snippets | Editor Packaging | implemented | `xtend.rmt.snippet-catalog.v1` | `rmt-editor-packaging` |
| Workspace Symbols | `workspace/symbol` | planned | Project Index Follow-up | future |
| Rename | `textDocument/rename` | planned | Safe Refactor Follow-up | future |
| References | `textDocument/references` | planned | Project Index Follow-up | future |
| Semantic Tokens | `textDocument/semanticTokens` | planned | Syntax Highlighting Follow-up | future |
| Formatting | `textDocument/formatting` | planned | Formatter Follow-up | future |

## Known Limitations

| Limitierung | Status | Folgepfad |
|-------------|--------|-----------|
| RMT ist im MVP weiter JSON-basiert | accepted-for-mvp | freundlichere RMT DSL Syntax |
| Formatter ist nicht produktiv freigegeben | planned | RMT Formatter und Writer API |
| Index ist im Kern dateilokal | accepted-for-mvp | Workspace Project Index |
| Editor-Marktplatzpakete sind noch nicht produktiv gepackt | planned | VS Code / JetBrains / Neovim / Helix Distribution |
| Tooling fuehrt keine Runtime aus | intentional-boundary | kein Follow-up, bleibt Architekturgrenze |
| `.rmt.json` bleibt lesbarer Legacy-Fallback | warning-only | Migration Assist / Quick Fixes |

## Akzeptierte Contracts

- `xtend.rmt.source-model.v1`
- `xtend.rmt.parser.v1`
- `xtend.rmt.format-adapter.v1`
- `xtend.rmt.semantic-graph.v1`
- `xtend.rmt.linter.rule-engine.v1`
- `xtend.rmt.linter.cli.v1`
- `xtend.rmt.completion-provider.v1`
- `xtend.rmt.navigation-provider.v1`
- `xtend.rmt.language-server.v1`
- `xtend.rmt.code-action-provider.v1`
- `xtend.rmt.ai-agent-repair-report.v1`
- `xtend.rmt.editor-packaging.v1`
- `xtend.rmt.language-regression.v1`
- `xtend.rmt.tooling-docs.v1`
- `xtend.epic14.rmt-tooling.v1`

## Gates

```bash
npm run test:pr:rmt
npm run test:rmt-tooling
node scripts/run_xtend_tests.js epic14-lsp-handoff --json
node scripts/run_xtend_tests.js rmt-source-model rmt-parser rmt-semantic-graph rmt-linter-rules rmt-linter-cli rmt-completions rmt-navigation rmt-language-server rmt-code-actions rmt-agent-report rmt-editor-packaging rmt-language-regression rmt-tooling-docs epic14-rmt-tooling epic14-lsp-handoff --json
```

## Upstream Handoff

Der naechste Entwicklungsschritt sollte kein weiteres RMT-MVP-Tooling bauen, sondern die Sprache selbst ausbauen. Sinnvolle Folge-Epic-Kandidaten:

### RMT DSL Syntax, Formatter und Writer API

Ziel: RMT von JSON-kompatiblem Authoring zu einer lesbareren DSL mit stabiler Formatierung weiterentwickeln.

Scope:

- konkrete DSL-Grammatik oder sanfte Syntax-Erweiterungen
- Formatter und Writer API
- Migration von JSON-kompatiblen `.rmt` Dokumenten in die neue Syntax
- Format-preserving Edits fuer LSP Code Actions

### RMT Project Index, Rename und References

Ziel: Workspace-weite Navigation, Rename, References und Symbolsuche aufbauen.

Scope:

- projektweiter Symbolindex
- `workspace/symbol`
- `textDocument/references`
- `textDocument/rename`
- sichere Multi-File-Edits

### Editor Packages und Marketplace Distribution

Ziel: generische LSP-Anbindung in installierbare Editor-Pakete ueberfuehren.

Scope:

- VS Code Language Client Packaging
- JetBrains/Neovim/Helix Setup-Artefakte
- Versionierungs- und Release-Policy fuer Editor-Packages
- lokale Installations- und Smoke-Gates

## Abschlussentscheidung

RMT Tooling ist als naechste Produktreifestufe akzeptiert. Ein Folge-Epic fuer Formatter, DSL-Syntax und Project Index kann sauber geplant werden, ohne den bestehenden Linter, den Language Server oder den RMT Kernel komplex refactoren zu muessen.
