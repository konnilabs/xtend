# RMT Language Server and Editor Setup

- Status: productively prepared since `WP-E14-14`
- Contract: `xtend.rmt.editor-packaging.v1`
- Language Server: `xtend.rmt.language-server.v1`
- Snippet Catalog: `xtend.rmt.snippet-catalog.v1`
- Epic 14 Handoff: `xtend.epic14.lsp-handoff.v1`
- Primary file type: `.rmt`
- Local gates:
  - `node scripts/run_xtend_tests.js rmt-editor-packaging --json`
  - `node scripts/run_xtend_tests.js rmt-tooling-docs --json`
  - `node scripts/run_xtend_tests.js epic14-lsp-handoff --json`

## Goal

RMT tooling is editor-agnostic. The domain source of truth lives in:

- `tools/rmt-language`
- `tools/rmt-linter`
- `tools/rmt-language-server`

Editor packages may provide snippets, syntax highlighting, and launch commands
for the LSP. They must not implement a second RMT semantics layer.

## Start the Language Server

The server speaks stdio JSON-RPC:

```bash
node tools/rmt-language-server/server.js
```

The server currently provides:

- Diagnostics
- Completion
- Hover
- Document Symbols
- Definition
- Code Actions

The LSP uses the same diagnostic core as `xt rmt lint`. Editor integrations
should therefore not maintain their own RMT rules.

## LSP Capability Matrix

| Capability | Protocol / Surface | Status | Source of Truth | Gate |
|------------|--------------------|--------|-----------------|------|
| Diagnostics | `textDocument/publishDiagnostics` | implemented | `xtend.rmt.linter.rule-engine.v1` | `rmt-linter-rules` |
| Completion | `textDocument/completion` | implemented | `xtend.rmt.completion-provider.v1` | `rmt-completions` |
| Hover | `textDocument/hover` | implemented | `xtend.rmt.hover-provider.v1` | `rmt-navigation` |
| Document Symbols | `textDocument/documentSymbol` | implemented | `xtend.rmt.document-symbols-provider.v1` | `rmt-navigation` |
| Definition | `textDocument/definition` | implemented | `xtend.rmt.definition-provider.v1` | `rmt-navigation` |
| Code Actions | `textDocument/codeAction` | implemented | `xtend.rmt.code-action-provider.v1` | `rmt-code-actions` |
| Agent Repair Report | `xt rmt lint --agent` | implemented | `xtend.rmt.ai-agent-repair-report.v1` | `rmt-agent-report` |
| Snippets | Editor Packaging | implemented | `xtend.rmt.snippet-catalog.v1` | `rmt-editor-packaging` |
| Workspace Symbols | `workspace/symbol` | planned | Project Index follow-up | future |
| Rename | `textDocument/rename` | planned | Safe Refactor follow-up | future |
| References | `textDocument/references` | planned | Project Index follow-up | future |
| Semantic Tokens | `textDocument/semanticTokens` | planned | Syntax Highlighting follow-up | future |
| Formatting | `textDocument/formatting` | planned | Formatter follow-up | future |

## Known Limitations

- The current authoring MVP is still JSON-based. A friendlier DSL syntax is
  follow-up work.
- `textDocument/formatting` is planned but not productively released.
- `workspace/symbol`, `textDocument/rename`, and `textDocument/references`
  need a project-wide index and intentionally remain outside the MVP.
- Marketplace packaging for individual editors is not part of Epic 14. The
  generic LSP setup remains the current integration path.
- The Language Server does not execute XTend components, start XRouter, or
  materialize DOM.
- `.rmt.json` remains readable, but is treated as a fallback and should not be
  the normal path in new projects.

## Snippets

The editor-agnostic snippet catalog lives in:

```text
tools/rmt-language/snippets/index.js
```

The VS Code-compatible export format lives in:

```text
tools/rmt-language/snippets/rmt.code-snippets
```

