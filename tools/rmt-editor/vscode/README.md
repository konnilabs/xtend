# XTendRMT VS Code Bridge Stub

- Schema: `xtend.rmt.editor.vscode-bridge.v1`
- Workpackage: `WP-E14-12`
- Language ID: `rmt`
- Primary extension: `.rmt`

This folder is intentionally a thin bridge. It contributes the native `.rmt` language id, grammar, snippets and a command that prints the Language Server command.

The RMT Language Server remains the only source of truth for diagnostics, completion, hover, symbols, definitions and code actions. This stub does not implement RMT analysis and does not import XTend UI runtime modules.

## VSIX Packaging

The packaged VSIX includes a local copy of `snippets/rmt.code-snippets` because VS Code extension contributions must resolve inside the installed extension directory. The canonical snippet source remains `tools/rmt-language/snippets/rmt.code-snippets`.

Build locally with:

```bash
npx --yes @vscode/vsce package --allow-missing-repository --out xtend-rmt-language-0.0.0-enterprise-readiness.vsix
```

## Language Server

Use a generic VS Code LSP client with:

```json
{
  "command": "node",
  "args": ["tools/rmt-language-server/server.js"]
}
```

The packaged LanguageClient wrapper can be added later without changing the RMT language layer.
