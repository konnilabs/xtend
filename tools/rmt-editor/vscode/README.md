# XTendRMT VS Code DX

- Schema: `xtend.rmt.editor.vscode-bridge.v1`
- DX Schema: `xtend.rmt.editor.vscode-dx.v1`
- Tasks Schema: `xtend.rmt.editor.vscode-tasks.v1`
- Launch Schema: `xtend.rmt.editor.vscode-launch.v1`
- Workpackage: `WP-E14-12`
- Language ID: `rmt`
- Primary extension: `.rmt`

This extension contributes the native `.rmt` language id, RMT vNext-aware TextMate grammar, snippets, a real `vscode-languageclient` wrapper, XTend CLI tasks, a VS Code problem matcher and Debug Console launch templates.

The RMT Language Server remains the only source of truth for diagnostics, completion, hover, symbols, definitions and code actions. The extension does not implement RMT analysis and does not import XTend UI runtime modules.

## VSIX Packaging

The packaged VSIX includes a local copy of `snippets/rmt.code-snippets` because VS Code extension contributions must resolve inside the installed extension directory. The canonical snippet source remains `tools/rmt-language/snippets/rmt.code-snippets`.

Build locally with:

```bash
npx --yes @vscode/vsce package --allow-missing-repository --out xtend-rmt-language-0.1.0-rc.1.vsix
```

## Language Server

The packaged extension starts the Language Server through `vscode-languageclient`:

```json
{
  "command": "node",
  "args": ["tools/rmt-language-server/server.js"]
}
```

Useful commands:

- `XTendRMT: Start/Restart Language Server`
- `XTendRMT: Show Language Server Command`
- `XTendRMT: Show vNext Primitive Apply Experience`

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
- vNext primitive report gate

## XTend CLI Terminal Commands

The commands below run through VS Code Tasks, so output, exit codes and problem markers stay in the integrated terminal:

- `XTendRMT: Run Active RMT Lint`
- `XTendRMT: Run Workspace RMT Lint`
- `XTendRMT: Run RMT Build Check`
- `XTendRMT: Run Scaffold Verify`

Settings:

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
