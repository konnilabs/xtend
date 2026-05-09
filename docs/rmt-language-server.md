# RMT Language Server und Editor Setup

- Status: produktiv vorbereitet ab `WP-E14-14`
- Contract: `xtend.rmt.editor-packaging.v1`
- Language Server: `xtend.rmt.language-server.v1`
- Snippet Catalog: `xtend.rmt.snippet-catalog.v1`
- Epic 14 Handoff: `xtend.epic14.lsp-handoff.v1`
- Primaerer Dateityp: `.rmt`
- Lokale Gates:
  - `node scripts/run_xtend_tests.js rmt-editor-packaging --json`
  - `node scripts/run_xtend_tests.js rmt-tooling-docs --json`
  - `node scripts/run_xtend_tests.js epic14-lsp-handoff --json`

## Ziel

Das RMT Tooling ist editor-agnostisch. Die fachliche Source of Truth liegt in:

- `tools/rmt-language`
- `tools/rmt-linter`
- `tools/rmt-language-server`

Editor-Packages duerfen Snippets, Syntax-Highlighting und Startbefehle fuer den LSP bereitstellen. Sie duerfen keine zweite RMT-Semantik implementieren.

## Language Server starten

Der Server spricht stdio JSON-RPC:

```bash
node tools/rmt-language-server/server.js
```

Der Server bietet aktuell:

- Diagnostics
- Completion
- Hover
- Document Symbols
- Definition
- Code Actions

Der LSP nutzt denselben Diagnosekern wie `xt rmt lint`. Editor-Integrationen sollen deshalb keine eigenen RMT-Regeln pflegen.

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

- RMT ist im aktuellen Authoring-MVP weiter JSON-basiert. Eine freundlichere DSL-Syntax ist Folgearbeit.
- `textDocument/formatting` ist geplant, aber nicht produktiv freigegeben.
- `workspace/symbol`, `textDocument/rename` und `textDocument/references` brauchen einen projektweiten Index und bleiben bewusst ausserhalb des MVP.
- Marketplace-Packaging fuer einzelne Editoren ist nicht Teil von Epic 14. Die generischen LSP-Setups bleiben der aktuelle Integrationspfad.
- Der Language Server fuehrt keine XTend-Komponenten aus, startet keinen XRouter und materialisiert kein DOM.
- `.rmt.json` bleibt lesbar, wird aber als Fallback behandelt und soll in neuen Projekten nicht der Normalpfad sein.

## Snippets

Der editor-agnostische Snippet-Katalog liegt in:

```text
tools/rmt-language/snippets/index.js
```

Das VS-Code-kompatible Exportformat liegt in:

```text
tools/rmt-language/snippets/rmt.code-snippets
```

Alle Snippets erzeugen native `.rmt` Authoring-Strukturen. `.rmt.json` bleibt nur ein Parser-/Linter-Fallback und soll in neuen Snippets nicht genutzt werden.

Wichtige Prefixes:

| Prefix | Zweck |
|--------|-------|
| `rmt-app` | minimale native App-Shell |
| `rmt-component` | XTend Component Record |
| `rmt-route` | XRouter Route Record |
| `rmt-schedule` | Schedule Policy |
| `rmt-template-dom` | sicheres `dom_descriptor` Template |
| `rmt-template-html` | `html_fragment` mit Trusted-DOM-Boundary |

## VS Code

Ein duennes Bridge-Package liegt in:

```text
tools/rmt-editor/vscode
```

Es registriert:

- Language ID `rmt`
- Dateiendung `.rmt`
- JSON-basierte TextMate-Grammatik
- RMT Snippets
- Command `XTendRMT: Show Language Server Command`

Bis ein voll gepackter VS-Code-LanguageClient freigegeben ist, kann ein generischer LSP-Client mit folgendem Befehl genutzt werden:

```json
{
  "command": "node",
  "args": ["tools/rmt-language-server/server.js"]
}
```

## JetBrains

JetBrains-IDEs koennen ueber einen generischen LSP-Client oder ein lokales File-Watcher-/External-Tool-Setup angebunden werden.

Empfohlene Werte:

- Language ID: `rmt`
- Extension: `.rmt`
- Command: `node`
- Args: `tools/rmt-language-server/server.js`

## Neovim

Minimaler `nvim-lspconfig`-kompatibler Startpunkt:

```lua
local lspconfig = require('lspconfig')
local configs = require('lspconfig.configs')

configs.xtendrmt = {
  default_config = {
    cmd = { 'node', 'tools/rmt-language-server/server.js' },
    filetypes = { 'rmt' },
    root_dir = lspconfig.util.root_pattern('package.json', '.git')
  }
}

lspconfig.xtendrmt.setup({})
```

## Helix

Beispiel fuer `languages.toml`:

```toml
[[language]]
name = "rmt"
scope = "source.rmt"
file-types = ["rmt"]
language-servers = ["xtendrmt"]

[language-server.xtendrmt]
command = "node"
args = ["tools/rmt-language-server/server.js"]
```

## Boundary

Das Editor-Packaging darf keine XTend-Komponenten ausfuehren, keinen XRouter starten und keine DOM-Seiteneffekte erzeugen. Es startet nur den LSP und stellt statische Snippets bereit.

## Verwandte Guides

- [RMT Linter und AI-Agent Repair Report](./rmt-linter.md)
- [XTendRMT Native Authoring Guide](./xtendrmt-native-authoring.md)
- [Quick Start Guide](./quick-start-guide.md)
- [Epic 14 Abschluss und LSP Handoff](../development/XTendRMT-Epic14-Abschluss-und-LSP-Handoff.md)