All snippets create native `.rmt` authoring structures. `.rmt.json` remains
only a parser/linter fallback and should not be used in new snippets.

Important prefixes:

| Prefix | Purpose |
|--------|---------|
| `rmt-app` | minimal native app shell |
| `rmt-component` | XTend component record |
| `rmt-route` | XRouter route record |
| `rmt-schedule` | schedule policy |
| `rmt-template-dom` | safe `dom_descriptor` template |
| `rmt-template-html` | `html_fragment` with Trusted DOM boundary |

## VS Code

The VS Code integration lives in:

```text
tools/rmt-editor/vscode
```

It registers:

- Language ID `rmt`
- File extension `.rmt`
- RMT vNext-aware TextMate grammar with a legacy JSON fallback
- RMT snippets
- `vscode-languageclient` for the local RMT Language Server
- `$xtend-rmt-lint` problem matcher
- XTend CLI tasks and Debug Console launch configurations
- Command `XTendRMT: Show Language Server Command`
- Command `XTendRMT: Start/Restart Language Server`
- Command `XTendRMT: Run Active RMT Lint`
- Command `XTendRMT: Run Workspace RMT Lint`
- Command `XTendRMT: Run RMT Build Check`
- Command `XTendRMT: Run Scaffold Verify`
- Command `XTendRMT: Debug Language Server`
- Command `XTendRMT: Debug Active RMT Lint`
- Command `XTendRMT: Debug Active RMT Build`
- Command `XTendRMT: Open VS Code Tasks Template`
- Command `XTendRMT: Open VS Code Launch Template`
- Command `XTendRMT: Show vNext Primitive Apply Experience`
- Command `XTendRMT: Show vNext Primitive Code Action Preview`
- Command `XTendRMT: Show vNext Primitive Command Handoff`

The packaged LanguageClient starts the server through stdio:

```json
{
  "command": "node",
  "args": ["tools/rmt-language-server/server.js"]
}
```

Terminal tasks use the XTend CLI as their orchestrator and do not maintain a
second RMT semantics layer. The versioned template lives at:

```text
tools/rmt-editor/vscode/templates/tasks.json
```

The problem matcher consumes the stable linter output:

```bash
xt rmt lint app.rmt --format problem-matcher --fail-on warning
```

The Debug Console launch template lives at:

```text
tools/rmt-editor/vscode/templates/launch.json
```

It contains debug starts for the Language Server, active RMT lint, active RMT
build and scaffold verify. This is tool debugging for authoring workflows; a
custom debug adapter for runtime RMT UI breakpoints remains outside this slice.

The vNext primitive commands read CodeAction reports or individual actions from
the RMT vNext tooling layer and show the three apply paths separately in the
Output Channel:

- safe individual quick fixes;
- `source.fixAll.rmt.vnext.primitives` for all safe WorkspaceEdits;
- manual `xtend.rmt.vnext.extractKernelImport` handoffs for Kernel/Fabric
  boundary violations without an automatic WorkspaceEdit.

## JetBrains

JetBrains IDEs can be connected through a generic LSP client or a local file
watcher/external tool setup.

Recommended values:

- Language ID: `rmt`
- Extension: `.rmt`
- Command: `node`
- Args: `tools/rmt-language-server/server.js`

## Neovim

Minimal `nvim-lspconfig`-compatible starting point:

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

Example for `languages.toml`:

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

Editor packaging must not execute XTend components, start XRouter, or create
DOM side effects. It only starts the LSP and provides static snippets.

## Related Guides

- [RMT Linter and AI-Agent Repair Report](./rmt-linter.md)
- [XTendRMT Native Authoring Guide](./xtendrmt-native-authoring.md)
- [Quick Start Guide](./quick-start-guide.md)
- [Epic 14 Completion and LSP Handoff](../development/XTendRMT-Epic14-Abschluss-und-LSP-Handoff.md)
