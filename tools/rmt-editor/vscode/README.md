# XTend RMT Classic and RMTX VS Code DX

- Schema: `xtend.rmt.editor.vscode-bridge.v1`
- DX Schema: `xtend.rmt.editor.vscode-dx.v2`
- Tasks Schema: `xtend.rmt.editor.vscode-tasks.v1`
- Launch Schema: `xtend.rmt.editor.vscode-launch.v1`
- Workpackage: `WP-E14-12`
- Language IDs: `rmt` (Classic), `rmtx` (declarative TSX syntax)
- File extensions: `.rmt` (Classic), `.rmtx` (RMTX)

Version **0.3.0** contributes the native `.rmt` and `.rmtx` language IDs, semantic RMTX project tooling, Classic-aware TextMate grammar, snippets, a real `vscode-languageclient` wrapper, XTend CLI tasks, a VS Code problem matcher, Debug Console launch templates, and the bundled XTend MCP 0.2 server.

For **RMT Classic**, the RMT Language Server remains the only source of truth for diagnostics, completion, hover, symbols, definitions and code actions. The extension does not implement RMT analysis and does not import XTend UI runtime modules.

## RMTX support

RMTX uses `.rmtx` with TSX grammar and qualified operators such as `<RMT.Surface id="root" />` or `<RMT.Surface id="root">…</RMT.Surface>`. A self-closing tag does not also have a closing tag. Operator names and properties remain the responsibility of the RMTX semantic frontend.

The `rmtx` language reuses VS Code’s built-in TypeScriptReact TextMate grammar (`source.tsx`) for TypeScript expressions, JSX attributes, strings, comments and nested tags. A scoped injection highlights `RMT.<Operator>` names. The built-in `vscode.typescript` extension is an explicit dependency. RMTX has its own comment/bracket configuration and three syntax snippets: `rmtx-operator`, `rmtx-paired`, `rmtx-expression`. Classic retains its existing grammar and snippets.

The shared LanguageClient selects `rmt` and `rmtx`. The server dispatches RMTX to its project compiler and an in-memory TypeScript adapter. Compiler and type diagnostics, completion, hover, definitions, references and rename use original source locations, including imported Classic state definitions. Incomplete JSX can retain import discovery for completion; compilation still requires valid source. Ordinary `.tsx` provider files retain their TypeScript language service.

Model types come from declared State types and literal initial shapes. Selector rows, nested repeated items and each Action's declared inputs retain their own contexts. Empty or undeclared object and array shapes remain unknown. This does not add TypeScript imports, arbitrary source execution or application business types to the closed RMTX source grammar. Native component properties use the catalog types; provider properties use captured interface metadata. Rename covers mapped model fields and declared RMT references, with edits on real `.rmtx`/`.rmt` files.

`xtendRmt.rmtx.syntaxVersion` explicitly selects the project source profile (default `8.0.0`); the standalone parser retains its Source1 default. Provider metadata uses the shared project option `rmtxProvidersFile`, exposed as `xtendRmt.rmtxProvidersFile`, or the optional workspace-root `rmtx.providers.json`. Providers are not executed to discover types. Restart the server after changing these settings. File watchers invalidate project inputs and metadata; unsaved RMT/RMTX buffers overlay disk contents.

Classic primitive code actions, lint and debugger workflows keep their existing guards. RMTX build commands use the project CLI: `xt rmt check file.rmtx --project --source-syntax rmtx --rmtx-syntax-version 8.0.0 --json` and `xt maraca build file.rmtx --project --source-syntax rmtx --rmtx-syntax-version 8.0.0 --out dist --json`. The product remains in release preparation; this editor integration does not establish SSR or release readiness.

Run the standalone TextMate probe with the installed VS Code runtime (or provide ordinary `vscode-textmate`/`vscode-oniguruma` test dependencies):

```sh
ELECTRON_RUN_AS_NODE=1 /usr/share/code/code tools/rmt-editor/vscode/test-highlighting.js
node --test tests/rmt-language/rmtx-editor.test.cjs
```

The highlighting probe checks real token scopes for qualified operators, paired and self-closing tags, JSX expression attributes, nested objects, strings, comments and ordinary TSX. It fails if the TSX grammar or tokenizer dependencies are missing.

## VSIX Packaging

The packaged VSIX includes a local copy of `snippets/rmt.code-snippets` because VS Code extension contributions must resolve inside the installed extension directory. The canonical snippet source remains `tools/rmt-language/snippets/rmt.code-snippets`.

