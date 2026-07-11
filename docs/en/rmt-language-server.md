# RMT Language Server

Editor integration for completion, hover, definition and code actions.

## What it covers

The RMT language server provides diagnostics, navigation, completion, and code actions from the same source model as the CLI and compiler. Editor feedback is therefore an early view of the same errors, not a separate grammar.

## Public building blocks

- `tools/rmt-language-server/server.js` processes documents and requests.
- `tools/rmt-language-server/protocol.js` defines public message shapes.
- `tools/rmt-language/diagnostics.js` supplies normalized RMT diagnostics.

- `node tools/rmt-language-server/server.js`.
- Completion, hover, definition and Code Actions.
- Snippets for app, component and route structures.
## Editor setup

```bash
node tools/rmt-language-server/server.js
```

The server supports VS Code, JetBrains, Neovim and Helix through stdio. Snippets such as `rmt-app`, `rmt-component`, `rmt-route` and `rmt-template-dom` speed up new files. The relevant schemas are `xtend.rmt.language-server.v1`, `xtend.rmt.editor-packaging.v1` and `xtend.rmt.snippet-catalog.v1`.

VS Code also contributes `XTendRMT: Show vNext Primitive Apply Experience` and `XTendRMT: Run Active RMT Lint`. Problem-matcher workflows use `xt rmt lint app.rmt --format problem-matcher --fail-on warning`; debug configurations are available as a template at `tools/rmt-editor/vscode/templates/launch.json`.

## Orchestration DX

The language server adds completion, hover and document symbols for `validation`, `animation` and `transition`. That works for native `.rmt` files and for JSON/Core-like documents with `validations`, `animations` and `transitions`. Effects such as `fade`, `crossfade`, `slide-left`, `slide-right`, `slide-up`, `slide-down`, `scale`, `pop`, `zoom`, `flip`, `fade-blur`, `shared-element`, `layout-flip` and `none`, plus validation rules such as `required`, `email`, `minLength`, `maxLength` and `pattern`, are explained in the editor.

The complete keyword and operator contexts live in the [RMT Reference](./rmt-reference.md).

New snippets:

- `rmt-vnext-validation`
- `rmt-vnext-animation`
- `rmt-vnext-transition`
- `rmt-vnext-maraca-orchestration-app`

```bash
node scripts/run_xtend_tests.js rmt-completions rmt-navigation rmt-vnext-tooling rmt-editor-packaging --json
```

## Recommended workflow

Open an `.rmt` file through the editor integration, resolve parser errors before semantic diagnostics, and confirm critical changes with the CLI gate. Restarting the editor must not produce a different diagnostic set.

## Next steps

- [XTendRMT overview](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Reference](./rmt-reference.md)
- [RMT Linter](./rmt-linter.md)