Build locally with:

```bash
npm run build:rmt-editor:vscode
```

The local builder uses the already vendored LanguageClient dependency tree from the previous VSIX and stages the installed TypeScript compiler and the compiler's required local files. Missing dependencies fail the build. The generated package does not require the author's `NODE_PATH`. The builder does not download packages from the registry.

The VSIX build also stages exactly the publishable `@ccslabs/xtend-mcp` files plus its installed production dependency closure. It verifies the MCP package version, knowledge-manifest version, and documentation artifact hash before creating the VSIX.

## XTend MCP

The extension registers its bundled stdio server through the stable MCP Server Definition Provider API. It uses VS Code's Node runtime by default; `xtend.mcp.nodePath` can select another Node.js 24-or-newer executable.

Settings:

- `xtend.mcp.enabled` (default `true`)
- `xtend.mcp.nodePath`
- `xtend.mcp.allowWorkspaceWrites` (default `false`)

Workspace writes remain unavailable unless the last setting is enabled. Even then, VS Code's normal confirmation for the destructive tool remains in effect. The Language Server and MCP server are separate processes and share the compiler and analysis packages rather than each other’s process state.

## Language Server

The packaged extension starts the Language Server through `vscode-languageclient` using VS Code's Node runtime (`process.execPath` with `ELECTRON_RUN_AS_NODE=1`). This avoids depending on a system `node` of a different version. Trusted custom server invocations can override the command and arguments. The equivalent standalone invocation is:

```json
{
  "command": "node",
  "args": ["tools/rmt-language-server/server.js"]
}
```

Useful commands:

- `XTendRMT: Start/Restart Language Server`
- `XTendRMT: Show Language Server Command`
- `XTendRMT: Show Classic Primitive Apply Experience`

## Tasks and Problem Matcher

The extension contributes the `$xtend-rmt-lint` problem matcher. It consumes the non-breaking linter format:

```bash
xt rmt lint app.rmt --format problem-matcher --fail-on warning
```

Open `templates/tasks.json` through `XTendRMT: Open VS Code Tasks Template` to copy the supported local tasks into a workspace when a checked-in `.vscode/tasks.json` is desired.

Default task coverage:

- active-file and workspace RMT lint
- AI-agent repair report
- RMT build check and explicit RMT build write
- Scaffold verify and scaffold dry-run
- RMT Classic primitive report gate
- Native-First RMT Owned release report gate
- Maraca report gate

## XTend CLI Terminal Commands

The extension resolves the XTend CLI from the active workspace before it starts tasks, terminal commands or debug sessions. Resolution order:

1. `${workspaceFolder}/xtend-builder/scaffold.js`
2. `${workspaceFolder}/node_modules/.bin/xt`
3. `${workspaceFolder}/node_modules/@ccslabs/xtend-cli/scaffold.js`
4. explicit `xtendRmt.xtendCli.path`
5. advanced `xtendRmt.xtendCli.command` / `xtendRmt.xtendCli.args`

The commands below run through VS Code Tasks or the integrated terminal, so output, exit codes and problem markers stay inside VS Code:

- `XTendRMT: Run Active RMT Lint`
- `XTendRMT: Run Workspace RMT Lint`
- `XTendRMT: Run RMT Build Check`
- `XTendRMT: Run Scaffold Verify`
- `XTendRMT: Open XTend CLI Terminal`
- `XTendRMT: Run XTend CLI Command...`
- `XTendRMT: Run Agent Repair Report`
- `XTendRMT: Run RMT Build Write`

Settings:

- `xtendRmt.xtendCli.path`
- `xtendRmt.xtendCli.command`
- `xtendRmt.xtendCli.args`
- `xtendRmt.tasks.defaultFailOn`
- `xtendRmt.rmtBuild.defaultMode`

## Debug Console

Open `templates/launch.json` through `XTendRMT: Open VS Code Launch Template`.

Debug entries use Node's built-in debugger and `internalConsole`:

- `XTendRMT: Debug Language Server`
- `XTendRMT: Debug Active RMT Lint`
- `XTendRMT: Debug Active RMT Build`
- `XTendRMT: Debug Scaffold Verify`

This is tool-debug support for XTend/RMT authoring. It intentionally does not add a custom debug adapter for running RMT UI runtime breakpoints.
